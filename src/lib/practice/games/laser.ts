import { makeRng, type Rng } from '../rng';
import { gcd } from '../fraction';

/**
 * SARIRO — Angle Laser: the rules (pure)
 * ============================================================================
 * A laser on a turntable in the middle of a protractor. The child turns it —
 * drag it round, or nudge it — and fires. Angle sense is a thing you get by
 * turning something, not by reading about it.
 *
 *   kind      (3–5)  "fire at an OBTUSE angle" — any obtuse angle hits
 *   turn      (3–7)  "turn to 130°" — read the protractor; no number readout
 *   measure   (4–7)  the laser is locked: what angle is it at? Both scales
 *                    are drawn, like a real protractor, so reading the wrong
 *                    one is a mistake you can make — and learn from
 *   estimate  (5–10) "about 70°" with no scale at all; closer scores more
 *   missing   (5–10) make the missing angle: on a line, round a point,
 *                    complementary, in a triangle
 *   bearing   (8–12) compass ring, north up, clockwise: "fire on 135°";
 *                    from 9, back bearings
 *   radian    (11–12) "turn to 2π/3"
 *
 * Angles are whole degrees, measured anticlockwise from the arm pointing right
 * (a bearing is clockwise from north; toBearing/fromBearing convert).
 */

export type ShotKind = 'kind' | 'turn' | 'measure' | 'estimate' | 'missing' | 'bearing' | 'radian';
export type Scale = 'half' | 'full' | 'compass' | 'none';
export type AngleName = 'acute' | 'right' | 'obtuse' | 'straight' | 'reflex';

export interface Shot {
  kind: ShotKind;
  seed: number;
  text: string;
  /** The angle that hits, in the scale's own terms (a bearing for 'bearing'). */
  target: number;
  /** How far off still hits, in degrees. */
  tolerance: number;
  /** kind: the kind of angle asked for, and the angles accepted (inclusive) instead of target ± tolerance. */
  angleName?: AngleName;
  range?: [number, number];
  scale: Scale;
  /** Show the laser's angle as a number while turning. */
  readout: boolean;
  /** Where the laser starts (degrees anticlockwise from the right). */
  start: number;
  /** measure: the laser cannot turn; pick the reading. */
  options?: string[];
  correctOption?: string;
  /** missing: angles already drawn, for the picture. */
  given?: number[];
  patience: number;
}

export const norm = (a: number) => ((Math.round(a) % 360) + 360) % 360;

/** The smaller gap between two directions, 0–180. */
export function gap(a: number, b: number): number {
  const d = Math.abs(norm(a) - norm(b));
  return Math.min(d, 360 - d);
}

/** Standard angle (anticlockwise from east) ⇄ bearing (clockwise from north). */
export const toBearing = (std: number) => norm(90 - std);
export const fromBearing = (bearing: number) => norm(90 - bearing);
export const bearingText = (b: number) => `${String(norm(b)).padStart(3, '0')}°`;

/** 120 → "2π/3", 180 → "π", 90 → "π/2". */
export function radianText(deg: number): string {
  const g = gcd(deg, 180);
  const p = deg / g;
  const q = 180 / g;
  const top = p === 1 ? 'π' : `${p}π`;
  return q === 1 ? top : `${top}/${q}`;
}

/** Degrees anticlockwise from the right, for a pointer at (dx, dy) from the centre (screen y grows down). */
export function angleFromPointer(dx: number, dy: number): number {
  return norm((Math.atan2(-dy, dx) * 180) / Math.PI);
}

/** Keep a laser on a half protractor between 0 and 180. */
export function clampToScale(std: number, scale: Scale): number {
  const a = norm(std);
  if (scale !== 'half') return a;
  if (a <= 180) return a;
  return a > 270 ? 0 : 180;
}

/** Each kind of angle, in whole degrees. */
export const NAMES: Record<AngleName, [number, number]> = {
  acute: [1, 89],
  right: [90, 90],
  obtuse: [91, 179],
  straight: [180, 180],
  reflex: [181, 359],
};

