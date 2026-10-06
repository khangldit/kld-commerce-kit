'use client';

import { normalizeText } from '@/lib/format';
import { useUi } from '@/stores/ui';
import type { PublicProduct } from '@kld/shared';
import { useMemo } from 'react';
import {
  ALL_TAB,
  FEATURED_TAB,
  resolveTab,
  type MenuCategory,
} from './menu-model';
import { ProductCard } from './product-card';

const GRID = 'grid grid-cols-1 gap-3 xl:grid-cols-2';

/**
 * Every product is always rendered (good for SEO); tabs and search only
 * hide/show cards. In single-grid modes the category wrappers use
 * `display: contents` so all visible cards flow into one grid.
 */
export function MenuList({
  categories,
  monogram,
  logoUrl,
  storeSlug,
  searchHint,
  featuredBadge,
}: {
  categories: MenuCategory[];
  monogram: string;
  logoUrl?: string;
  storeSlug: string;
  searchHint?: string;
  featuredBadge?: string;
}) {
  const rawTab = useUi((s) => s.tab);
  const query = useUi((s) => s.query);
  const setQuery = useUi((s) => s.setQuery);
  const tab = resolveTab(rawTab, categories);

  const searchText = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      for (const p of c.products) {
        map.set(p.id, normalizeText(`${p.name} ${p.description ?? ''}`));
      }
    }
    return map;
  }, [categories]);

  const q = normalizeText(query.trim());
  const mode = q ? 'search' : tab === ALL_TAB ? 'sections' : 'single';

  const matches = (p: PublicProduct, c: MenuCategory) => {
    if (q) return searchText.get(p.id)!.includes(q);
    if (tab === ALL_TAB) return true;
    if (tab === FEATURED_TAB) return p.isFeatured;
    return c.slug === tab;
  };

  const visibleCount = categories.reduce(
    (sum, c) => sum + c.products.filter((p) => matches(p, c)).length,
    0,
  );

  return (
    <div className="min-w-0 flex-1">
      <div className="relative mb-2">
        <label
          htmlFor="menu-search"
          className="sr-only">
          Tìm món
        </label>
        <input
          id="menu-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm món..."
          autoComplete="off"
          className="h-12 w-full appearance-none rounded-md border-[1.5px] border-line bg-surface pl-4 pr-12 text-base text-ink outline-none placeholder:text-ink-3 focus:border-primary [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Xoá tìm kiếm"
            className="absolute right-0.5 top-0.5 h-11 w-11 text-xl text-ink-2">
            ×
          </button>
        )}
      </div>
      {q && (
        <div
          className="mx-0.5 mt-1 text-[13px] text-ink-2"
          aria-live="polite">
          {visibleCount} kết quả cho “{query.trim()}”
        </div>
      )}

      <div className={mode === 'single' ? `${GRID} mt-2` : ''}>
        {categories.map((category) => {
          const count = category.products.filter((p) =>
            matches(p, category),
          ).length;
          const sectionClass =
            count === 0 ? 'hidden' : mode === 'single' ? 'contents' : '';
          return (
            <section
              key={category.id}
              aria-labelledby={`cat-${category.slug}`}
              className={sectionClass}>
              <div
                className={
                  mode === 'single'
                    ? 'sr-only'
                    : 'mb-3 mt-[22px] flex items-baseline gap-2 border-b-2 border-ink pb-2'
                }>
                <h2
                  id={`cat-${category.slug}`}
                  className="font-head text-[22px] font-bold">
                  {category.name}
                </h2>
                <span className="text-sm font-medium text-ink-2">
                  · {count} món
                </span>
              </div>
              <div className={mode === 'single' ? 'contents' : `${GRID} mt-2`}>
                {category.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={category.name}
                    tint={category.tint}
                    monogram={monogram}
                    logoUrl={logoUrl}
                    storeSlug={storeSlug}
                    hidden={!matches(product, category)}
                    // Every card on the Featured tab is featured — only badge elsewhere
                    badge={
                      product.isFeatured && (q || tab !== FEATURED_TAB)
                        ? featuredBadge
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {q && visibleCount === 0 && (
        <div className="px-4 py-10 text-center text-ink-2">
          <div className="mb-1 font-head text-xl text-ink">
            Không tìm thấy món
          </div>
          {searchHint}
        </div>
      )}
    </div>
  );
}
