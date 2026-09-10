/**
 * SARIRO — is this the same family?
 * ============================================================================
 * A lead, an account and a sale are three rows written at three different
 * moments by three different people, and the whole back half of the trial
 * workflow depends on being able to say they belong together: the seller who
 * gets credited for a sale is the seller who was holding the lead that the
 * trial came from.
 *
 * Today that link is a name and a phone number typed as text. This module is
 * the rule for joining them until the ids catch up — and, more importantly,
 * the rule for when NOT to.
 *
 * ── Over-matching is the expensive mistake ──────────────────────────────────
 * Two families merged into one lead means one of them is never rung, and a
 * sale credited to whoever happened to hold the survivor. Two rows for one
 * family means somebody gets called twice and apologises. The second is
 * embarrassing; the first loses a customer and pays the wrong person.
 *
 * So every rule here is deliberately conservative, and each one carries how
 * much it is actually worth believing.
 */

/** How much a match is worth believing. */
export type MatchStrength =
  /** The same account id. Not a guess. */
  | 'account'
  /** The same mobile number. They proved it with a code. */
  | 'phone'
  /** The same email. Typed into a form, and nothing has verified it. */
  | 'email';

export interface LeadIdentity {
  id: string;
  studentId?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface IncomingIdentity {
  studentId?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * A phone number reduced to the part that identifies it.
 *
 * The same number lives in this database in at least three shapes: E.164 on
 * profiles (+919876543210), stripped of its country code on student_leads
 * (9876543210), and however a human typed it into a form (+91 98765 43210).
 * Comparing them as strings finds nothing, which is why a family who booked a
 * trial and then bought a course currently produces two unrelated rows.
 *
 * The last ten digits are the subscriber number in India and are what actually
 * identifies the line. Returns null for anything too short to be a real
 * number, so two blanks never match each other.
 */
export function normalisePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D+/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

/**
 * An email reduced to the part that identifies it: trimmed and lowercased.
 *
 * Deliberately NOT more clever than that. Stripping dots would merge
 * firstname.lastname@ with firstnamelastname@, which is true at Gmail and
 * false almost everywhere else; stripping +tags is true more often but not
 * always. Both would silently merge two real families at some domain we have
 * never heard of, and merging is the mistake that loses a customer and credits
 * the wrong seller. Case is the only transformation that is safe everywhere.
 */
export function normaliseEmail(raw: string | null | undefined): string | null {
  const e = (raw ?? '').trim().toLowerCase();
  if (!e || !e.includes('@')) return null;
  return e;
}

/**
 * The existing lead this booking belongs to, if any.
 *
 * Tried in order of how much each identifier is worth: the account id is a
 * fact, the phone was proved with a code, the email is something somebody
 * typed. The first rule that matches wins, so a weak signal can never overturn
 * a strong one — an email typo that happens to collide with another family
 * cannot steal a lead that the account id already settled.
 *
 * Where several leads match equally, the OLDEST wins: it is the one a seller
 * has been working, has notes against, and has history on. Attaching to the
 * newest would strand all of that.
 */
export function matchLead(
  candidates: readonly LeadIdentity[],
  incoming: IncomingIdentity
): { id: string; on: MatchStrength } | null {
  const phone = normalisePhone(incoming.phone);
  const email = normaliseEmail(incoming.email);
  const studentId = (incoming.studentId ?? '').trim() || null;

  const pick = (matches: readonly LeadIdentity[], on: MatchStrength) =>
    /* Stable: leads arrive ordered oldest-first from the caller, and the first
       of an equal set is the one with the history on it. */
    matches.length > 0 ? { id: matches[0].id, on } : null;

  if (studentId) {
    const byAccount = candidates.filter((c) => (c.studentId ?? null) === studentId);
    const hit = pick(byAccount, 'account');
    if (hit) return hit;
  }

  if (phone) {
    const byPhone = candidates.filter((c) => normalisePhone(c.phone) === phone);
    const hit = pick(byPhone, 'phone');
    if (hit) return hit;
  }

  if (email) {
    /* Only ever against a lead that has NO account attached. Once a lead is
       tied to a real account, a typed email is not enough to move a second
       family onto it — and a family that already has an account will match on
       the account or the phone anyway. */
    const byEmail = candidates.filter(
      (c) => !c.studentId && normaliseEmail(c.email) === email
    );
    const hit = pick(byEmail, 'email');
    if (hit) return hit;
  }

  return null;
}
