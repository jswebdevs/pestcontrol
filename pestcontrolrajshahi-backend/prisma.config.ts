// Prisma 7 moved connection URLs out of `schema.prisma`. The CLI (migrate, db push,
// seed, studio) reads them from here. At runtime, `PrismaService` constructs its
// own driver adapter — see `src/prisma/prisma.service.ts`.
//
// We point the CLI at DIRECT_URL (non-pooled) for migrations and DDL, which
// avoids the pgbouncer-style limitations of Neon's pooled connection.
import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
