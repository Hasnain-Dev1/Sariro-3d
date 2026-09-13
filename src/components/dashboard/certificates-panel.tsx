'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Award, Search, Loader2, ExternalLink, Undo2, CheckCircle2, AlertTriangle, GraduationCap, X } from 'lucide-react';
import type { StaffStudent, StaffEnrolment } from '@/lib/certificates/staff-types';

/**
 * SARIRO — issuing certificates (admin, super admin, HR)
 * ============================================================================
 * Find the student, see their courses with how far through the lessons they
 * are, and issue the certificate for the one they have finished. It appears on
 * their dashboard straight away. Trial certificates are listed too: those are
 * earned automatically, and this is where staff open one to print for a parent.
 *
 * Issuing asks first, and says what it changes — a completed course stops
 * being charged class credits — because the button is one click from the
 * wrong child. Withdrawing is always available, and both are in the audit log.
 */

const STATUS_TONE: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  dropped: 'bg-slate-100 text-slate-500 border-slate-200',
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

type Pending = { enrolment: StaffEnrolment; student: StaffStudent; action: 'issue' | 'withdraw' };

export default function CertificatesPanel() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StaffStudent[] | null>(null);
  const [mode, setMode] = useState<'recent' | 'search'>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string; href?: string | null } | null>(null);
  /* The latest search wins. Typing "aan" then "aanya" must not let the slower
     "aan" answer land last and overwrite the right list. */
  const latest = useRef(0);

  const load = useCallback(async (q: string) => {
    const ticket = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/certificates${q.trim().length >= 2 ? `?q=${encodeURIComponent(q.trim())}` : ''}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (ticket !== latest.current) return;
      if (!res.ok || !json?.ok) {
        setError(json?.message ?? 'Could not load certificates.');
        setStudents([]);
        return;
      }
      setStudents(json.students as StaffStudent[]);
      setMode(json.mode);
    } catch {
      if (ticket === latest.current) setError('Could not reach the server. Check your connection.');
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(query); }, query ? 350 : 0);
    return () => window.clearTimeout(id);
  }, [query, load]);

  const confirm = async () => {
    if (!pending) return;
    setWorking(true);
    try {
      const res = await fetch('/api/staff/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: pending.enrolment.id, action: pending.action }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setNotice({ kind: 'err', text: json?.message ?? 'That did not go through.' });
      } else if (pending.action === 'issue') {
        setNotice({
          kind: 'ok',
          text: `Certificate issued to ${pending.student.name} for ${pending.enrolment.trackName}. It is on their dashboard now.`,
          href: json.certificateUrl,
        });
      } else {
        setNotice({ kind: 'ok', text: `Certificate withdrawn. ${pending.student.name}'s ${pending.enrolment.trackName} course is active again.` });
      }
      setPending(null);
      await load(query);
    } catch {
      setNotice({ kind: 'err', text: 'Could not reach the server. Nothing was changed.' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="card-3d p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Certificates</h3>
            <p className="text-xs text-slate-500">Issue a course certificate, or open any certificate to print.</p>
          </div>
        </div>
        <label className="sm:ml-auto relative block sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a student by name or email"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </label>
      </div>

      {notice && (
        <div className={`mb-4 rounded-xl border px-3 py-2.5 text-sm flex items-start gap-2 ${notice.kind === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {notice.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span className="flex-1">
            {notice.text}
            {notice.href && (
              <a href={notice.href} target="_blank" rel="noreferrer" className="ml-2 font-bold underline underline-offset-2">Open certificate</a>
            )}
          </span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss" className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 mb-2">
        {mode === 'search' && query.trim().length >= 2 ? 'Search results' : 'Recently issued'}
      </p>

      {loading && !students ? (
        <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></div>
      ) : error ? (
        <p className="text-sm text-red-600 py-4">{error}</p>
      ) : !students || students.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          {query.trim().length >= 2
            ? `No one matches "${query.trim()}".`
            : 'No course certificates issued yet. Search for a student to issue one.'}
        </p>
      ) : (
        <div className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          {students.map((s) => (
            <StudentCard key={s.id} student={s} onAct={(enrolment, action) => { setNotice(null); setPending({ enrolment, student: s, action }); }} />
          ))}
        </div>
      )}

      {pending && (
        <ConfirmDialog pending={pending} working={working} onCancel={() => setPending(null)} onConfirm={confirm} />
      )}
    </div>
  );
}

function StudentCard({
  student, onAct,
}: {
  student: StaffStudent;
  onAct: (enrolment: StaffEnrolment, action: 'issue' | 'withdraw') => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold text-slate-900">{student.name}</p>
        {student.email && <p className="text-xs text-slate-500 truncate">{student.email}</p>}
      </div>

      {student.enrolments.length === 0 && student.trials.length === 0 && (
        <p className="mt-2 text-xs text-slate-400">No courses or trial classes on this account.</p>
      )}

      {student.enrolments.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100">
          {student.enrolments.map((e) => {
            const pct = e.progress.total > 0 ? Math.round((e.progress.done / e.progress.total) * 100) : null;
            return (
              <li key={e.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    {e.trackName}
                    {e.level && <span className="text-xs font-normal text-slate-500 capitalize">· {e.level}</span>}
                    <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_TONE[e.status] ?? STATUS_TONE.dropped}`}>
                      {e.status === 'completed' ? 'Certificate issued' : e.status}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Started {fmtDate(e.startedAt)}
                    {pct !== null && ` · lessons ticked ${e.progress.done} of ${e.progress.total} (${pct}%)`}
                    {e.status === 'completed' && ` · issued ${fmtDate(e.completedAt)}${e.issuedBy ? ` by ${e.issuedBy}` : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.status === 'active' && (
                    <button
                      onClick={() => onAct(e, 'issue')}
                      className="h-9 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" /> Issue certificate
                    </button>
                  )}
                  {e.certificateUrl && (
                    <a
                      href={e.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View / print
                    </a>
                  )}
                  {e.status === 'completed' && (
                    <button
                      onClick={() => onAct(e, 'withdraw')}
                      className="h-9 px-2.5 rounded-lg text-xs font-bold text-slate-500 hover:text-red-700 hover:bg-red-50 inline-flex items-center gap-1"
                      title="Withdraw the certificate and make the course active again"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Withdraw
                    </button>
                  )}
                  {e.status === 'dropped' && <span className="text-xs text-slate-400">Dropped — re-activate first</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {student.trials.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mb-1">Trial classes</p>
          <ul className="space-y-1">
            {student.trials.map((t) => (
              <li key={t.bookingId} className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">{t.subject}</span>
                <span>· {fmtDate(t.classDate)}</span>
                {t.certificateUrl ? (
                  <a href={t.certificateUrl} target="_blank" rel="noreferrer" className="font-bold text-violet-700 hover:underline inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Trial certificate
                  </a>
                ) : (
                  <span className="text-slate-400">· no certificate: {t.reason?.replace(/^[A-Z]/, (c) => c.toLowerCase())}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({
  pending, working, onCancel, onConfirm,
}: {
  pending: Pending;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { enrolment: e, student, action } = pending;
  const incomplete = e.progress.total > 0 && e.progress.done < e.progress.total;
  return (
    <div className="fixed inset-0 z-[95] bg-slate-900/40 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5">
        <h4 className="text-base font-extrabold text-slate-900">
          {action === 'issue' ? 'Issue this certificate?' : 'Withdraw this certificate?'}
        </h4>
        <p className="mt-2 text-sm text-slate-700">
          <strong>{student.name}</strong> — {e.trackName}{e.level ? ` (${e.level})` : ''}
        </p>

        {action === 'issue' ? (
          <ul className="mt-3 space-y-1.5 text-[13px] text-slate-600 list-disc pl-5">
            <li>The course is marked <strong>completed</strong> and the certificate appears on their dashboard straight away.</li>
            <li>They will no longer be charged class credits or marked absent for this course&apos;s batch.</li>
            <li>Lessons and the practice room stay open.</li>
            {incomplete && (
              <li className="text-amber-700">
                Only {e.progress.done} of {e.progress.total} lessons are ticked in the app. Issue it if the course is finished in class.
              </li>
            )}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-slate-600">
            The certificate disappears from their dashboard and the course becomes <strong>active</strong> again, so class credits apply as before.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={working} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={working}
            className={`h-10 px-4 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2 disabled:opacity-60 ${action === 'issue' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {working && <Loader2 className="w-4 h-4 animate-spin" />}
            {action === 'issue' ? 'Issue certificate' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  );
}
