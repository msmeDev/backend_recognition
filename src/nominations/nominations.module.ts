import { Module } from '@nestjs/common';
import { NominationsController } from './nominations.controller';
import { NominateController } from './nominate.controller';
import { NominationsService } from './nominations.service';

@Module({
  controllers: [NominationsController, NominateController],
  providers: [NominationsService],
})
export class NominationsModule {}
