import { GeminiError } from '@/lib/practice/gemini';

/**
 * SARIRO — an AI reply, piped to the learner as plain text
 * ============================================================================
 * Used by the Code Lab tutor and the Maths coach's "guide me" chat. Text
 * arrives as it is written; a blocked answer or a dropped connection ends with
 * a friendly line instead of a broken bubble. `left` is the learner's remaining
 * AI questions today, sent as X-Tutor-Left. `stop` cancels the call upstream
 * when the learner leaves.
 */
export function streamText(pieces: AsyncIterable<string>, left: number, stop: () => void = () => {}): Response {
  const enc = new TextEncoder();
  let gone = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      const say = (text: string) => { if (!gone) controller.enqueue(enc.encode(text)); };
      try {
        for await (const piece of pieces) {
          if (gone) return;
          wrote = true;
          say(piece);
        }
      } catch (err) {
        if (gone) return;
        const kind = err instanceof GeminiError ? err.kind : 'failed';
        if (kind === 'setup' || kind === 'failed') console.error('[practice-ai]', err instanceof Error ? err.message : err);
        const line =
          kind === 'blocked' ? "Let's keep to the problem — which part is tricky right now?"
          : kind === 'empty' ? 'Tell me which part is confusing and we will work through it together.'
          : kind === 'busy' ? 'The tutor is busy right now — try again in a minute.'
          : 'The tutor could not be reached — ask again in a moment.';
        say(`${wrote ? '\n\n' : ''}${line}`);
      } finally {
        if (!gone) controller.close();
      }
    },
    cancel() {
      gone = true;
      stop();
    },
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Tutor-Left': String(left) },
  });
}
