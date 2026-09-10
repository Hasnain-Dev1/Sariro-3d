'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Copy, Check, Loader2, Quote, Target, Flame,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchAttempts } from '@/lib/speaking/practice-log';
import { buildParentReport, reportAsText, type ClassRecord } from '@/lib/dashboard/parent-report';
import type { PracticeAttempt } from '@/lib/speaking/progress';

/**
 * SARIRO — the report a family decides on
 * ============================================================================
 * Every competitor can print "attended 8 of 8 classes". This is the other
 * sentence — "filler words: 11.5 a minute down to 3" — and no school that has
 * not built the measuring underneath can produce it.
 *
 * ── Built to be screenshotted ───────────────────────────────────────────────
 * This will not be read on this page. It will be photographed and sent to a
 * grandparent, or pasted into a school WhatsApp group. So the headline is
 * large, the numbers sit near the words that explain them, and there is a Copy
 * button that produces plain text which survives with no styling at all.
 *
 * ── And built to be believed ────────────────────────────────────────────────
 * Nothing is claimed under three practice attempts, at most one thing going
 * the wrong way is shown, and a month with no improvement says what the child
 * DID rather than inventing progress. See lib/dashboard/parent-report.ts,
 * where all of that is decided and tested.
 */

export default function ParentReportCard({
  userId,
  childName,
  days = 30,
}: {
  /** Whose report. Omitted means the signed-in learner. */
  userId?: string;
  childName: string;
  days?: number;
}) {
  const [attempts, setAttempts] = useState<PracticeAttempt[] | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const rows = await fetchAttempts(userId);
    setAttempts(rows);

    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      const id = userId ?? user?.id;
      if (!id) { setClasses([]); return; }

      /* Attendance and the teacher's remarks come from the same rows the
         teacher writes during class, so the page cannot disagree with what
         they were told at the time. */
      /* Two queries, not one embed.
         ────────────────────────────────────────────────────────────────────
         This used to ask for the teacher's name through
         `bookings(slot_start, profiles!teacher_id(full_name))`, and PostgREST
         answered 400: bookings.teacher_id carries no foreign key, so there is
         no relationship for it to follow. The catch below turned that into an
         empty list, so this report showed ZERO classes and no teacher quote
         for every child, always — while the practice half above it worked
         perfectly and made the page look fine.

         An earlier fix to this very query (student_id, not user_id) missed it
         for the same reason: the failure never reached anybody. */
      const { data, error } = await sb
        .from('session_attendance')
        // student_id, not user_id. Getting that wrong returns an empty list
        // rather than an error, so the report would quietly show zero classes.
        .select('status, note, marked_at, bookings(slot_start, teacher_id)')
        .eq('student_id', id)
        .order('marked_at', { ascending: false })
        .limit(60);
      if (error) throw error;

      const rows = data ?? [];
      const teacherIds = [...new Set(
        rows.map((r) => (r.bookings as unknown as { teacher_id?: string } | null)?.teacher_id)
          .filter((v): v is string => !!v)
      )];
      const names = new Map<string, string | null>();
      if (teacherIds.length > 0) {
        const { data: people } = await sb
          .from('profiles').select('id, full_name').in('id', teacherIds);
        for (const p of (people ?? []) as { id: string; full_name: string | null }[]) {
          names.set(p.id, p.full_name);
        }
      }

      setClasses(
        rows.map((r) => {
          const b = r.bookings as unknown as { slot_start?: string; teacher_id?: string } | null;
          return {
            // The class time, falling back to when it was marked. A missing
            // slot_start must not date the row to "now" and drag an old class
            // into this month's window.
            at: b?.slot_start ?? (r.marked_at as string) ?? new Date(0).toISOString(),
            attended: r.status === 'present' || r.status === 'late',
            remark: (r.note as string | null) ?? null,
            teacherName: b?.teacher_id ? names.get(b.teacher_id) ?? null : null,
          };
        })
      );
    } catch (err) {
      /* The practice half is the half nobody else has, so a missing attendance
         read must not take the whole report down. But it is LOGGED now: this
         catch is what hid a broken query for the entire life of the feature. */
      console.warn('[parent-report] attendance read failed:', err instanceof Error ? err.message : err);
      setClasses([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const report = useMemo(
    () => (attempts === null ? null : buildParentReport({ childName, attempts, classes, days })),
    [attempts, classes, childName, days]
  );

  const copy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(reportAsText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* Clipboard refused — an insecure origin, or permission denied. The text
         is on screen either way, which is the fallback that always works. */
    }
  };

  if (report === null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="mt-4 h-24 bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const e = report.effort;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Last {report.periodDays} days
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {report.childName}
            </h2>
          </div>
          <button
            onClick={copy}
            className="shrink-0 h-9 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* The one sentence. Large, because it is the only thing that has to
            survive being photographed. */}
        {report.headline ? (
          <p
            className="mt-4 text-[22px] sm:text-2xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            {report.headline}
          </p>
        ) : report.tooEarly ? (
          <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">
            Still early. A few more practice sessions and the trends start showing — the numbers
            below are what {report.childName.split(' ')[0]} has done so far.
          </p>
        ) : (
          /* Nothing improved, and nothing is invented. What they did is on the
             page and it is true. */
          <p className="mt-4 text-[15px] text-slate-600 leading-relaxed">
            Nothing moved much this month. That happens — here is what{' '}
            {report.childName.split(' ')[0]} actually did.
          </p>
        )}
      </div>

      {report.movements.length > 0 && (
        <div className="px-6 pb-5 space-y-2">
          {report.movements.map((m, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                m.direction === 'better'
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {m.direction === 'better'
                  ? <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
                  : <TrendingDown className="w-4 h-4 text-amber-600 shrink-0" />}
                {m.label}
              </span>
              <span className="text-sm tabular-nums text-slate-600 shrink-0" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {m.from} <span className="text-slate-400">→</span>{' '}
                <span className="font-extrabold text-slate-900">{m.to}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Effort. True in a month where nothing improved, which is exactly the
          month a parent is deciding whether to carry on. */}
      <div className="px-6 pb-5 grid grid-cols-3 gap-2">
        {[
          { label: 'Classes', value: `${e.classesAttended}/${e.classesHeld}` },
          { label: 'Days practised', value: String(e.practiceDays) },
          { label: 'Best streak', value: e.bestStreak > 0 ? `${e.bestStreak}` : '—', icon: e.bestStreak >= 3 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 px-3 py-2">
            <p className="text-lg font-extrabold text-slate-900 tabular-nums leading-none flex items-center gap-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {s.icon && <Flame className="w-3.5 h-3.5 text-orange-500" />}
              {s.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {report.teacherNote && (
        <div className="px-6 pb-5">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <Quote className="w-3.5 h-3.5 text-slate-400" />
            <p className="mt-1.5 text-sm text-slate-800 leading-relaxed italic">
              {report.teacherNote.text}
            </p>
            {report.teacherNote.from && (
              <p className="mt-1.5 text-[11px] font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                — {report.teacherNote.from}
              </p>
            )}
          </div>
        </div>
      )}

      {report.focus && (
        <div className="px-6 py-4 bg-blue-50/60 border-t border-blue-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <Target className="w-3 h-3" /> Next month
          </p>
          <p className="mt-1.5 text-sm font-bold text-slate-900 leading-relaxed">{report.focus.headline}</p>
          <p className="mt-1 text-xs text-slate-700 leading-relaxed">{report.focus.advice}</p>
        </div>
      )}

      <p className="px-6 py-3 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100">
        Measured from {report.childName.split(' ')[0]}&apos;s own practice, on their own device. Nothing is
        claimed from fewer than three sessions.
      </p>
    </div>
  );
}
