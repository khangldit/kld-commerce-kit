import type { PublicCatalog, PublicStore } from '@kld/shared';

/** schema.org Restaurant + Menu for search engines. */
export function restaurantJsonLd(store: PublicStore, catalog: PublicCatalog) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: store.name,
    description: store.branding.tagline,
    telephone: store.contact.phone,
    logo: store.branding.logo ? `/brands/${store.slug}/${store.branding.logo}` : undefined,
    address: store.contact.address,
    hasMap: store.contact.mapUrl,
    geo: store.contact.geo && {
      '@type': 'GeoCoordinates',
      latitude: store.contact.geo.lat,
      longitude: store.contact.geo.lng,
    },
    servesCuisine: 'Vietnamese',
    currenciesAccepted: 'VND',
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: catalog.categories.map((category) => ({
        '@type': 'MenuSection',
        name: category.name,
        hasMenuItem: category.products.map((product) => ({
          '@type': 'MenuItem',
          name: product.name,
          description: product.description,
          offers: product.isMarketPrice
            ? undefined
            : product.priceMax
              ? {
                  '@type': 'AggregateOffer',
                  lowPrice: product.price,
                  highPrice: product.priceMax,
                  priceCurrency: 'VND',
                }
              : { '@type': 'Offer', price: product.price, priceCurrency: 'VND' },
        })),
      })),
    },
  };
}

/** Serialize for a <script type="application/ld+json">, safe against `</script>`. */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
