import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 10 — A Web Search Tool
 * Module 2 (Tool Use) · Lesson 10 of 30
 */
export const lesson10: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 2,
  lessonIndex: 3,
  globalNumber: 10,
  name: 'A web search tool',
  title: 'Giving Compass Real Knowledge — a Web Search Tool',
  subtitle: "Add a third tool that fetches real, current information from the internet.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to wrap an external API as a tool, so Compass can answer questions about current events or facts outside its training data.",
    sections: [
      {
        heading: 'Why Compass needs a search tool',
        body:
          "Claude's training has a knowledge cutoff — it doesn't know about anything after that point, and it can't browse the internet on its own. A search tool is what turns Compass from 'answers from memory' into 'can look things up' — the single most impactful tool a research assistant can have.",
      },
      {
        heading: 'Wrapping any API as a tool',
        body:
          "A tool implementation can call ANY external service — the pattern from Lessons 7-9 doesn't care whether the tool does math or hits a real API. You fetch, parse the response into a clean string, and return that as the tool_result, exactly like runCalculator did.",
        code: {
          language: 'typescript',
          code:
            "async function runWebSearch(query: string): Promise<string> {\n  const res = await fetch(`https://api.example-search.com/search?q=${encodeURIComponent(query)}`, {\n    headers: { Authorization: `Bearer ${process.env.SEARCH_API_KEY}` },\n  });\n  if (!res.ok) return 'Error: search request failed.';\n  const data = await res.json();\n  // Summarize the top results into a short, model-readable string.\n  return data.results.slice(0, 3).map((r: { title: string; snippet: string }) => `${r.title}: ${r.snippet}`).join('\\n');\n}",
        },
      },
      {
        heading: 'Async tools change the dispatch function',
        body:
          "A web request is asynchronous, so executeTool now needs to be async and awaited — a small but important update to the loop from Lesson 9.",
        code: {
          language: 'typescript',
          code:
            "async function executeTool(name: string, input: unknown): Promise<string> {\n  if (name === 'calculator') return runCalculator((input as { expression: string }).expression);\n  if (name === 'web_search') return await runWebSearch((input as { query: string }).query);\n  return 'Error: unknown tool.';\n}\n\n// in the loop:\nconst toolOutput = await executeTool(toolBlock.name, toolBlock.input);",
        },
      },
      {
        heading: 'Summarize search results before sending them back',
        body:
          "Raw search API responses are often large, messy JSON. Sending the WHOLE thing as a tool_result wastes tokens and can confuse the model. Trim to the top few results and extract just title/snippet — a clean, short, model-readable summary works far better than a data dump.",
      },
      {
        heading: 'A note on real search APIs',
        body:
          "This lesson's example targets a generic search API shape; in practice you'd use a real provider (many offer a search endpoint suited to AI agents). The IMPLEMENTATION details vary by provider, but the pattern — fetch, summarize, return as a tool_result — stays the same regardless of which one you pick.",
      },
    ],
    keyTerms: [
      { term: 'Knowledge cutoff', definition: "The point in time after which an LLM has no training data — it can't know about anything more recent without a tool." },
      { term: 'Async tool', definition: "A tool implementation that performs an asynchronous operation (like a network fetch) and must be awaited." },
      { term: 'Result summarization', definition: "Trimming a large/raw API response into a short, model-readable string before returning it as a tool_result." },
    ],
    commonMistakes: [
      "Forgetting to make executeTool async once a tool involves a real network call.",
      "Sending an entire raw API response as the tool_result instead of a trimmed summary, wasting tokens and confusing the model.",
      "Not handling a failed search request (network error, bad API key) — the tool should return a clear error string, not throw uncaught.",
      "Assuming a search tool makes Compass ALWAYS accurate — it still summarizes/interprets results, so occasional errors are still possible.",
      "Not URL-encoding the search query, breaking requests containing spaces or special characters.",
    ],
    takeaways: [
      "A search tool gives an agent access to current, real-world information beyond its training.",
      "Any external API can be wrapped as a tool using the same pattern as a simple function tool.",
      "Async tools require making executeTool (and the loop's call to it) async/await.",
      "Summarize large API responses before returning them as a tool_result.",
      "A search tool improves accuracy but doesn't eliminate the need for honest uncertainty.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A mock search tool',
    objective:
      "Practise the async-tool pattern with a MOCK search function (no real API key needed) before wiring a real one into Compass.",
    instructions: [
      "Write an async runMockSearch(query) that returns a fake but plausible-looking result after a short delay.",
      "Define a web_search tool and run it through a loop like Lesson 9's.",
      "Confirm the model correctly triggers it for a 'search-shaped' question.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'mock-search.ts',
        code:
          "async function runMockSearch(query: string): Promise<string> {\n  await new Promise((r) => setTimeout(r, 300));   // simulate network latency\n  return `Mock result for \"${query}\": [this would be real search data from a live API].`;\n}\n\nconst webSearchTool = {\n  name: 'web_search',\n  description: 'Searches the web for current information. Use this for questions about recent events, facts you are unsure of, or anything requiring up-to-date data.',\n  input_schema: {\n    type: 'object' as const,\n    properties: { query: { type: 'string', description: 'The search query.' } },\n    required: ['query'],\n  },\n};\n\n// Wire it into a loop exactly like Lesson 9's, using `await runMockSearch(...)`\n// inside an ASYNC executeTool function.",
      },
    ],
    explanation:
      "runMockSearch is deliberately async with a real await (a simulated delay), so wiring it in forces you to handle the async-tool change from the concept lesson properly — awaiting executeTool, not just calling it. Even though the DATA is fake, the model's decision-making is real: asking something that plausibly needs current information should still trigger web_search based purely on its description, exactly as it would with a genuine search API behind it.",
    expectedOutput:
      "Asking something like 'What's the latest news about AI agents?' triggers the web_search tool, and the mock result flows through the loop into a final answer referencing the (fake) search content.",
    learned: [
      "How to build and test an async tool without needing a real API key yet.",
      "How executeTool changes to support async tools.",
      "That tool triggering depends on description, independent of what the tool actually returns.",
      "How to simulate network latency for realistic testing.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gets a real (or realistically-structured) web search tool — its third tool, and the one that gives it access to current information.",
    why:
      "This is the capability that most changes what Compass can actually do: answer questions about things that happened after its training, or that it simply doesn't know — turning it into a genuine research assistant.",
    fileLocation: "compass-agent/index.ts (add webSearchTool + runWebSearch, update executeTool to async)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add the tool + implementation)',
        code:
          "const webSearchTool = {\n  name: 'web_search',\n  description: 'Searches the web for current information. Use this for recent events, facts you are unsure of, or anything requiring up-to-date data.',\n  input_schema: {\n    type: 'object' as const,\n    properties: { query: { type: 'string', description: 'The search query.' } },\n    required: ['query'],\n  },\n};\n\nasync function runWebSearch(query: string): Promise<string> {\n  try {\n    const res = await fetch(`https://api.example-search.com/search?q=${encodeURIComponent(query)}`, {\n      headers: { Authorization: `Bearer ${process.env.SEARCH_API_KEY}` },\n    });\n    if (!res.ok) return 'Error: search request failed.';\n    const data = await res.json();\n    const results = (data.results ?? []).slice(0, 3);\n    if (results.length === 0) return 'No results found.';\n    return results.map((r: { title: string; snippet: string }) => `${r.title}: ${r.snippet}`).join('\\n');\n  } catch {\n    return 'Error: could not reach the search service.';\n  }\n}\n\nconst TOOLS = [calculatorTool, getWordCountTool, webSearchTool];",
      },
      {
        language: 'typescript',
        filename: 'index.ts (make executeTool + its call site async)',
        code:
          "async function executeTool(name: string, input: unknown): Promise<string> {\n  if (name === 'calculator') return runCalculator((input as { expression: string }).expression);\n  if (name === 'get_word_count') return runWordCount((input as { text: string }).text);\n  if (name === 'web_search') return await runWebSearch((input as { query: string }).query);\n  return 'Error: unknown tool.';\n}\n\n// inside the loop in askCompass():\nconst toolOutput = await executeTool(toolBlock.name, toolBlock.input);",
      },
    ],
    placement:
      "Add webSearchTool and runWebSearch near your other tool definitions, and add webSearchTool to TOOLS. Update executeTool to be async (adding await runWebSearch(...) for the new branch), and update the ONE call site inside askCompass()'s loop to await executeTool(...) instead of calling it synchronously.",
    implementation:
      "runWebSearch follows the exact same defensive pattern as runCalculator: wrapped in try/catch, checking res.ok before parsing, and handling an empty results array explicitly — never assuming the happy path. Slicing to the top 3 results and mapping to a short 'title: snippet' string keeps the tool_result compact and genuinely readable by the model, instead of dumping raw JSON. Because executeTool is now async, the ONE line that calls it inside the loop needs await — every other part of Lesson 9's loop (the turn cap, message accumulation, dispatch structure) stays unchanged.",
    expectedResult:
      "Asking Compass something requiring current information now correctly triggers web_search, and (once a real SEARCH_API_KEY and provider are configured) returns a genuinely researched, grounded answer instead of an outdated guess from training data.",
    connects:
      "Compass now has three well-chosen tools covering math, text analysis, and current information. Lesson 11 hardens tool SAFETY — validating inputs and guarding against a malicious or malformed request — before Lesson 12 wraps up Module 2 as a complete, capable tool-using agent.",
  },

  quiz: [
    { id: 'c10q1', kind: 'concept', prompt: 'What does "knowledge cutoff" mean for an LLM?', options: ['A limit on conversation length', 'The point after which it has no training data and needs a tool for anything more recent', 'A billing threshold', 'A type of error'], answerIndex: 1, explanation: "Models don't know about events/facts after their training data ends, without external tools." },
    { id: 'c10q2', kind: 'application', prompt: 'Why must executeTool become async once a search tool is added?', options: ['No real reason', 'A network fetch is inherently asynchronous and must be awaited', 'Async is required by TypeScript for all functions', 'It’s only needed for the calculator'], answerIndex: 1, explanation: "Any tool doing real I/O (like a fetch call) is asynchronous, requiring async/await handling." },
    { id: 'c10q3', kind: 'concept', prompt: 'Why summarize search results before sending them back as a tool_result?', options: ['It’s unnecessary, raw data is always better', 'Raw API responses can be large/messy and waste tokens; a trimmed summary is clearer for the model', 'Summarizing is required by the API', 'It disables the tool'], answerIndex: 1, explanation: "A concise, structured summary is more useful (and cheaper) than a raw data dump." },
    { id: 'c10q4', kind: 'debug', prompt: 'A search request fails (network error) inside runWebSearch with no try/catch. What happens?', options: ['It silently returns an empty string', 'An unhandled exception can crash the whole tool-execution flow', 'It automatically retries', 'The model handles it gracefully regardless'], answerIndex: 1, explanation: "Without error handling, a thrown exception propagates uncaught, breaking the flow." },
    { id: 'c10q5', kind: 'code_reading', prompt: 'What does encodeURIComponent(query) protect against?', options: ['SQL injection', 'A query containing spaces or special characters breaking the URL', 'Rate limiting', 'Token overuse'], answerIndex: 1, explanation: "URL-encoding ensures special characters in the query don't corrupt the request URL." },
    { id: 'c10q6', kind: 'application', prompt: 'Why does the tool description mention "recent events" and "facts you are unsure of"?', options: ['Decoration only, no effect', 'To teach the model specifically WHEN this tool is the right choice versus answering directly', 'It’s required boilerplate', 'It changes the API endpoint'], answerIndex: 1, explanation: "Specific trigger conditions in the description improve when the model correctly reaches for this tool." },
    { id: 'c10q7', kind: 'output', prompt: 'If a search returns zero results, what should runWebSearch return?', options: ['undefined', 'A clear string like "No results found." so the model can explain that to the user', 'Throw an unhandled error', 'An empty array'], answerIndex: 1, explanation: "An explicit, clear result (even for 'no results') keeps the model informed rather than confused." },
    { id: 'c10q8', kind: 'debug', prompt: 'The loop from Lesson 9 doesn’t await executeTool after adding the async web_search tool. What breaks?', options: ['Nothing, it still works fine', 'toolOutput becomes a Promise object instead of the actual string result, breaking the tool_result content', 'The API rejects the request outright', 'TypeScript silently ignores it'], answerIndex: 1, explanation: "Without await, you'd get a pending Promise instead of the resolved string value." },
    { id: 'c10q9', kind: 'project', prompt: "Why does Compass's TOOLS array now include three DIFFERENT kinds of tools (math, text, search)?", options: ['Random choice with no purpose', 'To demonstrate that the same tool-use pattern works for very different capabilities, not just one narrow case', 'Only one tool can actually work at a time', 'It’s required to have exactly three tools'], answerIndex: 1, explanation: "Showing the pattern generalizes across different tool TYPES reinforces that tool use is a general mechanism, not a special case." },
    { id: 'c10q10', kind: 'concept', prompt: 'Does adding a search tool make Compass’s answers ALWAYS fully accurate?', options: ['Yes, it becomes infallible', 'No — it improves accuracy for current info, but the model still summarizes/interprets results and can still err', 'No, it makes things worse', 'Accuracy is unrelated to tools'], answerIndex: 1, explanation: "Tools improve grounding but don't eliminate all possibility of error in interpretation or summarization." },
  ],

  homework: {
    task:
      "Add basic caching to runWebSearch: if the SAME query was searched recently (within the current process run), return the cached result instead of making a new request.",
    requirements: [
      "Use a simple in-memory Map<string, string> to store query -> result.",
      "Before fetching, check the cache; if present, return the cached value immediately (and log that it was a cache hit).",
      "After a successful fetch, store the result in the cache before returning it.",
    ],
    expectedOutcome:
      "Searching the exact same query twice in one session makes only ONE real network request — the second time returns instantly from the cache, visibly logged as a cache hit.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 9,
      hint: "Lesson 9 asked you to log the TOTAL number of turns a question took, to observe simple vs. multi-step questions differently.",
      steps: [
        "Inside the for loop in askCompass(), increment a turn counter (e.g. let turnCount = 0; turnCount++ at the top of each iteration).",
        "When returning the final answer (the branch where stop_reason !== 'tool_use'), log `[info] answered in ${turnCount} turn(s)` right before returning.",
        "Test with a simple question (expect 1 turn) and a multi-tool question (expect 2+ turns).",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside askCompass)',
          code:
            "let turnCount = 0;\nfor (let turn = 0; turn < MAX_TURNS; turn++) {\n  turnCount++;\n  // ...existing loop body...\n  if (response.stop_reason !== 'tool_use') {\n    console.log(`[info] answered in ${turnCount} turn(s)`);\n    return response.content[0].type === 'text' ? response.content[0].text : '';\n  }\n  // ...\n}",
        },
      ],
    },
  },
};
