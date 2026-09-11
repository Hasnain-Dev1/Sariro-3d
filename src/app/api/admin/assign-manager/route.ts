import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { notifyUsers } from '@/lib/notify';

/**
 * SARIRO — POST /api/admin/assign-manager  (super_admin only)
 *
 * Sets a teacher's or a seller's reporting Admin or reporting HR.
 * Body: { personId, field: 'admin' | 'hr', managerId: string | null }
 * (`teacherId` is still accepted — it is what the teacher screen has always
 * sent. managerId null clears the assignment.)
 *
 * ── Why sellers now, and why only these two roles ───────────────────────────
 * Teachers have always had a reporting Admin and HR; sellers had nobody, so a
 * seller's payout and incentive requests went to every HR at once and were
 * nobody's in particular. The columns were always on every profile — only the
 * screens and this route's wording assumed "teacher".
 *
 * The person must be a teacher or a seller. A student or an admin with a
 * "reporting HR" is a relationship nothing reads, and writing one would look
 * like it meant something.
 */
export const runtime = 'nodejs';

interface Body {
  personId?: string;
  teacherId?: string;
  field?: 'admin' | 'hr';
  managerId?: string | null;
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let userId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* 401 */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const admin = createServiceClient();
  const { data: p } = await admin.from('profiles').select('role, is_super_admin').eq('id', userId).single();
  const isSuper = p?.role === 'super_admin' || p?.is_super_admin === true;
  if (!isSuper) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `assign-manager:${userId}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const personId = body.personId || body.teacherId;
  if (!personId || (body.field !== 'admin' && body.field !== 'hr')) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }
  const managerId = body.managerId || null;

  const { data: person } = await admin
    .from('profiles')
    .select('id, full_name, role, is_teacher, is_seller')
    .eq('id', personId)
    .maybeSingle();
  if (!person) return NextResponse.json({ ok: false, error: 'person_not_found' }, { status: 404 });

  const isTeacher = person.role === 'teacher' || person.is_teacher === true;
  const isSeller = person.role === 'seller' || person.is_seller === true;
  if (!isTeacher && !isSeller) {
    return NextResponse.json(
      { ok: false, error: 'not_managed', message: 'Only teachers and sellers have a reporting Admin and HR.' },
      { status: 400 }
    );
  }
  /* A person who is somehow both is described by the job that has managers
     first — teaching — since that is what the older screens assume. */
  const kind: 'teacher' | 'seller' = isTeacher ? 'teacher' : 'seller';

  // If setting (not clearing), verify the manager has the right role.
  if (managerId) {
    const { data: m } = await admin.from('profiles').select('role, is_admin, is_hr').eq('id', managerId).maybeSingle();
    if (!m) return NextResponse.json({ ok: false, error: 'manager_not_found' }, { status: 404 });
    const ok = body.field === 'admin'
      ? (m.role === 'admin' || m.role === 'super_admin' || m.is_admin === true)
      : (m.role === 'hr' || m.is_hr === true);
    if (!ok) return NextResponse.json({ ok: false, error: 'wrong_manager_role' }, { status: 400 });
  }

  const column = body.field === 'admin' ? 'reporting_admin_id' : 'reporting_hr_id';
  const { error } = await admin.from('profiles').update({ [column]: managerId }).eq('id', personId);
  if (error) return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });

  // ── Tell the people it happened to ──────────────────────────────────
  // Assignment used to be silent: a manager acquired a teacher and a teacher
  // acquired a manager, and neither was told. Both then had to notice by
  // chance, which at any real volume means nobody notices at all.
  //
  // Never allowed to fail the assignment — the relationship is already saved,
  // and a lost notification is a far smaller problem than a 500 on an action
  // that actually succeeded.
  if (managerId) {
    try {
      const { data: manager } = await admin.from('profiles').select('full_name').eq('id', managerId).maybeSingle();

      const personName = person.full_name ?? `a ${kind}`;
      const managerName = manager?.full_name ?? 'a manager';
      const roleLabel = body.field === 'admin' ? 'Admin' : 'HR';
      const theirWork = kind === 'seller' ? 'leads, sales and payouts' : 'schedule and classes';
      const askAbout = kind === 'seller' ? 'your leads, incentives or pay' : 'your schedule, batches or pay';

      // Assignment is worth an email as well as a bell: it changes who someone
      // reports to, and a person who misses it does not know who to ask about
      // their pay. Most notifications should NOT do this — every unnecessary
      // email makes the next one easier to ignore.
      await notifyUsers([
        {
          userId: managerId,
          type: 'system',
          title: `${personName} now reports to you`,
          message: `You are the reporting ${roleLabel} for ${personName}. Their ${theirWork} are on your dashboard.`,
          link: body.field === 'admin' ? '/dashboard/admin' : '/dashboard/hr',
          email: true,
        },
        {
          userId: personId,
          type: 'system',
          title: `${managerName} is your reporting ${roleLabel}`,
          message: `Reach out to ${managerName} for anything about ${askAbout}.`,
          link: kind === 'seller' ? '/dashboard/seller' : '/dashboard/teacher',
          email: true,
        },
      ]);
    } catch (err) {
      console.warn('[assign-manager] notification skipped:', err instanceof Error ? err.message : String(err));
    }
  }

  return NextResponse.json({ ok: true, kind });
}
