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
 *
 * ── Two rules for anyone authoring here ────────────────────────────────────
 *
 * 1. **Modules 4 and 8 carry FIVE lessons, not six.** `testPositions(48)` puts
 *    the assessments at slots 24 and 48, which are the last slots of modules 4
 *    and 8. `buildGradeSyllabus` overrides those titles, so a sixth entry in
 *    those arrays is silently discarded. Writing five says so out loud.
 *    6 modules × 6 + 2 modules × 5 = 46 lessons + 2 tests = 48 slots.
 *
 * 2. **Names are board-neutral on purpose.** Sariro sells worldwide at one flat
 *    USD price, so the syllabus has to read as *this parent's* syllabus in
 *    Lucknow, Lagos, Dubai and Toronto alike. The topic spine for maths 6–10 is
 *    near-identical across NCERT, Cambridge, Common Core and the IB — but the
 *    vocabulary is not. "Mensuration", "practical geometry" and "comparing
 *    quantities" are South-Asian textbook words; outside that market they read
 *    as a foreign curriculum. "Area, Surface Area and Volume" is recognised by
 *    everyone, including the CBSE parent looking for their mensuration chapter.
 *    The translation only fails in one direction, so we always pick the global
 *    name. Lesson titles stay concrete — a parent skims these to decide whether
 *    we actually know the subject.
 */
