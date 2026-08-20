import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 21 — Plan+Execute
 * Module 4 (Planning + Reasoning) · Lesson 21 of 30
 */
export const lesson21: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 3,
  globalNumber: 21,
  name: 'Plan+Execute — decomposing complex tasks',
  title: 'Plan+Execute — Breaking a Big Task Into Steps',
  subtitle: "Have Compass write a plan FIRST, then work through it step by step, instead of reasoning turn by turn.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the Plan+Execute pattern: generating an explicit multi-step plan upfront, then executing each step in order — useful for genuinely large or multi-part tasks.",
    sections: [
      {
        heading: 'The limits of pure ReAct for BIG tasks',
        body:
          "ReAct (Lesson 19) reasons one Thought/Action pair at a time, deciding the next step only after seeing the previous result. That works well for moderate tasks, but for something genuinely large ('research three job candidates and write a comparison summary'), reasoning turn-by-turn can lose track of the overall structure. Plan+Execute fixes this by making the model commit to a FULL plan upfront.",
      },
      {
        heading: 'Step 1: generate the plan',
        body:
          "A dedicated call asks the model to output a numbered list of concrete steps needed to complete the task — nothing else, no execution yet.",
        code: {
          language: 'python',
          code:
            'PLAN_SYSTEM_PROMPT = """Break the user\'s request into a short numbered list of concrete, \nsequential steps needed to complete it. Output ONLY the numbered list, nothing else.\nKeep it to 2-6 steps. Each step should be a single, clear action."""\n\n\ndef make_plan(task: str) -> list[str]:\n    response = client.messages.create(\n        model="claude-sonnet-4-5",\n        max_tokens=300,\n        system=PLAN_SYSTEM_PROMPT,\n        messages=[{"role": "user", "content": task}],\n    )\n    text = response.content[0].text\n    steps = [line.split(".", 1)[-1].strip() for line in text.strip().split("\\n") if line.strip()]\n    return steps',
        },
      },
      {
        heading: 'Step 2: execute each step',
        body:
          "Each plan step is then run through the existing tool-use agent loop (from Modules 2-3, now with ReAct reasoning from Lesson 19), one at a time, carrying forward context from prior steps so later steps can reference earlier results.",
        code: {
          language: 'python',
          code:
            'def execute_plan(task: str, steps: list[str]) -> str:\n    context = f"Overall task: {task}\\n\\n"\n    results = []\n\n    for i, step in enumerate(steps, start=1):\n        print(f"\\n[step {i}/{len(steps)}] {step}")\n        step_prompt = f"{context}Current step ({i}/{len(steps)}): {step}"\n        result = run_agent_loop(step_prompt)\n        results.append(result)\n        context += f"Step {i} result: {result}\\n"\n\n    return context',
        },
      },
      {
        heading: 'Step 3: synthesize a final answer',
        body:
          "After all steps run, a final call asks the model to combine the accumulated context into one coherent answer for the user — the plan and intermediate steps were scaffolding, not the final product.",
      },
    ],
    keyTerms: [
      { term: 'Plan+Execute', definition: "A pattern that generates a full multi-step plan upfront, then executes each step in order, rather than deciding one step at a time." },
      { term: 'Synthesis step', definition: "A final call that combines all executed steps' results into one coherent answer." },
    ],
    commonMistakes: [
      "Using Plan+Execute for simple tasks where ReAct alone would be simpler and faster.",
      "Forgetting to carry context forward between steps, so later steps can't reference earlier results.",
      "Skipping the final synthesis step and just dumping raw per-step results on the user.",
      "Letting the plan generation step run wild with an unbounded number of steps instead of capping it.",
    ],
    takeaways: [
      "Plan+Execute generates a full plan upfront, then executes it step by step.",
      "It suits genuinely large, multi-part tasks better than turn-by-turn ReAct.",
      "Context must be carried forward between steps so later steps can build on earlier results.",
      "A final synthesis step turns raw per-step results into one coherent answer.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Generating and printing a plan',
    objective: "Practise the plan-generation step in isolation before wiring it into full execution.",
    instructions: [
      "Write make_plan(task) as shown in the concept section.",
      "Call it with a multi-part task like 'Plan a 3-day trip itinerary for Tokyo'.",
      "Print each step with its number.",
    ],
    code: [
      {
        language: 'python',
        filename: 'plan_test.py',
        code:
          'steps = make_plan("Plan a 3-day trip itinerary for Tokyo, covering food, sights, and a day trip.")\n\nfor i, step in enumerate(steps, start=1):\n    print(f"{i}. {step}")',
      },
    ],
    explanation:
      "This isolates plan generation from execution, letting you inspect the QUALITY of the plan itself before spending API calls executing it — a useful debugging habit for any multi-step agent pattern.",
    expectedOutput: "A numbered list like: 1. Research top attractions in Tokyo  2. Identify a day-trip destination  3. Suggest food spots by neighborhood  4. Assemble a day-by-day itinerary",
    learned: [
      "How to isolate and inspect a generated plan before executing it.",
      "Why separating planning from execution helps debugging.",
      "How to parse a numbered list response into a clean Python list.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gains a full plan_and_execute(task) pipeline: generate a plan, execute each step with the existing agent loop, then synthesize a final answer.",
    why:
      "This is Compass's first genuinely multi-step capability — handling tasks too large for a single reasoning pass, built entirely on tools already in place from Modules 2-4.",
    fileLocation: 'compass-agent/main.py',
    code: [
      {
        language: 'python',
        filename: 'main.py',
        code:
          'PLAN_SYSTEM_PROMPT = """Break the user\'s request into a short numbered list of concrete, \nsequential steps needed to complete it. Output ONLY the numbered list, nothing else.\nKeep it to 2-6 steps. Each step should be a single, clear action."""\n\nSYNTHESIS_SYSTEM_PROMPT = """You are given a task and the results of each step taken to \ncomplete it. Write one clear, coherent final answer for the user. Do not mention \n\'steps\' or \'plans\' explicitly — just answer as if you did the work directly."""\n\n\ndef make_plan(task: str) -> list[str]:\n    response = client.messages.create(\n        model="claude-sonnet-4-5", max_tokens=300,\n        system=PLAN_SYSTEM_PROMPT,\n        messages=[{"role": "user", "content": task}],\n    )\n    text = response.content[0].text\n    return [line.split(".", 1)[-1].strip() for line in text.strip().split("\\n") if line.strip()]\n\n\ndef execute_plan(task: str, steps: list[str]) -> str:\n    context = f"Overall task: {task}\\n\\n"\n    for i, step in enumerate(steps, start=1):\n        print(f"\\n[step {i}/{len(steps)}] {step}")\n        result = run_agent_loop(f"{context}Current step ({i}/{len(steps)}): {step}")\n        context += f"Step {i} result: {result}\\n"\n    return context\n\n\ndef plan_and_execute(task: str) -> str:\n    steps = make_plan(task)\n    print(f"\\n[plan] {len(steps)} steps:")\n    for i, step in enumerate(steps, start=1):\n        print(f"  {i}. {step}")\n\n    context = execute_plan(task, steps)\n\n    final = client.messages.create(\n        model="claude-sonnet-4-5", max_tokens=800,\n        system=SYNTHESIS_SYSTEM_PROMPT,\n        messages=[{"role": "user", "content": context}],\n    )\n    return final.content[0].text',
      },
    ],
    placement: "Add these three functions to main.py, after run_agent_loop() since execute_plan() depends on it.",
    implementation:
      "plan_and_execute() orchestrates the full pipeline: make_plan() gets the numbered steps, execute_plan() runs each through the existing run_agent_loop() (carrying forward a growing context string), and a final synthesis call turns the raw step results into ONE coherent answer — explicitly instructed not to mention 'steps' or 'plans', so the user gets a natural answer rather than a visible scaffolding dump.",
    expectedResult:
      "Calling plan_and_execute('Plan a 3-day trip itinerary for Tokyo') prints the generated plan, shows each step executing (with its own ReAct thoughts and tool calls), then returns one clean, synthesized itinerary.",
    connects:
      "Compass can now decompose and work through genuinely large tasks. Lesson 22 adds self-reflection — having Compass CHECK its own plan or answer for quality and revise if needed, rather than treating the first output as final.",
  },

  quiz: [
    { id: 'c21q1', kind: 'concept', prompt: 'What does Plan+Execute do differently from turn-by-turn ReAct?', options: ['Nothing, they’re identical', 'It generates a full multi-step plan upfront before executing any of it', 'It skips tool use entirely', 'It only works with memory'], answerIndex: 1, explanation: 'Plan+Execute commits to a full plan before execution begins, unlike ReAct’s step-by-step decisions.' },
    { id: 'c21q2', kind: 'application', prompt: 'Why carry forward a growing `context` string between executed steps?', options: ['It’s unnecessary', 'So later steps can reference and build on earlier steps’ results', 'To slow down execution', 'It’s required by the API'], answerIndex: 1, explanation: 'Without shared context, later steps couldn’t reference what earlier steps found.' },
    { id: 'c21q3', kind: 'concept', prompt: 'What is the purpose of the final synthesis call?', options: ['To generate the plan', 'To combine all per-step results into one coherent final answer for the user', 'To execute the first step', 'To check for errors'], answerIndex: 1, explanation: 'Synthesis turns scaffolding (the plan and step results) into a natural final answer.' },
    { id: 'c21q4', kind: 'code_reading', prompt: 'What does `line.split(".", 1)[-1].strip()` do to a line like "2. Research candidate A"?', options: ['Nothing changes', 'Strips the leading "2." leaving "Research candidate A"', 'Removes the word "Research"', 'Raises an error'], answerIndex: 1, explanation: 'Splitting on the first "." separates the number from the step text, and [-1] takes the text half.' },
    { id: 'c21q5', kind: 'debug', prompt: 'make_plan() returns a plan with 15 steps for a simple two-part task. What’s a likely cause?', options: ['Correct behavior', 'The system prompt’s "Keep it to 2-6 steps" instruction wasn’t followed by the model — this needs stronger constraint or a retry', 'The API is broken', 'Tools are misconfigured'], answerIndex: 1, explanation: 'Models don’t always perfectly follow constraints; validating and possibly re-prompting is a real consideration.' },
    { id: 'c21q6', kind: 'application', prompt: 'Why is Plan+Execute described as suiting "genuinely large" tasks rather than everything?', options: ['It’s always better', 'For simple tasks, the upfront planning overhead adds unnecessary latency and complexity', 'It only works with memory-aware agents', 'It’s slower for large tasks specifically'], answerIndex: 1, explanation: 'Simple tasks are better served by direct answers or plain ReAct.' },
    { id: 'c21q7', kind: 'output', prompt: 'What does execute_plan() print before running each step?', options: ['Nothing', 'A "[step i/total] step description" progress line', 'The full plan again', 'An error message'], answerIndex: 1, explanation: 'This gives visible progress tracking, consistent with the course’s transparency principle.' },
    { id: 'c21q8', kind: 'project', prompt: 'Why does SYNTHESIS_SYSTEM_PROMPT explicitly say not to mention "steps" or "plans"?', options: ['No reason', 'So the final answer reads naturally to the user rather than exposing internal scaffolding', 'To hide errors', 'It’s a formatting requirement of the API'], answerIndex: 1, explanation: 'The plan/steps are an internal mechanism; the user just wants a clean final answer.' },
    { id: 'c21q9', kind: 'concept', prompt: 'What existing function does execute_plan() rely on to actually run each step?', options: ['make_plan()', 'run_agent_loop() from Lesson 19', 'reason_through() from Lesson 20', 'save_memory()'], answerIndex: 1, explanation: 'Each step is executed through the existing ReAct-enabled tool-use loop.' },
    { id: 'c21q10', kind: 'concept', prompt: 'What does Lesson 22 add on top of Plan+Execute?', options: ['Deployment', 'Self-reflection — checking and revising a plan or answer for quality', 'A user interface', 'Memory management'], answerIndex: 1, explanation: 'Self-reflection lets Compass evaluate and improve its own output rather than treating the first attempt as final.' },
  ],

  homework: {
    task: "Add a step cap enforcement to make_plan(): if the model returns more than 6 steps, truncate to the first 6 and print a warning.",
    requirements: [
      "Check len(steps) after parsing in make_plan().",
      "If over 6, slice to steps[:6] and print a warning noting how many were dropped.",
      "Test with a task likely to generate an overly long plan.",
    ],
    expectedOutcome: "make_plan() never returns more than 6 steps, with a visible warning when truncation happens.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 20,
      hint: "Lesson 20 asked you to write a should_use_cot(question) heuristic routing reasoning-heavy questions to reason_through().",
      steps: [
        "Define signal lists: comparison words ('twice', 'more than', 'less than'), and question patterns ('how many', 'how much', 'how old').",
        "Check if the question contains a digit AND one of the comparison/question signals.",
        "Return True if so, False otherwise.",
      ],
    },
  },
};
