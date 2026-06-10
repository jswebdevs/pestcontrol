// Vercel serverless entry — boots the NestJS + Fastify app once and emits requests.
// /api/* + /docs/* + / all hit this single function (see vercel.json rewrites).
// The host root is served as a friendly landing page that bounces to the
// public site after 5 seconds.
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { buildRootLandingHtml } from '../src/common/root-landing';

let cachedFastify: any;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, logger: false }),
    { logger: ['error', 'warn'] },
  );

  const helmet = (await import('@fastify/helmet')).default;
  const cookie = (await import('@fastify/cookie')).default;
  await app.register(helmet as any, { contentSecurityPolicy: false, global: true });
  await app.register(cookie as any, { secret: process.env.COOKIE_SECRET });

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Friendly landing at the host root — registered directly on Fastify so it
  // bypasses the global /api prefix.
  const fastify = app.getHttpAdapter().getInstance();
  fastify.get('/', async (_req, reply) => {
    return reply
      .header('Cache-Control', 'public, max-age=60')
      .type('text/html; charset=utf-8')
      .send(buildRootLandingHtml());
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  await fastify.ready();
  return fastify;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedFastify) cachedFastify = await bootstrap();
  cachedFastify.server.emit('request', req, res);
}
