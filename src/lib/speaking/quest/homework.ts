import type { Drill } from '@/components/speaking/speaking-lab';
import type { SpeakingLesson } from '@/lib/speaking/lesson';
import type { PracticeAttempt, PracticeKind } from '@/lib/speaking/progress';
import { soundPattern } from '@/lib/speaking/sounds';
import { stageLesson, type Stage } from '@/lib/speaking/stages';
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

const words = (s: string | undefined) => (s ?? '').trim().split(/\s+/).filter(Boolean).length;

/**
 * The bar, by band. Younger learners get fewer tries, gentler pass marks, a
 * lower "we heard words" floor for a slower reader — and no writing at all for
 * Grades 1–3, who are learning to write sentences in school, not scripts. The
 * older bands ask more of each attempt and longer writing.
 *
 * ── Each band keeps its own record (16 Sep 2026) ────────────────────────────
 * Public Speaking is five courses, each with its own lessons, so each band's
 * missions have their own ids: a learner who moves from Grades 4–6 to 7–9
 * starts the new course's quest fresh rather than finding levels "cleared" by
 * drills they never did. The earlier course's record stays in the table.
 */
interface StageRules {
  speak: [number, number];
  stretch: [number, number];
  listen: [number, number];
  write: { attempts: number; pass: number; words: number } | null;
  sound: [number, number];
  heardWpm: number;
}

export const STAGE_RULES: Record<Stage, StageRules> = {
  foundation: { speak: [2, 55], stretch: [1, 55], listen: [2, 60], write: null, sound: [2, 60], heardWpm: 25 },
  primary: { speak: [3, 60], stretch: [2, 65], listen: [2, 65], write: { attempts: 1, pass: 65, words: 30 }, sound: [2, 70], heardWpm: 30 },
  middle: { speak: [3, 65], stretch: [2, 70], listen: [2, 70], write: { attempts: 1, pass: 70, words: 50 }, sound: [2, 75], heardWpm: 40 },
  senior: { speak: [3, 70], stretch: [2, 75], listen: [2, 75], write: { attempts: 1, pass: 75, words: 70 }, sound: [2, 80], heardWpm: 45 },
  adult: { speak: [3, 70], stretch: [2, 75], listen: [2, 75], write: { attempts: 1, pass: 75, words: 80 }, sound: [2, 80], heardWpm: 50 },
};

/** What the writing mission is called and how much it asks for, by band. */
const WRITE_ASK: Record<Stage, string> = {
  foundation: '',
  primary: '3 or 4 sentences',
  middle: 'a short paragraph',
  senior: 'a structured outline in full sentences',
  adult: 'your talking points in full sentences',
};

/** How the listening mission is introduced, by band. */
const LISTEN_BRIEF: Record<Stage, string> = {
  foundation: 'Listen to the sentence, then say it back or type it. Listen with your whole brain!',
  primary: 'Listen to the line from today’s lesson, then say it back or type it exactly. Good speakers are good listeners first.',
  middle: 'Listen to the line from today’s lesson, then type or say exactly what you heard. Great speakers are great listeners first.',
  senior: 'Hear the key line once and give it back word for word — the same skill as answering the exact question an examiner or interviewer asked.',
  adult: 'Hear the key line once and give it back exactly — precise listening is how you answer the question that was actually asked in a meeting or interview.',
};

const tries = (n: number) => (n === 1 ? 'One try' : `${['', 'One', 'Two', 'Three', 'Four', 'Five'][n] ?? n} tries`);

/** The homework for one lesson, as the learner's stage sees it. */
export function homeworkFor(base: SpeakingLesson, stage: Stage = 'senior'): Mission[] {
  const lesson = stageLesson(base, stage);
  const rules = STAGE_RULES[stage];
  const heard: MetricGoal = { key: 'wpm', min: rules.heardWpm, label: 'your words were heard' };
  const id = (slug: string) => `hw:${stage}:${lesson.key}:${slug}`;
  const main = lesson.drills[0];
  const stretch = lesson.drills[1] ?? lesson.extraDrills?.[0] ?? main;
  const listenText = lesson.model && words(lesson.model.text) >= 12 ? lesson.model.text : lesson.oneLine;

  const missions: Mission[] = [
    {
      id: id('speak'), kind: 'speak', title: main.title,
      brief: `${main.brief} ${tries(rules.speak[0])} — the report after each one tells you what to change for the next.`,
      attempts: rules.speak[0], pass: rules.speak[1], goal: heard, xp: 40,
      drill: { ...main, id: id('speak') },
    },
    {
      id: id('listen'), kind: 'listen', title: 'Hear it once, give it back',
      brief: LISTEN_BRIEF[stage],
      attempts: rules.listen[0], pass: rules.listen[1], xp: 30,
      passage: listenText,
    },
  ];

  if (rules.write) {
    missions.push({
      id: id('write'), kind: 'write', title: 'Write it before you say it',
      brief: lesson.writePrompt
        ? `${lesson.writePrompt} Write ${WRITE_ASK[stage]} — then say it in the next mission.`
        : `Plan “${stretch.title}” on paper first: ${WRITE_ASK[stage]} of what you will actually say. Then say it in the next mission.`,
      attempts: rules.write.attempts, pass: rules.write.pass,
      goal: { key: 'words', min: rules.write.words, label: `at least ${rules.write.words} words` }, xp: 30,
      prompt: lesson.writePrompt ?? `Write what you will say for “${stretch.title}”. ${stretch.brief}`,
    });
  }

  if (stretch !== main) {
    missions.push({
      id: id('stretch'), kind: 'speak', title: `Level up: ${stretch.title}`,
      brief: `${stretch.brief}${rules.write ? ' Use what you wrote.' : ''} ${tries(rules.stretch[0])}.`,
      attempts: rules.stretch[0], pass: rules.stretch[1], goal: heard, xp: 50,
      drill: { ...stretch, id: id('stretch') },
    });
  }

  for (const p of lesson.soundLab ?? []) {
    const pattern = soundPattern(p);
    if (!pattern) continue;
    missions.push({
      id: id(`sound:${p}`), kind: 'sound', title: `Sound sort: ${pattern.spelling}`,
      brief: `${pattern.hook} Sort eight words by their sound — twice.${rules.sound[1] <= 60 ? ' Five right passes.' : ' Silver or better passes.'}`,
      attempts: rules.sound[0], pass: rules.sound[1], xp: 30,
      pattern: p,
    });
  }

  return missions;
}

