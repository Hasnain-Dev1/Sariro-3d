'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

/**
 * SARIRO — how reliably each teacher meets a catch-up obligation
 * ============================================================================
 * §33/§49. HR's question is about a teacher, not about a family — so this
 * carries counts and timings and no student names, no balances, no payment
 * information. Somebody assessing reliability does not need to know which
 * child is behind on their fees.
 *
 * ── On time means by the original deadline ──────────────────────────────────
 * Not "did they get round to it". A session arranged three weeks late still
 * happened, and counting it as compliant would make the column meaningless.
 */

interface Row {
  teacherId: string;
  teacherName: string;
  adminName: string | null;
  assigned: number;
  onTime: number;
  late: number;
  overdueNow: number;
  completed: number;
  pending: number;
  averageHoursToSchedule: number | null;
  earned: number;
}

/** Hours read as hours until they stop being readable that way. */
function took(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return 'under an hour';
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function CatchUpCompliancePanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/catchup-compliance');
      const json = await res.json();
      if (!json.ok) { setFailed(json.message ?? 'Could not load compliance.'); return; }
      setRows(json.teachers as Row[]);
    } catch {
      setFailed('Could not load compliance.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (failed) {
    return <div className="card card--compact"><p className="text-[13px] text-slate-600">{failed}</p></div>;
  }
  if (!rows) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="card card--compact flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
        <p className="text-[13.5px] text-slate-600">
          No catch-up sessions have been assigned to anybody yet.
        </p>
      </div>
    );
  }

  return (
    <div className="card card--compact p-0 overflow-hidden">
      {/* Its own scroller: a wide table must never make the page scroll sideways. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {['Teacher', 'Assigned', 'On time', 'Late', 'Overdue now', 'Completed', 'Avg to schedule', 'Earned'].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2.5 whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teacherId} className="border-t border-slate-100">
                <td className="px-3 py-2.5">
                  <p className="text-[13.5px] font-bold text-slate-900 whitespace-nowrap">{r.teacherName}</p>
                  {r.adminName && (
                    <p className="text-[11px] text-slate-400 whitespace-nowrap">reports to {r.adminName}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[13px] text-slate-700 tabular-nums">{r.assigned}</td>
                <td className="px-3 py-2.5 text-[13px] text-green-700 font-bold tabular-nums">{r.onTime}</td>
                <td className="px-3 py-2.5 text-[13px] text-amber-700 tabular-nums">{r.late}</td>
                <td className={`px-3 py-2.5 text-[13px] tabular-nums ${r.overdueNow > 0 ? 'text-red-700 font-bold' : 'text-slate-400'}`}>
                  {r.overdueNow}
                </td>
                <td className="px-3 py-2.5 text-[13px] text-slate-700 tabular-nums">{r.completed}</td>
                <td className="px-3 py-2.5 text-[13px] text-slate-600 tabular-nums whitespace-nowrap">
                  {took(r.averageHoursToSchedule)}
                </td>
                <td className="px-3 py-2.5 text-[13px] text-slate-900 font-bold tabular-nums whitespace-nowrap">
                  ₹{r.earned.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2.5 text-[11px] text-slate-400 border-t border-slate-100">
        On time means arranged before the original deadline, not merely arranged eventually.
      </p>
    </div>
  );
}
