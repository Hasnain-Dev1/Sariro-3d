import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — GET/POST /api/teacher/room
 *
 * A teacher's permanent class room, and the back-fill that makes it count.
 *
 * ── Why this is not a plain profiles update from the browser ────────────────
 * Saving the room has to do two things: write profiles.meet_url, and put that
 * link on every upcoming booking of theirs that has none. The second is a
 * write to `bookings`, which a teacher cannot make under RLS — correctly, as
 * a teacher who could rewrite bookings could rewrite anybody's.
 *
 * So the write goes through here, where the service role does the back-fill
 * after the caller has been proven to be that teacher. `teacher_id = me` is
 * applied server-side to the query itself, never taken from the body.
 *
 * ── Why the back-fill exists at all ─────────────────────────────────────────
 * Every trial booked before today has google_meet_url = NULL. Without a
 * back-fill, setting a room fixes only the trials booked afterwards, and the
 * children already waiting stay locked out of a class that was booked for
 * them. Those are the ones that matter most.
 */
export const runtime = 'nodejs';

/** Loose on purpose — Meet, Zoom, Teams and Whereby look nothing alike. */
const LINK = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i;

async function callerId(): Promise<string | null> {
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const me = await callerId();
  if (!me) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const admin = createServiceClient();
  const { data } = await admin
    .from('profiles')
    .select('meet_url, role, is_teacher')
    .eq('id', me)
    .single();

  if (!data || !(data.role === 'teacher' || data.is_teacher)) {
    return NextResponse.json({ ok: false, error: 'not_a_teacher' }, { status: 403 });
  }

  /* How many children are currently booked in with them and have no way in.
     A teacher will not go looking in Settings for a field they have never
     heard of, so the number has to come and find them. */
  const { count } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', me)
    .is('google_meet_url', null)
    .neq('status', 'cancelled')
    .gt('slot_end', new Date().toISOString());

  return NextResponse.json({
    ok: true,
    meetUrl: data.meet_url ?? null,
    doorless: count ?? 0,
  });
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }

  const me = await callerId();
  if (!me) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let body: { meetUrl?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_body' }, { status: 400 });
  }

  const raw = (body.meetUrl ?? '').toString().trim();
  const meetUrl = raw === '' ? null : raw;
  if (meetUrl !== null && !LINK.test(meetUrl)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'bad_link',
        message: 'That does not look like a link. Paste the whole thing, starting with https://',
      },
      { status: 400 }
    );
  }

  const admin = createServiceClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('role, is_teacher')
    .eq('id', me)
    .single();
  if (!profile || !(profile.role === 'teacher' || profile.is_teacher)) {
    return NextResponse.json({ ok: false, error: 'not_a_teacher' }, { status: 403 });
  }

  const { error: upErr } = await admin
    .from('profiles')
    .update({ meet_url: meetUrl })
    .eq('id', me);
  if (upErr) {
    return NextResponse.json({ ok: false, error: 'save_failed', message: upErr.message }, { status: 500 });
  }

  /* Every upcoming class of theirs, not only the ones with no link.
     ────────────────────────────────────────────────────────────────────────
     This used to fill blanks only. But a teacher who changes their room —
     because the old link stopped working, or they moved from Meet to Zoom —
     had a diary full of classes still pointing at a door that no longer
     opens, and no way to know. "If a teacher at any time updates their link
     it should update the link everywhere, in all the future trial classes
     booked and the already booked ones, immediately."

     Trials only. A cohort class inherits its link from its cohort, which an
     admin owns deliberately — a teacher redirecting a batch's permanent room
     by editing their own profile is not a thing that should be possible. */
  let backfilled = 0;
  if (meetUrl) {
    const { data: patched } = await admin
      .from('bookings')
      .update({ google_meet_url: meetUrl })
      .eq('teacher_id', me)
      .eq('is_trial', true)
      .neq('status', 'cancelled')
      .gt('slot_end', new Date().toISOString())
      .neq('google_meet_url', meetUrl)
      .select('id');
    backfilled = (patched ?? []).length;

    /* A non-trial class with no link at all still gets one — that is a gap
       rather than a deliberate choice, and a student with no button is the
       thing this whole feature exists to stop. */
    const { data: alsoFilled } = await admin
      .from('bookings')
      .update({ google_meet_url: meetUrl })
      .eq('teacher_id', me)
      .neq('is_trial', true)
      .is('google_meet_url', null)
      .neq('status', 'cancelled')
      .gt('slot_end', new Date().toISOString())
      .select('id');
    backfilled += (alsoFilled ?? []).length;
  }

  return NextResponse.json({ ok: true, meetUrl, backfilled });
}
