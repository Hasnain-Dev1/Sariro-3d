/**
 * SARIRO — a write that is allowed to fail, but not allowed to fail silently
 * ============================================================================
 * Plenty of writes in this codebase genuinely should not take a request down
 * with them. A notification that does not send is worse than nothing, but it
 * is much better than a parent being told their booking failed when the class
 * is in the diary.
 *
 * The house pattern for that was:
 *
 *     await admin.from('x').insert(row).then(() => {}, () => {});
 *
 * which is correct about the first part and catastrophic about the second. On
 * 10 Sep 2026 exactly that line, on student_leads, hid a CHECK constraint
 * rejecting every row the public booking form wrote. The route returned 200,
 * the class was booked, and NO LEAD HAD EVER BEEN CREATED — for months, with
 * nothing anywhere to notice. Every family who booked their own free class was
 * invisible to the sales side.
 *
 * "Non-fatal" was implemented as "unobserved", and those are not the same
 * thing. This makes the difference impossible to write by accident: the
 * failure still does not propagate, and it always reaches the log with a name
 * attached.
 */

/** Anything awaitable that reports failure the way PostgREST does. */
type Attempt<T> = PromiseLike<{ error?: { message?: string; code?: string } | null } & T>;

/**
 * Run a write that must not break the request, and say so when it breaks.
 *
 * `label` is what appears in the log — make it the thing a person would search
 * for at 2am: "self-book: trial seat", not "insert failed".
 */
export async function bestEffort<T>(label: string, attempt: Attempt<T>): Promise<boolean> {
  try {
    const result = await attempt;
    const error = (result as { error?: { message?: string; code?: string } | null })?.error;
    if (error) {
      console.warn(`[best-effort] ${label} was rejected: ${error.code ?? ''} ${error.message ?? ''}`.trim());
      return false;
    }
    return true;
  } catch (err) {
    // A thrown error — a network drop, a client that gave up — is still a
    // failure the log should carry.
    console.warn(`[best-effort] ${label} threw:`, err instanceof Error ? err.message : err);
    return false;
  }
}
