'use client';

/**
 * SARIRO — BatchRescheduleModal ("Change schedule")
 *
 * Reschedule a WHOLE batch going forward: pick the batch, choose the date the
 * new cadence starts from ("Apply from" — a future date leaves a break), then
 * set new weekday(s) + time per day (seeded with the current values, fully
 * editable). Upcoming classes regenerate; past classes are untouched.
 * Calls /api/schedule/reschedule-batch.
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
  open, onClose, onDone, presetScheduleId,
}: { open: boolean; onClose: () => void; onDone?: () => void; presetScheduleId?: string | null }) {
  const [schedules, setSchedules] = useState<Sched[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState('');
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [defaultTime, setDefaultTime] = useState('17:00');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));
    fetch('/api/schedule/reschedule-batch').then((r) => r.json()).then((j) => {
      if (cancelled) return;
      const list: Sched[] = j.ok ? j.schedules : [];
      setSchedules(list);
      // Preselect when opened for a specific batch (admin per-row "Change schedule").
      if (presetScheduleId && list.some((s) => s.id === presetScheduleId)) setSelId(presetScheduleId);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, presetScheduleId]);

  const selected = useMemo(() => schedules.find((s) => s.id === selId), [schedules, selId]);

  // Seed the editor from the chosen batch's CURRENT days + time — so "keep the
  // same schedule" just means: don't touch the days, only pick a new start date.
  useEffect(() => {
    if (!selected) return;
    const seed: Record<number, string> = {};
    for (const d of selected.days_of_week) seed[d] = selected.time_local.slice(0, 5);
    Promise.resolve().then(() => {
      setDayTimes(seed);
      setDefaultTime(selected.time_local.slice(0, 5) || '17:00');
      setEffectiveFrom((prev) => prev || todayStr);
    });
  }, [selected, todayStr]);

  const weekdays = useMemo(() => Object.keys(dayTimes).map(Number).sort((a, b) => a - b), [dayTimes]);

  // Free toggle: pick any 1–7 weekdays; each keeps its own time.
  const toggleDay = useCallback((d: number) => {
    setDayTimes((prev) => {
      const next = { ...prev };
      if (d in next) delete next[d];
      else next[d] = defaultTime;
      return next;
    });
  }, [defaultTime]);

  // Quick presets: N classes/week using the most common weekday templates.
  const applyPreset = useCallback((n: number) => {
    const templates: Record<number, number[]> = {
      1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5],
      6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6],
    };
    setDayTimes((prev) => {
      const next: Record<number, string> = {};
      for (const d of templates[n] ?? [1]) next[d] = prev[d] ?? defaultTime;
      return next;
    });
  }, [defaultTime]);

  const valid = !!(selId && weekdays.length >= 1 && weekdays.length <= 7 && weekdays.every((d) => dayTimes[d]) && effectiveFrom);

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/schedule/reschedule-batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: selId, days: weekdays.map((d) => ({ day: d, time: dayTimes[d] })), effectiveFrom: effectiveFrom || undefined }),
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
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Change schedule</h3>
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

                <label className="block text-xs font-bold text-slate-700 mb-1.5">Apply from
                  <input type="date" value={effectiveFrom} min={todayStr} onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  The new schedule starts on this date. Pick a later date to give the student a <span className="font-semibold text-slate-600">break</span> until then — classes in between are cleared.
                </p>

                <div className="mb-3">
                  <span className="block text-xs font-bold text-slate-700 mb-1.5">Quick pick</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <button key={n} onClick={() => applyPreset(n)}
                        className={`min-h-[34px] px-2.5 rounded-lg text-xs font-bold border-2 ${weekdays.length === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                        {n === 7 ? 'Every day' : `${n}/wk`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="block text-xs font-bold text-slate-700 mb-1.5">Days (pick any 1–7)</span>
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
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save schedule</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
