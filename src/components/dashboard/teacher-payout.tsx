'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, Info, TrendingDown, Award } from 'lucide-react';
import {
  buildPayoutBreakdown, explainLine, groupByMonth, PENALTY_RULES,
  type EarningRow, type IncentiveRow,
} from '@/lib/dashboard/payout-breakdown';

/**
 * SARIRO — Payout & Earnings
 * =========================================================
 * V2 §33-39. The section that answers, without the teacher having to ask
 * anyone: what is my rate, what did I earn, what was taken off, and why.
 *
 * ── Every number opens ──────────────────────────────────────────────────────
 * §37 and §74 both say the figures must be drillable, and §93 puts it as a
 * question every number should be able to answer: "which class generated it?"
 * So each line here expands to the classes behind it. A penalty a teacher
 * cannot trace to a specific class is a penalty they will assume was a mistake.
 *
 * ── The rates are not written here ──────────────────────────────────────────
 * §35: "Do not hardcode the values." They arrive from teacher_pay_rates(), the
 * same function the earnings trigger reads. When the migration has not been run
 * the card says the rates are unavailable rather than showing a plausible
 * number that might be wrong — a teacher planning around a wrong rate is worse
 * off than one who knows they need to ask.
 */

export interface PayRate { tier: number; rate_1on1: number; rate_group: number; group_bonus: number }

