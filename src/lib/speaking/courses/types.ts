import type { Drill } from '@/components/speaking/speaking-lab';
import type { ArenaGame } from '@/lib/speaking/quest/arena';
import type { SpeakingBand } from '@/lib/speaking/bands';
import type { Twister } from '@/lib/speaking/quest/worlds';

/**
 * SARIRO — a Public Speaking course, written for one age group
 * ============================================================================
 * The founder, 17 Sep 2026: a child who finishes Grades 1–3 and joins 4–6 must
 * see a different course, not the same forty-six lesson names written more
 * simply. So each age group now has its own syllabus: its own modules in its
 * own order, its own lesson titles, its own map of worlds, showcases, warm-ups
 * and class games.
 *
 *   Grades 1–3     play: characters, animal voices, show and tell, puppets
 *   Grades 4–6     school: projects, reporting, stories, the first persuasion
 *   Grades 7–9     teens: confidence, debate, presentations, a camera
 *   Grades 10–12   stakes: admissions, vivas, MUN, leadership speeches
 *   UG, PG & pros  work: interviews, meetings, pitches, leadership
 *
 * What stays the same is the shape every course is scheduled on — 48 class
 * slots in eight modules of six, with the mid-course and final showcases at
 * slots 24 and 48 (lib/school/curriculum.ts). That is why modules 4 and 8
 * carry FIVE lessons.
 *
 * Drill ids are not written here: the course builder (courses/index.ts) gives
 * each one `ps-<band>-<lesson number>-<a|b|c|…>` from its position, so they
 * cannot collide or drift.
 */

/** A drill as written in a course file — the id comes from its position. */
export type CourseDrill = Omit<Drill, 'id'>;

export interface CourseLesson {
  title: string;
  /** One sentence a learner could repeat to someone at home. */
  oneLine: string;
  /** The teaching — two or three short paragraphs, pitched at this age. */
  idea: string[];
  /** Somebody doing it, and what to notice. */
  model?: { text: string; attribution?: string; noticing: string[] };
  /** The main drill, then the stretch. */
  drills: [CourseDrill, CourseDrill];
  /** More to practise, for the learner who wants to keep going. */
  extraDrills?: CourseDrill[];
  /** The class game — three steps a mentor can run. */
  game: Omit<ArenaGame, 'realWorld'>;
  /** Where this age group needs the skill outside class. */
  realWorld: string;
  /** For the mentor, in class. */
  mentorWatchFor: string[];
  /** The learner's own honest check. */
  selfCheck: string[];
  /** Two minutes at home, for a parent. Grades 1–6. */
  homeTip?: string;
  /** Sound Lab patterns (lib/speaking/sounds.ts). */
  soundLab?: string[];
  /** What the "write it before you say it" homework asks for. Not Grades 1–3. */
  writePrompt?: string;
}

/** A world on the course's quest map. */
export interface CourseWorld {
  name: string;
  emoji: string;
  color: string;
  /** What you can do when you leave it. */
  tagline: string;
}

export interface CourseModule {
  title: string;
  /** What a learner can DO when the module is finished. */
  outcome: string;
  world: CourseWorld;
  /** Six lessons; five in modules 4 and 8, whose last slot is a showcase. */
  lessons: CourseLesson[];
}

export interface CourseShowcase {
  name: string;
  emoji: string;
  brief: string;
}

export interface SpeakingCourse {
  band: SpeakingBand;
  /** Who the course is for and what it builds, in a sentence or two. */
  promise: string;
  /** The guide characters (Grades 1–3) or the course's through-line. */
  cast?: { name: string; emoji: string; teaches: string }[];
  modules: [CourseModule, CourseModule, CourseModule, CourseModule, CourseModule, CourseModule, CourseModule, CourseModule];
  showcases: { mid: CourseShowcase; final: CourseShowcase };
  /** The warm-up said at the start of every level. */
  warmUps: Twister[];
}
