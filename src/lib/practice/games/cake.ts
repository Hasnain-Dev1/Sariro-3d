import { makeRng } from '../rng';
import { gcd } from '../fraction';

/**
 * SARIRO — Cake Shop: the rules (pure)
 * ============================================================================
 * The founder, 18 Sep 2026: "a game-like practice room where I get addicted
 * and don't feel the time pass — imagine cutting a cake for subtraction".
 *
 * The child does not type an answer; they DO it. A customer asks for 3/8 of a
 * cake: the child cuts the cake into eighths and serves three slices. Half, in
 * quarters? Cut four, serve two — the same amount, which is the whole point of
 * equivalent fractions. Twelve cupcakes, five sold? Tap five away, and count.
 *
 *   serve     cut the cake and serve the fraction asked for (any equal
 *             cutting that makes it counts — 2/4 serves "a half")
 *   leftover  the cake is already cut; eat what the customer eats, then say
 *             what is left
 *   takeaway  a tray of cupcakes: sell some, then say how many are left
 *   recut     part of the cake is already gone; the customer wants a piece
 *             measured in smaller slices — cut every slice again, then serve
 *
 * Everything here is pure and seeded, so orders are testable and a level
 * always plays fair.
 */

export type OrderKind = 'serve' | 'leftover' | 'takeaway' | 'recut';

export interface Order {
  kind: OrderKind;
  seed: number;
  /** The customer's words. */
  text: string;
  /** serve / recut: the fraction to serve, of the WHOLE cake. */
  num?: number;
  den?: number;
  /** serve with a required slice count ("…cut into twelfths"). */
  mustCut?: number;
  /** leftover / recut: how the cake arrives. */
  startSlices?: number;
  startEaten?: number;
  /** leftover: slices the customer eats. takeaway: cupcakes sold. */
  take?: number;
  /** takeaway: cupcakes on the tray. */
  tray?: number;
  /** leftover / takeaway: the answer choices, and the right one. */
  options?: string[];
  correctOption?: string;
  /** Seconds before the customer gives up. */
  patience: number;
}

export interface CakeState {
  slices: number;
  eaten: boolean[];
  served: boolean[];
}

export const MAX_SLICES = 12;

export function freshCake(slices = 1, eatenCount = 0): CakeState {
  return {
    slices,
    eaten: Array.from({ length: slices }, (_, i) => i < eatenCount),
    served: Array.from({ length: slices }, () => false),
  };
}

/** Cut an uncut-or-whole cake into `n` equal slices. Only allowed while nothing is eaten or served. */
export function cutInto(state: CakeState, n: number): CakeState {
  const k = Math.max(1, Math.min(MAX_SLICES, Math.round(n)));
  if (state.eaten.some(Boolean) || state.served.some(Boolean)) return state;
  return freshCake(k);
}

/** Cut every slice into `k` smaller ones — the eaten stay eaten, the served stay served. */
export function recutEach(state: CakeState, k: number): CakeState {
  if (k < 2 || state.slices * k > MAX_SLICES) return state;
  const spread = (a: boolean[]) => a.flatMap((v) => Array.from({ length: k }, () => v));
  return { slices: state.slices * k, eaten: spread(state.eaten), served: spread(state.served) };
}

export function toggleServe(state: CakeState, i: number): CakeState {
  if (state.eaten[i]) return state;
  const served = [...state.served];
  served[i] = !served[i];
  return { ...state, served };
}

export function eatSlice(state: CakeState, i: number): CakeState {
  if (state.eaten[i]) return state;
  const eaten = [...state.eaten];
  eaten[i] = true;
  const served = [...state.served];
  served[i] = false;
  return { ...state, eaten, served };
}

export const servedCount = (s: CakeState) => s.served.filter(Boolean).length;
export const leftCount = (s: CakeState) => s.eaten.filter((e) => !e).length;

