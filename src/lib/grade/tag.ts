/**
 * SARIRO — one way to say what level somebody is at
 * ============================================================================
 * A grade appeared as "Grade 7" on one screen, "G7" on another, "grade 7" in a
 * sentence, and not at all on the scheduling screens — and there was no way to
 * say "undergraduate" or "working professional" anywhere, although Sariro
 * sells coding and public speaking to both.
 *
 * Now there is one vocabulary, shown as a tag everywhere a learner appears:
 *
 *   G1 … G12   a school grade
 *   U          an undergraduate
 *   P          a graduate, postgraduate or working professional — anyone who
 *              has finished both school and college
 *
 * ── How U and P are stored ──────────────────────────────────────────────────
 * On the same number line as the school grades: 13 is U, 14 is P. Every grade
 * column (profiles, trial seats, leads) and every piece of trial logic — the
 * ±1 band, the teacher's grade range — already works on one number, so this
 * needs no second column and no second rule. And ±1 does the right thing on
 * its own: a G12 can share a class with an undergraduate, an undergraduate
 * with a professional, and a G5 with neither.
 *
 * The numbers 13 and 14 are written HERE and nowhere else. Everything else
 * asks this module.
 *
 * ── "Not given" shows as U ──────────────────────────────────────────────────
 * The founder's rule. The DATA keeps the difference — an unknown grade stays
 * null and is never written as 13 — so a screen that ever needs to tell the
 * two apart can, and changing the display is one line in gradeTag().
 */

export const FIRST_GRADE = 1;
export const LAST_SCHOOL_GRADE = 12;
export const GRADE_UNDERGRADUATE = 13;
export const GRADE_PROFESSIONAL = 14;
/** The top of the scale, for range checks. */
export const LAST_GRADE = GRADE_PROFESSIONAL;

export type GradeTag = `G${number}` | 'U' | 'P';

/** An integer on the 1–14 scale, or null for anything else. */
export function normaliseGrade(raw: unknown): number | null {
  const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
  if (raw === null || raw === undefined || raw === '' || !Number.isInteger(n)) return null;
  return n >= FIRST_GRADE && n <= LAST_GRADE ? n : null;
}

export function isSchoolGrade(raw: unknown): boolean {
  const g = normaliseGrade(raw);
  return g !== null && g <= LAST_SCHOOL_GRADE;
}

/** G7, U or P. Anything unknown is U — see the header. */
export function gradeTag(raw: unknown): GradeTag {
  const g = normaliseGrade(raw);
  if (g === null) return 'U';
  if (g === GRADE_UNDERGRADUATE) return 'U';
  if (g === GRADE_PROFESSIONAL) return 'P';
  return `G${g}`;
}

/** The long form, for a picker or a tooltip. */
export function gradeName(raw: unknown): string {
  const g = normaliseGrade(raw);
  if (g === null) return 'Grade not given';
  if (g === GRADE_UNDERGRADUATE) return 'Undergraduate';
  if (g === GRADE_PROFESSIONAL) return 'Graduate or working professional';
  return `Grade ${g}`;
}

export interface GradeChoice {
  value: number;
  tag: GradeTag;
  name: string;
  /** What a picker shows: "G7", or "U — Undergraduate". */
  label: string;
}

/** Every choice a picker offers, school grades first. */
export const GRADE_CHOICES: GradeChoice[] = Array.from(
  { length: LAST_GRADE - FIRST_GRADE + 1 },
  (_, i) => {
    const value = FIRST_GRADE + i;
    const tag = gradeTag(value);
    const name = gradeName(value);
    return { value, tag, name, label: value <= LAST_SCHOOL_GRADE ? tag : `${tag} — ${name}` };
  }
);

/**
 * Turn the old demo form's two columns into the one number.
 *
 * learner_stage was 'school' | 'undergraduate' | 'postgraduate' | 'professional'
 * with a separate learner_grade for school. Postgraduate is P: the rule is
 * "finished both school and college".
 */
export function gradeFromStage(stage: string | null | undefined, grade: unknown): number | null {
  if (stage === 'undergraduate') return GRADE_UNDERGRADUATE;
  if (stage === 'postgraduate' || stage === 'professional') return GRADE_PROFESSIONAL;
  const g = normaliseGrade(grade);
  return g !== null && g <= LAST_SCHOOL_GRADE ? g : null;
}

/** Accepts '7', 7, 'G7', 'g7', 'U' or 'P' — what a person might type or a URL might carry. */
export function parseGrade(input: unknown): number | null {
  if (typeof input === 'string') {
    const s = input.trim().toUpperCase();
    if (s === 'U') return GRADE_UNDERGRADUATE;
    if (s === 'P') return GRADE_PROFESSIONAL;
    const m = /^G?(\d{1,2})$/.exec(s);
    if (m) {
      const g = normaliseGrade(m[1]);
      return g !== null && g <= LAST_SCHOOL_GRADE ? g : null;
    }
    return null;
  }
  return normaliseGrade(input);
}
