import type { SpeakingLesson } from '@/lib/speaking/lesson';
import type { PracticeAttempt } from '@/lib/speaking/progress';
import { PROMPTS } from '@/lib/speaking/voice-check';
import { SOUND_PATTERNS } from '@/lib/speaking/sounds';
import { homeworkFor, levelStatus, missionStatus, showcaseMissions, type LevelStatus, type Mission, type MissionStatus } from './homework';
import { SHOWCASES, TWISTERS, WORLDS, type Showcase, type World } from './worlds';

/**
 * SARIRO — Voice Quest: everything a learner has earned, from what they did
 * ============================================================================
 * XP, rank, streak, badges, stars, cleared levels and the daily quest are all
 * DERIVED from practice_attempts. None of it is stored.
 *
 * That is deliberate. A points table can drift from reality — a bug awards
 * double, a refund of a mistake is forgotten, a child finds the button that
 * adds XP — and then the number means nothing. Here the only way to have XP is
 * to have practised, and the same rows tell the teacher and the parent what
 * that practice was. Changing a rule (a mission's pass mark, what a badge
 * needs) re-scores everybody's history honestly, instead of leaving old awards
 * standing under old rules.
 *
 * Pure, so every rule is tested (engine.test.ts).
 */

/* ── Days, in the learner's own time zone ─────────────────────────────────── */

