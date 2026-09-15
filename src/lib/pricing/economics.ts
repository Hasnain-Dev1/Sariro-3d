/**
 * SARIRO — what a seat actually earns
 * ============================================================================
 * The founder's rule, 15 Sep 2026: never price a plan as "selling price minus
 * the teacher". A ₹64,999 three-year plan is not ₹64,999 to spend. Out of it
 * come the GST inside the price, the gateway's cut of the whole upfront
 * payment, what it cost to find the family, and the cost of teaching the child
 * for every one of the 36 months already paid for. Only what is left after all
 * of that is the plan's contribution.
 *
 * Everything here is in rupees, for the Indian sales team. (The public website
 * keeps its one worldwide price in dollars — lib/school/pricing.ts.)
 *
 * ── The one formula ─────────────────────────────────────────────────────────
 * Every customer price INCLUDES GST, so the money Sariro keeps from a price P is
 *
 *     P ÷ (1 + GST)  −  P × gateway rate
 *
 * and the lowest price that still covers a plan is where that equals the plan's
 * whole cost:
 *
 *     minimum = required cost ÷ ( 1 ÷ (1 + GST) − gateway rate )
 *
 *     required cost = CAC                           once, never on renewal
 *                   + N × (teacher + tech + catch-up + doubt + overhead)
 *                   + (N − 1) × operations          month 1 is the sale itself
 *                   + the contribution the plan must leave
 *
 * ── The monthly plan is different ───────────────────────────────────────────
 * On a one-month plan the whole CAC lands in month 1 and is earned back over
 * the renewals. Demanding a full month's profit on top of CAC would push the
 * monthly fee absurdly high, so month 1 has its own (small) target and the
 * renewal month has its own (larger) one, and the monthly minimum is whichever
 * of the two is higher.
 *
 * Pure: no I/O, no React. Tested beside this file.
 */

export type Ratio = '1:4' | '1:1';
export const RATIOS: readonly Ratio[] = ['1:4', '1:1'];

export const PLAN_MONTHS = [1, 3, 6, 12, 36] as const;
export type PlanMonths = (typeof PLAN_MONTHS)[number];

export const PLAN_LABEL: Record<PlanMonths, string> = {
  1: '1 month',
  3: '3 months',
  6: '6 months',
  12: '1 year',
  36: '3 years',
};

export function isPlanMonths(n: unknown): n is PlanMonths {
  return PLAN_MONTHS.includes(n as PlanMonths);
}

export type CacSource = 'team' | 'target';
export type BufferMode = 'fixed' | 'percent';
export type Status = 'green' | 'yellow' | 'red';

/** Every assumption, as management types it. Percentages are 0–100. */
export interface EconomicsInputs {
  /* Tax — off for payments from outside India, where no GST applies. */
  gstEnabled: boolean;
  gstRate: number;
  /* Gateway, on the whole payment. */
  gatewayRate: number;

  /* Sales */
  sellerSalary: number;
  sellerFood: number;
  sellerTravel: number;
  sellers: number;
  /** New students the current team brings in a month. */
  studentsAcquired: number;
  /** Price from today's team, or from the team a growth target needs. */
  cacSource: CacSource;
  targetStudents: number;
  /** Students per seller per month. Blank = today's team (acquired ÷ sellers). */
  productivityOverride: number | null;

  /* Teachers */
  groupTeacherRate: number;
  groupClassesPerMonth: number;
  /** Children actually in a 1:4 batch. 4 is full; fewer stress-tests a half-empty one. */
  batchOccupancy: number;
  oneTeacherRate: number;
  oneClassesPerMonth: number;

  /* Reserves, per student per month */
  techReserve: number;
  /** From month 2 only. */
  opsCost: number;
  catchupReserve: number;
  catchupUtilisation: number;
  doubtReserve: number;
  doubtUtilisation: number;
  overhead: number;
  /** Every obligation used in full, no assumed savings. The default. */
  conservative: boolean;

  /* Targets */
  minContributionPerMonth: number;
  firstMonthContribution: number;
  renewalMonthContribution: number;

  /* The seller floor above the mathematical minimum */
  bufferMode: BufferMode;
  bufferValue: number;

  /* Status: green at or above this % of the target, yellow at or above the other. */
  greenAtPercent: number;
  yellowAtPercent: number;
}

