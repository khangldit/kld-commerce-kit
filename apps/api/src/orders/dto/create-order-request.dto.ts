import { createOrderRequestSchema } from '@kld/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateOrderRequestDto extends createZodDto(
  createOrderRequestSchema,
) {}