/** What a 'kind' shot accepts: a right or straight angle a degree either side, as a hand on a dial would. */
export const ACCEPT: Record<AngleName, [number, number]> = { ...NAMES, right: [89, 91], straight: [179, 181] };

const article = (name: string) => (/^[aeiou]/.test(name) ? 'an' : 'a');

export function nameOf(a: number): AngleName | null {
  const n = norm(a);
  for (const [name, [lo, hi]] of Object.entries(NAMES) as [AngleName, [number, number]][]) if (n >= lo && n <= hi) return name;
  return null;
}

/** A starting direction well away from the target (40°–120°), on the scale. */
function startAway(r: Rng, target: number, scale: Scale): number {
  for (let i = 0; i < 20; i++) {
    const s = clampToScale(norm(target + r.pick([-1, 1]) * r.int(40, 120)), scale);
    if (gap(s, target) >= 30) return s;
  }
  const a = clampToScale(norm(target + 90), scale);
  const b = clampToScale(norm(target - 90), scale);
  return gap(a, target) >= gap(b, target) ? a : b;
}

export function kindsFor(grade: number, level: number): ShotKind[] {
  if (grade <= 3) return level >= 2 ? ['kind', 'turn'] : ['kind'];
  if (grade === 4) return ['kind', 'turn', 'measure'];
  if (grade <= 6) return ['turn', 'measure', 'estimate', 'missing', ...(grade === 5 ? (['kind'] as const) : [])];
  if (grade === 7) return ['turn', 'measure', 'estimate', 'missing'];
  if (grade <= 10) return ['estimate', 'missing', 'bearing'];
  return ['radian', 'bearing', 'estimate'];
}

