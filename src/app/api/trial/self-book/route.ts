import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked, recordHoneypotTrip } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { isHoneypotTripped } from '@/lib/security/honeypot';
import { normalizeIndianMobile } from '@/lib/phone/india';
import { smsConfigured } from '@/lib/phone/otp';
import { localWeekdayMinutes, slotIsFree } from '@/lib/scheduling/availability';
import { slotState, blockingIntervals, canSeat, TRIAL_MINUTES, type SlotBooking } from '@/lib/scheduling/trial-capacity';
import { TRIAL_HOME } from '@/lib/dashboard/trial-only';
import { bandOf, fits, MIN_GRADE, MAX_GRADE, type GradeBand } from '@/lib/trial/grade-band';

/**
 * SARIRO — POST /api/trial/self-book
 *
 * A parent books their own free class, from an advert, with no seller in the
 * loop. The counterpart of /api/trial/book, which is staff-only.
 *
 * ── A name and a number, and nothing else ───────────────────────────────────
 * Five fields for a free class is four too many on an advert. Everything else
 * — the email, what they want to learn, how many children — is collected
 * afterwards or by the human who rings them. An account with no email is a
 * phone-only account, which Supabase supports natively and which is the truer
 * identity anyway: the phone is the one they proved.
 *
 * ── The identity rules, which are the whole risk here ───────────────────────
 * This endpoint creates accounts and hands back a sign-in link. Get that wrong
 * and it is an account-takeover machine: type somebody else's email, receive a
 * session for their account.
 *
 * So the ONLY thing that proves who somebody is here is the phone, because the
 * phone is the only thing they had to prove with a code:
 *
 *   · phone matches an existing profile  -> use it, and sign them in. They
 *     proved that number, and it is the number the account is reachable on.
 *   · email matches an existing profile  -> book against it, but NO link.
 *     They did not prove the email. They sign in normally to see the class.
 *   · neither                            -> create the account, sign them in.
 *
 * An unverifiable number never reaches this: it is checked against the
 * database, not read from the request body, for the same reason the demo-class
 * route does it — a flag in a POST body has verified nothing.
 *
 * ── Everything else is the same boundary as the staff route ─────────────────
 * The teacher must have offered the slot, must still be free in it, must have
 * a room, and the class must have seats. The picker is a courtesy; a stale tab
 * and two parents booking the last seat at once both arrive here.
 */
export const runtime = 'nodejs';

interface Body {
  /** One name. Whoever is filling the form decides whose it is. */
  name?: string;
  /** Optional, and asked for AFTER the booking rather than before it. */
  email?: string;
  /** 1-12. Required: a class cannot be banded without it. */
  grade?: number;
  phone?: string;
  teacherId?: string;
  slotStart?: string;
  /** 1–4. A family booking siblings into one class. */
  children?: number;
  timezone?: string;
  /** What they want to learn. Free text; stored on the lead, not enforced. */
  interest?: string;
}

