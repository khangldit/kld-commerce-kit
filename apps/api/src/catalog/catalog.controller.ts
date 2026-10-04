import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';

@Controller('stores/:slug/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  getCatalog(@Param('slug') slug: string) {
    return this.catalogService.getCatalog(slug);
  }
}
