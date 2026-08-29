'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, Loader2, Video } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { humanCountdown, joinWindow, JOIN_OPENS_MINUTES_BEFORE } from '@/lib/dashboard/join-window';

/**
 * SARIRO — /dashboard/student/next-class
 * =========================================================
 * The page that did not exist.
 *
 * Pressing "Join Class" for a class that has not started used to open an empty
 * Google Meet, and a child would sit there deciding nobody had turned up. The
 * learner's real question in that moment is "when is my class?" — so that is
 * what this page answers, in their own timezone, with a countdown.
 *
 * Nobody is blocked. Once the doors open the same button appears here and joins
 * for real.
 */

interface NextBooking {
  id: string;
  slot_start: string;
  slot_end: string | null;
  status: string;
  lesson_name: string | null;
  module_num: string | null;
}

export default function NextClassPage() {
  const { user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<NextBooking | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Re-rendered on a timer so the countdown stays honest without a page refresh.
  const [now, setNow] = useState(() => new Date());

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    []
  );

  useEffect(() => {
    // Once a minute is enough: the countdown is expressed in minutes and above,
    // so a faster tick would re-render for no visible change.
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { data: enrolments } = await supabase
        .from('enrollments')
        .select('cohort_id')
        .eq('user_id', user.id)
        .neq('status', 'dropped');

      const cohortIds = (enrolments ?? []).map((e) => e.cohort_id).filter(Boolean);
      if (cohortIds.length === 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, slot_start, slot_end, status, lesson_name, module_num, teacher_id')
        .in('cohort_id', cohortIds)
        .eq('status', 'scheduled')
        .gte('slot_start', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order('slot_start', { ascending: true })
        .limit(1);

      const next = bookings?.[0];
      if (cancelled) return;

      if (next) {
        setBooking(next as NextBooking);
        const teacherId = (next as { teacher_id?: string }).teacher_id;
        if (teacherId) {
          const { data: teacher } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', teacherId)
            .maybeSingle();
          if (!cancelled) setTeacherName(teacher?.full_name ?? null);
        }
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const win = booking ? joinWindow(booking.slot_start, booking.slot_end, now) : null;

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>

          {!booking ? (
            <div className="card card--feature text-center">
              <CalendarClock className="w-8 h-8 mx-auto text-slate-300 mb-4" />
              <h1 className="text-xl font-bold text-slate-900 mb-2">No class scheduled yet</h1>
              <p className="text-[15px] text-slate-600 leading-[1.65]">
                Once your batch is scheduled, your next class will appear here with the exact date
                and time.
              </p>
            </div>
          ) : (
            <div className="card card--feature">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-3">
                Your next class
              </p>

              {/* The date and time, in the learner's own timezone. This is the
                  whole reason the page exists — say it first and say it big. */}
              <h1 className="text-[2rem] sm:text-4xl font-bold tracking-[-0.02em] text-slate-900 leading-[1.1] mb-3">
                {new Date(booking.slot_start).toLocaleString(undefined, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: timezone,
                })}
              </h1>

              <p className="text-lg text-slate-600 mb-1">
                That is{' '}
                <span className="font-semibold text-slate-900">
                  {win && win.state === 'open' ? 'now' : humanCountdown(win?.msUntilOpen ?? 0)}
                </span>
                .
              </p>
              <p className="text-[13px] text-slate-500">
                Times shown in your timezone ({timezone}).
              </p>

              <dl className="card-meta grid sm:grid-cols-2 gap-4 text-[14px]">
                {teacherName && (
                  <div>
                    <dt className="text-slate-500 text-[12.5px] mb-0.5">Teacher</dt>
                    <dd className="font-semibold text-slate-900">{teacherName}</dd>
                  </div>
                )}
                {booking.lesson_name && (
                  <div>
                    <dt className="text-slate-500 text-[12.5px] mb-0.5">Lesson</dt>
                    <dd className="font-semibold text-slate-900">{booking.lesson_name}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6">
                {win?.state === 'open' ? (
                  <Link
                    href="/dashboard/student"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[15px] font-semibold transition-colors w-full sm:w-auto"
                  >
                    <Video className="w-4 h-4" />
                    Join now
                  </Link>
                ) : (
                  <p className="text-[14px] text-slate-600 leading-[1.65]">
                    The link opens {JOIN_OPENS_MINUTES_BEFORE} minutes before the class starts.
                    You do not need to do anything until then — we will be waiting for you.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
