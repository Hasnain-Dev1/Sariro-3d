import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 19 — Calling the Claude API
 * Module 4 (AI Features) · Lesson 19 of 30
 */
export const lesson19: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 4,
  lessonIndex: 0,
  globalNumber: 19,
  name: 'Calling the Claude API',
  title: 'Meet Ask Momentum — Calling the Claude API',
  subtitle: "Set up a server-side API route and make Momentum's first real AI call.",

  concept: {
    durationMin: 15,
    summary:
      "Understand what an LLM API call actually is, why AI calls must run on the server (never in the browser), and how to build a Next.js API route that talks to Claude.",
    sections: [
      {
        heading: 'What is the Claude API?',
        body:
          "Claude is an AI model made by Anthropic. The Claude API lets your app send it a message (or conversation) and get an intelligent, generated response back — the same technology behind this very course assistant. For Momentum, we're building 'Ask Momentum': a coach that looks at your habits and offers encouragement or advice.",
      },
      {
        heading: 'Why AI calls must happen on the SERVER, never the browser',
        body:
          "Calling Claude requires an API key — a secret credential proving your app is allowed to use it, and tied to your billing. If you called the API directly from a Client Component, that key would be visible to anyone who opens their browser's DevTools and inspects the network request — a serious security leak. The fix: the browser calls YOUR OWN server (a Next.js API route), and only the SERVER, using an environment variable, calls Claude with the key. The key never reaches the browser.",
      },
      {
        heading: 'Environment variables — keeping the key secret',
        body:
          "A .env.local file stores secrets outside your code, and Next.js reads them into process.env on the server. This file must NEVER be committed to Git (create-next-app already adds .env.local to .gitignore by default) — that's how you keep a key private even in a shared repository.",
        code: {
          language: 'bash',
          filename: '.env.local',
          code:
            "ANTHROPIC_API_KEY=sk-ant-your-key-here",
        },
      },
      {
        heading: 'A Next.js API route',
        body:
          "A file at app/api/coach/route.ts becomes a real backend endpoint at /api/coach. It exports a POST function that receives the request, does server-only work (like calling Claude with the secret key), and returns a response. This is the SAME App Router pattern used for pages, just for an API instead of UI.",
        code: {
          language: 'typescript',
          filename: 'app/api/coach/route.ts',
          code:
            "import { NextRequest, NextResponse } from 'next/server';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nexport async function POST(req: NextRequest) {\n  const { message } = await req.json();\n\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5',\n    max_tokens: 300,\n    messages: [{ role: 'user', content: message }],\n  });\n\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  return NextResponse.json({ reply: text });\n}",
        },
      },
      {
        heading: 'Calling your own API route from the browser',
        body:
          "From a Client Component, you fetch YOUR OWN route (not Claude directly) — the exact same fetch pattern from Lesson 15, just pointed at /api/coach instead of an external URL. Your server does the real AI call and hands back a plain JSON reply.",
        code: {
          language: 'tsx',
          code:
            "const res = await fetch('/api/coach', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ message: 'Give me a one-line pep talk.' }),\n});\nconst data = await res.json();\nconsole.log(data.reply);",
        },
      },
    ],
    keyTerms: [
      { term: 'LLM', definition: "Large Language Model — an AI trained to understand and generate text, like Claude." },
      { term: 'API key', definition: "A secret credential authorizing calls to a service and tied to billing — must never be exposed." },
      { term: 'Environment variable', definition: "A secret/config value stored outside your code (in .env.local), read via process.env on the server." },
      { term: 'API route', definition: "A Next.js server endpoint (app/api/.../route.ts) that runs backend code, like calling an external API safely." },
      { term: 'Server-only code', definition: "Code that must run on the server, never the browser, usually because it uses a secret." },
    ],
    commonMistakes: [
      "Calling the Claude API directly from a Client Component, exposing the API key in the browser.",
      "Committing .env.local to Git — even a private repo, secrets should never be committed.",
      "Forgetting to restart the dev server after adding a new environment variable (Next.js reads .env files at startup).",
      "Not handling the case where the API call fails (network issue, rate limit) — always wrap it defensively.",
      "Sending the whole conversation as a single unstructured string instead of the proper messages array format the API expects.",
    ],
    takeaways: [
      "Never call an AI API with a secret key directly from the browser.",
      "Store secrets in .env.local (never committed) and read them via process.env on the server.",
      "A Next.js API route (app/api/.../route.ts) is your safe middleman to the AI provider.",
      "The browser fetches YOUR route; your route calls Claude.",
      "This same client-fetch → server-route → external-API shape applies to any service needing a secret key.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A one-question API route',
    objective:
      "Practise the exact client-to-server-to-AI shape by building a tiny endpoint that answers one hard-coded question.",
    instructions: [
      "Set up .env.local with your ANTHROPIC_API_KEY (or a placeholder while you learn the shape).",
      "Create app/api/joke/route.ts that asks Claude for a short joke and returns it as JSON.",
      "Create a button on a page that fetches /api/joke and displays the result.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'app/api/joke/route.ts',
        code:
          "import { NextResponse } from 'next/server';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nexport async function POST() {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5',\n    max_tokens: 100,\n    messages: [{ role: 'user', content: 'Tell me one short, clean programming joke.' }],\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  return NextResponse.json({ joke: text });\n}",
      },
      {
        language: 'tsx',
        filename: 'components/JokeButton.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\nexport function JokeButton() {\n  const [joke, setJoke] = useState('');\n  const [loading, setLoading] = useState(false);\n\n  async function getJoke() {\n    setLoading(true);\n    const res = await fetch('/api/joke', { method: 'POST' });\n    const data = await res.json();\n    setJoke(data.joke);\n    setLoading(false);\n  }\n\n  return (\n    <div>\n      <button onClick={getJoke} disabled={loading}>{loading ? 'Thinking…' : 'Tell me a joke'}</button>\n      {joke && <p>{joke}</p>}\n    </div>\n  );\n}",
      },
    ],
    explanation:
      "The route file runs ONLY on the server: it creates an Anthropic client using the secret key from process.env (never sent to the browser), asks a fixed question, and returns just the reply text as JSON. JokeButton is a normal Client Component using the Lesson 15 fetch pattern — but critically, it calls '/api/joke' (YOUR OWN server), never the Anthropic API directly. The key stays server-side the entire time; the browser only ever sees the final joke text.",
    expectedOutput:
      "Clicking 'Tell me a joke' shows 'Thinking…' briefly, then displays a real, freshly-generated joke from Claude — a different one each click.",
    learned: [
      "How to create a Next.js API route.",
      "How to call the Claude API safely from the server.",
      "How a Client Component fetches your OWN route, not the AI provider directly.",
      "Why this indirection keeps the API key secret.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's real AI backend — a /api/coach route that Ask Momentum will use, ready to receive habit data and return coaching advice.",
    why:
      "This is the API groundwork Ask Momentum needs. Building the ROUTE first, and confirming it works with a simple test message, means the next lessons (streaming, prompt engineering, the real chat UI) can focus purely on the experience, not connectivity.",
    fileLocation: "momentum-app/.env.local (new), app/api/coach/route.ts (new)",
    code: [
      {
        language: 'bash',
        filename: '.env.local',
        code:
          "ANTHROPIC_API_KEY=sk-ant-your-key-here",
      },
      {
        language: 'typescript',
        filename: 'app/api/coach/route.ts',
        code:
          "import { NextRequest, NextResponse } from 'next/server';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nexport async function POST(req: NextRequest) {\n  try {\n    const { message } = await req.json();\n    if (!message || typeof message !== 'string') {\n      return NextResponse.json({ error: 'A message is required.' }, { status: 400 });\n    }\n\n    const response = await anthropic.messages.create({\n      model: 'claude-sonnet-5',\n      max_tokens: 300,\n      system: 'You are Ask Momentum, a warm, encouraging habit coach inside the Momentum app. Keep replies short — 2-4 sentences.',\n      messages: [{ role: 'user', content: message }],\n    });\n\n    const text = response.content[0].type === 'text' ? response.content[0].text : '';\n    return NextResponse.json({ reply: text });\n  } catch {\n    return NextResponse.json({ error: 'Ask Momentum is unavailable right now.' }, { status: 500 });\n  }\n}",
      },
    ],
    placement:
      "1) Create .env.local at the project root (momentum-app/) and add your real ANTHROPIC_API_KEY — restart npm run dev after adding it. 2) Create app/api/coach/route.ts with the code above. 3) Test it directly (no UI yet) using a tool like curl or Postman, or a quick temporary fetch call from any page, sending { \"message\": \"Give me a one-line pep talk about my habits.\" }.",
    implementation:
      "The route validates the incoming message (guarding against a missing or malformed body — the same defensive habit from Module 1), then calls anthropic.messages.create with a system prompt that gives Claude Ask Momentum's PERSONALITY (warm, encouraging, brief) — every reply will follow that tone without the user ever seeing the instruction. The whole thing is wrapped in try/catch so a network failure or API error returns a clean JSON error instead of crashing the route. Notice this route doesn't yet know anything about the user's actual habits — that's Lesson 22 (tool use / real data). For now, it's a working, safe, personality-configured AI endpoint.",
    expectedResult:
      "POSTing { message: 'Give me a one-line pep talk.' } to /api/coach returns { reply: '...' } with a genuinely generated, encouraging sentence from Claude — proof the whole client-safe pipeline works.",
    connects:
      "This route is the backend Ask Momentum will call. Lesson 20 makes the response STREAM in word-by-word instead of arriving all at once; Lesson 21 refines the prompt; Lesson 22 lets Ask Momentum actually reference real habit data.",
  },

  quiz: [
    { id: 'l19q1', kind: 'concept', prompt: 'Why can’t you call the Claude API directly from a Client Component?', options: ['It’s technically impossible', 'It would expose your secret API key in the browser', 'Client Components can’t use fetch', 'Claude only accepts server IPs'], answerIndex: 1, explanation: "Any code shipped to the browser is visible to users, including a hard-coded API key." },
    { id: 'l19q2', kind: 'concept', prompt: 'Where should a secret API key be stored?', options: ['Directly in a component file', 'In .env.local, read via process.env on the server', 'In a public GitHub repo', 'In localStorage'], answerIndex: 1, explanation: "Environment variables in .env.local (never committed) keep secrets out of your code and the browser." },
    { id: 'l19q3', kind: 'code_reading', prompt: 'What does app/api/coach/route.ts become, once created?', options: ['A visible page at /coach', 'A backend endpoint at /api/coach', 'A CSS file', 'A React component only'], answerIndex: 1, explanation: "Files under app/api/.../route.ts become real API endpoints, not pages." },
    { id: 'l19q4', kind: 'application', prompt: 'Which fetch call is SAFE from a Client Component that needs an AI reply?', options: ['fetch to the Anthropic API directly with the key inline', 'fetch(\'/api/coach\', { method: \'POST\', ... })', 'Reading process.env directly in the component', 'None — AI can’t be used in the browser at all'], answerIndex: 1, explanation: "The browser should always call your OWN server route, which then safely calls the AI provider." },
    { id: 'l19q5', kind: 'debug', prompt: 'A student adds ANTHROPIC_API_KEY to .env.local but the server still can’t find it. Likely cause?', options: ['The key is invalid', 'They forgot to restart the dev server after adding it', 'Next.js doesn’t support .env files', '.env.local must be committed first'], answerIndex: 1, explanation: "Next.js reads environment variables at startup; a running dev server won't pick up new ones until restarted." },
    { id: 'l19q6', kind: 'concept', prompt: 'What does a "system" prompt do in an API call?', options: ['Nothing, it’s optional decoration', 'Sets the AI’s persona/behaviour for the whole conversation', 'Deletes the conversation history', 'Changes the API key'], answerIndex: 1, explanation: "The system prompt configures tone/persona/rules the model should follow throughout its replies." },
    { id: 'l19q7', kind: 'code_reading', prompt: 'Why does the route wrap the API call in try/catch?', options: ['It’s required TypeScript syntax', 'So a network/API failure returns a clean error response instead of crashing', 'To make it run faster', 'To hide the reply'], answerIndex: 1, explanation: "try/catch handles failures gracefully, returning a usable error response instead of an unhandled crash." },
    { id: 'l19q8', kind: 'application', prompt: 'Why validate that message exists and is a string before calling the AI?', options: ['It’s unnecessary — the AI handles anything', 'To avoid wasting an API call on bad/missing input and to fail with a clear error', 'TypeScript requires it at runtime automatically', 'It changes billing'], answerIndex: 1, explanation: "Defensive validation avoids sending malformed requests and gives a clear, immediate error instead." },
    { id: 'l19q9', kind: 'project', prompt: "Why doesn't Momentum's /api/coach route know about the user's real habits yet?", options: ['It’s impossible in Next.js', 'That connection (tool use / real data) is built in a later lesson, on top of this basic working route', 'AI can never see app data', 'It’s a bug'], answerIndex: 1, explanation: "This lesson builds the basic, working AI connection first; feeding it real habit data comes later, once the pipe works." },
    { id: 'l19q10', kind: 'debug', prompt: '.env.local was accidentally committed to Git with a real API key inside. What should happen?', options: ['Nothing, it’s fine once removed from the latest commit', 'The key should be considered compromised and rotated/revoked immediately, then .env.local removed from git history', 'Just delete the file going forward', 'Change the file name only'], answerIndex: 1, explanation: "Once a secret is committed, it may exist in git history even after deletion — the safe response is to revoke/rotate the key." },
  ],

  homework: {
    task:
      "Extend the /api/coach route to accept an optional 'tone' field ('encouraging' | 'direct' | 'funny') and adjust the system prompt accordingly, so Ask Momentum can have different personalities on request.",
    requirements: [
      "Read an optional tone field from the request body alongside message.",
      "Based on tone, build a slightly different system prompt string (default to 'encouraging' if not provided).",
      "Test all three tones with the same message and confirm the replies noticeably differ in style.",
    ],
    expectedOutcome:
      "Sending the same message with different tone values produces replies with a clearly different voice — warm vs blunt vs playful — while still being short and on-topic.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 18,
      hint: "Lesson 18 asked you to add a brief 'Saved ✓' flash near the ring whenever habits successfully saves — but not on the very first load.",
      steps: [
        "Add const [savedFlash, setSavedFlash] = useState(false); in HabitsSection.",
        "Inside the save effect, after localStorage.setItem(...), if isLoaded is already true, set savedFlash to true, then setTimeout(() => setSavedFlash(false), 1200).",
        "Because the effect already returns early when !isLoaded, the very first load (which sets isLoaded to true but doesn't count as a 'change') won't trigger a flash.",
        "Render {savedFlash && <span className=\"text-xs text-brand ml-2\">Saved ✓</span>} near the ring.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/HabitsSection.tsx',
          code:
            "useEffect(() => {\n  if (!isLoaded) return;\n  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));\n  setSavedFlash(true);\n  const timer = setTimeout(() => setSavedFlash(false), 1200);\n  return () => clearTimeout(timer);\n}, [habits, isLoaded]);",
        },
      ],
    },
  },
};
