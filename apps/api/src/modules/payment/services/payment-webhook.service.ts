import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'node:crypto';
import {
  PaymentEvent,
  PaymentEventDocument,
} from '../schemas/payment-event.schema.js';
import { PaymentService } from './payment.service.js';
import { SettingsService } from '../../facility/services/settings.service.js';
import { PayOsService } from './payos.service.js';
import { WebhookPayloadDto } from '@sports/contracts';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    @InjectModel(PaymentEvent.name)
    private readonly paymentEventModel: Model<PaymentEventDocument>,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly settingsService: SettingsService,
    private readonly payOsService: PayOsService,
  ) {}

  /**
   * Tạo chữ ký HMAC-SHA256 (hỗ trợ test & client mock)
   */
  generateSignature(payload: string | Record<string, unknown>, secretKey?: string): string {
    const secret =
      secretKey ||
      this.settingsService.get<string>('payment.webhookSecret', 'sports_default_secret_32_characters!');
    const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
  }

  /**
   * Xác thực chữ ký số HMAC-SHA256 an toàn chống timing attacks
   */
  verifySignature(
    payload: string | Record<string, unknown>,
    signature: string,
    secretKey?: string,
  ): boolean {
    try {
      const secret =
        secretKey ||
        this.settingsService.get<string>('payment.webhookSecret', 'sports_default_secret_32_characters!');
      const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', secret).update(dataString).digest('hex');

      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');

      if (sigBuf.length !== expBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch (err) {
      this.logger.error(`Signature verification failed: ${err}`);
      return false;
    }
  }

  /**
   * Xử lý webhook từ cổng thanh toán với kiểm tra chữ ký và khử trùng lặp
   */
  async processWebhook(dto: WebhookPayloadDto): Promise<{ success: boolean; message: string }> {
    // 1. Kiểm tra chữ ký số
    const payloadToVerify = dto.rawPayload || {
      provider: dto.provider,
      providerTxnId: dto.providerTxnId,
      paymentCode: dto.paymentCode,
      amount: dto.amount,
      timestamp: dto.timestamp,
    };

    const isValidSignature = this.verifySignature(payloadToVerify, dto.signature);
    if (!isValidSignature) {
      this.logger.warn(`Invalid webhook signature from provider: ${dto.provider}, txn: ${dto.providerTxnId}`);
      throw new BadRequestException('Chữ ký số webhook không hợp lệ (INVALID_SIGNATURE)');
    }

    // 2. Khử trùng lặp Idempotency trên (provider, providerTxnId)
    const existingEvent = await this.paymentEventModel
      .findOne({ provider: dto.provider, providerTxnId: dto.providerTxnId })
      .exec();

    if (existingEvent) {
      this.logger.log(
        `Idempotent webhook replay for provider: ${dto.provider}, txn: ${dto.providerTxnId}`,
      );
      return { success: true, message: 'Event already processed' };
    }

    // 3. Ghi nhận raw event vào CSDL trước khi xử lý
    let savedEvent: PaymentEventDocument;
    try {
      const eventDoc = new this.paymentEventModel({
        provider: dto.provider,
        providerTxnId: dto.providerTxnId,
        paymentCode: dto.paymentCode,
        amount: dto.amount,
        signature: dto.signature,
        signatureVerified: true,
        processed: false,
        payload: payloadToVerify,
      });
      savedEvent = await eventDoc.save();
    } catch (err: any) {
      if (err?.code === 11000 || err?.message?.includes('E11000')) {
        this.logger.log(`Concurrent duplicate webhook caught: ${dto.providerTxnId}`);
        return { success: true, message: 'Event already processed' };
      }
      throw err;
    }

    // 4. Xử lý nghiệp vụ thanh toán
    try {
      await this.paymentService.handlePaymentSuccess(
        dto.paymentCode,
        dto.amount,
        dto.providerTxnId,
        dto.rawPayload,
      );

      savedEvent.processed = true;
      await savedEvent.save();

      return { success: true, message: 'Payment webhook processed successfully' };
    } catch (err: any) {
      this.logger.error(`Error processing payment success for ${dto.paymentCode}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Xử lý webhook tự động từ cổng thanh toán PayOS
   */
  async processPayOsWebhook(body: any): Promise<{ success: boolean; message: string }> {
    let webhookData: any;
    try {
      webhookData = await this.payOsService.verifyWebhook(body);
    } catch (err: any) {
      this.logger.warn(`PayOS webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Chữ ký số PayOS không hợp lệ (INVALID_SIGNATURE)');
    }

    if (!webhookData) {
      throw new BadRequestException('Dữ liệu webhook PayOS không hợp lệ');
    }

    const { orderCode, amount, reference, description } = webhookData;
    const providerTxnId = reference || String(orderCode);

    // 1. Kiểm tra khử trùng lặp Idempotency trên (provider, providerTxnId)
    const existingEvent = await this.paymentEventModel
      .findOne({ provider: 'PAYOS', providerTxnId })
      .exec();

    if (existingEvent) {
      this.logger.log(`Idempotent PayOS webhook replay for txn: ${providerTxnId}`);
      return { success: true, message: 'Event already processed' };
    }

    // 2. Tìm payment tương ứng
    const payment = await this.paymentService.findPaymentByCodeOrAmount(
      description || '',
      amount,
    );

    const paymentCode = payment ? payment.paymentCode : `PAYOS-${orderCode}`;

    // 3. Ghi nhận PaymentEvent
    let savedEvent: PaymentEventDocument;
    try {
      const eventDoc = new this.paymentEventModel({
        provider: 'PAYOS',
        providerTxnId,
        paymentCode,
        amount,
        signature: body.signature || 'VERIFIED_BY_PAYOS_SDK',
        signatureVerified: true,
        processed: false,
        payload: webhookData,
      });
      savedEvent = await eventDoc.save();
    } catch (err: any) {
      if (err?.code === 11000 || err?.message?.includes('E11000')) {
        this.logger.log(`Concurrent duplicate PayOS webhook caught: ${providerTxnId}`);
        return { success: true, message: 'Event already processed' };
      }
      throw err;
    }

    // 4. Cập nhật trạng thái thành công nếu tìm thấy payment
    if (payment) {
      try {
        await this.paymentService.handlePaymentSuccess(
          payment.paymentCode,
          amount,
          providerTxnId,
          webhookData,
        );

        savedEvent.processed = true;
        await savedEvent.save();

        this.logger.log(
          `Successfully processed PayOS payment for ${payment.paymentCode}, amount: ${amount}`,
        );
        return { success: true, message: 'PayOS webhook processed successfully' };
      } catch (err: any) {
        this.logger.error(
          `Error processing PayOS payment success for ${payment.paymentCode}: ${err.message}`,
          err.stack,
        );
        throw err;
      }
    } else {
      this.logger.warn(
        `PayOS webhook received but no matching payment found for orderCode: ${orderCode}, desc: ${description}`,
      );
      return { success: true, message: 'Webhook received but payment not found in system' };
    }
  }
}

