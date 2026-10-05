import { formatVnd } from '@kld/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import type { OrderRequest } from '../orders/schemas/order-request.schema.js';
import { OrderNotifier, type NotifiableStore } from './order-notifier.js';

const TELEGRAM_TIMEOUT_MS = 5000;

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
      order.fulfillment === 'dine_in'
        ? `🍽 Tại bàn${order.table ? `: <b>${escapeHtml(order.table)}</b>` : ''}`
        : '🥡 Mang về',
      `📞 ${escapeHtml(order.phone)}${order.name ? ` (${escapeHtml(order.name)})` : ''}`,
      '',
      ...order.items.map(
        (item) =>
          `${item.qty} × ${escapeHtml(item.name)} — ${formatVnd(item.price * item.qty)}`,
      ),
      '',
      `<b>Tổng: ${formatVnd(order.total)}</b>`,
    ];
    if (order.note) lines.push(`📝 ${escapeHtml(order.note)}`);
    return lines.join('\n');
  }
}
