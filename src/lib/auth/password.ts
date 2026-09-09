/**
 * SARIRO — choosing a new password, and what to say when it goes wrong
 * ============================================================================
 * Until now there was no way to reset a password at all. The FAQ said:
 *
 *   "On the sign-in page, click 'Forgot password?' and enter your email."
 *
 * There was no such button. A parent who forgot their password read a
 * confident, specific instruction, went looking for it, and was locked out of
 * an account they had paid for — with the only route back being an email to
 * support that they had no reason to think was necessary.
 *
 * This file is the part of the fix that can be tested without a browser: what
 * counts as an acceptable password, and what a person is told when something
 * fails. Both are the kind of thing that gets written once inside a component
 * and then quietly contradicts itself on the next screen.
 *
 * ── Why the rules are deliberately mild ─────────────────────────────────────
 * No forced symbol, no forced digit, no forced capital. Those rules are why
 * people write `Password1!` on a sticky note. Length is what actually makes a
 * password hard to guess, so length is what is asked for, and everything else
 * is a suggestion rather than a wall.
 *
 * The floor is 8, not Supabase's default 6. Six is below every current
 * guideline, and this is an account with a child's schedule and a payment
 * history behind it.
 *
 * ── The one hard rule that is not about length ──────────────────────────────
 * A password may not BE the email address, or start with the part before the
 * @. It is the first thing anybody tries, and somebody choosing it under the
 * mild rules above would otherwise pass.
 */

export const MIN_LENGTH = 8;

/**
 * The longest we accept. Not a security limit — bcrypt truncates around 72
 * bytes anyway — but a guard against a paste of an entire document, which is a
 * request that fails somewhere less friendly if it is allowed through.
 */
export const MAX_LENGTH = 200;

export type Strength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordCheck {
  ok: boolean;
  /** Shown under the field. Empty when the password is acceptable. */
  problem: string;
  strength: Strength;
  /** 0-4, for the meter. */
  score: number;
}

/* The ones that are actually tried first. Not a dictionary — a dictionary
   belongs on the server if it belongs anywhere — just the handful that a
   length rule alone would happily accept. */
const OBVIOUS = new Set([
  'password', 'password1', 'password123', 'passw0rd',
  '12345678', '123456789', '1234567890', '87654321',
  'qwertyui', 'qwerty123', 'iloveyou', 'letmein1',
  'abc12345', 'sariro123', 'welcome1', 'admin123',
]);

/**
 * Is this password acceptable, and how good is it?
 *
 * `email` is optional so the function can be used where the address is not to
 * hand, but pass it whenever you have it — it is what catches the single most
 * common bad choice.
 */
export function checkPassword(password: string, email?: string | null): PasswordCheck {
  const pw = password ?? '';

  if (!pw) {
    return { ok: false, problem: 'Choose a password.', strength: 'weak', score: 0 };
  }
  if (pw.length < MIN_LENGTH) {
    const short = MIN_LENGTH - pw.length;
    return {
      ok: false,
      problem: `A bit short — ${short} more character${short === 1 ? '' : 's'} to go.`,
      strength: 'weak',
      score: 0,
    };
  }
  if (pw.length > MAX_LENGTH) {
    return {
      ok: false,
      problem: `That is longer than ${MAX_LENGTH} characters — something has probably gone wrong with a paste.`,
      strength: 'weak',
      score: 0,
    };
  }
  if (/^\s+$/.test(pw)) {
    return { ok: false, problem: 'That is only spaces.', strength: 'weak', score: 0 };
  }
  if (OBVIOUS.has(pw.toLowerCase())) {
    return {
      ok: false,
      problem: 'That is one of the first passwords anybody tries. Pick something else.',
      strength: 'weak',
      score: 0,
    };
  }

  const local = (email ?? '').split('@')[0]?.trim().toLowerCase() ?? '';
  const lower = pw.toLowerCase();
  if (email && lower === (email ?? '').trim().toLowerCase()) {
    return { ok: false, problem: 'Your password cannot be your email address.', strength: 'weak', score: 0 };
  }
  /* Only a meaningful local part counts. `a@x.com` would otherwise reject every
     password beginning with the letter a. */
  if (local.length >= 4 && lower.startsWith(local)) {
    return {
      ok: false,
      problem: 'Your password should not start with your email address.',
      strength: 'weak',
      score: 0,
    };
  }

  /* Acceptable. The rest is advice, never a gate — score is what drives the
     meter, and a `fair` password still saves. */
  let score = 1;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  /* Length again at 24, because the header of this file argues that length is
     what makes a password hard to guess — and without this, a 28-character
     passphrase scored below an eight-character one with a symbol in it, which
     is the opposite of true and the opposite of what is written above. */
  if (pw.length >= 24) score++;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (classes >= 3) score++;
  score = Math.min(score, 4);

  const strength: Strength = score >= 4 ? 'strong' : score === 3 ? 'good' : score === 2 ? 'fair' : 'weak';
  return { ok: true, problem: '', strength, score };
}

/** Both boxes have to agree before anything is submitted. */
export function passwordsMatch(a: string, b: string): boolean {
  return a.length > 0 && a === b;
}

/* ══════════════════════════════════════════════════════════════════════════
   What Supabase said, and what a person should read instead
   ══════════════════════════════════════════════════════════════════════════
   Supabase's auth errors are written for whoever is reading the logs. Put in
   front of somebody who has just been locked out, "AuthApiError: Email link is
   invalid or has expired" reads as a fault in the product rather than as "ask
   for a new one", which is the only thing they can actually do about it.
   ══════════════════════════════════════════════════════════════════════════ */

