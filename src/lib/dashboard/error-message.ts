/**
 * SARIRO — what actually went wrong
 * =========================================================
 * A Supabase error is NOT an `Error`. It is a plain object:
 *
 *     { message, details, hint, code }
 *
 * So the idiom that was in thirteen places in admin-data.ts —
 *
 *     err instanceof Error ? err.message : 'Unknown error'
 *
 * — threw away the message on every database failure and reported "Unknown
 * error" instead. That is worse than no message at all, because it looks like
 * the code tried.
 *
 * It hid a real one for weeks: confirming a Public Speaking enrolment failed on
 * a CHECK constraint (`chk_enr_level` refused the level 'focus'), and the admin
 * screen said "Unknown error". The course had zero enrolments and 46 authored
 * lessons nobody could reach, and the string on the screen pointed nowhere.
 */

/** The most useful sentence available about a thrown value. */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof Error && err.message) return err.message;

  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };

    // Postgres check-constraint violations name the constraint and nothing
    // else useful, so the hint and details are worth keeping alongside it.
    const parts = [e.message, e.details, e.hint]
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0);

    if (parts.length > 0) {
      const text = parts.join(' — ');
      return typeof e.code === 'string' && e.code ? `${text} (${e.code})` : text;
    }
  }

  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}
