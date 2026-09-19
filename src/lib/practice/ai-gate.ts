import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { roomsFor } from '@/lib/practice/rooms';
import type { RoomId } from '@/lib/practice/types';
import { geminiConfig, type GeminiConfig } from '@/lib/practice/gemini';

/**
 * SARIRO — the door every practice-room AI call goes through
 * ============================================================================
 * The Code Lab's tutor and the Maths coach both spend real money per call, so
 * both pass the same checks, in this order:
 *
 *   1. same-origin, not a blocked address, and a burst limit per address;
 *   2. the AI is switched on (GEMINI_API_KEY) — otherwise 503 "tutor_off";
 *   3. signed in, and enrolled in the room's course (staff may always try);
 *   4. one call off the learner's daily allowance, counted atomically in the
 *      database (scripts/ai-tutor.sql: ai_tutor_take). TUTOR_DAILY_LIMIT,
 *      20 if unset, shared by every room — one number for a parent to know.
 *
 * It FAILS CLOSED: if the counter cannot be reached, nothing is spent.
 */

export type GateResult =
  | { ok: true; ai: GeminiConfig; userId: string; left: number; limit: number }
  | { ok: false; response: Response };

const off = (reason: string): GateResult => ({ ok: false, response: NextResponse.json({ ok: false, error: 'tutor_off', reason }, { status: 503 }) });
const refuse = (status: number, body: Record<string, unknown>): GateResult => ({ ok: false, response: NextResponse.json({ ok: false, ...body }, { status }) });

export const aiSwitchedOn = () => geminiConfig() !== null;

export async function aiGate(req: NextRequest, room: RoomId, burstKey: string): Promise<GateResult> {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return { ok: false, response: csrfFail };
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return refuse(403, { error: 'forbidden' });
  const rl = rateLimit({ key: `${burstKey}:${ip}`, limit: 12, windowMs: 60_000, ip });
  if (!rl.ok) return { ok: false, response: rateLimitedResponse(rl.retryAfterMs, 'Slow down a little — ask again in a moment.') };

  const ai = geminiConfig();
  if (!ai) return off('no_key');

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return off('no_database'); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return refuse(401, { error: 'unauthenticated' });

  let admin;
  try { admin = createServiceClient(); } catch { return off('no_service_role'); }

  const [{ data: enrolments }, { data: profile }] = await Promise.all([
    admin.from('enrollments').select('track, status, level, created_at').eq('user_id', user.id),
    admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle(),
  ]);
  const staff = ['admin', 'super_admin', 'teacher'].includes(String(profile?.role ?? '')) || !!profile?.is_admin || !!profile?.is_super_admin;
  const access = roomsFor(enrolments ?? []).find((r) => r.room.id === room);
  if (!staff && !access?.allowed) return refuse(403, { error: 'not_enrolled' });

  const limit = Math.max(1, Math.min(500, Number(process.env.TUTOR_DAILY_LIMIT) || 20));
  const { data: used, error } = await admin.rpc('ai_tutor_take', { p_user: user.id, p_limit: limit });
  if (error) return off('no_counter');
  if (used == null) {
    return refuse(429, { error: 'limit', limit, message: `That's all ${limit} AI questions for today. They come back tomorrow — and the built-in guide keeps helping meanwhile.` });
  }
  return { ok: true, ai, userId: user.id, left: Math.max(0, limit - Number(used)), limit };
}
