'use client';

import { formatPrice } from '@/lib/format';
import { useBodyScrollLock, useEscape } from '@/lib/hooks';
import { useUi } from '@/stores/ui';
import { useCallback } from 'react';
import { AddToCart, FeaturedRibbon } from './product-card';
import { ProductImage } from './product-image';

/** Small popup with the full photo, price and description of one product. */
export function ProductDialog({
  storeSlug,
  monogram,
  logoUrl,
  featuredBadge,
}: {
  storeSlug: string;
  monogram: string;
  logoUrl?: string;
  featuredBadge?: string;
}) {
  const detail = useUi((s) => s.detail);
  const setDetail = useUi((s) => s.setDetail);
  const close = useCallback(() => setDetail(null), [setDetail]);
  const open = detail !== null;

  useBodyScrollLock(open);
  useEscape(open, close);

  if (!detail) return null;
  const { product, categoryName, tint } = detail;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-dialog-title">
      <div
        className="absolute inset-0 bg-[rgba(42,30,21,.55)]"
        onClick={close}
      />
      <div className="relative flex max-h-[calc(100dvh-32px)] w-full max-w-[420px] flex-col overflow-hidden rounded-xl bg-surface shadow-modal">
        {/* Photos get 4:3; the placeholder stays short so long descriptions fit */}
        <div
          className={`relative w-full flex-none ${product.image ? 'aspect-[4/3]' : 'h-36'}`}>
          <ProductImage
            storeSlug={storeSlug}
            image={product.image}
            name={product.name}
            categoryName={categoryName}
            monogram={monogram}
            logoUrl={logoUrl}
            tint={tint}
            sizes="420px"
            large
          />
          {product.isFeatured && featuredBadge && (
            <FeaturedRibbon
              label={featuredBadge}
              corner="left"
            />
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-[rgba(255,252,246,.92)] text-2xl leading-none text-ink shadow-card">
            ×
          </button>
        </div>

        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[.1em] text-ink-2">
            {categoryName}
          </div>
          <h2
            id="product-dialog-title"
            className="font-head text-[22px] font-bold leading-tight">
            {product.name}
          </h2>
          {product.description && (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
              {product.description}
            </p>
          )}
          {(product.priceMax || product.isMarketPrice) && (
            <p className="rounded-md bg-warn-soft px-3 py-2 text-[13px]">
              {product.isMarketPrice
                ? 'Giá theo thời giá — quán sẽ báo giá khi gọi xác nhận.'
                : 'Giá tùy theo con / phần — quán sẽ báo giá chính xác khi gọi xác nhận.'}
            </p>
          )}
        </div>

        <div className="flex flex-none items-center justify-between gap-3 border-t border-line-soft px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
          <span className="font-head text-[22px] font-bold text-price">
            {formatPrice(product)}
          </span>
          <AddToCart
            product={product}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
