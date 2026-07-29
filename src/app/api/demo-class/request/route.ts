import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

export const runtime = 'nodejs';

interface DemoRequestBody {
  student_name?: string;
  parent_name?: string;
  phone?: string;
  email?: string;
  course_interest?: string;
  preferred_slot?: string;
  timezone?: string;
  timezone_offset?: number;
  phone_country_code?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  // 1. CSRF check (only if Origin header is present — allows curl/server-to-server)
  const origin = req.headers.get('origin');
  if (origin) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }

  // 2. IP blocklist
  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  // 3. Rate limit: 5/min/IP (stricter for public form)
  const ipKey = `demo-class:${requestIp}`;
  const rl = rateLimit({ key: ipKey, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Please wait a minute and try again.');
  }

  // 4. Parse body
  let body: DemoRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // 5. Honeypot — silently succeed
  if (body.website) {
    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // 6. Validate
  const errors: string[] = [];
  if (!body.student_name || body.student_name.trim().length < 2) errors.push('Student name is required (min 2 characters)');
  if (body.student_name && body.student_name.length > 100) errors.push('Student name must be under 100 characters');
  if (body.parent_name && body.parent_name.length > 100) errors.push('Parent name must be under 100 characters');

  if (!body.phone) {
    errors.push('Phone number is required');
  } else {
    const phoneDigits = body.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.push('Phone number must be 7-15 digits');
  }

  if (body.email && body.email.trim().length > 0) {
    if (body.email.length > 200) errors.push('Email must be under 200 characters');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) errors.push('Invalid email format');
  }

  if (!body.preferred_slot) {
    errors.push('Preferred time slot is required');
  } else {
    const slotDate = new Date(body.preferred_slot);
    if (isNaN(slotDate.getTime())) {
      errors.push('Invalid time slot');
    } else {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      if (slotDate < oneHourAgo) errors.push('Time slot must be in the future');
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (slotDate > thirtyDaysFromNow) errors.push('Time slot must be within the next 30 days');
    }
  }

  if (!body.timezone || body.timezone.length > 100) errors.push('Timezone is required');
  if (body.timezone_offset !== undefined && (typeof body.timezone_offset !== 'number' || body.timezone_offset < -720 || body.timezone_offset > 840)) {
    errors.push('Invalid timezone offset');
  }
  if (body.course_interest && body.course_interest.length > 50) errors.push('Invalid course interest');

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, error: 'validation_failed', errors }, { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // 7. Insert
  let supabase;
  try {
    supabase = await createServerClientHelper();
  } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const slotDate = new Date(body.preferred_slot!);
  const slotLabel = isNaN(slotDate.getTime())
    ? body.preferred_slot!
    : slotDate.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: body.timezone }) + ` (${body.timezone})`;

  const { data, error: insertErr } = await supabase
    .from('demo_class_requests')
    .insert({
      student_name: body.student_name!.trim(),
      parent_name: body.parent_name?.trim() || null,
      phone: body.phone!.trim(),
      phone_country_code: body.phone_country_code ?? null,
      email: body.email?.trim() || null,
      course_interest: body.course_interest || null,
      preferred_slot: body.preferred_slot!,
      preferred_slot_label: slotLabel,
      timezone: body.timezone!,
      timezone_offset: body.timezone_offset ?? null,
      user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
      referrer: req.headers.get('referer')?.slice(0, 500) ?? null,
      status: 'new',
    })
    .select('id')
    .single();

  if (insertErr) {
    console.warn('[demo-class] insert error:', insertErr.message);
    return NextResponse.json({ ok: false, error: 'insert_failed', message: insertErr.message }, { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // 8. Notify admin (best-effort log — actual email requires RESEND_API_KEY or SENDGRID_API_KEY)
  try {
    const adminEmail = process.env.DEMO_CLASS_NOTIFY_EMAIL || 'founder@sariro.com';
    console.log(`[demo-class] New request from ${body.student_name} (${body.phone}) for ${slotLabel} — notify ${adminEmail}`);
  } catch {}

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201, headers: { 'Content-Type': 'application/json' } });
}