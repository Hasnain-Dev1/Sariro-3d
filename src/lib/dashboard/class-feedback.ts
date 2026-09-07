/**
 * SARIRO — what happened in the class, from both sides
 * ============================================================================
 * A trial class produces the single most valuable thing the company has: two
 * independent opinions about whether a child and Sariro suit each other. The
 * teacher saw them work. The parent watched them enjoy it or not. A seller
 * ringing afterwards is guessing without both.
 *
 * So both are collected, they are kept apart, and neither is allowed to stand
 * in for the other.
 *
 * ── Why the teacher's is mandatory and the student's is not ─────────────────
 * The teacher is paid for the class. Making their feedback a condition of pay
 * is the only lever that reliably produces it, and it is fair: reporting on the
 * class is part of teaching it. A parent owes us nothing, so their feedback is
 * asked for warmly and never demanded — a form that blocks a parent is a form
 * that loses the parent.
 *
 * ── One row per child, not one per class ────────────────────────────────────
 * A trial can have several children in it. "The class went well" is worthless
 * to a seller who has three families to ring. The teacher writes one rating and
 * one remark per child, and the seller gets three separate answers.
 *
 * ── The scale ───────────────────────────────────────────────────────────────
 * 1 to 5, and it means different things depending on who is holding the pen:
 * a student rates the CLASS, a teacher rates the CHILD's session. Averaging
 * across both would produce a number that means nothing, so they never mix.
 */

export type FeedbackAuthor = 'teacher' | 'student';

/** How likely this family is to buy, in the teacher's judgement. */
export type Interest = 'hot' | 'warm' | 'cold';

export interface ClassFeedback {
  id?: string;
  booking_id: string;
  author_id: string;
  author_role: FeedbackAuthor;
  /** The child this is ABOUT. For a student's own feedback, themselves. */
  subject_student_id: string | null;
  rating: number | null;
  remarks: string | null;
  /** Teacher only — the seller's most useful single field. */
  interest_level?: Interest | null;
  created_at?: string | null;
}

export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** Remarks long enough to be worth reading, short enough to actually get written. */
export const MIN_REMARK_CHARS = 15;

/* ══════════════════════════════════════════════════════════════════════════
   Ratings
   ══════════════════════════════════════════════════════════════════════════ */

export interface RatingSummary {
  /** Rounded to one decimal. Null when nobody has rated yet. */
  average: number | null;
  count: number;
  /** How many gave 1, 2, 3, 4, 5 — index 0 is one star. */
  distribution: [number, number, number, number, number];
}

const EMPTY: RatingSummary = { average: null, count: 0, distribution: [0, 0, 0, 0, 0] };

/**
 * Average a set of ratings.
 *
 * Only whole numbers in range count. A rating of 0, 6 or NaN is a bug
 * somewhere upstream, and letting it into the average turns a visible bug into
 * an invisible one that quietly drags a teacher's score down.
 */
export function ratingSummary(feedback: Pick<ClassFeedback, 'rating'>[] | null | undefined): RatingSummary {
  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let total = 0;
  let count = 0;

  for (const f of feedback ?? []) {
    const r = f?.rating;
    if (typeof r !== 'number' || !Number.isInteger(r)) continue;
    if (r < MIN_RATING || r > MAX_RATING) continue;
    distribution[r - 1]++;
    total += r;
    count++;
  }

  if (count === 0) return { ...EMPTY, distribution };
  return { average: Math.round((total / count) * 10) / 10, count, distribution };
}

/**
 * A teacher's standing: what STUDENTS said about their classes.
 *
 * Deliberately one-directional. A teacher's own ratings of children say nothing
 * about the teacher, and folding them in would let somebody raise their own
 * score by being generous.
 */
export function teacherRating(feedback: ClassFeedback[] | null | undefined): RatingSummary {
  return ratingSummary((feedback ?? []).filter((f) => f.author_role === 'student'));
}

/**
 * Ratings from the last `days` days, for "how are they doing lately".
 *
 * An average over all time is a number that stops moving: a teacher who was
 * poor in their first month and excellent since looks mediocre forever, and
 * nobody can see the improvement. The overall figure stays, and this sits
 * beside it.
 */
