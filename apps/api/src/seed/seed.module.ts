import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CoreModule } from '../core/core.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [CoreModule, StoresModule, CatalogModule],
  providers: [SeedService],
})
export class SeedModule {}
