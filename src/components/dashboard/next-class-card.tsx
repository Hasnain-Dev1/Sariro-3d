'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarClock, Users, Video } from 'lucide-react';
import type { TeacherBookingRow } from '@/lib/dashboard/teacher-data';
import { humanCountdown, joinWindow, JOIN_OPENS_MINUTES_BEFORE } from '@/lib/dashboard/join-window';
import { batchPositions, classLessonOf } from '@/lib/dashboard/class-lesson';

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
 *
 * Since 17 Sep 2026 it also says which lesson (number and name) and which course
 * — the course name carries the age group or grade — with a button that opens
 * that exact lesson, and Join appears only once the join window has opened,
 * 10 minutes before the start. Before then, nobody can walk into the room early.
 */

export default function NextClassCard({
  bookings,
  timezone,
  onJoin,
}: {
  bookings: TeacherBookingRow[];
  timezone: string | null;
  /** Shows the class in the schedule, where attendance, rescheduling and cancelling live. */
  onJoin: (booking: TeacherBookingRow) => void;
}) {
  // Ticks so the countdown and the join window stay honest on a dashboard that
  // is often left open all day.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const positions = useMemo(() => batchPositions(bookings), [bookings]);

  const next = bookings
    .filter((b) => b.status === 'scheduled')
    .filter((b) => new Date(b.slot_end ?? b.slot_start).getTime() > now.getTime() - 20 * 60_000)
    .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime())[0];

  if (!next) {
    return (
      <div className="card card--feature">
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
  const lesson = next.is_trial ? null : classLessonOf(next, positions.get(next.id) ?? null);
  const meetUrl = next.google_meet_url || next.cohort_meet_url;
  const opensAt = win.opensAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', ...(timezone ? { timeZone: timezone } : {}) });

  /* The same start the calendar's Join makes: records the teacher's join time, then opens the room. */
  const join = async () => {
    if (!meetUrl) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch('/api/teacher/start-class', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: next.id }),
      });
      const json = await res.json();
      if (!json.ok && json.error === 'too_early') { setJoinError(json.message); return; }
      if (json.ok) setJoined(next.id);
    } catch { /* recording the join must never stop the teacher getting in */ }
    finally { setJoining(false); }
    window.open(meetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card card--feature" style={{ ['--accent' as string]: '#16A34A' }}>
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

      {/* The course name carries the age group or grade — "Public Speaking · Grades 1–3". */}
      <p className="text-[15px] font-semibold text-slate-700">
        {lesson ? lesson.courseTitle : `${next.cohort_track} · ${next.cohort_level}`} · {next.cohort_ratio}
      </p>
      {lesson?.number && (
        <p className="mt-1 text-[16px] font-bold text-blue-800">
          Lesson {lesson.number}{lesson.total ? ` of ${lesson.total}` : ''}{lesson.name ? ` · ${lesson.name}` : ''}
        </p>
      )}

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

      <div className="mt-5 flex flex-wrap gap-2">
        {/* Join exists only inside the window. Before it, the time it opens. */}
        {open && meetUrl ? (
          <button
            onClick={() => void join()}
            disabled={joining}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[15px] font-semibold transition-colors w-full sm:w-auto disabled:opacity-60"
          >
            <Video className="w-4 h-4" />
            {joined === next.id ? 'Joined — open the room again' : 'Join class'}
          </button>
        ) : (
          <span className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-slate-100 text-slate-500 text-[14px] font-semibold w-full sm:w-auto">
            <Video className="w-4 h-4" />
            {open ? 'No class link yet — ask your admin' : `Join opens at ${opensAt} (${JOIN_OPENS_MINUTES_BEFORE} min before)`}
          </span>
        )}
        {lesson?.href && (
          <Link
            href={lesson.href}
            className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-[15px] font-semibold transition-colors w-full sm:w-auto"
          >
            <BookOpen className="w-4 h-4" /> View class details
          </Link>
        )}
        <button
          onClick={() => onJoin(next)}
          className="inline-flex items-center justify-center h-12 px-3 text-[14px] font-semibold text-slate-500 hover:text-slate-800 w-full sm:w-auto"
        >
          See it in the schedule
        </button>
      </div>
      {joinError && <p className="mt-2 text-[13px] font-semibold text-amber-700">{joinError}</p>}
    </div>
  );
}
