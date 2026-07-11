'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen, Clock, Calendar, ArrowRight, Sparkles, Rocket,
  TrendingUp, Video, Loader2, AlertCircle, ChevronRight,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { TRACKS } from '@/lib/sariro-data';
import { createClient } from '@/lib/supabase/client';
import {
  getUpsellRecommendation,
  getTrackName,
  type UpsellRecommendation,
} from '@/lib/dashboard/upsell-engine';

/* ───── Types ───── */
interface Enrollment {
  id: string;
  track: string;
  level: string;
  ratio: string;
  status: string;
  cohort_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  completion_shown_at: string | null;
}

interface Booking {
  id: string;
  cohort_id: string;
  teacher_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  google_meet_url: string | null;
}

interface Cohort {
  id: string;
  track: string;
  level: string;
  ratio: string;
  status: string;
  google_meet_url: string | null;
}

/* ───── Helpers ───── */
function levelDisplay(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatSessionTime(iso: string, timezone: string | null): string {
  try {
    const date = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    };
    if (timezone) {
      opts.timeZone = timezone;
    }
    return date.toLocaleString('en-US', opts);
  } catch {
    return iso;
  }
}

/* ───── Empty state for new students ───── */
function EmptyCoursesState() {
  return (
    <div className="card-3d p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
        No courses yet
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
        Buy your first course to start your journey. Browse the catalog and reserve your seat — cohorts form weekly.
      </p>
      <Link href="/courses" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm inline-flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Browse courses
      </Link>
    </div>
  );
}

