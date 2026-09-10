import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { summariseCase, readEscalationConfig, type CatchUpObligation } from '@/lib/credits/catchup-escalation';

/**
 * SARIRO — GET /api/admin/catchup-overdue
 *
 * The cases that have stopped being only the teacher's problem.
 *
 * ── This route exists to return an empty list ───────────────────────────────
 * The founder's rule: the Super Admin is an exception layer, not a step. For
 * the first three days a catch-up obligation is entirely between a teacher and
 * their reminders, and nothing here shows it. Only a missed deadline puts a
 * case in front of anybody else.
 *
 * A panel that listed every obligation would be ignored within a fortnight,
 * and then the one case that genuinely needed a person would be sitting in the
 * middle of forty that did not.
 *
 * ── Everything about responsibility in one row ──────────────────────────────
 * §34: nobody should have to open three modules to work out who to ring. The
 * student, the teacher, the teacher's own admin and their HR contact all come
 * back together, because the question being asked is not "what is late" — it
 * is "who has not done something about it".
 *
 * An admin sees the teachers reporting to them; a super-admin sees everyone.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `catchup-overdue:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let supa;
  try { supa = await createServerClientHelper(); } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const admin = createServiceClient();
  const { data: me } = await admin
    .from('profiles').select('role, is_admin, is_super_admin, is_hr').eq('id', user.id).maybeSingle();
  const role = me?.role
    ?? (me?.is_super_admin ? 'super_admin' : me?.is_admin ? 'admin' : me?.is_hr ? 'hr' : 'student');
  if (!['admin', 'super_admin', 'hr'].includes(role as string)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const seesEveryone = role === 'super_admin' || role === 'hr';

  const { data: settingRows } = await admin.from('app_settings').select('key, value');
  const config = readEscalationConfig(
    Object.fromEntries(((settingRows ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]))
  );

  const { data: rows, error } = await admin
    .from('catchup_lessons')
    .select('id, student_id, teacher_id, track, level, lesson_number, lesson_title, status, created_at, scheduling_deadline, scheduled_at, completed_at')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ ok: false, error: 'query_failed', message: error.message }, { status: 500 });
  }

  const lessons = (rows ?? []) as Record<string, unknown>[];
  if (lessons.length === 0) return NextResponse.json({ ok: true, cases: [] });

  const peopleIds = [...new Set(lessons.flatMap((l) => [String(l.student_id), String(l.teacher_id ?? '')]).filter(Boolean))];
  const { data: peopleRaw } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, reporting_admin_id, reporting_hr_id')
    .in('id', peopleIds);
  const people = new Map(
    ((peopleRaw ?? []) as Record<string, unknown>[]).map((p) => [String(p.id), p])
  );

  /* The teacher's own admin and HR contact, resolved one level up. §31 — this
     mapping already existed on profiles as reporting_admin_id / reporting_hr_id
     and is reused rather than duplicated. */
  const managerIds = [...new Set(
    [...people.values()].flatMap((p) => [p.reporting_admin_id, p.reporting_hr_id])
      .filter(Boolean).map(String)
  )];
  const { data: managersRaw } = managerIds.length
    ? await admin.from('profiles').select('id, full_name, email').in('id', managerIds)
    : { data: [] };
  const managers = new Map(
    ((managersRaw ?? []) as { id: string; full_name: string | null; email: string | null }[])
      .map((m) => [m.id, m])
  );

  const now = Date.now();
  const byPair = new Map<string, Record<string, unknown>[]>();
  for (const l of lessons) {
    const key = `${l.student_id}|${l.teacher_id ?? ''}`;
    byPair.set(key, [...(byPair.get(key) ?? []), l]);
  }

  const cases = [...byPair.values()]
    .map((ls) => {
      const obligations: CatchUpObligation[] = ls.map((l) => ({
        id: String(l.id),
        lessonNumber: Number(l.lesson_number),
        lessonTitle: (l.lesson_title as string | null) ?? null,
        createdAt: String(l.created_at),
        scheduledAt: (l.scheduled_at as string | null) ?? null,
        completedAt: (l.completed_at as string | null) ?? null,
      }));
      const summary = summariseCase(obligations, now, config);
      const student = people.get(String(ls[0].student_id));
      const teacher = ls[0].teacher_id ? people.get(String(ls[0].teacher_id)) : null;
      const theirAdmin = teacher?.reporting_admin_id ? managers.get(String(teacher.reporting_admin_id)) : null;
      const theirHr = teacher?.reporting_hr_id ? managers.get(String(teacher.reporting_hr_id)) : null;

      return {
        studentId: String(ls[0].student_id),
        studentName: (student?.full_name as string) ?? (student?.email as string) ?? 'Student',
        studentEmail: (student?.email as string | null) ?? null,
        studentPhone: (student?.phone as string | null) ?? null,
        course: [ls[0].track, ls[0].level].filter(Boolean).join(' · ') || null,
        teacherId: (ls[0].teacher_id as string | null) ?? null,
        teacherName: (teacher?.full_name as string | null) ?? null,
        teacherEmail: (teacher?.email as string | null) ?? null,
        teacherPhone: (teacher?.phone as string | null) ?? null,
        adminName: (theirAdmin?.full_name as string | null) ?? null,
        adminEmail: (theirAdmin?.email as string | null) ?? null,
        hrName: (theirHr?.full_name as string | null) ?? null,
        hrEmail: (theirHr?.email as string | null) ?? null,
        summary,
      };
    })
    /* §29 — only what has actually passed a deadline. Everything inside the
       window belongs to the teacher and their reminders, and putting it here
       would be exactly the clutter this design exists to avoid. */
    .filter((c) => c.summary.escalated)
    .filter((c) => seesEveryone || teacherReportsToMe(c.teacherId, people, user.id))
    .sort((a, b) => b.summary.daysOverdue - a.summary.daysOverdue);

  return NextResponse.json({ ok: true, cases, config });
}

/** An admin sees only the teachers who report to them. */
function teacherReportsToMe(
  teacherId: string | null,
  people: Map<string, Record<string, unknown>>,
  myId: string
): boolean {
  if (!teacherId) return false;
  const t = people.get(teacherId);
  return String(t?.reporting_admin_id ?? '') === myId;
}
