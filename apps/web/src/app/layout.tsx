import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Bitter } from 'next/font/google';
import { Suspense } from 'react';
import '@brands/index';
import { CartHydrator, UrlStateSync } from '@/components/state-sync';
import { getStoreSlug } from '@/config/store';
import './globals.css';

const bitter = Bitter({
  variable: '--font-bitter',
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700', '800'],
});

const beVietnam = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export const viewport: Viewport = {
  themeColor: '#1e4d36',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const storeSlug = getStoreSlug();

  return (
    <html
      lang="vi"
      data-brand={storeSlug}
      className={`${bitter.variable} ${beVietnam.variable}`}
    >
      <body className="min-h-dvh">
        {children}
        <CartHydrator storeSlug={storeSlug} />
        <Suspense fallback={null}>
          <UrlStateSync />
        </Suspense>
      </body>
    </html>
  );
}
