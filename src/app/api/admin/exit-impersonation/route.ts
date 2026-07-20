import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';

/**
 * SARIRO — POST /api/admin/exit-impersonation
 *
 * Restores the admin's original session after impersonating a user.
 *
 * Flow:
 *   1. Read the `sariro_impersonator` cookie to get the admin's user ID.
 *   2. If no cookie → user wasn't impersonating, return 200 (idempotent).
 *   3. Use the service-role client to generate a fresh magic link for
 *      the admin's email.
 *   4. Exchange it for a session (overwrites the impersonated user's session).
 *   5. Clear the `sariro_impersonator` cookie.
 *   6. Return { ok: true, redirectTo: '/dashboard/admin' }.
 *
 * Note: this is the same magic-link-exchange pattern as the impersonate
 * route. We can't "restore" the admin's previous session because
 * Supabase's session is stored in cookies that we overwrote during
 * impersonation. The cleanest approach is to issue a fresh session.
 */

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // ── Read impersonator cookie ────────────────────────────────────────
  const cookieValue = req.cookies.get('sariro_impersonator')?.value;
  if (!cookieValue) {
    return NextResponse.json({ ok: true, redirectTo: '/dashboard', reason: 'not_impersonating' });
  }

  let payload: { adminUserId?: string; adminEmail?: string } = {};
  try {
    payload = JSON.parse(cookieValue);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_cookie' }, { status: 400 });
  }

  if (!payload.adminEmail) {
    return NextResponse.json({ ok: false, error: 'no_admin_email' }, { status: 400 });
  }

  // ── Generate magic link for the admin's email ───────────────────────
  const { createServiceClient } = await import('@/lib/supabase/server');
  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (err) {
    console.error('[exit-impersonation] service client unavailable:', err);
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 500 });
  }

  const { data: linkData, error: linkErr } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: payload.adminEmail,
  });

  if (linkErr || !linkData) {
    console.error('[exit-impersonation] generateLink error:', linkErr?.message);
    return NextResponse.json({ ok: false, error: 'link_generation_failed' }, { status: 500 });
  }

  const actionLink = linkData.properties?.action_link;
  if (!actionLink) {
    return NextResponse.json({ ok: false, error: 'link_malformed' }, { status: 500 });
  }

  const url = new URL(actionLink);
  const tokenHash = url.searchParams.get('token') || url.searchParams.get('token_hash');
  if (!tokenHash) {
    return NextResponse.json({ ok: false, error: 'token_missing' }, { status: 500 });
  }

  // ── Exchange for session ────────────────────────────────────────────
  const supaServer = await createServerClientHelper();
  const { error: verifyErr } = await supaServer.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });

  if (verifyErr) {
    console.error('[exit-impersonation] verifyOtp error:', verifyErr.message);
    return NextResponse.json({ ok: false, error: 'session_restore_failed' }, { status: 500 });
  }

  // ── Clear the impersonator cookie ───────────────────────────────────
  const res = NextResponse.json({ ok: true, redirectTo: '/dashboard' });
  res.cookies.delete('sariro_impersonator');
  return res;
}

export async function GET() {
  return NextResponse.json({
    name: 'Sariro Exit Impersonation',
    description: 'Restores admin session after impersonating a user.',
  });
}
