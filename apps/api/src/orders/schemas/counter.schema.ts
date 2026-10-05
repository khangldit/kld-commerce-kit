import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'counters', versionKey: false })
export class Counter {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: Number, required: true })
  seq!: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
