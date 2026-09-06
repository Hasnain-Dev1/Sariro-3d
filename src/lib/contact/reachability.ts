/**
 * SARIRO — an account we cannot phone is an account we do not know
 * ============================================================================
 * A course is not a download. Somebody has to be told when the class moves, be
 * called when a child does not turn up, and be reachable when a payment needs
 * confirming. Every one of those is a phone call. An email address is not a
 * substitute: it is free, it is disposable, and nobody reads it at 4pm on the
 * day of a class.
 *
 * So the rule, stated once here rather than re-invented at each call site:
 *
 *     No usable phone number  →  the account is Unknown
 *     Unknown                 →  no course can be assigned to it
 *
 * ── Why this is not paranoia ────────────────────────────────────────────────
 * Six of the twenty-two accounts on the live database have no phone at all,
 * every one of them a student. An account with a name, a free-mail address and
 * no number is indistinguishable from a person who typed anything into a
 * signup form to see what was behind it. Handing that account a course means
 * a batch seat held, credits granted, a teacher scheduled, and a class that
 * nobody attends — and no way to find out why, because there is nobody to ask.
 *
 * The word Unknown is deliberate. It does not say the person is fake. It says
 * we do not know who they are, which is the true statement, and it is the one
 * that should be on the screen before somebody spends a teacher's hour on them.
 *
 * ── A fake number is worse than no number ───────────────────────────────────
 * `0000000000` passes "is the field filled in?" and fails the only test that
 * matters. It is worse than blank, because blank is visibly missing and junk
 * looks handled. So presence is not the test — plausibility is.
 *
 * ── Why not "must be an Indian number" ──────────────────────────────────────
 * lib/phone/india.ts is strict about India because the SMS provider only
 * delivers there, and a code sent elsewhere vanishes silently. That strictness
 * is right for sending an OTP and wrong for this. The live database has real,
 * paying families on +977 (Nepal), +243 (DR Congo) and +92 (Pakistan). Marking
 * them Unknown would be a bug wearing the costume of a security rule.
 *
 * So: an Indian number is held to the Indian rules (ten digits, starts 6-9,
 * because 2-5 is a landline that will never receive a class reminder), and
 * everything else has to be a plausible international number and nothing more.
 */

import { normalizeIndianMobile } from '@/lib/phone/india';

export interface ReachableOk {
  ok: true;
  /** Canonical, comparable form — `+919876543210`. */
  e164: string;
  /** True when the number is Indian and therefore OTP-verifiable. */
  indian: boolean;
}

export interface ReachableBad {
  ok: false;
  /** Why, in words a person can act on. Shown to staff, never to the account. */
  reason: string;
  /** Blank field vs something typed that cannot be a phone number. */
  kind: 'missing' | 'implausible';
}

export type Reachability = ReachableOk | ReachableBad;

const digitsOf = (raw: string) => (raw ?? '').replace(/\D/g, '');

/**
 * The shortest real national number in the E.164 world is 7 digits (a few
 * small countries); the longest possible is 15, by the standard itself. Outside
 * that band it is not a phone number, whatever it is.
 */
const MIN_DIGITS = 7;
const MAX_DIGITS = 15;

/** `0000000000`, `1111111111` — filled in, and worth nothing. */
const isRepeatedDigit = (d: string) => d.length > 0 && /^(\d)\1*$/.test(d);

/**
 * `1234567890`, `9876543210` — a keyboard run, ascending or descending. Note
 * that `9876543210` is a syntactically valid Indian mobile, which is exactly
 * why it has to be caught here: it passes every structural test and is the
 * single most-typed fake number in the country.
 *
 * The step is taken modulo 10, because `1234567890` — the actual most-typed
 * fake — ends 9 → 0 and is otherwise not an ascending run at all. A real
 * number that happens to be a ten-digit wrap-around run does not exist.
 */
function isSequentialRun(d: string): boolean {
  if (d.length < MIN_DIGITS) return false;
  let up = true;
  let down = true;
  for (let i = 1; i < d.length; i++) {
    const step = (Number(d[i]) - Number(d[i - 1]) + 10) % 10;
    if (step !== 1) up = false;
    if (step !== 9) down = false;
    if (!up && !down) return false;
  }
  return true;
}

/**
 * Can we ring this number?
 *
 * Deliberately NOT "is it verified?" — verification needs an SMS the person has
 * to act on, and this has to answer for the twenty-two accounts already in the
 * database, none of which has ever been through it. This is the weaker, older
 * question, and it is the one that decides whether a course can be assigned.
 */
