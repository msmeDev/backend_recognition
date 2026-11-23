import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BallotColumn, VOTE_CATEGORIES } from './vote.shortlist';

export interface VoteTallyEntry {
  staff_id: number;
  full_name: string;
  vote_count: number;
}

const ALREADY_VOTED = 'You have already voted.';

function toPositiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

@Injectable()
export class VoteService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Check ──────────────────────────────────────────────────────────────────

  async checkVoter(voterId: number): Promise<{ hasVoted: boolean }> {
    const existing = await this.prisma.ballot.findUnique({
      where: { voterId },
      select: { id: true },
    });
    return { hasVoted: existing !== null };
  }

  // ── Vote ───────────────────────────────────────────────────────────────────

  async vote(body: Record<string, unknown>): Promise<{ success: boolean }> {
    const voterId = toPositiveInt(body?.voter_id);
    if (voterId === null) {
      throw new HttpException('Invalid or missing field: voter_id', HttpStatus.BAD_REQUEST);
    }

    // Every category needs a pick, and the pick must be on that category's shortlist.
    const picks = {} as Record<BallotColumn, number>;
    for (const category of VOTE_CATEGORIES) {
      const id = toPositiveInt(body?.[category.payloadKey]);
      if (id === null) {
        throw new HttpException(
          `Invalid or missing field: ${category.payloadKey}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!category.nominees.some(n => n.id === id)) {
        throw new HttpException(
          `Selected nominee is not on the shortlist for ${category.key}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      picks[category.column] = id;
    }

    // Any of the staff in staff_all_view may vote.
    const voter = await this.prisma.staffAllView.findUnique({
      where: { id: voterId },
      select: { id: true },
    });
    if (!voter) {
      throw new HttpException('Voter not found in staff list', HttpStatus.BAD_REQUEST);
    }

    if ((await this.checkVoter(voterId)).hasVoted) {
      throw new HttpException(ALREADY_VOTED, HttpStatus.CONFLICT);
    }

    // The UNIQUE constraint on voter_id (P2002) catches two requests that race
    // past the check above.
    try {
      await this.prisma.ballot.create({ data: { voterId, ...picks } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new HttpException(ALREADY_VOTED, HttpStatus.CONFLICT);
      }
      throw err;
    }

    return { success: true };
  }

  // ── Tally ──────────────────────────────────────────────────────────────────

  // Every shortlisted nominee is listed (zero-vote nominees included),
  // highest votes first, ties broken by name.
  async getTally(): Promise<Record<string, VoteTallyEntry[]>> {
    const counts = await Promise.all(
      VOTE_CATEGORIES.map(c =>
        this.prisma.ballot.groupBy({
          by: [c.column],
          _count: { _all: true },
        }),
      ),
    );

    return Object.fromEntries(
      VOTE_CATEGORIES.map((category, i) => {
        const byId = new Map<number, number>();
        for (const row of counts[i] as Array<Record<string, unknown> & { _count: { _all: number } }>) {
          byId.set(row[category.column] as number, row._count._all);
        }
        const entries = category.nominees
          .map(n => ({ staff_id: n.id, full_name: n.fullName, vote_count: byId.get(n.id) ?? 0 }))
          .sort((a, b) => b.vote_count - a.vote_count || a.full_name.localeCompare(b.full_name));
        return [category.key, entries];
      }),
    );
  }
}
