/**
 * SARIRO — a blocked account
 * ============================================================================
 * The founder, 15 Sep 2026: a super admin must be able to block a user from
 * the platform — to offboard a seller or a teacher and be sure they cannot use
 * it any more — and unblock them again. A blocked person is told to check with
 * support.
 *
 * ── How a block holds, without a migration ──────────────────────────────────
 * Two marks, both set by the service role on the auth record itself, which no
 * user can edit (api/admin/users/block):
 *
 *   ban            Supabase refuses to sign them in, by any method, and
 *                  refuses to renew a session they already have.
 *   app_metadata   `blocked: true`, read fresh from the auth server by
 *                  getUser(). The app checks it on every page load
 *                  (AuthProvider) and every protected API call (requireActor),
 *                  so an open tab is stopped straight away rather than when
 *                  its session next expires.
 *
 * Pure: shared by the server routes and the browser.
 */

export const SUPPORT_EMAIL = 'support@sariro.com';

export const BLOCKED_TITLE = 'Your account is blocked';

export const BLOCKED_MESSAGE =
  `Your account has been blocked from the support end. Kindly check with support at ${SUPPORT_EMAIL}.`;

export const BLOCKED_PATH = '/account-blocked';

type WithMetadata = { app_metadata?: Record<string, unknown> | null } | null | undefined;

export function isBlockedUser(user: WithMetadata): boolean {
  return user?.app_metadata?.blocked === true;
}

/** Supabase's refusal for a banned account, however it arrives. */
export function isBlockedAuthError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { code?: unknown; message?: unknown; error_code?: unknown };
  const code = String(e.code ?? e.error_code ?? '');
  const message = typeof err === 'string' ? err : String(e.message ?? '');
  return code === 'user_banned' || /\bbanned\b/i.test(message);
}

/** What a sign-in screen says for an error: the support message for a block, otherwise the error. */
export function authErrorText(err: unknown, fallback: string): string {
  if (isBlockedAuthError(err)) return BLOCKED_MESSAGE;
  if (typeof err === 'string' && err) return err;
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Long enough to mean "until a super admin unblocks them" — Supabase wants a duration. */
export const BAN_DURATION = '876000h';
