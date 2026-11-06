import { Controller, Post, Body } from '@nestjs/common';
import { NominationsService } from './nominations.service';

// Route: POST /api/nominate
@Controller('nominate')
export class NominateController {
  constructor(private readonly service: NominationsService) {}

  @Post()
  nominate(@Body() body: Record<string, unknown>) {
    return this.service.nominate(body);
  }
}
