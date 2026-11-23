import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { VoteService } from './vote.service';

// Routes: POST /api/vote | GET /api/vote/check/:voterId | GET /api/vote/tally
@Controller('vote')
export class VoteController {
  constructor(private readonly service: VoteService) {}

  @Post()
  vote(@Body() body: Record<string, unknown>) {
    return this.service.vote(body);
  }

  @Get('check/:voterId')
  check(@Param('voterId') voterId: string) {
    const id = Number(voterId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpException('voterId must be a positive integer', HttpStatus.BAD_REQUEST);
    }
    return this.service.checkVoter(id);
  }

  @Get('tally')
  tally() {
    return this.service.getTally();
  }
}
