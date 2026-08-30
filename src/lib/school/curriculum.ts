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

  /* ── Physics ──────────────────────────────────────────────────────────────
   * Grades 9–12. Physics and Chemistry are offered from grade 7, but 9–12 is
   * where the entrance-exam pressure sits and where parents pay for help — the
   * grades a student either keeps or loses the subject in.
   *
   * Apostrophes are the typographic ’ (U+2019) rather than ', which is correct
   * on the page and avoids escaping inside these single-quoted strings. There
   * are a lot of them here: Newton, Ohm, Gauss, Faraday, Lenz, Kepler.
   */

  'physics:9': {
    modules: [
      {
        title: 'Describing Motion',
        lessons: [
          'Distance and displacement, and why they differ',
          'Speed and velocity',
          'Acceleration',
          'Reading a distance–time graph',
          'Reading a velocity–time graph',
          'The equations of motion',
        ],
      },
      {
        title: 'Forces and the Laws of Motion',
        lessons: [
          'What a force actually does',
          'Balanced and unbalanced forces',
          'Newton’s first law and inertia',
          'Newton’s second law',
          'Newton’s third law',
          'Momentum, and why it is conserved',
        ],
      },
      {
        title: 'Gravitation, Pressure and Floating',
        lessons: [
          'The universal law of gravitation',
          'Free fall and the acceleration due to gravity',
          'Mass and weight — not the same thing',
          'Motion under gravity',
          'Thrust and pressure',
          'Buoyancy, upthrust and why things float',
        ],
      },
      {
        title: 'Work, Energy and Power',
        lessons: [
          'When a force does work, and when it does not',
          'Kinetic energy',
          'Potential energy',
          'Conservation of energy',
          'Power, and the units we measure it in',
        ],
      },
      {
        title: 'Sound',
        lessons: [
          'How a sound wave travels',
          'Wavelength, frequency and amplitude',
          'The speed of sound in different materials',
          'Reflection of sound, and echoes',
          'The range of hearing, and ultrasound',
          'SONAR and the human ear',
        ],
      },
      {
        title: 'Matter and Its States',
        lessons: [
          'The particle model of matter',
          'States of matter, and how they change',
          'Evaporation, and why it cools',
          'Latent heat',
          'Temperature scales and thermal expansion',
          'Density, and how it is measured',
        ],
      },
      {
        title: 'Measurement and Experiment',
        lessons: [
          'Units, standards, and why they matter',
          'Measuring length, mass and time accurately',
          'Significant figures and estimation',
          'Errors and uncertainty',
          'Turning data into a graph',
          'Designing a fair experiment',
        ],
      },
      {
        title: 'Physics at Work',
        lessons: [
          'Simple machines and mechanical advantage',
          'Levers, pulleys and inclined planes',
          'Friction: the useful and the wasteful',
          'A first look at circular motion',
          'Solving multi-step physics problems',
        ],
      },
    ],
  },

  'physics:10': {
    modules: [
      {
        title: 'Reflection and Mirrors',
        lessons: [
          'How light travels',
          'The laws of reflection',
          'Plane mirrors and the images they form',
          'Concave and convex mirrors',
          'The mirror formula and magnification',
          'Where mirrors are used, and why',
        ],
      },
      {
        title: 'Refraction and Lenses',
        lessons: [
          'Why light bends',
          'Refractive index and the laws of refraction',
          'Convex and concave lenses',
          'Image formation by lenses',
          'The lens formula and the power of a lens',
          'Total internal reflection and optical fibres',
        ],
      },
      {
        title: 'The Human Eye and Light in Nature',
        lessons: [
          'How the human eye focuses',
          'Defects of vision, and the lenses that correct them',
          'Dispersion and the spectrum',
          'Scattering — why the sky is blue',
          'Atmospheric refraction',
          'The rainbow, explained',
        ],
      },
      {
        title: 'Electric Current',
        lessons: [
          'Charge and current — what is actually flowing',
          'Potential difference and the cell',
          'Ohm’s law',
          'Resistance, and what it depends on',
          'Resistors in series and in parallel',
        ],
      },
      {
        title: 'Effects of Electric Current',
        lessons: [
          'The heating effect of current',
          'Electric power and electrical energy',
          'The domestic circuit',
          'Fuses, earthing and electrical safety',
          'Working out your electricity bill',
          'A reliable method for circuit problems',
        ],
      },
      {
        title: 'Magnetism and Electromagnetism',
        lessons: [
          'Magnets and magnetic field lines',
          'The magnetic field around a current',
          'Force on a current-carrying conductor',
          'The electric motor',
          'Electromagnetic induction',
          'The generator, and AC versus DC',
        ],
      },
      {
        title: 'Energy and Its Sources',
        lessons: [
          'Conventional sources of energy',
          'Thermal and hydroelectric power',
          'Wind and solar, and their real limits',
          'Nuclear energy',
          'Choosing an energy source: the honest trade-offs',
          'Efficiency and conservation',
        ],
      },
      {
        title: 'Preparing for the Board',
        lessons: [
          'Numerical problems across topics',
          'Ray diagrams: getting them right every time',
          'Circuit problems without slips',
          'Writing a full experimental answer',
          'Common traps, and how to spot them',
        ],
      },
    ],
  },

  'physics:11': {
    modules: [
      {
        title: 'Units, Measurement and Vectors',
        lessons: [
          'Physical quantities, units and dimensions',
          'Dimensional analysis and what it can prove',
          'Errors, precision and significant figures',
          'Scalars and vectors',
          'Adding and resolving vectors',
          'Scalar and vector products',
        ],
      },
      {
        title: 'Motion in a Line and in a Plane',
        lessons: [
          'Position, displacement and instantaneous velocity',
          'Acceleration, and the calculus behind it',
          'Motion with uniform acceleration',
          'Relative velocity',
          'Projectile motion',
          'Uniform circular motion',
        ],
      },
      {
        title: 'Laws of Motion',
        lessons: [
          'Newton’s laws, stated rigorously',
          'Drawing a free-body diagram',
          'Friction: static, kinetic and rolling',
          'Dynamics of circular motion',
          'Banking of roads',
          'Impulse, momentum and collisions',
        ],
      },
      {
        title: 'Work, Energy and Power',
        lessons: [
          'Work done by a variable force',
          'The work–energy theorem',
          'Conservative and non-conservative forces',
          'Potential energy and equilibrium',
          'Elastic and inelastic collisions',
        ],
      },
      {
        title: 'Rotational Motion',
        lessons: [
          'Centre of mass',
          'Torque and angular momentum',
          'Moment of inertia',
          'The parallel and perpendicular axis theorems',
          'Rolling motion',
          'Conservation of angular momentum',
        ],
      },
      {
        title: 'Gravitation and Properties of Matter',
        lessons: [
          'Gravitation and Kepler’s laws',
          'Gravitational potential energy and escape velocity',
          'Satellites and orbits',
          'Elasticity: stress, strain and moduli',
          'Fluid pressure — Pascal and Archimedes',
          'Viscosity, surface tension and Bernoulli',
        ],
      },
      {
        title: 'Thermal Physics',
        lessons: [
          'Temperature, heat and thermal expansion',
          'Calorimetry and change of state',
          'Conduction, convection and radiation',
          'The kinetic theory of gases',
          'The first law of thermodynamics',
          'The second law, and why no engine is perfect',
        ],
      },
      {
        title: 'Oscillations and Waves',
        lessons: [
          'Simple harmonic motion',
          'The simple pendulum and spring systems',
          'Wave motion and the wave equation',
          'Superposition, standing waves and beats',
          'The Doppler effect',
        ],
      },
    ],
  },

  'physics:12': {
    modules: [
      {
        title: 'Electrostatics',
        lessons: [
          'Electric charge and Coulomb’s law',
          'The electric field',
          'Field lines and electric dipoles',
          'Gauss’s law',
          'Applying Gauss’s law',
          'Electric potential and equipotential surfaces',
        ],
      },
      {
        title: 'Capacitance and Current Electricity',
        lessons: [
          'Capacitors and capacitance',
          'Combinations of capacitors',
          'Energy stored in a capacitor',
          'Current, drift velocity and resistivity',
          'Kirchhoff’s rules',
          'The Wheatstone bridge and the potentiometer',
        ],
      },
      {
        title: 'Magnetic Effects of Current',
        lessons: [
          'Magnetic force on a moving charge',
          'The Biot–Savart law',
          'Ampere’s circuital law',
          'The solenoid and the toroid',
          'Force between parallel conductors',
          'Galvanometer, ammeter and voltmeter',
        ],
      },
      {
        title: 'Magnetism and Electromagnetic Induction',
        lessons: [
          'Magnetism and matter',
          'Faraday’s law of induction',
          'Lenz’s law and eddy currents',
          'Self and mutual inductance',
          'Motional EMF and the AC generator',
        ],
      },
      {
        title: 'Alternating Current and Electromagnetic Waves',
        lessons: [
          'AC voltage and current, and RMS values',
          'AC through a resistor, inductor and capacitor',
          'LCR circuits and resonance',
          'Power in AC circuits, and the transformer',
          'Displacement current and Maxwell’s equations',
          'The electromagnetic spectrum',
        ],
      },
      {
        title: 'Ray and Wave Optics',
        lessons: [
          'Lens and mirror systems, revisited',
          'Optical instruments: microscope and telescope',
          'Huygens’ principle',
          'Interference and Young’s double slit',
          'Diffraction',
          'Polarisation',
        ],
      },
      {
        title: 'Modern Physics',
        lessons: [
          'The photoelectric effect',
          'Photons and the dual nature of radiation',
          'Matter waves and de Broglie',
          'Atomic models and the hydrogen spectrum',
          'The nucleus, binding energy and radioactivity',
          'Fission, fusion, and where the energy comes from',
        ],
      },
      {
        title: 'Semiconductors and Electronics',
        lessons: [
          'Conductors, insulators and semiconductors',
          'The p–n junction and the diode',
          'Rectifiers and special-purpose diodes',
          'Transistors and how they act',
          'Logic gates and digital electronics',
        ],
      },
    ],
  },

  /* ── Chemistry ───────────────────────────────────────────────────────────
   * Grades 9–12, same reasoning as Physics. Grade 12 organic is deliberately
   * split across two modules rather than one dense block: it is the topic
   * students give up on, and it is the reason the Organic Chemistry focus
   * course exists as a separate product.
   */

  'chemistry:9': {
    modules: [
      {
        title: 'Matter and Its Nature',
        lessons: [
          'What matter is, and how we know',
          'States of matter and the particle model',
          'Melting, boiling and change of state',
          'Evaporation, and why it cools',
          'Changing state with heat and pressure',
          'Measuring matter: mass, volume and density',
        ],
      },
      {
        title: 'Pure Substances and Mixtures',
        lessons: [
          'Pure substances and mixtures — why the difference matters',
          'Solutions, suspensions and colloids',
          'Concentration of a solution',
          'Separating mixtures: filtration and evaporation',
          'Distillation and chromatography',
          'Physical and chemical changes',
        ],
      },
      {
        title: 'Atoms and Molecules',
        lessons: [
          'The laws of chemical combination',
          'Dalton’s atomic theory',
          'Atomic mass and the mole',
          'Molecules, ions and formulae',
          'Writing and balancing chemical equations',
          'Mole calculations in practice',
        ],
      },
      {
        title: 'Structure of the Atom',
        lessons: [
          'Discovering the electron and the proton',
          'Rutherford’s experiment and the nucleus',
          'Bohr’s model of the atom',
          'Electronic configuration',
          'Valency, atomic number and mass number',
        ],
      },
      {
        title: 'Isotopes and Classifying the Elements',
        lessons: [
          'Isotopes and isobars',
          'What isotopes are used for',
          'Early attempts to classify the elements',
          'Mendeleev’s periodic table',
          'The modern periodic law',
          'Reading the periodic table as a map',
        ],
      },
      {
        title: 'Chemical Reactions',
        lessons: [
          'Types of chemical reaction',
          'Combination and decomposition',
          'Displacement and double displacement',
          'A first look at oxidation and reduction',
          'Corrosion and rancidity',
          'Energy changes in a reaction',
        ],
      },
      {
        title: 'Acids, Bases and Salts',
        lessons: [
          'What makes an acid an acid',
          'Bases and alkalis',
          'The pH scale',
          'Neutralisation, and where you meet it daily',
          'Common salts and how they are made',
          'Water of crystallisation',
        ],
      },
      {
        title: 'Chemistry in the World',
        lessons: [
          'Metals and non-metals',
          'The reactivity series',
          'An introduction to extracting metals',
          'Carbon — the element that behaves differently',
          'Working safely in a chemistry lab',
        ],
      },
    ],
  },

  'chemistry:10': {
    modules: [
      {
        title: 'Chemical Reactions and Equations',
        lessons: [
          'Recognising that a reaction has happened',
          'Writing and balancing equations',
          'Combination and decomposition reactions',
          'Displacement and double displacement reactions',
          'Oxidation and reduction',
          'Corrosion, rancidity, and how to prevent them',
        ],
      },
      {
        title: 'Acids, Bases and Salts',
        lessons: [
          'Properties of acids and bases',
          'How acids and bases react with metals',
          'The pH scale and why it matters',
          'Strong and weak acids',
          'Preparing and using common salts',
          'Hydrated salts and water of crystallisation',
        ],
      },
      {
        title: 'Metals and Non-Metals',
        lessons: [
          'Physical properties of metals and non-metals',
          'Chemical properties of metals',
          'The reactivity series',
          'Ionic bonding and ionic compounds',
          'Occurrence and extraction of metals',
          'Alloys, and why we make them',
        ],
      },
      {
        title: 'Carbon and Its Compounds',
        lessons: [
          'Why carbon forms so many compounds',
          'Covalent bonding',
          'Saturated and unsaturated hydrocarbons',
          'Isomerism, and naming carbon compounds',
          'Functional groups and homologous series',
        ],
      },
      {
        title: 'Reactions of Carbon Compounds',
        lessons: [
          'Combustion and oxidation',
          'Addition and substitution reactions',
          'Ethanol: properties and uses',
          'Ethanoic acid: properties and uses',
          'Soaps and detergents',
          'How soap actually cleans',
        ],
      },
      {
        title: 'Periodic Classification',
        lessons: [
          'Early classification: Dobereiner and Newlands',
          'Mendeleev’s table, and the gaps he left',
          'The modern periodic table',
          'Trends in valency and atomic size',
          'Metallic and non-metallic character',
          'Predicting properties from position',
        ],
      },
      {
        title: 'Chemistry in Everyday Life',
        lessons: [
          'Chemicals in food and medicine',
          'Cleaning agents and their chemistry',
          'Fuels — what makes a good one',
          'Air and water pollution, chemically',
          'The chemistry of a sustainable choice',
          'Reading a label like a chemist',
        ],
      },
      {
        title: 'Preparing for the Board',
        lessons: [
          'Balancing equations reliably',
          'Naming organic compounds without slips',
          'Predicting the products of a reaction',
          'Writing a full experimental answer',
          'Common traps, and how to spot them',
        ],
      },
    ],
  },

  'chemistry:11': {
    modules: [
      {
        title: 'Basic Concepts of Chemistry',
        lessons: [
          'Matter, measurement and significant figures',
          'The laws of chemical combination',
          'Atomic and molecular masses',
          'The mole concept and molar mass',
          'Percentage composition and empirical formulae',
          'Stoichiometry and limiting reagents',
        ],
      },
      {
        title: 'Structure of the Atom',
        lessons: [
          'Subatomic particles and the early models',
          'Bohr’s model, and where it breaks down',
          'The quantum mechanical model',
          'Quantum numbers and orbitals',
          'Electronic configuration and the aufbau principle',
          'Hund’s rule and the Pauli principle',
        ],
      },
      {
        title: 'Periodicity and Chemical Bonding',
        lessons: [
          'The logic of the modern periodic table',
          'Periodic trends in properties',
          'Ionic bonding and lattice energy',
          'Covalent bonding and Lewis structures',
          'VSEPR theory and molecular shape',
          'Hybridisation and molecular orbital theory',
        ],
      },
      {
        title: 'States of Matter',
        lessons: [
          'Intermolecular forces',
          'The gas laws and the ideal gas equation',
          'Kinetic molecular theory of gases',
          'Real gases, and how they deviate',
          'The liquid state and its properties',
        ],
      },
      {
        title: 'Thermodynamics',
        lessons: [
          'System, surroundings and state functions',
          'The first law of thermodynamics',
          'Enthalpy and calorimetry',
          'Hess’s law and enthalpies of reaction',
          'Entropy and spontaneity',
          'Gibbs free energy',
        ],
      },
      {
        title: 'Equilibrium',
        lessons: [
          'Reversible reactions and dynamic equilibrium',
          'The equilibrium constant',
          'Le Chatelier’s principle',
          'Ionic equilibrium in solution',
          'pH, buffers and hydrolysis',
          'Solubility product',
        ],
      },
      {
        title: 'Redox and the Foundations of Organic Chemistry',
        lessons: [
          'Oxidation number and redox reactions',
          'Balancing redox equations',
          'Classifying and naming organic compounds',
          'Isomerism in organic chemistry',
          'Inductive and resonance effects',
          'Reaction intermediates and mechanisms',
        ],
      },
      {
        title: 'Hydrocarbons',
        lessons: [
          'Alkanes: preparation and reactions',
          'Alkenes: preparation and reactions',
          'Alkynes: preparation and reactions',
          'Aromatic hydrocarbons and benzene',
          'Hydrocarbon pollution and cleaner fuels',
        ],
      },
    ],
  },

  'chemistry:12': {
    modules: [
      {
        title: 'Solutions and Colligative Properties',
        lessons: [
          'Types of solution, and ways to state concentration',
          'Solubility and Henry’s law',
          'Raoult’s law and vapour pressure',
          'The colligative properties',
          'Finding molar mass from a colligative property',
          'Abnormal molar mass and the van’t Hoff factor',
        ],
      },
      {
        title: 'Electrochemistry',
        lessons: [
          'Redox reactions, revisited',
          'Galvanic cells and electrode potential',
          'The Nernst equation',
          'Conductance in electrolytic solutions',
          'Electrolysis and Faraday’s laws',
          'Batteries, fuel cells and corrosion',
        ],
      },
      {
        title: 'Chemical Kinetics and Surface Chemistry',
        lessons: [
          'Rate of reaction and the rate law',
          'Order and molecularity',
          'Integrated rate equations',
          'Temperature dependence and the Arrhenius equation',
          'Catalysis and activation energy',
          'Adsorption, colloids and emulsions',
        ],
      },
      {
        title: 'The d- and f-Block Elements',
        lessons: [
          'General properties of the transition elements',
          'Variable oxidation states, and where colour comes from',
          'Magnetic and catalytic behaviour',
          'Important compounds of the transition metals',
          'Lanthanoids and actinoids',
        ],
      },
      {
        title: 'Coordination Compounds',
        lessons: [
          'Ligands, coordination number and nomenclature',
          'Werner’s theory',
          'Isomerism in coordination compounds',
          'Valence bond theory',
          'Crystal field theory, and the origin of colour',
          'Coordination compounds in life and industry',
        ],
      },
      {
        title: 'Haloalkanes, Alcohols and Ethers',
        lessons: [
          'Haloalkanes and haloarenes: preparation',
          'Substitution and elimination mechanisms',
          'Alcohols: preparation and properties',
          'Phenols, and what makes them different',
          'Ethers: preparation and reactions',
          'Distinguishing tests you can rely on',
        ],
      },
      {
        title: 'Carbonyl Compounds and Amines',
        lessons: [
          'Aldehydes and ketones: preparation',
          'Nucleophilic addition reactions',
          'Carboxylic acids and their derivatives',
          'Amines: preparation and basicity',
          'Diazonium salts and what they are for',
          'The named reactions worth knowing cold',
        ],
      },
      {
        title: 'Biomolecules and Applied Chemistry',
        lessons: [
          'Carbohydrates',
          'Proteins and enzymes',
          'Nucleic acids and vitamins',
          'Polymers and how they are classified',
          'Chemistry in medicine, food and materials',
        ],
      },
    ],
  },

  /* ── Biology ─────────────────────────────────────────────────────────────
   * Grades 9–12. The third exam subject, and the one medical entrance exams
   * are built on — which is why 11 and 12 lean harder on human physiology and
   * molecular genetics than a general science course would.
   */

  'biology:9': {
    modules: [
      {
        title: 'The Cell — The Unit of Life',
        lessons: [
          'Discovering the cell',
          'The cell membrane, and what crosses it',
          'The nucleus and the cytoplasm',
          'Cell organelles and the jobs they do',
          'Plant cells and animal cells compared',
          'Cell division: mitosis and meiosis',
        ],
      },
      {
        title: 'Tissues',
        lessons: [
          'Why a multicellular body needs tissues',
          'Plant tissues: meristematic and permanent',
          'Simple and complex plant tissues',
          'Animal tissues: epithelial and connective',
          'Muscular and nervous tissue',
          'How plants and animals organise tissue differently',
        ],
      },
      {
        title: 'Diversity of Living Organisms',
        lessons: [
          'Why we classify living things',
          'The hierarchy of classification',
          'Monera, Protista and Fungi',
          'Plantae: from algae to angiosperms',
          'The invertebrate phyla',
          'Vertebrates and their classes',
        ],
      },
      {
        title: 'Health and Disease',
        lessons: [
          'What health actually means',
          'Infectious and non-infectious disease',
          'Disease-causing agents, and how they spread',
          'Prevention: hygiene, nutrition and immunisation',
          'Common diseases and their treatment',
        ],
      },
      {
        title: 'Natural Resources',
        lessons: [
          'Air, water and soil as resources',
          'What the atmosphere does',
          'The water cycle',
          'The carbon and nitrogen cycles',
          'Pollution and its effects',
          'The ozone layer',
        ],
      },
      {
        title: 'Improving Food Resources',
        lessons: [
          'Why food production has to improve',
          'Crop variety improvement',
          'Crop production management',
          'Crop protection and pest management',
          'Animal husbandry',
          'Fisheries and beekeeping',
        ],
      },
      {
        title: 'Life Processes — An Introduction',
        lessons: [
          'What makes something alive',
          'Nutrition in plants and animals',
          'Respiration',
          'Transport in living things',
          'Excretion',
          'Control and coordination',
        ],
      },
      {
        title: 'Working as a Biologist',
        lessons: [
          'Using a microscope properly',
          'Preparing and staining a slide',
          'Drawing what you actually see',
          'Designing a biological experiment',
          'Reading data and drawing a conclusion',
        ],
      },
    ],
  },

  'biology:10': {
    modules: [
      {
        title: 'Nutrition and Respiration',
        lessons: [
          'Autotrophic nutrition and photosynthesis',
          'Heterotrophic nutrition',
          'The human digestive system',
          'Aerobic and anaerobic respiration',
          'The human respiratory system',
          'Gas exchange in plants',
        ],
      },
      {
        title: 'Transport and Excretion',
        lessons: [
          'Blood and its components',
          'The human heart and circulation',
          'Blood vessels and blood pressure',
          'Transport in plants: xylem and phloem',
          'Excretion in humans, and the kidney',
          'Excretion in plants',
        ],
      },
      {
        title: 'Control and Coordination',
        lessons: [
          'The nervous system and the neuron',
          'Reflex action and the reflex arc',
          'The human brain',
          'Hormones in animals',
          'Coordination in plants: tropisms',
          'Plant hormones',
        ],
      },
      {
        title: 'Reproduction',
        lessons: [
          'Why organisms reproduce',
          'Asexual reproduction',
          'Sexual reproduction in flowering plants',
          'The human reproductive system',
          'Reproductive health',
        ],
      },
      {
        title: 'Heredity',
        lessons: [
          'Inherited traits and acquired traits',
          'Mendel’s experiments',
          'Monohybrid and dihybrid crosses',
          'The rules of inheritance',
          'Sex determination',
          'Genes, chromosomes and DNA',
        ],
      },
      {
        title: 'Evolution',
        lessons: [
          'Variation, and why it matters',
          'Natural selection',
          'Speciation',
          'Fossils as evidence',
          'Homologous and analogous organs',
          'Human evolution',
        ],
      },
      {
        title: 'Our Environment',
        lessons: [
          'Ecosystems and their components',
          'Food chains and food webs',
          'Energy flow through an ecosystem',
          'Ozone depletion',
          'Waste management',
          'Biodegradable and non-biodegradable waste',
        ],
      },
      {
        title: 'Managing Natural Resources',
        lessons: [
          'Why resources need managing at all',
          'Forests and wildlife',
          'Water harvesting and dams',
          'Coal and petroleum',
          'Sustainable development in practice',
        ],
      },
    ],
  },

  'biology:11': {
    modules: [
      {
        title: 'The Living World and Classification',
        lessons: [
          'What is living, and how we define it',
          'Taxonomic categories and nomenclature',
          'The five kingdoms',
          'Monera, Protista and Fungi',
          'Viruses, viroids and lichens',
          'Taxonomical aids: herbaria and museums',
        ],
      },
      {
        title: 'Plant and Animal Diversity',
        lessons: [
          'Algae, bryophytes and pteridophytes',
          'Gymnosperms and angiosperms',
          'Plant life cycles and alternation of generations',
          'The basis of animal classification',
          'The invertebrate phyla',
          'Phylum Chordata and its classes',
        ],
      },
      {
        title: 'Structural Organisation',
        lessons: [
          'Morphology of a flowering plant',
          'Anatomy of root, stem and leaf',
          'Inflorescence, flower, fruit and seed',
          'How to describe a plant family',
          'Animal tissues',
          'Organisation in earthworm, cockroach and frog',
        ],
      },
      {
        title: 'Cell Structure and Function',
        lessons: [
          'The cell theory, and types of cell',
          'The cell membrane and the cell wall',
          'Cell organelles in detail',
          'The nucleus and the chromosomes',
          'The cell cycle, mitosis and meiosis',
        ],
      },
      {
        title: 'Biomolecules and Enzymes',
        lessons: [
          'Carbohydrates and lipids',
          'Proteins and amino acids',
          'Nucleic acids',
          'Enzymes and their properties',
          'Enzyme action and inhibition',
          'Metabolic pathways',
        ],
      },
      {
        title: 'Plant Physiology',
        lessons: [
          'Transport in plants',
          'Mineral nutrition',
          'Photosynthesis in higher plants',
          'Respiration in plants',
          'Plant growth and development',
          'Plant growth regulators',
        ],
      },
      {
        title: 'Human Physiology I',
        lessons: [
          'Digestion and absorption',
          'Breathing and the exchange of gases',
          'Body fluids and circulation',
          'Excretory products and their elimination',
          'The kidney and osmoregulation',
          'Disorders of these systems',
        ],
      },
      {
        title: 'Human Physiology II',
        lessons: [
          'Locomotion and movement',
          'The skeletal and muscular systems',
          'Neural control and coordination',
          'The endocrine system',
          'Homeostasis: the systems working together',
        ],
      },
    ],
  },

  'biology:12': {
    modules: [
      {
        title: 'Reproduction in Organisms and Plants',
        lessons: [
          'Modes of reproduction',
          'Sexual reproduction in flowering plants',
          'Pre-fertilisation structures and events',
          'Pollination and its agents',
          'Double fertilisation, and what follows it',
          'Apomixis and polyembryony',
        ],
      },
      {
        title: 'Human Reproduction',
        lessons: [
          'The male reproductive system',
          'The female reproductive system',
          'Gametogenesis',
          'The menstrual cycle',
          'Fertilisation, implantation and pregnancy',
          'Parturition and lactation',
        ],
      },
      {
        title: 'Reproductive Health',
        lessons: [
          'Reproductive health, and what threatens it',
          'Population and birth control',
          'Medical termination of pregnancy',
          'Sexually transmitted infections',
          'Infertility and assisted reproduction',
          'Amniocentesis, and its misuse',
        ],
      },
      {
        title: 'Principles of Inheritance',
        lessons: [
          'Mendel’s laws, revisited',
          'Deviations from Mendelism',
          'The chromosomal theory of inheritance',
          'Linkage and recombination',
          'Sex determination and mutation',
        ],
      },
      {
        title: 'Molecular Basis of Inheritance',
        lessons: [
          'How we learned DNA is the genetic material',
          'The structure of DNA and RNA',
          'DNA replication',
          'Transcription',
          'The genetic code and translation',
          'Gene regulation and the Human Genome Project',
        ],
      },
      {
        title: 'Evolution',
        lessons: [
          'The origin of life',
          'The evidence for evolution',
          'Darwin and natural selection',
          'Hardy–Weinberg equilibrium',
          'Adaptive radiation and speciation',
          'Human evolution',
        ],
      },
      {
        title: 'Human Welfare and Biotechnology',
        lessons: [
          'Human health and disease',
          'Immunity and vaccines',
          'Microbes in human welfare',
          'The principles and tools of biotechnology',
          'Recombinant DNA technology',
          'Biotechnology in agriculture and medicine',
        ],
      },
      {
        title: 'Ecology and Environment',
        lessons: [
          'Organisms and populations',
          'Ecosystem structure and function',
          'Ecological succession and nutrient cycling',
          'Biodiversity and conservation',
          'Environmental issues, and what actually works',
        ],
      },
    ],
  },

  /* ── Physics and Chemistry, grades 7–8 ───────────────────────────────────
   * The years school first splits Science into named subjects. Pitched as
   * explanation rather than formula: at this age the job is to make the
   * subject feel knowable, because grade 9 is where students who found it
   * alien quietly decide they are "not a science person".
   */

  'physics:7': {
    modules: [
      {
        title: 'Motion and Time',
        lessons: [
          'What it means for something to move',
          'Fast and slow: comparing motion',
          'Measuring speed',
          'Measuring time, and the simple pendulum',
          'Distance–time graphs',
          'Types of motion in the world around you',
        ],
      },
      {
        title: 'Forces and Their Effects',
        lessons: [
          'What a force can do',
          'Push, pull, and forces in contact',
          'Forces that act at a distance',
          'Friction: helpful and unhelpful',
          'Reducing and increasing friction',
          'Pressure, and why it depends on area',
        ],
      },
      {
        title: 'Heat',
        lessons: [
          'Hot, cold, and what temperature measures',
          'Thermometers and how to read them',
          'Conduction',
          'Convection',
          'Radiation',
          'Keeping heat in and out: clothes and buildings',
        ],
      },
      {
        title: 'Light',
        lessons: [
          'How light travels, and how we see',
          'Reflection from a plane mirror',
          'Images in a plane mirror',
          'Curved mirrors and what they do',
          'Lenses, and the images they make',
        ],
      },
      {
        title: 'Electricity and Magnetism',
        lessons: [
          'Electric circuits and circuit symbols',
          'The heating effect of current',
          'The magnetic effect of current',
          'Electromagnets and where they are used',
          'The electric bell',
          'Staying safe with electricity',
        ],
      },
      {
        title: 'Sound',
        lessons: [
          'How sound is produced',
          'How sound travels, and what it needs',
          'Loudness and pitch',
          'How we hear',
          'Noise, and what it does to us',
          'Sound in music and in nature',
        ],
      },
      {
        title: 'Weather, Air and Water',
        lessons: [
          'Air, wind, and why air moves',
          'Air pressure in everyday life',
          'Storms, cyclones and how they form',
          'Weather and climate',
          'The water cycle',
          'Water as a resource under pressure',
        ],
      },
      {
        title: 'Measuring and Investigating',
        lessons: [
          'Choosing the right instrument',
          'Reading a scale without error',
          'Recording results in a table',
          'Drawing a graph from your own data',
          'Asking a question science can answer',
        ],
      },
    ],
  },

  'physics:8': {
    modules: [
      {
        title: 'Force and Pressure',
        lessons: [
          'Force as a push or a pull, revisited',
          'Contact and non-contact forces',
          'Pressure exerted by solids',
          'Pressure in liquids',
          'Atmospheric pressure',
          'Solving simple pressure problems',
        ],
      },
      {
        title: 'Friction',
        lessons: [
          'What causes friction',
          'Static, sliding and rolling friction',
          'Friction as a necessary evil',
          'Increasing and reducing friction',
          'Fluid friction and drag',
          'Streamlining in nature and design',
        ],
      },
      {
        title: 'Sound',
        lessons: [
          'Sound produced by vibration',
          'Sound needs a medium',
          'Amplitude, frequency and time period',
          'Loudness and pitch, quantified',
          'The human ear and audible range',
          'Noise pollution and how to reduce it',
        ],
      },
      {
        title: 'Electricity and Its Effects',
        lessons: [
          'Conductors and insulators of electricity',
          'Chemical effects of electric current',
          'Electroplating and where it is used',
          'Lightning and electric charge',
          'Earthquakes, and measuring their energy',
        ],
      },
      {
        title: 'Light and Vision',
        lessons: [
          'Laws of reflection',
          'Regular and diffused reflection',
          'Multiple reflection and the kaleidoscope',
          'Dispersion: splitting white light',
          'The human eye and how it focuses',
          'Caring for your eyes, and Braille',
        ],
      },
      {
        title: 'Stars and the Solar System',
        lessons: [
          'The moon and its phases',
          'Stars and constellations',
          'The planets of the solar system',
          'Other members: asteroids, meteors and comets',
          'Artificial satellites and what they do',
          'Why we study the sky at all',
        ],
      },
      {
        title: 'Chemical Effects and Materials',
        lessons: [
          'Synthetic fibres and how they are made',
          'Plastics, and the problem with them',
          'Metals and non-metals in physical terms',
          'Combustion and flame',
          'Fuels and their calorific value',
          'Air pollution and its causes',
        ],
      },
      {
        title: 'Investigating Like a Physicist',
        lessons: [
          'Turning an observation into a question',
          'Controlling one variable at a time',
          'Measuring carefully and repeating',
          'Presenting results honestly',
          'Explaining a result you did not expect',
        ],
      },
    ],
  },

  'chemistry:7': {
    modules: [
      {
        title: 'Matter Around Us',
        lessons: [
          'Everything is made of something',
          'Solids, liquids and gases',
          'Changing state',
          'Pure substances and mixtures',
          'Separating mixtures at home and in the lab',
          'Solutions, and what dissolves in what',
        ],
      },
      {
        title: 'Physical and Chemical Change',
        lessons: [
          'Telling a physical change from a chemical one',
          'Signs that a chemical change has happened',
          'Rusting, and how to prevent it',
          'Crystallisation',
          'Reversible and irreversible change',
          'Chemical change in the kitchen',
        ],
      },
      {
        title: 'Acids, Bases and Salts',
        lessons: [
          'What acids are, and where you meet them',
          'Bases and their properties',
          'Natural indicators',
          'Neutralisation',
          'Neutralisation in everyday life',
          'Making and using common salts',
        ],
      },
      {
        title: 'Fibres and Materials',
        lessons: [
          'Natural fibres: cotton, wool and silk',
          'From fibre to fabric',
          'Synthetic fibres',
          'Choosing the right material for a job',
          'Materials and the environment',
        ],
      },
      {
        title: 'Heat, Fire and Fuels',
        lessons: [
          'What burning actually is',
          'Conditions needed for combustion',
          'Types of flame',
          'Fuels and how they compare',
          'Putting out a fire safely',
          'The cost of burning fuel',
        ],
      },
      {
        title: 'Water and Air',
        lessons: [
          'Water as a chemical substance',
          'Hard and soft water',
          'Water purification',
          'What air is made of',
          'Oxygen and the things that need it',
          'Air pollution, chemically explained',
        ],
      },
      {
        title: 'Soil, Plants and Chemistry',
        lessons: [
          'What soil is made of',
          'Soil profile and soil types',
          'Nutrients plants take from soil',
          'Fertilisers and manures',
          'Photosynthesis as a chemical reaction',
          'Respiration as a chemical reaction',
        ],
      },
      {
        title: 'Working Safely and Carefully',
        lessons: [
          'Lab rules, and the reasons behind them',
          'Handling chemicals and heat',
          'Measuring volume and mass accurately',
          'Recording an experiment properly',
          'Reading a hazard label',
        ],
      },
    ],
  },

  'chemistry:8': {
    modules: [
      {
        title: 'Synthetic Materials',
        lessons: [
          'Synthetic fibres and how they are made',
          'Types of synthetic fibre and their uses',
          'Plastics, and why they behave as they do',
          'Thermoplastics and thermosetting plastics',
          'Plastics and the environment',
          'Choosing a material responsibly',
        ],
      },
      {
        title: 'Metals and Non-Metals',
        lessons: [
          'Physical properties of metals',
          'Physical properties of non-metals',
          'Chemical properties of metals',
          'Reactions with acids, bases and water',
          'Displacement reactions',
          'Metals and non-metals in daily life',
        ],
      },
      {
        title: 'Coal, Petroleum and Combustion',
        lessons: [
          'How coal and petroleum formed',
          'Refining petroleum',
          'Natural gas and its uses',
          'Exhaustible and inexhaustible resources',
          'Combustion, and what it needs',
          'Calorific value and choosing a fuel',
        ],
      },
      {
        title: 'Air, Fire and Pollution',
        lessons: [
          'Types of flame and their structure',
          'Fire control, and the science of it',
          'Air pollutants and their sources',
          'Acid rain',
          'The greenhouse effect, chemically',
        ],
      },
      {
        title: 'Chemistry of the Cell and the Kitchen',
        lessons: [
          'Micro-organisms and what they do chemically',
          'Fermentation',
          'Food preservation',
          'Nitrogen fixation and the nitrogen cycle',
          'Food spoilage, and how to slow it',
          'Reading a food label chemically',
        ],
      },
      {
        title: 'Crop Chemistry and Soil',
        lessons: [
          'Nutrients a crop needs',
          'Manure and fertiliser compared',
          'Irrigation and water chemistry',
          'Weedicides and pesticides',
          'Soil health and what damages it',
          'Sustainable farming, chemically',
        ],
      },
      {
        title: 'Chemical Reactions and Change',
        lessons: [
          'Recognising a chemical reaction',
          'Word equations',
          'Combination and decomposition',
          'Oxidation in everyday life',
          'Neutralisation revisited',
          'Predicting whether a reaction will happen',
        ],
      },
      {
        title: 'Investigating Like a Chemist',
        lessons: [
          'Framing a testable question',
          'Setting up a controlled test',
          'Observing and recording accurately',
          'Drawing a conclusion from evidence',
          'Explaining an unexpected result',
        ],
      },
    ],
  },

  /* Biology 7–8 completes the third science across every grade it is offered. */

  'biology:7': {
    modules: [
      {
        title: 'Nutrition in Plants',
        lessons: [
          'How plants make their own food',
          'Photosynthesis: what goes in',
          'Photosynthesis: what comes out',
          'Other ways plants get nutrition',
          'Parasites, saprotrophs and insectivorous plants',
          'How nutrients get back into the soil',
        ],
      },
      {
        title: 'Nutrition in Animals',
        lessons: [
          'The different ways animals feed',
          'The human digestive system',
          'Digestion in the mouth and the stomach',
          'Absorption in the small intestine',
          'Digestion in grass-eating animals',
          'Feeding in single-celled organisms',
        ],
      },
      {
        title: 'Respiration in Organisms',
        lessons: [
          'Why every living thing respires',
          'Aerobic and anaerobic respiration',
          'Breathing in humans',
          'Breathing in other animals',
          'Respiration in plants',
          'What happens when you exercise',
        ],
      },
      {
        title: 'Transport in Plants and Animals',
        lessons: [
          'Why a body needs a transport system',
          'Blood and the circulatory system',
          'The heart',
          'How water moves up a plant',
          'How food moves through a plant',
        ],
      },
      {
        title: 'Reproduction in Plants',
        lessons: [
          'Modes of reproduction in plants',
          'Vegetative propagation',
          'The parts of a flower',
          'Pollination',
          'Fertilisation and seed formation',
          'Seed dispersal',
        ],
      },
      {
        title: 'Weather, Climate and Adaptation',
        lessons: [
          'Weather, and how we measure it',
          'Climate, and how it differs from weather',
          'Adaptations to the polar regions',
          'Adaptations to the rainforest',
          'Animals and their habitats',
          'Migration, and why animals do it',
        ],
      },
      {
        title: 'Forests, Soil and Water',
        lessons: [
          'Forests as ecosystems',
          'Why forests matter beyond timber',
          'Soil, and what lives in it',
          'Water as a scarce resource',
          'Wastewater and how it is treated',
          'Sanitation and health',
        ],
      },
      {
        title: 'Studying Living Things',
        lessons: [
          'Observing with a hand lens and a microscope',
          'Keeping a field notebook',
          'Classifying what you find',
          'Designing a simple biology experiment',
          'Presenting biological data',
        ],
      },
    ],
  },

  'biology:8': {
    modules: [
      {
        title: 'Crop Production and Management',
        lessons: [
          'Agricultural practices, and why they matter',
          'Preparing the soil',
          'Sowing, and choosing good seed',
          'Manure and fertilisers',
          'Irrigation, weeding and harvesting',
          'Storage, and food from animals',
        ],
      },
      {
        title: 'Microorganisms',
        lessons: [
          'The world too small to see',
          'Bacteria, fungi, protozoa and algae',
          'Microorganisms that help us',
          'Antibiotics and vaccines',
          'Harmful microorganisms and disease',
          'Food preservation and nitrogen fixation',
        ],
      },
      {
        title: 'The Cell',
        lessons: [
          'Discovering the cell',
          'Cell shape, size and number',
          'The structure of a cell',
          'The nucleus and the organelles',
          'Plant cells and animal cells compared',
          'Looking at real cells under a microscope',
        ],
      },
      {
        title: 'Reproduction in Animals',
        lessons: [
          'Sexual and asexual reproduction',
          'Male and female reproductive organs',
          'Fertilisation, internal and external',
          'Development of the embryo',
          'Metamorphosis, and asexual reproduction in animals',
        ],
      },
      {
        title: 'Reaching Adolescence',
        lessons: [
          'The changes of adolescence',
          'Secondary sexual characters',
          'What hormones do',
          'The reproductive phase of life',
          'Hormones in other life processes',
          'Nutrition, hygiene and health at this age',
        ],
      },
      {
        title: 'Conservation of Plants and Animals',
        lessons: [
          'Deforestation and its causes',
          'What deforestation leads to',
          'Biodiversity, and why it matters',
          'Sanctuaries and national parks',
          'Endangered species and extinction',
          'Recycling paper, and replanting forests',
        ],
      },
      {
        title: 'Pollution and the Environment',
        lessons: [
          'Air pollution and where it comes from',
          'The greenhouse effect and global warming',
          'Water pollution',
          'Potable water, and how we get it',
          'What one person can actually change',
          'Reading environmental data honestly',
        ],
      },
      {
        title: 'Doing Biology Well',
        lessons: [
          'Preparing a slide and observing it',
          'Recording observations accurately',
          'Drawing biological diagrams',
          'Designing a controlled biological test',
          'Explaining a result with evidence',
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
