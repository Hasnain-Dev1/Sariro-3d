import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { normalizeIndianMobile } from '@/lib/phone/india';
import { smsConfigured } from '@/lib/phone/otp';
import { TRIAL_HOME } from '@/lib/dashboard/trial-only';

/**
 * SARIRO — POST /api/trial/add-email
 *
 * "Later we can collect more information." This is the later.
 *
 * The booking form asks for a name and a number, which is the right amount to
 * ask of somebody who has just tapped an advert. But a phone-only account has
 * no way back in: there is no phone sign-in on this site, so without an email
 * the parent can never open their own class page again.
 *
 * So the email is offered AFTER the class is booked, on the confirmation
 * screen, as an optional extra that costs them nothing to skip. The booking is
 * already safe either way; this only decides whether they can get back to it.
 *
 * ── What proves they may do this ────────────────────────────────────────────
 * The same thing that proved them during the booking: the phone, checked
 * against the database rather than read from the request. Nothing else would
 * be enough — an endpoint that attached an email to an account on the strength
 * of a phone number typed into a form would let anybody bind their own address
 * to a stranger's account and then request a link to it.
 *
 * ── And it will not touch an account that already has one ───────────────────
 * If the profile already has an email, this refuses. Overwriting somebody's
 * address is how you lock them out of their own account, and there is no
 * version of this flow that should be able to do it.
 */
export const runtime = 'nodejs';

const bad = (error: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, error, message }, { status });

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `add-email:${ip}`, limit: 8, windowMs: 10 * 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many attempts. Try again shortly.');

  let body: { phone?: string; email?: string };
  try { body = await req.json(); } catch {
    return bad('invalid_json', 'Something went wrong. Please try again.');
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('bad_email', 'That email does not look right.');

  const parsed = normalizeIndianMobile(body.phone ?? '');
  if (!parsed.ok) return bad('bad_phone', 'We could not match that number.');
  const phone = parsed.e164;

  const admin = createServiceClient();

  // The proof, asked of the database. See the header.
  if (smsConfigured()) {
    try {
      const { data, error } = await admin.rpc('phone_is_verified', { p_phone: phone });
      if (error) throw error;
      if (data !== true) return bad('phone_not_verified', 'Please book again — that number is no longer confirmed.', 403);
    } catch (err) {
      console.warn('[add-email] phone_is_verified failed:', err instanceof Error ? err.message : err);
      return bad('verification_unavailable', 'We could not check that just now. Try again in a moment.', 503);
    }
  }

  const { data: profile } = await admin
    .from('profiles').select('id, email').eq('phone', phone).limit(1).maybeSingle();
  if (!profile) return bad('no_account', 'We could not find that booking.', 404);

  // Never overwrite. See the header — this is how people get locked out.
  if (profile.email) {
    return bad('already_set', 'That account already has an email. Sign in with it to see your class.', 409);
  }

  // Somebody else's address, already spoken for.
  const { data: taken } = await admin
    .from('profiles').select('id').eq('email', email).limit(1).maybeSingle();
  if (taken) {
    return bad('email_taken', 'That email is already used by another Sariro account.', 409);
  }

  const id = profile.id as string;
  const { error: authErr } = await admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
  });
  if (authErr) {
    console.warn('[add-email] updateUser failed:', authErr.message);
    return bad('save_failed', 'We could not save that. Please try again.', 500);
  }
  await admin.from('profiles').update({ email }).eq('id', id);

  /* Straight to their class page. They proved the phone, the account had no
     email until a moment ago, and the address is now confirmed on it — so
     there is nobody this link could belong to except them. */
  let signInUrl: string | null = null;
  try {
    const origin = new URL(req.url).origin;
    const { data: link } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(TRIAL_HOME)}` },
    });
    signInUrl = link?.properties?.action_link ?? null;
  } catch (err) {
    console.warn('[add-email] generateLink failed:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ ok: true, signInUrl });
}
