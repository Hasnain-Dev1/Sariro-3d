/**
 * SARIRO — when a teacher is free, and what is left after the classes
 * ============================================================================
 * A teacher says "Monday 5-6 and 8-10". A seller, an admin or a parent then
 * needs the opposite question answered: given that, and given what is already
 * booked, which half-hours can I actually put a trial into?
 *
 * That is arithmetic, and arithmetic that decides whether a child and a
 * teacher both turn up at the same time. So it lives here as pure functions
 * over integers, not inside a component where the next edit can quietly break
 * it and nobody finds out until two people are staring at an empty room.
 *
 * ── Minutes from midnight, not strings ──────────────────────────────────────
 * Every window is `{ weekday, start, end }` where start and end are minutes
 * since 00:00. "17:00" is 1020. Overlap, merge and subtract are then integer
 * comparisons that cannot be got wrong by a timezone, a locale, or a Date
 * object that helpfully shifted itself.
 *
 * ── The timezone lives on the teacher, not on the window ────────────────────
 * A window means 5pm WHERE THE TEACHER IS. profiles.timezone already carries
 * that, and the existing schedule code converts at the edges. Storing an offset
 * per window would go wrong twice a year, in opposite directions, in different
 * countries.
 *
 * ── Half-open intervals ─────────────────────────────────────────────────────
 * A window covers [start, end). A class from 17:00 to 18:00 and one from 18:00
 * to 19:00 do not overlap. Getting this wrong is how a teacher ends up
 * double-booked on the hour, every hour.
 */

export const MINUTES_IN_DAY = 24 * 60;

/** 0 = Sunday, matching JavaScript's getDay() and the schedules table. */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export interface Window {
  weekday: number;
  /** Minutes from midnight, inclusive. */
  start: number;
  /** Minutes from midnight, exclusive. */
  end: number;
}

export interface Interval {
  start: number;
  end: number;
}

/* ── Times as text ────────────────────────────────────────────────────────── */

/**
 * "17:00", "5:00 PM", "5pm", "1700" → 1020. Null when it is not a time.
 *
 * Generous on input because this is typed by a teacher on a phone, and strict
 * on output because everything downstream is an integer.
 */
export function parseTime(raw: string | null | undefined): number | null {
  const s = (raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;

  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)?$/);
  if (!m) return null;

  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const suffix = m[3];

  if (minute > 59) return null;

  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix === 'pm' && hour !== 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
  } else if (hour > 24) {
    return null;
  }

  // 24:00 is a legal way to say "end of day" and only ever an end.
  if (hour === 24) return minute === 0 ? MINUTES_IN_DAY : null;
  if (hour > 23) return null;

  return hour * 60 + minute;
}

