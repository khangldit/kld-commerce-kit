import { fulfillmentSchema, type Fulfillment } from '@kld/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true })
  productId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: Number, min: 0 })
  priceMax?: number;

  @Prop({ type: Boolean })
  isMarketPrice?: boolean;

  @Prop({ type: Number, required: true, min: 1 })
  qty!: number;
}

export type OrderRequestDocument = HydratedDocument<OrderRequest>;

@Schema({
  collection: 'order_requests',
  timestamps: { createdAt: true, updatedAt: false },
})
export class OrderRequest {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  storeId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  code!: string;

  /** Absent for dine-in orders placed at the table. */
  @Prop({ type: String })
  phone?: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: String, required: true, enum: fulfillmentSchema.options })
  fulfillment!: Fulfillment;

  /** Reservation time (dine-in) or delivery time. Absent = now / ASAP. */
  @Prop({ type: Date })
  scheduledAt?: Date;

  @Prop({ type: Number, min: 1 })
  partySize?: number;

  /** Delivery address — only for `delivery`. */
  @Prop({ type: String })
  address?: string;

  @Prop({ type: String })
  note?: string;

  @Prop({ type: [SchemaFactory.createForClass(OrderItem)], required: true })
  items!: OrderItem[];

  @Prop({ type: Number, required: true, min: 0 })
  total!: number;

  @Prop({ type: String, required: true })
  idempotencyKey!: string;

  @Prop({ type: Boolean, default: false })
  notified!: boolean;

  createdAt!: Date;
}

export const OrderRequestSchema = SchemaFactory.createForClass(OrderRequest);
OrderRequestSchema.index({ idempotencyKey: 1 }, { unique: true });
OrderRequestSchema.index({ storeId: 1, code: 1 }, { unique: true });
OrderRequestSchema.index({ storeId: 1, createdAt: -1 });
