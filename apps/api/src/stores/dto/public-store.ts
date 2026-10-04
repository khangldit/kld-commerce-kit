import type { Store } from '../schemas/store.schema.js';

export type PublicStore = Pick<
  Store,
  'slug' | 'name' | 'contact' | 'branding' | 'payment'
>;

export function toPublicStore(store: Store): PublicStore {
  return {
    slug: store.slug,
    name: store.name,
    contact: store.contact,
    branding: store.branding,
    payment: store.payment,
  };
}
