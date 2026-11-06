import { Controller, Get } from '@nestjs/common';
import { StaffService } from './staff.service';

// Routes: GET /api/staff/male | /api/staff/female | /api/staff/all
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('male')
  getMaleStaff() {
    return this.staffService.getMaleStaff();
  }

  @Get('female')
  getFemaleStaff() {
    return this.staffService.getFemaleStaff();
  }

  @Get('all')
  getAllStaff() {
    return this.staffService.getAllStaff();
  }
}
