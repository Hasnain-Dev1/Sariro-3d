import type { Drill } from '@/components/speaking/speaking-lab';

/**
 * SARIRO — what a Public Speaking lesson is made of
 * =========================================================
 * Not the coding shape, and deliberately so.
 *
 * A coding lesson is five tabs ending in a quiz, because coding has a right
 * answer a machine can check. Public Speaking has none of that. There is no
 * output to test, the knowledge is worth almost nothing on its own, and a
 * student who can define "signposting" and has never said a sentence out loud
 * has learned nothing at all.
 *
 * So the shape follows what actually makes somebody better at speaking:
 *
 *   idea      the one thing this lesson is about, in a few sentences
 *   model     somebody doing it, with the reason it works pointed at
 *   drills    the student speaking, measured — the centre of the lesson
 *   watch     what the mentor is looking for in class
 *   more      extra passages, so a student who wants to keep going can
 *
 * `drills` is the largest field on purpose. In a coding lesson the reading is
 * the lesson and the exercise checks it; here the reading is preparation and
 * the speaking IS the lesson.
 *
 * ── Practice does not run out ───────────────────────────────────────────────
 * `extraDrills` exists because the first version of this had one drill per
 * lesson, and a student who wanted to practise more had nowhere to go — which
 * is the exact moment somebody is most likely to improve and most likely to be
 * lost. Every lesson carries more than anybody will use, and the lab also takes
 * a passage the student pastes in themselves.
 *
 * ── Where the slots come from ───────────────────────────────────────────────
 * The 48 class slots are laid out by buildGradeSyllabus in
 * lib/school/curriculum.ts: eight modules of six, with assessments at slots 24
 * and 48. That is why modules 4 and 8 carry FIVE lessons — their sixth slot is
 * a test. 6×6 + 2×5 = 46 lessons.
 */

export interface SpeakingLesson {
  /** `public-speaking:0:<module>:<index>` — matches the curriculum's own key. */
  key: string;
  moduleNum: number;
  lessonIndex: number;
  number: number;
  title: string;

  /** One sentence a student could repeat to a parent. */
  oneLine: string;

  /** The teaching. Short — nobody improves at speaking by reading. */
  idea: string[];

  /** Somebody doing it, and why it works. */
  model?: {
    /** The passage, speech extract or exchange. */
    text: string;
    /** Who said it, when it is a real one. */
    attribution?: string;
    /** What to notice. The part that does the teaching. */
    noticing: string[];
  };

  /** The lesson. Done aloud, measured by the lab. */
  drills: Drill[];

  /** Anything the student wants to keep practising on. */
  extraDrills?: Drill[];

  /** For the mentor, in class. Not shown to the student. */
  mentorWatchFor: string[];

  /** The student's own check, answerable honestly by them alone. */
  selfCheck: string[];
}

export interface SpeakingModule {
  num: number;
  title: string;
  outcome: string;
  lessons: SpeakingLesson[];
}

/**
 * Build a lesson without repeating the key, module and index three times.
 * The key is derived, so it cannot drift from the numbers beside it.
 */
export function lesson(
  moduleNum: number,
  lessonIndex: number,
  number: number,
  title: string,
  rest: Omit<SpeakingLesson, 'key' | 'moduleNum' | 'lessonIndex' | 'number' | 'title'>
): SpeakingLesson {
  return {
    key: `public-speaking:0:${moduleNum}:${lessonIndex}`,
    moduleNum,
    lessonIndex,
    number,
    title,
    ...rest,
  };
}
