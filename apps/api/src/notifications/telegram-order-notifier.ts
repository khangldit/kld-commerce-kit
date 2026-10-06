import {
  formatPrice,
  formatVnd,
  isPriceEstimate,
  STORE_TIME_ZONE,
} from '@kld/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import type { OrderRequest } from '../orders/schemas/order-request.schema.js';
import { OrderNotifier, type NotifiableStore } from './order-notifier.js';

const TELEGRAM_TIMEOUT_MS = 5000;

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: STORE_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

@Injectable()
export class TelegramOrderNotifier extends OrderNotifier {
  private readonly logger = new Logger(TelegramOrderNotifier.name);
  private readonly token: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.token = config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    if (!this.token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is not set — order notifications are disabled',
      );
    }
  }

  async notifyNewOrder(
    store: NotifiableStore,
    order: OrderRequest,
  ): Promise<boolean> {
    const chatId = store.notifications?.telegramChatId;
    if (!this.token || !chatId) {
      this.logger.warn(
        `Skipping Telegram for order ${order.code}: missing token or chat id`,
      );
      return false;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${this.token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: this.buildMessage(store, order),
          parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Telegram API ${response.status}: ${await response.text()}`,
      );
    }
    return true;
  }

  private buildMessage(store: NotifiableStore, order: OrderRequest): string {
    const lines = [
      `🛎 <b>Đơn mới #${order.code}</b> — ${escapeHtml(store.name)}`,
      ...this.fulfillmentLines(order),
      order.phone
        ? `📞 ${escapeHtml(order.phone)}${order.name ? ` (${escapeHtml(order.name)})` : ''}`
        : '🪑 Khách đang ngồi tại quán (không để lại SĐT)',
      '',
      ...order.items.map(
        (item) =>
          `${item.qty} × ${escapeHtml(item.name)} — ${formatPrice(item, item.qty)}`,
      ),
      '',
      order.items.some(isPriceEstimate)
        ? `<b>Tạm tính (từ): ${formatVnd(order.total)}</b> — có món giá theo con/thời giá`
        : `<b>Tổng: ${formatVnd(order.total)}</b>`,
    ];
    if (order.note) lines.push(`📝 ${escapeHtml(order.note)}`);
    return lines.join('\n');
  }

  private fulfillmentLines(order: OrderRequest): string[] {
    const when = order.scheduledAt
      ? `<b>${timeFormatter.format(order.scheduledAt)}</b>`
      : undefined;
    if (order.fulfillment === 'dine_in') {
      return when
        ? [`📅 Đặt bàn: ${when} · ${order.partySize ?? '?'} người`]
        : ['🍽 Ăn tại quán — ngay bây giờ'];
    }
    return [
      `🛵 Giao tại nhà — ${when ?? 'sớm nhất có thể'}`,
      `🏠 ${escapeHtml(order.address ?? '')}`,
    ];
  }
}
