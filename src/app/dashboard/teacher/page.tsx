'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar, Clock, Users, Video, Loader2, AlertCircle,
  CheckCircle2, XCircle, UserX, ChevronRight, GraduationCap, Sparkles,
  Plus, Edit3, Save, StickyNote, X,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import {
  fetchTeacherStats, fetchTeacherBookings, fetchTeacherStudents, updateBookingStatus,
  fetchSessionStudents, markAttendance, saveSessionNote, rescheduleBooking, createBooking, fetchTeacherCohorts,
  type TeacherStats, type TeacherBookingRow, type TeacherStudentRow,
  type SessionStudentRow, type TeacherCohortRow,
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
  booking, timezone, onStatusChange, onManage, onReschedule,
}: {
  booking: TeacherBookingRow;
  timezone: string | null;
  onStatusChange: (id: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no_show') => Promise<void>;
  onManage?: (booking: TeacherBookingRow) => void;
  onReschedule?: (booking: TeacherBookingRow) => void;
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

        {/* Students + Reschedule buttons — available for all bookings */}
        {onManage && (
          <button
            onClick={() => onManage(booking)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors min-h-[40px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Users className="w-3.5 h-3.5" /> Students
          </button>
        )}
        {onReschedule && booking.status === 'scheduled' && (
          <button
            onClick={() => onReschedule(booking)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors min-h-[40px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Edit3 className="w-3.5 h-3.5" /> Reschedule
          </button>
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

/* ───── Date/time helpers (local-time ↔ ISO) ───── */
function toLocalDateInput(iso: string): string {
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

function toLocalTimeInput(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '09:00';
  }
}

function durationMinutes(startIso: string, endIso: string): number {
  try {
    const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
    return Math.max(15, Math.round(ms / (1000 * 60)));
  } catch {
    return 60;
  }
}

function combineDateTime(dateStr: string, timeStr: string, durationMin: number): { start: string; end: string } | null {
  if (!dateStr || !timeStr) return null;
  // Build a local-time Date (no timezone shift) so the saved ISO represents
  // the wall-clock time the teacher picked in their browser.
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const start = new Date(y, m - 1, d, hh, mm, 0, 0);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

const ATTENDANCE_OPTIONS: Array<{ key: 'present' | 'late' | 'absent' | 'excused'; label: string; inactive: string; active: string }> = [
  { key: 'present', label: 'Present', inactive: 'bg-green-50 hover:bg-green-100 text-green-700', active: 'bg-green-600 text-white' },
  { key: 'late', label: 'Late', inactive: 'bg-amber-50 hover:bg-amber-100 text-amber-700', active: 'bg-amber-600 text-white' },
  { key: 'absent', label: 'Absent', inactive: 'bg-red-50 hover:bg-red-100 text-red-700', active: 'bg-red-600 text-white' },
  { key: 'excused', label: 'Excused', inactive: 'bg-slate-100 hover:bg-slate-200 text-slate-700', active: 'bg-slate-600 text-white' },
];

/* ───── Session details modal — roster, attendance, notes ───── */
function SessionDetailsModal({
  booking, onClose, onToast,
}: {
  booking: TeacherBookingRow | null;
  onClose: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
}) {
  const [roster, setRoster] = useState<SessionStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  // Per-student editable note draft (string). Kept in a map so we don't
  // mutate the roster array on every keystroke.
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const [attBusy, setAttBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!booking) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      setLoading(true);
      setRoster([]);
      setNoteDrafts({});
    });
    fetchSessionStudents(booking.id).then(rows => {
      if (cancelled) return;
      setRoster(rows);
      const drafts: Record<string, string> = {};
      rows.forEach(r => { drafts[r.user_id] = r.note ?? ''; });
      Promise.resolve().then(() => setNoteDrafts(drafts));
      Promise.resolve().then(() => setLoading(false));
    });
    return () => { cancelled = true; };
  }, [booking]);

  if (!booking) return null;
  const trackName = getTrackName(booking.cohort_track);

  const handleAttendance = async (studentId: string, status: 'present' | 'late' | 'absent' | 'excused') => {
    setAttBusy(prev => ({ ...prev, [studentId]: true }));
    const res = await markAttendance(booking.id, studentId, status);
    setAttBusy(prev => ({ ...prev, [studentId]: false }));
    if (res.success) {
      setRoster(prev => prev.map(r => r.user_id === studentId ? { ...r, attendance_status: status } : r));
      onToast(`Marked ${status}`, 'success');
    } else {
      onToast(res.error || 'Failed to update attendance', 'error');
    }
  };

  const handleSaveNote = async (studentId: string) => {
    const content = noteDrafts[studentId] ?? '';
    setSavingNote(prev => ({ ...prev, [studentId]: true }));
    const res = await saveSessionNote(booking.id, studentId, content);
    setSavingNote(prev => ({ ...prev, [studentId]: false }));
    if (res.success) {
      setRoster(prev => prev.map(r => r.user_id === studentId ? { ...r, note: content } : r));
      onToast('Note saved', 'success');
    } else {
      onToast(res.error || 'Failed to save note', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Session roster — ${trackName}`}
        className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {levelDisplay(booking.cohort_level)} · {booking.cohort_ratio}
            </div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {trackName}
            </h3>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatSessionTime(booking.slot_start, null)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-green-600" />
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                No students enrolled in this cohort yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {roster.map(student => {
                const displayName = student.student_name || student.student_email || 'Unknown student';
                const total = student.total_lessons || 0;
                const completed = student.lessons_completed || 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const currentStatus = (student.attendance_status ?? '') as string;
                return (
                  <div key={student.user_id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                        aria-hidden="true"
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          {displayName}
                        </h4>
                        {student.student_email && student.student_name && (
                          <div className="text-xs text-slate-500 truncate">{student.student_email}</div>
                        )}
                      </div>
                      {/* Lesson progress */}
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Progress</div>
                        <div className="text-xs font-bold text-slate-700">
                          {total > 0 ? `${completed}/${total} · ${pct}%` : `${completed} lessons`}
                        </div>
                      </div>
                    </div>

                    {/* Attendance row */}
                    <div className="mb-3">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Attendance</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ATTENDANCE_OPTIONS.map(opt => {
                          const isActive = currentStatus === opt.key;
                          const busy = !!attBusy[student.user_id];
                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleAttendance(student.user_id, opt.key)}
                              disabled={busy}
                              className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 min-h-[32px] ${
                                isActive ? opt.active : opt.inactive
                              }`}
                              style={{ fontFamily: 'var(--font-grotesk)' }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Note */}
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> Session note
                      </div>
                      <textarea
                        value={noteDrafts[student.user_id] ?? ''}
                        onChange={e => setNoteDrafts(prev => ({ ...prev, [student.user_id]: e.target.value }))}
                        rows={2}
                        placeholder="Quick note about this student for this session…"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 resize-y"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      />
                      <div className="flex justify-end mt-1.5">
                        <button
                          onClick={() => handleSaveNote(student.user_id)}
                          disabled={!!savingNote[student.user_id]}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold disabled:opacity-50 min-h-[32px]"
                          style={{ fontFamily: 'var(--font-grotesk)' }}
                        >
                          {savingNote[student.user_id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save note
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ───── Reschedule modal ───── */
function RescheduleModal({
  booking, onClose, onToast, onDone,
}: {
  booking: TeacherBookingRow | null;
  onClose: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  onDone: () => void;
}) {
  const initialDate = booking ? toLocalDateInput(booking.slot_start) : '';
  const initialTime = booking ? toLocalTimeInput(booking.slot_start) : '09:00';
  const initialDuration = booking ? durationMinutes(booking.slot_start, booking.slot_end) : 60;

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(initialDuration);
  const [saving, setSaving] = useState(false);

  // Re-seed state when the booking prop changes (i.e. a different card opened it).
  useEffect(() => {
    if (!booking) return;
    Promise.resolve().then(() => {
      setDate(toLocalDateInput(booking.slot_start));
      setTime(toLocalTimeInput(booking.slot_start));
      setDuration(durationMinutes(booking.slot_start, booking.slot_end));
    });
  }, [booking]);

  if (!booking) return null;
  const trackName = getTrackName(booking.cohort_track);

  const handleSubmit = async () => {
    const combined = combineDateTime(date, time, duration);
    if (!combined) {
      onToast('Please pick a date and time', 'error');
      return;
    }
    setSaving(true);
    const res = await rescheduleBooking(booking.id, combined.start, combined.end);
    setSaving(false);
    if (res.success) {
      onToast('Session rescheduled', 'success');
      onDone();
      onClose();
    } else {
      onToast(res.error || 'Failed to reschedule', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Reschedule — ${trackName}`}
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Reschedule session
            </div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {trackName}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[60, 90, 120, 180].map(min => (
                <button
                  key={min}
                  onClick={() => setDuration(min)}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors min-h-[40px] ${
                    duration === min ? 'bg-green-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {min < 60 ? `${min}m` : min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h ${min % 60}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold min-h-[40px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 min-h-[40px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ───── Add session modal ───── */
function AddSessionModal({
  onClose, onToast, onDone,
}: {
  onClose: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  onDone: () => void;
}) {
  const [cohorts, setCohorts] = useState<TeacherCohortRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cohortId, setCohortId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTeacherCohorts().then(rows => {
      if (cancelled) return;
      setCohorts(rows);
      if (rows.length > 0) {
        Promise.resolve().then(() => setCohortId(rows[0].id));
      }
      Promise.resolve().then(() => setLoading(false));
    });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    if (!cohortId) {
      onToast('Please pick a cohort', 'error');
      return;
    }
    const combined = combineDateTime(date, time, duration);
    if (!combined) {
      onToast('Please pick a date and time', 'error');
      return;
    }
    setSaving(true);
    const res = await createBooking({
      cohortId,
      slotStart: combined.start,
      slotEnd: combined.end,
    });
    setSaving(false);
    if (res.success) {
      onToast('Session added', 'success');
      onDone();
      onClose();
    } else {
      onToast(res.error || 'Failed to create session', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        role="dialog"
        aria-modal="true"
        aria-label="Add a new session"
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Add a session
            </div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              New class booking
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-green-600" />
            </div>
          ) : cohorts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium">
                You need to be assigned to a cohort first
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Once an admin assigns you to an active cohort, you can create sessions here.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Cohort
                </label>
                <select
                  value={cohortId}
                  onChange={e => setCohortId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-white"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {cohorts.map(c => (
                    <option key={c.id} value={c.id}>
                      {getTrackName(c.track)} · {levelDisplay(c.level)} · {c.ratio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[60, 90, 120, 180].map(min => (
                    <button
                      key={min}
                      onClick={() => setDuration(min)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors min-h-[40px] ${
                        duration === min ? 'bg-green-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      {min < 60 ? `${min}m` : min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h ${min % 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && cohorts.length > 0 && (
          <div className="p-5 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold min-h-[40px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 min-h-[40px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add session
            </button>
          </div>
        )}
      </motion.div>
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

  // v2 — modal state
  const [manageBooking, setManageBooking] = useState<TeacherBookingRow | null>(null);
  const [rescheduleBookingState, setRescheduleBookingState] = useState<TeacherBookingRow | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);

  // Thin adapter so the v2 modals (which fire `(msg, kind?) => void`)
  // can drive the existing toast UI without changing its signature.
  const handleToast = useCallback((msg: string, kind?: 'success' | 'error') => {
    setToast({ type: kind || 'success', message: msg });
  }, []);

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
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                <Calendar className="w-5 h-5 text-green-600" />
                My Schedule
              </h2>
              <button
                onClick={() => setShowAddSession(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors min-h-[36px]"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <Plus className="w-3.5 h-3.5" /> Add session
              </button>
            </div>
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
                  onManage={(booking) => setManageBooking(booking)}
                  onReschedule={(booking) => setRescheduleBookingState(booking)}
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

      {/* v2 modals */}
      <AnimatePresence>
        {manageBooking && (
          <SessionDetailsModal
            booking={manageBooking}
            onClose={() => setManageBooking(null)}
            onToast={handleToast}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {rescheduleBookingState && (
          <RescheduleModal
            booking={rescheduleBookingState}
            onClose={() => setRescheduleBookingState(null)}
            onToast={handleToast}
            onDone={loadAll}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddSession && (
          <AddSessionModal
            onClose={() => setShowAddSession(false)}
            onToast={handleToast}
            onDone={loadAll}
          />
        )}
      </AnimatePresence>

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
