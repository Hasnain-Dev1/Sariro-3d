import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { readCourses } from '@/lib/dashboard/course-picks';

export const runtime = 'nodejs';

/* These were two hand-maintained lists and both were wrong.
   VALID_TRACKS was TRACKS — the coding catalogue — so a super-admin could not
   make anybody eligible for Mathematics, Science or Public Speaking, which is
   every course the company actually sells. Every eligibility row on the live
   database is a coding track for exactly that reason.
   VALID_LEVELS was capitalised while cohorts store lowercase, so the two
   halves of one product disagreed about what a level looks like.
   checkCourse() derives both from the same catalogue the picker renders, so a
   course that can be chosen is a course that can be saved.

   Every action takes a LIST of courses (`courses: [{ track, level }]`, up to
   80) as well as the old single `track` + `level`, so a teacher can be made
   eligible for a whole subject in one request. `assign` with `trained: true`
   also marks their training complete (super-admin only) — add and approve in
   one step instead of two per course. A course they were already trained for
   keeps its original training date. */

interface AssignBody {
  action?: 'assign' | 'remove' | 'complete_training' | 'revoke_training';
  teacher_id?: string;
  track?: string;
  level?: string;
  courses?: unknown;
  /** assign only: also mark the training complete (super-admin). */
  trained?: boolean;
  website?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `teacher-assignments:${requestIp}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: AssignBody;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action || !body.teacher_id) return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 });
  const read = readCourses(body.courses, { track: body.track, level: body.level });
  if (!read.ok) {
    return NextResponse.json({ ok: false, error: read.code, message: read.message }, { status: 400 });
  }
  const courses = read.courses;

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (role !== 'admin' && role !== 'super_admin') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable', message: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 503 }); }

  const { data: teacherProfile } = await admin.from('profiles').select('id, role, is_teacher').eq('id', body.teacher_id).maybeSingle();
  if (!teacherProfile) return NextResponse.json({ ok: false, error: 'teacher_not_found' }, { status: 404 });
  // Accept either a 'teacher' role OR the is_teacher flag — a profile can carry
  // is_teacher=true while its primary role says something else.
  const isTeacher = teacherProfile.role === 'teacher' || teacherProfile.is_teacher === true;
  if (!isTeacher) return NextResponse.json({ ok: false, error: 'not_a_teacher' }, { status: 400 });

  const teacherId = body.teacher_id;
  const trainingForbidden = () => NextResponse.json({ ok: false, error: 'forbidden', message: 'Only a super-admin can mark course training complete.' }, { status: 403 });
  /* Training for each course separately: .in() on track and on level would
     also catch the cross-pairs (Maths G9 when the list said Maths G5 and
     Physics G9). `onlyUntrained` leaves an earlier training date alone. */
  const setTraining = async (complete: boolean, onlyUntrained: boolean) => {
    const patch = complete
      ? { training_completed_at: new Date().toISOString(), training_completed_by: user.id }
      : { training_completed_at: null, training_completed_by: null };
    const results = await Promise.all(courses.map((c) => {
      let q = admin.from('teacher_course_assignments').update(patch).eq('teacher_id', teacherId).eq('track', c.track).eq('level', c.level);
      if (onlyUntrained) q = q.is('training_completed_at', null);
      return q;
    }));
    return results.find((r) => r.error)?.error ?? null;
  };

  try {
    if (body.action === 'assign') {
      if (body.trained && role !== 'super_admin') return trainingForbidden();
      /* Stored lowercase, matching how cohorts store theirs. */
      const rows = courses.map((c) => ({ teacher_id: teacherId, track: c.track, level: c.level.toLowerCase(), assigned_by: user.id }));
      const { error: insertErr } = await admin.from('teacher_course_assignments').upsert(rows, { onConflict: 'teacher_id,track,level' });
      if (insertErr) return NextResponse.json({ ok: false, error: 'insert_failed', message: insertErr.message }, { status: 500 });
      if (body.trained) {
        courses.forEach((c) => { c.level = c.level.toLowerCase(); });
        const trainErr = await setTraining(true, true);
        if (trainErr) return NextResponse.json({ ok: false, error: 'training_update_failed', message: `Added, but the training could not be marked: ${trainErr.message}` }, { status: 500 });
      }
      return NextResponse.json({ ok: true, count: courses.length });
    }
    if (body.action === 'remove') {
      const results = await Promise.all(courses.map((c) =>
        admin.from('teacher_course_assignments').delete().eq('teacher_id', teacherId).eq('track', c.track).eq('level', c.level)));
      const deleteErr = results.find((r) => r.error)?.error;
      if (deleteErr) return NextResponse.json({ ok: false, error: 'delete_failed', message: deleteErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, count: courses.length });
    }
    // Training completion gates whether a teacher can be picked in the scheduler.
    // Only a super-admin may mark/revoke a teacher's course training.
    if (body.action === 'complete_training' || body.action === 'revoke_training') {
      if (role !== 'super_admin') return trainingForbidden();
      const complete = body.action === 'complete_training';
      const upErr = await setTraining(complete, complete);
      if (upErr) return NextResponse.json({ ok: false, error: 'training_update_failed', message: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, count: courses.length });
    }
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  } catch (err) {
    console.warn('[teacher-assignments] action error:', err);
    return NextResponse.json({ ok: false, error: 'action_failed', message: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}