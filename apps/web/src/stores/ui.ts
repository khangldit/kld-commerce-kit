'use client';

import type { PublicProduct } from '@kld/shared';
import { create } from 'zustand';

export interface ProductDetail {
  product: PublicProduct;
  categoryName: string;
  tint: string;
}

interface UiState {
  /** Raw `?c=` value; resolved against the menu by <MenuTabs>. */
  tab: string | null;
  query: string;
  sheetOpen: boolean;
  paymentOpen: boolean;
  /** Table label from a table QR (`?t=`), or null when not in table mode. */
  table: string | null;
  /** Product shown in the detail popup. */
  detail: ProductDetail | null;
  setTab: (tab: string | null) => void;
  setQuery: (query: string) => void;
  setSheetOpen: (open: boolean) => void;
  setPaymentOpen: (open: boolean) => void;
  setTable: (table: string | null) => void;
  setDetail: (detail: ProductDetail | null) => void;
}

export const useUi = create<UiState>()((set) => ({
  tab: null,
  query: '',
  sheetOpen: false,
  paymentOpen: false,
  table: null,
  detail: null,
  setTab: (tab) => set({ tab }),
  setQuery: (query) => set({ query }),
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  setPaymentOpen: (paymentOpen) => set({ paymentOpen }),
  setTable: (table) => set({ table }),
  setDetail: (detail) => set({ detail }),
}));
