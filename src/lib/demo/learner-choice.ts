import { SCHOOL_SUBJECTS, SPECIALISATIONS, GRADE_GROUPS } from '@/lib/school/curriculum';
import { TRACKS } from '@/lib/sariro-data';

/**
 * SARIRO — who is asking, and what for
 * =========================================================
 * The demo form asked one question about content: a flat <select> of fifteen
 * coding courses, headed "Course interest (optional)". Three things were wrong
 * with it, in rising order of cost:
 *
 *   1. It listed only coding. A parent booking a free class for Class 8 maths —
 *      the thing most of the site now sells — found nothing that described what
 *      they wanted, so they left it on "No preference".
 *   2. Fifteen options with no grouping is not a choice, it is a wall. The one
 *      relevant entry was somewhere in the middle of fourteen irrelevant ones.
 *   3. It never asked WHO the learner is. Every booking arrived looking
 *      identical, so nobody could tell a Class 6 child from an undergraduate
 *      from a working professional — which decides who should teach the class,
 *      how long it should run, and what it should cost.
 *
 * ── The shape of the questions ──────────────────────────────────────────────
 * Three, and they are deliberately not the same question twice:
 *
 *   subject   what to learn            Maths · Coding & AI · Public Speaking
 *   focus     which part of it         Grade 8 · Calculus · Web Builder Pro
 *   stage     who the learner is       Grade 8 · Undergraduate · Professional
 *
 * `focus` and `stage` look alike for a school child and are genuinely different
 * for everyone else: a working professional taking Calculus, an undergraduate
 * revisiting Grade 11 physics. Asking both is what separates "a Class 8 child"
 * from "an adult who needs Class 8 material", and those are not the same class.
 *
 * The form softens the overlap by pre-filling `stage` when `focus` names a
 * grade — so the common case is still one choice, not two.
 *
 * ── Everything here is derived ──────────────────────────────────────────────
 * Subjects, their real grade ranges, the specialisations and the coding tracks
 * all come from the curriculum and catalogue modules. The only thing written by
 * hand is SPECIALISATION_PARENT, because Specialisation carries no parent
 * subject — see the note there.
 */

export type LearnerStage = 'school' | 'undergraduate' | 'postgraduate' | 'professional';

export interface Choice {
  value: string;
  label: string;
}

export interface ChoiceGroup {
  label: string;
  options: Choice[];
}

/** Marks the "I don't know yet" answer, which must never be a dead end. */
export const UNDECIDED = '';

/**
 * Which subject a focus course belongs under.
 *
 * `Specialisation` has no parent field — the focus courses were authored as a
 * flat list because they are sold standalone. But a parent choosing "Chemistry"
 * should be offered Organic Chemistry without having to know it is filed
 * elsewhere, so the relationship is stated once, here.
 *
 * Public Speaking is deliberately absent: it belongs to no school subject and
 * appears as a subject in its own right.
 */
const SPECIALISATION_PARENT: Record<string, string> = {
  calculus: 'mathematics',
  'algebra-1': 'mathematics',
  'algebra-2': 'mathematics',
  trigonometry: 'mathematics',
  'organic-chemistry': 'chemistry',
  mechanics: 'physics',
};

export const CODING_SUBJECT = 'coding';
export const PUBLIC_SPEAKING_SUBJECT = 'public-speaking';

/** Step 1 — grouped, so the list reads as a small set of kinds. */
export function subjectGroups(): ChoiceGroup[] {
  return [
    {
      label: 'School subjects',
      options: SCHOOL_SUBJECTS.map((s) => ({ value: s.slug, label: s.name })),
    },
    {
      label: 'Beyond school',
      options: [
        { value: CODING_SUBJECT, label: 'Coding & AI' },
        { value: PUBLIC_SPEAKING_SUBJECT, label: 'Public Speaking' },
      ],
    },
  ];
}

/** The grades a subject is actually taught at — never a generic 1–12. */
function gradesFor(subjectSlug: string): number[] {
  const subject = SCHOOL_SUBJECTS.find((s) => s.slug === subjectSlug);
  if (!subject) return [];
  return GRADE_GROUPS.filter((g) => subject.groups.includes(g.slug)).flatMap((g) => g.grades);
}

/** Encodes a grade choice so the value survives a round trip through the form. */
export const gradeValue = (grade: number) => `grade-${grade}`;