/** 1020 → "17:00". The stored, unambiguous form. */
export function formatTime(minutes: number): string {
  const m = Math.max(0, Math.min(MINUTES_IN_DAY, Math.round(minutes)));
  if (m === MINUTES_IN_DAY) return '24:00';
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** 1020 → "5:00 PM". What a teacher reads. */
export function formatTime12(minutes: number): string {
  const m = Math.max(0, Math.min(MINUTES_IN_DAY, Math.round(minutes)));
  if (m === MINUTES_IN_DAY) return '12:00 AM';
  const h24 = Math.floor(m / 60);
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m % 60).padStart(2, '0')} ${suffix}`;
}

/* ── Windows ──────────────────────────────────────────────────────────────── */

export interface WindowProblem {
  ok: false;
  reason: string;
}
export type WindowCheck = { ok: true } | WindowProblem;

/** The shortest window worth offering. Below this it is not a class. */
export const MIN_WINDOW_MINUTES = 30;

export function checkWindow(start: number, end: number): WindowCheck {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { ok: false, reason: 'Enter a start and an end time.' };
  }
  if (start < 0 || end > MINUTES_IN_DAY) {
    return { ok: false, reason: 'Times must be within one day.' };
  }
  if (end <= start) {
    // The single most common entry mistake: 8-10 typed as 8pm-10am.
    return { ok: false, reason: 'The end time has to be after the start time.' };
  }
  if (end - start < MIN_WINDOW_MINUTES) {
    return { ok: false, reason: `A window needs to be at least ${MIN_WINDOW_MINUTES} minutes.` };
  }
  return { ok: true };
}

/**
 * Sort, merge and de-duplicate one day's windows.
 *
 * Touching windows are merged: 5-6 and 6-7 is one window of 5-7, because that
 * is what it means and because leaving them apart makes every later
 * calculation carry a seam that has to be handled.
 */
export function mergeWindows(windows: Interval[]): Interval[] {
  const sorted = [...windows]
    .filter((w) => Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const out: Interval[] = [];
  for (const w of sorted) {
    const last = out[out.length - 1];
    if (last && w.start <= last.end) {
      last.end = Math.max(last.end, w.end);
    } else {
      out.push({ start: w.start, end: w.end });
    }
  }
  return out;
}

/** Everything in `windows` that is not covered by `busy`. */
export function subtractBusy(windows: Interval[], busy: Interval[]): Interval[] {
  const merged = mergeWindows(windows);
  const blocked = mergeWindows(busy);
  const out: Interval[] = [];

  for (const w of merged) {
    let cursor = w.start;
    for (const b of blocked) {
      if (b.end <= cursor) continue;      // finished before this window
      if (b.start >= w.end) break;        // starts after it — and they are sorted
      if (b.start > cursor) out.push({ start: cursor, end: Math.min(b.start, w.end) });
      cursor = Math.max(cursor, b.end);
      if (cursor >= w.end) break;
    }
    if (cursor < w.end) out.push({ start: cursor, end: w.end });
  }

  return out.filter((i) => i.end > i.start);
}

/* ── The question everybody actually asks ─────────────────────────────────── */

export interface SlotQuery {
  /** The teacher's declared windows for the day in question. */
  windows: Interval[];
  /** What is already in the diary that day. */
  busy: Interval[];
  /** How long the class is. */
  slotMinutes: number;
  /** Offer starts every N minutes. 30 gives 5:00, 5:30, 6:00… */
  stepMinutes?: number;
  /**
   * Minutes from midnight that have already passed, when the day is today.
   * Null for a future date. Without it, "book a trial" cheerfully offers this
   * morning.
   */
  earliestStart?: number | null;
}

/**
 * Every start time a class of `slotMinutes` fits into, free of what is booked.
 *
 * Returns starts rather than intervals because that is what a picker shows, and
 * because the end is always start + slotMinutes.
 */
export function freeSlots(q: SlotQuery): number[] {
  const slot = Math.max(1, Math.round(q.slotMinutes));
  const step = Math.max(5, Math.round(q.stepMinutes ?? 30));
  const floor = q.earliestStart ?? null;

  const open = subtractBusy(q.windows, q.busy);
  const starts: number[] = [];

  for (const gap of open) {
    /* Starts are aligned to the step from MIDNIGHT, not from the gap's own
       start — so a window beginning at 17:10 still offers 17:30, and every
       teacher's slots line up on the same grid. A ragged grid makes two
       teachers' free times impossible to compare at a glance. */
    let t = Math.ceil(gap.start / step) * step;
    if (t < gap.start) t = gap.start;
    for (; t + slot <= gap.end; t += step) {
      if (floor !== null && t < floor) continue;
      starts.push(t);
    }
  }

  return starts;
}

/** Does a proposed class fit entirely inside the free time? */
export function slotIsFree(q: Omit<SlotQuery, 'stepMinutes'> & { start: number }): boolean {
  const end = q.start + Math.max(1, Math.round(q.slotMinutes));
  if (q.earliestStart != null && q.start < q.earliestStart) return false;
  return subtractBusy(q.windows, q.busy).some((gap) => q.start >= gap.start && end <= gap.end);
}

/* ── Reading it back ──────────────────────────────────────────────────────── */

/** "5:00 PM – 6:00 PM, 8:00 PM – 10:00 PM" */
export function describeWindows(windows: Interval[]): string {
  const merged = mergeWindows(windows);
  if (merged.length === 0) return 'Not available';
  return merged.map((w) => `${formatTime12(w.start)} – ${formatTime12(w.end)}`).join(', ');
}

/** Total hours offered across a week, for a summary line. */
export function weeklyHours(windows: Window[]): number {
  const byDay = new Map<number, Interval[]>();
  for (const w of windows) {
    const list = byDay.get(w.weekday) ?? [];
    list.push({ start: w.start, end: w.end });
    byDay.set(w.weekday, list);
  }
  let minutes = 0;
  for (const list of byDay.values()) {
    for (const i of mergeWindows(list)) minutes += i.end - i.start;
  }
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * Where a UTC instant falls in somebody else's week.
 *
 * A window means 5pm WHERE THE TEACHER IS, and a slot arrives as an ISO
 * timestamp. Comparing them needs the instant expressed in the teacher's own
 * weekday and minute-of-day — not the server's, and not the booker's.
 *
 * Intl does the conversion, which means the IANA database handles daylight
 * saving rather than an offset we stored once and never revisited. A teacher in
 * London whose 5pm window was saved in January still means 5pm in July.
 *
 * Returns null for an unusable timestamp or an unknown zone, so a caller has to
 * decide what to do rather than being handed a plausible wrong answer.
 */
export function localWeekdayMinutes(
  iso: string | null | undefined,
  timeZone: string | null | undefined
): { weekday: number; minutes: number } | null {
  const t = Date.parse(iso ?? '');
  if (!Number.isFinite(t)) return null;

  const zone = (timeZone ?? '').trim();
  if (!zone) return null;

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(t));

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    if (dayIndex < 0) return null;

    // hour12:false yields "24" for midnight in some engines; both mean day start.
    const hour = Number(get('hour')) % 24;
    const minute = Number(get('minute'));
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

    return { weekday: dayIndex, minutes: hour * 60 + minute };
  } catch {
    // An invalid IANA zone throws rather than falling back to UTC.
    return null;
  }
}

/** Group a flat list into the seven days, each merged and sorted. */
export function byWeekday(windows: Window[]): Interval[][] {
  const days: Interval[][] = Array.from({ length: 7 }, () => []);
  for (const w of windows) {
    if (w.weekday >= 0 && w.weekday <= 6) days[w.weekday].push({ start: w.start, end: w.end });
  }
  return days.map((d) => mergeWindows(d));
}
