import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { DOMAINS } from '@/lib/capabilities/taxonomy';

/**
 * SARIRO — POST /api/learner/goals
 * Body: { capabilitySlug, statement?, source? }
 *
 * Records that a learner wants to become capable of something. The first action
 * available anywhere on the capability map.
 *
 * Service role rather than the browser client: the slug is validated against the
 * authored map before it touches the table, so a goal can never point at a
 * capability that does not exist and quietly orphan itself.
 */

export const runtime = 'nodejs';

interface GoalBody {
  capabilitySlug?: string;
  statement?: string;
  source?: 'explore' | 'strand' | 'onboarding' | 'mentor' | 'course';
  website?: string;
}

/** Strand slugs from the authored map — the only values this route accepts. */
const VALID_SLUGS = new Set(DOMAINS.flatMap((d) => d.strands.map((s) => s.slug)));
const VALID_SOURCES = ['explore', 'strand', 'onboarding', 'mentor', 'course'];
const MAX_STATEMENT = 500;

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `learner-goals:${requestIp}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: GoalBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ ok: true });

  if (!body.capabilitySlug || !VALID_SLUGS.has(body.capabilitySlug)) {
    return NextResponse.json({ ok: false, error: 'unknown_capability' }, { status: 400 });
  }
  const source = body.source && VALID_SOURCES.includes(body.source) ? body.source : 'strand';
  const statement = body.statement?.trim().slice(0, MAX_STATEMENT) || null;

  let supabase;
  try {
    supabase = await createServerClientHelper();
  } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Not an error the caller should hide: the UI sends them to sign-up and brings
  // them straight back to the strand they were standing on.
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 });
  }

  // Pressing "Start this" twice is enthusiasm, not a second goal. Re-pressing
  // after dropping it revives the goal rather than creating a duplicate.
  const { error } = await admin
    .from('learner_goals')
    .upsert(
      {
        learner_id: user.id,
        capability_slug: body.capabilitySlug,
        statement,
        source,
        status: 'wanted',
      },
      { onConflict: 'learner_id,capability_slug' }
    );

  if (error) {
    console.warn('[goals] upsert failed:', error.message);
    return NextResponse.json({ ok: false, error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, capabilitySlug: body.capabilitySlug });
}

/** The caller's own goals — used to show "you're on this" instead of "Start this". */
export async function GET(req: NextRequest) {
  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let supabase;
  try {
    supabase = await createServerClientHelper();
  } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, goals: [] });

  // RLS restricts this to the caller's own rows.
  const { data, error } = await supabase
    .from('learner_goals')
    .select('capability_slug, status, created_at')
    .eq('learner_id', user.id)
    .neq('status', 'dropped');

  if (error) {
    console.warn('[goals] read failed:', error.message);
    return NextResponse.json({ ok: true, goals: [] });
  }

  return NextResponse.json({ ok: true, goals: data ?? [] });
}
