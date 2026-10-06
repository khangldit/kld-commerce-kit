'use client';

import { isPriceEstimate, MAX_ORDER_ITEMS, type PriceInfo } from '@kld/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX_QTY = 99;

/** Name and price are snapshots for display only — the API computes the real total. */
export interface CartLine extends PriceInfo {
  productId: string;
  name: string;
  qty: number;
}

export interface CatalogEntry extends PriceInfo {
  id: string;
  name: string;
}

const priceFields = ({ price, priceMax, isMarketPrice }: PriceInfo): PriceInfo => ({
  price,
  priceMax,
  isMarketPrice,
});

interface CartState {
  lines: CartLine[];
  /** Products the API reported as unavailable when the order was sent. */
  soldOut: string[];
  hydrated: boolean;
  add: (product: CatalogEntry) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  markSoldOut: (productIds: string[]) => void;
  syncWithCatalog: (products: CatalogEntry[]) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      soldOut: [],
      hydrated: false,
      add: (product) =>
        set((state) => {
          const line = state.lines.find((l) => l.productId === product.id);
          if (line) {
            return {
              lines: state.lines.map((l) =>
                l === line ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l,
              ),
            };
          }
          if (state.lines.length >= MAX_ORDER_ITEMS) return state;
          return {
            lines: [
              ...state.lines,
              {
                productId: product.id,
                name: product.name,
                ...priceFields(product),
                qty: 1,
              },
            ],
          };
        }),
      decrement: (productId) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.productId === productId ? { ...l, qty: l.qty - 1 } : l))
            .filter((l) => l.qty > 0),
        })),
      remove: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
          soldOut: state.soldOut.filter((id) => id !== productId),
        })),
      clear: () => set({ lines: [], soldOut: [] }),
      markSoldOut: (productIds) =>
        set((state) => ({
          soldOut: [...new Set([...state.soldOut, ...productIds])],
        })),
      // Refresh name/price snapshots from the current menu and drop lines whose
      // product is no longer on it (e.g. removed from the menu). "Sold out"
      // is only shown when the API rejects an order.
      syncWithCatalog: (products) =>
        set((state) => {
          const byId = new Map(products.map((p) => [p.id, p]));
          return {
            lines: state.lines.flatMap((l) => {
              const p = byId.get(l.productId);
              return p ? [{ ...l, name: p.name, ...priceFields(p) }] : [];
            }),
            soldOut: state.soldOut.filter((id) => byId.has(id)),
          };
        }),
    }),
    {
      // Renamed per store by <CartHydrator> before the first rehydrate
      name: 'kld:cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
    },
  ),
);

/**
 * `subtotal` sums the lowest prices; `estimate` is true when some line has a
 * price range or market price, so the real total is confirmed by the store.
 */
export function cartTotals(lines: CartLine[], soldOut: string[]) {
  let count = 0;
  let subtotal = 0;
  let estimate = false;
  for (const line of lines) {
    if (soldOut.includes(line.productId)) continue;
    count += line.qty;
    subtotal += line.qty * line.price;
    estimate ||= isPriceEstimate(line);
  }
  return { count, subtotal, estimate };
}

export function useCartTotals() {
  const lines = useCart((s) => s.lines);
  const soldOut = useCart((s) => s.soldOut);
  return cartTotals(lines, soldOut);
}

export function useLineQty(productId: string): number {
  return useCart(
    (s) => s.lines.find((l) => l.productId === productId)?.qty ?? 0,
  );
}
