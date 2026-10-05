import { orderResponseSchema, type OrderResponse } from '@kld/shared';
import type { Types } from 'mongoose';
import { createZodDto } from 'nestjs-zod';
import type { OrderRequest } from '../schemas/order-request.schema.js';

export class OrderResponseDto extends createZodDto(orderResponseSchema) {}

export function toOrderResponse(
  order: OrderRequest & { _id: Types.ObjectId },
): OrderResponse {
  return {
    code: order.code,
    fulfillment: order.fulfillment,
    table: order.table,
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
    total: order.total,
    createdAt: order.createdAt.toISOString(),
  };
}
