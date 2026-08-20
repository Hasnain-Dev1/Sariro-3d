import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 12 — Module 2 Build: The Tool Agent
 * Module 2 (Tool Use) · Lesson 12 of 30
 */
export const lesson12: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 2,
  lessonIndex: 5,
  globalNumber: 12,
  name: 'Module 2 build — the tool agent',
  title: 'Module 2 Build — Compass, a Real Tool-Using Agent',
  subtitle: "Polish the tool-calling experience with visible reasoning and a final review of Module 2.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to make an agent's tool use transparent to the user, and review everything Module 2 built: detection, execution, multi-step loops, and safety.",
    sections: [
      {
        heading: 'Making tool use visible to the user',
        body:
          "Right now, tool calls are only printed to the DEVELOPER's console — the person actually chatting with Compass sees nothing until the final answer. A more transparent agent tells the USER what it's doing: 'Let me calculate that...' or 'Searching for current information...' — this builds trust and makes the agent feel less like a black box.",
      },
      {
        heading: 'A friendly label per tool',
        body:
          "A simple lookup from tool name to a human-readable action description makes this easy to add without cluttering the core loop logic.",
        code: {
          language: 'python',
          code:
            "TOOL_LABELS = {\n    \"calculator\": \"Calculating...\",\n    \"get_word_count\": \"Counting words...\",\n    \"web_search\": \"Searching...\",\n}\n\n# inside the loop, right before executing:\nprint(TOOL_LABELS.get(tool_block.name, \"Using a tool...\"))",
        },
      },
      {
        heading: 'Reviewing Module 2',
        body:
          "In six lessons, Compass went from a plain Q&A bot to a genuine agent: it can DETECT when a tool is needed (L7), EXECUTE one and return a grounded answer (L8), chain MULTIPLE tools for complex questions (L9), reach real external services (L10), and validate every tool input SAFELY (L11). This lesson (L12) is the polish pass that makes all of that feel coherent to an actual user, not just correct under the hood.",
      },
      {
        heading: 'A quick self-check before Module 3',
        body:
          "Before moving on, it's worth confirming Compass handles a genuinely tricky multi-tool question correctly end to end — not just the individual pieces in isolation. This is the same 'test the whole system, not just each part' discipline from earlier reliability lessons, applied here to tool orchestration specifically.",
      },
      {
        heading: 'What’s missing, and what’s next',
        body:
          "Compass can act, but it still forgets everything between separate runs of the program — every question starts a brand new messages list. Module 3 (Memory + Context) fixes exactly that: short-term conversation memory within a session, and eventually long-term memory across sessions.",
      },
    ],
    keyTerms: [
      { term: 'Tool transparency', definition: "Showing the USER (not just developer logs) what action an agent is taking and why." },
      { term: 'Tool label', definition: "A short, human-readable description of what a tool call is doing, shown to the user." },
      { term: 'dict.get(key, default)', definition: "Python's method for looking up a dict key that returns a fallback value instead of raising if the key is missing." },
    ],
    commonMistakes: [
      "Only printing tool activity to the developer console, leaving the actual user with no visibility into what's happening.",
      "Showing overly technical tool names/arguments to a non-technical user instead of a friendly label.",
      "Testing only individual tools in isolation, never a genuinely multi-tool end-to-end question.",
      "Using dict[key] instead of dict.get(key, default), which raises KeyError for an unlabeled tool instead of falling back gracefully.",
      "Treating polish as optional — a working-but-opaque agent feels much less trustworthy than a transparent one.",
    ],
    takeaways: [
      "Showing users WHAT an agent is doing (not just developers) builds trust.",
      "A simple name-to-label dict keeps transparency additions clean.",
      "Module 2 gave Compass detection, execution, multi-step chaining, real external tools, and input safety.",
      "Test the FULL system with a genuinely multi-step question, not just isolated pieces.",
      "Compass still has no memory between runs — Module 3 solves that next.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A friendly tool-status printer',
    objective:
      "Practise the tool-label pattern with a small standalone example before applying it to Compass's real loop.",
    instructions: [
      "Define a small TOOL_LABELS dict for 3 made-up tool names.",
      "Write a function that prints the friendly label, falling back to a generic message for an unknown tool.",
      "Test it with a known and an unknown tool name.",
    ],
    code: [
      {
        language: 'python',
        filename: 'tool_label_test.py',
        code:
          "TOOL_LABELS = {\n    \"send_email\": \"Sending email...\",\n    \"check_weather\": \"Checking the weather...\",\n    \"book_meeting\": \"Booking your meeting...\",\n}\n\ndef announce_tool(name: str):\n    print(TOOL_LABELS.get(name, f\"Using {name}...\"))\n\nannounce_tool(\"check_weather\")\nannounce_tool(\"some_future_tool\")",
      },
    ],
    explanation:
      "TOOL_LABELS is a simple lookup dict — adding a new tool later means adding one new key, with zero changes to announce_tool itself. dict.get(name, default) handles any tool name NOT in the dict gracefully, printing a generic-but-still-readable message instead of raising a KeyError. This tiny pattern is exactly what gets applied to Compass's real loop next: a small, isolated addition that doesn't touch the core execution logic.",
    expectedOutput:
      "Prints 'Checking the weather...' for the known tool, then 'Using some_future_tool...' for the unknown one — never a crash or KeyError.",
    learned: [
      "How to build a simple, extensible label lookup with a dict.",
      "How dict.get() provides a safe fallback.",
      "Why separating 'what to say' from 'how to execute' keeps code clean.",
      "How small UX additions can be layered onto existing logic.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass narrates its tool use to the user in the REPL, and Module 2 is confirmed complete with a genuine multi-tool test — the 'tool agent project' milestone.",
    why:
      "This is the Module 2 payoff: Compass isn't just correct under the hood, it FEELS like a transparent, trustworthy assistant that tells you what it's doing as it works.",
    fileLocation: "compass-agent/main.py (add TOOL_LABELS + announce inside the loop)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add near TOOLS)',
        code:
          "TOOL_LABELS = {\n    \"calculator\": \"Calculating...\",\n    \"get_word_count\": \"Counting words...\",\n    \"web_search\": \"Searching...\",\n}",
      },
      {
        language: 'python',
        filename: 'main.py (inside ask_compass, right before executing a tool)',
        code:
          "tool_block = next((b for b in response.content if b.type == \"tool_use\"), None)\nif not tool_block:\n    return \"Something went wrong reading the tool request.\"\n\nprint(TOOL_LABELS.get(tool_block.name, f\"Using {tool_block.name}...\"))\ntool_output = execute_tool(tool_block.name, tool_block.input)\nprint(f\"[tool] {tool_block.name}({tool_block.input}) = {tool_output}\")\nmessages.append({\"role\": \"user\", \"content\": [{\"type\": \"tool_result\", \"tool_use_id\": tool_block.id, \"content\": tool_output}]})",
      },
    ],
    placement:
      "Add TOOL_LABELS near your TOOLS list. In ask_compass()'s loop, add the print(TOOL_LABELS.get(...)) line immediately BEFORE the execute_tool(...) call — so the announcement appears before the work happens, not after.",
    implementation:
      "The label prints the moment the model DECIDES to use a tool, before execute_tool actually runs it — this ordering matters: the user should see 'Searching...' WHILE the search happens, not only after it's already done. The existing detailed [tool] print line stays too, still useful for developer debugging, just now alongside a friendlier announcement layer for the end-user-facing REPL experience. Nothing about the loop's core logic (turn cap, message accumulation, dispatch) changes — this is a pure additive polish pass, exactly matching the concept lesson's principle.",
    expectedResult:
      "Asking Compass a math question now shows 'Calculating...' appear in the terminal WHILE it works, followed by the final grounded answer — and a genuinely multi-step question shows each tool announced in turn as Compass works through it.",
    connects:
      "Module 2 is complete: Compass detects, executes, chains, reaches external services, validates safely, and now communicates transparently. Module 3 (Memory + Context) is next — giving Compass the ability to remember a conversation across multiple questions, not just within one already-accumulating loop.",
  },

  quiz: [
    { id: 'c12q1', kind: 'concept', prompt: 'Why does the concept lesson distinguish "developer logs" from "user-facing" tool visibility?', options: ['They are the same thing', 'A developer console print isn’t seen by the actual person chatting with the agent — a separate, friendlier signal is needed for them', 'Users should never see anything about tools', 'Logging is unnecessary once tools work'], answerIndex: 1, explanation: "The two audiences (developer debugging vs. end user experience) need different kinds of visibility." },
    { id: 'c12q2', kind: 'code_reading', prompt: 'What does TOOL_LABELS.get(tool_block.name, f"Using {tool_block.name}...") do?', options: ['Always uses the fallback', 'Looks up a friendly label, falling back to a generic message if the tool isn’t in the dict', 'Raises if the tool is unknown', 'Ignores the tool name entirely'], answerIndex: 1, explanation: "dict.get()'s second argument provides a safe default when the lookup misses." },
    { id: 'c12q3', kind: 'application', prompt: 'Why print the tool label BEFORE calling execute_tool, not after?', options: ['No real difference either way', 'So the user sees the announcement WHILE the work happens, not only after it’s already done', 'It’s required by the API', 'It changes the tool’s result'], answerIndex: 1, explanation: "Announcing before execution gives real-time feedback rather than a delayed, less useful notice." },
    { id: 'c12q4', kind: 'concept', prompt: 'What FIVE capabilities did Module 2 give Compass overall?', options: ['Memory, planning, deployment, UI, and evals', 'Detecting, executing, chaining multiple, reaching external services, and validating tool input safely', 'Only a calculator', 'Streaming and error handling only (that was Module 1)'], answerIndex: 1, explanation: "These five map directly to Lessons 7 through 11 of this module." },
    { id: 'c12q5', kind: 'debug', prompt: 'A newly added tool has no entry in TOOL_LABELS. What happens when it’s used?', options: ['The program crashes with KeyError', 'A generic fallback message like "Using new_tool..." prints instead', 'Nothing prints at all', 'It raises a TypeError'], answerIndex: 1, explanation: "The .get() fallback ensures a reasonable message even for tools not explicitly labeled." },
    { id: 'c12q6', kind: 'application', prompt: 'Why keep the detailed [tool] print line alongside the new friendly label?', options: ['Redundant, one should be removed', 'The detailed print still serves developer debugging; the label serves the end-user experience — different audiences', 'They must always match exactly', 'The friendly label replaces printing entirely'], answerIndex: 1, explanation: "Both serve legitimate but different purposes and can coexist without conflict." },
    { id: 'c12q7', kind: 'concept', prompt: 'What is Compass still missing at the end of Module 2?', options: ['Tool use', 'The ability to remember a conversation ACROSS separate program runs/sessions', 'Error handling', 'A system prompt'], answerIndex: 1, explanation: "Every run currently starts a brand-new messages list — there's no persistence across sessions yet." },
    { id: 'c12q8', kind: 'output', prompt: 'For a question needing the calculator then web_search in sequence, what would the user see printed, in order?', options: ['Only the final answer, no announcements', '"Calculating..." then "Searching..." then the final answer', 'Both announcements at the exact same time', 'Only "Searching..." regardless of order'], answerIndex: 1, explanation: "Each tool announcement fires in the loop iteration where that specific tool is used, in the actual execution order." },
    { id: 'c12q9', kind: 'project', prompt: "Why is 'test the FULL system with a genuinely multi-step question' emphasized as this module's final check?", options: ['It’s unnecessary busywork', 'Individually-working pieces don’t guarantee the whole orchestrated flow (loop + dispatch + multiple real tools) works correctly together', 'Multi-step questions never actually occur', 'Only single-tool questions matter'], answerIndex: 1, explanation: "Integration testing catches issues that testing each tool in isolation might miss." },
    { id: 'c12q10', kind: 'concept', prompt: 'What is Module 3 about to add to Compass?', options: ['Deployment to the web', 'Memory — conversation context that persists, not resetting with every run', 'Multi-agent orchestration', 'Fine-tuning'], answerIndex: 1, explanation: "Module 3 (Memory + Context) is the very next module in Compass's roadmap." },
  ],

  homework: {
    task:
      "Add a final summary line after Compass answers, showing which tools were used for that question (e.g. '[used: calculator, web_search]'), derived from tracking tool names used during the loop.",
    requirements: [
      "Track a list of tool names used during the current question's loop (reset it at the start of each ask_compass call).",
      "After the final answer is determined, if the list is non-empty, print '[used: ...]' joining the tool names.",
      "Test with a question needing zero tools, one tool, and multiple tools, confirming the summary matches each case.",
    ],
    expectedOutcome:
      "A question needing no tools shows no summary line; one needing two tools shows '[used: calculator, web_search]' (or similar) matching what actually ran.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 11,
      hint: "Lesson 11 asked you to add a rate limit to run_web_search — rejecting a 6th call within any 60-second window.",
      steps: [
        "Declare search_call_times: list[float] = [] at module level.",
        "At the top of run_web_search, filter out timestamps older than 60 seconds: recent = [t for t in search_call_times if time.time() - t < 60].",
        "If len(recent) >= 5, return an error string immediately without fetching.",
        "Otherwise, append time.time() to search_call_times (or a similar tracking structure) before proceeding with the real request.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "import time\n\nsearch_call_times: list[float] = []\n\ndef run_web_search(query: str) -> str:\n    now = time.time()\n    recent = [t for t in search_call_times if now - t < 60]\n    if len(recent) >= 5:\n        return \"Error: search rate limit reached, please wait a moment.\"\n    search_call_times.append(now)\n    # ...existing fetch logic...",
        },
      ],
    },
  },
};
