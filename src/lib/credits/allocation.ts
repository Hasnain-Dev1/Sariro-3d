/* Deliberately NOT 'use client'.
   Called from API routes. A server route importing a client module gets client
   references rather than functions, and the call throws before the route can
   return anything — twice already on this project, both silent. */

/**
 * SARIRO — what a payment buys when a child has fallen behind
 * ============================================================================
 * A credit is one class. When a family runs out, classes pause — but a GROUP
 * does not pause with them. The group keeps going, so a child who was away for
 * three weeks comes back to a room that has moved on six lessons without them.
 *
 * Paying again cannot simply hand them six classes' worth of "attend the next
 * lesson", because the six lessons they missed are gone. So a purchase is
 * split: part pays for the lessons they missed, to be taught separately in
 * half-hour catch-up sessions, and part pays for carrying on with the group.
 *
 * ── The rule that decides everything else ───────────────────────────────────
 * The split is computed BEFORE anything is written, and both balances are
 * committed together. Adding the full amount to the main balance and then
 * taking some away a moment later shows a family a number that was never true,
 * and the number they will remember is the first one.
 *
 * ── One-to-one is different, and deliberately so ────────────────────────────
 * A 1:1 student has no group to fall behind. Nothing happened while they were
 * away — the curriculum simply stopped where they left it. They restart at the
 * next lesson and every credit they buy is a main credit.
 *
 * Splitting their payment would be inventing a debt: charging them a catch-up
 * session for a lesson nobody taught in their absence. That is the founder's
 * rule and it is also the only reading that makes sense.
 */

export type StudentKind = 'one_to_one' | 'group';

/** A lesson the group covered while this child's classes were paused. */
export interface MissedLesson {
  lessonNumber: number;
  lessonTitle?: string | null;
}

export interface AllocationInput {
  kind: StudentKind;
  /** Credits arriving from this payment. Must be positive. */
  creditsAdded: number;
  /**
   * Lessons the group covered while they were paused and that are not yet
   * funded by a catch-up credit. Ordered oldest first — the earliest missed
   * lesson is funded first, because that is the one furthest from what the
   * group is doing now.
   */
  unfundedMissed: readonly MissedLesson[];
  /** Where the group is up to. Used to say what they come back to. */
  groupCurrentLesson?: number | null;
  /** The last lesson this child actually completed. */
  lastCompletedLesson?: number | null;
}

export interface Allocation {
  /** Credits for ordinary classes. Committed together with catchupAdded. */
  mainAdded: number;
  /** Credits reserved for half-hour catch-up sessions, one per missed lesson. */
  catchupAdded: number;
  /** The lessons those catch-up credits pay for, in order. */
  fundedLessons: MissedLesson[];
  /** Missed lessons this payment could not cover. Funded first, next time. */
  stillUnfunded: MissedLesson[];
  /**
   * Whether ordinary classes can restart now. False when every credit went to
   * catch-up and there is nothing left to attend the next class with.
   */
  canResume: boolean;
  /** The lesson they rejoin at, or null when they cannot resume yet. */
  resumeAtLesson: number | null;
  /** What to tell them, in the popup that appears the moment payment lands. */
  message: string;
}

const clampCount = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

/**
 * Split a purchase between ordinary classes and the lessons already missed.
 *
 * Pure and total: same input, same answer, no clock and no database. Every
 * balance in the system is decided here, so it has to be the kind of thing a
 * person can read and check.
 */
