/**
 * SARIRO — addresses we will not open an account for.
 *
 * Two kinds, blocked for two different reasons:
 *
 *   Throwaway inboxes — a trial costs half an hour of a real teacher's evening
 *   and one of four seats. A disposable address books one, never reads the
 *   confirmation, never turns up, and is replaced by another a minute later.
 *
 *   Competitors — staff at other kids' edtech companies booking free classes to
 *   look at the product, the curriculum and the teachers. Sariro's teachers are
 *   also exactly who those companies recruit from; see the in-house chat rule
 *   for why that matters (memory: the Codingal churn failure).
 *
 * ── This list is the friendly half ──────────────────────────────────────────
 * It lets a form say something useful before anything is sent. It CANNOT stop
 * an account on its own: Google sign-in and a direct call to Supabase never
 * touch this code. scripts/block-email-domains.sql puts the same domains in a
 * table behind a trigger on auth.users, which refuses the account wherever it
 * comes from. Add a domain in BOTH places; if they ever drift, the database
 * still wins — the only cost is a vaguer error message.
 *
 * ── Deliberately short ──────────────────────────────────────────────────────
 * Not a downloaded catalogue of ten thousand domains. Every entry is one the
 * founder named. A false positive is a real family told their own address is
 * not allowed — which they cannot fix, and which we would never hear about.
 *
 * Subdomains count: mail.94an.com is 94an.com's.
 */
export const BLOCKED_DOMAINS: readonly string[] = [
  // Throwaway inboxes
  '94an.com',
  'fusioninbox.com',
  'fpklm.com',
  'ooynib.com',
  // Competitors
  'codingal.com',
  'brightchamps.com',
  '98thpercentile.com',
];

/** The domain part, lower-cased, or null if this is not an address at all. */
export function domainOf(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at === -1) return null;
  const domain = e.slice(at + 1);
  return domain.length > 0 ? domain : null;
}

export function isBlockedEmail(email: string | null | undefined): boolean {
  const domain = domainOf(email);
  if (!domain) return false;
  return BLOCKED_DOMAINS.some((b) => domain === b || domain.endsWith(`.${b}`));
}

/**
 * What to tell them. Says what to do next rather than what they did wrong:
 * somebody using a throwaway address on purpose already knows, and somebody
 * whose address got caught needs to know which way out there is.
 */
export const BLOCKED_EMAIL_MESSAGE =
  'Please use a personal or school email address — we cannot open an account with that one.';
