import { makeRng, type Rng } from '../rng';

/**
 * SARIRO — Treasure Map: the rules (pure)
 * ============================================================================
 * A pirate map with a grid on it. The parrot squawks a clue; the child taps the
 * spot to dig. Right spot, treasure. Wrong spot, an empty hole — and the hole
 * is labelled with where they actually dug, which is how a child finds out they
 * put the numbers the wrong way round.
 *
 *   steps      (Grades 2–4) "From the tent, 3 squares right and 2 up" — no numbers
 *   plot       "Dig at (3, −2)" — first quadrant, then all four
 *   read       an ✖ is on the map: which coordinates is it at?
 *   translate  (7+) "from the palm, 4 left and 3 up"
 *   reflect    (8+) the mirror image of the skull in an axis (or y = x from 9)
 *   midpoint   (9+) halfway between two statues
 *   line       (9+) on a line at a given x; (10+) where two lines cross
 */

export type ClueKind = 'steps' | 'plot' | 'read' | 'translate' | 'reflect' | 'midpoint' | 'line';

export interface Point { x: number; y: number }

export interface Landmark extends Point {
  emoji: string;
  label: string;
}

export interface Clue {
  kind: ClueKind;
  seed: number;
  text: string;
  target: Point;
  /** Inclusive, the same on both axes. */
  min: number;
  max: number;
  /** false: a plain grid with no numbers (steps). */
  axes: boolean;
  /** Things drawn on the map that the clue talks about. */
  landmarks: Landmark[];
  /** Scenery: never on the target, never mentioned. */
  decor: Landmark[];
  /** read: choices, one of which is `pt(target)`. */
  options?: string[];
  /** read: an ✖ is drawn on the target. */
  showMark?: boolean;
  /** steps / translate: the walk from the landmark, drawn once the dig is over. */
  legs?: Point[];
  /** line: y = mx + c, drawn once the dig is over. */
  lines?: { m: number; c: number }[];
  patience: number;
}

const MINUS = '−';
const num = (n: number) => (n < 0 ? `${MINUS}${-n}` : String(n));
export const pt = (p: Point) => `(${num(p.x)}, ${num(p.y)})`;
export const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

/** "y = 2x − 1", "y = −x + 5", "y = 3", "y = x". */
export function lineText(m: number, c: number): string {
  const mx = m === 0 ? '' : m === 1 ? 'x' : m === -1 ? `${MINUS}x` : `${num(m)}x`;
  if (!mx) return `y = ${num(c)}`;
  if (c === 0) return `y = ${mx}`;
  return `y = ${mx} ${c < 0 ? MINUS : '+'} ${Math.abs(c)}`;
}

export function kindsFor(grade: number, level: number): ClueKind[] {
  if (grade <= 3) return ['steps'];
  if (grade === 4) return level >= 3 ? ['steps', 'plot'] : ['steps'];
  const kinds: ClueKind[] = ['plot', 'read'];
  if (grade >= 7 && level >= 2) kinds.push('translate');
  if (grade >= 8 && level >= 2) kinds.push('reflect');
  if (grade >= 9) kinds.push('midpoint', 'line');
  return kinds;
}

/** All four quadrants, or the first only. */
export const fourQuadrants = (grade: number, level: number) => grade >= 8 || (grade >= 6 && level >= 2);

const SCENERY = [
  { emoji: '🌴', label: 'palm tree' },
  { emoji: '🪨', label: 'rock' },
  { emoji: '🌋', label: 'volcano' },
  { emoji: '🦜', label: 'parrot' },
  { emoji: '🐚', label: 'shell' },
  { emoji: '🦀', label: 'crab' },
];

function spot(r: Rng, min: number, max: number, avoid: Point[] = [], margin = 0): Point {
  for (let i = 0; i < 200; i++) {
    const p = { x: r.int(min + margin, max - margin), y: r.int(min + margin, max - margin) };
    if (!avoid.some((a) => same(a, p))) return p;
  }
  return { x: min + margin, y: min + margin };
}

function decorFor(r: Rng, min: number, max: number, avoid: Point[]): Landmark[] {
  const out: Landmark[] = [];
  for (const s of r.shuffle(SCENERY).slice(0, 3)) {
    const p = spot(r, min, max, [...avoid, ...out]);
    out.push({ ...s, ...p });
  }
  return out;
}

