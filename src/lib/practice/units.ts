/**
 * SARIRO — practice: quantities with units
 * ============================================================================
 * In physics "12" is not an answer; "12 m/s" is, and so is "43.2 km/h". A
 * checker that wants one exact unit string punishes a child for converting
 * correctly. So a quantity is read into SI — a value and the powers of the base
 * units it carries — and two quantities are equal when both match.
 *
 * Base dimensions: metre, kilogram, second, ampere, kelvin, mole.
 */

export type Dims = [m: number, kg: number, s: number, A: number, K: number, mol: number];

interface UnitDef {
  factor: number;
  dims: Dims;
}

const D = (m = 0, kg = 0, s = 0, A = 0, K = 0, mol = 0): Dims => [m, kg, s, A, K, mol];

const BASE: Record<string, UnitDef> = {
  m: { factor: 1, dims: D(1) },
  g: { factor: 1e-3, dims: D(0, 1) },
  s: { factor: 1, dims: D(0, 0, 1) },
  A: { factor: 1, dims: D(0, 0, 0, 1) },
  K: { factor: 1, dims: D(0, 0, 0, 0, 1) },
  mol: { factor: 1, dims: D(0, 0, 0, 0, 0, 1) },
  // Derived
  N: { factor: 1, dims: D(1, 1, -2) },
  J: { factor: 1, dims: D(2, 1, -2) },
  W: { factor: 1, dims: D(2, 1, -3) },
  Pa: { factor: 1, dims: D(-1, 1, -2) },
  C: { factor: 1, dims: D(0, 0, 1, 1) },
  V: { factor: 1, dims: D(2, 1, -3, -1) },
  ohm: { factor: 1, dims: D(2, 1, -3, -2) },
  Hz: { factor: 1, dims: D(0, 0, -1) },
  L: { factor: 1e-3, dims: D(3) },
  // Not SI, but what children write
  min: { factor: 60, dims: D(0, 0, 1) },
  h: { factor: 3600, dims: D(0, 0, 1) },
  hr: { factor: 3600, dims: D(0, 0, 1) },
  t: { factor: 1000, dims: D(0, 1) },
  eV: { factor: 1.602176634e-19, dims: D(2, 1, -2) },
  cal: { factor: 4.184, dims: D(2, 1, -2) },
};

const PREFIX: Record<string, number> = {
  G: 1e9, M: 1e6, k: 1e3, h: 1e2, c: 1e-2, m: 1e-3, u: 1e-6, µ: 1e-6, n: 1e-9,
};

/** One unit symbol, with or without a prefix: "km", "ms", "kW", "mL", "µA". */
function lookupSymbol(sym: string): UnitDef | null {
  const s = sym === 'Ω' ? 'ohm' : sym.replace(/Ω$/, 'ohm');
  if (BASE[s]) return BASE[s];
  for (let cut = 1; cut <= 2; cut++) {
    const pre = s.slice(0, cut);
    const rest = s.slice(cut);
    if (PREFIX[pre] && BASE[rest] && rest !== 'min' && rest !== 'h' && rest !== 'hr') {
      return { factor: PREFIX[pre] * BASE[rest].factor, dims: BASE[rest].dims };
    }
  }
  return null;
}

const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁻': '-' };

export interface Unit {
  factor: number;
  dims: Dims;
}

/** "m/s^2", "m s^-2", "km/h", "kg·m/s²", "N m", "J/(kg K)" → a unit, or null. */
export function parseUnit(raw: string): Unit | null {
  let s = raw.trim();
  if (!s) return { factor: 1, dims: D() };
  s = s.replace(/[⁰¹²³⁴⁻]+/g, (m) => '^' + [...m].map((c) => SUP[c]).join(''));
  s = s.replace(/[·*]/g, ' ').replace(/[()]/g, ' ');
  const parts = s.split('/');
  let factor = 1;
  const dims: Dims = D();
  for (let pi = 0; pi < parts.length; pi++) {
    const sign = pi === 0 ? 1 : -1;
    const tokens = parts[pi].trim().split(/\s+/).filter(Boolean);
    if (pi > 0 && tokens.length === 0) return null;
    for (const tok of tokens) {
      const m = /^([A-Za-zµΩ]+)(?:\^?(-?\d+))?$/.exec(tok);
      if (!m) return null;
      const def = lookupSymbol(m[1]);
      if (!def) return null;
      const power = sign * (m[2] ? Number(m[2]) : 1);
      factor *= def.factor ** power;
      for (let i = 0; i < 6; i++) dims[i] += def.dims[i] * power;
    }
  }
  return { factor, dims };
}

export interface Quantity {
  /** In SI base units. */
  value: number;
  dims: Dims;
  /** Whether a unit was written at all. */
  hadUnit: boolean;
}

/** "12 m/s", "4.2e3 J", "-9.8m/s^2", "3,000 N" → SI; null when unreadable. */
export function parseQuantity(raw: string): Quantity | null {
  const s = raw.trim().replace(/[−–]/g, '-').replace(/,(?=\d{3}\b)/g, '').replace(/\s*[x×]\s*10\^?(-?\d+)/i, 'e$1');
  const m = /^(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)\s*(.*)$/i.exec(s);
  if (!m) return null;
  const num = Number(m[1]);
  if (!Number.isFinite(num)) return null;
  const unit = parseUnit(m[2]);
  if (!unit) return null;
  return { value: num * unit.factor, dims: unit.dims, hadUnit: m[2].trim().length > 0 };
}

export const sameDims = (a: Dims, b: Dims) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

/** SI value of `value` given in `unit`, e.g. toSI(72, 'km/h') = 20. */
export function toSI(value: number, unit: string): number {
  const u = parseUnit(unit);
  if (!u) throw new Error(`Unknown unit ${unit}`);
  return value * u.factor;
}

export function dimsOf(unit: string): Dims {
  const u = parseUnit(unit);
  if (!u) throw new Error(`Unknown unit ${unit}`);
  return u.dims;
}
