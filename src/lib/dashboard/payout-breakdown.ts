/**
 * SARIRO — where a teacher's payout came from
 * =========================================================
 * V2 §36-37. Pure functions over earning rows, so the arithmetic that tells
 * somebody what they are owed can be tested instead of trusted.
 *
 * §93 is the whole point: "For every earning — which class generated it?" Each
 * line this produces keeps the rows behind it, so every number on the screen
 * can be opened rather than merely believed.
 *
 * ── Penalties are grouped by reading the reason ─────────────────────────────
 * teacher_earnings stores penalty_amount and a human penalty_reason, with no
 * type column. §36 wants deductions split by kind — late join, no-show, late
 * attendance — so the kind is recovered from the reason string the trigger
 * wrote at the time.
 *
 * That is not ideal and it is deliberate rather than lazy: adding a type column
 * would only classify penalties written after the migration, leaving every
 * existing row uncategorised, and §88 forbids rewriting historical financial
 * records to fit a new shape. Reading the reason classifies the whole history.
 * Anything unrecognised lands in "Other", visible and counted, never dropped —
 * a deduction that vanishes from the breakdown but not from the total is the
 * one failure this file must not have.
 */

export interface EarningRow {
  id: string;
  class_date: string;
  lesson_name: string | null;
  /**
   * §23, §82 — which class and which batch this rupee came from.
   *
   * Joined on by the earnings API. "Penalty ₹300" with no class attached is
   * the thing §23 exists to forbid: a teacher who cannot see which class caused
   * a deduction has no way to tell a mistake from a rule, and will assume the
   * former.
   */
  batch_code?: string | null;
  module_num?: string | null;
  ratio: string | null;
  base_amount: number | string;
  bonus_amount: number | string;
  penalty_amount: number | string;
  penalty_reason: string | null;
  net_amount: number | string;
  amount: number | string;
  status: 'pending' | 'settled';
}

export type PenaltyKind = 'late_join' | 'no_show' | 'late_attendance' | 'student_no_show' | 'other';

/** How long after a class ends attendance may still be marked without penalty. */
export const ATTENDANCE_DEADLINE_HOURS = 24;

/**
 * §38 — the rules, in the words the payout screen shows them in.
 *
 * All three are now actually enforced. The late-attendance one was printed
 * here for weeks while nothing applied it, which is worse than not showing it:
 * a rule a teacher reads and then watches go unenforced teaches them which
 * other rules to ignore.
 */
export const PENALTY_RULES: { kind: PenaltyKind; label: string; rule: string }[] = [
  { kind: 'late_join', label: 'Late join', rule: 'More than 5 minutes after the scheduled start — ₹100' },
  { kind: 'no_show', label: 'No show', rule: 'Class not attended — ₹1,000' },
  {
    kind: 'late_attendance',
    label: 'Late attendance',
    rule: `Attendance not marked within ${ATTENDANCE_DEADLINE_HOURS} hours of the class ending — ₹100`,
  },
];

export const PENALTY_LABEL: Record<PenaltyKind, string> = {
  late_join: 'Late join',
  no_show: 'No show',
  late_attendance: 'Late attendance',
  student_no_show: 'Student no-show (half withheld)',
  other: 'Other',
};

const n = (v: number | string | null | undefined) => Number(v ?? 0) || 0;

/** Recover the penalty kind from the reason the trigger wrote. */
export function classifyPenalty(reason: string | null): PenaltyKind {
  const r = (reason ?? '').toLowerCase();
  if (!r) return 'other';
  // Student no-show is checked first: its reason also contains "no-show", and
  // it is a withholding against the teacher's base rather than a penalty for
  // something the teacher did. Grouping the two would tell a teacher they were
  // punished for a child not turning up.
  if (r.includes('student no-show') || r.includes('half withheld')) return 'student_no_show';
  if (r.includes('late join')) return 'late_join';
  if (r.includes('no show') || r.includes('no-show')) return 'no_show';
  if (r.includes('attendance')) return 'late_attendance';
  return 'other';
}

/** Is this a one-to-one class? Anything else is a group class. */
export const isOneToOne = (ratio: string | null) => (ratio ?? '1:1') === '1:1';

export interface EarningLine {
  /** '1:1' or the group ratio as stored. */
  ratio: string;
  classes: number;
  /** Total base pay for these classes. */
  base: number;
  /** Group-size bonuses earned on them. */
  bonus: number;
  /** base + bonus. */
  total: number;
  /** §37, §74 — the classes behind the number. */
  rows: EarningRow[];
}