export const DEFAULT_INPUTS: EconomicsInputs = {
  gstEnabled: true,
  gstRate: 18,
  gatewayRate: 2.5,

  sellerSalary: 10_000,
  sellerFood: 1_800,
  sellerTravel: 1_500,
  sellers: 5,
  studentsAcquired: 52,
  cacSource: 'team',
  targetStudents: 200,
  productivityOverride: null,

  groupTeacherRate: 300,
  groupClassesPerMonth: 4,
  batchOccupancy: 4,
  oneTeacherRate: 250,
  oneClassesPerMonth: 4,

  techReserve: 100,
  opsCost: 200,
  catchupReserve: 150,
  catchupUtilisation: 100,
  doubtReserve: 100,
  doubtUtilisation: 100,
  overhead: 0,
  conservative: true,

  minContributionPerMonth: 400,
  firstMonthContribution: 100,
  renewalMonthContribution: 1_000,

  bufferMode: 'fixed',
  bufferValue: 500,

  greenAtPercent: 125,
  yellowAtPercent: 100,
};

/* ── Small arithmetic ────────────────────────────────────────────────────── */

const pct = (n: number) => n / 100;

/** Math.ceil that does not turn 104 ÷ 10.4 = 10.000000000000002 into 11. */
export function ceilSafe(n: number): number {
  return Math.ceil(n - 1e-9);
}

/**
 * Up to the next price ending in 99: 5,934 → 5,999 · 6,434 → 6,499 · 5,999 → 5,999.
 * A seller floor is always rounded UP — a floor rounded down is below the floor.
 */
export function roundUpTo99(n: number): number {
  if (!Number.isFinite(n)) return n;
  return Math.max(99, ceilSafe((n + 1) / 100) * 100 - 1);
}

/* ── Sales ───────────────────────────────────────────────────────────────── */

export interface SalesCost {
  costPerSeller: number;
  /** Students one seller brings in a month. */
  productivity: number;
  sellers: number;
  students: number;
  teamCost: number;
  cac: number;
}

/** Today's team, as it is. */
export function teamSales(i: EconomicsInputs): SalesCost {
  const costPerSeller = i.sellerSalary + i.sellerFood + i.sellerTravel;
  const sellers = Math.max(0, i.sellers);
  const students = Math.max(0, i.studentsAcquired);
  const teamCost = sellers * costPerSeller;
  return {
    costPerSeller,
    productivity: sellers > 0 ? students / sellers : 0,
    sellers,
    students,
    teamCost,
    cac: students > 0 ? teamCost / students : teamCost,
  };
}

/** The team a growth target needs: sellers = target ÷ productivity, always up. */
export function capacityPlan(i: EconomicsInputs, target = i.targetStudents): SalesCost {
  const team = teamSales(i);
  const productivity = i.productivityOverride && i.productivityOverride > 0 ? i.productivityOverride : team.productivity;
  const students = Math.max(0, target);
  const sellers = productivity > 0 ? ceilSafe(students / productivity) : 0;
  const teamCost = sellers * team.costPerSeller;
  return { costPerSeller: team.costPerSeller, productivity, sellers, students, teamCost, cac: students > 0 ? teamCost / students : 0 };
}

export function cacFor(i: EconomicsInputs): number {
  return i.cacSource === 'target' ? capacityPlan(i).cac : teamSales(i).cac;
}

/* ── Monthly cost of one student ─────────────────────────────────────────── */

export interface MonthlyCost {
  teacher: number;
  tech: number;
  catchup: number;
  doubt: number;
  overhead: number;
  /** Months 2 onward only. */
  ops: number;
  classesPerMonth: number;
  /** Month 1: everything but operations. */
  firstMonth: number;
  /** Month 2 onward. */
  laterMonth: number;
}

export function monthlyCost(i: EconomicsInputs, ratio: Ratio): MonthlyCost {
  const group = ratio === '1:4';
  const classesPerMonth = group ? i.groupClassesPerMonth : i.oneClassesPerMonth;
  const teacher = group
    ? (i.groupTeacherRate * i.groupClassesPerMonth) / Math.max(1, i.batchOccupancy)
    : i.oneTeacherRate * i.oneClassesPerMonth;
  const usedShare = (u: number) => (i.conservative ? 1 : Math.min(1, Math.max(0, pct(u))));
  const catchup = i.catchupReserve * usedShare(i.catchupUtilisation);
  const doubt = i.doubtReserve * usedShare(i.doubtUtilisation);
  const firstMonth = teacher + i.techReserve + catchup + doubt + i.overhead;
  return {
    teacher,
    tech: i.techReserve,
    catchup,
    doubt,
    overhead: i.overhead,
    ops: i.opsCost,
    classesPerMonth,
    firstMonth,
    laterMonth: firstMonth + i.opsCost,
  };
}

