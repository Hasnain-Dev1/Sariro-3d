'use client';

/**
 * SARIRO — RescheduleModal
 *
 * Teacher/admin moves one class. The picked date + time are interpreted in the
 * viewer's schedule timezone (DST-correct via zonedWallTimeToUTC), the teacher
 * must state who initiated (student vs teacher), and the server enforces that
 * the new slot can't jump past the next class.
 */

import { useMemo, useState } from 'react';
import { X, CalendarClock, Loader2, Check } from 'lucide-react';
import { zonedWallTimeToUTC } from '@/lib/dashboard/schedule-generation';
import { formatDayTime } from '@/lib/dashboard/tz-format';

interface Booking { id: string; slot_start: string; slot_end: string }

export function RescheduleModal({
  open, onClose, booking, timezone, isAdmin = false, onDone,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  timezone: string | null;
  isAdmin?: boolean;
  onDone?: () => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [initiator, setInitiator] = useState<'student' | 'teacher' | 'admin'>(isAdmin ? 'admin' : 'teacher');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const durationMin = useMemo(() => {
    if (!booking) return 60;
    return Math.max(15, Math.round((new Date(booking.slot_end).getTime() - new Date(booking.slot_start).getTime()) / 60_000));
  }, [booking]);

  // Interpret the wall-clock pick in the schedule timezone → exact UTC instant.
  const newStartIso = useMemo(() => {
    if (!date || !time) return null;
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    try {
      return zonedWallTimeToUTC(y, m, d, hh, mm, timezone || 'UTC').toISOString();
    } catch { return null; }
  }, [date, time, timezone]);

  if (!open || !booking) return null;

  const submit = async () => {
    if (!newStartIso) { setErr('Pick a date and time.'); return; }
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/schedule/reschedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, newStart: newStartIso, durationMin, initiator, reason: reason.trim() || undefined }),
      });
      const j = await res.json();
      if (j.ok) { onDone?.(); onClose(); }
      else setErr(j.message || j.error || 'Could not reschedule.');
    } catch { setErr('Network error.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Reschedule class</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Currently: <span className="font-bold text-slate-700">{formatDayTime(booking.slot_start, timezone)}</span>
          {timezone ? <span className="text-slate-400"> · {timezone}</span> : null}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block text-xs font-bold text-slate-700">New date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
          </label>
          <label className="block text-xs font-bold text-slate-700">New time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
          </label>
        </div>

        <label className="block text-xs font-bold text-slate-700 mb-3">Who requested this?
          <select value={initiator} onChange={(e) => setInitiator(e.target.value as 'student' | 'teacher' | 'admin')} className="mt-1 w-full min-h-[40px] px-2 rounded-lg border border-slate-200 text-sm">
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            {isAdmin && <option value="admin">Admin</option>}
          </select>
        </label>

        <label className="block text-xs font-bold text-slate-700 mb-4">Reason (optional)
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
        </label>

        {newStartIso && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 mb-3 text-sm">
            New time: <span className="font-bold text-slate-900">{formatDayTime(newStartIso, timezone)}</span>
          </div>
        )}
        {err && <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3"><p className="text-sm text-red-700">{err}</p></div>}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={busy || !newStartIso} className="flex-1 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Reschedule</>}
          </button>
        </div>
      </div>
    </div>
  );
}
