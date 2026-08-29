'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, Video } from 'lucide-react';
import { canJoinNow, humanCountdown, joinWindow } from '@/lib/dashboard/join-window';

/**
 * SARIRO — What happens next
 * =========================================================
 * The student dashboard is 1,191 lines, and a six-year-old's first session
 * began with all of it. Their question is one sentence long — *when is my
 * class, and what do I press?* — and it was somewhere in the middle of a
 * progress bar, a leaderboard, a credit balance and a syllabus.
 *
 * So this sits above everything and answers only that. Nothing else here is
 * deleted; it is simply no longer first.
 *
 * ── Why one card and not a redesign ────────────────────────────────────────
 * A dashboard is not made simple by having less on it. It is made simple by
 * having an obvious first thing. A child who can read this card never has to
 * understand the rest of the page, and an adult who wants the rest scrolls.
 */

export interface NextUpBooking {
  id: string;
  slot_start: string;
  slot_end?: string | null;
  status: string;
  lesson_name?: string | null;
  is_complimentary?: boolean | null;
}

export default function StudentNextUp({
  booking,
  firstName,
  hasCredits,
  joined,
  onJoin,
}: {
  booking: NextUpBooking | null;
  firstName: string;
  hasCredits: boolean;
  joined: boolean;
  onJoin: () => void;
}) {
  // The window opens while the page sits there; without a tick a learner would
  // stare at "opens in 1 minute" until they thought to refresh.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!booking || booking.status !== 'scheduled') {
    return (
      <div className="card card--feature mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <CalendarClock className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            What happens next
          </span>
        </div>
        <p className="text-[17px] text-slate-900 font-semibold mb-1">
          No class booked yet, {firstName}.
        </p>
        <p className="text-[15px] text-slate-600 leading-[1.6]">
          As soon as your batch is scheduled, the date and time will show up right here.
        </p>
      </div>
    );
  }

  const win = joinWindow(booking.slot_start, booking.slot_end ?? null, now);
  const open = canJoinNow(booking.slot_start, booking.slot_end ?? null, now);
  const blocked = !hasCredits && !booking.is_complimentary;

  return (
    <div className="card card--feature mb-8" style={{ ['--accent' as string]: '#2563EB' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <CalendarClock className="w-5 h-5 text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          What happens next
        </span>
        {booking.is_complimentary && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Free class
          </span>
        )}
      </div>

      {/* Said the way a child would ask it, in their own timezone. */}
      <h2 className="text-[1.6rem] sm:text-3xl font-bold tracking-[-0.02em] text-slate-900 leading-[1.15] mb-2">
        {open ? 'Your class is starting now' : 'Your next class is'}{' '}
        {!open && (
          <span className="text-blue-700">
            {new Date(booking.slot_start).toLocaleString(undefined, {
              weekday: 'long',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        )}
      </h2>

      <p className="text-[15px] text-slate-600 mb-6">
        {open ? 'Press the button and your teacher will be there.' : `That is ${humanCountdown(win.msUntilOpen)}.`}
        {booking.lesson_name ? ` You will be learning ${booking.lesson_name}.` : ''}
      </p>

      {joined ? (
        <p className="inline-flex items-center gap-2 text-[15px] font-bold text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          You&apos;re in — see you in class!
        </p>
      ) : (
        <>
          {/* One button, always useful. When the doors are shut it does not
              refuse — it goes to the page that says when they open. */}
          {open && !blocked ? (
            <button
              onClick={onJoin}
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[17px] font-bold transition-colors w-full sm:w-auto"
            >
              <Video className="w-5 h-5" />
              Join my class
            </button>
          ) : (
            <Link
              href="/dashboard/student/next-class"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[17px] font-bold transition-colors w-full sm:w-auto"
            >
              <CalendarClock className="w-5 h-5" />
              See when my class is
            </Link>
          )}

          {blocked && (
            <p className="text-[13.5px] text-amber-700 mt-3">
              You have no class credits left — ask an adult to contact us and we will sort it out.
            </p>
          )}
        </>
      )}
    </div>
  );
}
