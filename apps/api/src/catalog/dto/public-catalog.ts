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
    image: product.image,
    description: product.description,
  };
}

export class PublicCatalogDto extends createZodDto(publicCatalogSchema) {}
