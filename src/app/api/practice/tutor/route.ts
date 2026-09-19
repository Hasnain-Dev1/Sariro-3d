import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { roomsFor } from '@/lib/practice/rooms';
import { parseTutorInput, tutorContext, TUTOR_SYSTEM } from '@/lib/practice/lab/tutor-prompt';

/**
 * SARIRO — POST /api/practice/tutor — the Code Lab's AI tutor
 * ============================================================================
 * Streams a short, Socratic answer from Claude about the learner's challenge,
 * code and last run (lib/practice/lab/tutor-prompt.ts says how it teaches).
 *
 * Every call costs money, so the door is narrow:
 *   · same-origin, signed in, and enrolled in a coding course (or staff);
 *   · a burst limit per address, and a daily count per learner kept in the
 *     database (scripts/ai-tutor.sql) — TUTOR_DAILY_LIMIT, 20 if unset;
 *   · it FAILS CLOSED: no ANTHROPIC_API_KEY, or no counter table yet, and the
 *     answer is 503 "tutor_off" — the lab's built-in guide answers instead.
 *     There is never an unmetered call.
 *
 * Model: TUTOR_MODEL, default claude-opus-5 at low effort (short replies), with
 * Anthropic's server-side fallback on, so a classifier decline is retried on the
 * recommended model instead of leaving a learner with no answer.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const off = (reason: string) => NextResponse.json({ ok: false, error: 'tutor_off', reason }, { status: 503 });

/** Whether the AI tutor is switched on at all — the lab shows "AI" or "Guide". Says nothing else. */
export function GET() {
  return NextResponse.json({ ai: !!process.env.ANTHROPIC_API_KEY }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `practice-tutor:${ip}`, limit: 12, windowMs: 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Slow down a little — ask again in a moment.');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return off('no_key');

  let input;
  try { input = parseTutorInput(await req.json()); } catch { input = null; }
  if (!input) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  const context = tutorContext(input);
  if (!context) return NextResponse.json({ ok: false, error: 'unknown_challenge' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return off('no_database'); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try { admin = createServiceClient(); } catch { return off('no_service_role'); }

  // Coding learners — and staff, who need to try it.
  const [{ data: enrolments }, { data: profile }] = await Promise.all([
    admin.from('enrollments').select('track, status, level, created_at').eq('user_id', user.id),
    admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle(),
  ]);
  const staff = ['admin', 'super_admin', 'teacher'].includes(String(profile?.role ?? '')) || !!profile?.is_admin || !!profile?.is_super_admin;
  const coding = roomsFor(enrolments ?? []).find((r) => r.room.id === 'coding');
  if (!staff && !coding?.allowed) return NextResponse.json({ ok: false, error: 'not_enrolled' }, { status: 403 });

  // One question off today's allowance, atomically. NULL = already at the limit.
  const limit = Math.max(1, Math.min(500, Number(process.env.TUTOR_DAILY_LIMIT) || 20));
  const { data: used, error: countError } = await admin.rpc('ai_tutor_take', { p_user: user.id, p_limit: limit });
  if (countError) return off('no_counter');
  if (used == null) {
    return NextResponse.json({ ok: false, error: 'limit', limit, message: `That's all ${limit} tutor questions for today. The lab's guide still helps — and the tutor is back tomorrow.` }, { status: 429 });
  }

  const client = new Anthropic({ apiKey });
  const history = input.messages.slice(0, -1).map((m) => ({
    role: m.role,
    content: m.role === 'user' ? `<student_message>\n${m.content}\n</student_message>` : m.content,
  }));
  const last = input.messages[input.messages.length - 1];
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history,
    { role: 'user', content: `${context}\n\n<student_message>\n${last.content}\n</student_message>` },
  ];

  const stream = client.beta.messages.stream({
    model: process.env.TUTOR_MODEL || 'claude-opus-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: TUTOR_SYSTEM,
    messages,
  });

  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            wrote = true;
            controller.enqueue(enc.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          controller.enqueue(enc.encode(`${wrote ? '\n\n' : ''}Let's keep to the challenge — which part is tricky right now?`));
        } else if (!wrote) {
          controller.enqueue(enc.encode('Tell me which part is confusing and we will work through it together.'));
        }
      } catch (err) {
        const busy = err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError;
        controller.enqueue(enc.encode(`${wrote ? '\n\n' : ''}${busy ? 'The tutor is busy right now — try again in a minute.' : 'The tutor lost its connection — ask again.'}`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Tutor-Left': String(Math.max(0, limit - Number(used))),
    },
  });
}
