import type { Drill } from '@/components/speaking/speaking-lab';
import type { SpeakingLesson } from '@/lib/speaking/lesson';
import type { PracticeAttempt, PracticeKind } from '@/lib/speaking/progress';
import { soundPattern } from '@/lib/speaking/sounds';
import { SHOWCASES, type Showcase } from './worlds';

/**
 * SARIRO — homework that knows whether it was done
 * ============================================================================
 * "Practise your speech at home" is homework nobody can check, so nobody does
 * it, and the next class starts from where the last one did. Every lesson here
 * ends with missions instead — speaking, listening, writing and sounds — and
 * each mission says, before a child starts:
 *
 *   how many tries it takes     attempts
 *   what counts as a pass       pass (the lab's own 0–100 score), and for
 *                               speaking and writing a floor that proves real
 *                               work happened: words actually heard, words
 *                               actually written
 *   what it is worth            xp, and up to three stars
 *
 * Every try is a row in practice_attempts (drill_id = the mission id), so the
 * record a child sees, the one the teacher opens before class and the stars on
 * the quest map are all the same rows. Nothing is self-reported and nothing can
 * be ticked off without being done.
 *
 * Missions are built from the lesson's own material — its drills, its model
 * passage, its Sound Lab patterns — so homework is always about that lesson.
 */

export type MissionKind = 'speak' | 'listen' | 'write' | 'sound';

export interface MetricGoal {
  key: string;
  min?: number;
  max?: number;
  /** Said to the child: "at least 40 words". */
  label: string;
}

export interface Mission {
  /** Also the drill_id every attempt is logged under. */
  id: string;
  kind: MissionKind;
  title: string;
  brief: string;
  /** Tries required before it can pass. */
  attempts: number;
  /** The best score must reach this. */
  pass: number;
  goal?: MetricGoal;
  xp: number;
  drill?: Drill;
  passage?: string;
  prompt?: string;
  pattern?: string;
}

/** Which practice_attempts kind a mission logs as. Sound rounds are listening: the table allows three kinds. */
export const LOG_KIND: Record<MissionKind, PracticeKind> = {
  speak: 'speaking',
  listen: 'listening',
  write: 'writing',
  sound: 'listening',
};

const HEARD: MetricGoal = { key: 'wpm', min: 40, label: 'your words were heard' };
const WROTE: MetricGoal = { key: 'words', min: 40, label: 'at least 40 words' };

const words = (s: string | undefined) => (s ?? '').trim().split(/\s+/).filter(Boolean).length;

export function homeworkFor(lesson: SpeakingLesson): Mission[] {
  const id = (slug: string) => `hw:${lesson.key}:${slug}`;
  const main = lesson.drills[0];
  const stretch = lesson.drills[1] ?? lesson.extraDrills?.[0] ?? main;
  const listenText = lesson.model && words(lesson.model.text) >= 12 ? lesson.model.text : lesson.oneLine;

  const missions: Mission[] = [
    {
      id: id('speak'), kind: 'speak', title: main.title,
      brief: `${main.brief} Three tries — the report after each one tells you what to change for the next.`,
      attempts: 3, pass: 65, goal: HEARD, xp: 40,
      drill: { ...main, id: id('speak') },
    },
    {
      id: id('listen'), kind: 'listen', title: 'Hear it once, give it back',
      brief: 'Listen to the line from today’s lesson, then type or say exactly what you heard. Great speakers are great listeners first.',
      attempts: 2, pass: 70, xp: 30,
      passage: listenText,
    },
    {
      id: id('write'), kind: 'write', title: 'Write it before you say it',
      brief: `Plan “${stretch.title}” on paper first: 4 to 6 sentences of what you will actually say. Then say it in the next mission.`,
      attempts: 1, pass: 70, goal: WROTE, xp: 30,
      prompt: `Write what you will say for “${stretch.title}”. ${stretch.brief}`,
    },
  ];

  if (stretch !== main) {
    missions.push({
      id: id('stretch'), kind: 'speak', title: `Level up: ${stretch.title}`,
      brief: `${stretch.brief} Use what you wrote. Two tries.`,
      attempts: 2, pass: 70, goal: HEARD, xp: 50,
      drill: { ...stretch, id: id('stretch') },
    });
  }

  for (const p of lesson.soundLab ?? []) {
    const pattern = soundPattern(p);
    if (!pattern) continue;
    missions.push({
      id: id(`sound:${p}`), kind: 'sound', title: `Sound sort: ${pattern.spelling}`,
      brief: `${pattern.hook} Sort eight words by their sound — twice. Silver or better passes.`,
      attempts: 2, pass: 75, xp: 30,
      pattern: p,
    });
  }

  return missions;
}

