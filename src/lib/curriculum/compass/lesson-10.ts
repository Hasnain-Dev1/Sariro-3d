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
      "Learn how to wrap an external API as a tool using Python's requests library, so Compass can answer questions about current events or facts outside its training data.",
    sections: [
      {
        heading: 'Why Compass needs a search tool',
        body:
          "Every model has a knowledge cutoff — it doesn't know about anything after that point, and it can't browse the internet on its own. A search tool is what turns Compass from 'answers from memory' into 'can look things up' — the single most impactful tool a research assistant can have.",
      },
      {
        heading: 'Wrapping any API as a tool',
        body:
          "A tool implementation can call ANY external service — the pattern from Lessons 7-9 doesn't care whether the tool does math or hits a real API. Python's requests library is the standard way to make HTTP calls; you fetch, parse the response into a clean string, and return that as the tool result, exactly like run_calculator did.",
        code: {
          language: 'python',
          code:
            "import requests\n\ndef run_web_search(query: str) -> str:\n    res = requests.get(\n        \"https://api.example-search.com/search\",\n        params={\"q\": query},\n        headers={\"Authorization\": f\"Bearer {SEARCH_API_KEY}\"},\n        timeout=10,\n    )\n    if not res.ok:\n        return \"Error: search request failed.\"\n    data = res.json()\n    # Summarize the top results into a short, model-readable string.\n    top = data.get(\"results\", [])[:3]\n    return \"\\n\".join(f\"{r['title']}: {r['snippet']}\" for r in top)",
        },
      },
      {
        heading: 'Dispatch stays the same',
        body:
          "Unlike some languages, Python's requests calls are SYNCHRONOUS by default (they block until the response arrives) — no special async handling is needed in execute_tool for this tool, unlike some other ecosystems. It's just another function call.",
        code: {
          language: 'python',
          code:
            "def execute_tool(name: str, tool_input: dict) -> str:\n    if name == \"calculator\":\n        return run_calculator(tool_input[\"expression\"])\n    if name == \"get_word_count\":\n        return run_word_count(tool_input[\"text\"])\n    if name == \"web_search\":\n        return run_web_search(tool_input[\"query\"])\n    return \"Error: unknown tool.\"",
        },
      },
      {
        heading: 'Summarize search results before sending them back',
        body:
          "Raw search API responses are often large, messy JSON. Sending the WHOLE thing as a tool result wastes tokens and can confuse the model. Trim to the top few results and extract just title/snippet — a clean, short, model-readable summary works far better than a data dump.",
      },
      {
        heading: 'A note on real search APIs',
        body:
          "This lesson's example targets a generic search API shape; in practice you'd use a real provider (many offer a search endpoint suited to AI agents). The IMPLEMENTATION details vary by provider, but the pattern — fetch, summarize, return as a tool result — stays the same regardless of which one you pick, and regardless of which model provider (OpenAI, Groq, Gemini) is answering the question.",
      },
    ],
    keyTerms: [
      { term: 'Knowledge cutoff', definition: "The point in time after which an LLM has no training data — it can't know about anything more recent without a tool." },
      { term: 'requests', definition: "Python's standard library for making HTTP calls, like fetching data from a search API." },
      { term: 'Result summarization', definition: "Trimming a large/raw API response into a short, model-readable string before returning it as a tool result." },
    ],
    commonMistakes: [
      "Sending an entire raw API response as the tool result instead of a trimmed summary, wasting tokens and confusing the model.",
      "Not handling a failed search request (network error, bad API key) — the tool should return a clear error string, not raise uncaught.",
      "Forgetting a timeout on the requests.get call, letting a hung request block the whole agent indefinitely.",
      "Assuming a search tool makes Compass ALWAYS accurate — it still summarizes/interprets results, so occasional errors are still possible.",
      "Not checking res.ok (or res.status_code) before calling res.json(), which can raise on a non-JSON error page.",
    ],
    takeaways: [
      "A search tool gives an agent access to current, real-world information beyond its training.",
      "Any external API can be wrapped as a tool using Python's requests library.",
      "requests.get is synchronous by default — no special async handling needed for this tool.",
      "Summarize large API responses before returning them as a tool result.",
      "Always set a timeout on network calls so a hung request can't block the agent forever.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A mock search tool',
    objective:
      "Practise the tool pattern with a MOCK search function (no real API key needed) before wiring a real one into Compass.",
    instructions: [
      "Write a mock_search(query) that returns a fake but plausible-looking result after a short delay.",
      "Define a web_search tool and run it through a loop like Lesson 9's.",
      "Confirm the model correctly triggers it for a 'search-shaped' question.",
    ],
    code: [
      {
        language: 'python',
        filename: 'mock_search.py',
        code:
          "import time\n\ndef mock_search(query: str) -> str:\n    time.sleep(0.3)   # simulate network latency\n    return f'Mock result for \"{query}\": [this would be real search data from a live API].'\n\nweb_search_tool = {\n    \"type\": \"function\",\n    \"function\": {\n        \"name\": \"web_search\",\n        \"description\": \"Searches the web for current information. Use this for questions about recent events, facts you are unsure of, or anything requiring up-to-date data.\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\"query\": {\"type\": \"string\", \"description\": \"The search query.\"}},\n            \"required\": [\"query\"],\n        },\n    },\n}\n\n# Wire it into a loop exactly like Lesson 9's, calling mock_search(...)\n# inside execute_tool.",
        },
      ],
    explanation:
      "mock_search deliberately includes a time.sleep(0.3), so wiring it in forces you to notice it behaves just like a real network call would (a small pause before returning) — even though the DATA is fake, the model's decision-making is real: asking something that plausibly needs current information should still trigger web_search based purely on its description, exactly as it would with a genuine search API behind it. Note the tool definition's shape: a top-level {\"type\": \"function\", \"function\": {...}} wrapper is how the openai package expects every tool to be described, with \"parameters\" (not \"input_schema\") holding the JSON schema.",
    expectedOutput:
      "Asking something like 'What's the latest news about AI agents?' triggers the web_search tool, and the mock result flows through the loop into a final answer referencing the (fake) search content.",
    learned: [
      "How to build and test a mock external-API tool without needing a real API key yet.",
      "How execute_tool dispatches to a network-calling function just like any other.",
      "That tool triggering depends on description, independent of what the tool actually returns.",
      "How to simulate network latency for realistic testing with time.sleep.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gets a real (or realistically-structured) web search tool — its third tool, and the one that gives it access to current information.",
    why:
      "This is the capability that most changes what Compass can actually do: answer questions about things that happened after its training, or that it simply doesn't know — turning it into a genuine research assistant.",
    fileLocation: "compass-agent/main.py (add web_search_tool + run_web_search, update execute_tool)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add the tool + implementation)',
        code:
          "import os\nimport requests\n\nweb_search_tool = {\n    \"type\": \"function\",\n    \"function\": {\n        \"name\": \"web_search\",\n        \"description\": \"Searches the web for current information. Use this for recent events, facts you are unsure of, or anything requiring up-to-date data.\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\"query\": {\"type\": \"string\", \"description\": \"The search query.\"}},\n            \"required\": [\"query\"],\n        },\n    },\n}\n\ndef run_web_search(query: str) -> str:\n    try:\n        res = requests.get(\n            \"https://api.example-search.com/search\",\n            params={\"q\": query},\n            headers={\"Authorization\": f\"Bearer {os.environ.get('SEARCH_API_KEY', '')}\"},\n            timeout=10,\n        )\n        if not res.ok:\n            return \"Error: search request failed.\"\n        data = res.json()\n        results = data.get(\"results\", [])[:3]\n        if not results:\n            return \"No results found.\"\n        return \"\\n\".join(f\"{r['title']}: {r['snippet']}\" for r in results)\n    except requests.RequestException:\n        return \"Error: could not reach the search service.\"\n\nTOOLS = [calculator_tool, get_word_count_tool, web_search_tool]",
      },
      {
        language: 'python',
        filename: 'main.py (add web_search to the dispatch function)',
        code:
          "def execute_tool(name: str, tool_input: dict) -> str:\n    if name == \"calculator\":\n        return run_calculator(tool_input[\"expression\"])\n    if name == \"get_word_count\":\n        return run_word_count(tool_input[\"text\"])\n    if name == \"web_search\":\n        return run_web_search(tool_input[\"query\"])\n    return \"Error: unknown tool.\"",
      },
    ],
    placement:
      "Add web_search_tool and run_web_search near your other tool definitions, and add web_search_tool to TOOLS. Add the web_search branch to execute_tool. Make sure requests is installed: pip install requests.",
    implementation:
      "run_web_search follows the exact same defensive pattern as run_calculator: wrapped in try/except (catching requests.RequestException specifically, which covers network-level failures like timeouts or connection errors), checking res.ok before parsing, and handling an empty results list explicitly — never assuming the happy path. Slicing to the top 3 results and joining them into a short 'title: snippet' string keeps the tool result compact and genuinely readable by the model, instead of dumping raw JSON. Since requests.get() is synchronous, execute_tool needs no special handling — it's dispatched exactly like the calculator and word-count tools, and the tool definition itself uses the openai package's {\"type\": \"function\", \"function\": {...}} shape rather than a flat schema.",
    expectedResult:
      "Asking Compass something requiring current information now correctly triggers web_search, and (once a real SEARCH_API_KEY and provider are configured) returns a genuinely researched, grounded answer instead of an outdated guess from training data.",
    connects:
      "Compass now has three well-chosen tools covering math, text analysis, and current information. Lesson 11 hardens tool SAFETY — validating inputs and guarding against a malicious or malformed request — before Lesson 12 wraps up Module 2 as a complete, capable tool-using agent.",
  },

  quiz: [
    { id: 'c10q1', kind: 'concept', prompt: 'What does "knowledge cutoff" mean for an LLM?', options: ['A limit on conversation length', 'The point after which it has no training data and needs a tool for anything more recent', 'A billing threshold', 'A type of error'], answerIndex: 1, explanation: "Models don't know about events/facts after their training data ends, without external tools." },
    { id: 'c10q2', kind: 'application', prompt: 'Why does execute_tool need NO special handling for the web_search branch, unlike in some other ecosystems?', options: ['web_search doesn’t actually make a network call', 'requests.get() is synchronous by default in Python, so it’s dispatched just like any other function', 'Python can’t make network calls', 'It’s a coincidence with no real reason'], answerIndex: 1, explanation: "Python's requests library blocks and returns a result directly, unlike an async-only network API." },
    { id: 'c10q3', kind: 'concept', prompt: 'Why summarize search results before sending them back as a tool result?', options: ['It’s unnecessary, raw data is always better', 'Raw API responses can be large/messy and waste tokens; a trimmed summary is clearer for the model', 'Summarizing is required by the API', 'It disables the tool'], answerIndex: 1, explanation: "A concise, structured summary is more useful (and cheaper) than a raw data dump." },
    { id: 'c10q4', kind: 'debug', prompt: 'A search request fails (network error) inside run_web_search with no try/except. What happens?', options: ['It silently returns an empty string', 'An unhandled exception can crash the whole tool-execution flow', 'It automatically retries', 'The model handles it gracefully regardless'], answerIndex: 1, explanation: "Without error handling, a raised exception propagates uncaught, breaking the flow." },
    { id: 'c10q5', kind: 'code_reading', prompt: 'What does the timeout=10 argument to requests.get do?', options: ['Limits the response to 10 results', 'Gives up and raises an exception if no response arrives within 10 seconds', 'Waits exactly 10 seconds before sending the request', 'Sets the search relevance threshold'], answerIndex: 1, explanation: "A timeout prevents a hung network request from blocking the program indefinitely." },
    { id: 'c10q6', kind: 'application', prompt: 'Why does the tool description mention "recent events" and "facts you are unsure of"?', options: ['Decoration only, no effect', 'To teach the model specifically WHEN this tool is the right choice versus answering directly', 'It’s required boilerplate', 'It changes the API endpoint'], answerIndex: 1, explanation: "Specific trigger conditions in the description improve when the model correctly reaches for this tool." },
    { id: 'c10q7', kind: 'output', prompt: 'If a search returns zero results, what should run_web_search return?', options: ['None', 'A clear string like "No results found." so the model can explain that to the user', 'Raise an unhandled exception', 'An empty list'], answerIndex: 1, explanation: "An explicit, clear result (even for 'no results') keeps the model informed rather than confused." },
    { id: 'c10q8', kind: 'debug', prompt: 'A student calls res.json() without first checking res.ok. What risk does this create?', options: ['No risk at all', 'If the response is an error page (not valid JSON), .json() can raise an exception', 'It always works fine regardless', 'json() automatically checks status first'], answerIndex: 1, explanation: "An error response often isn't valid JSON, so parsing it without checking status first can raise." },
    { id: 'c10q9', kind: 'project', prompt: "Why does Compass's TOOLS list now include three DIFFERENT kinds of tools (math, text, search)?", options: ['Random choice with no purpose', 'To demonstrate that the same tool-use pattern works for very different capabilities, not just one narrow case', 'Only one tool can actually work at a time', 'It’s required to have exactly three tools'], answerIndex: 1, explanation: "Showing the pattern generalizes across different tool TYPES reinforces that tool use is a general mechanism, not a special case." },
    { id: 'c10q10', kind: 'concept', prompt: 'Does adding a search tool make Compass’s answers ALWAYS fully accurate?', options: ['Yes, it becomes infallible', 'No — it improves accuracy for current info, but the model still summarizes/interprets results and can still err', 'No, it makes things worse', 'Accuracy is unrelated to tools'], answerIndex: 1, explanation: "Tools improve grounding but don't eliminate all possibility of error in interpretation or summarization." },
  ],

  homework: {
    task:
      "Add basic caching to run_web_search: if the SAME query was searched recently (within the current process run), return the cached result instead of making a new request.",
    requirements: [
      "Use a simple module-level dict as a cache: search_cache = {}.",
      "Before fetching, check the cache; if present, return the cached value immediately (and print that it was a cache hit).",
      "After a successful fetch, store the result in the cache before returning it.",
    ],
    expectedOutcome:
      "Searching the exact same query twice in one session makes only ONE real network request — the second time returns instantly from the cache, visibly printed as a cache hit.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 9,
      hint: "Lesson 9 asked you to print the TOTAL number of turns a question took, to observe simple vs. multi-step questions differently.",
      steps: [
        "Inside the for loop in ask_compass(), increment a turn counter (e.g. turn_count = 0 before the loop, turn_count += 1 at the top of each iteration).",
        "When returning the final answer (the branch where message.tool_calls is empty), print f'[info] answered in {turn_count} turn(s)' right before returning.",
        "Test with a simple question (expect 1 turn) and a multi-tool question (expect 2+ turns).",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py (inside ask_compass)',
          code:
            "turn_count = 0\nfor _ in range(MAX_TURNS):\n    turn_count += 1\n    # ...existing loop body...\n    if not message.tool_calls:\n        print(f\"[info] answered in {turn_count} turn(s)\")\n        return message.content\n    # ...",
        },
      ],
    },
  },
};
