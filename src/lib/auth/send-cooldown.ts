'use client';

/**
 * SARIRO — one confirmation email per address per 30 seconds
 * =========================================================
 * Signing up sends an email. Nothing stopped the same address asking for
 * another one immediately, so a double-click sent two, and a script pointed at
 * the form could drain the mailbox's daily quota — at which point nobody's
 * confirmation link arrives, including the parents who paid.
 *
 * ── What this is, and what it is not ────────────────────────────────────────
 * This is a gate on OUR form. It stops double-clicks, impatient retries and
 * casual abuse, and it tells the person how long to wait instead of appearing
 * to do nothing.
 *
 * It is NOT the thing that stops a determined attacker. Supabase's anon key is
 * public by design — it ships in the page — so anyone can call the auth
 * endpoint directly and never touch this code at all. The only cap that holds
 * against that is the one on Supabase's side:
 *
 *     Authentication → Rate Limits → "Rate limit for sending emails"
 *
 * which stays at a low default even after custom SMTP is configured. Both
 * matter, and it would be a mistake to think this file is the protection.
 *
 * ── Why the timestamp is stored, not held in state ──────────────────────────
 * A cooldown in component state is over as soon as the page reloads, which is
 * the first thing an impatient person does. localStorage survives that. It is
 * per-browser, which is the right scope for the job it is doing here — it is a
 * courtesy to the user and a speed bump, not a security boundary.
 */

export const SEND_COOLDOWN_MS = 30_000;

const KEY_PREFIX = 'sariro:last-auth-email:';

/** Addresses differ only by case and surrounding space far more often than by intent. */
const keyFor = (email: string) => `${KEY_PREFIX}${email.trim().toLowerCase()}`;

/**
 * Milliseconds left before this address may be sent to again. Zero when it is
 * free to send.
 *
 * A stored time in the future — a clock that has been moved back, or a stale
 * value — is treated as "send now" rather than locking the address out for
 * however long the clock is wrong by.
 */
export function remainingCooldownMs(
  lastSentAt: number | null,
  now: number,
  windowMs: number = SEND_COOLDOWN_MS
): number {
  if (lastSentAt === null || !Number.isFinite(lastSentAt)) return 0;
  if (lastSentAt > now) return 0;
  const elapsed = now - lastSentAt;
  return elapsed >= windowMs ? 0 : windowMs - elapsed;
}

/** Whole seconds, rounded up — 0.4s left should read "1s", never "0s". */
export const cooldownSeconds = (remainingMs: number) => Math.ceil(remainingMs / 1000);

function readLastSent(email: string): number | null {
  // Private browsing and blocked site data both throw here rather than
  // returning null, and a sign-up form must not break because of it.
  try {
    const raw = window.localStorage.getItem(keyFor(email));
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** How long this address must wait, right now. */
export function cooldownFor(email: string, now: number = Date.now()): number {
  if (!email.trim()) return 0;
  return remainingCooldownMs(readLastSent(email), now);
}

/** Called after an email has actually been requested — not before. */
export function recordSend(email: string, now: number = Date.now()): void {
  if (!email.trim()) return;
  try {
    window.localStorage.setItem(keyFor(email), String(now));
  } catch {
    // Storage unavailable. The send already happened; losing the timestamp
    // costs a speed bump, and Supabase's own rate limit is still in front of
    // the mailbox.
  }
}
