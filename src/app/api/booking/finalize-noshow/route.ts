import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { finaliseNoShow, NO_SHOW_COLUMNS, type NoShowBooking } from '@/lib/classes/finalise-no-show';

/**
 * SARIRO — POST /api/booking/finalize-noshow  { bookingId }
 *
 * Finalises a teacher no-show. Can be called by the waiting student, the
 * teacher, or an admin — but the DECISION is made server-side: it only acts
 * when the booking is still 'scheduled', the teacher never started
 * (teacher_started_at is null), AND now is more than 10 minutes past
 * slot_start. The client cannot fake any of that.
 *
 * On finalise (idempotent — a second call is a no-op):
 *   1. booking.status → 'no_show'
 *   2. −₹1000 penalty earning for the teacher (pending)
 *   3. enrolled students marked 'excused' → no class credit consumed
 *   4. one make-up class appended to the end of the schedule (cascade: no
 *      lesson is skipped because no_show rows are excluded from lesson indexing)
 */
export const runtime = 'nodejs';

/* The rule, the penalty and every write live in lib/classes/finalise-no-show.ts,
   because the hourly sweep in /api/cron/finalise-no-shows has to reach exactly
   the same verdict as a person clicking here. */

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let userId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* 401 below */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const rl = rateLimit({ key: `finalize-noshow:${userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let bookingId: string | undefined;
  try { bookingId = (await req.json())?.bookingId; } catch { /* handled */ }
  if (!bookingId) return NextResponse.json({ ok: false, error: 'missing_booking' }, { status: 400 });

  const admin = createServiceClient();

  const { data: booking } = await admin
    .from('bookings')
    .select(NO_SHOW_COLUMNS)
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  // Idempotent: already finalised.
  if (booking.status === 'no_show') return NextResponse.json({ ok: true, already: true });

  // Relatedness: caller must be the teacher, an enrolled student, or an admin.
  let related = booking.teacher_id === userId;
  if (!related) {
    const { data: prof } = await admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', userId).single();
    related = prof?.role === 'admin' || prof?.role === 'super_admin' || prof?.is_admin === true || prof?.is_super_admin === true;
  }
  if (!related && booking.cohort_id) {
    const { count } = await admin.from('enrollments').select('id', { count: 'exact', head: true })
      .eq('cohort_id', booking.cohort_id).eq('user_id', userId).eq('status', 'active');
    related = (count ?? 0) > 0;
  }
  /* A trial student is not in enrolments — they are in trial_participants, and
     a trial has no cohort at all. So this check used to compare against
     cohort_id = NULL, match nothing, and refuse the one person actually sitting
     in the empty room. A teacher could miss a trial entirely and no no-show was
     ever recorded, which is the class where it matters most: it is the half
     hour a family uses to decide whether to buy anything. */
  if (!related) {
    if (booking.trial_student_id === userId) {
      related = true;
    } else {
      const { count } = await admin.from('trial_participants')
        .select('id', { count: 'exact', head: true })
        .eq('booking_id', bookingId).eq('student_id', userId);
      related = (count ?? 0) > 0;
    }
  }
  if (!related) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  /* The verdict, and every write that follows it, belong to the library —
     see lib/classes/finalise-no-show.ts. This route's own job is finished: it
     worked out that the caller is allowed to ask. */
  const outcome = await finaliseNoShow(admin, booking as unknown as NoShowBooking);

  if (!outcome.ok) {
    const status = outcome.reason === 'not_yet' ? 409 : 500;
    return NextResponse.json({ ok: false, error: outcome.reason, message: outcome.message }, { status });
  }
  if (outcome.already) return NextResponse.json({ ok: true, already: true });

  return NextResponse.json({ ok: true, finalized: true, makeup_appended: outcome.makeupAppended });
}
