'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar, Clock, Users, Video, Loader2, AlertCircle,
  CheckCircle2, XCircle, UserX, ChevronRight, GraduationCap, Sparkles,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import {
  fetchTeacherStats, fetchTeacherBookings, fetchTeacherStudents, updateBookingStatus,
  type TeacherStats, type TeacherBookingRow, type TeacherStudentRow,
} from '@/lib/dashboard/teacher-data';
import { getTrackName } from '@/lib/dashboard/upsell-engine';

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
    if (timezone) opts.timeZone = timezone;
    return date.toLocaleString('en-US', opts);
  } catch {
    return iso;
  }
}

function formatDuration(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const minutes = Math.round((end - start) / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  } catch {
    return '';
  }
}

const BOOKING_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Cancelled' },
  no_show: { bg: 'bg-red-100', text: 'text-red-700', label: 'No-show' },
};

const ENROLLMENT_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  completed: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Completed' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
  dropped: { bg: 'bg-red-100', text: 'text-red-700', label: 'Dropped' },
};

/* ───── Stat card ───── */
function StatCard({ icon: Icon, color, value, label, loading }: {
  icon: React.ComponentType<{ className?: string }>;
  color: string; value: string | number; label: string; loading?: boolean;
}) {
  return (
    <div className="card-3d p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-extrabold text-slate-900">
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

/* ───── Booking card (schedule) ───── */
function BookingCard({
  booking, timezone, onStatusChange,
}: {
  booking: TeacherBookingRow;
  timezone: string | null;
  onStatusChange: (id: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no_show') => Promise<void>;
}) {
  const [processing, setProcessing] = useState(false);
  const meetUrl = booking.google_meet_url || booking.cohort_meet_url;
  const status = BOOKING_STATUS[booking.status] || BOOKING_STATUS.scheduled;
  const isPast = new Date(booking.slot_start) < new Date();
  const trackName = getTrackName(booking.cohort_track);

  const handleStatus = async (newStatus: 'completed' | 'no_show' | 'cancelled') => {
    setProcessing(true);
    await onStatusChange(booking.id, newStatus);
    setProcessing(false);
  };

  return (
    <div className="card-3d p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {levelDisplay(booking.cohort_level)} · {booking.cohort_ratio} · {formatDuration(booking.slot_start, booking.slot_end)}
          </div>
          <h4 className="font-extrabold text-slate-900 text-base leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {trackName}
          </h4>
          <div className="text-xs text-slate-500 mt-0.5">
            {formatSessionTime(booking.slot_start, timezone)}
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.bg} ${status.text}`}>
          {status.label.toUpperCase()}
        </span>
      </div>

      {/* Meet link + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {meetUrl && (
          <a
            href={meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors min-h-[40px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Video className="w-4 h-4" /> Join Meet
          </a>
        )}

        {/* Action buttons — only show for past scheduled sessions */}
        {booking.status === 'scheduled' && isPast && (
          <>
            <button
              onClick={() => handleStatus('completed')}
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 min-h-[40px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark Complete
            </button>
            <button
              onClick={() => handleStatus('no_show')}
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold disabled:opacity-50 min-h-[40px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <UserX className="w-3.5 h-3.5" /> No-show
            </button>
          </>
        )}

        {/* Cancel button — for upcoming scheduled sessions */}
        {booking.status === 'scheduled' && !isPast && (
          <button
            onClick={() => handleStatus('cancelled')}
            disabled={processing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold disabled:opacity-50 min-h-[40px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ───── Student card ───── */
function StudentCard({ student }: { student: TeacherStudentRow }) {
  const status = ENROLLMENT_STATUS[student.status] || ENROLLMENT_STATUS.active;
  const trackName = getTrackName(student.track);
  const displayName = student.student_name || student.student_email || 'Unknown student';

  return (
    <div className="card-3d p-5">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-slate-900 text-sm leading-tight truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {displayName}
          </h4>
          {student.student_email && student.student_name && (
            <div className="text-xs text-slate-500 truncate mt-0.5">{student.student_email}</div>
          )}
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.bg} ${status.text}`}>
          {status.label.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-slate-400 mb-0.5">Track</div>
          <div className="font-bold text-slate-700 truncate">{trackName}</div>
        </div>
        <div>
          <div className="text-slate-400 mb-0.5">Level</div>
          <div className="font-bold text-slate-700">{levelDisplay(student.level)} · {student.ratio}</div>
        </div>
      </div>
    </div>
  );
}

/* ───── Main page ───── */
function TeacherDashboardInner() {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || 'Teacher';
  const userTimezone = profile?.timezone || null;

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bookings, setBookings] = useState<TeacherBookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [students, setStudents] = useState<TeacherStudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAll = useCallback(async () => {
    const [s, b, st] = await Promise.all([
      fetchTeacherStats(),
      fetchTeacherBookings(bookingFilter),
      fetchTeacherStudents(),
    ]);
    setStats(s);
    setStatsLoading(false);
    setBookings(b);
    setBookingsLoading(false);
    setStudents(st);
    setStudentsLoading(false);
  }, [bookingFilter]);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleStatusChange = async (
    bookingId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  ) => {
    const result = await updateBookingStatus(bookingId, status);
    if (result.success) {
      setToast({ type: 'success', message: `Session marked as ${status.replace('_', '-')}` });
      await loadAll();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to update session' });
    }
  };

  return (
    <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-green-600" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Teacher Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Welcome, {displayName.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-600 mt-1.5 text-sm">
            Your schedule, students, and session history at a glance.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <StatCard icon={Calendar} color="bg-green-100 text-green-600" value={stats?.classesThisWeek ?? 0} label="Classes this week" loading={statsLoading} />
          <StatCard icon={Users} color="bg-blue-100 text-blue-600" value={stats?.activeStudents ?? 0} label="Active students" loading={statsLoading} />
          <StatCard icon={Clock} color="bg-violet-100 text-violet-600" value={`${stats?.hoursTaught ?? 0}h`} label="Hours taught" loading={statsLoading} />
        </div>

        {/* Schedule */}
        <div className="mb-10" id="schedule">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <Calendar className="w-5 h-5 text-green-600" />
              My Schedule
            </h2>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 gap-1">
              {(['upcoming', 'past', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setBookingFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    bookingFilter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {bookingFilter === 'upcoming' ? 'No upcoming sessions' : bookingFilter === 'past' ? 'No past sessions yet' : 'No sessions scheduled'}
              </h3>
              <p className="text-sm text-slate-500">
                When the admin assigns you to an active cohort and creates bookings, your class times will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  timezone={userTimezone}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Students */}
        <div className="mb-10" id="students">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Users className="w-5 h-5 text-blue-600" />
            My Students
            {students.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                {students.length}
              </span>
            )}
          </h2>
          {studentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : students.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                No students assigned yet
              </h3>
              <p className="text-sm text-slate-500">
                Students will appear here once you're assigned to a cohort with active enrollments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(s => (
                <StudentCard key={s.enrollment_id} student={s} />
              ))}
            </div>
          )}
        </div>

        {/* Help card */}
        <div>
          <div className="card-3d p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Teaching tips
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Use the same Google Meet link for all sessions in a cohort. Mark sessions as "Complete" right after they end so your hours-taught stat stays accurate.
                </p>
                <Link href="/settings" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Update your timezone in settings <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function TeacherDashboard() {
  return (
    <DashboardLayout>
      <TeacherDashboardInner />
    </DashboardLayout>
  );
}
