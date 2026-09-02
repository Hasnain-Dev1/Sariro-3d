'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, ChevronDown, Loader2 } from 'lucide-react';
import {
  CATEGORIES,
  fetchMonitoring,
  type MonitoringSummary,
  type MonitoringRecord,
} from '@/lib/dashboard/monitoring';

/**
 * SARIRO — what the observer saw
 * =========================================================
 * V2 §31-32. The teacher's side of monitoring.
 *
 * ── Why the breakdown is the point ──────────────────────────────────────────
 * §32 puts it plainly: "Teachers should understand why they received their
 * score." A number on its own is something done TO a teacher; the nine
 * categories and the written feedback are what make it something they can act
 * on. So every record opens to its full detail, and the summary at the top is
 * the least important thing on the page.
 *
 * ── Colour carries meaning here, unlike the demand charts ───────────────────
 * These are ratings on a fixed 1-10 scale, so a band genuinely means something
 * — 8 is good in January and good in June. That is different from the demand
 * panel, where the bars were counts and one hue was correct. Three bands, and
 * the number is always beside the colour so it never depends on it.
 */

const band = (n: number) =>
  n >= 8 ? { fg: '#15803D', bg: '#15803D14', label: 'Strong' }
  : n >= 6 ? { fg: '#B45309', bg: '#B4530914', label: 'Fair' }
  : { fg: '#BE123C', bg: '#BE123C14', label: 'Needs work' };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card--compact">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1 leading-none">{value}</p>
    </div>
  );
}

function Record({ rec }: { rec: MonitoringRecord }) {
  const [open, setOpen] = useState(false);
  const scored = CATEGORIES.filter((c) => rec.scores[c.key] !== null);
  const b = rec.overall_score !== null ? band(rec.overall_score) : null;

  return (
    <li className="card card--compact !p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`mon-${rec.id}`}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className="text-[12.5px] text-slate-500 tabular-nums shrink-0 w-20">
          {rec.observed_on}
        </span>
        <span className="flex-1 text-[13.5px] text-slate-700 truncate">
          {scored.length} {scored.length === 1 ? 'category' : 'categories'} scored
          {rec.strengths || rec.improvements ? ' · with feedback' : ''}
        </span>
        {b && rec.overall_score !== null ? (
          <span
            className="shrink-0 text-[12.5px] font-bold px-2 py-0.5 rounded tabular-nums"
            style={{ color: b.fg, background: b.bg }}
          >
            {rec.overall_score.toFixed(1)}
          </span>
        ) : (
          <span className="shrink-0 text-[12px] text-slate-400">Notes only</span>
        )}
        <ChevronDown
          className="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden
        />
      </button>

      {open && (
        <div id={`mon-${rec.id}`} className="border-t border-slate-100 px-4 py-3.5 space-y-4">
          {scored.length > 0 && (
            <div className="space-y-2">
              {scored.map((c) => {
                const v = rec.scores[c.key] as number;
                const cb = band(v);
                return (
                  <div key={c.key} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-[12.5px] text-slate-600">{c.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${v * 10}%`, background: cb.fg }}
                      />
                    </div>
                    <span
                      className="w-10 shrink-0 text-right text-[12.5px] font-bold tabular-nums"
                      style={{ color: cb.fg }}
                    >
                      {v}/10
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* The written half. This is the part a teacher can act on. */}
          {([
            ['What went well', rec.strengths],
            ['What to work on', rec.improvements],
            ['Next time', rec.action_items],
            ['Notes', rec.notes],
          ] as const)
            .filter(([, v]) => v)
            .map(([label, v]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {label}
                </p>
                <p className="text-[13.5px] text-slate-700 leading-[1.6] whitespace-pre-wrap">{v}</p>
              </div>
            ))}
        </div>
      )}
    </li>
  );
}

export default function MonitoringPanel({ teacherId }: { teacherId: string }) {
  const [data, setData] = useState<MonitoringSummary | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await fetchMonitoring(teacherId);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setFailed(e instanceof Error ? e.message : 'unknown error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  if (failed) {
    return (
      <div className="card card--feature">
        <p className="font-semibold text-slate-900 mb-1">Could not load monitoring.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">
          If this is the first time here, run{' '}
          <code className="px-1 rounded bg-slate-100">scripts/teacher-monitoring.sql</code>.
        </p>
        <p className="text-[12px] text-slate-400 mt-2">{failed}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (data.count === 0) {
    return (
      <div className="card card--feature text-center py-10">
        <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 mb-3" />
        <p className="font-semibold text-slate-900 mb-1">No classes observed yet.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6] max-w-sm mx-auto">
          When an admin sits in on one of your classes, their score and their notes appear here —
          including what they thought went well.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Classes observed" value={String(data.count)} />
        <Stat label="Average" value={data.average !== null ? data.average.toFixed(1) : '—'} />
        <Stat label="Best" value={data.highest !== null ? data.highest.toFixed(1) : '—'} />
        <Stat label="Lowest" value={data.lowest !== null ? data.lowest.toFixed(1) : '—'} />
      </div>

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
          Every observation
        </p>
        <ul className="space-y-2">
          {data.records.map((r) => (
            <Record key={r.id} rec={r} />
          ))}
        </ul>
      </div>
    </div>
  );
}
