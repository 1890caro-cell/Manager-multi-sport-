import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { env } from '../config/env.config.js';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;

  constructor() {
    if (env.REDIS_URL) {
      this.client = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });
    } else {
      this.client = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        tls: env.REDIS_TLS ? {} : undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });
    }

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    // Kết nối không chặn khởi động
    this.client.connect().catch((err) => {
      this.logger.warn(`Could not connect to Redis immediately: ${err.message}`);
    });
  }

  /**
   * Khóa phân tán đơn giản (Distributed Lock) với Redis SET NX EX
   */
  async acquireLock(key: string, ttlSeconds = 300): Promise<boolean> {
    const result = await this.client.set(key, 'LOCKED', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /**
   * Giải phóng khóa
   */
  async releaseLock(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Kiểm tra trạng thái Redis
   */
  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