/** `offsetMinutes` is Date#getTimezoneOffset(): IST is −330. */
export function dayKey(ms: number, offsetMinutes: number): string {
  return new Date(ms - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

const DAY = 86_400_000;
const dayNumber = (key: string) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY);

export interface Streak {
  current: number;
  best: number;
  /** Practised today already. */
  today: boolean;
}

export function streakOf(attempts: readonly PracticeAttempt[], now: number, offsetMinutes: number): Streak {
  const days = new Set(attempts.map((a) => dayKey(Date.parse(a.createdAt), offsetMinutes)).filter((k) => !k.startsWith('NaN')));
  const nums = [...days].map(dayNumber).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < nums.length; i++) {
    run = i > 0 && nums[i] === nums[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const todayNum = dayNumber(dayKey(now, offsetMinutes));
  const has = new Set(nums);
  const today = has.has(todayNum);
  // A streak is still alive until the end of today: counting starts yesterday if today is empty.
  let current = 0;
  for (let d = today ? todayNum : todayNum - 1; has.has(d); d--) current++;
  return { current, best, today };
}

/* ── Ranks ────────────────────────────────────────────────────────────────── */

export const RANKS = [
  { xp: 0, title: 'Whisperer', emoji: '🌱' },
  { xp: 300, title: 'Voice', emoji: '🎙️' },
  { xp: 800, title: 'Speaker', emoji: '🗣️' },
  { xp: 1600, title: 'Presenter', emoji: '📣' },
  { xp: 2800, title: 'Storyteller', emoji: '📖' },
  { xp: 4400, title: 'Persuader', emoji: '🏛️' },
  { xp: 6500, title: 'Orator', emoji: '🎤' },
  { xp: 9000, title: 'Keynote', emoji: '🌟' },
  { xp: 12000, title: 'Legend', emoji: '🏆' },
] as const;

export interface Rank {
  level: number;
  title: string;
  emoji: string;
  floor: number;
  /** XP of the next rank, or null at the top. */
  next: number | null;
  /** 0–1 through this rank. */
  progress: number;
}

export function rankFor(xp: number): Rank {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const floor = RANKS[i].xp;
  const next = i + 1 < RANKS.length ? RANKS[i + 1].xp : null;
  return { level: i + 1, title: RANKS[i].title, emoji: RANKS[i].emoji, floor, next, progress: next === null ? 1 : (xp - floor) / (next - floor) };
}

/* ── The daily quest ──────────────────────────────────────────────────────── */

/**
 * One short mission a day, the same for everybody on the same date, rotating
 * through speaking, sounds, listening, a twister and writing. It is what makes
 * opening the app on a day with no class worth doing — and it keeps the streak.
 */
export function dailyQuest(key: string): Mission {
  const n = dayNumber(key);
  const id = `dq:${key}`;
  switch (((n % 5) + 5) % 5) {
    case 0: {
      const prompt = PROMPTS[((n % PROMPTS.length) + PROMPTS.length) % PROMPTS.length];
      return {
        id, kind: 'speak', title: 'The Zero-Um Minute',
        brief: `Talk for sixty seconds: ${prompt.text} The challenge is not what you say — it is saying it with almost no “um”.`,
        attempts: 1, pass: 55, goal: { key: 'fillersPerMin', max: 2, label: 'no more than 2 filler words a minute' }, xp: 60,
        drill: { id, title: 'The Zero-Um Minute', brief: prompt.text, targetSeconds: 60 },
      };
    }
    case 1: {
      const p = SOUND_PATTERNS[((n % SOUND_PATTERNS.length) + SOUND_PATTERNS.length) % SOUND_PATTERNS.length];
      return { id, kind: 'sound', title: `Sound of the day: ${p.spelling}`, brief: `${p.hook} One round, gold wins it.`, attempts: 1, pass: 85, xp: 60, pattern: p.id };
    }
    case 2: {
      const p = SOUND_PATTERNS[((n * 7) % SOUND_PATTERNS.length + SOUND_PATTERNS.length) % SOUND_PATTERNS.length];
      const line = p.realWorld[((n % p.realWorld.length) + p.realWorld.length) % p.realWorld.length];
      return { id, kind: 'listen', title: 'Echo', brief: `${line.situation}: hear it once and give it back, word for word.`, attempts: 1, pass: 80, xp: 60, passage: line.line };
    }
    case 3: {
      const t = TWISTERS[((n % TWISTERS.length) + TWISTERS.length) % TWISTERS.length];
      return {
        id, kind: 'speak', title: 'Twister Speed Run',
        brief: `Say it three times in your head, then record it once, clean: “${t.text}” (${t.focus})`,
        attempts: 1, pass: 60, goal: { key: 'pronunciation', min: 80, label: '80% of words heard right' }, xp: 60,
        drill: { id, title: 'Twister Speed Run', brief: t.focus, passage: t.text, targetSeconds: 8 },
      };
    }
    default: {
      const prompt = PROMPTS[((n * 3) % PROMPTS.length + PROMPTS.length) % PROMPTS.length];
      return {
        id, kind: 'write', title: 'Opening Line Lab',
        brief: `Write the first 3 to 5 sentences of a talk on: ${prompt.text} Make the first sentence impossible to ignore.`,
        attempts: 1, pass: 70, goal: { key: 'words', min: 40, label: 'at least 40 words' }, xp: 60,
        prompt: `Write the opening of a talk on: ${prompt.text}`,
      };
    }
  }
}

/* ── Badges ───────────────────────────────────────────────────────────────── */

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  how: string;
  earned: boolean;
}

/* ── The whole state ──────────────────────────────────────────────────────── */

export interface WorldProgress {
  world: World;
  levels: { lesson: SpeakingLesson; status: LevelStatus }[];
  cleared: number;
  stars: number;
}

export interface ShowcaseProgress {
  showcase: Showcase;
  unlocked: boolean;
  /** Levels cleared toward unlocking. */
  toward: number;
  status: LevelStatus;
}

export interface QuestState {
  xp: number;
  rank: Rank;
  streak: Streak;
  worlds: WorldProgress[];
  showcases: ShowcaseProgress[];
  badges: Badge[];
  daily: MissionStatus;
  todayKey: string;
  attempts: number;
  levelsCleared: number;
  totalLevels: number;
  totalStars: number;
}

export const XP = {
  attempt: 2,
  /** Effort XP stops here each day, so a hundred junk tries earn nothing extra. */
  attemptDailyCap: 40,
  activeDay: 10,
  starBonus: 10,
  levelCleared: 100,
  showcaseCleared: 500,
  badge: 50,
} as const;

const SOUND_ID = /(?:^|:)sound:([a-z-]+)$/;

export function questState(
  attempts: readonly PracticeAttempt[],
  lessons: readonly SpeakingLesson[],
  opts: { now?: number; offsetMinutes?: number } = {}
): QuestState {
  const now = opts.now ?? Date.now();
  const offset = opts.offsetMinutes ?? 0;
  const todayKey = dayKey(now, offset);

  const worlds: WorldProgress[] = WORLDS.map((world) => {
    const levels = lessons
      .filter((l) => l.moduleNum === world.num)
      .sort((a, b) => a.number - b.number)
      .map((lesson) => ({ lesson, status: levelStatus(homeworkFor(lesson), attempts) }));
    return {
      world,
      levels,
      cleared: levels.filter((l) => l.status.cleared).length,
      stars: levels.reduce((n, l) => n + l.status.stars, 0),
    };
  });

  const showcases: ShowcaseProgress[] = SHOWCASES.map((showcase) => {
    const toward = worlds.filter((w) => showcase.worlds.includes(w.world.num)).reduce((n, w) => n + w.cleared, 0);
    return { showcase, toward, unlocked: toward >= showcase.unlockAfter, status: levelStatus(showcaseMissions(showcase), attempts) };
  });

  const daily = missionStatus(dailyQuest(todayKey), attempts);
  const streak = streakOf(attempts, now, offset);

  /* Badges. */
  const speaking = attempts.filter((a) => a.kind === 'speaking');
  const soundBest = new Map<string, number>();
  for (const a of attempts) {
    const m = a.drillId ? SOUND_ID.exec(a.drillId) : null;
    if (m) soundBest.set(m[1], Math.max(soundBest.get(m[1]) ?? 0, a.score));
  }
  const allMissions = [
    ...worlds.flatMap((w) => w.levels.flatMap((l) => l.status.missions)),
    ...showcases.flatMap((s) => s.status.missions),
  ];
  const passedKinds = new Set(allMissions.filter((m) => m.passed).map((m) => m.mission.kind));

  const badges: Badge[] = [
    { id: 'first-words', name: 'First Words', emoji: '🎤', how: 'Record your first attempt.', earned: speaking.length > 0 },
    { id: 'streak-3', name: 'On a Roll', emoji: '🔥', how: 'Practise three days in a row.', earned: streak.best >= 3 },
    { id: 'streak-7', name: 'Week Warrior', emoji: '⚡', how: 'Practise seven days in a row.', earned: streak.best >= 7 },
    { id: 'streak-30', name: 'Unstoppable', emoji: '🌟', how: 'Practise thirty days in a row.', earned: streak.best >= 30 },
    { id: 'um-free', name: 'Um-Free Zone', emoji: '🚫', how: 'Speak with at most one filler word a minute.', earned: speaking.some((a) => (a.metrics.wpm ?? 0) >= 60 && (a.metrics.fillersPerMin ?? 99) <= 1) },
    { id: 'cruise-control', name: 'Cruise Control', emoji: '🎯', how: 'Land a comfortable pace (120–165 words a minute) five times.', earned: speaking.filter((a) => (a.metrics.wpm ?? 0) >= 120 && (a.metrics.wpm ?? 0) <= 165).length >= 5 },
    { id: 'high-flyer', name: 'High Flyer', emoji: '🚀', how: 'Score 95 or more on anything.', earned: attempts.some((a) => a.score >= 95) },
    { id: 'sound-sleuth', name: 'Sound Sleuth', emoji: '🔍', how: 'Score 85+ in any sound sort.', earned: [...soundBest.values()].some((s) => s >= 85) },
    { id: 'sound-master', name: 'Sound Master', emoji: '👑', how: 'Score 85+ in every sound pattern.', earned: SOUND_PATTERNS.every((p) => (soundBest.get(p.id) ?? 0) >= 85) },
    { id: 'triple-threat', name: 'Triple Threat', emoji: '🎭', how: 'Pass a speaking, a listening and a writing mission.', earned: passedKinds.has('speak') && passedKinds.has('listen') && passedKinds.has('write') },
    { id: 'century', name: 'Century', emoji: '💯', how: 'Make a hundred attempts.', earned: attempts.length >= 100 },
    ...worlds.map((w) => ({ id: `world-${w.world.num}`, name: `${w.world.name} Cleared`, emoji: w.world.emoji, how: `Clear every level in ${w.world.name}.`, earned: w.levels.length > 0 && w.cleared === w.levels.length })),
    ...showcases.map((s) => ({ id: `showcase-${s.showcase.slot}`, name: s.showcase.slot === 24 ? 'Mid-Course Star' : 'Grand Stage Legend', emoji: s.showcase.emoji, how: `Clear ${s.showcase.name}.`, earned: s.status.cleared })),
  ];

  /* XP. */
  let xp = 0;
  const perDay = new Map<string, number>();
  for (const a of attempts) {
    const k = dayKey(Date.parse(a.createdAt), offset);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  for (const count of perDay.values()) xp += Math.min(XP.attemptDailyCap, count * XP.attempt) + XP.activeDay;
  for (const m of allMissions) if (m.passed) xp += m.mission.xp + m.stars * XP.starBonus;
  for (const w of worlds) xp += w.cleared * XP.levelCleared;
  for (const s of showcases) if (s.status.cleared) xp += XP.showcaseCleared;
  // Every daily quest ever passed, not only today's.
  const dailyIds = new Set(attempts.filter((a) => a.drillId?.startsWith('dq:')).map((a) => a.drillId as string));
  for (const did of dailyIds) {
    const status = missionStatus(dailyQuest(did.slice(3)), attempts);
    if (status.passed) xp += status.mission.xp;
  }
  xp += badges.filter((b) => b.earned).length * XP.badge;

  const totalLevels = worlds.reduce((n, w) => n + w.levels.length, 0);
  return {
    xp,
    rank: rankFor(xp),
    streak,
    worlds,
    showcases,
    badges,
    daily,
    todayKey,
    attempts: attempts.length,
    levelsCleared: worlds.reduce((n, w) => n + w.cleared, 0),
    totalLevels,
    totalStars: worlds.reduce((n, w) => n + w.stars, 0),
  };
}
