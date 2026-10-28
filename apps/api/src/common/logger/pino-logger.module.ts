import { Module } from '@nestjs/common';
import { LoggerModule as NestLoggerModule } from 'nestjs-pino';
import { env } from '../../config/env.config.js';

@Module({
  imports: [
    NestLoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            'pin',
            'token',
            'otp',
            'refreshToken',
            'biometric',
            'fingerprint',
            'cardNumber',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
  ],
})
export class AppLoggerModule {}
