import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { OrderCodeService } from './order-code.service.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { Counter, CounterSchema } from './schemas/counter.schema.js';
import {
  OrderRequest,
  OrderRequestSchema,
} from './schemas/order-request.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderRequest.name, schema: OrderRequestSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    StoresModule,
    CatalogModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderCodeService],
})
export class OrdersModule {}
