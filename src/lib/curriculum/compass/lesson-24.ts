import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 24 — Module 4 Build: The Reasoning Agent
 * Module 4 (Planning + Reasoning) · Lesson 24 of 30
 */
export const lesson24: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 6,
  globalNumber: 24,
  name: 'Module 4 build — the reasoning agent',
  title: 'Module 4 Build — Compass, a Full Reasoning Agent',
  subtitle: "Wire ReAct, Chain-of-Thought, Plan+Execute, self-reflection, and error recovery into one router.",

  concept: {
    durationMin: 15,
    summary:
      "Review Module 4's five reasoning patterns and build a router that picks the right one for a given request, instead of forcing everything through the heaviest pipeline.",
    sections: [
      {
        heading: 'A router, not a single pipeline',
        body:
          "Running EVERY question through the full plan_execute_and_recover() + self-reflection pipeline would be wasteful — a simple factual question doesn't need a 6-step plan and two rounds of critique. A router function looks at the incoming request and picks the lightest pattern that will genuinely serve it well.",
      },
      {
        heading: 'The routing decision',
        body:
          "Three simple signals are usually enough: does the question look reasoning-heavy but tool-free (from Lesson 20's should_use_cot heuristic) → reason_through(); does it look like it needs multiple distinct sub-tasks (multiple 'and's, multiple questions in one message) → plan_execute_and_recover(); otherwise → the standard ReAct-enabled run_agent_loop() from Lesson 19, optionally with a lightweight self-reflection pass.",
        code: {
          language: 'python',
          code:
            'def route_and_answer(question: str) -> str:\n    if should_use_cot(question):\n        print("[router] routing to chain-of-thought reasoning")\n        return reason_through(question)\n\n    if looks_multi_part(question):\n        print("[router] routing to plan+execute")\n        return plan_execute_and_recover(question)\n\n    print("[router] routing to standard reasoning agent")\n    return answer_with_reflection(question)',
        },
      },
      {
        heading: 'Detecting multi-part requests',
        body:
          "A simple heuristic — counting coordinating conjunctions and question marks — is enough to catch the common cases without needing a separate model call just to classify the request.",
        code: {
          language: 'python',
          code:
            'def looks_multi_part(question: str) -> bool:\n    lower = question.lower()\n    conjunction_count = lower.count(" and ") + lower.count(" then ")\n    question_mark_count = question.count("?")\n    return conjunction_count >= 2 or question_mark_count >= 2',
        },
      },
      {
        heading: 'Reviewing Module 4 end to end',
        body:
          "Module 4 built five genuinely distinct capabilities: ReAct (visible reasoning before acting), Chain-of-Thought (pure step-by-step logic), Plan+Execute (decomposing big tasks), self-reflection (checking and revising its own work), and error recovery (surviving a failed step gracefully). Together with Module 2's tools and Module 3's memory, Compass is now a genuinely capable reasoning agent — everything except getting it in front of real users.",
      },
    ],
    keyTerms: [
      { term: 'Router', definition: "A function that inspects an incoming request and dispatches it to the most appropriate reasoning pattern, rather than always using the heaviest one." },
      { term: 'Multi-part detection', definition: "A lightweight heuristic (conjunctions, question marks) used to guess whether a request needs decomposition into multiple steps." },
    ],
    commonMistakes: [
      "Routing every question through the heaviest available pipeline (Plan+Execute + reflection), wasting cost and latency.",
      "Using a full model call just to CLASSIFY a request, when a cheap heuristic would work almost as well.",
      "Forgetting the router itself needs testing against a range of question types, not just the happy path.",
      "Treating the router's heuristics as perfect — they're approximations, and edge cases will occasionally route 'wrong' without being catastrophic.",
    ],
    takeaways: [
      "A router dispatches requests to the lightest pattern that will serve them well, not always the heaviest.",
      "Cheap heuristics (conjunction/question-mark counts) can approximate classification without an extra model call.",
      "Module 4 delivered five distinct reasoning capabilities: ReAct, CoT, Plan+Execute, self-reflection, error recovery.",
      "Combined with Modules 2-3's tools and memory, Compass is now a complete reasoning agent.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Testing the multi-part detector',
    objective: "Verify looks_multi_part() correctly distinguishes simple from multi-part questions.",
    instructions: [
      "Write looks_multi_part() as shown in the concept section.",
      "Test it against 3 simple questions and 3 genuinely multi-part ones.",
      "Print the result for each.",
    ],
    code: [
      {
        language: 'python',
        filename: 'router_test.py',
        code:
          'simple = ["What\'s the capital of France?", "Convert 10 miles to km.", "Define recursion."]\nmulti_part = [\n    "Check the weather in Tokyo and NYC, and tell me which is better for a trip, and suggest what to pack.",\n    "Research three job candidates and then write a comparison summary.",\n    "What\'s the population of Japan, and what\'s the population of Germany?",\n]\n\nfor q in simple + multi_part:\n    print(f"{looks_multi_part(q)}: {q}")',
      },
    ],
    explanation:
      "This test directly checks the router's most subjective heuristic. It's expected to be imperfect at the margins — the goal is a heuristic that's RIGHT MOST OF THE TIME cheaply, not a perfect classifier, which is exactly the tradeoff the concept section calls out.",
    expectedOutput: "The three simple questions print False; the three multi-part ones print True.",
    learned: [
      "How to build and test a cheap text-based heuristic.",
      "Why an approximate, fast heuristic can be preferable to a perfect but expensive one.",
      "How to design a test set covering both the intended-pass and intended-fail cases.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gains route_and_answer() — a single entry point that automatically picks the right reasoning pattern for any given request, completing Module 4.",
    why:
      "This is the Module 4 payoff: instead of the user (or calling code) needing to know which of five patterns to invoke, Compass decides for itself, making the whole reasoning system usable through one simple function call.",
    fileLocation: 'compass-agent/main.py',
    code: [
      {
        language: 'python',
        filename: 'main.py',
        code:
          'def looks_multi_part(question: str) -> bool:\n    lower = question.lower()\n    conjunction_count = lower.count(" and ") + lower.count(" then ")\n    question_mark_count = question.count("?")\n    return conjunction_count >= 2 or question_mark_count >= 2\n\n\ndef route_and_answer(question: str) -> str:\n    if should_use_cot(question):\n        print("[router] routing to chain-of-thought reasoning")\n        return reason_through(question)\n\n    if looks_multi_part(question):\n        print("[router] routing to plan+execute")\n        return plan_execute_and_recover(question)\n\n    print("[router] routing to standard reasoning agent")\n    return answer_with_reflection(question)\n\n\nif __name__ == "__main__":\n    print("Compass is ready. Type \'exit\' to quit.\\n")\n    while True:\n        user_input = input("You: ").strip()\n        if user_input.lower() in ("exit", "quit"):\n            break\n        if not user_input:\n            continue\n\n        answer = route_and_answer(user_input)\n        print(f"\\nCompass: {answer}\\n")\n\n        if should_remember(user_input):\n            save_memory(user_input)',
      },
    ],
    placement: "Add looks_multi_part() and route_and_answer() to main.py, and replace your existing REPL loop with the version above so it calls route_and_answer() as the single entry point.",
    implementation:
      "route_and_answer() checks should_use_cot() FIRST (cheapest, most specific signal), then looks_multi_part() (broader, catches genuinely large tasks), and falls through to answer_with_reflection() — itself already ReAct-enabled and self-reflecting — as the sensible default for everything else. The REPL loop stays exactly as simple as Module 1's, but now every response silently benefits from FIVE modules of reasoning capability behind that one route_and_answer() call.",
    expectedResult:
      "Asking Compass a simple factual question routes to the standard agent and answers quickly. Asking a multi-step logic riddle routes to chain-of-thought with visible reasoning. Asking a genuinely multi-part request ('check the weather in two cities and recommend packing') routes to the full plan+execute+recovery pipeline, visibly printing its plan and progress.",
    connects:
      "Module 4 is complete — Compass reasons, plans, checks itself, and recovers from failures, all through one router. Module 5 shifts focus entirely to DEPLOYMENT: taking this working command-line agent and turning it into a real Streamlit web app other people can actually use.",
  },

  quiz: [
    { id: 'c24q1', kind: 'concept', prompt: 'What is the purpose of route_and_answer()?', options: ['To generate plans only', 'To dispatch each request to the lightest reasoning pattern that will genuinely serve it well', 'To replace all previous patterns entirely', 'To handle only errors'], answerIndex: 1, explanation: 'The router avoids running every question through the heaviest possible pipeline.' },
    { id: 'c24q2', kind: 'application', prompt: 'Why check should_use_cot() before looks_multi_part() in the router?', options: ['No particular order matters', 'It’s the cheapest, most specific signal, checked first before broader/more expensive routing', 'Order is random', 'looks_multi_part() must always run first'], answerIndex: 1, explanation: 'Checking cheap, specific signals before broader ones is a sensible ordering.' },
    { id: 'c24q3', kind: 'code_reading', prompt: 'What does looks_multi_part() count to decide if a question needs decomposition?', options: ['Only word count', 'Coordinating conjunctions (" and ", " then ") and question marks', 'API response time', 'Number of tool calls'], answerIndex: 1, explanation: 'These are the two cheap textual signals used by the heuristic.' },
    { id: 'c24q4', kind: 'debug', prompt: 'A genuinely simple question gets routed to plan_execute_and_recover() unnecessarily. What’s the likely cause?', options: ['A crash', 'The question happened to contain 2+ "and"s or "?"s despite being conceptually simple — a heuristic false positive', 'The API is broken', 'should_use_cot() is broken'], answerIndex: 1, explanation: 'The heuristic is approximate by design; occasional false positives are an accepted tradeoff for being cheap and fast.' },
    { id: 'c24q5', kind: 'concept', prompt: 'Which five capabilities did Module 4 build across Lessons 19-23?', options: ['Only memory features', 'ReAct, Chain-of-Thought, Plan+Execute, self-reflection, error recovery', 'Only deployment features', 'Only tool-calling features'], answerIndex: 1, explanation: 'These are the five distinct reasoning patterns covered across the module.' },
    { id: 'c24q6', kind: 'application', prompt: 'Why is answer_with_reflection() (not raw run_agent_loop()) used as the router’s default fallback?', options: ['No reason', 'It already includes ReAct reasoning AND a self-reflection quality check, making it a solid general-purpose default', 'It’s the cheapest option', 'It bypasses tools'], answerIndex: 1, explanation: 'answer_with_reflection() builds on run_agent_loop and adds the critique/revise step, making it a strong default.' },
    { id: 'c24q7', kind: 'output', prompt: 'What prints when the router routes a question to chain-of-thought?', options: ['Nothing', '"[router] routing to chain-of-thought reasoning"', 'An error', 'The full plan'], answerIndex: 1, explanation: 'Each routing branch prints a visible label, consistent with the course’s transparency principle.' },
    { id: 'c24q8', kind: 'project', prompt: 'In the final REPL loop, when is should_remember()/save_memory() called?', options: ['Never', 'After route_and_answer() returns, checking the user’s input for memory-worthy content', 'Before route_and_answer()', 'Only for CoT-routed questions'], answerIndex: 1, explanation: 'Memory saving happens after each turn, independent of which reasoning pattern handled the question.' },
    { id: 'c24q9', kind: 'concept', prompt: 'Why is a perfect classifier NOT required for looks_multi_part()?', options: ['Perfection is required', 'A cheap, mostly-right heuristic is a reasonable tradeoff versus an expensive dedicated classification call for every request', 'It has no effect on behavior', 'The API enforces this'], answerIndex: 1, explanation: 'The router optimizes for being fast and mostly-correct rather than perfect and expensive.' },
    { id: 'c24q10', kind: 'concept', prompt: 'What is Module 5’s focus?', options: ['More reasoning patterns', 'Deployment — turning the working CLI agent into a real Streamlit web app', 'Removing memory', 'Adding more tools'], answerIndex: 1, explanation: 'Module 5 shifts from capability-building to shipping Compass as an actual deployed app.' },
  ],

  homework: {
    task: "Add a --verbose flag (via sys.argv) that, when passed, prints which router branch was chosen for EVERY question during a session, plus a running tally at exit (counts per branch).",
    requirements: [
      "Check sys.argv for '--verbose' at startup.",
      "Track a dict of branch -> count, incrementing it inside route_and_answer() (or by having it return which branch it used).",
      "Print the tally when the REPL loop exits.",
    ],
    expectedOutcome: "Running `python main.py --verbose` shows a routing summary (e.g. 'cot: 2, plan_execute: 1, standard: 4') when you exit the session.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 23,
      hint: "Lesson 23 asked you to print a per-plan failure summary: succeeded, succeeded-after-retry, and failed counts.",
      steps: [
        "Track three counters inside execute_plan_with_recovery(): first_try, after_retry, failed.",
        "Increment the right one at each stage of the retry logic.",
        "Print a one-line summary after the loop finishes.",
      ],
    },
  },
};
