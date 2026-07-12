'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen, Clock, Calendar, ArrowRight, Sparkles, Rocket,
  TrendingUp, Video, Loader2, AlertCircle, ChevronRight,
  ChevronDown, ChevronUp, CheckCircle2, Circle, Download, FolderOpen,
  Trash2, X, Award, Users, CalendarPlus,
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
import {
  fetchLessonProgress, markLessonComplete, unmarkLesson,
  calculateProgress, getCourseSyllabus, dropCourse, fetchCohortMaterials,
  type LessonProgressRow,
} from '@/lib/dashboard/student-data';

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
  // Optional single-URL materials column (added by student-v2-migration).
  // Falls back to cohort_materials table rows when absent.
  materials_url?: string | null;
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
function CourseCard({ enrollment, cohort, onChanged }: {
  enrollment: Enrollment;
  cohort?: Cohort;
  onChanged?: () => void;
}) {
  const trackName = getTrackName(enrollment.track);
  const isActive = enrollment.status === 'active';
  const isCompleted = enrollment.status === 'completed';
  const isDropped = enrollment.status === 'dropped';

  const [progressRows, setProgressRows] = useState<LessonProgressRow[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [hasMaterials, setHasMaterials] = useState(false);

  const syllabus = getCourseSyllabus(enrollment.track, enrollment.level);
  const progress = calculateProgress(enrollment.track, enrollment.level, progressRows);

  // Fetch lesson progress rows + detect cohort materials (best-effort).
  useEffect(() => {
    if (!enrollment.id) return;
    let cancelled = false;
    const load = async () => {
      const rows = await fetchLessonProgress(enrollment.id);
      if (cancelled) return;
      Promise.resolve().then(() => setProgressRows(rows));
      // Only hit the cohort_materials table when the simpler materials_url
      // column isn't already set on the cohort row.
      if (cohort?.id && !cohort.materials_url) {
        const materials = await fetchCohortMaterials(cohort.id);
        if (cancelled) return;
        Promise.resolve().then(() => setHasMaterials(materials.length > 0));
      }
    };
    load();
    return () => { cancelled = true; };
  }, [enrollment.id, cohort?.id, cohort?.materials_url]);

  const toggleLesson = async (moduleNum: string, lessonName: string, currentlyCompleted: boolean) => {
    if (currentlyCompleted) {
      await unmarkLesson(enrollment.id, moduleNum, lessonName);
      Promise.resolve().then(() =>
        setProgressRows((prev) =>
          prev.filter((r) => !(r.module_num === moduleNum && r.lesson_name === lessonName))
        )
      );
    } else {
      await markLessonComplete(enrollment.id, moduleNum, lessonName);
      Promise.resolve().then(() =>
        setProgressRows((prev) => [
          ...prev,
          {
            id: `${enrollment.id}-${moduleNum}-${lessonName}`,
            enrollment_id: enrollment.id,
            module_num: moduleNum,
            lesson_name: lessonName,
            completed_at: new Date().toISOString(),
          },
        ])
      );
    }
  };

  const handleDrop = async () => {
    setDropping(true);
    const result = await dropCourse(enrollment.id);
    Promise.resolve().then(() => setDropping(false));
    if (result.success) {
      Promise.resolve().then(() => setShowDropModal(false));
      onChanged?.();
    } else {
      console.warn('[CourseCard] drop failed:', result.error);
      Promise.resolve().then(() => setShowDropModal(false));
    }
  };

  const showMaterialsLink = Boolean(cohort?.materials_url) || hasMaterials;
  const materialsUrl = cohort?.materials_url ?? null;

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
          : isDropped ? 'bg-red-100 text-red-700'
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

      {/* Progress bar (hidden for dropped enrollments or empty syllabi) */}
      {!isDropped && syllabus.totalLessons > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 font-bold" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {progress.completedLessons}/{progress.totalLessons} lessons
            </span>
            <span className="text-slate-500">{progress.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${isCompleted ? 'bg-violet-500' : 'bg-blue-500'}`}
            />
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Link
          href={`/course-path/${enrollment.track}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          View course details <ChevronRight className="w-3 h-3" />
        </Link>

        {syllabus.modules.length > 0 && !isDropped && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors min-h-[32px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Lessons
          </button>
        )}

        {showMaterialsLink && (
          materialsUrl ? (
            <a
              href={materialsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors min-h-[32px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <FolderOpen className="w-3 h-3" /> Materials
            </a>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-slate-400"
              style={{ fontFamily: 'var(--font-grotesk)' }}
              title="Materials are available for this cohort"
            >
              <FolderOpen className="w-3 h-3" /> Materials
            </span>
          )
        )}

        {isCompleted && (
          <Link
            href={`/certificate/${enrollment.id}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-violet-700 hover:bg-violet-50 transition-colors min-h-[32px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Award className="w-3 h-3" /> Certificate
          </Link>
        )}

        {isActive && (
          <button
            type="button"
            onClick={() => setShowDropModal(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-red-600 hover:bg-red-50 transition-colors ml-auto min-h-[32px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Trash2 className="w-3 h-3" /> Drop
          </button>
        )}
      </div>

      {/* Expandable lesson checklist */}
      {expanded && !isDropped && syllabus.modules.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 max-h-72 overflow-y-auto pr-1">
          {syllabus.modules.map((mod) => (
            <div key={mod.num}>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Module {mod.num} · {mod.name}
              </div>
              <ul className="space-y-1">
                {mod.lessons.map((lesson) => {
                  const done = progress.completedKeys.has(`${mod.num}::${lesson}`);
                  return (
                    <li key={`${mod.num}-${lesson}`}>
                      <button
                        type="button"
                        onClick={() => toggleLesson(mod.num, lesson, done)}
                        className="flex items-start gap-2 w-full text-left text-xs text-slate-700 hover:text-slate-900 group min-h-[32px]"
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 group-hover:text-slate-400" />
                        )}
                        <span className={done ? 'line-through text-slate-400' : ''}>{lesson}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Drop confirmation modal */}
      {showDropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-extrabold text-slate-900 text-lg" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Drop this course?
              </h3>
              <button
                type="button"
                onClick={() => setShowDropModal(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              You&apos;re about to drop <span className="font-bold text-slate-900">{trackName}</span>. You&apos;ll lose access to live sessions and progress tracking. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDropModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDrop}
                disabled={dropping}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {dropping ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Drop course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Schedule card ───── */

/** Builds an RFC 5545 .ics string for a single booking. */
function buildICS(booking: Booking, cohort?: Cohort): string {
  const trackName = cohort ? getTrackName(cohort.track) : 'Your session';
  const meetUrl = booking.google_meet_url || cohort?.google_meet_url || '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };
  const escapeICS = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const description = meetUrl
    ? `Sariro live session. Join: ${meetUrl}`
    : 'Sariro live session.';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sariro//Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@sariro`,
    `DTSTAMP:${fmtDate(new Date().toISOString())}`,
    `DTSTART:${fmtDate(booking.slot_start)}`,
    `DTEND:${fmtDate(booking.slot_end)}`,
    `SUMMARY:${escapeICS(trackName)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(meetUrl || 'Online')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

/** Triggers a browser download of an .ics file for the booking. */
function downloadICS(booking: Booking, cohort?: Cohort) {
  const ics = buildICS(booking, cohort);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sariro-session-${booking.id.slice(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          type="button"
          onClick={() => downloadICS(booking, cohort)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors min-h-[40px]"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <CalendarPlus className="w-4 h-4" /> Add to Calendar
        </button>
      </div>
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

/* ───── Classmates section (violet accent) ───── */
function ClassmatesSection({ classmates }: {
  classmates: Array<{ name: string | null; email: string | null; track: string; level: string }>;
}) {
  if (classmates.length === 0) return null;
  return (
    <div className="mb-10">
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <Users className="w-5 h-5 text-violet-600" /> Classmates
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classmates.map((c, idx) => {
          const display = c.name || c.email?.split('@')[0] || 'Student';
          const initial = display.charAt(0).toUpperCase();
          return (
            <div
              key={`${c.email || 'peer'}-${idx}`}
              className="card-3d p-4 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-extrabold flex items-center justify-center shrink-0"
                style={{ fontFamily: 'var(--font-jakarta)' }}
                aria-hidden="true"
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {display}
                </div>
                <div className="text-xs text-slate-500 truncate" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {getTrackName(c.track)} · {levelDisplay(c.level)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  // v2: peers in the same cohorts (excludes self + dropped enrollments)
  const [classmates, setClassmates] = useState<Array<{ name: string | null; email: string | null; track: string; level: string }>>([]);

  // Cancellation flag preserved across the loadAll callback boundary.
  const cancelledRef = useRef(false);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const firstName = displayName.split(' ')[0];
  const userTimezone = profile?.timezone || null;

  // v2: extracted loader — called on mount AND after mutations (drop course).
  // Wrapped in useCallback so its identity is stable across renders and can
  // be safely passed to CourseCard as `onChanged`.
  const loadAll = useCallback(async () => {
    if (!user) return;
    cancelledRef.current = false;
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
      if (cancelledRef.current) return;

      const enrollmentList = (enrollmentsData || []) as Enrollment[];
      Promise.resolve().then(() => setEnrollments(enrollmentList));

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
        if (cancelledRef.current) return;
        cohortMap = (cohortData || []).reduce((acc, c) => {
          acc[c.id] = c as Cohort;
          return acc;
        }, {} as Record<string, Cohort>);
        Promise.resolve().then(() => setCohorts(cohortMap));
      } else {
        Promise.resolve().then(() => setCohorts({}));
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
        if (cancelledRef.current) return;
        Promise.resolve().then(() => setBookings((bookingData || []) as Booking[]));
      } else {
        Promise.resolve().then(() => setBookings([]));
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
        if (!cancelledRef.current) {
          Promise.resolve().then(() => setRecommendation({
            rec,
            completedTrackName: enrollmentForRec.track_name,
            completedLevel: levelDisplay(completed.level),
          }));
        }
      } else {
        Promise.resolve().then(() => setRecommendation(null));
      }

      // 5. v2 — Classmates: other students in the same cohorts (excludes self + dropped)
      if (cohortIds.length > 0) {
        const { data: classmateEnrollments, error: ceErr } = await supabase
          .from('enrollments')
          .select('user_id, track, level, status')
          .in('cohort_id', cohortIds)
          .neq('user_id', user.id)
          .neq('status', 'dropped');
        if (ceErr) throw ceErr;
        if (cancelledRef.current) return;

        type PeerEnrollment = { user_id: string; track: string; level: string; status: string };
        const peerRows = (classmateEnrollments || []) as PeerEnrollment[];
        const userIds = Array.from(new Set(peerRows.map(e => e.user_id)));

        let classmateProfiles: Array<{ id: string; full_name: string | null; email: string | null }> = [];
        if (userIds.length > 0) {
          const { data: profilesData, error: pErr } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
          if (pErr) throw pErr;
          classmateProfiles = (profilesData || []) as Array<{ id: string; full_name: string | null; email: string | null }>;
        }
        const profileMap = new Map(classmateProfiles.map(p => [p.id, p]));
        const list = peerRows.map(e => {
          const p = profileMap.get(e.user_id);
          return {
            name: p?.full_name ?? null,
            email: p?.email ?? null,
            track: e.track,
            level: e.level,
          };
        });
        Promise.resolve().then(() => setClassmates(list));
      } else {
        Promise.resolve().then(() => setClassmates([]));
      }
    } catch (err: unknown) {
      console.warn('[student-dashboard] load error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load your dashboard';
      if (!cancelledRef.current) {
        Promise.resolve().then(() => setError(msg));
      }
    } finally {
      if (!cancelledRef.current) {
        Promise.resolve().then(() => setLoading(false));
      }
    }
  }, [user, supabase, firstName]);

  useEffect(() => {
    loadAll();
    return () => { cancelledRef.current = true; };
  }, [loadAll]);

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
                    <CourseCard
                      key={e.id}
                      enrollment={e}
                      cohort={e.cohort_id ? cohorts[e.cohort_id] : undefined}
                      onChanged={loadAll}
                    />
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

            {/* Classmates (v2 — only rendered when peers exist) */}
            <ClassmatesSection classmates={classmates} />

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
