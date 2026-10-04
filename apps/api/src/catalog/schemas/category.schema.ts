import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ storeId: 1, sortOrder: 1 });
