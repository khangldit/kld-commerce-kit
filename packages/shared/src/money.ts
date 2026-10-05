const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

export function formatVnd(amount: number): string {
  return vndFormatter.format(amount); // 89000 -> "89.000 ₫"
}
