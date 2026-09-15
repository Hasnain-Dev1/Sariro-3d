'use client';

import { CheckCircle2, ClipboardCheck, Clock } from 'lucide-react';
import type { TeacherBookingRow } from '@/lib/dashboard/teacher-data';
import { registersToMark, REGISTER_LOOKBACK_DAYS } from '@/lib/ops/queue-counts';
import { attendanceDeadline, deadlineTone } from '@/lib/dashboard/attendance-deadline';
import { getTrackName } from '@/lib/dashboard/upsell-engine';

/**
 * SARIRO — the registers a teacher still owes
 * ============================================================================
 * The calendar has a "Mark attendance" button on every class, which is the
 * trouble: a teacher looking for the one they forgot on Tuesday has to open
 * Tuesday. Here is only what is outstanding, oldest first, each with the time
 * left before the late penalty — the same rule the Today queue counts
 * (lib/ops/queue-counts.ts), so the number and the list agree.
 */
export default function RegistersToMark({
  bookings, timezone, loading, onOpen,
}: {
  bookings: TeacherBookingRow[];
  timezone: string | null;
  loading: boolean;
  onOpen: (booking: TeacherBookingRow) => void;
}) {
  if (loading) return <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />;

  const rows = registersToMark(bookings);
  if (rows.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-[13.5px] text-slate-600">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Every register from the last {REGISTER_LOOKBACK_DAYS} days is marked.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((b) => {
        const deadline = attendanceDeadline(b.slot_end, b.attendance_finalized_at);
        const tone = deadlineTone(deadline.state);
        return (
          <div key={b.id} className="rounded-2xl bg-white border border-[var(--card-border)] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold text-slate-900 truncate">
                {getTrackName(b.cohort_track)}
                {b.lesson_name ? <span className="font-medium text-slate-500"> · {b.lesson_name}</span> : null}
              </p>
              <p className="mt-0.5 text-[12.5px] text-slate-500 flex flex-wrap items-center gap-x-2">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(b.slot_start).toLocaleString(undefined, {
                    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
                    ...(timezone ? { timeZone: timezone } : {}),
                  })}
                </span>
                {b.batch_code && <span className="tabular-nums">· {b.batch_code}</span>}
                {b.student_names.length > 0 && <span className="truncate">· {b.student_names.join(', ')}</span>}
              </p>
              {deadline.label && tone && (
                <span className="mt-2 inline-flex rounded-md px-2 py-0.5 text-[11.5px] font-bold" style={{ color: tone.fg, background: tone.bg }}>
                  {deadline.label}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpen(b)}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold transition-colors"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <ClipboardCheck className="w-4 h-4" /> Mark register
            </button>
          </div>
        );
      })}
    </div>
  );
}
