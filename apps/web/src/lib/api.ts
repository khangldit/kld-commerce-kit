import {
  publicCatalogSchema,
  publicStoreSchema,
  type PublicCatalog,
  type PublicStore,
} from '@kld/shared';
import { cacheLife, cacheTag } from 'next/cache';
import type { z } from 'zod';
import { getApiUrl } from '@/config/store';

// Store info and menu are prerendered and refreshed in the background (ISR).
// The order total is always computed by the API, so a slightly stale menu is safe.
const MENU_CACHE = { stale: 300, revalidate: 300, expire: 86_400 };

async function getJson<T extends z.ZodType>(
  path: string,
  schema: T,
): Promise<z.infer<T>> {
  const url = `${getApiUrl()}${path}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  // Validate against the shared contract so API drift fails loudly
  return schema.parse(await response.json());
}

export async function getStore(slug: string): Promise<PublicStore> {
  'use cache';
  cacheLife(MENU_CACHE);
  cacheTag(`store:${slug}`);
  return getJson(`/stores/${encodeURIComponent(slug)}`, publicStoreSchema);
}

export async function getCatalog(slug: string): Promise<PublicCatalog> {
  'use cache';
  cacheLife(MENU_CACHE);
  cacheTag(`store:${slug}`);
  return getJson(
    `/stores/${encodeURIComponent(slug)}/catalog`,
    publicCatalogSchema,
  );
}

export async function getCurrentYear(): Promise<number> {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}
