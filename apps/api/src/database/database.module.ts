import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { env } from '../config/env.config.js';
import { DatabaseTransactionService } from './database-transaction.service.js';

@Global()
@Module({
  imports: [
    MongooseModule.forRoot(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
    }),
  ],
  providers: [DatabaseTransactionService],
  exports: [DatabaseTransactionService, MongooseModule],
})
export class DatabaseModule {}
