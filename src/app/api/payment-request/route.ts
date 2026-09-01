import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { sendEmail } from '@/lib/email/hostinger';
import { notifyUsers } from '@/lib/notify';

/**
 * SARIRO — POST /api/payment-request
 * =========================================================
 * Where /contact's form actually goes now.
 *
 * ── What this replaces ──────────────────────────────────────────────────────
 * The contact form's submit handler was, in full:
 *
 *     // Simulate async send (no backend required for this demo)
 *     await new Promise((r) => setTimeout(r, 900));
 *     toast.success('Message sent!', { description: "we'll reply within 24 hours" });
 *
 * Nine hundred milliseconds of theatre, a promise of a reply, and the message
 * discarded. The form had never been wired to anything.
 *
 * The reason that mattered more than a normal dead form: checkout's bank
 * transfer option linked into it. `/checkout` → "Request bank details" →
 * `/contact?intent=bank-transfer&product=…` → thanked → gone. Buyers at the
 * payment step, choosing the one method that requires a human, were the people
 * most reliably lost.
 *
 * ── Shape ───────────────────────────────────────────────────────────────────
 * Body: { kind?, full_name, email, phone?, subject?, message,
 *         product_slug?, scope_label?, cadence?, ratio?, website? (honeypot) }
 *
 * Flow mirrors /api/demo-class/request, which is the other public form on the
 * site, so both are hardened the same way:
 *   1. CSRF (same-origin when an Origin header is present)
 *   2. IP blocklist
 *   3. Rate limit — 5/min/IP, the public-form rate
 *   4. Honeypot (silently succeeds, so a bot learns nothing)
 *   5. Validate and clamp every field
 *   6. Insert with the service role (the table has no public insert policy —
 *      a form on the open internet must not be a writable table)
 *   7. Email the team and raise an in-app notification for HR and admins
 *
 * Step 7 is the point. A row nobody is told about is the same as no row: that
 * is precisely how the demo-class request used to fail before it was fixed.
 */

export const runtime = 'nodejs';

interface PaymentRequestBody {
  kind?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  product_slug?: string;
  scope_label?: string;
  cadence?: string;
  ratio?: string;
  website?: string; // honeypot
}

/** Trim, collapse to null when empty, and clamp — applied to every text field. */
function clean(v: string | undefined, max: number): string | null {
  const t = (v ?? '').trim();
  if (!t) return null;
  return t.slice(0, max);
}

export async function POST(req: NextRequest) {
  // ── 1. CSRF ───────────────────────────────────────────────────────────
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

  // ── 3. Rate limit ─────────────────────────────────────────────────────
  const rl = rateLimit({ key: `payment-request:${requestIp}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return rateLimitedResponse(
      rl.retryAfterMs,
      'Too many messages. Please wait a minute and try again.'
    );
  }

  // ── 4. Body ───────────────────────────────────────────────────────────
  let body: PaymentRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 5. Honeypot ───────────────────────────────────────────────────────
  if (body.website) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // ── 6. Validate ───────────────────────────────────────────────────────
  const kind = body.kind === 'bank_transfer' ? 'bank_transfer' : 'contact';
  const email = clean(body.email, 200);
  const fullName = clean(body.full_name, 120);
  const message = clean(body.message, 4000);

  const errors: string[] = [];
  if (!email) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
  if (!fullName) errors.push('Name is required');
  if (!message) errors.push('Message is required');

  const phone = clean(body.phone, 32);
  // Digits, spaces and the usual punctuation only — same shape the demo form
  // accepts, so an international number is not rejected.
  if (phone && !/^[\d\s+()-]{7,32}$/.test(phone)) errors.push('Invalid phone number');

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', errors },
      { status: 400 }
    );
  }

  // ── 7. Insert ─────────────────────────────────────────────────────────
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    try {
      supabase = await createServerClientHelper();
    } catch {
      return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
    }
  }

  // If they happen to be signed in, link the row to the account so HR is not
  // guessing which family this is. Never required — most buyers are not.
  let userId: string | null = null;
  try {
    const ssr = await createServerClientHelper();
    const { data: auth } = await ssr.auth.getUser();
    userId = auth?.user?.id ?? null;
  } catch {
    /* anonymous is the normal case */
  }

  const { data, error: insertErr } = await supabase
    .from('payment_requests')
    .insert({
      kind,
      full_name: fullName,
      email,
      phone,
      subject: clean(body.subject, 200),
      message,
      product_slug: clean(body.product_slug, 120),
      scope_label: clean(body.scope_label, 200),
      cadence: clean(body.cadence, 40),
      ratio: clean(body.ratio, 16),
      user_id: userId,
      status: 'new',
    })
    .select('id')
    .single();

  if (insertErr) {
    console.warn('[payment-request] insert error:', insertErr.message);
    return NextResponse.json(
      { ok: false, error: 'insert_failed', message: insertErr.message },
      { status: 500 }
    );
  }

  // ── 8. Tell a human ───────────────────────────────────────────────────
  // Best-effort: the row is the source of truth, and a mail outage must not
  // cost us the enquiry. But a row nobody is told about is how the demo-class
  // request failed for months, so this is not optional-in-spirit.
  try {
    const isMoney = kind === 'bank_transfer';
    const inbox = process.env.DEMO_CLASS_NOTIFY_EMAIL || 'contact@sariro.com';
    const productLine =
      body.product_slug || body.scope_label
        ? `<p style="margin:0 0 6px;"><strong>Wants:</strong> ${clean(body.scope_label, 200) ?? ''} ${
            body.product_slug ? `(${clean(body.product_slug, 120)})` : ''
          } ${body.cadence ? `· ${clean(body.cadence, 40)}` : ''} ${
            body.ratio ? `· ${clean(body.ratio, 16)}` : ''
          }</p>`
        : '';

    await sendEmail({
      to: inbox,
      subject: isMoney
        ? `Bank transfer request — ${fullName}`
        : `Contact form — ${clean(body.subject, 120) ?? fullName}`,
      html: `<div style="font-family: Inter, sans-serif; padding: 24px;">
        <h2 style="margin:0 0 12px;">${isMoney ? 'Someone wants to pay by bank transfer' : 'New contact message'}</h2>
        <p style="margin:0 0 6px;"><strong>Name:</strong> ${fullName}</p>
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
        ${phone ? `<p style="margin:0 0 6px;"><strong>Phone:</strong> ${phone}</p>` : ''}
        ${productLine}
        <p style="margin:12px 0 0; white-space:pre-wrap;">${message}</p>
        ${
          isMoney
            ? `<p style="margin:16px 0 0; color:#B45309; font-size:13px;">
                 They are at the payment step. Send the account details and a
                 reference today.
               </p>`
            : ''
        }
      </div>`,
    });

    // HR owns this inbox; admins can see it too.
    const { data: staff } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['hr', 'admin', 'super_admin']);

    if (staff?.length) {
      await notifyUsers(
        staff.map((sfr: { id: string }) => ({
          userId: sfr.id,
          type: 'general' as const,
          title: isMoney ? 'Bank transfer request' : 'New contact message',
          message: `${fullName} · ${email}`,
          link: '/dashboard/hr',
        }))
      );
    }
  } catch {
    /* the row is saved; delivery is best-effort */
  }

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
}
