import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreSlugParamsDto } from '../common/dto/store-slug-params.dto.js';
import { CreateOrderRequestDto } from './dto/create-order-request.dto.js';

@ApiTags('orders')
@Controller('stores/:slug/orders')
export class OrdersController {
  @Post()
  @ApiOperation({ summary: 'Create an order request (stub until Lesson 9)' })
  create(
    @Param() params: StoreSlugParamsDto,
    @Body() body: CreateOrderRequestDto,
  ) {
    return { storeSlug: params.slug, received: body };
  }
}
