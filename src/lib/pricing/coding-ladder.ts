import { COURSES, PRICING_TIERS } from '@/lib/sariro-data';
import { codingPrice } from '@/lib/pricing/coding';
import { featureLines, type CodingRatio, type FeatureLine } from '@/lib/pricing/coding-tiers';

/**
 * SARIRO — the Coding & AI ladder
 * ============================================================================
 * The homepage priced three coding tiers and stopped. It never showed the
 * level most children actually start at — Elementary: Scratch with Machine
 * Learning, Python, Java and first websites — although it is in the catalogue,
 * has four courses and has a price. A section headed "any age" was missing its
 * youngest learners.
 *
 * And the cards said what a tier costs without saying what it is FOR. The
 * catalogue knows, down to the project: every module of every course names the
 * thing a learner builds. That is the part nobody else can put on a pricing
 * card, because nobody else has written it.
 *
 * So each rung is read from the catalogue, never typed: how many courses there
 * are to choose from, how many classes and weeks, and the real final projects.
 * Prices come from lib/pricing/coding.ts (Elementary) and PRICING_TIERS — the
 * same numbers checkout charges.
 */

export type LadderId = 'elementary' | 'beginner' | 'intermediate' | 'expert';

/** Youngest first. The order is the journey. */
export const LADDER: readonly LadderId[] = ['elementary', 'beginner', 'intermediate', 'expert'];

/** What /courses and the catalogue call each rung. */
export const COURSE_LEVEL: Record<LadderId, string> = {
  elementary: 'Elementary',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Advanced',
};

/**
 * Who each rung suits, as a guide a parent can use — not a rule. The free
 * class is where a mentor actually decides, and the finder says so.
 */
const GUIDE: Record<LadderId, { name: string; who: string; tagline: string }> = {
  elementary: {
    name: 'Elementary',
    who: 'Ages 7–13 · first steps',
    tagline: 'Scratch, Python, Java or a first website — real code, one finished project every module.',
  },
  beginner: { name: 'Beginner', who: 'New to building · 11+', tagline: '' },
  intermediate: { name: 'Intermediate', who: 'Has built something · 13+', tagline: '' },
  expert: { name: 'Expert', who: 'Serious builders · 15+', tagline: '' },
};

const ELEMENTARY_FEATURES = [
  'Four learners to one mentor',
  'Live classes, taught at their pace',
  'A finished project every module',
  'Certificate of completion',
  'No experience needed — ever',
];

type Course = (typeof COURSES)[number];

const coursesAt = (id: LadderId): Course[] =>
  COURSES.filter((c) => String(c.level).toLowerCase() === COURSE_LEVEL[id].toLowerCase());

