import * as z from 'zod/v4';

/**
 * SARIRO — Google Gemini, for the practice rooms' AI (server only)
 * ============================================================================
 * The Code Lab tutor and the Maths coach talk to Gemini through its REST API,
 * the same call the founder tested (generateContent with an x-goog-api-key
 * header). No SDK: two endpoints, plain fetch.
 *
 *   geminiStream  the reply as it is written, for the chat bubbles (SSE)
 *   geminiJson    one answer in a fixed shape (responseSchema); the caller
 *                 checks it again with zod before anything reaches the page
 *
 * Settings (Hostinger .env):
 *   GEMINI_API_KEY   required — unset, the AI is off and the rooms' built-in
 *                    guides answer instead
 *   GEMINI_MODEL     default gemini-flash-latest
 *   GEMINI_API_BASE  default https://generativelanguage.googleapis.com/v1beta
 *
 * The key travels in a header, never in the URL, so it cannot land in a log
 * line. The safety filters are set here rather than left to the API, whose
 * defaults are off for recent models — the learners are children.
 */

export const DEFAULT_MODEL = 'gemini-flash-latest';
export const DEFAULT_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiConfig { apiKey: string; model: string; base: string }

/** Null when there is no key — the AI is switched off. */
export function geminiConfig(env: Record<string, string | undefined> = process.env): GeminiConfig | null {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    model: (env.GEMINI_MODEL?.trim() || DEFAULT_MODEL).replace(/^models\//, ''),
    base: (env.GEMINI_API_BASE?.trim() || DEFAULT_BASE).replace(/\/+$/, ''),
  };
}

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export interface GeminiTurn { role: 'user' | 'model'; parts: GeminiPart[] }

/** One chat turn in Gemini's words: our 'assistant' is its 'model'. Extra parts (a photo) go first. */
export const turn = (role: 'user' | 'assistant', text: string, before: GeminiPart[] = []): GeminiTurn =>
  ({ role: role === 'assistant' ? 'model' : 'user', parts: [...before, { text }] });

export interface GeminiAsk {
  system: string;
  turns: GeminiTurn[];
  /** Includes the model's thinking, so keep it generous; it is a ceiling on cost, not a target. */
  maxTokens: number;
  /** geminiJson only: the answer's shape, from geminiSchema(). */
  schema?: GeminiSchema;
}

export const SAFETY = [
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
] as const;

export function requestBody(ask: GeminiAsk) {
  return {
    systemInstruction: { parts: [{ text: ask.system }] },
    contents: ask.turns,
    safetySettings: SAFETY,
    generationConfig: {
      maxOutputTokens: ask.maxTokens,
      ...(ask.schema ? { responseMimeType: 'application/json', responseSchema: ask.schema } : {}),
    },
  };
}

// ── The answer's shape ──────────────────────────────────────────────────────

/** Gemini's schema dialect (an OpenAPI subset): upper-case types, `nullable`, `propertyOrdering`. */
export interface GeminiSchema {
  type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
  description?: string;
  nullable?: boolean;
  enum?: string[];
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  propertyOrdering?: string[];
  minimum?: number;
  maximum?: number;
}

type Json = Record<string, unknown>;

/**
 * A zod schema in Gemini's dialect, so the zod schema stays the one source of
 * truth. `propertyOrdering` keeps the zod key order: the model writes the
 * fields in that order, so it states the problem before it solves it.
 */
export function geminiSchema(schema: z.ZodType): GeminiSchema {
  return convert(z.toJSONSchema(schema) as Json);
}

function convert(s: Json): GeminiSchema {
  if (Array.isArray(s.anyOf)) {
    const options = (s.anyOf as Json[]).filter((o) => o.type !== 'null');
    if (options.length !== 1 || options.length === s.anyOf.length) throw new Error('geminiSchema: only "X or null" unions are supported');
    const inner = convert(options[0]);
    return { ...inner, nullable: true, ...(typeof s.description === 'string' ? { description: s.description } : {}) };
  }
  const type = String(s.type ?? '').toUpperCase();
  if (!['STRING', 'NUMBER', 'INTEGER', 'BOOLEAN', 'ARRAY', 'OBJECT'].includes(type)) throw new Error(`geminiSchema: unsupported type ${String(s.type)}`);
  const out: GeminiSchema = { type: type as GeminiSchema['type'] };
  if (typeof s.description === 'string') out.description = s.description;
  if (Array.isArray(s.enum)) out.enum = s.enum.map(String);
  if (typeof s.minimum === 'number') out.minimum = s.minimum;
  if (typeof s.maximum === 'number') out.maximum = s.maximum;
  if (type === 'ARRAY') out.items = convert(s.items as Json);
  if (type === 'OBJECT') {
    const props = (s.properties ?? {}) as Record<string, Json>;
    out.properties = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, convert(v)]));
    out.propertyOrdering = Object.keys(props);
    if (Array.isArray(s.required)) out.required = s.required.map(String);
  }
  return out;
}

// ── Failures ────────────────────────────────────────────────────────────────

/**
 *   busy     rate limit (429), Google overloaded (5xx), a timeout or a dropped line — try again
 *   blocked  a safety filter stopped the question or the answer
 *   empty    it finished without a usable answer (ran out of room, not JSON…)
 *   setup    OUR fault: bad key, API not enabled, unknown model — see the server log
 *   failed   anything else Google refused (400)
 */
