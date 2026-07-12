/**
 * SARIRO — Admin Dashboard data layer
 * 
 * All Supabase queries for the admin dashboard.
 * RLS policies ensure only admin/super_admin can read these.
 * 
 * NOTE: supabase client is created INSIDE each function (not at module level)
 * to avoid SSR issues — createBrowserClient must run in the browser only.
 */

import { createClient } from '@/lib/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalEnrollments: number;
  pendingPurchaseIntents: number;
  activeCohorts: number;
  totalCohorts: number;
  revenue: number;
}

export interface PurchaseIntentRow {
  id: string;
  user_id: string;
  track: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ratio: '1:1' | '1:4';
  razorpay_link: string | null;
  status: 'pending' | 'confirmed' | 'expired';
  created_at: string;
  confirmed_at: string | null;
  student_name: string | null;
  student_email: string | null;
}

export interface CohortRow {
  id: string;
  track: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ratio: '1:1' | '1:4';
  status: 'gathering' | 'ready' | 'active' | 'completed';
  max_capacity: number;
  google_meet_url: string | null;
  created_at: string;
  activated_at: string | null;
  completed_at: string | null;
  student_count: number;
}

/* ───── Stats ───── */
export async function fetchAdminStats(): Promise<AdminStats> {
  const stats: AdminStats = {
    totalUsers: 0,
    totalEnrollments: 0,
    pendingPurchaseIntents: 0,
    activeCohorts: 0,
    totalCohorts: 0,
    revenue: 0,
  };

  try {
    const supabase = createClient();
    const [usersRes, enrollmentsRes, piRes, cohortsRes, activeCohortsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('purchase_intents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('cohorts').select('id', { count: 'exact', head: true }),
      supabase.from('cohorts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    stats.totalUsers = usersRes.count ?? 0;
    stats.totalEnrollments = enrollmentsRes.count ?? 0;
    stats.pendingPurchaseIntents = piRes.count ?? 0;
    stats.totalCohorts = cohortsRes.count ?? 0;
    stats.activeCohorts = activeCohortsRes.count ?? 0;
  } catch (err) {
    console.warn('[admin] stats fetch error:', err);
  }

  return stats;
}

/* ───── Pending purchase intents (enrollment approval queue) ───── */
export async function fetchPendingPurchaseIntents(): Promise<PurchaseIntentRow[]> {
  try {
    const supabase = createClient();
    const { data: intents, error } = await supabase
      .from('purchase_intents')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!intents || intents.length === 0) return [];

    const userIds = [...new Set(intents.map(i => i.user_id))];
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profileErr) throw profileErr;

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return intents.map(i => ({
      id: i.id,
      user_id: i.user_id,
      track: i.track,
      level: i.level,
      ratio: i.ratio,
      razorpay_link: i.razorpay_link,
      status: i.status,
      created_at: i.created_at,
      confirmed_at: i.confirmed_at,
      student_name: profileMap.get(i.user_id)?.full_name ?? null,
      student_email: profileMap.get(i.user_id)?.email ?? null,
    }));
  } catch (err) {
    console.warn('[admin] fetchPendingPurchaseIntents error:', err);
    return [];
  }
}

/* ───── Cohorts (with student count) ───── */
export async function fetchCohorts(statusFilter?: string): Promise<CohortRow[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('cohorts').select('*').order('created_at', { ascending: false });
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const { data: cohorts, error } = await query;
    if (error) throw error;
    if (!cohorts || cohorts.length === 0) return [];

    const cohortIds = cohorts.map(c => c.id);
    const { data: enrollments, error: enrollErr } = await supabase
      .from('enrollments')
      .select('cohort_id')
      .in('cohort_id', cohortIds)
      .not('status', 'eq', 'dropped');

    if (enrollErr) throw enrollErr;

    const countMap = new Map<string, number>();
    (enrollments || []).forEach(e => {
      if (e.cohort_id) {
        countMap.set(e.cohort_id, (countMap.get(e.cohort_id) ?? 0) + 1);
      }
    });

    return cohorts.map(c => ({
      id: c.id,
      track: c.track,
      level: c.level,
      ratio: c.ratio,
      status: c.status,
      max_capacity: c.max_capacity,
      google_meet_url: c.google_meet_url,
      created_at: c.created_at,
      activated_at: c.activated_at,
      completed_at: c.completed_at,
      student_count: countMap.get(c.id) ?? 0,
    }));
  } catch (err) {
    console.warn('[admin] fetchCohorts error:', err);
    return [];
  }
}

