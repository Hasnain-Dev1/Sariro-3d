import { TIER_XP, type Challenge } from './types';

/**
 * SARIRO — Code Lab: XP, levels and the streak (pure)
 * ============================================================================
 * Nothing new is stored for any of this. A solved challenge is logged to
 * practice_attempts (topic = the challenge id, score = 100 minus 25 per hint,
 * never below 40), and everything here is worked out from those rows:
 *
 *   XP      each solved challenge's tier XP × its best score — solving it again
 *           without hints earns the difference, never double
 *   level   level n starts at 25·n·(n−1) XP: 0, 50, 150, 300, 500…
 *   streak  days in a row with at least one solve, up to today (or yesterday,
 *           so the streak survives until the day is over)
 */

export interface LabAttempt {
  topic: string;
  score: number;
  createdAt: string;
}

export const scoreFor = (hints: number) => Math.max(40, 100 - 25 * hints);

export const levelStart = (level: number) => 25 * level * (level - 1);

export function levelOf(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  while (xp >= levelStart(level + 1)) level += 1;
  return { level, into: xp - levelStart(level), span: levelStart(level + 1) - levelStart(level) };
}

/** A local calendar day, "2026-09-19". */
function day(at: Date): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, '0');
  const d = String(at.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function streakOf(solveDates: readonly Date[], now = new Date()): number {
  const days = new Set(solveDates.map(day));
  const cursor = new Date(now);
  if (!days.has(day(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(day(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export interface LabProgress {
  /** Best score (40–100) per solved challenge id. */
  best: Map<string, number>;
  xp: number;
  level: number;
  into: number;
  span: number;
  streak: number;
  solvedToday: number;
}

export function progressOf(attempts: readonly LabAttempt[], challenges: readonly Challenge[], now = new Date()): LabProgress {
  const known = new Map(challenges.map((c) => [c.id, c]));
  const best = new Map<string, number>();
  const dates: Date[] = [];
  const today = day(now);
  let solvedToday = 0;
  for (const a of attempts) {
    if (!known.has(a.topic) || !(a.score > 0)) continue;
    best.set(a.topic, Math.max(best.get(a.topic) ?? 0, a.score));
    const at = new Date(a.createdAt);
    if (!Number.isNaN(at.getTime())) {
      dates.push(at);
      if (day(at) === today) solvedToday += 1;
    }
  }
  let xp = 0;
  for (const [id, score] of best) xp += Math.round((TIER_XP[known.get(id)!.tier] * score) / 100);
  return { best, xp, ...levelOf(xp), streak: streakOf(dates, now), solvedToday };
}
