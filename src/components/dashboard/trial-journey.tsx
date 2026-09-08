'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Video, Sparkles, Users, ShieldCheck, CalendarCheck } from 'lucide-react';
import ClassFeedbackForm from '@/components/dashboard/class-feedback-form';

/**
 * SARIRO — what a child sees before their first class, and after it
 * ============================================================================
 * Somebody who has booked a trial and never enrolled has nothing to put on a
 * dashboard: no schedule, no credits, no progress, no classmates. Showing them
 * the real one means eight empty boxes, which reads as broken software on the
 * first visit — and the first visit is the one that decides whether they come
 * back.
 *
 * So until the class happens they get this instead: when it starts, how to
 * join, and enough about Sariro to be worth the wait. The moment it is over,
 * the same page becomes the place to say how it went.
 *
 * ── Why the countdown is the whole page ─────────────────────────────────────
 * It is the only question they have. Everything else on this screen exists
 * because they arrived early and there was nothing to read.
 */

export interface TrialClass {
  id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  google_meet_url: string | null;
  teacher_name: string | null;
}

/**
 * The current time, but only once the browser has it.
 *
 * Date.now() during render is a hydration bug waiting to happen, and this page
 * had it: the server rendered "3 hours" and the browser hydrated "2 hours 59",
 * React threw a hydration mismatch, and the whole subtree was re-rendered on
 * the client. On the one page a parent sees before their first class.
 *
 * So the server renders with `null` — the booked state, minus the ticking
 * number — and the client fills it in on mount. Nothing moves, nothing
 * mismatches, and the countdown appears a frame later.
 */
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Exported so the dashboard card counts down with exactly the same maths.
    Two countdowns disagreeing by a minute is the sort of thing a parent
    notices and nobody can explain. */
export function Countdown({ iso, now }: { iso: string; now: number }) {
  const ms = Date.parse(iso) - now;
  if (ms <= 0) return null;

  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  /* Days and hours when it is far off, minutes and seconds when it is close.
     A seconds counter three days out is agitating rather than useful. */
  const parts = d > 0
    ? [{ v: d, l: d === 1 ? 'day' : 'days' }, { v: h, l: h === 1 ? 'hour' : 'hours' }]
    : h > 0
      ? [{ v: h, l: h === 1 ? 'hour' : 'hours' }, { v: m, l: 'min' }]
      : [{ v: m, l: 'min' }, { v: s, l: 'sec' }];

  return (
    <div className="flex items-end gap-4">
      {parts.map((p) => (
        <div key={p.l}>
          <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {p.v}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {p.l}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TrialJourney({
  trial,
  firstName,
  timezone,
}: {
  trial: TrialClass;
  firstName: string;
  timezone?: string | null;
}) {
  const start = Date.parse(trial.slot_start);
  const end = Date.parse(trial.slot_end);
  const now = useNow();

  /* status is server-known and safe to render from; anything comparing against
     the clock waits for the browser. */
  const finished = trial.status === 'completed' || (now !== null && now > end);
  // The join button appears ten minutes before, not on the hour — nobody wants
  // to be told "not yet" while they are already sitting there waiting.
  const joinable = !finished && now !== null && now >= start - 10 * 60_000;

  const when = new Date(start).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  });

  if (finished) {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200"
                style={{ fontFamily: 'var(--font-grotesk)' }}>
            <CalendarCheck className="w-3 h-3" /> Class finished
          </span>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            How was it, {firstName}?
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            You met {trial.teacher_name ?? 'one of our mentors'}. Two minutes of your thoughts tells us
            whether we got it right — and it reaches a person, not a report.
          </p>

          <div className="mt-6">
            <ClassFeedbackForm bookingId={trial.id} role="student" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-3d p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
              style={{ fontFamily: 'var(--font-grotesk)' }}>
          <Sparkles className="w-3 h-3" /> Your free class
        </span>

        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {joinable ? `It's time, ${firstName}.` : `You're booked in, ${firstName}.`}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {when}
          {trial.teacher_name ? <> · with <span className="font-bold text-slate-800">{trial.teacher_name}</span></> : null}
        </p>

        {!joinable && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Starts in
            </p>
            {now === null
              ? <div className="h-14" aria-hidden="true" />
              : <Countdown iso={trial.slot_start} now={now} />}
          </div>
        )}

        <div className="mt-6">
          {joinable ? (
            trial.google_meet_url ? (
              <a
                href={trial.google_meet_url}
                target="_blank"
                rel="noreferrer"
                className="btn-tactile btn-tactile-primary w-full px-6 py-4 text-base flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" /> Join the class
              </a>
            ) : (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                Your mentor is setting up the link — refresh in a moment, or check your email.
              </p>
            )
          ) : (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              The join button appears ten minutes before we start.
            </p>
          )}
        </div>

        {/* Something to read while they wait. This is the first thing many
            parents ever read about Sariro, so it is the honest version rather
            than the marketing one. */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            While you wait
          </p>
          {[
            { icon: Users, title: 'Never more than four', body: 'Every class is capped at four students, so nobody sits at the back.' },
            { icon: Sparkles, title: 'Understanding, not memorising', body: 'A grade is a receipt for remembering. We teach for the other thing.' },
            { icon: ShieldCheck, title: 'Nothing to pay today', body: 'This class is free and there is no card on file. Decide afterwards.' },
          ].map((f) => (
            <div key={f.title} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-grotesk)' }}>{f.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
