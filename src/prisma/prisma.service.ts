import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Prisma on Vercel (serverless)
//
// Each warm function instance keeps ONE PrismaClient for its whole life,
// stored on globalThis so it survives hot reloads (nest --watch) and a second
// Nest bootstrap in the same instance. Each client gets a small, explicit pool
// (connection_limit) so many concurrent instances can't exhaust the database;
// the Prisma Postgres pooler (pooled.db.prisma.io) fans them in.
//
// Tunable via env without code changes:
//   PRISMA_CONNECTION_LIMIT  default 5   connections per function instance
//   PRISMA_POOL_TIMEOUT      default 20  seconds to wait for a free connection
//   PRISMA_CONNECT_TIMEOUT   default 15  seconds to open a new connection
// Values already present in DATABASE_URL always win.
// ---------------------------------------------------------------------------

const DEFAULTS = {
  connection_limit: process.env.PRISMA_CONNECTION_LIMIT || '5',
  pool_timeout: process.env.PRISMA_POOL_TIMEOUT || '20',
  connect_timeout: process.env.PRISMA_CONNECT_TIMEOUT || '15',
};

const logger = new Logger('PrismaService');

// Adds pool settings to the connection string unless it already sets them.
export function buildDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw; // leave unparseable strings to Prisma's own error message
  }

  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }

  if (process.env.VERCEL && url.hostname === 'db.prisma.io') {
    logger.warn(
      'DATABASE_URL uses the direct host db.prisma.io. Use pooled.db.prisma.io for the app on Vercel; keep the direct host for DIRECT_URL only.',
    );
  }

  return url.toString();
}

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: { db: { url: buildDatabaseUrl(process.env.DATABASE_URL) } },
    });
    // No eager $connect(): Prisma connects on the first query, which keeps
    // cold starts fast and means a slow database can't crash app bootstrap.
  }
}

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaService };

// The one place a client is created. PrismaModule provides this instance.
export function getPrismaService(): PrismaService {
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = new PrismaService();
  }
  return globalForPrisma.__prisma;
}
