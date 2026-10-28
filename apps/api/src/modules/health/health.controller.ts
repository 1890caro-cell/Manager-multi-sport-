import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { DatabaseTransactionService } from '../../database/database-transaction.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { Public } from '../auth/index.js';
import { HealthResponse, ReadinessResponse } from '@sports/contracts';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dbTxService: DatabaseTransactionService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Public()
  @Get('ready')
  async getReadiness(@Res() res: Response): Promise<void> {
    const isDbConnected = this.dbTxService.getConnection().readyState === 1;
    const isRedisConnected = await this.redisService.isHealthy();

    const isReady = isDbConnected && isRedisConnected;

    const responseData: ReadinessResponse = {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      services: {
        database: isDbConnected,
        redis: isRedisConnected,
      },
    };

    const httpStatus = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(httpStatus).json(responseData);
  }
}
