/**
 * SARIRO — what counts as waiting, for a teacher and a learner
 * ============================================================================
 * The Today queue counts from the same rows the panels show (see
 * components/ops/attention-provider.tsx). Where a panel's rule is more than
 * "the length of a list" — a register is outstanding, a trial is close, a
 * course is paused — the rule lives here, pure, so the badge on the sidebar and
 * the list on the page cannot drift apart, and the edges are tested.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export interface ClassRow {
  id: string;
  status: string;
  slot_start: string;
  slot_end: string;
  is_trial?: boolean | null;
  attendance_finalized_at?: string | null;
}

/** How far back an unmarked register is still chased. Older ones are history. */
export const REGISTER_LOOKBACK_DAYS = 7;

/**
 * Classes that are over, went ahead, and whose register is still open.
 *
 * Trials are left out: a trial's register is the write-up, which has its own
 * item, and asking for both would count one class twice. Cancelled and no-show
 * classes have nothing to mark.
 */
export function registersToMark<T extends ClassRow>(bookings: readonly T[], now: number = Date.now()): T[] {
  return bookings
    .filter((b) => {
      if (b.is_trial) return false;
      if (b.status !== 'scheduled' && b.status !== 'completed') return false;
      if (b.attendance_finalized_at) return false;
      const end = Date.parse(b.slot_end);
      return Number.isFinite(end) && end <= now && now - end <= REGISTER_LOOKBACK_DAYS * DAY;
    })
    .sort((a, b) => Date.parse(a.slot_end) - Date.parse(b.slot_end));
}

/** Trials still to be taught, soonest first, within `withinHours`. */
export function trialsAhead<T extends ClassRow>(bookings: readonly T[], now: number = Date.now(), withinHours = 24 * 7): T[] {
  return bookings
    .filter((b) => {
      if (!b.is_trial || b.status !== 'scheduled') return false;
      const end = Date.parse(b.slot_end);
      const start = Date.parse(b.slot_start);
      return Number.isFinite(start) && end > now && start - now <= withinHours * HOUR;
    })
    .sort((a, b) => Date.parse(a.slot_start) - Date.parse(b.slot_start));
}

/** The catch-up lessons a teacher has not yet put in the diary. */
export function catchupsToArrange(students: readonly { summary: { unscheduled: number } }[]): number {
  return students.reduce((n, s) => n + Math.max(0, s.summary?.unscheduled ?? 0), 0);
}

/** Classes starting later today (the reader's own day) or already running. */
export function classesToday(slots: readonly { slot_start: string; slot_end: string; status: string }[], now: Date = new Date()): number {
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const t = now.getTime();
  return slots.filter((s) => {
    if (s.status !== 'scheduled') return false;
    const start = Date.parse(s.slot_start);
    const end = Date.parse(s.slot_end);
    return Number.isFinite(start) && end > t && start <= endOfDay.getTime();
  }).length;
}

/**
 * A learner's plan, as the two queue items read it.
 *   paused   courses stopped because credits ran out — every active course
 *   low      classes left, when it is one or two and nothing is paused yet
 */
export function planState(input: { balance: number; studentStatus: string | null; activeCourses: number }): { paused: number; low: number } {
  const status = (input.studentStatus ?? 'active').toLowerCase();
  if (status !== 'active') return { paused: Math.max(1, input.activeCourses), low: 0 };
  const left = Math.floor(input.balance);
  return { paused: 0, low: left >= 1 && left <= 2 ? left : 0 };
}

/**
 * Speaking missions waiting today: today's quest if it is not passed, plus the
 * missions left on the level the learner is part-way through. A level they have
 * not started is not "waiting" — nobody likes a to-do list of forty-six levels.
 */
export function speakingWaiting(state: {
  daily: { passed: boolean };
  worlds: readonly { levels: readonly { status: { cleared: boolean; missions: readonly { passed: boolean; tries: number }[] } }[] }[];
}): number {
  const daily = state.daily.passed ? 0 : 1;
  for (const w of state.worlds) {
    for (const l of w.levels) {
      if (l.status.cleared) continue;
      const started = l.status.missions.some((m) => m.tries > 0);
      if (started) return daily + l.status.missions.filter((m) => !m.passed).length;
    }
  }
  return daily;
}
