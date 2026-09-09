import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { recordAdminAction } from '@/lib/audit/log';
import { canAssignCourse } from '@/lib/contact/reachability';
import { localWeekdayMinutes, slotIsFree } from '@/lib/scheduling/availability';
import {
  slotState, blockingIntervals, canSeat, type SlotBooking,
} from '@/lib/scheduling/trial-capacity';

/**
 * SARIRO — POST /api/trial/book
 *
 * Books a free trial class for one student with one teacher.
 *
 * ── Why a trial is a booking ────────────────────────────────────────────────
 * bookings.cohort_id is nullable, so a trial is a booking with no cohort and
 * is_trial = true. It then inherits the teacher's calendar, the attendance
 * flow, the lateness rules and the earnings trigger — none of which had to be
 * rebuilt, and none of which can now drift out of step with a parallel table.
 *
 * ── Three gates, all asked of the database ──────────────────────────────────
 *   1. the booker is staff
 *   2. the student can be contacted          (lib/contact/reachability.ts)
 *   3. the teacher has actually offered that slot, and is not already busy
 *
 * The second is the founder's rule, and it is the same one that stops a course
 * being assigned to an account with no phone: a trial costs a teacher half an
 * hour, and an account nobody can ring is an account nobody can chase when the
 * child does not appear.
 *
 * The third is asked here rather than trusted from the picker, because the
 * picker is a courtesy and this is the boundary. A stale tab, two sellers
 * booking at once, or a POST typed by hand all arrive here.
 */
export const runtime = 'nodejs';

interface Body {
  /** The first child. Kept for callers that book one. */
  studentId?: string;
  /** Every child in the class, when there is more than one. */
  studentIds?: string[];
  teacherId?: string;
  /** ISO instant. */
  slotStart?: string;
  durationMinutes?: number;
  track?: string;
  level?: string;
  demoRequestId?: string;
  meetUrl?: string;
}

/* Thirty minutes, not sixty. A trial is a taster — half an hour is enough to
   show a parent what a class is like, and it doubles how many a teacher can
   run in an evening. Kept as a constant here because the picker's own default
   (TRIAL_MINUTES in lib/dashboard/trial-booking-data.ts) must agree with it. */