/* ── What Sariro keeps of a price ────────────────────────────────────────── */

/** The share of a GST-inclusive price left after GST and the gateway. */
export function keepFactor(i: EconomicsInputs): number {
  const exGst = i.gstEnabled ? 1 / (1 + pct(i.gstRate)) : 1;
  return exGst - pct(i.gatewayRate);
}

/** The contribution a plan must leave: its own target for month 1, M × N otherwise. */
export function contributionTarget(i: EconomicsInputs, months: number): number {
  return months === 1 ? i.firstMonthContribution : i.minContributionPerMonth * months;
}

export interface RequiredCost {
  cac: number;
  /** All N months of teaching and reserves, operations included. */
  deliveryReserve: number;
  target: number;
  total: number;
}

export function requiredCost(i: EconomicsInputs, ratio: Ratio, months: number): RequiredCost {
  const m = monthlyCost(i, ratio);
  const cac = cacFor(i);
  const deliveryReserve = months * m.firstMonth + Math.max(0, months - 1) * m.ops;
  const target = contributionTarget(i, months);
  return { cac, deliveryReserve, target, total: cac + deliveryReserve + target };
}

export interface Minimum {
  /** The exact lowest price, before any rounding. Infinity when nothing can cover it. */
  value: number;
  /** Month 1 of a monthly plan, CAC and the first-month target included. */
  firstMonth: number;
  /** A renewal month: no CAC, operations in, the renewal target. Monthly plan only. */
  renewal: number | null;
}

export function mathematicalMinimum(i: EconomicsInputs, ratio: Ratio, months: number): Minimum {
  const k = keepFactor(i);
  if (k <= 0) return { value: Infinity, firstMonth: Infinity, renewal: months === 1 ? Infinity : null };
  const base = requiredCost(i, ratio, months).total / k;
  if (months !== 1) return { value: base, firstMonth: base, renewal: null };
  const renewal = (monthlyCost(i, ratio).laterMonth + i.renewalMonthContribution) / k;
  return { value: Math.max(base, renewal), firstMonth: base, renewal };
}

/** Maths minimum plus the buffer, rounded up to end in 99. */
export function recommendedFloor(i: EconomicsInputs, ratio: Ratio, months: number): number {
  const min = mathematicalMinimum(i, ratio, months).value;
  if (!Number.isFinite(min)) return Infinity;
  const buffered = i.bufferMode === 'percent' ? min * (1 + pct(i.bufferValue)) : min + i.bufferValue;
  return roundUpTo99(buffered);
}

/* ── One price, taken apart ──────────────────────────────────────────────── */

export interface Breakdown {
  months: number;
  ratio: Ratio;
  price: number;
  gst: number;
  revenueExGst: number;
  gateway: number;
  cac: number;
  teacher: number;
  tech: number;
  ops: number;
  catchup: number;
  doubt: number;
  overhead: number;
  /** Teaching and every reserve for all N months — owed before a rupee is profit. */
  deliveryReserve: number;
  totalCost: number;
  contribution: number;
  perMonth: number;
  perClass: number;
  /** Of revenue excluding GST. */
  marginPercent: number;
  /** 1:4 only: this student's contribution times the children in the batch. */
  perBatch: number | null;
  target: number;
  /** Monthly plan only: what one renewal month leaves, against its own target. */
  renewal: { contribution: number; target: number } | null;
  status: Status;
}

export function statusFor(i: EconomicsInputs, actual: number, target: number): Status {
  if (actual < 0) return 'red';
  if (target <= 0) return 'green';
  const share = (actual / target) * 100;
  if (share >= i.greenAtPercent) return 'green';
  if (share >= i.yellowAtPercent) return 'yellow';
  return 'red';
}

const WORST: Record<Status, number> = { red: 0, yellow: 1, green: 2 };

