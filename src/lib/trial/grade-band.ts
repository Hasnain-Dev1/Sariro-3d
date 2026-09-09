/**
 * SARIRO — a grade 1 and a grade 10 do not belong in the same half hour
 * ============================================================================
 * A trial holds four children, and until now any four. The seat maths was
 * right and the teaching was impossible: one lesson cannot serve a six-year-old
 * learning to read and a fifteen-year-old doing board revision, and the trial
 * is the half hour that decides whether a family buys anything.
 *
 * ── The first child sets the band ───────────────────────────────────────────
 * Whoever books a slot first fixes it at their grade ± 1. A grade 6 opens a
 * 5–7 class; after that only 5, 6 and 7 may join, however many seats are left.
 *
 * The first booking deciding is not arbitrary — it is the only rule that can be
 * applied at the moment somebody books, without knowing who will come later.
 * A "closest fit" scheme would need the whole day's bookings to exist before
 * any of them could be placed.
 *
 * ── Why ±1 and not a fixed band like 1–3, 4–6 ───────────────────────────────
 * Fixed bands split the pairs that matter most: a 3 and a 4 are a year apart
 * and cannot share a class, while a 1 and a 3 can. A moving window is a
 * promise about the actual gap between the children in the room, which is the
 * thing that decides whether a lesson works.
 */

/** How far apart two children in one trial may be. */
export const GRADE_SPREAD = 1;

/** Sariro teaches grades 1 to 12. */
export const MIN_GRADE = 1;
export const MAX_GRADE = 12;

export interface GradeBand {
  /** The grade that opened the class. */
  anchor: number;
  min: number;
  max: number;
}

/** The band a slot is fixed at once `anchor` has booked it. */
export function bandFor(anchor: number): GradeBand {
  const a = clamp(anchor);
  return {
    anchor: a,
    min: Math.max(MIN_GRADE, a - GRADE_SPREAD),
    max: Math.min(MAX_GRADE, a + GRADE_SPREAD),
  };
}

/**
 * The band a slot ALREADY has, from the children in it.
 *
 * Read from the earliest booking rather than from a stored column, so a class
 * assembled before this rule existed still answers sensibly, and so there is
 * no second copy of the truth to drift.
 *
 * `grades` must be in the order the children joined.
 */
export function bandOf(grades: readonly (number | null | undefined)[]): GradeBand | null {
  for (const g of grades) {
    if (typeof g === 'number' && Number.isFinite(g)) return bandFor(g);
  }
  return null;
}

/**
 * Whether a class may take another child at all.
 *
 * `bandOf` answers null for two OPPOSITE situations, and collapsing them is a
 * hole:
 *
 *   · an EMPTY slot          — no band yet, and anybody may open it
 *   · a class holding children whose grades were never recorded
 *
 * The second is not open, it is unknown. Treating it as open is precisely how
 * a grade 1 gets seated with a grade 10 — the class already has somebody in
 * it, we simply cannot see who. Every trial booked before grades existed is in
 * that state, so this is not hypothetical.
 *
 * A class like that is closed to newcomers until somebody records a grade for
 * the child already in it. That costs three seats; the alternative costs the
 * lesson.
 */
export function joinable(seatsTaken: number, grades: readonly (number | null | undefined)[]): Fit {
  if (seatsTaken <= 0) return { ok: true, message: '' };
  if (bandOf(grades) !== null) return { ok: true, message: '' };
  return {
    ok: false,
    message: 'We do not know what level that class is teaching at, so we cannot add anybody to it. Please pick another time.',
  };
}

export interface Fit {
  ok: boolean;
  /** Shown to a seller, and to a parent, so a refusal is never a shrug. */
  message: string;
}

/**
 * May a child of this grade join a class whose band is already set?
 *
 * A slot with no band yet takes anybody — they become the anchor. An unknown
 * grade is refused rather than waved through: seating a child whose level
 * nobody recorded is how the grade 1 and the grade 10 end up together, and
 * "we did not ask" is not a reason to risk the lesson.
 */
export function fits(grade: number | null | undefined, band: GradeBand | null): Fit {
  if (band === null) {
    return typeof grade === 'number' && Number.isFinite(grade)
      ? { ok: true, message: '' }
      : { ok: false, message: 'We need the grade before we can place them in a class.' };
  }

  if (typeof grade !== 'number' || !Number.isFinite(grade)) {
    return { ok: false, message: 'We need the grade before we can place them in a class.' };
  }

  const g = clamp(grade);
  if (g >= band.min && g <= band.max) return { ok: true, message: '' };

  return {
    ok: false,
    message: `That class is for grades ${band.min}–${band.max}. Pick another time for a grade ${g} student.`,
  };
}

/** "Grades 5–7" / "Grade 1–2" for a picker. */
export function bandLabel(band: GradeBand | null): string {
  if (!band) return 'Any grade';
  return band.min === band.max ? `Grade ${band.min}` : `Grades ${band.min}–${band.max}`;
}

function clamp(g: number): number {
  return Math.max(MIN_GRADE, Math.min(MAX_GRADE, Math.round(g)));
}