export function allocate(input: AllocationInput): Allocation {
  const credits = clampCount(input.creditsAdded);
  const missed = input.kind === 'group' ? [...(input.unfundedMissed ?? [])] : [];

  /* ── One to one ──────────────────────────────────────────────────────────
     No group ran on without them, so there is nothing to catch up. Every
     credit is a main credit and they restart at the lesson after the last one
     they finished. */
  if (input.kind === 'one_to_one') {
    const next = (input.lastCompletedLesson ?? 0) + 1;
    return {
      mainAdded: credits,
      catchupAdded: 0,
      fundedLessons: [],
      stillUnfunded: [],
      canResume: credits > 0,
      resumeAtLesson: credits > 0 ? next : null,
      message: credits > 0
        ? `${credits} ${credits === 1 ? 'credit' : 'credits'} added. Your classes continue from lesson ${next}, exactly where you left off.`
        : 'No credits were added.',
    };
  }

  /* ── Group ───────────────────────────────────────────────────────────────
     The oldest missed lesson is funded first: it is the one furthest behind
     what the group is doing now, and the one most likely to matter. */
  const catchupAdded = Math.min(missed.length, credits);
  const fundedLessons = missed.slice(0, catchupAdded);
  const stillUnfunded = missed.slice(catchupAdded);
  const mainAdded = credits - catchupAdded;

  const rejoinAt = input.groupCurrentLesson ?? null;
  const canResume = mainAdded > 0;

  return {
    mainAdded,
    catchupAdded,
    fundedLessons,
    stillUnfunded,
    canResume,
    resumeAtLesson: canResume ? rejoinAt : null,
    message: buildMessage({ credits, mainAdded, catchupAdded, stillUnfunded, rejoinAt, canResume }),
  };
}

function buildMessage(a: {
  credits: number;
  mainAdded: number;
  catchupAdded: number;
  stillUnfunded: MissedLesson[];
  rejoinAt: number | null;
  canResume: boolean;
}): string {
  if (a.credits === 0) return 'No credits were added.';

  const bought = `${a.credits} ${a.credits === 1 ? 'credit' : 'credits'} added.`;

  if (a.catchupAdded === 0) {
    return a.rejoinAt
      ? `${bought} Your classes continue from lesson ${a.rejoinAt}.`
      : `${bought} Your classes continue as normal.`;
  }

  const missedPart =
    `You missed ${a.catchupAdded} ${a.catchupAdded === 1 ? 'class' : 'classes'} while your ` +
    `classes were paused, so ${a.catchupAdded} of these ${a.catchupAdded === 1 ? 'is' : 'are'} ` +
    `held as catch-up credits. Your teacher will arrange those separately.`;

  /* Everything went to catch-up and there is nothing left to attend the next
     class with. Said plainly, with the number they need — a family told only
     "please add more credits" has no idea how many. */
  if (!a.canResume) {
    const short = a.stillUnfunded.length;
    return (
      `${bought} All of ${a.credits === 1 ? 'it went' : 'them went'} towards the classes you missed, ` +
      `so your regular classes are still paused. ` +
      (short > 0
        ? `${short} missed ${short === 1 ? 'class is' : 'classes are'} still to be covered, and you need at least one more credit to restart your regular classes.`
        : `Add one more credit to restart your regular classes.`)
    );
  }

  const resume = a.rejoinAt
    ? ` Your regular classes continue from lesson ${a.rejoinAt}.`
    : ' Your regular classes continue as normal.';

  return `${bought} ${missedPart} ${a.mainAdded} ${a.mainAdded === 1 ? 'credit is' : 'credits are'} available for your regular classes.${resume}`;
}

/**
 * The lessons a group covered while a child was paused.
 *
 * The group's own progress is the source of truth — not a count of how long
 * they were away, and not what the child's own schedule said would happen.
 * Everything between the last lesson they finished and the one the group is
 * about to teach is a lesson they were not in the room for.
 *
 * Exclusive of both ends: the lesson they completed is done, and the one the
 * group is about to do is the one they are coming back for.
 */
export function missedBetween(
  lastCompleted: number | null | undefined,
  groupCurrent: number | null | undefined,
  titleFor?: (lessonNumber: number) => string | null
): MissedLesson[] {
  /* Checked before the cast, because Number(null) is 0 and not NaN. Letting a
     null through would read as "completed lesson zero", and a group on lesson
     20 would then owe this child nineteen catch-up sessions they never missed
     — a debt invented out of a missing field. */
  if (lastCompleted === null || lastCompleted === undefined) return [];
  if (groupCurrent === null || groupCurrent === undefined) return [];

  const from = Number(lastCompleted);
  const to = Number(groupCurrent);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return [];

  const out: MissedLesson[] = [];
  for (let n = Math.floor(from) + 1; n < Math.floor(to); n++) {
    out.push({ lessonNumber: n, lessonTitle: titleFor?.(n) ?? null });
  }
  return out;
}