/** The most common value, so one odd course cannot redefine a level. */
function mode(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

export interface BuildProject {
  project: string;
  course: string;
}

/**
 * The finished projects at this level, one per course — each course's final
 * module. Student courses first on a homepage mostly read by parents, then the
 * rest, never the same project twice.
 */
export function projectsAt(id: LadderId, limit = 3): BuildProject[] {
  const courses = [...coursesAt(id)].sort(
    (a, b) => Number(b.audience === 'Students') - Number(a.audience === 'Students')
  );
  const seen = new Set<string>();
  const out: BuildProject[] = [];
  for (const c of courses) {
    const syllabus = (c as { syllabus?: { project?: string }[] }).syllabus ?? [];
    const project = syllabus[syllabus.length - 1]?.project?.trim();
    if (!project || seen.has(project)) continue;
    seen.add(project);
    out.push({ project, course: String(c.title).replace(/\s+—\s+\w+$/, '') });
    if (out.length === limit) break;
  }
  return out;
}

export interface LadderRung {
  id: LadderId;
  step: number;
  name: string;
  who: string;
  tagline: string;
  popular: boolean;
  price: number | null;
  perClass: number | null;
  classes: number | null;
  weeks: number | null;
  /** What the one payment works out to per month over the course. Never billed monthly. */
  perMonth: number | null;
  courseCount: number;
  projects: BuildProject[];
  features: FeatureLine[];
  cta: string;
  href: string;
}

const WEEKS_PER_MONTH = 52 / 12;

export function ladderRung(id: LadderId, ratio: CodingRatio): LadderRung {
  const courses = coursesAt(id);
  const tier = PRICING_TIERS.find((t) => t.id === id);
  const guide = GUIDE[id];

  const price =
    id === 'elementary'
      ? codingPrice('Elementary', ratio)
      : tier
        ? ratio === '1:1' ? (tier.oneOnOnePrice ?? tier.price) : tier.price
        : null;

  const classes = mode(courses.map((c) => Number(c.lessons)).filter((n) => n > 0));
  const weeks = mode(courses.map((c) => Number((c as { durationWeeks?: number }).durationWeeks)).filter((n) => n > 0));
  const round2 = (n: number) => Math.round(n * 100) / 100;

  /* The enrolment line ("1 beginner cohort enrollment") says nothing a parent
     does not already know from the card they are looking at. */
  const rawFeatures = id === 'elementary' ? ELEMENTARY_FEATURES : (tier?.features ?? []).filter((f) => !/cohort enrollment/i.test(f));

  return {
    id,
    step: LADDER.indexOf(id) + 1,
    name: tier?.name ?? guide.name,
    who: guide.who,
    tagline: guide.tagline || tier?.tagline || '',
    popular: !!tier?.popular,
    price,
    perClass: price !== null && classes ? round2(price / classes) : null,
    classes,
    weeks,
    perMonth: price !== null && weeks ? round2(price / (weeks / WEEKS_PER_MONTH)) : null,
    courseCount: courses.length,
    projects: projectsAt(id, 3),
    features: featureLines(rawFeatures, ratio),
    cta: tier?.cta ?? 'Start with Elementary',
    href: `/courses?level=${COURSE_LEVEL[id]}`,
  };
}

export const ladder = (ratio: CodingRatio): LadderRung[] => LADDER.map((id) => ladderRung(id, ratio));

/* ── The level finder ───────────────────────────────────────────────────── */

export type AgeBand = '7-10' | '11-14' | '15-17' | '18+';
export type Experience = 'never' | 'a-little' | 'builds';

export const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: '7-10', label: '7–10' },
  { value: '11-14', label: '11–14' },
  { value: '15-17', label: '15–17' },
  { value: '18+', label: '18+' },
];

export const EXPERIENCE: { value: Experience; label: string }[] = [
  { value: 'never', label: 'Never coded' },
  { value: 'a-little', label: 'Tried a little' },
  { value: 'builds', label: 'Builds things already' },
];

/**
 * Where to start, and the one sentence that explains it.
 *
 * Deliberately cautious: when in doubt it recommends the lower rung. A child
 * who finds a level easy moves up after a few classes and feels clever; a child
 * dropped in too high feels stupid and stops — which is the churn this whole
 * business is trying not to have.
 */
export function recommendLevel(age: AgeBand, experience: Experience): { id: LadderId; reason: string } {
  if (age === '7-10') {
    return {
      id: 'elementary',
      reason: experience === 'builds'
        ? 'Even confident young coders start here — the Scratch-with-AI and Python projects stretch them fast.'
        : 'Scratch with Machine Learning and first Python projects are built for this age.',
    };
  }
  if (age === '11-14') {
    if (experience === 'never') return { id: 'elementary', reason: 'Python, Java or a first website from zero, with a finished project every module.' };
    if (experience === 'a-little') return { id: 'beginner', reason: 'They have the basics — now they build a complete app, game or website.' };
    return { id: 'intermediate', reason: 'They already build things, so they go straight to shipping one real product end to end.' };
  }
  if (experience === 'builds') {
    return { id: 'intermediate', reason: 'One real product, built and launched properly. Expert is the step after, for anyone already shipping.' };
  }
  return {
    id: 'beginner',
    reason: age === '18+'
      ? 'Zero to a working AI-powered project, with no coding experience assumed.'
      : 'From the basics to a complete app, website or game of their own.',
  };
}
