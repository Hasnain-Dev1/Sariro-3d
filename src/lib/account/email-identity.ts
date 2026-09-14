import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SARIRO — one email, one account
 * ============================================================================
 * Sign-in emails were always unique: Supabase refuses a second auth user with
 * the same address. `profiles.email` was not. It is a copy, and copies drift —
 * the free-class form stamped whatever address was verified onto WHOEVER WAS
 * SIGNED IN, so a member of staff booking a trial for a family while logged in
 * had the family's email written over their own profile. By 14 Sep 2026 three
 * addresses sat on seven profiles, including a super admin's.
 *
 * That mattered beyond tidiness, because the booking finds a family's account
 * by looking the email up in profiles. With two rows answering, `.limit(1)`
 * picked one — and a trial could be booked into a staff account, or a
 * returning family shown a phone number that was not theirs.
 *
 * So an email lookup here asks both places. A profile only counts as the owner
 * of an address when its sign-in email agrees (or it has no sign-in email at
 * all, a phone-only account). A profile carrying somebody else's address is
 * skipped. scripts/unique-profile-emails.sql repairs the rows and makes the
 * database refuse the drift from then on; this keeps the app right before and
 * after that script runs.
 */

export function normaliseEmail(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

export interface EmailCandidate {
  id: string;
  /** The address on the profile row. */
  profileEmail: string | null;
  /** The address the person signs in with; null for a phone-only account. */
  authEmail: string | null;
}

/**
 * Which candidate owns `email`.
 *   sign-in email matches          → the owner
 *   no sign-in email at all        → the owner, if nobody matches outright
 *   sign-in email is something else → not the owner: a stale or overwritten copy
 */
export function pickEmailOwner(candidates: readonly EmailCandidate[], email: string): string | null {
  const want = normaliseEmail(email);
  if (!want) return null;
  const mine = candidates.filter((c) => normaliseEmail(c.profileEmail) === want || normaliseEmail(c.authEmail) === want);
  const strong = mine.find((c) => normaliseEmail(c.authEmail) === want);
  if (strong) return strong.id;
  const weak = mine.find((c) => !normaliseEmail(c.authEmail) && normaliseEmail(c.profileEmail) === want);
  return weak?.id ?? null;
}

/** `%` and `_` are wildcards to ILIKE; an address may contain `_`. */
const likeExact = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

/**
 * The account that owns an email, or null. Service-role client only.
 * Case-insensitive, and never fooled by a profile carrying another account's
 * address — see the header.
 */
export async function findAccountByEmail(admin: SupabaseClient, rawEmail: string): Promise<string | null> {
  const email = normaliseEmail(rawEmail);
  if (!email) return null;

  const { data, error } = await admin.from('profiles').select('id, email').ilike('email', likeExact(email)).limit(10);
  if (error) {
    console.warn('[email-identity] profile lookup failed:', error.message);
    return null;
  }

  const candidates: EmailCandidate[] = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: u } = await admin.auth.admin.getUserById(row.id as string);
      return { id: row.id as string, profileEmail: (row.email as string | null) ?? null, authEmail: u?.user?.email ?? null };
    })
  );
  return pickEmailOwner(candidates, email);
}

/**
 * The auth user signed in with `email`, found by walking the user list. Slow
 * on a big project, so only for the rare path where Supabase has just said the
 * address is registered and no profile admits to it — a profile whose copy of
 * the email drifted before scripts/unique-profile-emails.sql repaired it.
 */
export async function findAuthUserByEmail(admin: SupabaseClient, rawEmail: string): Promise<string | null> {
  const email = normaliseEmail(rawEmail);
  if (!email) return null;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.warn('[email-identity] listUsers failed:', error.message);
      return null;
    }
    const hit = data.users.find((u) => normaliseEmail(u.email) === email);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
