import { z } from 'zod';

export const errorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'STORE_NOT_FOUND',
  'PRODUCTS_UNAVAILABLE',
  'IDEMPOTENCY_KEY_CONFLICT',
  'SERVICE_UNAVAILABLE',
  'RATE_LIMITED',
  'HTTP_ERROR',
  'INTERNAL_ERROR',
]);

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: errorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});

export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