/* ───── Find a matching gathering cohort for an intent ───── */
export async function findGatheringCohort(
  track: string,
  level: string,
  ratio: string
): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cohorts')
      .select('id, max_capacity')
      .eq('track', track)
      .eq('level', level)
      .eq('ratio', ratio)
      .eq('status', 'gathering')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
  } catch (err) {
    console.warn('[admin] findGatheringCohort error:', err);
    return null;
  }
}

/* ───── Create a new gathering cohort ───── */
export async function createCohort(params: {
  track: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ratio: '1:1' | '1:4';
  max_capacity: number;
}): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cohorts')
      .insert({
        track: params.track,
        level: params.level,
        ratio: params.ratio,
        max_capacity: params.max_capacity,
        status: 'gathering',
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id ?? null;
  } catch (err) {
    console.warn('[admin] createCohort error:', err);
    return null;
  }
}

/* ───── Confirm a purchase intent → create enrollment ───── */
export async function confirmPurchaseIntent(intent: PurchaseIntentRow): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    // 1. Find or create a gathering cohort
    let cohortId = await findGatheringCohort(intent.track, intent.level, intent.ratio);
    if (!cohortId) {
      cohortId = await createCohort({
        track: intent.track,
        level: intent.level,
        ratio: intent.ratio,
        max_capacity: intent.ratio === '1:1' ? 1 : 4,
      });
    }
    if (!cohortId) {
      return { success: false, error: 'Failed to find or create cohort' };
    }

    // 2. Create the enrollment
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert({
        user_id: intent.user_id,
        track: intent.track,
        level: intent.level,
        ratio: intent.ratio,
        status: 'active',
        cohort_id: cohortId,
        started_at: new Date().toISOString(),
      });

    if (enrollErr) throw enrollErr;

    // 3. Mark the purchase intent as confirmed
    const { error: piErr } = await supabase
      .from('purchase_intents')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', intent.id);

    if (piErr) throw piErr;

    // 4. Drop a notification to the student (best-effort — RLS may
    //    block browser-side inserts addressed to other users; if so,
    //    the failure is logged and swallowed so the confirmation still
    //    succeeds).
    try {
      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: intent.user_id,
        type: 'enrollment_confirmed',
        title: 'Your enrollment is confirmed!',
        message: `Your ${intent.level} ${intent.track} (${intent.ratio}) enrollment has been approved. Visit your dashboard to see your cohort.`,
        link: '/dashboard/student',
      });
      if (notifErr) {
        console.warn('[admin] confirmPurchaseIntent notification blocked:', notifErr.message);
      }
    } catch (notifErr) {
      console.warn('[admin] confirmPurchaseIntent notification error:', notifErr);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] confirmPurchaseIntent error:', err);
    return { success: false, error: msg };
  }
}

