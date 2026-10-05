import { z } from 'zod';

export const slugSchema = z
  .string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case: a-z, 0-9 and dashes');

export const storeSlugParamsSchema = z.object({ slug: slugSchema });
