import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { addCredits } from '@/lib/credits/apply';

/**
 * SARIRO — POST /api/admin/adjust-credits
 *
 * Body: { user_id, amount, reason }
 *
 * Admin manual credit adjustment. Adds or removes credits from a student.
 *
 * Security:
 *   - Admin-only
 *   - CSRF + honeypot + rate-limit (20/min)
 *   - Service role for the credit writes
 *   - Validates amount is reasonable (-1000 to +1000)
 */

export const runtime = 'nodejs';

interface AdjustBody {
  user_id?: string;
  amount?: number;
  reason?: string;
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
  const rl = rateLimit({ key: `adjust-credits:${requestIp}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  // 3. Parse body
  let body: AdjustBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  // Honeypot
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  // 4. Validate
  const errors: string[] = [];
  if (!body.user_id) errors.push('User ID is required');
  if (!body.amount || typeof body.amount !== 'number' || body.amount === 0) {
    errors.push('Amount must be a non-zero number');
  }
  if (body.amount && (body.amount < -1000 || body.amount > 1000)) {
    errors.push('Amount must be between -1000 and +1000');
  }
  if (!body.reason || body.reason.trim().length < 3) {
    errors.push('Reason is required (min 3 characters)');
  }
  if (body.reason && body.reason.length > 500) {
    errors.push('Reason must be under 500 characters');
  }
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, error: 'validation_failed', errors }, { status: 400 });
  }

  // 5. Auth gate + admin check
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // 6. Use service role to adjust credits
  let admin;
  try {
    admin = createServiceClient();
  } catch (serviceErr) {
    console.warn('[adjust-credits] service role not configured:', serviceErr);
    return NextResponse.json(
      { ok: false, error: 'service_role_unavailable', message: 'Server is missing SUPABASE_SERVICE_ROLE_KEY. Ask your dev to set it in .env' },
      { status: 503 }
    );
  }

  try {
    /* ── Adding credits is never just adding credits ─────────────────────────
       If the family fell behind while their classes were paused, part of this
       payment pays for the lessons they missed and the rest pays for carrying
       on. addCredits() works that out, writes both balances together, creates
       one catch-up obligation per missed lesson, restarts the student if there
       is anything left to attend with, and tells them and their teacher.

       A DEDUCTION still goes the old way below: taking credits away is an
       admin correcting something, and it never buys anything. */
    if (body.amount! > 0) {
      const result = await addCredits(admin, {
        studentId: body.user_id!,
        credits: body.amount!,
        reason: body.reason!.trim(),
        actorId: user.id,
      });
      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: 'adjust_failed', message: result.error ?? 'Could not add those credits.' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        ok: true,
        duplicate: result.duplicate ?? false,
        balance: result.mainBalance,
        catchup_balance: result.catchupBalance,
        main_added: result.mainAdded,
        catchup_added: result.catchupAdded,
        catchup_lessons: result.catchupLessons,
        still_unfunded: result.stillUnfunded,
        resumed: result.resumed,
        resume_at_lesson: result.resumeAtLesson,
        // §18 — the sentence the family reads the instant payment lands.
        message: result.message,
      });
    }

    // Read the CURRENT balance, then ADD the delta. We do the arithmetic here
    // (read-modify-write) rather than trusting a DB function — a hand-written
    // `adjust_credits_balance` on the live DB was SETTING the balance to the
    // entered value instead of adding/deducting, which wiped existing credits.
    const { data: current } = await admin
      .from('credits')
      .select('balance')
      .eq('user_id', body.user_id!)
      .maybeSingle();

    const prevBalance = current?.balance ?? 0;
    // Never let a deduction push the balance below zero.
    const newBalance = Math.max(0, prevBalance + body.amount!);

    // Upsert so a missing credits row is created with the correct balance.
    await admin
      .from('credits')
      .upsert(
        { user_id: body.user_id!, balance: newBalance },
        { onConflict: 'user_id' }
      );

    // Insert transaction record
    await admin.from('credit_transactions').insert({
      user_id: body.user_id!,
      amount: body.amount!,
      type: 'admin_adjustment',
      description: body.reason!.trim(),
      created_by: user.id,
    });

    return NextResponse.json({
      ok: true,
      new_balance: newBalance,
    });
  } catch (err) {
    console.warn('[adjust-credits] service role error:', err);
    return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 });
  }
}
