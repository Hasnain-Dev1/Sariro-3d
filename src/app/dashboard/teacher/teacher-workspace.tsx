'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Users, Video, Loader2, AlertCircle, ClipboardCheck,
  CheckCircle2, XCircle, UserX, ChevronRight, Sparkles,
  Plus, Save, StickyNote, X, CalendarPlus, BarChart3, PenLine, BookOpen, Trophy, Settings,
  Star, ExternalLink, FolderOpen, MessageCircle, CalendarClock, Compass, Coins, Mic,
} from 'lucide-react';
import { BatchRescheduleModal } from '@/components/dashboard/batch-reschedule-modal';
import MonitoringPanel from '@/components/dashboard/monitoring-panel';
import NextClassCard from '@/components/dashboard/next-class-card';
import TeacherEarnings from '@/components/dashboard/teacher-earnings';
import TeacherManagers from '@/components/dashboard/teacher-managers';
import { useAuth } from '@/components/auth/auth-provider';
import {
  fetchTeacherStats, fetchTeacherBookings, fetchTeacherStudents, updateBookingStatus,
  fetchSessionStudents, markAttendance, saveSessionNote, rescheduleBooking, createBooking, fetchTeacherCohorts,
  type TeacherStats, type TeacherBookingRow, type TeacherStudentRow,
  type SessionStudentRow, type TeacherCohortRow,
} from '@/lib/dashboard/teacher-data';
import {
  fetchSubmissionsForBooking,
  fetchPendingSubmissionsForTeacher,
  reviewSubmission,
  type SubmissionWithFeedback,
} from '@/lib/dashboard/submissions-data';
import { HoneypotField } from '@/components/security/honeypot';
import { getTrackName } from '@/lib/dashboard/upsell-engine';
import { useRealtime } from '@/lib/dashboard/use-realtime';
import { TeacherCalendar } from '@/components/dashboard/teacher-calendar';
import LowCreditPanel from '@/components/dashboard/low-credit-panel';
import CatchUpPanel from '@/components/dashboard/catchup-panel';
import { attendanceDeadline, deadlineTone } from '@/lib/dashboard/attendance-deadline';
import PracticeProgress from '@/components/speaking/practice-progress';
import QuestRecord from '@/components/speaking/quest/quest-record';
import NoRoomBanner from '@/components/dashboard/no-room-banner';
import ParentReportCard from '@/components/dashboard/parent-report-card';
import CapabilityChips from '@/components/dashboard/capability-chips';
import { teacherRating, recentRating, type ClassFeedback } from '@/lib/dashboard/class-feedback';
import { createClient } from '@/lib/supabase/client';
import PayHeldPanel from '@/components/dashboard/pay-held-panel';
import { fetchMyAssignments } from '@/lib/dashboard/teacher-assignments-data';
import RegistersToMark from '@/components/dashboard/registers-to-mark';
import TrialsAhead from '@/components/dashboard/trials-ahead';
import TodayQueue from '@/components/ops/today-queue';
import { useAttention } from '@/components/ops/attention-provider';
import { WorkspaceProvider, OpsSection, useShows, useOpsDo } from '@/components/ops/workspace';
import { WorkspaceTabs, WorkspaceHeader, WorkspaceTiles, WorkspaceAction } from '@/components/ops/workspace-chrome';
import { sectionHref, type WorkspaceKey } from '@/lib/ops/workspaces';

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

