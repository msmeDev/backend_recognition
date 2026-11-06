import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { NominationsService } from './nominations.service';

// Routes: GET /api/nominations/*
// IMPORTANT: more-specific routes (/tally/:category/top) are declared before
// the generic /:category so NestJS matches them in the right order.
@Controller('nominations')
export class NominationsController {
  constructor(private readonly service: NominationsService) {}

  @Get('check/:nominatorId')
  checkNominator(@Param('nominatorId') nominatorId: string) {
    const id = parseInt(nominatorId, 10);
    if (isNaN(id) || id <= 0) {
      throw new HttpException('nominatorId must be a positive integer', HttpStatus.BAD_REQUEST);
    }
    return this.service.checkNominator(id);
  }

  @Get('tally')
  getTally() {
    return this.service.getTally();
  }

  // GET /api/nominations/tally/:category/top?limit=5
  // Declared before tally/:category so NestJS doesn't swallow "top" as :category
  @Get('tally/:category/top')
  getTopByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit !== undefined ? parseInt(limit, 10) : 5;
    if (isNaN(limitNum) || limitNum < 1) {
      throw new HttpException('limit must be a positive integer', HttpStatus.BAD_REQUEST);
    }
    return this.service.getTallyByCategory(category, limitNum);
  }

  @Get('tally/:category')
  getTallyByCategory(@Param('category') category: string) {
    return this.service.getTallyByCategory(category);
  }
}
