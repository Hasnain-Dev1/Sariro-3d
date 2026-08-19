import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 20 — Streaming Responses
 * Module 4 (AI Features) · Lesson 20 of 30
 */
export const lesson20: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 4,
  lessonIndex: 1,
  globalNumber: 20,
  name: 'Streaming responses',
  title: 'Streaming — Making Ask Momentum Feel Alive',
  subtitle: "Upgrade the AI reply from 'wait, then dump' to a live, word-by-word stream.",

  concept: {
    durationMin: 15,
    summary:
      "Understand why AI replies stream token-by-token, and learn to read a streaming response on both the server and client to build a live-typing effect.",
    sections: [
      {
        heading: 'The problem with Lesson 19’s approach',
        body:
          "In Lesson 19, the route waits for Claude's ENTIRE reply before sending anything back — for a longer response, that can feel like a multi-second frozen pause. Real AI products (including this course's own assistant) show text appearing progressively, word by word, which both feels faster and lets the user start reading immediately.",
      },
      {
        heading: 'What is streaming?',
        body:
          "Instead of one big response at the end, the AI sends its reply in small pieces (often called chunks or tokens) as they're generated. Your server can forward each piece to the browser THE MOMENT it arrives, rather than waiting to collect everything first.",
      },
      {
        heading: 'Streaming on the server: an async generator',
        body:
          "The Anthropic SDK supports a streaming mode: anthropic.messages.stream(...) gives you an async iterator you can loop over with for await...of, receiving one small piece of text at a time. In a Next.js route, you wrap this in a ReadableStream and return it directly as the response body, instead of NextResponse.json().",
        code: {
          language: 'typescript',
          filename: 'app/api/coach/route.ts (streaming version)',
          code:
            "export async function POST(req: NextRequest) {\n  const { message } = await req.json();\n\n  const stream = new ReadableStream({\n    async start(controller) {\n      const claudeStream = anthropic.messages.stream({\n        model: 'claude-sonnet-5',\n        max_tokens: 300,\n        messages: [{ role: 'user', content: message }],\n      });\n\n      for await (const event of claudeStream) {\n        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n          controller.enqueue(new TextEncoder().encode(event.delta.text));\n        }\n      }\n      controller.close();\n    },\n  });\n\n  return new Response(stream);\n}",
        },
      },
      {
        heading: 'Reading a stream on the client',
        body:
          "fetch()'s response has a body that's itself a readable stream. You get a reader with response.body.getReader(), then loop, calling reader.read() repeatedly — each call gives you the next chunk of bytes (decoded into text) until done becomes true. Each chunk gets appended to your message state, which is what creates the live-typing visual effect.",
        code: {
          language: 'tsx',
          code:
            "const res = await fetch('/api/coach', { method: 'POST', body: JSON.stringify({ message }) });\nconst reader = res.body!.getReader();\nconst decoder = new TextDecoder();\n\nlet fullText = '';\nwhile (true) {\n  const { done, value } = await reader.read();\n  if (done) break;\n  fullText += decoder.decode(value);\n  setReply(fullText);   // update state -> React re-renders with more text visible\n}",
        },
      },
      {
        heading: 'Why this feels so much better',
        body:
          "Streaming doesn't make the AI faster overall — it changes WHEN the user sees progress. Instead of a loading spinner then a wall of text, they see the answer forming in real time, which feels responsive even for a longer reply. This is the exact experience behind modern AI chat products.",
      },
    ],
    keyTerms: [
      { term: 'Streaming', definition: "Sending a response in small pieces as they're generated, instead of all at once." },
      { term: 'Chunk / token', definition: "One small piece of a streamed response — often a few characters or a word." },
      { term: 'ReadableStream', definition: "A web API for producing a stream of data piece by piece; used as a Response body." },
      { term: 'reader.read()', definition: "Reads the next chunk from a stream on the client; returns { done, value }." },
      { term: 'TextDecoder', definition: "Converts a stream's raw bytes into readable text." },
    ],
    commonMistakes: [
      "Forgetting controller.close() at the end of a server stream, leaving the connection hanging open.",
      "Not accumulating chunks correctly on the client (overwriting instead of appending), so only the last chunk shows.",
      "Trying to JSON.parse a streamed response as if it were one complete JSON object — it's raw text chunks, not structured JSON.",
      "Forgetting the while(true) loop needs a break condition (done) or it never stops reading.",
      "Not handling a stream error mid-way, leaving the UI stuck 'typing' forever if the connection drops.",
    ],
    takeaways: [
      "Streaming sends AI output progressively instead of all at once.",
      "The Anthropic SDK's stream mode gives you pieces via for await...of.",
      "A Next.js route can return a ReadableStream directly as its response body.",
      "The client reads chunks with reader.read() in a loop, appending each to state.",
      "Streaming is primarily a PERCEIVED-speed and UX improvement, not a technical speedup.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A typewriter effect (simulated stream)',
    objective:
      "Practise the client-side accumulate-and-render pattern using a simple simulated stream, before touching the real API — the exact rendering logic Ask Momentum will use.",
    instructions: [
      "Create a \"use client\" component with a fixed sentence stored as a string.",
      "Use useState for the currently displayed text and a useEffect with setInterval.",
      "Reveal one more character every ~30ms until the full sentence shows.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/Typewriter.tsx',
        code:
          "'use client';\nimport { useEffect, useState } from 'react';\n\nconst FULL_TEXT = 'Small habits, repeated, become who you are.';\n\nexport function Typewriter() {\n  const [shown, setShown] = useState('');\n\n  useEffect(() => {\n    let i = 0;\n    const timer = setInterval(() => {\n      i += 1;\n      setShown(FULL_TEXT.slice(0, i));\n      if (i >= FULL_TEXT.length) clearInterval(timer);\n    }, 30);\n    return () => clearInterval(timer);   // clean up if the component unmounts early\n  }, []);\n\n  return <p>{shown}</p>;\n}",
      },
    ],
    explanation:
      "shown starts empty. The effect runs once on mount, starting a setInterval that fires every 30ms, each time revealing ONE MORE character with FULL_TEXT.slice(0, i) — this is functionally identical to appending streamed chunks, just simulated with a timer instead of a real network stream. Once i reaches the full length, clearInterval stops the timer. The returned cleanup function (return () => clearInterval(timer)) is important: if the component unmounts before finishing, React calls it automatically to avoid a memory leak — the same care streaming code needs for a real fetch that might be abandoned mid-flight.",
    expectedOutput:
      "The sentence 'Small habits, repeated, become who you are.' appears character by character, like it's being typed, finishing in just over a second.",
    learned: [
      "How to reveal text progressively with state + an interval.",
      "How a cleanup function prevents leaks from an abandoned effect.",
      "The same visual pattern real streaming will produce.",
      "Why appending (not replacing) state creates a growing-text effect.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's /api/coach route now streams, and a real Ask Momentum chat panel shows Claude's reply appearing live.",
    why:
      "This turns Ask Momentum from a 'wait then dump' interaction into the smooth, modern AI experience users expect — and it's the exact upgrade path real products take once the basic connection works.",
    fileLocation: "app/api/coach/route.ts (streaming) and components/AskMomentum.tsx (new chat panel)",
    code: [
      {
        language: 'typescript',
        filename: 'app/api/coach/route.ts (replace the body with streaming)',
        code:
          "export async function POST(req: NextRequest) {\n  const { message } = await req.json();\n  if (!message || typeof message !== 'string') {\n    return NextResponse.json({ error: 'A message is required.' }, { status: 400 });\n  }\n\n  const stream = new ReadableStream({\n    async start(controller) {\n      try {\n        const claudeStream = anthropic.messages.stream({\n          model: 'claude-sonnet-5',\n          max_tokens: 300,\n          system: 'You are Ask Momentum, a warm, encouraging habit coach. Keep replies short — 2-4 sentences.',\n          messages: [{ role: 'user', content: message }],\n        });\n        for await (const event of claudeStream) {\n          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n            controller.enqueue(new TextEncoder().encode(event.delta.text));\n          }\n        }\n      } finally {\n        controller.close();\n      }\n    },\n  });\n\n  return new Response(stream);\n}",
      },
      {
        language: 'tsx',
        filename: 'components/AskMomentum.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\nexport function AskMomentum() {\n  const [input, setInput] = useState('');\n  const [reply, setReply] = useState('');\n  const [loading, setLoading] = useState(false);\n\n  async function ask() {\n    if (!input.trim()) return;\n    setLoading(true);\n    setReply('');\n\n    const res = await fetch('/api/coach', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ message: input }),\n    });\n    const reader = res.body!.getReader();\n    const decoder = new TextDecoder();\n\n    let fullText = '';\n    while (true) {\n      const { done, value } = await reader.read();\n      if (done) break;\n      fullText += decoder.decode(value);\n      setReply(fullText);\n    }\n    setLoading(false);\n  }\n\n  return (\n    <section id=\"ask\" className=\"py-8\">\n      <h2 className=\"text-xl font-bold mb-3\">Ask Momentum</h2>\n      <div className=\"flex gap-2 mb-3\">\n        <input\n          value={input}\n          onChange={(e) => setInput(e.target.value)}\n          placeholder=\"Ask your coach anything…\"\n          className=\"flex-1 border border-slate-200 rounded-lg px-3 py-2\"\n        />\n        <button onClick={ask} disabled={loading} className=\"bg-brand text-white font-bold px-4 rounded-lg disabled:opacity-50\">\n          {loading ? '…' : 'Ask'}\n        </button>\n      </div>\n      {reply && <p className=\"bg-brand-soft border border-brand/20 rounded-xl p-4 text-sm\">{reply}</p>}\n    </section>\n  );\n}",
      },
    ],
    placement:
      "1) Replace your /api/coach route's body with the streaming version above. 2) Create components/AskMomentum.tsx. 3) Import and render <AskMomentum /> in app/page.tsx, below <HabitsSection />.",
    implementation:
      "The route wraps Claude's stream in a try/finally so controller.close() always runs, even on an error, cleanly ending the response. AskMomentum follows the mini-project's accumulate pattern exactly, but against a real network stream: it clears reply before starting, reads chunks in a loop, and calls setReply(fullText) after EVERY chunk — each call re-renders the component with slightly more text, producing the live-typing effect. The Ask button disables while loading to prevent double-submits, matching the defensive pattern from Lesson 15's quote fetcher.",
    expectedResult:
      "Typing a question and clicking Ask shows Claude's reply appearing progressively, word by word, inside a soft green callout box — genuinely feeling like a live coach responding, not a static page.",
    connects:
      "Ask Momentum works, but its advice is generic — it doesn't know your actual habits or streaks yet. Lesson 21 sharpens its prompt engineering, and Lesson 22 gives it real access to your habit data via tool use, so its advice becomes personal.",
  },

  quiz: [
    { id: 'l20q1', kind: 'concept', prompt: 'What does streaming change about an AI response?', options: ['It makes the AI think faster', 'Text arrives progressively instead of all at once at the end', 'It removes the need for a server', 'It changes the AI’s answers'], answerIndex: 1, explanation: "Streaming is about DELIVERY — showing output as it's generated rather than waiting for the whole thing." },
    { id: 'l20q2', kind: 'code_reading', prompt: 'What does controller.enqueue(...) do inside a ReadableStream?', options: ['Ends the stream', 'Sends a chunk of data to whoever is reading the stream', 'Deletes the previous chunk', 'Starts a new request'], answerIndex: 1, explanation: "enqueue pushes a piece of data into the stream, making it available to the reader immediately." },
    { id: 'l20q3', kind: 'debug', prompt: 'A stream never finishes on the client — the loading state stays true forever. Likely server-side bug?', options: ['Too many chunks were sent', 'controller.close() was never called', 'The system prompt is too long', 'TextEncoder is missing'], answerIndex: 1, explanation: "Without close(), the stream never signals it's done, so the client's read() loop never sees done: true." },
    { id: 'l20q4', kind: 'application', prompt: 'On the client, how do you read a streaming fetch response?', options: ['response.json() once', 'response.body.getReader() and a read() loop', 'JSON.parse(response)', 'It can’t be read incrementally'], answerIndex: 1, explanation: "getReader() plus a loop calling read() is how you consume a stream chunk by chunk on the client." },
    { id: 'l20q5', kind: 'code_reading', prompt: 'Why does the client loop use fullText += decoder.decode(value) instead of setReply(decoder.decode(value)) alone?', options: ['No difference', 'To ACCUMULATE all chunks so far, not just show the latest one', 'It’s required syntax', 'To decode faster'], answerIndex: 1, explanation: "Each chunk is only a small piece; appending it to the growing fullText is what produces the full, growing message." },
    { id: 'l20q6', kind: 'concept', prompt: 'Why is streaming considered mainly a UX improvement rather than a speed improvement?', options: ['It has no benefit at all', 'The total generation time is similar; what changes is WHEN the user sees progress', 'It literally makes Claude compute faster', 'It skips generating some of the text'], answerIndex: 1, explanation: "The full response still takes about as long to generate; streaming changes the perceived responsiveness by showing progress immediately." },
    { id: 'l20q7', kind: 'debug', prompt: 'A student’s while(true) read loop never exits and the tab freezes. Likely missing piece?', options: ['A break when done is true', 'A console.log', 'The Ask button', 'A CSS class'], answerIndex: 0, explanation: "Without checking done and breaking, the loop keeps calling read() indefinitely." },
    { id: 'l20q8', kind: 'application', prompt: 'Why disable the Ask button while loading?', options: ['Purely visual, no real reason', 'To prevent the user from firing multiple overlapping requests', 'Buttons must always be disabled sometimes', 'It stops the stream from arriving'], answerIndex: 1, explanation: "Disabling during an in-flight request avoids duplicate, overlapping calls — the same guard used for the add-habit form." },
    { id: 'l20q9', kind: 'project', prompt: "Why does AskMomentum call setReply('') at the START of ask(), before the stream begins?", options: ['It’s required by fetch', 'To clear any PREVIOUS answer before the new one starts streaming in', 'To reset the input field', 'It has no effect'], answerIndex: 1, explanation: "Clearing the old reply first avoids briefly showing stale text mixed with the new streaming answer." },
    { id: 'l20q10', kind: 'output', prompt: 'What does TextDecoder do in the client’s read loop?', options: ['Converts raw stream bytes into readable text', 'Encrypts the message', 'Sends the request', 'Formats JSON'], answerIndex: 0, explanation: "Streamed chunks arrive as raw bytes; TextDecoder converts them into a usable string." },
  ],

  homework: {
    task:
      "Add a small animated 'typing' indicator (e.g. three bouncing dots, or simply the text '…') that shows ONLY while loading is true and the reply is still empty, disappearing the instant the first chunk of real text arrives.",
    requirements: [
      "Show the indicator only when loading && !reply (loading, but nothing streamed in yet).",
      "It should disappear automatically once reply starts receiving text (no manual toggling needed beyond the existing state).",
      "Keep it simple — plain text or a small CSS animation, no new libraries.",
    ],
    expectedOutcome:
      "Clicking Ask briefly shows a typing indicator BEFORE any text arrives; the moment the first word streams in, the indicator is replaced by the growing reply text.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 19,
      hint: "Lesson 19 asked you to extend /api/coach to accept an optional tone field and adjust the system prompt accordingly.",
      steps: [
        "In the request body destructure, read tone as well: const { message, tone } = await req.json();",
        "Write a small mapping from tone to a description, defaulting to 'encouraging' when tone is missing.",
        "Build the system string using that description, e.g. `You are Ask Momentum, a ${toneDescription} habit coach...`",
        "Test by sending the same message with tone: 'funny' vs tone: 'direct' and comparing the replies.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'app/api/coach/route.ts',
          code:
            "const { message, tone } = await req.json();\n\nconst TONE_MAP: Record<string, string> = {\n  encouraging: 'warm and encouraging',\n  direct: 'blunt and no-nonsense',\n  funny: 'playful and lightly humorous',\n};\nconst toneDescription = TONE_MAP[tone] ?? TONE_MAP.encouraging;\n\nconst system = `You are Ask Momentum, a ${toneDescription} habit coach. Keep replies short — 2-4 sentences.`;",
        },
      ],
    },
  },
};
