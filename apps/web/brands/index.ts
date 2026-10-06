import { chuBay } from './chu-bay/config';
import type { BrandConfig } from './types';

// Theme tokens for every brand; each file is scoped by `:root[data-brand=...]`
import './chu-bay/theme.css';

const brands: Record<string, BrandConfig> = {
  'chu-bay': chuBay,
};

export function getBrand(slug: string): BrandConfig {
  const brand = brands[slug];
  if (!brand) {
    throw new Error(`No brand config for store "${slug}" in apps/web/brands`);
  }
  return brand;
}

export type { BrandConfig, ScheduleConfig } from './types';
