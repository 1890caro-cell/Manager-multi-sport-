import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { PasswordService } from './password.service.js';
import { Role } from '@sports/shared';

@Injectable()
export class AuthSeedService implements OnModuleInit {
  private readonly logger = new Logger(AuthSeedService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly passwordService: PasswordService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedUsers();
  }

  async seedUsers(): Promise<void> {
    const count = await this.userModel.countDocuments().exec();
    if (count > 0) return;

    this.logger.log('Seeding initial default users (ADMIN, MANAGER, CASHIER, CUSTOMER)...');

    const defaultPassword = await this.passwordService.hashPassword('Sports@123456');

    const defaultUsers: Partial<User>[] = [
      {
        fullName: 'Quản trị viên Hệ thống (Admin)',
        phone: '0988888888',
        email: 'admin@sports.vn',
        passwordHash: defaultPassword,
        role: Role.ADMIN,
        type: 'STAFF',
        status: 'ACTIVE',
        permissions: ['*'],
      },
      {
        fullName: 'Giám đốc Vận hành (Manager)',
        phone: '0977777777',
        email: 'manager@sports.vn',
        passwordHash: defaultPassword,
        role: Role.MANAGER,
        type: 'STAFF',
        status: 'ACTIVE',
        permissions: ['FACILITY_MANAGE', 'BOOKING_MANAGE', 'REPORTS_VIEW'],
      },
      {
        fullName: 'Thu ngân Quầy POS (Cashier)',
        phone: '0966666666',
        email: 'cashier@sports.vn',
        passwordHash: defaultPassword,
        role: Role.CASHIER,
        type: 'STAFF',
        status: 'ACTIVE',
        permissions: ['POS_CHECKOUT', 'RENTAL_DISPATCH'],
      },
      {
        fullName: 'Nguyễn Văn Khách (Hội viên VIP)',
        phone: '0901234567',
        email: 'khachhang@gmail.com',
        passwordHash: defaultPassword,
        role: Role.CUSTOMER,
        type: 'CUSTOMER',
        status: 'ACTIVE',
        permissions: [],
      },
    ];

    await this.userModel.insertMany(defaultUsers);
    this.logger.log(`Successfully seeded ${defaultUsers.length} default accounts with password: Sports@123456`);
  }
}
