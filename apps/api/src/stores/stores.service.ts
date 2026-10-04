import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Store } from './schemas/store.schema.js';

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
  ) {}

  async findActiveBySlug(slug: string) {
    const store = await this.storeModel.findOne({ slug, active: true }).lean();
    if (!store) {
      throw new NotFoundException(`Store "${slug}" not found`);
    }
    return store;
  }
}