/* ───── Session details modal — roster, attendance, notes, submissions ───── */
function SessionDetailsModal({
  booking, onClose, onToast, onStatusChange,
}: {
  booking: TeacherBookingRow | null;
  onClose: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  onStatusChange: (bookingId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no_show') => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'roster' | 'submissions'>('roster');
  const [endingClass, setEndingClass] = useState(false);
  const [roster, setRoster] = useState<SessionStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  /* Which students' practice history is open. Closed by default and mounted
     only when opened, because a class of six would otherwise fire six queries
     for a panel nobody looked at. */
  const [practiceOpen, setPracticeOpen] = useState<Record<string, boolean>>({});
  // Per-student editable note draft (string). Kept in a map so we don't
  // mutate the roster array on every keystroke.
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});
  const [attBusy, setAttBusy] = useState<Record<string, boolean>>({});
  /**
   * The class recording, and whether this class has been closed.
   *
   * Submitting the link is what makes the recording visible to the students in
   * the class — V2 §18-19. Until it is submitted they see nothing at all, not a
   * disabled button, because there is nothing to promise yet.
   */
  const [recordingDraft, setRecordingDraft] = useState('');
  const [savingRecording, setSavingRecording] = useState(false);
  const [finalizedAt, setFinalizedAt] = useState<string | null>(null);
  /* What happened to the lesson when attendance was marked. A toast vanishes;
     this stays until the teacher closes the class. */
  const [lessonNote, setLessonNote] = useState<{ text: string; kind: 'ok' | 'warn' } | null>(null);

  useEffect(() => {
    if (!booking) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      setLoading(true);
      setRoster([]);
      setNoteDrafts({});
      setActiveTab('roster');
      setRecordingDraft(booking.recording_url ?? '');
      setFinalizedAt(booking.attendance_finalized_at ?? null);
      setLessonNote(null);
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
      /* Say what actually happened. The lesson advancing is the part that moves
         the student's progress bar, and it used to fail silently behind a
         cheerful "Marked present" — so a teacher had no way to know the child's
         progress had not moved. */
      if (res.lessonWarning) {
        setLessonNote({ text: res.lessonWarning, kind: 'warn' });
        onToast('Attendance saved — but the lesson did not advance', 'error');
      } else if (res.lessonMarked) {
        const which = res.lessonNumber ? `Lesson ${res.lessonNumber}` : 'The lesson';
        setLessonNote({ text: `${which} marked complete${res.lessonName ? ` — ${res.lessonName}` : ''}.`, kind: 'ok' });
        onToast(`Marked ${status} · ${which} complete`, 'success');
      } else {
        setLessonNote(null);
        onToast(`Marked ${status}`, 'success');
      }
    } else {
      onToast(res.error || 'Failed to update attendance', 'error');
    }
  };

  const handleFinalize = async () => {
    const url = recordingDraft.trim();
    if (!url) {
      onToast('Please submit the class recording link before finalizing attendance.', 'error');
      return;
    }
    setSavingRecording(true);
    try {
      const res = await fetch('/api/teacher/finalize-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, recordingUrl: url }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      if (j.ok) {
        setFinalizedAt((prev) => prev ?? new Date().toISOString());
        onToast(j.updated ? 'Recording link updated' : 'Class closed — students can watch it now', 'success');
      } else {
        onToast(j.message || 'Could not save the recording', 'error');
      }
    } catch {
      onToast('Network error — the recording was not saved', 'error');
    }
    setSavingRecording(false);
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
          <div className="flex items-center gap-2">
            {/* End Class + Student no-show — both fire the earning/credit flow.
                These moved here from the removed schedule list, so completion and
                student-no-show stay reachable after selecting a class. */}
            {booking.status === 'scheduled' && (
              <>
                <button
                  onClick={async () => {
                    setEndingClass(true);
                    await onStatusChange(booking.id, 'completed');
                    setEndingClass(false);
                  }}
                  disabled={endingClass}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 min-h-[44px] touch-manipulation"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {endingClass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">End Class</span>
                  <span className="sm:hidden">End</span>
                </button>
                <button
                  onClick={async () => {
                    setEndingClass(true);
                    await onStatusChange(booking.id, 'no_show');
                    setEndingClass(false);
                  }}
                  disabled={endingClass}
                  title="Student didn't show — completes the class and withholds half pay"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold disabled:opacity-50 min-h-[44px] touch-manipulation"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Student no-show</span>
                  <span className="sm:hidden">No-show</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Class recording ────────────────────────────────────────────
            Submitting this is what makes the recording visible to the students
            in this class. Until it is submitted they see nothing — V2 §18-19.
            Placed above the roster because it gates the roster's purpose: a
            class is not closed until this exists. */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor="recording-url"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Class recording
            </label>
            {finalizedAt ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3" />
                Students can watch this
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                <AlertCircle className="w-3 h-3" />
                Not shared yet
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="recording-url"
              type="url"
              inputMode="url"
              value={recordingDraft}
              onChange={(e) => setRecordingDraft(e.target.value)}
              placeholder="https://… paste the recording link"
              disabled={savingRecording}
              className="flex-1 min-w-0 min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={handleFinalize}
              disabled={savingRecording || !recordingDraft.trim()}
              className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {savingRecording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
              {finalizedAt ? 'Update' : 'Share'}
            </button>
          </div>
          <p className="text-[11.5px] text-slate-500 mt-1.5 leading-snug">
            {finalizedAt
              ? 'Students in this class can watch it from their dashboard.'
              : 'Students cannot see a recording until you share it here.'}
          </p>
        </div>

        {/* Tab bar — Roster / Submissions */}
        <div className="flex border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold transition-colors touch-manipulation ${
              activeTab === 'roster'
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Users className="w-3.5 h-3.5" />
            Roster
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold transition-colors touch-manipulation ${
              activeTab === 'submissions'
                ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Submissions
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'submissions' ? (
            <SubmissionsTab booking={booking} onToast={onToast} />
          ) : loading ? (
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
              {/* Which lesson this class is. Previously nowhere on the screen,
                  so a teacher had to count sessions to know where they were. */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  This class
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {booking.lesson_name
                    ? `${booking.module_num ? `Module ${booking.module_num} · ` : ''}${booking.lesson_name}`
                    : 'Lesson not set yet — it is assigned when you mark the first student.'}
                </p>
              </div>

              {/* §15 — the deadline, stated where the marking happens. */}
              {(() => {
                const d = attendanceDeadline(booking.slot_end, finalizedAt);
                const tone = deadlineTone(d.state);
                if (!d.label || !tone) return null;
                return (
                  <div
                    className="rounded-xl px-4 py-2.5 text-[13px] font-semibold"
                    style={{ color: tone.fg, background: tone.bg }}
                  >
                    {d.label}
                  </div>
                );
              })()}

              {/* What happened to the lesson on the last mark. A toast is gone
                  in three seconds; this is the part a teacher needs to act on. */}
              {lessonNote && (
                <div
                  className="rounded-xl border px-4 py-3 text-[13px] leading-[1.55]"
                  style={
                    lessonNote.kind === 'warn'
                      ? { borderColor: '#FCA5A5', background: '#FEF2F2', color: '#991B1B' }
                      : { borderColor: '#A7F3D0', background: '#ECFDF5', color: '#065F46' }
                  }
                >
                  {lessonNote.text}
                </div>
              )}

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

                    {/* What they did between classes. A teacher who opens a
                        class knowing this student has done nine speaking reps
                        this week teaches a different class. */}
                    <div className="mb-3">
                      <button
                        onClick={() => setPracticeOpen(prev => ({ ...prev, [student.user_id]: !prev[student.user_id] }))}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        <Mic className="w-3 h-3" />
                        {practiceOpen[student.user_id] ? 'Hide practice' : 'Practice between classes'}
                      </button>
                      {practiceOpen[student.user_id] && (
                        <div className="mt-2">
                          {/* The same report the parent sees. A teacher
                              walking into a call about renewal should be
                              looking at the same page the family is. */}
                          <ParentReportCard
                            userId={student.user_id}
                            childName={student.student_name || 'This student'}
                          />
                          {/* Homework and Voice Quest: did they practise, and did it pass. */}
                          <div className="mt-3">
                            <QuestRecord userId={student.user_id} name={student.student_name || 'This student'} />
                          </div>
                          <div className="mt-3">
                            <PracticeProgress
                              userId={student.user_id}
                              learnerName={student.student_name || 'This student'}
                              heading="Practice between classes"
                            />
                          </div>
                        </div>
                      )}
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

/* ───── Submissions tab — list + review each submission ───── */
function SubmissionsTab({
  booking,
  onToast,
}: {
  booking: TeacherBookingRow;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
}) {
  const [submissions, setSubmissions] = useState<SubmissionWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    const rows = await fetchSubmissionsForBooking(booking.id);
    setSubmissions(rows);
    setLoading(false);
  }, [booking.id]);

  useEffect(() => {
    let cancelled = false;
    // Defer setState to avoid cascading renders (matches existing pattern in SessionDetailsModal)
    Promise.resolve().then(() => setLoading(true));
    fetchSubmissionsForBooking(booking.id).then((rows) => {
      if (cancelled) return;
      setSubmissions(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [booking.id]);

  const refreshSubmissions = useCallback(() => {
    return loadSubmissions();
  }, [loadSubmissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-10">
        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
          No submissions yet
        </p>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Student capstone submissions for this class will appear here. Submissions unlock after the class ends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 mb-1">
        {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · click to review
      </div>
      {submissions.map((sub) => (
        <SubmissionReviewCard
          key={sub.id}
          submission={sub}
          isExpanded={expandedId === sub.id}
          onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
          onReviewed={() => {
            // Refresh submissions + collapse
            refreshSubmissions();
            setExpandedId(null);
          }}
          onToast={onToast}
        />
      ))}
    </div>
  );
}

/* ───── Single submission card with review form ───── */
function SubmissionReviewCard({
  submission,
  isExpanded,
  onToggle,
  onReviewed,
  onToast,
}: {
  submission: SubmissionWithFeedback;
  isExpanded: boolean;
  onToggle: () => void;
  onReviewed: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
}) {
  const [rating, setRating] = useState(submission.feedback?.rating ?? 5);
  const [content, setContent] = useState(submission.feedback?.content ?? '');
  const [submitting, setSubmitting] = useState(false);

  const displayName = submission.student_name ?? 'Student';
  const initials = displayName.charAt(0).toUpperCase();
  const submittedDate = new Date(submission.submitted_at);
  const timeAgo = formatTimeAgoShort(submittedDate);

  const statusBadge = (() => {
    if (submission.status === 'approved') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700" style={{ fontFamily: 'var(--font-grotesk)' }}>Complete</span>;
    }
    if (submission.status === 'partial') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700" style={{ fontFamily: 'var(--font-grotesk)' }}>Partial</span>;
    }
    if (submission.status === 'resubmit') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700" style={{ fontFamily: 'var(--font-grotesk)' }}>Invalid</span>;
    }
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>Pending</span>;
  })();

  const handleReview = async (outcome: 'complete' | 'partial' | 'invalid') => {
    setSubmitting(true);
    const result = await reviewSubmission({
      submissionId: submission.id,
      rating,
      content,
      outcome,
    });
    setSubmitting(false);
    if (result.success) {
      const msg = outcome === 'complete'
        ? 'Marked complete — full points, student notified.'
        : outcome === 'partial'
          ? 'Marked partial — half points awarded.'
          : 'Marked invalid — resubmit requested.';
      onToast(msg, 'success');
      onReviewed();
    } else {
      onToast(result.error || 'Review failed', 'error');
    }
  };

  return (
    <div className={`rounded-xl border-2 transition-all ${isExpanded ? 'border-violet-300 shadow-sm' : 'border-slate-200'}`}>
      {/* Collapsed header — click to expand */}
      <button
        onClick={onToggle}
        className="w-full p-3.5 flex items-center gap-3 text-left min-h-[60px] touch-manipulation"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {displayName}
            </p>
            {statusBadge}
          </div>
          <p className="text-xs text-slate-600 truncate">{submission.title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {timeAgo} · +{submission.speed_points} speed pts
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded review panel */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 border-t border-slate-100 pt-3 space-y-3">
          {/* Project details */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
            <div>
              <span className="font-bold text-slate-500">Project:</span>{' '}
              <a
                href={submission.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-bold break-all"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{submission.project_url}</span>
              </a>
            </div>
            {submission.demo_url && (
              <div>
                <span className="font-bold text-slate-500">Demo:</span>{' '}
                <a
                  href={submission.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-bold break-all"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{submission.demo_url}</span>
                </a>
              </div>
            )}
            {submission.description && (
              <div>
                <span className="font-bold text-slate-500">About:</span>
                <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{submission.description}</p>
              </div>
            )}
            {submission.reflection_tricky && (
              <div>
                <span className="font-bold text-slate-500">Tricky:</span>
                <p className="text-slate-700 mt-0.5 italic">&ldquo;{submission.reflection_tricky}&rdquo;</p>
              </div>
            )}
            {submission.reflection_proud && (
              <div>
                <span className="font-bold text-slate-500">Proud of:</span>
                <p className="text-slate-700 mt-0.5 italic">&ldquo;{submission.reflection_proud}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Existing feedback (if any) */}
          {submission.feedback && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageCircle className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Your previous feedback
                </span>
              </div>
              <div className="flex items-center gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-3.5 h-3.5 ${n <= submission.feedback!.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-amber-800 whitespace-pre-wrap">{submission.feedback.content}</p>
            </div>
          )}

          {/* Review form */}
          <div className="space-y-2.5">
            <HoneypotField name="website" />

            {/* Star rating */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback textarea */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Feedback (min 10 chars)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                maxLength={5000}
                disabled={submitting}
                placeholder="Great use of elif! Try adding error handling for invalid input..."
                className="w-full min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 disabled:opacity-50 resize-y"
                style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
              />
            </div>

            {/* Action buttons — three-way outcome (full / half / zero points) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleReview('complete')}
                disabled={submitting || content.trim().length < 10}
                title="Full points + capstone marked done"
                className="min-h-[44px] rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Complete
              </button>
              <button
                onClick={() => handleReview('partial')}
                disabled={submitting || content.trim().length < 10}
                title="Half points — good progress but not fully done"
                className="min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                Partial
              </button>
              <button
                onClick={() => handleReview('invalid')}
                disabled={submitting || content.trim().length < 10}
                title="Zero points — must resubmit"
                className="min-h-[44px] rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Invalid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Project Reviews — dedicated dashboard section ─────
   Surfaces every pending submission across the teacher's classes so new
   projects are visible without opening each session. Reuses the same review
   card (three-way Complete / Partial / Invalid). */
function ProjectReviewsSection({ onToast }: { onToast: (msg: string, kind?: 'success' | 'error') => void }) {
  const [subs, setSubs] = useState<SubmissionWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await fetchPendingSubmissionsForTeacher();
    setSubs(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));
    fetchPendingSubmissionsForTeacher().then((rows) => {
      if (cancelled) return;
      setSubs(rows);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-refresh when a new project comes in or a review is saved.
  useRealtime({
    tables: ['project_submissions', 'submission_feedback'],
    onRefresh: () => { load(); },
    enabled: true,
  });

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <FolderOpen className="w-5 h-5 text-violet-600" />
        Project Reviews
        {subs.length > 0 && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 text-violet-700">
            {subs.length} to review
          </span>
        )}
      </h2>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
        </div>
      ) : subs.length === 0 ? (
        <div className="card-3d p-6 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            No projects waiting for review. New student submissions will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((sub) => (
            <SubmissionReviewCard
              key={sub.id}
              submission={sub}
              isExpanded={expandedId === sub.id}
              onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              onReviewed={() => { load(); setExpandedId(null); }}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── Helper: short time-ago format ───── */
function formatTimeAgoShort(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
function TeacherDashboardInner({ workspace }: { workspace: WorkspaceKey }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const attention = useAttention();
  const userTimezone = profile?.timezone || null;

  /* Each workspace loads what it shows. The week's bookings feed Today's next
     class and the whole Classes workspace; the roster is only on Students. */
  const showTotals = useShows('totals');
  const showRoster = useShows('roster');
  const showNext = useShows('next-class');
  const showSchedule = useShows('schedule');
  const showStanding = useShows('standing');
  const needsBookings = showNext || showSchedule;

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  /* §4. What this teacher is enabled for. fetchMyAssignments existed and was
     called by nothing, so a teacher had no way to see which subjects they had
     been cleared to teach — the question they ask most often after "what is
     next". */
  const [myCourses, setMyCourses] = useState<Array<{ track: string; level: string; training_completed_at: string | null }>>([]);
  /* §2. What students said about this teacher's classes. Their own ratings of
     children are deliberately not in here — see lib/dashboard/class-feedback.ts
     on why the two directions never mix. */
  const [myFeedback, setMyFeedback] = useState<ClassFeedback[]>([]);
  // All bookings (unfiltered) — the calendar is the single source for the
  // schedule, the registers still open and the trials coming up.
  const [allBookings, setAllBookings] = useState<TeacherBookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [students, setStudents] = useState<TeacherStudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // v2 — modal state
  const [manageBooking, setManageBooking] = useState<TeacherBookingRow | null>(null);
  const [rescheduleBookingState, setRescheduleBookingState] = useState<TeacherBookingRow | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showBatchReschedule, setShowBatchReschedule] = useState(false);

  // Thin adapter so the v2 modals (which fire `(msg, kind?) => void`)
  // can drive the existing toast UI without changing its signature.
  const handleToast = useCallback((msg: string, kind?: 'success' | 'error') => {
    setToast({ type: kind || 'success', message: msg });
  }, []);

  const loadAll = useCallback(async () => {
    const [s, st, allB] = await Promise.all([
      showTotals ? fetchTeacherStats() : Promise.resolve(null),
      showRoster ? fetchTeacherStudents() : Promise.resolve([] as TeacherStudentRow[]),
      needsBookings ? fetchTeacherBookings('all') : Promise.resolve([] as TeacherBookingRow[]),
    ]);
    setStats(s);
    setStatsLoading(false);
    setAllBookings(allB);
    setBookingsLoading(false);
    setStudents(st);
    setStudentsLoading(false);
  }, [showTotals, showRoster, needsBookings]);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  /* After a class is marked, moved or added: this page, and the counts on the
     queue and the sidebar, which read the same bookings. */
  const afterChange = useCallback(() => {
    void loadAll();
    attention?.refresh();
  }, [loadAll, attention]);

  /* Eligibility changes when an admin edits it, not when a class happens, so
     it loads once rather than joining the realtime refresh loop. */
  useEffect(() => {
    if (!user || !showStanding) return;
    let cancelled = false;
    fetchMyAssignments().then((rows) => { if (!cancelled) setMyCourses(rows); });

    void (async () => {
      try {
        const sb = createClient();
        // Every class of mine, then what was written about them.
        const { data: mine } = await sb.from('bookings').select('id').eq('teacher_id', user.id);
        const ids = (mine ?? []).map((b) => b.id as string);
        if (ids.length === 0 || cancelled) return;
        const { data } = await sb
          .from('class_feedback')
          .select('booking_id, author_id, author_role, subject_student_id, rating, remarks, created_at')
          .in('booking_id', ids);
        if (!cancelled) setMyFeedback((data ?? []) as ClassFeedback[]);
      } catch {
        // scripts/class-feedback.sql has not been run yet. No ratings is the
        // honest reading, and it renders as "no ratings yet".
      }
    })();

    return () => { cancelled = true; };
  }, [user, showStanding]);

  const rating = teacherRating(myFeedback);
  const rating90 = recentRating(myFeedback, 90);

  // Realtime sync — auto-refresh when bookings / cohorts / session_attendance /
  // session_notes / enrollments / notifications change.
  useRealtime({
    tables: ['bookings', 'cohorts', 'session_attendance', 'session_notes', 'enrollments', 'notifications'],
    onRefresh: () => { loadAll(); },
    enabled: !!user,
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ⌘K and the queue open these from anywhere with ?do= — see useOpsDo. */
  useOpsDo({
    'add-session': () => setShowAddSession(true),
    'change-schedule': () => setShowBatchReschedule(true),
  });

  const handleStatusChange = async (
    bookingId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  ) => {
    // Completion + student no-show move MONEY (they fire the earning trigger),
    // so they go through the server route that gates ownership/timing and
    // reliably creates the earning + any penalty. A "no_show" from this UI means
    // the STUDENT didn't show (teacher no-shows are auto-detected elsewhere).
    if (status === 'completed' || status === 'no_show') {
      const outcome = status === 'no_show' ? 'student_no_show' : 'completed';
      try {
        const res = await fetch('/api/teacher/complete-class', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, outcome }),
        });
        const j = await res.json();
        if (j.ok) {
          setToast({ type: 'success', message: status === 'no_show' ? 'Marked student no-show (half pay withheld)' : 'Class marked complete' });
          afterChange();
        } else {
          setToast({ type: 'error', message: j.message || j.error || 'Failed to update session' });
        }
      } catch {
        setToast({ type: 'error', message: 'Network error' });
      }
      return;
    }

    const result = await updateBookingStatus(bookingId, status);
    if (result.success) {
      setToast({ type: 'success', message: `Session marked as ${status.replace('_', '-')}` });
      afterChange();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to update session' });
    }
  };

  const headerActions: Partial<Record<WorkspaceKey, ReactNode>> = {
    classes: (
      <>
        <WorkspaceAction icon={Plus} primary onClick={() => setShowAddSession(true)}>Add a class</WorkspaceAction>
        <WorkspaceAction icon={CalendarClock} onClick={() => setShowBatchReschedule(true)}>Change schedule</WorkspaceAction>
        <WorkspaceAction icon={Compass} href="/dashboard/teacher/trial-playbook">Trial playbooks</WorkspaceAction>
      </>
    ),
    students: (
      <WorkspaceAction icon={BookOpen} href="/dashboard/teacher/lessons">Lesson plans</WorkspaceAction>
    ),
    growth: (
      <>
        <WorkspaceAction icon={Trophy} href="/dashboard/teacher/leaderboard">Leaderboard</WorkspaceAction>
        <WorkspaceAction icon={Settings} href="/settings">Settings</WorkspaceAction>
      </>
    ),
  };

  return (
    <section className="relative pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <WorkspaceTabs />

        {workspace === 'today' ? (
          /* What is waiting on this teacher, first. See components/ops/today-queue.tsx. */
          <TodayQueue />
        ) : (
          <WorkspaceHeader actions={headerActions[workspace]} />
        )}

        {/* Above everything else where classes are. A class the student cannot
            get into is the only thing here that is already broken rather than
            merely late. Renders nothing when every class has a link. */}
        {(workspace === 'today' || workspace === 'classes') && <NoRoomBanner />}

        {/* ── Today ─────────────────────────────────────────────────────── */}

        {/* What am I teaching next, with whom, and which batch? */}
        <OpsSection id="next-class" bare>
          <NextClassCard
            bookings={allBookings}
            timezone={userTimezone}
            onJoin={() => router.push(sectionHref('teacher', 'schedule'))}
          />
        </OpsSection>

        <OpsSection id="totals" icon={BarChart3}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={Calendar} color="bg-green-100 text-green-600" value={stats?.classesThisWeek ?? 0} label="Classes this week" loading={statsLoading} />
            <StatCard icon={Users} color="bg-blue-100 text-blue-600" value={stats?.activeStudents ?? 0} label="Active students" loading={statsLoading} />
            <StatCard icon={Clock} color="bg-violet-100 text-violet-600" value={`${stats?.hoursTaught ?? 0}h`} label="Hours taught" loading={statsLoading} />
          </div>
        </OpsSection>

        {workspace === 'today' && <WorkspaceTiles />}

        {/* ── Classes ───────────────────────────────────────────────────── */}

        {/* §15 — what is still owed, before the calendar it is buried in. */}
        <OpsSection id="registers" icon={ClipboardCheck}>
          <RegistersToMark bookings={allBookings} timezone={userTimezone} loading={bookingsLoading} onOpen={setManageBooking} />
        </OpsSection>

        {/* Visual month calendar — the single source for the schedule. Pick a
            day, then act on a class (Join, Mark attendance, Reschedule,
            Cancel) right from its detail row. */}
        <OpsSection id="schedule" icon={Calendar}>
          {bookingsLoading ? (
            <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ) : allBookings.length > 0 ? (
            <TeacherCalendar
              bookings={allBookings}
              timezone={userTimezone}
              onChanged={afterChange}
              onSelectBooking={(booking) => setManageBooking(booking)}
            />
          ) : (
            <div className="card-3d p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                No sessions scheduled
              </h3>
              <p className="text-sm text-slate-500">
                When the admin assigns you to an active cohort and creates bookings, your class times will appear here.
              </p>
            </div>
          )}
        </OpsSection>

        {/* The half hour that decides whether a family stays: each child, what
            the family told us, and the playbook for them. */}
        <OpsSection id="trials" icon={Compass}>
          <TrialsAhead bookings={allBookings} timezone={userTimezone} loading={bookingsLoading} />
        </OpsSection>

        {/* §10. A rule that holds somebody's money and does not tell them is
            not a rule, it is a silent penalty. */}
        <OpsSection id="write-ups" icon={PenLine}>
          <PayHeldPanel onPaid={afterChange} showEmpty />
        </OpsSection>

        {/* §20 — a list of things this teacher owes people, each with a
            deadline of its own. */}
        <OpsSection id="catchup" icon={CalendarPlus}>
          <CatchUpPanel />
        </OpsSection>

        {/* ── Students ──────────────────────────────────────────────────── */}

        <OpsSection id="reviews" bare>
          <ProjectReviewsSection onToast={handleToast} />
        </OpsSection>

        <OpsSection
          id="roster"
          icon={Users}
          title={
            <span className="flex items-center gap-2">
              My students
              {students.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">{students.length}</span>
              )}
            </span>
          }
        >
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
                Students will appear here once you&apos;re assigned to a cohort with active enrollments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(s => (
                <StudentCard key={s.enrollment_id} student={s} />
              ))}
            </div>
          )}
        </OpsSection>

        {/* §26 — a student who runs out of credits stops coming, and the
            teacher is the person placed to notice first. */}
        <OpsSection id="low-credits" icon={Coins}>
          <LowCreditPanel />
        </OpsSection>

        {/* ── Pay ───────────────────────────────────────────────────────── */}

        <OpsSection id="earnings" bare>
          <TeacherEarnings />
        </OpsSection>

        {/* ── Growth ────────────────────────────────────────────────────── */}

        {/* Subjects, not rows: three grades of maths reads as one chip. Amber
            means the course is yours but the training is not signed off yet. */}
        <OpsSection id="standing" icon={Star}>
          <div className="card-3d p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <CapabilityChips assignments={myCourses} emptyText="No courses assigned to you yet — ask an admin." />
            </div>
            {/* §2. Null, not zero, when nobody has rated — a brand new teacher
                is not a one-star teacher. */}
            {rating.average !== null ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  {rating.average}/5
                </span>
                <span className="text-[13px] text-slate-500">
                  from {rating.count} rating{rating.count === 1 ? '' : 's'}
                  {rating90.average !== null && rating90.count >= 3 ? ` · ${rating90.average}/5 across the last 90 days` : ''}
                </span>
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">No ratings from students yet.</p>
            )}
          </div>
        </OpsSection>

        {/* Monitoring — V2 §31-32: how a teacher is doing, as observed. */}
        <OpsSection id="monitoring" icon={ClipboardCheck}>
          {user?.id && <MonitoringPanel teacherId={user.id} />}
        </OpsSection>

        <OpsSection id="managers" icon={Users}>
          <TeacherManagers />
        </OpsSection>

        <OpsSection id="tips" icon={Sparkles}>
          <div className="card-3d p-6">
            <p className="text-sm text-slate-600 mb-3">
              Use the same class room link for every session — save it once in Settings and every class, trials
              included, gets a join button. Mark each register right after class so credits, your pay and the
              child&apos;s lesson all move on.
            </p>
            <Link href="/settings" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Your room link and timezone <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </OpsSection>
      </div>

      {/* v2 modals — mounted on every workspace, so ?do= opens them anywhere */}
      <AnimatePresence>
        {manageBooking && (
          <SessionDetailsModal
            booking={manageBooking}
            onClose={() => { setManageBooking(null); afterChange(); }}
            onToast={handleToast}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {rescheduleBookingState && (
          <RescheduleModal
            booking={rescheduleBookingState}
            onClose={() => setRescheduleBookingState(null)}
            onToast={handleToast}
            onDone={afterChange}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddSession && (
          <AddSessionModal
            onClose={() => setShowAddSession(false)}
            onToast={handleToast}
            onDone={afterChange}
          />
        )}
      </AnimatePresence>
      <BatchRescheduleModal
        open={showBatchReschedule}
        onClose={() => setShowBatchReschedule(false)}
        onDone={afterChange}
      />

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

/**
 * The teacher's dashboard, one workspace at a time: Today, Classes, Students,
 * Pay, Growth. The page lists every section once; lib/ops/workspaces.ts decides
 * which workspace each appears in. The shell is held by (workspace)/layout.tsx.
 */
export default function TeacherWorkspace({ workspace }: { workspace: WorkspaceKey }) {
  return (
    <WorkspaceProvider role="teacher" workspace={workspace}>
      <TeacherDashboardInner workspace={workspace} />
    </WorkspaceProvider>
  );
}
