import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VerifyService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(
    name: string,
  ): Promise<{ found: boolean; staff?: { id: number; full_name: string } }> {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return { found: false };
    }

    // $queryRaw gives us LOWER(TRIM()) on both sides — identical to the
    // original SQL behaviour and unambiguous about whitespace handling.
    const rows = await this.prisma.$queryRaw<{ id: number; full_name: string }[]>(
      Prisma.sql`
        SELECT id, full_name
        FROM   staff_all
        WHERE  LOWER(TRIM(full_name)) = LOWER(TRIM(${name.trim()}))
        LIMIT  1
      `,
    );

    if (rows.length === 0) {
      return { found: false };
    }

    return {
      found: true,
      staff: { id: rows[0].id, full_name: rows[0].full_name },
    };
  }
}