export function phoneReachability(raw: string | null | undefined): Reachability {
  const input = (raw ?? '').trim();
  if (!input) {
    return { ok: false, kind: 'missing', reason: 'No phone number on file.' };
  }

  const digits = digitsOf(input);
  if (digits.length < MIN_DIGITS) {
    return { ok: false, kind: 'implausible', reason: 'Too short to be a phone number.' };
  }
  if (digits.length > MAX_DIGITS) {
    return { ok: false, kind: 'implausible', reason: 'Too long to be a phone number.' };
  }

  /* An Indian number — typed bare, with 0, with 91, with +91 — is held to the
     Indian rules, because we know them and because a landline here will accept
     a class reminder and deliver nothing. */
  const india = normalizeIndianMobile(input);

  /* Junk is judged on the NATIONAL digits, not on the whole string. `+91`
     prefixed to `9876543210` breaks the descending run and would smuggle the
     country's most-typed fake number straight through a check on the raw
     digits. Where we cannot say which digits are the country code, the whole
     string is all we have — enough for `0000000000`, not for a keyboard run,
     which is the honest limit of doing this without a numbering-plan table. */
  const significant = india.ok ? india.national : digits;
  if (isRepeatedDigit(significant)) {
    return { ok: false, kind: 'implausible', reason: 'That is the same digit repeated — not a real number.' };
  }
  if (isSequentialRun(significant)) {
    return { ok: false, kind: 'implausible', reason: 'That is a run of consecutive digits — not a real number.' };
  }

  if (india.ok) return { ok: true, e164: india.e164, indian: true };

  /* Not India. It must at least be explicit about where it is, because a bare
     national number with no country code cannot be dialled from here — and a
     bare ten-digit number that ISN'T a valid Indian mobile is almost always an
     Indian number typed wrong rather than a foreign one typed right. */
  if (!input.startsWith('+') && !digitsOf(input).startsWith('00')) {
    return {
      ok: false,
      kind: 'implausible',
      reason: 'Not a valid Indian mobile. An international number needs its country code, e.g. +977.',
    };
  }

  return { ok: true, e164: `+${digits}`, indian: false };
}

/** The one-line answer most call sites want. */
export const isReachable = (phone: string | null | undefined) => phoneReachability(phone).ok;

/* ══════════════════════════════════════════════════════════════════════════
   What a staff member sees
   ══════════════════════════════════════════════════════════════════════════ */

export interface ContactLike {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface Identity {
  /** What goes where the name goes. `Unknown` when we cannot ring them. */
  label: string;
  /** True when `label` is the Unknown placeholder rather than a real name. */
  unknown: boolean;
  /** The self-supplied name, kept so an unknown row is still findable. */
  claimedName: string | null;
  /** Secondary line — email, or the reason if there is not even that. */
  detail: string;
  /** Why they are Unknown. Empty when they are not. */
  reason: string;
}

export const UNKNOWN_LABEL = 'Unknown';

/**
 * A row's identity for a staff-facing list.
 *
 * The name is not deleted — it moves. An account with no number shows as
 * `Unknown` where the name would be, with the name it gave itself demoted to
 * the detail line. That way the label tells the truth (we do not know who this
 * is) without making the row impossible to find, search or talk about, which
 * is what simply blanking the name would have done to HR.
 */
export function contactIdentity(c: ContactLike): Identity {
  const r = phoneReachability(c.phone);
  const claimedName = (c.full_name ?? '').trim() || null;
  const email = (c.email ?? '').trim() || null;

  if (r.ok) {
    return {
      label: claimedName || email || UNKNOWN_LABEL,
      unknown: !claimedName && !email,
      claimedName,
      detail: email ?? '',
      reason: '',
    };
  }

  /* The name it gave us is not evidence of anything — it is a string somebody
     typed. It stays visible, marked as claimed, so nobody mistakes it for a
     person we have confirmed exists. */
  const parts = [claimedName ? `claims “${claimedName}”` : null, email].filter(Boolean);
  return {
    label: UNKNOWN_LABEL,
    unknown: true,
    claimedName,
    detail: parts.join(' · '),
    reason: r.reason,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   The gate
   ══════════════════════════════════════════════════════════════════════════ */

export interface AssignVerdict {
  ok: boolean;
  /** Machine code for the API response. */
  code: 'ok' | 'no_phone';
  /** The sentence a staff member reads when the button refuses. */
  message: string;
}

/**
 * May a course be assigned to this account?
 *
 * Assigning is the expensive, hard-to-undo half of the product: it holds a
 * seat in a batch of four, grants credits, and puts a teacher in a room. It is
 * the right place for the check, and it is the LAST place — the enrolment API
 * calls this too, because a disabled dropdown option is a courtesy and a
 * service-role endpoint is the actual boundary.
 */
export function canAssignCourse(c: ContactLike): AssignVerdict {
  const r = phoneReachability(c.phone);
  if (r.ok) return { ok: true, code: 'ok', message: '' };

  const who = (c.full_name ?? '').trim() || (c.email ?? '').trim() || 'This account';
  return {
    ok: false,
    code: 'no_phone',
    message:
      r.kind === 'missing'
        ? `${who} has no phone number on file, so we cannot contact them — no course can be assigned until one is added.`
        : `${who}'s phone number is not usable (${r.reason.toLowerCase().replace(/\.$/, '')}), so we cannot contact them — no course can be assigned until it is corrected.`,
  };
}

/**
 * Two accounts sharing one number is not by itself wrong — siblings, and a
 * parent who books for both. It is worth SEEING, because on the live data one
 * number is on three separate accounts, and that is either a family or one
 * person collecting free trials.
 *
 * Compares canonically, so `9709123454` and `+91 97091 23454` count as the
 * same number rather than as two.
 */
export function groupBySharedPhone<T extends ContactLike>(rows: T[]): Map<string, T[]> {
  const byNumber = new Map<string, T[]>();
  for (const row of rows) {
    const r = phoneReachability(row.phone);
    if (!r.ok) continue;
    const list = byNumber.get(r.e164);
    if (list) list.push(row);
    else byNumber.set(r.e164, [row]);
  }
  for (const [number, list] of byNumber) {
    if (list.length < 2) byNumber.delete(number);
  }
  return byNumber;
}
