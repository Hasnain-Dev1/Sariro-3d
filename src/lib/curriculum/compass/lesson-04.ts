import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 4 — Error Handling & Reliability
 * Module 1 (What Are AI Agents?) · Lesson 4 of 30
 */
export const lesson04: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 1,
  lessonIndex: 3,
  globalNumber: 4,
  name: 'Error handling & reliability',
  title: 'Making Compass Reliable — Errors, Retries & Rate Limits',
  subtitle: "Handle network failures and rate limits gracefully so Compass never just breaks.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the common ways an API call can fail, how to catch and respond to them, and a simple retry strategy for transient errors.",
    sections: [
      {
        heading: 'Why API calls fail more than you’d expect',
        body:
          "Compass depends on the network AND the Claude API both working. Either can fail: a dropped connection, an invalid key, a temporary API outage, or a rate limit (too many requests too fast). An agent that doesn't anticipate this will crash or hang the moment something goes wrong in the real world.",
      },
      {
        heading: 'try/catch around every API call',
        body:
          "Wrap the call in try/catch and return something USABLE on failure — never let an unhandled error crash the whole program. For a CLI tool, that might mean printing a clear message; for a web API route, returning a clean error response (Lesson 26-27 territory later in the course).",
        code: {
          language: 'typescript',
          code:
            "try {\n  const response = await anthropic.messages.create({ /* ... */ });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n} catch (err) {\n  console.error('Compass API error:', err);\n  return \"Sorry, I couldn't reach my brain just now. Please try again.\";\n}",
        },
      },
      {
        heading: 'Rate limits — a normal, expected failure',
        body:
          "APIs cap requests per time window to protect the service. Hitting this limit returns a specific error (often HTTP 429). A well-built agent DETECTS this specifically and can wait-and-retry, rather than treating it the same as a total failure.",
      },
      {
        heading: 'A simple retry with backoff',
        body:
          "For a TRANSIENT error (rate limit, brief network blip), retrying after a short wait often succeeds. 'Exponential backoff' means each retry waits LONGER than the last (1s, 2s, 4s...) — this avoids hammering an already-struggling service.",
        code: {
          language: 'typescript',
          code:
            "async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {\n  for (let attempt = 0; attempt <= retries; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      if (attempt === retries) throw err;\n      const waitMs = 1000 * 2 ** attempt;   // 1s, 2s, 4s...\n      await new Promise((r) => setTimeout(r, waitMs));\n    }\n  }\n  throw new Error('unreachable');\n}",
        },
      },
      {
        heading: 'Not every error should be retried',
        body:
          "A rate limit or brief network hiccup is worth retrying. An INVALID API key or a malformed request will fail identically every time — retrying just wastes time. Good error handling distinguishes 'try again' failures from 'fix the actual problem' failures where practical.",
      },
    ],
    keyTerms: [
      { term: 'Transient error', definition: "A temporary failure (rate limit, brief network issue) likely to succeed if retried." },
      { term: 'Rate limit', definition: "A cap on requests per time window; exceeding it returns an error (often HTTP 429)." },
      { term: 'Exponential backoff', definition: "A retry strategy where each wait is longer than the last, avoiding overwhelming a struggling service." },
      { term: 'Graceful degradation', definition: "Failing in a controlled, user-friendly way instead of crashing outright." },
    ],
    commonMistakes: [
      "No try/catch at all, letting one failed API call crash the entire program.",
      "Retrying EVERY error identically, including ones (like a bad API key) that will never succeed no matter how many times you try.",
      "Retrying instantly in a loop with no delay, which can worsen a rate-limit situation.",
      "Showing raw technical error text to a user instead of a clear, friendly message.",
      "Never actually testing failure — disconnecting the network or using a bad key to see what really happens.",
    ],
    takeaways: [
      "Always wrap API calls in try/catch and return something usable on failure.",
      "Rate limits are a normal, expected failure mode — handle them specifically where possible.",
      "Exponential backoff retries transient failures without hammering the service.",
      "Not every error is worth retrying — distinguish transient from permanent failures.",
      "Test failure paths deliberately; don't assume error handling works until you've triggered it.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A deliberately-failing call, retried',
    objective:
      "Practise the retry-with-backoff pattern using a function guaranteed to fail a few times before succeeding.",
    instructions: [
      "Write a function that fails the first 2 times it's called, then succeeds.",
      "Wrap it with the withRetry() helper.",
      "Run it and watch the retries happen with increasing delay.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'retry-test.ts',
        code:
          "let attempts = 0;\n\nasync function flakyOperation(): Promise<string> {\n  attempts += 1;\n  if (attempts < 3) {\n    throw new Error(`Simulated failure #${attempts}`);\n  }\n  return 'Success!';\n}\n\nasync function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {\n  for (let attempt = 0; attempt <= retries; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      console.log(`Attempt ${attempt + 1} failed:`, (err as Error).message);\n      if (attempt === retries) throw err;\n      const waitMs = 500 * 2 ** attempt;\n      await new Promise((r) => setTimeout(r, waitMs));\n    }\n  }\n  throw new Error('unreachable');\n}\n\nasync function main() {\n  const result = await withRetry(flakyOperation);\n  console.log('Final result:', result);\n}\n\nmain();",
      },
    ],
    explanation:
      "flakyOperation simulates a real transient failure: it throws for the first two calls, then succeeds on the third — exactly how a brief rate limit or network blip behaves in the real world. withRetry wraps it in a loop, catching each failure, logging it, and waiting progressively longer (500ms, then 1000ms) before trying again, until it either succeeds or exhausts its retry budget. Watching the console output makes the abstract 'retry with backoff' concept concrete: you SEE the attempts fail, then succeed.",
    expectedOutput:
      "Console shows 'Attempt 1 failed: Simulated failure #1', a short pause, 'Attempt 2 failed: Simulated failure #2', a longer pause, then 'Final result: Success!'",
    learned: [
      "How to implement a retry loop with exponential backoff.",
      "How to simulate and observe transient failures.",
      "Why the wait time should increase between retries.",
      "How to design a function for testable failure.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's API calls are wrapped in real error handling and automatic retry — it no longer crashes or hangs on a network hiccup or rate limit.",
    why:
      "An agent that breaks the first time something goes wrong isn't trustworthy. This lesson makes Compass genuinely resilient, not just impressive when everything works perfectly.",
    fileLocation: "compass-agent/index.ts (add withRetry + wrap askCompass)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near the top, after imports)',
        code:
          "async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {\n  for (let attempt = 0; attempt <= retries; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      if (attempt === retries) throw err;\n      const waitMs = 1000 * 2 ** attempt;\n      console.log(`[retry] attempt ${attempt + 1} failed, retrying in ${waitMs}ms…`);\n      await new Promise((r) => setTimeout(r, waitMs));\n    }\n  }\n  throw new Error('unreachable');\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (wrap the API call inside askCompass)',
        code:
          "async function askCompass(question: string): Promise<string> {\n  try {\n    const response = await withRetry(() =>\n      anthropic.messages.create({\n        model: 'claude-sonnet-5',\n        max_tokens: 400,\n        temperature: 0.2,\n        system: SYSTEM_PROMPT,\n        messages: [{ role: 'user', content: question }],\n      })\n    );\n\n    console.log(\n      `[usage] input: ${response.usage.input_tokens} tokens, output: ${response.usage.output_tokens} tokens`\n    );\n    return response.content[0].type === 'text' ? response.content[0].text : '';\n  } catch (err) {\n    console.error('[error] Compass could not get a response:', err);\n    return \"Sorry, I'm having trouble right now. Please try again in a moment.\";\n  }\n}",
      },
    ],
    placement:
      "Add the withRetry() helper function near the top of index.ts, after your imports. Then update askCompass() to wrap the API call with withRetry(...) inside an outer try/catch, exactly as shown.",
    implementation:
      "withRetry wraps the actual anthropic.messages.create call — if it fails (network blip, transient rate limit), it retries up to 3 times with exponential backoff before giving up. The OUTER try/catch in askCompass() is the final safety net: if even the retries are exhausted, it catches that error and returns a friendly, usable string instead of letting the exception crash whatever called askCompass(). This two-layer approach — retry transient failures, gracefully handle permanent ones — is exactly the concept lesson's core idea, applied directly to Compass's real code.",
    expectedResult:
      "Compass now survives a brief network interruption or rate limit by quietly retrying and succeeding — and if it genuinely can't reach the API, it returns a clear, friendly message instead of crashing your program.",
    connects:
      "This reliability layer wraps EVERY future capability — tools (Module 2), memory (Module 3), and planning (Module 4) all call through this same hardened askCompass() pattern, so nothing added later has to re-solve error handling from scratch.",
  },

  quiz: [
    { id: 'c4q1', kind: 'concept', prompt: 'Why can an AI agent fail more often than a simple static script?', options: ['AI is inherently unreliable', 'It depends on BOTH the network and an external API, either of which can fail', 'Retry logic causes failures', 'It’s a myth'], answerIndex: 1, explanation: "Two dependent external systems (network + API) each introduce their own possible failure points." },
    { id: 'c4q2', kind: 'concept', prompt: 'What is exponential backoff?', options: ['Retrying instantly, over and over', 'A retry strategy where each wait is longer than the last', 'A way to reduce token usage', 'A type of prompt engineering'], answerIndex: 1, explanation: "Backoff increases the delay between retries (e.g. 1s, 2s, 4s) to avoid overwhelming a struggling service." },
    { id: 'c4q3', kind: 'application', prompt: 'Which failure is generally WORTH retrying?', options: ['An invalid API key', 'A transient rate limit or brief network blip', 'A malformed request body', 'A typo in your code'], answerIndex: 1, explanation: "Transient failures often succeed on retry; permanent ones (bad key, bad request) will fail identically every time." },
    { id: 'c4q4', kind: 'debug', prompt: 'A script crashes entirely the first time the API call fails. What’s missing?', options: ['A system prompt', 'A try/catch around the API call', 'More max_tokens', 'A lower temperature'], answerIndex: 1, explanation: "Without try/catch, an unhandled error propagates and crashes the program." },
    { id: 'c4q5', kind: 'code_reading', prompt: 'In withRetry, what does `if (attempt === retries) throw err;` do?', options: ['Retries forever', 'Gives up and re-throws the error once the retry budget is exhausted', 'Ignores the error silently', 'Doubles the wait time'], answerIndex: 1, explanation: "Once the max retries are used up, the function stops retrying and propagates the final error." },
    { id: 'c4q6', kind: 'application', prompt: 'Why show a friendly message ("having trouble, try again") instead of the raw error to a user?', options: ['It’s required by the API', 'Raw errors are unhelpful/confusing; a clear message tells the user what to do next', 'It hides bugs from developers too', 'There’s no real reason'], answerIndex: 1, explanation: "Good error UX gives the user useful information without exposing technical internals." },
    { id: 'c4q7', kind: 'output', prompt: 'Running the mini-project’s flakyOperation via withRetry, how many total attempts happen before success?', options: ['1', '3 (fails twice, succeeds on the 3rd)', '5', 'It never succeeds'], answerIndex: 1, explanation: "attempts < 3 throws on calls 1 and 2, then succeeds on call 3." },
    { id: 'c4q8', kind: 'debug', prompt: 'A student retries a request that fails due to an INVALID API key, 5 times in a row. What happens?', options: ['It eventually succeeds', 'It fails identically every time — wasting time, since the key issue isn’t transient', 'The key fixes itself', 'Retries always help'], answerIndex: 1, explanation: "A bad key is a permanent failure — no amount of retrying changes the outcome." },
    { id: 'c4q9', kind: 'project', prompt: "Why does askCompass() have TWO layers of error handling — withRetry AND an outer try/catch?", options: ['Redundant, only one is needed', 'withRetry handles transient failures; the outer catch is the final safety net if retries are exhausted', 'It’s required TypeScript syntax', 'One layer is for logging, unrelated to errors'], answerIndex: 1, explanation: "The two layers serve different purposes: automatic recovery, then guaranteed graceful failure." },
    { id: 'c4q10', kind: 'concept', prompt: 'What does "graceful degradation" mean here?', options: ['The app slows down over time', 'Failing in a controlled, user-friendly way instead of crashing outright', 'Reducing image quality', 'Ignoring all errors'], answerIndex: 1, explanation: "It's the principle of designing for failure so the experience degrades gracefully, not catastrophically." },
  ],

  homework: {
    task:
      "Make withRetry only retry a SPECIFIC kind of error (simulate a rate-limit-like error with a custom error type) and immediately re-throw anything else, so a permanent error fails fast instead of wasting retries.",
    requirements: [
      "Create a small custom error class (e.g. RateLimitError extends Error).",
      "Modify withRetry to check if the caught error is a RateLimitError — retry only if so; otherwise re-throw immediately.",
      "Test with a function that throws a RateLimitError twice then succeeds, and a SEPARATE function that throws a plain Error once (confirm it does NOT retry).",
    ],
    expectedOutcome:
      "A RateLimitError-throwing function eventually succeeds via retries; a plain-Error-throwing function fails immediately on the first attempt, with no wasted retries.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 3,
      hint: "Lesson 3 asked you to add a one-shot example to Compass's system prompt showing the exact numbered-list format for step-based answers.",
      steps: [
        "In SYSTEM_PROMPT, add a short example block after the Format: rule, e.g. 'Example: Q: How do I start a project? A: 1. Create a folder. 2. Run npm init. 3. Install dependencies.'",
        "Keep it short — 3-4 numbered steps is enough to demonstrate the pattern.",
        "Test with a DIFFERENT step-based question (not the example topic) and confirm Compass follows the same numbered format.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (SYSTEM_PROMPT addition)',
          code:
            "Example:\nQ: How do I start a new project?\nA: 1. Create a folder. 2. Run npm init. 3. Install your dependencies.\n\nFollow this same numbered style whenever a question calls for steps.",
        },
      ],
    },
  },
};
