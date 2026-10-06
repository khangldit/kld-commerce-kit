const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

export function formatVnd(amount: number): string {
  return vndFormatter.format(amount); // 89000 -> "89.000 ₫"
}

export interface PriceInfo {
  price: number;
  priceMax?: number;
  isMarketPrice?: boolean;
}

/** True when the final amount is only known after the store confirms. */
export function isPriceEstimate(item: PriceInfo): boolean {
  return Boolean(item.isMarketPrice || item.priceMax);
}

/** "89.000 ₫", "150.000 – 200.000 ₫" or "Thời giá", multiplied by `qty`. */
export function formatPrice(item: PriceInfo, qty = 1): string {
  if (item.isMarketPrice) return 'Thời giá';
  if (item.priceMax) {
    return `${formatVnd(item.price * qty).replace(/\s*₫$/, '')} – ${formatVnd(item.priceMax * qty)}`;
  }
  return formatVnd(item.price * qty);
}
