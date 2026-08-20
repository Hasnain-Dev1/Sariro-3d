import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 22 — Self-Reflection and Revision
 * Module 4 (Planning + Reasoning) · Lesson 22 of 30
 */
export const lesson22: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 4,
  globalNumber: 22,
  name: 'Self-reflection and revision',
  title: 'Self-Reflection — Checking Compass’s Own Work',
  subtitle: "Have Compass critique its own answer before showing it, and revise when the critique finds real problems.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the self-reflection pattern: using a second model call to critique a first answer, then revising if the critique surfaces genuine issues.",
    sections: [
      {
        heading: 'Why a second look catches things a first pass misses',
        body:
          "Every pattern built so far (ReAct, CoT, Plan+Execute) produces an answer, but never CHECKS it. Self-reflection adds one more step: a dedicated critique call that reviews the draft answer against the original question, looking specifically for gaps, factual issues, or unaddressed parts of a multi-part request.",
      },
      {
        heading: 'The critique call',
        body:
          "The critique prompt asks the model to evaluate — not regenerate — the answer, and to respond in a simple parseable format so the code can decide programmatically whether a revision is needed.",
        code: {
          language: 'python',
          code:
            'REFLECT_SYSTEM_PROMPT = """You are reviewing a draft answer for quality. Check whether it \nfully and accurately addresses the original question, with no unaddressed parts or errors.\n\nRespond in EXACTLY this format:\nVerdict: GOOD or NEEDS_REVISION\nFeedback: <if NEEDS_REVISION, explain specifically what to fix; otherwise "none">"""\n\n\ndef reflect_on_answer(question: str, draft: str) -> tuple[bool, str]:\n    prompt = f"Original question: {question}\\n\\nDraft answer: {draft}"\n    response = client.chat.completions.create(\n        model=MODEL, max_tokens=300,\n        messages=[\n            {"role": "system", "content": REFLECT_SYSTEM_PROMPT},\n            {"role": "user", "content": prompt},\n        ],\n    )\n    text = response.choices[0].message.content\n    needs_revision = "NEEDS_REVISION" in text\n    feedback = text.split("Feedback:", 1)[-1].strip() if "Feedback:" in text else ""\n    return needs_revision, feedback',
        },
      },
      {
        heading: 'Revising based on feedback',
        body:
          "If the critique flags a real issue, one more call asks the model to produce an improved answer, given the ORIGINAL question, the draft, and the specific feedback — not to start over from scratch.",
        code: {
          language: 'python',
          code:
            'def revise_answer(question: str, draft: str, feedback: str) -> str:\n    prompt = (\n        f"Original question: {question}\\n\\nDraft answer: {draft}\\n\\n"\n        f"Feedback to address: {feedback}\\n\\nWrite an improved answer."\n    )\n    response = client.chat.completions.create(\n        model=MODEL, max_tokens=800,\n        messages=[{"role": "user", "content": prompt}],\n    )\n    return response.choices[0].message.content',
        },
      },
      {
        heading: 'Capping revision loops',
        body:
          "Self-reflection can loop (critique the revision, revise again, ...) but MUST be capped — usually 1-2 rounds — to avoid runaway cost and latency for diminishing returns. A hardcoded MAX_REVISIONS constant, checked in a simple for loop, is enough.",
      },
    ],
    keyTerms: [
      { term: 'Self-reflection', definition: "Using a dedicated model call to critique a draft answer against the original question before finalizing it." },
      { term: 'Revision loop', definition: "A capped cycle of critique-then-revise, stopping after a fixed number of rounds or once the critique returns GOOD." },
    ],
    commonMistakes: [
      "Letting the revision loop run unbounded, burning cost/latency for diminishing quality gains.",
      "Having the critique call REGENERATE an answer instead of just evaluating the draft — conflating two different jobs.",
      "Not passing the specific feedback into the revision call, causing the model to guess what to fix.",
      "Applying self-reflection to every trivial answer instead of reserving it for complex, multi-part, or high-stakes ones.",
    ],
    takeaways: [
      "Self-reflection adds a dedicated critique step that evaluates a draft answer, separate from generating it.",
      "A structured Verdict/Feedback format lets code decide programmatically whether to revise.",
      "Revision calls should use the specific feedback, not start over blind.",
      "Revision loops must be capped to avoid runaway cost for diminishing returns.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Testing the critique step alone',
    objective: "Practise the reflect_on_answer() function in isolation with both a good and a flawed draft.",
    instructions: [
      "Write reflect_on_answer() as shown in the concept section.",
      "Test it with a deliberately incomplete draft answer (missing part of a multi-part question).",
      "Test it again with a genuinely complete, correct draft.",
      "Print the verdict and feedback for both.",
    ],
    code: [
      {
        language: 'python',
        filename: 'reflect_test.py',
        code:
          'question = "What\'s the capital of France, and what\'s its population?"\nflawed_draft = "The capital of France is Paris."\ngood_draft = "The capital of France is Paris, with a population of about 2.1 million."\n\nfor label, draft in [("flawed", flawed_draft), ("good", good_draft)]:\n    needs_revision, feedback = reflect_on_answer(question, draft)\n    print(f"{label}: needs_revision={needs_revision}, feedback={feedback!r}")',
      },
    ],
    explanation:
      "Testing with a deliberately incomplete draft is the key move here — it verifies the critique step actually CATCHES a real gap (the missing population figure) rather than just rubber-stamping everything as GOOD, which would make self-reflection worthless.",
    expectedOutput: "flawed: needs_revision=True, feedback mentioning the missing population.\ngood: needs_revision=False, feedback='none'.",
    learned: [
      "How to test a critique function against both flawed and correct inputs.",
      "Why testing the failure case matters as much as the success case.",
      "How to verify a quality-check step is actually doing its job, not just always passing.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gains a self-reflecting answer pipeline: draft → critique → (if needed) revise, capped at a configurable number of rounds.",
    why:
      "This closes the loop on reliability: Compass no longer just produces an answer, it checks its own work — a meaningfully more trustworthy final behavior.",
    fileLocation: 'compass-agent/main.py',
    code: [
      {
        language: 'python',
        filename: 'main.py',
        code:
          'MAX_REVISIONS = 2\n\nREFLECT_SYSTEM_PROMPT = """You are reviewing a draft answer for quality. Check whether it \nfully and accurately addresses the original question, with no unaddressed parts or errors.\n\nRespond in EXACTLY this format:\nVerdict: GOOD or NEEDS_REVISION\nFeedback: <if NEEDS_REVISION, explain specifically what to fix; otherwise "none">"""\n\n\ndef reflect_on_answer(question: str, draft: str) -> tuple[bool, str]:\n    prompt = f"Original question: {question}\\n\\nDraft answer: {draft}"\n    response = client.chat.completions.create(\n        model=MODEL, max_tokens=300,\n        messages=[\n            {"role": "system", "content": REFLECT_SYSTEM_PROMPT},\n            {"role": "user", "content": prompt},\n        ],\n    )\n    text = response.choices[0].message.content\n    needs_revision = "NEEDS_REVISION" in text\n    feedback = text.split("Feedback:", 1)[-1].strip() if "Feedback:" in text else ""\n    return needs_revision, feedback\n\n\ndef revise_answer(question: str, draft: str, feedback: str) -> str:\n    prompt = (\n        f"Original question: {question}\\n\\nDraft answer: {draft}\\n\\n"\n        f"Feedback to address: {feedback}\\n\\nWrite an improved answer."\n    )\n    response = client.chat.completions.create(\n        model=MODEL, max_tokens=800,\n        messages=[{"role": "user", "content": prompt}],\n    )\n    return response.choices[0].message.content\n\n\ndef answer_with_reflection(question: str) -> str:\n    draft = run_agent_loop(question)\n\n    for round_num in range(MAX_REVISIONS):\n        needs_revision, feedback = reflect_on_answer(question, draft)\n        if not needs_revision:\n            break\n        print(f"\\n[reflection] round {round_num + 1}: revising — {feedback}")\n        draft = revise_answer(question, draft, feedback)\n\n    return draft',
      },
    ],
    placement: "Add MAX_REVISIONS, REFLECT_SYSTEM_PROMPT, reflect_on_answer(), revise_answer(), and answer_with_reflection() to main.py.",
    implementation:
      "answer_with_reflection() first gets a draft from the existing run_agent_loop(), then loops up to MAX_REVISIONS times: critique the current draft, and if it needs revision, generate an improved version and critique THAT instead. The `break` on a GOOD verdict means most simple questions finish after just the initial critique (one extra call), while only genuinely flawed answers pay the cost of a revision round — this keeps typical latency reasonable while still catching real problems.",
    expectedResult:
      "For a well-answered question, answer_with_reflection() returns the original draft after one quick critique pass. For a genuinely incomplete answer, it prints '[reflection] round 1: revising — ...' and returns an improved version addressing the specific gap.",
    connects:
      "Compass can now plan, reason, and check its own work. Lesson 23 adds error recovery — handling cases where a TOOL itself fails or a step in a plan can't complete, not just quality issues with the final answer.",
  },

  quiz: [
    { id: 'c22q1', kind: 'concept', prompt: 'What does self-reflection add to Compass’s pipeline?', options: ['Nothing new', 'A dedicated critique step that evaluates a draft answer before finalizing it', 'A new tool', 'Long-term memory'], answerIndex: 1, explanation: "Self-reflection is a distinct evaluate-then-revise step, separate from answer generation." },
    { id: 'c22q2', kind: 'application', prompt: 'Why must revision loops be capped with MAX_REVISIONS?', options: ['No reason, unbounded is fine', 'To avoid runaway cost/latency for diminishing quality returns', 'The API requires a cap', 'It’s a Python syntax requirement'], answerIndex: 1, explanation: 'Without a cap, a stubborn critique could loop indefinitely for little added benefit.' },
    { id: 'c22q3', kind: 'code_reading', prompt: 'In reflect_on_answer(), how is needs_revision determined?', options: ['Always True', 'By checking if the string "NEEDS_REVISION" appears in the critique response text', 'By calling a separate API', 'It’s hardcoded to False'], answerIndex: 1, explanation: 'A simple substring check on the structured Verdict line drives the decision.' },
    { id: 'c22q4', kind: 'debug', prompt: 'reflect_on_answer() always returns needs_revision=False, even for obviously flawed drafts. What’s a likely cause?', options: ['Correct behavior', 'The model isn’t following the exact "Verdict: GOOD or NEEDS_REVISION" format, so the substring check never matches', 'The API is broken', 'MAX_REVISIONS is set too high'], answerIndex: 1, explanation: 'If the model’s output doesn’t match the expected format exactly, the parsing logic will misread it.' },
    { id: 'c22q5', kind: 'application', prompt: 'Why does revise_answer() take the SPECIFIC feedback as an argument instead of just re-asking the question?', options: ['No reason', 'So the model knows exactly what to fix rather than guessing or regenerating from scratch', 'It’s required by the API', 'To make the function slower'], answerIndex: 1, explanation: 'Targeted feedback produces a more precise revision than a blind re-attempt.' },
    { id: 'c22q6', kind: 'output', prompt: 'For a well-answered simple question, how many total extra API calls does answer_with_reflection() typically add?', options: ['Zero', 'One (a single critique call that returns GOOD, breaking the loop immediately)', 'MAX_REVISIONS calls always', 'It fails'], answerIndex: 1, explanation: 'The loop breaks on the first GOOD verdict, so most well-answered questions cost just one critique call.' },
    { id: 'c22q7', kind: 'concept', prompt: 'Why test reflect_on_answer() against a DELIBERATELY flawed draft, not just a good one?', options: ['No reason', 'To verify the critique step actually catches real problems rather than always passing everything', 'It’s required by the API', 'To make the test run faster'], answerIndex: 1, explanation: 'A critique step that never fails anything is worthless — testing the failure case verifies real value.' },
    { id: 'c22q8', kind: 'project', prompt: 'What does answer_with_reflection() call first, before any critique happens?', options: ['revise_answer()', 'run_agent_loop() to get an initial draft', 'reflect_on_answer() with an empty draft', 'Nothing'], answerIndex: 1, explanation: 'A draft answer must exist before it can be critiqued.' },
    { id: 'c22q9', kind: 'application', prompt: 'Why should self-reflection NOT be applied to every trivial answer?', options: ['It should be applied to everything', 'The added latency/cost isn’t worth it for simple, low-stakes questions unlikely to have real issues', 'It only works on complex questions technically', 'It breaks tool use'], answerIndex: 1, explanation: 'Self-reflection is most valuable for complex or high-stakes answers, similar to the CoT/ReAct judgment calls in earlier lessons.' },
    { id: 'c22q10', kind: 'concept', prompt: 'What does Lesson 23 add on top of self-reflection?', options: ['Deployment', 'Error recovery — handling tool failures or steps that can’t complete', 'A user interface', 'Voice input'], answerIndex: 1, explanation: 'Error recovery addresses failures during execution, a different concern from answer quality.' },
  ],

  homework: {
    task: "Log every revision round (question, draft, feedback, revised draft) to a revisions.log file, so you can review how often and why Compass revises its own answers.",
    requirements: [
      "Append a clearly formatted entry each time revise_answer() runs.",
      "Include a timestamp using Python's datetime module.",
      "Test with at least one question likely to trigger a revision.",
    ],
    expectedOutcome: "A revisions.log file accumulating readable entries each time Compass revises an answer, useful for reviewing quality patterns over time.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 21,
      hint: "Lesson 21 asked you to add a step cap to make_plan(): truncate to 6 steps with a warning if the model returns more.",
      steps: [
        "After parsing steps in make_plan(), check if len(steps) > 6.",
        "If so, print a warning noting how many were dropped, then set steps = steps[:6].",
        "Return the (possibly truncated) steps list.",
      ],
    },
  },
};
