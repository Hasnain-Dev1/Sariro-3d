import type { Difficulty } from './types';

/**
 * SARIRO — practice: how well a learner knows each topic
 * ============================================================================
 * Derived from their attempts, never stored — the same rule as Voice Quest
 * (lib/speaking/quest/engine.ts): a number that is only ever computed from what
 * the child actually did cannot drift from it.
 *
 *   level 0  not tried
 *   level 1  learning     — tried, under 60%
 *   level 2  practising   — 60% or better recently
 *   level 3  strong       — 80%+ on the last three
 *   level 4  mastered     — 90%+ on the last three, over at least two days
 *
 * A topic is DUE when it has not been seen for longer than its level earns —
 * one day at level 1, up to two weeks at level 4 — so mastered topics come
 * back just often enough not to fade.
 */

export interface TopicAttempt {
  topic: string;
  score: number;
  createdAt: string;
}

export type Level = 0 | 1 | 2 | 3 | 4;

export const LEVEL_LABEL: Record<Level, string> = {
  0: 'Not started',
  1: 'Learning',
  2: 'Practising',
  3: 'Strong',
  4: 'Mastered',
};

const REVIEW_DAYS: Record<Level, number> = { 0: 0, 1: 1, 2: 2, 3: 5, 4: 14 };
const DAY = 86_400_000;

export interface TopicMastery {
  topic: string;
  level: Level;
  attempts: number;
  /** Average of the last three. */
  recent: number | null;
  lastAt: string | null;
  due: boolean;
}

export function masteryOf(topic: string, attempts: readonly TopicAttempt[], now = Date.now()): TopicMastery {
  const mine = attempts
    .filter((a) => a.topic === topic)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (mine.length === 0) return { topic, level: 0, attempts: 0, recent: null, lastAt: null, due: false };

  const last3 = mine.slice(-3);
  const recent = Math.round(last3.reduce((s, a) => s + a.score, 0) / last3.length);
  const days = new Set(last3.map((a) => a.createdAt.slice(0, 10))).size;
  let level: Level = recent >= 60 ? 2 : 1;
  if (last3.length >= 3 && recent >= 80) level = 3;
  if (last3.length >= 3 && recent >= 90 && days >= 2) level = 4;

  const lastAt = mine[mine.length - 1].createdAt;
  const due = now - Date.parse(lastAt) >= REVIEW_DAYS[level] * DAY;
  return { topic, level, attempts: mine.length, recent, lastAt, due };
}

/** Harder questions as a topic is learned. */
export function difficultyFor(level: Level): Difficulty {
  return level >= 3 ? 3 : level === 2 ? 2 : 1;
}

/**
 * What to practise next, best first: due topics you are still learning, then
 * due topics you know, then topics never tried (in syllabus order).
 */
export function suggestTopics(topics: readonly string[], attempts: readonly TopicAttempt[], now = Date.now(), limit = 3): TopicMastery[] {
  const all = topics.map((t) => masteryOf(t, attempts, now));
  const weight = (m: TopicMastery) =>
    m.level === 0 ? 3 : m.due ? (m.level <= 2 ? 0 : 1) : 4 + m.level;
  return all
    .map((m, i) => ({ m, i }))
    .sort((a, b) => weight(a.m) - weight(b.m) || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.m);
}
