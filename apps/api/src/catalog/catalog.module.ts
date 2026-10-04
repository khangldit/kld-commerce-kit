import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoresModule } from '../stores/stores.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { Category, CategorySchema } from './schemas/category.schema.js';
import { Product, ProductSchema } from './schemas/product.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    StoresModule,
  ],
  exports: [MongooseModule],
  providers: [CatalogService],
  controllers: [CatalogController],
})
export class CatalogModule {}
