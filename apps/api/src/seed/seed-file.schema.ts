import { z } from 'zod';

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case: a-z, 0-9 and dashes');

export const seedFileSchema = z
  .object({
    store: z.object({
      slug,
      name: z.string().min(1),
      contact: z.object({
        phone: z.string().min(1),
        address: z.string().optional(),
        mapUrl: z.url().optional(),
        mapQrImage: z.string().optional(),
      }),
      branding: z.object({ logo: z.string().optional() }).default({}),
      payment: z.object({ qrImage: z.string().optional() }).default({}),
    }),
    categories: z
      .array(
        z.object({
          slug,
          name: z.string().min(1),
          sortOrder: z.number().int().default(0),
        }),
      )
      .min(1),
    products: z.array(
      z.object({
        slug,
        category: slug,
        name: z.string().min(1),
        price: z.number().int().nonnegative(),
        image: z.string().optional(),
        description: z.string().optional(),
        isAvailable: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const categorySlugs = new Set(data.categories.map((c) => c.slug));
    const seenProductSlugs = new Set<string>();

    data.products.forEach((product, i) => {
      if (!categorySlugs.has(product.category)) {
        ctx.addIssue({
          code: 'custom',
          path: ['products', i, 'category'],
          message: `Unknown category "${product.category}"`,
        });
      }
      if (seenProductSlugs.has(product.slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['products', i, 'slug'],
          message: `Duplicate product slug "${product.slug}"`,
        });
      }
      seenProductSlugs.add(product.slug);
    });
  });

export type SeedFile = z.infer<typeof seedFileSchema>;
