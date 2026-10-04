import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { Category } from '../catalog/schemas/category.schema.js';
import { Product } from '../catalog/schemas/product.schema.js';
import { Store } from '../stores/schemas/store.schema.js';
import type { SeedFile } from './seed-file.schema.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async run(data: SeedFile): Promise<void> {
    // 1. Store — upsert by slug
    const store = await this.storeModel
      .findOneAndUpdate(
        { slug: data.store.slug },
        { $set: data.store },
        { upsert: true, new: true, runValidators: true },
      )
      .orFail();

    // 2. Categories — upsert one by one to collect slug -> _id
    const categoryIds = new Map<string, Types.ObjectId>();
    for (const category of data.categories) {
      const doc = await this.categoryModel
        .findOneAndUpdate(
          { storeId: store._id, slug: category.slug },
          { $set: { ...category, storeId: store._id } },
          { upsert: true, new: true, runValidators: true },
        )
        .orFail();
      categoryIds.set(category.slug, doc._id);
    }

    // 3. Products — a single bulkWrite round trip
    const result = await this.productModel.bulkWrite(
      data.products.map(({ category, ...product }) => ({
        updateOne: {
          filter: { storeId: store._id, slug: product.slug },
          update: {
            $set: {
              ...product,
              storeId: store._id,
              categoryId: categoryIds.get(category),
            },
          },
          upsert: true,
        },
      })),
    );

    // 4. Products no longer in the file -> hide, never delete
    const fileSlugs = data.products.map((p) => p.slug);
    const hidden = await this.productModel.updateMany(
      { storeId: store._id, slug: { $nin: fileSlugs }, isAvailable: true },
      { $set: { isAvailable: false } },
    );

    this.logger.log(
      `Store "${store.slug}": ${data.categories.length} categories, ` +
        `products ${result.upsertedCount} created / ${result.modifiedCount} updated / ` +
        `${hidden.modifiedCount} hidden`,
    );
  }
}
