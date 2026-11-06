import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerifyService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(
    name: string,
  ): Promise<{ found: boolean; staff?: { id: number; full_name: string } }> {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return { found: false };
    }

    const inputWords = name.toLowerCase().trim().split(/\s+/).sort();

    // Fetch candidates containing at least one input word (case-insensitive).
    const candidates = await this.prisma.staffAll.findMany({
      where: {
        OR: inputWords.map((word) => ({
          fullName: { contains: word, mode: 'insensitive' as const },
        })),
      },
      select: { id: true, fullName: true },
    });

    const match = candidates.find((c) => {
      const dbWords = c.fullName.toLowerCase().trim().split(/\s+/).sort();
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
}
