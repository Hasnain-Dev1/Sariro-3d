'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Video, Sparkles, Users, ShieldCheck, CalendarCheck,
  Award, MessageCircle, Phone, Route, GraduationCap,
} from 'lucide-react';
import { BRAND } from '@/lib/sariro-data';
import ClassFeedbackForm from '@/components/dashboard/class-feedback-form';
import { subjectLabel } from '@/lib/trial/subjects';
import { gradeTag } from '@/lib/grade/tag';

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
  /**
   * What the class is about, and at what level.
   *
   * Both optional because a trial booked before `bookings.trial_subject`
   * existed has neither, and a card that renders "undefined" is worse than one
   * that quietly omits a line.
   */
  subject?: string | null;
  grade?: number | null;
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

  /* Every unit that is not leading zero, down to the second. It used to stop
     at two — "2 days 11 hours" — which is a fact rather than a countdown, and
     a page that is not visibly moving looks like a page that is not working.
     The ticking second is the part that makes it feel alive. */
  const parts = [
    ...(d > 0 ? [{ v: d, l: d === 1 ? 'day' : 'days' }] : []),
    ...(d > 0 || h > 0 ? [{ v: h, l: h === 1 ? 'hour' : 'hours' }] : []),
    { v: m, l: 'min' },
    { v: s, l: 'sec' },
  ];

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

/** A titled block on the trial page. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 pt-6 border-t border-slate-100">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

/** An icon, a heading and a sentence. */
function Row({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-grotesk)' }}>{title}</p>
        <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{body}</p>
      </div>
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
            Your trial class is complete 🎉
          </h1>

          {/* ── What happens next, said plainly ────────────────────────────
              A family who has just had a good class and is told nothing
              assumes the next move is theirs. It is not — a person is going
              to ring them, and saying so is the difference between waiting
              and drifting. It is also true: marking the class complete puts
              them in the seller's Final Conversation queue automatically. */}
          <p className="mt-3 text-sm text-slate-700 leading-relaxed">
            Thank you, {firstName} — you met {trial.teacher_name ?? 'one of our mentors'}.
            A Sariro counsellor will contact you shortly to talk through how it went and
            what would suit your child next. There is nothing you need to do.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              How was the class?
            </p>
            <p className="text-xs text-slate-500 mb-3">
              A rating is enough. Anything you add reaches a person, not a report.
            </p>
            {/* The family's rating OF THE CLASS. Kept entirely separate from
                the teacher's rating of the child — two different questions
                with two different answers, and averaging them would produce a
                number that means nothing. */}
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

        {/* What the class is, which the page never said. A parent with two
            children booked into two different subjects had no way to tell
            these apart. */}
        {(trial.subject || trial.grade != null) && (
          <p className="mt-1 text-sm text-slate-600">
            {trial.subject && <><span className="font-bold text-slate-800">{subjectLabel(trial.subject)}</span>{' · '}</>}
            {gradeTag(trial.grade)}
          </p>
        )}

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

        {/* The reason to be on time, said where they are looking. */}
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
          <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            <span className="font-bold">Join on time to receive your trial completion certificate.</span>{' '}
            It is issued to learners who attend the class from the start.
          </p>
        </div>

        {/* ── Getting ready ────────────────────────────────────────────────
            Practical, and in the order they would do it. Every item is
            something that has actually cost a trial its first ten minutes. */}
        <Section title="Before the class">
          <ol className="space-y-2.5">
            {[
              'Join five minutes early — the button opens ten minutes before the start.',
              'A laptop or tablet works best. Check the microphone and camera beforehand.',
              'Find a quiet spot, with a notebook and pen within reach.',
              'Younger learners: a parent nearby for the first few minutes helps them settle.',
              'Come with one question you would love answered.',
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black flex items-center justify-center shrink-0" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {i + 1}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── What happens after ───────────────────────────────────────────
            Every step here is one the system actually takes: the teacher's
            feedback, a seller's call, a course recommendation. Nothing is
            promised that nobody does. */}
        <Section title="After the class">
          <div className="space-y-3">
            {[
              { icon: MessageCircle, title: 'An honest read', body: 'The teacher tells you where your child really is — including what they are not yet ready for.' },
              { icon: Phone, title: 'A short call', body: 'A Sariro counsellor rings to talk it through. No pressure, and no card on file.' },
              { icon: Route, title: 'The right next step', body: 'If it clicked, we suggest the course and batch that fits. If it did not, we say so.' },
            ].map((f) => <Row key={f.title} {...f} />)}
          </div>
        </Section>

        {/* ── Why families choose Sariro ───────────────────────────────────
            The honest version. The 5,000+ figure is the founder's teaching
            record from BEFORE Sariro existed, and it is attributed as such —
            never presented as Sariro's own student count. */}
        <Section title="Why families choose Sariro">
          <div className="space-y-3">
            {[
              { icon: Users, title: 'Never more than four', body: 'Every class is capped at four learners, so a teacher notices the moment a child goes quiet.' },
              { icon: GraduationCap, title: 'A decade of teaching', body: `${BRAND.founder}’s record before Sariro: 5,000+ students across 65 nationalities, 36 research papers and 7 patents filed.` },
              { icon: Sparkles, title: 'Understanding, not memorising', body: 'A grade is a receipt for remembering. We teach for the other thing.' },
              { icon: ShieldCheck, title: 'Nothing to pay today', body: 'This class is free, with no card on file. Decide afterwards, or do not.' },
            ].map((f) => <Row key={f.title} {...f} />)}
          </div>
        </Section>
      </motion.div>
    </div>
  );
}
