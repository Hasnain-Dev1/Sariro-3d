'use client';

/**
 * SARIRO — the data behind "book a trial"
 * ============================================================================
 * One module, because three dashboards do this: admin, super-admin and seller.
 * Three copies of "which teachers can take this, and when" is three chances for
 * one of them to offer a slot that is already taken.
 *
 * Reads only. Every write goes through /api/trial/book, which re-asks all three
 * gates of the database — the picker below is a courtesy, not the boundary.
 */

import { createClient } from '@/lib/supabase/client';
import {
  freeSlots, localWeekdayMinutes, byWeekday, type Window,
} from '@/lib/scheduling/availability';
import { phoneReachability } from '@/lib/contact/reachability';
import type { TeacherAssignmentRow } from '@/lib/dashboard/teacher-capability';

export interface BookableTeacher {
  id: string;
  full_name: string | null;
  email: string | null;
  timezone: string | null;
  assignments: TeacherAssignmentRow[];
  windows: Window[];
  /** Why this teacher cannot be booked at all. Empty when they can. */
  blocker: string;
}

export interface TrialStudent {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  /** Empty when they can be booked. */
  blocker: string;
}

/**
 * Teachers, with the two things that decide whether they can be offered:
 * a timezone (or their 5pm is unknowable) and at least one window.
 *
 * Teachers who cannot be booked are returned WITH a reason rather than filtered
 * out — an empty dropdown tells a seller nothing, and "Priya: has not set her
 * hours" tells them exactly who to chase.
 */
export async function fetchBookableTeachers(): Promise<BookableTeacher[]> {
  const supabase = createClient();
  try {
    const { data: teachers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, timezone')
      .or('role.eq.teacher,is_teacher.eq.true')
      .order('full_name');
    if (error) throw error;
    const ids = (teachers ?? []).map((t) => t.id as string);
    if (ids.length === 0) return [];

    const [availRes, assignRes] = await Promise.all([
      supabase.from('teacher_availability').select('teacher_id, weekday, start_minute, end_minute').in('teacher_id', ids),
      supabase.from('teacher_course_assignments').select('teacher_id, track, level, training_completed_at').in('teacher_id', ids),
    ]);

    const windowsBy = new Map<string, Window[]>();
    for (const a of availRes.data ?? []) {
      const list = windowsBy.get(a.teacher_id as string) ?? [];
      list.push({ weekday: a.weekday as number, start: a.start_minute as number, end: a.end_minute as number });
      windowsBy.set(a.teacher_id as string, list);
    }
    const assignBy = new Map<string, TeacherAssignmentRow[]>();
    for (const a of assignRes.data ?? []) {
      const list = assignBy.get(a.teacher_id as string) ?? [];
      list.push({ track: a.track as string, level: a.level as string, training_completed_at: a.training_completed_at as string | null });
      assignBy.set(a.teacher_id as string, list);
    }

    return (teachers ?? []).map((t) => {
      const windows = windowsBy.get(t.id as string) ?? [];
      const timezone = (t.timezone as string | null) ?? null;
      return {
        id: t.id as string,
        full_name: (t.full_name as string | null) ?? null,
        email: (t.email as string | null) ?? null,
        timezone,
        assignments: assignBy.get(t.id as string) ?? [],
        windows,
        blocker: !timezone
          ? 'no timezone set'
          : windows.length === 0
            ? 'has not set their hours'
            : '',
      };
    });
  } catch (err) {
    console.warn('[trial] fetchBookableTeachers:', err);
    return [];
  }
}

/**
 * Students, each carrying whether they can be given a trial.
 *
 * The rule is the same one that gates a course: an account we cannot ring is an
 * account nobody can chase when the child does not appear. Shown here so a
 * seller finds out before choosing a slot, not after.
 */
export async function fetchTrialStudents(): Promise<TrialStudent[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, is_student, is_teacher, is_admin, is_super_admin')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) throw error;

    return (data ?? [])
      .filter((r) =>
        r.is_student || r.role === 'student' ||
        (!r.role && !r.is_teacher && !r.is_admin && !r.is_super_admin)
      )
      .map((r) => {
        const reach = phoneReachability(r.phone as string | null);
        return {
          id: r.id as string,
          full_name: (r.full_name as string | null) ?? null,
          email: (r.email as string | null) ?? null,
          phone: (r.phone as string | null) ?? null,
          blocker: reach.ok ? '' : reach.reason,
        };
      });
  } catch (err) {
    console.warn('[trial] fetchTrialStudents:', err);
    return [];
  }
}

