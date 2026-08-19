import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 21 — Plan + Execute
 * Module 4 (Planning + Reasoning) · Lesson 21 of 30
 */
export const lesson21: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 2,
  globalNumber: 21,
  name: 'Plan + execute',
  title: 'Plan + Execute — Breaking Down a Big Task',
  subtitle: "Give Compass the ability to make an explicit plan for a complex task, then work through it step by step.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the Plan + Execute pattern — generating an explicit multi-step plan first, then executing each step — for tasks too complex to handle in one shot.",
    sections: [
      {
        heading: 'When ReAct/CoT alone isn’t enough',
        body:
          "ReAct and Chain of Thought handle reasoning WITHIN a single response well. But consider: 'Research three programming languages, compare their learning curves, and recommend one for a beginner.' This isn't one question — it's several DEPENDENT sub-tasks. An agent needs to explicitly PLAN the sub-tasks before working through them one at a time.",
      },
      {
        heading: 'Step 1: generate a plan',
        body:
          "Ask the model to break the task into a numbered list of concrete steps BEFORE doing any of them — a separate, focused call whose only job is planning, not answering.",
        code: {
          language: 'typescript',
          code:
            "async function generatePlan(task: string): Promise<string[]> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 300,\n    system: 'Break the following task into 3-5 concrete, ordered steps. Respond with ONLY a numbered list, nothing else.',\n    messages: [{ role: 'user', content: task }],\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  return text.split('\\n').filter((line) => /^\\d+\\./.test(line.trim()));\n}",
        },
      },
      {
        heading: 'Step 2: execute each step',
        body:
          "Loop through the plan, asking Compass to complete EACH step individually — using its full tool-use + reasoning loop from Modules 2 and this module's earlier lessons — and collect the results as you go.",
        code: {
          language: 'typescript',
          code:
            "async function executePlan(plan: string[]): Promise<string[]> {\n  const results: string[] = [];\n  for (const step of plan) {\n    console.log(`[plan] working on: ${step}`);\n    const result = await askCompass(step);   // reuses the FULL existing agent loop\n    results.push(result);\n  }\n  return results;\n}",
        },
      },
      {
        heading: 'Step 3: synthesize a final answer',
        body:
          "Once every step is done, ask the model to combine the individual results into ONE coherent final answer — this is a separate synthesis call, since the raw list of step results usually isn't a satisfying final response on its own.",
        code: {
          language: 'typescript',
          code:
            "async function synthesizeResults(task: string, results: string[]): Promise<string> {\n  const combined = results.map((r, i) => `Step ${i + 1} result: ${r}`).join('\\n');\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 500,\n    system: 'Combine these step results into one clear, coherent final answer to the original task.',\n    messages: [{ role: 'user', content: `Original task: ${task}\\n\\n${combined}` }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}",
        },
      },
      {
        heading: 'Plan + Execute is three calls (at least), not one',
        body:
          "This pattern trades speed and cost (a plan call, N step calls, a synthesis call — often more total API usage than a single question) for the ability to handle GENUINELY complex, multi-part requests reliably. It's not the right tool for simple questions — only for tasks that truly need decomposition.",
      },
    ],
    keyTerms: [
      { term: 'Plan + Execute', definition: "A pattern: generate an explicit multi-step plan, execute each step, then synthesize a final answer." },
      { term: 'Planning call', definition: "A focused API call whose only job is decomposing a task into ordered steps." },
      { term: 'Synthesis', definition: "Combining multiple step results into one coherent final answer." },
    ],
    commonMistakes: [
      "Using Plan + Execute for a simple, single-part question — unnecessary cost and complexity.",
      "Forgetting the synthesis step, leaving the user with a disconnected list of step results instead of one coherent answer.",
      "Not parsing the plan robustly — a slightly different numbering format can break a naive parser.",
      "Executing steps that don't actually depend on the plan structure sequentially when they could run independently (a deeper optimization, but worth being aware of).",
      "Assuming the generated plan is always well-formed — validate it has at least one step before executing.",
    ],
    takeaways: [
      "Plan + Execute handles genuinely complex, multi-part tasks that single-shot reasoning can't.",
      "It's three phases: generate a plan, execute each step, synthesize a final answer.",
      "Each step execution can reuse the FULL existing agent loop (tools, memory, reasoning).",
      "This pattern costs more (multiple calls) — reserve it for tasks that truly need decomposition.",
      "Validate the parsed plan before executing it blindly.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A three-step plan generator',
    objective:
      "Practise generating and parsing a plan before wiring the full execute+synthesize pipeline.",
    instructions: [
      "Write generatePlan(task) for a task with an obviously multi-step nature.",
      "Parse the numbered list into a real array of strings.",
      "Print each step separately, confirming the parsing worked correctly.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'plan-test.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nasync function generatePlan(task: string): Promise<string[]> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 300,\n    system: 'Break the following task into 3-5 concrete, ordered steps. Respond with ONLY a numbered list, nothing else.',\n    messages: [{ role: 'user', content: task }],\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  return text.split('\\n').map((l) => l.trim()).filter((line) => /^\\d+\\./.test(line));\n}\n\nasync function main() {\n  const plan = await generatePlan('Plan a birthday party for 10 people with a $200 budget.');\n  plan.forEach((step, i) => console.log(`Step ${i + 1}:`, step));\n}\n\nmain();",
      },
    ],
    explanation:
      "The planning call's system prompt is DELIBERATELY narrow — 'respond with ONLY a numbered list, nothing else' — making the output predictable and easy to parse. Splitting on newlines and filtering for lines starting with a digit-dot pattern (/^\\d+\\./) extracts just the actual plan steps, discarding any stray blank lines or preamble text the model might still occasionally include. Printing each parsed step confirms the plan is now a real, usable ARRAY — ready to loop through and execute — not just a block of text.",
    expectedOutput:
      "Something like: 'Step 1: 1. Set a date and guest list.' / 'Step 2: 2. Choose a venue within budget.' / 'Step 3: 3. Plan food and decorations.' etc. — a genuine, ordered, parsed plan.",
    learned: [
      "How to write a focused planning-only API call.",
      "How to parse a numbered-list response into a real array.",
      "Why constraining the planning prompt's OUTPUT FORMAT matters for reliable parsing.",
      "The first phase of the full Plan + Execute pipeline.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass can now handle genuinely complex, multi-part requests using a full Plan + Execute pipeline — planning, executing each step with its complete agent loop, and synthesizing one coherent answer.",
    why:
      "This is the single biggest capability jump in the course: Compass moves from answering ONE question at a time to genuinely working through a complex, multi-part TASK.",
    fileLocation: "compass-agent/index.ts (add generatePlan, executePlan, synthesizeResults, and a new askCompassWithPlan entry point)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add the three pipeline functions)',
        code:
          "async function generatePlan(task: string): Promise<string[]> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 300,\n    system: 'Break the following task into 3-5 concrete, ordered steps. Respond with ONLY a numbered list, nothing else.',\n    messages: [{ role: 'user', content: task }],\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  return text.split('\\n').map((l) => l.trim()).filter((line) => /^\\d+\\./.test(line));\n}\n\nasync function executePlan(plan: string[]): Promise<string[]> {\n  const results: string[] = [];\n  for (const step of plan) {\n    console.log(`[plan] working on: ${step}`);\n    results.push(await askCompass(step));\n  }\n  return results;\n}\n\nasync function synthesizeResults(task: string, results: string[]): Promise<string> {\n  const combined = results.map((r, i) => `Step ${i + 1} result: ${r}`).join('\\n');\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 500,\n    system: 'Combine these step results into one clear, coherent final answer to the original task.',\n    messages: [{ role: 'user', content: `Original task: ${task}\\n\\n${combined}` }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (a new entry point for complex tasks)',
        code:
          "async function askCompassWithPlan(task: string): Promise<string> {\n  const plan = await generatePlan(task);\n  if (plan.length === 0) {\n    console.log('[plan] no multi-step plan needed, answering directly');\n    return askCompass(task);\n  }\n  console.log(`[plan] generated ${plan.length} steps`);\n  const results = await executePlan(plan);\n  return synthesizeResults(task, results);\n}",
      },
    ],
    placement:
      "Add generatePlan(), executePlan(), and synthesizeResults() near the bottom of index.ts, after askCompass() is fully defined (executePlan calls it). Add askCompassWithPlan() as a new, separate entry point — don't replace askCompass(), since simple questions should still use the direct, cheaper path.",
    implementation:
      "askCompassWithPlan() is the new top-level function for complex tasks: it generates a plan, and if parsing produces ZERO steps (a validation check per the concept lesson), it falls back to the normal askCompass() path rather than proceeding with an empty plan. executePlan() loops through each step, calling askCompass() for EACH ONE — meaning every step gets the FULL benefit of tool use, memory, ReAct, and Chain of Thought already built, not a stripped-down version. synthesizeResults() takes the ORIGINAL task plus every step's result and asks the model to weave them into one coherent final answer, rather than just concatenating raw step outputs.",
    expectedResult:
      "Calling askCompassWithPlan('Compare Python and JavaScript for a beginner and recommend one') now logs a generated plan, works through each step (potentially using tools/memory along the way), and returns ONE clear, synthesized recommendation — not three disconnected paragraphs.",
    connects:
      "Compass can now genuinely plan and execute complex tasks. Lesson 22 (Self-Reflection) adds a crucial safety net: having Compass CHECK its own synthesized answer before presenting it, catching obvious mistakes before the user ever sees them.",
  },

  quiz: [
    { id: 'c21q1', kind: 'concept', prompt: 'When is Plan + Execute the right pattern to use?', options: ['For every single question', 'For genuinely complex, multi-part tasks that need decomposition into dependent sub-tasks', 'Only for math questions', 'Never — it’s purely theoretical'], answerIndex: 1, explanation: "Plan + Execute is reserved for complex tasks; simple questions don't need this overhead." },
    { id: 'c21q2', kind: 'concept', prompt: 'What are the three phases of Plan + Execute?', options: ['Ask, wait, answer', 'Generate a plan, execute each step, synthesize a final answer', 'Login, query, logout', 'Reason, act, retry'], answerIndex: 1, explanation: "These three distinct phases make up the full pattern." },
    { id: 'c21q3', kind: 'application', prompt: 'Why does the planning call’s system prompt say "Respond with ONLY a numbered list, nothing else"?', options: ['No real reason', 'To make the output format predictable and reliably parseable', 'It’s required by the API', 'It reduces token cost to zero'], answerIndex: 1, explanation: "Constraining the output format is what makes automated parsing of the plan reliable." },
    { id: 'c21q4', kind: 'code_reading', prompt: 'Why does executePlan() call askCompass() for each step, instead of a simpler, separate function?', options: ['It’s a mistake', 'So each step gets the FULL benefit of tools, memory, ReAct, and Chain of Thought already built', 'askCompass is faster than any alternative', 'It’s required syntax'], answerIndex: 1, explanation: "Reusing the complete existing agent loop means every step benefits from all prior capability, not a stripped-down version." },
    { id: 'c21q5', kind: 'concept', prompt: 'Why is a separate synthesis step needed after executing all plan steps?', options: ['It’s optional and can be skipped', 'A raw list of individual step results usually isn’t a coherent final answer on its own', 'Synthesis replaces the need for planning', 'It’s only needed for math tasks'], answerIndex: 1, explanation: "Combining results into one coherent answer is a distinct task from producing each individual result." },
    { id: 'c21q6', kind: 'debug', prompt: 'generatePlan() returns an empty array for a simple question. What should askCompassWithPlan() do?', options: ['Crash with an error', 'Fall back to the normal askCompass() path instead of proceeding with an empty plan', 'Retry generatePlan() indefinitely', 'Return an empty string'], answerIndex: 1, explanation: "Validating the plan and falling back gracefully avoids proceeding with a broken/empty decomposition." },
    { id: 'c21q7', kind: 'application', prompt: 'Why is Plan + Execute described as costing MORE than a single question?', options: ['It doesn’t cost more', 'It involves a planning call, one call per step, AND a synthesis call — more total API usage', 'It uses a cheaper model automatically', 'Cost is unrelated to the number of calls'], answerIndex: 1, explanation: "Multiple sequential API calls naturally add up to more total cost than one direct call." },
    { id: 'c21q8', kind: 'output', prompt: 'For the task "Compare Python and JavaScript for a beginner and recommend one," what should the FINAL output be?', options: ['Three disconnected paragraphs, one per step', 'One clear, synthesized recommendation combining all the research', 'Just the raw plan, unexecuted', 'An error, since this needs a tool'], answerIndex: 1, explanation: "The synthesis step is specifically responsible for producing one coherent final answer." },
    { id: 'c21q9', kind: 'project', prompt: "Why does Compass keep BOTH askCompass() and askCompassWithPlan() as separate entry points?", options: ['A mistake that should be fixed', 'Simple questions should use the cheaper, direct path; only genuinely complex tasks should pay the cost of full planning', 'They do the exact same thing', 'askCompass no longer works'], answerIndex: 1, explanation: "Keeping both preserves an efficient path for simple questions while enabling complex task handling when needed." },
    { id: 'c21q10', kind: 'concept', prompt: 'What safety net does Lesson 22 add on top of Plan + Execute?', options: ['Deployment', 'Self-reflection — checking the synthesized answer for obvious mistakes before presenting it', 'A new tool', 'Long-term memory'], answerIndex: 1, explanation: "Self-reflection is the next lesson's focus, adding a review step after synthesis." },
  ],

  homework: {
    task:
      "Add a step counter and elapsed-time log to executePlan(), so you can see how long a multi-step plan takes overall — e.g. '[plan] completed 4/4 steps in 12.3s'.",
    requirements: [
      "Track a start time before the loop begins (Date.now()).",
      "After each step, log progress like '[plan] completed step 2/4'.",
      "After the loop finishes, log the total elapsed time in seconds.",
    ],
    expectedOutcome:
      "Running askCompassWithPlan() on a multi-step task now shows live progress ('completed step N/total') and a final total-time summary, giving visibility into how long complex tasks actually take.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 20,
      hint: "Lesson 20 asked you to extend REASONING_TRIGGERS with 3 new phrases and confirm a previously-missed question now correctly triggers Chain of Thought.",
      steps: [
        "Add phrases like 'what percentage', 'in total', 'step by step' to the REASONING_TRIGGERS array.",
        "Find a question that uses one of these NEW phrases but not the original ones (e.g. 'What percentage of 80 is 20?').",
        "Confirm it now logs the '[reasoning] this looks like a multi-step question...' message where it previously wouldn't have.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "const REASONING_TRIGGERS = [\n  'how many', 'if ', 'why', 'explain', 'compare', 'which is',\n  'what percentage', 'in total', 'step by step',\n];",
        },
      ],
    },
  },
};