/* ───── Reject a purchase intent ───── */
export async function rejectPurchaseIntent(intentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('purchase_intents')
      .update({ status: 'expired' })
      .eq('id', intentId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/* ───── Cohort state machine transitions ───── */
export async function transitionCohortStatus(
  cohortId: string,
  newStatus: 'gathering' | 'ready' | 'active' | 'completed',
  googleMeetUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const update: Record<string, string | null> = { status: newStatus };
    if (newStatus === 'active') {
      update.activated_at = new Date().toISOString();
      if (googleMeetUrl) update.google_meet_url = googleMeetUrl;
    }
    if (newStatus === 'completed') {
      update.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('cohorts')
      .update(update)
      .eq('id', cohortId);

    if (error) throw error;

    // ── Best-effort notifications ──────────────────────────────────────
    // When activating or completing a cohort, notify every student with
    // an active (non-dropped) enrollment in that cohort. RLS may block
    // browser-side inserts addressed to other users — failures are logged
    // and swallowed so the cohort transition itself still succeeds.
    if (newStatus === 'active' || newStatus === 'completed') {
      try {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('user_id')
          .eq('cohort_id', cohortId)
          .neq('status', 'dropped');

        const userIds = (enrollments ?? [])
          .map((e) => e.user_id)
          .filter((id): id is string => !!id);

        if (userIds.length > 0) {
          const title =
            newStatus === 'active'
              ? 'Your cohort is now live!'
              : 'Your cohort has completed';
          const message =
            newStatus === 'active'
              ? 'Your Sariro cohort has been activated. Check your schedule for the next session.'
              : 'Congratulations! Your Sariro cohort has been marked complete. Your certificate will be available shortly.';
          const link = '/dashboard/student';
          const type = newStatus === 'active' ? 'cohort_activated' : 'cohort_completed';

          const rows = userIds.map((uid) => ({
            user_id: uid,
            type,
            title,
            message,
            link,
          }));

          const { error: notifErr } = await supabase
            .from('notifications')
            .insert(rows);

          if (notifErr) {
            console.warn('[admin] transitionCohortStatus notification insert blocked:', notifErr.message);
          }
        }
      } catch (notifErr) {
        console.warn('[admin] transitionCohortStatus notification error:', notifErr);
      }
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/* ════════════════════════════════════════════════════════════════
   v2 — Teacher management, user roster, cohort students,
   manual enrollment, revenue, CSV exports.
   All functions create their supabase client INSIDE the body.
   ════════════════════════════════════════════════════════════════ */

/* ───── Types ───── */
export interface TeacherRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  assignment_count: number;
  /** Backward-compat alias — same value as assignment_count. */
  cohort_count?: number;
}

export interface CohortBookingRow {
  id: string;
  teacher_id: string | null;
  teacher_name: string | null;
  teacher_email: string | null;
  slot_start: string;
  slot_end: string;
  status: string;
}

export interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_student: boolean;
  is_teacher: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  created_at: string;
  enrollment_count: number;
}

export interface CohortStudentRow {
  enrollment_id: string;
  user_id: string;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  track: string;
  level: string;
  ratio: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface RevenueStats {
  totalRevenue: number;
  confirmedCount: number;
  pendingCount: number;
  byTier: {
    beginner: number;
    intermediate: number;
    advanced: number;
    premium: number;
  };
}

/* ───── Hardcoded tier prices (mirror app-settings defaults) ───── */
const TIER_PRICES = {
  beginner: 199,
  intermediate: 299,
  advanced: 699,
  premiumAddon: 100,
} as const;

/* ───── 1. fetchTeachers ─────
   Returns every profile flagged as a teacher (role='teacher' OR
   is_teacher=true), with a count of bookings assigned to each. */
export async function fetchTeachers(): Promise<TeacherRow[]> {
  try {
    const supabase = createClient();
    const { data: teachers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .or('role.eq.teacher,is_teacher.eq.true')
      .order('full_name', { ascending: true, nullsFirst: false });

    if (error) throw error;
    if (!teachers || teachers.length === 0) return [];

    const teacherIds = teachers.map((t) => t.id);
    const { data: bookings, error: bookErr } = await supabase
      .from('bookings')
      .select('teacher_id')
      .in('teacher_id', teacherIds);

    if (bookErr) throw bookErr;

    const countMap = new Map<string, number>();
    (bookings ?? []).forEach((b) => {
      const tid = b.teacher_id as string | null;
      if (tid) countMap.set(tid, (countMap.get(tid) ?? 0) + 1);
    });

    return teachers.map((t) => {
      const count = countMap.get(t.id) ?? 0;
      return {
        id: t.id,
        full_name: t.full_name ?? null,
        email: t.email ?? null,
        phone: t.phone ?? null,
        assignment_count: count,
        cohort_count: count,
      };
    });
  } catch (err) {
    console.warn('[admin] fetchTeachers error:', err);
    return [];
  }
}

/* ───── 2. fetchCohortBookings ─────
   Lists all bookings (sessions) for a single cohort, with the
   assigned teacher's name + email joined in. */
export async function fetchCohortBookings(cohortId: string): Promise<CohortBookingRow[]> {
  if (!cohortId) return [];
  try {
    const supabase = createClient();
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, teacher_id, slot_start, slot_end, status')
      .eq('cohort_id', cohortId)
      .order('slot_start', { ascending: true });

    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    const teacherIds = [
      ...new Set(
        bookings
          .map((b) => b.teacher_id as string | null)
          .filter((id): id is string => !!id)
      ),
    ];

    let teacherMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (teacherIds.length > 0) {
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', teacherIds);

      if (!profileErr && profiles) {
        teacherMap = new Map(
          profiles.map((p) => [p.id, { full_name: p.full_name ?? null, email: p.email ?? null }])
        );
      }
    }

    return bookings.map((b) => {
      const teacher = b.teacher_id ? teacherMap.get(b.teacher_id) : undefined;
      return {
        id: b.id,
        teacher_id: (b.teacher_id as string | null) ?? null,
        teacher_name: teacher?.full_name ?? null,
        teacher_email: teacher?.email ?? null,
        slot_start: b.slot_start,
        slot_end: b.slot_end,
        status: b.status,
      };
    });
  } catch (err) {
    console.warn('[admin] fetchCohortBookings error:', err);
    return [];
  }
}

/* ───── 3. assignTeacherToCohort ─────
   Creates a new booking (session) and copies the cohort's Google Meet
   URL onto the booking row so teachers/students get a direct join link. */
export async function assignTeacherToCohort(params: {
  cohortId: string;
  teacherId: string;
  slotStart: string;
  slotEnd: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!params.cohortId || !params.teacherId || !params.slotStart || !params.slotEnd) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();

    // Fetch the cohort's google_meet_url so the booking carries it.
    const { data: cohort, error: cohortErr } = await supabase
      .from('cohorts')
      .select('google_meet_url')
      .eq('id', params.cohortId)
      .maybeSingle();

    if (cohortErr) throw cohortErr;

    const { error } = await supabase.from('bookings').insert({
      cohort_id: params.cohortId,
      teacher_id: params.teacherId,
      slot_start: params.slotStart,
      slot_end: params.slotEnd,
      status: 'scheduled',
      google_meet_url: cohort?.google_meet_url ?? null,
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] assignTeacherToCohort error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 4. updateBookingTeacher (reassign) ───── */
export async function updateBookingTeacher(
  bookingId: string,
  newTeacherId: string
): Promise<{ success: boolean; error?: string }> {
  if (!bookingId || !newTeacherId) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('bookings')
      .update({ teacher_id: newTeacherId })
      .eq('id', bookingId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] updateBookingTeacher error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 5. deleteBooking ───── */
export async function deleteBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  if (!bookingId) return { success: false, error: 'Missing booking id' };
  try {
    const supabase = createClient();
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] deleteBooking error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 6. fetchUsers ─────
   Searches profiles by name/email and optionally filters by role.
   Joins enrollment counts per user. */
export async function fetchUsers(
  search?: string,
  roleFilter?: string
): Promise<UserRow[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, is_student, is_teacher, is_admin, is_super_admin, created_at')
      .order('created_at', { ascending: false });

    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    if (search && search.trim()) {
      // Use PostgREST OR filter for case-insensitive ILIKE on two columns.
      const q = search.trim().replace(/[,()*]/g, ' ').trim();
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data: users, error } = await query.limit(200);
    if (error) throw error;
    if (!users || users.length === 0) return [];

    const userIds = users.map((u) => u.id);
    const { data: enrollments, error: enrollErr } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('user_id', userIds);

    if (enrollErr) throw enrollErr;

    const countMap = new Map<string, number>();
    (enrollments ?? []).forEach((e) => {
      const uid = e.user_id as string | null;
      if (uid) countMap.set(uid, (countMap.get(uid) ?? 0) + 1);
    });

    return users.map((u) => ({
      id: u.id,
      full_name: u.full_name ?? null,
      email: u.email ?? null,
      phone: u.phone ?? null,
      role: u.role ?? null,
      is_student: !!u.is_student,
      is_teacher: !!u.is_teacher,
      is_admin: !!u.is_admin,
      is_super_admin: !!u.is_super_admin,
      created_at: u.created_at,
      enrollment_count: countMap.get(u.id) ?? 0,
    }));
  } catch (err) {
    console.warn('[admin] fetchUsers error:', err);
    return [];
  }
}

/* ───── 7. updateUserRole ─────
   Updates the `role` column AND the four legacy boolean flags in one
   shot so both code paths (modern getRole() and legacy fallbacks)
   agree on the user's role. */
export async function updateUserRole(
  userId: string,
  newRole: 'student' | 'teacher' | 'admin' | 'super_admin'
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !newRole) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();
    const patch = {
      role: newRole,
      is_student: newRole === 'student',
      is_teacher: newRole === 'teacher',
      is_admin: newRole === 'admin',
      is_super_admin: newRole === 'super_admin',
    };
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] updateUserRole error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 8. fetchCohortStudents ─────
   Returns all enrollments attached to a cohort, joined with the
   student's profile (name, email, phone). Excludes dropped rows. */
export async function fetchCohortStudents(cohortId: string): Promise<CohortStudentRow[]> {
  if (!cohortId) return [];
  try {
    const supabase = createClient();
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('id, user_id, track, level, ratio, status, started_at, completed_at, created_at')
      .eq('cohort_id', cohortId)
      .neq('status', 'dropped')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!enrollments || enrollments.length === 0) return [];

    const userIds = [...new Set(enrollments.map((e) => e.user_id).filter(Boolean))] as string[];
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', userIds);

    if (profileErr) throw profileErr;
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return enrollments.map((e) => {
      const p = profileMap.get(e.user_id);
      return {
        enrollment_id: e.id,
        user_id: e.user_id,
        student_name: p?.full_name ?? null,
        student_email: p?.email ?? null,
        student_phone: p?.phone ?? null,
        track: e.track,
        level: e.level,
        ratio: e.ratio,
        status: e.status,
        started_at: e.started_at ?? null,
        completed_at: e.completed_at ?? null,
        created_at: e.created_at,
      };
    });
  } catch (err) {
    console.warn('[admin] fetchCohortStudents error:', err);
    return [];
  }
}

/* ───── 9. manualEnrollStudent ─────
   Bypasses payment: finds (or creates) a gathering cohort for the
   given track/level/ratio, then drops an active enrollment into it. */
export async function manualEnrollStudent(params: {
  userId: string;
  track: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ratio: '1:1' | '1:4';
}): Promise<{ success: boolean; error?: string; cohortId?: string }> {
  if (!params.userId || !params.track || !params.level || !params.ratio) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();

    // Find or create a gathering cohort.
    let cohortId = await findGatheringCohort(params.track, params.level, params.ratio);
    if (!cohortId) {
      cohortId = await createCohort({
        track: params.track,
        level: params.level,
        ratio: params.ratio,
        max_capacity: params.ratio === '1:1' ? 1 : 4,
      });
    }
    if (!cohortId) {
      return { success: false, error: 'Failed to find or create cohort' };
    }

    const { error: enrollErr } = await supabase.from('enrollments').insert({
      user_id: params.userId,
      track: params.track,
      level: params.level,
      ratio: params.ratio,
      status: 'active',
      cohort_id: cohortId,
      started_at: new Date().toISOString(),
    });

    if (enrollErr) throw enrollErr;

    // Best-effort notification to the student.
    try {
      await supabase.from('notifications').insert({
        user_id: params.userId,
        type: 'enrollment_confirmed',
        title: 'You have been enrolled!',
        message: `An admin has manually enrolled you in ${params.track} (${params.level}, ${params.ratio}). Head to your dashboard to see your cohort.`,
        link: '/dashboard/student',
      });
    } catch (notifErr) {
      console.warn('[admin] manualEnrollStudent notification error:', notifErr);
    }

    return { success: true, cohortId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] manualEnrollStudent error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 10. fetchRevenueStats ─────
   Sums revenue from purchase_intents in 'confirmed' or 'pending'
   status using hardcoded tier prices. Premium addon count is tracked
   separately (we count rows whose ratio is '1:1' as premium-capable). */
export async function fetchRevenueStats(): Promise<RevenueStats> {
  const stats: RevenueStats = {
    totalRevenue: 0,
    confirmedCount: 0,
    pendingCount: 0,
    byTier: { beginner: 0, intermediate: 0, advanced: 0, premium: 0 },
  };
  try {
    const supabase = createClient();
    const { data: intents, error } = await supabase
      .from('purchase_intents')
      .select('id, level, ratio, status')
      .in('status', ['confirmed', 'pending']);

    if (error) throw error;
    if (!intents || intents.length === 0) return stats;

    let revenue = 0;
    const byTier = { beginner: 0, intermediate: 0, advanced: 0, premium: 0 };

    for (const intent of intents) {
      const level = (intent.level || '').toLowerCase() as keyof typeof TIER_PRICES | string;
      let tierPrice = 0;
      if (level === 'beginner') {
        tierPrice = TIER_PRICES.beginner;
        byTier.beginner += 1;
      } else if (level === 'intermediate') {
        tierPrice = TIER_PRICES.intermediate;
        byTier.intermediate += 1;
      } else if (level === 'advanced') {
        tierPrice = TIER_PRICES.advanced;
        byTier.advanced += 1;
      }

      // Premium addon — counted when ratio is 1:1 (private cohort).
      if (intent.ratio === '1:1') {
        tierPrice += TIER_PRICES.premiumAddon;
        byTier.premium += 1;
      }

      // Only confirmed intents count toward realized revenue.
      if (intent.status === 'confirmed') {
        revenue += tierPrice;
        stats.confirmedCount += 1;
      } else if (intent.status === 'pending') {
        stats.pendingCount += 1;
      }
    }

    stats.totalRevenue = revenue;
    stats.byTier = byTier;
    return stats;
  } catch (err) {
    console.warn('[admin] fetchRevenueStats error:', err);
    return stats;
  }
}

/* ───── CSV export helpers ─────
   All three CSV exporters fetch their data, escape cells per RFC 4180,
   prepend a UTF-8 BOM (so Excel opens UTF-8 correctly), and trigger a
   browser download by anchoring a temporary blob URL. */

function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Quote if it contains a comma, quote, newline, or leading/trailing space.
  if (/[",\n\r]/.test(str) || /^\s|\s$/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCSVCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCSVCell).join(','));
  }
  // Prepend UTF-8 BOM so Excel interprets the file as UTF-8.
  return '\uFEFF' + lines.join('\r\n');
}

function triggerCSVDownload(filename: string, csv: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on next tick to give the download a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ───── 11. exportUsersCSV ───── */
export async function exportUsersCSV(): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await fetchUsers();
    const headers = [
      'ID', 'Full Name', 'Email', 'Phone', 'Role',
      'Is Student', 'Is Teacher', 'Is Admin', 'Is Super Admin',
      'Enrollment Count', 'Created At',
    ];
    const rows = users.map((u) => [
      u.id,
      u.full_name ?? '',
      u.email ?? '',
      u.phone ?? '',
      u.role ?? '',
      u.is_student ? 'yes' : 'no',
      u.is_teacher ? 'yes' : 'no',
      u.is_admin ? 'yes' : 'no',
      u.is_super_admin ? 'yes' : 'no',
      u.enrollment_count,
      u.created_at,
    ]);
    const csv = buildCSV(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerCSVDownload(`sariro-users-${stamp}.csv`, csv);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] exportUsersCSV error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 12. exportEnrollmentsCSV ───── */
export async function exportEnrollmentsCSV(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('id, user_id, track, level, ratio, status, cohort_id, started_at, completed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) throw error;
    if (!enrollments || enrollments.length === 0) {
      // Still trigger an empty CSV (headers only) so the user gets feedback.
      const csv = buildCSV(
        ['Enrollment ID', 'Student Name', 'Student Email', 'Track', 'Level', 'Ratio', 'Status', 'Cohort ID', 'Started At', 'Completed At', 'Created At'],
        []
      );
      const stamp = new Date().toISOString().slice(0, 10);
      triggerCSVDownload(`sariro-enrollments-${stamp}.csv`, csv);
      return { success: true };
    }

    const userIds = [...new Set(enrollments.map((e) => e.user_id).filter(Boolean))] as string[];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const headers = [
      'Enrollment ID', 'Student Name', 'Student Email', 'Track', 'Level',
      'Ratio', 'Status', 'Cohort ID', 'Started At', 'Completed At', 'Created At',
    ];
    const rows = enrollments.map((e) => {
      const p = profileMap.get(e.user_id);
      return [
        e.id,
        p?.full_name ?? '',
        p?.email ?? '',
        e.track,
        e.level,
        e.ratio,
        e.status,
        e.cohort_id ?? '',
        e.started_at ?? '',
        e.completed_at ?? '',
        e.created_at,
      ];
    });

    const csv = buildCSV(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerCSVDownload(`sariro-enrollments-${stamp}.csv`, csv);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] exportEnrollmentsCSV error:', err);
    return { success: false, error: msg };
  }
}

/* ───── 13. exportRevenueCSV ───── */
export async function exportRevenueCSV(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: intents, error } = await supabase
      .from('purchase_intents')
      .select('id, user_id, track, level, ratio, status, razorpay_link, created_at, confirmed_at')
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) throw error;

    const userIds = [
      ...new Set((intents ?? []).map((i) => i.user_id).filter(Boolean)),
    ] as string[];
    let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { full_name: p.full_name ?? null, email: p.email ?? null }])
      );
    }

    const headers = [
      'Intent ID', 'Student Name', 'Student Email', 'Track', 'Level', 'Ratio',
      'Status', 'Tier Price (USD)', 'Premium Addon (USD)', 'Total (USD)',
      'Razorpay Link', 'Created At', 'Confirmed At',
    ];
    const rows = (intents ?? []).map((i) => {
      const p = profileMap.get(i.user_id);
      const level = (i.level || '').toLowerCase();
      let tier = 0;
      if (level === 'beginner') tier = TIER_PRICES.beginner;
      else if (level === 'intermediate') tier = TIER_PRICES.intermediate;
      else if (level === 'advanced') tier = TIER_PRICES.advanced;
      const premium = i.ratio === '1:1' ? TIER_PRICES.premiumAddon : 0;
      // Only confirmed rows contribute realized revenue.
      const total = i.status === 'confirmed' ? tier + premium : 0;
      return [
        i.id,
        p?.full_name ?? '',
        p?.email ?? '',
        i.track,
        i.level,
        i.ratio,
        i.status,
        tier,
        premium,
        total,
        i.razorpay_link ?? '',
        i.created_at,
        i.confirmed_at ?? '',
      ];
    });

    const csv = buildCSV(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerCSVDownload(`sariro-revenue-${stamp}.csv`, csv);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] exportRevenueCSV error:', err);
    return { success: false, error: msg };
  }
}
