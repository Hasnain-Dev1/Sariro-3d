/**
 * SARIRO — Recurring schedule generation (pure, testable)
 * =========================================================
 * Turns a cohort_schedules rule into concrete booking slots as exact UTC
 * instants. The class time is a wall-clock time anchored to an IANA timezone,
 * so each occurrence is converted per-date → DST transitions are handled
 * correctly (a 9:00 AM class stays 9:00 AM local across a DST change).
 *
 * No external deps: uses Intl to read the tz offset for a given instant.
 */

export interface ScheduleRule {
  startDate: string;        // 'YYYY-MM-DD'
  daysOfWeek: number[];     // 0=Sun .. 6=Sat (1 entry for 1/wk, 2 for 2/wk)
  timeLocal: string;        // 'HH:MM' or 'HH:MM:SS'
  durationMin: number;      // class length
  timezone: string;         // IANA tz, e.g. 'Asia/Kolkata'
}

export interface GeneratedSlot {
  slotStart: string;        // ISO UTC
  slotEnd: string;          // ISO UTC
}

/** Offset (ms) of `tz` at the given UTC instant: localWallClock - utc. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;
  const asUTC = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour), Number(p.minute), Number(p.second)
  );
  return asUTC - utcMs;
}

/**
 * Convert a wall-clock date+time in `tz` to the exact UTC instant.
 * Two-pass so it's correct right around DST boundaries.
 */
export function zonedWallTimeToUTC(
  year: number, month1: number, day: number,
  hour: number, minute: number, tz: string
): Date {
  const naiveUTC = Date.UTC(year, month1 - 1, day, hour, minute, 0);
  let utc = naiveUTC - tzOffsetMs(naiveUTC, tz);
  // Re-check the offset at the computed instant and correct once more.
  utc = naiveUTC - tzOffsetMs(utc, tz);
  return new Date(utc);
}

function parseHM(timeLocal: string): { hour: number; minute: number } {
  const [h, m] = timeLocal.split(':');
  return { hour: Number(h) || 0, minute: Number(m) || 0 };
}

/**
 * Generate the next `count` slots for a schedule, on/after `after` (default now).
 * Walks day-by-day from max(startDate, after), emitting a slot whenever the
 * weekday matches and the instant is still in the future.
 */
export function generateOccurrences(
  rule: ScheduleRule,
  count: number,
  after: Date = new Date()
): GeneratedSlot[] {
  const { hour, minute } = parseHM(rule.timeLocal);
  const days = new Set(rule.daysOfWeek);
  const slots: GeneratedSlot[] = [];

  // Start cursor at the later of start_date and `after`, at local midnight-ish.
  const start = new Date(rule.startDate + 'T00:00:00Z');
  const cursor = new Date(Math.max(start.getTime(), after.getTime()));
  // Back up to the morning of the cursor day so we don't skip a same-day class.
  cursor.setUTCHours(0, 0, 0, 0);

  // Safety cap: never loop more than ~2 years of days.
  const MAX_DAYS = 366 * 2;
  for (let i = 0; i < MAX_DAYS && slots.length < count; i++) {
    const d = new Date(cursor.getTime() + i * 86_400_000);
    // Weekday in the schedule's timezone (not the server's).
    const wd = weekdayInZone(d, rule.timezone);
    if (!days.has(wd)) continue;

    const ymd = ymdInZone(d, rule.timezone);
    const slotStart = zonedWallTimeToUTC(ymd.year, ymd.month, ymd.day, hour, minute, rule.timezone);
    if (slotStart.getTime() < after.getTime()) continue; // already passed today

    const slotEnd = new Date(slotStart.getTime() + rule.durationMin * 60_000);
    slots.push({ slotStart: slotStart.toISOString(), slotEnd: slotEnd.toISOString() });
  }
  return slots;
}

/** Weekday (0=Sun..6=Sat) of an instant, as seen in `tz`. */
function weekdayInZone(d: Date, tz: string): number {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(d);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
}

/** Calendar Y/M/D of an instant, as seen in `tz`. */
function ymdInZone(d: Date, tz: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
}

/** Map classes/week (1 or 2) to the required number of weekday selections. */
export function requiredDayCount(classesPerWeek: number): number {
  return classesPerWeek === 2 ? 2 : 1;
}
