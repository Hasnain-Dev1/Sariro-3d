/**
 * SARIRO — who is asking, resolved once
 * ============================================================================
 * Every cross-user write in this codebase opens the same way: same-origin,
 * IP blocklist, rate limit, session, then the caller's role read from THEIR
 * OWN profile row rather than from anything the request said about itself.
 *
 * That preamble is currently retyped in every route. Retyped code drifts — and
 * the drift here is not cosmetic, it is a route that forgot the role check.
 * `/api/admin/leads` reads five profile columns to work out a role; a route
 * written next week might read three and conclude a super-admin is a student.
 *
 * ── Why the role is derived from both a column and four flags ───────────────
 * `profiles.role` is the intended source of truth. It is not the only one:
 * `is_super_admin`, `is_admin`, `is_seller` and `is_hr` predate it and are
 * still set independently by screens that were never updated. A person can
 * therefore be `role: 'student'` with `is_hr: true`, and refusing them is a
 * lockout with no error anybody can act on.
 *
 * So both are read and the MORE powerful answer wins — matching what every
 * existing route already does by hand, in one place where it can be corrected
 * once.
 *
 * This helper is deliberately additive: existing routes keep working untouched
 * and can adopt it when they are next opened.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

export type ActorRole = 'super_admin' | 'admin' | 'hr' | 'seller' | 'teacher' | 'student';

export interface Actor {
  id: string;
  role: ActorRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isSeller: boolean;
  isTeacher: boolean;
  /** Admin or super-admin — the two who can act across other people's rows. */
  isStaff: boolean;
  fullName: string | null;
  /** Service-role client. Only ever reached after the role check above it. */
  admin: SupabaseClient;
}

/** Everything that can go wrong before a route gets to do its job. */
export type ActorResult = { ok: true; actor: Actor } | { ok: false; response: Response };

export interface RequireOptions {
  /** Rate-limit bucket name. Keep it specific — buckets are shared by key. */
  bucket: string;
  limit?: number;
  windowMs?: number;
  /** Roles allowed through. Omit to allow any signed-in user. */
  allow?: ActorRole[];
  /** GET routes have no body to forge, so the CSRF check is skipped. */
  skipOriginCheck?: boolean;
}

/**
 * The whole preamble, in one call.
 *
 * Returns a discriminated union rather than throwing: a route that forgets to
 * handle the failure branch does not compile, whereas a route that forgets a
 * try/catch simply 500s with the reason in the log and the caller none the
 * wiser about whether they were refused or the database was down.
 */
export async function requireActor(
  req: NextRequest,
  opts: RequireOptions
): Promise<ActorResult> {
  if (!opts.skipOriginCheck) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return { ok: false, response: csrfFail };
  }

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return { ok: false, response: NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 }) };
  }

  const rl = rateLimit({
    key: `${opts.bucket}:${ip}`,
    limit: opts.limit ?? 60,
    windowMs: opts.windowMs ?? 60_000,
    ip,
  });
  if (!rl.ok) {
    return { ok: false, response: NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 }) };
  }

  let supabase;
  try {
    supabase = await createServerClientHelper();
  } catch {
    return { ok: false, response: NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }) };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 }) };
  }

  /* Read through the CALLER'S OWN session, not the service client. A role read
     with the service key would happily return a row for any id the request
     named, which is the whole attack. */
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, is_admin, is_super_admin, is_seller, is_hr, is_teacher')
    .eq('id', user.id)
    .maybeSingle();

  const p = profile ?? {};
  const isSuperAdmin = p.role === 'super_admin' || p.is_super_admin === true;
  const isAdmin = isSuperAdmin || p.role === 'admin' || p.is_admin === true;
  const isHR = p.role === 'hr' || p.is_hr === true;
  const isSeller = p.role === 'seller' || p.is_seller === true;
  const isTeacher = p.role === 'teacher' || p.is_teacher === true;

  /* One label for screens and logs. Ordered by reach, so somebody who is both
     an admin and a seller is logged as the more powerful of the two — which is
     the one that explains what they were able to do. */
  const role: ActorRole =
    isSuperAdmin ? 'super_admin'
    : isAdmin ? 'admin'
    : isHR ? 'hr'
    : isSeller ? 'seller'
    : isTeacher ? 'teacher'
    : 'student';

  if (opts.allow && !opts.allow.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'forbidden', message: 'Your account cannot do that.' },
        { status: 403 }
      ),
    };
  }

  let admin: SupabaseClient;
  try {
    admin = createServiceClient();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'service_role_unavailable', message: 'SUPABASE_SERVICE_ROLE_KEY not set' },
        { status: 503 }
      ),
    };
  }

  return {
    ok: true,
    actor: {
      id: user.id,
      role,
      isSuperAdmin,
      isAdmin,
      isHR,
      isSeller,
      isTeacher,
      isStaff: isAdmin,
      fullName: (p.full_name as string | null) ?? null,
      admin,
    },
  };
}

/** Shorthand for the JSON body, with the honeypot already answered. */
export async function readJson<T extends { website?: string }>(
  req: NextRequest
): Promise<{ ok: true; body: T } | { ok: false; response: Response }> {
  let body: T;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) };
  }
  /* A filled honeypot is a bot. Answered with success so it learns nothing. */
  if (body?.website) {
    return { ok: false, response: NextResponse.json({ ok: true }) };
  }
  return { ok: true, body };
}
