// organize-imports-ignore
// `reflect-metadata` must be the first import: ESM evaluates imports in order.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { seedFileSchema } from './seed-file.schema.js';
import { SeedModule } from './seed.module.js';
import { SeedService } from './seed.service.js';

async function main() {
  const storeSlug = process.argv[2];
  if (!storeSlug || !/^[a-z0-9-]+$/.test(storeSlug)) {
    throw new Error('Usage: pnpm seed <store-slug>');
  }

  // pnpm --filter runs scripts with cwd = apps/api
  const filePath = path.resolve(
    process.cwd(),
    '../../seed/stores',
    `${storeSlug}.json`,
  );
  const raw: unknown = JSON.parse(await readFile(filePath, 'utf8'));

  const parsed = seedFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid seed file ${filePath}:\n${z.prettifyError(parsed.error)}`,
    );
  }

  const app = await NestFactory.createApplicationContext(SeedModule);
  try {
    await app.get(SeedService).run(parsed.data);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
