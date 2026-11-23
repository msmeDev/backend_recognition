import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StaffModule } from './staff/staff.module';
import { VerifyModule } from './verify/verify.module';
import { NominationsModule } from './nominations/nominations.module';
import { VoteModule } from './vote/vote.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,      // global — PrismaService is available everywhere
    StaffModule,
    VerifyModule,
    NominationsModule,
    VoteModule,
  ],
})
export class AppModule {}
