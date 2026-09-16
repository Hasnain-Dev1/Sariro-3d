import type { Drill } from '@/components/speaking/speaking-lab';
import type { ArenaGame } from '@/lib/speaking/quest/arena';
import type { SpeakingBand } from '@/lib/speaking/bands';

/**
 * SARIRO — one Public Speaking lesson, written for one age band
 * ============================================================================
 * Public Speaking is five courses (lib/speaking/bands.ts), and since 16 Sep
 * 2026 each band has its own version of every lesson. The syllabus is shared —
 * the same forty-six titles in the same slots, teaching the same principle —
 * because a principle does not change with age: a pause works for a nine-year-
 * old and for a founder pitching investors. What changes is everything around
 * it: the words, the examples, the situations a learner actually faces, how
 * long they can speak for, and what homework is worth doing.
 *
 *   Grades 1–3     lib/speaking/junior           (the first junior version)
 *   Grades 4–6     band-lessons/primary
 *   Grades 7–9     band-lessons/middle
 *   Grades 10–12   lib/speaking/modules          (the original full course)
 *   UG, PG & pros  band-lessons/adult
 *
 * lib/speaking/stages.ts lays a band lesson over the base lesson, so anything a
 * band does not override (the title, the key, the slot) stays the syllabus's.
 */
export interface BandLesson {
  /** The lesson's course number, 1–47 without the showcase at 24. */
  number: number;
  oneLine: string;
  /** Two or three paragraphs, pitched at a reader of this band. */
  idea: string[];
  model?: { text: string; attribution?: string; noticing: string[] };
  /** The main drill, then the stretch. */
  drills: [Drill, Drill];
  /** More to practise, for the learner who wants to keep going. */
  extraDrills?: Drill[];
  /** For the mentor, in class. */
  mentorWatchFor: string[];
  /** The learner's own honest check. */
  selfCheck: string[];
  /** Where this band needs the skill outside class. */
  realWorld: string;
  /** Two minutes at home, for a parent. Grades 4–6. */
  homeTip?: string;
  /** A class game that fits this band better than the default one. */
  game?: ArenaGame;
  /** Sound Lab patterns suited to this band. */
  soundLab?: string[];
  /** What the "write it before you say it" homework asks for. */
  writePrompt?: string;
}

/** A drill id tied to band, lesson and part — unique across every band. */
export function bd(band: SpeakingBand, number: number, part: 'a' | 'b' | 'c' | 'd', d: Omit<Drill, 'id'>): Drill {
  return { id: `ps-${band}-${number}-${part}`, ...d };
}