/** The showcase at an assessment slot: one performance, one listen, one script. */
export function showcaseMissions(showcase: Showcase): Mission[] {
  const id = (slug: string) => `hw:showcase:${showcase.slot}:${slug}`;
  const long = showcase.slot === 48;
  return [
    {
      id: id('write'), kind: 'write', title: 'Write the script',
      brief: long
        ? 'A persuasive two-minute talk built around a true story about you. Opening, the story, three reasons, the ask, the ending.'
        : 'A ninety-second talk on something you care about: an opening that earns attention, three signposted points, an ending that lands.',
      attempts: 1, pass: 75, goal: { key: 'words', min: long ? 180 : 120, label: `at least ${long ? 180 : 120} words` }, xp: 80,
      prompt: long ? 'Write your Grand Stage speech.' : 'Write your Mid-Course Stage talk.',
    },
    {
      id: id('speak'), kind: 'speak', title: long ? 'The Grand Stage performance' : 'The Mid-Course performance',
      brief: `${showcase.brief} Standing, to camera, from key words only. Three tries — your best one counts.`,
      attempts: 3, pass: long ? 80 : 75, goal: { key: 'fillersPerMin', max: 4, label: 'no more than 4 filler words a minute' }, xp: 200,
      drill: { id: id('speak'), title: showcase.name, brief: showcase.brief, targetSeconds: long ? 120 : 90 },
    },
    {
      id: id('listen'), kind: 'listen', title: 'Listen like a judge',
      brief: 'Hear a famous line and give it back word for word. A judge who cannot repeat what was said cannot judge it.',
      attempts: 2, pass: 75, xp: 60,
      passage: long
        ? 'Education is the most powerful weapon which can change the world. One child, one teacher, one book, one pen can change the world.'
        : 'We choose to go to the Moon in this decade, not because it is easy, but because it is hard.',
    },
  ];
}

export function showcaseBySlot(slot: number): Showcase | null {
  return SHOWCASES.find((s) => s.slot === slot) ?? null;
}

/* ── Did they do it? ─────────────────────────────────────────────────────── */

export type Stars = 0 | 1 | 2 | 3;

export interface MissionStatus {
  mission: Mission;
  /** Newest first. */
  records: PracticeAttempt[];
  tries: number;
  triesLeft: number;
  best: number | null;
  passed: boolean;
  stars: Stars;
}

export function goalMet(goal: MetricGoal | undefined, metrics: Record<string, number> | undefined): boolean {
  if (!goal) return true;
  const v = metrics?.[goal.key];
  if (typeof v !== 'number' || !Number.isFinite(v)) return false;
  if (goal.min !== undefined && v < goal.min) return false;
  if (goal.max !== undefined && v > goal.max) return false;
  return true;
}

/** Whether one attempt, on its own, would pass the mission. */
export function attemptPasses(mission: Mission, a: PracticeAttempt): boolean {
  return a.score >= mission.pass && goalMet(mission.goal, a.metrics);
}

export function missionStatus(mission: Mission, attempts: readonly PracticeAttempt[]): MissionStatus {
  const records = attempts
    .filter((a) => a.drillId === mission.id)
    .sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt));
  const tries = records.length;
  const passing = records.filter((a) => attemptPasses(mission, a));
  const best = tries ? Math.max(...records.map((a) => a.score)) : null;
  const bestPassing = passing.length ? Math.max(...passing.map((a) => a.score)) : null;
  const passed = tries >= mission.attempts && bestPassing !== null;
  const stars: Stars = !passed || bestPassing === null
    ? 0
    : bestPassing >= 90 ? 3 : bestPassing >= Math.min(89, mission.pass + 10) ? 2 : 1;
  return { mission, records, tries, triesLeft: Math.max(0, mission.attempts - tries), best, passed, stars };
}

export interface LevelStatus {
  missions: MissionStatus[];
  passed: number;
  total: number;
  cleared: boolean;
  /** The weakest mission's stars, once cleared — a level is as good as its worst part. */
  stars: Stars;
  /** Anything tried at all. */
  started: boolean;
}

export function levelStatus(missions: readonly Mission[], attempts: readonly PracticeAttempt[]): LevelStatus {
  const statuses = missions.map((m) => missionStatus(m, attempts));
  const passed = statuses.filter((s) => s.passed).length;
  const cleared = statuses.length > 0 && passed === statuses.length;
  const stars = (cleared ? Math.min(...statuses.map((s) => s.stars)) : 0) as Stars;
  return { missions: statuses, passed, total: statuses.length, cleared, stars, started: statuses.some((s) => s.tries > 0) };
}
