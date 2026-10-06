'use client';

import { SectionCard, Stepper } from '@/components/ui';
import { formatPrice, formatVnd } from '@/lib/format';
import { useCart, useCartTotals } from '@/stores/cart';
import { StoreLink } from '@/components/store-link';

export function OrderSummary({ atTable = false }: { atTable?: boolean }) {
  const lines = useCart((s) => s.lines);
  const soldOut = useCart((s) => s.soldOut);
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);
  const { count, subtotal, estimate } = useCartTotals();
  const soldOutInCart = lines.filter((l) => soldOut.includes(l.productId));

  return (
    <SectionCard className="order-1 overflow-hidden">
      <div id="order-summary" className="flex items-baseline justify-between gap-2 px-[18px] pb-3 pt-4">
        <h2 className="font-head text-xl font-bold">Món đã chọn</h2>
        <StoreLink
          href="/"
          className="py-2 text-sm font-semibold text-primary no-underline hover:text-accent"
        >
          + Thêm món
        </StoreLink>
      </div>

      {soldOutInCart.length > 0 && (
        <div
          role="alert"
          className="mx-[18px] mb-2.5 rounded-md bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger"
        >
          {soldOutInCart.length === 1
            ? 'Rất tiếc, 1 món vừa hết. Bỏ món này để gửi đơn.'
            : `Rất tiếc, ${soldOutInCart.length} món vừa hết. Bỏ các món này để gửi đơn.`}
        </div>
      )}

      <ul>
        {lines.map((line) => {
          const out = soldOut.includes(line.productId);
          return (
            <li
              key={line.productId}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-line-soft px-[18px] py-3 ${
                out ? 'bg-danger-soft shadow-[inset_4px_0_0_var(--c-danger)]' : ''
              }`}
            >
              <div className="min-w-0">
                <div
                  className={`font-semibold leading-[1.3] ${out ? 'text-danger' : ''}`}
                >
                  {line.name}
                </div>
                <div className="text-[13px] text-ink-2">
                  {formatPrice(line)}
                </div>
              </div>
              <div
                className={`whitespace-nowrap font-bold ${out ? 'text-ink-3 line-through' : ''}`}
              >
                {formatPrice(line, line.qty)}
              </div>
              {out ? (
                <>
                  <span className="inline-flex h-7 items-center justify-self-start rounded-pill bg-danger px-2.5 text-xs font-bold text-white">
                    Món đã hết
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="h-11 justify-self-end rounded-pill border-[1.5px] border-danger bg-surface px-4 text-sm font-bold text-danger"
                  >
                    Bỏ món này
                  </button>
                </>
              ) : (
                <>
                  <Stepper
                    variant="soft"
                    value={line.qty}
                    label={line.name}
                    onDecrement={() => decrement(line.productId)}
                    onIncrement={() =>
                      add({ ...line, id: line.productId })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => remove(line.productId)}
                    className="h-11 justify-self-end px-1 text-[13px] text-ink-2 underline"
                  >
                    Xoá
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-baseline justify-between border-t border-dashed border-line px-[18px] pb-4 pt-3.5">
        <span className="text-ink-2">
          {estimate ? 'Tạm tính (từ)' : 'Tạm tính'} · {count} món
        </span>
        <span className="font-head text-[22px] font-bold">
          {formatVnd(subtotal)}
        </span>
      </div>
      {estimate && (
        <p className="-mt-2 px-[18px] pb-4 text-[13px] text-ink-2">
          {atTable
            ? 'Có món giá theo con / thời giá — nhân viên sẽ báo giá chính xác.'
            : 'Có món giá theo con / thời giá — quán sẽ báo giá chính xác khi gọi xác nhận.'}
        </p>
      )}
    </SectionCard>
  );
}