export function makeShot(seed: number, grade: number, level: number): Shot {
  const r = makeRng(seed);
  const kind = r.pick(kindsFor(grade, level));
  const patience = Math.max(15, 30 - level * 2);
  const full = grade >= 6 && level >= 2;

  if (kind === 'kind') {
    const names: AngleName[] = grade >= 5 ? ['acute', 'right', 'obtuse', 'straight', 'reflex'] : ['acute', 'right', 'obtuse', 'straight'];
    const want = r.pick(names);
    const scale: Scale = want === 'reflex' ? 'full' : 'half';
    const range = ACCEPT[want];
    // Start the laser at an angle of a different kind.
    const start = r.pick([10, 45, 120, 160].filter((a) => nameOf(a) !== want));
    return {
      kind, seed, patience, scale, readout: false, start, angleName: want, range, target: Math.round((range[0] + range[1]) / 2), tolerance: 0,
      text: `Make ${article(want)} ${want.toUpperCase()} angle, then fire!`,
    };
  }

  if (kind === 'turn') {
    const scale: Scale = full ? 'full' : 'half';
    const step = grade <= 4 ? 10 : 5;
    const target = r.int(1, (scale === 'full' ? 350 : 170) / step) * step;
    return {
      kind, seed, patience, scale, readout: false, start: startAway(r, target, scale), target, tolerance: 2,
      text: `Turn the laser to ${target}° — read the protractor.`,
    };
  }

  if (kind === 'measure') {
    const step = grade <= 4 ? 10 : 5;
    // Never 90°: both scales read the same there, so there is no trap to learn from.
    const target = r.pick(Array.from({ length: 180 / step - 1 }, (_, i) => (i + 1) * step).filter((a) => a !== 90));
    const correct = `${target}°`;
    const wrong = [180 - target, target + 10, target - 10].filter((w) => w > 0 && w < 180 && w !== target).map((w) => `${w}°`);
    return {
      kind, seed, patience, scale: 'half', readout: false, start: target, target, tolerance: 0,
      text: 'The laser is stuck! What angle is it at? (Careful — a protractor has two scales.)',
      options: r.shuffle([correct, ...[...new Set(wrong)].slice(0, 3)]),
      correctOption: correct,
    };
  }

  if (kind === 'estimate') {
    const scale: Scale = 'none';
    const target = r.int(2, full ? 34 : 17) * 10 + r.pick([0, 5]);
    return {
      kind, seed, patience, scale, readout: false, start: startAway(r, target, scale), target, tolerance: grade >= 8 ? 8 : 10,
      text: `No protractor! Fire at about ${target}°.`,
    };
  }

  if (kind === 'missing') {
    const forms = grade >= 7 ? ['line', 'point', 'complement', 'triangle'] as const : ['line', 'point'] as const;
    const form = r.pick(forms);
    let target = 0;
    let text = '';
    let given: number[] = [];
    if (form === 'line') {
      const a = r.int(2, 16) * 10 + r.pick([0, 5]);
      target = 180 - a;
      given = [a];
      text = `Angles on a straight line add up to 180°. One is ${a}°. Make the other one with the laser.`;
    } else if (form === 'point') {
      const a = r.int(6, 15) * 10;
      const b = r.int(6, Math.min(15, (360 - a - 40) / 10)) * 10;
      target = 360 - a - b;
      given = [a, b];
      text = `Angles round a point add up to 360°. Two are ${a}° and ${b}°. Make the third.`;
    } else if (form === 'complement') {
      const a = r.int(1, 8) * 10 + r.pick([0, 5]);
      target = 90 - a;
      given = [a];
      text = `Complementary angles add up to 90°. Make the complement of ${a}°.`;
    } else {
      const a = r.int(3, 9) * 10;
      const b = r.int(3, Math.min(9, (180 - a - 20) / 10)) * 10;
      target = 180 - a - b;
      given = [a, b];
      text = `A triangle has angles of ${a}° and ${b}°. Make its third angle.`;
    }
    const scale: Scale = target > 180 ? 'full' : 'half';
    return { kind, seed, patience: patience + 10, scale, readout: true, start: startAway(r, target, scale), target, tolerance: 1, text, given };
  }

  if (kind === 'bearing') {
    const back = grade >= 9 && r.chance(0.4);
    const b = r.int(1, 35) * 10 + (grade >= 9 ? r.pick([0, 5]) : 0);
    const target = back ? norm(b + 180) : b;
    return {
      kind, seed, patience: patience + (back ? 10 : 0), scale: 'compass', readout: false, start: fromBearing(norm(target + 130)), target, tolerance: 3,
      text: back
        ? `A boat sailed out on a bearing of ${bearingText(b)}. Fire on the bearing that points back home.`
        : `Fire on a bearing of ${bearingText(target)}. (Bearings start at North and go clockwise.)`,
    };
  }

  // radian
  const target = r.pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]);
  return {
    kind, seed, patience, scale: 'full', readout: false, start: norm(target + 150), target, tolerance: 3,
    text: `Turn the laser to ${radianText(target)} radians.`,
  };
}

export interface ShotVerdict { ok: boolean; off: number; bullseye: boolean; message: string }

/** Where the laser points (degrees anticlockwise from the right) against what the shot wanted. */
export function checkShot(shot: Shot, aimStd: number): ShotVerdict {
  const aim = norm(aimStd);
  if (shot.kind === 'kind') {
    const [lo, hi] = shot.range!;
    const ok = aim >= lo && aim <= hi;
    const got = nameOf(aim);
    const want = shot.angleName!;
    return {
      ok, off: ok ? 0 : Math.min(gap(aim, lo), gap(aim, hi)), bullseye: false,
      message: ok ? `${aim}° — ${article(want)} ${want} angle!` : `${aim}° is ${got ? `${article(got)} ${got} angle` : 'no angle at all'} — you needed ${article(want)} ${want} one.`,
    };
  }
  const measured = shot.kind === 'bearing' ? toBearing(aim) : aim;
  const off = gap(measured, shot.target);
  const ok = off <= shot.tolerance;
  const show = (a: number) => (shot.kind === 'bearing' ? bearingText(a) : `${a}°`);
  const wanted = shot.kind === 'radian' ? `${radianText(shot.target)} (${shot.target}°)` : show(shot.target);
  if (ok) return { ok, off, bullseye: off <= 1, message: off === 0 ? `Bullseye — exactly ${wanted}!` : `Hit! ${show(measured)} — ${off}° off ${wanted}.` };
  return { ok, off, bullseye: false, message: `Missed — you fired at ${show(measured)}; the target was ${wanted}.` };
}
