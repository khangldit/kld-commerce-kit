import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { toPublicStore } from './dto/public-store.js';
import { StoresService } from './stores.service.js';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get public store info' })
  @ApiParam({ name: 'slug', example: 'chu-bay' })
  @ApiOkResponse({ description: 'Store found' })
  @ApiNotFoundResponse({ description: 'Store not found or inactive' })
  async findOne(@Param('slug') slug: string) {
    const store = await this.storesService.findActiveBySlug(slug);
    return toPublicStore(store);
  }
}
