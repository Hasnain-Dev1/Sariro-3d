/**
 * SARIRO — School Curriculum (grade-based)
 * =========================================================
 * The product a seller can actually pitch in thirty seconds:
 *
 *   "Aapka bacha class 8 mein hai? To class 8 wale curriculum se start karte hain."
 *
 * That sentence is why this exists. The capability map is the right model of
 * learning, but "which strand of Mathematical Reasoning is your child on?" does
 * not close a sale to a parent in Lahore or Lucknow. A grade does.
 *
 * ── How this coexists with the map (they are not in conflict) ──────────────
 * A grade is a FIXED LINE through the map, not a replacement for it:
 *
 *   Grade 8 Mathematics  →  a set sequence of 48 lessons
 *                        →  each tagged to map strands (number-sense,
 *                           algebraic-reasoning, proof-and-logic…)
 *                        →  evidence still accrues to the learner model
 *
 * So the school product sells in grade language and *thinks* in capability
 * language. A 1:4 batch travels the fixed line; a 1:1 learner gets a route drawn
 * across the same strands. One spine, two products.
 *
 * Adults and out-of-school learners are served by the map (`/explore`), which is
 * why grade labels live HERE and never leak into the map itself.
 *
 * ── Shape ──────────────────────────────────────────────────────────────────
 *   8 modules × 6 lessons = 48 lessons per grade   (one school year, weekly)
 *   3 grades per group     = 144 lessons per grade group
 *
 * Six lessons per module matches the existing courses (`sariro-data.ts`), so the
 * scheduler, the lesson viewer and progress tracking all work unchanged.
 */

export const MODULES_PER_GRADE = 8;
export const LESSONS_PER_MODULE = 6;
export const LESSONS_PER_GRADE = MODULES_PER_GRADE * LESSONS_PER_MODULE; // 48
export const GRADES_PER_GROUP = 3;
export const LESSONS_PER_GROUP = LESSONS_PER_GRADE * GRADES_PER_GROUP; // 144

export interface GradeGroup {
  slug: string;
  /** What a parent sees. Grade language, never age language. */
  label: string;
  /** Short, parent-facing. Why this stage matters. */
  pitch: string;
  grades: number[];
}

/**
 * Four groups of exactly three grades. Non-overlapping on purpose: a grade must
 * belong to exactly one group, or a parent choosing "grade 6" gets two different
 * answers and the scheduler cannot tell which cohort to place them in.
 */
export const GRADE_GROUPS: GradeGroup[] = [
  {
    slug: 'foundation',
    label: 'Grades 1–3',
    pitch: 'Where curiosity becomes confidence — reading, numbers, and asking why.',
    grades: [1, 2, 3],
  },
  {
    slug: 'primary',
    label: 'Grades 4–6',
    pitch: 'The years that decide whether a child believes they are good at this.',
    grades: [4, 5, 6],
  },
  {
    slug: 'middle',
    label: 'Grades 7–9',
    pitch: 'Where subjects split apart and school starts getting genuinely hard.',
    grades: [7, 8, 9],
  },
  {
    slug: 'senior',
    label: 'Grades 10–12',
    pitch: 'Board years and the first real choice about who they want to become.',
    grades: [10, 11, 12],
  },
];

export interface SchoolSubject {
  slug: string;
  name: string;
  /** The punchy line. Positions us beside school, not as a copy of it. */
  tagline: string;
  /** Parent-facing description of what the child actually gains. */
  description: string;
  /** Which grade groups this subject is offered for. */
  groups: string[];
  /** Capability-map strands this subject develops — how evidence stays connected. */
  strands: string[];
  accent: string;
}

/**
 * Five subjects. The matrix is deliberately not full:
 *
 * Physics and Chemistry do not exist as school subjects before grade 7 —
 * primary school teaches combined Science. Offering "Chemistry for Grade 2"
 * would tell every parent who saw it that we do not understand schools, which is
 * the one thing this product cannot afford.
 */
export const SCHOOL_SUBJECTS: SchoolSubject[] = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    tagline: 'Maths Beyond School',
    description:
      'Not more sums — the reasoning underneath them. Your child stops memorising steps and starts seeing why the steps work, which is what makes the next grade easier instead of harder.',
    groups: ['foundation', 'primary', 'middle', 'senior'],
    strands: ['number-sense', 'algebraic-reasoning', 'geometry-and-space', 'measurement', 'data-and-chance', 'proof-and-logic', 'problem-solving'],
    accent: '#2563EB',
  },
  {
    slug: 'science',
    name: 'Science',
    tagline: 'Science Beyond School',
    description:
      'One subject while the world is still one thing. Experiments, questions and explanations — before it splits into physics, chemistry and biology in grade 7.',
    groups: ['foundation', 'primary'],
    strands: ['scientific-inquiry', 'physics-and-motion', 'matter-and-chemistry', 'life-and-biology', 'critical-thinking'],
    accent: '#0891B2',
  },
  {
    slug: 'physics',
    name: 'Physics',
    tagline: 'Physics Beyond School',
    description:
      'The subject most students give up on because nobody showed them what it is actually describing. Forces, energy and motion taught as explanations of the world, not formulas to survive.',
    groups: ['middle', 'senior'],
    strands: ['physics-and-motion', 'scientific-inquiry', 'mathematical-modelling', 'problem-solving'],
    accent: '#7C3AED',
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    tagline: 'Chemistry Beyond School',
    description:
      'Why things react, burn, dissolve and change. Taught from the particles up, so the periodic table becomes a map instead of a poster to memorise.',
    groups: ['middle', 'senior'],
    strands: ['matter-and-chemistry', 'scientific-inquiry', 'measurement', 'critical-thinking'],
    accent: '#059669',
  },
  {
    slug: 'english',
    name: 'English',
    tagline: 'English Beyond School',
    description:
      'Reading that goes past the words on the page, and writing that says exactly what your child meant. The subject that quietly decides how well they do in every other one.',
    groups: ['foundation', 'primary', 'middle', 'senior'],
    strands: ['reading-and-comprehension', 'writing-and-composition', 'speaking-and-presenting', 'argument-and-rhetoric'],
    accent: '#DB2777',
  },
  {
    slug: 'coding',
    name: 'Coding',
    tagline: 'Coding Beyond School',
    description:
      'Building real things from the first month. Not a screen full of theory — an app, a game, a website your child can show someone.',
    groups: ['foundation', 'primary', 'middle', 'senior'],
    strands: ['computational-thinking', 'programming-foundations', 'digital-craft', 'problem-solving', 'creativity'],
    accent: '#EA580C',
  },
];

