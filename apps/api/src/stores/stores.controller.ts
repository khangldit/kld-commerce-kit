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
import { PublicStoreDto, toPublicStore } from './dto/public-store.js';
import { StoresService } from './stores.service.js';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get public store info' })
  @ZodResponse({ type: PublicStoreDto, description: 'Store found' })
  @ApiParam({ name: 'slug', example: 'chu-bay' })
  @ApiOkResponse({ description: 'Store found' })
  @ApiNotFoundResponse({ description: 'Store not found or inactive' })
  async findOne(@Param() params: StoreSlugParamsDto) {
    const store = await this.storesService.findActiveBySlug(params.slug);
    return toPublicStore(store);
  }
}
