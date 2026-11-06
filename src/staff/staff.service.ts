import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StaffMember {
  id: number;
  full_name: string;
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getMaleStaff(): Promise<StaffMember[]> {
    const rows = await this.prisma.staffMale.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });
    return rows.map(r => ({ id: r.id, full_name: r.fullName }));
  }

  async getFemaleStaff(): Promise<StaffMember[]> {
    const rows = await this.prisma.staffFemale.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });
    return rows.map(r => ({ id: r.id, full_name: r.fullName }));
  }

  async getAllStaff(): Promise<StaffMember[]> {
    const rows = await this.prisma.staffAll.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });
    return rows.map(r => ({ id: r.id, full_name: r.fullName }));
  }
}
