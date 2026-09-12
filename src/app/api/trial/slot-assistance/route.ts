import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked, recordHoneypotTrip } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { isHoneypotTripped } from '@/lib/security/honeypot';
import { acceptPhone } from '@/lib/phone/accept';
import { smsConfigured } from '@/lib/phone/otp';
import { linkTrialToLead } from '@/lib/leads/link-trial';
import { isTrialSubject, subjectLabel } from '@/lib/trial/subjects';
import { MIN_GRADE, MAX_GRADE } from '@/lib/trial/grade-band';
import { gradeTag } from '@/lib/grade/tag';
import { isValidTimeZone, canonicalTimeZone } from '@/lib/time/timezones';
import { resolveTrialAccount, trialSignInLink, sendTrialWelcomeEmail } from '@/lib/trial/account';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — POST /api/trial/slot-assistance
 *
 * "All slots are filled — go ahead anyway, and a counsellor will arrange it."
 *
 * ── The family this exists for ──────────────────────────────────────────────
 * They wanted a class. They chose a course, gave a grade, proved a phone and
 * an email — everything a booking needs — and then there was no time: every
 * slot was taken, no teacher was free for that course yet, or none of the
 * offered times worked. Every course is now shown whether or not a teacher is
 * free for it (the founder's call), so this is a normal ending, not an edge.
 *
 * ── It ends the same way a booked class does ───────────────────────────────
 * The family gets an account, is signed straight into it, and is emailed
 * their request with the password for next time. Their class page says a
 * counsellor is arranging the time. The only thing missing is a slot, and
 * that is a seller's job now, not theirs.
 *
 * ── Why no booking is created ───────────────────────────────────────────────
 * A class nobody intends to teach would put a ghost in a teacher's calendar,
 * in every trial count, and fire a reminder the night before for a time that
 * was never agreed. So this writes the account and a LEAD: `stage =
 * seller_assigned`, `trial_status = slot_assistance`, on the desk of the
 * seller carrying the fewest leads this month (random between equals) — which
 * puts the family in that seller's Needs Slot Assistance queue.
 *
 * ── The same identity gate as booking ───────────────────────────────────────
 * Phone and email are verified against the DATABASE, never a flag in the
 * body, and only a proved identity is signed straight in — see
 * lib/trial/account.ts, which both routes share.
 */
export const runtime = 'nodejs';

interface Body {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  grade?: number;
  timezone?: string;
  country?: string;
  /** When would suit them, in their own words. Optional. */
  preference?: string;
  website?: string;
}

const bad = (error: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, error, message }, { status });

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `slot-assistance:${ip}`, limit: 8, windowMs: 10 * 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Try again shortly.');

  let body: Body;
  try { body = await req.json(); } catch { return bad('invalid_json', 'Something went wrong. Try again.'); }

  if (isHoneypotTripped(body as unknown as Record<string, unknown>)) {
    recordHoneypotTrip(ip);
    /* Answered as success. A bot that learns it was caught tries again with
       the field left empty. */
    return NextResponse.json({ ok: true });
  }

  const name = (body.name ?? '').trim();
  if (name.length < 2) return bad('missing_name', 'Please tell us the student’s name.');

  const subject = (body.subject ?? '').trim();
  if (!subject || !isTrialSubject(subject)) {
    return bad('missing_subject', 'Please choose what they would like to learn.');
  }

  const grade = Number(body.grade);
  if (!Number.isInteger(grade) || grade < MIN_GRADE || grade > MAX_GRADE) {
    return bad('missing_grade', 'Choose a grade: G1–G12, U or P.');
  }

  /* A number from anywhere. Only India can be sent a code, so only India has
     to have proved one — see lib/phone/accept.ts. */
  const accepted = acceptPhone(body.phone, body.country);
  if (!accepted.ok) return bad('bad_phone', accepted.problem);

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad('missing_email', 'Please give us an email address.');
  }

  const timezone = isValidTimeZone(body.timezone) ? canonicalTimeZone(body.timezone) : null;

  let admin;
  try { admin = createServiceClient(); } catch {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 });
  }

  /* ── Proved, in the database, not in the body ─────────────────────────────
     Only asked where a code can actually arrive: demanding verification of a
     number no SMS reaches is demanding the impossible. */
  const phoneCheckable = accepted.canVerify && smsConfigured();
  if (phoneCheckable) {
    let verified = false;
    try {
      const { data, error } = await admin.rpc('phone_is_verified', { p_phone: accepted.e164 });
      if (error) throw error;
      verified = data === true;
    } catch (err) {
      console.warn('[slot-assistance] phone_is_verified failed:', err instanceof Error ? err.message : err);
      return bad('verification_unavailable', 'We could not check your number just now. Try again shortly.', 503);
    }
    if (!verified) return bad('phone_not_verified', 'Please verify your mobile number first.');
  }

  /* Whether the address was PROVED here, not merely not disproved — an email
     that could not be checked is still booked against, but is not enough to
     sign anybody in with. */
  let emailProved = false;
  try {
    const { data, error } = await admin.rpc('email_is_verified', { p_email: email });
    if (error) {
      console.warn('[slot-assistance] email_is_verified unavailable:', error.message);
    } else if (data !== true) {
      return bad('email_not_verified', 'Please verify your email address first.');
    } else {
      emailProved = true;
    }
  } catch (err) {
    console.warn('[slot-assistance] email check threw:', err instanceof Error ? err.message : err);
  }

  /* ── The account ──────────────────────────────────────────────────────── */
  const account = await resolveTrialAccount(admin, {
    name,
    email,
    phone: accepted.e164,
    countryCode: accepted.countryCode,
    phoneProved: phoneCheckable,
    emailProved,
    grade,
    timezone,
  });
  if (!account.ok) return bad('account_failed', account.message, 500);

  /* ── The lead, and only the lead ─────────────────────────────────────────
     No booking, no seat — nothing a teacher's calendar or a conversion rate
     could mistake for a class. */
  const result = await linkTrialToLead(admin, {
    studentId: account.studentId,
    bookingId: null,
    name,
    email,
    phone: accepted.e164,
    grade,
    subject,
    source: 'self_book',
    timezone,
    country: accepted.countryCode,
    stage: 'seller_assigned',
    trialStatus: 'slot_assistance',
  });

  if (!result.leadId) {
    console.warn('[slot-assistance] lead write failed:', result.error);
    return NextResponse.json(
      { ok: false, error: 'not_recorded', message: 'We could not save that. Please ring us instead.' },
      { status: 500 }
    );
  }

  /* What they want, in the logbook rather than on the lead — the single notes
     column is replaced by the next write, and this is the one sentence the
     seller needs before ringing. */
  const preference = (body.preference ?? '').trim().slice(0, 1000);
  await bestEffort(
    'slot-assistance: note',
    admin.from('lead_notes').insert({
      lead_id: result.leadId,
      author_id: null,
      author_role: 'system',
      priority: 'high',
      category: 'slot_assistance',
      note: preference
        ? `Wants ${subjectLabel(subject)} (${gradeTag(grade)}). No offered time worked. In their words: “${preference}”`
        : `Wants ${subjectLabel(subject)} (${gradeTag(grade)}). All slots were filled — needs a time arranged by hand.`,
    })
  );

  await recordEvent(admin, {
    event: 'trial.slot_assistance',
    subjectType: 'lead',
    subjectId: result.leadId,
    payload: { subject, grade, timezone, hasPreference: Boolean(preference), newAccount: account.created },
  });

  /* Tell the seller now rather than at the next dashboard refresh. A family
     waiting for a call is the one queue where minutes matter. */
  if (result.sellerId) {
    await bestEffort(
      'slot-assistance: notify seller',
      admin.from('notifications').insert({
        user_id: result.sellerId,
        type: 'lead_slot_assistance',
        title: 'A family needs a time arranging',
        message: `${name} wants ${subjectLabel(subject)} (${gradeTag(grade)}). All slots were filled — ring them to arrange the class.`,
        link: `/dashboard/seller?lead=${result.leadId}`,
      })
    );
  }

  /* ── Straight into their account, and the email that brings them back ─── */
  const signInUrl = account.mayAutoSignIn && account.signInEmail
    ? await trialSignInLink(admin, account.signInEmail, new URL(req.url).origin)
    : null;

  const sent = await sendTrialWelcomeEmail({
    to: email,
    name,
    password: account.password,
    trial: null,
    grade,
    phone: accepted.e164,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin,
  });
  if (!sent.success) console.warn('[slot-assistance] welcome email not sent:', sent.error);

  return NextResponse.json({
    ok: true,
    leadId: result.leadId,
    assigned: Boolean(result.sellerId),
    signInUrl,
    existingAccount: !account.mayAutoSignIn,
    newAccount: account.created,
    message: 'Thank you — a Sariro counsellor will call you and arrange the class.',
  });
}
