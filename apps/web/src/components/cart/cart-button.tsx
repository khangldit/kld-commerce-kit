'use client';

import { useRouter } from 'next/navigation';
import { useStoreHref } from '@/components/store-link';
import { useCartTotals } from '@/stores/cart';
import { useUi } from '@/stores/ui';

/** Header button: opens the sheet on mobile, goes to checkout on desktop. */
export function CartButton() {
  const { count } = useCartTotals();
  const router = useRouter();
  const orderHref = useStoreHref('/order');

  function onClick() {
    if (count === 0) {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (window.matchMedia('(min-width: 1024px)').matches) router.push(orderHref);
    else useUi.getState().setSheetOpen(true);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 flex-none items-center gap-2 rounded-pill border border-line bg-bg pl-4 pr-1.5 font-semibold text-ink"
    >
      Giỏ hàng
      <span
        className={`grid h-8 min-w-8 place-items-center rounded-pill px-[9px] text-sm font-bold text-on-accent ${
          count ? 'bg-accent' : 'bg-ink-3'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
