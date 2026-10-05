import { Module } from '@nestjs/common';
import { OrderNotifier } from './order-notifier.js';
import { TelegramOrderNotifier } from './telegram-order-notifier.js';

@Module({
  providers: [{ provide: OrderNotifier, useClass: TelegramOrderNotifier }],
  exports: [OrderNotifier],
})
export class NotificationsModule {}
