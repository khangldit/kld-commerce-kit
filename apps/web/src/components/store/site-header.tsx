import { CartButton } from '@/components/cart/cart-button';
import { StoreMark } from '@/components/ui';
import { StoreLink } from '@/components/store-link';

export function SiteHeader({
  name,
  monogram,
  logoUrl,
}: {
  name: string;
  monogram: string;
  logoUrl?: string;
}) {
  return (
    <header className="sticky top-0 z-20 h-[var(--header-h)] border-b border-line bg-surface">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <StoreLink
          href="/"
          className="flex min-w-0 items-center gap-2.5 text-ink no-underline"
        >
          <StoreMark monogram={monogram} logoUrl={logoUrl} name={name} />
          <span className="truncate font-head text-lg font-bold">{name}</span>
        </StoreLink>
        <CartButton />
      </div>
    </header>
  );
}