export interface DeductionLine {
  kind: PenaltyKind;
  label: string;
  count: number;
  amount: number;
  rows: EarningRow[];
}

export interface PayoutBreakdown {
  classes: number;
  /** Earnings split by class ratio, largest first. */
  earnings: EarningLine[];
  /** Deductions split by kind, largest first. */
  deductions: DeductionLine[];
  /** §36 — base + bonus across every class, before anything is taken off. */
  gross: number;
  totalDeductions: number;
  /** Approved incentives only. §44. */
  incentives: number;
  /** gross − deductions + incentives. */
  finalPayable: number;
}

export interface IncentiveRow {
  id: string;
  amount: number | string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'deleted';
  requested_at: string;
}

/**
 * Build the breakdown for a set of earning rows.
 *
 * Callers filter the rows to a period first. This deliberately does no date
 * work: the settlement window is decided in one place (settlement-period.ts)
 * and a second opinion about which classes count is exactly what §78 warns
 * against.
 */
export function buildPayoutBreakdown(
  rows: EarningRow[],
  incentives: IncentiveRow[] = []
): PayoutBreakdown {
  const byRatio = new Map<string, EarningLine>();
  const byPenalty = new Map<PenaltyKind, DeductionLine>();

  let gross = 0;
  let totalDeductions = 0;

  for (const r of rows) {
    const ratio = isOneToOne(r.ratio) ? '1:1' : (r.ratio ?? '1:4');
    const line = byRatio.get(ratio) ?? { ratio, classes: 0, base: 0, bonus: 0, total: 0, rows: [] };
    const base = n(r.base_amount);
    const bonus = n(r.bonus_amount);

    line.classes += 1;
    line.base += base;
    line.bonus += bonus;
    line.total += base + bonus;
    line.rows.push(r);
    byRatio.set(ratio, line);

    gross += base + bonus;

    const penalty = n(r.penalty_amount);
    if (penalty > 0) {
      const kind = classifyPenalty(r.penalty_reason);
      const d = byPenalty.get(kind) ?? { kind, label: PENALTY_LABEL[kind], count: 0, amount: 0, rows: [] };
      d.count += 1;
      d.amount += penalty;
      d.rows.push(r);
      byPenalty.set(kind, d);
      totalDeductions += penalty;
    }
  }

  const approvedIncentives = incentives
    .filter((i) => i.status === 'approved')
    .reduce((s, i) => s + n(i.amount), 0);

  return {
    classes: rows.length,
    earnings: [...byRatio.values()].sort((a, b) => b.total - a.total),
    deductions: [...byPenalty.values()].sort((a, b) => b.amount - a.amount),
    gross,
    totalDeductions,
    incentives: approvedIncentives,
    finalPayable: gross - totalDeductions + approvedIncentives,
  };
}

/**
 * §37 — "12 × 1:1 × ₹300 = ₹3,600", written only when it is true.
 *
 * Where classes in a line were paid at different rates — a tier change
 * mid-month, or a rate edited in settings — there is no single multiplication
 * to show, so it says the total and the count instead of a sum that does not
 * add up.
 */
export function explainLine(line: EarningLine): string {
  const rates = new Set(line.rows.map((r) => n(r.base_amount)));
  const plural = line.classes === 1 ? 'class' : 'classes';

  if (rates.size === 1) {
    const rate = [...rates][0];
    const sum = `${line.classes} × ${line.ratio} × ₹${rate} = ₹${line.classes * rate}`;
    return line.bonus > 0 ? `${sum}, plus ₹${line.bonus} group bonus` : sum;
  }

  return `${line.classes} ${line.ratio} ${plural} at mixed rates = ₹${line.base}${
    line.bonus > 0 ? `, plus ₹${line.bonus} group bonus` : ''
  }`;
}

/** §39 — group rows into calendar months for the history table. */
export function groupByMonth(rows: EarningRow[]): { month: string; label: string; rows: EarningRow[] }[] {
  const map = new Map<string, EarningRow[]>();
  for (const r of rows) {
    const t = Date.parse(r.class_date);
    if (!Number.isFinite(t)) continue;
    // Month boundaries follow India, matching the settlement window — a class
    // at 23:30 IST on the 31st belongs to the month it was taught in.
    const ist = new Date(t + 330 * 60_000);
    const key = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}`;
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, monthRows]) => {
      const [y, m] = month.split('-');
      return { month, label: `${MONTHS[Number(m) - 1]} ${y}`, rows: monthRows };
    });
}
