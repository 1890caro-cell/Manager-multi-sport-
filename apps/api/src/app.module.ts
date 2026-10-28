import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppLoggerModule } from './common/logger/pino-logger.module.js';
import { DatabaseModule } from './database/database.module.js';
import { RedisModule } from './redis/redis.module.js';
import { OutboxModule } from './modules/outbox/index.js';
import { HealthModule } from './modules/health/index.js';
import { AuthModule } from './modules/auth/index.js';
import { FacilityModule } from './modules/facility/index.js';
import { BookingModule } from './modules/booking/index.js';
import { WalletModule } from './modules/wallet/index.js';
import { PaymentModule } from './modules/payment/index.js';
import { InvoiceModule } from './modules/invoice/index.js';
import { NotificationModule } from './modules/notification/index.js';
import { GymModule } from './modules/gym/index.js';
import { CanteenModule } from './modules/canteen/index.js';
import { RentalModule } from './modules/rental/index.js';
import { GamingModule } from './modules/gaming/index.js';
import { PromotionModule } from './modules/promotion/index.js';
import { PtClassModule } from './modules/pt-class/index.js';
import { TournamentModule } from './modules/tournament/index.js';
import { AnalyticsModule } from './modules/analytics/index.js';
import { BridgeModule } from './modules/bridge/index.js';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor.js';

@Module({
  imports: [
    AppLoggerModule,
    DatabaseModule,
    RedisModule,
    OutboxModule,
    HealthModule,
    AuthModule,
    FacilityModule,
    BookingModule,
    WalletModule,
    PaymentModule,
    InvoiceModule,
    NotificationModule,
    GymModule,
    CanteenModule,
    RentalModule,
    GamingModule,
    PromotionModule,
    PtClassModule,
    TournamentModule,
    AnalyticsModule,
    BridgeModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
