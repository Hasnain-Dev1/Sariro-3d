import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked, recordHoneypotTrip } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { isHoneypotTripped } from '@/lib/security/honeypot';
import { acceptPhone } from '@/lib/phone/accept';
import { linkTrialToLead } from '@/lib/leads/link-trial';
import { isTrialSubject, subjectLabel } from '@/lib/trial/subjects';
import { MIN_GRADE, MAX_GRADE } from '@/lib/trial/grade-band';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — POST /api/trial/slot-assistance
 *
 * "None of these times work for me."
 *
 * ── The family this exists for ──────────────────────────────────────────────
 * They wanted a class. They picked a subject, gave a grade, proved a phone
 * number and an email — everything a booking needs — and then found that the
 * only times on offer were during school, or at 2am where they live.
 *
 * Until now that family simply left. The form's only exit was a slot, so the
 * most motivated visitor on the page, the one who got all the way to the last
 * step, produced nothing at all: no lead, no record, nobody to ring.
 *
 * ── Why no booking is created ───────────────────────────────────────────────
 * The obvious shortcut is to book them into something and let a seller move
 * it. That would be worse than losing them:
 *
 *   · a teacher's calendar gains a class nobody intends to teach
 *   · the trial counts, and therefore every conversion rate, include a class
 *     that will not happen
 *   · a reminder fires at them the night before for a time they already said
 *     does not work
 *
 * So this writes a LEAD and no booking. `stage = seller_assigned` because a
 * person now has to arrange it; `trial_status = slot_assistance` because that
 * is where the class stands — which is not the same question as the stage, and
 * is what puts them in the seller's Needs Slot Assistance queue.
 *
 * ── The same identity gate as booking ───────────────────────────────────────
 * A phone and an email both verified against the DATABASE, not against a flag
 * in the request body. This endpoint writes a contactable record with a
 * person's name on it; an unverified one is a way to put somebody else's
 * number on somebody else's desk.
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
  /** What they would prefer, in their own words. The most useful field here. */
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
    return bad('missing_grade', `Please choose a grade between ${MIN_GRADE} and ${MAX_GRADE}.`);
  }

  /* A number from anywhere. Only India can be sent a code, so only India has
     to have proved one — see lib/phone/accept.ts. */
  const accepted = acceptPhone(body.phone, body.country);
  if (!accepted.ok) return bad('bad_phone', accepted.problem);

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad('missing_email', 'Please give us an email address.');
  }

  let admin;
  try { admin = createServiceClient(); } catch {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 });
  }

  /* ── Proved, in the database, not in the body ─────────────────────────────
     A flag in a POST body has verified nothing. Only asked where a code can
     actually arrive: demanding verification of a number no SMS reaches is
     demanding the impossible, and the family simply leaves. */
  if (accepted.canVerify) {
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

  try {
    const { data, error } = await admin.rpc('email_is_verified', { p_email: email });
    if (error) {
      console.warn('[slot-assistance] email_is_verified unavailable:', error.message);
    } else if (data !== true) {
      return bad('email_not_verified', 'Please verify your email address first.');
    }
  } catch (err) {
    console.warn('[slot-assistance] email check threw:', err instanceof Error ? err.message : err);
  }

  /* ── The lead, and only the lead ─────────────────────────────────────────
     No booking. No trial seat. Nothing that would make a teacher's calendar or
     a conversion rate believe a class exists. */
  const result = await linkTrialToLead(admin, {
    studentId: null,
    bookingId: null,
    name,
    email,
    phone: accepted.e164,
    grade,
    subject,
    source: 'self_book',
    timezone: (body.timezone ?? '').trim() || null,
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

  /* What they actually want, in their own words. Goes into the logbook rather
     than onto the lead, because `student_leads.notes` is a single column that
     the next write replaces — and this is the one sentence the seller needs
     before ringing. */
  const preference = (body.preference ?? '').trim().slice(0, 1000);
  if (preference) {
    await bestEffort(
      'slot-assistance: preference note',
      admin.from('lead_notes').insert({
        lead_id: result.leadId,
        author_id: null,
        author_role: 'system',
        priority: 'high',
        category: 'slot_assistance',
        note: `No offered time worked. In their words: “${preference}”`,
      })
    );
  } else {
    await bestEffort(
      'slot-assistance: note',
      admin.from('lead_notes').insert({
        lead_id: result.leadId,
        author_id: null,
        author_role: 'system',
        priority: 'high',
        category: 'slot_assistance',
        note: `Asked for ${subjectLabel(subject)}, grade ${grade}. None of the offered times worked — needs a time arranged by hand.`,
      })
    );
  }

  await recordEvent(admin, {
    event: 'trial.slot_assistance',
    subjectType: 'lead',
    subjectId: result.leadId,
    payload: { subject, grade, timezone: body.timezone ?? null, hasPreference: Boolean(preference) },
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
        message: `${name} wants ${subjectLabel(subject)} (grade ${grade}) but none of the offered slots worked.`,
        link: '/dashboard/seller',
      })
    );
  }

  return NextResponse.json({
    ok: true,
    leadId: result.leadId,
    assigned: Boolean(result.sellerId),
    message: 'Thank you — we will ring you and find a time that works.',
  });
}
