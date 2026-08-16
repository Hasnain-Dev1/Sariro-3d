'use client';

/**
 * SARIRO — CancelClassModal
 *
 * Role-aware class disruption. Teachers/admins pick ONE of two actions:
 *   • Cancel this class — planned leave (zero pay) or an HR-approved doubt
 *     session (full pay); students get a simple confirm (>= 2h before a 1:1).
 *   • Shift by 1 day — slide THIS class and every class after it forward one
 *     day, keeping lesson order intact (the whole batch moves). Teacher- or
 *     admin-initiated only.
 * The server enforces every rule — this UI just collects intent and surfaces
 * the policy error if one applies.
 */

import { useState } from 'react';
import { X, Ban, Loader2, CalendarClock } from 'lucide-react';

interface Booking { id: string; slot_start: string }

type Action = 'cancel' | 'shift';

export function CancelClassModal({
  open, onClose, booking, role, onDone,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  role: 'teacher' | 'student' | 'admin';
  onDone?: () => void;
}) {
  const canShift = role === 'teacher' || role === 'admin';
  const [action, setAction] = useState<Action>('cancel');
  const [cancelType, setCancelType] = useState<'teacher_leave' | 'doubt_session'>('teacher_leave');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open || !booking) return null;

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      if (action === 'shift') {
        const res = await fetch('/api/schedule/shift-following', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id, days: 1 }),
        });
        const j = await res.json();
        if (j.ok) { onDone?.(); onClose(); }
        else setErr(j.message || j.error || 'Could not shift the classes.');
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
            {action === 'shift' ? <CalendarClock className="w-5 h-5 text-blue-600" /> : <Ban className="w-5 h-5 text-red-600" />}
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {action === 'shift' ? 'Shift classes' : 'Cancel class'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        {/* Action picker — teacher/admin can either cancel or slide the batch a day */}
        {canShift && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setAction('cancel')}
              className={`min-h-[44px] rounded-lg text-sm font-bold border-2 ${action === 'cancel' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'}`}>
              Cancel this class
            </button>
            <button onClick={() => setAction('shift')}
              className={`min-h-[44px] rounded-lg text-sm font-bold border-2 ${action === 'shift' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
              Shift by 1 day
            </button>
          </div>
        )}

        {action === 'shift' ? (
          <p className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-4">
            This class and every class after it move forward by <span className="font-bold">one day</span>. Past and completed classes stay as they are.
          </p>
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
          {action === 'shift' ? (
            <button onClick={submit} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Shifting…</> : <><CalendarClock className="w-4 h-4" /> Shift by 1 day</>}
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