export function fracText(num: number, den: number): string {
  if (num === 0) return '0';
  if (num === den) return '1 whole cake';
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

export interface Verdict {
  ok: boolean;
  message: string;
}

/** Whether a serve / recut order was served right. Any equal cutting that makes the amount counts. */
export function checkServe(order: Order, s: CakeState): Verdict {
  const want = { n: order.num!, d: order.den! };
  if (order.mustCut && s.slices !== order.mustCut) {
    return { ok: false, message: `They asked for it in ${order.mustCut} slices — you cut ${s.slices}.` };
  }
  const got = servedCount(s);
  if (got === 0) return { ok: false, message: 'Tap the slices you want to serve first.' };
  if (got * want.d === want.n * s.slices) {
    const same = s.slices !== want.d;
    return { ok: true, message: same ? `${got}/${s.slices} — the same amount as ${want.n}/${want.d}!` : `Exactly ${want.n}/${want.d}!` };
  }
  return { ok: false, message: `You served ${fracText(got, s.slices)} — they wanted ${want.n}/${want.d}.` };
}

/* ── Orders ─────────────────────────────────────────────────────────────── */

/** Which kinds a grade and level can see. */
export function kindsFor(grade: number, level: number): OrderKind[] {
  const kinds: OrderKind[] = [];
  if (grade <= 3) kinds.push('takeaway');
  kinds.push('serve');
  if (grade >= 3 || level >= 3) kinds.push('leftover');
  if (grade >= 5 && level >= 2) kinds.push('recut');
  return kinds;
}

const NAMES = ['Asha', 'Kabir', 'Mia', 'Dev', 'Zara', 'Leo', 'Ria', 'Omar', 'Tara', 'Sam', 'Ivy', 'Arjun'];

function distinctOptions(correct: string, wrong: string[], shuffle: <T>(a: readonly T[]) => T[]): string[] {
  const set = [...new Set([correct, ...wrong.filter((w) => w !== correct)])].slice(0, 3);
  return shuffle(set);
}

export function makeOrder(seed: number, grade: number, level: number): Order {
  const r = makeRng(seed);
  const kind = r.pick(kindsFor(grade, level));
  const who = r.pick(NAMES);
  const patience = Math.max(12, 32 - level * 3);

  if (kind === 'takeaway') {
    const tray = r.int(Math.min(4 + level * 2, 10), Math.min(8 + level * 3, 20));
    const take = r.int(1, tray - 1);
    const left = tray - take;
    const wrong = [left + 1, left - 1, left + 2, take].filter((n) => n >= 0).map(String);
    return {
      kind, seed, patience,
      text: `${who} buys ${take} cupcake${take === 1 ? '' : 's'}. Sell them — then how many are left?`,
      tray, take,
      options: distinctOptions(String(left), wrong, r.shuffle),
      correctOption: String(left),
    };
  }

  if (kind === 'serve') {
    const dens = level <= 1 ? [2, 3, 4] : level === 2 ? [2, 3, 4, 5, 6, 8] : [3, 4, 5, 6, 8, 10, 12];
    const den = r.pick(grade <= 2 ? [2, 4] : dens);
    const num = r.int(1, den - 1);
    const g = gcd(num, den);
    const [n, d] = [num / g, den / g];
    // From level 3, sometimes the customer wants it in smaller slices: equivalent fractions.
    const multiples = [2, 3, 4].map((k) => d * k).filter((m) => m <= MAX_SLICES);
    const mustCut = level >= 3 && grade >= 4 && multiples.length && r.chance(0.5) ? r.pick(multiples) : undefined;
    return {
      kind, seed, patience, num: n, den: d, mustCut,
      text: mustCut
        ? `${who}: “${n}/${d} of the cake, please — but cut it into ${mustCut} slices!”`
        : `${who}: “I'd like ${n}/${d} of the cake, please!”`,
    };
  }

  if (kind === 'leftover') {
    const slices = r.pick(level <= 2 ? [4, 6, 8] : [6, 8, 10, 12]);
    const startEaten = level >= 3 ? r.int(0, Math.floor(slices / 3)) : 0;
    const take = r.int(1, slices - startEaten - 1);
    const left = slices - startEaten - take;
    const correct = fracText(left, slices);
    const wrong = [fracText(take, slices), fracText(Math.max(1, left - 1), slices), fracText(Math.min(slices - 1, left + 1), slices), `${left}/${take}`];
    return {
      kind, seed, patience: patience + 6, startSlices: slices, startEaten, take,
      text: startEaten
        ? `${startEaten} slice${startEaten === 1 ? ' is' : 's are'} already gone. ${who} eats ${take} more. Eat them — how much of the whole cake is left?`
        : `${who} eats ${take} of the ${slices} slices. Eat them — how much of the cake is left?`,
      options: distinctOptions(correct, wrong, r.shuffle),
      correctOption: correct,
    };
  }

  // recut: the cake arrives in b slices with some eaten; the customer wants c/d of the whole, d a multiple of b.
  const b = r.pick([2, 3, 4]);
  const k = r.pick([2, 3].filter((x) => b * x <= MAX_SLICES));
  const d = b * k;
  const eatenBig = r.int(0, b - 2);
  const leftSmall = (b - eatenBig) * k;
  const c = r.int(1, Math.max(1, leftSmall - 1));
  return {
    kind, seed, patience: patience + 10, num: c, den: d, mustCut: d, startSlices: b, startEaten: eatenBig,
    text: `${who}: “${c}/${d} of the whole cake, please.” The slices are too big — cut every slice smaller first!`,
  };
}

/** Coins for a served order: faster and on a longer combo earns more. */
export function coinsFor(secondsLeft: number, patience: number, combo: number): number {
  const speed = Math.max(0, Math.min(1, secondsLeft / patience));
  return Math.round((10 + 10 * speed) * Math.min(5, 1 + combo * 0.5));
}

/** Level from orders served this round: a new level every five. */
export const levelFor = (served: number) => 1 + Math.floor(served / 5);
