/**
 * SARIRO — practice: seeded randomness
 * ============================================================================
 * Every generated question comes from a seed. The same seed always makes the
 * same question — which is what lets a practice room hand out endless
 * questions and still say, later, exactly which one a child answered, and what
 * its right answer was. Nothing about a question needs storing but its seed.
 *
 * mulberry32: small, fast, and good enough for choosing numbers for a sum.
 */

export interface Rng {
  /** [0, 1). */
  next(): number;
  /** An integer in [min, max], both ends included. */
  int(min: number, max: number): number;
  /** One element. */
  pick<T>(items: readonly T[]): T;
  /** A new, shuffled copy. */
  shuffle<T>(items: readonly T[]): T[];
  /** true with probability p. */
  chance(p: number): boolean;
  /** A non-zero integer in [min, max]. */
  nonZero(min: number, max: number): number;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return lo + Math.floor(next() * (hi - lo + 1));
  };
  return {
    next,
    int,
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    chance: (p) => next() < p,
    nonZero: (min, max) => {
      for (let i = 0; i < 50; i++) {
        const n = int(min, max);
        if (n !== 0) return n;
      }
      return max === 0 ? min || 1 : max;
    },
  };
}

/** A 32-bit seed from any string — a topic plus a counter, say. */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A fresh seed for a new question. Not cryptographic; it only has to differ. */
export function freshSeed(): number {
  return (Math.floor(Math.random() * 4294967296) ^ Date.now()) >>> 0;
}
