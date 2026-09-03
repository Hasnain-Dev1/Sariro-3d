/**
 * SARIRO — the date ranges every dashboard filters by
 * =========================================================
 * V2 §73. Pure functions, no I/O.
 *
 * ── One definition of "this month", used everywhere ─────────────────────────
 * The failure this exists to prevent is two screens disagreeing. If the
 * expenses page computes "this month" from the browser's local midnight and the
 * payout page computes it from the settlement window, a company operating from
 * India with teachers abroad will see two different totals for the same words
 * and have no way to tell which is right.
 *
 * So the boundaries are India's, matching the settlement cycle in
 * settlement-period.ts. A teacher in London filtering by "today" sees the
 * company's today, which is the one the books are kept in.
 *
 * ── Ranges are half-open ────────────────────────────────────────────────────
 * [from, to) — inclusive start, exclusive end. A class at 23:59 on the last day
 * of the month belongs to that month and to no other, and no row is ever
 * counted twice by two adjacent ranges.
 */

export const IST_OFFSET_MINUTES = 330;

export type RangePreset = 'today' | 'week' | 'month' | 'prev_month' | 'all' | 'custom';

export interface DateRange {
  /** Inclusive. UTC ISO. */
  from: string;
  /** Exclusive. UTC ISO. */
  to: string;
  label: string;
  preset: RangePreset;
}

const MS_PER_DAY = 86_400_000;

/** A UTC instant from a wall-clock time in India. */
function istToUtc(y: number, m: number, d: number, h = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h) - IST_OFFSET_MINUTES * 60_000);
}

function istParts(at: Date) {
  const shifted = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    /** 0 = Sunday, matching Date.getUTCDay(). */
    weekday: shifted.getUTCDay(),
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export const PRESET_LABEL: Record<Exclude<RangePreset, 'custom'>, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  prev_month: 'Previous month',
  all: 'All time',
};

/**
 * Resolve a preset into real boundaries.
 *
 * `custom` needs `from` and `to` as YYYY-MM-DD, read as India dates. The `to`
 * date is inclusive to the person choosing it — picking 30 September means "up
 * to the end of the 30th" — so it is pushed to the following midnight here.
 */
export function resolveRange(
  preset: RangePreset,
  custom?: { from?: string; to?: string },
  now: Date = new Date()
): DateRange {
  const { year, month, day, weekday } = istParts(now);

  switch (preset) {
    case 'today': {
      const start = istToUtc(year, month, day);
      return {
        from: start.toISOString(),
        to: new Date(start.getTime() + MS_PER_DAY).toISOString(),
        label: 'Today',
        preset,
      };
    }

    case 'week': {
      // Monday-first: a working week, not a calendar one starting Sunday.
      const daysSinceMonday = (weekday + 6) % 7;
      const start = new Date(istToUtc(year, month, day).getTime() - daysSinceMonday * MS_PER_DAY);
      return {
        from: start.toISOString(),
        to: new Date(start.getTime() + 7 * MS_PER_DAY).toISOString(),
        label: 'This week',
        preset,
      };
    }

    case 'month': {
      const nextY = month === 12 ? year + 1 : year;
      const nextM = month === 12 ? 1 : month + 1;
      return {
        from: istToUtc(year, month, 1).toISOString(),
        to: istToUtc(nextY, nextM, 1).toISOString(),
        label: `${MONTHS[month - 1]} ${year}`,
        preset,
      };
    }

    case 'prev_month': {
      const prevY = month === 1 ? year - 1 : year;
      const prevM = month === 1 ? 12 : month - 1;
      return {
        from: istToUtc(prevY, prevM, 1).toISOString(),
        to: istToUtc(year, month, 1).toISOString(),
        label: `${MONTHS[prevM - 1]} ${prevY}`,
        preset,
      };
    }

    case 'custom': {
      const parse = (s?: string) => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
        return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
      };
      const a = parse(custom?.from);
      const b = parse(custom?.to);
      // An incomplete custom range is not an error and not an empty result —
      // it falls back to everything, which is what the control shows before
      // both dates are picked.
      if (!a || !b) return resolveRange('all', undefined, now);

      const start = istToUtc(a.y, a.m, a.d);
      // Inclusive of the chosen end date.
      const end = new Date(istToUtc(b.y, b.m, b.d).getTime() + MS_PER_DAY);
      if (end <= start) return resolveRange('all', undefined, now);

      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `${custom!.from} to ${custom!.to}`,
        preset,
      };
    }

    case 'all':
    default:
      return {
        from: new Date(0).toISOString(),
        // Far enough ahead to include anything scheduled, without pretending
        // to be infinity.
        to: istToUtc(year + 50, 1, 1).toISOString(),
        label: 'All time',
        preset: 'all',
      };
  }
}

/** Half-open membership: from <= t < to. */
export function inRange(iso: string | null | undefined, range: DateRange): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return t >= Date.parse(range.from) && t < Date.parse(range.to);
}

/**
 * A plain YYYY-MM-DD column, read as an India date.
 *
 * `expenses.spent_on` is a date, not a timestamp. Parsing it as UTC midnight
 * puts it 5.5 hours before India's midnight, so an expense on the 1st would
 * fall into the previous month.
 */
export function dateInRange(ymd: string | null | undefined, range: DateRange): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd ?? '');
  if (!m) return false;
  const t = istToUtc(Number(m[1]), Number(m[2]), Number(m[3])).getTime();
  return t >= Date.parse(range.from) && t < Date.parse(range.to);
}
