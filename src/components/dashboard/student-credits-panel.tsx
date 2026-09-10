'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Coins, PauseCircle, Clock, CheckCircle2, CalendarClock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

/**
 * SARIRO — what a family has, and what is still owed to them
 * ============================================================================
 * Two balances, and they are not interchangeable.
 *
 *   Regular class credits   one per ordinary class
 *   Catch-Up Credits        one per lesson the group covered while their
 *                           classes were paused, taught separately
 *
 * ── The naming is not cosmetic ──────────────────────────────────────────────
 * §1: never "doubt credits" on any screen a family sees. A parent reading
 * "doubt" hears that their child is behind and struggling. They are not — they
 * ran out of credits, and the school kept teaching without them. The words
 * have to say what actually happened.
 *
 * ── Why every missed lesson is listed by name ───────────────────────────────
 * "Catch-Up Credits: 6" tells a parent nothing they can check. Six lessons
 * with numbers, titles and times tells them precisely what was missed and what
 * is arranged — and makes it obvious when something has not been.
 */

interface CatchUpRow {
  id: string;
  lesson_number: number;
  lesson_title: string | null;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
}

interface Balances {
  main: number;
  catchup: number;
  status: string;
  graceEndsAt: string | null;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export default function StudentCreditsPanel() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [lessons, setLessons] = useState<CatchUpRow[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = createClient();
    try {
      const [{ data: cr }, { data: me }, { data: cu }] = await Promise.all([
        sb.from('credits').select('balance, catchup_balance').eq('user_id', user.id).maybeSingle(),
        sb.from('profiles').select('student_status, credit_grace_period_ends_at').eq('id', user.id).maybeSingle(),
        sb.from('catchup_lessons')
          .select('id, lesson_number, lesson_title, status, scheduled_at, completed_at')
          .eq('student_id', user.id).neq('status', 'cancelled')
          .order('lesson_number', { ascending: true }),
      ]);
      setBalances({
        main: Number(cr?.balance ?? 0),
        catchup: Number(cr?.catchup_balance ?? 0),
        status: (me?.student_status as string) ?? 'active',
        graceEndsAt: (me?.credit_grace_period_ends_at as string | null) ?? null,
      });
      setLessons((cu ?? []) as CatchUpRow[]);
    } catch {
      /* The migration may not have run on this database yet. Showing nothing
         is right — inventing a zero balance would be worse than silence. */
      setBalances(null);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (!balances) return null;

  const paused = balances.status !== 'active';
  const outstanding = lessons.filter((l) => l.status !== 'completed');

  return (
    <div className="space-y-3">
      {/* ── Paused ────────────────────────────────────────────────────────
          §4. Said first, plainly, and with what to do about it — a family
          whose classes stopped is owed an explanation before a number. */}
      {paused && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <p className="text-[13.5px] font-bold text-amber-900 flex items-center gap-2">
            <PauseCircle className="w-4 h-4 shrink-0" />
            Your regular class credits have ended
          </p>
          <p className="mt-1.5 text-[13px] text-amber-900/85 leading-relaxed">
            Your upcoming classes are paused for now. Add credits and they start again
            straight away — your teacher, your group and your place in the course are all held
            exactly as they were.
            {balances.graceEndsAt && (
              <> Your schedule is held until <b>{when(balances.graceEndsAt)}</b>.</>
            )}
          </p>
        </div>
      )}

      {/* ── The two balances ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            {balances.main}
          </p>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
            Regular class credits
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4 text-blue-500" />
            {balances.catchup}
          </p>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
            Catch-Up Credits
          </p>
        </div>
      </div>

      {/* ── The lessons themselves ────────────────────────────────────────── */}
      {lessons.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 pt-3.5 pb-2">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              Catch-up lessons
            </p>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
              Classes your group covered while yours were paused. Each is a separate
              30-minute session — your regular classes carry on as normal alongside them.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {lessons.map((l) => (
              <div key={l.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <span className="text-[13px] text-slate-800 min-w-0">
                  <span className="font-bold">Lesson {l.lesson_number}</span>
                  {l.lesson_title ? ` — ${l.lesson_title}` : ''}
                </span>
                <span className="shrink-0 text-[11.5px]">
                  {l.status === 'completed' ? (
                    <span className="text-green-700 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : l.scheduled_at ? (
                    <span className="text-slate-600 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {when(l.scheduled_at)}
                    </span>
                  ) : (
                    /* Deliberately not "overdue" or "late". Whether a teacher
                       has met their deadline is our problem to chase, not a
                       worry to hand a parent. */
                    <span className="text-slate-500">Your teacher will arrange this</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {outstanding.length > 0 && (
            <p className="px-4 py-2.5 text-[11.5px] text-slate-400 border-t border-slate-100">
              {outstanding.length} still to be taught. These do not use your regular class credits.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
