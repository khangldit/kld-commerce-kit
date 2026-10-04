import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class StoreContact {
  @Prop({ type: String, required: true, trim: true })
  phone!: string;

  @Prop({ type: String, trim: true })
  address?: string;

  @Prop({ type: String, trim: true })
  mapUrl?: string;

  @Prop({ type: String })
  mapQrImage?: string;
}

@Schema({ _id: false })
export class StoreBranding {
  @Prop({ type: String })
  logo?: string;
}

@Schema({ _id: false })
export class StorePayment {
  @Prop({ type: String })
  qrImage?: string;
}

@Schema({ _id: false })
export class StoreNotifications {
  @Prop({ type: String })
  telegramChatId?: string; // set in Lesson 10
}

export type StoreDocument = HydratedDocument<Store>;

@Schema({ timestamps: true })
export class Store {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: SchemaFactory.createForClass(StoreContact), required: true })
  contact!: StoreContact;

  @Prop({ type: SchemaFactory.createForClass(StoreBranding), default: {} })
  branding!: StoreBranding;

  @Prop({ type: SchemaFactory.createForClass(StorePayment), default: {} })
  payment!: StorePayment;

  @Prop({ type: SchemaFactory.createForClass(StoreNotifications), default: {} })
  notifications!: StoreNotifications;

  @Prop({ type: Boolean, default: true })
  active!: boolean;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
