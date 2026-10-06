import { publicCatalogSchema, type PublicProduct } from '@kld/shared';
import type { Types } from 'mongoose';
import { createZodDto } from 'nestjs-zod/dto';
import type { Product } from '../schemas/product.schema.js';

export function toPublicProduct(
  product: Product & { _id: Types.ObjectId },
): PublicProduct {
  return {
    id: product._id.toString(),
    slug: product.slug,
    name: product.name,
    price: product.price,
    priceMax: product.priceMax,
    isMarketPrice: product.isMarketPrice ?? false,
    image: product.image,
    description: product.description,
    isFeatured: product.isFeatured ?? false,
  };
}

export class PublicCatalogDto extends createZodDto(publicCatalogSchema) {}
