// Vercel serverless entry — boots the NestJS + Fastify app once and emits requests.
// All /api/* routes hit this single function (see vercel.json rewrites). The
// host root (GET /) also routes here and is served by RootController as a
// friendly landing page that bounces to the public site.
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

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
  // Same exclude as main.ts so RootController can own GET /
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  const fastify = app.getHttpAdapter().getInstance();
  await fastify.ready();
  return fastify;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedFastify) cachedFastify = await bootstrap();
  cachedFastify.server.emit('request', req, res);
}
