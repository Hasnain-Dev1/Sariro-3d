'use client';

import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Video, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { subjectLabel } from '@/lib/trial/subjects';
import { gradeTag, gradeName } from '@/lib/grade/tag';

/**
 * SARIRO — the trial classes, listed on their own.
 *
 * ── Why this is separate from the classes above it ──────────────────────────
 * A trial is not one of their classes. It consumes no credit, belongs to no
 * cohort, and may be for a course they have never bought — so mixing it into
 * the schedule above would make a free half hour look like a lesson they are
 * paying for. It sits below, under its own heading, with its own history.
 *
 * ── Why finished ones stay ──────────────────────────────────────────────────
 * A child may hold one live trial per course AND grade, and may book the pair
 * again — a retry after sitting one, or a replacement for one they cancelled.
 * Every booking stays in the list, with what became of it, so "you have
 * already tried Mathematics at G5" is something they can see rather than
 * something they are told when they next try to book it.
 *
 * The join button follows the same rule as everywhere else: ten minutes before
 * the start, not on the hour.
 */

interface TrialRow {
  id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  google_meet_url: string | null;
  trial_subject: string | null;
  teacher_id: string | null;
  grade: number | null;
  teacher_name: string | null;
}

/** How many to keep on screen. Older ones are history nobody scrolls to. */
const MAX_SHOWN = 8;

const JOIN_OPENS_MS = 10 * 60_000;
/** The door stays open a little past the end, for somebody who dropped out. */
const JOIN_CLOSES_AFTER_MS = 20 * 60_000;

export default function TrialClassesSection({ timezone }: { timezone?: string | null }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<TrialRow[] | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = createClient();
    try {
      /* A trial holds four children and only the first is named on
         bookings.trial_student_id, so the seats have to be asked too. The
         seat also carries the grade this child was booked at, which is half
         of what identifies a trial. */
      const { data: seats } = await sb
        .from('trial_participants').select('booking_id, grade').eq('student_id', user.id);
      const mySeats = (seats ?? []) as { booking_id: string; grade: number | null }[];
      const alsoIn = mySeats.map((s) => s.booking_id);

      let q = sb
        .from('bookings')
        /* Deliberately not selecting is_primary_trial: that column arrives
           with scripts/trial-primary.sql, and asking for a column that does
           not exist fails the WHOLE query rather than one field. */
        .select('id, slot_start, slot_end, status, google_meet_url, trial_subject, teacher_id')
        .eq('is_trial', true);
      q = alsoIn.length
        ? q.or(`trial_student_id.eq.${user.id},id.in.(${alsoIn.join(',')})`)
        : q.eq('trial_student_id', user.id);

      const { data } = await q.order('slot_start', { ascending: false }).limit(MAX_SHOWN);
      const bookings = (data ?? []) as Omit<TrialRow, 'grade' | 'teacher_name'>[];
      if (bookings.length === 0) { setRows([]); return; }

      /* bookings.teacher_id has no foreign key, so the names are a second
         question — an embed here returns an error, not a teacher. */
      const teacherIds = [...new Set(bookings.map((b) => b.teacher_id).filter(Boolean))] as string[];
      const names = new Map<string, string | null>();
      if (teacherIds.length) {
        const { data: profs } = await sb.from('profiles').select('id, full_name').in('id', teacherIds);
        for (const p of (profs ?? []) as { id: string; full_name: string | null }[]) {
          names.set(p.id, p.full_name);
        }
      }

      const seatGrade = new Map(mySeats.map((s) => [s.booking_id, s.grade]));
      setRows(bookings.map((b) => ({
        ...b,
        grade: seatGrade.get(b.id) ?? null,
        teacher_name: b.teacher_id ? names.get(b.teacher_id) ?? null : null,
      })));
    } catch {
      setRows([]);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (rows === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your trial classes…
      </div>
    );
  }
  // Nothing to say to somebody who has never booked one.
  if (rows.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <GraduationCap className="w-5 h-5 text-blue-600" /> Trial Classes
      </h2>

      <div className="space-y-3">
        {rows.map((t) => {
          const start = Date.parse(t.slot_start);
          const end = Date.parse(t.slot_end);
          const state = stateOf(t.status, start, end, now);
          const joinable =
            t.status === 'scheduled' &&
            now !== null &&
            now >= start - JOIN_OPENS_MS &&
            now <= end + JOIN_CLOSES_AFTER_MS;

          return (
            <div key={t.id} className="card-3d p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 flex items-center gap-2 flex-wrap" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {t.trial_subject ? subjectLabel(t.trial_subject) : 'Trial class'}
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                    title={gradeName(t.grade)}
                  >
                    {gradeTag(t.grade)}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(start).toLocaleString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                    ...(timezone ? { timeZone: timezone } : {}),
                  })}
                  {t.teacher_name ? ` · with ${t.teacher_name}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${state.chip}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {state.label}
                </span>
                {joinable && t.google_meet_url && (
                  <a
                    href={t.google_meet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile btn-tactile-primary px-3 py-2 text-xs inline-flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" /> Join class
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** What became of it, in the one word a family would use. */
function stateOf(status: string, start: number, end: number, now: number | null) {
  if (status === 'cancelled') return { label: 'Cancelled', chip: 'bg-slate-100 text-slate-500' };
  if (status === 'completed') return { label: 'Completed', chip: 'bg-green-100 text-green-700' };
  if (status === 'no_show') return { label: 'Missed', chip: 'bg-amber-100 text-amber-700' };
  if (now !== null && now > end) return { label: 'Finished', chip: 'bg-slate-100 text-slate-500' };
  if (now !== null && now >= start - JOIN_OPENS_MS) return { label: 'Starting now', chip: 'bg-blue-100 text-blue-700' };
  return { label: 'Upcoming', chip: 'bg-blue-100 text-blue-700' };
}
