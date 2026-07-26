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
import { getCourseSyllabus } from '@/lib/dashboard/student-data';

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

/* ════════════════════════════════════════════════════════════════
   v2 — Session roster, attendance, notes, reschedule, and
   teacher-owned cohort list.
   All functions create their supabase client INSIDE the body.
   ════════════════════════════════════════════════════════════════ */

/* ───── Types ───── */
export interface SessionStudentRow {
  user_id: string;
  student_name: string | null;
  student_email: string | null;
  attendance_status: string | null;
  note: string | null;
  lessons_completed: number;
  total_lessons: number;
}

export interface TeacherCohortRow {
  id: string;
  track: string;
  level: string;
  ratio: string;
  status: string;
}

/* ───── 1. fetchSessionStudents ─────
   Returns the roster for a single booking/session:
     1. Look up the booking's cohort_id
     2. Pull every active (non-dropped) enrollment in that cohort
     3. Join each student's profile (name, email)
     4. Join per-student attendance for this booking
     5. Join per-student session note for this booking (teacher-scoped)
     6. Count lesson_progress rows per enrollment + the syllabus total
   Returns SessionStudentRow[]. */
export async function fetchSessionStudents(bookingId: string): Promise<SessionStudentRow[]> {
  if (!bookingId) return [];
  try {
    const supabase = createClient();

    // 1. Get the booking → cohort_id + teacher_id (used for notes scoping).
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('cohort_id, teacher_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingErr) throw bookingErr;
    if (!booking || !booking.cohort_id) return [];

    const cohortId = booking.cohort_id as string;
    const teacherId = (booking.teacher_id as string | null) ?? null;

    // 2. Pull every active (non-dropped) enrollment in the cohort.
    const { data: enrollments, error: enrollErr } = await supabase
      .from('enrollments')
      .select('id, user_id, track, level')
      .eq('cohort_id', cohortId)
      .neq('status', 'dropped')
      .order('created_at', { ascending: true });

    if (enrollErr) throw enrollErr;
    if (!enrollments || enrollments.length === 0) return [];

    const userIds = [...new Set(enrollments.map((e) => e.user_id).filter(Boolean))] as string[];
    const enrollmentIds = enrollments.map((e) => e.id);

    // 3. Profiles (name + email)
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    if (profileErr) throw profileErr;
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // 4. Attendance for this booking
    // Schema-correct columns: student_id (not user_id), marked_at (not recorded_at).
    const { data: attendance, error: attErr } = await supabase
      .from('session_attendance')
      .select('student_id, status')
      .eq('booking_id', bookingId)
      .in('student_id', userIds);
    if (attErr) throw attErr;
    const attendanceMap = new Map<string, string>(
      (attendance ?? []).map((a) => [a.student_id as string, a.status as string])
    );

    // 5. Session notes (teacher-scoped — one note per booking+teacher)
    let notesMap = new Map<string, string>();
    if (teacherId) {
      const { data: notes, error: notesErr } = await supabase
        .from('session_notes')
        .select('content')
        .eq('booking_id', bookingId)
        .eq('teacher_id', teacherId)
        .maybeSingle();
      if (!notesErr && notes) {
        // session_notes is a single row per (booking, teacher) — applies
        // to the whole roster, so we set the same content for every student.
        const content = (notes as { content?: string | null }).content ?? null;
        notesMap = new Map(userIds.map((uid) => [uid, content ?? '']));
      }
    }

    // 6. Lesson progress counts per enrollment
    const { data: progress, error: progErr } = await supabase
      .from('lesson_progress')
      .select('enrollment_id')
      .in('enrollment_id', enrollmentIds);
    if (progErr) throw progErr;
    const progressMap = new Map<string, number>();
    (progress ?? []).forEach((p) => {
      const eid = p.enrollment_id as string | null;
      if (eid) progressMap.set(eid, (progressMap.get(eid) ?? 0) + 1);
    });

    return enrollments.map((e) => {
      const p = profileMap.get(e.user_id);
      const noteRaw = notesMap.get(e.user_id);
      return {
        user_id: e.user_id,
        student_name: p?.full_name ?? null,
        student_email: p?.email ?? null,
        attendance_status: attendanceMap.get(e.user_id) ?? null,
        note: noteRaw !== undefined ? noteRaw : null,
        lessons_completed: progressMap.get(e.id) ?? 0,
        total_lessons: 0, // filled by caller via getCourseSyllabus if needed
      };
    });
  } catch (err) {
    console.warn('[teacher] fetchSessionStudents error:', err);
    return [];
  }
}

/* ───── 2. markAttendance ─────
   Upserts a session_attendance row for (booking_id, user_id).
   Sets recorded_by to the current teacher.
   Also triggers lesson progress automation when status is 'present' or
   'late' — the corresponding lesson for this session is auto-marked
   complete for the student. The automation runs server-side via
   /api/teacher/attendance so the service-role client can write to
   lesson_progress (RLS would block teacher → student writes). */
export async function markAttendance(
  bookingId: string,
  studentId: string,
  status: 'present' | 'absent' | 'late' | 'excused' | 'unknown'
): Promise<{ success: boolean; error?: string; lessonMarked?: boolean; lessonName?: string }> {
  if (!bookingId || !studentId) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const res = await fetch('/api/teacher/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, studentId, status }),
    });
    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      message?: string;
      lessonMarked?: boolean;
      lessonName?: string;
      moduleNum?: string;
      reason?: string;
    };
    if (!res.ok || !json.ok) {
      return { success: false, error: json.error || json.message || 'mark_attendance_failed' };
    }
    return {
      success: true,
      lessonMarked: json.lessonMarked,
      lessonName: json.lessonName ? `${json.moduleNum ?? ''} · ${json.lessonName}`.trim() : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[teacher] markAttendance error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 3. saveSessionNote ─────
   Upserts the (booking, teacher) session_notes row. */
export async function saveSessionNote(
  bookingId: string,
  studentId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  if (!bookingId) {
    return { success: false, error: 'Missing booking id' };
  }
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const teacherId = user?.id;
    if (!teacherId) {
      return { success: false, error: 'No authenticated teacher' };
    }

    // session_notes is unique on (booking_id, teacher_id). We pass
    // studentId through so the call signature matches the spec, but
    // the note is teacher-scoped for the whole booking.
    void studentId;

    const { error } = await supabase
      .from('session_notes')
      .upsert(
        {
          booking_id: bookingId,
          teacher_id: teacherId,
          content: note ?? '',
        },
        { onConflict: 'booking_id,teacher_id' }
      );

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[teacher] saveSessionNote error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 4. rescheduleBooking ─────
   Updates slot_start and slot_end on an existing booking. */
export async function rescheduleBooking(
  bookingId: string,
  newSlotStart: string,
  newSlotEnd: string
): Promise<{ success: boolean; error?: string }> {
  if (!bookingId || !newSlotStart || !newSlotEnd) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('bookings')
      .update({
        slot_start: newSlotStart,
        slot_end: newSlotEnd,
      })
      .eq('id', bookingId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[teacher] rescheduleBooking error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 5. createBooking ─────
   Creates a new booking with the current user as the teacher.
   Copies the cohort's google_meet_url onto the booking.
   AUTO-TAGS module_num + lesson_name from the cohort's syllabus based on
   session sequence (1st booking = lesson 1, 2nd = lesson 2, etc.) — no
   teacher UI needed, the mapping is derived from code. */
export async function createBooking(params: {
  cohortId: string;
  slotStart: string;
  slotEnd: string;
}): Promise<{ success: boolean; error?: string; bookingId?: string }> {
  if (!params.cohortId || !params.slotStart || !params.slotEnd) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const teacherId = user?.id;
    if (!teacherId) {
      return { success: false, error: 'No authenticated teacher' };
    }

    // Fetch the cohort's google_meet_url + track + level (for syllabus lookup).
    const { data: cohort, error: cohortErr } = await supabase
      .from('cohorts')
      .select('google_meet_url, track, level')
      .eq('id', params.cohortId)
      .maybeSingle();

    if (cohortErr) throw cohortErr;

    // ── Auto-derive module_num + lesson_name from syllabus ──────────────
    // Count existing bookings in this cohort to determine the sequence number.
    // The Nth booking for this cohort = the Nth lesson in the syllabus.
    let moduleNum: number | null = null;
    let lessonName: string | null = null;
    if (cohort?.track && cohort?.level) {
      const { count: existingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('cohort_id', params.cohortId);

      const sessionSeq = (existingCount ?? 0) + 1; // 1-based: this will be the Nth session

      // Look up the syllabus to find the Nth lesson across all modules.
      const syllabus = getCourseSyllabus(cohort.track, cohort.level);
      let lessonIndex = 0;
      for (const mod of syllabus.modules) {
        for (const lesson of mod.lessons) {
          lessonIndex += 1;
          if (lessonIndex === sessionSeq) {
            moduleNum = parseInt(mod.num, 10);
            lessonName = typeof lesson === 'string' ? lesson : lesson.name;
            break;
          }
        }
        if (moduleNum !== null) break;
      }
      // If sessionSeq > total lessons (e.g. extra review session), leave module_num null.
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        cohort_id: params.cohortId,
        teacher_id: teacherId,
        slot_start: params.slotStart,
        slot_end: params.slotEnd,
        status: 'scheduled',
        google_meet_url: cohort?.google_meet_url ?? null,
        module_num: moduleNum,
        lesson_name: lessonName,
      })
      .select('id')
      .single();

    if (error) throw error;
    return { success: true, bookingId: data?.id ?? undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[teacher] createBooking error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 6. fetchTeacherCohorts ─────
   Returns the distinct set of cohorts the current teacher has bookings
   in, with full cohort details. */
export async function fetchTeacherCohorts(): Promise<TeacherCohortRow[]> {
  try {
    const cohortIds = await fetchTeacherCohortIds();
    if (cohortIds.length === 0) return [];

    const supabase = createClient();
    const { data: cohorts, error } = await supabase
      .from('cohorts')
      .select('id, track, level, ratio, status')
      .in('id', cohortIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (cohorts ?? []).map((c) => ({
      id: c.id,
      track: c.track,
      level: c.level,
      ratio: c.ratio,
      status: c.status,
    }));
  } catch (err) {
    console.warn('[teacher] fetchTeacherCohorts error:', err);
    return [];
  }
}
