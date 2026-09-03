import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/credits/requests
 * =========================================================
 * V2 §50-52. A credit request is raised, and the student's balance does not
 * move until HR decides. Approving calls approve_credit_request(), which does
 * the transaction and the balance change in one statement — see
 * scripts/credit-requests.sql for why that is not done here in TypeScript.
 *
 * Body: { action, ... }
 */

export const runtime = 'nodejs';

interface Body {
  action?: 'create' | 'list' | 'decide';
  studentId?: string;
  amount?: number;
  reason?: string;
  enrollmentId?: string;
  cohortId?: string;
  requestId?: string;
  decision?: 'approve' | 'reject';
  approvedAmount?: number;
  notes?: string;
  /** 'pending' (default) or 'all'. */
  scope?: 'pending' | 'all';
  website?: string;
}

type Role = 'student' | 'teacher' | 'seller' | 'hr' | 'admin' | 'super_admin';

const CAN_RAISE: Role[] = ['teacher', 'seller', 'hr', 'admin', 'super_admin'];
const CAN_DECIDE: Role[] = ['hr', 'super_admin'];
const CAN_SEE_ALL: Role[] = ['hr', 'admin', 'super_admin'];

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `credit-req:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action) return NextResponse.json({ ok: false, error: 'missing_action' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  const { data: profile } = await admin
    .from('profiles').select('role, is_teacher, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = (profile?.role
    ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : profile?.is_teacher ? 'teacher' : 'student')) as Role;

  try {
    switch (body.action) {
      /* ── Raise one. The balance deliberately does not move here. ───────── */
      case 'create': {
        if (!CAN_RAISE.includes(role)) {
          return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
        }
        if (!body.studentId) return NextResponse.json({ ok: false, error: 'missing_student' }, { status: 400 });
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return NextResponse.json({ ok: false, error: 'bad_amount' }, { status: 400 });
        }

        // The balance the decision will be judged against.
        const { data: bal } = await admin.from('credits').select('balance').eq('user_id', body.studentId).maybeSingle();

        const { data, error } = await admin.from('credit_requests').insert({
          student_id: body.studentId,
          requested_amount: amount,
          balance_at_request: bal?.balance ?? 0,
          reason: (body.reason ?? '').trim().slice(0, 500) || null,
          enrollment_id: body.enrollmentId ?? null,
          cohort_id: body.cohortId ?? null,
          requested_by: user.id,
        }).select('id').single();
        if (error) throw error;

        // §86: "Credit requested → send HR notification." A request nobody is
        // told about is a request that sits.
        const { data: approvers } = await admin
          .from('profiles').select('id').in('role', ['hr', 'super_admin']).limit(20);
        if (approvers?.length) {
          await admin.from('notifications').insert(
            (approvers as { id: string }[]).map((a) => ({
              user_id: a.id,
              type: 'credit_request',
              title: 'Credit request needs approval',
              message: `${amount} credit${amount === 1 ? '' : 's'} requested.`,
              link: '/dashboard/hr',
            }))
          );
        }

        return NextResponse.json({ ok: true, id: data.id });
      }

      /* ── The queue, or "what happened to mine" ─────────────────────────── */
      case 'list': {
        let q = admin
          .from('credit_requests')
          .select('id, student_id, requested_amount, balance_at_request, reason, enrollment_id, cohort_id, requested_by, created_at, status, approved_amount, decided_by, decided_at, hr_notes')
          .order('created_at', { ascending: false })
          .limit(200);

        // Staff who cannot see everything see only what they raised. RLS says
        // the same thing; this keeps the service client honest.
        if (!CAN_SEE_ALL.includes(role)) q = q.eq('requested_by', user.id);
        if (body.scope !== 'all') q = q.eq('status', 'requested');

        const { data, error } = await q;
        if (error) throw error;

        const rows = (data ?? []) as Record<string, unknown>[];
        const ids = [...new Set(rows.flatMap((r) => [r.student_id, r.requested_by, r.decided_by]).filter(Boolean) as string[])];
        const { data: people } = ids.length
          ? await admin.from('profiles').select('id, full_name, email, role').in('id', ids)
          : { data: [] as Record<string, unknown>[] };
        const byId = new Map(((people ?? []) as Record<string, unknown>[]).map((p) => [p.id as string, p]));

        const name = (id: unknown) => {
          const p = byId.get(id as string);
          return p ? ((p.full_name as string) || (p.email as string) || 'Someone') : null;
        };

        return NextResponse.json({
          ok: true,
          role,
          canDecide: CAN_DECIDE.includes(role),
          requests: rows.map((r) => ({
            ...r,
            student_name: name(r.student_id),
            requested_by_name: name(r.requested_by),
            decided_by_name: name(r.decided_by),
          })),
        });
      }

      /* ── The decision ─────────────────────────────────────────────────── */
      case 'decide': {
        if (!CAN_DECIDE.includes(role)) {
          return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
        }
        if (!body.requestId) return NextResponse.json({ ok: false, error: 'missing_request' }, { status: 400 });

        // The functions run as the caller so auth.uid() stamps the real
        // approver, not the service role.
        const asUser = supabase;

        if (body.decision === 'reject') {
          const { error } = await asUser.rpc('reject_credit_request', {
            p_request_id: body.requestId,
            p_notes: (body.notes ?? '').trim().slice(0, 500) || null,
          });
          if (error) throw error;
          return NextResponse.json({ ok: true, balance: null });
        }

        const approved = body.approvedAmount === undefined ? null : Number(body.approvedAmount);
        if (approved !== null && (!Number.isFinite(approved) || approved <= 0)) {
          return NextResponse.json({ ok: false, error: 'bad_amount' }, { status: 400 });
        }

        const { data, error } = await asUser.rpc('approve_credit_request', {
          p_request_id: body.requestId,
          p_amount: approved,
          p_notes: (body.notes ?? '').trim().slice(0, 500) || null,
        });
        if (error) throw error;

        // Tell the student their balance changed (§75, §86).
        const { data: reqRow } = await admin
          .from('credit_requests').select('student_id, approved_amount').eq('id', body.requestId).maybeSingle();
        if (reqRow?.student_id) {
          await admin.from('notifications').insert({
            user_id: reqRow.student_id,
            type: 'credit_update',
            title: 'Credits added',
            message: `${reqRow.approved_amount} credit${Number(reqRow.approved_amount) === 1 ? '' : 's'} were added to your balance.`,
            link: '/dashboard/student',
          });
        }

        return NextResponse.json({ ok: true, balance: data });
      }

      default:
        return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    const needsMigration = /relation .* does not exist|could not find|schema cache|function .* does not exist/i.test(message);
    return NextResponse.json(
      { ok: false, error: needsMigration ? 'migration_missing' : 'server_error', message },
      { status: needsMigration ? 503 : 500 }
    );
  }
}