const DEFAULT_DURATION = 30;

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let actorId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    actorId = user?.id ?? null;
  } catch { /* 401 below */ }
  if (!actorId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const admin = createServiceClient();

  // ── 1. Staff only ─────────────────────────────────────────────────────────
  const { data: actor } = await admin
    .from('profiles')
    .select('role, is_admin, is_super_admin, is_hr, is_seller')
    .eq('id', actorId)
    .single();
  const mayBook =
    ['admin', 'super_admin', 'hr', 'seller'].includes(actor?.role ?? '') ||
    actor?.is_admin === true || actor?.is_super_admin === true ||
    actor?.is_hr === true || actor?.is_seller === true;
  if (!mayBook) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `trial-book:${actorId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many bookings at once.');

  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  /* One child or several. A trial with three children is ONE class — one slot
     in the diary, one attendance, one fee — so they arrive together rather
     than as three bookings. */
  const studentIds = [...new Set(
    (body.studentIds && body.studentIds.length ? body.studentIds : [body.studentId])
      .filter((v): v is string => !!v)
  )];
  if (studentIds.length === 0 || !body.teacherId || !body.slotStart) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }
  if (studentIds.length > 4) {
    // The same cap as a paid class. A trial is a sample of the real thing, and
    // five children in it is not a sample of a class capped at four.
    return NextResponse.json(
      { ok: false, error: 'too_many', message: 'A trial holds at most four children.' },
      { status: 400 }
    );
  }

  const startMs = Date.parse(body.slotStart);
  if (!Number.isFinite(startMs)) {
    return NextResponse.json({ ok: false, error: 'bad_slot' }, { status: 400 });
  }
  if (startMs < Date.now()) {
    return NextResponse.json(
      { ok: false, error: 'slot_in_past', message: 'That time has already passed.' },
      { status: 409 }
    );
  }
  const duration = Math.max(15, Math.min(180, Math.round(body.durationMinutes ?? DEFAULT_DURATION)));
  const endIso = new Date(startMs + duration * 60_000).toISOString();

  // ── 2. Can we contact EVERY child in the class? ───────────────────────────
  const { data: students } = await admin
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', studentIds);
  if (!students || students.length !== studentIds.length) {
    return NextResponse.json({ ok: false, error: 'no_such_student' }, { status: 404 });
  }

  /* Every one of them, not just the first. One unreachable family in a class
     of three is still a seat held and a teacher's hour committed with nobody
     to ring about it. */
  for (const st of students) {
    const contact = canAssignCourse(st);
    if (!contact.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'no_phone',
          message: `${contact.message} A trial costs a teacher half an hour — we need to be able to reach them.`,
        },
        { status: 409 }
      );
    }
  }

  // ── 3. Has the teacher offered this slot, and are they free in it? ────────
  const { data: teacher } = await admin
    .from('profiles')
    .select('id, full_name, timezone, meet_url')
    .eq('id', body.teacherId)
    .maybeSingle();
  if (!teacher) return NextResponse.json({ ok: false, error: 'no_such_teacher' }, { status: 404 });
  /* No room, no booking. A trial has no cohort to inherit a link from, so a
     teacher without one takes the booking, the parent gets a confirmation,
     and on the day there is no button to press. Refusing here is the only
     point at which that is still recoverable. */
  if (!teacher.meet_url) {
    return NextResponse.json(
      {
        ok: false,
        error: 'teacher_no_room',
        message: `${teacher.full_name ?? 'That teacher'} has not set their class room link, so a child booked with them would have no way to join. Ask them to add it in Settings.`,
      },
      { status: 409 }
    );
  }
  if (!teacher.timezone) {
    return NextResponse.json(
      {
        ok: false,
        error: 'teacher_no_timezone',
        message: `${teacher.full_name ?? 'That teacher'} has not set their timezone, so we cannot tell what their 5pm means. Ask them to set it in Settings.`,
      },
      { status: 409 }
    );
  }

  const local = localWeekdayMinutes(body.slotStart, teacher.timezone);
  if (!local) {
    return NextResponse.json({ ok: false, error: 'bad_timezone' }, { status: 409 });
  }

  const { data: windows } = await admin
    .from('teacher_availability')
    .select('start_minute, end_minute')
    .eq('teacher_id', body.teacherId)
    .eq('weekday', local.weekday);

  if (!windows || windows.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'not_available',
        message: `${teacher.full_name ?? 'That teacher'} has not offered any hours on that day.`,
      },
      { status: 409 }
    );
  }

  /* What they already have that day, in their own local minutes. Fetched as a
     generous window around the slot and then converted, rather than trying to
     express "that teacher's Tuesday" as a UTC range — which is a different
     range depending on the month. */
  const dayPad = 36 * 60 * 60_000;
  const { data: existingRows } = await admin
    .from('bookings')
    .select('id, slot_start, slot_end, status, is_trial')
    .eq('teacher_id', body.teacherId)
    .gte('slot_start', new Date(startMs - dayPad).toISOString())
    .lte('slot_start', new Date(startMs + dayPad).toISOString())
    .not('status', 'in', '("cancelled","no_show")');

  const rows = (existingRows ?? []) as {
    id: string; slot_start: string; slot_end: string; status: string; is_trial: boolean | null;
  }[];

  /* Who is already sitting in each trial. A trial holds four children, so a
     slot with one in it is not busy — it is a class with three seats left,
     and treating it as busy is how those three were never sold. */
  const seatsBy = new Map<string, number>();
  const trialIds = rows.filter((r) => r.is_trial).map((r) => r.id);
  if (trialIds.length > 0) {
    const { data: parts } = await admin
      .from('trial_participants')
      .select('booking_id')
      .in('booking_id', trialIds);
    for (const p of parts ?? []) {
      const k = p.booking_id as string;
      seatsBy.set(k, (seatsBy.get(k) ?? 0) + 1);
    }
  }

  const asSlots: SlotBooking[] = rows.map((r) => ({
    bookingId: r.id,
    slotStart: r.slot_start,
    slotEnd: r.slot_end,
    isTrial: !!r.is_trial,
    // A pre-participants trial row still holds one child on trial_student_id.
    seatsTaken: r.is_trial ? Math.max(1, seatsBy.get(r.id) ?? 0) : undefined,
  }));

  /* Is there room in this exact slot, and is there a class to join? Asked
     before the availability check so a full slot says "full" rather than the
     less useful "outside their hours". */
  const here = slotState(body.slotStart, asSlots);
  const seat = canSeat(here, studentIds.length);
  if (!seat.ok) {
    return NextResponse.json(
      { ok: false, error: 'slot_full', message: seat.message, taken: here.taken, capacity: here.capacity },
      { status: 409 }
    );
  }

  const busy: { start: number; end: number }[] = [];
  for (const b of blockingIntervals(asSlots)) {
    const s = localWeekdayMinutes(b.slotStart, teacher.timezone);
    if (!s || s.weekday !== local.weekday) continue;
    const endMs = Date.parse(b.slotEnd);
    const startMs2 = Date.parse(b.slotStart);
    const len = Number.isFinite(endMs) && Number.isFinite(startMs2)
      ? Math.max(1, Math.round((endMs - startMs2) / 60_000))
      : DEFAULT_DURATION;
    busy.push({ start: s.minutes, end: s.minutes + len });
  }

  const free = slotIsFree({
    windows: windows.map((w) => ({ start: w.start_minute as number, end: w.end_minute as number })),
    busy,
    slotMinutes: duration,
    start: local.minutes,
  });
  if (!free) {
    return NextResponse.json(
      {
        ok: false,
        error: 'slot_taken',
        message: 'That slot is outside their hours or already booked. Pick another.',
      },
      { status: 409 }
    );
  }

  // ── 4. Book it ────────────────────────────────────────────────────────────
  /* Joining, when there is already a trial at this exact time with room.
     Two bookings at the same time with the same teacher is not two classes —
     it is one class recorded twice, and the calendar, the attendance sheet
     and the pay calculation then all disagree with what actually happened.
     So the children are added to the class that is already there. */
  if (here.joinBookingId) {
    const joinId = here.joinBookingId;
    const { error: joinErr } = await admin.from('trial_participants').insert(
      studentIds.map((id) => ({ booking_id: joinId, student_id: id, added_by: actorId }))
    );
    if (joinErr) {
      return NextResponse.json(
        { ok: false, error: 'join_failed', message: joinErr.message },
        { status: 500 }
      );
    }

    await admin.from('notifications').insert(
      studentIds.map((id) => ({
        user_id: id,
        type: 'trial_booked',
        title: 'Your free class is booked',
        message: `You have a trial class with ${teacher.full_name ?? 'a Sariro mentor'}. Check your dashboard for the time and the link.`,
        link: '/dashboard/student',
      }))
    ).then(() => {}, () => {});

    await recordAdminAction(admin, {
      adminId: actorId,
      action: 'trial_joined',
      targetType: 'user',
      targetId: studentIds[0],
      metadata: {
        booking_id: joinId,
        student_ids: studentIds,
        teacher_id: body.teacherId,
        slot_start: body.slotStart,
        seats_before: here.taken,
        seats_after: here.taken + studentIds.length,
      },
    });

    return NextResponse.json({
      ok: true,
      booking_id: joinId,
      joined: true,
      taken: here.taken + studentIds.length,
      capacity: here.capacity,
    });
  }

  const { data: booking, error: insErr } = await admin
    .from('bookings')
    .insert({
      teacher_id: body.teacherId,
      // The first child, so everything that already reads this column keeps
      // working. trial_participants below is the full roster.
      trial_student_id: studentIds[0],
      demo_request_id: body.demoRequestId ?? null,
      booked_by: actorId,
      is_trial: true,
      cohort_id: null,
      slot_start: body.slotStart,
      slot_end: endIso,
      status: 'scheduled',
      /* A trial has no cohort, so nothing here inherits a link. Without the
         teacher's own room this column stayed NULL and the child's dashboard
         reached the join moment with nothing to join — which is how every
         trial booked before today ended up with no door. */
      google_meet_url: body.meetUrl ?? teacher.meet_url ?? null,
      lesson_name: 'Trial class',
    })
    .select('id')
    .single();

  if (insErr) {
    return NextResponse.json(
      { ok: false, error: 'book_failed', message: insErr.message },
      { status: 500 }
    );
  }

  /* The full roster. Written after the booking so a failure here leaves a
     one-child trial rather than an orphaned participants row — and the
     feedback route falls back to trial_student_id, so that trial still works
     end to end. */
  try {
    await admin.from('trial_participants').insert(
      studentIds.map((id) => ({ booking_id: booking?.id, student_id: id, added_by: actorId }))
    );
  } catch (err) {
    console.warn('[trial] participants insert failed:', err);
  }

  // Best-effort: tell each of them it exists.
  await admin.from('notifications').insert(
    studentIds.map((id) => ({
      user_id: id,
      type: 'trial_booked',
      title: 'Your free class is booked',
      message: `You have a trial class with ${teacher.full_name ?? 'a Sariro mentor'}. Check your dashboard for the time and the link.`,
      link: '/dashboard/student',
    }))
  ).then(() => {}, () => {});

  await recordAdminAction(admin, {
    adminId: actorId,
    action: 'trial_booked',
    targetType: 'user',
    targetId: studentIds[0],
    metadata: {
      booking_id: booking?.id ?? null,
      student_ids: studentIds,
      teacher_id: body.teacherId,
      slot_start: body.slotStart,
      duration_minutes: duration,
      demo_request_id: body.demoRequestId ?? null,
      track: body.track ?? null,
      level: body.level ?? null,
    },
  });

  return NextResponse.json({ ok: true, booking_id: booking?.id, slot_end: endIso });
}
