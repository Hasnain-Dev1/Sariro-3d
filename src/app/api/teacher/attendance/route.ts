import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/razorpay/server';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/teacher/attendance
 *
 * Body: { bookingId, studentId, status }
 *   status: 'present' | 'absent' | 'late' | 'excused' | 'unknown'
 *
 * Flow:
 *   1. Auth-gate (must be signed in as teacher).
 *   2. Rate limit per teacher (60 attendance marks / minute — generous for
 *      bulk roster marking, blocks brute force).
 *   3. Verify the booking exists + the authenticated teacher owns it
 *      (teacher_id on the booking row must match user.id).
 *   4. Upsert the session_attendance row (SSR client, RLS applies).
 *   5. LESSON AUTOMATION: if status is 'present' or 'late', automatically
 *      mark the corresponding lesson complete for the student:
 *        a. Look up the cohort (track, level) from the booking.
 *        b. Look up the student's enrollment for that cohort.
 *        c. Get the syllabus for the track + level.
 *        d. Flatten the syllabus into a list of (module_num, lesson_name).
 *        e. Find this booking's index among the cohort's bookings ordered
 *           by slot_start (1st session = lesson 1, 2nd = lesson 2, ...).
 *        f. If the index is within syllabus bounds, upsert a lesson_progress
 *           row using the SERVICE-ROLE client (RLS would block teacher
 *           from writing student-owned rows).
 *   6. Return { ok, lessonMarked?, moduleNum?, lessonName?, reason? }.
 *
 * Idempotency:
 *   - session_attendance upsert is idempotent (conflict on booking_id+user_id).
 *   - lesson_progress insert is idempotent (23505 unique violation is treated as success).
 *   - Re-marking the same student present multiple times → no duplicate rows.
 */

export const runtime = 'nodejs';

interface AttendanceBody {
  bookingId?: string;
  studentId?: string;
  status?: 'present' | 'absent' | 'late' | 'excused' | 'unknown';
}

interface BookingRow {
  id: string;
  cohort_id: string;
  teacher_id: string;
  slot_start: string;
}

interface CohortRow {
  id: string;
  track: string;
  level: string;
}

interface EnrollmentRow {
  id: string;
  user_id: string;
  cohort_id: string;
}

