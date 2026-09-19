import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';
import { advanceLesson } from '@/lib/classes/advance-lesson';

/**
 * SARIRO — POST /api/teacher/register — the whole register in one tap
 * ============================================================================
 * Body: { bookingId, marks: [{ studentId, status }] }
 *   status: 'present' | 'late' | 'absent' | 'excused'
 *
 * The register pre-fills itself from who joined (lib/classes/register.ts); the
 * teacher confirms it here in ONE request instead of one per child. Every
 * present or late student moves one lesson on (lib/classes/advance-lesson.ts)
 * — including those whose "Present" came from joining, which is the case the
 * old one-button-per-child register quietly missed.
 *
 * The same rules as marking one student (/api/teacher/attendance): the
 * teacher on the booking (or an admin), from 25 minutes after the start, and
 * only students enrolled in the class. Notes are left alone.
 */
export const runtime = 'nodejs';

const STATUSES = new Set(['present', 'late', 'absent', 'excused']);
const UNLOCK_MINUTES = 25;

interface Mark { studentId: string; status: 'present' | 'late' | 'absent' | 'excused' }

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `register:${actor.userId}`, limit: 30, windowMs: 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many registers at once — wait a moment.');

  let body: { bookingId?: unknown; marks?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const bookingId = typeof body.bookingId === 'string' ? body.bookingId : '';
  const marks: Mark[] = (Array.isArray(body.marks) ? body.marks : [])
    .filter((m): m is Mark => !!m && typeof m === 'object' && typeof (m as Mark).studentId === 'string' && STATUSES.has((m as Mark).status))
    .slice(0, 40);
  if (!bookingId || marks.length === 0) return NextResponse.json({ ok: false, error: 'bad_request', message: 'Nothing to mark.' }, { status: 400 });

  const admin = createServiceClient();
  const { data: booking } = await admin.from('bookings').select('id, cohort_id, teacher_id, slot_start, status').eq('id', bookingId).maybeSingle();
  if (!booking) return NextResponse.json({ ok: false, error: 'booking_not_found' }, { status: 404 });
  if (!actor.isAdmin && booking.teacher_id !== actor.userId) {
    return NextResponse.json({ ok: false, error: 'forbidden', message: 'You can only mark the register for your own classes.' }, { status: 403 });
  }
  if (booking.status === 'cancelled') {
    return NextResponse.json({ ok: false, error: 'cancelled', message: 'This class was cancelled — there is no register to mark.' }, { status: 409 });
  }
  const unlocksAt = Date.parse(booking.slot_start as string) + UNLOCK_MINUTES * 60_000;
  if (Date.now() < unlocksAt) {
    const mins = Math.ceil((unlocksAt - Date.now()) / 60_000);
    return NextResponse.json({ ok: false, error: 'class_not_finished', message: `The register opens ${UNLOCK_MINUTES} minutes after the class starts — about ${mins} minute${mins === 1 ? '' : 's'} left.` }, { status: 409 });
  }

  // Only children in this class. Anyone else in the request is ignored, not an error.
  const { data: enrolled } = await admin.from('enrollments').select('user_id').eq('cohort_id', booking.cohort_id).neq('status', 'dropped');
  const inClass = new Set((enrolled ?? []).map((e) => e.user_id as string));
  const valid = marks.filter((m) => inClass.has(m.studentId));
  if (!valid.length) return NextResponse.json({ ok: false, error: 'no_students', message: 'None of those students are in this class.' }, { status: 400 });

  const now = new Date().toISOString();
  const { error: upErr } = await admin.from('session_attendance').upsert(
    valid.map((m) => ({ booking_id: booking.id, student_id: m.studentId, status: m.status, marked_by: actor.userId, marked_at: now })),
    { onConflict: 'booking_id,student_id' }
  );
  if (upErr) return NextResponse.json({ ok: false, error: 'save_failed', message: upErr.message }, { status: 500 });

  const results: { studentId: string; status: string; lessonMarked: boolean; lessonNumber?: number; reason?: string }[] = [];
  for (const m of valid) {
    if (m.status !== 'present' && m.status !== 'late') { results.push({ studentId: m.studentId, status: m.status, lessonMarked: false }); continue; }
    const r = await advanceLesson(admin, booking.id, booking.cohort_id as string, m.studentId);
    results.push({ studentId: m.studentId, status: m.status, lessonMarked: r.lessonMarked, lessonNumber: r.lessonNumber, reason: r.reason });
  }
  const attended = results.filter((r) => r.status === 'present' || r.status === 'late');
  return NextResponse.json({
    ok: true,
    saved: valid.length,
    lessonsAdvanced: attended.filter((r) => r.lessonMarked).length,
    lessonsNotAdvanced: attended.filter((r) => !r.lessonMarked).length,
    results,
  });
}
