import { NextRequest, NextResponse } from 'next/server';
import {
  matchFaq,
  isGreeting,
  greetingResponse,
  isThanks,
  thanksResponse,
  fallbackResponse,
} from '@/lib/faq-data';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked, recordHoneypotTrip } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { isHoneypotTripped } from '@/lib/security/honeypot';

/**
 * SARIRO Chat API — SLM Preview (keyword-based FAQ matching)
 *
 * This is the v1 "small language model" preview — it does keyword matching
 * against the local FAQ knowledge base (28 entries) and returns the best
 * match. No LLM call yet. This will be upgraded in Step 4 to use the
 * z-ai-web-dev-sdk with RAG context for smarter answers.
 *
 * POST /api/chat
 * Body: { message: string, conversationId?: string }
 * Returns: { reply: string, matchedFaqId?: string, confidence?: number }
 */
export async function POST(req: NextRequest) {
  try {
    // ── CSRF check — same-origin only ──────────────────────────────────
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;

    // ── IP blocklist — instantly 403 known abusers ─────────────────────
    const ip = getClientIp(req);
    if (isIpBlocked(ip)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Rate limit: 30 messages / minute per IP ────────────────────────
    // Public endpoint — no auth. Generous enough for normal use, blocks
    // spam / scraping. Passes `ip` so repeated violations escalate to
    // a 1-hour auto-block.
    const rl = rateLimit({
      key: `chat:${ip}`,
      limit: 30,
      windowMs: 60_000,
      ip,
    });
    if (!rl.ok) {
      return rateLimitedResponse(rl.retryAfterMs, 'Slow down — too many messages.');
    }

    const body = await req.json();

    // ── Honeypot check — if `website` field has any value, it's a bot ──
    // Silently return a fake success so the bot doesn't know it was caught.
    if (isHoneypotTripped(body as Record<string, unknown>)) {
      recordHoneypotTrip(ip);
      return NextResponse.json({ reply: fallbackResponse(), kind: 'faq_match' });
    }

    const message: string = (body?.message ?? '').toString().trim();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 chars)' },
        { status: 400 }
      );
    }

    // 1) Greeting detection (no FAQ lookup needed)
    if (isGreeting(message)) {
      return NextResponse.json({
        reply: greetingResponse(),
        kind: 'greeting',
      });
    }

    // 2) Thanks detection
    if (isThanks(message)) {
      return NextResponse.json({
        reply: thanksResponse(),
        kind: 'thanks',
      });
    }

    // 3) FAQ keyword matching
    const match = matchFaq(message);
    if (match) {
      return NextResponse.json({
        reply: match.entry.answer,
        matchedFaqId: match.entry.id,
        matchedQuestion: match.entry.question,
        category: match.entry.category,
        confidence: Math.round(match.confidence * 100) / 100,
        kind: 'faq_match',
      });
    }

    // 4) Fallback — couldn't answer
    // In Step 4, this is where we'd log to `unanswered_questions` table
    // and call the LLM with RAG context.
    return NextResponse.json({
      reply: fallbackResponse(),
      kind: 'fallback',
    });
  } catch (err) {
    console.error('[chat API] error:', err);
    return NextResponse.json(
      {
        error: 'Internal error',
        reply: "I had trouble processing that. Try again, or email contact@sariro.com and a human will help.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Sariro Chat API',
    version: '1.0.0-preview',
    description: 'Keyword-based FAQ matcher (SLM preview). Step 4 will upgrade to LLM + RAG.',
    endpoints: {
      POST: '/api/chat — body: { message: string } → { reply, matchedFaqId?, confidence? }',
    },
  });
}
