'use client';

import type { PublicProduct } from '@kld/shared';
import { Stepper } from '@/components/ui';
import { formatVnd } from '@/lib/format';
import { useCart, useLineQty } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { ProductImage } from './product-image';

/** One-line preview of a (possibly multi-line) description. */
function descriptionPreview(description: string): string {
  return description
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean)
    .join(' · ');
}

/** Compact price for cards: "89.000 ₫", "Từ 150.000 ₫" or "Thời giá". */
export function CardPrice({ product }: { product: PublicProduct }) {
  if (product.isMarketPrice) {
    return <span className="whitespace-nowrap text-base font-bold text-price">Thời giá</span>;
  }
  return (
    <span className="whitespace-nowrap text-base font-bold text-price">
      {product.priceMax && <span className="mr-1 text-[13px] font-semibold">Từ</span>}
      {formatVnd(product.price)}
    </span>
  );
}

/** Diagonal corner ribbon, e.g. "Best seller". Place inside a `relative` box. */
export function FeaturedRibbon({
  label,
  corner = 'right',
}: {
  label: string;
  corner?: 'left' | 'right';
}) {
  return (
    // Own clipping box so the card itself doesn't need overflow-hidden
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-[inherit]"
    >
      <span
        className={`absolute top-[11px] block w-[100px] bg-accent py-[3px] text-center text-[11px] font-extrabold uppercase leading-tight tracking-[.14em] text-on-accent shadow-[0_2px_6px_rgba(42,30,21,.25)] ${
          corner === 'right' ? '-right-[30px] rotate-45' : '-left-[30px] -rotate-45'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function AddToCart({
  product,
  size = 'md',
}: {
  product: PublicProduct;
  size?: 'md' | 'lg';
}) {
  const qty = useLineQty(product.id);
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => add(product)}
        aria-label={`Thêm ${product.name}`}
        className={
          size === 'lg'
            ? 'h-12 flex-none rounded-pill bg-accent px-7 text-base font-bold text-on-accent hover:opacity-90'
            : 'relative z-[1] h-11 flex-none rounded-pill border-[1.5px] border-primary bg-surface px-5 font-bold text-primary transition-colors hover:bg-primary-soft'
        }
      >
        {size === 'lg' ? 'Thêm vào giỏ' : 'Thêm'}
      </button>
    );
  }
  return (
    <div className="relative z-[1]">
      <Stepper
        value={qty}
        label={product.name}
        onDecrement={() => decrement(product.id)}
        onIncrement={() => add(product)}
      />
    </div>
  );
}

export function ProductCard({
  product,
  categoryName,
  tint,
  monogram,
  logoUrl,
  storeSlug,
  hidden,
  badge,
}: {
  product: PublicProduct;
  categoryName: string;
  tint: string;
  monogram: string;
  logoUrl?: string;
  storeSlug: string;
  hidden: boolean;
  /** Corner ribbon label, e.g. "Best seller" for featured products. */
  badge?: string;
}) {
  const qty = useLineQty(product.id);
  // Cards with a description open the detail popup (stretched-link pattern:
  // the name button covers the card, the add button sits above it).
  const openable = Boolean(product.description);

  return (
    <article
      className={`${hidden ? 'hidden' : 'flex'} relative min-h-[126px] gap-3 rounded-lg border bg-surface p-2.5 shadow-card xxl:min-h-[114px] ${
        qty > 0 ? 'border-primary' : 'border-line'
      } ${openable ? 'transition-shadow hover:shadow-panel' : ''}`}
    >
      {badge && (
        <>
          <FeaturedRibbon label={badge} />
          <span className="sr-only">{badge}</span>
        </>
      )}
      <div className="relative size-[104px] flex-none overflow-hidden rounded-md xxl:size-[92px]">
        <ProductImage
          storeSlug={storeSlug}
          image={product.image}
          name={product.name}
          categoryName={categoryName}
          monogram={monogram}
          logoUrl={logoUrl}
          tint={tint}
          sizes="104px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className={`mt-px line-clamp-2 text-base font-semibold leading-[1.3] ${badge ? 'pr-8' : ''}`}
        >
          {openable ? (
            <button
              type="button"
              onClick={() =>
                useUi.getState().setDetail({ product, categoryName, tint })
              }
              aria-haspopup="dialog"
              className="text-left before:absolute before:inset-0 before:rounded-lg before:content-['']"
            >
              {product.name}
            </button>
          ) : (
            product.name
          )}
        </h3>
        {product.description && (
          <p
            className={`mt-[3px] truncate text-[13px] text-ink-2 ${badge ? 'pr-4' : ''}`}
          >
            {descriptionPreview(product.description)}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <CardPrice product={product} />
          <AddToCart product={product} />
        </div>
      </div>
    </article>
  );
}
