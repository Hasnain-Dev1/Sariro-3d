import { NextRequest, NextResponse } from 'next/server';
import { aiGate, aiSwitchedOn } from '@/lib/practice/ai-gate';
import { streamText } from '@/lib/practice/ai-stream';
import { geminiStream, turn } from '@/lib/practice/gemini';
import { parseTutorInput, tutorContext, TUTOR_SYSTEM } from '@/lib/practice/lab/tutor-prompt';

/**
 * SARIRO — POST /api/practice/tutor — the Code Lab's AI tutor
 * ============================================================================
 * Streams a short, Socratic answer from Gemini about the learner's challenge,
 * code and last run (lib/practice/lab/tutor-prompt.ts says how it teaches).
 *
 * Every call costs money, so it goes through lib/practice/ai-gate.ts first:
 * same-origin, signed in, on a coding course (or staff), a burst limit, and one
 * call off the daily allowance counted in the database. It FAILS CLOSED — no
 * key, or no counter, and the answer is 503 "tutor_off"; the lab's built-in
 * guide answers instead. There is never an unmetered call.
 *
 * Model: GEMINI_MODEL, default gemini-flash-latest (lib/practice/gemini.ts).
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

  const history = input.messages.slice(0, -1).map((m) =>
    turn(m.role, m.role === 'user' ? `<student_message>\n${m.content}\n</student_message>` : m.content));
  const last = input.messages[input.messages.length - 1];
  const turns = [...history, turn('user', `${context}\n\n<student_message>\n${last.content}\n</student_message>`)];

  const stop = new AbortController();
  const pieces = geminiStream(gate.ai, { system: TUTOR_SYSTEM, turns, maxTokens: 8192 }, { signal: stop.signal });
  return streamText(pieces, gate.left, () => stop.abort());
}
