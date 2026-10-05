import type { CreateOrderRequest, OrderResponse } from '@kld/shared';
import {
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { Product } from '../catalog/schemas/product.schema.js';
import { isDuplicateKeyError } from '../common/mongo-errors.js';
import {
  NotifiableStore,
  OrderNotifier,
} from '../notifications/order-notifier.js';
import { StoresService } from '../stores/stores.service.js';
import { toOrderResponse } from './dto/order-response.js';
import { OrderCodeService } from './order-code.service.js';
import {
  OrderRequest,
  OrderRequestDocument,
} from './schemas/order-request.schema.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly storesService: StoresService,
    private readonly orderCodeService: OrderCodeService,
    private readonly notifier: OrderNotifier,
    @InjectModel(OrderRequest.name)
    private readonly orderModel: Model<OrderRequest>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create(
    storeSlug: string,
    input: CreateOrderRequest,
  ): Promise<OrderResponse> {
    const store = await this.storesService.findActiveBySlug(storeSlug);

    // 1. Idempotency: a repeated key returns the order already created
    const existing = await this.findByIdempotencyKey(
      input.idempotencyKey,
      store._id,
    );
    if (existing) return existing;

    // 2. Merge duplicate lines (same product sent twice)
    const qtyByProduct = new Map<string, number>();
    for (const item of input.items) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.qty,
      );
    }
    const productIds = [...qtyByProduct.keys()];

    // 3. Load products: must belong to THIS store and be available
    const products = await this.productModel
      .find({ _id: { $in: productIds }, storeId: store._id, isAvailable: true })
      .select({ name: 1, price: 1 })
      .lean();
    const productsById = new Map(products.map((p) => [p._id.toString(), p]));

    const unavailableProductIds = productIds.filter(
      (id) => !productsById.has(id),
    );
    if (unavailableProductIds.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Some products are unavailable',
        unavailableProductIds,
      });
    }

    // 4. Prices come from the DB, never from the client
    const items = productIds.map((id) => {
      const product = productsById.get(id)!;
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        qty: qtyByProduct.get(id)!,
      };
    });
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    // 5. Generate the code and save
    const code = await this.orderCodeService.next(store._id);
    try {
      const order = await this.orderModel.create({
        storeId: store._id,
        code,
        phone: input.phone,
        name: input.name,
        fulfillment: input.fulfillment,
        table: input.fulfillment === 'dine_in' ? input.table : undefined,
        note: input.note,
        items,
        total,
        idempotencyKey: input.idempotencyKey,
      });
      this.logger.log(
        `Order ${code} created for "${store.slug}", total ${total}`,
      );
      await this.notify(store, order);
      return toOrderResponse(order.toObject());
    } catch (error) {
      // Two identical requests raced past step 1 — the unique index caught it
      if (isDuplicateKeyError(error, 'idempotencyKey')) {
        const raced = await this.findByIdempotencyKey(
          input.idempotencyKey,
          store._id,
        );
        if (raced) return raced;
      }
      throw error;
    }
  }
  private async notify(
    store: NotifiableStore,
    order: OrderRequestDocument,
  ): Promise<void> {
    try {
      const delivered = await this.notifier.notifyNewOrder(store, order);
      if (delivered) {
        await this.orderModel.updateOne(
          { _id: order._id },
          { $set: { notified: true } },
        );
      }
    } catch (error) {
      this.logger.error(
        `Notification failed for order ${order.code}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async findByIdempotencyKey(
    key: string,
    storeId: Types.ObjectId,
  ): Promise<OrderResponse | null> {
    const order = await this.orderModel.findOne({ idempotencyKey: key }).lean();
    if (!order) return null;
    if (!order.storeId.equals(storeId)) {
      throw new ConflictException(
        'Idempotency key already used for another store',
      );
    }
    return toOrderResponse(order);
  }
}
