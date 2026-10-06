export interface ScheduleConfig {
  /** "HH:mm", store local time */
  firstSlot: string;
  /** "HH:mm", last slot that can be picked */
  lastSlot: string;
  stepMinutes: number;
}

/** Per-store presentation settings. Store data (name, phone, menu) lives in the API. */
export interface BrandConfig {
  /** Short mark used when the store has no logo image (header, placeholders). */
  monogram: string;
  /** Small uppercase line above the store name in the hero. */
  heroEyebrow?: string;
  /** Corner ribbon on featured products outside the Featured tab, e.g. "Best seller". */
  featuredBadge?: string;
  /** Shown when a search has no results. */
  searchHint?: string;
  schedule: ScheduleConfig;
}
