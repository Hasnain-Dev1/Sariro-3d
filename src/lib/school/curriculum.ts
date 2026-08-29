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
 * Five subjects, all GRADE-BASED. Coding is deliberately absent: it is a
 * specialisation with its own tracks (Elementary 48 / Beginner 30 /
 * Intermediate 42 / Advanced 96) and already lives in `sariro-data.ts`. A child
 * does not take "grade 8 coding" — they take Beginner, whatever their age.
 * Modelling it in both places would be two sources of truth for one product.
 *
 * The matrix below is also deliberately not full:
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
    slug: 'biology',
    name: 'Biology',
    tagline: 'Biology Beyond School',
    description:
      'Living systems, from the cell to the ecosystem — taught as mechanisms that explain each other rather than diagrams to memorise. The subject medical entrance exams are built on.',
    groups: ['middle', 'senior'],
    strands: ['life-and-biology', 'scientific-inquiry', 'human-anatomy', 'critical-thinking'],
    accent: '#16A34A',
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
];

/**
 * ── Specialisations ────────────────────────────────────────────────────────
 * Single-topic courses, 48 classes each, for learners who need one thing rather
 * than a whole school year.
 *
 * They are NOT grade-bound. `suitsGrades` is a recommendation printed on the
 * page, not a gate — a bright grade-9 student takes Calculus, a grade-12
 * student catches up on Algebra, and an adult takes Public Speaking with no
 * grade at all. Gating them by grade would rebuild the exact wall the
 * capability map exists to remove.
 *
 * Why these: parents pay most for the topic their child is *failing*, and for
 * the one that *gates a career*. Organic Chemistry and Mechanics are where
 * students give up; Calculus and Algebra gate every entrance exam; Public
 * Speaking is the one on this list an adult buys for themselves.
 */
export interface Specialisation {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Printed as guidance. Never enforced. */
  suitsGrades: string;
  strands: string[];
  accent: string;
}

export const SPECIALISATIONS: Specialisation[] = [
  {
    slug: 'organic-chemistry',
    name: 'Organic Chemistry',
    tagline: 'Organic Chemistry, Unafraid',
    description:
      'The most feared topic in school chemistry, taught as a small number of mechanisms that repeat — not hundreds of reactions to memorise. Once a student sees the pattern, the fear goes.',
    suitsGrades: 'Grades 10–12',
    strands: ['matter-and-chemistry', 'scientific-inquiry', 'problem-solving'],
    accent: '#059669',
  },
  {
    slug: 'mechanics',
    name: 'Mechanics',
    tagline: 'Mechanics, From First Principles',
    description:
      'Forces, motion and energy — the half of physics where most students quietly decide they are not a physics person. Built up slowly enough that the formulas arrive as conclusions.',
    suitsGrades: 'Grades 9–12',
    strands: ['physics-and-motion', 'mathematical-modelling', 'problem-solving'],
    accent: '#7C3AED',
  },
  {
    slug: 'calculus',
    name: 'Calculus',
    tagline: 'Calculus That Makes Sense',
    description:
      'Rates of change and accumulation, taught as ideas before techniques. The gate on every engineering and science entrance exam, and the one most students meet without ever being told what it is for.',
    suitsGrades: 'Grades 11–12',
    strands: ['mathematical-modelling', 'algebraic-reasoning', 'proof-and-logic'],
    accent: '#2563EB',
  },
  {
    slug: 'algebra-1',
    name: 'Algebra 1',
    tagline: 'Algebra 1 — The Foundation',
    description:
      'Variables, equations and the leap from arithmetic to abstraction. This is where students who fall behind in maths usually fell behind, whatever grade they are in now.',
    suitsGrades: 'Grades 7–10',
    strands: ['algebraic-reasoning', 'number-sense', 'problem-solving'],
    accent: '#2563EB',
  },
  {
    slug: 'algebra-2',
    name: 'Algebra 2',
    tagline: 'Algebra 2 — Going Deeper',
    description:
      'Quadratics, functions, sequences and logarithms. The machinery every later subject quietly assumes you already have.',
    suitsGrades: 'Grades 9–12',
    strands: ['algebraic-reasoning', 'proof-and-logic', 'mathematical-modelling'],
    accent: '#1D4ED8',
  },
  {
    slug: 'trigonometry',
    name: 'Trigonometry',
    tagline: 'Trigonometry Without the Panic',
    description:
      'Angles, triangles and the functions that describe anything that repeats. Short, dreaded, and fixable in a term.',
    suitsGrades: 'Grades 9–12',
    strands: ['geometry-and-space', 'algebraic-reasoning', 'measurement'],
    accent: '#0891B2',
  },
  {
    slug: 'public-speaking',
    name: 'Public Speaking',
    tagline: 'Public Speaking & Presence',
    description:
      'Standing up, being heard, and saying the thing you meant to say. The skill that decides interviews, vivas and careers — and the one no school actually teaches.',
    suitsGrades: 'Any age',
    strands: ['speaking-and-presenting', 'argument-and-rhetoric', 'listening-and-dialogue', 'creativity'],
    accent: '#DB2777',
  },
];

