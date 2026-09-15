import type { SupabaseClient } from '@supabase/supabase-js';
import { samePhone } from '@/lib/phone/trust';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — the one way an account's phone number changes
 * ============================================================================
 * The founder's policy (15 Sep 2026):
 *
 *   • A number is proved once — at trial booking or on first dashboard visit —
 *     and then it is simply the account's number.
 *   • Changing it means proving the NEW number, and it can change at most once
 *     a week.
 *   • Whenever a number is proved, the profile AND every sales record for that
 *     person carry it, so a seller never rings the old one.
 *
 * `decidePhoneWrite` is the rule, pure and tested. `applyAccountPhone` reads
 * the profile, asks the rule, writes, and syncs the sales side. Every route
 * that learns a proved number for a signed-in account goes through it: the
 * dashboard check, Settings, the booking form's code, and a returning family's
 * trial booking. Browsers cannot write these columns at all —
 * scripts/phone-change-guard.sql refuses it — so there is no second way.
 */

export const PHONE_CHANGE_DAYS = 7;
const DAY_MS = 86_400_000;

export interface CurrentPhone {
  phone: string | null;
  verified: boolean;
  /** When the number was last replaced by a different one. Null: never. */
  changedAt: string | null;
}

export interface NextPhone {
  /** E.164. */
  phone: string;
  /** ISO country, e.g. 'IN'. */
  countryCode: string | null;
  /** A code proved it (or a number we have proved before). False for a
      country no code can reach. */
  verified: boolean;
}

export type PhoneWrite =
  | { kind: 'noop' }
  | {
      kind: 'write';
      patch: { phone: string; phone_country_code: string | null; phone_verified: boolean; phone_changed_at?: string };
      /** A different number replacing one that counted — the weekly limit applies. */
      isChange: boolean;
    }
  | { kind: 'too_soon'; nextChangeAt: string }
  /** A proved number is never swapped for one nobody proved. */
  | { kind: 'needs_proof' };

/** When the next change is allowed, or null if it is allowed now. */
export function nextChangeAt(changedAt: string | null, now: Date = new Date()): string | null {
  const t = changedAt ? Date.parse(changedAt) : NaN;
  if (!Number.isFinite(t)) return null;
  const next = t + PHONE_CHANGE_DAYS * DAY_MS;
  return next > now.getTime() ? new Date(next).toISOString() : null;
}

export function decidePhoneWrite(current: CurrentPhone, next: NextPhone, now: Date = new Date()): PhoneWrite {
  const base = { phone: next.phone, phone_country_code: next.countryCode, phone_verified: next.verified };

  /* The same number, in whatever spelling it was stored. Proving it upgrades
     the flag and stores it canonically; nothing else is a change. */
  if (samePhone(current.phone, next.phone) || current.phone === next.phone) {
    if (next.verified && (!current.verified || current.phone !== next.phone)) {
      return { kind: 'write', patch: { ...base, phone_verified: true }, isChange: false };
    }
    return { kind: 'noop' };
  }

  // No number yet: this is the first one, not a change.
  if (!current.phone?.trim()) return { kind: 'write', patch: base, isChange: false };

  if (current.verified && !next.verified) return { kind: 'needs_proof' };

  /* A number that was only ever typed, replaced by one that was proved, is the
     account's first real number — the once-only check, not a change. */
  if (!current.verified && next.verified) return { kind: 'write', patch: base, isChange: false };

  const wait = nextChangeAt(current.changedAt, now);
  if (wait) return { kind: 'too_soon', nextChangeAt: wait };
  return { kind: 'write', patch: { ...base, phone_changed_at: now.toISOString() }, isChange: true };
}

/** "22 Sep" — for "you can change it again on …". */
export function changeDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

export const tooSoonMessage = (nextIso: string) =>
  `A phone number can be changed once a week. You can change yours again on ${changeDateLabel(nextIso)}.`;

export type ApplyResult =
  | { ok: true; changed: boolean; phone: string; verified: boolean }
  | { ok: false; error: 'too_soon'; nextChangeAt: string; message: string }
  | { ok: false; error: 'needs_proof' | 'not_ready' | 'save_failed' | 'no_profile'; message: string };

const MISSING_COLUMN = '42703';

export interface AccountPhoneRow extends CurrentPhone {
  countryCode: string | null;
  email: string | null;
  /** False until scripts/phone-change-guard.sql adds phone_changed_at. */
  columnReady: boolean;
}

