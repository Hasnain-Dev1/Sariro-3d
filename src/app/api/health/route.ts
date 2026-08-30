import { NextResponse } from 'next/server';
import { BUILD_COMMIT, BUILD_TIME, buildAgeLabel } from '@/lib/build-info';

/**
 * SARIRO — GET /api/health
 *
 * Lightweight health-check endpoint for uptime monitoring + load
 * balancer probes. Returns 200 OK if the server is alive, with a
 * breakdown of which integrations are configured.
 *
 * Intentionally does NOT make outbound calls to Supabase / Razorpay —
 * it only checks whether the env vars are present. This keeps the
 * endpoint fast (<5ms) and free of external dependencies.
 *
 * For deep health checks (DB ping, Razorpay ping), add separate
 * /api/health/deep endpoints that this one can link to.
 */

export const runtime = 'nodejs';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const razorpayKey = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  const razorpayWebhook = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Which build is this? Stamped at build time, so if the deploy restarted the
  // process without running `next build`, these stay old and say so. See
  // src/lib/build-info.ts for why that failure mode is easy to misread.
  const build = {
    commit: BUILD_COMMIT,
    builtAt: BUILD_TIME,
    builtAgo: buildAgeLabel(),
  };

  const checks = {
    supabase: {
      url: !!supabaseUrl && supabaseUrl.startsWith('http'),
      anonKey: !!supabaseAnon,
      serviceKey: !!supabaseService,
    },
    razorpay: {
      keyId: !!razorpayKey,
      keySecret: !!razorpaySecret,
      webhookSecret: !!razorpayWebhook,
      standardApiConfigured:
        !!razorpayKey &&
        !!razorpaySecret &&
        razorpayKey !== 'PUT_YOUR_RAZORPAY_KEY_ID_HERE',
    },
  };

  const allOk =
    checks.supabase.url &&
    checks.supabase.anonKey &&
    checks.razorpay.keyId &&
    checks.razorpay.keySecret;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime:
        typeof process !== 'undefined' && process.uptime
          ? `${Math.round(process.uptime())}s`
          : 'unknown',
      build,
      checks,
    },
    { status: allOk ? 200 : 200 } // always 200 so monitoring doesn't alert on partial config
  );
}
