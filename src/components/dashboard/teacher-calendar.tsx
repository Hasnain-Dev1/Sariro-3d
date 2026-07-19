'use client';

/**
 * SARIRO — TeacherCalendar
 *
 * Visual month-grid calendar showing the teacher's bookings by date.
 * Replaces the "list of cards only" view with a real calendar UX:
 *
 *   ┌─────────────────────────────────────────┐
 *   │  ‹  July 2026  ›              Today     │
 *   ├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
 *   │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
 *   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
 *   │     │     │  1  │  2  │  3  │  4  │  5  │
 *   │     │     │     │ ●●  │     │     │     │
 *   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
 *   │  6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │
 *   │     │ ●   │     │     │     │     │     │
 *   └─────┴─────┴─────┴─────┴─────┴─────┴─────┘
 *
 *   Selected day (Wed Jul 2):
 *   ┌─────────────────────────────────────────┐
 *   │ 2 sessions                              │
 *   │ ─ Web Builder Pro · 6:00 PM → 7:00 PM   │
 *   │ ─ App Builder Studio · 8:00 PM → 9:00 PM│
 *   └─────────────────────────────────────────┘
 *
 * Features:
 *   - Prev / Next month navigation + "Today" button
 *   - Click any day to see that day's sessions in a detail panel
 *   - Up to 3 session chips per day cell, "+N more" overflow
 *   - Color-coded by booking status (green=scheduled, blue=completed,
 *     red=cancelled, gray=no_show)
 *   - Today's date highlighted with a ring
 *   - Responsive: chips show track name on desktop, just a dot on mobile
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Video, Clock, X,
} from 'lucide-react';
import type { TeacherBookingRow } from '@/lib/dashboard/teacher-data';
import { getTrackName } from '@/lib/dashboard/upsell-engine';

/* ───── Helpers ───── */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_COLORS: Record<string, { dot: string; chip: string; text: string; label: string }> = {
  scheduled: { dot: 'bg-green-500', chip: 'bg-green-50 text-green-700 border-green-200', text: 'text-green-700', label: 'Scheduled' },
  completed: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Completed' },
  cancelled: { dot: 'bg-red-400', chip: 'bg-red-50 text-red-600 border-red-200', text: 'text-red-600', label: 'Cancelled' },
  no_show:   { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-500 border-slate-200', text: 'text-slate-500', label: 'No-show' },
};

function levelDisplay(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

/** Formats an ISO timestamp to "6:00 PM" in the given timezone. */
function formatTime(iso: string, timezone: string | null): string {
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    if (timezone) opts.timeZone = timezone;
    return d.toLocaleString('en-US', opts);
  } catch {
    return '';
  }
}

function formatDuration(start: string, end: string): string {
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  } catch {
    return '';
  }
}

