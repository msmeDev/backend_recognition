import { Controller, Post, Body } from '@nestjs/common';
import { VerifyService } from './verify.service';

// Route: POST /api/verify
@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Post()
  verify(@Body() body: { name: string }) {
    return this.verifyService.verify(body.name);
  }
}
