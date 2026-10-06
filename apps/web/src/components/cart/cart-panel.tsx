'use client';

import { EmptyMark } from '@/components/ui';
import { formatVnd } from '@/lib/format';
import { useCartTotals } from '@/stores/cart';
import { CartLines } from './cart-lines';
import { StoreLink } from '@/components/store-link';

/** Sticky right column on ≥1024px. */
export function CartPanel({ monogram }: { monogram: string }) {
  const { count, subtotal, estimate } = useCartTotals();

  return (
    <aside
      aria-label="Món đã chọn"
      className="sticky top-[calc(var(--header-h)+var(--tabs-h)+16px)] hidden w-80 flex-none lg:block"
    >
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
        <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-line px-[18px] pb-3.5 pt-4">
          <h2 className="font-head text-xl font-bold">Món đã chọn</h2>
          <span className="text-[13px] text-ink-2">{count} món</span>
        </div>
        {count > 0 ? (
          <>
            <div className="max-h-[calc(100vh-360px)] min-h-[120px] overflow-y-auto">
              <CartLines />
            </div>
            <div className="flex flex-col gap-3 px-[18px] pb-[18px] pt-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2">{estimate ? 'Tạm tính (từ)' : 'Tạm tính'}</span>
                <span className="font-head text-[22px] font-bold">
                  {formatVnd(subtotal)}
                </span>
              </div>
              <StoreLink
                href="/order"
                className="grid h-[52px] place-items-center rounded-pill bg-accent text-base font-bold text-on-accent transition-opacity hover:opacity-90"
              >
                Đặt món
              </StoreLink>
            </div>
          </>
        ) : (
          <div className="px-[22px] pb-[30px] pt-7 text-center text-sm text-ink-2">
            <EmptyMark monogram={monogram} />
            Chưa chọn món nào.
            <br />
            Bấm <b className="text-primary">Thêm</b> ở món bạn muốn gọi.
          </div>
        )}
      </div>
    </aside>
  );
}
