import { z } from 'zod';

import { slugSchema } from '@kld/shared';

export const seedFileSchema = z
  .object({
    store: z.object({
      slug: slugSchema,
      name: z.string().min(1),
      contact: z.object({
        phone: z.string().min(1),
        secondaryPhone: z.string().optional(),
        address: z.string().optional(),
        mapUrl: z.url().optional(),
        mapQrImage: z.string().optional(),
        geo: z
          .object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
          })
          .optional(),
        openingHours: z.string().optional(),
        zalo: z.url().optional(),
        facebook: z.url().optional(),
      }),
      branding: z
        .object({
          logo: z.string().optional(),
          tagline: z.string().optional(),
          coverImage: z.string().optional(),
        })
        .default({}),
      payment: z
        .object({
          qrImage: z.string().optional(),
          bankName: z.string().optional(),
          accountNumber: z.string().optional(),
          accountName: z.string().optional(),
        })
        .default({}),
      notifications: z
        .object({
          telegramChatId: z
            .string()
            .regex(/^-?\d+$/)
            .optional(),
        })
        .default({}),
    }),
    categories: z
      .array(
        z.object({
          slug: slugSchema,
          name: z.string().min(1),
          sortOrder: z.number().int().default(0),
        }),
      )
      .min(1),
    products: z.array(
      z.object({
        slug: slugSchema,
        category: slugSchema,
        name: z.string().min(1),
        price: z.number().int().nonnegative(),
        priceMax: z.number().int().positive().optional(),
        isMarketPrice: z.boolean().default(false),
        image: z.string().optional(),
        description: z.string().optional(),
        isAvailable: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
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
      if (product.priceMax !== undefined && product.priceMax <= product.price) {
        ctx.addIssue({
          code: 'custom',
          path: ['products', i, 'priceMax'],
          message: 'priceMax must be greater than price',
        });
      }
    });
  });

export type SeedFile = z.infer<typeof seedFileSchema>;