/**
 * What each band performs at the showcases. Grades 1–3 perform without a
 * script; every other band writes first. The task is the band's real world:
 * a class talk, a debate opening, a competition or campaign speech, a pitch.
 */
const SHOWCASE_TASK: Record<Stage, { mid: string; long: string; midWords: number; longWords: number; midSeconds: number; longSeconds: number; midPass: number; longPass: number }> = {
  foundation: { mid: '', long: '', midWords: 0, longWords: 0, midSeconds: 45, longSeconds: 60, midPass: 60, longPass: 60 },
  primary: {
    mid: 'A one-minute talk: a hook, three reasons with signpost words, and a mic-drop ending.',
    long: 'Your big speech about something you care about: a hook, a story, three reasons and a strong ending.',
    midWords: 60, longWords: 90, midSeconds: 60, longSeconds: 90, midPass: 65, longPass: 65,
  },
  middle: {
    mid: 'A ninety-second class talk on something you care about: an opening that earns attention, three signposted points, an ending that lands.',
    long: 'A two-minute persuasive speech built around a true story about you: opening, the story, three reasons, the ask, the ending.',
    midWords: 110, longWords: 170, midSeconds: 90, longSeconds: 120, midPass: 70, longPass: 75,
  },
  senior: {
    mid: 'A ninety-second debate or competition opening: a thesis in one sentence, two distinct arguments and a decisive close.',
    long: 'A two-and-a-half-minute speech for a competition or school leadership campaign: a story, three arguments, the strongest objection answered, a close that lands.',
    midWords: 130, longWords: 220, midSeconds: 90, longSeconds: 150, midPass: 75, longPass: 80,
  },
  adult: {
    mid: 'A ninety-second pitch or project update: the answer first, three supporting points and a clear ask.',
    long: 'A three-minute talk you could give at work or in a seminar: a governing thought, a story with a turn, the strongest objection answered and a specific close.',
    midWords: 140, longWords: 260, midSeconds: 90, longSeconds: 180, midPass: 75, longPass: 80,
  },
};

/** The showcase at an assessment slot: one performance, one listen, and a script from Grades 4–6 up. */
export function showcaseMissions(showcase: Showcase, stage: Stage = 'senior'): Mission[] {
  const id = (slug: string) => `hw:${stage}:showcase:${showcase.slot}:${slug}`;
  const long = showcase.slot === 48;
  const junior = stage === 'foundation' || stage === 'primary';
  const task = SHOWCASE_TASK[stage];

  const write: Mission | null = stage === 'foundation' ? null : {
    id: id('write'), kind: 'write', title: 'Write the script',
    brief: long ? task.long : task.mid,
    attempts: 1, pass: long ? task.longPass : task.midPass,
    goal: (() => { const min = long ? task.longWords : task.midWords; return { key: 'words', min, label: `at least ${min} words` }; })(),
    xp: 80,
    prompt: long ? 'Write your Grand Stage speech.' : 'Write your Mid-Course Stage talk.',
  };

  const seconds = long ? task.longSeconds : task.midSeconds;
  const perform: Mission = {
    id: id('speak'), kind: 'speak', title: long ? 'The Grand Stage performance' : 'The Mid-Course performance',
    brief: junior
      ? `Your showcase! Stand tall, look at the camera, and give your ${seconds}-second talk. Three tries — your best one counts.`
      : `${long ? task.long : task.mid} Standing, to camera, from key words only. Three tries — your best one counts.`,
    attempts: 3,
    pass: long ? task.longPass : task.midPass,
    goal: { key: 'fillersPerMin', max: junior ? 6 : 4, label: `no more than ${junior ? 6 : 4} filler words a minute` },
    xp: 200,
    drill: { id: id('speak'), title: showcase.name, brief: showcase.brief, targetSeconds: seconds },
  };

  const listen: Mission = {
    id: id('listen'), kind: 'listen', title: 'Listen like a judge',
    brief: 'Hear a famous line and give it back word for word. A judge who cannot repeat what was said cannot judge it.',
    attempts: 2, pass: junior ? 65 : 75, xp: 60,
    passage: junior
      ? long ? 'One child, one teacher, one book and one pen can change the world.' : 'Believe you can, and you are halfway there.'
      : long
        ? 'Education is the most powerful weapon which can change the world. One child, one teacher, one book, one pen can change the world.'
        : 'We choose to go to the Moon in this decade, not because it is easy, but because it is hard.',
  };

  return write ? [write, perform, listen] : [perform, listen];
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
