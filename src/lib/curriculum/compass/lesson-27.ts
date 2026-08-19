import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 27 — Monitoring & Logging
 * Module 5 (Deploy + Capstone) · Lesson 27 of 30
 */
export const lesson27: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 2,
  globalNumber: 27,
  name: 'Monitoring + logging',
  title: 'Monitoring — Seeing What Compass Is Actually Doing in Production',
  subtitle: "Add structured logging so you can observe real usage, costs, and failures once Compass is live.",

  concept: {
    durationMin: 15,
    summary:
      "Learn why console.log alone isn't enough in production, and build structured logging that tracks usage, cost, tool calls, and errors.",
    sections: [
      {
        heading: 'Why console.log worked for the CLI but isn’t enough now',
        body:
          "Every earlier lesson's console.log was perfect for a LOCAL terminal you're watching directly. On a deployed server, logs typically flow into a platform's log viewer (Vercel's dashboard, for example) — readable, but hard to SEARCH or ANALYZE at scale without more structure than a plain sentence.",
      },
      {
        heading: 'Structured logging: objects, not sentences',
        body:
          "Instead of a free-text message, log a consistent OBJECT with named fields — event type, timestamp, relevant data. This makes logs filterable and analyzable (e.g. 'show me every tool_call event where tool = web_search').",
        code: {
          language: 'typescript',
          code:
            "function logEvent(event: string, data: Record<string, unknown> = {}) {\n  console.log(JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }));\n}\n\n// usage:\nlogEvent('question_received', { sessionId, questionLength: question.length });\nlogEvent('tool_called', { tool: toolBlock.name });\nlogEvent('answer_sent', { sessionId, tokensUsed: response.usage.output_tokens });",
        },
      },
      {
        heading: 'What’s actually worth logging for an agent',
        body:
          "A useful minimum: every question received (with session id, not the raw content for privacy), every tool call (which tool, not necessarily its full arguments), token usage per response (for cost tracking), and every error (with enough detail to diagnose it later). Logging the raw question/answer content raises privacy considerations worth being thoughtful about.",
      },
      {
        heading: 'Tracking cost over time',
        body:
          "Since token usage is already available on every response (Lesson 2), accumulating it into a running total (even a simple in-memory counter, reset on each deploy) gives a rough sense of usage-driven cost — genuinely useful for noticing if something's using far more than expected.",
        code: {
          language: 'typescript',
          code:
            "let totalTokensToday = 0;\n\nfunction trackUsage(inputTokens: number, outputTokens: number) {\n  totalTokensToday += inputTokens + outputTokens;\n  logEvent('usage_tracked', { inputTokens, outputTokens, totalTokensToday });\n}",
        },
      },
      {
        heading: 'A simple stats endpoint',
        body:
          "Exposing a lightweight /api/stats endpoint (admin-only in a real product, but fine for a learning project) that reports total questions, total tokens, and error count gives an at-a-glance view without digging through raw logs.",
      },
    ],
    keyTerms: [
      { term: 'Structured logging', definition: "Logging consistent, named-field objects instead of free-text sentences, making logs searchable/analyzable." },
      { term: 'Observability', definition: "The general practice of being able to understand a running system's behavior from its outputs (logs, metrics)." },
      { term: 'Usage tracking', definition: "Accumulating token counts over time to monitor cost and usage patterns." },
    ],
    commonMistakes: [
      "Logging raw user questions/answers indiscriminately, without considering privacy implications.",
      "Free-text log messages that are hard to search or aggregate at scale.",
      "Not logging errors with enough context (session id, what was being attempted) to actually diagnose them later.",
      "Building an elaborate custom logging/metrics system when a project's actual scale doesn't need it yet.",
      "Forgetting that an in-memory counter (like totalTokensToday) resets on every server restart/redeploy — a real limitation worth knowing.",
    ],
    takeaways: [
      "Structured, object-based logs are far more useful than free-text ones at any real scale.",
      "Log questions received, tool calls, token usage, and errors — thoughtfully, with privacy in mind.",
      "Token usage accumulation gives a rough, useful cost signal.",
      "A simple stats endpoint offers an at-a-glance view without raw log digging.",
      "Match logging effort to actual project scale — simple and useful beats elaborate and unused.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A structured event logger',
    objective:
      "Practise structured logging with a few different event types before wiring it into Compass's real routes.",
    instructions: [
      "Write logEvent(event, data) as shown in the concept lesson.",
      "Log 3 different event types with different data shapes.",
      "Confirm each log line is valid, parseable JSON.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'log-test.ts',
        code:
          "function logEvent(event: string, data: Record<string, unknown> = {}) {\n  console.log(JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }));\n}\n\nlogEvent('server_started', { port: 3000 });\nlogEvent('question_received', { sessionId: 'abc123', questionLength: 42 });\nlogEvent('error_occurred', { sessionId: 'abc123', message: 'Simulated failure' });\n\n// Prove it's real, parseable JSON:\nconst line = JSON.stringify({ event: 'test', timestamp: new Date().toISOString() });\nconsole.log('Parsed back:', JSON.parse(line));",
      },
    ],
    explanation:
      "Each logEvent call produces ONE line of valid JSON with a consistent shape: event name, timestamp, plus whatever extra fields are relevant to that specific event. This consistency is what makes structured logs useful at scale — a log-search tool (or even a simple grep + JSON.parse pipeline) can reliably extract 'timestamp' or 'sessionId' from EVERY line, regardless of event type, something impossible with free-text sentences that each have their own ad-hoc format.",
    expectedOutput:
      "Three JSON lines, each with 'event' and 'timestamp' fields plus event-specific data, followed by 'Parsed back:' showing the JSON successfully round-trips through parse.",
    learned: [
      "How to build a consistent, structured logging function.",
      "Why consistent field names matter for searchability.",
      "How to verify logs are genuinely valid, parseable JSON.",
      "The foundation for real production observability.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's API route logs structured events for every question, tool call, and error, plus a simple stats endpoint reporting aggregate usage.",
    why:
      "Once Compass is live and used by real people, you need visibility into what's actually happening — this lesson gives you exactly that, without over-engineering a full observability platform.",
    fileLocation: "lib/logging.ts (new), lib/compass.ts (add logEvent calls), app/api/stats/route.ts (new)",
    code: [
      {
        language: 'typescript',
        filename: 'lib/logging.ts',
        code:
          "export function logEvent(event: string, data: Record<string, unknown> = {}) {\n  console.log(JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }));\n}\n\nexport const stats = {\n  totalQuestions: 0,\n  totalTokens: 0,\n  totalErrors: 0,\n};\n\nexport function trackQuestion() { stats.totalQuestions += 1; }\nexport function trackTokens(input: number, output: number) { stats.totalTokens += input + output; }\nexport function trackError() { stats.totalErrors += 1; }",
      },
      {
        language: 'typescript',
        filename: 'lib/compass.ts (add logging calls at key points)',
        code:
          "import { logEvent, trackQuestion, trackTokens, trackError } from '@/lib/logging';\n\nexport async function askCompass(sessionId: string, question: string): Promise<string> {\n  trackQuestion();\n  logEvent('question_received', { sessionId, questionLength: question.length });\n\n  try {\n    // ...existing loop, calling anthropic.messages.create...\n    // after each successful response:\n    trackTokens(response.usage.input_tokens, response.usage.output_tokens);\n\n    // when a tool is called:\n    logEvent('tool_called', { sessionId, tool: toolBlock.name });\n\n    return finalText;\n  } catch (err) {\n    trackError();\n    logEvent('error_occurred', { sessionId, message: (err as Error).message });\n    return \"Sorry, I'm having trouble right now.\";\n  }\n}",
      },
      {
        language: 'typescript',
        filename: 'app/api/stats/route.ts',
        code:
          "import { NextResponse } from 'next/server';\nimport { stats } from '@/lib/logging';\n\nexport async function GET() {\n  return NextResponse.json(stats);\n}",
      },
    ],
    placement:
      "Create lib/logging.ts with the shown functions. Import and call them at the relevant points inside lib/compass.ts's askCompass() (question received, tool called, tokens tracked, errors caught). Create app/api/stats/route.ts to expose the aggregate counts.",
    implementation:
      "logEvent() gives every significant moment in Compass's request lifecycle a consistent, structured log line — question_received, tool_called, error_occurred — each carrying a sessionId for correlation but deliberately NOT the raw question/answer text, respecting the privacy consideration from the concept lesson. The stats object accumulates simple running totals in memory; trackQuestion/trackTokens/trackError update it at the right moments, and the /api/stats route exposes a quick JSON snapshot — genuinely useful for a learning project's scale, with the explicit caveat (worth remembering) that these numbers reset on every server restart.",
    expectedResult:
      "Chatting with the deployed Compass now produces structured log lines viewable in Vercel's dashboard, and visiting /api/stats shows real, accumulating totals — e.g. { totalQuestions: 12, totalTokens: 4831, totalErrors: 0 } — reflecting actual usage.",
    connects:
      "Compass is now observable in production. Lesson 28 (the capstone build sprint) does a full end-to-end review of the ENTIRE deployed product — code, UI, and now these very logs/stats — before the final launch in Lessons 29-30.",
  },

  quiz: [
    { id: 'c27q1', kind: 'concept', prompt: 'Why is structured logging (objects) preferred over free-text log messages in production?', options: ['No real difference', 'Consistent, named fields make logs searchable and analyzable at scale', 'Free-text logs are technically impossible on Vercel', 'Structured logs are always shorter'], answerIndex: 1, explanation: "Structured logs let you reliably filter/search by field, unlike ad-hoc free-text messages." },
    { id: 'c27q2', kind: 'application', prompt: 'Why does logEvent() log a sessionId but deliberately NOT the raw question/answer text?', options: ['It’s a technical limitation', 'A privacy consideration — avoiding indiscriminately logging potentially sensitive user content', 'sessionId is required, text is optional randomly', 'Text logging is slower'], answerIndex: 1, explanation: "Being thoughtful about what user content gets logged is a genuine, worthwhile consideration." },
    { id: 'c27q3', kind: 'concept', prompt: 'What does the stats object track?', options: ['Only errors', 'Total questions, total tokens, and total errors — a rough usage/cost signal', 'The full conversation history', 'API keys'], answerIndex: 1, explanation: "These three running totals give a simple, useful overview of aggregate usage." },
    { id: 'c27q4', kind: 'debug', prompt: 'After a server restart, /api/stats shows totalQuestions: 0 even though many questions were asked before. Why?', options: ['A bug that must be fixed immediately', 'The in-memory counter resets on restart — a known limitation of this simple approach', 'Stats are corrupted', 'The API route is broken'], answerIndex: 1, explanation: "In-memory state doesn't survive a process restart — this is an acknowledged tradeoff of the simple approach used here." },
    { id: 'c27q5', kind: 'application', prompt: 'Why log a tool_called event separately from question_received?', options: ['No real reason', 'To specifically track which tools are being used and how often, distinct from overall question volume', 'Tool calls don’t need logging', 'They must always be logged together as one event'], answerIndex: 1, explanation: "Separate, specific event types let you analyze tool usage independently of general question volume." },
    { id: 'c27q6', kind: 'code_reading', prompt: 'What does JSON.stringify({ event, timestamp: ..., ...data }) produce?', options: ['An error', 'A single JSON string combining the event name, timestamp, and any extra fields from data', 'A plain sentence', 'An empty object'], answerIndex: 1, explanation: "The spread of data merges event-specific fields into the same consistent JSON structure." },
    { id: 'c27q7', kind: 'output', prompt: 'What should GET /api/stats return after 5 questions with no errors?', options: ['An empty object', 'Something like { totalQuestions: 5, totalTokens: N, totalErrors: 0 }', 'A 404 error', 'The raw conversation text'], answerIndex: 1, explanation: "The stats object accumulates exactly these running totals as questions are processed." },
    { id: 'c27q8', kind: 'application', prompt: 'Why track tokens via trackTokens(input, output) right after a successful API response?', options: ['No particular timing matters', 'response.usage is only available once the response has actually arrived', 'It should happen before the request is sent', 'Token tracking is unrelated to responses'], answerIndex: 1, explanation: "Usage data comes back WITH the response, so tracking happens after it's received." },
    { id: 'c27q9', kind: 'project', prompt: "Why does this lesson avoid building an elaborate custom logging/metrics platform?", options: ['It’s technically impossible in Next.js', 'Matching effort to actual project scale — simple, useful logging beats an elaborate system nobody uses yet', 'Logging isn’t important', 'Vercel doesn’t support any logging'], answerIndex: 1, explanation: "The concept lesson explicitly advises against over-engineering observability beyond what the project's scale actually needs." },
    { id: 'c27q10', kind: 'concept', prompt: 'What does Lesson 28 do with the logging/stats built here?', options: ['Removes them', 'Uses them (along with a full review of the deployed product) as part of the capstone build sprint before launch', 'Ignores them entirely', 'Rebuilds them from scratch'], answerIndex: 1, explanation: "The capstone review in Lesson 28 builds directly on having real observability already in place." },
  ],

  homework: {
    task:
      "Add response-time tracking: log how long each askCompass() call took (in milliseconds), and add an averageResponseTimeMs field to the stats object.",
    requirements: [
      "Record a start time at the beginning of askCompass() and compute elapsed time before returning.",
      "Log it as part of an event (e.g. answer_sent with a durationMs field).",
      "Maintain a running average in the stats object, updated after each call.",
    ],
    expectedOutcome:
      "The /api/stats endpoint now includes an averageResponseTimeMs field that updates realistically as more questions are processed, giving visibility into Compass's actual performance.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 26,
      hint: "Lesson 26 asked you to add a 'New conversation' button clearing both local UI state and the server-side session history.",
      steps: [
        "Add a DELETE handler (or a special { clear: true } flag in the POST body) on /api/compass that removes the session's entry from sessionHistories.",
        "In CompassChat.tsx, add a button calling this endpoint, then also call setMessages([]) to clear the visible UI.",
        "Test: chat a bit, click 'New conversation', then ask a follow-up that would only make sense with the old context — confirm it no longer does.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'app/api/compass/route.ts (add a DELETE handler)',
          code:
            "export async function DELETE() {\n  const cookieStore = await cookies();\n  const sessionId = cookieStore.get('compass-session')?.value;\n  if (sessionId) sessionHistories.delete(sessionId);\n  return NextResponse.json({ ok: true });\n}",
        },
      ],
    },
  },
};
