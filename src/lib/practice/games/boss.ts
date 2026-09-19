import type { TopicAttempt } from '../mastery';
import type { Difficulty } from '../types';

/**
 * SARIRO — Boss Battles: the rules (pure)
 * ============================================================================
 * Every module of a grade's syllabus has a boss. Its questions are that
 * module's questions; every right answer is a hit, and a fast one hits harder;
 * a wrong answer or a slow one lets the boss hit back. Three hits and you are
 * out. Knock its health to zero and the module is beaten — then it comes back
 * angrier (★★, harder questions), and angrier again (★★★).
 *
 * A module's stars are read back from the learner's own attempts: a win is
 * logged as `maths:game:boss:g7:m3:t2` with a score of 100, so nothing new has
 * to be stored for a trophy shelf.
 */

export const BOSS_HP = 100;
export const BOSS_HEARTS = 3;
export const MAX_TIER = 3;

const CREATURES = [
  { emoji: '🐉', name: 'Dragon', colour: '#DC2626' },
  { emoji: '🦑', name: 'Kraken', colour: '#7C3AED' },
  { emoji: '🤖', name: 'Mega-Bot', colour: '#0EA5E9' },
  { emoji: '👹', name: 'Ogre', colour: '#EA580C' },
  { emoji: '🦖', name: 'T-Rex', colour: '#16A34A' },
  { emoji: '👾', name: 'Glitch', colour: '#DB2777' },
  { emoji: '🧙', name: 'Warlock', colour: '#4F46E5' },
  { emoji: '🦂', name: 'Scorpion King', colour: '#CA8A04' },
  { emoji: '🐙', name: 'Octo-Brain', colour: '#9333EA' },
  { emoji: '🗿', name: 'Stone Giant', colour: '#475569' },
] as const;

export interface Boss {
  emoji: string;
  name: string;
  colour: string;
}

/** The boss that guards a module. Modules of a grade never share one. */
export function bossFor(moduleNum: number): Boss {
  return CREATURES[(moduleNum - 1 + CREATURES.length) % CREATURES.length];
}

export const bossTopic = (grade: number, moduleNum: number, tier: number) => `maths:game:boss:g${grade}:m${moduleNum}:t${tier}`;

export const tierDifficulty = (tier: number): Difficulty => (Math.max(1, Math.min(3, tier)) as Difficulty);

/** Seconds for each question: less as the tier rises, and less again once the boss is angry (below half health). */
export function timeLimit(tier: number, enraged: boolean): number {
  return Math.max(15, 45 - (tier - 1) * 8 - (enraged ? 8 : 0));
}

/** Damage for a right answer: 10 slow to 20 instant, up to +50% on a streak. */
export function damageFor(secondsLeft: number, limit: number, combo: number): number {
  const speed = Math.max(0, Math.min(1, secondsLeft / limit));
  return Math.round((10 + 10 * speed) * (1 + Math.min(4, combo) * 0.125));
}

export interface Battle {
  hp: number;
  hearts: number;
  combo: number;
  right: number;
  wrong: number;
  over: boolean;
  won: boolean;
}

export const newBattle = (): Battle => ({ hp: BOSS_HP, hearts: BOSS_HEARTS, combo: 0, right: 0, wrong: 0, over: false, won: false });

export const enraged = (b: Battle) => b.hp <= BOSS_HP / 2;

/** One answer: right hits the boss, wrong (or out of time) lets the boss hit you. */
export function strike(b: Battle, correct: boolean, secondsLeft: number, limit: number): { battle: Battle; damage: number } {
  if (b.over) return { battle: b, damage: 0 };
  if (correct) {
    const damage = damageFor(secondsLeft, limit, b.combo);
    const hp = Math.max(0, b.hp - damage);
    return { battle: { ...b, hp, combo: b.combo + 1, right: b.right + 1, over: hp === 0, won: hp === 0 }, damage };
  }
  const hearts = b.hearts - 1;
  return { battle: { ...b, hearts, combo: 0, wrong: b.wrong + 1, over: hearts <= 0, won: false }, damage: 0 };
}

/** Score logged for a battle: 100 for a win, otherwise how much health was taken off (0–99). */
export const battleScore = (b: Battle) => (b.won ? 100 : Math.min(99, BOSS_HP - b.hp));

/** Stars per module (0–3) for a grade, from the learner's attempts. */
export function starsFrom(attempts: readonly TopicAttempt[], grade: number): Map<number, number> {
  const stars = new Map<number, number>();
  const re = new RegExp(`^maths:game:boss:g${grade}:m(\\d+):t(\\d)$`);
  for (const a of attempts) {
    const m = re.exec(a.topic);
    if (!m || a.score < 100) continue;
    const mod = Number(m[1]);
    stars.set(mod, Math.max(stars.get(mod) ?? 0, Number(m[2])));
  }
  return stars;
}

/** The tier to fight next: one above the best beaten, up to the top. */
export const nextTier = (stars: number) => Math.min(MAX_TIER, stars + 1);