/** Flatten the syllabus into an ordered list of (moduleNum, lessonName). */
function flattenSyllabus(
  track: string,
  level: string
): { moduleNum: string; lessonName: string }[] {
  const syllabus = getCourseSyllabus(track, level);
  const out: { moduleNum: string; lessonName: string }[] = [];
  for (const mod of syllabus.modules) {
    for (const lesson of mod.lessons) {
      out.push({ moduleNum: mod.num, lessonName: lesson });
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  // ── CSRF check — must come from the same origin ────────────────────
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  // ── IP blocklist — instantly 403 known abusers ─────────────────────
  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Auth gate ───────────────────────────────────────────────────────
  let teacherId: string | null = null;
  try {
    // createServerClientHelper throws when Supabase isn't configured —
    // catch silently + treat as unauthenticated (don't pollute logs).
    const supaServer = await createServerClientHelper();
    const { data: { user } } = await supaServer.auth.getUser();
    teacherId = user?.id ?? null;
  } catch {
    /* supabase not configured OR no session — either way, 401 below */
  }
  if (!teacherId) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  // ── Rate limit (per teacher) ────────────────────────────────────────
  const rl = rateLimit({
    key: `attendance:${teacherId}`,
    limit: 60,
    windowMs: 60_000,
    ip: requestIp,
  });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many attendance marks — slow down.');
  }

  // ── Parse + validate body ───────────────────────────────────────────
  let body: AttendanceBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const { bookingId, studentId, status } = body;
  if (!bookingId || !studentId) {
    return NextResponse.json(
      { ok: false, error: 'missing_params', message: 'bookingId and studentId are required' },
      { status: 400 }
    );
  }
  const validStatuses = ['present', 'absent', 'late', 'excused', 'unknown'];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_status', message: `status must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }

  const supaServer = await createServerClientHelper();

  // ── Verify booking + ownership ──────────────────────────────────────
  const { data: booking, error: bookingErr } = await supaServer
    .from('bookings')
    .select('id, cohort_id, teacher_id, slot_start')
    .eq('id', bookingId)
    .maybeSingle();
  if (bookingErr) {
    console.warn('[attendance] booking lookup error:', bookingErr.message);
    return NextResponse.json({ ok: false, error: 'booking_lookup_failed' }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ ok: false, error: 'booking_not_found' }, { status: 404 });
  }
  if ((booking as BookingRow).teacher_id !== teacherId) {
    return NextResponse.json(
      { ok: false, error: 'forbidden', message: 'You can only mark attendance for your own sessions.' },
      { status: 403 }
    );
  }

  // ── Upsert attendance ───────────────────────────────────────────────
  const { error: upsertErr } = await supaServer
    .from('session_attendance')
    .upsert(
      {
        booking_id: bookingId,
        user_id: studentId,
        status,
        recorded_by: teacherId,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id,user_id' }
    );
  if (upsertErr) {
    console.warn('[attendance] upsert error:', upsertErr.message);
    return NextResponse.json(
      { ok: false, error: 'attendance_upsert_failed', message: upsertErr.message },
      { status: 500 }
    );
  }

  // ── Lesson automation (only for present / late) ─────────────────────
  if (status !== 'present' && status !== 'late') {
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: 'status_not_progress_eligible',
    });
  }

  // Get the cohort (track, level) from the booking
  const { data: cohort, error: cohortErr } = await supaServer
    .from('cohorts')
    .select('id, track, level')
    .eq('id', (booking as BookingRow).cohort_id)
    .maybeSingle();
  if (cohortErr || !cohort) {
    console.warn('[attendance] cohort lookup failed:', cohortErr?.message ?? 'no cohort');
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: 'cohort_not_found',
    });
  }
  const cohortRow = cohort as CohortRow;

  // Get the student's enrollment for this cohort
  const { data: enrollment, error: enrollErr } = await supaServer
    .from('enrollments')
    .select('id, user_id, cohort_id')
    .eq('user_id', studentId)
    .eq('cohort_id', cohortRow.id)
    .neq('status', 'dropped')
    .limit(1)
    .maybeSingle();
  if (enrollErr || !enrollment) {
    console.warn('[attendance] enrollment lookup failed:', enrollErr?.message ?? 'no enrollment');
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: 'enrollment_not_found',
    });
  }
  const enrollmentRow = enrollment as EnrollmentRow;

  // Flatten syllabus → ordered list of lessons
  const lessons = flattenSyllabus(cohortRow.track, cohortRow.level);
  if (lessons.length === 0) {
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: 'no_syllabus',
    });
  }

  // Find this booking's index among the cohort's bookings ordered by slot_start
  const { data: cohortBookings, error: cbErr } = await supaServer
    .from('bookings')
    .select('id, slot_start')
    .eq('cohort_id', cohortRow.id)
    .order('slot_start', { ascending: true });
  if (cbErr || !cohortBookings) {
    console.warn('[attendance] cohort bookings lookup failed:', cbErr?.message);
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: 'cohort_bookings_lookup_failed',
    });
  }

  const lessonIndex = cohortBookings.findIndex((b) => b.id === bookingId);
  if (lessonIndex < 0 || lessonIndex >= lessons.length) {
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: lessonIndex < 0 ? 'booking_not_in_cohort' : 'lesson_index_out_of_syllabus',
      lessonIndex,
      syllabusLength: lessons.length,
    });
  }

  const { moduleNum, lessonName } = lessons[lessonIndex];

  // ── Service-role insert into lesson_progress (bypasses RLS) ─────────
  // The teacher can't directly write to a student-owned lesson_progress
  // row via RLS — we use the service-role admin client.
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.warn('[attendance] service-role client unavailable — lesson automation skipped');
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: 'service_role_unavailable',
    });
  }

  const { error: lpErr } = await admin.from('lesson_progress').insert({
    enrollment_id: enrollmentRow.id,
    module_num: moduleNum,
    lesson_name: lessonName,
    // completed_at defaults to now() in DB
  });

  if (lpErr) {
    // 23505 = unique_violation — already marked, treat as success
    if (lpErr.code === '23505') {
      return NextResponse.json({
        ok: true,
        lessonMarked: true,
        idempotent: true,
        moduleNum,
        lessonName,
        lessonIndex,
      });
    }
    console.warn('[attendance] lesson_progress insert error:', lpErr.message);
    return NextResponse.json({
      ok: true,
      lessonMarked: false,
      reason: 'lesson_progress_insert_failed',
      error: lpErr.message,
    });
  }

  return NextResponse.json({
    ok: true,
    lessonMarked: true,
    moduleNum,
    lessonName,
    lessonIndex,
    syllabusLength: lessons.length,
  });
}

/* ─────────────────────── GET /api/teacher/attendance ────────────────
   Status endpoint. */
export async function GET() {
  return NextResponse.json({
    name: 'Sariro Teacher Attendance',
    description: 'Mark attendance + auto-progress lesson for student.',
    statusFields: ['present', 'absent', 'late', 'excused', 'unknown'],
    automation: 'present / late → lesson_progress auto-upserted',
  });
}
