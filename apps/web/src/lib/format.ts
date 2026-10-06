export { formatPrice, formatVnd, isPriceEstimate } from '@kld/shared';

/** Accent-insensitive, lower-case text for search ("Lẩu" → "lau", "Đồ" → "do"). */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** "0909123456" → "0909 123 456" (other shapes are returned as typed). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/** The store's map link, or a Google Maps search for its address. */
export function mapHref(contact: { mapUrl?: string; address?: string }): string | undefined {
  if (contact.mapUrl) return contact.mapUrl;
  if (contact.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`;
  }
  return undefined;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** Public URL of a store asset (logo, QR, cover) stored under public/brands/<slug>/. */
export function storeAsset(slug: string, file: string): string {
  return `/brands/${slug}/${file}`;
}

export function productImage(slug: string, file: string): string {
  return `/brands/${slug}/products/${file}`;
}
