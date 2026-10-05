import { storeSlugParamsSchema } from '@kld/shared';
import { createZodDto } from 'nestjs-zod';

export class StoreSlugParamsDto extends createZodDto(storeSlugParamsSchema) {}
