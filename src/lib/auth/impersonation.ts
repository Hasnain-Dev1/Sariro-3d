import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SARIRO — is this session really an admin viewing as the user?
 * ============================================================================
 * The `sariro_impersonator` cookie says "an admin is viewing as this user, and
 * this is the admin to switch back to". Until 17 Sep 2026 it was plain JSON,
 * httpOnly but NOT signed — and /api/admin/exit-impersonation believed it:
 * anybody could put `{"adminEmail": "<any address>"}` in their own browser,
 * press Exit, and be signed in as that address. Every account, the super
 * admin's included, was one cookie away.
 *
 * Two locks now, and both must open:
 *
 *   1. The cookie is SEALED — an HMAC made with a key only the server holds —
 *      so a hand-made or edited cookie is simply not read.
 *   2. isVerifiedImpersonation() still asks the database: the cookie names the
 *      signed-in user as the target, started within the hour it lives for, the
 *      admin it names really is an admin, and /api/admin/impersonate wrote the
 *      audit row for exactly that admin and user in that hour.
 *
 * Nothing that switches sessions may read the cookie any other way.
 */

const HOUR_MS = 60 * 60_000;
/** A clock a little ahead is tolerated; a cookie from the future is not. */
const SKEW_MS = 60_000;
const VERSION = 'v1';

export const IMPERSONATOR_COOKIE = 'sariro_impersonator';

export interface ImpersonationPayload {
  adminUserId: string;
  targetUserId: string;
  startedAt: string;
  /** For the banner only. Never used to decide whose session to restore. */
  adminEmail?: string | null;
  targetEmail?: string | null;
  targetName?: string | null;
}

/**
 * The sealing key. A dedicated IMPERSONATION_SECRET when set; otherwise derived
 * from the service-role key, which every server already holds and no browser
 * ever sees. Derived rather than used directly, so the cookie's MAC is never a
 * MAC keyed with the database's master key itself.
 */
export function impersonationSecret(): string {
  const base = process.env.IMPERSONATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!base) return '';
  return createHmac('sha256', base).update('sariro:impersonation-cookie:v1').digest('hex');
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
const mac = (body: string, secret: string) => createHmac('sha256', secret).update(`${VERSION}.${body}`).digest();

/** The cookie value for a payload. Throws when the server has no key to seal with. */
export function sealImpersonation(payload: ImpersonationPayload, secret: string = impersonationSecret()): string {
  if (!secret) throw new Error('impersonation_secret_missing');
  const body = b64(JSON.stringify(payload));
  return `${VERSION}.${body}.${b64(mac(body, secret))}`;
}

/** The payload, only if the server sealed it and it is still within its hour. */
export function openImpersonation(
  raw: string | undefined | null,
  secret: string = impersonationSecret(),
  now: Date = new Date()
): ImpersonationPayload | null {
  if (!raw || !secret) return null;
  const parts = raw.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  const [, body, sig] = parts;

  let given: Buffer;
  try { given = Buffer.from(sig, 'base64url'); } catch { return null; }
  const expected = mac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
  const adminUserId = typeof parsed.adminUserId === 'string' ? parsed.adminUserId : '';
  const targetUserId = typeof parsed.targetUserId === 'string' ? parsed.targetUserId : '';
  const startedAt = typeof parsed.startedAt === 'string' ? parsed.startedAt : '';
  const started = Date.parse(startedAt);
  if (!adminUserId || !targetUserId || !Number.isFinite(started)) return null;
  if (now.getTime() - started > HOUR_MS || started - now.getTime() > SKEW_MS) return null;

  const text = (v: unknown) => (typeof v === 'string' ? v : null);
  return {
    adminUserId, targetUserId, startedAt,
    adminEmail: text(parsed.adminEmail), targetEmail: text(parsed.targetEmail), targetName: text(parsed.targetName),
  };
}

/** `raw` is the cookie's value: `req.cookies.get(IMPERSONATOR_COOKIE)?.value`. */
export async function isVerifiedImpersonation(
  raw: string | undefined,
  admin: SupabaseClient,
  userId: string,
  now: Date = new Date()
): Promise<boolean> {
  const payload = openImpersonation(raw, impersonationSecret(), now);
  if (!payload || payload.targetUserId !== userId) return false;
  const adminId = payload.adminUserId;

  try {
    const since = new Date(now.getTime() - HOUR_MS - SKEW_MS).toISOString();
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
