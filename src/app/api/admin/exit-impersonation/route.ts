import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { IMPERSONATOR_COOKIE, isVerifiedImpersonation, openImpersonation } from '@/lib/auth/impersonation';

/**
 * SARIRO — POST /api/admin/exit-impersonation
 *
 * Ends "view as user" and signs the admin back in as themselves.
 *
 * ── Why this is careful (17 Sep 2026) ───────────────────────────────────────
 * It used to read the admin's EMAIL straight out of the impersonation cookie
 * and sign that address in. The cookie was not signed, so anybody could write
 * one naming any email — the super admin's — press this, and become them.
 *
 * Now a session is restored only when all of these hold:
 *   · the cookie carries the server's seal (lib/auth/impersonation.ts);
 *   · somebody is signed in, and they are the user the cookie says was being
 *     viewed — the admin's own impersonated session, nobody else's;
 *   · the database agrees: the admin is still an admin, and the audit row for
 *     this impersonation exists, written within the hour;
 *   · the address signed back in is read from the auth server by the admin's
 *     id — never from the cookie.
 * Anything else clears the cookie and signs nobody in.
 */
export const runtime = 'nodejs';

const json = (body: Record<string, unknown>, status = 200) => {
  const res = NextResponse.json(body, { status });
  res.cookies.delete(IMPERSONATOR_COOKIE);
  return res;
};

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `exit-impersonation:${ip}`, limit: 10, windowMs: 10 * 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many attempts. Try again shortly.');

  const raw = req.cookies.get(IMPERSONATOR_COOKIE)?.value;
  if (!raw) return NextResponse.json({ ok: true, redirectTo: '/dashboard', reason: 'not_impersonating' });

  const refused = { ok: false, error: 'not_impersonating', message: 'This is not an admin viewing session. Sign in again.', redirectTo: '/auth/sign-in' };

  const payload = openImpersonation(raw);
  if (!payload) return json(refused, 403);

  let supaServer;
  try { supaServer = await createServerClientHelper(); } catch { return json(refused, 403); }
  const { data: { user } } = await supaServer.auth.getUser();
  if (!user || user.id !== payload.targetUserId) return json(refused, 403);

  let admin;
  try {
    admin = createServiceClient();
  } catch (err) {
    console.error('[exit-impersonation] service client unavailable:', err);
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 500 });
  }

  if (!(await isVerifiedImpersonation(raw, admin, user.id))) return json(refused, 403);

  // The address to sign back in, from the auth server — never from the cookie.
  const { data: adminAuth, error: adminErr } = await admin.auth.admin.getUserById(payload.adminUserId);
  const adminEmail = adminAuth?.user?.email;
  if (adminErr || !adminEmail) {
    console.error('[exit-impersonation] admin account not found:', adminErr?.message);
    return json({ ok: false, error: 'admin_not_found', redirectTo: '/auth/sign-in' }, 404);
  }

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: adminEmail });
  const actionLink = linkData?.properties?.action_link;
  if (linkErr || !actionLink) {
    console.error('[exit-impersonation] generateLink error:', linkErr?.message);
    return NextResponse.json({ ok: false, error: 'link_generation_failed' }, { status: 500 });
  }

  const url = new URL(actionLink);
  const tokenHash = url.searchParams.get('token') || url.searchParams.get('token_hash');
  if (!tokenHash) return NextResponse.json({ ok: false, error: 'token_missing' }, { status: 500 });

  const { error: verifyErr } = await supaServer.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash });
  if (verifyErr) {
    console.error('[exit-impersonation] verifyOtp error:', verifyErr.message);
    return NextResponse.json({ ok: false, error: 'session_restore_failed' }, { status: 500 });
  }

  return json({ ok: true, redirectTo: '/dashboard' });
}
