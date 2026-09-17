import type { Drill } from '@/components/speaking/speaking-lab';
import type { SpeakingLesson } from '@/lib/speaking/lesson';
import type { ArenaGame } from '@/lib/speaking/quest/arena';
import type { Showcase, Twister, World } from '@/lib/speaking/quest/worlds';
import type { GradeSyllabus, SchoolLesson, SchoolModule } from '@/lib/school/curriculum';
import { BAND_ORDER, SPEAKING_TRACK_SLUG, type SpeakingBand } from '@/lib/speaking/bands';
import type { CourseDrill, SpeakingCourse } from './types';
import { FOUNDATION_COURSE } from './foundation';
import { PRIMARY_COURSE } from './primary';
import { MIDDLE_COURSE } from './middle';
import { SENIOR_COURSE } from './senior';
import { ADULT_COURSE } from './adult';

export type { SpeakingCourse, CourseLesson, CourseModule } from './types';

/**
 * SARIRO — the five Public Speaking courses, ready to read
 * ============================================================================
 * The course files are written for people (courses/<band>/); this turns them
 * into what the rest of the app reads: lessons with keys, numbers and drill
 * ids, a syllabus on the 48-slot class schedule, the quest map's worlds and
 * showcases, and the warm-ups.
 *
 *   slot  1–23   modules 1–4, six lessons each but five in module 4
 *   slot 24      the mid-course showcase
 *   slot 25–47   modules 5–8, five lessons in module 8
 *   slot 48      the final showcase
 */

export const SPEAKING_COURSES: Record<SpeakingBand, SpeakingCourse> = {
  foundation: FOUNDATION_COURSE,
  primary: PRIMARY_COURSE,
  middle: MIDDLE_COURSE,
  senior: SENIOR_COURSE,
  adult: ADULT_COURSE,
};

const SLOTS_PER_MODULE = 6;
const SHOWCASE_SLOTS = [24, 48] as const;

/** A lesson as its own course teaches it. Everything a view or homework needs. */
export interface StagedLesson extends SpeakingLesson {
  stage: SpeakingBand;
  realWorld: string;
  game: ArenaGame;
  /** Two minutes at home, for a parent. */
  homeTip?: string;
  /** What the "write it before you say it" homework asks for. */
  writePrompt?: string;
}

const PARTS = 'abcdefgh';

function build(band: SpeakingBand): StagedLesson[] {
  const course = SPEAKING_COURSES[band];
  const out: StagedLesson[] = [];
  course.modules.forEach((mod, m) => {
    mod.lessons.forEach((l, i) => {
      const number = m * SLOTS_PER_MODULE + i + 1;
      let part = 0;
      const drill = (d: CourseDrill): Drill => ({ id: `ps-${band}-${number}-${PARTS[part++]}`, ...d });
      const drills = l.drills.map(drill);
      const extraDrills = (l.extraDrills ?? []).map(drill);
      out.push({
        key: `${SPEAKING_TRACK_SLUG}:${band}:${m + 1}:${i}`,
        moduleNum: m + 1,
        lessonIndex: i,
        number,
        title: l.title,
        oneLine: l.oneLine,
        idea: l.idea,
        model: l.model,
        drills,
        extraDrills,
        mentorWatchFor: l.mentorWatchFor,
        selfCheck: l.selfCheck,
        soundLab: l.soundLab ?? [],
        stage: band,
        realWorld: l.realWorld,
        game: { ...l.game, realWorld: l.realWorld },
        homeTip: l.homeTip,
        writePrompt: l.writePrompt,
      });
    });
  });
  return out;
}

const LESSONS = Object.fromEntries(BAND_ORDER.map((b) => [b, build(b)])) as Record<SpeakingBand, StagedLesson[]>;

/** Every lesson in one band's course, in course order. */
export const speakingLessons = (band: SpeakingBand): readonly StagedLesson[] => LESSONS[band];

/** One band's lesson at a syllabus position, or null (a showcase slot, or nothing there). */
export function speakingLessonAt(band: SpeakingBand, moduleNum: number, lessonIndex: number): StagedLesson | null {
  return LESSONS[band].find((l) => l.moduleNum === moduleNum && l.lessonIndex === lessonIndex) ?? null;
}

/** How many lessons are written across the five courses. Used by scripts/audit-lesson-content.ts. */
export const speakingWrittenCount = (band?: SpeakingBand) =>
  band ? LESSONS[band].length : BAND_ORDER.reduce((n, b) => n + LESSONS[b].length, 0);

/** The course's quest map. World numbers are module numbers. */
export function worldsFor(band: SpeakingBand): World[] {
  return SPEAKING_COURSES[band].modules.map((m, i) => ({ num: i + 1, ...m.world }));
}

export function worldOf(band: SpeakingBand, moduleNum: number): World {
  const worlds = worldsFor(band);
  return worlds.find((w) => w.num === moduleNum) ?? worlds[0];
}

/** The two showcases a course builds to, at the assessment slots. */
export function showcasesFor(band: SpeakingBand): Showcase[] {
  const { mid, final } = SPEAKING_COURSES[band].showcases;
  return [
    { slot: 24, ...mid, worlds: [1, 2, 3, 4], unlockAfter: 12 },
    { slot: 48, ...final, worlds: [5, 6, 7, 8], unlockAfter: 12 },
  ];
}

export function showcaseBySlot(band: SpeakingBand, slot: number): Showcase | null {
  return showcasesFor(band).find((s) => s.slot === slot) ?? null;
}

/** The warm-up for a level, from the course's own set. */
export function warmUpFor(band: SpeakingBand, lessonNumber: number): Twister {
  const list = SPEAKING_COURSES[band].warmUps;
  return list[(Math.max(1, lessonNumber) - 1) % list.length];
}

/**
 * A band's syllabus in the shape every course is scheduled on: eight modules of
 * six class slots, the showcases at 24 and 48. The lesson list, the admin
 * editor and the course page all read this.
 */
export function speakingSyllabus(band: SpeakingBand): GradeSyllabus {
  const course = SPEAKING_COURSES[band];
  const showcases = showcasesFor(band);
  let authoredCount = 0;
  const modules: SchoolModule[] = course.modules.map((mod, m) => {
    const lessons: SchoolLesson[] = [];
    for (let i = 0; i < SLOTS_PER_MODULE; i++) {
      const number = m * SLOTS_PER_MODULE + i + 1;
      const showcase = (SHOWCASE_SLOTS as readonly number[]).includes(number) ? showcases.find((s) => s.slot === number) : undefined;
      const written = showcase ? undefined : mod.lessons[i];
      if (written) authoredCount++;
      lessons.push({
        key: `${SPEAKING_TRACK_SLUG}:${band}:${m + 1}:${i}`,
        moduleNum: m + 1,
        lessonIndex: i,
        number,
        // Still called an assessment on the schedule, as every course's slots 24 and 48 are.
        title: showcase ? `${number === 48 ? 'Final' : 'Mid-course'} assessment · ${showcase.name}` : written?.title ?? `Lesson ${number}`,
        authored: !!written,
        kind: showcase ? 'test' : 'lesson',
        testSheetUrl: null,
      });
    }
    return { num: m + 1, title: mod.title, outcome: mod.outcome, lessons, authored: true };
  });
  const slotCount = SLOTS_PER_MODULE * course.modules.length;
  return {
    subjectSlug: SPEAKING_TRACK_SLUG,
    grade: 0,
    modules,
    slotCount,
    lessonCount: slotCount - SHOWCASE_SLOTS.length,
    testCount: SHOWCASE_SLOTS.length,
    authoredCount,
  };
}
