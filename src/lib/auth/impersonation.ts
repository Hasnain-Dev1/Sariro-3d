import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SARIRO — is this session really an admin viewing as the user?
 * ============================================================================
 * The `sariro_impersonator` cookie is httpOnly but NOT signed, so anybody can
 * put one in their own browser by hand. On its own it is only good for
 * showing a banner. Anything that relaxes a rule for impersonation — the
 * dashboard's phone check — asks this instead, which believes the cookie only
 * when the database agrees:
 *
 *   • it names the signed-in user as the target, and started within the hour
 *     the cookie lives for;
 *   • the admin it names really is an admin or super admin; and
 *   • /api/admin/impersonate wrote the audit row for exactly that admin and
 *     that user in that hour — a row no browser can write.
 */

const HOUR_MS = 60 * 60_000;

export const IMPERSONATOR_COOKIE = 'sariro_impersonator';

/** `raw` is the cookie's value: `req.cookies.get(IMPERSONATOR_COOKIE)?.value`. */
export async function isVerifiedImpersonation(
  raw: string | undefined,
  admin: SupabaseClient,
  userId: string,
  now: Date = new Date()
): Promise<boolean> {
  if (!raw) return false;

  let payload: { adminUserId?: unknown; targetUserId?: unknown; startedAt?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return false;
  }
  const adminId = typeof payload.adminUserId === 'string' ? payload.adminUserId : '';
  const started = typeof payload.startedAt === 'string' ? Date.parse(payload.startedAt) : NaN;
  if (!adminId || payload.targetUserId !== userId || !Number.isFinite(started)) return false;
  if (now.getTime() - started > HOUR_MS || started - now.getTime() > 60_000) return false;

  try {
    const since = new Date(now.getTime() - HOUR_MS - 60_000).toISOString();
    const [who, logged] = await Promise.all([
      admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', adminId).maybeSingle(),
      admin
        .from('admin_audit_logs')
        .select('id')
        .eq('admin_id', adminId)
        .eq('action', 'impersonate_user')
        .eq('target_id', userId)
        .gte('created_at', since)
        .limit(1),
    ]);
    const p = who.data as { role: string | null; is_admin: boolean | null; is_super_admin: boolean | null } | null;
    const isAdmin = !!p && (p.role === 'admin' || p.role === 'super_admin' || p.is_admin === true || p.is_super_admin === true);
    return isAdmin && !logged.error && (logged.data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
