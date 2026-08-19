import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 23 — Error Recovery in Plans
 * Module 4 (Planning + Reasoning) · Lesson 23 of 30
 */
export const lesson23: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 4,
  globalNumber: 23,
  name: 'Error recovery',
  title: 'Error Recovery — When a Step Fails Mid-Plan',
  subtitle: "Make Compass adapt when one step of a plan fails, instead of letting the whole task collapse.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to handle a failed step within a multi-step plan gracefully — retrying, adapting, or skipping — instead of letting one failure abort the entire task.",
    sections: [
      {
        heading: 'The problem: one weak link breaks the whole plan',
        body:
          "Module 1's reliability work (retries, error handling) covers a single API call failing. But Lesson 21's executePlan() has a DIFFERENT vulnerability: if step 2 of a 4-step plan throws an unexpected error, the whole for loop can crash, discarding steps 1's good result along with it.",
      },
      {
        heading: 'Wrapping each step individually',
        body:
          "Instead of one big try/catch around the whole loop, wrap EACH step's execution — a failure in step 2 doesn't stop steps 3 and 4 from still being attempted.",
        code: {
          language: 'typescript',
          code:
            "async function executePlan(plan: string[]): Promise<string[]> {\n  const results: string[] = [];\n  for (const step of plan) {\n    try {\n      results.push(await askCompass(step));\n    } catch (err) {\n      console.warn(`[plan] step failed: ${step}`, err);\n      results.push(`[This step could not be completed: ${step}]`);\n    }\n  }\n  return results;\n}",
        },
      },
      {
        heading: 'Letting the synthesis step know about failures',
        body:
          "When a step fails, its placeholder result flows into synthesizeResults() just like any other — the model sees explicitly that a piece is missing and can acknowledge that honestly in the final answer, rather than the user getting a suspiciously confident answer built on a silent gap.",
      },
      {
        heading: 'Adaptive re-planning (a more advanced option)',
        body:
          "A more sophisticated response to a failed step: ask the model to REVISE the remaining plan given the failure — maybe a different approach avoids whatever caused the failure. This is more powerful but also more complex and costly; the simpler 'note the failure and continue' approach from above is often good enough and is what this lesson builds fully.",
      },
      {
        heading: 'Distinguishing a real failure from a step needing more turns',
        body:
          "Not every 'failure' is a hard error — a step might need MORE tool-use turns than askCompass()'s MAX_TURNS cap allows and return its own graceful 'needed more steps' message (Lesson 9) rather than throwing. Both cases should be treated similarly by executePlan(): note the limitation and move on, rather than treating one as fatal and the other as fine.",
      },
    ],
    keyTerms: [
      { term: 'Step-level error handling', definition: "Wrapping EACH step's execution individually, so one failure doesn't abort the whole plan." },
      { term: 'Graceful degradation (in planning)', definition: "Continuing with the remaining plan even after one step fails, rather than aborting entirely." },
      { term: 'Adaptive re-planning', definition: "Regenerating the remaining plan in response to a failure, rather than just noting it and continuing." },
    ],
    commonMistakes: [
      "One try/catch around the whole executePlan() loop, losing all completed steps' results when any single step fails.",
      "Silently discarding a failed step's slot instead of recording that it failed, hiding the gap from synthesis.",
      "Presenting a synthesized answer with no acknowledgment that part of the plan didn't complete.",
      "Treating a 'ran out of turns' response the same as total silence, instead of recognizing it as a distinct, informative outcome.",
      "Over-engineering with full adaptive re-planning before the simpler per-step try/catch approach is even in place.",
    ],
    takeaways: [
      "Wrap EACH plan step individually, not the whole loop, so one failure doesn't discard everything else.",
      "A failed step should leave an explicit placeholder result, not silently vanish.",
      "The synthesis step should be able to see and acknowledge a failure honestly.",
      "Adaptive re-planning is a more advanced option; simple failure-noting is often sufficient.",
      "Distinguish (but handle similarly) a hard failure from a step that simply needed more turns.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A plan that survives a deliberately broken step',
    objective:
      "Prove step-level error handling works by deliberately breaking one step and confirming the others still complete.",
    instructions: [
      "Write a fake 3-step 'plan' as plain functions, where step 2 deliberately throws.",
      "Execute all 3 with a try/catch INSIDE the loop.",
      "Confirm steps 1 and 3 succeed and step 2's failure is recorded, not fatal.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'plan-recovery-test.ts',
        code:
          "async function step1() { return 'Step 1 succeeded.'; }\nasync function step2() { throw new Error('Simulated failure in step 2.'); }\nasync function step3() { return 'Step 3 succeeded.'; }\n\nconst steps = [step1, step2, step3];\n\nasync function runPlan() {\n  const results: string[] = [];\n  for (const step of steps) {\n    try {\n      results.push(await step());\n    } catch (err) {\n      console.warn('Step failed:', (err as Error).message);\n      results.push('[This step could not be completed.]');\n    }\n  }\n  return results;\n}\n\nrunPlan().then((results) => results.forEach((r, i) => console.log(`Step ${i + 1}:`, r)));",
      },
    ],
    explanation:
      "step2 always throws, simulating a real step failure (a tool error, an unexpected API issue, etc.). The try/catch lives INSIDE the loop body, around each individual step call — so when step2 throws, the catch handles it, logs a warning, and pushes a placeholder result, and the loop simply CONTINUES to step3 on its next iteration. Without this per-step wrapping, one uncaught throw would have stopped the entire loop, losing step1's already-successful result along with everything after the failure.",
    expectedOutput:
      "'Step 1: Step 1 succeeded.' / 'Step 2: [This step could not be completed.]' / 'Step 3: Step 3 succeeded.' — all three steps accounted for, despite the middle one failing.",
    learned: [
      "How per-step try/catch prevents one failure from aborting an entire loop.",
      "How to record a failure as an explicit placeholder rather than silently skipping it.",
      "The practical difference between loop-level and step-level error handling.",
      "How to verify recovery behavior with a deliberately broken step.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's Plan + Execute pipeline now survives an individual step failing — the plan continues, the failure is honestly recorded, and the final synthesized answer acknowledges any gap.",
    why:
      "Without this, ONE flaky step (a tool error, a rare API hiccup) could silently destroy an otherwise successful multi-step task. This makes Compass's most complex capability genuinely production-grade.",
    fileLocation: "compass-agent/index.ts (update executePlan with per-step error handling)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (replace executePlan)',
        code:
          "async function executePlan(plan: string[]): Promise<string[]> {\n  const results: string[] = [];\n  const startTime = Date.now();\n\n  for (let i = 0; i < plan.length; i++) {\n    const step = plan[i];\n    console.log(`[plan] working on: ${step}`);\n    try {\n      const result = await askCompass(step);\n      results.push(result);\n      console.log(`[plan] completed step ${i + 1}/${plan.length}`);\n    } catch (err) {\n      console.warn(`[plan] step ${i + 1} failed:`, err);\n      results.push(`[This step could not be completed: \"${step}\"]`);\n    }\n  }\n\n  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);\n  const failedCount = results.filter((r) => r.startsWith('[This step could not')).length;\n  console.log(`[plan] finished ${plan.length} steps in ${elapsed}s (${failedCount} failed)`);\n  return results;\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (update synthesizeResults’ prompt to acknowledge gaps)',
        code:
          "async function synthesizeResults(task: string, results: string[]): Promise<string> {\n  const combined = results.map((r, i) => `Step ${i + 1} result: ${r}`).join('\\n');\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 500,\n    system: 'Combine these step results into one clear, coherent final answer. If any step could not be completed, honestly acknowledge that gap rather than ignoring it.',\n    messages: [{ role: 'user', content: `Original task: ${task}\\n\\n${combined}` }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}",
      },
    ],
    placement:
      "Replace executePlan() with the version above (folding in Lesson 22's homework step/time tracking, now with per-step try/catch added). Update synthesizeResults()'s system prompt with the added sentence about acknowledging gaps honestly — everything else in the function stays the same.",
    implementation:
      "Each step now has its OWN try/catch inside the loop — a failure logs a warning (not a crash) and pushes a clearly-marked placeholder string into results, then the loop continues to the next step regardless. failedCount counts how many steps ended up with that placeholder, giving a quick visible summary alongside the timing info. Crucially, synthesizeResults() now explicitly instructs the model to acknowledge a gap honestly if it sees one of these placeholder results — so a partially-failed plan produces an honest 'I was able to research X and Y, but couldn't complete Z' answer, not a suspiciously complete-sounding one built over a silent hole.",
    expectedResult:
      "If one step of a multi-step task hits an error, Compass now logs the failure, continues completing the remaining steps, and its final answer HONESTLY notes what it couldn't do — instead of either crashing entirely or silently pretending everything succeeded.",
    connects:
      "Compass's planning pipeline is now resilient at every level: individual API calls (Module 1), individual tool calls (Module 2), and now individual PLAN STEPS. Lesson 24 (the Module 4 build) reviews and polishes the complete planning agent — the final milestone of this module.",
  },

  quiz: [
    { id: 'c23q1', kind: 'concept', prompt: 'What problem does step-level error handling solve, compared to one try/catch around the whole loop?', options: ['No real difference', 'One failing step no longer discards the results of every other (successful) step in the plan', 'It makes steps run faster', 'It removes the need for a plan at all'], answerIndex: 1, explanation: "Wrapping each step individually isolates failures instead of letting one crash the entire execution." },
    { id: 'c23q2', kind: 'application', prompt: 'Why push an explicit placeholder string for a failed step instead of just skipping it silently?', options: ['No real reason', 'So the synthesis step (and ultimately the user) knows a gap exists, rather than an invisible missing piece', 'Placeholders are required by TypeScript', 'It changes the API response'], answerIndex: 1, explanation: "Visibility into a failure lets the downstream synthesis handle it honestly instead of masking it." },
    { id: 'c23q3', kind: 'debug', prompt: 'A student wraps the ENTIRE for loop in one try/catch instead of each iteration. Step 2 of 4 fails. What happens?', options: ['Steps 3 and 4 still complete normally', 'The whole loop stops — steps 3 and 4 never run, and step 1’s result may be lost depending on how it’s returned', 'Only step 2 is affected, everything else fine', 'Nothing changes either way'], answerIndex: 1, explanation: "A single outer try/catch means one failure anywhere aborts the whole loop's remaining work." },
    { id: 'c23q4', kind: 'concept', prompt: 'Why update synthesizeResults()’s prompt to mention acknowledging gaps?', options: ['No real reason', 'So the final answer honestly reflects an incomplete plan instead of appearing suspiciously complete', 'It’s required syntax', 'It disables the synthesis step'], answerIndex: 1, explanation: "Explicitly instructing honesty about gaps produces a more trustworthy final answer." },
    { id: 'c23q5', kind: 'application', prompt: 'What is "adaptive re-planning," and why doesn’t this lesson build it fully?', options: ['It’s the same as simple failure-noting', 'Regenerating the remaining plan after a failure — more powerful but more complex/costly than the simpler approach this lesson focuses on', 'It’s impossible with the Anthropic API', 'It replaces the need for tools'], answerIndex: 1, explanation: "The lesson deliberately builds the simpler, sufficient approach first, noting the more advanced option exists." },
    { id: 'c23q6', kind: 'output', prompt: 'After executePlan() with 4 steps where 1 fails, what does the console log show?', options: ['Nothing about the failure', 'A warning for the failed step, plus a summary like "finished 4 steps in X.Xs (1 failed)"', 'A crash', 'Only successful steps are logged'], answerIndex: 1, explanation: "Both the individual failure warning and the aggregate summary are logged per the final project's implementation." },
    { id: 'c23q7', kind: 'code_reading', prompt: 'What does `results.filter((r) => r.startsWith(\'[This step could not\')).length` compute?', options: ['The total number of steps', 'The count of steps that failed, based on their placeholder text', 'The elapsed time', 'The number of tools used'], answerIndex: 1, explanation: "This filters results down to the failure placeholders and counts them." },
    { id: 'c23q8', kind: 'concept', prompt: 'Why treat a "ran out of turns" response similarly to a genuine thrown error?', options: ['They should be handled completely differently', 'Both represent a step that didn’t fully complete — the plan should still continue past either case', 'Ran-out-of-turns never actually happens', 'Only thrown errors matter'], answerIndex: 1, explanation: "Both are forms of a step not fully succeeding, and the plan's continuation logic should handle them consistently." },
    { id: 'c23q9', kind: 'project', prompt: "Why does this lesson's error handling apply at the STEP level, building on (not replacing) Module 1's error handling?", options: ["It replaces Module 1's error handling entirely", 'Module 1 handles single API-call failures; this lesson adds a NEW layer for failures within a multi-step PLAN specifically', 'They are the same thing', "Module 1's error handling is now unnecessary"], answerIndex: 1, explanation: "This is an additional, plan-specific layer of resilience built on top of the existing call-level reliability work." },
    { id: 'c23q10', kind: 'concept', prompt: 'What does Lesson 24 (the Module 4 build) focus on?', options: ['A brand new capability unrelated to planning', 'Reviewing and polishing the complete planning agent built across Lessons 19-23', 'Deployment', 'Long-term memory'], answerIndex: 1, explanation: "Lesson 24 is the module's wrap-up and polish lesson, mirroring the pattern from Modules 1-3." },
  ],

  homework: {
    task:
      "Add a retry (not just a failure note) for a step that fails: attempt each step up to 2 times before giving up and recording it as failed, using a simple retry loop around the individual step's execution.",
    requirements: [
      "Wrap each step's execution in a small retry loop (max 2 attempts) inside executePlan().",
      "Only record the '[This step could not be completed]' placeholder after BOTH attempts fail.",
      "Log which attempt succeeded (or that both failed) for visibility.",
    ],
    expectedOutcome:
      "A step that fails once but succeeds on a retry now completes normally instead of being marked as failed — genuinely reducing false failures from transient issues.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 22,
      hint: "Lesson 22 asked you to track and log the actual number of revisions used in askCompassWithPlan(), e.g. 'completed after 1 revision(s)'.",
      steps: [
        "Add let revisionsUsed = 0; before the reflection loop in askCompassWithPlan().",
        "Increment it each time a revision actually happens (inside the 'issue found' branch, before calling reviseAnswer).",
        "After the loop, log `[reflection] completed after ${revisionsUsed} revision(s)` (or 'no revisions needed' if 0), before returning finalAnswer.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "let revisionsUsed = 0;\nfor (let round = 0; round < MAX_REVISIONS; round++) {\n  const review = await reflect(task, finalAnswer);\n  if (review.ok) break;\n  revisionsUsed++;\n  finalAnswer = await reviseAnswer(task, finalAnswer, review.issue!);\n}\nconsole.log(revisionsUsed === 0 ? '[reflection] no revisions needed' : `[reflection] completed after ${revisionsUsed} revision(s)`);",
        },
      ],
    },
  },
};
