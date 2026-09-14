/**
 * SARIRO — a trial class, planned
 * ============================================================================
 * A trial is thirty minutes that decide whether a family stays. Teachers were
 * walking into them with a name, a grade and a subject, and inventing the half
 * hour on the spot — so the same trial went brilliantly with one teacher and
 * flat with another, and nobody could say why.
 *
 * A playbook is the plan for one kind of trial (one subject). It is not a
 * script, because no two children arrive the same. It is a set of paths — real
 * alternatives, each for a different child — plus the questions that tell a
 * teacher which child they have, and what to do when a path is too easy or too
 * hard halfway through.
 *
 *   intake     what the family tells us before class (lib on /my-class)
 *   opening    the first five minutes: welcome, and find out who this is
 *   diagnose   questions whose answers say "new", "some" or "strong"
 *   paths      the alternatives — each says who it suits, the steps, the
 *              rescue when stuck, the stretch when flying, and the moment the
 *              child shows a parent what they made
 *   close      the last five minutes, and the honest read for the parent
 */

/** Where the child is with this subject, not how clever they are. */
export type Level = 'new' | 'some' | 'strong';

/** G1–3, G4–6, G7–9, G10–12, and undergraduates and professionals. */
export type Band = 'foundation' | 'primary' | 'middle' | 'senior' | 'adult';

export interface Step {
  /** Roughly how long, so a teacher can glance at the clock. */
  minutes: number;
  title: string;
  /** What the teacher does. */
  do: string[];
  /** A line worth saying word for word. */
  say?: string;
  /** How they know it worked before moving on. */
  check?: string;
}

export interface Tool {
  label: string;
  /** An external site the teacher screen-shares, or a Sariro page. */
  href?: string;
  /** Sound Lab patterns to open right on the playbook page. */
  soundLab?: string[];
}

export interface Path {
  id: string;
  name: string;
  /** The child it is for, in one line a teacher can match against the child in front of them. */
  forWho: string;
  levels: Level[];
  bands: Band[];
  /** Intake interest ids that point here. */
  interests: string[];
  /** What the child will be able to say they did. */
  win: string;
  steps: Step[];
  ifStuck: string[];
  ifFlying: string[];
  /** The last thing they do: showing the parent. */
  showOff: string;
  tools?: Tool[];
}

export interface WarmUp {
  q: string;
  options: string[];
  /** Index into options. */
  answer: number;
  /** Said after they answer, right or wrong. */
  explain: string;
  /** Which children it suits; every band when omitted. */
  bands?: Band[];
}

export interface DiagnosticQuestion {
  ask: string;
  /** What an answer sounds like, and what it tells you. */
  listenFor: { answer: string; means: Level }[];
}

export interface Playbook {
  /** The trial subject slug (lib/trial/subjects.ts). */
  subject: string;
  title: string;
  /** What the family should leave with, whichever path was taken. */
  promise: string;
  intake: {
    experience: { id: Level; label: string }[];
    interests: { id: string; label: string; emoji: string }[];
    warmUps: WarmUp[];
  };
  opening: Step;
  diagnose: DiagnosticQuestion[];
  paths: Path[];
  close: Step;
  /** The honest read, by where the child turned out to be. */
  parentTalk: Record<Level, string>;
  /** What loses trials in this subject. */
  avoid: string[];
}

/** What the family told us, as stored on the booking (see scripts/trial-intake.sql). */
export interface TrialIntake {
  experience?: Level;
  interests?: string[];
  /** 1 (nervous) to 5 (can't wait). */
  feeling?: number;
  question?: string;
  warmUp?: { correct: number; total: number };
  /** A mic that worked on their device before class. */
  micOk?: boolean;
  updatedAt?: string;
}
