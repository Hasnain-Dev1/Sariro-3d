'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, HelpCircle, CheckCircle2, UserX, AlertTriangle } from 'lucide-react';

/**
 * SARIRO — the classes nobody can prove happened
 * ============================================================================
 * A class is over, still marked scheduled, and the teacher never pressed
 * Start. Two readings, ₹1,250 apart:
 *
 *   it happened and nobody touched the button   → pay in full
 *   the teacher never turned up                 → −₹1,000
 *
 * No timestamp separates them, because the missing timestamp is the whole
 * problem. The stale-class job closes what it can prove and refuses to guess
 * at the rest — fining a teacher a thousand rupees for a class they taught
 * costs their trust in every other rule we have.
 *
 * So this is the human's queue. It exists to be emptied, and if it is empty it
 * says so and takes up one line.
 */

interface UnresolvedClass {
  bookingId: string;
  slotStart: string;
  isTrial: boolean;
  lessonName: string | null;
  teacherName: string | null;
  batch: string | null;
  course: string | null;
  seats: number | null;
  attendance: { present: number; absent: number; total: number };
  hint: string;
  hoursAgo: number;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString([], {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export default function UnresolvedClassesPanel() {
  const [rows, setRows] = useState<UnresolvedClass[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/unresolved-classes');
      const json = await res.json();
      if (!json.ok) { setFailed(json.message ?? 'Could not load these.'); return; }
      setRows(json.classes as UnresolvedClass[]);
    } catch {
      setFailed('Could not load these.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async (row: UnresolvedClass, happened: boolean) => {
    setBusy(row.bookingId);
    setNote(null);
    try {
      /* Both routes already exist and both gate the decision server-side. The
         panel chooses which question is being answered; it does not get to
         answer it on the server's behalf. */
      const res = happened
        ? await fetch('/api/teacher/complete-class', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: row.bookingId, outcome: 'completed' }),
          })
        : await fetch('/api/booking/finalize-noshow', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: row.bookingId }),
          });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setNote(json.message || json.error || 'That did not go through.');
        return;
      }
      setNote(happened
        ? `Marked complete — ${row.teacherName ?? 'the teacher'} is paid for it.`
        : `Recorded as a teacher no-show — ₹1,000 withheld from ${row.teacherName ?? 'the teacher'}.`);
      await load();
    } catch {
      setNote('Network error — please try again.');
    } finally {
      setBusy(null);
    }
  };

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
          Nothing waiting. Every finished class has been marked one way or the other.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#B45309' }} />
        <p className="text-[13.5px] text-slate-700">
          <span className="font-bold">{rows.length}</span>{' '}
          {rows.length === 1 ? 'class is' : 'classes are'} over with no start recorded.
          Each one is either a class that happened and was never marked, or a teacher who
          did not turn up. Nothing decides this on its own.
        </p>
      </div>

      {note && (
        <div className="card card--compact bg-slate-50">
          <p className="text-[13px] text-slate-700">{note}</p>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.bookingId} className="card card--compact">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-[14.5px]">
                    {r.teacherName ?? 'Unassigned teacher'}
                  </span>
                  {r.isTrial && (
                    <span className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase bg-teal-100 text-teal-700">
                      Trial{r.seats ? ` · ${r.seats}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-slate-500 mt-0.5">
                  {when(r.slotStart)}
                  {r.course ? ` · ${r.course}` : ''}
                  {r.batch ? ` · ${r.batch}` : ''}
                  {r.lessonName ? ` · ${r.lessonName}` : ''}
                </p>
                <p className="text-[12.5px] text-slate-600 mt-1 flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                  {r.hint}
                  {r.attendance.total > 0 && (
                    <span className="text-slate-400">
                      {' '}({r.attendance.present} present, {r.attendance.absent} absent)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
                {r.hoursAgo}h ago
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => void decide(r, true)}
                disabled={busy === r.bookingId}
                className="h-9 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {busy === r.bookingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                It happened — pay in full
              </button>
              <button
                onClick={() => void decide(r, false)}
                disabled={busy === r.bookingId}
                className="h-9 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <UserX className="w-3.5 h-3.5" />
                Teacher no-show — withhold ₹1,000
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
