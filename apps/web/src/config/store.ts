/**
 * The single place that decides which store this storefront serves.
 * Reads STORE_SLUG now; can switch to hostname-based lookup later.
 */
export function getStoreSlug(): string {
  const slug = process.env.STORE_SLUG;
  if (!slug) {
    throw new Error('STORE_SLUG is not set (see apps/web/.env.example)');
  }
  return slug;
}

export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set (see apps/web/.env.example)',
    );
  }
  return url.replace(/\/+$/, '');
}
