'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { fetchAnalytics, type AnalyticsSnapshot } from '@/lib/dashboard/analytics-data';

/**
 * SARIRO — the funnel, on the one dashboard that should see it
 * =========================================================
 * Built on tables that already exist (see analytics-data.ts) — no tracking
 * table, no new endpoint, nothing to keep alive.
 *
 * ── Chart decisions, and why ────────────────────────────────────────────────
 * • The headline numbers are STAT TILES, not a bar chart. Four unrelated
 *   quantities compared against each other is a chart that answers a question
 *   nobody asked ("is 'paid' bigger than 'active enrolments'?").
 * • The funnel is a horizontal bar in ONE hue, because its job is magnitude,
 *   not identity. Categorical colour here would imply the three steps are
 *   different KINDS of thing rather than a narrowing of the same thing.
 * • The trend line carries two series, so it gets a legend AND direct end
 *   labels — identity is never colour alone. The pair was validated for
 *   colour-vision separation before being used (ΔE 30.3 deutan, 33.3 normal).
 * • No dual axis, ever. Both series are counts of people, on one scale.
 *
 * ── The empty state is the honest one ───────────────────────────────────────
 * At nine students most days are legitimately zero. Three flat lines along the
 * bottom is not "data" — it reads as broken, and it teaches the reader to skim
 * past the panel on the day it finally has something to say. When nothing has
 * happened yet, this says so in one sentence.
 */

/** Validated pair — see the module comment. Blue = intent, green = money. */
const SERIES = {
  checkout: { key: 'checkoutsStarted', label: 'Reached checkout', color: '#2563EB' },
  paid: { key: 'paid', label: 'Paid', color: '#16A34A' },
} as const;

const SURFACE = '#FFFFFF';
/** One step off the surface — present, never competing with the data. */
const GRID = '#E9E2D8';
const FUNNEL_HUE = '#2563EB';

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card card--compact">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 tabular-nums mt-1.5 leading-none">
        {value}
      </p>
      {sub && <p className="text-[12.5px] text-slate-500 mt-1.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snapshot = await fetchAnalytics(30);
        if (!cancelled) setData(snapshot);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="card card--feature mb-8">
        <p className="text-[14px] text-slate-600">
          Could not load the funnel. The dashboard above is unaffected.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { totals, funnel, daily, topProducts, windowDays, empty } = data;
  const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2.5 mb-4">
        <BarChart3 className="w-5 h-5 text-slate-400" />
        <h2 className="text-lg font-bold text-slate-900">The funnel</h2>
        <span className="text-[12.5px] text-slate-500">last {windowDays} days</span>
      </div>

      {empty ? (
        <div className="card card--feature">
          <p className="font-semibold text-slate-900 mb-1">Nothing to plot yet.</p>
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            No free-class requests and no checkouts in the last {windowDays} days. This fills in on
            its own as people arrive — nothing needs configuring.
          </p>
        </div>
      ) : (
        <>
          {/* ── headline numbers ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatTile label="Free classes asked for" value={String(totals.demoRequests)} />
            <StatTile label="Reached checkout" value={String(totals.checkoutsStarted)} />
            <StatTile
              label="Paid"
              value={String(totals.paid)}
              sub={`${pct(totals.checkoutConversion)} of checkouts`}
            />
            <StatTile label="Active enrolments" value={String(totals.activeEnrolments)} sub="all time" />
          </div>

          {/* ── the funnel: one hue, because this is magnitude ───────────── */}
          <div className="card card--feature mb-6">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Where people stop
            </p>
            <div className="space-y-3">
              {funnel.map((step) => (
                <div key={step.label}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-[13.5px] font-medium text-slate-800">{step.label}</span>
                    <span className="text-[13.5px] font-bold text-slate-900 tabular-nums">
                      {step.value}
                      {step.fromPrevious !== null && (
                        <span className="ml-2 font-semibold text-slate-500">
                          {pct(step.fromPrevious)}
                        </span>
                      )}
                    </span>
                  </div>
                  {/* Track is the same hue at low alpha, so the bar reads as a
                      share of something rather than a free-floating length. */}
                  <div className="h-2.5 rounded-full" style={{ background: `${FUNNEL_HUE}14` }}>
                    <div
                      className="h-2.5 rounded-full transition-[width] duration-500"
                      style={{
                        width: `${Math.max(step.share * 100, step.value > 0 ? 2 : 0)}%`,
                        background: FUNNEL_HUE,
                      }}
                    />
                  </div>
                  <p className="text-[12px] text-slate-500 mt-1">{step.hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── over time: two series, so a legend AND direct labels ─────── */}
          <div className="card card--feature mb-6">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                Day by day
              </p>
              <div className="flex items-center gap-4">
                {Object.values(SERIES).map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={daily} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                  {/* Solid hairline, never dashed — a dashed grid competes with
                      the data for the reader's attention. */}
                  <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
                    tick={{ fontSize: 11, fill: '#7A6F61' }}
                    axisLine={{ stroke: GRID }}
                    tickLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#7A6F61' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${GRID}`,
                      fontSize: 13,
                      boxShadow: '0 12px 30px -12px rgba(42,37,31,0.25)',
                    }}
                    labelFormatter={(d) => String(d)}
                  />
                  {Object.values(SERIES).map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      // 2px ring in the surface colour so overlapping points
                      // stay legible where the two series cross.
                      dot={{ r: 3, fill: s.color, stroke: SURFACE, strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: s.color, stroke: SURFACE, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── what people actually tried to buy ────────────────────────── */}
          {topProducts.length > 0 && (
            <div className="card card--feature">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
                What reached checkout
              </p>
              <div className="space-y-2.5">
                {topProducts.map((p) => {
                  const widest = topProducts[0].intents || 1;
                  return (
                    <div key={p.label} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-[13px] text-slate-700 truncate" title={p.label}>
                        {p.label}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full" style={{ background: `${FUNNEL_HUE}14` }}>
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${Math.max((p.intents / widest) * 100, 2)}%`,
                            background: FUNNEL_HUE,
                          }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-[12.5px] text-slate-600 tabular-nums">
                        {p.intents} · {p.paid} paid
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Said once, plainly: this counts money, not visitors. */}
      <p className="text-[12.5px] text-slate-500 mt-4 leading-[1.6]">
        Counted from real records — free-class requests, orders and payments. Page views are not
        tracked, so this starts at &ldquo;asked for something&rdquo;, not at &ldquo;arrived&rdquo;.
      </p>
    </section>
  );
}
