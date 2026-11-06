import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

function getAllowedOrigins(): (string | RegExp)[] {
  const origins: (string | RegExp)[] = [
    'http://localhost:3001',
    'http://localhost:3000',
    /^https:\/\/.*\.vercel\.app$/,
  ];
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  return origins;
}

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  return app;
}

// ── Local development ────────────────────────────────────────────────────────
// VERCEL is injected automatically by the platform; absent means local dev.
if (!process.env.VERCEL) {
  createApp().then(async (app) => {
    const port = parseInt(process.env.PORT || '3000', 10);
    await app.listen(port, '0.0.0.0');
    console.log(`MSME Recognition API running on http://0.0.0.0:${port}`);
  });
}

// ── Vercel serverless handler ────────────────────────────────────────────────
// Cached across warm invocations to avoid re-bootstrapping on every request.
let cachedHttpHandler: ((req: any, res: any) => void) | null = null;

export default async function handler(req: any, res: any) {
  if (!cachedHttpHandler) {
    const app = await createApp();
    await app.init();
    cachedHttpHandler = app.getHttpAdapter().getInstance();
  }
  cachedHttpHandler(req, res);
}
