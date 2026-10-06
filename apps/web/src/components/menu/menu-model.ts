import type { PublicCategory } from '@kld/shared';

export interface MenuCategory extends PublicCategory {
  /** CSS color for the image placeholder of this category. */
  tint: string;
}

export const FEATURED_TAB = 'featured';
export const ALL_TAB = 'all';

export function hasFeaturedProducts(categories: MenuCategory[]): boolean {
  return categories.some((c) => c.products.some((p) => p.isFeatured));
}

/** Default tab = Featured, or All when the store has no featured products. */
export function defaultTab(categories: MenuCategory[]): string {
  return hasFeaturedProducts(categories) ? FEATURED_TAB : ALL_TAB;
}

/** Turns the raw `?c=` value into a tab that exists for this menu. */
export function resolveTab(
  raw: string | null,
  categories: MenuCategory[],
): string {
  if (raw === ALL_TAB) return ALL_TAB;
  if (raw === FEATURED_TAB && hasFeaturedProducts(categories)) return FEATURED_TAB;
  if (raw && categories.some((c) => c.slug === raw)) return raw;
  return defaultTab(categories);
}