/** Returns YYYY-MM-DD key for a date (used for grouping bookings by day). */
function dayKey(date: Date, timezone: string | null): string {
  // Format the date in the user's timezone so "today" matches what they see
  try {
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: '2-digit', day: '2-digit',
    };
    if (timezone) opts.timeZone = timezone;
    const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(date);
    const y = parts.find(p => p.type === 'year')?.value ?? '';
    const m = parts.find(p => p.type === 'month')?.value ?? '';
    const d = parts.find(p => p.type === 'day')?.value ?? '';
    return `${y}-${m}-${d}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Returns the first day of the month for a given date. */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns the last day of the month for a given date. */
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Returns a 42-cell grid (6 weeks × 7 days) for the month, starting from Sunday. */
function buildMonthGrid(monthDate: Date): Date[] {
  const first = startOfMonth(monthDate);
  const startDay = first.getDay(); // 0 = Sunday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startDay);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/* ───── Component ───── */

interface TeacherCalendarProps {
  bookings: TeacherBookingRow[];
  timezone: string | null;
  onSelectBooking?: (booking: TeacherBookingRow) => void;
}

export function TeacherCalendar({ bookings, timezone, onSelectBooking }: TeacherCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group bookings by day key for O(1) lookup
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, TeacherBookingRow[]>();
    for (const b of bookings) {
      const key = dayKey(new Date(b.slot_start), timezone);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    // Sort each day's bookings by start time
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());
    }
    return map;
  }, [bookings, timezone]);

  const monthGrid = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
  const today = new Date();

  // Sessions for the selected day (or today if nothing selected)
  const detailDate = selectedDate ?? today;
  const detailKey = dayKey(detailDate, timezone);
  const detailBookings = bookingsByDay.get(detailKey) ?? [];

  const goPrevMonth = useCallback(() => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);
  const goNextMonth = useCallback(() => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);
  const goToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }, []);

  // Count sessions this month for the header
  const monthSessionCount = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return bookings.filter(b => {
      const d = new Date(b.slot_start);
      return d >= monthStart && d <= monthEnd;
    }).length;
  }, [bookings, currentMonth]);

  return (
    <div className="card-3d p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            {monthSessionCount} {monthSessionCount === 1 ? 'session' : 'sessions'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goPrevMonth}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToday}
            className="px-3 h-9 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Today
          </button>
          <button
            onClick={goNextMonth}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-2"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthGrid.map((date, i) => {
          const key = dayKey(date, timezone);
          const dayBookings = bookingsByDay.get(key) ?? [];
          const inMonth = isSameMonth(date, currentMonth);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const hasSessions = dayBookings.length > 0;

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={`
                relative min-h-[64px] sm:min-h-[88px] p-1 sm:p-1.5 rounded-lg border text-left transition-all
                ${isSelected
                  ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100'
                  : isToday
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }
                ${!inMonth ? 'opacity-40' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] sm:text-xs font-bold ${
                    isToday ? 'text-blue-600' : 'text-slate-700'
                  }`}
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {date.getDate()}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </div>

              {/* Session chips */}
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => {
                  const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.scheduled;
                  return (
                    <div
                      key={b.id}
                      className={`text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded border truncate ${colors.chip}`}
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      <span className="hidden sm:inline">
                        {formatTime(b.slot_start, timezone)} {getTrackName(b.cohort_track).split(' ')[0]}
                      </span>
                      <span className="sm:hidden">{formatTime(b.slot_start, timezone).replace(':00', '').replace(' ', '')}</span>
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 px-1">
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>

              {/* Dot indicator for days with sessions (visible when chips are too small) */}
              {hasSessions && dayBookings.length <= 3 && (
                <div className="absolute bottom-1 left-1 flex gap-0.5 sm:hidden">
                  {dayBookings.map(b => {
                    const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.scheduled;
                    return <span key={b.id} className={`w-1 h-1 rounded-full ${colors.dot}`} />;
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {colors.label}
            </span>
          </div>
        ))}
      </div>

      {/* Selected day detail panel */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {detailDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              ...(timezone ? { timeZone: timezone } : {}),
            })}
          </h4>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {detailBookings.length} {detailBookings.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {detailBookings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No sessions on this day.</p>
            </motion.div>
          ) : (
            <motion.div
              key={detailKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              {detailBookings.map(b => {
                const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.scheduled;
                const meetUrl = b.google_meet_url || b.cohort_meet_url;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-1 h-10 rounded-full ${colors.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          {getTrackName(b.cohort_track)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colors.chip} border`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                          {colors.label.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(b.slot_start, timezone)} → {formatTime(b.slot_end, timezone)}</span>
                        <span className="text-slate-300">·</span>
                        <span>{formatDuration(b.slot_start, b.slot_end)}</span>
                        <span className="text-slate-300">·</span>
                        <span>{levelDisplay(b.cohort_level)} {b.cohort_ratio}</span>
                      </div>
                    </div>
                    {meetUrl && (
                      <a
                        href={meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-bold transition-colors"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        <Video className="w-3 h-3" /> Join
                      </a>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
