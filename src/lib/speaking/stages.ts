import type { Drill } from '@/components/speaking/speaking-lab';
import type { SpeakingLesson } from '@/lib/speaking/lesson';
import type { ArenaGame } from '@/lib/speaking/quest/arena';
import { GRADE_UNDERGRADUATE } from '@/lib/grade/tag';
import type { JuniorLesson } from './junior/types';
import { JUNIOR_WORLD_1, JUNIOR_WORLD_2 } from './junior/world-1-2';
import { JUNIOR_WORLD_3, JUNIOR_WORLD_4 } from './junior/world-3-4';
import { JUNIOR_WORLD_5, JUNIOR_WORLD_6 } from './junior/world-5-6';
import { JUNIOR_WORLD_7, JUNIOR_WORLD_8 } from './junior/world-7-8';

/**
 * SARIRO — one Public Speaking course, five stages
 * ============================================================================
 * Public Speaking was sold as "any age" and written for teenagers and adults.
 * A seven-year-old enrolled in it met JFK and the viva. Now the same course —
 * same forty-six lessons, same syllabus titles, same homework mission ids, same
 * Voice Quest map — meets each learner where they are:
 *
 *   Sprouts        Grades 1–3    junior lessons, shorter drills, no writing
 *                                 homework, gentler pass marks, parent tips
 *   Explorers      Grades 4–6    junior lessons, short writing, real pass marks
 *   Speakers       Grades 7–9    the full course
 *   Leaders        Grades 10–12  the full course
 *   Professionals  college and work  the full course
 *
 * The stage comes from the learner's grade (lib/grade/tag.ts). A teacher can
 * look at any stage, to prepare a class of a different age.
 */

export type Stage = 'foundation' | 'primary' | 'middle' | 'senior' | 'adult';

export interface StageMeta {
  key: Stage;
  name: string;
  grades: string;
  emoji: string;
  color: string;
  /** What a learner at this stage does, for the course page and the lesson header. */
  blurb: string;
  /** Uses the junior version of every lesson. */
  junior: boolean;
}

export const STAGES: Record<Stage, StageMeta> = {
  foundation: { key: 'foundation', name: 'Sprouts', grades: 'Grades 1–3', emoji: '🌱', color: '#16A34A', junior: true, blurb: 'Show and tell, big clear voices, tongue twisters and first stories — with a two-minute home activity for parents after every class.' },
  primary: { key: 'primary', name: 'Explorers', grades: 'Grades 4–6', emoji: '🧭', color: '#0891B2', junior: true, blurb: 'Hooks, three reasons, signposts and stories with a twist — presenting projects and speaking up in class with confidence.' },
  middle: { key: 'middle', name: 'Speakers', grades: 'Grades 7–9', emoji: '🎤', color: '#7C3AED', junior: false, blurb: 'Structure, nerves, debate and persuasion — the years when speaking in front of the class starts to count.' },
  senior: { key: 'senior', name: 'Leaders', grades: 'Grades 10–12', emoji: '🏛️', color: '#DB2777', junior: false, blurb: 'Interviews, vivas, debates and speeches that matter — ready for admissions, competitions and leadership roles.' },
  adult: { key: 'adult', name: 'Professionals', grades: 'College & working life', emoji: '💼', color: '#0F172A', junior: false, blurb: 'Meetings, presentations, interviews and camera — the skill that decides careers.' },
};

export const STAGE_ORDER: Stage[] = ['foundation', 'primary', 'middle', 'senior', 'adult'];

/** A grade on the 1–14 scale to a stage. Unknown grade: Speakers, the middle of the course. */
export function stageFor(grade: number | null | undefined): Stage {
  if (grade === null || grade === undefined || !Number.isFinite(grade)) return 'middle';
  if (grade >= GRADE_UNDERGRADUATE) return 'adult';
  if (grade >= 10) return 'senior';
  if (grade >= 7) return 'middle';
  if (grade >= 4) return 'primary';
  return 'foundation';
}

export const JUNIOR_LESSONS: JuniorLesson[] = [
  ...JUNIOR_WORLD_1, ...JUNIOR_WORLD_2, ...JUNIOR_WORLD_3, ...JUNIOR_WORLD_4,
  ...JUNIOR_WORLD_5, ...JUNIOR_WORLD_6, ...JUNIOR_WORLD_7, ...JUNIOR_WORLD_8,
];

export function juniorLesson(number: number): JuniorLesson | null {
  return JUNIOR_LESSONS.find((j) => j.number === number) ?? null;
}

/** A lesson as one stage sees it. Everything a view or homework needs, already chosen. */
export interface StagedLesson extends SpeakingLesson {
  stage: Stage;
  /** Where this is needed outside class — junior lessons carry their own. */
  realWorld?: string;
  /** Two minutes at home, for a parent. Junior stages only. */
  homeTip?: string;
  /** A class game that replaces the teen one for this stage. */
  game?: ArenaGame;
}

/** Sprouts get the junior drills a little shorter: a six-year-old's minute is long. */
function forSprouts(d: Drill): Drill {
  return d.targetSeconds ? { ...d, targetSeconds: Math.max(10, Math.round((d.targetSeconds * 0.7) / 5) * 5) } : d;
}

export function stageLesson(lesson: SpeakingLesson, stage: Stage): StagedLesson {
  const junior = STAGES[stage].junior ? juniorLesson(lesson.number) : null;
  if (!junior) return { ...lesson, stage };
  const drills = stage === 'foundation' ? junior.drills.map(forSprouts) : [...junior.drills];
  return {
    ...lesson,
    stage,
    oneLine: junior.oneLine,
    idea: junior.idea,
    model: junior.model ? { text: junior.model.text, noticing: junior.model.noticing } : undefined,
    drills,
    // The teen extras are too long and too grown-up; the stretch drill is the extra.
    extraDrills: [],
    soundLab: junior.soundLab ?? [],
    realWorld: junior.realWorld,
    homeTip: junior.homeTip,
    game: junior.game,
  };
}
