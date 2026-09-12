import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClientHelper } from '@/lib/supabase/server';

/**
 * SARIRO — signing a family in at the end of the booking form.
 *
 * ── Why this exists rather than a link ──────────────────────────────────────
 * The booking form used to finish by opening a Supabase magic link. That link
 * goes to Supabase first and only then bounces back to us, and the address it
 * bounces to is whatever the Supabase project has configured — which sent live
 * families to http://localhost:3000 and stranded every one of them.
 *
 * So the session is created HERE instead, on our own domain, and the browser is
 * simply told to open /my-class. Nothing leaves the site, and there is no
 * project setting that can point it somewhere else.
 *
 * Two ways in, depending on what this request knows:
 *   · a brand-new account — we generated the password a moment ago, so we can
 *     sign in with it directly.
 *   · an existing account whose email was proved by a code — we mint a one-time
 *     token and redeem it server-side, which never reveals or changes their
 *     password.
 *
 * Both write the session cookies through the SSR client, so the very next
 * request from that browser is authenticated. Never throws: a booking that is
 * made must not be lost because a sign-in failed, and the caller falls back to
 * showing a sign-in button.
 */
export async function signInTrialUser(
  admin: SupabaseClient,
  email: string,
  password: string | null
): Promise<boolean> {
  try {
    const supa = await createServerClientHelper();

    if (password) {
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (!error) return true;
      console.warn('[trial-signin] password sign-in failed:', error.message);
      // Fall through: the one-time token below may still work.
    }

    /* A one-time token, redeemed here rather than emailed. `hashed_token` is
       the same value the link in the email carries, so this is the ordinary
       magic-link flow with the round trip removed. */
    const { data, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    const tokenHash = data?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      console.warn('[trial-signin] could not mint a token:', linkErr?.message ?? 'no hashed_token');
      return false;
    }

    /* Supabase has called this token 'magiclink' and 'email' at different
       points, and which one a project accepts depends on its version. Trying
       both costs one extra call in the rare case and is the difference between
       a family landing in their account and landing on a sign-in form. */
    for (const type of ['magiclink', 'email'] as const) {
      const { error: otpErr } = await supa.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!otpErr) return true;
      console.warn(`[trial-signin] token redemption failed as ${type}:`, otpErr.message);
    }
    return false;
  } catch (err) {
    console.warn('[trial-signin] failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
