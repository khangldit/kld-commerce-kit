import { PublicCatalog, PublicProduct } from '@kld/shared';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { StoresService } from '../stores/stores.service.js';
import { toPublicProduct } from './dto/public-catalog.js';
import { Category } from './schemas/category.schema.js';
import { Product } from './schemas/product.schema.js';

@Injectable()
export class CatalogService {
  constructor(
    private readonly storesService: StoresService,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async getCatalog(storeSlug: string): Promise<PublicCatalog> {
    const store = await this.storesService.findActiveBySlug(storeSlug);

    const [categories, products] = await Promise.all([
      this.categoryModel
        .find({ storeId: store._id })
        .sort({ sortOrder: 1 })
        .lean(),
      this.productModel
        .find({ storeId: store._id, isAvailable: true })
        .sort({ categoryId: 1, sortOrder: 1 })
        .lean(),
    ]);

    const productsByCategory = new Map<string, PublicProduct[]>();
    for (const product of products) {
      const key = product.categoryId.toString();
      const list = productsByCategory.get(key) ?? [];
      list.push(toPublicProduct(product));
      productsByCategory.set(key, list);
    }

    return {
      store: { slug: store.slug, name: store.name },
      categories: categories
        .map((category) => ({
          id: category._id.toString(),
          slug: category.slug,
          name: category.name,
          products: productsByCategory.get(category._id.toString()) ?? [],
        }))
        .filter((category) => category.products.length > 0),
    };
  }
}
