/**
 * SARIRO — when a teacher can settle, and when we settle for them
 * =========================================================
 * V2 §40-45. Pure date arithmetic, no I/O, so the rule that decides when
 * somebody gets paid can be tested rather than trusted.
 *
 * ── The rule ────────────────────────────────────────────────────────────────
 * §41  A month becomes settleable on the 1st of the month after it.
 * §42  If the teacher has not settled by the 5th at 10:00 AM IST, we settle it
 *      for them and record that it was automatic.
 *
 * So at any moment there are two months in play: the one that closed and is
 * waiting to be settled, and the one still accruing. Showing only one of them
 * is what makes teachers ask "where did this month's classes go?".
 *
 * ── Why a fixed offset and not a timezone library ───────────────────────────
 * The rule is written in IST and India has no daylight saving — the offset has
 * been +05:30 since 1945 and is not politically live. A fixed offset is exact
 * here, and it means this file has no dependency that could shift a payday.
 *
 * The deliberate consequence: a teacher in another country settles on India's
 * calendar, not their own. That is correct — it is one company payroll, and a
 * cycle that moved with each teacher's location would produce two teachers
 * being paid for different months on the same day.
 *
 * ── What replaced what ──────────────────────────────────────────────────────
 * The previous rule was "the cycle closes on the 30th", which paid a variable
 * number of days (February short, March long) and had no defined behaviour for
 * a teacher who never clicked. Both are fixed here.
 */

/** India Standard Time. +05:30, no daylight saving, unchanged since 1945. */
export const IST_OFFSET_MINUTES = 330;

/** §41 — a closed month opens for settlement on the 1st. */
export const SETTLEMENT_OPENS_ON_DAY = 1;
/** §42 — and settles itself on the 5th at 10:00 IST. */
export const AUTO_SETTLE_ON_DAY = 5;
export const AUTO_SETTLE_AT_HOUR_IST = 10;

const MS_PER_DAY = 86_400_000;

/** The UTC instant of a wall-clock time in India. */
function istToUtc(year: number, month1to12: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60_000);
}

/** What the calendar in India says at this instant. */
export function istParts(at: Date | string = new Date()): {
  year: number; month: number; day: number; hour: number; minute: number;
} {
  const d = typeof at === 'string' ? new Date(at) : at;
  const shifted = new Date(d.getTime() + IST_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface SettlementWindow {
  /** Sortable key for the month being settled, e.g. '2026-08'. */
  month: string;
  /** 'August 2026' — what the teacher sees. */
  label: string;
  /** First instant of the month, as UTC ISO. */
  periodStart: string;
  /** First instant of the NEXT month — exclusive, so no class lands in two months. */
  periodEnd: string;
  /** §41 — 1st of the following month, 00:00 IST. */
  opensAt: string;
  /** §42 — 5th of the following month, 10:00 IST. */
  autoSettlesAt: string;
}

export function windowForMonth(year: number, month1to12: number): SettlementWindow {
  const nextYear = month1to12 === 12 ? year + 1 : year;
  const nextMonth = month1to12 === 12 ? 1 : month1to12 + 1;

  return {
    month: `${year}-${String(month1to12).padStart(2, '0')}`,
    label: `${MONTH_NAMES[month1to12 - 1]} ${year}`,
    periodStart: istToUtc(year, month1to12, 1).toISOString(),
    periodEnd: istToUtc(nextYear, nextMonth, 1).toISOString(),
    opensAt: istToUtc(nextYear, nextMonth, SETTLEMENT_OPENS_ON_DAY).toISOString(),
    autoSettlesAt: istToUtc(nextYear, nextMonth, AUTO_SETTLE_ON_DAY, AUTO_SETTLE_AT_HOUR_IST).toISOString(),
  };
}

/** The month that has closed and is waiting to be settled. */
export function currentSettlementWindow(now: Date | string = new Date()): SettlementWindow {
  const { year, month } = istParts(now);
  return month === 1 ? windowForMonth(year - 1, 12) : windowForMonth(year, month - 1);
}

/** The month still running. Its classes are earning; it cannot be settled yet. */
export function accruingWindow(now: Date | string = new Date()): SettlementWindow {
  const { year, month } = istParts(now);
  return windowForMonth(year, month);
}

/** §41 — has this month's settlement opened? */
export function isOpen(w: SettlementWindow, now: Date | string = new Date()): boolean {
  const t = typeof now === 'string' ? Date.parse(now) : now.getTime();
  return t >= Date.parse(w.opensAt);
}

/**
 * §42 — is it past the moment we settle on the teacher's behalf?
 *
 * Exactly 10:00:00 IST counts as due. A rule written as "on the 5th at 10 AM"
 * that fires at 10:00:01 is the same rule; one that waits until 10:01 is not.
 */
export function isAutoSettleDue(w: SettlementWindow, now: Date | string = new Date()): boolean {
  const t = typeof now === 'string' ? Date.parse(now) : now.getTime();
  return t >= Date.parse(w.autoSettlesAt);
}

/** Whole days from now until an instant, rounded up. Never negative. */
export function daysUntil(iso: string, now: Date | string = new Date()): number {
  const t = typeof now === 'string' ? Date.parse(now) : now.getTime();
  return Math.max(0, Math.ceil((Date.parse(iso) - t) / MS_PER_DAY));
}

export type SettlementState = 'open' | 'auto_due' | 'waiting';

/** Everything the settlement screen needs to say, decided in one place. */
export function describeSettlement(now: Date | string = new Date()): {
  settling: SettlementWindow;
  accruing: SettlementWindow;
  state: SettlementState;
  /** §41 — "Settlement available in X days", for the month still accruing. */
  daysUntilNextOpens: number;
  /** §42 — how long before it settles itself. */
  daysUntilAuto: number;
  headline: string;
} {
  const settling = currentSettlementWindow(now);
  const accruing = accruingWindow(now);

  const state: SettlementState = isAutoSettleDue(settling, now)
    ? 'auto_due'
    : isOpen(settling, now)
      ? 'open'
      : 'waiting';

  const daysUntilAuto = daysUntil(settling.autoSettlesAt, now);

  return {
    settling,
    accruing,
    state,
    daysUntilNextOpens: daysUntil(accruing.opensAt, now),
    daysUntilAuto,
    headline:
      state === 'auto_due'
        ? `${settling.label} settles automatically now`
        : state === 'open'
          ? daysUntilAuto <= 1
            ? `${settling.label} settles automatically today unless you settle it`
            : `${settling.label} is ready — settles automatically in ${daysUntilAuto} days`
          : `${settling.label} opens on ${new Date(settling.opensAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}`,
  };
}

/** Does a class date belong to this settlement window? */
export function isInWindow(classDateIso: string, w: SettlementWindow): boolean {
  const t = Date.parse(classDateIso);
  if (!Number.isFinite(t)) return false;
  return t >= Date.parse(w.periodStart) && t < Date.parse(w.periodEnd);
}