const bad = (error: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, error, message }, { status });

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  /* Tight on purpose. Every success here commits half an hour of a real
     teacher's evening, so this is not a form that should be postable in bulk. */
  const rl = rateLimit({ key: `self-book:${ip}`, limit: 5, windowMs: 10 * 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'That is a lot of bookings. Try again shortly.');

  let body: Body;
  try { body = await req.json(); } catch {
    return bad('invalid_json', 'Something went wrong sending that. Please try again.');
  }

  // A bot filling every field it can see. Answered with a plausible success so
  // it does not learn what caught it.
  if (isHoneypotTripped(body as unknown as Record<string, unknown>)) {
    recordHoneypotTrip(ip);
    return NextResponse.json({ ok: true, booked: true });
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const children = Math.max(1, Math.min(4, Math.round(body.children ?? 1)));

  if (name.length < 2) return bad('missing_name', 'We need a name so the teacher knows who to expect.');

  /* Refused rather than defaulted. Seating a child whose level nobody recorded
     is exactly how the grade 1 and the grade 10 end up in the same room. */
  const grade = Math.round(Number(body.grade));
  if (!Number.isFinite(grade) || grade < MIN_GRADE || grade > MAX_GRADE) {
    return bad('missing_grade', 'Please choose which grade they are in.');
  }
  // Email is optional on purpose — see the note above about the form. When it
  // IS given it still has to be an email.
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('bad_email', 'That email does not look right.');
  if (!body.teacherId || !body.slotStart) return bad('missing_slot', 'Choose a time for the class.');

  const startMs = Date.parse(body.slotStart);
  if (!Number.isFinite(startMs)) return bad('bad_slot', 'That time is not valid.');
  if (startMs < Date.now()) return bad('slot_in_past', 'That time has already passed. Pick another.', 409);

  // ── The phone, and the fact that it was proved ────────────────────────────
  const parsed = normalizeIndianMobile(body.phone ?? '');
  if (!parsed.ok) {
    return bad('bad_phone', 'We need an Indian mobile number we can reach you on.');
  }
  const phone = parsed.e164;

  const admin = createServiceClient();

  if (smsConfigured()) {
    let verified = false;
    try {
      const { data, error } = await admin.rpc('phone_is_verified', { p_phone: phone });
      if (error) throw error;
      verified = data === true;
    } catch (err) {
      // A verification system that is down must not quietly start letting
      // everything through — that is the failure nobody notices.
      console.warn('[self-book] phone_is_verified failed:', err instanceof Error ? err.message : err);
      return bad('verification_unavailable', 'We could not check your number just now. Please try again in a moment.', 503);
    }
    if (!verified) return bad('phone_not_verified', 'Please verify your mobile number first.');
  }

  // ── The teacher, and whether they can take this ───────────────────────────
  const { data: teacher } = await admin
    .from('profiles')
    .select('id, full_name, timezone, meet_url')
    .eq('id', body.teacherId)
    .maybeSingle();
  if (!teacher || !teacher.timezone || !teacher.meet_url) {
    return bad('slot_gone', 'That time is no longer available. Please pick another.', 409);
  }

  const local = localWeekdayMinutes(body.slotStart, teacher.timezone);
  if (!local) return bad('slot_gone', 'That time is no longer available. Please pick another.', 409);

  const { data: windows } = await admin
    .from('teacher_availability')
    .select('start_minute, end_minute')
    .eq('teacher_id', teacher.id)
    .eq('weekday', local.weekday);
  if (!windows || windows.length === 0) {
    return bad('slot_gone', 'That time is no longer available. Please pick another.', 409);
  }

  const dayPad = 36 * 60 * 60_000;
  const { data: existingRows } = await admin
    .from('bookings')
    .select('id, slot_start, slot_end, is_trial')
    .eq('teacher_id', teacher.id)
    .gte('slot_start', new Date(startMs - dayPad).toISOString())
    .lte('slot_start', new Date(startMs + dayPad).toISOString())
    .not('status', 'in', '("cancelled","no_show")');

  const rows = (existingRows ?? []) as {
    id: string; slot_start: string; slot_end: string; is_trial: boolean | null;
  }[];

  const seatsBy = new Map<string, number>();
  const trialIds = rows.filter((r) => r.is_trial).map((r) => r.id);
  if (trialIds.length > 0) {
    const { data: parts } = await admin
      .from('trial_participants').select('booking_id').in('booking_id', trialIds);
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
    seatsTaken: r.is_trial ? Math.max(1, seatsBy.get(r.id) ?? 0) : undefined,
  }));

  const here = slotState(body.slotStart, asSlots);
  const seat = canSeat(here, children);
  if (!seat.ok) return bad('slot_full', seat.message, 409);

  /* ── The grade band ───────────────────────────────────────────────────────
     A trial holds four children and, until this, any four — a grade 1 could be
     seated with a grade 10. The first child to book a slot fixes it at their
     grade plus or minus one; see lib/trial/grade-band.ts. Checked here as well
     as in the picker because the picker is a courtesy and this is the
     boundary. */
  let band: GradeBand | null = null;
  if (here.joinBookingId) {
    const { data: seated } = await admin
      .from('trial_participants')
      .select('grade, created_at')
      .eq('booking_id', here.joinBookingId)
      .order('created_at', { ascending: true });
    band = bandOf((seated ?? []).map((r) => (r.grade as number | null) ?? null));
  }
  const fit = fits(grade, band);
  if (!fit.ok) return bad('grade_mismatch', fit.message, 409);


  const busy: { start: number; end: number }[] = [];
  for (const b of blockingIntervals(asSlots)) {
    const s = localWeekdayMinutes(b.slotStart, teacher.timezone);
    if (!s || s.weekday !== local.weekday) continue;
    const len = Math.max(1, Math.round((Date.parse(b.slotEnd) - Date.parse(b.slotStart)) / 60_000));
    busy.push({ start: s.minutes, end: s.minutes + len });
  }
  const free = slotIsFree({
    windows: windows.map((w) => ({ start: w.start_minute as number, end: w.end_minute as number })),
    busy,
    slotMinutes: TRIAL_MINUTES,
    start: local.minutes,
  });
  if (!free) return bad('slot_gone', 'Somebody just took that time. Please pick another.', 409);

  // ── Who is this? See the identity rules at the top. ───────────────────────
  const byPhone = await admin
    .from('profiles').select('id, email').eq('phone', phone).limit(1).maybeSingle();
  const byEmail = byPhone.data || !email
    ? { data: null }
    : await admin.from('profiles').select('id').eq('email', email).limit(1).maybeSingle();

  let studentId: string;
  /* Only ever true when the PHONE proved them — the one thing they had to
     demonstrate with a code they received. An email typed into a form proves
     nothing, and handing back a session for it would be a takeover. */
  let mayAutoSignIn = false;

  if (byPhone.data) {
    studentId = byPhone.data.id as string;
    mayAutoSignIn = true;
  } else if (byEmail.data) {
    studentId = (byEmail.data as { id: string }).id;
    mayAutoSignIn = false;
  } else {
    /* A phone-only account when no email was given.
       ──────────────────────────────────────────────────────────────────────
       The form asks for a name and a number and nothing else, so most people
       arriving here have no email on file. Supabase takes a phone as the
       identity on its own, and the phone is the better identity anyway: it is
       the one they proved, and the one anybody would use to chase a child who
       does not appear. */
    const { data: created, error: createErr } = await admin.auth.admin.createUser(
      email
        ? { email, email_confirm: true, phone, phone_confirm: true, user_metadata: { full_name: name } }
        : { phone, phone_confirm: true, user_metadata: { full_name: name } }
    );
    if (createErr || !created?.user) {
      console.warn('[self-book] createUser failed:', createErr?.message);
      return bad('account_failed', 'We could not set up your account. Please try again.', 500);
    }
    studentId = created.user.id;
    mayAutoSignIn = true;

    /* The profile row. A trigger may have made one already, so this is an
       upsert — and the phone matters more than the name: it is the only way
       anybody can chase a child who does not appear. */
    await admin.from('profiles').upsert({
      id: studentId,
      email: email || null,
      full_name: name,
      phone,
      phone_verified: true,
      role: 'student',
      is_student: true,
      grade,
      timezone: body.timezone || null,
    }, { onConflict: 'id' });
  }

  // ── Book it ───────────────────────────────────────────────────────────────
  const endIso = new Date(startMs + TRIAL_MINUTES * 60_000).toISOString();
  let bookingId = here.joinBookingId;

  if (bookingId) {
    // Joining the class that is already there rather than opening a second one
    // at the same time — see /api/trial/book for why that matters.
    const { error } = await admin.from('trial_participants')
      .insert({ booking_id: bookingId, student_id: studentId, added_by: studentId, grade });
    if (error) {
      console.warn('[self-book] join failed:', error.message);
      return bad('book_failed', 'We could not complete that booking. Please try again.', 500);
    }
  } else {
    const { data: booking, error } = await admin.from('bookings').insert({
      teacher_id: teacher.id,
      trial_student_id: studentId,
      booked_by: studentId,
      is_trial: true,
      cohort_id: null,
      slot_start: body.slotStart,
      slot_end: endIso,
      status: 'scheduled',
      google_meet_url: teacher.meet_url,
      lesson_name: 'Trial class',
    }).select('id').single();
    if (error || !booking) {
      console.warn('[self-book] insert failed:', error?.message);
      return bad('book_failed', 'We could not complete that booking. Please try again.', 500);
    }
    bookingId = booking.id;
    await admin.from('trial_participants')
      .insert({ booking_id: bookingId, student_id: studentId, added_by: studentId, grade })
      .then(() => {}, () => {});
  }

  /* A lead, so a human knows this happened and can follow it up. Best-effort:
     the class is booked either way, and a failure here must not lose it. */
  await admin.from('student_leads').insert({
    student_name: name,
    parent_name: name,
    email: email || null,
    phone: phone.replace(/^\+91/, ''),
    phone_country_code: 'IN',
    lead_type: 'student',
    area_of_interest: (body.interest ?? '').slice(0, 60) || null,
    stage: 'trial_booked',
    timezone: body.timezone || null,
  }).then(() => {}, () => {});

  await admin.from('notifications').insert({
    user_id: studentId,
    type: 'trial_booked',
    title: 'Your free class is booked',
    message: `You have a trial class with ${teacher.full_name ?? 'a Sariro mentor'}.`,
    link: TRIAL_HOME,
  }).then(() => {}, () => {});

  /* Straight into their class page, no email round trip — the funnel is an
     advert and every extra step loses people. Only ever when the phone proved
     them; otherwise they are told to sign in, which is the safe answer. */
  let signInUrl: string | null = null;
  if (mayAutoSignIn && email) {
    try {
      const origin = new URL(req.url).origin;
      const { data: link } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(TRIAL_HOME)}` },
      });
      signInUrl = link?.properties?.action_link ?? null;
    } catch (err) {
      // They can still sign in the normal way; the class exists regardless.
      console.warn('[self-book] generateLink failed:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({
    ok: true,
    bookingId,
    slotStart: body.slotStart,
    slotEnd: endIso,
    teacherName: teacher.full_name ?? null,
    joined: here.joinBookingId !== null,
    signInUrl,
    existingAccount: !mayAutoSignIn,
  });
}
