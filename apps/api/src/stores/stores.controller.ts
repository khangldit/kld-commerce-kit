import { Controller, Get, Param } from '@nestjs/common';
import { toPublicStore } from './dto/public-store.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const store = await this.storesService.findActiveBySlug(slug);
    return toPublicStore(store);
  }
}
