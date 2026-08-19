import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 24 — Module 4 Build: The Planning Agent
 * Module 4 (Planning + Reasoning) · Lesson 24 of 30
 */
export const lesson24: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 5,
  globalNumber: 24,
  name: 'Module 4 build — the planning agent',
  title: 'Module 4 Build — Compass, a Real Planning Agent',
  subtitle: "Wire complex-task detection into the REPL, and review Compass's complete reasoning system.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to detect when a request needs the full planning pipeline vs. a direct answer, and review everything Module 4 built.",
    sections: [
      {
        heading: 'Automatically choosing the right path',
        body:
          "Right now, the REPL always calls askCompassStreaming() (the direct path) — a user would have to somehow manually invoke askCompassWithPlan() for a complex task. A real agent should DETECT which path fits and choose automatically, the same way earlier heuristics decided on memory-saving and Chain of Thought.",
      },
      {
        heading: 'A complexity heuristic',
        body:
          "Signals a task likely needs full planning: multiple distinct verbs/requests joined by 'and', explicit multi-part phrasing ('research X, then compare Y'), or simply being unusually long. A simple heuristic: count coordinating conjunctions and request-like verbs.",
        code: {
          language: 'typescript',
          code:
            "function needsPlanning(task: string): boolean {\n  const conjunctionCount = (task.match(/\\band\\b/gi) ?? []).length;\n  const isLong = task.length > 150;\n  const hasSequenceWords = /\\bthen\\b|\\bafter that\\b|\\bfinally\\b/i.test(task);\n  return conjunctionCount >= 2 || isLong || hasSequenceWords;\n}",
        },
      },
      {
        heading: 'Wiring the choice into the REPL',
        body:
          "The REPL simply checks needsPlanning() and routes to the appropriate function — a small, clean addition that doesn't disturb any of the underlying pipeline logic already built.",
        code: {
          language: 'typescript',
          code:
            "const answer = needsPlanning(trimmed)\n  ? await askCompassWithPlan(trimmed)\n  : await askCompassStreaming(trimmed);",
        },
      },
      {
        heading: 'Reviewing Module 4',
        body:
          "In six lessons, Compass gained real reasoning depth: explicit tool-decision reasoning (ReAct, L19), step-by-step problem reasoning (Chain of Thought, L20), genuine task decomposition (Plan + Execute, L21), self-checking (Reflection, L22), and resilience to a failing step (Error Recovery, L23). This lesson (L24) makes all of it automatically accessible from the REPL, without the user needing to know which internal pipeline is running.",
      },
      {
        heading: 'What’s next for Compass',
        body:
          "Compass is now a genuinely capable, reasoning, memory-aware agent — running entirely on YOUR machine. Module 5 takes this exact agent and deploys it to the internet with a real UI, so anyone can use it, not just you in a terminal.",
      },
    ],
    keyTerms: [
      { term: 'Complexity heuristic', definition: "A rule of thumb for detecting whether a request likely needs the full planning pipeline vs. a direct answer." },
      { term: 'Routing', definition: "Automatically choosing which internal function/pipeline handles a request based on its characteristics." },
    ],
    commonMistakes: [
      "Requiring the user to manually specify which pipeline to use, instead of detecting it automatically.",
      "A complexity heuristic too aggressive, routing simple questions through the expensive full planning pipeline unnecessarily.",
      "A heuristic too conservative, missing genuinely complex requests that would benefit from planning.",
      "Not testing BOTH paths (direct and planned) after wiring in the routing logic.",
      "Forgetting streaming (Module 1) only applies to the direct path — askCompassWithPlan() doesn't stream its intermediate steps the same way.",
    ],
    takeaways: [
      "A complexity heuristic can automatically route a request to the right pipeline.",
      "Routing logic is a small, clean addition on top of already-built pipelines.",
      "Module 4 gave Compass ReAct, Chain of Thought, Plan + Execute, self-reflection, and error recovery.",
      "The REPL now transparently uses the right level of reasoning for each request.",
      "Module 5 deploys this complete agent to the web for real, wider use.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A complexity classifier test',
    objective:
      "Practise the needsPlanning() heuristic against a mix of simple and complex example requests.",
    instructions: [
      "Write needsPlanning() as shown in the concept lesson.",
      "Test it against 3 simple questions and 3 genuinely multi-part requests.",
      "Confirm the classification matches your expectations for each.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'classify-test.ts',
        code:
          "function needsPlanning(task: string): boolean {\n  const conjunctionCount = (task.match(/\\band\\b/gi) ?? []).length;\n  const isLong = task.length > 150;\n  const hasSequenceWords = /\\bthen\\b|\\bafter that\\b|\\bfinally\\b/i.test(task);\n  return conjunctionCount >= 2 || isLong || hasSequenceWords;\n}\n\nconst tests = [\n  'What is 12 times 4?',\n  'What is the capital of Japan?',\n  'Explain what a variable is.',\n  'Research three programming languages, compare their learning curves, and recommend one for a beginner.',\n  'First find the population of France, then calculate what 10% of that number is, and finally explain why that matters.',\n  'Plan a study schedule for the week and suggest three resources for learning React.',\n];\n\nfor (const t of tests) console.log(needsPlanning(t), '-', t);",
      },
    ],
    explanation:
      "The three simple questions each have zero or one 'and', are short, and have no sequence words — all correctly classify as false (direct path). The three complex requests each hit at least one trigger: multiple 'and's, explicit 'then'/'finally' sequencing, or simple length — correctly classifying as true (planning path). This confirms the heuristic draws a reasonable line between 'answerable in one shot' and 'genuinely needs decomposition', using only cheap, local string checks — no extra API call required just to DECIDE which pipeline to use.",
    expectedOutput:
      "false, false, false for the three simple questions; true, true, true for the three complex ones — a clean split matching intuitive expectations.",
    learned: [
      "How to build a lightweight complexity-detection heuristic.",
      "How to validate a heuristic against a deliberately mixed test set.",
      "Why routing decisions should be cheap (no extra API call) where possible.",
      "The final piece connecting Module 4's pipelines to real user input.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's REPL automatically routes every question to the right pipeline — direct streaming for simple questions, full Plan + Execute + Reflection for complex ones — the Module 4 milestone.",
    why:
      "This is what makes Module 4's powerful capabilities actually USABLE day to day: the user just talks to Compass naturally, and it quietly picks the right level of reasoning for each request.",
    fileLocation: "compass-agent/index.ts (add needsPlanning + update the REPL loop)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near other heuristics)',
        code:
          "function needsPlanning(task: string): boolean {\n  const conjunctionCount = (task.match(/\\band\\b/gi) ?? []).length;\n  const isLong = task.length > 150;\n  const hasSequenceWords = /\\bthen\\b|\\bafter that\\b|\\bfinally\\b/i.test(task);\n  return conjunctionCount >= 2 || isLong || hasSequenceWords;\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (update the REPL loop’s question-handling branch)',
        code:
          "if (needsPlanning(trimmed)) {\n  console.log('[routing] this looks like a multi-part task — planning it out');\n  const answer = await askCompassWithPlan(trimmed);\n  console.log(`Compass: ${answer}\\n`);\n} else {\n  process.stdout.write('Compass: ');\n  await askCompassStreaming(trimmed);\n  console.log();\n}",
      },
    ],
    placement:
      "Add needsPlanning() near your other heuristic functions (shouldRemember, needsChainOfThought). In the REPL loop, replace the single 'always call askCompassStreaming' branch with the if/else routing shown — everything else in the loop (exit, help, forget, memories commands) stays exactly as built in earlier lessons.",
    implementation:
      "The routing check happens BEFORE any API call — needsPlanning() is pure local string analysis, so choosing a path costs nothing extra. Complex requests get logged as routed to planning, then call askCompassWithPlan() (which internally uses generatePlan, executePlan with per-step recovery, synthesizeResults, and the reflect/revise loop — everything from Lessons 21-23) and print the final answer as one block, since that pipeline doesn't stream intermediate text the way the direct path does. Simple requests still get the full Module 1 streaming experience, completely unaffected by any of Module 4's additions.",
    expectedResult:
      "Asking Compass 'What is 15% of 200?' streams a quick direct answer as before. Asking 'Research three note-taking apps, compare their features, and recommend one for students' now logs '[routing] this looks like a multi-part task...', works through a visible plan with progress logging, and returns one coherent, synthesized (and self-reviewed) recommendation.",
    connects:
      "Module 4 is complete: Compass reasons explicitly, plans complex tasks, checks its own work, and recovers from step failures — all automatically routed based on what each request actually needs. Module 5 (Deploy + Capstone) takes this complete, capable agent and puts it on the real internet.",
  },

  quiz: [
    { id: 'c24q1', kind: 'concept', prompt: 'What does needsPlanning() decide?', options: ['Whether to save a memory', 'Whether a request should use the direct path or the full Plan + Execute pipeline', 'Whether to use a tool', 'Whether to retry a failed call'], answerIndex: 1, explanation: "This heuristic routes between the simple and complex-task pipelines." },
    { id: 'c24q2', kind: 'application', prompt: 'Why is needsPlanning() implemented as local string checks rather than an API call?', options: ['API calls are impossible here', 'It keeps the routing decision itself free and instant, before any real work begins', 'It’s required by TypeScript', 'It disables planning entirely'], answerIndex: 1, explanation: "A cheap, local heuristic avoids spending an API call just to decide which pipeline to use." },
    { id: 'c24q3', kind: 'debug', prompt: 'A genuinely complex, multi-part request gets answered directly instead of being planned. Likely cause?', options: ['askCompassWithPlan is broken', 'The request’s phrasing didn’t trigger any of needsPlanning’s heuristics (conjunctions, length, sequence words)', 'Planning is disabled by default', 'The API rejected the request'], answerIndex: 1, explanation: "A heuristic can miss cases that don't match its specific trigger conditions — a real, acknowledged limitation." },
    { id: 'c24q4', kind: 'concept', prompt: 'Why does the routed "planning" branch print the final answer as one block instead of streaming it?', options: ['A bug that should be fixed', 'The Plan + Execute pipeline (multiple internal calls, synthesis, reflection) doesn’t stream its intermediate text the same way a single direct call does', 'Streaming is disabled entirely in Module 4', 'It’s slower on purpose'], answerIndex: 1, explanation: "The multi-step pipeline's final output comes from a synthesis call, which this lesson doesn't wire into the streaming display." },
    { id: 'c24q5', kind: 'application', prompt: 'What FIVE capabilities did Module 4 add to Compass overall?', options: ['Streaming, tools, memory, deployment, and evals', 'ReAct reasoning, Chain of Thought, Plan + Execute, self-reflection, and error recovery', 'Only planning, nothing else', 'A user interface and a database'], answerIndex: 1, explanation: "These five map directly to Lessons 19 through 23." },
    { id: 'c24q6', kind: 'code_reading', prompt: 'What does `(task.match(/\\band\\b/gi) ?? []).length` count?', options: ['The number of words in the task', 'The number of times the word "and" appears in the task', 'The number of tools available', 'The task’s character length'], answerIndex: 1, explanation: "This counts occurrences of the word 'and', used as one signal of multi-part phrasing." },
    { id: 'c24q7', kind: 'output', prompt: 'Given the mini-project’s test set, what should "What is the capital of Japan?" classify as?', options: ['Needs planning (true)', 'Direct path (false)', 'An error', 'Both simultaneously'], answerIndex: 1, explanation: "A short, single-part factual question shouldn't trigger any of the complexity heuristics." },
    { id: 'c24q8', kind: 'application', prompt: 'Why keep the direct path (askCompassStreaming) fully unaffected by Module 4’s additions?', options: ['It shouldn’t be unaffected', 'Simple questions should stay fast, cheap, and streaming — Module 4’s overhead is reserved for genuinely complex requests', 'The direct path no longer works', 'They must always behave identically'], answerIndex: 1, explanation: "Preserving the efficient direct path for simple questions is a deliberate design choice, not an oversight." },
    { id: 'c24q9', kind: 'project', prompt: "Why does this lesson's routing logic require NO changes to generatePlan, executePlan, synthesizeResults, or reflect?", options: ['It secretly requires rewriting all of them', 'Routing only decides WHICH already-built pipeline to call — the pipelines themselves are untouched', 'Those functions were deleted', 'Routing and planning are unrelated'], answerIndex: 1, explanation: "This lesson is purely additive glue code connecting existing, already-tested pipelines to real user input." },
    { id: 'c24q10', kind: 'concept', prompt: 'What is Module 5 about to do with this complete agent?', options: ['Rebuild it in a different language', 'Deploy it to the internet with a real UI, so anyone can use it', 'Delete the planning pipeline', 'Add more tools only'], answerIndex: 1, explanation: "Module 5 (Deploy + Capstone) is the final module, taking Compass from a local terminal tool to a live, public agent." },
  ],

  homework: {
    task:
      "Add a manual override: if a user's message starts with '/plan ', strip that prefix and force the planning pipeline regardless of what needsPlanning() would decide — useful for a simple question the user WANTS broken down anyway.",
    requirements: [
      "Check if the trimmed input starts with '/plan ' before the automatic needsPlanning() check.",
      "If so, strip the prefix and call askCompassWithPlan() directly on the remaining text.",
      "Confirm a normally-simple question forced with '/plan' now goes through the full pipeline.",
    ],
    expectedOutcome:
      "Typing '/plan What is 12 times 4?' forces the full planning pipeline even though the automatic heuristic would normally route it directly — giving the user manual control when they want it.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 23,
      hint: "Lesson 23 asked you to add a retry (up to 2 attempts) for a failing plan step before recording it as failed.",
      steps: [
        "Inside executePlan()'s loop, wrap each step's execution in its own small retry loop (e.g. for (let attempt = 0; attempt < 2; attempt++)).",
        "On success, push the result and break out of the retry loop immediately.",
        "Only push the '[This step could not be completed]' placeholder after BOTH attempts have failed.",
        "Log which attempt succeeded, or that both failed, for visibility.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside executePlan, per step)',
          code:
            "let succeeded = false;\nfor (let attempt = 0; attempt < 2 && !succeeded; attempt++) {\n  try {\n    const result = await askCompass(step);\n    results.push(result);\n    succeeded = true;\n    console.log(`[plan] step ${i + 1} succeeded on attempt ${attempt + 1}`);\n  } catch (err) {\n    console.warn(`[plan] step ${i + 1} attempt ${attempt + 1} failed:`, err);\n  }\n}\nif (!succeeded) results.push(`[This step could not be completed: \"${step}\"]`);",
        },
      ],
    },
  },
};