/** Reads a grade back out of a focus value, or null if it names something else. */
export function gradeFromFocus(focus: string): number | null {
  const m = /^grade-(\d{1,2})$/.exec(focus);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 12 ? n : null;
}

/**
 * Step 2 — what is offered depends entirely on step 1.
 *
 * Returns null when the subject needs no refinement (Public Speaking is one
 * course; "not sure" is not a subject), so the form can hide the field rather
 * than show an empty select.
 */
export function focusGroupsFor(subject: string): { label: string; groups: ChoiceGroup[] } | null {
  if (!subject) return null;

  if (subject === CODING_SUBJECT) {
    return {
      label: 'Which course?',
      groups: [
        { label: 'Courses', options: TRACKS.map((t) => ({ value: t.id, label: t.name })) },
      ],
    };
  }

  if (subject === PUBLIC_SPEAKING_SUBJECT) return null;

  const grades = gradesFor(subject);
  if (grades.length === 0) return null;

  const groups: ChoiceGroup[] = [
    {
      label: 'By grade',
      options: grades.map((g) => ({ value: gradeValue(g), label: `Grade ${g}` })),
    },
  ];

  // Focus courses that sit under this subject, offered beside the grades so a
  // learner who wants "Calculus" does not have to guess which grade it lives in.
  const focus = SPECIALISATIONS.filter((sp) => SPECIALISATION_PARENT[sp.slug] === subject);
  if (focus.length > 0) {
    groups.push({
      label: 'Focus courses',
      options: focus.map((sp) => ({ value: sp.slug, label: sp.name })),
    });
  }

  return { label: 'Grade or focus course', groups };
}

/**
 * Step 3 — where the learner is in their education.
 *
 * This is the question the old form never asked, and the one that tells us
 * whether a booking is a school child, a college student or somebody in work.
 * School grades are listed individually rather than as one "School" option:
 * "Grade 4" and "Grade 11" need different teachers, and collapsing them would
 * throw away the distinction this field exists to capture.
 */
export function stageGroups(): ChoiceGroup[] {
  const allGrades = GRADE_GROUPS.flatMap((g) => g.grades);
  return [
    {
      label: 'At school',
      options: allGrades.map((g) => ({ value: gradeValue(g), label: `Grade ${g}` })),
    },
    {
      label: 'Beyond school',
      options: [
        { value: 'undergraduate', label: 'Undergraduate' },
        { value: 'postgraduate', label: 'Postgraduate' },
        { value: 'professional', label: 'Working professional' },
      ],
    },
  ];
}

/** Splits a stage value into the two columns the database stores. */
export function parseStage(value: string): { stage: LearnerStage | null; grade: number | null } {
  const grade = gradeFromFocus(value);
  if (grade !== null) return { stage: 'school', grade };
  if (value === 'undergraduate' || value === 'postgraduate' || value === 'professional') {
    return { stage: value, grade: null };
  }
  return { stage: null, grade: null };
}

/** One human-readable line for an admin list. Never shows a raw slug. */
export function describeChoice(
  subject: string | null,
  focus: string | null,
  stage: string | null,
  grade: number | null
): string {
  const subjectLabel =
    subjectGroups()
      .flatMap((g) => g.options)
      .find((o) => o.value === subject)?.label ?? null;

  const focusLabel = (() => {
    if (!focus) return null;
    const g = gradeFromFocus(focus);
    if (g !== null) return `Grade ${g}`;
    return (
      TRACKS.find((t) => t.id === focus)?.name ??
      SPECIALISATIONS.find((sp) => sp.slug === focus)?.name ??
      focus
    );
  })();

  const who =
    stage === 'school' && grade !== null
      ? `Grade ${grade}`
      : stage === 'undergraduate'
        ? 'Undergraduate'
        : stage === 'postgraduate'
          ? 'Postgraduate'
          : stage === 'professional'
            ? 'Working professional'
            : null;

  const what = [subjectLabel, focusLabel].filter(Boolean).join(' · ');
  if (!what && !who) return 'No preference';
  if (!who) return what;
  if (!what) return who;

  // A school child studying their own year is the common case, and it would
  // otherwise read "Mathematics · Grade 8 — Grade 8". Say the grade once.
  if (stage === 'school' && grade !== null && gradeFromFocus(focus ?? '') === grade) {
    return what;
  }
  return `${what} — ${who}`;
}