const DIRS = {
  right: { x: 1, y: 0, compass: 'east' },
  left: { x: -1, y: 0, compass: 'west' },
  up: { x: 0, y: 1, compass: 'north' },
  down: { x: 0, y: -1, compass: 'south' },
} as const;
type Dir = keyof typeof DIRS;

function legsText(legs: { dir: Dir; n: number }[], compass: boolean): string {
  const words = legs.map((l) => `${l.n} square${l.n === 1 ? '' : 's'} ${compass ? DIRS[l.dir].compass : l.dir}`);
  return words.length === 1 ? words[0] : `${words.slice(0, -1).join(', ')}, then ${words[words.length - 1]}`;
}

export function makeClue(seed: number, grade: number, level: number): Clue {
  const r = makeRng(seed);
  const kind = r.pick(kindsFor(grade, level));
  const four = fourQuadrants(grade, level) && kind !== 'steps';
  const [min, max] = kind === 'steps' ? [0, 8] : four ? [-6, 6] : [0, 8];
  const patience = Math.max(15, 30 - level * 2) + (kind === 'line' || kind === 'midpoint' || kind === 'reflect' ? 10 : 0);
  const base = { seed, min, max, axes: kind !== 'steps', patience };

  if (kind === 'steps') {
    const legCount = Math.min(3, 1 + Math.floor(level / 2) + (grade >= 4 ? 1 : 0));
    const compass = grade >= 3 && level >= 2 && r.chance(0.5);
    for (let tries = 0; ; tries++) {
      const start = spot(r, min, max);
      const legs: { dir: Dir; n: number }[] = [];
      let at = { ...start };
      let ok = true;
      for (let i = 0; i < legCount; i++) {
        const options = (Object.keys(DIRS) as Dir[]).filter((d) => !legs.length || (DIRS[d].x !== 0) !== (DIRS[legs[legs.length - 1].dir].x !== 0));
        const dir = r.pick(options);
        const n = r.int(1, 5);
        const next = { x: at.x + DIRS[dir].x * n, y: at.y + DIRS[dir].y * n };
        if (next.x < min || next.x > max || next.y < min || next.y > max) { ok = false; break; }
        legs.push({ dir, n });
        at = next;
      }
      if ((!ok || same(at, start)) && tries < 100) continue;
      if (!ok) { legs.length = 0; legs.push({ dir: start.x < max ? 'right' : 'left', n: 1 }); at = { x: start.x + (start.x < max ? 1 : -1), y: start.y }; }
      const tent: Landmark = { emoji: '⛺', label: 'tent', ...start };
      return {
        ...base, kind, target: at, landmarks: [tent], decor: decorFor(r, min, max, [start, at]),
        legs: legs.map((l) => ({ x: DIRS[l.dir].x * l.n, y: DIRS[l.dir].y * l.n })),
        text: `Start at the ⛺ tent. Walk ${legsText(legs, compass)}. Dig there!`,
      };
    }
  }

  if (kind === 'plot' || kind === 'read') {
    const target = spot(r, min, max);
    if (kind === 'plot') {
      return { ...base, kind, target, landmarks: [], decor: decorFor(r, min, max, [target]), text: `Dig at ${pt(target)}.` };
    }
    const wrong: Point[] = [{ x: target.y, y: target.x }, { x: target.x + 1, y: target.y }, { x: target.x, y: target.y - 1 }];
    if (four) wrong.unshift({ x: -target.x, y: target.y }, { x: target.x, y: -target.y });
    const correct = pt(target);
    const distinct = [...new Set(wrong.map(pt).filter((w) => w !== correct))].slice(0, 3);
    return {
      ...base, kind, target, landmarks: [], decor: decorFor(r, min, max, [target]), showMark: true,
      text: 'The treasure is under the ✖. What are its coordinates?',
      options: r.shuffle([correct, ...distinct]),
    };
  }

  if (kind === 'translate') {
    for (;;) {
      const from = spot(r, min, max, [], 1);
      const dx = r.nonZero(-5, 5);
      const dy = r.nonZero(-5, 5);
      const target = { x: from.x + dx, y: from.y + dy };
      if (target.x < min || target.x > max || target.y < min || target.y > max) continue;
      const legs: { dir: Dir; n: number }[] = [{ dir: dx > 0 ? 'right' : 'left', n: Math.abs(dx) }, { dir: dy > 0 ? 'up' : 'down', n: Math.abs(dy) }];
      return {
        ...base, kind, target, landmarks: [{ emoji: '🌴', label: 'palm tree', ...from }], decor: [], legs: [{ x: dx, y: 0 }, { x: 0, y: dy }],
        text: `The palm 🌴 is at ${pt(from)}. The treasure is ${legsText(legs, false)} from it.`,
      };
    }
  }

  if (kind === 'reflect') {
    const mirrors = grade >= 9 ? (['x', 'y', 'y=x'] as const) : (['x', 'y'] as const);
    const mirror = r.pick(mirrors);
    for (;;) {
      const from = spot(r, min, max);
      const target = mirror === 'x' ? { x: from.x, y: -from.y } : mirror === 'y' ? { x: -from.x, y: from.y } : { x: from.y, y: from.x };
      if (same(from, target)) continue;
      const name = mirror === 'x' ? 'the x-axis' : mirror === 'y' ? 'the y-axis' : 'the line y = x';
      return {
        ...base, kind, target, landmarks: [{ emoji: '💀', label: 'skull', ...from }], decor: [],
        text: `The treasure is the mirror image of the 💀 skull ${pt(from)} in ${name}.`,
      };
    }
  }

  if (kind === 'midpoint') {
    for (;;) {
      const target = spot(r, min, max, [], 1);
      const hx = r.int(-3, 3);
      const hy = r.int(-3, 3);
      if (!hx && !hy) continue;
      const a = { x: target.x - hx, y: target.y - hy };
      const b = { x: target.x + hx, y: target.y + hy };
      if ([a, b].some((p) => p.x < min || p.x > max || p.y < min || p.y > max)) continue;
      return {
        ...base, kind, target, landmarks: [{ emoji: '🗿', label: 'statue', ...a }, { emoji: '🗿', label: 'statue', ...b }], decor: [],
        text: `The treasure is exactly halfway between the statues 🗿 at ${pt(a)} and ${pt(b)}.`,
      };
    }
  }

  // line: on y = mx + c at a given x — or, from Grade 10, where two lines cross.
  const cross = grade >= 10 && level >= 2 && r.chance(0.5);
  for (;;) {
    const target = spot(r, min, max, [], 1);
    const m1 = r.pick([-2, -1, 1, 2, 3]);
    const c1 = target.y - m1 * target.x;
    if (Math.abs(c1) > 9) continue;
    if (!cross) {
      return { ...base, kind, target, landmarks: [], decor: decorFor(r, min, max, [target]), lines: [{ m: m1, c: c1 }], text: `The treasure is on the line ${lineText(m1, c1)}, where x = ${num(target.x)}.` };
    }
    const m2 = r.pick([-2, -1, 0, 1, 2].filter((m) => m !== m1));
    const c2 = target.y - m2 * target.x;
    if (Math.abs(c2) > 9) continue;
    return { ...base, kind, target, landmarks: [], decor: decorFor(r, min, max, [target]), lines: [{ m: m1, c: c1 }, { m: m2, c: c2 }], text: `The treasure is where the lines ${lineText(m1, c1)} and ${lineText(m2, c2)} cross.` };
  }
}

export interface DigVerdict { ok: boolean; message: string }

export function checkDig(clue: Clue, p: Point): DigVerdict {
  const t = clue.target;
  if (same(p, t)) return { ok: true, message: `Treasure at ${pt(t)}!` };
  if (clue.kind === 'steps') return { ok: false, message: 'Only sand here — count the squares again from the ⛺.' };
  if (p.x === t.y && p.y === t.x) {
    return { ok: false, message: `You dug at ${pt(p)} — swapped! The first number goes ACROSS, the second goes UP.` };
  }
  if ((p.x === -t.x && p.y === t.y) || (p.x === t.x && p.y === -t.y) || (p.x === -t.x && p.y === -t.y)) {
    return { ok: false, message: `You dug at ${pt(p)} — check the signs. The treasure was at ${pt(t)}.` };
  }
  return { ok: false, message: `Only sand at ${pt(p)}. The treasure was at ${pt(t)}.` };
}
