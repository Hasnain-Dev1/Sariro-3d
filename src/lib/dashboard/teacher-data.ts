/**
 * SARIRO — Teacher Dashboard data layer
 *
 * All Supabase queries for the teacher dashboard.
 * RLS policies ensure teachers only see bookings/cohorts assigned to them.
 *
 * supabase client is created INSIDE each function (not at module level)
 * to avoid SSR issues.
 */

import { createClient } from '@/lib/supabase/client';

export interface TeacherStats {
  classesThisWeek: number;
  activeStudents: number;
  hoursTaught: number; // sum of completed bookings duration in hours
}

export interface TeacherBookingRow {
  id: string;
  cohort_id: string;
  teacher_id: string;
  slot_start: string;
  slot_end: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  google_meet_url: string | null;
  // joined cohort info
  cohort_track: string;
  cohort_level: string;
  cohort_ratio: string;
  cohort_status: string;
  cohort_meet_url: string | null;
}

export interface TeacherStudentRow {
  enrollment_id: string;
  user_id: string;
  student_name: string | null;
  student_email: string | null;
  track: string;
  level: string;
  ratio: string;
  status: string;
  cohort_id: string | null;
  created_at: string;
}

/* ───── Get teacher's cohort IDs ───── */
export async function fetchTeacherCohortIds(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookings')
      .select('cohort_id')
      .eq('teacher_id', (await supabase.auth.getUser()).data.user?.id ?? '');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // distinct cohort IDs
    return [...new Set(data.map(b => b.cohort_id).filter((id): id is string => !!id))];
  } catch (err) {
    console.warn('[teacher] fetchTeacherCohortIds error:', err);
    return [];
  }
}

/* ───── Stats ───── */
export async function fetchTeacherStats(): Promise<TeacherStats> {
  const stats: TeacherStats = {
    classesThisWeek: 0,
    activeStudents: 0,
    hoursTaught: 0,
  };

  try {
    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return stats;

    // Calculate week boundaries (Monday to Sunday)
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    // Classes this week (bookings where slot_start is in this week)
    const { count: weekCount, error: weekErr } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', userId)
      .gte('slot_start', monday.toISOString())
      .lt('slot_start', sunday.toISOString());

    if (weekErr) throw weekErr;
    stats.classesThisWeek = weekCount ?? 0;

    // Hours taught = sum of completed booking durations
    const { data: completed, error: completedErr } = await supabase
      .from('bookings')
      .select('slot_start, slot_end')
      .eq('teacher_id', userId)
      .eq('status', 'completed');

    if (completedErr) throw completedErr;
    if (completed && completed.length > 0) {
      const totalMs = completed.reduce((sum, b) => {
        const start = new Date(b.slot_start).getTime();
        const end = new Date(b.slot_end).getTime();
        return sum + Math.max(0, end - start);
      }, 0);
      stats.hoursTaught = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10; // 1 decimal
    }

    // Active students = count of distinct users in teacher's cohorts (active enrollments only)
    const cohortIds = await fetchTeacherCohortIds();
    if (cohortIds.length > 0) {
      const { count: studentCount, error: studentErr } = await supabase
        .from('enrollments')
        .select('user_id', { count: 'exact', head: true })
        .in('cohort_id', cohortIds)
        .eq('status', 'active');

      if (studentErr) throw studentErr;
      stats.activeStudents = studentCount ?? 0;
    }
  } catch (err) {
    console.warn('[teacher] stats fetch error:', err);
  }

  return stats;
}

/* ───── Bookings (schedule) ───── */
export async function fetchTeacherBookings(filter: 'upcoming' | 'past' | 'all' = 'upcoming'): Promise<TeacherBookingRow[]> {
  try {
    const supabase = createClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return [];

    const now = new Date().toISOString();
    let query = supabase
      .from('bookings')
      .select(`
        *,
        cohort:cohorts(*)
      `)
      .eq('teacher_id', userId)
      .order('slot_start', { ascending: filter === 'past' ? false : true });

    if (filter === 'upcoming') {
      query = query.gte('slot_start', now);
    } else if (filter === 'past') {
      query = query.lt('slot_start', now);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map(b => {
      const cohort = b.cohort as Record<string, unknown> | null;
      return {
        id: b.id,
        cohort_id: b.cohort_id,
        teacher_id: b.teacher_id,
        slot_start: b.slot_start,
        slot_end: b.slot_end,
        status: b.status,
        google_meet_url: b.google_meet_url,
        cohort_track: (cohort?.track as string) ?? '',
        cohort_level: (cohort?.level as string) ?? '',
        cohort_ratio: (cohort?.ratio as string) ?? '',
        cohort_status: (cohort?.status as string) ?? '',
        cohort_meet_url: (cohort?.google_meet_url as string) ?? null,
      };
    });
  } catch (err) {
    console.warn('[teacher] fetchTeacherBookings error:', err);
    return [];
  }
}

/* ───── Students (across all assigned cohorts) ───── */
export async function fetchTeacherStudents(): Promise<TeacherStudentRow[]> {
  try {
    const supabase = createClient();
    const cohortIds = await fetchTeacherCohortIds();
    if (cohortIds.length === 0) return [];

    // Fetch enrollments for teacher's cohorts
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('*')
      .in('cohort_id', cohortIds)
      .neq('status', 'dropped')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!enrollments || enrollments.length === 0) return [];

    // Fetch profiles for those students
    const userIds = [...new Set(enrollments.map(e => e.user_id))];
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profileErr) throw profileErr;
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return enrollments.map(e => ({
      enrollment_id: e.id,
      user_id: e.user_id,
      student_name: profileMap.get(e.user_id)?.full_name ?? null,
      student_email: profileMap.get(e.user_id)?.email ?? null,
      track: e.track,
      level: e.level,
      ratio: e.ratio,
      status: e.status,
      cohort_id: e.cohort_id,
      created_at: e.created_at,
    }));
  } catch (err) {
    console.warn('[teacher] fetchTeacherStudents error:', err);
    return [];
  }
}

/* ───── Update booking status (mark complete / no-show / cancel) ───── */
export async function updateBookingStatus(
  bookingId: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}
