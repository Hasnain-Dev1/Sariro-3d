import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 23 — Error Handling & Rate Limits
 * Module 4 (AI Features) · Lesson 23 of 30
 */
export const lesson23: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 4,
  lessonIndex: 4,
  globalNumber: 23,
  name: 'Error handling & rate limits',
  title: 'Error Handling — Making Ask Momentum Resilient',
  subtitle: "Handle network failures, rate limits, and empty input gracefully — no more silent breakage.",

  concept: {
    durationMin: 15,
    summary:
      "Learn to anticipate and handle the real failure modes of an AI feature — network errors, rate limits, and bad input — so the user always gets clear feedback instead of a stuck or broken UI.",
    sections: [
      {
        heading: 'Why AI features fail more than you’d expect',
        body:
          "Ask Momentum depends on THREE things working: the user's network, your server, and Anthropic's API. Any one can fail — a dropped connection, a server error, or a rate limit (too many requests too fast) — and unlike a static page, a broken AI call can leave the UI stuck 'thinking' forever if you don't handle it.",
      },
      {
        heading: 'Rate limits — what they are',
        body:
          "APIs cap how many requests you can make in a given time window, to protect the service and your billing. If you exceed it, the API returns an error (often HTTP 429 'Too Many Requests') instead of a normal reply. A production app should catch this specifically and show a friendly 'Please wait a moment' message rather than a generic crash.",
      },
      {
        heading: 'try/catch on the server route',
        body:
          "Wrap the whole handler in try/catch. Inside catch, return a clear JSON error with an appropriate status code instead of letting the request hang or return a broken response. Different failure types deserve different messages where practical.",
        code: {
          language: 'typescript',
          code:
            "export async function POST(req: NextRequest) {\n  try {\n    // ...validate input, call Claude\n  } catch (err) {\n    console.error('Ask Momentum error:', err);\n    return NextResponse.json(\n      { error: 'Ask Momentum is having trouble right now. Try again in a moment.' },\n      { status: 500 }\n    );\n  }\n}",
        },
      },
      {
        heading: 'Handling failures on the client',
        body:
          "The client-side fetch/stream logic ALSO needs its own try/catch. If the network drops mid-stream, or the response comes back with an error status, the UI must exit its loading state and show something useful — never leave a spinner or 'thinking' indicator running forever.",
        code: {
          language: 'tsx',
          code:
            "try {\n  const res = await fetch('/api/coach', { method: 'POST', body: JSON.stringify(payload) });\n  if (!res.ok) throw new Error('Request failed');\n  // ...read the stream\n} catch {\n  setError('Ask Momentum is unavailable right now. Please try again.');\n} finally {\n  setLoading(false);\n}",
        },
      },
      {
        heading: 'Designing for the user, not just the code',
        body:
          "Good error UX isn't just 'don't crash' — it's giving the user a clear next step: retry, wait, or rephrase. A generic 'Error' message is unhelpful; 'Ask Momentum is unavailable right now — try again in a moment' tells the user exactly what happened and what to do. This is the same care Module 1's homework put into hover states and empty lists, now applied to failure states.",
      },
    ],
    keyTerms: [
      { term: 'Rate limit', definition: "A cap on how many requests an API allows in a time window; exceeding it returns an error (often 429)." },
      { term: 'HTTP status code', definition: "A number indicating the result of a request (200 = success, 429 = rate limited, 500 = server error)." },
      { term: 'Error state', definition: "UI shown when a request fails, giving the user clear information and options." },
      { term: 'Graceful degradation', definition: "Designing a feature to fail in a controlled, user-friendly way rather than breaking completely." },
    ],
    commonMistakes: [
      "Only handling the happy path, leaving a loading spinner stuck forever on any failure.",
      "Showing a raw technical error message (e.g. a stack trace) to the user instead of a friendly explanation.",
      "Forgetting finally to guarantee loading always turns off, success or failure.",
      "Not distinguishing rate-limit errors from other failures, missing a chance to say 'try again shortly' specifically.",
      "Never actually testing failure — disconnecting the network or using an invalid key to see what really happens.",
    ],
    takeaways: [
      "Wrap both the server route and client fetch logic in try/catch.",
      "Always use finally to guarantee loading state resolves, success or failure.",
      "Rate limits are a normal, expected failure mode for AI APIs — handle them specifically where possible.",
      "Show clear, friendly error messages with a next step, not raw technical detail.",
      "Actually TEST failure scenarios — don't assume error handling works until you've triggered it.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A deliberately-broken fetch, handled gracefully',
    objective:
      "Practise complete error handling by calling a fetch that WILL fail (a bad URL) and confirming the UI recovers cleanly.",
    instructions: [
      "Create a \"use client\" component with a button and a status message.",
      "fetch a URL that doesn't exist (guaranteed to fail).",
      "Wrap it in try/catch/finally, updating loading and error state correctly.",
      "Confirm the UI never gets stuck.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/BrokenFetch.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\nexport function BrokenFetch() {\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [data, setData] = useState<string | null>(null);\n\n  async function load() {\n    setLoading(true);\n    setError(null);\n    setData(null);\n    try {\n      const res = await fetch('https://this-domain-does-not-exist-12345.com/api');\n      if (!res.ok) throw new Error('Request failed');\n      const json = await res.json();\n      setData(JSON.stringify(json));\n    } catch {\n      setError('Could not load data. Please try again.');\n    } finally {\n      setLoading(false);\n    }\n  }\n\n  return (\n    <div>\n      <button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Load data'}</button>\n      {error && <p style={{ color: 'red' }}>{error}</p>}\n      {data && <p>{data}</p>}\n    </div>\n  );\n}",
      },
    ],
    explanation:
      "load() sets loading true and clears any previous error/data before starting — a clean slate every attempt. The fetch call targets a URL guaranteed to fail (a non-existent domain), so the try block throws. catch sets a friendly error message — never the raw technical exception. Critically, finally always runs regardless of success or failure, guaranteeing loading returns to false — this is what prevents the button getting stuck saying 'Loading…' forever. The UI shows either the error OR the data, never a frozen, ambiguous state.",
    expectedOutput:
      "Clicking 'Load data' briefly shows 'Loading…', then displays 'Could not load data. Please try again.' in red — the button becomes clickable again immediately, ready to retry.",
    learned: [
      "How to guarantee a loading state always resolves with finally.",
      "How to show a friendly error instead of a technical one.",
      "How to reset error/data state at the start of each attempt.",
      "Why deliberately testing failure paths matters.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Ask Momentum becomes genuinely resilient — handling network failures, rate limits, and bad input on both the server and client, with clear user-facing messages.",
    why:
      "An AI feature that silently breaks under real-world conditions (flaky wifi, a busy API) reflects badly on the whole app. This lesson makes Ask Momentum trustworthy, not just impressive when everything goes right.",
    fileLocation: "app/api/coach/route.ts (server-side try/catch + status codes) and components/AskMomentum.tsx (client-side error state)",
    code: [
      {
        language: 'typescript',
        filename: 'app/api/coach/route.ts (hardened)',
        code:
          "export async function POST(req: NextRequest) {\n  let body: { messages?: ChatMessage[]; habitsContext?: string };\n  try {\n    body = await req.json();\n  } catch {\n    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });\n  }\n\n  const { messages, habitsContext } = body;\n  if (!Array.isArray(messages) || messages.length === 0) {\n    return NextResponse.json({ error: 'messages is required.' }, { status: 400 });\n  }\n\n  const system = `You are Ask Momentum, a warm, encouraging habit coach.\nAlways reply in 2-3 sentences. The user's current habits: ${habitsContext || 'no habits yet'}.`;\n\n  try {\n    const stream = new ReadableStream({\n      async start(controller) {\n        try {\n          const claudeStream = anthropic.messages.stream({ model: 'claude-sonnet-5', max_tokens: 300, system, messages });\n          for await (const event of claudeStream) {\n            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n              controller.enqueue(new TextEncoder().encode(event.delta.text));\n            }\n          }\n        } catch (err) {\n          const message = err instanceof Anthropic.APIError && err.status === 429\n            ? 'Ask Momentum is busy right now — please try again in a moment.'\n            : 'Ask Momentum ran into a problem generating a reply.';\n          controller.enqueue(new TextEncoder().encode(`\\n[error]${message}`));\n        } finally {\n          controller.close();\n        }\n      },\n    });\n    return new Response(stream);\n  } catch (err) {\n    console.error('Ask Momentum route error:', err);\n    return NextResponse.json({ error: 'Ask Momentum is unavailable right now.' }, { status: 500 });\n  }\n}",
      },
      {
        language: 'tsx',
        filename: 'components/AskMomentum.tsx (client error handling)',
        code:
          "async function send() {\n  if (!input.trim()) return;\n  const userMsg: ChatMessage = { role: 'user', content: input };\n  const history = [...messages, userMsg];\n  setMessages(history);\n  setInput('');\n  setLoading(true);\n  setError(null);\n\n  try {\n    const habitsContext = habits.map((h) => `${h.name} (${h.streak}d)`).join(', ');\n    const res = await fetch('/api/coach', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ messages: history, habitsContext }),\n    });\n    if (!res.ok) throw new Error('Request failed');\n\n    const reader = res.body!.getReader();\n    const decoder = new TextDecoder();\n    let fullReply = '';\n    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);\n    while (true) {\n      const { done, value } = await reader.read();\n      if (done) break;\n      fullReply += decoder.decode(value);\n      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: fullReply }]);\n    }\n  } catch {\n    setError('Ask Momentum is unavailable right now. Please try again.');\n  } finally {\n    setLoading(false);\n  }\n}",
      },
    ],
    placement:
      "1) Update /api/coach/route.ts with the hardened version above — note the outer try/catch around the whole handler, the inner try/catch/finally inside the stream (catching a rate-limit specifically), and the body-parsing guard. 2) Update AskMomentum's send() function with the try/catch/finally shown, adding an error state and clearing it at the start of each attempt.",
    implementation:
      "The route now has THREE layers of safety: a guard for malformed JSON, a guard for a missing/empty messages array, and a try/catch around the whole streaming setup catching unexpected failures with a 500. Inside the stream itself, a nested try/catch distinguishes a 429 rate-limit error (checked via err instanceof Anthropic.APIError && err.status === 429) from any other failure, enqueuing a special '[error]...' marker as text so the client can detect and display it. On the client, send() wraps the entire fetch-and-stream flow: !res.ok catches a non-2xx response early, any thrown error sets a friendly error state, and finally guarantees loading always ends — mirroring the mini-project's pattern exactly, now applied to the real, more complex Ask Momentum flow.",
    expectedResult:
      "Turning off your network mid-question and clicking Send shows a clear error message instead of a stuck spinner. The button becomes usable again immediately, ready to retry once the connection is back.",
    connects:
      "Ask Momentum is now feature-complete AND resilient: streaming, personalized via real habit context, holds a real conversation, and fails gracefully. Lesson 24 (the Module 4 build) reviews and polishes the whole AI coach experience end-to-end, closing out this module before deployment in Module 5.",
  },

  quiz: [
    { id: 'l23q1', kind: 'concept', prompt: 'Why can an AI feature fail more often than a typical static page?', options: ['AI features are inherently unstable', 'It depends on the network, your server, AND an external API — any one can fail', 'React causes more errors', 'It’s a myth, they don’t fail more'], answerIndex: 1, explanation: "Multiple dependent systems (network, server, external API) each introduce their own possible failure points." },
    { id: 'l23q2', kind: 'concept', prompt: 'What is a rate limit?', options: ['A speed setting for animations', 'A cap on how many requests an API allows in a time window', 'A CSS property', 'A type of database index'], answerIndex: 1, explanation: "APIs limit request frequency to protect the service; exceeding it returns an error like 429." },
    { id: 'l23q3', kind: 'code_reading', prompt: 'What does the finally block guarantee in the send() function?', options: ['It only runs on success', 'It always runs, ensuring loading is set back to false regardless of outcome', 'It retries the request', 'It clears the messages array'], answerIndex: 1, explanation: "finally runs whether the try succeeded or the catch caught an error, guaranteeing loading resolves." },
    { id: 'l23q4', kind: 'debug', prompt: 'A user’s AI request fails and the "thinking" indicator spins forever. Likely missing piece?', options: ['A key prop', 'A finally block resetting loading to false', 'More max_tokens', 'A system prompt'], answerIndex: 1, explanation: "Without a guaranteed reset (via finally), a failure can leave the loading state stuck true." },
    { id: 'l23q5', kind: 'application', prompt: 'Which is a better error message for the user?', options: ['"Error: fetch failed at line 42"', '"Ask Momentum is unavailable right now. Please try again."', '"undefined is not a function"', 'No message at all'], answerIndex: 1, explanation: "A clear, friendly message with an implied next step (try again) is far more useful than raw technical detail." },
    { id: 'l23q6', kind: 'code_reading', prompt: 'Why does the route check err instanceof Anthropic.APIError && err.status === 429 specifically?', options: ['To crash the app faster', 'To detect a rate-limit error specifically and give a more accurate, helpful message', 'It’s required by TypeScript', 'To bypass the error entirely'], answerIndex: 1, explanation: "Distinguishing a rate limit lets the app tell the user something more specific and actionable than a generic failure." },
    { id: 'l23q7', kind: 'application', prompt: 'Where should error-handling logic live for a fetch call?', options: ['Only on the server', 'Only on the client', 'On BOTH the server route and the client fetch logic', 'Nowhere, errors are rare'], answerIndex: 2, explanation: "The server should fail safely and return clear errors; the client must also handle a failed/erroring request gracefully." },
    { id: 'l23q8', kind: 'debug', prompt: 'The server route parses req.json() without a try/catch and a malformed request crashes it. What’s the fix?', options: ['Remove req.json() entirely', 'Wrap the parsing in its own try/catch and return a 400 on failure', 'Ignore the error', 'Increase max_tokens'], answerIndex: 1, explanation: "Guarding JSON parsing specifically prevents an unhandled crash from a malformed request body." },
    { id: 'l23q9', kind: 'project', prompt: "In AskMomentum's send(), why is setError(null) called at the START of each attempt?", options: ['It’s unnecessary', 'To clear any PREVIOUS error before a new attempt, so an old message doesn’t linger incorrectly', 'To reset the habits data', 'It stops the stream'], answerIndex: 1, explanation: "Clearing prior error state avoids showing a stale error message alongside (or instead of) a successful new attempt." },
    { id: 'l23q10', kind: 'concept', prompt: 'What does "graceful degradation" mean in this context?', options: ['The app gets slower over time', 'A feature fails in a controlled, user-friendly way rather than breaking completely', 'CSS animations slowing down', 'Reducing image quality'], answerIndex: 1, explanation: "It's the principle of designing for failure so the user experience degrades gracefully instead of catastrophically." },
  ],

  homework: {
    task:
      "Detect the special '[error]...' marker the route can enqueue mid-stream (from a rate-limit or generation failure) on the CLIENT side, and show it as a proper error message instead of leaving it as literal text inside the chat bubble.",
    requirements: [
      "While accumulating fullReply, check if it contains the '\\n[error]' marker.",
      "If found, split the text before the marker (keep as the partial reply, if any) and set the part after it as an error message via setError.",
      "The chat bubble should not show the raw '[error]...' text to the user.",
    ],
    expectedOutcome:
      "If the AI generation fails mid-stream, the user sees a clean error message (not raw marker text) and any earlier good text isn't lost as literal characters.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 22,
      hint: "Lesson 22 asked you to add a 'Clear conversation' button that resets messages to an empty array, disabled while loading.",
      steps: [
        "Add a button near the chat thread, e.g. after the input row.",
        "onClick={() => setMessages([])} — a direct reset, not a functional update, since we're intentionally discarding history.",
        "Add disabled={loading} so it can't be clicked mid-stream.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/AskMomentum.tsx',
          code:
            "<button\n  onClick={() => setMessages([])}\n  disabled={loading}\n  className=\"text-xs text-slate-400 hover:text-slate-600 mt-2\"\n>\n  Clear conversation\n</button>",
        },
      ],
    },
  },
};
