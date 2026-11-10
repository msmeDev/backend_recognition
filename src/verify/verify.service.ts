import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StaffSearchResult {
  id: number;
  fullName: string;
}

const SEARCH_LIMIT = 10;

// Lowercase, trim, split on whitespace, sort — so word order and case don't matter.
function normalizeWords(value: string): string[] {
  return value.toLowerCase().trim().split(/\s+/).filter(Boolean).sort();
}

@Injectable()
export class VerifyService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /api/verify — looks the person up in staff_all_view (all 38 staff).
  async verify(
    name: string,
  ): Promise<{ found: boolean; staff?: { id: number; full_name: string } }> {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return { found: false };
    }

    const inputWords = normalizeWords(name);

    // Fetch candidates containing at least one input word (case-insensitive).
    const candidates = await this.prisma.staffAllView.findMany({
      where: {
        OR: inputWords.map((word) => ({
          fullName: { contains: word, mode: 'insensitive' as const },
        })),
      },
      select: { id: true, fullName: true },
    });

    // Exact match on the sorted word sets, so "Ogunsan Oluwatosin" matches "Oluwatosin Ogunsan".
    const match = candidates.find((c) => {
      const dbWords = normalizeWords(c.fullName);
      return (
        dbWords.length === inputWords.length &&
        inputWords.every((w, i) => w === dbWords[i])
      );
    });

    if (!match) {
      return { found: false };
    }

    return {
      found: true,
      staff: { id: match.id, full_name: match.fullName },
    };
  }

  // GET /api/verify/search?q= — autocomplete suggestions from staff_all_view.
  async search(query: string | undefined): Promise<StaffSearchResult[]> {
    const q = typeof query === 'string' ? query.trim() : '';
    if (!q) {
      return [];
    }

    // Every typed word must appear somewhere in the name (case-insensitive).
    // A single-word query is a plain "contains"; multi-word queries also match
    // out of order, e.g. "ogunsan olu" → "Oluwatosin Ogunsan".
    const words = q.split(/\s+/).filter(Boolean);

    return this.prisma.staffAllView.findMany({
      where: {
        AND: words.map((word) => ({
          fullName: { contains: word, mode: 'insensitive' as const },
        })),
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
      take: SEARCH_LIMIT,
    });
  }
}
