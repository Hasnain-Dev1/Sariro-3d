'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Mail, Phone } from 'lucide-react';

/**
 * SARIRO — the catch-up sessions nobody has arranged
 * ============================================================================
 * This panel exists to be empty.
 *
 * For the first three days a catch-up obligation is entirely between a teacher
 * and their reminders. Only a missed deadline puts a case here — because a
 * panel that listed every obligation would be ignored within a fortnight, and
 * then the one case that genuinely needed a person would be buried in forty
 * that did not.
 *
 * ── One row answers "who do I ring" ─────────────────────────────────────────
 * §34: the student, the teacher, the teacher's own admin and their HR contact,
 * together. The question being asked here is never "what is late" — it is who
 * has not done something about it, and that answer used to require opening
 * three different modules.
 *
 * ── And it closes itself ────────────────────────────────────────────────────
 * §35: when the teacher schedules the last outstanding session the case stops
 * being returned at all. Nobody marks it resolved, because nobody should have
 * to tidy away a problem that has already gone.
 */

interface OverdueCase {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  course: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  teacherPhone: string | null;
  adminName: string | null;
  adminEmail: string | null;
  hrName: string | null;
  hrEmail: string | null;
  summary: {
    total: number; scheduled: number; unscheduled: number; completed: number;
    daysOverdue: number; earliestDeadline: string | null; level: string;
    pending: { id: string; lessonNumber: number; lessonTitle?: string | null }[];
  };
}

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Who is on the hook now. The level is decided server-side; this only names it. */
const LEVEL_LABEL: Record<string, { text: string; cls: string }> = {
  admin: { text: 'With their admin', cls: 'bg-amber-100 text-amber-800' },
  hr: { text: 'Escalated to HR', cls: 'bg-red-100 text-red-700' },
  teacher: { text: 'With the teacher', cls: 'bg-slate-100 text-slate-600' },
};

function Contact({ label, name, email, phone }: {
  label: string; name: string | null; email: string | null; phone?: string | null;
}) {
  if (!name && !email) {
    return (
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {/* Said out loud rather than left blank: an unassigned teacher is
            itself the thing that needs fixing. */}
        <p className="text-[12.5px] text-slate-400 italic mt-0.5">Nobody assigned</p>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[13px] font-bold text-slate-800 truncate mt-0.5">{name ?? '—'}</p>
      {email && (
        <a href={`mailto:${email}`} className="text-[11.5px] text-blue-600 hover:underline truncate flex items-center gap-1">
          <Mail className="w-3 h-3 shrink-0" /> {email}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="text-[11.5px] text-slate-500 hover:underline flex items-center gap-1">
          <Phone className="w-3 h-3 shrink-0" /> {phone}
        </a>
      )}
    </div>
  );
}

export default function CatchUpOverduePanel() {
  const [cases, setCases] = useState<OverdueCase[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/catchup-overdue');
      const json = await res.json();
      if (!json.ok) { setFailed(json.message ?? 'Could not load these.'); return; }
      setCases(json.cases as OverdueCase[]);
    } catch {
      setFailed('Could not load these.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (failed) {
    return <div className="card card--compact"><p className="text-[13px] text-slate-600">{failed}</p></div>;
  }
  if (!cases) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (cases.length === 0) {
    return (
      <div className="card card--compact flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
        <p className="text-[13.5px] text-slate-600">
          Nothing overdue. Every catch-up session is either arranged or still inside
          its three-day window.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
        <p className="text-[13.5px] text-slate-700">
          <span className="font-bold">{cases.length}</span>{' '}
          {cases.length === 1 ? 'student is' : 'students are'} waiting on a catch-up session
          that should already have been arranged.
        </p>
      </div>

      {cases.map((c) => {
        const level = LEVEL_LABEL[c.summary.level] ?? LEVEL_LABEL.teacher;
        return (
          <div key={`${c.studentId}-${c.teacherName}`} className="card card--compact">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-[15px]">{c.studentName}</span>
                  <span className={`text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase ${level.cls}`}>
                    {level.text}
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500 mt-0.5">
                  {c.course ?? 'No course on file'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-extrabold text-red-700 tabular-nums leading-none">
                  {c.summary.daysOverdue}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {c.summary.daysOverdue === 1 ? 'day over' : 'days over'}
                </p>
              </div>
            </div>

            {/* §36 — scheduling three of five is progress, not completion, and
                the numbers have to say so. */}
            <div className="mt-3 flex items-center gap-3 flex-wrap text-[12.5px] text-slate-600">
              <span><b className="text-slate-900">{c.summary.unscheduled}</b> unscheduled</span>
              <span className="text-slate-300">·</span>
              <span>{c.summary.scheduled} scheduled</span>
              <span className="text-slate-300">·</span>
              <span>{c.summary.completed} done</span>
              <span className="text-slate-300">·</span>
              <span>deadline was {day(c.summary.earliestDeadline)}</span>
            </div>

            {c.summary.pending.length > 0 && (
              <p className="mt-2 text-[12.5px] text-slate-700">
                Waiting:{' '}
                {c.summary.pending.map((p) => `Lesson ${p.lessonNumber}`).join(', ')}
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Contact label="Student" name={c.studentName} email={c.studentEmail} phone={c.studentPhone} />
              <Contact label="Teacher" name={c.teacherName} email={c.teacherEmail} phone={c.teacherPhone} />
              <Contact label="Their admin" name={c.adminName} email={c.adminEmail} />
              <Contact label="Their HR" name={c.hrName} email={c.hrEmail} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