const n = (v: number | string | null | undefined) => Number(v ?? 0) || 0;
const inr = (v: number) => `₹${n(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

/** A line that opens to show the classes behind it. */
function Drillable({
  label, detail, amount, negative, rows,
}: {
  label: string;
  detail?: string;
  amount: number;
  negative?: boolean;
  rows: EarningRow[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 transition-colors px-1 -mx-1 rounded"
      >
        <ChevronRight
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-slate-900">{label}</p>
          {detail && <p className="text-[12px] text-slate-500 mt-0.5">{detail}</p>}
        </div>
        <p
          className="text-[14px] font-extrabold tabular-nums shrink-0"
          style={{ color: negative ? '#B91C1C' : '#0F172A' }}
        >
          {negative ? '−' : ''}{inr(amount)}
        </p>
      </button>

      {/* §23, §82 — every rupee names its class and its batch. A deduction a
          teacher cannot trace is one they will treat as an error. */}
      {open && (
        <ul className="pb-2.5 pl-7 space-y-1.5">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 text-[12.5px]">
              <div className="min-w-0">
                <p className="text-slate-700">
                  {shortDate(r.class_date)}
                  {r.batch_code ? ` · ${r.batch_code}` : ''}
                  {r.module_num ? ` · Module ${r.module_num}` : ''}
                </p>
                <p className="text-slate-500 truncate">{r.lesson_name || 'Class'}</p>
                {negative && r.penalty_reason && (
                  <p style={{ color: '#B91C1C' }}>{r.penalty_reason}</p>
                )}
              </div>
              <span className="text-slate-600 tabular-nums shrink-0 font-semibold">
                {negative ? inr(n(r.penalty_amount)) : inr(n(r.base_amount) + n(r.bonus_amount))}
              </span>
            </li>
          ))}
          {rows.length === 0 && <li className="text-[12.5px] text-slate-400">No classes.</li>}
        </ul>
      )}
    </div>
  );
}

export default function TeacherPayout({
  earnings, incentives, tier, rates, periodLabel, periodStart, periodEnd,
}: {
  earnings: EarningRow[];
  incentives: IncentiveRow[];
  tier: number;
  rates: PayRate[] | null;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
}) {
  const mine = rates?.find((r) => r.tier === tier) ?? null;

  /* The period being paid — the same rule the server settles by: everything up
     to the end of the window, including stragglers from earlier months. */
  const periodRows = useMemo(() => {
    const to = Date.parse(periodEnd);
    return earnings.filter((e) => {
      if (e.status !== 'pending') return false;
      const t = Date.parse(e.class_date);
      return Number.isFinite(t) && t < to;
    });
  }, [earnings, periodEnd]);

  const periodIncentives = useMemo(() => {
    const from = Date.parse(periodStart);
    const to = Date.parse(periodEnd);
    return incentives.filter((i) => {
      const t = Date.parse(i.requested_at);
      return Number.isFinite(t) && t >= from && t < to;
    });
  }, [incentives, periodStart, periodEnd]);

  const b = useMemo(
    () => buildPayoutBreakdown(periodRows, periodIncentives),
    [periodRows, periodIncentives]
  );

  const history = useMemo(() => groupByMonth(earnings), [earnings]);

  return (
    <div className="space-y-5">
      {/* ── §34-35 — tier and what it pays ──────────────────────────────── */}
      <div className="card card--feature">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Your tier
              </p>
              <p className="text-xl font-extrabold text-slate-900 leading-none mt-0.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Tier {tier}
              </p>
            </div>
          </div>

          {mine ? (
            <div className="flex gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">1:1 class</p>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums leading-none mt-0.5">
                  {inr(mine.rate_1on1)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">1:4 class</p>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums leading-none mt-0.5">
                  {inr(mine.rate_group)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  +{inr(mine.group_bonus)} at 4 students
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-slate-500 max-w-[38ch]">
              Rates unavailable — run{' '}
              <code className="px-1 rounded bg-slate-100">scripts/payout-transparency.sql</code>.
            </p>
          )}
        </div>

        {/* The whole ladder. A teacher should be able to see what the next tier
            pays without asking somebody. Tiers are set by the super-admin, so
            no advancement criteria are claimed here that do not exist. */}
        {rates && rates.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              All tiers
            </p>
            <div className="space-y-1">
              {rates.map((r) => (
                <div
                  key={r.tier}
                  className="flex items-center justify-between gap-3 text-[13px] px-2 py-1.5 rounded"
                  style={r.tier === tier ? { background: '#F59E0B14', fontWeight: 700 } : undefined}
                >
                  <span className="text-slate-700">
                    Tier {r.tier}
                    {r.tier === tier && <span className="text-amber-700"> · you</span>}
                  </span>
                  <span className="text-slate-600 tabular-nums">
                    {inr(r.rate_1on1)} · {inr(r.rate_group)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-slate-400 mt-2 leading-[1.5]">
              Tiers are set by the super-admin. Ask your reporting admin what
              would move you up.
            </p>
          </div>
        )}
      </div>

      {/* ── §36-37 — the breakdown, every line drillable ─────────────────── */}
      <div className="card card--feature">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
          {periodLabel}
        </p>
        <p className="text-[12.5px] text-slate-500 mb-3">
          {b.classes} {b.classes === 1 ? 'class' : 'classes'}. Tap any line to see
          the classes behind it.
        </p>

        {b.earnings.length === 0 ? (
          <p className="text-[13.5px] text-slate-500 py-4">No classes in this period yet.</p>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-2">Earnings</p>
            <div className="mb-1">
              {b.earnings.map((line) => (
                <Drillable
                  key={line.ratio}
                  label={`${line.ratio} classes`}
                  detail={explainLine(line)}
                  amount={line.total}
                  rows={line.rows}
                />
              ))}
            </div>

            <div className="flex items-baseline justify-between gap-3 py-2 border-t border-slate-200">
              <p className="text-[12.5px] font-semibold uppercase tracking-wider text-slate-500">Gross</p>
              <p className="text-[15px] font-extrabold text-slate-900 tabular-nums">{inr(b.gross)}</p>
            </div>

            {b.deductions.length > 0 && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-3">
                  Deductions
                </p>
                <div>
                  {b.deductions.map((d) => (
                    <Drillable
                      key={d.kind}
                      label={d.label}
                      detail={`${d.count} ${d.count === 1 ? 'class' : 'classes'}`}
                      amount={d.amount}
                      negative
                      rows={d.rows}
                    />
                  ))}
                </div>
              </>
            )}

            {b.incentives > 0 && (
              <div className="flex items-baseline justify-between gap-3 py-2.5 border-t border-slate-100">
                <p className="text-[13.5px] font-semibold text-slate-900">Approved incentives</p>
                <p className="text-[14px] font-extrabold tabular-nums" style={{ color: '#15803D' }}>
                  +{inr(b.incentives)}
                </p>
              </div>
            )}

            <div className="flex items-baseline justify-between gap-3 pt-3 mt-1 border-t-2 border-slate-900">
              <p className="text-[13px] font-bold uppercase tracking-wider text-slate-700">
                Final payable
              </p>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none">
                {inr(b.finalPayable)}
              </p>
            </div>

            {/* A negative month is capped at zero when it settles. Saying so
                here is better than a teacher discovering it on payday. */}
            {b.finalPayable < 0 && (
              <p className="text-[12.5px] mt-2 leading-[1.55]" style={{ color: '#B91C1C' }}>
                Deductions exceed this period&rsquo;s earnings. The settlement will
                be recorded at ₹0 rather than negative — HR will be in touch about
                the difference.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── §38 — the rules, stated where the money is ───────────────────── */}
      <div className="card card--compact">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-slate-400" />
          <p className="text-[12.5px] font-semibold uppercase tracking-wider text-slate-500">
            Penalty rules
          </p>
        </div>
        <ul className="space-y-1">
          {PENALTY_RULES.map((r) => (
            <li key={r.kind} className="text-[13px] text-slate-600 leading-[1.55]">
              <span className="font-semibold text-slate-800">{r.label}</span> — {r.rule}
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] text-slate-400 mt-2 flex items-start gap-1.5 leading-[1.5]">
          <Info className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
          <span>Joining within 5 minutes of the start does not carry a penalty.</span>
        </p>
      </div>

      {/* ── §39 — previous months ────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="card card--feature">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Month by month
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 pr-3 font-semibold">Month</th>
                  <th className="pb-2 px-3 text-right font-semibold">Classes</th>
                  <th className="pb-2 px-3 text-right font-semibold">Gross</th>
                  <th className="pb-2 px-3 text-right font-semibold">Deductions</th>
                  <th className="pb-2 pl-3 text-right font-semibold">Net</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const m = buildPayoutBreakdown(h.rows);
                  const settled = h.rows.filter((r) => r.status === 'settled').length;
                  return (
                    <tr key={h.month} className="border-t border-slate-100">
                      <td className="py-2 pr-3">
                        <span className="font-semibold text-slate-900">{h.label}</span>
                        {settled === h.rows.length && h.rows.length > 0 && (
                          <span className="ml-2 text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded"
                            style={{ color: '#15803D', background: '#15803D14' }}>
                            settled
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-600">{m.classes}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-600">{inr(m.gross)}</td>
                      <td className="py-2 px-3 text-right tabular-nums" style={{ color: m.totalDeductions > 0 ? '#B91C1C' : '#64748B' }}>
                        {m.totalDeductions > 0 ? `−${inr(m.totalDeductions)}` : '—'}
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums font-bold text-slate-900">
                        {inr(m.gross - m.totalDeductions)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
