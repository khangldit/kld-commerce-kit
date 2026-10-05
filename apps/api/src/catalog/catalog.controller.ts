import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { StoreSlugParamsDto } from '../common/dto/store-slug-params.dto.js';
import { CatalogService } from './catalog.service.js';
import { PublicCatalogDto } from './dto/public-catalog.js';

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
  @ZodResponse({ type: PublicCatalogDto, description: 'Store found' })
  @ApiParam({ name: 'slug', example: 'chu-bay' })
  @ApiOkResponse({ description: 'Categories with nested products' })
  @ApiNotFoundResponse({ description: 'Store not found or inactive' })
  getCatalog(@Param() params: StoreSlugParamsDto) {
    return this.catalogService.getCatalog(params.slug);
  }
}
