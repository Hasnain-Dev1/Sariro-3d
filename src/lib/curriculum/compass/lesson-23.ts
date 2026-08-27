import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 23 — Error Recovery in Multi-Step Agents
 * Module 4 (Planning + Reasoning) · Lesson 23 of 30
 */
export const lesson23: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 4,
  globalNumber: 23,
  name: 'Error recovery in multi-step agents',
  title: 'Error Recovery — When a Step Fails Mid-Plan',
  subtitle: "Handle tool failures and stuck steps gracefully, without derailing the whole plan.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to detect a failing step inside a multi-step agent, retry it sensibly, and fall back to a graceful degraded outcome when it truly cannot succeed.",
    sections: [
      {
        heading: 'What can go wrong mid-plan',
        body:
          "Lesson 4 handled retrying a single API call. But Plan+Execute (Lesson 21) introduces a NEW failure mode: an individual STEP in a multi-step plan might fail — a tool errors out, or the model gets stuck and can't make progress on that one step — while the rest of the plan is still perfectly viable.",
      },
      {
        heading: 'Detecting a stuck step',
        body:
          "A step is considered stuck if run_agent_loop() hits MAX_TURNS without a final answer (from Lesson 9), or if execute_tool() raises an exception that isn't recoverable by a normal retry. Catching this at the step level, not just the API-call level, is what makes error recovery genuinely useful for a multi-step agent.",
        code: {
          language: 'python',
          code:
            'def run_step_safely(step_prompt: str) -> tuple[bool, str]:\n    try:\n        result = run_agent_loop(step_prompt)\n        return True, result\n    except Exception as e:\n        return False, f"Step failed with error: {e}"',
        },
      },
      {
        heading: 'Deciding: retry, skip, or abort',
        body:
          "When a step fails, there are three sensible responses, and the RIGHT one depends on the step's role in the plan: retry once with a rephrased prompt (the model may just have misunderstood), skip the step and continue if it's non-critical to the overall goal, or abort the whole plan and tell the user honestly if it's a blocking dependency for later steps.",
        code: {
          language: 'python',
          code:
            'def execute_plan_with_recovery(task: str, steps: list[str]) -> str:\n    context = f"Overall task: {task}\\n\\n"\n\n    for i, step in enumerate(steps, start=1):\n        print(f"\\n[step {i}/{len(steps)}] {step}")\n        step_prompt = f"{context}Current step ({i}/{len(steps)}): {step}"\n\n        succeeded, result = run_step_safely(step_prompt)\n        if not succeeded:\n            print(f"[recovery] step {i} failed, retrying once...")\n            succeeded, result = run_step_safely(step_prompt + "\\n\\n(Note: your previous attempt failed. Try a different approach.)")\n\n        if not succeeded:\n            print(f"[recovery] step {i} failed again — skipping and noting the gap")\n            result = f"(Could not complete this step: {result})"\n\n        context += f"Step {i} result: {result}\\n"\n\n    return context',
        },
      },
      {
        heading: 'Being honest about partial failures',
        body:
          "The final synthesized answer (Lesson 21) should NOT silently paper over a step that failed — the synthesis prompt should be told to mention, briefly and honestly, any part of the task it couldn't complete, rather than presenting a confidently complete-looking answer that's actually missing something.",
      },
    ],
    keyTerms: [
      { term: 'Stuck step', definition: "A plan step that hits the turn cap or raises an unrecoverable exception without producing a usable result." },
      { term: 'Graceful degradation', definition: "Continuing to deliver a partial, honestly-labeled result when full success isn't achievable, instead of failing completely or hiding the gap." },
    ],
    commonMistakes: [
      "Only handling API-call-level retries (Lesson 4) without also handling step-level failures in multi-step plans.",
      "Retrying a failing step infinitely instead of capping retries and falling back.",
      "Silently dropping a failed step from the final synthesized answer, making it look complete when it isn't.",
      "Aborting the entire plan for a non-critical step failure that didn't need to block everything else.",
    ],
    takeaways: [
      "Multi-step plans need step-level error handling, distinct from single-API-call retries.",
      "A failed step can be retried once, skipped, or the whole plan aborted, depending on its role.",
      "run_step_safely() isolates failures so one bad step doesn't crash the whole pipeline.",
      "The final answer should honestly note any part of the task that couldn't be completed.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Simulating a failing step',
    objective: "Practise run_step_safely()'s exception handling with a deliberately failing function.",
    instructions: [
      "Write a mock run_agent_loop replacement that raises an exception for a specific input.",
      "Call run_step_safely() with both a normal and a failing prompt.",
      "Print the (succeeded, result) tuple for both.",
    ],
    code: [
      {
        language: 'python',
        filename: 'recovery_test.py',
        code:
          'def flaky_step(prompt: str) -> str:\n    if "fail" in prompt.lower():\n        raise RuntimeError("simulated tool failure")\n    return "step completed successfully"\n\ndef run_step_safely(step_prompt: str, step_fn=flaky_step) -> tuple[bool, str]:\n    try:\n        return True, step_fn(step_prompt)\n    except Exception as e:\n        return False, f"Step failed with error: {e}"\n\nprint(run_step_safely("do the normal thing"))\nprint(run_step_safely("please fail this step"))',
        },
    ],
    explanation:
      "Injecting a deliberately failing dependency (step_fn) is the key testing technique here — it lets you verify run_step_safely() correctly catches an exception and reports failure WITHOUT crashing the caller, which is exactly the isolation guarantee a multi-step agent needs.",
    expectedOutput: "(True, 'step completed successfully')\n(False, 'Step failed with error: simulated tool failure')",
    learned: [
      "How to inject a fake failing dependency to test error-handling logic.",
      "Why isolating a single step's failure protects the rest of a multi-step pipeline.",
      "The tuple-return pattern for signaling success/failure without raising further.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's Plan+Execute pipeline gains full step-level error recovery: retry once, skip with an honest note, and a synthesis step that acknowledges any real gaps.",
    why:
      "A multi-step agent that silently breaks — or silently hides failures — on the very first tool hiccup isn't trustworthy for real, longer tasks. This makes Compass's planning capability genuinely production-worthy.",
    fileLocation: 'compass-agent/main.py',
    code: [
      {
        language: 'python',
        filename: 'main.py',
        code:
          'import openai\n\nSYNTHESIS_WITH_GAPS_PROMPT = """You are given a task and the results of each step taken to \ncomplete it. Some steps may be marked as failed/incomplete. Write one clear, coherent final \nanswer for the user. If any part could not be completed, briefly and honestly mention that \nspecific gap — do not hide it, but do not dwell on it either."""\n\n\ndef run_step_safely(step_prompt: str) -> tuple[bool, str]:\n    try:\n        return True, run_agent_loop(step_prompt)\n    except (openai.RateLimitError, openai.APIStatusError) as e:\n        return False, f"Step failed with error: {e}"\n\n\ndef execute_plan_with_recovery(task: str, steps: list[str]) -> str:\n    context = f"Overall task: {task}\\n\\n"\n\n    for i, step in enumerate(steps, start=1):\n        print(f"\\n[step {i}/{len(steps)}] {step}")\n        step_prompt = f"{context}Current step ({i}/{len(steps)}): {step}"\n\n        succeeded, result = run_step_safely(step_prompt)\n        if not succeeded:\n            print(f"[recovery] step {i} failed, retrying once...")\n            succeeded, result = run_step_safely(\n                step_prompt + "\\n\\n(Note: your previous attempt failed. Try a different approach.)"\n            )\n        if not succeeded:\n            print(f"[recovery] step {i} failed again — skipping and noting the gap")\n            result = f"(Could not complete this step: {result})"\n\n        context += f"Step {i} result: {result}\\n"\n\n    return context\n\n\ndef plan_execute_and_recover(task: str) -> str:\n    steps = make_plan(task)\n    context = execute_plan_with_recovery(task, steps)\n\n    final = client.chat.completions.create(\n        model=MODEL, max_tokens=800,\n        messages=[\n            {"role": "system", "content": SYNTHESIS_WITH_GAPS_PROMPT},\n            {"role": "user", "content": context},\n        ],\n    )\n    return final.choices[0].message.content',
      },
    ],
    placement: "Add these functions to main.py; plan_execute_and_recover() replaces plan_and_execute() from Lesson 21 as the main entry point going forward.",
    implementation:
      "execute_plan_with_recovery() wraps each step's execution in run_step_safely(), retries exactly once with an explicit note that the prior attempt failed, and — only after BOTH attempts fail — records an honest placeholder result rather than crashing the whole plan. run_step_safely() catches openai.RateLimitError and openai.APIStatusError specifically (the openai package's own exception classes, imported via `import openai` alongside `from openai import OpenAI`) rather than a bare Exception, so a genuine bug in your own code still surfaces instead of being silently swallowed as a 'step failure'. The synthesis prompt is upgraded (SYNTHESIS_WITH_GAPS_PROMPT) to explicitly allow mentioning a real gap without dwelling on it, striking the balance between honesty and still being genuinely useful.",
    expectedResult:
      "If one step out of four fails twice (e.g. a tool being temporarily unavailable), Compass still completes the OTHER three steps normally, and the final answer briefly and honestly notes the one part it couldn't complete, instead of crashing or pretending everything succeeded.",
    connects:
      "Module 4 is now functionally complete: Compass can reason (ReAct/CoT), plan and decompose (Plan+Execute), check its own work (self-reflection), and recover from real failures. Lesson 24's Module 4 build brings all of these together into one cohesive reasoning agent.",
  },

  quiz: [
    { id: 'c23q1', kind: 'concept', prompt: 'What NEW failure mode does Plan+Execute introduce, beyond single-API-call errors from Lesson 4?', options: ['None, it’s the same', 'An individual STEP in a multi-step plan can fail while the rest of the plan is still viable', 'The whole program crashing on startup', 'Memory file corruption'], answerIndex: 1, explanation: 'Step-level failures are a distinct concern from single API-call retries.' },
    { id: 'c23q2', kind: 'application', prompt: 'What are the three sensible responses to a failed step?', options: ['Always crash', 'Retry once, skip if non-critical, or abort if it’s a blocking dependency', 'Always retry infinitely', 'Always skip silently'], answerIndex: 1, explanation: 'The right response depends on the step’s role in the overall plan.' },
    { id: 'c23q3', kind: 'code_reading', prompt: 'What does run_step_safely() return if run_agent_loop() raises an openai.RateLimitError?', options: ['Raises the exception further', '(False, an error message describing the failure)', '(True, None)', 'Crashes the program'], answerIndex: 1, explanation: 'The try/except catches the specific openai exception classes and returns a tuple signaling failure instead of propagating it.' },
    { id: 'c23q4', kind: 'debug', prompt: 'A step fails twice and execute_plan_with_recovery() continues to the next step anyway. Is this correct?', options: ['No, it should crash', 'Yes — after both attempts fail, the code records an honest placeholder and moves on, which is the designed graceful-degradation behavior', 'It’s a bug', 'It should retry forever'], answerIndex: 1, explanation: 'This is the intended graceful-degradation path, not a bug.' },
    { id: 'c23q5', kind: 'concept', prompt: 'Why must the final synthesis step be told about failed/incomplete steps?', options: ['No reason', 'So the final answer can honestly mention real gaps instead of presenting a falsely complete-looking result', 'To make the answer longer', 'It’s an API requirement'], answerIndex: 1, explanation: 'Hiding a failure would make the agent seem more capable than it actually was for that request.' },
    { id: 'c23q6', kind: 'application', prompt: 'Why inject a deliberately failing step_fn in the mini-project rather than relying on a real tool actually failing?', options: ['No reason', 'It gives a reliable, repeatable way to test error-handling logic without depending on real, unpredictable failures', 'It’s the only way to call the function', 'Real tools never fail'], answerIndex: 1, explanation: 'Dependency injection lets you deterministically test failure paths.' },
    { id: 'c23q7', kind: 'output', prompt: 'What gets appended to `context` when a step fails on both attempts?', options: ['Nothing', 'A placeholder string like "(Could not complete this step: ...)"', 'The full plan again', 'An exception object'], answerIndex: 1, explanation: 'This placeholder is what lets the synthesis step know a gap exists.' },
    { id: 'c23q8', kind: 'project', prompt: 'Why retry a failed step with an ADDED note ("your previous attempt failed") rather than the exact same prompt?', options: ['No reason, it’s the same', 'To give the model useful context that the first approach didn’t work, encouraging a different approach', 'To make the retry slower', 'It’s required by the API'], answerIndex: 1, explanation: 'An identical retry is likely to fail the same way; added context nudges a different approach.' },
    { id: 'c23q9', kind: 'application', prompt: 'Why does run_step_safely() catch specific openai exception classes instead of a bare Exception?', options: ['No difference either way', 'So a genuine bug in your own code still surfaces as a real error instead of being silently treated as a routine step failure', 'Bare Exception isn’t valid Python', 'It’s required by the API'], answerIndex: 1, explanation: 'Catching narrowly keeps error recovery focused on actual provider-side failures, not masking real bugs.' },
    { id: 'c23q10', kind: 'concept', prompt: 'What does Lesson 24 (Module 4 build) do with everything from Lessons 19-23?', options: ['Discards it all', 'Brings ReAct, CoT, Plan+Execute, self-reflection, and error recovery together into one cohesive reasoning agent', 'Only uses error recovery', 'Starts a new unrelated module'], answerIndex: 1, explanation: 'Module 4’s build lesson integrates all the reasoning patterns covered so far.' },
  ],

  homework: {
    task: "Add a per-plan failure summary printed after execute_plan_with_recovery() finishes: how many steps succeeded, how many needed a retry, and how many ultimately failed.",
    requirements: [
      "Track counts for succeeded-first-try, succeeded-after-retry, and failed-both-times.",
      "Print a one-line summary like 'Plan finished: 3 succeeded, 1 succeeded after retry, 0 failed.'",
      "Test with a mix of a normal step and a simulated failing one.",
    ],
    expectedOutcome: "A clear, at-a-glance summary line printed at the end of every plan execution, useful for spotting flaky tools over time.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 22,
      hint: "Lesson 22 asked you to log every revision round to a revisions.log file with a timestamp.",
      steps: [
        "Import datetime at the top of main.py.",
        "Inside revise_answer(), after getting the revised text, open revisions.log in append mode and write a formatted entry with datetime.now(), the question, draft, feedback, and revised answer.",
      ],
    },
  },
};
