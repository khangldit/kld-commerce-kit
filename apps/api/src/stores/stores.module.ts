import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from './schemas/store.schema.js';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
  ],
  exports: [MongooseModule, StoresService],
  providers: [StoresService],
  controllers: [StoresController],
})
export class StoresModule {}
