import { z } from 'zod';
import { publicStoreSchema } from './stores.js';

export const publicProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  /** Integer VND. For a price range this is the lowest price; 0 for market price. */
  price: z.number().int().nonnegative(),
  /** Upper bound when the price depends on size/weight, e.g. 150K–200K. */
  priceMax: z.number().int().positive().optional(),
  /** "Thời giá": price is quoted by the store when it calls back. */
  isMarketPrice: z.boolean(),
  image: z.string().optional(),
  description: z.string().optional(),
  isFeatured: z.boolean(),
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