export interface DaySlots {
  /** Midnight UTC of the calendar date, as an ISO date string. */
  date: string;
  label: string;
  /** ISO instants a class could start at. */
  starts: string[];
}

/**
 * The next `days` days of free slots for one teacher.
 *
 * Built by walking real calendar dates rather than by adding 24 hours
 * repeatedly, so a daylight-saving change shifts the day boundary the way the
 * teacher's calendar actually does.
 */
export async function fetchTeacherSlots(
  teacher: BookableTeacher,
  opts: { days?: number; slotMinutes?: number; stepMinutes?: number } = {}
): Promise<DaySlots[]> {
  if (teacher.blocker) return [];
  const days = opts.days ?? 14;
  const slotMinutes = opts.slotMinutes ?? 60;
  const stepMinutes = opts.stepMinutes ?? 30;
  const tz = teacher.timezone!;

  const supabase = createClient();
  const now = new Date();
  const horizonEnd = new Date(now.getTime() + (days + 2) * 86_400_000);

  let existing: { slot_start: string; slot_end: string }[] = [];
  try {
    const { data } = await supabase
      .from('bookings')
      .select('slot_start, slot_end')
      .eq('teacher_id', teacher.id)
      .gte('slot_start', new Date(now.getTime() - 86_400_000).toISOString())
      .lte('slot_start', horizonEnd.toISOString())
      .not('status', 'in', '("cancelled","no_show")');
    existing = (data ?? []) as { slot_start: string; slot_end: string }[];
  } catch { /* an empty diary is the safe assumption to SHOW; the API re-checks */ }

  const perDay = byWeekday(teacher.windows);
  const out: DaySlots[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(now.getTime() + i * 86_400_000);
    const probe = localWeekdayMinutes(dayStart.toISOString(), tz);
    if (!probe) continue;
    const windows = perDay[probe.weekday];
    if (!windows || windows.length === 0) continue;

    // Busy intervals that fall on this local weekday, in local minutes.
    const busy: { start: number; end: number }[] = [];
    for (const b of existing) {
      const s = localWeekdayMinutes(b.slot_start, tz);
      if (!s) continue;
      const sameLocalDate =
        new Date(b.slot_start).toLocaleDateString('en-CA', { timeZone: tz }) ===
        dayStart.toLocaleDateString('en-CA', { timeZone: tz });
      if (!sameLocalDate) continue;
      const len = Math.max(
        1,
        Math.round((Date.parse(b.slot_end) - Date.parse(b.slot_start)) / 60_000)
      );
      busy.push({ start: s.minutes, end: s.minutes + len });
    }

    /* Only today has a floor. Without it the first day of the picker offers
       this morning, every morning. */
    const isToday = i === 0;
    const earliestStart = isToday ? probe.minutes + 60 : null;

    const starts = freeSlots({ windows, busy, slotMinutes, stepMinutes, earliestStart });
    if (starts.length === 0) continue;

    const localDate = dayStart.toLocaleDateString('en-CA', { timeZone: tz });
    out.push({
      date: localDate,
      label: dayStart.toLocaleDateString('en-GB', {
        timeZone: tz, weekday: 'short', day: 'numeric', month: 'short',
      }),
      starts: starts.map((m) => localMinutesToIso(localDate, m, tz)),
    });
  }

  return out;
}

/**
 * A local date plus minutes-from-midnight, back to a UTC instant.
 *
 * Done by binary-searching the offset rather than by assuming one, because a
 * zone's offset depends on the instant you are asking about — which is the
 * thing being solved for. Two passes settle it everywhere except inside a
 * daylight-saving gap, where any answer is a guess and this returns the later
 * one rather than a time that does not exist.
 */
function localMinutesToIso(localDate: string, minutes: number, timeZone: string): string {
  const [y, m, d] = localDate.split('-').map(Number);
  let guess = Date.UTC(y, (m ?? 1) - 1, d ?? 1, Math.floor(minutes / 60), minutes % 60);
  for (let i = 0; i < 3; i++) {
    const seen = localWeekdayMinutes(new Date(guess).toISOString(), timeZone);
    if (!seen) break;
    let diff = minutes - seen.minutes;
    // Crossing midnight shows up as a ~1440 minute error in one direction.
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    if (diff === 0) break;
    guess += diff * 60_000;
  }
  return new Date(guess).toISOString();
}

export async function bookTrial(params: {
  studentId: string;
  teacherId: string;
  slotStart: string;
  durationMinutes?: number;
  demoRequestId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/trial/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, error: json.message || json.error || 'Could not book that trial.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error — please try again.' };
  }
}
