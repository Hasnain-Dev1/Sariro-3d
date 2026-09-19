/**
 * SARIRO — the register, filled in from who actually joined (pure)
 * ============================================================================
 * A student who presses "Join class" is written down by /api/student/join-class
 * with the moment they joined, and no teacher's name. That is most of the
 * register already: the teacher should only have to CONFIRM it — one tap for a
 * class of four — and change the odd child who joined another way.
 *
 *   joined by the class start + 10 minutes   → present
 *   joined later                              → late
 *   did not join through Sariro               → absent, unless the teacher says so
 *
 * Lateness never costs a student anything (it only ever costs the teacher); it
 * is recorded because a parent's report and the teacher's note both want it.
 */

export const LATE_AFTER_MINUTES = 10;

export type RegisterStatus = 'present' | 'late' | 'absent' | 'excused';

export function joinStatus(slotStart: string, joinedAt: string): 'present' | 'late' {
  const start = Date.parse(slotStart);
  const at = Date.parse(joinedAt);
  if (!Number.isFinite(start) || !Number.isFinite(at)) return 'present';
  return at - start > LATE_AFTER_MINUTES * 60_000 ? 'late' : 'present';
}

export interface RegisterRow {
  studentId: string;
  /** What session_attendance holds now, if anything. */
  status: string | null;
  /** 'teacher' when a teacher (or admin) marked it; 'join' when it came from the student joining. */
  source: 'teacher' | 'join' | null;
  /** For a join: when they joined. */
  joinedAt: string | null;
}

export interface Suggestion {
  studentId: string;
  status: RegisterStatus;
  /** Already confirmed by the teacher — the confirm leaves it as it is. */
  confirmed: boolean;
}

/** What "Confirm register" will save for each student. */
export function suggestRegister(rows: readonly RegisterRow[], slotStart: string): Suggestion[] {
  return rows.map((r) => {
    if (r.source === 'teacher' && r.status && ['present', 'late', 'absent', 'excused'].includes(r.status)) {
      return { studentId: r.studentId, status: r.status as RegisterStatus, confirmed: true };
    }
    if (r.source === 'join' && r.joinedAt) {
      return { studentId: r.studentId, status: r.status === 'late' ? 'late' : joinStatus(slotStart, r.joinedAt), confirmed: false };
    }
    return { studentId: r.studentId, status: 'absent', confirmed: false };
  });
}

/** One short line under a student's name in the register. */
export function joinLine(r: RegisterRow, slotStart: string, timeZone?: string | null): string {
  if (r.source === 'teacher') return 'Marked by you';
  if (r.source === 'join' && r.joinedAt) {
    const mins = Math.round((Date.parse(r.joinedAt) - Date.parse(slotStart)) / 60_000);
    const time = new Date(r.joinedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', ...(timeZone ? { timeZone } : {}) });
    if (mins <= 0) return `Joined at ${time}, before the start`;
    if (mins <= LATE_AFTER_MINUTES) return `Joined at ${time}, on time`;
    return `Joined at ${time} — ${mins} min late`;
  }
  return 'Did not join through Sariro';
}

/** "3 joined · 1 did not" — the summary above the roster. */
export function registerSummary(rows: readonly RegisterRow[]): string {
  const joined = rows.filter((r) => r.source === 'join' || (r.source === 'teacher' && (r.status === 'present' || r.status === 'late'))).length;
  const missing = rows.length - joined;
  return missing ? `${joined} joined · ${missing} did not` : `All ${rows.length} joined`;
}
