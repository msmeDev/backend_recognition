import { Module, Global } from '@nestjs/common';
import { PrismaService, getPrismaService } from './prisma.service';

// @Global() makes PrismaService available throughout the app without
// importing PrismaModule into every feature module.
// useFactory hands Nest the globalThis singleton instead of letting it `new`
// a fresh client, so there is only ever one PrismaClient per process.
@Global()
@Module({
  providers: [{ provide: PrismaService, useFactory: getPrismaService }],
  exports: [PrismaService],
})
export class PrismaModule {}
