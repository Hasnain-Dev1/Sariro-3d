import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 28 — Capstone Build Sprint
 * Module 5 (Deploy + Capstone) · Lesson 28 of 30
 */
export const lesson28: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 3,
  globalNumber: 28,
  name: 'Capstone build sprint',
  title: 'Capstone Build Sprint — Polishing Compass End to End',
  subtitle: "A full review pass across every capability Compass has gained across all 30 lessons.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the professional practice of a pre-launch review for an AI agent specifically — testing tool safety, cost behaviour, memory isolation, and failure handling together, not just individually.",
    sections: [
      {
        heading: 'Why a dedicated review matters, especially for an agent',
        body:
          "Across 27 lessons, Compass gained tools, memory, planning, and a web interface — each tested individually as it was built. An AGENT specifically benefits from an integrated review because its capabilities INTERACT: a tool call inside a planned step, inside a session with recalled memory, is a genuinely different code path than any single lesson tested in isolation.",
      },
      {
        heading: 'Agent-specific review areas',
        body:
          "Beyond typical web-app checks, an agent needs: tool safety re-verification (try an unusual/adversarial input against each tool), cost sanity-check (does a single complex planned task cost a reasonable amount of tokens?), memory isolation (do two simultaneous sessions genuinely stay separate?), and graceful failure at EVERY layer (network, tool, plan step, reflection).",
      },
      {
        heading: 'A structured review checklist',
        body:
          "Work through Compass systematically: (1) Tool safety — feed each tool a deliberately weird input, confirm it's rejected safely. (2) Memory — two browser sessions, confirm isolation. (3) Planning — a genuinely complex multi-part task, confirm it plans, executes, reflects, and handles a simulated step failure. (4) Cost — check /api/stats after a few varied interactions, confirm token usage looks reasonable. (5) UI — the chat interface works cleanly on mobile and desktop.",
      },
      {
        heading: 'Testing failure deliberately, one more time',
        body:
          "As in earlier reliability lessons: don't just test the happy path. Temporarily use an invalid API key, disconnect the network mid-request, or force a tool to throw — confirm Compass fails CLEANLY at every one of these, exactly as each individual lesson intended, but now verified as a WHOLE system.",
      },
      {
        heading: 'What “done” looks like for a capstone agent',
        body:
          "Not 'never fails' — REAL agents fail sometimes; that's expected. 'Done' means: fails clearly, recovers where possible, and never leaves the user confused or the system silently broken. That's the actual bar this whole course has been building toward.",
      },
    ],
    keyTerms: [
      { term: 'Integration review', definition: "Testing how multiple capabilities work TOGETHER, not just each one individually." },
      { term: 'Adversarial input', definition: "A deliberately unusual or malformed input used to test a system's robustness." },
      { term: 'Memory isolation testing', definition: "Verifying that separate user sessions genuinely don't leak or share data." },
    ],
    commonMistakes: [
      "Only re-testing each capability in isolation, missing how they interact when combined (tool call inside a planned step inside a memory-aware session).",
      "Skipping a genuine adversarial input test on tools, assuming Lesson 11's validation is automatically still sufficient.",
      "Not testing memory isolation with TWO actual separate sessions, just assuming the Map-based design works.",
      "Treating 'zero failures ever' as the bar, instead of 'fails clearly and recovers gracefully'.",
      "Skipping a genuine cost sanity-check, only discovering unexpectedly high usage after real users hit it.",
    ],
    takeaways: [
      "An agent's capabilities interact — review them together, not just individually.",
      "Re-verify tool safety with genuinely adversarial input, not just the original test cases.",
      "Test memory isolation with two REAL separate sessions.",
      "Check token/cost behaviour on a real complex task before launch.",
      "'Done' means failing clearly and recovering gracefully — not never failing at all.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'An adversarial tool-input test',
    objective:
      "Practise deliberately probing a tool with unusual input, the exact skill needed for the capstone review's tool-safety check.",
    instructions: [
      "Take your hardened runCalculator from Lesson 11.",
      "Try at least 5 deliberately weird inputs: empty string, extremely long string, non-arithmetic text, code-injection attempt, valid-looking but malformed expression.",
      "Confirm EVERY one is rejected safely, with no crash and no unexpected execution.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'adversarial-test.ts',
        code:
          "function runCalculator(expression: string): string {\n  if (typeof expression !== 'string' || expression.length > 200) {\n    return 'Error: invalid or too-large expression.';\n  }\n  const isSafe = /^[0-9+\\-*/().\\s]+$/.test(expression);\n  if (!isSafe) return 'Error: expression contains disallowed characters.';\n  try {\n    return String(Function(`\"use strict\"; return (${expression})`)());\n  } catch {\n    return 'Error: could not evaluate that expression.';\n  }\n}\n\nconst adversarialInputs = [\n  '',\n  '1'.repeat(500),\n  'DROP TABLE users',\n  '(() => { throw new Error(\"pwned\") })()',\n  '((((1+2)',   // malformed — unbalanced parens\n];\n\nfor (const input of adversarialInputs) {\n  console.log(JSON.stringify(input.slice(0, 30)), '->', runCalculator(input));\n}",
      },
    ],
    explanation:
      "Each input targets a DIFFERENT weakness: an empty string tests the basic type/size guard; a 500-character string tests the length limit; 'DROP TABLE users' and the self-invoking function test the allow-list's rejection of anything non-arithmetic; the unbalanced parentheses test that even VALID-CHARACTER input can still fail safely inside the try/catch if it's not actually valid syntax. Running all five confirms the hardened calculator from Lesson 11 handles every single one with a clean error string — no crash, no unexpected code execution, no hang — exactly the systematic adversarial testing a real capstone review requires.",
    expectedOutput:
      "Every input returns a clear 'Error: ...' string — none crash the script, none execute unintended code, none hang.",
    learned: [
      "How to systematically construct adversarial test cases.",
      "How to verify multiple DIFFERENT failure modes of the same function.",
      "Why re-testing safety (not just trusting it was done once) matters before launch.",
      "The exact skill needed for the capstone's tool-safety review step.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "A full, systematic capstone review across Compass's entire deployed system — tool safety, memory isolation, planning resilience, cost, and UI — with fixes applied for anything found.",
    why:
      "This is the pre-launch milestone: confirming Compass genuinely holds together as ONE coherent, resilient product, not just a collection of individually-tested lessons.",
    fileLocation: "Across the whole compass-web/ project — whichever files the review surfaces issues in",
    code: [
      {
        language: 'text',
        filename: 'Capstone review checklist',
        code:
          "TOOL SAFETY\n[ ] Feed each tool (calculator, word count, search) at least 2 adversarial inputs\n[ ] Confirm every one fails safely with a clear error, no crash\n\nMEMORY ISOLATION\n[ ] Open Compass in two different browser sessions (e.g. one incognito)\n[ ] Have distinct conversations in each; confirm zero cross-contamination\n[ ] Restart the server; confirm long-term (file/db) memory survives, session memory correctly resets\n\nPLANNING RESILIENCE\n[ ] Ask a genuinely complex, multi-part question\n[ ] Confirm it plans, executes each step, reflects, and returns one coherent answer\n[ ] Temporarily break one tool to simulate a step failure; confirm the plan continues and the final answer honestly acknowledges the gap\n\nCOST SANITY CHECK\n[ ] Run a few varied interactions (simple, tool-using, planned)\n[ ] Check /api/stats — does total token usage look reasonable for what was asked?\n\nRESILIENCE\n[ ] Temporarily use an invalid API key; confirm a clean error, not a crash\n[ ] Disconnect network mid-request; confirm the UI recovers with a clear message\n\nUI\n[ ] Chat interface works cleanly on both mobile and desktop widths\n[ ] Loading/disabled states behave correctly during a request",
      },
    ],
    placement:
      "Work through the checklist systematically against your ACTUAL deployed Compass (not just localhost — some behaviors, like true memory isolation across restarts, only show fully in production). Fix each issue you find directly in the relevant file, redeploy, and re-verify.",
    implementation:
      "This lesson's real work IS the review itself — there's no single fixed code block, since every project surfaces different issues. Approach it the same disciplined way as any capstone review: find, understand why, fix minimally, re-test. A common real finding at this stage: a tool's error message leaking slightly too much internal detail, or a memory isolation edge case around session-cookie expiry — exactly the kind of integration-level issue that only surfaces when testing the WHOLE system together, which is the entire point of this lesson.",
    expectedResult:
      "A Compass deployment that holds up under deliberate adversarial testing, correctly isolates every user's memory, plans and recovers gracefully under a simulated failure, shows reasonable cost behaviour, and presents a clean UI on any device — genuinely ready for real users.",
    connects:
      "Compass is now fully reviewed and hardened. Lessons 29-30 are the final steps: actually launching it publicly with a real demo, and writing the portfolio case study documenting everything built across this entire course.",
  },

  quiz: [
    { id: 'c28q1', kind: 'concept', prompt: 'Why does an agent specifically benefit from an INTEGRATION review, not just per-lesson testing?', options: ['It doesn’t, per-lesson testing is sufficient', 'Capabilities interact — a tool call inside a planned step inside a memory-aware session is a genuinely different path than any isolated test', 'Integration reviews are only for web apps', 'Agents can’t be tested in isolation at all'], answerIndex: 1, explanation: "Combined capability paths can surface issues that isolated per-feature tests never exercise." },
    { id: 'c28q2', kind: 'application', prompt: 'What does an adversarial input test check for?', options: ['Whether the happy path works', 'Whether a system handles deliberately unusual/malformed input safely, without crashing or misbehaving', 'API response speed', 'UI colour contrast'], answerIndex: 1, explanation: "Adversarial testing specifically probes robustness against unexpected or malicious-looking input." },
    { id: 'c28q3', kind: 'concept', prompt: 'How do you genuinely verify memory isolation between users?', options: ['Read the code and assume it’s correct', 'Test with TWO real separate browser sessions and confirm zero cross-contamination', 'Check that the Map data structure exists', 'Isolation doesn’t need testing if the code looks right'], answerIndex: 1, explanation: "Actual behavioral testing with real separate sessions is more reliable than code inspection alone." },
    { id: 'c28q4', kind: 'application', prompt: 'Why check /api/stats after a few varied interactions as part of this review?', options: ['It’s unrelated to launch readiness', 'To sanity-check that token/cost usage looks reasonable before real users start generating costs', 'Stats are only for debugging errors', 'It replaces the need for testing tools'], answerIndex: 1, explanation: "A pre-launch cost sanity-check helps catch unexpectedly expensive behavior before it affects real usage." },
    { id: 'c28q5', kind: 'debug', prompt: 'A capstone review finds a tool error message leaking internal file paths. What should happen?', options: ['Ignore it, it’s cosmetic', 'Fix the error message to be user-appropriate, without exposing internal implementation details', 'Remove all error messages entirely', 'It’s not a real issue'], answerIndex: 1, explanation: "Error messages should be helpful to users without leaking unnecessary internal details — a real, worth-fixing finding." },
    { id: 'c28q6', kind: 'concept', prompt: 'What does "done" mean for a capstone agent, per this lesson?', options: ['Never failing under any circumstance', 'Failing clearly and recovering gracefully, never leaving the user confused or the system silently broken', 'Having the most tools possible', 'Zero token usage'], answerIndex: 1, explanation: "The bar is graceful, clear failure handling — not the unrealistic goal of never failing at all." },
    { id: 'c28q7', kind: 'application', prompt: 'Why deliberately break a tool during the planning-resilience check?', options: ['To find a real bug in the tool itself', 'To confirm the PLAN as a whole still continues and the final answer honestly acknowledges the resulting gap (Lesson 23’s work)', 'Tools should never be tested this way', 'It has no purpose'], answerIndex: 1, explanation: "This directly verifies the error-recovery behavior built in Lesson 23 under a real simulated failure." },
    { id: 'c28q8', kind: 'output', prompt: 'What should happen if you disconnect the network mid-request during this review?', options: ['The app crashes with no message', 'The UI shows a clear error and recovers, per Module 1’s reliability work', 'Nothing happens, requests wait forever', 'The session is permanently corrupted'], answerIndex: 1, explanation: "Graceful failure handling built throughout the course should hold up under this direct test." },
    { id: 'c28q9', kind: 'project', prompt: "Why does this lesson's review checklist span TOOL SAFETY, MEMORY, PLANNING, COST, and UI together?", options: ['These are unrelated concerns that don’t need combined testing', 'A genuinely capstone-level review must confirm the WHOLE integrated system works, not just individual pieces from separate lessons', 'Only UI matters at launch time', 'It’s excessive and unnecessary'], answerIndex: 1, explanation: "Comprehensive, integrated review is exactly what distinguishes a capstone milestone from routine per-lesson testing." },
    { id: 'c28q10', kind: 'concept', prompt: 'What comes after this capstone review, in the final two lessons?', options: ['Starting a new module', 'Publicly launching Compass and writing the portfolio case study', 'Deleting the project', 'Adding more tools'], answerIndex: 1, explanation: "Lessons 29-30 are the actual launch and the written reflection/case study." },
  ],

  homework: {
    task:
      "Complete the full capstone checklist from this lesson against your OWN deployed Compass, documenting at least 3 real findings (however small) and the fix applied for each — the same disciplined approach as Momentum's capstone review, now applied to an agent.",
    requirements: [
      "Go through every section of the checklist (tool safety, memory, planning, cost, resilience, UI) on your live deployment.",
      "Document at least 3 real findings with a before/after note.",
      "Redeploy after each fix and re-verify it's actually resolved.",
    ],
    expectedOutcome:
      "A short written log of real issues found and fixed on your live Compass deployment — genuine evidence of a professional, agent-specific QA pass.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 27,
      hint: "Lesson 27 asked you to add response-time tracking, logging duration per call and an averageResponseTimeMs field in stats.",
      steps: [
        "In askCompass(), record const startTime = Date.now(); at the very beginning.",
        "Right before returning the final answer, compute const durationMs = Date.now() - startTime;.",
        "Log it via logEvent('answer_sent', { sessionId, durationMs }).",
        "In lib/logging.ts, maintain a running average: update stats.averageResponseTimeMs using a simple incremental formula each time a new duration comes in.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'lib/logging.ts',
          code:
            "export const stats = {\n  totalQuestions: 0,\n  totalTokens: 0,\n  totalErrors: 0,\n  averageResponseTimeMs: 0,\n};\n\nexport function trackResponseTime(durationMs: number) {\n  const n = stats.totalQuestions || 1;\n  stats.averageResponseTimeMs = Math.round((stats.averageResponseTimeMs * (n - 1) + durationMs) / n);\n}",
        },
      ],
    },
  },
};
