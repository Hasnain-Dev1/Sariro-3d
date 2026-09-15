import {
  DEFAULT_INPUTS, DEFAULT_LADDER, DEFAULT_MIX, PLAN_MONTHS, RATIOS,
  type EconomicsInputs, type Ladder, type LadderEntry, type PlanMix, type PriceBasis,
} from './economics';

/**
 * SARIRO — the price book
 * ============================================================================
 * What management saves from the calculator: the assumptions, the price
 * ladder for every plan, and the cohort being modelled. One JSON document in
 * the private `price_book` table (scripts/price-book.sql) — never in
 * app_settings, which anybody can read, because the floors and the cost of a
 * teacher are not a customer's business.
 *
 * Anything that arrives from a request goes through sanitizePriceBook() first:
 * every number is clamped, every missing field falls back to its default, and
 * nothing that is not part of the book survives.
 */

export interface PriceBook {
  version: 1;
  inputs: EconomicsInputs;
  ladder: Ladder;
  mix: PlanMix;
}

export const DEFAULT_PRICE_BOOK: PriceBook = {
  version: 1,
  inputs: DEFAULT_INPUTS,
  ladder: DEFAULT_LADDER,
  mix: DEFAULT_MIX,
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

const MONEY_MAX = 10_000_000;

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function optionalMoney(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return null;
  return Math.min(MONEY_MAX, Math.round(n * 100) / 100);
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function sanitizeInputs(raw: unknown): EconomicsInputs {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_INPUTS;
  const money = (k: keyof EconomicsInputs) => num(r[k], d[k] as number, 0, MONEY_MAX);
  const percent = (k: keyof EconomicsInputs, max = 100) => num(r[k], d[k] as number, 0, max);
  const count = (k: keyof EconomicsInputs, min: number, max: number) => Math.round(num(r[k], d[k] as number, min, max));
  const productivity = optionalMoney(r.productivityOverride);

  return {
    gstEnabled: bool(r.gstEnabled, d.gstEnabled),
    gstRate: percent('gstRate', 50),
    gatewayRate: percent('gatewayRate', 20),

    sellerSalary: money('sellerSalary'),
    sellerFood: money('sellerFood'),
    sellerTravel: money('sellerTravel'),
    sellers: count('sellers', 0, 10_000),
    studentsAcquired: count('studentsAcquired', 0, 1_000_000),
    cacSource: r.cacSource === 'target' ? 'target' : 'team',
    targetStudents: count('targetStudents', 0, 1_000_000),
    productivityOverride: productivity === null ? null : Math.min(10_000, productivity),

    groupTeacherRate: money('groupTeacherRate'),
    groupClassesPerMonth: count('groupClassesPerMonth', 1, 31),
    batchOccupancy: count('batchOccupancy', 1, 4),
    oneTeacherRate: money('oneTeacherRate'),
    oneClassesPerMonth: count('oneClassesPerMonth', 1, 31),

    techReserve: money('techReserve'),
    opsCost: money('opsCost'),
    catchupReserve: money('catchupReserve'),
    catchupUtilisation: percent('catchupUtilisation'),
    doubtReserve: money('doubtReserve'),
    doubtUtilisation: percent('doubtUtilisation'),
    overhead: money('overhead'),
    conservative: bool(r.conservative, d.conservative),

    minContributionPerMonth: money('minContributionPerMonth'),
    firstMonthContribution: money('firstMonthContribution'),
    renewalMonthContribution: money('renewalMonthContribution'),

    bufferMode: r.bufferMode === 'percent' ? 'percent' : 'fixed',
    bufferValue: num(r.bufferValue, d.bufferValue, 0, r.bufferMode === 'percent' ? 500 : MONEY_MAX),

    greenAtPercent: percent('greenAtPercent', 1_000),
    yellowAtPercent: percent('yellowAtPercent', 1_000),
  };
}

function sanitizeEntry(raw: unknown, fallback: LadderEntry): LadderEntry {
  if (!isObj(raw)) return fallback;
  return {
    publicPrice: 'publicPrice' in raw ? optionalMoney(raw.publicPrice) : fallback.publicPrice,
    offer1: optionalMoney(raw.offer1),
    offer2: optionalMoney(raw.offer2),
    manualFloor: optionalMoney(raw.manualFloor),
  };
}

export function sanitizeLadder(raw: unknown): Ladder {
  const r = isObj(raw) ? raw : {};
  const out = {} as Ladder;
  for (const ratio of RATIOS) {
    const rows = isObj(r[ratio]) ? (r[ratio] as Obj) : {};
    out[ratio] = {} as Ladder[typeof ratio];
    for (const m of PLAN_MONTHS) out[ratio][m] = sanitizeEntry(rows[String(m)], DEFAULT_LADDER[ratio][m]);
  }
  return out;
}

const BASES: PriceBasis[] = ['public', 'offer1', 'offer2', 'floor'];

export function sanitizeMix(raw: unknown): PlanMix {
  const r = isObj(raw) ? raw : {};
  const p = isObj(r.percents) ? r.percents : {};
  const percents = {} as PlanMix['percents'];
  for (const m of PLAN_MONTHS) percents[m] = num(p[String(m)], DEFAULT_MIX.percents[m], 0, 100);
  return {
    cohort: Math.round(num(r.cohort, DEFAULT_MIX.cohort, 0, 1_000_000)),
    ratio: r.ratio === '1:1' ? '1:1' : '1:4',
    basis: BASES.includes(r.basis as PriceBasis) ? (r.basis as PriceBasis) : 'public',
    percents,
  };
}

export function sanitizePriceBook(raw: unknown): PriceBook {
  const r = isObj(raw) ? raw : {};
  return {
    version: 1,
    inputs: sanitizeInputs(r.inputs),
    ladder: sanitizeLadder(r.ladder),
    mix: sanitizeMix(r.mix),
  };
}
