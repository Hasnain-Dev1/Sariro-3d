import type { SupabaseClient } from '@supabase/supabase-js';
import { findAccountByEmail } from '@/lib/account/email-identity';

/**
 * SARIRO — when a phone number does not need a code
 * ============================================================================
 * Every code costs ₹1. At 500 a day that is ₹15,000 a month, and a large share
 * of it was spent proving numbers we had ALREADY proved: a sibling booking on
 * the family phone, a returning parent, a number verified last week.
 *
 * The rule, from the founder:
 *
 *   1. The email is proved first, and it is the account.
 *   2. If that account already has a number, that number is used — no code.
 *   3. Otherwise, if the number they type has been verified with us before,
 *      it is trusted — no code.
 *   4. Only a new email with a new number is sent a code.
 *
 * ── Why rules 2 and 3 need the email proved ─────────────────────────────────
 * Without it, anybody could type a known number and skip the code — and the
 * answer "this number needs no code" would tell a stranger which numbers are
 * our customers. Behind a proved email, that question costs somebody a real
 * inbox and a code each time, which is not a lookup service worth running.
 *
 * ── Why this is safe for the account ────────────────────────────────────────
 * The phone stopped being an identity: accounts are found by the proved email
 * (lib/trial/account.ts), so a trusted number cannot sign anybody into anybody
 * else's account. It is a contact number that somebody, at some point, proved
 * they could receive codes on.
 *
 * The decision is pure (`decidePhoneTrust`) and the database reads are separate
 * (`loadPhoneTrust`), so the form, the code sender and both booking routes ask
 * exactly the same question and cannot drift apart.
 */

export type TrustReason =
  /** A code was verified for this number within the hour. */
  | 'fresh_code'
  /** The number already on the account this proved email belongs to. */
  | 'account_number'
  /** Verified with us before — on a profile, or through a code. */
  | 'verified_before';

export type PhoneTrust = { trusted: true; why: TrustReason } | { trusted: false };

/**
 * One number, however it was typed or stored.
 *
 * The live table holds one person's number as `9709123454`, `+91 6296914378`
 * and `+916296914378`. For an Indian mobile the last ten digits are the
 * number; the dial code and a habitual leading 0 are not.
 */
export function phoneKey(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export const samePhone = (a: string | null | undefined, b: string | null | undefined) => {
  const ka = phoneKey(a);
  return ka.length >= 7 && ka === phoneKey(b);
};

/** The spellings a stored Indian number may have, for looking it up. */
export function phoneSpellings(e164: string): string[] {
  const key = phoneKey(e164);
  const out = new Set([e164]);
  if (/^\d{10}$/.test(key) && e164.startsWith('+91')) {
    out.add(key);
    out.add(`91${key}`);
    out.add(`0${key}`);
    out.add(`+91 ${key}`);
    out.add(`+91-${key}`);
    out.add(`+91 ${key.slice(0, 5)} ${key.slice(5)}`);
  }
  return [...out];
}

export interface TrustFacts {
  /** phone_is_verified(): a code verified within the hour. */
  freshCode: boolean;
  /** email_is_verified(): the address was proved within the hour. */
  emailProved: boolean;
  /** The numbers on the account(s) that proved email belongs to. */
  accountPhones: readonly (string | null)[];
  /** Verified with us before, by any route. */
  verifiedBefore: boolean;
}

export function decidePhoneTrust(phone: string, facts: TrustFacts): PhoneTrust {
  if (facts.freshCode) return { trusted: true, why: 'fresh_code' };
  // Nothing but a code counts without a proved email. See the note above.
  if (!facts.emailProved) return { trusted: false };
  if (facts.accountPhones.some((p) => samePhone(p, phone))) return { trusted: true, why: 'account_number' };
  if (facts.verifiedBefore) return { trusted: true, why: 'verified_before' };
  return { trusted: false };
}

/**
 * Read the facts from the database and decide.
 *
 * `emailProved` may be passed when the caller has already asked, so a booking
 * route does not ask twice. Any read that fails counts as "not trusted": the
 * worst a failure can do is cost one code, never skip one it should not.
 * `freshCode` is the exception the caller cares about — if that read fails the
 * whole check throws, because a booking route must not treat "could not ask"
 * as "no".
 */
export async function loadPhoneTrust(
  admin: SupabaseClient,
  input: { phone: string; email: string; emailProved?: boolean }
): Promise<PhoneTrust> {
  const email = input.email.trim().toLowerCase();

  const fresh = await admin.rpc('phone_is_verified', { p_phone: input.phone });
  if (fresh.error) throw fresh.error;
  if (fresh.data === true) return { trusted: true, why: 'fresh_code' };

  let emailProved = input.emailProved;
  if (emailProved === undefined) {
    if (!email) return { trusted: false };
    const { data, error } = await admin.rpc('email_is_verified', { p_email: email });
    emailProved = !error && data === true;
  }
  if (!emailProved) return { trusted: false };

  const spellings = phoneSpellings(input.phone);
  /* The account that really owns the address — not any profile that happens
     to carry a copy of it. See lib/account/email-identity.ts. */
  const ownerId = await findAccountByEmail(admin, email);
  const [account, codes, profiles] = await Promise.all([
    ownerId
      ? admin.from('profiles').select('phone').eq('id', ownerId).limit(1)
      : Promise.resolve({ data: [] as { phone: string | null }[], error: null }),
    admin.from('phone_verifications').select('phone').eq('phone', input.phone).not('verified_at', 'is', null).limit(1),
    admin.from('profiles').select('id').in('phone', spellings).eq('phone_verified', true).limit(1),
  ]);

  return decidePhoneTrust(input.phone, {
    freshCode: false,
    emailProved: true,
    accountPhones: account.error ? [] : (account.data ?? []).map((r) => r.phone as string | null),
    verifiedBefore:
      (!codes.error && (codes.data?.length ?? 0) > 0) ||
      (!profiles.error && (profiles.data?.length ?? 0) > 0),
  });
}

/** What the form says when no code is needed. */
export const TRUST_COPY: Record<TrustReason, string> = {
  fresh_code: 'Number confirmed.',
  account_number: 'Already confirmed on your account.',
  verified_before: 'This number is already confirmed with us — no code needed.',
};
