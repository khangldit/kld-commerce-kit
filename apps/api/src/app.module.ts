import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { createZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { CatalogModule } from './catalog/catalog.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { CoreModule } from './core/core.module.js';
import { HealthModule } from './health/health.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { StoresModule } from './stores/stores.module.js';

const StrictZodValidationPipe = createZodValidationPipe({
  strictSchemaDeclaration: true,
});

@Module({
  imports: [
    CoreModule,
    HealthModule,
    StoresModule,
    CatalogModule,
    OrdersModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StrictZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
