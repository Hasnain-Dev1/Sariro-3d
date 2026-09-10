/**
 * SARIRO — how a seller is actually doing
 * ============================================================================
 * Six numbers over three windows. All of them are already in the database and
 * none of them is on a screen, so "how did Samaresh do in August" is currently
 * answered by scrolling a lead list and counting.
 *
 * ── Why three windows and not one ───────────────────────────────────────────
 * They answer different questions and disagree on purpose:
 *
 *   this month   — what the incentive is being earned against. Resets, and the
 *                  reset is the point: on the 1st everybody is at zero.
 *   last 30 days — whether they are on form. On the 2nd of the month the
 *                  monthly number is meaningless and this one is not.
 *   lifetime     — whether they can sell at all. Immune to a bad fortnight.
 *
 * A single window would have to be one of those, and each is the wrong answer
 * to the other two questions.
 *
 * ── Nothing here is stored ──────────────────────────────────────────────────
 * Same reasoning as chooseSeller's monthly counts: a stored metric has to be
 * incremented, decremented when a sale is refunded, and reset on the 1st. Miss
 * any of those once and the number is wrong forever, because there is nothing
 * to recompute it from. Counting rows means a correction made six weeks later
 * is reflected everywhere the moment it is made.
 */

import { monthWindow } from '@/lib/leads/seller-assignment';

/** A lead, as the counting sees it. */
export interface MetricLead {
  id: string;
  assigned_seller?: string | null;
  stage?: string | null;
  trial_status?: string | null;
  created_at?: string | null;
  booking_id?: string | null;
}

/** A punched sale. Unpunched sales are deliberately not passed in. */
export interface MetricSale {
  id?: string;
  seller_id?: string | null;
  amount?: number | null;
  punched_at?: string | null;
  refunded_at?: string | null;
}

export interface SellerMetrics {
  leadsReceived: number;
  trialsBooked: number;
  trialsCompleted: number;
  sales: number;
  revenue: number;
  /** trialsCompleted / trialsBooked × 100. Null when nothing was booked. */
  trialCompletionRate: number | null;
  /** sales / trialsBooked × 100. Null when nothing was booked. */
  conversionRate: number | null;
}

export interface MetricWindows {
  month: SellerMetrics;
  last30: SellerMetrics;
  lifetime: SellerMetrics;
  /** "2026-09" — which month `month` refers to. */
  monthKey: string;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * A trial was BOOKED if the lead ever reached a trial.
 *
 * Read from the stages a lead has passed THROUGH, not the one it is sitting
 * on: a family who booked a trial, attended and bought is on `enrolled`, and
 * counting only the current stage would say they never had a trial — which
 * would divide the conversion rate by a smaller number every time somebody
 * converts, making a seller's rate rise as they sell fewer.
 *
 * `booking_id` is the durable evidence. `trial_status` covers leads booked
 * before that column was populated.
 */
function bookedATrial(l: MetricLead): boolean {
  if (l.booking_id) return true;
  const t = String(l.trial_status ?? '');
  if (t === 'booked' || t === 'attended' || t === 'no_show' || t === 'final_conversation_pending') return true;
  const s = String(l.stage ?? '');
  return s === 'trial_booked' || s === 'final' || s === 'enrolled';
}

/** A trial was COMPLETED if the child actually sat in it. */
function completedATrial(l: MetricLead): boolean {
  const t = String(l.trial_status ?? '');
  if (t === 'attended' || t === 'final_conversation_pending') return true;
  /* A lead that reached `final` or `enrolled` had its class — those stages are
     only ever set from the other side of a finished trial. A no_show is
     explicitly not completed however far it later travels. */
  if (t === 'no_show' || t === 'slot_assistance') return false;
  const s = String(l.stage ?? '');
  return s === 'final' || s === 'enrolled';
}

function measure(leads: readonly MetricLead[], sales: readonly MetricSale[]): SellerMetrics {
  const leadsReceived = leads.length;
  const trialsBooked = leads.filter(bookedATrial).length;
  const trialsCompleted = leads.filter(completedATrial).length;

  /* A refunded sale is not a sale. Leaving it in would let a seller's
     conversion rate be propped up by money that was given back. */
  const live = sales.filter((s) => !s.refunded_at);
  const revenue = live.reduce((n, s) => n + (Number(s.amount) || 0), 0);

  return {
    leadsReceived,
    trialsBooked,
    trialsCompleted,
    sales: live.length,
    revenue: Math.round(revenue * 100) / 100,
    trialCompletionRate: rate(trialsCompleted, trialsBooked),
    conversionRate: rate(live.length, trialsBooked),
  };
}

/**
 * A percentage, or null when the denominator is zero.
 *
 * Null rather than 0. A seller with no trials yet has an UNKNOWN conversion
 * rate, and showing it as 0% puts a new joiner bottom of a leaderboard for
 * having done nothing wrong. The screens render null as "—".
 */
function rate(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/**
 * The three windows for one seller.
 *
 * `leads` and `sales` should already be filtered to this seller — who a lead
 * belongs to is a question about assignment, and answering it here would mean
 * this module had an opinion about transfers.
 */
export function sellerMetrics(
  leads: readonly MetricLead[],
  sales: readonly MetricSale[],
  now: number | Date = Date.now(),
  timeZone = 'Asia/Kolkata'
): MetricWindows {
  const at = new Date(now).getTime();
  const m = monthWindow(at, timeZone);
  const monthStart = Date.parse(m.start);
  const monthEnd = Date.parse(m.end);
  const thirtyAgo = at - 30 * DAY;

  const leadAt = (l: MetricLead) => Date.parse(l.created_at ?? '');
  /* Sales are dated by when HR PUNCHED them, not when they were recorded. The
     punch is the moment the money is counted towards somebody's month, and it
     is the only date that cannot be back-dated by whoever typed the row. */
  const saleAt = (s: MetricSale) => Date.parse(s.punched_at ?? '');

  const inMonth = <T,>(rows: readonly T[], when: (r: T) => number) =>
    rows.filter((r) => { const t = when(r); return Number.isFinite(t) && t >= monthStart && t < monthEnd; });
  const inLast30 = <T,>(rows: readonly T[], when: (r: T) => number) =>
    rows.filter((r) => { const t = when(r); return Number.isFinite(t) && t >= thirtyAgo && t <= at; });

  /* Lifetime counts only sales that have actually been punched — an unpunched
     row is a draft, whatever its age. */
  const punched = sales.filter((s) => Number.isFinite(saleAt(s)));

  return {
    monthKey: m.key,
    month: measure(inMonth(leads, leadAt), inMonth(punched, saleAt)),
    last30: measure(inLast30(leads, leadAt), inLast30(punched, saleAt)),
    lifetime: measure(leads, punched),
  };
}

/** "62.5%" or "—". One formatter, so no screen invents its own. */
export function pct(v: number | null): string {
  return v === null ? '—' : `${v}%`;
}