/** The account's number as the server sees it, or null when it cannot be read. */
export async function readAccountPhone(admin: SupabaseClient, userId: string): Promise<AccountPhoneRow | null> {
  let columnReady = true;
  let read = await admin
    .from('profiles')
    .select('phone, phone_verified, phone_country_code, phone_changed_at, email')
    .eq('id', userId)
    .maybeSingle();
  if (read.error?.code === MISSING_COLUMN) {
    columnReady = false;
    read = await admin.from('profiles').select('phone, phone_verified, phone_country_code, email').eq('id', userId).maybeSingle();
  }
  if (read.error) {
    console.warn('[account-phone] profile read failed:', read.error.code, read.error.message);
    return null;
  }
  const row = read.data as {
    phone: string | null; phone_verified: boolean | null; phone_country_code: string | null;
    phone_changed_at?: string | null; email: string | null;
  } | null;
  if (!row) return null;
  return {
    phone: row.phone,
    verified: row.phone_verified === true,
    changedAt: row.phone_changed_at ?? null,
    countryCode: row.phone_country_code,
    email: row.email,
    columnReady,
  };
}

/**
 * Read what the account has, decide, write, and bring the sales side along.
 *
 * `phone_changed_at` arrives with scripts/phone-change-guard.sql. Before it is
 * run, a first number or a first proof still saves — those are not changes —
 * but replacing a number is refused rather than allowed without a limit.
 */
export async function applyAccountPhone(
  admin: SupabaseClient,
  userId: string,
  next: NextPhone,
  now: Date = new Date()
): Promise<ApplyResult> {
  const row = await readAccountPhone(admin, userId);
  if (!row) return { ok: false, error: 'no_profile', message: 'We could not read your account just now. Please try again in a moment.' };
  const { columnReady } = row;

  const decision = decidePhoneWrite(row, next, now);

  if (decision.kind === 'noop') return { ok: true, changed: false, phone: row.phone ?? next.phone, verified: row.verified };
  if (decision.kind === 'needs_proof') {
    return { ok: false, error: 'needs_proof', message: 'Your number is verified. A new one has to be verified too before it can replace it.' };
  }
  if (decision.kind === 'too_soon') {
    return {
      ok: false,
      error: 'too_soon',
      nextChangeAt: decision.nextChangeAt,
      message: tooSoonMessage(decision.nextChangeAt),
    };
  }
  if (decision.isChange && !columnReady) {
    console.warn('[account-phone] a number change was refused: run scripts/phone-change-guard.sql');
    return { ok: false, error: 'not_ready', message: 'Changing a number is not switched on yet. Please contact support to change it.' };
  }

  const { error } = await admin.from('profiles').update(decision.patch).eq('id', userId);
  if (error) {
    console.warn('[account-phone] profile write failed:', error.code, error.message);
    return { ok: false, error: 'save_failed', message: 'We could not save your number just now. Please try again.' };
  }

  await syncPhoneToSales(admin, { userId, email: row.email, phone: next.phone, countryCode: next.countryCode });
  return { ok: true, changed: true, phone: next.phone, verified: decision.patch.phone_verified };
}

/** student_leads has always held an Indian number without its +91. */
export function leadPhone(e164: string, countryCode: string | null): string {
  return countryCode === 'IN' || (!countryCode && e164.startsWith('+91')) ? e164.replace(/^\+91/, '') : e164;
}

const EMAIL_SHAPE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

/**
 * Every sales record for this person gets the latest number: their leads,
 * their demo-class requests and any bank-transfer or contact request still
 * open. Best effort — the account's number is already saved, and a sales table
 * that refuses a write must not undo that — but every refusal is logged.
 * Invoices are not touched: an issued invoice is a record of what was true.
 */
export async function syncPhoneToSales(
  admin: SupabaseClient,
  input: { userId: string; email: string | null; phone: string; countryCode: string | null }
): Promise<void> {
  const email = (input.email ?? '').trim().toLowerCase();
  const byEmail = EMAIL_SHAPE.test(email);
  const now = new Date().toISOString();
  const lead = { phone: leadPhone(input.phone, input.countryCode), phone_country_code: input.countryCode ?? 'IN', last_updated: now };

  await Promise.all([
    bestEffort('account-phone: leads by account', admin.from('student_leads').update(lead).eq('student_id', input.userId)),
    byEmail
      ? bestEffort('account-phone: leads by email', admin.from('student_leads').update(lead).is('student_id', null).eq('email', email))
      : Promise.resolve(true),
    byEmail
      ? bestEffort(
          'account-phone: demo requests',
          admin.from('demo_class_requests').update({ phone: input.phone, phone_country_code: input.countryCode }).eq('email', email)
        )
      : Promise.resolve(true),
    bestEffort(
      'account-phone: open payment requests',
      admin.from('payment_requests').update({ phone: input.phone }).eq('user_id', input.userId).neq('status', 'done')
    ),
  ]);
}
