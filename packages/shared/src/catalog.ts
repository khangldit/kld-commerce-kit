import { z } from 'zod';
import { publicStoreSchema } from './stores.js';

export const publicProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  image: z.string().optional(),
  description: z.string().optional(),
});

export const publicCategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  products: z.array(publicProductSchema),
});

export const publicCatalogSchema = z.object({
  categories: z.array(publicCategorySchema),
  store: publicStoreSchema.pick({ slug: true, name: true }),
});
export type PublicProduct = z.infer<typeof publicProductSchema>;
export type PublicCategory = z.infer<typeof publicCategorySchema>;
export type PublicCatalog = z.infer<typeof publicCatalogSchema>;
