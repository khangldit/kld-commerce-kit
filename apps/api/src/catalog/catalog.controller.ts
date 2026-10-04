import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';

@ApiTags('catalog')
@Controller('stores/:slug/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get store catalog',
    description:
      'Categories with their available products, sorted for display.',
  })
  @ApiParam({ name: 'slug', example: 'chu-bay' })
  @ApiOkResponse({ description: 'Categories with nested products' })
  @ApiNotFoundResponse({ description: 'Store not found or inactive' })
  getCatalog(@Param('slug') slug: string) {
    return this.catalogService.getCatalog(slug);
  }
}