/* ── lookups ──────────────────────────────────────────────────────────────── */

export function gradeGroupFor(grade: number): GradeGroup | null {
  return GRADE_GROUPS.find((g) => g.grades.includes(grade)) ?? null;
}

export function subjectsForGroup(groupSlug: string): SchoolSubject[] {
  return SCHOOL_SUBJECTS.filter((s) => s.groups.includes(groupSlug));
}

export function subjectsForGrade(grade: number): SchoolSubject[] {
  const group = gradeGroupFor(grade);
  return group ? subjectsForGroup(group.slug) : [];
}

export function getSubject(slug: string): SchoolSubject | null {
  return SCHOOL_SUBJECTS.find((s) => s.slug === slug) ?? null;
}

/* ── the syllabus scaffold ────────────────────────────────────────────────── */

export interface SchoolLesson {
  /** `${subject}:${grade}:${moduleNum}:${lessonIndex}` — stable, immutable. */
  key: string;
  moduleNum: number;
  lessonIndex: number;
  /** Global 1–48 within the grade. What a parent counts. */
  number: number;
  /** Empty until authored. The scaffold exists so scheduling works before content does. */
  title: string;
  authored: boolean;
}

export interface SchoolModule {
  num: number;
  title: string;
  lessons: SchoolLesson[];
  authored: boolean;
}

export interface GradeSyllabus {
  subjectSlug: string;
  grade: number;
  modules: SchoolModule[];
  lessonCount: number;
  authoredCount: number;
}

/**
 * Authored titles, as they get written. Keyed by `${subject}:${grade}`.
 *
 * Everything not in here is generated as a blank, numbered placeholder — which
 * is the point: **a batch can be sold, scheduled, staffed and attended before a
 * single lesson title is written.** Content is written ahead of the class that
 * needs it, not ahead of the business.
 */
export const AUTHORED_TITLES: Record<string, { modules: { title: string; lessons: string[] }[] }> = {};

export function buildGradeSyllabus(subjectSlug: string, grade: number): GradeSyllabus {
  const authored = AUTHORED_TITLES[`${subjectSlug}:${grade}`];
  const modules: SchoolModule[] = [];
  let authoredCount = 0;

  for (let m = 1; m <= MODULES_PER_GRADE; m++) {
    const authoredModule = authored?.modules?.[m - 1];
    const lessons: SchoolLesson[] = [];

    for (let l = 0; l < LESSONS_PER_MODULE; l++) {
      const authoredTitle = authoredModule?.lessons?.[l];
      const number = (m - 1) * LESSONS_PER_MODULE + l + 1;
      if (authoredTitle) authoredCount++;
      lessons.push({
        key: `${subjectSlug}:${grade}:${m}:${l}`,
        moduleNum: m,
        lessonIndex: l,
        number,
        title: authoredTitle ?? `Lesson ${number}`,
        authored: !!authoredTitle,
      });
    }

    modules.push({
      num: m,
      title: authoredModule?.title ?? `Module ${m}`,
      lessons,
      authored: !!authoredModule,
    });
  }

  return {
    subjectSlug,
    grade,
    modules,
    lessonCount: MODULES_PER_GRADE * LESSONS_PER_MODULE,
    authoredCount,
  };
}

/* ── what a parent buys ───────────────────────────────────────────────────── */

export type EnrolmentScope = 'grade' | 'group';

export interface EnrolmentOption {
  scope: EnrolmentScope;
  subjectSlug: string;
  /** Set for scope 'grade'. */
  grade?: number;
  groupSlug: string;
  label: string;
  lessonCount: number;
  /** Weekly classes → months of commitment. Drives the monthly price. */
  months: number;
}

/** One class per week. 48 lessons ≈ one school year. */
export const LESSONS_PER_MONTH = 4;

/**
 * The two things a parent can buy for a subject: this grade, or the whole group.
 *
 * Offering both matters. "Just grade 6" is a low-commitment yes; the group is the
 * one that keeps a child for three years. Showing them side by side lets the
 * parent choose the smaller one — which is how you get the first yes at all.
 */
export function enrolmentOptions(subjectSlug: string, grade: number): EnrolmentOption[] {
  const group = gradeGroupFor(grade);
  const subject = getSubject(subjectSlug);
  if (!group || !subject || !subject.groups.includes(group.slug)) return [];

  return [
    {
      scope: 'grade',
      subjectSlug,
      grade,
      groupSlug: group.slug,
      label: `${subject.name} — Grade ${grade}`,
      lessonCount: LESSONS_PER_GRADE,
      months: LESSONS_PER_GRADE / LESSONS_PER_MONTH,
    },
    {
      scope: 'group',
      subjectSlug,
      groupSlug: group.slug,
      label: `${subject.name} — ${group.label}`,
      lessonCount: LESSONS_PER_GROUP,
      months: LESSONS_PER_GROUP / LESSONS_PER_MONTH,
    },
  ];
}
