import { MAX_SCHEDULE_DAYS, STORE_TIME_ZONE } from '@kld/shared';
import type { ScheduleConfig } from '@brands/index';

// Asia/Ho_Chi_Minh has no daylight saving time, so the offset is fixed.
const STORE_UTC_OFFSET = '+07:00';
/** Earliest slot that can be picked = now + lead time. */
const LEAD_MINUTES = 30;
const DAYS_SHOWN = 7;
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export interface ScheduleDay {
  /** "2026-10-07" (store local date) */
  key: string;
  /** "Hôm nay" | "Ngày mai" | "T4" */
  top: string;
  /** "07/10" */
  date: string;
  /** "T4 07/10" */
  short: string;
  slots: string[];
}

const pad = (n: number) => String(n).padStart(2, '0');

function storeToday(now: Date): { y: number; m: number; d: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: STORE_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day) };
}

function allSlots(config: ScheduleConfig): string[] {
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const slots: string[] = [];
  for (
    let t = toMinutes(config.firstSlot);
    t <= toMinutes(config.lastSlot);
    t += config.stepMinutes
  ) {
    slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return slots;
}

/** ISO string with the store offset, e.g. "2026-10-07T19:00:00+07:00". */
export function toScheduledAt(dayKey: string, slot: string): string {
  return `${dayKey}T${slot}:00${STORE_UTC_OFFSET}`;
}

/**
 * The next days with their bookable slots. Today only keeps slots at least
 * LEAD_MINUTES ahead and is dropped when none are left.
 */
export function buildScheduleDays(
  config: ScheduleConfig,
  now = new Date(),
): ScheduleDay[] {
  const today = storeToday(now);
  const slots = allSlots(config);
  const earliest = now.getTime() + LEAD_MINUTES * 60_000;
  const days: ScheduleDay[] = [];

  for (let i = 0; days.length < DAYS_SHOWN && i <= MAX_SCHEDULE_DAYS; i++) {
    // Date.UTC handles month/year rollover; we only read the calendar fields
    const date = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
    const key = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    const daySlots =
      i === 0
        ? slots.filter((s) => Date.parse(toScheduledAt(key, s)) >= earliest)
        : slots;
    if (daySlots.length === 0) continue;

    const weekday = WEEKDAYS[date.getUTCDay()];
    const dm = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}`;
    days.push({
      key,
      top: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : weekday,
      date: dm,
      short: `${weekday} ${dm}`,
      slots: daySlots,
    });
  }
  return days;
}
