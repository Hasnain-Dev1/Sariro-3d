import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { trialSubjects } from '@/lib/trial/subjects';

/**
 * SARIRO — GET /api/trial/subjects
 *
 * The subjects a family can actually be given a class in, right now.
 *
 * ── Why this is not just the catalogue ──────────────────────────────────────
 * The catalogue has twenty-eight entries. Exactly five of them have a teacher
 * who is approved to teach them AND has a room to teach them in — the rest are
 * courses the company sells but has nobody free to demonstrate.
 *
 * Offering all twenty-eight was the state this page shipped in for one commit,
 * and it is worse than it sounds: the marketing page above the form promises
 * "maths, science, English, coding or public speaking", so the three subjects a
 * parent is most likely to pick were the three guaranteed to answer "no teacher
 * available". A dead end reached AFTER choosing is more damaging than a shorter
 * list, because the family has already decided to buy by then.
 *
 * So the list is what can be delivered today, and it grows by itself the moment
 * a teacher is approved for something new — no deploy, no second list to keep
 * in step.
 *
 * ── Public, and deliberately thin ───────────────────────────────────────────
 * No session: the visitor arrived from an advert. It returns subject names and
 * nothing else — never which teacher, never how many, never their hours. That
 * is the shape of the business and it is not for publishing.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `trial-subjects:${ip}`, limit: 60, windowMs: 60_000, ip });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  try {
    const admin = createServiceClient();

    const [{ data: teachers }, { data: approvals }] = await Promise.all([
      admin.from('profiles').select('id, timezone, meet_url').or('role.eq.teacher,is_teacher.eq.true'),
      admin.from('teacher_course_assignments').select('teacher_id, track'),
    ]);

    /* A teacher with no room cannot take a trial — a trial has no cohort to
       inherit a join link from, so the child would arrive at a class with no
       door. Their approvals do not count towards what we can offer. */
    const bookable = new Set(
      ((teachers ?? []) as { id: string; timezone: string | null; meet_url: string | null }[])
        .filter((t) => t.timezone && t.meet_url)
        .map((t) => t.id)
    );

    const covered = new Set(
      ((approvals ?? []) as { teacher_id: string; track: string | null }[])
        .filter((a) => bookable.has(a.teacher_id) && a.track)
        .map((a) => String(a.track).toLowerCase())
    );

    const offered = trialSubjects().filter((s) => covered.has(s.value.toLowerCase()));

    /* Nobody approved for anything, or the table is empty. Falling back to the
       whole catalogue would put the dead ends back; returning nothing lets the
       page say "leave your number" instead, which is at least true. */
    return NextResponse.json({ ok: true, subjects: offered });
  } catch (err) {
    console.warn('[trial-subjects] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, subjects: [] });
  }
}