export function resetErrorMessage(raw: string | null | undefined): string {
  const m = (raw ?? '').toLowerCase();

  if (!m) return 'Something went wrong. Please try again.';

  if (m.includes('expired') || m.includes('invalid') || m.includes('not found')) {
    return 'That reset link has expired or has already been used. Ask for a new one — they last an hour.';
  }
  if (m.includes('same password') || m.includes('should be different')) {
    return 'That is the password you already have. Choose a different one.';
  }
  if (m.includes('weak') || m.includes('at least')) {
    return `Pick a longer password — ${MIN_LENGTH} characters or more.`;
  }
  /* Supabase's actual wording for this is "For security purposes, you can only
     request this after 51 seconds" — which contains none of the words a
     reasonable person would grep for, and so fell through to the generic
     "something went wrong". It is the most common real failure on this screen,
     because it is what a second click produces. */
  if (
    m.includes('rate') || m.includes('too many') || m.includes('limit') ||
    m.includes('security purposes') || m.includes('only request')
  ) {
    return 'Too many attempts just now. Wait a minute and try again.';
  }
  if (m.includes('session') || m.includes('jwt') || m.includes('token')) {
    return 'This page has lost its link to the reset email. Open the link from your inbox again.';
  }
  if (m.includes('fetch') || m.includes('network')) {
    return 'We could not reach the server. Check your connection and try again.';
  }
  return 'We could not change your password. Please try again, or write to support@sariro.com.';
}

/**
 * The message after asking for a reset link.
 *
 * Deliberately the same whether or not the address has an account. "No account
 * with that email" turns the form into a way of finding out which of a list of
 * addresses is a Sariro customer, which is a thing worth knowing to somebody
 * writing a phishing email to parents.
 */
export function resetRequestedMessage(email: string): string {
  const shown = email.trim();
  return `If ${shown} has a Sariro account, a reset link is on its way. It is valid for one hour, and it sometimes lands in spam.`;
}

/* ══════════════════════════════════════════════════════════════════════════
   The code in the email, for when the link does not work
   ══════════════════════════════════════════════════════════════════════════
   The reset email has always carried a six-digit code as well as a button,
   and until now nothing on the site would accept it. That mattered more than
   it sounds, because the button fails in two ordinary situations that have
   nothing to do with the person doing anything wrong:

     · They ask for the reset on a laptop and open the email on their phone.
       The browser client uses PKCE, so the secret half of the exchange is in
       the laptop's storage. The phone has half a handshake and gets an error.

     · A mail scanner — Outlook, a school filter, some antivirus suites —
       fetches every link in the message to check it. The reset link works
       exactly once, so by the time a human clicks it, it has been used.

   A typed code has neither problem: no browser state, and nothing to consume
   in advance. It is the reliable path, which is why it is offered rather than
   hidden behind "having trouble?".
   ══════════════════════════════════════════════════════════════════════════ */

/** Supabase sends six digits. */
export const CODE_LENGTH = 6;

/**
 * What a person actually types, turned into what the API expects.
 *
 * People paste "123 456", copy a trailing space out of the email, or type an
 * O for a 0 out of habit from other codes. Rejecting those is technically
 * correct and practically hostile — the digits are right there.
 */
export function normaliseCode(raw: string): string {
  return raw
    .replace(/[oO]/g, '0')
    .replace(/[lLiI]/g, '1')
    .replace(/\D/g, '')
    .slice(0, CODE_LENGTH);
}

export function codeLooksComplete(raw: string): boolean {
  return normaliseCode(raw).length === CODE_LENGTH;
}

/**
 * What to say when a typed code is refused.
 *
 * Supabase returns the same shape of error for "wrong code" and "expired
 * code", and they need different actions from the person: try again, versus
 * go and get a new email. Where they can be told apart, they are.
 */
export function codeErrorMessage(raw: string | null | undefined): string {
  const m = (raw ?? '').toLowerCase();
  /* Supabase's real message is "Token has expired or is invalid" — one string
     for two causes it will not separate, and they need opposite actions. So
     this covers both and leads with the cheap one: re-reading six digits costs
     nothing, requesting another email costs five minutes. Checked BEFORE the
     bare /expired/ branch, which would otherwise claim a certainty the API
     never offered and send every mistyped digit back to the start. */
  if (/expired or is invalid|invalid or has expired/.test(m)) {
    return 'That code did not work. Check the six digits against the newest email — and if it has been more than an hour, ask for a fresh one.';
  }
  if (/expired/.test(m)) {
    return 'That code has expired — they last an hour. Ask for a new email and use the code in that one.';
  }
  if (/rate|too many|security purposes/.test(m)) {
    return 'Too many tries. Wait a minute and then try the code again.';
  }
  if (/invalid|not found|token/.test(m)) {
    return 'That code did not match. Check the six digits in the email — it is the most recent one that counts.';
  }
  return 'We could not check that code. Try again in a moment.';
}

/**
 * The address they just asked a reset for, remembered on this device only.
 *
 * The code form needs an email as well as the code. Putting it in the reset
 * URL would be the easy way and the wrong one — it would then sit in server
 * logs, browser history and any referrer, which is not somewhere a customer's
 * email address belongs. localStorage never leaves the machine.
 *
 * It is a convenience, not a mechanism: on a second device the field is simply
 * shown and typed, which is one line of work and always available.
 */
const RESET_EMAIL_KEY = 'sariro.reset.email';

export function rememberResetEmail(email: string): void {
  try {
    window.localStorage.setItem(RESET_EMAIL_KEY, email.trim());
  } catch {
    /* Private mode, or storage blocked. The field is typed instead. */
  }
}

export function recallResetEmail(): string | null {
  try {
    const v = window.localStorage.getItem(RESET_EMAIL_KEY);
    return v && v.includes('@') ? v : null;
  } catch {
    return null;
  }
}
