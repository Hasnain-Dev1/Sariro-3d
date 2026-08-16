'use client';

/**
 * SARIRO — CancelClassModal
 *
 * Role-aware class disruption. Teachers/admins pick ONE of two actions:
 *   • Cancel this class — planned leave (zero pay) or an HR-approved doubt
 *     session (full pay); students get a simple confirm (>= 2h before a 1:1).
 *   • Move this class — reschedule THIS single class to a chosen day/time. The
 *     server keeps lesson order: the new slot must fall AFTER the previous class
 *     and BEFORE the next class starts. Teacher/admin only.
 * The server enforces every rule — this UI just collects intent and surfaces
 * the policy error if one applies.
 */

import { useMemo, useState } from 'react';
import { X, Ban, Loader2, CalendarClock } from 'lucide-react';
import { zonedWallTimeToUTC } from '@/lib/dashboard/schedule-generation';
import { formatDayTime } from '@/lib/dashboard/tz-format';

interface Booking { id: string; slot_start: string }

type Action = 'cancel' | 'move';

export function CancelClassModal({
  open, onClose, booking, role, timezone = null, onDone,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  role: 'teacher' | 'student' | 'admin';
  timezone?: string | null;
  onDone?: () => void;
}) {
  const canMove = role === 'teacher' || role === 'admin';
  const [action, setAction] = useState<Action>('cancel');
  const [cancelType, setCancelType] = useState<'teacher_leave' | 'doubt_session'>('teacher_leave');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Interpret the picked wall-clock in the schedule timezone → exact UTC instant.
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
    setBusy(true); setErr(null);
    try {
      if (action === 'move') {
        if (!newStartIso) { setErr('Pick a new date and time.'); setBusy(false); return; }
        const res = await fetch('/api/schedule/reschedule', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            newStart: newStartIso,
            initiator: role === 'admin' ? 'admin' : 'teacher',
            reason: reason.trim() || undefined,
          }),
        });
        const j = await res.json();
        if (j.ok) { onDone?.(); onClose(); }
        else setErr(j.message || j.error || 'Could not move the class.');
      } else {
        const res = await fetch('/api/schedule/cancel', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            cancelType: role === 'teacher' ? cancelType : undefined,
            reason: reason.trim() || undefined,
          }),
        });
        const j = await res.json();
        if (j.ok) { onDone?.(); onClose(); }
        else setErr(j.message || j.error || 'Could not cancel.');
      }
    } catch { setErr('Network error.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {action === 'move' ? <CalendarClock className="w-5 h-5 text-blue-600" /> : <Ban className="w-5 h-5 text-red-600" />}
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {action === 'move' ? 'Move class' : 'Cancel class'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Currently: <span className="font-bold text-slate-700">{formatDayTime(booking.slot_start, timezone)}</span>
          {timezone ? <span className="text-slate-400"> · {timezone}</span> : null}
        </p>

        {/* Action picker — teacher/admin can either cancel or move this one class */}
        {canMove && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setAction('cancel')}
              className={`min-h-[44px] rounded-lg text-sm font-bold border-2 ${action === 'cancel' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'}`}>
              Cancel this class
            </button>
            <button onClick={() => setAction('move')}
              className={`min-h-[44px] rounded-lg text-sm font-bold border-2 ${action === 'move' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
              Move to another day
            </button>
          </div>
        )}

        {action === 'move' ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="block text-xs font-bold text-slate-700">New date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
              </label>
              <label className="block text-xs font-bold text-slate-700">New time
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
              </label>
            </div>
            {newStartIso && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 mb-3 text-sm">
                Moves to: <span className="font-bold text-slate-900">{formatDayTime(newStartIso, timezone)}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mb-3">
              The new slot must be <span className="font-semibold">before the next class</span> — lesson order stays intact.
            </p>
            <label className="block text-xs font-bold text-slate-700 mb-4">Reason (optional)
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
            </label>
          </>
        ) : (
          <>
            {role === 'teacher' && (
              <label className="block text-xs font-bold text-slate-700 mb-3">Reason type
                <select value={cancelType} onChange={(e) => setCancelType(e.target.value as 'teacher_leave' | 'doubt_session')} className="mt-1 w-full min-h-[40px] px-2 rounded-lg border border-slate-200 text-sm">
                  <option value="teacher_leave">Planned leave (no pay)</option>
                  <option value="doubt_session">HR-approved doubt session (full pay)</option>
                </select>
              </label>
            )}

            {role === 'student' && (
              <p className="text-xs text-slate-500 mb-3">1:1 classes can only be cancelled at least 2 hours before the start time.</p>
            )}

            <label className="block text-xs font-bold text-slate-700 mb-4">Reason (optional)
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
            </label>
          </>
        )}

        {err && <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3"><p className="text-sm text-red-700">{err}</p></div>}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50">Keep class</button>
          {action === 'move' ? (
            <button onClick={submit} disabled={busy || !newStartIso} className="flex-1 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Moving…</> : <><CalendarClock className="w-4 h-4" /> Move class</>}
            </button>
          ) : (
            <button onClick={submit} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : <><Ban className="w-4 h-4" /> Cancel class</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
