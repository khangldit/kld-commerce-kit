import type { OrderRequest } from '../orders/schemas/order-request.schema.js';
import type { Store } from '../stores/schemas/store.schema.js';

export type NotifiableStore = Pick<Store, 'name' | 'notifications'>;

export abstract class OrderNotifier {
  /** Resolves true when the notification was actually delivered. */
  abstract notifyNewOrder(
    store: NotifiableStore,
    order: OrderRequest,
  ): Promise<boolean>;
}
