import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { geminiConfig, geminiJson, geminiSchema, geminiStream, GeminiError, requestBody, sseData, turn, DEFAULT_BASE, type GeminiConfig, type GeminiSchema } from './gemini';
import { streamText } from './ai-stream';
import { ReviewSchema, SolutionSchema } from './maths/coach';

const CFG: GeminiConfig = { apiKey: 'test-key', model: 'gemini-flash-latest', base: DEFAULT_BASE };
const ASK = { system: 'Be kind.', turns: [turn('user', 'What is 2 + 2?')], maxTokens: 1000 };

/** A body that arrives in exactly these pieces — to split events, lines and \r\n in awkward places. */
function bodyOf(pieces: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) { for (const p of pieces) c.enqueue(enc.encode(p)); c.close(); },
  });
}
const sse = (obj: unknown) => `data: ${JSON.stringify(obj)}\r\n\r\n`;
const say = (text: string, finishReason?: string) => ({ candidates: [{ content: { parts: [{ text }] }, ...(finishReason ? { finishReason } : {}) }] });

interface Seen { url: string; init: RequestInit }
function fakeFetch(respond: () => Response, seen: Seen[] = []): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    seen.push({ url: String(url), init: init ?? {} });
    return respond();
  }) as typeof fetch;
}
async function collect(it: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const x of it) out.push(x);
  return out;
}

describe('settings', () => {
  test('no key means the AI is off; the rest has defaults', () => {
    assert.equal(geminiConfig({}), null);
    assert.equal(geminiConfig({ GEMINI_API_KEY: '   ' }), null);
    assert.deepEqual(geminiConfig({ GEMINI_API_KEY: ' k ' }), { apiKey: 'k', model: 'gemini-flash-latest', base: DEFAULT_BASE });
    assert.deepEqual(geminiConfig({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'models/gemini-2.5-flash', GEMINI_API_BASE: 'https://example.test/v1/' }),
      { apiKey: 'k', model: 'gemini-2.5-flash', base: 'https://example.test/v1' });
  });
});

describe('the request', () => {
  test('system prompt, turns, safety filters and a token ceiling; JSON only when a shape is given', () => {
    const plain = requestBody(ASK);
    assert.deepEqual(plain.systemInstruction, { parts: [{ text: 'Be kind.' }] });
    assert.deepEqual(plain.contents, [{ role: 'user', parts: [{ text: 'What is 2 + 2?' }] }]);
    assert.equal(plain.safetySettings.length, 4);
    assert.deepEqual(plain.generationConfig, { maxOutputTokens: 1000 });
    const shaped = requestBody({ ...ASK, schema: { type: 'OBJECT', properties: {} } });
    assert.equal(shaped.generationConfig.responseMimeType, 'application/json');
  });
  test('turns: assistant becomes model, and a photo goes before the words', () => {
    assert.deepEqual(turn('assistant', 'hi'), { role: 'model', parts: [{ text: 'hi' }] });
    assert.deepEqual(turn('user', 'solve', [{ inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } }]).parts,
      [{ inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } }, { text: 'solve' }]);
  });
});

describe('the answer shapes', () => {
  const walk = (s: GeminiSchema, visit: (s: GeminiSchema) => void) => {
    visit(s);
    if (s.items) walk(s.items, visit);
    for (const p of Object.values(s.properties ?? {})) walk(p, visit);
  };
  test('the coach schemas convert to Gemini\'s dialect, keeping zod\'s key order', () => {
    for (const zodSchema of [SolutionSchema, ReviewSchema]) {
      const s = geminiSchema(zodSchema);
      assert.equal(s.type, 'OBJECT');
      walk(s, (node) => {
        assert.match(node.type, /^[A-Z]+$/);
        const keys = Object.keys(node);
        for (const bad of ['$schema', 'additionalProperties', 'anyOf']) assert.ok(!keys.includes(bad), `no ${bad}`);
        if (node.type === 'OBJECT') assert.deepEqual(node.propertyOrdering, Object.keys(node.properties ?? {}));
      });
    }
    const review = geminiSchema(ReviewSchema);
    assert.deepEqual(review.propertyOrdering?.slice(0, 3), ['isMaths', 'verdict', 'summary']);
    assert.equal(review.properties?.mistake.nullable, true);
    assert.equal(review.properties?.mistake.type, 'OBJECT');
    assert.equal(review.properties?.ratings.properties?.accuracy.type, 'NUMBER');
    const solution = geminiSchema(SolutionSchema);
    assert.equal(solution.properties?.steps.type, 'ARRAY');
    assert.equal(solution.properties?.steps.items?.properties?.work.description, 'the working for this step, plain text maths');
    assert.deepEqual(solution.required, solution.propertyOrdering);
  });
});

describe('server-sent events', () => {
  test('events split anywhere — mid-line, mid-\\r\\n — come out whole', async () => {
    const whole = sse(say('Hel')) + sse(say('lo'));
    const cuts = [3, 9, whole.indexOf('\r\n') + 1, whole.length - 2];
    const pieces = [0, ...cuts].map((from, i) => whole.slice(from, cuts[i] ?? whole.length));
    const events = await collect(sseData(bodyOf(pieces)));
    assert.deepEqual(events.map((e) => JSON.parse(e)), [say('Hel'), say('lo')]);
  });
  test('a last event without its blank line still counts', async () => {
    assert.deepEqual(await collect(sseData(bodyOf(['data: {"a":1}']))), ['{"a":1}']);
  });
});

