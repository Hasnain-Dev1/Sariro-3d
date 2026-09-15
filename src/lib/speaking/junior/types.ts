import type { Drill } from '@/components/speaking/speaking-lab';
import type { ArenaGame } from '@/lib/speaking/quest/arena';

/**
 * SARIRO — a Public Speaking lesson, for a younger child
 * ============================================================================
 * The course's forty-six lessons were written for teenagers and adults: John F.
 * Kennedy, interviews, vivas, ethos and logos. A seven-year-old can learn every
 * one of those ideas — the pause, the opening, the story with a turn in it —
 * but not from those paragraphs.
 *
 * So each lesson has a junior version for Grades 1–6, teaching the SAME idea
 * (same title, same slot in the syllabus, same homework mission ids) in words a
 * child reads on their own, with drills short enough to finish, passages they
 * can read aloud, and a two-minute thing a parent can do at the dinner table.
 * lib/speaking/stages.ts decides which version a learner sees, from their grade.
 */
export interface JuniorLesson {
  /** The lesson's course number — the same one the teen version has. */
  number: number;
  oneLine: string;
  /** Two or three short paragraphs a Grade 3 child can read alone. */
  idea: string[];
  /** A short example to hear or read, and what to notice. */
  model?: { text: string; noticing: string[] };
  /** Two: an easy one every child can finish, then a stretch. */
  drills: [Drill, Drill];
  /** Where a child needs this outside class. */
  realWorld: string;
  /** Two minutes at home, for the parent. */
  homeTip: string;
  /** A class game for younger children, where the teen one does not fit. */
  game?: ArenaGame;
  /** Sound Lab patterns suited to younger readers, where the teen ones are too hard. */
  soundLab?: string[];
}

/** Keeps the drill ids unique and tied to the lesson number. */
export function jd(number: number, part: 'a' | 'b', d: Omit<Drill, 'id'>): Drill {
  return { id: `ps-j-${number}-${part}`, ...d };
}
