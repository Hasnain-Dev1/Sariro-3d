'use client';

/**
 * SARIRO — BatchRescheduleModal
 *
 * Teacher reschedules a WHOLE batch going forward: pick the batch, set new
 * weekday(s) + time per day. Future classes regenerate to the new cadence;
 * past classes are untouched. Calls /api/schedule/reschedule-batch.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, CalendarClock, Loader2, Check } from 'lucide-react';
import { getTrackName } from '@/lib/dashboard/upsell-engine';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Sched {
  id: string; days_of_week: number[]; time_local: string; timezone: string; classes_per_week: number;
  cohorts: { track: string; level: string; ratio: string; batch_code: string | null } | null;
}

export function BatchRescheduleModal({
  open, onClose, onDone,
}: { open: boolean; onClose: () => void; onDone?: () => void }) {
  const [schedules, setSchedules] = useState<Sched[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState('');
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [defaultTime, setDefaultTime] = useState('17:00');
  const [cadence, setCadence] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));
    fetch('/api/schedule/reschedule-batch').then((r) => r.json()).then((j) => {
      if (cancelled) return;
      setSchedules(j.ok ? j.schedules : []);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  const selected = useMemo(() => schedules.find((s) => s.id === selId), [schedules, selId]);

  // Seed the editor from the chosen batch's current cadence.
  useEffect(() => {
    if (!selected) return;
    const seed: Record<number, string> = {};
    for (const d of selected.days_of_week) seed[d] = selected.time_local.slice(0, 5);
    Promise.resolve().then(() => {
      setDayTimes(seed);
      setDefaultTime(selected.time_local.slice(0, 5) || '17:00');
      setCadence(selected.classes_per_week === 2 ? 2 : 1);
    });
  }, [selected]);

  const weekdays = useMemo(() => Object.keys(dayTimes).map(Number).sort((a, b) => a - b), [dayTimes]);

  const toggleDay = useCallback((d: number) => {
    setDayTimes((prev) => {
      const next = { ...prev };
      if (d in next) { delete next[d]; return next; }
      const keys = Object.keys(next).map(Number);
      if (keys.length >= cadence) delete next[keys.sort((a, b) => a - b)[0]];
      next[d] = defaultTime;
      return next;
    });
  }, [cadence, defaultTime]);

  const setCad = (n: 1 | 2) => {
    setCadence(n);
    setDayTimes((prev) => {
      const keys = Object.keys(prev).map(Number).sort((a, b) => a - b).slice(0, n);
      const next: Record<number, string> = {};
      for (const k of keys) next[k] = prev[k];
      return next;
    });
  };

  const valid = !!(selId && weekdays.length === cadence && weekdays.every((d) => dayTimes[d]));

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/schedule/reschedule-batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: selId, days: weekdays.map((d) => ({ day: d, time: dayTimes[d] })) }),
      });
      const j = await res.json();
      if (j.ok) { onDone?.(); onClose(); }
      else setErr(j.errors?.join(', ') || j.message || j.error || 'Could not reschedule the batch.');
    } catch { setErr('Network error.'); }
    finally { setBusy(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Reschedule whole batch</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">You have no active batches to reschedule.</p>
        ) : (
          <>
            <label className="block text-xs font-bold text-slate-700 mb-3">Batch
              <select value={selId} onChange={(e) => setSelId(e.target.value)} className="mt-1 w-full min-h-[40px] px-2 rounded-lg border border-slate-200 text-sm">
                <option value="">Select a batch…</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.cohorts?.batch_code ? `${s.cohorts.batch_code} · ` : ''}{s.cohorts ? `${getTrackName(s.cohorts.track)} · ${s.cohorts.level} · ${s.cohorts.ratio}` : 'Batch'}
                  </option>
                ))}
              </select>
            </label>

            {selected && (
              <>
                <p className="text-xs text-slate-500 mb-3">
                  Currently: {selected.days_of_week.map((d) => WD[d]).join(', ')} · {selected.time_local.slice(0, 5)} {selected.timezone}
                </p>

                <div className="mb-3">
                  <span className="block text-xs font-bold text-slate-700 mb-1.5">Classes per week</span>
                  <div className="flex gap-2">
                    {([1, 2] as const).map((n) => (
                      <button key={n} onClick={() => setCad(n)}
                        className={`flex-1 min-h-[38px] rounded-lg text-sm font-bold border-2 ${cadence === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                        {n} {n === 1 ? 'day' : 'days'}/week
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="block text-xs font-bold text-slate-700 mb-1.5">New day{cadence === 2 ? 's' : ''} (pick {cadence})</span>
                  <div className="grid grid-cols-7 gap-1">
                    {WD.map((w, i) => (
                      <button key={w} onClick={() => toggleDay(i)}
                        className={`min-h-[38px] rounded-lg text-xs font-bold border-2 ${weekdays.includes(i) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {weekdays.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    <span className="block text-xs font-bold text-slate-700">Time each day</span>
                    {weekdays.map((d) => (
                      <div key={d} className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-xs font-bold text-slate-600">{WD[d]}</span>
                        <input type="time" value={dayTimes[d]} onChange={(e) => setDayTimes((p) => ({ ...p, [d]: e.target.value }))}
                          className="w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                  Future classes will move to the new day/time. Past and completed classes stay as they are.
                </p>
              </>
            )}

            {err && <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3"><p className="text-sm text-red-700">{err}</p></div>}

            <div className="flex gap-2">
              <button onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50">Cancel</button>
              <button onClick={submit} disabled={busy || !valid} className="flex-1 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Rescheduling…</> : <><Check className="w-4 h-4" /> Reschedule batch</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