export function getSpecialisation(slug: string): Specialisation | null {
  return SPECIALISATIONS.find((s) => s.slug === slug) ?? null;
}

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

export type SlotKind = 'lesson' | 'test';

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
  /**
   * A test occupies a class slot like any other — it is scheduled, attended and
   * consumes a credit — but it has no lesson plan. The teacher opens a test
   * sheet instead. Modelling it as a slot rather than an extra event is what
   * keeps the scheduler, attendance and credits working unchanged.
   */
  kind: SlotKind;
  /** Set on test slots once a sheet exists. Null means "not written yet". */
  testSheetUrl: string | null;
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
  /** Total class slots — lessons plus tests. This is what a parent buys. */
  slotCount: number;
  /** Slots that carry actual teaching. 48 slots = 46 lessons + 2 tests. */
  lessonCount: number;
  testCount: number;
  authoredCount: number;
}

/**
 * Where the tests fall.
 *
 * One at the midpoint, one at the end — the two moments that tell a parent
 * something they cannot get from attendance: is my child actually keeping up,
 * and did the year work?
 *
 * A test takes a class slot rather than being added on top. Two consequences
 * that matter: the parent's 48 classes stay 48 (no surprise extra charges), and
 * the scheduler, credit deduction and attendance need no special case at all.
 *
 * Longer courses get proportionally more, one per ~24 slots, so a 96-class
 * coding track is not assessed twice in two years.
 */
export function testPositions(totalSlots: number): number[] {
  const count = Math.max(2, Math.round(totalSlots / 24));
  // Evenly spaced, always landing the last one on the final slot.
  return Array.from({ length: count }, (_, i) => Math.round(((i + 1) * totalSlots) / count));
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
  const totalSlots = MODULES_PER_GRADE * LESSONS_PER_MODULE;
  const testSlots = new Set(testPositions(totalSlots));
  let authoredCount = 0;
  let testCount = 0;

  for (let m = 1; m <= MODULES_PER_GRADE; m++) {
    const authoredModule = authored?.modules?.[m - 1];
    const lessons: SchoolLesson[] = [];

    for (let l = 0; l < LESSONS_PER_MODULE; l++) {
      const number = (m - 1) * LESSONS_PER_MODULE + l + 1;
      const isTest = testSlots.has(number);
      const authoredTitle = isTest ? undefined : authoredModule?.lessons?.[l];
      if (authoredTitle) authoredCount++;
      if (isTest) testCount++;

      lessons.push({
        key: `${subjectSlug}:${grade}:${m}:${l}`,
        moduleNum: m,
        lessonIndex: l,
        number,
        title: isTest
          ? number === totalSlots
            ? 'Final assessment'
            : 'Mid-year assessment'
          : authoredTitle ?? `Lesson ${number}`,
        authored: !!authoredTitle,
        kind: isTest ? 'test' : 'lesson',
        testSheetUrl: null,
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
    slotCount: totalSlots,
    lessonCount: totalSlots - testCount,
    testCount,
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
