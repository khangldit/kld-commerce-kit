'use client';

import { Stepper } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/stores/cart';

/** Selected items with steppers — shared by the desktop panel and the mobile sheet. */
export function CartLines() {
  const lines = useCart((s) => s.lines);
  const soldOut = useCart((s) => s.soldOut);
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);

  return (
    <ul>
      {lines.map((line) => {
        const out = soldOut.includes(line.productId);
        return (
          <li
            key={line.productId}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-b border-line-soft px-[18px] py-3"
          >
            <div
              className={`min-w-0 font-semibold leading-[1.3] ${out ? 'text-danger' : ''}`}
            >
              {line.name}
            </div>
            <div
              className={`whitespace-nowrap font-bold ${out ? 'text-ink-3 line-through' : ''}`}
            >
              {formatPrice(line, line.qty)}
            </div>
            {out ? (
              <>
                <span className="text-[13px] font-semibold text-danger">
                  Món đã hết
                </span>
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  className="h-11 justify-self-end px-1 text-[13px] text-ink-2 underline"
                >
                  Bỏ món
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
                <div className="text-right text-[13px] text-ink-2">
                  {formatPrice(line)}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
