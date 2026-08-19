import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 22 — Self-Reflection
 * Module 4 (Planning + Reasoning) · Lesson 22 of 30
 */
export const lesson22: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 3,
  globalNumber: 22,
  name: 'Self-reflection',
  title: 'Self-Reflection — Compass Checks Its Own Work',
  subtitle: "Add a review step where Compass critiques its own synthesized answer before presenting it.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the self-reflection pattern — having the model critique its own output — and how to act on that critique to improve reliability.",
    sections: [
      {
        heading: 'Why an agent should check its own work',
        body:
          "Even with planning and reasoning, a synthesized answer can miss something — an unaddressed part of the original task, an internal inconsistency between steps, or a claim that doesn't actually follow from the step results. Self-reflection means asking the model to REVIEW its own answer critically before it's shown to the user.",
      },
      {
        heading: 'A reflection call',
        body:
          "Similar to the planning call, this is a SEPARATE, focused API call: given the original task and the proposed answer, ask specifically whether it fully addresses the task and is internally consistent.",
        code: {
          language: 'typescript',
          code:
            "async function reflect(task: string, answer: string): Promise<{ ok: boolean; issue?: string }> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200,\n    system: 'Critically review whether this answer fully and correctly addresses the task. Respond with either \"OK\" or a brief description of the specific issue.',\n    messages: [{ role: 'user', content: `Task: ${task}\\n\\nProposed answer: ${answer}` }],\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  const ok = text.trim().toUpperCase().startsWith('OK');\n  return ok ? { ok: true } : { ok: false, issue: text };\n}",
        },
      },
      {
        heading: 'Acting on a failed reflection',
        body:
          "If reflection finds an issue, don't just discard it — feed the CRITIQUE back into ONE more generation attempt, explicitly asking the model to fix that specific problem. This closes the loop: generate, critique, revise.",
        code: {
          language: 'typescript',
          code:
            "async function reviseAnswer(task: string, answer: string, issue: string): Promise<string> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 500,\n    system: 'Revise the answer to fix the specific issue described, while keeping everything else that was already correct.',\n    messages: [{ role: 'user', content: `Task: ${task}\\n\\nOriginal answer: ${answer}\\n\\nIssue to fix: ${issue}` }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : answer;\n}",
        },
      },
      {
        heading: 'Don’t loop forever',
        body:
          "Just like the tool-use turn cap from Module 2, self-reflection needs a LIMIT — try at most one or two revision rounds, then present the best available answer rather than looping indefinitely chasing a 'perfect' response that may never fully satisfy an automated critique.",
      },
      {
        heading: 'Self-reflection has a real cost',
        body:
          "Every reflection (and potential revision) is another API call — genuinely worth it for complex, high-stakes answers (Plan + Execute results), overkill for a simple factual question. This is the same cost/benefit judgment call as Plan + Execute itself.",
      },
    ],
    keyTerms: [
      { term: 'Self-reflection', definition: "Having the model critique its OWN output before presenting it to the user." },
      { term: 'Reflection call', definition: "A focused API call asking whether a proposed answer is correct/complete." },
      { term: 'Revision', definition: "Regenerating an answer to specifically address an issue found during reflection." },
    ],
    commonMistakes: [
      "Reflecting without ever ACTING on a found issue — critique alone doesn't improve anything without a revision step.",
      "No cap on revision rounds, risking an unbounded loop chasing perfection.",
      "Applying self-reflection to every simple question, adding unnecessary cost.",
      "A reflection prompt too vague ('is this good?') producing unhelpful, non-actionable feedback.",
      "Discarding a good answer because an overly strict reflection call finds a trivial, non-issue.",
    ],
    takeaways: [
      "Self-reflection has the model critique its own proposed answer before it's shown to the user.",
      "A failed reflection should feed into a REVISION call, not just be logged and ignored.",
      "Cap revision rounds — don't loop indefinitely chasing perfection.",
      "Reserve self-reflection for complex, high-stakes answers where the extra cost is worth it.",
      "A specific, actionable reflection prompt produces more useful critiques than a vague one.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Catching a deliberately incomplete answer',
    objective:
      "See self-reflection catch a real issue by deliberately testing it against an answer that misses part of the task.",
    instructions: [
      "Write a task with TWO distinct parts (e.g. 'explain X AND give an example').",
      "Manually create an answer that only addresses ONE part.",
      "Run it through reflect() and confirm it correctly flags the missing part.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'reflect-test.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nasync function reflect(task: string, answer: string) {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200,\n    system: 'Critically review whether this answer fully and correctly addresses the task. Respond with either \"OK\" or a brief description of the specific issue.',\n    messages: [{ role: 'user', content: `Task: ${task}\\n\\nProposed answer: ${answer}` }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}\n\nasync function main() {\n  const task = 'Explain what a variable is in programming, AND give one code example.';\n  const incompleteAnswer = 'A variable is a named container for a value.';   // missing the example!\n\n  console.log(await reflect(task, incompleteAnswer));\n}\n\nmain();",
      },
    ],
    explanation:
      "The task has TWO explicit requirements joined by 'AND' — an explanation and an example. incompleteAnswer deliberately satisfies only the first half, simulating exactly the kind of gap self-reflection is designed to catch. The reflection call reads both the ORIGINAL task and the proposed answer, and because its system prompt specifically asks whether the answer FULLY addresses the task, it should identify the missing code example as a concrete, specific issue rather than vaguely approving an incomplete response.",
    expectedOutput:
      "Something like: 'The answer explains what a variable is but does not include a code example as requested.' — a specific, actionable critique, not just a pass/fail.",
    learned: [
      "How to construct a reflection call that critiques against the ORIGINAL task.",
      "How to deliberately test reflection with a KNOWN-incomplete answer.",
      "What a genuinely useful, specific critique looks like vs. a vague one.",
      "The first half of the full reflect-then-revise pattern.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's Plan + Execute pipeline now includes a self-reflection and (if needed) revision step before presenting its final synthesized answer.",
    why:
      "This adds a genuine safety net to Compass's most complex capability — catching an incomplete or inconsistent synthesized answer before the user ever sees it, not after.",
    fileLocation: "compass-agent/index.ts (add reflect + reviseAnswer, wire into askCompassWithPlan)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near synthesizeResults)',
        code:
          "async function reflect(task: string, answer: string): Promise<{ ok: boolean; issue?: string }> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200,\n    system: 'Critically review whether this answer fully and correctly addresses the task. Respond with either \"OK\" or a brief description of the specific issue.',\n    messages: [{ role: 'user', content: `Task: ${task}\\n\\nProposed answer: ${answer}` }],\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  const ok = text.trim().toUpperCase().startsWith('OK');\n  return ok ? { ok: true } : { ok: false, issue: text };\n}\n\nasync function reviseAnswer(task: string, answer: string, issue: string): Promise<string> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 500,\n    system: 'Revise the answer to fix the specific issue described, while keeping everything else that was already correct.',\n    messages: [{ role: 'user', content: `Task: ${task}\\n\\nOriginal answer: ${answer}\\n\\nIssue to fix: ${issue}` }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : answer;\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (update askCompassWithPlan to reflect + revise)',
        code:
          "async function askCompassWithPlan(task: string): Promise<string> {\n  const plan = await generatePlan(task);\n  if (plan.length === 0) return askCompass(task);\n\n  console.log(`[plan] generated ${plan.length} steps`);\n  const results = await executePlan(plan);\n  let finalAnswer = await synthesizeResults(task, results);\n\n  const MAX_REVISIONS = 2;\n  for (let round = 0; round < MAX_REVISIONS; round++) {\n    const review = await reflect(task, finalAnswer);\n    if (review.ok) {\n      console.log('[reflection] answer passed review');\n      break;\n    }\n    console.log(`[reflection] issue found: ${review.issue} — revising...`);\n    finalAnswer = await reviseAnswer(task, finalAnswer, review.issue!);\n  }\n\n  return finalAnswer;\n}",
      },
    ],
    placement:
      "Add reflect() and reviseAnswer() near synthesizeResults(). Update askCompassWithPlan() so that AFTER synthesizeResults() produces a first answer, it enters a bounded reflect-then-revise loop (MAX_REVISIONS = 2) before finally returning.",
    implementation:
      "The revision loop calls reflect() first; if the review comes back ok, it breaks immediately — most answers won't need any revision, and this keeps the common case cheap. If an issue is found, reviseAnswer() regenerates the answer targeting SPECIFICALLY that issue (not a blind full rewrite), and the loop reflects AGAIN on the revised answer, up to MAX_REVISIONS times total — the same bounded-loop safety principle as Module 2's tool-use turn cap. After the cap is reached (or an early pass), whatever finalAnswer currently holds is returned — always something usable, never an infinite wait for perfection.",
    expectedResult:
      "A complex task's answer now sometimes logs '[reflection] issue found: ... — revising...' followed by an improved final answer — or, most of the time, '[reflection] answer passed review' when the first synthesis was already solid.",
    connects:
      "Compass's Plan + Execute pipeline is now genuinely self-checking. Lesson 23 (Error Recovery) handles a different failure mode: what happens when a STEP ITSELF fails during execution (not just the final answer being imperfect) — and how Compass should adapt rather than simply crashing the whole plan.",
  },

  quiz: [
    { id: 'c22q1', kind: 'concept', prompt: 'What does self-reflection add to Compass’s pipeline?', options: ['Faster responses', 'A review step where the model critiques its own answer before presenting it', 'A new tool', 'Long-term memory'], answerIndex: 1, explanation: "Self-reflection is specifically about the model reviewing its own prior output." },
    { id: 'c22q2', kind: 'application', prompt: 'Why isn’t reflection alone (without revision) useful on its own?', options: ['It IS fully useful alone', 'A critique that’s never acted on doesn’t actually improve the final answer shown to the user', 'Reflection always finds issues', 'Revision is unrelated to reflection'], answerIndex: 1, explanation: "The value comes from ACTING on the critique via a revision step, not just generating one." },
    { id: 'c22q3', kind: 'concept', prompt: 'Why cap the number of revision rounds (MAX_REVISIONS)?', options: ['No reason, it should loop until perfect', 'To prevent an unbounded loop chasing an answer that may never fully satisfy an automated critique', 'It’s required by the API', 'It reduces token usage to zero'], answerIndex: 1, explanation: "A bounded loop guarantees termination, mirroring the same principle as the tool-use turn cap." },
    { id: 'c22q4', kind: 'code_reading', prompt: 'What does `text.trim().toUpperCase().startsWith(\'OK\')` check?', options: ['Whether the answer is long enough', 'Whether the reflection response indicates approval (starts with "OK")', 'Whether the API call failed', 'Whether a tool was used'], answerIndex: 1, explanation: "This checks the reflection model's response for the specific 'OK' approval signal per the prompt's instructions." },
    { id: 'c22q5', kind: 'application', prompt: 'Why does reviseAnswer() receive the SPECIFIC issue text, not just a generic "fix it" instruction?', options: ['No real reason', 'A specific, actionable issue lets the revision target exactly what’s wrong, rather than blindly rewriting everything', 'Generic instructions work better', 'It’s required syntax'], answerIndex: 1, explanation: "Passing the specific critique focuses the revision on the actual problem, preserving what was already correct." },
    { id: 'c22q6', kind: 'debug', prompt: 'A reflection call vaguely says "could be better" with no specifics. What’s the likely cause?', options: ['The model is broken', 'The reflection system prompt wasn’t specific enough about WHAT to check for', 'Reflection always produces vague output', 'It’s an API bug'], answerIndex: 1, explanation: "A more specific reflection prompt (checking completeness/correctness explicitly) tends to produce more actionable critiques." },
    { id: 'c22q7', kind: 'output', prompt: 'In the mini-project, what SPECIFIC issue should reflect() likely identify?', options: ['A formatting problem', 'The missing code example, since the task explicitly asked for one', 'A tool-use error', 'Nothing, the answer should pass'], answerIndex: 1, explanation: "The deliberately incomplete answer omits a task requirement, which a good reflection call should catch." },
    { id: 'c22q8', kind: 'application', prompt: 'Why does the revision loop break immediately when review.ok is true?', options: ['A bug', 'No need to spend extra calls revising an answer that already passed review', 'It’s required to always run all rounds', 'Ok answers still need one more revision'], answerIndex: 1, explanation: "Breaking early keeps the common (already-good) case efficient, avoiding unnecessary extra calls." },
    { id: 'c22q9', kind: 'project', prompt: "Why is self-reflection applied to askCompassWithPlan()'s output specifically, not every single askCompass() call?", options: ['It should apply everywhere equally', 'Complex, synthesized answers are more likely to have gaps worth checking; simple direct answers usually don’t justify the extra cost', 'Reflection only works with plans', 'It’s a technical limitation'], answerIndex: 1, explanation: "The cost/benefit tradeoff favors applying reflection where complexity and stakes are highest." },
    { id: 'c22q10', kind: 'concept', prompt: 'What different failure mode does Lesson 23 (Error Recovery) address, compared to self-reflection?', options: ['The exact same thing as reflection', 'A STEP failing during execution (e.g. a tool error), not just the final synthesized answer being imperfect', 'Deployment failures', 'Memory failures only'], answerIndex: 1, explanation: "Error recovery deals with failures DURING plan execution, a distinct concern from reviewing the final output." },
  ],

  homework: {
    task:
      "Add a revisionCount tracker that logs a final summary after askCompassWithPlan() completes, e.g. '[reflection] completed after 1 revision(s)' or '[reflection] no revisions needed', so you can see how often revision was actually necessary across different tasks.",
    requirements: [
      "Track how many revision rounds actually occurred (not just the cap, the ACTUAL count used).",
      "Log a clear summary line after the reflection loop ends, before returning finalAnswer.",
      "Test with a simple task (expect 0 revisions) and a deliberately tricky/underspecified one (may need 1+).",
    ],
    expectedOutcome:
      "Every call to askCompassWithPlan() ends with a clear log of exactly how many revisions were actually used, giving visibility into how often the safety net is doing real work.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 21,
      hint: "Lesson 21 asked you to add a step counter and elapsed-time log to executePlan(), showing progress and total time for a multi-step plan.",
      steps: [
        "Before the loop in executePlan(), record const startTime = Date.now();",
        "After each step completes, log `[plan] completed step ${i + 1}/${plan.length}` (using a regular for loop with an index, or a manual counter).",
        "After the loop, compute const elapsed = ((Date.now() - startTime) / 1000).toFixed(1); and log `[plan] completed ${plan.length}/${plan.length} steps in ${elapsed}s`.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "async function executePlan(plan: string[]): Promise<string[]> {\n  const results: string[] = [];\n  const startTime = Date.now();\n  for (let i = 0; i < plan.length; i++) {\n    console.log(`[plan] working on: ${plan[i]}`);\n    results.push(await askCompass(plan[i]));\n    console.log(`[plan] completed step ${i + 1}/${plan.length}`);\n  }\n  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);\n  console.log(`[plan] completed ${plan.length}/${plan.length} steps in ${elapsed}s`);\n  return results;\n}",
        },
      ],
    },
  },
};