export function breakdown(i: EconomicsInputs, ratio: Ratio, months: number, price: number): Breakdown {
  const m = monthlyCost(i, ratio);
  const p = Number.isFinite(price) && price > 0 ? price : 0;
  const revenueExGst = i.gstEnabled ? p / (1 + pct(i.gstRate)) : p;
  const gst = p - revenueExGst;
  const gateway = p * pct(i.gatewayRate);
  const cac = cacFor(i);

  const teacher = months * m.teacher;
  const tech = months * m.tech;
  const catchup = months * m.catchup;
  const doubt = months * m.doubt;
  const overhead = months * m.overhead;
  const ops = Math.max(0, months - 1) * m.ops;
  const deliveryReserve = teacher + tech + catchup + doubt + overhead + ops;
  const totalCost = gateway + cac + deliveryReserve;
  const contribution = revenueExGst - totalCost;
  const target = contributionTarget(i, months);

  let status = statusFor(i, contribution, target);
  let renewal: Breakdown['renewal'] = null;
  if (months === 1) {
    const renewalContribution = revenueExGst - gateway - m.laterMonth;
    renewal = { contribution: renewalContribution, target: i.renewalMonthContribution };
    const r = statusFor(i, renewalContribution, i.renewalMonthContribution);
    if (WORST[r] < WORST[status]) status = r;
  }

  return {
    months,
    ratio,
    price: p,
    gst,
    revenueExGst,
    gateway,
    cac,
    teacher,
    tech,
    ops,
    catchup,
    doubt,
    overhead,
    deliveryReserve,
    totalCost,
    contribution,
    perMonth: months > 0 ? contribution / months : 0,
    perClass: months * m.classesPerMonth > 0 ? contribution / (months * m.classesPerMonth) : 0,
    marginPercent: revenueExGst > 0 ? (contribution / revenueExGst) * 100 : 0,
    perBatch: ratio === '1:4' ? contribution * Math.max(1, i.batchOccupancy) : null,
    target,
    renewal,
    status,
  };
}

/* ── The price ladder a seller works down ────────────────────────────────── */

export interface LadderEntry {
  /** On the website and in marketing. */
  publicPrice: number | null;
  /** The normal discounted offer. */
  offer1: number | null;
  /** The strong closing offer. */
  offer2: number | null;
  /** A manager-approved floor. Blank = maths minimum plus the buffer. */
  manualFloor: number | null;
}

export type Ladder = Record<Ratio, Record<PlanMonths, LadderEntry>>;

const entry = (publicPrice: number): LadderEntry => ({ publicPrice, offer1: null, offer2: null, manualFloor: null });

/** The founder's current public prices, 15 Sep 2026. */
export const DEFAULT_LADDER: Ladder = {
  '1:4': { 1: entry(3_000), 3: entry(7_999), 6: entry(14_999), 12: entry(26_999), 36: entry(64_999) },
  '1:1': { 1: entry(3_500), 3: entry(9_499), 6: entry(17_999), 12: entry(32_999), 36: entry(89_999) },
};

/** The lowest price a seller may agree: the manager's floor, or the buffered minimum. */
export function sellerFloor(i: EconomicsInputs, ratio: Ratio, months: PlanMonths, e: LadderEntry): number {
  return e.manualFloor && e.manualFloor > 0 ? e.manualFloor : recommendedFloor(i, ratio, months);
}

export const NOT_APPROVED = 'NOT APPROVED — PRICE BELOW PROFITABILITY FLOOR';

export function isApproved(price: number, floor: number): boolean {
  return Number.isFinite(price) && price > 0 && price >= floor;
}

export type LadderWarning =
  | 'public_below_floor'
  | 'offer1_below_floor'
  | 'offer2_below_floor'
  | 'offers_out_of_order'
  | 'manual_floor_below_minimum'
  | 'no_public_price';

/** What is wrong with one row of the ladder, for management to fix. */
export function ladderWarnings(i: EconomicsInputs, ratio: Ratio, months: PlanMonths, e: LadderEntry): LadderWarning[] {
  const floor = sellerFloor(i, ratio, months, e);
  const min = mathematicalMinimum(i, ratio, months).value;
  const out: LadderWarning[] = [];
  if (!e.publicPrice) out.push('no_public_price');
  else if (e.publicPrice < floor) out.push('public_below_floor');
  if (e.offer1 && e.offer1 < floor) out.push('offer1_below_floor');
  if (e.offer2 && e.offer2 < floor) out.push('offer2_below_floor');
  const steps = [e.publicPrice, e.offer1, e.offer2].filter((v): v is number => !!v);
  if (steps.some((v, idx) => idx > 0 && v > steps[idx - 1])) out.push('offers_out_of_order');
  if (e.manualFloor && e.manualFloor > 0 && e.manualFloor < min) out.push('manual_floor_below_minimum');
  return out;
}

/* ── What a seller is shown ──────────────────────────────────────────────── */

export interface SellerPlanPrice {
  months: PlanMonths;
  label: string;
  publicPrice: number | null;
  offer1: number | null;
  offer2: number | null;
  /** The lowest they may agree. Never the maths minimum. */
  floor: number;
}