export type GeminiFailure = 'busy' | 'blocked' | 'empty' | 'setup' | 'failed';

export class GeminiError extends Error {
  constructor(readonly kind: GeminiFailure, message: string, readonly status?: number) {
    super(message);
    this.name = 'GeminiError';
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string };
}

const BLOCKED = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'IMAGE_SAFETY']);

/** The visible text of one response (thinking is skipped), and whether it was stopped. */
export function readResponse(r: GeminiResponse): { text: string; finish?: string; blocked: boolean } {
  if (r.promptFeedback?.blockReason) return { text: '', finish: r.promptFeedback.blockReason, blocked: true };
  const c = r.candidates?.[0];
  const text = (c?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('');
  return { text, finish: c?.finishReason, blocked: !!c?.finishReason && BLOCKED.has(c.finishReason) };
}

function failureFor(status: number): GeminiFailure {
  if (status === 429 || status >= 500) return 'busy';
  if (status === 401 || status === 403 || status === 404) return 'setup';
  return 'failed';
}

interface CallOptions { signal?: AbortSignal; fetchImpl?: typeof fetch }

/** Never wait on Google forever: the caller's signal (a learner leaving) or a time limit, whichever comes first. */
const withTimeout = (signal: AbortSignal | undefined, ms: number) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);

async function post(cfg: GeminiConfig, stream: boolean, ask: GeminiAsk, opts: CallOptions): Promise<Response> {
  const url = `${cfg.base}/models/${encodeURIComponent(cfg.model)}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
  let res: Response;
  try {
    res = await (opts.fetchImpl ?? fetch)(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      body: JSON.stringify(requestBody(ask)),
      signal: opts.signal,
    });
  } catch (err) {
    throw new GeminiError('busy', `Gemini unreachable: ${(err as Error)?.name ?? 'error'}`);
  }
  if (!res.ok) {
    let detail = '';
    try { detail = ((await res.json()) as GeminiResponse).error?.message ?? ''; } catch { /* not JSON */ }
    throw new GeminiError(failureFor(res.status), `Gemini ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }
  return res;
}

// ── Calls ───────────────────────────────────────────────────────────────────

/** One answer as parsed JSON (not yet validated — the caller runs its zod schema over it). */
export async function geminiJson(cfg: GeminiConfig, ask: GeminiAsk, opts: CallOptions = {}): Promise<unknown> {
  const res = await post(cfg, false, ask, { ...opts, signal: withTimeout(opts.signal, 90_000) });
  let body: GeminiResponse;
  try { body = (await res.json()) as GeminiResponse; } catch { throw new GeminiError('busy', 'Gemini: the answer was cut off'); }
  const { text, finish, blocked } = readResponse(body);
  if (blocked) throw new GeminiError('blocked', `Gemini blocked: ${finish}`);
  if (!text.trim()) throw new GeminiError('empty', `Gemini: no answer (${finish ?? 'no finish reason'})`);
  try {
    return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
  } catch {
    throw new GeminiError('empty', `Gemini: the answer was not JSON (${finish ?? 'no finish reason'})`);
  }
}

/** The reply, piece by piece. Throws a GeminiError at the end if it was blocked or came back empty. */
export async function* geminiStream(cfg: GeminiConfig, ask: GeminiAsk, opts: CallOptions = {}): AsyncGenerator<string> {
  const res = await post(cfg, true, ask, { ...opts, signal: withTimeout(opts.signal, 120_000) });
  if (!res.body) throw new GeminiError('empty', 'Gemini: no body');
  let wrote = false;
  let blocked = false;
  let finish: string | undefined;
  for await (const data of sseData(res.body)) {
    let r: GeminiResponse;
    try { r = JSON.parse(data) as GeminiResponse; } catch { continue; }
    if (r.error) throw new GeminiError(failureFor(r.error.code ?? 500), `Gemini: ${r.error.message ?? 'stream error'}`, r.error.code);
    const piece = readResponse(r);
    if (piece.text) { wrote = true; yield piece.text; }
    if (piece.blocked) blocked = true;
    if (piece.finish) finish = piece.finish;
  }
  if (blocked) throw new GeminiError('blocked', `Gemini blocked: ${finish}`);
  if (!wrote) throw new GeminiError('empty', `Gemini: no answer (${finish ?? 'no finish reason'})`);
}

/** The `data:` payload of each server-sent event, however the bytes were split. */
export async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const payload = (block: string) => block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, '')).join('\n');
  try {
    for (;;) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try { chunk = await reader.read(); } catch { throw new GeminiError('busy', 'Gemini: the connection dropped'); }
      buf = (buf + decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done })).replace(/\r\n/g, '\n');
      let end: number;
      while ((end = buf.indexOf('\n\n')) >= 0) {
        const data = payload(buf.slice(0, end));
        buf = buf.slice(end + 2);
        if (data) yield data;
      }
      if (chunk.done) break;
    }
    const rest = payload(buf);
    if (rest) yield rest;
  } finally {
    reader.cancel().catch(() => {});
  }
}
