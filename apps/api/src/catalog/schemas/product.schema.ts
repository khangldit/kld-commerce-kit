import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  storeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'price must be an integer (VND)',
    },
  })
  price!: number; // lowest price when there is a range; 0 for market price

  @Prop({ type: Number, min: 0 })
  priceMax?: number;

  @Prop({ type: Boolean, default: false })
  isMarketPrice!: boolean;

  @Prop({ type: String })
  image?: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Boolean, default: true })
  isAvailable!: boolean;

  @Prop({ type: Boolean, default: false })
  isFeatured!: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ storeId: 1, categoryId: 1, sortOrder: 1 });
