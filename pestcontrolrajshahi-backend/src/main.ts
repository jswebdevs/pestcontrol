import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  // Plugins
  const helmet = (await import('@fastify/helmet')).default;
  const cookie = (await import('@fastify/cookie')).default;
  await app.register(helmet as any, {
    contentSecurityPolicy: false,
    global: true,
  });
  await app.register(cookie as any, { secret: process.env.COOKIE_SECRET });

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
    // Fastify's CORS plugin only allows GET/HEAD/POST by default. Without
    // PATCH/PUT/DELETE listed here, the browser's CORS preflight blocks every
    // admin write — and the failed request reads as "Status: null / CORS
    // request did not succeed" in the browser console. Curl/server-to-server
    // is unaffected because it doesn't preflight.
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const cfg = new DocumentBuilder()
    .setTitle(process.env.APP_NAME ?? 'API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, cfg));

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 ${process.env.APP_NAME} running on http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`📘 Swagger at http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed', err);
  process.exit(1);
});