describe('streaming a reply', () => {
  test('text arrives in order, thinking is skipped, and the key is a header — never in the URL', async () => {
    const seen: Seen[] = [];
    const thinking = { candidates: [{ content: { parts: [{ text: 'secret plan', thought: true }] } }] };
    const f = fakeFetch(() => new Response(bodyOf([sse(thinking), sse(say('Try ')), sse(say('line 3.', 'STOP'))])), seen);
    assert.deepEqual(await collect(geminiStream(CFG, ASK, { fetchImpl: f })), ['Try ', 'line 3.']);
    assert.equal(seen[0].url, `${DEFAULT_BASE}/models/gemini-flash-latest:streamGenerateContent?alt=sse`);
    assert.ok(!seen[0].url.includes('test-key'));
    assert.equal((seen[0].init.headers as Record<string, string>)['x-goog-api-key'], 'test-key');
  });
  test('a blocked question or answer ends in a "blocked" error', async () => {
    const blockedPrompt = fakeFetch(() => new Response(bodyOf([sse({ promptFeedback: { blockReason: 'SAFETY' } })])));
    await assert.rejects(collect(geminiStream(CFG, ASK, { fetchImpl: blockedPrompt })), (e: GeminiError) => e.kind === 'blocked');
    const blockedAnswer = fakeFetch(() => new Response(bodyOf([sse(say('Well', 'SAFETY'))])));
    await assert.rejects(collect(geminiStream(CFG, ASK, { fetchImpl: blockedAnswer })), (e: GeminiError) => e.kind === 'blocked');
  });
  test('nothing said is "empty"; an error mid-stream is passed on', async () => {
    const silent = fakeFetch(() => new Response(bodyOf([sse(say('', 'MAX_TOKENS'))])));
    await assert.rejects(collect(geminiStream(CFG, ASK, { fetchImpl: silent })), (e: GeminiError) => e.kind === 'empty');
    const overloaded = fakeFetch(() => new Response(bodyOf([sse(say('Hi')), sse({ error: { code: 503, message: 'overloaded' } })])));
    await assert.rejects(collect(geminiStream(CFG, ASK, { fetchImpl: overloaded })), (e: GeminiError) => e.kind === 'busy');
  });
  test('HTTP failures are sorted: rate limit is busy, a bad key is setup, a bad request is failed', async () => {
    const status = (code: number) => fakeFetch(() => Response.json({ error: { message: `nope ${code}` } }, { status: code }));
    for (const [code, kind] of [[429, 'busy'], [503, 'busy'], [403, 'setup'], [404, 'setup'], [400, 'failed']] as const) {
      await assert.rejects(collect(geminiStream(CFG, ASK, { fetchImpl: status(code) })), (e: GeminiError) => e.kind === kind && e.message.includes(`nope ${code}`));
    }
    const offline = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
    await assert.rejects(collect(geminiStream(CFG, ASK, { fetchImpl: offline })), (e: GeminiError) => e.kind === 'busy');
  });
});

describe('a JSON answer', () => {
  const answer = (text: string, finishReason = 'STOP') => fakeFetch(() => Response.json(say(text, finishReason)));
  test('parsed — even if it arrives in a code fence', async () => {
    const seen: Seen[] = [];
    const f = fakeFetch(() => Response.json(say('{"answer":"4"}')), seen);
    assert.deepEqual(await geminiJson(CFG, ASK, { fetchImpl: f }), { answer: '4' });
    assert.ok(seen[0].url.endsWith(':generateContent'));
    assert.deepEqual(await geminiJson(CFG, ASK, { fetchImpl: answer('```json\n{"answer":"4"}\n```') }), { answer: '4' });
  });
  test('cut off, blocked or not JSON are told apart', async () => {
    await assert.rejects(geminiJson(CFG, ASK, { fetchImpl: answer('{"answ', 'MAX_TOKENS') }), (e: GeminiError) => e.kind === 'empty');
    await assert.rejects(geminiJson(CFG, ASK, { fetchImpl: answer('', 'SAFETY') }), (e: GeminiError) => e.kind === 'blocked');
    await assert.rejects(geminiJson(CFG, ASK, { fetchImpl: answer('', 'MAX_TOKENS') }), (e: GeminiError) => e.kind === 'empty');
  });
});

describe('the reply as the learner receives it', () => {
  async function* pieces(texts: string[], end?: GeminiError) {
    for (const t of texts) yield t;
    if (end) throw end;
  }
  test('the text, with how many questions are left', async () => {
    const res = streamText(pieces(['Look at ', 'line 3.']), 7);
    assert.equal(res.headers.get('X-Tutor-Left'), '7');
    assert.equal(await res.text(), 'Look at line 3.');
  });
  test('a failure ends with a friendly line, never a broken bubble', async () => {
    assert.equal(await streamText(pieces([], new GeminiError('blocked', 'x')), 1).text(), "Let's keep to the problem — which part is tricky right now?");
    assert.equal(await streamText(pieces(['So far'], new GeminiError('busy', 'x')), 1).text(), 'So far\n\nThe tutor is busy right now — try again in a minute.');
    assert.match(await streamText(pieces([], new GeminiError('empty', 'x')), 1).text(), /which part is confusing/);
  });
});
