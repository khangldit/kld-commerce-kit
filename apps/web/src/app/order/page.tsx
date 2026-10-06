import { getBrand } from '@brands/index';
import type { Metadata } from 'next';
import { Checkout } from '@/components/order/checkout';
import { CartSync } from '@/components/state-sync';
import { getStoreSlug } from '@/config/store';
import { getCatalog, getStore } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore(getStoreSlug());
  return {
    title: `Đặt món — ${store.name}`,
    robots: { index: false },
  };
}

export default async function OrderPage() {
  const slug = getStoreSlug();
  const brand = getBrand(slug);
  const [store, catalog] = await Promise.all([getStore(slug), getCatalog(slug)]);
  const products = catalog.categories.flatMap((c) =>
    c.products.map(({ id, name, price, priceMax, isMarketPrice }) => ({
      id,
      name,
      price,
      priceMax,
      isMarketPrice,
    })),
  );

  return (
    <>
      <Checkout
        storeSlug={slug}
        storeName={store.name}
        storePhone={store.contact.phone}
        monogram={brand.monogram}
        schedule={brand.schedule}
      />
      <CartSync products={products} />
    </>
  );
}
