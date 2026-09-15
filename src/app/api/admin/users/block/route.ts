import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { bestEffort } from '@/lib/supabase/best-effort';
import { BAN_DURATION, isBlockedUser } from '@/lib/auth/blocked';

/**
 * SARIRO — block or unblock a user (super admin only)
 * ============================================================================
 * GET   /api/admin/users/block            who is blocked right now
 * POST  /api/admin/users/block            { userId, blocked: boolean, reason? }
 *
 * For offboarding: a seller or teacher who has left must not be able to sign
 * in, and one still signed in must be stopped. See lib/auth/blocked.ts for
 * how the two marks — a Supabase ban and app_metadata.blocked — hold together.
 *
 * Refused: blocking yourself (nobody should be able to lock the last door from
 * the inside), and blocking another super admin — change their role first, so
 * taking a super admin's access away is always two deliberate steps.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'users-blocked', limit: 60, allow: ['super_admin'], skipOriginCheck: true });
  if (!gate.ok) return gate.response;

  const blocked: { id: string; reason: string | null; blockedAt: string | null }[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await gate.actor.admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.warn('[users-block] list failed:', error.message);
      return NextResponse.json({ ok: false, error: 'list_failed' }, { status: 500 });
    }
    for (const u of data.users) {
      if (isBlockedUser(u)) {
        const m = u.app_metadata as Record<string, unknown>;
        blocked.push({ id: u.id, reason: (m.blocked_reason as string | null) ?? null, blockedAt: (m.blocked_at as string | null) ?? null });
      }
    }
    if (data.users.length < 1000) break;
  }
  return NextResponse.json({ ok: true, blocked }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'users-block', limit: 30, allow: ['super_admin'] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<{ userId?: string; blocked?: boolean; reason?: string; website?: string }>(req);
  if (!parsed.ok) return parsed.response;
  const { userId } = parsed.body;
  const blocked = parsed.body.blocked === true;
  const reason = typeof parsed.body.reason === 'string' ? parsed.body.reason.trim().slice(0, 300) || null : null;

  if (!userId || !UUID.test(userId)) {
    return NextResponse.json({ ok: false, error: 'missing_user' }, { status: 400 });
  }
  if (userId === actor.id) {
    return NextResponse.json({ ok: false, error: 'self', message: 'You cannot block your own account.' }, { status: 400 });
  }

  const { data: target } = await actor.admin
    .from('profiles')
    .select('full_name, email, role, is_super_admin')
    .eq('id', userId)
    .maybeSingle();
  if (blocked && (target?.role === 'super_admin' || target?.is_super_admin === true)) {
    return NextResponse.json(
      { ok: false, error: 'super_admin', message: 'That account is a super admin. Change their role first, then block them.' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await actor.admin.auth.admin.updateUserById(userId, {
    ban_duration: blocked ? BAN_DURATION : 'none',
    app_metadata: blocked
      ? { blocked: true, blocked_at: now, blocked_by: actor.id, blocked_reason: reason }
      : { blocked: false, blocked_at: null, blocked_by: null, blocked_reason: null, unblocked_at: now, unblocked_by: actor.id },
  });
  if (error || !updated?.user) {
    console.warn('[users-block] update failed:', error?.message);
    return NextResponse.json(
      { ok: false, error: 'update_failed', message: error?.message ?? 'That account could not be updated.' },
      { status: error?.status === 404 ? 404 : 500 }
    );
  }

  await bestEffort(
    'users-block: audit',
    actor.admin.from('admin_audit_logs').insert({
      admin_id: actor.id,
      action: blocked ? 'user_blocked' : 'user_unblocked',
      target_type: 'user',
      target_id: userId,
      metadata: { reason, name: target?.full_name ?? null, email: target?.email ?? null, role: target?.role ?? null },
    })
  );

  return NextResponse.json({ ok: true, userId, blocked: isBlockedUser(updated.user) });
}
