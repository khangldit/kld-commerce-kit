import { CartPanel } from '@/components/cart/cart-panel';
import { MobileCart } from '@/components/cart/mobile-cart';
import { MenuList } from '@/components/menu/menu-list';
import type { MenuCategory } from '@/components/menu/menu-model';
import { MenuTabs } from '@/components/menu/menu-tabs';
import { ProductDialog } from '@/components/menu/product-dialog';
import { CartSync } from '@/components/state-sync';
import { Hero } from '@/components/store/hero';
import { PaymentDialog } from '@/components/store/payment-info';
import { SiteFooter } from '@/components/store/site-footer';
import { SiteHeader } from '@/components/store/site-header';
import { getStoreSlug } from '@/config/store';
import { getCatalog, getStore } from '@/lib/api';
import { storeAsset } from '@/lib/format';
import { restaurantJsonLd, toJsonLdScript } from '@/lib/json-ld';
import { getBrand } from '@brands/index';
import type { Metadata } from 'next';

const TINTS = [
  'var(--c-tint-1)',
  'var(--c-tint-2)',
  'var(--c-tint-3)',
  'var(--c-tint-4)',
];

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore(getStoreSlug());
  const description =
    store.branding.tagline ?? `Xem menu và đặt món online tại ${store.name}.`;
  return {
    title: `${store.name} — Menu & đặt món`,
    description,
    openGraph: {
      title: store.name,
      description,
      type: 'website',
      locale: 'vi_VN',
    },
  };
}

export default async function HomePage() {
  const slug = getStoreSlug();
  const brand = getBrand(slug);
  const [store, catalog] = await Promise.all([
    getStore(slug),
    getCatalog(slug),
  ]);

  const categories: MenuCategory[] = catalog.categories.map((category, i) => ({
    ...category,
    tint: TINTS[i % TINTS.length],
  }));
  const products = catalog.categories.flatMap((c) =>
    c.products.map(({ id, name, price, priceMax, isMarketPrice }) => ({
      id,
      name,
      price,
      priceMax,
      isMarketPrice,
    })),
  );
  const logoUrl = store.branding.logo
    ? storeAsset(slug, store.branding.logo)
    : undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(restaurantJsonLd(store, catalog)),
        }}
      />
      <SiteHeader
        name={store.name}
        monogram={brand.monogram}
        logoUrl={logoUrl}
      />
      <Hero
        store={store}
        eyebrow={brand.heroEyebrow}
      />
      <MenuTabs categories={categories} />
      <main
        id="menu"
        className="mx-auto flex max-w-[1440px] items-start gap-8 px-4 pb-2 pt-4 sm:px-6 lg:px-8">
        <MenuList
          categories={categories}
          monogram={brand.monogram}
          logoUrl={logoUrl}
          storeSlug={slug}
          searchHint={brand.searchHint}
          featuredBadge={brand.featuredBadge}
        />
        <CartPanel monogram={brand.monogram} />
      </main>
      <SiteFooter
        store={store}
        monogram={brand.monogram}
      />
      <MobileCart />
      <PaymentDialog
        storeSlug={slug}
        payment={store.payment}
      />
      <ProductDialog
        storeSlug={slug}
        monogram={brand.monogram}
        logoUrl={logoUrl}
        featuredBadge={brand.featuredBadge}
      />
      <CartSync products={products} />
    </>
  );
}
