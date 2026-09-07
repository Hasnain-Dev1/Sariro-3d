'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock, Plus, Trash2, Loader2, AlertCircle, CalendarCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import {
  WEEKDAYS, parseTime, formatTime, formatTime12, checkWindow, mergeWindows,
  describeWindows, weeklyHours, byWeekday, type Window,
} from '@/lib/scheduling/availability';

/**
 * SARIRO — "Monday 5-6 and 8-10", said once
 * ============================================================================
 * Until now a teacher had nowhere to say when they could teach, so every trial
 * was arranged by message and nobody booking could see whether a slot was
 * really free. This is the one place that changes.
 *
 * ── Only the teacher writes these ───────────────────────────────────────────
 * The RLS policy allows a teacher to change their own hours and nobody else's,
 * including admins. An admin who disagrees with a teacher's availability needs
 * to have a conversation, not edit the row underneath them — and a teacher who
 * finds their hours quietly changed stops trusting the rota entirely.
 *
 * ── Times are typed, not picked ─────────────────────────────────────────────
 * A time picker on mobile is four taps. Typing "5pm" is three characters, and
 * parseTime accepts "17:00", "5pm", "5 PM", "1700" and "5:30pm" — the shapes
 * people actually type. It is strict about the result and generous about the
 * input, which is the right way round.
 */

const DEFAULT_START = '17:00';
const DEFAULT_END = '18:00';

export default function AvailabilityEditor() {
  const supabase = createClient();
  const { user } = useAuth();

  const [rows, setRows] = useState<Window[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [day, setDay] = useState(1); // Monday — the day most people start with
  const [start, setStart] = useState(DEFAULT_START);
  const [end, setEnd] = useState(DEFAULT_END);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('teacher_availability')
        .select('weekday, start_minute, end_minute')
        .eq('teacher_id', user.id)
        .order('weekday')
        .order('start_minute');
      if (err) throw err;
      setRows(
        (data ?? []).map((r) => ({
          weekday: r.weekday as number,
          start: r.start_minute as number,
          end: r.end_minute as number,
        }))
      );
    } catch (err) {
      // The table is created by scripts/trial-booking.sql. Say which, rather
      // than leaving an empty card that looks like "you have no hours".
      const msg = err instanceof Error ? err.message : '';
      setError(
        /does not exist|schema cache/i.test(msg)
          ? 'Availability is not set up on the database yet — run scripts/trial-booking.sql.'
          : 'Could not load your hours. Please refresh.'
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    setError(null);
    const s = parseTime(start);
    const e = parseTime(end);
    if (s === null || e === null) {
      setError('Use a time like 5pm, 17:00 or 5:30pm.');
      return;
    }
    const check = checkWindow(s, e);
    if (!check.ok) { setError(check.reason); return; }

    /* Merged against what is already saved for that day, so 5-6 plus 6-7
       becomes one 5-7 row rather than two touching ones. Everything else
       treats them as merged anyway; storing them apart just leaves a seam. */
    const existing = rows.filter((r) => r.weekday === day).map((r) => ({ start: r.start, end: r.end }));
    const merged = mergeWindows([...existing, { start: s, end: e }]);

    setBusy(true);
    try {
      const { error: delErr } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', user!.id)
        .eq('weekday', day);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase.from('teacher_availability').insert(
        merged.map((w) => ({
          teacher_id: user!.id,
          weekday: day,
          start_minute: w.start,
          end_minute: w.end,
        }))
      );
      if (insErr) throw insErr;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that window.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (w: Window) => {
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', user!.id)
        .eq('weekday', w.weekday)
        .eq('start_minute', w.start)
        .eq('end_minute', w.end);
      if (err) throw err;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that window.');
    } finally {
      setBusy(false);
    }
  };

  const days = byWeekday(rows);
  const hours = weeklyHours(rows);

  return (
    <div className="pt-5 border-t border-slate-100">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Clock className="w-4 h-4 text-blue-600" />
            When you can teach
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Admins and sellers book trial classes into these hours. Nobody else can change them.
          </p>
        </div>
        {hours > 0 && (
          <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
                style={{ fontFamily: 'var(--font-grotesk)' }}>
            {hours}h / week
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your hours…
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-1.5">
            {days.map((windows, weekday) => (
              <div key={weekday} className="flex items-start gap-3 py-1.5">
                <span className="w-24 shrink-0 text-xs font-bold text-slate-700 pt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {WEEKDAYS[weekday]}
                </span>
                {windows.length === 0 ? (
                  <span className="text-xs text-slate-300 pt-1">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {windows.map((w) => (
                      <span
                        key={`${weekday}-${w.start}`}
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-800 text-[11px] font-bold"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        {formatTime12(w.start)} – {formatTime12(w.end)}
                        <button
                          onClick={() => remove({ weekday, start: w.start, end: w.end })}
                          disabled={busy}
                          aria-label={`Remove ${WEEKDAYS[weekday]} ${formatTime(w.start)} to ${formatTime(w.end)}`}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-green-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              disabled={busy}
              className="h-10 px-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={busy}
              placeholder="5pm"
              aria-label="Start time"
              className="h-10 w-20 px-2 rounded-lg border border-slate-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={busy}
              placeholder="6pm"
              aria-label="End time"
              className="h-10 w-20 px-2 rounded-lg border border-slate-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <button
              onClick={add}
              disabled={busy}
              className="h-10 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>

          {error && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          {rows.length === 0 && !error && (
            <p className="mt-2 text-[11px] text-amber-700 flex items-start gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 shrink-0 mt-px" />
              Until you add at least one window, no trial class can be booked with you.
            </p>
          )}

          <p className="mt-3 text-[11px] text-slate-400">
            These are your local times{' '}
            <span className="font-semibold">
              ({describeWindows(days[1]) === 'Not available' ? 'set your timezone above' : 'in the timezone set above'})
            </span>
            . They repeat every week.
          </p>
        </>
      )}
    </div>
  );
}
