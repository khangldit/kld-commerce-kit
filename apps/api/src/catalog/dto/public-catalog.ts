import type { Types } from 'mongoose';
import type { Product } from '../schemas/product.schema.js';

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  products: PublicProduct[];
}

export interface PublicCatalog {
  store: { slug: string; name: string };
  categories: PublicCategory[];
}

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
