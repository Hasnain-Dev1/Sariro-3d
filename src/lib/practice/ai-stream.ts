import Anthropic from '@anthropic-ai/sdk';

/**
 * SARIRO — a Claude stream, piped to the learner as plain text
 * ============================================================================
 * Used by the Code Lab tutor and the Maths coach's "guide me" chat. Text
 * arrives as it is written; a refusal or a dropped connection ends with a
 * friendly line instead of a broken bubble. `left` is the learner's remaining
 * AI questions today, sent as X-Tutor-Left.
 */
export function streamText(stream: ReturnType<Anthropic['beta']['messages']['stream']>, left: number): Response {
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
          controller.enqueue(enc.encode(`${wrote ? '\n\n' : ''}Let's keep to the problem — which part is tricky right now?`));
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
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Tutor-Left': String(left) },
  });
}
