import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/admin/grant-credits
 *
 * Body: { enrollment_id, lesson_count }
 *
 * Called by the admin confirm-enrollment flow. The DB trigger
 * (grant_credits_on_enrollment) already grants 1 placeholder credit + inserts
 * a transaction with amount=1. This route tops up the balance to the real
 * lesson count by:
 *   1. Verifying the caller is an admin
 *   2. Fetching the enrollment (to get user_id + track + level)
 *   3. Calculating the top-up amount = lesson_count - 1 (trigger already granted 1)
 *   4. Using SERVICE ROLE to:
 *      a. Update the credit_transactions row (amount = lesson_count)
 *      b. Update the credits.balance (add top-up amount)
 *
 * Security:
 *   - Admin-only (verifies role)
 *   - CSRF + honeypot + rate-limit
 *   - Service role only for the credit writes (bypasses RLS)
 */

export const runtime = 'nodejs';

interface GrantBody {
  enrollment_id?: string;
  lesson_count?: number;
  website?: string;
}

export async function POST(req: NextRequest) {
  // 1. CSRF
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  // 2. IP blocklist + rate limit
  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const rl = rateLimit({ key: `grant-credits:${requestIp}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  // 3. Parse body
  let body: GrantBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  // Honeypot
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  if (!body.enrollment_id || !body.lesson_count || body.lesson_count < 1) {
    return NextResponse.json(
      { ok: false, error: 'missing_required_fields' },
      { status: 400 }
    );
  }

  // 4. Auth gate + admin check
  let supabase;
  try {
    supabase = await createServerClientHelper();
  } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // 5. Fetch the enrollment
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, user_id, track, level, status')
    .eq('id', body.enrollment_id)
    .maybeSingle();

  if (enrollErr || !enrollment) {
    return NextResponse.json({ ok: false, error: 'enrollment_not_found' }, { status: 404 });
  }

  // 6. Use service role to top up credits
  let admin;
  try {
    admin = createServiceClient();
  } catch (serviceErr) {
    console.warn('[grant-credits] service role not configured:', serviceErr);
    return NextResponse.json(
      { ok: false, error: 'service_role_unavailable', message: 'Server is missing SUPABASE_SERVICE_ROLE_KEY. Ask your dev to set it in .env' },
      { status: 503 }
    );
  }

  try {
    const lessonCount = body.lesson_count!;

    // Idempotent per enrollment: sum what was ALREADY granted for this
    // enrollment (via related_enrollment_id) and only top up the difference.
    // Previously this route SET balance = lessonCount absolutely, which wiped a
    // student's credits from OTHER courses and double-granted on re-runs.
    const { data: priorTxns } = await admin
      .from('credit_transactions')
      .select('amount')
      .eq('related_enrollment_id', enrollment.id);
    const alreadyGranted = (priorTxns ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + (t.amount > 0 ? t.amount : 0),
      0
    );
    const topUpAmount = lessonCount - alreadyGranted;

    if (topUpAmount > 0) {
      // Add the missing credits to the EXISTING balance (never overwrite).
      const { data: current } = await admin
        .from('credits')
        .select('balance')
        .eq('user_id', enrollment.user_id)
        .maybeSingle();
      const newBalance = (current?.balance ?? 0) + topUpAmount;

      await admin
        .from('credits')
        .upsert(
          { user_id: enrollment.user_id, balance: newBalance },
          { onConflict: 'user_id' }
        );

      await admin.from('credit_transactions').insert({
        user_id: enrollment.user_id,
        amount: topUpAmount,
        type: 'purchase',
        description: `Credits granted for enrollment in ${enrollment.track} ${enrollment.level} (${lessonCount} lessons)`,
        related_enrollment_id: enrollment.id,
        created_by: user.id,
      });
    }

    return NextResponse.json({
      ok: true,
      credits_granted: lessonCount,
      user_id: enrollment.user_id,
    });
  } catch (err) {
    console.warn('[grant-credits] service role error:', err);
    return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 });
  }
}
