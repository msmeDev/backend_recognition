import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { VerifyService } from './verify.service';

// Routes: POST /api/verify | GET /api/verify/search?q=
@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Post()
  verify(@Body() body: { name: string }) {
    return this.verifyService.verify(body?.name);
  }

  @Get('search')
  search(@Query('q') q?: string) {
    return this.verifyService.search(q);
  }
}
