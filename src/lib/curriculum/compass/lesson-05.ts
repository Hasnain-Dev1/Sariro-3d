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
      "Understand why AI replies stream token-by-token, and learn to read a streamed response from the API in real time using Python.",
    sections: [
      {
        heading: 'The problem with waiting for the full reply',
        body:
          "Every call so far waits for the model's ENTIRE answer before showing anything — for a longer response, that's a multi-second silent pause. Real AI products stream: text appears progressively as it's generated, which feels faster and lets the user start reading immediately, even though the total generation time is similar.",
      },
      {
        heading: 'Streaming with the Python SDK',
        body:
          "Pass stream=True to client.chat.completions.create(...) instead of using a separate method — it returns an iterator of small chunks instead of one full response object. Each chunk carries a delta: a small piece of the reply, arriving as the model generates it.",
        code: {
          language: 'python',
          code:
            "stream = client.chat.completions.create(\n    model=MODEL,\n    max_tokens=400,\n    messages=[\n        {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n        {\"role\": \"user\", \"content\": question},\n    ],\n    stream=True,\n)\n\nfor chunk in stream:\n    delta = chunk.choices[0].delta.content\n    if delta:\n        print(delta, end=\"\", flush=True)   # print each piece as it arrives, no newline",
        },
      },
      {
        heading: 'Reading chunks vs collecting the final text',
        body:
          "Each chunk.choices[0].delta.content gives you just the new text piece — simplest for a live-printing use case, and it can be None for chunks that don't carry text (like the very first or last one). If you also need the FULL final text afterward (to save, log, or return), accumulate each non-empty delta into a string as you go.",
        code: {
          language: 'python',
          code:
            "full_text = \"\"\nstream = client.chat.completions.create(..., stream=True)\nfor chunk in stream:\n    delta = chunk.choices[0].delta.content\n    if delta:\n        print(delta, end=\"\", flush=True)\n        full_text += delta\n# full_text now holds the complete reply, once the loop finishes",
        },
      },
      {
        heading: 'Streaming vs the retry logic from Lesson 4',
        body:
          "A stream can also fail mid-way (network drop, server error). Wrap the WHOLE streaming block in try/except so a failure partway through still ends gracefully rather than hanging — the retry-with-backoff pattern from Lesson 4 is harder to apply mid-stream, so for now Compass's streaming path uses a simpler 'catch and report' approach.",
      },
      {
        heading: 'When NOT to stream',
        body:
          "Streaming shines for a human reading text live. It's usually unnecessary (and adds complexity) for a BACKGROUND task where nothing is watching in real time — like Compass silently summarizing something for later use. Choose per use case, not as a blanket rule.",
      },
    ],
    keyTerms: [
      { term: 'Streaming', definition: "Receiving a response in small pieces as it's generated, instead of waiting for the whole thing." },
      { term: 'stream=True', definition: "The chat.completions.create parameter that turns the response into an iterator of chunks instead of one object." },
      { term: 'delta', definition: "The small piece of new text on each streamed chunk, at chunk.choices[0].delta.content." },
      { term: 'Chunk', definition: "One item yielded while iterating a stream — may or may not carry actual text content." },
    ],
    commonMistakes: [
      "Omitting stream=True (or calling create() the normal way) when a live-typing UX is actually wanted.",
      "Forgetting to accumulate the deltas if the full final text is needed afterward, not just printed.",
      "Not checking `if delta:` before using chunk.choices[0].delta.content, since some chunks carry None.",
      "Not wrapping the streaming block in error handling, leaving it able to hang or crash mid-stream.",
      "Streaming for a background task where nothing is actually watching — unnecessary complexity.",
      "Forgetting flush=True on print(), which can delay output appearing due to Python's stdout buffering.",
    ],
    takeaways: [
      "Streaming shows text progressively, improving PERCEIVED responsiveness.",
      "Pass stream=True to chat.completions.create() and iterate the returned chunks in a for loop.",
      "Accumulate non-empty deltas into a string if you need the full final text afterward.",
      "Wrap the whole streaming block in try/except — a stream can fail mid-way too.",
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
      "Print each text chunk as it arrives, with no newline, so it appears to type itself.",
      "Print a newline once the stream finishes.",
    ],
    code: [
      {
        language: 'python',
        filename: 'stream_test.py',
        code:
          "from dotenv import load_dotenv\nfrom openai import OpenAI\n\nload_dotenv()\nclient = OpenAI()\nMODEL = \"gpt-4o-mini\"\n\ndef main():\n    stream = client.chat.completions.create(\n        model=MODEL,\n        max_tokens=200,\n        messages=[{\"role\": \"user\", \"content\": \"Explain streaming in one short paragraph.\"}],\n        stream=True,\n    )\n    for chunk in stream:\n        delta = chunk.choices[0].delta.content\n        if delta:\n            print(delta, end=\"\", flush=True)\n    print()\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "print(text, end=\"\") (unlike the default print()) doesn't add a newline after each call, so printing each small chunk directly next to the last one produces a genuine live-typing effect in the terminal — you watch the sentence build itself in real time rather than appearing all at once. flush=True forces Python to write immediately instead of buffering output, which matters for a smooth live effect. The `if delta:` guard skips chunks that carry no text (some chunks only carry metadata, like the role or the finish reason). The final bare print() just adds a tidy newline after the stream ends.",
    expectedOutput:
      "Running the script shows a short explanation of streaming appearing progressively, chunk by chunk, in your terminal.",
    learned: [
      "How to start and read a real streaming response in Python.",
      "Why end=\"\" and flush=True matter for a live-typing effect.",
      "How to iterate over a stream and read each delta.",
      "What a genuine streaming effect looks like end-to-end.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass streams its answers live in the terminal, with the same error handling and usage logging from earlier lessons.",
    why:
      "A CLI research assistant that visibly 'thinks out loud' as it answers feels far more responsive and alive than one that pauses silently for several seconds.",
    fileLocation: "compass-agent/main.py (add a streaming ask_compass_streaming variant)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add alongside ask_compass)',
        code:
          "def ask_compass_streaming(question: str) -> str:\n    full_text = \"\"\n    try:\n        stream = client.chat.completions.create(\n            model=MODEL,\n            max_tokens=400,\n            temperature=0.2,\n            messages=[\n                {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n                {\"role\": \"user\", \"content\": question},\n            ],\n            stream=True,\n        )\n        for chunk in stream:\n            delta = chunk.choices[0].delta.content\n            if delta:\n                print(delta, end=\"\", flush=True)\n                full_text += delta\n        print()\n        return full_text\n    except Exception as err:\n        print(f\"\\n[error] Compass lost connection mid-answer: {err}\")\n        return full_text or \"Sorry, I couldn't finish that answer. Please try again.\"",
      },
      {
        language: 'python',
        filename: 'main.py (update main to use it)',
        code:
          "def main():\n    question = sys.argv[1] if len(sys.argv) > 1 else \"What can you help me with?\"\n    print(f\"You: {question}\")\n    print(\"Compass: \", end=\"\")\n    ask_compass_streaming(question)\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    placement:
      "Add ask_compass_streaming alongside your existing ask_compass() function (keep both — the non-streaming version is still useful when you just need a return value with no live output, like in an automated test). Update main() to call the streaming version and print 'Compass: ' before it starts.",
    implementation:
      "ask_compass_streaming mirrors ask_compass()'s structure (same model, temperature, system message) but reads the response via stream=True and a for loop instead of one plain create() call. It accumulates every delta into full_text AS it prints them live — so by the time the loop ends, you have both the live terminal effect AND a complete string to return, useful for later logging or saving. The try/except wraps the entire streaming block, so a mid-stream failure still returns something usable (whatever text streamed successfully, or a fallback message) instead of crashing.",
    expectedResult:
      "Running Compass now shows 'Compass: ' followed by the answer typing itself out live in the terminal, word by word, rather than appearing all at once after a pause.",
    connects:
      "This streaming pattern — accumulate chunks while printing live — is exactly what a real Streamlit app (built in Module 5, when Compass gets deployed) will do in the browser instead of the terminal. The underlying technique is identical.",
  },

  quiz: [
    { id: 'c5q1', kind: 'concept', prompt: 'What does streaming change about an AI response?', options: ['It makes the model think faster', 'Text arrives progressively instead of all at once at the end', 'It removes the need for an API key', 'It changes the model’s actual answer'], answerIndex: 1, explanation: "Streaming is about DELIVERY timing, not the content or speed of generation itself." },
    { id: 'c5q2', kind: 'code_reading', prompt: 'What does `for chunk in stream:` do when stream=True was passed?', options: ['Loops once and stops', 'Iterates over each new chunk of the response as it arrives', 'Immediately collects the full response', 'Throws an error by default'], answerIndex: 1, explanation: "With stream=True, the call returns an iterator yielding each new chunk as it becomes available." },
    { id: 'c5q3', kind: 'application', prompt: 'Why use print(text, end="") instead of the default print(text) for a live-typing effect?', options: ['No real difference', 'The default print() adds a newline after every call, breaking the continuous live-typing appearance', 'print() is slower with end=""', 'end="" is required by the SDK'], answerIndex: 1, explanation: "Suppressing the default newline lets consecutive chunks visually append to the same line." },
    { id: 'c5q4', kind: 'code_reading', prompt: 'What does accumulating deltas into full_text achieve?', options: ['Nothing useful', 'Preserves the COMPLETE final text for later use (saving, logging, returning), not just live display', 'Slows down the stream', 'Prevents errors'], answerIndex: 1, explanation: "The live print shows text as it comes; a separate accumulated string lets you use the full answer afterward." },
    { id: 'c5q5', kind: 'debug', prompt: 'A stream fails partway through with no try/except. What happens?', options: ['Nothing, streams can’t fail', 'The program can crash or hang, losing whatever was streamed so far', 'It automatically retries', 'The terminal clears'], answerIndex: 1, explanation: "Without error handling around the block, a mid-stream failure is unhandled and can crash the process." },
    { id: 'c5q6', kind: 'concept', prompt: 'When is streaming LESS necessary?', options: ['Always necessary, no exceptions', 'For a background task where no one is watching live', 'For any user-facing chat', 'Never necessary'], answerIndex: 1, explanation: "Streaming's main benefit is perceived responsiveness for a live viewer — unneeded for silent background work." },
    { id: 'c5q7', kind: 'application', prompt: 'Why does the `if delta:` check matter when reading chunk.choices[0].delta.content?', options: ['It’s optional boilerplate', 'Some chunks carry no text content (None), so printing them unconditionally would error or print nothing useful', 'It has no real function', 'It only works with retries'], answerIndex: 1, explanation: "Guarding against None deltas avoids printing/concatenating empty or missing content." },
    { id: 'c5q8', kind: 'application', prompt: 'Why does ask_compass_streaming still wrap the whole block in try/except, similar to Lesson 4’s pattern?', options: ['It’s unnecessary here', 'A stream can also fail mid-way, and the function should still return something usable', 'Streams never fail', 'It replaces the need for a system prompt'], answerIndex: 1, explanation: "The same reliability principle from Lesson 4 applies to streaming — failures need graceful handling too." },
    { id: 'c5q9', kind: 'project', prompt: "Why does Compass keep BOTH ask_compass and ask_compass_streaming instead of replacing one with the other?", options: ['A mistake that should be fixed', 'Different use cases need different shapes — a plain return value vs. a live, in-progress effect', 'TypeScript requires both', 'They do the exact same thing'], answerIndex: 1, explanation: "A non-streaming call suits automated/background use; streaming suits an interactive, watched interaction." },
    { id: 'c5q10', kind: 'concept', prompt: 'Where will this exact streaming technique reappear later in the course?', options: ['Nowhere else', 'In the real Streamlit app once Compass is deployed, reading the stream in the browser instead of the terminal', 'Only in Module 1', 'It’s a one-off exercise with no reuse'], answerIndex: 1, explanation: "The accumulate-while-displaying pattern is the same one the Module 5 Streamlit app uses, just rendered differently." },
  ],

  homework: {
    task:
      "Add a visual 'thinking' indicator that prints '...' before the stream starts and gets erased the moment the first real chunk arrives, so there's clear feedback during the brief gap before streaming begins.",
    requirements: [
      "Print '...' (or similar) immediately after 'Compass: ' but before starting the stream loop.",
      "On receiving the FIRST non-empty delta, erase the '...' (e.g. using \\r and spaces) before printing the real text.",
      "Subsequent chunks print normally with no further erasing needed.",
    ],
    expectedOutcome:
      "Running Compass briefly shows 'Compass: ...' then the '...' cleanly disappears and is replaced by the real answer typing itself out.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 4,
      hint: "Lesson 4 asked you to make with_retry only retry a SPECIFIC error type (openai.RateLimitError), re-throwing anything else immediately.",
      steps: [
        "Import openai (in addition to from openai import OpenAI) if not already imported.",
        "In with_retry's except block, check if not isinstance(err, openai.RateLimitError): raise BEFORE the retry-budget check, so non-rate-limit errors fail immediately.",
        "Test with a function raising openai.RateLimitError twice then succeeding (should eventually succeed via retries).",
        "Test with a SEPARATE function raising a plain Exception once (should fail immediately, no retries attempted).",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "def with_retry(fn, retries=3):\n    for attempt in range(retries + 1):\n        try:\n            return fn()\n        except Exception as err:\n            if not isinstance(err, openai.RateLimitError) or attempt == retries:\n                raise\n            time.sleep(2 ** attempt)",
        },
      ],
    },
  },
};
