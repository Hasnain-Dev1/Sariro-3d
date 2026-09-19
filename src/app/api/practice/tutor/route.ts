import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { aiGate, aiSwitchedOn } from '@/lib/practice/ai-gate';
import { streamText } from '@/lib/practice/ai-stream';
import { parseTutorInput, tutorContext, TUTOR_SYSTEM } from '@/lib/practice/lab/tutor-prompt';

/**
 * SARIRO — POST /api/practice/tutor — the Code Lab's AI tutor
 * ============================================================================
 * Streams a short, Socratic answer from Claude about the learner's challenge,
 * code and last run (lib/practice/lab/tutor-prompt.ts says how it teaches).
 *
 * Every call costs money, so it goes through lib/practice/ai-gate.ts first:
 * same-origin, signed in, on a coding course (or staff), a burst limit, and one
 * call off the daily allowance counted in the database. It FAILS CLOSED — no
 * key, or no counter, and the answer is 503 "tutor_off"; the lab's built-in
 * guide answers instead. There is never an unmetered call.
 *
 * Model: TUTOR_MODEL, default claude-opus-5 at low effort (short replies), with
 * Anthropic's server-side fallback on, so a classifier decline is retried on the
 * recommended model instead of leaving a learner with no answer.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Whether the AI tutor is switched on at all — the lab shows "AI" or "Guide". Says nothing else. */
export function GET() {
  return NextResponse.json({ ai: aiSwitchedOn() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  // Read the body first: a malformed request should not spend an allowance.
  let input;
  try { input = parseTutorInput(await req.json()); } catch { input = null; }
  if (!input) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  const context = tutorContext(input);
  if (!context) return NextResponse.json({ ok: false, error: 'unknown_challenge' }, { status: 400 });

  const gate = await aiGate(req, 'coding', 'practice-tutor');
  if (!gate.ok) return gate.response;

  const client = new Anthropic({ apiKey: gate.apiKey });
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

  return streamText(stream, gate.left);
}
