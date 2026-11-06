import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StaffModule } from './staff/staff.module';
import { VerifyModule } from './verify/verify.module';
import { NominationsModule } from './nominations/nominations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,      // global — PrismaService is available everywhere
    StaffModule,
    VerifyModule,
    NominationsModule,
  ],
})
export class AppModule {}
