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
  /** The same email. Every account is keyed on it, and it is proved by a code. */
  | 'email'
  /** The same phone — a HOUSEHOLD, not a person. See the note on matchLead. */
  | 'phone';

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
 * fact, the email is what every account is keyed on and is proved by a code
 * before a booking is accepted, and the phone identifies a HOUSEHOLD rather
 * than a person. The first rule that matches wins, so a weak signal can never
 * overturn a strong one.
 *
 * ── Why the phone lost its place ────────────────────────────────────────────
 * It used to come second, and it merged families. Booking a trial for Tanisha
 * Rakhecha on 11 Sep did not create her lead: it updated her relative Mehul's,
 * because they share a number. The seller saw one lead, one name, and one of
 * the two children simply did not exist as far as the pipeline was concerned.
 *
 * Two children in one family share a phone and always will. So a phone match
 * is only believed when nothing contradicts it — when one side has no email at
 * all. Two DIFFERENT proved emails on the same number are two different people,
 * and that is now the end of the matter.
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

  if (email) {
    /* A lead already tied to somebody else's account is theirs, whatever
       address is written on it — an old lead may carry a parent's email while
       belonging to one particular child. So an email match is believed when
       the lead has no account, or when it has the very account this booking
       resolved to. */
    const byEmail = candidates.filter((c) => {
      if (normaliseEmail(c.email) !== email) return false;
      const theirAccount = (c.studentId ?? null) || null;
      return !theirAccount || theirAccount === studentId;
    });
    const hit = pick(byEmail, 'email');
    if (hit) return hit;
  }

  if (phone) {
    /* The household rule. A number matches only where it is not contradicted:
       if this booking carries an email AND the lead carries a different one,
       they are two people who live together, not one person twice. */
    const byPhone = candidates.filter((c) => {
      if (normalisePhone(c.phone) !== phone) return false;
      const theirs = normaliseEmail(c.email);
      return !email || !theirs || theirs === email;
    });
    const hit = pick(byPhone, 'phone');
    if (hit) return hit;
  }

  return null;
}
