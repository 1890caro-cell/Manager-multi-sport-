import { Injectable, Logger } from '@nestjs/common';
import { PayOS } from '@payos/node';
import { env } from '../../../config/env.config.js';

export interface PayOsPaymentResult {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
  qrDataUrl: string;
}

@Injectable()
export class PayOsService {
  private readonly logger = new Logger(PayOsService.name);
  private payos: any | null = null;

  constructor() {
    if (env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && env.PAYOS_CHECKSUM_KEY) {
      try {
        this.payos = new PayOS({
          clientId: env.PAYOS_CLIENT_ID,
          apiKey: env.PAYOS_API_KEY,
          checksumKey: env.PAYOS_CHECKSUM_KEY,
        });
        this.logger.log('PayOS service successfully initialized with merchant credentials.');
      } catch (err: any) {
        this.logger.error(`Failed to initialize PayOS: ${err.message}`, err.stack);
      }
    } else {
      this.logger.warn('PayOS credentials missing in environment. PayOS integration will operate in fallback mode.');
    }
  }

  isAvailable(): boolean {
    return this.payos !== null;
  }

  /**
   * Tạo link thanh toán PayOS và mã VietQR
   */
  async createPaymentLink(params: {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl?: string;
    returnUrl?: string;
  }): Promise<PayOsPaymentResult> {
    if (!this.payos) {
      throw new Error('PayOS is not configured.');
    }

    const cancelUrl = params.cancelUrl || 'http://localhost:3001/booking';
    const returnUrl = params.returnUrl || 'http://localhost:3001/booking';

    // Mô tả PayOS tối đa 25 ký tự không dấu hoặc ký tự đặc biệt
    const cleanDescription = params.description
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '')
      .trim()
      .slice(0, 25);

    const res = await this.payos.paymentRequests.create({
      orderCode: params.orderCode,
      amount: params.amount,
      description: cleanDescription,
      cancelUrl,
      returnUrl,
    });

    const encodedDesc = encodeURIComponent(res.description);
    const encodedAccountName = encodeURIComponent(res.accountName);
    const qrDataUrl = `https://img.vietqr.io/image/${res.bin}-${res.accountNumber}-compact2.png?amount=${res.amount}&addInfo=${encodedDesc}&accountName=${encodedAccountName}`;

    return {
      bin: res.bin,
      accountNumber: res.accountNumber,
      accountName: res.accountName,
      amount: res.amount,
      description: res.description,
      orderCode: res.orderCode,
      currency: res.currency || 'VND',
      paymentLinkId: res.paymentLinkId,
      status: res.status,
      checkoutUrl: res.checkoutUrl,
      qrCode: res.qrCode,
      qrDataUrl,
    };
  }

  /**
   * Xác thực chữ ký webhook từ PayOS
   */
  async verifyWebhook(webhookBody: any): Promise<any> {
    if (!this.payos) {
      throw new Error('PayOS is not configured.');
    }
    return await this.payos.webhooks.verify(webhookBody);
  }

  /**
   * Đăng ký URL webhook với PayOS
   */
  async confirmWebhook(webhookUrl: string): Promise<string> {
    if (!this.payos) {
      throw new Error('PayOS is not configured.');
    }
    return await this.payos.webhooks.confirm(webhookUrl);
  }

  /**
   * Tra cứu thông tin trạng thái thanh toán từ PayOS
   */
  async getPaymentLinkInformation(orderCode: number | string): Promise<any> {
    if (!this.payos) {
      throw new Error('PayOS is not configured.');
    }
    return await this.payos.paymentRequests.get(Number(orderCode));
  }

  /**
   * Hủy link thanh toán PayOS
   */
  async cancelPaymentLink(orderCode: number | string, cancellationReason?: string): Promise<any> {
    if (!this.payos) {
      throw new Error('PayOS is not configured.');
    }
    return await this.payos.paymentRequests.cancel(Number(orderCode), cancellationReason);
  }
}

