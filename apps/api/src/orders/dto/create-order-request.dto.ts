import { createOrderRequestSchema } from '@kld/shared';
import { createZodDto } from 'nestjs-zod';

// The schema is a discriminated union and a class can't extend a union type,
// so the base is typed as a plain constructor. Runtime behaviour (validation,
// Swagger) is unchanged; the controller reads the parsed body as
// `CreateOrderRequest`.
const CreateOrderRequestDtoBase: new () => object = createZodDto(
  createOrderRequestSchema,
);

export class CreateOrderRequestDto extends CreateOrderRequestDtoBase {}
