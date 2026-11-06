import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CategoryConfig {
  column: string; // nominations column name in the DB (snake_case)
  table: string;  // staff table name in the DB
}

export interface TallyEntry {
  staff_id: number;
  full_name: string;
  nomination_count: number;
}

// All table/column names come from this hardcoded map, never from user input.
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  best_staff_male:       { column: 'best_staff_male_id',       table: 'staff_male'   },
  best_staff_female:     { column: 'best_staff_female_id',     table: 'staff_female' },
  best_dressed_male:     { column: 'best_dressed_male_id',     table: 'staff_male'   },
  best_dressed_female:   { column: 'best_dressed_female_id',   table: 'staff_female' },
  most_social_staff:     { column: 'most_social_staff_id',     table: 'staff_all'    },
  best_team_player:      { column: 'best_team_player_id',      table: 'staff_all'    },
  most_supportive_staff: { column: 'most_supportive_staff_id', table: 'staff_all'    },
};

export const VALID_CATEGORIES = Object.keys(CATEGORY_CONFIG);

@Injectable()
export class NominationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Check ──────────────────────────────────────────────────────────────────

  async checkNominator(nominatorId: number): Promise<{ hasNominated: boolean }> {
    const existing = await this.prisma.nomination.findUnique({
      where: { nominatorId },
      select: { id: true },
    });
    return { hasNominated: existing !== null };
  }

  // ── Nominate ───────────────────────────────────────────────────────────────

  async nominate(body: Record<string, unknown>): Promise<{ success: boolean }> {
    const requiredFields = [
      'nominator_id',
      'best_staff_male_id',
      'best_staff_female_id',
      'best_dressed_male_id',
      'best_dressed_female_id',
      'most_social_staff_id',
      'best_team_player_id',
      'most_supportive_staff_id',
    ] as const;

    // Validate and coerce all IDs to positive integers
    const ids: Record<string, number> = {};
    for (const field of requiredFields) {
      const val = Number(body[field]);
      if (!Number.isFinite(val) || val <= 0 || !Number.isInteger(val)) {
        throw new HttpException(
          `Invalid or missing field: ${field}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      ids[field] = val;
    }

    // Verify nominator exists
    const nominator = await this.prisma.staffAll.findUnique({
      where: { id: ids.nominator_id },
      select: { id: true },
    });
    if (!nominator) {
      throw new HttpException('Nominator not found in staff list', HttpStatus.BAD_REQUEST);
    }

    // Check for double submission
    const existing = await this.prisma.nomination.findUnique({
      where: { nominatorId: ids.nominator_id },
      select: { id: true },
    });
    if (existing) {
      throw new HttpException(
        'You have already submitted your nominations',
        HttpStatus.CONFLICT,
      );
    }

    // Cross-table duplicate-nominee check using Prisma Client.
    // We look up each nominee's fullName from their respective table.
    // This catches cross-table duplicates (e.g. same person in staff_male
    // and staff_all) by comparing names. Self-nomination is allowed.
    const [n1, n2, n3, n4, n5, n6, n7] = await Promise.all([
      this.prisma.staffMale.findUnique({
        where: { id: ids.best_staff_male_id },
        select: { fullName: true },
      }),
      this.prisma.staffFemale.findUnique({
        where: { id: ids.best_staff_female_id },
        select: { fullName: true },
      }),
      this.prisma.staffMale.findUnique({
        where: { id: ids.best_dressed_male_id },
        select: { fullName: true },
      }),
      this.prisma.staffFemale.findUnique({
        where: { id: ids.best_dressed_female_id },
        select: { fullName: true },
      }),
      this.prisma.staffAll.findUnique({
        where: { id: ids.most_social_staff_id },
        select: { fullName: true },
      }),
      this.prisma.staffAll.findUnique({
        where: { id: ids.best_team_player_id },
        select: { fullName: true },
      }),
      this.prisma.staffAll.findUnique({
        where: { id: ids.most_supportive_staff_id },
        select: { fullName: true },
      }),
    ]);

    const names = [n1, n2, n3, n4, n5, n6, n7].map(r => r?.fullName);
    if (names.some(n => n === undefined)) {
      throw new HttpException(
        'One or more selected nominees were not found in the staff list',
        HttpStatus.BAD_REQUEST,
      );
    }

    const uniqueNames = new Set(names);
    if (uniqueNames.size < names.length) {
      throw new HttpException(
        'The same staff member cannot be nominated in more than one category',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Insert — catch Prisma's unique-constraint error (P2002) as a safety net
    // for the rare race-condition where two requests arrive simultaneously.
    try {
      await this.prisma.nomination.create({
        data: {
          nominatorId:           ids.nominator_id,
          bestStaffMaleId:       ids.best_staff_male_id,
          bestStaffFemaleId:     ids.best_staff_female_id,
          bestDressedMaleId:     ids.best_dressed_male_id,
          bestDressedFemaleId:   ids.best_dressed_female_id,
          mostSocialStaffId:     ids.most_social_staff_id,
          bestTeamPlayerId:      ids.best_team_player_id,
          mostSupportiveStaffId: ids.most_supportive_staff_id,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new HttpException(
          'You have already submitted your nominations',
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }

    return { success: true };
  }

  // ── Tally ──────────────────────────────────────────────────────────────────

  async getTally(): Promise<Record<string, TallyEntry[]>> {
    // Run all 7 category queries in parallel
    const results = await Promise.all(
      VALID_CATEGORIES.map(cat => this.getTallyByCategory(cat)),
    );
    return Object.fromEntries(VALID_CATEGORIES.map((cat, i) => [cat, results[i]]));
  }

  // One $queryRaw per category — single SQL query, no JS aggregation loops.
  // Prisma.raw() is used for identifiers (table/column names from CATEGORY_CONFIG
  // — never from user input, so there is no injection risk).
  async getTallyByCategory(category: string, limit?: number): Promise<TallyEntry[]> {
    const config = CATEGORY_CONFIG[category];
    if (!config) {
      throw new HttpException(
        `Invalid category: "${category}". Valid values: ${VALID_CATEGORIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const limitClause =
      limit !== undefined && limit > 0
        ? Prisma.sql`LIMIT ${limit}`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<TallyEntry[]>(
      Prisma.sql`
        SELECT s.id::int        AS staff_id,
               s.full_name,
               COUNT(*)::int    AS nomination_count
        FROM   nominations n
        JOIN   ${Prisma.raw(config.table)} s
               ON n.${Prisma.raw(config.column)} = s.id
        GROUP  BY s.id, s.full_name
        ORDER  BY nomination_count DESC, s.full_name ASC
        ${limitClause}
      `,
    );

    return rows.map(r => ({
      staff_id:         r.staff_id,
      full_name:        r.full_name,
      nomination_count: r.nomination_count,
    }));
  }
}
