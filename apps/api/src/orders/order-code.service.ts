import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { Counter } from './schemas/counter.schema.js';

const STORE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class OrderCodeService {
  private readonly dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIME_ZONE,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });

  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
  ) {}

  async next(storeId: Types.ObjectId, now = new Date()): Promise<string> {
    const parts = Object.fromEntries(
      this.dayFormatter.formatToParts(now).map((p) => [p.type, p.value]),
    );
    const day = `${parts.year}${parts.month}${parts.day}`; // e.g. "251005"

    const counter = await this.counterModel
      .findOneAndUpdate(
        { _id: `order:${storeId.toString()}:${day}` },
        { $inc: { seq: 1 } },
        { upsert: true, new: true },
      )
      .orFail();

    return `${day}-${String(counter.seq).padStart(3, '0')}`;
  }
}
