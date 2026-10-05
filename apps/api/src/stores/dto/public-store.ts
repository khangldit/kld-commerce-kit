import { publicStoreSchema, type PublicStore } from '@kld/shared';
import { createZodDto } from 'nestjs-zod/dto';
import type { Store } from '../schemas/store.schema.js';

export function toPublicStore(store: Store): PublicStore {
  return {
    slug: store.slug,
    name: store.name,
    contact: store.contact,
    branding: store.branding,
    payment: store.payment,
  };
}

export class PublicStoreDto extends createZodDto(publicStoreSchema) {}
