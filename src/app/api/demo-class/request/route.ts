import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { sendEmail } from '@/lib/email/hostinger';
import { notifyUsers } from '@/lib/notify';
import { parseStage, describeChoice } from '@/lib/demo/learner-choice';

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
 *   7. Email the team inbox and raise an in-app notification for admins/sellers
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
  subject?: string;
  focus?: string;
  /** One value from stageGroups(); split into stage + grade before storing. */
  learner_stage_value?: string;
  preferred_slot?: string;
  preferred_slot_window?: string;
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

  // Subject / focus are slugs chosen from a fixed list; length is the only
  // thing worth asserting here, because the list they came from is derived from
  // the curriculum and will legitimately grow.
  if (body.subject && body.subject.length > 50) errors.push('Invalid subject');
  if (body.focus && body.focus.length > 50) errors.push('Invalid focus');
  // learner_stage_value is NOT validated by pattern: parseStage below returns
  // nulls for anything it does not recognise, so a bad value is discarded
  // rather than rejected. A visitor should never lose a booking over an
  // optional field.

  // Preferred slot window — optional display label (e.g. "Morning · 9:00 AM – 12:00 PM")
  if (body.preferred_slot_window && body.preferred_slot_window.length > 100) {
    errors.push('Invalid preferred slot window');
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
      subject: body.subject || null,
      focus: body.focus || null,
      ...(() => {
        const { stage, grade } = parseStage(body.learner_stage_value ?? '');
        return { learner_stage: stage, learner_grade: grade };
      })(),
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

    // Send confirmation to student (if email provided).
    // The email shows the time WINDOW the user selected (e.g. "Monday, September 1 ·
    // Morning · 9:00 AM – 12:00 PM"), not a single exact time — a rep confirms the
    // precise slot by phone. Falls back to the exact-time label if no window sent.
    const slotWindow = body.preferred_slot_window?.trim();
    const emailSlotLabel = slotWindow
      ? (isNaN(slotDate.getTime())
          ? slotWindow
          : slotDate.toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              timeZone: body.timezone,
            }) + ` · ${slotWindow}`)
      : slotLabel;

    if (body.email?.trim()) {
      await sendBookingConfirmationEmail({
        studentName: body.student_name!,
        email: body.email.trim(),
        phone: body.phone!,
        preferredSlot: emailSlotLabel,
        timezone: body.timezone!,
      });
    }

    // ── Actually tell somebody ──────────────────────────────────────
    // This used to be a console.log interpolating an env var that was never
    // read by anything that sends mail. A demo request — the top of the whole
    // funnel — landed in the database and a server log, and reached a human
    // only if one happened to look at the table.
    //
    // Now: an email to the team inbox, and an in-app notification for every
    // admin so it shows up on the bell with the chime.
    const teamInbox = process.env.DEMO_CLASS_NOTIFY_EMAIL || 'contact@sariro.com';
    const parsed = parseStage(body.learner_stage_value ?? '');
    // The whole point of the new fields: an admin should be able to tell a
    // Class 6 child from a working professional without opening the row.
    const wants = describeChoice(
      body.subject ?? null,
      body.focus ?? null,
      parsed.stage,
      parsed.grade
    );
    const summary = `${body.student_name} · ${wants} · ${slotLabel}`;

    await sendEmail({
      to: teamInbox,
      subject: `Demo class request — ${body.student_name}`,
      html: `<div style="font-family: Inter, sans-serif; padding: 24px;">
        <h2 style="margin:0 0 12px;">New demo class request</h2>
        <p style="margin:0 0 6px;"><strong>Name:</strong> ${body.student_name}</p>
        <p style="margin:0 0 6px;"><strong>Phone:</strong> ${body.phone}</p>
        <p style="margin:0 0 6px;"><strong>Wants:</strong> ${wants}</p>
        <p style="margin:0 0 6px;"><strong>Preferred window:</strong> ${slotLabel}</p>
        <p style="margin:16px 0 0; color:#64748b; font-size:13px;">
          Call them within 24 hours — that promise is on the booking page.
        </p>
      </div>`,
    });

    // Bell + chime for anyone who can act on it.
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin', 'seller']);

    if (admins?.length) {
      await notifyUsers(
        admins.map((a: { id: string }) => ({
          userId: a.id,
          type: 'general' as const,
          title: 'New demo class request',
          message: summary,
          link: '/dashboard/admin',
        }))
      );
    }
  } catch {
    // ignore email errors — DB insert is the source of truth
  }

  // ── 9. Return success ─────────────────────────────────────────────────
  return NextResponse.json(
    { ok: true, id: data?.id },
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
}