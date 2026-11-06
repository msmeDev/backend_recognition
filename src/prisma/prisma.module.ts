import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() makes PrismaService available throughout the app without
// importing PrismaModule into every feature module.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
