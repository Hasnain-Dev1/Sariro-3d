'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar, Clock, Users, Video, Loader2, AlertCircle, ClipboardCheck,
  CheckCircle2, XCircle, UserX, ChevronRight, GraduationCap, Sparkles,
  Plus, Edit3, Save, StickyNote, X, CalendarPlus,
  Star, ExternalLink, FolderOpen, MessageCircle, CalendarClock,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { BatchRescheduleModal } from '@/components/dashboard/batch-reschedule-modal';
import { DesktopClock } from '@/components/dashboard/desktop-clock';
import MonitoringPanel from '@/components/dashboard/monitoring-panel';
import { JOIN_OPENS_MINUTES_BEFORE, humanCountdown } from '@/lib/dashboard/join-window';
import { useLiveJoinWindow } from '@/lib/dashboard/use-join-window';
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
import { Coins } from 'lucide-react';

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

/* ───── ICS calendar export (mirrors student dashboard) ─────
   Builds an RFC 5545 .ics file for a booking so teachers can add
   sessions to Google Calendar / Outlook / Apple Calendar with one click. */
function buildTeacherICS(booking: TeacherBookingRow): string {
  const trackName = getTrackName(booking.cohort_track);
  const meetUrl = booking.google_meet_url || booking.cohort_meet_url || '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };
  const escapeICS = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const summary = `Sariro — ${trackName} (${levelDisplay(booking.cohort_level)} · ${booking.cohort_ratio})`;
  const description = meetUrl
    ? `Sariro live session. Join: ${meetUrl}`
    : 'Sariro live session.';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sariro//Teacher Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@sariro-teacher`,
    `DTSTAMP:${fmtDate(new Date().toISOString())}`,
    `DTSTART:${fmtDate(booking.slot_start)}`,
    `DTEND:${fmtDate(booking.slot_end)}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(meetUrl || 'Online')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function downloadTeacherICS(booking: TeacherBookingRow) {
  const ics = buildTeacherICS(booking);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sariro-teacher-session-${booking.id.slice(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  const [started, setStarted] = useState(false);
  const [startInfo, setStartInfo] = useState<string | null>(null);
  const [earlyMsg, setEarlyMsg] = useState<string | null>(null);

  // Doors open JOIN_OPENS_MINUTES_BEFORE (15) minutes before the start — the
  // same constant the student side and the server use, so all three agree.
  //
  // The comment here used to say "5 minutes" while the constant said 15. Nobody
  // was misled by the code, which read the constant; the next person to touch
  // this would have been.
  const EARLY_JOIN_MIN = JOIN_OPENS_MINUTES_BEFORE;
  const joinOpensMs = new Date(booking.slot_start).getTime() - EARLY_JOIN_MIN * 60_000;

  // Live: this is what makes the button appear ON ITS OWN at T-15 instead of
  // waiting for a reload that a teacher sitting on the dashboard never does.
  // Null for the first frame — see use-join-window.ts on hydration.
  const win = useLiveJoinWindow(booking.slot_start, booking.slot_end ?? null);
  const doorsOpen = win?.state === 'open';
  const classEnded = win?.state === 'ended';

  const handleStatus = async (newStatus: 'completed' | 'no_show' | 'cancelled') => {
    setProcessing(true);
    await onStatusChange(booking.id, newStatus);
    setProcessing(false);
  };

  // Join Meet → records the join time FIRST (so the teacher is never
  // falsely flagged as a no-show/late-join once they've actually clicked in),
  // then opens the meet link. Registering the join and opening the call
  // happen together — there is no separate "Start Class" step to forget.
  const handleJoin = async () => {
    if (Date.now() < joinOpensMs) {
      const mins = Math.ceil((joinOpensMs - Date.now()) / 60_000);
      setEarlyMsg(`You can join this class ${EARLY_JOIN_MIN} minutes before it starts — please come back in about ${mins} minute${mins === 1 ? '' : 's'}.`);
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/teacher/start-class', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setStarted(true);
        setStartInfo(json.late_minutes > 3 ? `Joined ${json.late_minutes} min late` : 'Joined on time');
      } else if (json.error === 'too_early') {
        setEarlyMsg(json.message);
      }
      // A transient failure to record the join should never block the
      // teacher from actually getting into the call.
    } catch { /* transient */ }
    setProcessing(false);
    if (meetUrl) window.open(meetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card-3d p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {levelDisplay(booking.cohort_level)} · {booking.cohort_ratio} · {formatDuration(booking.slot_start, booking.slot_end)}
            </span>
            {booking.batch_code && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-900 text-white tracking-wider">
                {booking.batch_code}
              </span>
            )}
          </div>
          <h4 className="font-extrabold text-slate-900 text-base leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {trackName}
          </h4>
          {booking.student_names.length > 0 && (
            <div className="text-xs font-bold text-slate-600 mt-0.5 truncate">
              {booking.student_names.join(', ')}
            </div>
          )}
          <div className="text-xs text-slate-500 mt-0.5">
            {formatSessionTime(booking.slot_start, timezone)}
          </div>

          {/* Live timing + roster size.
              The card showed a wall-clock time and left the arithmetic to the
              teacher: "17:30" tells you nothing about whether to put the coffee
              down. This says how long there is, and updates itself.
              Renders only after mount — `win` is null on the server. */}
          {win && booking.status === 'scheduled' && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
                  doorsOpen
                    ? 'bg-green-100 text-green-700'
                    : classEnded
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Clock className="w-3 h-3" />
                {doorsOpen
                  ? 'Doors open now'
                  : classEnded
                    ? 'Ended'
                    : `Starts ${humanCountdown(
                        new Date(booking.slot_start).getTime() - Date.now()
                      )}`}
              </span>
              {booking.student_names.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                  <Users className="w-3 h-3" />
                  {booking.student_names.length}
                  {booking.student_names.length === 1 ? ' student' : ' students'}
                </span>
              )}
              {!meetUrl && (
                // Worth shouting about: without a link the class cannot happen,
                // and the teacher should find out now rather than at 17:29.
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  No meet link
                </span>
              )}
            </div>
          )}
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.bg} ${status.text}`}>
          {status.label.toUpperCase()}
        </span>
      </div>

      {/* Meet link + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* The join control tells the teacher WHICH of three situations they are
            in, rather than offering one button that rejects the click. Before
            this, "Join Meet" was always live-looking and answered an early
            press with a telling-off — the card knew the class was hours away
            and said nothing until clicked. */}
        {meetUrl && !classEnded && (
          doorsOpen || started ? (
            <button
              type="button"
              onClick={handleJoin}
              disabled={processing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors disabled:opacity-50 min-h-[40px] shadow-sm"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {started ? (startInfo ?? 'Joined ✓') : 'Join Meet'}
            </button>
          ) : (
            // Not a disabled button: there is nothing to press yet, and a
            // greyed-out control invites the press anyway. This is the answer.
            <span
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold min-h-[40px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
              title={`The link opens ${EARLY_JOIN_MIN} minutes before the class starts`}
            >
              <Clock className="w-4 h-4" />
              {win ? `Opens ${humanCountdown(win.msUntilOpen)}` : 'Checking…'}
            </span>
          )
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

        {/* Add to Calendar — exports .ics file for Google/Outlook/Apple Calendar */}
        <button
          type="button"
          onClick={() => downloadTeacherICS(booking)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-colors min-h-[40px]"
          style={{ fontFamily: 'var(--font-grotesk)' }}
          aria-label="Add to calendar"
        >
          <CalendarPlus className="w-3.5 h-3.5" /> Add to Calendar
        </button>

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
              <UserX className="w-3.5 h-3.5" /> Student no-show
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

      {/* Early-join guard — teachers may only join 5 minutes before start */}
      {earlyMsg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
              A little early
            </h3>
            <p className="text-sm text-slate-600 mb-5">{earlyMsg}</p>
            <button onClick={() => setEarlyMsg(null)} className="min-h-[44px] px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold w-full">
              Got it
            </button>
          </div>
        </div>
      )}
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
    <div className="mb-10" id="reviews">
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
function TeacherDashboardInner() {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || 'Teacher';
  const userTimezone = profile?.timezone || null;

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  // All bookings (unfiltered) — the calendar is now the single source for the
  // schedule; the separate upcoming/past/all list was removed, and with it a
  // duplicate fetchTeacherBookings call every load.
  const [allBookings, setAllBookings] = useState<TeacherBookingRow[]>([]);
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
      fetchTeacherStats(),
      fetchTeacherStudents(),
      fetchTeacherBookings('all'),
    ]);
    setStats(s);
    setStatsLoading(false);
    setAllBookings(allB);
    setStudents(st);
    setStudentsLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

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
          await loadAll();
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
      await loadAll();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to update session' });
    }
  };

  return (
    <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-4">
          <div>
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
          </div>
          <DesktopClock />
        </motion.div>

        {/* What am I teaching next, with whom, and which batch? The teacher's
            actual question, answered above everything else. */}
        <NextClassCard
          bookings={allBookings}
          timezone={userTimezone}
          onJoin={(b) => {
            const el = document.getElementById('schedule');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            void b;
          }}
        />

        {/* Reporting Admin + HR */}
        <TeacherManagers />

        {/* Earnings & payouts — teacher finance portal */}
        <TeacherEarnings />

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
          </div>

          {/* Reschedule a whole batch going forward */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowBatchReschedule(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold min-h-[40px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <CalendarClock className="w-3.5 h-3.5" /> Change schedule
            </button>
          </div>

          {/* Visual month calendar — the single source for the schedule. Pick a
              day, then act on a class (Join, Mark attendance, Reschedule,
              Cancel) right from its detail row. */}
          {allBookings.length > 0 ? (
            <div className="mb-2">
              <TeacherCalendar
                bookings={allBookings}
                timezone={userTimezone}
                onChanged={loadAll}
                onSelectBooking={(booking) => setManageBooking(booking)}
              />
            </div>
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

          <BatchRescheduleModal
            open={showBatchReschedule}
            onClose={() => setShowBatchReschedule(false)}
            onDone={loadAll}
          />
        </div>

        {/* Project Reviews — pending submissions across all classes */}
        <ProjectReviewsSection onToast={handleToast} />

        {/* Monitoring — V2 §31-32. Placed above the student list because a
            teacher checking their own dashboard wants to know how they are
            doing before they want the roster. */}
        {user?.id && (
          <div className="mb-10" id="monitoring">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <ClipboardCheck className="w-5 h-5 text-violet-600" />
              Monitoring
            </h2>
            <MonitoringPanel teacherId={user.id} />
          </div>
        )}

        {/* §26 — a student who runs out of credits stops coming, and the
            teacher is the person placed to notice first. Above the roster
            because it is the part that needs acting on. */}
        <div className="mb-10" id="low-credits">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Coins className="w-5 h-5 text-amber-600" />
            Credits running low
          </h2>
          <LowCreditPanel />
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
