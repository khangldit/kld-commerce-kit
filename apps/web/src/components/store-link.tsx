'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { withTableParam } from '@/lib/table-mode';
import { useUi } from '@/stores/ui';

/** Internal link that keeps the table QR param (`?t=`) while in table mode. */
export function StoreLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const table = useUi((s) => s.table);
  return <Link href={withTableParam(href, table)} {...props} />;
}

export function useStoreHref(href: string): string {
  const table = useUi((s) => s.table);
  return withTableParam(href, table);
}
