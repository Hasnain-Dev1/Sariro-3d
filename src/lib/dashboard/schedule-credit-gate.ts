/* Deliberately NOT 'use client'.
   Imported by API routes. A server route that imports a client module receives
   client references rather than functions, and the call throws before the
   route can return anything — twice already on this project, both times with
   no error to point at. */

/**
 * SARIRO — a class nobody has paid for
 * ============================================================================
 * A credit is one class. It is spent when the class is marked complete, and a
 * child cannot join a class without one — /api/student/join-class has checked
 * that since the beginning.
 *
 * But nothing checked it a step earlier, when the classes were PUT IN THE
 * DIARY. So a batch could be scheduled for a family with no credits at all: a
 * teacher's Tuesday evening committed for eight weeks, a child expecting a
 * class, and a join button that refuses them at 5pm on the day. The refusal
 * was correct and it arrived at the worst possible moment.
 *
 * ── And the credits were being minted ───────────────────────────────────────
 * Worse, the thing that made this survivable was itself the bug. Enrolling a
 * child granted them one credit per lesson in the course — forty-two credits
 * for a forty-two-lesson course, recorded as type 'purchase', with nobody
 * having purchased anything. Every child could always join every class because
 * every child had been given a full course for free, and the credit system was
 * decorative.
 *
 * With the minting removed, this gate is what stands between a teacher's
 * evening and an unpaid class.
 *
 * ── Why zero, and not "enough for all eight" ────────────────────────────────
 * Blocking at zero is a fact: this family has bought nothing. Blocking at
 * "fewer than the eight classes about to be generated" is a judgement, and a
 * wrong one for a family paying in instalments, or one on their last three
 * classes before a renewal that is already agreed.
 *
 * So zero refuses, and a shortfall is REPORTED — the admin sees "3 credits, 8
 * classes" and decides. Consumption clamps at zero rather than going negative,
 * so a shortfall is otherwise completely invisible: the classes happen, the
 * balance sits at 0, and nothing anywhere says they were free.
 */

export interface LearnerCredit {
  studentId: string;
  name: string | null;
  /** Null when the learner has no credits row at all — same as zero, here. */
  balance: number | null;
}

export interface CreditGate {
  /** Learners with nothing. Scheduling is refused while this is non-empty. */
  blocked: LearnerCredit[];
  /**
   * Learners who have credits, but fewer than the classes about to be booked.
   * Reported, never refused — see above.
   */
  short: (LearnerCredit & { shortfall: number })[];
  ok: boolean;
}

const held = (l: LearnerCredit) =>
  typeof l.balance === 'number' && Number.isFinite(l.balance) ? Math.max(0, l.balance) : 0;

/**
 * Who cannot be scheduled, and who is running out.
 *
 * `classCount` is how many classes are about to be created. Zero or absent
 * means "just checking they have something", which is the add-a-child-to-an-
 * existing-batch case.
 */
export function creditGate(
  learners: readonly LearnerCredit[],
  classCount = 0
): CreditGate {
  const blocked = learners.filter((l) => held(l) <= 0);

  const short = learners
    .filter((l) => held(l) > 0 && classCount > 0 && held(l) < classCount)
    .map((l) => ({ ...l, shortfall: classCount - held(l) }));

  return { blocked, short, ok: blocked.length === 0 };
}

const nameOf = (l: LearnerCredit) => (l.name ?? '').trim() || 'One student';

/** Two or more names, joined the way a person writes them. */
function list(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Why the scheduling was refused, in words an admin can act on.
 *
 * Names the children rather than counting them: "2 students have no credits"
 * sends somebody hunting through a roster, and the whole point of refusing
 * here instead of at the join button is that there is time to fix it.
 */
export function creditBlockMessage(blocked: readonly LearnerCredit[]): string {
  if (blocked.length === 0) return '';
  const who = list(blocked.map(nameOf));
  const have = blocked.length === 1 ? 'has' : 'have';
  return (
    `${who} ${have} no class credits, so these classes cannot be scheduled yet. ` +
    `Add credits from the student's page once their payment is in, then schedule the batch.`
  );
}

/** The softer note, for a family who has some but not enough. */
export function creditShortMessage(
  short: readonly (LearnerCredit & { shortfall: number })[],
  classCount: number
): string {
  if (short.length === 0) return '';
  const parts = short.map((l) => `${nameOf(l)} (${held(l)})`);
  return (
    `Scheduling ${classCount} classes, but ${list(parts)} ` +
    `${short.length === 1 ? 'has' : 'have'} fewer credits than that. ` +
    `The extra classes will be taught without being paid for — credits stop at zero rather than going negative.`
  );
}
