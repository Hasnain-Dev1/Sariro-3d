import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';

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

const NO_SHOW_THRESHOLD_MIN = 10;
const NO_SHOW_PENALTY = 1000;

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
    .select('id, cohort_id, teacher_id, schedule_id, slot_start, slot_end, status, teacher_started_at')
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
  if (!related) {
    const { count } = await admin.from('enrollments').select('id', { count: 'exact', head: true })
      .eq('cohort_id', booking.cohort_id).eq('user_id', userId).eq('status', 'active');
    related = (count ?? 0) > 0;
  }
  if (!related) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  // Server-side condition — the real gate.
  const now = Date.now();
  const lateMs = now - new Date(booking.slot_start).getTime();
  if (booking.status !== 'scheduled' || booking.teacher_started_at || lateMs < NO_SHOW_THRESHOLD_MIN * 60_000) {
    return NextResponse.json({ ok: false, error: 'not_yet', message: 'No-show conditions not met.' }, { status: 409 });
  }

  // 1. Mark no_show (guarded so a race can only win once).
  const { data: updated, error: uErr } = await admin
    .from('bookings').update({ status: 'no_show' }).eq('id', bookingId).eq('status', 'scheduled').select('id');
  if (uErr) return NextResponse.json({ ok: false, error: 'update_failed', message: uErr.message }, { status: 500 });
  if (!updated || updated.length === 0) return NextResponse.json({ ok: true, already: true }); // lost the race → someone else finalised

  // 2. −₹1000 penalty earning (skip if one already exists for this booking).
  const { data: existing } = await admin.from('teacher_earnings').select('id').eq('booking_id', bookingId).maybeSingle();
  if (!existing) {
    const { data: cohort } = await admin.from('cohorts').select('ratio, track, level').eq('id', booking.cohort_id).maybeSingle();
    await admin.from('teacher_earnings').insert({
      teacher_id: booking.teacher_id, booking_id: bookingId, class_date: booking.slot_start,
      ratio: cohort?.ratio ?? null, track: cohort?.track ?? null, level: cohort?.level ?? null,
      student_count: 0, base_amount: 0, bonus_amount: 0,
      penalty_amount: NO_SHOW_PENALTY, penalty_reason: 'No-show / >10 min late',
      net_amount: -NO_SHOW_PENALTY, amount: -NO_SHOW_PENALTY, status: 'pending',
    });
  }

  // 3. Excuse enrolled students (no credit consumed).
  const { data: enrs } = await admin.from('enrollments').select('user_id').eq('cohort_id', booking.cohort_id).eq('status', 'active');
  for (const e of enrs ?? []) {
    await admin.from('session_attendance').upsert(
      { booking_id: bookingId, student_id: e.user_id, status: 'excused', marked_at: new Date().toISOString() },
      { onConflict: 'booking_id,student_id' }
    );
  }

  // 4. Append one make-up class at the end of the schedule (cascade forward).
  let appended = false;
  if (booking.schedule_id) {
    const { data: sched } = await admin.from('cohort_schedules').select('*').eq('id', booking.schedule_id).maybeSingle();
    if (sched && sched.status === 'active') {
      const { data: last } = await admin.from('bookings').select('slot_start')
        .eq('schedule_id', sched.id).in('status', ['scheduled', 'completed'])
        .order('slot_start', { ascending: false }).limit(1).maybeSingle();
      const after = last ? new Date(last.slot_start) : new Date(booking.slot_start);
      const slots = generateOccurrences({
        startDate: sched.start_date, daysOfWeek: sched.days_of_week, timeLocal: sched.time_local,
        durationMin: sched.duration_min, timezone: sched.timezone,
      }, 1, after);
      if (slots[0]) {
        await admin.from('bookings').insert({
          cohort_id: booking.cohort_id, teacher_id: booking.teacher_id, schedule_id: sched.id,
          slot_start: slots[0].slotStart, slot_end: slots[0].slotEnd, status: 'scheduled',
        });
        appended = true;
      }
    }
  }

  return NextResponse.json({ ok: true, finalized: true, makeup_appended: appended });
}
