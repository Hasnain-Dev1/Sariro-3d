import { makeRng } from '../rng';
import { gcd } from '../fraction';

/**
 * SARIRO — Balance Scale: the rules (pure)
 * ============================================================================
 * An equation IS a balanced scale, and solving one is keeping it balanced while
 * you take things off. Two ways to play, by grade:
 *
 *   weigh   (Grades 2–5) a mystery box sits on the left pan. Put weights on the
 *           right until the scale levels, then say what one box weighs. The
 *           scale tips live, so "too heavy" and "too light" are felt, not told.
 *           Later: the box shares its pan with weights (subtract), or there are
 *           two boxes (divide).
 *   solve   (Grades 5–9) both pans hold boxes and weights: 3x + 7 = x + 19.
 *           Every move is done to BOTH pans — take weights off, take boxes off,
 *           or split each pan into equal groups and keep one — until one box
 *           stands alone. Fewest moves earns a perfect.
 *
 * A pan is `x` mystery boxes and `n` in plain weights. Everything is pure and
 * seeded, so every puzzle is testable and always solvable.
 */

export interface Pan {
  x: number;
  n: number;
}

export type BalanceMode = 'weigh' | 'solve';

export interface Puzzle {
  mode: BalanceMode;
  seed: number;
  /** What one box weighs. */
  value: number;
  left: Pan;
  right: Pan;
  /** solve: the fewest moves that solve it. */
  par: number;
  /** Seconds before the time runs out. */
  patience: number;
}

export const WEIGHTS = [1, 2, 5, 10] as const;
/** weigh: most weights the right pan holds. */
export const MAX_WEIGHTS = 14;

export const weightOf = (p: Pan, value: number) => p.x * value + p.n;

/**
 * How far the beam tips, in degrees: positive when the RIGHT pan is heavier
 * (right side down). Any difference shows (at least 4°); big ones cap at 18°.
 */
export function tilt(left: number, right: number): number {
  const d = right - left;
  if (d === 0) return 0;
  const deg = Math.min(18, Math.max(4, Math.abs(d) * 1.5));
  return d > 0 ? deg : -deg;
}

/** "3x + 7", "x", "12", "0". */
export function panText(p: Pan): string {
  const parts: string[] = [];
  if (p.x) parts.push(p.x === 1 ? 'x' : `${p.x}x`);
  if (p.n || !p.x) parts.push(String(p.n));
  return parts.join(' + ');
}

export const equationText = (left: Pan, right: Pan) => `${panText(left)} = ${panText(right)}`;

/* ── solve: moves on both pans ─────────────────────────────────────────── */

export type Move =
  | { op: 'take'; n: number }
  | { op: 'takeX'; k: number }
  | { op: 'split'; k: number };

export type MoveResult = { ok: true; left: Pan; right: Pan } | { ok: false; reason: string };

export function moveText(m: Move): string {
  if (m.op === 'take') return `Take ${m.n} off both pans`;
  if (m.op === 'takeX') return `Take ${m.k === 1 ? 'a box' : `${m.k} boxes`} off both pans`;
  return `Split both pans into ${m.k} equal groups`;
}

export function applyMove(left: Pan, right: Pan, m: Move): MoveResult {
  if (m.op === 'take') {
    const n = Math.round(m.n);
    if (!(n > 0)) return { ok: false, reason: 'Take at least 1.' };
    if (n > left.n || n > right.n) {
      const short = left.n < right.n ? `the left pan has only ${left.n}` : `the right pan has only ${right.n}`;
      return { ok: false, reason: `You can't take ${n} off both — ${short}.` };
    }
    return { ok: true, left: { ...left, n: left.n - n }, right: { ...right, n: right.n - n } };
  }
  if (m.op === 'takeX') {
    const k = Math.round(m.k);
    if (!(k > 0)) return { ok: false, reason: 'Take at least one box.' };
    if (k > left.x || k > right.x) {
      const fewer = Math.min(left.x, right.x);
      return { ok: false, reason: fewer === 0 ? 'One pan has no boxes to take.' : `One pan has only ${fewer} box${fewer === 1 ? '' : 'es'}.` };
    }
    return { ok: true, left: { ...left, x: left.x - k }, right: { ...right, x: right.x - k } };
  }
  const k = Math.round(m.k);
  if (k < 2) return { ok: false, reason: 'Split into at least 2 groups.' };
  const bad = [left.x, left.n, right.x, right.n].some((v) => v % k !== 0);
  if (bad) return { ok: false, reason: `Those can't be split into ${k} equal groups — every box count and weight must divide by ${k}.` };
  return { ok: true, left: { x: left.x / k, n: left.n / k }, right: { x: right.x / k, n: right.n / k } };
}

