import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module.js';
import { CoreModule } from './core/core.module.js';
import { HealthModule } from './health/health.module.js';
import { StoresModule } from './stores/stores.module.js';

@Module({
  imports: [CoreModule, HealthModule, StoresModule, CatalogModule],
})
export class AppModule {}
