import { z } from 'zod';

export const MAX_ORDER_ITEMS = 50;

export const fulfillmentSchema = z.enum(['dine_in', 'takeaway']);

export const vnPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s.-]/g, ''))
  .pipe(
    z
      .string()
      .regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, 'Invalid Vietnamese phone number'),
  );

export const orderItemInputSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'),
  qty: z.number().int().min(1).max(99),
});

export const createOrderRequestSchema = z.object({
  phone: vnPhoneSchema,
  name: z.string().trim().min(1).max(100).optional(),
  fulfillment: fulfillmentSchema,
  table: z.string().trim().min(1).max(20).optional(),
  note: z.string().trim().max(500).optional(),
  items: z.array(orderItemInputSchema).min(1).max(MAX_ORDER_ITEMS),
  idempotencyKey: z.uuid(),
});

export type Fulfillment = z.infer<typeof fulfillmentSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export const orderResponseItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().int(),
  qty: z.number().int(),
});

export const orderResponseSchema = z.object({
  code: z.string(),
  fulfillment: fulfillmentSchema,
  table: z.string().optional(),
  items: z.array(orderResponseItemSchema),
  total: z.number().int(),
  createdAt: z.iso.datetime(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;