/** One box alone on a pan, only weights on the other — the answer is on the scale. */
export function isSolved(left: Pan, right: Pan): boolean {
  return (left.x === 1 && left.n === 0 && right.x === 0) || (right.x === 1 && right.n === 0 && left.x === 0);
}

/** The fewest moves: clear the boxes off the lighter-boxed pan, clear the weights off the other, split what is left. */
export function parFor(left: Pan, right: Pan): number {
  const [big, small] = left.x >= right.x ? [left, right] : [right, left];
  return (small.x > 0 ? 1 : 0) + (big.n > 0 ? 1 : 0) + (big.x - small.x > 1 ? 1 : 0);
}

/** The splits that would work right now (2–9). */
export function splitsAvailable(left: Pan, right: Pan): number[] {
  const g = [left.x, left.n, right.x, right.n].reduce((a, b) => gcd(a, b), 0);
  return Array.from({ length: 8 }, (_, i) => i + 2).filter((k) => g % k === 0);
}

/* ── weigh: weights on the right pan ───────────────────────────────────── */

export const sumWeights = (w: readonly number[]) => w.reduce((s, v) => s + v, 0);

/* ── Puzzles ───────────────────────────────────────────────────────────── */

export function modeFor(grade: number, level: number): BalanceMode {
  if (grade <= 4) return 'weigh';
  if (grade === 5) return level <= 2 ? 'weigh' : 'solve';
  return 'solve';
}

/**
 * solve forms, easiest first:
 *   1  x + b = d        2  ax = d        3  ax + b = d        4  ax + b = cx + d
 */
export function solveForm(grade: number, level: number): 1 | 2 | 3 | 4 {
  const start = grade >= 8 ? 3 : grade >= 7 ? 2 : 1;
  // Grade 5 only reaches solve at level 3, so it starts a step back.
  const step = Math.floor((level - 1) / 2) - (grade === 5 ? 1 : 0);
  return Math.max(1, Math.min(4, start + step)) as 1 | 2 | 3 | 4;
}

export function makePuzzle(seed: number, grade: number, level: number): Puzzle {
  const r = makeRng(seed);
  const mode = modeFor(grade, level);
  const patience = Math.max(25, 60 - level * 4);

  if (mode === 'weigh') {
    // Level 1: one box. Level 2: box + weights. Level 3: two boxes. Level 4+: two or three boxes + weights.
    const stage = Math.min(4, grade === 5 ? level + 1 : level);
    const cap = Math.min(30, 8 + grade * 4);
    const boxes = stage >= 4 ? r.int(2, 3) : stage === 3 ? 2 : 1;
    const extra = stage === 2 || stage >= 4 ? r.int(1, Math.min(9, 2 + grade)) : 0;
    const value = r.int(stage === 1 ? 3 : 2, Math.max(4, Math.floor((cap - extra) / boxes)));
    return { mode, seed, value, left: { x: boxes, n: extra }, right: { x: 0, n: 0 }, par: 0, patience: patience + 10 };
  }

  const form = solveForm(grade, level);
  const big = grade >= 7;
  const value = r.int(big ? 2 : 1, big ? 15 : 10);
  let left: Pan;
  let right: Pan;
  if (form === 1) {
    const b = r.int(1, big ? 20 : 12);
    left = { x: 1, n: b };
    right = { x: 0, n: value + b };
  } else if (form === 2) {
    const a = r.int(2, big ? 6 : 4);
    left = { x: a, n: 0 };
    right = { x: 0, n: a * value };
  } else if (form === 3) {
    const a = r.int(2, big ? 6 : 4);
    const b = r.int(1, big ? 20 : 12);
    left = { x: a, n: b };
    right = { x: 0, n: a * value + b };
  } else {
    const c = r.int(1, 3);
    const a = c + r.int(1, big ? 4 : 3);
    const b = r.int(1, 15);
    left = { x: a, n: b };
    right = { x: c, n: (a - c) * value + b };
  }
  // Half the time the boxes start on the right: the scale reads the same either way.
  if (r.chance(0.5)) [left, right] = [right, left];
  return { mode, seed, value, left, right, par: parFor(left, right), patience };
}

/** weigh: how the box's weight follows from what balanced it. */
export function weighExplain(p: Puzzle): string {
  const total = weightOf(p.left, p.value);
  const { x: boxes, n: extra } = p.left;
  if (boxes === 1 && !extra) return `The box balances ${total}, so it weighs ${p.value}.`;
  if (boxes === 1) return `${total} balances the box and ${extra}, so the box is ${total} − ${extra} = ${p.value}.`;
  if (!extra) return `${total} balances ${boxes} boxes, so one box is ${total} ÷ ${boxes} = ${p.value}.`;
  return `Take the ${extra} away from both sides: ${total - extra} balances ${boxes} boxes, so one box is ${total - extra} ÷ ${boxes} = ${p.value}.`;
}
