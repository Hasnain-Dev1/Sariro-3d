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
      "Learn the common ways an API call can fail, how to catch and respond to them in Python, and a simple retry strategy for transient errors.",
    sections: [
      {
        heading: 'Why API calls fail more than you’d expect',
        body:
          "Compass depends on the network AND the model API both working. Either can fail: a dropped connection, an invalid key, a temporary API outage, or a rate limit (too many requests too fast). An agent that doesn't anticipate this will crash or hang the moment something goes wrong in the real world.",
      },
      {
        heading: 'try/except around every API call',
        body:
          "Wrap the call in try/except and return something USABLE on failure — never let an unhandled exception crash the whole program. The anthropic package raises specific exception classes you can catch individually.",
        code: {
          language: 'python',
          code:
            "import anthropic\n\ntry:\n    response = client.messages.create(...)\n    return response.content[0].text\nexcept anthropic.APIError as err:\n    print(f\"Compass API error: {err}\")\n    return \"Sorry, I couldn't reach my brain just now. Please try again.\"",
        },
      },
      {
        heading: 'Rate limits — a normal, expected failure',
        body:
          "APIs cap requests per time window to protect the service. Hitting this limit raises anthropic.RateLimitError specifically (HTTP 429 under the hood). A well-built agent catches this specifically and can wait-and-retry, rather than treating it the same as a total failure.",
      },
      {
        heading: 'A simple retry with backoff',
        body:
          "For a TRANSIENT error (rate limit, brief network blip), retrying after a short wait often succeeds. 'Exponential backoff' means each retry waits LONGER than the last (1s, 2s, 4s...) — this avoids hammering an already-struggling service.",
        code: {
          language: 'python',
          code:
            "import time\n\ndef with_retry(fn, retries=3):\n    for attempt in range(retries + 1):\n        try:\n            return fn()\n        except Exception as err:\n            if attempt == retries:\n                raise\n            wait_s = 2 ** attempt   # 1s, 2s, 4s...\n            time.sleep(wait_s)",
        },
      },
      {
        heading: 'Not every error should be retried',
        body:
          "A rate limit or brief network hiccup is worth retrying. An INVALID API key (anthropic.AuthenticationError) or a malformed request (anthropic.BadRequestError) will fail identically every time — retrying just wastes time. Good error handling distinguishes 'try again' failures from 'fix the actual problem' failures where practical.",
      },
    ],
    keyTerms: [
      { term: 'Transient error', definition: "A temporary failure (rate limit, brief network issue) likely to succeed if retried." },
      { term: 'anthropic.RateLimitError', definition: "The specific exception raised when you've exceeded the API's request rate limit." },
      { term: 'Exponential backoff', definition: "A retry strategy where each wait is longer than the last, avoiding overwhelming a struggling service." },
      { term: 'Graceful degradation', definition: "Failing in a controlled, user-friendly way instead of crashing outright." },
    ],
    commonMistakes: [
      "No try/except at all, letting one failed API call crash the entire program.",
      "Retrying EVERY error identically, including ones (like a bad API key) that will never succeed no matter how many times you try.",
      "Retrying instantly in a loop with no delay, which can worsen a rate-limit situation.",
      "Showing raw technical error text to a user instead of a clear, friendly message.",
      "Never actually testing failure — disconnecting the network or using a bad key to see what really happens.",
    ],
    takeaways: [
      "Always wrap API calls in try/except and return something usable on failure.",
      "Rate limits are a normal, expected failure mode — anthropic.RateLimitError lets you handle them specifically.",
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
      "Wrap it with a with_retry() helper.",
      "Run it and watch the retries happen with increasing delay.",
    ],
    code: [
      {
        language: 'python',
        filename: 'retry_test.py',
        code:
          "import time\n\nattempts = 0\n\ndef flaky_operation() -> str:\n    global attempts\n    attempts += 1\n    if attempts < 3:\n        raise Exception(f\"Simulated failure #{attempts}\")\n    return \"Success!\"\n\ndef with_retry(fn, retries=3):\n    for attempt in range(retries + 1):\n        try:\n            return fn()\n        except Exception as err:\n            print(f\"Attempt {attempt + 1} failed: {err}\")\n            if attempt == retries:\n                raise\n            time.sleep(0.5 * 2 ** attempt)\n\ndef main():\n    result = with_retry(flaky_operation)\n    print(\"Final result:\", result)\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "flaky_operation simulates a real transient failure: it raises for the first two calls, then succeeds on the third — exactly how a brief rate limit or network blip behaves in the real world. with_retry wraps it in a loop, catching each failure, printing it, and waiting progressively longer (0.5s, then 1s) before trying again, until it either succeeds or exhausts its retry budget. The global keyword lets flaky_operation modify the module-level attempts counter across calls. Watching the console output makes the abstract 'retry with backoff' concept concrete: you SEE the attempts fail, then succeed.",
    expectedOutput:
      "Console shows 'Attempt 1 failed: Simulated failure #1', a short pause, 'Attempt 2 failed: Simulated failure #2', a longer pause, then 'Final result: Success!'",
    learned: [
      "How to implement a retry loop with exponential backoff.",
      "How to simulate and observe transient failures.",
      "Why the wait time should increase between retries.",
      "How Python's global keyword lets a function modify module state.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's API calls are wrapped in real error handling and automatic retry — it no longer crashes or hangs on a network hiccup or rate limit.",
    why:
      "An agent that breaks the first time something goes wrong isn't trustworthy. This lesson makes Compass genuinely resilient, not just impressive when everything works perfectly.",
    fileLocation: "compass-agent/main.py (add with_retry + wrap ask_compass)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add near the top, after imports)',
        code:
          "import time\n\ndef with_retry(fn, retries=3):\n    for attempt in range(retries + 1):\n        try:\n            return fn()\n        except Exception:\n            if attempt == retries:\n                raise\n            wait_s = 2 ** attempt\n            print(f\"[retry] attempt {attempt + 1} failed, retrying in {wait_s}s…\")\n            time.sleep(wait_s)",
      },
      {
        language: 'python',
        filename: 'main.py (wrap the API call inside ask_compass)',
        code:
          "def ask_compass(question: str) -> str:\n    try:\n        response = with_retry(lambda: client.messages.create(\n            model=\"claude-sonnet-5\",\n            max_tokens=400,\n            temperature=0.2,\n            system=SYSTEM_PROMPT,\n            messages=[{\"role\": \"user\", \"content\": question}],\n        ))\n\n        print(f\"[usage] input: {response.usage.input_tokens} tokens, output: {response.usage.output_tokens} tokens\")\n        return response.content[0].text\n    except Exception as err:\n        print(f\"[error] Compass could not get a response: {err}\")\n        return \"Sorry, I'm having trouble right now. Please try again in a moment.\"",
      },
    ],
    placement:
      "Add the with_retry() helper function near the top of main.py, after your imports. Then update ask_compass() to wrap the API call with with_retry(lambda: ...) inside an outer try/except, exactly as shown.",
    implementation:
      "with_retry wraps the actual client.messages.create call (passed in as a lambda, since with_retry needs to CALL it fresh on each attempt) — if it fails (network blip, transient rate limit), it retries up to 3 times with exponential backoff before giving up. The OUTER try/except in ask_compass() is the final safety net: if even the retries are exhausted, it catches that error and returns a friendly, usable string instead of letting the exception crash whatever called ask_compass(). This two-layer approach — retry transient failures, gracefully handle permanent ones — is exactly the concept lesson's core idea, applied directly to Compass's real code.",
    expectedResult:
      "Compass now survives a brief network interruption or rate limit by quietly retrying and succeeding — and if it genuinely can't reach the API, it returns a clear, friendly message instead of crashing your program.",
    connects:
      "This reliability layer wraps EVERY future capability — tools (Module 2), memory (Module 3), and planning (Module 4) all call through this same hardened ask_compass() pattern, so nothing added later has to re-solve error handling from scratch.",
  },

  quiz: [
    { id: 'c4q1', kind: 'concept', prompt: 'Why can an AI agent fail more often than a simple static script?', options: ['AI is inherently unreliable', 'It depends on BOTH the network and an external API, either of which can fail', 'Retry logic causes failures', 'It’s a myth'], answerIndex: 1, explanation: "Two dependent external systems (network + API) each introduce their own possible failure points." },
    { id: 'c4q2', kind: 'concept', prompt: 'What is exponential backoff?', options: ['Retrying instantly, over and over', 'A retry strategy where each wait is longer than the last', 'A way to reduce token usage', 'A type of prompt engineering'], answerIndex: 1, explanation: "Backoff increases the delay between retries (e.g. 1s, 2s, 4s) to avoid overwhelming a struggling service." },
    { id: 'c4q3', kind: 'application', prompt: 'Which failure is generally WORTH retrying?', options: ['An invalid API key', 'A transient rate limit or brief network blip', 'A malformed request body', 'A typo in your code'], answerIndex: 1, explanation: "Transient failures often succeed on retry; permanent ones (bad key, bad request) will fail identically every time." },
    { id: 'c4q4', kind: 'debug', prompt: 'A script crashes entirely the first time the API call fails. What’s missing?', options: ['A system prompt', 'A try/except around the API call', 'More max_tokens', 'A lower temperature'], answerIndex: 1, explanation: "Without try/except, an unhandled exception propagates and crashes the program." },
    { id: 'c4q5', kind: 'code_reading', prompt: 'In with_retry, what does `if attempt == retries: raise` do?', options: ['Retries forever', 'Gives up and re-raises the exception once the retry budget is exhausted', 'Ignores the error silently', 'Doubles the wait time'], answerIndex: 1, explanation: "Once the max retries are used up, the function stops retrying and re-raises the final exception." },
    { id: 'c4q6', kind: 'application', prompt: 'Why show a friendly message ("having trouble, try again") instead of the raw error to a user?', options: ['It’s required by the API', 'Raw errors are unhelpful/confusing; a clear message tells the user what to do next', 'It hides bugs from developers too', 'There’s no real reason'], answerIndex: 1, explanation: "Good error UX gives the user useful information without exposing technical internals." },
    { id: 'c4q7', kind: 'output', prompt: 'Running the mini-project’s flaky_operation via with_retry, how many total attempts happen before success?', options: ['1', '3 (fails twice, succeeds on the 3rd)', '5', 'It never succeeds'], answerIndex: 1, explanation: "attempts < 3 raises on calls 1 and 2, then succeeds on call 3." },
    { id: 'c4q8', kind: 'debug', prompt: 'A student retries a request that fails due to an INVALID API key, 5 times in a row. What happens?', options: ['It eventually succeeds', 'It fails identically every time — wasting time, since the key issue isn’t transient', 'The key fixes itself', 'Retries always help'], answerIndex: 1, explanation: "A bad key is a permanent failure — no amount of retrying changes the outcome." },
    { id: 'c4q9', kind: 'project', prompt: "Why does ask_compass() have TWO layers of error handling — with_retry AND an outer try/except?", options: ['Redundant, only one is needed', 'with_retry handles transient failures; the outer except is the final safety net if retries are exhausted', 'It’s required Python syntax', 'One layer is for logging, unrelated to errors'], answerIndex: 1, explanation: "The two layers serve different purposes: automatic recovery, then guaranteed graceful failure." },
    { id: 'c4q10', kind: 'concept', prompt: 'What does "graceful degradation" mean here?', options: ['The app slows down over time', 'Failing in a controlled, user-friendly way instead of crashing outright', 'Reducing image quality', 'Ignoring all errors'], answerIndex: 1, explanation: "It's the principle of designing for failure so the experience degrades gracefully, not catastrophically." },
  ],

  homework: {
    task:
      "Make with_retry only retry anthropic.RateLimitError specifically, and immediately re-raise anything else, so a permanent error fails fast instead of wasting retries.",
    requirements: [
      "Catch anthropic.RateLimitError specifically inside with_retry's except block.",
      "If the caught exception is NOT a RateLimitError, re-raise it immediately without retrying.",
      "Test with a function that raises anthropic.RateLimitError twice then succeeds, and a SEPARATE function that raises a plain Exception once (confirm it does NOT retry).",
    ],
    expectedOutcome:
      "A RateLimitError-raising function eventually succeeds via retries; a plain-Exception-raising function fails immediately on the first attempt, with no wasted retries.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 3,
      hint: "Lesson 3 asked you to add a one-shot example to Compass's system prompt showing the exact numbered-list format for step-based answers.",
      steps: [
        "In SYSTEM_PROMPT, add a short example block after the Format: rule, e.g. 'Example: Q: How do I start a project? A: 1. Create a folder. 2. Run python -m venv venv. 3. Install dependencies.'",
        "Keep it short — 3-4 numbered steps is enough to demonstrate the pattern.",
        "Test with a DIFFERENT step-based question (not the example topic) and confirm Compass follows the same numbered format.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py (SYSTEM_PROMPT addition)',
          code:
            "Example:\nQ: How do I start a new project?\nA: 1. Create a folder. 2. Run python -m venv venv. 3. Install your dependencies.\n\nFollow this same numbered style whenever a question calls for steps.",
        },
      ],
    },
  },
};
