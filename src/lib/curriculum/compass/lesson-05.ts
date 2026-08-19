import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 5 — Streaming Responses
 * Module 1 (What Are AI Agents?) · Lesson 5 of 30
 */
export const lesson05: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 1,
  lessonIndex: 4,
  globalNumber: 5,
  name: 'Streaming responses',
  title: 'Streaming — Making Compass Feel Alive',
  subtitle: "Show Compass's answer appearing word by word instead of making the user wait for the whole thing.",

  concept: {
    durationMin: 15,
    summary:
      "Understand why AI replies stream token-by-token, and learn to read a streamed response from the Claude API in real time.",
    sections: [
      {
        heading: 'The problem with waiting for the full reply',
        body:
          "Every call so far waits for Claude's ENTIRE answer before showing anything — for a longer response, that's a multi-second silent pause. Real AI products stream: text appears progressively as it's generated, which feels faster and lets the user start reading immediately, even though the total generation time is similar.",
      },
      {
        heading: 'Streaming with the Anthropic SDK',
        body:
          "Instead of messages.create, use messages.stream(...) — it returns an async iterable you loop over with for await...of, receiving small pieces of text (deltas) as Claude generates them.",
        code: {
          language: 'typescript',
          code:
            "const stream = anthropic.messages.stream({\n  model: 'claude-sonnet-5',\n  max_tokens: 400,\n  system: SYSTEM_PROMPT,\n  messages: [{ role: 'user', content: question }],\n});\n\nfor await (const event of stream) {\n  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n    process.stdout.write(event.delta.text);   // print each piece as it arrives\n  }\n}",
        },
      },
      {
        heading: 'Reading events vs collecting the final text',
        body:
          "The stream emits several event TYPES as it works (message start, content block deltas, message stop). For a simple CLI, you can just print every text_delta as it arrives. If you also need the FULL final text afterward (to save, log, or return), accumulate each delta into a string as you go.",
        code: {
          language: 'typescript',
          code:
            "let fullText = '';\nfor await (const event of stream) {\n  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n    process.stdout.write(event.delta.text);\n    fullText += event.delta.text;\n  }\n}\n// fullText now holds the complete reply, after the loop finishes",
        },
      },
      {
        heading: 'Streaming vs the retry logic from Lesson 4',
        body:
          "A stream can also fail mid-way (network drop, server error). Wrap the WHOLE streaming loop in try/catch so a failure partway through still ends gracefully rather than hanging — the retry-with-backoff pattern from Lesson 4 is harder to apply mid-stream, so for now Compass's streaming path uses a simpler 'catch and report' approach.",
      },
      {
        heading: 'When NOT to stream',
        body:
          "Streaming shines for a human reading text live. It's usually unnecessary (and adds complexity) for a BACKGROUND task where nothing is watching in real time — like Compass silently summarizing something for later use. Choose per use case, not as a blanket rule.",
      },
    ],
    keyTerms: [
      { term: 'Streaming', definition: "Receiving a response in small pieces as it's generated, instead of waiting for the whole thing." },
      { term: 'messages.stream()', definition: "The Anthropic SDK method returning an async iterable of streaming events." },
      { term: 'text_delta', definition: "A streaming event containing one small piece of newly generated text." },
      { term: 'for await...of', definition: "JavaScript syntax for looping over an async iterable, like a stream, one item at a time." },
    ],
    commonMistakes: [
      "Using messages.create (non-streaming) when a live-typing UX is actually wanted.",
      "Forgetting to accumulate the deltas if the full final text is needed afterward, not just printed.",
      "Not wrapping the streaming loop in error handling, leaving it able to hang or crash mid-stream.",
      "Streaming for a background task where nothing is actually watching — unnecessary complexity.",
      "Checking only event.type without also checking event.delta.type, missing that deltas come in different kinds.",
    ],
    takeaways: [
      "Streaming shows text progressively, improving PERCEIVED responsiveness.",
      "messages.stream() + for await...of is the SDK pattern for reading a stream.",
      "Accumulate deltas into a string if you need the full final text afterward.",
      "Wrap the whole streaming loop in try/catch — a stream can fail mid-way too.",
      "Streaming is a UX choice for live-reading scenarios, not a universal default.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A live-typing terminal effect',
    objective:
      "Practise reading a real stream and printing it live in the terminal, proving the effect end-to-end.",
    instructions: [
      "Write a script that streams a reply to a simple question.",
      "Print each text_delta as it arrives, with no newline, so it appears to type itself.",
      "Print a newline once the stream finishes.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'stream-test.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nasync function main() {\n  const stream = anthropic.messages.stream({\n    model: 'claude-sonnet-5',\n    max_tokens: 200,\n    messages: [{ role: 'user', content: 'Explain streaming in one short paragraph.' }],\n  });\n\n  for await (const event of stream) {\n    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n      process.stdout.write(event.delta.text);\n    }\n  }\n  process.stdout.write('\\n');\n}\n\nmain();",
      },
    ],
    explanation:
      "process.stdout.write (unlike console.log) doesn't add a newline after each call, so writing each small text_delta directly next to the last one produces a genuine live-typing effect in the terminal — you watch the sentence build itself in real time rather than appearing all at once. The final process.stdout.write('\\n') just tidies up the terminal after the stream ends.",
    expectedOutput:
      "Running the script shows a short explanation of streaming appearing progressively, character-chunk by character-chunk, in your terminal.",
    learned: [
      "How to start and read a real Claude stream.",
      "The difference between console.log and process.stdout.write for this effect.",
      "How to detect and handle text_delta events specifically.",
      "What a genuine streaming effect looks like end-to-end.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass streams its answers live in the terminal, with the same error handling and usage logging from earlier lessons.",
    why:
      "A CLI research assistant that visibly 'thinks out loud' as it answers feels far more responsive and alive than one that pauses silently for several seconds.",
    fileLocation: "compass-agent/index.ts (add a streaming askCompassStreaming variant)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add alongside askCompass)',
        code:
          "async function askCompassStreaming(question: string): Promise<string> {\n  let fullText = '';\n  try {\n    const stream = anthropic.messages.stream({\n      model: 'claude-sonnet-5',\n      max_tokens: 400,\n      temperature: 0.2,\n      system: SYSTEM_PROMPT,\n      messages: [{ role: 'user', content: question }],\n    });\n\n    for await (const event of stream) {\n      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n        process.stdout.write(event.delta.text);\n        fullText += event.delta.text;\n      }\n    }\n    process.stdout.write('\\n');\n    return fullText;\n  } catch (err) {\n    console.error('\\n[error] Compass lost connection mid-answer:', err);\n    return fullText || \"Sorry, I couldn't finish that answer. Please try again.\";\n  }\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (update main to use it)',
        code:
          "async function main() {\n  const question = process.argv[2] ?? 'What can you help me with?';\n  console.log(`You: ${question}`);\n  process.stdout.write('Compass: ');\n  await askCompassStreaming(question);\n}\n\nmain();",
      },
    ],
    placement:
      "Add askCompassStreaming alongside your existing askCompass() function (keep both — the non-streaming version is still useful when you just need a return value with no live output, like in an automated test). Update main() to call the streaming version and print 'Compass: ' before it starts.",
    implementation:
      "askCompassStreaming mirrors askCompass()'s structure (same model, temperature, system prompt) but reads the response via messages.stream() and a for await loop instead of a single messages.create call. It accumulates every text_delta into fullText AS it prints them live — so by the time the loop ends, you have both the live terminal effect AND a complete string to return, useful for later logging or saving. The try/catch wraps the entire streaming loop, so a mid-stream failure still returns something usable (whatever text streamed successfully, or a fallback message) instead of crashing.",
    expectedResult:
      "Running Compass now shows 'Compass: ' followed by the answer typing itself out live in the terminal, word by word, rather than appearing all at once after a pause.",
    connects:
      "This streaming pattern — accumulate deltas while printing live — is exactly what a real chat UI (built much later in this course, when Compass gets deployed) will do in the browser instead of the terminal. The underlying technique is identical.",
  },

  quiz: [
    { id: 'c5q1', kind: 'concept', prompt: 'What does streaming change about an AI response?', options: ['It makes the model think faster', 'Text arrives progressively instead of all at once at the end', 'It removes the need for an API key', 'It changes the model’s actual answer'], answerIndex: 1, explanation: "Streaming is about DELIVERY timing, not the content or speed of generation itself." },
    { id: 'c5q2', kind: 'code_reading', prompt: 'What does for await (const event of stream) do?', options: ['Loops once and stops', 'Iterates over each streaming event as it arrives, asynchronously', 'Immediately collects the full response', 'Throws an error by default'], answerIndex: 1, explanation: "for await...of consumes an async iterable one item (event) at a time, as each becomes available." },
    { id: 'c5q3', kind: 'application', prompt: 'Why use process.stdout.write instead of console.log for a live-typing effect?', options: ['No real difference', 'stdout.write doesn’t add a newline after each call, letting text append smoothly', 'console.log is slower', 'stdout.write is required by the SDK'], answerIndex: 1, explanation: "console.log adds a newline every call, breaking the continuous live-typing appearance." },
    { id: 'c5q4', kind: 'code_reading', prompt: 'What does accumulating deltas into fullText achieve?', options: ['Nothing useful', 'Preserves the COMPLETE final text for later use (saving, logging, returning), not just live display', 'Slows down the stream', 'Prevents errors'], answerIndex: 1, explanation: "The live print shows text as it comes; a separate accumulated string lets you use the full answer afterward." },
    { id: 'c5q5', kind: 'debug', prompt: 'A stream fails partway through with no try/catch. What happens?', options: ['Nothing, streams can’t fail', 'The program can crash or hang, losing whatever was streamed so far', 'It automatically retries', 'The terminal clears'], answerIndex: 1, explanation: "Without error handling around the loop, a mid-stream failure is unhandled and can crash the process." },
    { id: 'c5q6', kind: 'concept', prompt: 'When is streaming LESS necessary?', options: ['Always necessary, no exceptions', 'For a background task where no one is watching live', 'For any user-facing chat', 'Never necessary'], answerIndex: 1, explanation: "Streaming's main benefit is perceived responsiveness for a live viewer — unneeded for silent background work." },
    { id: 'c5q7', kind: 'output', prompt: 'What event.type + event.delta.type combination indicates actual new text arrived?', options: ['message_start', 'content_block_delta with delta.type text_delta', 'message_stop', 'content_block_start'], answerIndex: 1, explanation: "That specific combination marks a piece of generated text, distinct from other stream lifecycle events." },
    { id: 'c5q8', kind: 'application', prompt: 'Why does askCompassStreaming still wrap the whole loop in try/catch, similar to Lesson 4’s pattern?', options: ['It’s unnecessary here', 'A stream can also fail mid-way, and the function should still return something usable', 'Streams never fail', 'It replaces the need for a system prompt'], answerIndex: 1, explanation: "The same reliability principle from Lesson 4 applies to streaming — failures need graceful handling too." },
    { id: 'c5q9', kind: 'project', prompt: "Why does Compass keep BOTH askCompass and askCompassStreaming instead of replacing one with the other?", options: ['A mistake that should be fixed', 'Different use cases need different shapes — a plain return value vs. a live, in-progress effect', 'TypeScript requires both', 'They do the exact same thing'], answerIndex: 1, explanation: "A non-streaming call suits automated/background use; streaming suits an interactive, watched interaction." },
    { id: 'c5q10', kind: 'concept', prompt: 'Where will this exact streaming technique reappear later in the course?', options: ['Nowhere else', 'In a real chat UI once Compass is deployed, reading the stream in the browser instead of the terminal', 'Only in Module 1', 'It’s a one-off exercise with no reuse'], answerIndex: 1, explanation: "The accumulate-while-displaying pattern is the same one a web chat interface uses, just rendered differently." },
  ],

  homework: {
    task:
      "Add a visual 'thinking' indicator that prints '...' before the stream starts and gets erased the moment the first real text_delta arrives, so there's clear feedback during the brief gap before streaming begins.",
    requirements: [
      "Print '...' (or similar) immediately after 'Compass: ' but before starting the stream loop.",
      "On receiving the FIRST text_delta, erase the '...' (e.g. using \\r and spaces, or a similar terminal trick) before printing the real text.",
      "Subsequent deltas print normally with no further erasing needed.",
    ],
    expectedOutcome:
      "Running Compass briefly shows 'Compass: ...' then the '...' cleanly disappears and is replaced by the real answer typing itself out.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 4,
      hint: "Lesson 4 asked you to make withRetry only retry a SPECIFIC error type (a custom RateLimitError), re-throwing anything else immediately.",
      steps: [
        "Define class RateLimitError extends Error {} as a simple custom error type.",
        "In withRetry's catch block, check if (!(err instanceof RateLimitError)) throw err; BEFORE the retry-budget check, so non-rate-limit errors fail immediately.",
        "Test with a function throwing RateLimitError twice then succeeding (should eventually succeed via retries).",
        "Test with a SEPARATE function throwing a plain Error once (should fail immediately, no retries attempted).",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "class RateLimitError extends Error {}\n\nasync function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {\n  for (let attempt = 0; attempt <= retries; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      if (!(err instanceof RateLimitError) || attempt === retries) throw err;\n      const waitMs = 1000 * 2 ** attempt;\n      await new Promise((r) => setTimeout(r, waitMs));\n    }\n  }\n  throw new Error('unreachable');\n}",
        },
      ],
    },
  },
};
