import { bandForGrade, type SpeakingBand } from '@/lib/speaking/bands';

export type { StagedLesson } from '@/lib/speaking/courses';

/**
 * SARIRO — Public Speaking, five courses for five ages
 * ============================================================================
 * Public Speaking was sold as "any age" and written for teenagers and adults.
 * A seven-year-old enrolled in it met JFK and the viva. Since 17 Sep 2026 each
 * age group is its own course with its own syllabus (lib/speaking/courses):
 *
 *   Sprouts        Grades 1–3    play, characters, show and tell, puppets
 *   Explorers      Grades 4–6    projects, reporting, stories, a first pitch
 *   Speakers       Grades 7–9    confidence, debate, persuasion, camera
 *   Leaders        Grades 10–12  vivas, MUN, admissions, leadership
 *   Professionals  UG, PG & work interviews, meetings, pitching, keynotes
 *
 * A learner's stage is the band of their Public Speaking enrolment, or their
 * grade's band without one. A teacher can look at any stage, to prepare a
 * class of a different age.
 */

/** A stage is a band (lib/speaking/bands.ts) — each one a course of its own. */
export type Stage = SpeakingBand;

export interface StageMeta {
  key: Stage;
  name: string;
  grades: string;
  emoji: string;
  color: string;
  /** What a learner at this stage does, for the course page and the lesson header. */
  blurb: string;
  /** Younger readers: bigger text, the simple Sound Lab, friendlier ranks. */
  junior: boolean;
}

export const STAGES: Record<Stage, StageMeta> = {
  foundation: { key: 'foundation', name: 'Sprouts', grades: 'Grades 1–3', emoji: '🌱', color: '#16A34A', junior: true, blurb: 'Learning through play with Mika the Mic, Leo the Lion and friends: animal voices, show and tell, puppets, stories and a Superstar Show — plus a two-minute home activity for parents.' },
  primary: { key: 'primary', name: 'Explorers', grades: 'Grades 4–6', emoji: '🧭', color: '#0891B2', junior: true, blurb: 'Project presentations, assembly readings, a class newsroom, a storytellers’ club, a first pitch and a class election speech.' },
  middle: { key: 'middle', name: 'Speakers', grades: 'Grades 7–9', emoji: '🎤', color: '#7C3AED', junior: false, blurb: 'Speaking without fear of judgement, structure, debate, spotting manipulation, Model UN, podcasts and a TED-style talk.' },
  senior: { key: 'senior', name: 'Leaders', grades: 'Grades 10–12', emoji: '🏛️', color: '#DB2777', junior: false, blurb: 'Vivas, research presentations, competitive debate and MUN, admissions and scholarship interviews, leadership speeches.' },
  adult: { key: 'adult', name: 'Professionals', grades: 'UG, PG & professionals', emoji: '💼', color: '#0F172A', junior: false, blurb: 'Job and placement interviews, meetings, business presentations, pitching, negotiation and thought-leadership talks.' },
};

export const STAGE_ORDER: Stage[] = ['foundation', 'primary', 'middle', 'senior', 'adult'];

/** A grade on the 1–14 scale to a stage. Unknown grade: Speakers, the middle of the range. */
export const stageFor = (grade: number | null | undefined): Stage => bandForGrade(grade);
