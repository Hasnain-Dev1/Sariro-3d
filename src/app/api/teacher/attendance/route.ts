import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { advanceLesson } from '@/lib/classes/advance-lesson';

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
  /**
   * V2 §16 — a note about THIS student in THIS class.
   *
   * Per student, not per class: "joined 8 minutes late" belongs to one child,
   * and a class-wide remark cannot say that. Optional, and an omitted note
   * leaves any existing one alone rather than blanking it — a teacher
   * correcting a status should not silently lose what they wrote earlier.
   */
  note?: string;
}

interface BookingRow {
  id: string;
  cohort_id: string;
  teacher_id: string;
  slot_start: string;
  slot_end: string;
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

  /**
   * Trimmed and clamped, and `undefined` when the caller sent nothing.
   *
   * An empty string IS meaningful — it is a teacher clearing a note they had
   * written — so it is kept and stored as null. Only an absent field leaves
   * the existing note untouched.
   */
  const noteText =
    body.note === undefined ? undefined : body.note.trim().slice(0, 1000) || null;
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
    .select('id, cohort_id, teacher_id, slot_start, slot_end')
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

  // ── Attendance unlocks 25 minutes after the class STARTS — not after it
  //    fully ends. Waiting for slot_end (often a full hour) left teachers
  //    unable to mark attendance for far too long; 25 minutes in is enough
  //    to know who showed up. ──────────────────────────────────────────
  const ATTENDANCE_UNLOCK_MIN = 25;
  const slotStart = (booking as BookingRow).slot_start;
  const unlocksAt = new Date(slotStart).getTime() + ATTENDANCE_UNLOCK_MIN * 60_000;
  if (Date.now() < unlocksAt) {
    const mins = Math.ceil((unlocksAt - Date.now()) / 60_000);
    return NextResponse.json(
      {
        ok: false, error: 'class_not_finished',
        message: `Attendance unlocks ${ATTENDANCE_UNLOCK_MIN} minutes after the class starts — about ${mins} minute${mins === 1 ? '' : 's'} left.`,
      },
      { status: 409 }
    );
  }

  // ── Upsert attendance ───────────────────────────────────────────────
  // Schema-correct columns: student_id (not user_id), marked_by (not recorded_by),
  // marked_at (not recorded_at). Discovered during Phase 2 schema audit.
  const { error: upsertErr } = await supaServer
    .from('session_attendance')
    .upsert(
      {
        booking_id: bookingId,
        student_id: studentId,
        status,
        marked_by: teacherId,
        marked_at: new Date().toISOString(),
        // Only written when supplied, so re-marking a status does not wipe a
        // note the teacher wrote a moment ago. `undefined` is dropped by
        // supabase-js; `null` would overwrite.
        ...(noteText !== undefined ? { note: noteText } : {}),
      },
      { onConflict: 'booking_id,student_id' }
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

  // lesson_progress belongs to the student, so the service-role client writes
  // it (lib/classes/advance-lesson.ts — the same rule the register confirm and
  // class completion use).
  let admin;
  try {
    admin = createServiceClient();
  } catch {
    console.warn('[attendance] service-role client unavailable — lesson automation skipped');
    return NextResponse.json({ ok: true, lessonMarked: false, reason: 'service_role_unavailable' });
  }
  const advanced = await advanceLesson(admin, bookingId, (booking as BookingRow).cohort_id, studentId);
  return NextResponse.json({ ok: true, ...advanced });
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
