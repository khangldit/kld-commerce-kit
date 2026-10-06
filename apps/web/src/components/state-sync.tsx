'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { sanitizeTableLabel, TABLE_PARAM } from '@/lib/table-mode';
import { useCart, type CatalogEntry } from '@/stores/cart';
import { useUi } from '@/stores/ui';

/** Loads the cart saved for this store from localStorage (client only). */
export function CartHydrator({ storeSlug }: { storeSlug: string }) {
  useEffect(() => {
    useCart.persist.setOptions({ name: `kld:cart:${storeSlug}` });
    void Promise.resolve(useCart.persist.rehydrate()).then(() =>
      useCart.setState({ hydrated: true }),
    );
  }, [storeSlug]);
  return null;
}

/** Refreshes cart snapshots against the menu the page was rendered with. */
export function CartSync({ products }: { products: CatalogEntry[] }) {
  const hydrated = useCart((s) => s.hydrated);
  const syncWithCatalog = useCart((s) => s.syncWithCatalog);
  useEffect(() => {
    if (hydrated) syncWithCatalog(products);
  }, [hydrated, products, syncWithCatalog]);
  return null;
}

/**
 * Mirrors URL params into UI state: `?c=` (menu tab) and `?t=` (table QR).
 * Table mode exists only while `t` is in the URL — nothing is persisted.
 * Must be rendered inside <Suspense> so the rest of the page stays static.
 */
export function UrlStateSync() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('c');
  const tableParam = searchParams.get(TABLE_PARAM);

  useEffect(() => {
    useUi.getState().setTab(tab);
  }, [tab]);

  useEffect(() => {
    useUi.getState().setTable(
      tableParam ? sanitizeTableLabel(tableParam) || null : null,
    );
  }, [tableParam]);

  return null;
}
