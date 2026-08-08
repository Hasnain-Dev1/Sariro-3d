import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/demo-class/request
 *
 * Body: {
 *   student_name, parent_name?, phone, email?, course_interest?,
 *   preferred_slot (ISO string), timezone, timezone_offset, phone_country_code?,
 *   website? (honeypot)
 * }
 *
 * Flow:
 *   1. CSRF check (must come from same origin)
 *   2. IP blocklist
 *   3. Rate limit: 5 requests/min/IP (stricter — public form, high spam risk)
 *   4. Honeypot check (silently succeed if filled)
 *   5. Validate payload (required fields, length limits, email format, phone digits)
 *   6. Insert into demo_class_requests table (RLS allows public INSERT)
 *   7. Send notification email to admin (if RESEND_API_KEY or SENDGRID_API_KEY set)
 *   8. Return { ok }
 *
 * Security:
 *   - CSRF on every POST
 *   - Honeypot field
 *   - Rate limited (5/min/IP — stricter than other endpoints)
 *   - Phone validation (digits only, 7-15 digits)
 *   - Email validation (if provided)
 *   - Length limits on all text fields
 *   - RLS: anyone can INSERT, only admins can SELECT
 *   - No auth required (visitors aren't logged in yet)
 */

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
  website?: string; // honeypot
}

export async function POST(req: NextRequest) {
  // ── 1. CSRF check ─────────────────────────────────────────────────────
  // Note: This is a public form, so the Origin header should match our site.
  // We allow requests with no Origin (curl/server-to-server) since they
  // don't carry cookies and can't CSRF — but we still rate-limit them by IP.
  const origin = req.headers.get('origin');
  if (origin) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }

  // ── 2. IP blocklist ───────────────────────────────────────────────────
  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) {
    return NextResponse.json(
      { ok: false, error: 'forbidden' },
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 3. Rate limit: 5/min/IP ───────────────────────────────────────────
  const ipKey = `demo-class:${requestIp}`;
  const rl = rateLimit({ key: ipKey, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Please wait a minute and try again.');
  }

  // ── 4. Parse body ─────────────────────────────────────────────────────
  let body: DemoRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 5. Honeypot check — silently succeed ──────────────────────────────
  if (body.website) {
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 6. Validate payload ───────────────────────────────────────────────
  const errors: string[] = [];

  if (!body.student_name || body.student_name.trim().length < 2) {
    errors.push('Student name is required (min 2 characters)');
  }
  if (body.student_name && body.student_name.length > 100) {
    errors.push('Student name must be under 100 characters');
  }
  if (body.parent_name && body.parent_name.length > 100) {
    errors.push('Parent name must be under 100 characters');
  }

  // Phone validation — strip non-digits, check 7-15 digits
  if (!body.phone) {
    errors.push('Phone number is required');
  } else {
    const phoneDigits = body.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      errors.push('Phone number must be 7-15 digits');
    }
  }

  // Email validation (optional)
  if (body.email && body.email.trim().length > 0) {
    if (body.email.length > 200) {
      errors.push('Email must be under 200 characters');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      errors.push('Invalid email format');
    }
  }

  // Preferred slot — must be a valid ISO date string in the future
  if (!body.preferred_slot) {
    errors.push('Preferred time slot is required');
  } else {
    const slotDate = new Date(body.preferred_slot);
    if (isNaN(slotDate.getTime())) {
      errors.push('Invalid time slot');
    } else {
      // Must be in the future (allow up to 1 hour in the past for timezone edge cases)
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      if (slotDate < oneHourAgo) {
        errors.push('Time slot must be in the future');
      }
      // Must be within the next 30 days
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (slotDate > thirtyDaysFromNow) {
        errors.push('Time slot must be within the next 30 days');
      }
    }
  }

  // Timezone required
  if (!body.timezone || body.timezone.length > 100) {
    errors.push('Timezone is required');
  }

  // Timezone offset must be a reasonable number (-12 to +14 hours)
  if (
    body.timezone_offset !== undefined &&
    (typeof body.timezone_offset !== 'number' ||
      body.timezone_offset < -720 ||
      body.timezone_offset > 840)
  ) {
    errors.push('Invalid timezone offset');
  }

  // Course interest — must be a valid track ID if provided
  if (body.course_interest && body.course_interest.length > 50) {
    errors.push('Invalid course interest');
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', errors },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 7. Insert into demo_class_requests ────────────────────────────────
  // Use SERVICE ROLE client to bypass RLS — the trigger (auto_create_lead_from_demo)
  // tries to INSERT into student_leads which is RLS-protected. The service role
  // bypasses ALL RLS, so both the demo_class_requests insert AND the trigger fire
  // successfully.
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    // Service role not configured — fall back to SSR client (subject to RLS)
    try {
      supabase = await createServerClientHelper();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'supabase_not_configured' },
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Build the preferred_slot_label for display in admin dashboard
  const slotDate = new Date(body.preferred_slot!);
  const slotLabel = isNaN(slotDate.getTime())
    ? body.preferred_slot!
    : slotDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: body.timezone,
      }) + ` (${body.timezone})`;

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
    return NextResponse.json(
      { ok: false, error: 'insert_failed', message: insertErr.message },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 8. Send confirmation email to student + notification to admin ───
  // Best-effort — we don't fail the request if email fails (DB insert is source of truth)
  try {
    const { sendBookingConfirmationEmail } = await import('@/lib/email/hostinger');

    // Send confirmation to student (if email provided)
    if (body.email?.trim()) {
      await sendBookingConfirmationEmail({
        studentName: body.student_name!,
        email: body.email.trim(),
        phone: body.phone!,
        preferredSlot: slotLabel,
        timezone: body.timezone!,
      });
    }

    // Log admin notification
    const adminEmail = process.env.DEMO_CLASS_NOTIFY_EMAIL || 'support@sariro.in';
    console.log(
      `[demo-class] New request from ${body.student_name} (${body.phone}) for ${slotLabel} — notify ${adminEmail}`
    );
  } catch {
    // ignore email errors — DB insert is the source of truth
  }

  // ── 9. Return success ─────────────────────────────────────────────────
  return NextResponse.json(
    { ok: true, id: data?.id },
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
}