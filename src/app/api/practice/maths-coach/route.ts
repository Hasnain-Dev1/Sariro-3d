import { NextRequest, NextResponse } from 'next/server';
import { aiGate, aiSwitchedOn } from '@/lib/practice/ai-gate';
import { streamText } from '@/lib/practice/ai-stream';
import { GeminiError, geminiJson, geminiSchema, geminiStream, turn, type GeminiPart } from '@/lib/practice/gemini';
import { clampRating, coachContext, coachSystem, GUIDE_BRIEF, parseCoachInput, ReviewSchema, SolutionSchema, verdictOf } from '@/lib/practice/maths/coach';

/**
 * SARIRO — POST /api/practice/maths-coach — the Maths room's AI coach
 * ============================================================================
 *   solve / another  → { ok, kind: 'solution', data }   a worked solution (JSON)
 *   check            → { ok, kind: 'review', data }     a marked piece of working (JSON)
 *   guide            → a streamed, one-step-at-a-time conversation (text)
 *
 * The problem and the working can be typed or photographed (Gemini reads the
 * image). Every call goes through lib/practice/ai-gate.ts — on a maths course
 * (or staff), a burst limit, and one call off the daily allowance shared with
 * the Code Lab tutor. It fails closed.
 *
 * Model: GEMINI_MODEL, default gemini-flash-latest (lib/practice/gemini.ts).
 * The JSON answers are shaped by the zod schemas in lib/practice/maths/coach.ts
 * (sent to Gemini as its responseSchema) and checked against them again here,
 * so a malformed answer never reaches the page.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SOLUTION_SHAPE = geminiSchema(SolutionSchema);
const REVIEW_SHAPE = geminiSchema(ReviewSchema);

export function GET() {
  return NextResponse.json({ ai: aiSwitchedOn() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  let input;
  try { input = parseCoachInput(await req.json()); } catch { input = null; }
  if (!input) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const gate = await aiGate(req, 'maths', 'maths-coach');
  if (!gate.ok) return gate.response;

  const system = coachSystem(input.grade);
  // The photo goes before the text it belongs to.
  const image: GeminiPart[] = input.image ? [{ inlineData: { mimeType: input.image.media_type, data: input.image.data } }] : [];

  if (input.mode === 'guide') {
    const said = input.messages!;
    const history = said.slice(0, -1).map((m) =>
      turn(m.role, m.role === 'user' ? `<student_message>\n${m.content}\n</student_message>` : m.content));
    const last = said[said.length - 1];
    const turns = [...history, turn('user', `${coachContext(input)}\n\n<student_message>\n${last.content}\n</student_message>`, image)];
    const stop = new AbortController();
    const pieces = geminiStream(gate.ai, { system: `${system}\n\n${GUIDE_BRIEF}`, turns, maxTokens: 8192 }, { signal: stop.signal });
    return streamText(pieces, gate.left, () => stop.abort());
  }

  const review = input.mode === 'check';
  const left = gate.left;
  const noAnswer = () => NextResponse.json({ ok: false, error: 'no_answer', message: 'The coach could not finish that one — try asking again.', left }, { status: 502 });
  try {
    const raw = await geminiJson(gate.ai, {
      system,
      turns: [turn('user', coachContext(input), image)],
      maxTokens: 16384,
      schema: review ? REVIEW_SHAPE : SOLUTION_SHAPE,
    });
    const headers = { 'Cache-Control': 'no-store' };
    if (review) {
      const parsed = ReviewSchema.safeParse(raw);
      if (!parsed.success) return noAnswer();
      const data = parsed.data;
      const r = data.ratings;
      data.ratings = { understanding: clampRating(r.understanding), method: clampRating(r.method), accuracy: clampRating(r.accuracy), presentation: clampRating(r.presentation) };
      data.verdict = verdictOf(data.verdict);
      return NextResponse.json({ ok: true, kind: 'review', data, left }, { headers });
    }
    const parsed = SolutionSchema.safeParse(raw);
    if (!parsed.success) return noAnswer();
    return NextResponse.json({ ok: true, kind: 'solution', data: parsed.data, left }, { headers });
  } catch (err) {
    const kind = err instanceof GeminiError ? err.kind : 'failed';
    if (kind === 'blocked') return NextResponse.json({ ok: false, error: 'refused', message: 'The coach can only help with maths problems.', left }, { status: 200 });
    if (kind === 'empty') return noAnswer();
    if (kind !== 'busy') console.error('[maths-coach]', err instanceof Error ? err.message : err);
    const busy = kind === 'busy';
    return NextResponse.json({ ok: false, error: busy ? 'busy' : 'failed', message: busy ? 'The coach is busy right now — try again in a minute.' : 'The coach could not be reached — try again.', left }, { status: 503 });
  }
}
