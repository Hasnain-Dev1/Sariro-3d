'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Flame, Snowflake, ThermometerSun, HelpCircle, Star, Loader2,
  PhoneCall, MessageSquareQuote, RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  leadSignal, byPriority, type ClassFeedback, type LeadSignal,
} from '@/lib/dashboard/class-feedback';

/**
 * SARIRO — who to ring first, and why
 * ============================================================================
 * A seller's day is a list of families and a finite number of hours. Before
 * this, that list was ordered by whenever the lead happened to arrive, which
 * means the family who loved their class waits behind three who did not.
 *
 * Every trial now carries two opinions. This turns them into an order.
 *
 * ── The reasons are not decoration ──────────────────────────────────────────
 * A seller who cannot see why a lead scored 78 will not trust the 78, and will
 * go back to working down the list by date. So every score shows its working:
 * what the teacher marked, what the parent rated, and whether the two of them
 * disagreed — which is itself worth a call.
 *
 * ── Silent sorts to the top ─────────────────────────────────────────────────
 * A class nobody wrote up is not a bad lead, it is an unknown one. Scoring it
 * zero would bury it under leads we know are cold, and the family would never
 * be rung. It sits first, marked as needing a chase — of the teacher, not the
 * parent.
 */

interface TrialRow {
  bookingId: string;
  studentId: string | null;
  studentName: string;
  studentPhone: string | null;
  teacherName: string | null;
  slotStart: string;
  feedback: ClassFeedback[];
  signal: LeadSignal;
}

const TEMPERATURE = {
  hot: { label: 'Keen', icon: Flame, tone: 'bg-green-50 text-green-800 border-green-200' },
  warm: { label: 'Maybe', icon: ThermometerSun, tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  cold: { label: 'Unlikely', icon: Snowflake, tone: 'bg-slate-50 text-slate-600 border-slate-200' },
  unknown: { label: 'Not written up', icon: HelpCircle, tone: 'bg-blue-50 text-blue-800 border-blue-200' },
} as const;

export default function LeadSignalsPanel() {
  const [rows, setRows] = useState<TrialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNote(null);
    try {
      const sb = createClient();
      const { data: trials, error } = await sb
        .from('bookings')
        /* teacher_id, not a `teacher:profiles!teacher_id(...)` embed: that
           column has no foreign key the API can follow, and the embed failed
           this read every time — which is why this panel only ever said
           "Could not load trial feedback". Names are read separately below. */
        .select('id, slot_start, trial_student_id, status, teacher_id')
        .eq('is_trial', true)
        .eq('status', 'completed')
        .order('slot_start', { ascending: false })
        .limit(60);
      if (error) throw error;
      if (!trials || trials.length === 0) { setRows([]); setLoading(false); return; }

      const ids = trials.map((t) => t.id as string);
      const studentIds = [...new Set(trials.map((t) => t.trial_student_id as string | null).filter((v): v is string => !!v))];
      const teacherIds = [...new Set(trials.map((t) => t.teacher_id as string | null).filter((v): v is string => !!v))];

      const [fbRes, profRes, teacherRes] = await Promise.all([
        sb.from('class_feedback')
          .select('booking_id, author_id, author_role, subject_student_id, rating, remarks, interest_level, created_at')
          .in('booking_id', ids),
        studentIds.length
          ? sb.from('profiles').select('id, full_name, email, phone').in('id', studentIds)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
        teacherIds.length
          ? sb.from('profiles').select('id, full_name').in('id', teacherIds)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      ]);

      const teacherBy = new Map(
        ((teacherRes.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p])
      );

      const fbBy = new Map<string, ClassFeedback[]>();
      for (const f of (fbRes.data ?? []) as ClassFeedback[]) {
        const list = fbBy.get(f.booking_id) ?? [];
        list.push(f);
        fbBy.set(f.booking_id, list);
      }
      const profBy = new Map(
        ((profRes.data ?? []) as { id: string; full_name: string | null; email: string | null; phone: string | null }[])
          .map((p) => [p.id, p])
      );

      const built: TrialRow[] = trials.map((t) => {
        const feedback = fbBy.get(t.id as string) ?? [];
        const prof = profBy.get((t.trial_student_id as string) ?? '');
        const teacher = teacherBy.get((t.teacher_id as string | null) ?? '') ?? null;
        return {
          bookingId: t.id as string,
          studentId: (t.trial_student_id as string) ?? null,
          studentName: prof?.full_name || prof?.email || 'Unnamed student',
          studentPhone: prof?.phone ?? null,
          teacherName: teacher?.full_name ?? null,
          slotStart: t.slot_start as string,
          feedback,
          signal: leadSignal(feedback),
        };
      });

      setRows(byPriority(built, (r) => r.signal));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setNote(
        /does not exist|schema cache/i.test(msg)
          ? 'Trial feedback is not set up on the database yet — run scripts/class-feedback.sql and scripts/trial-booking.sql.'
          : 'Could not load trial feedback.'
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="card-3d p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <PhoneCall className="w-4 h-4 text-cyan-600" />
            Who to ring first
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Trials that have happened, ordered by what the teacher and the parent each said.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0 h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Reading the write-ups…
        </div>
      ) : note ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">{note}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-6 text-center">
          No trial classes have finished yet. This fills up as they do.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const t = TEMPERATURE[r.signal.temperature];
            const Icon = t.icon;
            const teacherRemark = r.feedback.find((f) => f.author_role === 'teacher' && (f.remarks ?? '').trim())?.remarks;
            const studentRemark = r.feedback.find((f) => f.author_role === 'student' && (f.remarks ?? '').trim())?.remarks;

            return (
              <div key={r.bookingId} className="rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {r.studentName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(r.slotStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {r.teacherName ? ` · taught by ${r.teacherName}` : ''}
                      {r.studentPhone ? ` · ${r.studentPhone}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!r.signal.silent && (
                      <span className="text-sm font-extrabold text-slate-700 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {r.signal.score}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${t.tone}`}
                          style={{ fontFamily: 'var(--font-grotesk)' }}>
                      <Icon className="w-3 h-3" /> {t.label}
                    </span>
                  </div>
                </div>

                {/* The working. A score without it is a number nobody trusts. */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.signal.reasons.map((reason) => (
                    <span key={reason} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {reason}
                    </span>
                  ))}
                  {r.signal.studentRating !== null && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> parent {r.signal.studentRating}
                    </span>
                  )}
                </div>

                {(teacherRemark || studentRemark) && (
                  <div className="mt-2.5 space-y-1.5">
                    {teacherRemark && (
                      <p className="text-[11px] text-slate-600 leading-relaxed flex gap-1.5">
                        <MessageSquareQuote className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                        <span><span className="font-bold">Teacher:</span> {teacherRemark}</span>
                      </p>
                    )}
                    {studentRemark && (
                      <p className="text-[11px] text-slate-600 leading-relaxed flex gap-1.5">
                        <MessageSquareQuote className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                        <span><span className="font-bold">Parent:</span> {studentRemark}</span>
                      </p>
                    )}
                  </div>
                )}

                {r.signal.silent && (
                  <p className="mt-2 text-[11px] text-blue-700">
                    Chase the teacher, not the parent — they have not been paid for this class yet either.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
