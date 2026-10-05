import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { StoreSlugParamsDto } from '../common/dto/store-slug-params.dto.js';
import { CreateOrderRequestDto } from './dto/create-order-request.dto.js';
import { OrderResponseDto } from './dto/order-response.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@Controller('stores/:slug/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order request' })
  @ZodResponse({
    status: 201,
    type: OrderResponseDto,
    description:
      'Order created, or the existing order for a repeated idempotencyKey',
  })
  @ApiNotFoundResponse({ description: 'Store not found or inactive' })
  @ApiUnprocessableEntityResponse({
    description: 'Some products are unavailable',
  })
  create(
    @Param() params: StoreSlugParamsDto,
    @Body() body: CreateOrderRequestDto,
  ) {
    return this.ordersService.create(params.slug, body);
  }
}
