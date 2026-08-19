import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 26 — Agent UI Patterns
 * Module 5 (Deploy + Capstone) · Lesson 26 of 30
 */
export const lesson26: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 1,
  globalNumber: 26,
  name: 'Agent UI patterns',
  title: 'A Real Chat UI — Compass on the Web',
  subtitle: "Build a React chat interface with per-session memory, so multiple people can use Compass at once.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to build a chat UI for an agent, and how to keep each web visitor's conversation separate using a session id.",
    sections: [
      {
        heading: 'The multi-user memory problem',
        body:
          "Lesson 25 flagged it: a module-level messages array or a single memory.json file assumes ONE user. On the web, EVERY visitor needs their own separate conversation history and (ideally) their own memory. The fix: identify each visitor with a session id, and key stored data by that id.",
      },
      {
        heading: 'A session id via a cookie',
        body:
          "A simple approach: generate a random id for a new visitor, store it in a cookie, and use it as a key. Next.js Route Handlers can read/set cookies directly.",
        code: {
          language: 'typescript',
          code:
            "import { cookies } from 'next/headers';\nimport { randomUUID } from 'crypto';\n\nasync function getSessionId(): Promise<string> {\n  const cookieStore = await cookies();\n  let sessionId = cookieStore.get('compass-session')?.value;\n  if (!sessionId) {\n    sessionId = randomUUID();\n    cookieStore.set('compass-session', sessionId);\n  }\n  return sessionId;\n}",
        },
      },
      {
        heading: 'Keying conversation state by session',
        body:
          "Instead of ONE module-level messages array, use a Map keyed by session id — each visitor gets their own isolated conversation history, all served by the same running server.",
        code: {
          language: 'typescript',
          code:
            "const sessionHistories = new Map<string, Anthropic.MessageParam[]>();\n\nfunction getHistory(sessionId: string): Anthropic.MessageParam[] {\n  if (!sessionHistories.has(sessionId)) sessionHistories.set(sessionId, []);\n  return sessionHistories.get(sessionId)!;\n}",
        },
      },
      {
        heading: 'A React chat component',
        body:
          "The UI itself follows the exact chat-thread pattern used elsewhere in this course's AI features: a messages array in state, a controlled input, streaming or non-streaming replies rendered as a growing thread.",
        code: {
          language: 'tsx',
          code:
            "'use client';\nimport { useState } from 'react';\n\ninterface ChatMessage { role: 'user' | 'assistant'; content: string }\n\nexport function CompassChat() {\n  const [messages, setMessages] = useState<ChatMessage[]>([]);\n  const [input, setInput] = useState('');\n  const [loading, setLoading] = useState(false);\n\n  async function send() {\n    if (!input.trim()) return;\n    setMessages((prev) => [...prev, { role: 'user', content: input }]);\n    setLoading(true);\n    const res = await fetch('/api/compass', {\n      method: 'POST', headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ question: input }), credentials: 'include',\n    });\n    const { reply } = await res.json();\n    setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);\n    setInput('');\n    setLoading(false);\n  }\n\n  return (\n    <div>\n      {messages.map((m, i) => <p key={i}><b>{m.role}:</b> {m.content}</p>)}\n      <input value={input} onChange={(e) => setInput(e.target.value)} />\n      <button onClick={send} disabled={loading}>Send</button>\n    </div>\n  );\n}",
        },
      },
      {
        heading: 'credentials: \'include\' matters',
        body:
          "For the browser to actually SEND the session cookie with each fetch, the request needs credentials: 'include' — an easy detail to miss that silently breaks per-user session continuity.",
      },
    ],
    keyTerms: [
      { term: 'Session id', definition: "A unique identifier for one visitor's browsing session, used to separate their data from others'." },
      { term: 'Cookie', definition: "A small piece of data stored in the browser and sent with requests, commonly used to identify a session." },
      { term: 'Per-session state', definition: "Data (like conversation history) scoped to one specific user's session, not shared globally." },
    ],
    commonMistakes: [
      "Keeping a single module-level messages array on the server, causing every visitor to see and pollute the same conversation.",
      "Forgetting credentials: 'include' on the fetch call, so the session cookie never actually gets sent.",
      "Not generating a NEW session id for a first-time visitor with no existing cookie.",
      "Storing sensitive data in a Map that grows forever with no cleanup — a real production concern beyond this course's scope, worth being aware of.",
      "Building the chat UI without a loading/disabled state, allowing duplicate rapid submissions.",
    ],
    takeaways: [
      "Multiple web users need separated conversation state, not one shared array.",
      "A session cookie is a simple way to identify and key each visitor's data.",
      "A Map keyed by session id cleanly isolates each user's conversation history.",
      "The chat UI itself follows the same pattern used for AI features throughout this course.",
      "credentials: 'include' is required for session cookies to actually work.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A session-aware counter API',
    objective:
      "Practise the session-id-plus-Map pattern with a simple per-visitor counter before applying it to Compass's real conversation history.",
    instructions: [
      "Create app/api/counter/route.ts using the getSessionId() cookie pattern.",
      "Keep a Map<string, number> of per-session counts.",
      "Each GET request increments and returns that session's OWN count.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'app/api/counter/route.ts',
        code:
          "import { NextResponse } from 'next/server';\nimport { cookies } from 'next/headers';\nimport { randomUUID } from 'crypto';\n\nconst counts = new Map<string, number>();\n\nexport async function GET() {\n  const cookieStore = await cookies();\n  let sessionId = cookieStore.get('counter-session')?.value;\n  if (!sessionId) {\n    sessionId = randomUUID();\n    cookieStore.set('counter-session', sessionId);\n  }\n\n  const current = (counts.get(sessionId) ?? 0) + 1;\n  counts.set(sessionId, current);\n  return NextResponse.json({ count: current });\n}",
      },
    ],
    explanation:
      "The first visit has no cookie, so a new sessionId is generated and set. Every subsequent visit (from the same browser) sends that SAME cookie back, so the counts.get(sessionId) lookup correctly finds and increments the SAME entry. Opening this endpoint in two different browsers (or an incognito window) proves isolation: each gets its own count starting from 1, never seeing or affecting the other's number — exactly the separation Compass's real conversation history needs.",
    expectedOutput:
      "Refreshing the endpoint in ONE browser shows count: 1, 2, 3... incrementing. Opening it in a DIFFERENT browser/incognito window shows its own separate count: 1, 2, 3... starting fresh.",
    learned: [
      "How to read and set a cookie in a Next.js Route Handler.",
      "How a Map keyed by session id isolates per-visitor state.",
      "How to verify session isolation with two different browser contexts.",
      "The exact pattern Compass's web conversation history will use.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gets a real chat interface AND per-session conversation isolation — multiple people can use it simultaneously without their conversations mixing.",
    why:
      "This is what makes Compass a genuinely usable web PRODUCT, not just a working API — a real chat experience that correctly separates every visitor's conversation.",
    fileLocation: "lib/compass.ts (session-aware history), app/api/compass/route.ts (use session id), components/CompassChat.tsx (new)",
    code: [
      {
        language: 'typescript',
        filename: 'lib/compass.ts (session-aware history)',
        code:
          "const sessionHistories = new Map<string, Anthropic.MessageParam[]>();\n\nfunction getHistory(sessionId: string): Anthropic.MessageParam[] {\n  if (!sessionHistories.has(sessionId)) sessionHistories.set(sessionId, []);\n  return sessionHistories.get(sessionId)!;\n}\n\nexport async function askCompass(sessionId: string, question: string): Promise<string> {\n  const history = getHistory(sessionId);\n  history.push({ role: 'user', content: question });\n  // ...the existing tool-use loop, using `history` instead of a module-level array...\n  return 'reply';\n}",
      },
      {
        language: 'typescript',
        filename: 'app/api/compass/route.ts (pass the session id through)',
        code:
          "import { cookies } from 'next/headers';\nimport { randomUUID } from 'crypto';\n\nexport async function POST(req: NextRequest) {\n  const cookieStore = await cookies();\n  let sessionId = cookieStore.get('compass-session')?.value;\n  if (!sessionId) {\n    sessionId = randomUUID();\n    cookieStore.set('compass-session', sessionId);\n  }\n\n  const { question } = await req.json();\n  if (!question || typeof question !== 'string') {\n    return NextResponse.json({ error: 'A question is required.' }, { status: 400 });\n  }\n\n  const reply = await askCompass(sessionId, question);\n  return NextResponse.json({ reply });\n}",
      },
      {
        language: 'tsx',
        filename: 'components/CompassChat.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\ninterface ChatMessage { role: 'user' | 'assistant'; content: string }\n\nexport function CompassChat() {\n  const [messages, setMessages] = useState<ChatMessage[]>([]);\n  const [input, setInput] = useState('');\n  const [loading, setLoading] = useState(false);\n\n  async function send() {\n    if (!input.trim() || loading) return;\n    const question = input;\n    setMessages((prev) => [...prev, { role: 'user', content: question }]);\n    setInput(''); setLoading(true);\n\n    const res = await fetch('/api/compass', {\n      method: 'POST', headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ question }), credentials: 'include',\n    });\n    const data = await res.json();\n    setMessages((prev) => [...prev, { role: 'assistant', content: data.reply ?? data.error }]);\n    setLoading(false);\n  }\n\n  return (\n    <div className=\"max-w-xl mx-auto p-4\">\n      <div className=\"space-y-2 mb-3\">\n        {messages.map((m, i) => (\n          <p key={i} className={m.role === 'user' ? 'font-semibold' : 'bg-slate-100 rounded-lg p-2'}>\n            {m.role === 'user' ? '🧑 ' : '🧭 '}{m.content}\n          </p>\n        ))}\n      </div>\n      <div className=\"flex gap-2\">\n        <input value={input} onChange={(e) => setInput(e.target.value)}\n          onKeyDown={(e) => e.key === 'Enter' && send()}\n          className=\"flex-1 border rounded-lg px-3 py-2\" />\n        <button onClick={send} disabled={loading} className=\"bg-violet-600 text-white px-4 rounded-lg\">\n          {loading ? '...' : 'Send'}\n        </button>\n      </div>\n    </div>\n  );\n}",
      },
    ],
    placement:
      "Update lib/compass.ts's askCompass() to accept a sessionId parameter and use getHistory(sessionId) instead of a module-level array. Update the API route to generate/read the session cookie and pass it through. Create components/CompassChat.tsx and render it on your home page (app/page.tsx).",
    implementation:
      "sessionHistories is a Map, not a single array — every distinct sessionId gets its OWN entry, created lazily on first use via getHistory()'s guard. The API route handles the cookie logic ONCE per request (read existing or generate new), then passes just the resulting sessionId string into askCompass(), keeping the agent logic itself simple and testable independent of HTTP/cookie concerns. CompassChat.tsx follows the established chat-UI pattern from elsewhere in this course: controlled input, a growing messages array, a disabled-while-loading Send button, and crucially credentials: 'include' so the session cookie actually round-trips with every request.",
    expectedResult:
      "Opening Compass in two different browser tabs (or incognito windows) and chatting in both shows each conversation staying completely separate — proof multiple simultaneous users are correctly isolated, with a real, usable chat interface for each.",
    connects:
      "Compass is now a real, multi-user, deployable web product. Lesson 27 adds monitoring and logging so you can actually observe how it's being used and catch problems in production, ahead of the final capstone review and launch.",
  },

  quiz: [
    { id: 'c26q1', kind: 'concept', prompt: 'Why does a single module-level messages array break on the web?', options: ['It doesn’t break, it works fine', 'Multiple simultaneous visitors would all share and pollute the SAME conversation history', 'Arrays can’t be used in Next.js', 'It’s too slow'], answerIndex: 1, explanation: "Shared global state mixes conversations across unrelated visitors, which is incorrect behavior." },
    { id: 'c26q2', kind: 'application', prompt: 'What is a session id used for?', options: ['Encrypting the API key', 'Uniquely identifying one visitor so their data can be kept separate from others', 'Speeding up the API', 'Replacing the need for a database entirely'], answerIndex: 1, explanation: "A session id is the key that isolates per-visitor state." },
    { id: 'c26q3', kind: 'code_reading', prompt: 'What does cookieStore.get(\'compass-session\')?.value return for a first-time visitor?', options: ['A new random id automatically', 'undefined, since no cookie has been set yet', 'An error', 'The string "undefined"'], answerIndex: 1, explanation: "A brand-new visitor has no existing cookie, so the lookup returns undefined until one is generated and set." },
    { id: 'c26q4', kind: 'debug', prompt: 'A chat UI’s fetch call omits credentials: \'include\'. What breaks?', options: ['Nothing, cookies always work', 'The session cookie may not be sent with the request, breaking conversation continuity', 'The API key stops working', 'The UI fails to render'], answerIndex: 1, explanation: "Without explicitly including credentials, the browser may not send the session cookie, breaking the session link." },
    { id: 'c26q5', kind: 'concept', prompt: 'Why use a Map<string, ...> keyed by session id instead of separate named variables?', options: ['No real reason', 'A Map scales naturally to any number of visitors, each getting their own isolated entry', 'Maps are required by TypeScript', 'It’s faster to type'], answerIndex: 1, explanation: "A Map handles an arbitrary, dynamic number of sessions cleanly, unlike hard-coded variables." },
    { id: 'c26q6', kind: 'application', prompt: 'Why does getHistory() check `if (!sessionHistories.has(sessionId))` before returning?', options: ['It’s unnecessary', 'To lazily create a NEW, empty history for a session seen for the first time', 'It deletes old sessions', 'It’s required syntax'], answerIndex: 1, explanation: "This guard initializes a fresh conversation array the first time a given session is encountered." },
    { id: 'c26q7', kind: 'output', prompt: 'Chatting with Compass in two different incognito windows (different sessions) should result in…', options: ['Both sharing the exact same conversation', 'Two completely separate, isolated conversations', 'An error in one of them', 'The second window overwriting the first'], answerIndex: 1, explanation: "Correct session isolation means each browser context maintains its own independent history." },
    { id: 'c26q8', kind: 'concept', prompt: 'Why does the API route handle cookie logic, while askCompass() just takes a plain sessionId string?', options: ['No real reason for the split', 'Keeps the agent logic simple and testable, independent of HTTP/cookie concerns — a separation of responsibilities', 'askCompass can’t accept parameters', 'Cookies must be handled inside the agent logic'], answerIndex: 1, explanation: "Separating HTTP-specific concerns (cookies) from the core agent logic keeps each piece focused and simpler to reason about." },
    { id: 'c26q9', kind: 'project', prompt: "Why does CompassChat's send() function check `if (!input.trim() || loading) return;`?", options: ['No real purpose', 'To prevent sending an empty message AND to prevent duplicate submissions while a request is already in flight', 'It’s required by React', 'It disables the chat entirely'], answerIndex: 1, explanation: "This guard combines two defensive checks familiar from earlier lessons: empty-input validation and duplicate-submission prevention." },
    { id: 'c26q10', kind: 'concept', prompt: 'What does Lesson 27 add on top of this working multi-user chat?', options: ['A new tool', 'Monitoring and logging, so you can observe real usage and catch problems in production', 'Long-term memory (already built)', 'Deployment (already done)'], answerIndex: 1, explanation: "Observability is the next lesson's focus, building on this now-functional multi-user product." },
  ],

  homework: {
    task:
      "Add a 'New conversation' button to CompassChat that clears the LOCAL messages state AND calls a new API endpoint (or reuses /api/compass with a special flag) to clear that session's server-side history too.",
    requirements: [
      "Add a button that resets the messages state to an empty array.",
      "Add server-side support to clear a session's history (e.g. a DELETE handler on /api/compass, or a special body flag).",
      "Confirm that after clicking it, a follow-up question has no memory of the prior conversation.",
    ],
    expectedOutcome:
      "Clicking 'New conversation' visibly clears the chat AND genuinely resets the server-side session history — a follow-up question behaves like a brand-new conversation, not just a visually cleared one.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 25,
      hint: "Lesson 25 asked you to add a health-check endpoint at /api/health returning { status: 'ok', hasApiKey: boolean }.",
      steps: [
        "Create app/api/health/route.ts with a simple GET handler.",
        "Return NextResponse.json({ status: 'ok', hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) }).",
        "Test locally, then after deploying, visit the live URL's /api/health to confirm hasApiKey is true once the Vercel environment variable is set.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'app/api/health/route.ts',
          code:
            "import { NextResponse } from 'next/server';\n\nexport async function GET() {\n  return NextResponse.json({\n    status: 'ok',\n    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),\n  });\n}",
        },
      ],
    },
  },
};
