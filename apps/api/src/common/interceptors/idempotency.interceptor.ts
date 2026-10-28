import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RedisService } from '../../redis/redis.service.js';
import { REQUIRE_IDEMPOTENCY_KEY } from '../decorators/require-idempotency.decorator.js';
import { DomainError } from '../errors/domain-error.js';
import { env } from '../../config/env.config.js';

interface StoredIdempotencyRecord {
  status: 'PROCESSING' | 'COMPLETED';
  statusCode?: number;
  body?: unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const isRequired = this.reflector.getAllAndOverride<boolean>(REQUIRE_IDEMPOTENCY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const idempotencyKey = (request.headers['idempotency-key'] ||
      request.headers['Idempotency-Key']) as string | undefined;

    if (isRequired && !idempotencyKey) {
      throw new DomainError(
        'IDEMPOTENCY_KEY_REQUIRED',
        'Header Idempotency-Key là bắt buộc cho yêu cầu này.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!idempotencyKey) {
      return next.handle();
    }

    const redisKey = `idempotency:${idempotencyKey}`;

    // 1. Kiểm tra trong Redis
    try {
      const existing = await this.redisService.client.get(redisKey);
      if (existing) {
        const record = JSON.parse(existing) as StoredIdempotencyRecord;
        if (record.status === 'PROCESSING') {
          throw new DomainError(
            'IDEMPOTENCY_IN_PROGRESS',
            'Yêu cầu trước đó đang được xử lý, vui lòng không gửi trùng lặp.',
            HttpStatus.CONFLICT,
          );
        }
        if (record.status === 'COMPLETED') {
          this.logger.debug(`Returning cached idempotency response for key: ${idempotencyKey}`);
          response.status(record.statusCode || HttpStatus.OK);
          return of(record.body);
        }
      }

      // Đánh dấu PROCESSING với TTL tạm thời 60 giây
      const acquired = await this.redisService.client.set(
        redisKey,
        JSON.stringify({ status: 'PROCESSING' }),
        'EX',
        60,
        'NX',
      );

      if (!acquired) {
        throw new DomainError(
          'IDEMPOTENCY_IN_PROGRESS',
          'Yêu cầu đồng thời đang được xử lý, vui lòng không gửi trùng lặp.',
          HttpStatus.CONFLICT,
        );
      }
    } catch (err) {
      if (err instanceof DomainError) throw err;
      this.logger.warn(`Redis error in IdempotencyInterceptor: ${(err as Error).message}`);
      // Nếu Redis lỗi tạm thời, vẫn cho request đi tiếp để không chặn hệ thống
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (body) => {
          try {
            const completedRecord: StoredIdempotencyRecord = {
              status: 'COMPLETED',
              statusCode: response.statusCode,
              body,
            };
            await this.redisService.client.set(
              redisKey,
              JSON.stringify(completedRecord),
              'EX',
              env.IDEMPOTENCY_TTL_SECONDS,
            );
          } catch (err) {
            this.logger.error(`Failed to cache completed idempotency response: ${(err as Error).message}`);
          }
        },
        error: async () => {
          // Khi request thất bại, xóa trạng thái PROCESSING để cho phép retry
          try {
            await this.redisService.client.del(redisKey);
          } catch (err) {
            this.logger.error(`Failed to clear idempotency key on error: ${(err as Error).message}`);
          }
        },
      }),
    );
  }
}
