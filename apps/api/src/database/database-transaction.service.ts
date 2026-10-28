import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class DatabaseTransactionService {
  private readonly logger = new Logger(DatabaseTransactionService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Thực thi một khối logic trong MongoDB Transaction phiên bản Replica Set.
   * Sử dụng session.withTransaction() để tự động retry khi gặp lỗi tạm thời (TransientTransactionError).
   */
  async runTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result!;
    } catch (error) {
      this.logger.warn(`Transaction failed and was aborted: ${(error as Error).message}`);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Lấy kết nối Mongo hiện tại để kiểm tra readiness
   */
  getConnection(): Connection {
    return this.connection;
  }
}