export function recentRating(
  feedback: ClassFeedback[] | null | undefined,
  days = 90,
  now: number = Date.now()
): RatingSummary {
  const floor = now - days * 86_400_000;
  return ratingSummary(
    (feedback ?? []).filter((f) => {
      if (f.author_role !== 'student') return false;
      const t = Date.parse(f.created_at ?? '');
      return Number.isFinite(t) && t >= floor;
    })
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The pay gate
   ══════════════════════════════════════════════════════════════════════════ */

export interface PayGate {
  unlocked: boolean;
  /** Children still waiting on the teacher's write-up. */
  missing: string[];
  /** What the teacher reads. Empty when they are done. */
  message: string;
}

/**
 * May this class be paid for yet?
 *
 * The rule the founder set: a teacher does not get paid for a trial until they
 * have rated and written up EVERY child in it. Not "the class" — every child,
 * because that is what the seller has to act on.
 *
 * Returns the names still outstanding rather than a bare false, so the teacher
 * is told what to do instead of that something is wrong.
 */
export function payGate(
  studentsInClass: { id: string; name: string }[],
  feedback: ClassFeedback[] | null | undefined
): PayGate {
  const done = new Set(
    (feedback ?? [])
      .filter(
        (f) =>
          f.author_role === 'teacher' &&
          typeof f.rating === 'number' &&
          f.rating >= MIN_RATING &&
          f.rating <= MAX_RATING &&
          (f.remarks ?? '').trim().length >= MIN_REMARK_CHARS
      )
      .map((f) => f.subject_student_id)
      .filter((id): id is string => !!id)
  );

  const missing = studentsInClass.filter((s) => !done.has(s.id)).map((s) => s.name);

  if (studentsInClass.length === 0) {
    // No roster is not the teacher's fault, and withholding pay for it would
    // punish them for somebody else's data problem.
    return { unlocked: true, missing: [], message: '' };
  }
  if (missing.length === 0) {
    return { unlocked: true, missing: [], message: '' };
  }
  return {
    unlocked: false,
    missing,
    message:
      missing.length === 1
        ? `Write up ${missing[0]} to release this class's pay.`
        : `Write up ${missing.length} students to release this class's pay: ${missing.join(', ')}.`,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   What the seller needs
   ══════════════════════════════════════════════════════════════════════════ */

export interface LeadSignal {
  /** 0-100. Higher is worth ringing sooner. */
  score: number;
  /** The one word a seller sorts by. */
  temperature: Interest | 'unknown';
  /** Why it scored that, in plain words. */
  reasons: string[];
  teacherRating: number | null;
  studentRating: number | null;
  /** Nobody has said anything yet. */
  silent: boolean;
}

/**
 * How promising is this lead, given what both sides said?
 *
 * The teacher's own read of interest dominates, because they were in the room
 * and it is the field they are answering directly. The two ratings then
 * confirm or undercut it. A parent who rated the class 5 is a different call
 * from one who rated it 2, whatever the teacher thought.
 *
 * The output is a number a list can sort by, and the reasons behind it, because
 * a seller who cannot see why a lead scored 80 will not trust the 80.
 */
export function leadSignal(feedback: ClassFeedback[] | null | undefined): LeadSignal {
  const rows = feedback ?? [];
  const fromTeacher = rows.filter((f) => f.author_role === 'teacher');
  const fromStudent = rows.filter((f) => f.author_role === 'student');

  const t = ratingSummary(fromTeacher).average;
  const s = ratingSummary(fromStudent).average;
  const interest = fromTeacher.find((f) => !!f.interest_level)?.interest_level ?? null;

  if (rows.length === 0) {
    return {
      score: 0, temperature: 'unknown', silent: true,
      reasons: ['Nobody has written this class up yet.'],
      teacherRating: null, studentRating: null,
    };
  }

  const reasons: string[] = [];
  let score = 35; // a class happened at all

  if (interest === 'hot') { score += 35; reasons.push('Teacher marked them hot'); }
  else if (interest === 'warm') { score += 18; reasons.push('Teacher marked them warm'); }
  else if (interest === 'cold') { score -= 25; reasons.push('Teacher marked them cold'); }

  if (s !== null) {
    score += (s - 3) * 9;
    reasons.push(`Parent rated the class ${s}/5`);
  }
  if (t !== null) {
    score += (t - 3) * 6;
    reasons.push(`Teacher rated the session ${t}/5`);
  }

  if (s !== null && t !== null && Math.abs(s - t) >= 2) {
    // Worth a human eye: the two people in the room disagreed sharply.
    reasons.push('Teacher and parent disagreed — worth a call');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const temperature: Interest | 'unknown' =
    interest ?? (score >= 70 ? 'hot' : score >= 45 ? 'warm' : 'cold');

  return { score, temperature, reasons, teacherRating: t, studentRating: s, silent: false };
}

/** Sort leads so the ones worth ringing first come first. */
export function byPriority<T>(rows: T[], signalOf: (row: T) => LeadSignal): T[] {
  return [...rows].sort((a, b) => {
    const sa = signalOf(a);
    const sb = signalOf(b);
    // A silent class outranks a cold one: it needs chasing, not writing off.
    if (sa.silent !== sb.silent) return sa.silent ? -1 : 1;
    return sb.score - sa.score;
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   Writing one
   ══════════════════════════════════════════════════════════════════════════ */

export interface FeedbackCheck {
  ok: boolean;
  problem: string;
}

/**
 * Is this feedback good enough to save?
 *
 * A teacher's remark has a floor because "good" helps nobody, and a seller
 * reading it has to ring a parent off the back of it. A student's does not:
 * they may only want to give a rating, and demanding a paragraph from a parent
 * is how you get no feedback at all.
 */
export function checkFeedback(
  role: FeedbackAuthor,
  rating: number | null,
  remarks: string
): FeedbackCheck {
  if (rating === null || !Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    return { ok: false, problem: 'Choose a rating from 1 to 5.' };
  }
  if (role === 'teacher') {
    const text = (remarks ?? '').trim();
    if (text.length < MIN_REMARK_CHARS) {
      const short = MIN_REMARK_CHARS - text.length;
      return {
        ok: false,
        problem: `A few more words — ${short} more character${short === 1 ? '' : 's'}. The seller rings the parent off the back of this.`,
      };
    }
  }
  return { ok: true, problem: '' };
}