export const AUTHORED_TITLES: Record<string, { modules: { title: string; lessons: string[] }[] }> = {
  /* ── Mathematics ──────────────────────────────────────────────────────────
   * Grades 6–10 authored first: the years where a child either keeps up or
   * quietly decides they are "not a maths person", and where parents are most
   * willing to pay for help.
   */

  'mathematics:6': {
    modules: [
      {
        title: 'Numbers and Place Value',
        lessons: [
          'Reading and writing large numbers',
          'Place value, and what each digit is worth',
          'Comparing and ordering large numbers',
          'Rounding and estimating',
          'Roman numerals and other ways to write numbers',
          'Solving word problems with large numbers',
        ],
      },
      {
        title: 'Whole Numbers, Factors and Multiples',
        lessons: [
          'The number line and how whole numbers behave',
          'Properties of addition and multiplication',
          'Factors, multiples and divisibility rules',
          'Prime and composite numbers',
          'Highest common factor',
          'Lowest common multiple',
        ],
      },
      {
        title: 'Integers — Numbers Below Zero',
        lessons: [
          'Why negative numbers had to be invented',
          'Integers on the number line',
          'Adding integers',
          'Subtracting integers',
          'Comparing and ordering integers',
          'Integers in the real world: temperature, debt, sea level',
        ],
      },
      {
        // Five lessons: slot 24 is the mid-year assessment.
        title: 'Fractions',
        lessons: [
          'What a fraction actually means',
          'Equivalent fractions and simplest form',
          'Comparing and ordering fractions',
          'Adding and subtracting fractions',
          'Multiplying fractions, and why the answer gets smaller',
        ],
      },
      {
        title: 'Decimals',
        lessons: [
          'Decimals as another way of writing fractions',
          'Place value after the decimal point',
          'Comparing and ordering decimals',
          'Adding and subtracting decimals',
          'Multiplying and dividing decimals',
          'Decimals in money and measurement',
        ],
      },
      {
        title: 'Geometry — Lines, Angles and Shapes',
        lessons: [
          'Points, lines, rays and segments',
          'Measuring and drawing angles',
          'Types of angles and how they pair up',
          'Triangles and how they are classified',
          'Quadrilaterals and polygons',
          'Circles: centre, radius, diameter and chord',
        ],
      },
      {
        title: 'Algebra, Ratio and Proportion',
        lessons: [
          'Using a letter to stand for a number',
          'Writing an expression from a sentence',
          'Solving simple equations',
          'Ratio — comparing two quantities',
          'Proportion and equivalent ratios',
          'The unitary method: finding the price of one',
        ],
      },
      {
        // Five lessons: slot 48 is the final assessment.
        title: 'Perimeter, Area and Data',
        lessons: [
          'Perimeter of rectangles and polygons',
          'Area of squares and rectangles',
          'Collecting and organising data',
          'Bar graphs and pictographs',
          'Reading and interpreting a graph',
        ],
      },
    ],
  },

  'mathematics:7': {
    modules: [
      {
        title: 'Integers and Their Operations',
        lessons: [
          'Integers on the number line, revisited',
          'Multiplying integers',
          'Dividing integers',
          'Properties of integer operations',
          'Order of operations',
          'Solving integer word problems',
        ],
      },
      {
        title: 'Fractions, Decimals and Rational Numbers',
        lessons: [
          'Multiplying fractions by fractions',
          'Dividing fractions, and the reciprocal',
          'Multiplying and dividing decimals',
          'Rational numbers — fractions that can be negative',
          'Placing rational numbers on the number line',
          'Operations with rational numbers',
        ],
      },
      {
        title: 'Data and Statistics',
        lessons: [
          'Collecting data and organising it',
          'The mean as a balancing point',
          'Median and mode',
          'Choosing the right average',
          'Bar graphs and double bar graphs',
          'Chance, and the language of probability',
        ],
      },
      {
        title: 'Simple Equations',
        lessons: [
          'From arithmetic to algebra',
          'Building an equation from a story',
          'Solving equations by keeping the balance',
          'Equations with the variable on both sides',
          'Checking a solution, and what a wrong answer tells you',
        ],
      },
      {
        title: 'Lines and Angles',
        lessons: [
          'Complementary and supplementary angles',
          'Adjacent angles and linear pairs',
          'Vertically opposite angles',
          'Parallel lines cut by a transversal',
          'Corresponding, alternate and co-interior angles',
          'Proving that two lines are parallel',
        ],
      },
      {
        title: 'Triangles',
        lessons: [
          'The angle sum of a triangle',
          'The exterior angle property',
          'Classifying triangles by side and by angle',
          'Congruence — when two triangles are the same',
          'The congruence conditions: SSS, SAS, ASA and RHS',
          'The Pythagorean relationship',
        ],
      },
      {
        title: 'Ratio, Percentage and Money',
        lessons: [
          'Ratio and proportion, revisited',
          'Percentage — a ratio out of one hundred',
          'Converting between fractions, decimals and percentages',
          'Percentage increase and decrease',
          'Profit, loss and discount',
          'Simple interest',
        ],
      },
      {
        title: 'Perimeter, Area and Symmetry',
        lessons: [
          'Area of a parallelogram',
          'Area of a triangle',
          'Circumference of a circle',
          'Area of a circle',
          'Symmetry, reflection and rotation',
        ],
      },
    ],
  },

  'mathematics:8': {
    modules: [
      {
        title: 'Rational Numbers',
        lessons: [
          'The rational number system',
          'Properties of rational numbers',
          'Finding rational numbers between two others',
          'Operations, and the shortcuts worth knowing',
          'Rational numbers in word problems',
          'Where rational numbers run out — a first look at irrationals',
        ],
      },
      {
        title: 'Exponents and Powers',
        lessons: [
          'Why repeated multiplication gets its own notation',
          'The laws of exponents',
          'Negative exponents',
          'Powers of ten and standard form',
          'Very large and very small numbers in science',
          'Comparing quantities written in standard form',
        ],
      },
      {
        title: 'Squares, Cubes and Roots',
        lessons: [
          'Square numbers and the patterns inside them',
          'Finding square roots',
          'Square roots of fractions and decimals',
          'Cube numbers',
          'Finding cube roots',
          'Estimating roots that are not exact',
        ],
      },
      {
        title: 'Algebraic Expressions and Identities',
        lessons: [
          'Terms, coefficients and like terms',
          'Adding and subtracting expressions',
          'Multiplying a monomial by a polynomial',
          'Multiplying two binomials',
          'The standard identities, and how to spot one',
        ],
      },
      {
        title: 'Linear Equations in One Variable',
        lessons: [
          'Variables on both sides',
          'Equations with brackets',
          'Equations with fractions',
          'Turning a word problem into an equation',
          'Age, money and distance problems',
          'Equations with no solution, and equations always true',
        ],
      },
      {
        title: 'Quadrilaterals and Geometric Constructions',
        lessons: [
          'The angle sum of a polygon',
          'Properties of a parallelogram',
          'Rhombus, rectangle and square',
          'Trapezium and kite',
          'Constructing a quadrilateral',
          'Constructing triangles, bisectors and perpendiculars',
        ],
      },
      {
        title: 'Percentage, Profit and Interest',
        lessons: [
          'Percentage increase and decrease, revisited',
          'Marked price, discount and selling price',
          'Profit and loss as a percentage',
          'Tax, and the everyday forms it takes',
          'Compound interest — interest on interest',
          'Growth and depreciation over time',
        ],
      },
      {
        title: 'Area, Volume and Graphs',
        lessons: [
          'Area of a trapezium and of a general quadrilateral',
          'Surface area of a cube and a cuboid',
          'Surface area and volume of a cylinder',
          'Volume and capacity',
          'Plotting points and reading line graphs',
        ],
      },
    ],
  },

  'mathematics:9': {
    modules: [
      {
        title: 'The Real Number System',
        lessons: [
          'Natural, whole, integer and rational numbers',
          'Decimal expansions: terminating and recurring',
          'Irrational numbers, and why they had to exist',
          'Representing real numbers on the number line',
          'Operations with surds',
          'Rationalising a denominator',
        ],
      },
      {
        title: 'Polynomials',
        lessons: [
          'What a polynomial is, and what it is not',
          'Degree, terms and types of polynomial',
          'Zeroes of a polynomial',
          'The remainder theorem',
          'The factor theorem',
          'Factorising polynomials',
        ],
      },
      {
        title: 'Linear Equations in Two Variables',
        lessons: [
          'Equations with two unknowns',
          'Solutions as ordered pairs',
          'Graphing a linear equation',
          'Lines parallel to the axes',
          'Reading a solution off a graph',
          'Modelling a real situation with two variables',
        ],
      },
      {
        title: 'Coordinate Geometry',
        lessons: [
          'The Cartesian plane',
          'Plotting points and naming quadrants',
          'Distance between two points',
          'Midpoints and the section formula',
          'Area of a triangle from its vertices',
        ],
      },
      {
        title: 'Lines, Angles and Triangles',
        lessons: [
          'Axioms, theorems, and what a proof actually is',
          'Angle relationships, proved',
          'The congruence criteria, proved',
          'Properties of isosceles triangles',
          'Inequalities in a triangle',
          'Writing a geometric proof of your own',
        ],
      },
      {
        title: 'Quadrilaterals and Circles',
        lessons: [
          'The parallelogram and its proofs',
          'The midpoint theorem',
          'Chords of a circle and their properties',
          'Angles subtended by an arc',
          'Cyclic quadrilaterals',
          'Tangents — a first look',
        ],
      },
      {
        title: 'Area, Surface Area and Volume',
        lessons: [
          'Area of a triangle from its three sides',
          'Surface area of cuboids and cylinders',
          'Surface area of cones and spheres',
          'Volume of cylinders and cones',
          'Volume of spheres and hemispheres',
          'Combined solids and real objects',
        ],
      },
      {
        title: 'Statistics and Probability',
        lessons: [
          'Organising data into a frequency table',
          'Histograms and frequency polygons',
          'Mean, median and mode of grouped data',
          'Probability from experiments',
          'The probability of an event, and what it cannot tell you',
        ],
      },
    ],
  },

  'mathematics:10': {
    modules: [
      {
        title: 'Real Numbers',
        lessons: [
          'Rational and irrational numbers, revisited',
          'The fundamental theorem of arithmetic',
          'Highest common factor and lowest common multiple by prime factorisation',
          'Proving that a number is irrational',
          'Decimal expansions and what they reveal',
          'Real numbers in problem solving',
        ],
      },
      {
        title: 'Polynomials',
        lessons: [
          'Degree, zeroes and the shape of a graph',
          'The relationship between zeroes and coefficients',
          'Quadratic polynomials in depth',
          'The division algorithm for polynomials',
          'Cubic polynomials and their zeroes',
          'Building a polynomial from its zeroes',
        ],
      },
      {
        title: 'Pairs of Linear Equations',
        lessons: [
          'Two equations, two unknowns',
          'Solving graphically',
          'The substitution method',
          'The elimination method',
          'Consistent, inconsistent and dependent pairs',
          'Word problems: speed, age, work and money',
        ],
      },
      {
        title: 'Quadratic Equations',
        lessons: [
          'Recognising a quadratic equation',
          'Solving by factorisation',
          'Completing the square',
          'The quadratic formula',
          'The discriminant and the nature of the roots',
        ],
      },
      {
        title: 'Sequences and Arithmetic Progressions',
        lessons: [
          'Patterns and sequences',
          'The nth term of an arithmetic progression',
          'Finding a term, and finding which term',
          'The sum of the first n terms',
          'Applications: savings, salaries and stacks',
          'Sequences that are not arithmetic',
        ],
      },
      {
        title: 'Triangles and Similarity',
        lessons: [
          'Similar figures and similar triangles',
          'The basic proportionality theorem',
          'The criteria for similarity',
          'Areas of similar triangles',
          'The Pythagorean theorem, proved',
          'The converse of Pythagoras, and what it is used for',
        ],
      },
      {
        title: 'Circles and Trigonometry',
        lessons: [
          'The tangent to a circle and its properties',
          'How many tangents can be drawn from a point',
          'Trigonometric ratios in a right triangle',
          'Trigonometric ratios of the standard angles',
          'Trigonometric identities',
          'Heights and distances',
        ],
      },
      {
        title: 'Solids, Statistics and Probability',
        lessons: [
          'Surface area of combined solids',
          'Volume of combined solids, and converting one shape into another',
          'The mean of grouped data, three ways',
          'Median, mode and the cumulative frequency curve',
          'Theoretical probability, and where it stops being useful',
        ],
      },
    ],
  },
};

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
