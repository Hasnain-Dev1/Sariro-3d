'use client';

import { useEffect, useState } from 'react';
import { Loader2, Info, Lock } from 'lucide-react';
import { formatMoney, type Forecast } from '@/lib/dashboard/forecast';

/**
 * SARIRO — next month
 * =========================================================
 * V2 §68-69.
 *
 * ── The two halves never touch ──────────────────────────────────────────────
 * §68 requires predictions to be clearly distinguished from actual financial
 * data, so committed and projected are separate blocks with separate headings
 * and no combined subtotal. Somebody skim-reading this in a funding
 * conversation should not be able to mistake one for the other.
 *
 * Every figure carries its basis in words underneath it, because a number whose
 * derivation is invisible is a number that gets quoted without its caveat.
 */

export default function ForecastPanel() {
  const [data, setData] = useState<{
    monthLabel: string; classesScheduled: number; forecast: Forecast;
  } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/analytics/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) { setFailed(json.message ?? 'Could not load the forecast.'); return; }
        setData({ monthLabel: json.monthLabel, classesScheduled: json.classesScheduled, forecast: json.forecast });
      } catch {
        if (!cancelled) setFailed('Could not load the forecast.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (failed) {
    return <div className="card card--compact"><p className="text-[13px] text-slate-600">{failed}</p></div>;
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const { forecast: f } = data;

  const Block = ({
    title, note, lines, tone,
  }: {
    title: string;
    note: string;
    lines: Forecast['committed'];
    tone: string;
  }) => (
    <div className="card card--feature">
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <p className="text-[13px] font-bold uppercase tracking-wider" style={{ color: tone }}>
          {title}
        </p>
      </div>
      <p className="text-[12px] text-slate-500 mb-3 leading-[1.5]">{note}</p>
      {lines.length === 0 ? (
        <p className="text-[13px] text-slate-500">Nothing to show yet.</p>
      ) : (
        <div className="space-y-3">
          {lines.map((line) => (
            <div key={line.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13.5px] font-semibold text-slate-900">{line.label}</span>
                <span className="text-[16px] font-extrabold text-slate-900 tabular-nums">
                  {formatMoney(line.value)}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 leading-[1.5] mt-0.5">{line.basis}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-600">
        <span className="font-bold">{data.monthLabel}</span> · {data.classesScheduled}{' '}
        {data.classesScheduled === 1 ? 'class' : 'classes'} scheduled.
      </p>

      <Block
        title="Committed"
        note="Arithmetic over rows that already exist. Not a forecast."
        lines={f.committed}
        tone="#0F172A"
      />

      <Block
        title="Projected"
        note="Assumptions applied on top. Each states the assumption it rests on."
        lines={f.projected}
        tone="#B45309"
      />

      {f.profitability ? (
        <div className="card card--feature">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-700">
              Projected profitability
            </p>
            <p
              className="text-2xl font-extrabold tabular-nums leading-none"
              style={{ color: f.profitability.value.amount >= 0 ? '#15803D' : '#B91C1C' }}
            >
              {formatMoney(f.profitability.value)}
            </p>
          </div>
          <p className="text-[12px] text-slate-500 leading-[1.5] mt-1">{f.profitability.basis}</p>
        </div>
      ) : (
        // A missing number with its reason beats a confident number that is
        // wrong by a factor of eighty.
        <div className="card card--compact">
          <p className="text-[13px] font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-slate-400" />
            Profitability not computed
          </p>
          <p className="text-[12.5px] text-slate-600 leading-[1.55]">
            {f.profitabilityUnavailable}
          </p>
        </div>
      )}

      <p className="text-[11.5px] text-slate-400 flex items-start gap-1.5 leading-[1.55]">
        <Info className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
        <span>
          Teacher payouts exclude penalties and incentives, which are not known
          until the classes have happened. Group-size bonuses are excluded rather
          than assumed.
        </span>
      </p>
    </div>
  );
}
