import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { normalizeIndianMobile } from '@/lib/phone/india';
import { recordAdminAction } from '@/lib/audit/log';

/**
 * SARIRO — POST /api/admin/demo-class
 *
 * A trial booking entered by staff rather than by the parent.
 *
 * ── Why this is not the public route with a flag ────────────────────────────
 * The public route requires a verified Indian mobile, and it should: a free
 * class costs a mentor half an hour and anyone can type ten digits into a form
 * on the internet.
 *
 * A referral is the opposite situation. Somebody rang the office, or a parent
 * passed on a friend's number, and there is a member of staff who will answer
 * for it. Sending that person an SMS code they are not expecting, to confirm a
 * booking they did not make, is not verification — it is an obstacle in front
 * of a lead we already trust.
 *
 * So the check is not skipped, it is replaced: the person who entered it is
 * recorded, and the row says so. A flag on the public route would have meant
 * one endpoint where verification is sometimes required, which is the shape
 * mistakes hide in.
 *
 * The number is still normalised, because a number stored four ways is four
 * different parents as far as every later screen is concerned.
 */
export const runtime = 'nodejs';

interface Body {
  student_name?: string;
  parent_name?: string;
  phone?: string;
  email?: string;
  subject?: string;
  focus?: string;
  learner_stage_value?: string;
  preferred_slot?: string;
  timezone?: string;
  /** Who sent them. The whole reason this endpoint exists. */
  referral?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let supa;
  try { supa = await createServerClientHelper(); } catch {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from('profiles').select('role, is_admin, is_super_admin, full_name').eq('id', user.id).single();

  // Admin and super-admin only. HR and sellers see leads but do not create
  // bookings; widening that is a decision, not an oversight.
  const allowed = profile?.role === 'admin' || profile?.role === 'super_admin'
    || profile?.is_admin === true || profile?.is_super_admin === true;
  if (!allowed) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `admin-demo:${user.id}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const name = (body.student_name ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: 'bad_name', message: 'Enter the student’s name.' }, { status: 400 });
  }

  const rawPhone = (body.phone ?? '').trim();
  if (rawPhone.replace(/\D/g, '').length < 7) {
    return NextResponse.json({ ok: false, error: 'bad_phone', message: 'Enter a phone number.' }, { status: 400 });
  }
  // Indian numbers are canonicalised so this row matches the same parent
  // wherever else they turn up. A foreign number is kept as typed.
  const parsed = normalizeIndianMobile(rawPhone);
  const phone = parsed.ok ? parsed.e164 : rawPhone;

  if (!body.preferred_slot) {
    return NextResponse.json({ ok: false, error: 'bad_slot', message: 'Pick a preferred time.' }, { status: 400 });
  }
  const slot = new Date(body.preferred_slot);
  if (Number.isNaN(slot.getTime())) {
    return NextResponse.json({ ok: false, error: 'bad_slot', message: 'That time is not valid.' }, { status: 400 });
  }

  const timezone = (body.timezone ?? 'Asia/Kolkata').slice(0, 100);
  const slotLabel = slot.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: timezone,
  }) + ` (${timezone})`;

  const enteredBy = (profile?.full_name ?? '').trim() || user.email || 'staff';
  const referral = (body.referral ?? '').trim();
  const noteParts = [
    `Entered by ${enteredBy}.`,
    referral ? `Referred by ${referral}.` : '',
    (body.notes ?? '').trim(),
  ].filter(Boolean);

  const { data, error } = await admin.from('demo_class_requests').insert({
    student_name: name.slice(0, 100),
    parent_name: (body.parent_name ?? '').trim().slice(0, 100) || null,
    phone,
    phone_country_code: parsed.ok ? 'IN' : null,
    email: (body.email ?? '').trim().slice(0, 200) || null,
    subject: (body.subject ?? '').slice(0, 50) || null,
    focus: (body.focus ?? '').slice(0, 50) || null,
    course_interest: (body.subject === 'coding' ? body.focus : '') || null,
    preferred_slot: slot.toISOString(),
    preferred_slot_label: slotLabel,
    timezone,
    timezone_offset: 330,
    // Says where it came from without needing a new column: every screen that
    // reads a demo request already shows notes.
    notes: noteParts.join(' '),
    referrer: 'staff:manual',
    status: 'new',
  }).select('id').single();

  if (error) {
    console.warn('[admin/demo-class] insert error:', error.message);
    return NextResponse.json({ ok: false, error: 'insert_failed', message: error.message }, { status: 500 });
  }

  await recordAdminAction(admin, {
    adminId: user.id,
    action: 'demo_request_created',
    targetType: 'demo_class_request',
    targetId: data.id,
    metadata: { student_name: name, phone, referral: referral || null },
  });

  return NextResponse.json({ ok: true, id: data.id });
}
