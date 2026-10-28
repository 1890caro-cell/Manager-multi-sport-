import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { ProblemDetailsFilter } from './common/errors/problem-details.filter.js';
import { env } from './config/env.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Gắn logger Pino toàn cục
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Gắn ProblemDetailsFilter toàn cục chuẩn hóa RFC 7807
  app.useGlobalFilters(new ProblemDetailsFilter());

  // Bật CORS cho các client (web khách, admin, POS)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  // Thiết lập prefix toàn cục chuẩn REST API v1
  app.setGlobalPrefix('api/v1');

  await app.listen(env.PORT);
  logger.log(`API Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
}

bootstrap();
