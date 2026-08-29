'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Users, Video } from 'lucide-react';
import type { TeacherBookingRow } from '@/lib/dashboard/teacher-data';
import { humanCountdown, joinWindow } from '@/lib/dashboard/join-window';

/**
 * SARIRO — Teacher's next class
 * =========================================================
 * The teacher's actual question, which the dashboard did not answer: *what am I
 * teaching next, with whom, and which batch?*
 *
 * Everything needed was already loaded — `batch_code` and `student_names` are on
 * the booking row, and the code that fetches them even says "so a teacher can
 * tell whose class this is at a glance". But they were only visible inside the
 * calendar, so a teacher opening their dashboard had to go looking for the one
 * thing they came for. This is not new data; it is the same data given the
 * position it deserves.
 *
 * The batch code matters more than it looks. With 250 batches on the same
 * course, "Grade 8 Maths" identifies nothing — the code is the only thing a
 * teacher and an admin can say to each other out loud and mean the same class.
 */

export default function NextClassCard({
  bookings,
  timezone,
  onJoin,
}: {
  bookings: TeacherBookingRow[];
  timezone: string | null;
  onJoin: (booking: TeacherBookingRow) => void;
}) {
  // Ticks so the countdown and the join window stay honest on a dashboard that
  // is often left open all day. A minute is enough — nothing here is finer.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const next = bookings
    .filter((b) => b.status === 'scheduled')
    .filter((b) => new Date(b.slot_end ?? b.slot_start).getTime() > now.getTime() - 20 * 60_000)
    .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime())[0];

  if (!next) {
    return (
      <div className="card card--feature mb-10">
        <div className="flex items-center gap-2.5 mb-2">
          <CalendarClock className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Next class
          </span>
        </div>
        <p className="text-slate-600 text-[15px]">
          Nothing scheduled. Your next class will appear here as soon as it is booked.
        </p>
      </div>
    );
  }

  const win = joinWindow(next.slot_start, next.slot_end ?? null, now);
  const open = win.state === 'open';

  return (
    <div className="card card--feature mb-10" style={{ ['--accent' as string]: '#16A34A' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <CalendarClock className="w-5 h-5 text-green-600" />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">
          Next class
        </span>
        {open && (
          <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Starting now
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-slate-900">
          {new Date(next.slot_start).toLocaleString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            ...(timezone ? { timeZone: timezone } : {}),
          })}
        </h2>
        <span className="text-[15px] text-slate-500 tabular-nums">
          {open ? 'now' : humanCountdown(win.msUntilOpen)}
        </span>
      </div>

      <p className="text-[15px] text-slate-600">
        {next.cohort_track} · {next.cohort_level} · {next.cohort_ratio}
      </p>

      <div className="card-meta grid sm:grid-cols-2 gap-4">
        <div>
          {/* The identifier a human can say out loud. Without it, 250 batches on
              one course are indistinguishable to everyone involved. */}
          <p className="text-slate-500 text-[12.5px] mb-1">Batch</p>
          <p className="font-bold text-slate-900 tabular-nums">
            {next.batch_code ?? <span className="font-medium text-slate-400">No code assigned</span>}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-[12.5px] mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {next.student_names.length}{' '}
            {next.student_names.length === 1 ? 'student' : 'students'}
          </p>
          <p className="font-medium text-slate-900 text-[14px]">
            {next.student_names.length > 0 ? (
              next.student_names.join(', ')
            ) : (
              <span className="text-slate-400">Nobody enrolled yet</span>
            )}
          </p>
        </div>
      </div>

      {/* This takes the teacher to the class in their schedule, where the real
          start control lives — it does not start the class itself, so it does
          not claim to. A button that says "Start class" and only scrolls is the
          same category of lie as a search that shows filtered-out results. */}
      <button
        onClick={() => onJoin(next)}
        className="mt-5 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[15px] font-semibold transition-colors w-full sm:w-auto"
      >
        <Video className="w-4 h-4" />
        {open ? 'Go to this class' : `Opens ${humanCountdown(win.msUntilOpen)} — view in schedule`}
      </button>
    </div>
  );
}
