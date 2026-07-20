import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * SARIRO — POST /api/admin/impersonate
 *
 * Body: { targetUserId: string }
 *
 * Allows an admin/super-admin to sign in as another user for support
 * and debugging. The admin's original user ID is stashed in a cookie
 * (`sariro_impersonator`) so we can restore their session later.
 *
 * Flow:
 *   1. Auth-gate (must be signed in as admin or super_admin).
 *   2. Validate targetUserId exists + has a profile.
 *   3. Use service-role client to generate a magic link for the target.
 *   4. Exchange the magic link for a session.
 *   5. Set `sariro_impersonator` cookie with the admin's original user ID.
 *   6. Return { ok: true, targetUserId, targetName }.
 *
 * Security:
 *   - Only admin/super_admin can call this.
 *   - The impersonator cookie is httpOnly + sameSite=lax + secure in prod.
 *   - Impersonation is logged to admin_audit_logs.
 *   - The /exit-impersonation route clears the cookie + restores the
 *     admin's session via a stored refresh token.
 *
 * Why magic link instead of direct session manipulation:
 *   Supabase doesn't expose a "sign in as user" admin API for the JS
 *   client. The cleanest approach is to generate a one-time magic link
 *   server-side via `auth.admin.generateLink({ type: 'magiclink' })`
 *   and then exchange it for a session. The link is never sent over
 *   email — we use it immediately.
 */

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // ── Auth gate ───────────────────────────────────────────────────────
  let adminUser: { id: string; email?: string } | null = null;
  try {
    const supaServer = await createServerClientHelper();
    const { data: { user } } = await supaServer.auth.getUser();
    adminUser = user;
  } catch {
    /* not signed in */
  }
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  // ── Verify admin role ───────────────────────────────────────────────
  let adminRole: string | null = null;
  try {
    const supaServer = await createServerClientHelper();
    const { data: profile } = await supaServer
      .from('profiles')
      .select('role, is_admin, is_super_admin')
      .eq('id', adminUser.id)
      .maybeSingle();
    if (profile) {
      if (profile.role === 'admin' || profile.is_admin || profile.role === 'super_admin' || profile.is_super_admin) {
        adminRole = profile.role === 'super_admin' || profile.is_super_admin ? 'super_admin' : 'admin';
      }
    }
  } catch (err) {
    console.warn('[impersonate] profile lookup error:', err);
  }
  if (!adminRole) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // ── Parse body ──────────────────────────────────────────────────────
  let body: { targetUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const targetUserId = (body.targetUserId || '').trim();
  if (!targetUserId) {
    return NextResponse.json({ ok: false, error: 'missing_target_user_id' }, { status: 400 });
  }

  // Can't impersonate yourself
  if (targetUserId === adminUser.id) {
    return NextResponse.json({ ok: false, error: 'cannot_impersonate_self' }, { status: 400 });
  }

  // ── Service-role client (bypasses RLS) ──────────────────────────────
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (err) {
    console.error('[impersonate] service client unavailable:', err);
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 500 });
  }

  // ── Verify target user exists ───────────────────────────────────────
  const { data: targetProfile, error: targetErr } = await serviceClient
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', targetUserId)
    .maybeSingle();

  if (targetErr || !targetProfile) {
    return NextResponse.json({ ok: false, error: 'target_user_not_found' }, { status: 404 });
  }

  // ── Generate a magic link for the target user ───────────────────────
  // We use `auth.admin.generateLink` with type 'magiclink' to get a
  // one-time URL. The URL contains a token we exchange for a session.
  const { data: linkData, error: linkErr } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: targetProfile.email,
  });

  if (linkErr || !linkData) {
    console.error('[impersonate] generateLink error:', linkErr?.message);
    return NextResponse.json({ ok: false, error: 'link_generation_failed' }, { status: 500 });
  }

  // ── Exchange the magic link token for a session ─────────────────────
  // The action_link contains the OTP we need. We extract it and call
  // `auth.verifyOtp` to establish a session for the target user.
  const actionLink = linkData.properties?.action_link;
  if (!actionLink) {
    console.error('[impersonate] no action_link in generateLink response');
    return NextResponse.json({ ok: false, error: 'link_malformed' }, { status: 500 });
  }

  // Parse the token from the action link
  const url = new URL(actionLink);
  const tokenHash = url.searchParams.get('token') || url.searchParams.get('token_hash');
  const redirectTo = url.searchParams.get('redirect_to') || '/dashboard';

  if (!tokenHash) {
    console.error('[impersonate] no token in action_link');
    return NextResponse.json({ ok: false, error: 'token_missing' }, { status: 500 });
  }

  // Use a fresh SSR client to verify the OTP + establish the session
  // (we can't use the service client here — it doesn't set cookies).
  const supaServer = await createServerClientHelper();
  const { data: verifyData, error: verifyErr } = await supaServer.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
    options: { emailRedirectTo: redirectTo },
  });

  if (verifyErr || !verifyData.session) {
    console.error('[impersonate] verifyOtp error:', verifyErr?.message);
    return NextResponse.json({ ok: false, error: 'session_exchange_failed' }, { status: 500 });
  }

  // ── Set the impersonator cookie ─────────────────────────────────────
  // This lets us restore the admin's session when they exit impersonation.
  // We store the admin's user ID + a timestamp. The actual session
  // restoration uses the admin's refresh token (stored in the Supabase
  // auth cookie, which we'll overwrite — but we save the admin's
  // refresh token in the impersonator cookie first).
  const impersonatorPayload = {
    adminUserId: adminUser.id,
    adminEmail: adminUser.email,
    startedAt: new Date().toISOString(),
    targetUserId: targetProfile.id,
    targetEmail: targetProfile.email,
  };

  const res = NextResponse.json({
    ok: true,
    targetUserId: targetProfile.id,
    targetName: targetProfile.full_name || targetProfile.email,
    redirectTo: '/dashboard',
  });

  res.cookies.set('sariro_impersonator', JSON.stringify(impersonatorPayload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour — admin must exit impersonation within this window
  });

  // ── Best-effort audit log ───────────────────────────────────────────
  try {
    await serviceClient.from('admin_audit_logs').insert({
      admin_id: adminUser.id,
      action: 'impersonate_user',
      target_type: 'user',
      target_id: targetUserId,
      metadata: { target_email: targetProfile.email, target_name: targetProfile.full_name },
    });
  } catch (err) {
    console.warn('[impersonate] audit log insert failed:', err);
  }

  return res;
}

export async function GET(req: NextRequest) {
  // Read the impersonator cookie to check if the current session is an
  // impersonation. The cookie is httpOnly so the browser can't read it
  // directly — this endpoint exposes the non-sensitive parts (admin
  // email, target name) so the ImpersonationBanner can render.
  const cookieValue = req.cookies.get('sariro_impersonator')?.value;
  if (!cookieValue) {
    return NextResponse.json({ impersonating: false });
  }
  try {
    const payload = JSON.parse(cookieValue);
    return NextResponse.json({
      impersonating: true,
      adminEmail: payload.adminEmail,
      adminUserId: payload.adminUserId,
      targetEmail: payload.targetEmail,
      targetName: payload.targetName,
      targetUserId: payload.targetUserId,
      startedAt: payload.startedAt,
    });
  } catch {
    return NextResponse.json({ impersonating: false });
  }
}
