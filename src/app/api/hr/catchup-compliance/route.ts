import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { deadlineFor, readEscalationConfig } from '@/lib/credits/catchup-escalation';

/**
 * SARIRO — GET /api/hr/catchup-compliance
 *
 * Per teacher: how many catch-up sessions they were given, how many they
 * arranged inside the window, how many ran over, how many they have actually
 * taught, and what that earned them.
 *
 * ── Why HR sees this and not the student side ───────────────────────────────
 * §33: HR's question is about a teacher's reliability, not a family's money.
 * So this returns counts and timings and no student names, no balances and no
 * payment information. Somebody assessing whether a teacher meets their
 * obligations does not need to know which child is behind on their fees, and
 * a screen that shows it anyway will eventually be the reason something leaks.
 *
 * ── On time is measured against the ORIGINAL deadline ───────────────────────
 * Not "did they eventually do it" — a session arranged three weeks late still
 * happened, and counting it as compliant would make the number meaningless.
 * Each obligation is judged against the deadline it was born with, which is
 * also the rule the escalation panel uses, so the two can never disagree.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `catchup-compliance:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let supa;
  try { supa = await createServerClientHelper(); } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const admin = createServiceClient();
  const { data: me } = await admin
    .from('profiles').select('role, is_hr, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = me?.role
    ?? (me?.is_super_admin ? 'super_admin' : me?.is_hr ? 'hr' : me?.is_admin ? 'admin' : 'student');
  if (!['hr', 'admin', 'super_admin'].includes(role as string)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const { data: settingRows } = await admin.from('app_settings').select('key, value');
  const settings = Object.fromEntries(
    ((settingRows ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value])
  );
  const config = readEscalationConfig(settings);
  const incentive = Number(settings.catchup_teacher_incentive) > 0
    ? Number(settings.catchup_teacher_incentive) : 200;

  const { data: rowsRaw } = await admin
    .from('catchup_lessons')
    .select('teacher_id, status, created_at, scheduled_at, completed_at')
    .neq('status', 'cancelled');
  const rows = (rowsRaw ?? []) as {
    teacher_id: string | null; status: string;
    created_at: string; scheduled_at: string | null; completed_at: string | null;
  }[];

  if (rows.length === 0) return NextResponse.json({ ok: true, teachers: [], incentive });

  const teacherIds = [...new Set(rows.map((r) => r.teacher_id).filter(Boolean) as string[])];
  const { data: teachersRaw } = await admin
    .from('profiles').select('id, full_name, email, reporting_admin_id').in('id', teacherIds);
  const teachers = (teachersRaw ?? []) as {
    id: string; full_name: string | null; email: string | null; reporting_admin_id: string | null;
  }[];

  const adminIds = [...new Set(teachers.map((t) => t.reporting_admin_id).filter(Boolean) as string[])];
  const { data: adminsRaw } = adminIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', adminIds)
    : { data: [] };
  const adminName = new Map(
    ((adminsRaw ?? []) as { id: string; full_name: string | null }[]).map((a) => [a.id, a.full_name])
  );

  const now = Date.now();
  const out = teachers.map((t) => {
    const mine = rows.filter((r) => r.teacher_id === t.id);

    let onTime = 0;
    let late = 0;
    let overdueNow = 0;
    let scheduleHours = 0;
    let scheduleCount = 0;

    for (const r of mine) {
      const deadline = deadlineFor(r.created_at, config);
      if (r.scheduled_at) {
        const at = Date.parse(r.scheduled_at);
        // Judged on when it was ARRANGED, not when the session itself falls.
        if (at <= deadline) onTime++; else late++;
        const took = (at - Date.parse(r.created_at)) / 3_600_000;
        if (Number.isFinite(took) && took >= 0) { scheduleHours += took; scheduleCount++; }
      } else if (r.status === 'pending_scheduling' && now > deadline) {
        overdueNow++;
      }
    }

    const completed = mine.filter((r) => r.completed_at).length;
    return {
      teacherId: t.id,
      teacherName: t.full_name ?? t.email ?? 'Teacher',
      adminName: t.reporting_admin_id ? adminName.get(t.reporting_admin_id) ?? null : null,
      assigned: mine.length,
      onTime,
      late,
      /* Still unscheduled and past its deadline — the number that is somebody's
         problem right now, as opposed to a historical failing. */
      overdueNow,
      completed,
      pending: mine.filter((r) => r.status === 'pending_scheduling').length,
      /* Null rather than zero when they have never scheduled anything: an
         average of nothing is not "instant". */
      averageHoursToSchedule: scheduleCount > 0
        ? Math.round((scheduleHours / scheduleCount) * 10) / 10
        : null,
      earned: completed * incentive,
    };
  })
    .filter((t) => t.assigned > 0)
    .sort((a, b) => b.overdueNow - a.overdueNow || b.assigned - a.assigned);

  return NextResponse.json({ ok: true, teachers: out, incentive });
}
