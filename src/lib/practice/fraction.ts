/**
 * SARIRO — practice: fractions, exactly
 * ============================================================================
 * "3/6", "1/2", "0.5" and "1 1/2 − 1" are the same answer to a child's sum,
 * and a checker that marks any of them wrong teaches the child that maths is
 * about pleasing a machine. So answers are read as exact rationals, and
 * compared as numbers — while "simplest form" can still be asked for.
 */

export interface Fraction {
  num: number;
  den: number;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function frac(num: number, den = 1): Fraction {
  if (den === 0) throw new Error('zero denominator');
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return { num: (sign * num) / g, den: (sign * den) / g };
}

export const add = (a: Fraction, b: Fraction) => frac(a.num * b.den + b.num * a.den, a.den * b.den);
export const sub = (a: Fraction, b: Fraction) => frac(a.num * b.den - b.num * a.den, a.den * b.den);
export const mul = (a: Fraction, b: Fraction) => frac(a.num * b.num, a.den * b.den);
export const div = (a: Fraction, b: Fraction) => frac(a.num * b.den, a.den * b.num);
export const equal = (a: Fraction, b: Fraction) => a.num * b.den === b.num * a.den;
export const toNumber = (f: Fraction) => f.num / f.den;

/** "3/4", "-3/4", "1 1/2", "2", "0.75" — or null. Decimals become exact fractions. */
export function parseFraction(raw: string): Fraction | null {
  const s = raw.trim().replace(/\s+/g, ' ').replace(/[−–]/g, '-');
  let m = /^(-)?(\d+) (\d+)\/(\d+)$/.exec(s);
  if (m) {
    const whole = Number(m[2]);
    const n = Number(m[3]);
    const d = Number(m[4]);
    if (!d) return null;
    const f = frac(whole * d + n, d);
    return m[1] ? frac(-f.num, f.den) : f;
  }
  m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(s);
  if (m) {
    const d = Number(m[2]);
    return d ? frac(Number(m[1]), d) : null;
  }
  m = /^(-?)(\d*)\.(\d+)$/.exec(s);
  if (m) {
    const digits = m[3];
    const den = 10 ** digits.length;
    const n = Number(m[2] || '0') * den + Number(digits);
    return frac(m[1] ? -n : n, den);
  }
  if (/^-?\d+$/.test(s)) return frac(Number(s), 1);
  return null;
}

/** "3/4", "-2", or "1 1/2" when mixed is asked for. */
export function formatFraction(f: Fraction, mixed = false): string {
  if (f.den === 1) return String(f.num);
  if (mixed && Math.abs(f.num) > f.den) {
    const sign = f.num < 0 ? '-' : '';
    const whole = Math.floor(Math.abs(f.num) / f.den);
    const rest = Math.abs(f.num) % f.den;
    return `${sign}${whole} ${rest}/${f.den}`;
  }
  return `${f.num}/${f.den}`;
}

/** Whether the text is already in lowest terms (for "give it in simplest form"). */
export function isSimplest(raw: string): boolean {
  const s = raw.trim().replace(/[−–]/g, '-');
  const m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(s);
  if (!m) return /^-?\d+$/.test(s) || /^(-)?\d+ \d+\/\d+$/.test(s);
  const n = Number(m[1]);
  const d = Number(m[2]);
  return d > 0 && gcd(n, d) === 1 && d !== 1;
}
