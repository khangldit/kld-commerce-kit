'use client';

import { useEffect } from 'react';
import { formatVnd } from '@/lib/format';
import { useBodyScrollLock, useEscape } from '@/lib/hooks';
import { useCartTotals } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { CartLines } from './cart-lines';
import { StoreLink } from '@/components/store-link';

/** Bottom bar + bottom sheet for <1024px. Desktop uses <CartPanel>. */
export function MobileCart() {
  const { count, subtotal, estimate } = useCartTotals();
  const open = useUi((s) => s.sheetOpen);
  const setOpen = useUi((s) => s.setSheetOpen);
  const sheetVisible = open && count > 0;

  useBodyScrollLock(sheetVisible);
  useEscape(sheetVisible, () => setOpen(false));

  // Close the sheet when the cart empties or the viewport grows to desktop
  useEffect(() => {
    if (count === 0) setOpen(false);
  }, [count, setOpen]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onChange = () => desktop.matches && setOpen(false);
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, [setOpen]);

  if (count === 0) return null;

  return (
    <>
      {/* Keeps the footer readable above the floating bar */}
      <div aria-hidden className="h-24 lg:hidden" />

      {!sheetVisible && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-3 left-1/2 z-30 flex h-[60px] w-[calc(100%-24px)] max-w-[560px] -translate-x-1/2 items-center gap-2 rounded-pill bg-primary pl-5 pr-2 text-on-primary shadow-float lg:hidden"
        >
          <span className="whitespace-nowrap font-semibold">{count} món</span>
          <span className="opacity-50">·</span>
          <span className="whitespace-nowrap font-bold">
            {estimate && 'từ '}
            {formatVnd(subtotal)}
          </span>
          <span className="ml-auto flex h-11 items-center whitespace-nowrap rounded-pill bg-accent px-[18px] font-bold text-on-accent">
            Đặt món
          </span>
        </button>
      )}

      {sheetVisible && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-sheet-title"
        >
          <div
            className="absolute inset-0 bg-[rgba(42,30,21,.5)]"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto flex max-h-[82dvh] w-full max-w-[640px] flex-col rounded-t-xl bg-surface shadow-modal">
            <div className="mx-auto mt-2 h-[5px] w-10 rounded-[3px] bg-line" />
            <div className="flex items-center justify-between border-b border-dashed border-line pb-2.5 pl-[18px] pr-2.5 pt-2">
              <div>
                <h2 id="cart-sheet-title" className="font-head text-xl font-bold">
                  Món đã chọn
                </h2>
                <div className="text-[13px] text-ink-2">{count} món</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 rounded-pill bg-bg px-3.5 font-semibold text-ink"
              >
                Đóng
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartLines />
            </div>
            <div className="flex flex-col gap-3 border-t border-line px-[18px] pb-[calc(18px+env(safe-area-inset-bottom))] pt-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2">{estimate ? 'Tạm tính (từ)' : 'Tạm tính'}</span>
                <span className="font-head text-[22px] font-bold">
                  {formatVnd(subtotal)}
                </span>
              </div>
              <StoreLink
                href="/order"
                onClick={() => setOpen(false)}
                className="grid h-[54px] place-items-center rounded-pill bg-accent text-base font-bold text-on-accent"
              >
                Đặt món
              </StoreLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
