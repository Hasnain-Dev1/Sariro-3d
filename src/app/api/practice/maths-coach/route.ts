import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { aiGate, aiSwitchedOn } from '@/lib/practice/ai-gate';
import { streamText } from '@/lib/practice/ai-stream';
import { clampRating, coachContext, coachSystem, GUIDE_BRIEF, parseCoachInput, ReviewSchema, SolutionSchema, verdictOf } from '@/lib/practice/maths/coach';

/**
 * SARIRO — POST /api/practice/maths-coach — the Maths room's AI coach
 * ============================================================================
 *   solve / another  → { ok, kind: 'solution', data }   a worked solution (JSON)
 *   check            → { ok, kind: 'review', data }     a marked piece of working (JSON)
 *   guide            → a streamed, one-step-at-a-time conversation (text)
 *
 * The problem and the working can be typed or photographed (Claude reads the
 * image). Every call goes through lib/practice/ai-gate.ts — on a maths course
 * (or staff), a burst limit, and one call off the daily allowance shared with
 * the Code Lab tutor. It fails closed.
 *
 * Model: TUTOR_MODEL, default claude-opus-5, with Anthropic's server-side
 * fallback on. A worked solution runs at low effort (school maths); marking a
 * student's working at medium, because finding the first wrong line in
 * someone else's handwriting deserves the care.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ ai: aiSwitchedOn() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  let input;
  try { input = parseCoachInput(await req.json()); } catch { input = null; }
  if (!input) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const gate = await aiGate(req, 'maths', 'maths-coach');
  if (!gate.ok) return gate.response;

  const client = new Anthropic({ apiKey: gate.apiKey });
  const model = process.env.TUTOR_MODEL || 'claude-opus-5';
  const system = coachSystem(input.grade);
  const image: Anthropic.Beta.BetaContentBlockParam[] = input.image
    ? [{ type: 'image', source: { type: 'base64', media_type: input.image.media_type, data: input.image.data } }]
    : [];

  if (input.mode === 'guide') {
    const turns = input.messages!;
    const history = turns.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.role === 'user' ? `<student_message>\n${m.content}\n</student_message>` : m.content,
    }));
    const last = turns[turns.length - 1];
    const stream = client.beta.messages.stream({
      model,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: `${system}\n\n${GUIDE_BRIEF}`,
      messages: [
        ...history,
        { role: 'user', content: [...image, { type: 'text', text: `${coachContext(input)}\n\n<student_message>\n${last.content}\n</student_message>` }] },
      ],
    });
    return streamText(stream, gate.left);
  }

  const review = input.mode === 'check';
  try {
    const res = await client.beta.messages.parse({
      model,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: review ? 'medium' : 'low',
        format: review ? betaZodOutputFormat(ReviewSchema) : betaZodOutputFormat(SolutionSchema),
      },
      system,
      messages: [{ role: 'user', content: [...image, { type: 'text', text: coachContext(input) }] }],
    });
    if (res.stop_reason === 'refusal') {
      return NextResponse.json({ ok: false, error: 'refused', message: 'The coach can only help with maths problems.', left: gate.left }, { status: 200 });
    }
    const data = res.parsed_output;
    if (!data) return NextResponse.json({ ok: false, error: 'no_answer', message: 'The coach could not finish that one — try asking again.', left: gate.left }, { status: 502 });
    if (review && 'ratings' in data) {
      const r = data.ratings;
      data.ratings = { understanding: clampRating(r.understanding), method: clampRating(r.method), accuracy: clampRating(r.accuracy), presentation: clampRating(r.presentation) };
      data.verdict = verdictOf(data.verdict);
    }
    return NextResponse.json({ ok: true, kind: review ? 'review' : 'solution', data, left: gate.left }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const busy = err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError;
    return NextResponse.json({ ok: false, error: busy ? 'busy' : 'failed', message: busy ? 'The coach is busy right now — try again in a minute.' : 'The coach could not be reached — try again.', left: gate.left }, { status: 503 });
  }
}
