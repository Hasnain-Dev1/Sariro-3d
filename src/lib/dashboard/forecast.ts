/**
 * SARIRO — next month, as far as it can honestly be said
 * =========================================================
 * V2 §68-69. Pure functions, no I/O.
 *
 * ── Committed is not the same as predicted, and they never share a total ────
 * §68 asks for predicted revenue, renewals, payouts, expenses and
 * profitability, and insists predictions are "clearly distinguished from actual
 * financial data". So this returns two separate shapes and never adds them
 * together:
 *
 *   committed — arithmetic over rows that already exist. Classes are scheduled
 *               and rates are configured, so next month's teacher cost is not a
 *               forecast, it is a multiplication. Credits already sold are
 *               money already taken.
 *
 *   projected — a stated assumption applied to that arithmetic. Every one
 *               carries the assumption in words, because a number whose basis
 *               is invisible gets quoted to a bank.
 *
 * ── Why there is no single profit number by default ─────────────────────────
 * Student fees are in dollars. Teacher pay, penalties and expenses are in
 * rupees. Subtracting one from the other needs an exchange rate, and there is
 * no exchange rate anywhere in this system.
 *
 * Inventing one here would repeat the exact defect the pricing guard exists to
 * prevent — a $199 course once charged as INR 199. So profitability is returned
 * only when a rate has been configured, and otherwise reports precisely why it
 * cannot be computed. A missing number with a reason is worth more than a
 * confident number that is wrong by a factor of eighty.
 */

export interface ScheduledClass {
  /** '1:1' or a group ratio. */
  ratio: string;
  /** Rate configured for the teacher's tier, in rupees. */
  rate: number;
  /** Group-size bonus that will apply, in rupees. */
  bonus: number;
}

export interface ForecastInputs {
  /** Classes already on the calendar for the month being forecast. */
  scheduled: ScheduledClass[];
  /** Credits sold and not yet consumed. Service owed, in classes. */
  outstandingCredits: number;
  /** What one credit was sold for, in dollars. Null when it varies or is unknown. */
  pricePerCreditUsd: number | null;
  /** Approved expenses for recent whole months, in rupees, newest first. */
  recentMonthlyExpenses: number[];
  /** Learners expected to need more credits, and how many each typically buys. */
  learnersNeedingRenewal: number;
  typicalRenewalCredits: number;
  /** Rupees per dollar. Null when nobody has configured one. */
  usdToInr: number | null;
}

export interface Money {
  amount: number;
  currency: 'INR' | 'USD';
}

export interface Line {
  label: string;
  value: Money;
  /** How it was arrived at, in words. */
  basis: string;
}

export interface Forecast {
  /** Arithmetic over rows that already exist. */
  committed: Line[];
  /** Assumptions applied on top. Never mixed into the committed figures. */
  projected: Line[];
  /**
   * The bottom line, when it can be computed at all. Null carries the reason,
   * which is the useful half when it is missing.
   */
  profitability: { value: Money; basis: string } | null;
  profitabilityUnavailable: string | null;
}

const inr = (amount: number): Money => ({ amount: Math.round(amount), currency: 'INR' });
const usd = (amount: number): Money => ({ amount: Math.round(amount), currency: 'USD' });

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function buildForecast(i: ForecastInputs): Forecast {
  const committed: Line[] = [];
  const projected: Line[] = [];

  /* ── Committed ─────────────────────────────────────────────────────────── */

  const teacherCost = i.scheduled.reduce((s, c) => s + c.rate + c.bonus, 0);
  const oneToOne = i.scheduled.filter((c) => c.ratio === '1:1').length;
  const group = i.scheduled.length - oneToOne;
  committed.push({
    label: 'Teacher payouts',
    value: inr(teacherCost),
    basis: `${i.scheduled.length} classes already scheduled (${oneToOne} one-to-one, ${group} group) at configured tier rates. Before penalties and incentives.`,
  });

  if (i.pricePerCreditUsd !== null && i.outstandingCredits > 0) {
    committed.push({
      label: 'Deferred revenue',
      value: usd(i.outstandingCredits * i.pricePerCreditUsd),
      basis: `${i.outstandingCredits} credits sold and not yet taught, at $${i.pricePerCreditUsd} each. Already received; owed as classes.`,
    });
  }

  /* ── Projected ─────────────────────────────────────────────────────────── */

  if (i.recentMonthlyExpenses.length > 0) {
    const avg = mean(i.recentMonthlyExpenses);
    projected.push({
      label: 'Expenses',
      value: inr(avg),
      basis: `Average of the last ${i.recentMonthlyExpenses.length} month${i.recentMonthlyExpenses.length === 1 ? '' : 's'} of approved expenses. Assumes next month resembles them.`,
    });
  } else {
    projected.push({
      label: 'Expenses',
      value: inr(0),
      basis: 'No approved expenses recorded yet, so there is nothing to project from.',
    });
  }

  if (i.pricePerCreditUsd !== null && i.learnersNeedingRenewal > 0) {
    const renewalRevenue = i.learnersNeedingRenewal * i.typicalRenewalCredits * i.pricePerCreditUsd;
    projected.push({
      label: 'Expected renewals',
      value: usd(renewalRevenue),
      basis: `${i.learnersNeedingRenewal} learners run low next month. Assumes every one renews at ${i.typicalRenewalCredits} credits — an upper bound, not a forecast.`,
    });
  }

  /* ── Profitability ─────────────────────────────────────────────────────── */

  const expenseProjection = i.recentMonthlyExpenses.length ? mean(i.recentMonthlyExpenses) : 0;
  const costsInr = teacherCost + expenseProjection;

  if (i.usdToInr === null) {
    return {
      committed,
      projected,
      profitability: null,
      profitabilityUnavailable:
        'Revenue is in dollars and costs are in rupees. No exchange rate is configured, so a single profit figure would be a guess. Set `usd_to_inr` in app settings to enable it.',
    };
  }

  if (i.pricePerCreditUsd === null) {
    return {
      committed,
      projected,
      profitability: null,
      profitabilityUnavailable:
        'No price per credit is configured, so revenue cannot be valued.',
    };
  }

  const revenueUsd =
    i.outstandingCredits * i.pricePerCreditUsd +
    i.learnersNeedingRenewal * i.typicalRenewalCredits * i.pricePerCreditUsd;
  const revenueInr = revenueUsd * i.usdToInr;

  return {
    committed,
    projected,
    profitability: {
      value: inr(revenueInr - costsInr),
      basis: `Revenue converted at ₹${i.usdToInr}/$. Includes projected renewals, so this is a projection, not a result.`,
    },
    profitabilityUnavailable: null,
  };
}

/** "₹12,400" / "$1,990" — grouped the way each currency is normally read. */
export function formatMoney(m: Money): string {
  return m.currency === 'INR'
    ? `₹${m.amount.toLocaleString('en-IN')}`
    : `$${m.amount.toLocaleString('en-US')}`;
}
