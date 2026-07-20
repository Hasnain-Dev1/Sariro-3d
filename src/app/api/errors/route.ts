import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';

/**
 * SARIRO — POST /api/errors
 *
 * Lightweight client-side error capture. The browser-side ErrorTracker
 * component POSTs unhandled errors + unhandledrejection events here.
 *
 * What we do with the error:
 *   1. Log it to stdout (so it shows up in server logs / Vercel logs).
 *   2. If ERROR_WEBHOOK_URL is set, POST the error to that URL (Slack
 *      incoming webhook, Discord webhook, custom endpoint, etc.).
 *   3. Return 200 — always. We don't want the browser to retry.
 *
 * This is a Sentry-lite: 80% of the value (centralized error capture)
 * with 0% of the dependency weight. To upgrade to real Sentry later,
 * add @sentry/nextjs and either replace this endpoint or have it
 * forward to Sentry via @sentry/node.
 *
 * Rate limited: 10 errors / minute per IP — blocks a broken client
 * from flooding the server.
 */

export const runtime = 'nodejs';

interface ErrorReport {
  message: string;
  stack?: string;
  source?: string;       // file URL
  lineno?: number;
  colno?: number;
  url?: string;          // page URL where error occurred
  userAgent?: string;
  userId?: string | null;
  /** 'error' | 'unhandledrejection' | 'manual' */
  kind?: string;
  /** Optional metadata — anything the client wants to attach. */
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  // Rate limit per IP
  const ip = getClientIp(req);

  // ── IP blocklist — instantly 403 known abusers ─────────────────────
  if (isIpBlocked(ip)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rl = rateLimit({
    key: `errors:${ip}`,
    limit: 10,
    windowMs: 60_000,
    ip,
  });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many error reports.');
  }

  let body: ErrorReport;
  try {
    body = (await req.json()) as ErrorReport;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  if (!body?.message) {
    return NextResponse.json({ ok: false, error: 'missing_message' }, { status: 400 });
  }

  const ts = new Date().toISOString();
  const summary = `[error:${ts}] ${body.kind ?? 'error'} — ${body.message}`;
  const detail = {
    ts,
    kind: body.kind ?? 'error',
    message: body.message,
    stack: body.stack?.slice(0, 4000) ?? null,
    source: body.source ?? null,
    lineno: body.lineno ?? null,
    colno: body.colno ?? null,
    url: body.url ?? null,
    userAgent: body.userAgent ?? null,
    userId: body.userId ?? null,
    ip,
    metadata: body.metadata ?? null,
  };

  // 1. Log to stdout
  console.error(summary, detail);

  // 2. Forward to webhook (best-effort, non-blocking)
  const webhookUrl = process.env.ERROR_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      // fire-and-forget — don't block the response
      void fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${summary}\n\`\`\`${JSON.stringify(detail, null, 2)}\`\`\``,
          detail,
        }),
      }).catch((err) => {
        console.warn('[errors] webhook forward failed:', err);
      });
    } catch {
      /* swallow */
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    name: 'Sariro Error Capture',
    description: 'Receives client-side error reports and forwards to ERROR_WEBHOOK_URL if set.',
    webhookConfigured: !!process.env.ERROR_WEBHOOK_URL,
  });
}
