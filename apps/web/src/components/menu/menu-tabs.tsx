'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUi } from '@/stores/ui';
import {
  ALL_TAB,
  FEATURED_TAB,
  defaultTab,
  hasFeaturedProducts,
  resolveTab,
  type MenuCategory,
} from './menu-model';

export function MenuTabs({ categories }: { categories: MenuCategory[] }) {
  const rawTab = useUi((s) => s.tab);
  const searching = useUi((s) => s.query.trim() !== '');
  const active = resolveTab(rawTab, categories);
  const rowRef = useRef<HTMLDivElement>(null);
  // Which ends of the tab row are cut off (drives the ‹ › arrows)
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const left = row.scrollLeft > 4;
    const right = row.scrollLeft + row.clientWidth < row.scrollWidth - 4;
    setOverflow((o) => (o.left === left && o.right === right ? o : { left, right }));
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    updateOverflow();
    row.addEventListener('scroll', updateOverflow, { passive: true });
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(row);
    return () => {
      row.removeEventListener('scroll', updateOverflow);
      observer.disconnect();
    };
  }, [updateOverflow]);

  function scrollTabs(direction: -1 | 1) {
    const row = rowRef.current;
    row?.scrollBy({ left: direction * row.clientWidth * 0.7, behavior: 'smooth' });
  }

  const tabs = [
    ...(hasFeaturedProducts(categories)
      ? [{ id: FEATURED_TAB, label: '⭐ Món nổi bật' }]
      : []),
    { id: ALL_TAB, label: 'Tất cả' },
    ...categories.map((c) => ({ id: c.slug, label: c.name })),
  ];

  // Keep the active tab visible in the horizontally scrolling row
  useEffect(() => {
    rowRef.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  function select(id: string) {
    const { setTab, setQuery } = useUi.getState();
    setTab(id);
    setQuery('');

    const url = new URL(window.location.href);
    if (id === defaultTab(categories)) url.searchParams.delete('c');
    else url.searchParams.set('c', id);
    window.history.replaceState(null, '', url);

    // If the reader is deep in the list, jump back to the top of the menu
    const menu = document.getElementById('menu');
    if (menu && menu.getBoundingClientRect().top < 0) {
      menu.scrollIntoView({ block: 'start' });
    }
  }

  return (
    <nav
      aria-label="Danh mục món"
      className="sticky top-[var(--header-h)] z-[15] border-b border-line bg-bg"
    >
      <div className="relative mx-auto max-w-[1440px]">
        <div
          ref={rowRef}
          className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-4 py-2.5 sm:px-6 lg:px-8"
        >
          {tabs.map((tab) => {
            const on = !searching && tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={on}
                onClick={() => select(tab.id)}
                className={`h-11 flex-none whitespace-nowrap rounded-pill border-[1.5px] px-[18px] font-semibold transition-colors ${
                  on
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-line bg-surface text-ink hover:border-primary'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {overflow.left && (
          <TabArrow direction="left" onClick={() => scrollTabs(-1)} />
        )}
        {overflow.right && (
          <TabArrow direction="right" onClick={() => scrollTabs(1)} />
        )}
      </div>
    </nav>
  );
}

/** Round arrow over a fade, shown only on the side that has hidden tabs. */
function TabArrow({
  direction,
  onClick,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
}) {
  const left = direction === 'left';
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 flex w-16 items-center ${
        left
          ? 'left-0 justify-start bg-[linear-gradient(90deg,var(--c-bg)_45%,transparent)] pl-1.5 sm:pl-3'
          : 'right-0 justify-end bg-[linear-gradient(270deg,var(--c-bg)_45%,transparent)] pr-1.5 sm:pr-3'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={left ? 'Xem danh mục trước' : 'Xem thêm danh mục'}
        className="pointer-events-auto grid size-9 place-items-center rounded-full border border-line bg-surface text-xl leading-none text-ink shadow-card hover:border-primary hover:text-primary"
      >
        <span aria-hidden className="-mt-0.5">
          {left ? '‹' : '›'}
        </span>
      </button>
    </div>
  );
}