/* ───── Course card ───── */
function CourseCard({ enrollment }: { enrollment: Enrollment }) {
  const trackName = getTrackName(enrollment.track);
  const isActive = enrollment.status === 'active';
  const isCompleted = enrollment.status === 'completed';

  return (
    <div className="card-3d p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {levelDisplay(enrollment.level)} · {enrollment.ratio}
          </div>
          <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {trackName}
          </h4>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${
          isActive ? 'bg-green-100 text-green-700'
          : isCompleted ? 'bg-violet-100 text-violet-700'
          : 'bg-amber-100 text-amber-700'
        }`}>
          {enrollment.status.toUpperCase()}
        </span>
      </div>
      {enrollment.started_at && (
        <div className="text-xs text-slate-500 mb-3">
          Started {new Date(enrollment.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
      {isCompleted && enrollment.completed_at && (
        <div className="text-xs text-violet-600 font-bold mb-3">
          Completed {new Date(enrollment.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
      <Link
        href={`/course-path/${enrollment.track}`}
        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        View course details <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

/* ───── Schedule card ───── */
function ScheduleCard({ booking, cohort, timezone }: { booking: Booking; cohort?: Cohort; timezone: string | null }) {
  const meetUrl = booking.google_meet_url || cohort?.google_meet_url;
  const trackName = cohort ? getTrackName(cohort.track) : 'Your session';
  return (
    <div className="card-3d p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {booking.status === 'scheduled' ? 'Upcoming' : booking.status.toUpperCase()}
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {trackName}
          </h4>
        </div>
        <Clock className="w-5 h-5 text-slate-400 shrink-0" />
      </div>
      <div className="text-sm text-slate-700 mb-3">
        {formatSessionTime(booking.slot_start, timezone)}
      </div>
      {meetUrl && (
        <a
          href={meetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors min-h-[40px]"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Video className="w-4 h-4" /> Join Google Meet
        </a>
      )}
    </div>
  );
}

/* ───── Recommended next card (persistent on dashboard) ───── */
function RecommendedNextCard({ rec, completedTrackName, completedLevel }: {
  rec: UpsellRecommendation;
  completedTrackName: string;
  completedLevel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #0F172A 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Recommended next step
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {levelDisplay(rec.next_level)} {rec.next_track_name}
        </h3>
        <p className="text-sm text-white/85 mb-5 max-w-lg">
          You finished {completedTrackName} — {completedLevel}. {rec.body.split('. ').slice(0, 2).join('. ')}.
        </p>
        <Link
          href={`/course-path/${rec.next_track_id}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-white/95 transition-colors min-h-[44px]"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          Continue to {levelDisplay(rec.next_level)} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

/* ───── Main page ───── */
function StudentDashboardInner() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cohorts, setCohorts] = useState<Record<string, Cohort>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{
    rec: UpsellRecommendation;
    completedTrackName: string;
    completedLevel: string;
  } | null>(null);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const firstName = displayName.split(' ')[0];
  const userTimezone = profile?.timezone || null;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch user's enrollments
        const { data: enrollmentsData, error: enrollmentsErr } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (enrollmentsErr) throw enrollmentsErr;
        if (cancelled) return;

        const enrollmentList = (enrollmentsData || []) as Enrollment[];
        setEnrollments(enrollmentList);

        // 2. Fetch cohort IDs from active enrollments
        const cohortIds = enrollmentList
          .map(e => e.cohort_id)
          .filter((id): id is string => id !== null);

        let cohortMap: Record<string, Cohort> = {};
        if (cohortIds.length > 0) {
          const { data: cohortData, error: cohortErr } = await supabase
            .from('cohorts')
            .select('*')
            .in('id', cohortIds);
          if (cohortErr) throw cohortErr;
          if (cancelled) return;
          cohortMap = (cohortData || []).reduce((acc, c) => {
            acc[c.id] = c as Cohort;
            return acc;
          }, {} as Record<string, Cohort>);
          setCohorts(cohortMap);
        }

        // 3. Fetch upcoming bookings for those cohorts
        if (cohortIds.length > 0) {
          const now = new Date().toISOString();
          const { data: bookingData, error: bookingErr } = await supabase
            .from('bookings')
            .select('*')
            .in('cohort_id', cohortIds)
            .gte('slot_start', now)
            .order('slot_start', { ascending: true })
            .limit(5);
          if (bookingErr) throw bookingErr;
          if (cancelled) return;
          setBookings((bookingData || []) as Booking[]);
        }

        // 4. Find a completed enrollment to build the "Recommended next" card
        // (popup will handle the FIRST unshown one; this card handles the most
        // recent completed one regardless of shown status — gives a persistent
        // recommendation even after the popup is dismissed)
        const completed = enrollmentList.find(e => e.status === 'completed');
        if (completed) {
          const enrollmentForRec = {
            id: completed.id,
            track: completed.track,
            level: completed.level as 'beginner' | 'intermediate' | 'advanced',
            track_name: getTrackName(completed.track),
          };
          const rec = getUpsellRecommendation(enrollmentForRec, firstName);
          if (!cancelled) {
            setRecommendation({
              rec,
              completedTrackName: enrollmentForRec.track_name,
              completedLevel: levelDisplay(completed.level),
            });
          }
        }
      } catch (err: unknown) {
        console.warn('[student-dashboard] load error:', err);
        const msg = err instanceof Error ? err.message : 'Failed to load your dashboard';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [user, supabase, firstName]);

  return (
    <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Student Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Hey {firstName}! 👋
          </h1>
          <p className="text-slate-600 mt-1.5 text-sm sm:text-base">
            Welcome back. Here's your learning journey at a glance.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="card-3d p-6 border-l-4 border-red-400">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Couldn't load your dashboard</h3>
                <p className="text-sm text-slate-600">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-3 text-xs font-bold text-blue-600">
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Recommended next (only if user has completed a course) */}
            {recommendation && (
              <div className="mb-8">
                <RecommendedNextCard
                  rec={recommendation.rec}
                  completedTrackName={recommendation.completedTrackName}
                  completedLevel={recommendation.completedLevel}
                />
              </div>
            )}

            {/* My Courses */}
            <div className="mb-10">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                <BookOpen className="w-5 h-5 text-blue-600" /> My Courses
              </h2>
              {enrollments.length === 0 ? (
                <EmptyCoursesState />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map((e) => (
                    <CourseCard key={e.id} enrollment={e} />
                  ))}
                </div>
              )}
            </div>

            {/* My Schedule */}
            <div className="mb-10" id="schedule">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Sessions
              </h2>
              {bookings.length === 0 ? (
                <div className="card-3d p-6 text-center">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    No sessions scheduled yet. Once your cohort is activated, your class times will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((b) => (
                    <ScheduleCard
                      key={b.id}
                      booking={b}
                      cohort={b.cohort_id ? cohorts[b.cohort_id] : undefined}
                      timezone={userTimezone}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Browse all tracks (always shown for discoverability) */}
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                <TrendingUp className="w-5 h-5 text-blue-600" /> Explore Tracks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TRACKS.map((track) => (
                  <Link
                    key={track.id}
                    href={`/course-path/${track.id}`}
                    className="card-3d p-4 hover:shadow-lg transition-shadow group"
                  >
                    <h4 className="font-bold text-slate-900 text-sm mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {track.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{track.tagline}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600">
                      Beginner → Advanced <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  return (
    <DashboardLayout>
      <StudentDashboardInner />
    </DashboardLayout>
  );
}
