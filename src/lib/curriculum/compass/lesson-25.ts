import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 25 — Deploying Agents to Vercel
 * Module 5 (Deploy + Capstone) · Lesson 25 of 30
 */
export const lesson25: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 0,
  globalNumber: 25,
  name: 'Deploying agents (Vercel)',
  title: 'Going Live — Wrapping Compass as a Web API',
  subtitle: "Turn Compass's CLI logic into a real Next.js API route and deploy it to Vercel.",

  concept: {
    durationMin: 15,
    summary:
      "Learn why a CLI agent needs to be re-hosted as a web API to be deployed, and how to wrap Compass's core logic in a Next.js API route.",
    sections: [
      {
        heading: 'Why a CLI agent can’t just be “deployed” as-is',
        body:
          "Compass currently runs as a Node script reading from your terminal — there's no concept of a 'website visitor' in that model. To make it usable by anyone on the internet, its CORE LOGIC (askCompass, the tool loop, memory) needs to be called from an HTTP endpoint instead of a readline prompt — the exact API-route pattern used throughout this course's web-focused material.",
      },
      {
        heading: 'Separating logic from interface',
        body:
          "The good news: askCompass(), the tool functions, and the memory system don't care HOW they're invoked — REPL or HTTP request. You extract them into a shared module, then build TWO thin interfaces on top: the existing CLI (index.ts) and a new API route.",
        code: {
          language: 'typescript',
          filename: 'lib/compass.ts (extracted, shared logic)',
          code:
            "// All of askCompass(), the tools, memory functions, and helpers move here —\n// unchanged logic, just relocated so both the CLI and the API route can import it.\nexport { askCompass, askCompassWithPlan, saveMemory, recallRelevant };",
        },
      },
      {
        heading: 'A Next.js API route for Compass',
        body:
          "A file at app/api/compass/route.ts becomes a real endpoint. It receives a question from the request body, calls the SAME askCompass logic, and returns the reply as JSON.",
        code: {
          language: 'typescript',
          filename: 'app/api/compass/route.ts',
          code:
            "import { NextRequest, NextResponse } from 'next/server';\nimport { askCompass } from '@/lib/compass';\n\nexport async function POST(req: NextRequest) {\n  const { question } = await req.json();\n  if (!question || typeof question !== 'string') {\n    return NextResponse.json({ error: 'A question is required.' }, { status: 400 });\n  }\n  const reply = await askCompass(question);\n  return NextResponse.json({ reply });\n}",
        },
      },
      {
        heading: 'Memory in a web context is different',
        body:
          "The CLI's memory.json file assumed ONE user (you) on ONE machine. On the web, MULTIPLE people could use Compass simultaneously — a shared file-based memory store would mix up everyone's facts. This lesson deploys the CORE agent; Lesson 26 addresses giving each web visitor their own separate conversation.",
      },
      {
        heading: 'The deployment steps themselves',
        body:
          "Once the API route exists in a Next.js project, deploying follows the exact same process as any other course's Next.js app: push to GitHub, import into Vercel, add the ANTHROPIC_API_KEY environment variable, deploy.",
      },
    ],
    keyTerms: [
      { term: 'API route', definition: "A Next.js server endpoint that lets a web request trigger backend logic, like calling an agent." },
      { term: 'Shared logic module', definition: "Core functionality (like askCompass) extracted so multiple interfaces (CLI, web) can both use it unchanged." },
    ],
    commonMistakes: [
      "Trying to deploy the readline-based CLI script directly — a web server has no terminal to read from.",
      "Duplicating askCompass's logic between the CLI and API route instead of sharing one module — a recipe for the two drifting out of sync.",
      "Forgetting the API route needs the SAME environment variable setup (Lesson 26 of the earlier web course) on Vercel.",
      "Assuming the file-based memory.json approach works fine on the web without modification — it doesn't, for multiple simultaneous users.",
      "Not validating the incoming request body (question) before using it.",
    ],
    takeaways: [
      "A CLI agent's core logic can be reused for a web API — only the INTERFACE around it changes.",
      "Extracting shared logic into its own module avoids duplicating (and diverging) behaviour between CLI and web.",
      "A Next.js API route receives a request, calls the agent logic, and returns JSON.",
      "File-based memory needs rethinking for a multi-user web context (addressed next lesson).",
      "Deployment itself follows the same GitHub → Vercel → env vars process as any Next.js app.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A minimal Compass API route',
    objective:
      "Practise wrapping a simple agent function as a Next.js API route, without the full Compass complexity.",
    instructions: [
      "Create a fresh Next.js project (or reuse an existing one) with the Anthropic SDK installed.",
      "Write a minimal askSimple(question) function.",
      "Wrap it in app/api/ask/route.ts.",
      "Test it with a POST request (curl or a quick fetch script).",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'app/api/ask/route.ts',
        code:
          "import { NextRequest, NextResponse } from 'next/server';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nexport async function POST(req: NextRequest) {\n  const { question } = await req.json();\n  if (!question || typeof question !== 'string') {\n    return NextResponse.json({ error: 'A question is required.' }, { status: 400 });\n  }\n\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 300,\n    messages: [{ role: 'user', content: question }],\n  });\n  const reply = response.content[0].type === 'text' ? response.content[0].text : '';\n  return NextResponse.json({ reply });\n}",
      },
      {
        language: 'bash',
        code:
          "curl -X POST http://localhost:3000/api/ask \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"question\": \"What is an AI agent?\"}'",
      },
    ],
    explanation:
      "The route validates that question exists and is a string BEFORE calling the API — the same defensive pattern from earlier lessons, now applied at the boundary of a public HTTP endpoint (arguably even more important here, since a web endpoint can receive genuinely arbitrary input from anyone). curl sends a real POST request with a JSON body, proving the whole path works: HTTP request in, Claude API call, JSON response out — without any terminal readline involved anywhere.",
    expectedOutput:
      "The curl command returns a JSON response like {\"reply\": \"An AI agent is...\"} — proof the API route correctly bridges an HTTP request to a real Claude API call.",
    learned: [
      "How to build a minimal Next.js API route calling Claude.",
      "How to test an API route with curl.",
      "Why input validation matters even more at a public HTTP boundary.",
      "The basic shape every agent-as-API-route follows.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's core agent logic is extracted into a shared module and exposed as a real Next.js API route — ready to deploy.",
    why:
      "This is the structural change that makes EVERYTHING Compass can do (tools, memory, planning) accessible over the web, not just from your terminal.",
    fileLocation: "A new Next.js project (compass-web/) — lib/compass.ts (moved logic) + app/api/compass/route.ts (new)",
    code: [
      {
        language: 'bash',
        code:
          "npx create-next-app@latest compass-web --typescript --tailwind --app --eslint\ncd compass-web\nnpm install @anthropic-ai/sdk",
      },
      {
        language: 'typescript',
        filename: 'lib/compass.ts (moved + adapted from compass-agent/index.ts)',
        code:
          "import Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\n// SYSTEM_PROMPT, TOOLS, tool implementations, executeTool, withRetry —\n// all copied over from compass-agent/index.ts, UNCHANGED.\n\nexport async function askCompass(question: string): Promise<string> {\n  // Same tool-use loop from Module 2, with the session-array parameter\n  // adjusted per-request instead of module-level (Lesson 26 addresses this).\n  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: question }];\n  // ...unchanged loop logic...\n  return 'placeholder — full loop body carried over from the CLI version';\n}",
      },
      {
        language: 'typescript',
        filename: 'app/api/compass/route.ts',
        code:
          "import { NextRequest, NextResponse } from 'next/server';\nimport { askCompass } from '@/lib/compass';\n\nexport const runtime = 'nodejs';\n\nexport async function POST(req: NextRequest) {\n  try {\n    const { question } = await req.json();\n    if (!question || typeof question !== 'string') {\n      return NextResponse.json({ error: 'A question is required.' }, { status: 400 });\n    }\n    const reply = await askCompass(question);\n    return NextResponse.json({ reply });\n  } catch (err) {\n    console.error('[compass api] error:', err);\n    return NextResponse.json({ error: 'Compass is unavailable right now.' }, { status: 500 });\n  }\n}",
      },
    ],
    placement:
      "Create the new compass-web/ Next.js project. Create lib/compass.ts and move (not duplicate) all of Compass's core logic from compass-agent/index.ts into it, exporting askCompass. Create app/api/compass/route.ts as shown, importing from '@/lib/compass'.",
    implementation:
      "lib/compass.ts becomes the SINGLE source of truth for Compass's actual intelligence — everything from Modules 1-4 (retries, tools, ReAct, planning) lives here, adapted only where needed for a stateless-per-request context (the session-scoped module-level array becomes something the caller manages, addressed fully in Lesson 26). The API route itself is intentionally thin: parse and validate the request, call the shared logic, handle errors, return JSON — it contains NO agent intelligence of its own, just the HTTP plumbing around it.",
    expectedResult:
      "Running npm run dev and POSTing a question to /api/compass returns a real, grounded, tool-capable Compass reply — the exact same intelligence as the CLI version, now reachable over HTTP.",
    connects:
      "Compass's brain is now web-accessible, but memory and conversation state still need proper handling for MULTIPLE simultaneous users — Lesson 26 builds the real chat UI and per-user session model that makes this genuinely usable by more than one person at a time.",
  },

  quiz: [
    { id: 'c25q1', kind: 'concept', prompt: 'Why can’t Compass’s CLI script be deployed to a web server as-is?', options: ['CLI scripts are always slower', 'A web server has no terminal for readline to read from — the interface itself doesn’t fit', 'The Anthropic SDK doesn’t work on servers', 'CLI scripts can’t use environment variables'], answerIndex: 1, explanation: "readline-based input assumes an interactive terminal, which a web request doesn't provide." },
    { id: 'c25q2', kind: 'application', prompt: 'Why extract Compass’s core logic into a SHARED module (lib/compass.ts)?', options: ['No real benefit', 'So both the CLI and the API route use the SAME logic, avoiding duplication and drift', 'Shared modules are required by Next.js', 'It reduces the file size to zero'], answerIndex: 1, explanation: "A single source of truth prevents the CLI and web versions from silently diverging in behavior." },
    { id: 'c25q3', kind: 'code_reading', prompt: 'What does the API route do BEFORE calling askCompass()?', options: ['Nothing, it calls it immediately', 'Validates that a question exists and is a string', 'Deletes old memory', 'Starts a new Vercel deployment'], answerIndex: 1, explanation: "Input validation guards against a malformed or missing request body." },
    { id: 'c25q4', kind: 'concept', prompt: 'Why does file-based memory.json become a problem in a web context?', options: ['It doesn’t, it works fine', 'Multiple simultaneous users would share and overwrite the SAME file, mixing up everyone’s facts', 'JSON files can’t be read on a server', 'It’s too slow for the web'], answerIndex: 1, explanation: "A single shared file assumes one user; multiple web visitors need separated memory." },
    { id: 'c25q5', kind: 'debug', prompt: 'A POST request to /api/compass with no body returns a 400 error. Is this correct behavior?', options: ['No, it should crash instead', 'Yes — the validation check catches a missing/invalid question and returns a clear error', 'No, it should always return 200', 'It’s a bug in Next.js'], answerIndex: 1, explanation: "This is the intended, correct result of the input validation guard." },
    { id: 'c25q6', kind: 'application', prompt: 'What HTTP method does the Compass API route use, and why?', options: ['GET, because it’s simple', 'POST, since it sends a question in the request BODY rather than a URL', 'DELETE, since it’s an agent action', 'PUT, for updating state'], answerIndex: 1, explanation: "POST is appropriate for sending data (the question) in the request body, not just a URL query." },
    { id: 'c25q7', kind: 'output', prompt: 'What does curl -X POST .../api/compass with a valid question return?', options: ['Plain text with no structure', 'A JSON response like {\"reply\": \"...\"}', 'An HTML page', 'A file download'], answerIndex: 1, explanation: "The route uses NextResponse.json(), returning structured JSON." },
    { id: 'c25q8', kind: 'concept', prompt: 'What stays THE SAME between the CLI and web versions of Compass?', options: ['Nothing at all', 'The core agent logic — tools, reasoning, planning — housed in the shared module', 'Only the system prompt', 'Only the error handling'], answerIndex: 1, explanation: "The extraction into lib/compass.ts is specifically designed to preserve identical core behavior across interfaces." },
    { id: 'c25q9', kind: 'project', prompt: "Why does the API route wrap askCompass() in its OWN try/catch, even though askCompass() already has internal error handling?", options: ['Redundant and unnecessary', 'A defensive outer layer at the HTTP boundary ensures even an unexpected failure returns a clean JSON error, not a crashed server response', 'It’s required by Next.js syntax', 'Inner error handling is being removed'], answerIndex: 1, explanation: "An outer safety net at the API boundary is good practice even when inner functions are already resilient." },
    { id: 'c25q10', kind: 'concept', prompt: 'What does Lesson 26 need to solve, now that Compass is web-accessible?', options: ['Nothing further is needed', 'Per-user conversation state and a real chat UI, since multiple people can now use Compass simultaneously', 'Deployment (already done)', 'Adding more tools'], answerIndex: 1, explanation: "Multi-user support and a proper UI are the natural next steps once the API exists." },
  ],

  homework: {
    task:
      "Add a simple health-check endpoint, app/api/health/route.ts, returning { status: 'ok', hasApiKey: boolean } — useful for confirming the deployment is configured correctly without testing the full agent.",
    requirements: [
      "Create a GET handler returning JSON with a status field and whether ANTHROPIC_API_KEY is set (boolean, never the actual value).",
      "Test it locally, then (once deployed) test it on the live Vercel URL.",
      "Confirm hasApiKey is true only once the environment variable is properly configured on Vercel.",
    ],
    expectedOutcome:
      "Visiting /api/health returns a clear status confirming whether the deployment is properly configured, without needing to test the full (costlier) agent endpoint just to check configuration.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 24,
      hint: "Lesson 24 asked you to add a manual '/plan ' prefix override, forcing the planning pipeline regardless of what needsPlanning() would normally decide.",
      steps: [
        "In the REPL loop, before the automatic needsPlanning() check, test if trimmed.startsWith('/plan ').",
        "If so, extract the rest of the message (trimmed.slice(6).trim()) and call askCompassWithPlan() directly on it.",
        "Test with '/plan What is 12 times 4?' and confirm it goes through the full pipeline despite being a simple question.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside the REPL loop, before automatic routing)',
          code:
            "if (trimmed.toLowerCase().startsWith('/plan ')) {\n  const forcedTask = trimmed.slice(6).trim();\n  console.log('[routing] forced planning pipeline via /plan');\n  const answer = await askCompassWithPlan(forcedTask);\n  console.log(`Compass: ${answer}\\n`);\n  continue;\n}",
        },
      ],
    },
  },
};