/**
 * The ladder as a seller sees it. No costs, no maths minimum, no margins — and
 * an offer management set below the floor is left out rather than shown as
 * something a seller may say.
 */
export function sellerPriceList(i: EconomicsInputs, ladder: Ladder): Record<Ratio, SellerPlanPrice[]> {
  const list = (ratio: Ratio) =>
    PLAN_MONTHS.map((months) => {
      const e = ladder[ratio][months];
      const floor = sellerFloor(i, ratio, months, e);
      const allowed = (v: number | null) => (v && v >= floor ? v : null);
      return {
        months,
        label: PLAN_LABEL[months],
        publicPrice: e.publicPrice,
        offer1: allowed(e.offer1),
        offer2: allowed(e.offer2),
        floor,
      };
    });
  return { '1:4': list('1:4'), '1:1': list('1:1') };
}

/* ── A cohort of new students ────────────────────────────────────────────── */

export type PriceBasis = 'public' | 'offer1' | 'offer2' | 'floor';

export interface PlanMix {
  cohort: number;
  ratio: Ratio;
  basis: PriceBasis;
  /** Share of the cohort on each plan, in percent. */
  percents: Record<PlanMonths, number>;
}

export const DEFAULT_MIX: PlanMix = {
  cohort: 200,
  ratio: '1:4',
  basis: 'public',
  percents: { 1: 55, 3: 30, 6: 0, 12: 10, 36: 5 },
};

/**
 * Whole students per plan that add up to the cohort (largest remainder), so
 * 55% of 7 does not become a fractional child and the rows sum to the total.
 */
export function splitCohort(cohort: number, percents: Record<PlanMonths, number>): Record<PlanMonths, number> {
  const total = PLAN_MONTHS.reduce((n, m) => n + Math.max(0, percents[m] ?? 0), 0);
  const n = Math.max(0, Math.round(cohort));
  const out = { 1: 0, 3: 0, 6: 0, 12: 0, 36: 0 } as Record<PlanMonths, number>;
  if (total <= 0 || n === 0) return out;
  const exact = PLAN_MONTHS.map((m) => ({ m, v: (n * Math.max(0, percents[m] ?? 0)) / total }));
  let given = 0;
  for (const e of exact) { out[e.m] = Math.floor(e.v); given += out[e.m]; }
  const order = [...exact].sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
  for (let k = 0; given < n && k < order.length; k++, given++) out[order[k].m] += 1;
  return out;
}

export function priceOn(i: EconomicsInputs, ratio: Ratio, months: PlanMonths, e: LadderEntry, basis: PriceBasis): number {
  const floor = sellerFloor(i, ratio, months, e);
  const v = basis === 'public' ? e.publicPrice : basis === 'offer1' ? e.offer1 : basis === 'offer2' ? e.offer2 : floor;
  return v && v > 0 ? v : floor;
}

export interface MixRow {
  months: PlanMonths;
  students: number;
  price: number;
  cash: number;
  gst: number;
  gateway: number;
  cac: number;
  reserve: number;
  contribution: number;
}

export interface MixResult {
  rows: MixRow[];
  totals: Omit<MixRow, 'months' | 'price'>;
  /** The percentages entered, added up. Anything but 100 is shown as a warning. */
  percentTotal: number;
}

export function planMix(i: EconomicsInputs, ladder: Ladder, mix: PlanMix): MixResult {
  const counts = splitCohort(mix.cohort, mix.percents);
  const rows = PLAN_MONTHS.map((months) => {
    const price = priceOn(i, mix.ratio, months, ladder[mix.ratio][months], mix.basis);
    const b = breakdown(i, mix.ratio, months, price);
    const s = counts[months];
    return {
      months,
      students: s,
      price,
      cash: s * b.price,
      gst: s * b.gst,
      gateway: s * b.gateway,
      cac: s * b.cac,
      reserve: s * b.deliveryReserve,
      contribution: s * b.contribution,
    };
  });
  const sum = (k: keyof Omit<MixRow, 'months' | 'price'>) => rows.reduce((n, r) => n + r[k], 0);
  return {
    rows,
    totals: { students: sum('students'), cash: sum('cash'), gst: sum('gst'), gateway: sum('gateway'), cac: sum('cac'), reserve: sum('reserve'), contribution: sum('contribution') },
    percentTotal: PLAN_MONTHS.reduce((n, m) => n + (mix.percents[m] ?? 0), 0),
  };
}

/* ── Money on screen ─────────────────────────────────────────────────────── */

/** ₹1,27,885 — Indian grouping, whole rupees unless asked. */
export function inr(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '−' : '';
  return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
