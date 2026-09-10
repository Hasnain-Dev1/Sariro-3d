'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CalendarPlus, CheckCircle2, Clock, AlertTriangle, Coins } from 'lucide-react';

/**
 * SARIRO — the lessons a teacher owes
 * ============================================================================
 * A child paid for lessons their group covered while their classes were
 * paused. Each is a separate half hour, and the only person who can arrange it
 * is their teacher.
 *
 * ── Why this is a panel and not a page ──────────────────────────────────────
 * §20: the teacher should not have to go looking. An obligation nobody is
 * shown is an obligation nobody meets, and the escalation three days later
 * would then be punishing them for our navigation.
 *
 * ── Why the deadline is on every row ────────────────────────────────────────
 * Each missed lesson carries its own clock, and scheduling one does not buy
 * time for the others. Showing a single "3 days left" for the student would be
 * a lie the moment one of them is arranged.
 */

interface CatchUpLesson {
  id: string;
  lessonNumber: number;
  lessonTitle: string | null;
  status: string;
  deadline: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
}

interface StudentRow {
  studentId: string;
  studentName: string;
  course: string | null;
  catchupCredits: number;
  lessons: CatchUpLesson[];
  summary: { unscheduled: number; scheduled: number; completed: number; daysOverdue: number; escalated: boolean };
}

/** How much of the window is left, in the words a person would use. */
function dueIn(deadline: string | null): { text: string; tone: 'ok' | 'soon' | 'late' } {
  if (!deadline) return { text: '', tone: 'ok' };
  const ms = Date.parse(deadline) - Date.now();
  if (!Number.isFinite(ms)) return { text: '', tone: 'ok' };
  if (ms <= 0) {
    const days = Math.floor(-ms / 86_400_000);
    return { text: days >= 1 ? `${days}d overdue` : 'overdue', tone: 'late' };
  }
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return { text: `${Math.max(1, hours)}h left`, tone: 'soon' };
  return { text: `${Math.floor(hours / 24)}d left`, tone: 'ok' };
}

const TONE = {
  ok: 'text-slate-500',
  soon: 'text-amber-700',
  late: 'text-red-700 font-bold',
} as const;

/** Local datetime-local value → ISO. */
const toIso = (local: string) => (local ? new Date(local).toISOString() : '');

export default function CatchUpPanel() {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [incentive, setIncentive] = useState(200);
  const [failed, setFailed] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/catchup');
      const json = await res.json();
      if (!json.ok) { setFailed(json.message ?? 'Could not load catch-up sessions.'); return; }
      setRows(json.students as StudentRow[]);
      setMinutes(json.minutes ?? 30);
      setIncentive(json.incentive ?? 200);
    } catch {
      setFailed('Could not load catch-up sessions.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = async (lessonId: string, action: 'schedule' | 'complete', slotStart?: string) => {
    setBusy(lessonId);
    setNote(null);
    try {
      const res = await fetch('/api/teacher/catchup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catchupLessonId: lessonId, slotStart }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) { setNote(json.message || json.error || 'That did not go through.'); return; }
      setNote(action === 'schedule'
        ? 'Session booked. The student has been told.'
        : `Marked done — ₹${json.incentive ?? incentive} added to your earnings.`);
      setOpenFor(null);
      setWhen('');
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

  const pending = rows.reduce((n, r) => n + r.summary.unscheduled, 0);
  const overdue = rows.filter((r) => r.summary.escalated).length;

  if (rows.length === 0) {
    return (
      <div className="card card--compact flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
        <p className="text-[13.5px] text-slate-600">
          Nothing outstanding. Every catch-up lesson has been arranged.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-[13.5px] text-slate-700">
          <span className="font-bold">{pending}</span> to schedule
          {overdue > 0 && (
            <span className="text-red-700 font-bold"> · {overdue} overdue</span>
          )}
        </p>
        <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" /> ₹{incentive} per completed session · {minutes} minutes
        </p>
      </div>

      {note && (
        <div className="card card--compact bg-slate-50">
          <p className="text-[13px] text-slate-700">{note}</p>
        </div>
      )}

      {rows.map((r) => (
        <div key={r.studentId} className="card card--compact">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-[14.5px]">{r.studentName}</span>
                {r.summary.escalated && (
                  <span className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase bg-red-100 text-red-700 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {r.summary.daysOverdue > 0 ? `${r.summary.daysOverdue}d overdue` : 'Overdue'}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                {r.course ?? 'No course on file'} · {r.catchupCredits} catch-up{' '}
                {r.catchupCredits === 1 ? 'credit' : 'credits'}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {r.lessons.map((l) => {
              const due = dueIn(l.deadline);
              const isOpen = openFor === l.id;
              return (
                <div key={l.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[13px] text-slate-800 min-w-0">
                      <span className="font-bold">Lesson {l.lessonNumber}</span>
                      {l.lessonTitle ? ` — ${l.lessonTitle}` : ''}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {l.status === 'completed' ? (
                        <span className="text-[11px] font-bold text-green-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : l.status === 'scheduled' ? (
                        <>
                          <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {l.scheduledAt
                              ? new Date(l.scheduledAt).toLocaleString([], {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                })
                              : 'Scheduled'}
                          </span>
                          <button
                            onClick={() => void act(l.id, 'complete')}
                            disabled={busy === l.id}
                            className="h-7 px-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold disabled:opacity-50"
                            style={{ fontFamily: 'var(--font-grotesk)' }}
                          >
                            {busy === l.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark done'}
                          </button>
                        </>
                      ) : (
                        <>
                          {due.text && (
                            <span className={`text-[11px] ${TONE[due.tone]}`}>{due.text}</span>
                          )}
                          {!isOpen && (
                            <button
                              onClick={() => { setOpenFor(l.id); setWhen(''); setNote(null); }}
                              className="h-7 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                              style={{ fontFamily: 'var(--font-grotesk)' }}
                            >
                              <CalendarPlus className="w-3 h-3" /> Schedule
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                      <input
                        type="datetime-local"
                        value={when}
                        autoFocus
                        onChange={(e) => setWhen(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 px-2.5 text-[13px]"
                      />
                      <button
                        onClick={() => void act(l.id, 'schedule', toIso(when))}
                        disabled={!when || busy === l.id}
                        className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        {busy === l.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Book {minutes} min
                      </button>
                      <button
                        onClick={() => { setOpenFor(null); setNote(null); }}
                        className="h-9 px-3 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-50"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
