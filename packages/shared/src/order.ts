import { z } from 'zod';

export const MAX_ORDER_ITEMS = 50;
export const MAX_ORDER_NOTE_LENGTH = 500;
export const MAX_ADDRESS_LENGTH = 300;
export const MAX_PARTY_SIZE = 50;
/** How far ahead a reservation / scheduled delivery may be placed. */
export const MAX_SCHEDULE_DAYS = 30;
/** Small allowance for clock skew between the customer's device and the server. */
export const SCHEDULE_GRACE_MS = 5 * 60 * 1000;
export const STORE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const fulfillmentSchema = z.enum(['dine_in', 'delivery']);

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

/** ISO 8601 with an explicit offset, e.g. "2026-10-07T19:00:00+07:00". */
export const scheduledAtSchema = z.iso.datetime({ offset: true });

const orderBaseFields = {
  name: z.string().trim().min(1).max(100).optional(),
  note: z.string().trim().max(MAX_ORDER_NOTE_LENGTH).optional(),
  items: z.array(orderItemInputSchema).min(1).max(MAX_ORDER_ITEMS),
  idempotencyKey: z.uuid(),
};

export const dineInOrderRequestSchema = z.object({
  ...orderBaseFields,
  fulfillment: z.literal('dine_in'),
  /**
   * Optional only for dine-in "now" (customer ordering from the table, e.g.
   * via a table QR). Required for reservations — see the refinement below.
   */
  phone: vnPhoneSchema.optional(),
  /** Absent = now (customer is already at the store). */
  scheduledAt: scheduledAtSchema.optional(),
  /** Required when `scheduledAt` is set (reservation). */
  partySize: z.number().int().min(1).max(MAX_PARTY_SIZE).optional(),
});

export const deliveryOrderRequestSchema = z.object({
  ...orderBaseFields,
  fulfillment: z.literal('delivery'),
  phone: vnPhoneSchema,
  /** Absent = as soon as possible. */
  scheduledAt: scheduledAtSchema.optional(),
  address: z.string().trim().min(5).max(MAX_ADDRESS_LENGTH),
});

export const createOrderRequestSchema = z
  .discriminatedUnion('fulfillment', [
    dineInOrderRequestSchema,
    deliveryOrderRequestSchema,
  ])
  .superRefine((order, ctx) => {
    if (order.fulfillment === 'dine_in' && order.scheduledAt && !order.phone) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'phone is required for a reservation',
      });
    }
    if (
      order.fulfillment === 'dine_in' &&
      order.scheduledAt &&
      order.partySize === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['partySize'],
        message: 'partySize is required for a reservation',
      });
    }
  });

export type Fulfillment = z.infer<typeof fulfillmentSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
/** Shape the client sends, before transforms (e.g. phone normalization). */
export type CreateOrderRequestInput = z.input<typeof createOrderRequestSchema>;

/**
 * Whether a scheduled time is in the accepted window: not in the past
 * (minus a small grace) and at most MAX_SCHEDULE_DAYS ahead.
 */
export function isScheduleInRange(
  scheduledAt: Date,
  now = new Date(),
): boolean {
  const time = scheduledAt.getTime();
  return (
    time >= now.getTime() - SCHEDULE_GRACE_MS &&
    time <= now.getTime() + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000
  );
}

export const orderResponseItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  /** Lowest price at order time (see publicProductSchema.price). */
  price: z.number().int(),
  priceMax: z.number().int().optional(),
  isMarketPrice: z.boolean().optional(),
  qty: z.number().int(),
});

export const orderResponseSchema = z.object({
  code: z.string(),
  fulfillment: fulfillmentSchema,
  scheduledAt: z.iso.datetime({ offset: true }).optional(),
  partySize: z.number().int().optional(),
  items: z.array(orderResponseItemSchema),
  total: z.number().int(),
  createdAt: z.iso.datetime(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;
