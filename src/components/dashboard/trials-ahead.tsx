'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Clock, Compass } from 'lucide-react';
import type { TeacherBookingRow } from '@/lib/dashboard/teacher-data';
import { trialsAhead } from '@/lib/ops/queue-counts';
import { subjectLabel } from '@/lib/trial/subjects';
import { gradeName } from '@/lib/grade/tag';
import { stepsDone, PREP_STEPS } from '@/lib/trial/intake';
import type { TrialIntake } from '@/lib/trial/playbooks/types';

/**
 * SARIRO — the trials a teacher is about to teach
 * ============================================================================
 * The half hour that decides whether a family stays, listed a week ahead with
 * what the teacher needs before it starts: the child, their grade, whether the
 * family did the prep on /my-class, and a playbook opened for THAT child — one
 * link per child, so a trial of three is prepared as three children rather
 * than as the first one on the list.
 *
 * No join button here on purpose: joining goes through the calendar, which
 * records the moment the teacher clicked in — a bare link would leave them
 * looking like a no-show.
 */

const playbookHref = (b: TeacherBookingRow, child: { id: string; name: string; grade: number | null }) =>
  `/dashboard/teacher/trial-playbook?subject=${encodeURIComponent(b.trial_subject ?? '')}&grade=${child.grade ?? ''}` +
  `&child=${encodeURIComponent(child.name)}&student=${child.id}&booking=${b.id}`;

type Prep = { done: number; configured: boolean } | null;

export default function TrialsAhead({ bookings, timezone, loading }: { bookings: TeacherBookingRow[]; timezone: string | null; loading: boolean }) {
  const rows = useMemo(() => trialsAhead(bookings, Date.now(), 24 * 7), [bookings]);
  const [prep, setPrep] = useState<Record<string, Prep>>({});

  /* What each family filled in — a handful of trials a week, one small read each. */
  const wanted = rows.flatMap((b) => b.roster.map((c) => `${b.id}:${c.id}`)).join(',');
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    void Promise.all(
      wanted.split(',').map(async (key) => {
        const [bookingId, studentId] = key.split(':');
        try {
          const res = await fetch(`/api/trial/intake?bookingId=${bookingId}&studentId=${studentId}`);
          const j = await res.json();
          if (!j?.ok) return [key, null] as const;
          const steps = stepsDone(j.intake as TrialIntake | null);
          return [key, { done: PREP_STEPS.filter((s) => steps[s]).length, configured: j.configured !== false }] as const;
        } catch {
          return [key, null] as const;
        }
      })
    ).then((pairs) => { if (live) setPrep(Object.fromEntries(pairs)); });
    return () => { live = false; };
  }, [wanted]);

  if (loading) return <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13.5px] text-slate-600">No trial classes in the next seven days.</p>
        <Link href="/dashboard/teacher/trial-playbook" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-cyan-700 hover:text-cyan-800">
          <Compass className="w-3.5 h-3.5" /> Read the playbooks
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {rows.map((b) => {
        const soon = Date.parse(b.slot_start) - Date.now() < 24 * 3_600_000;
        return (
          <div key={b.id} className="rounded-2xl bg-white border border-[var(--card-border)] overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">{subjectLabel(b.trial_subject)} · trial</p>
                <p className="mt-1 text-[15px] font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(b.slot_start).toLocaleString(undefined, {
                    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
                    ...(timezone ? { timeZone: timezone } : {}),
                  })}
                </p>
              </div>
              {soon && <span className="shrink-0 rounded-full bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200 px-2 py-0.5 text-[11px] font-bold">Within 24h</span>}
            </div>

            <ul className="border-t border-slate-100 divide-y divide-slate-100">
              {(b.roster.length ? b.roster : b.student_names.map((name, i) => ({ id: `n${i}`, name, grade: null, paused: false, statusLabel: null }))).map((child) => {
                const p = prep[`${b.id}:${child.id}`];
                return (
                  <li key={child.id} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-slate-800 truncate">
                        {child.name}
                        {child.grade != null && <span className="font-medium text-slate-500"> · {gradeName(child.grade)}</span>}
                      </p>
                      <p className="text-[11.5px] text-slate-500 flex items-center gap-1">
                        {p && p.configured && p.done > 0 ? (
                          <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Family did {p.done} of {PREP_STEPS.length} prep steps</>
                        ) : (
                          <><Circle className="w-3 h-3 text-slate-300" /> No prep answers yet — ask in the first minutes</>
                        )}
                      </p>
                    </div>
                    {!child.id.startsWith('n') && (
                      <Link
                        href={playbookHref(b, child)}
                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[12px] font-bold"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        <Compass className="w-3.5 h-3.5" /> Playbook
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
