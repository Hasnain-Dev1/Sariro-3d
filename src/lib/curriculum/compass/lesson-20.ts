import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 20 — Chain of Thought
 * Module 4 (Planning + Reasoning) · Lesson 20 of 30
 */
export const lesson20: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 1,
  globalNumber: 20,
  name: 'Chain of thought',
  title: 'Chain of Thought — Step-by-Step Reasoning Without Tools',
  subtitle: "Improve Compass's accuracy on tricky reasoning questions, even ones that need no tool at all.",

  concept: {
    durationMin: 15,
    summary:
      "Learn Chain of Thought (CoT) prompting — asking the model to work through a problem step by step — and when it genuinely improves accuracy.",
    sections: [
      {
        heading: 'What Chain of Thought is',
        body:
          "Chain of Thought means instructing the model to work through a problem in explicit STEPS before giving a final answer, rather than jumping straight to a conclusion. For genuinely tricky reasoning (logic puzzles, multi-part word problems, anything requiring several dependent deductions), this measurably improves accuracy — the model is less likely to skip a step or make an unjustified leap.",
      },
      {
        heading: 'CoT vs. ReAct — related but different',
        body:
          "ReAct (Lesson 19) is about reasoning specifically BEFORE deciding whether to use a TOOL. Chain of Thought is broader: reasoning through the PROBLEM ITSELF, step by step, whether or not any tool is involved at all. A logic puzzle needs CoT but no tool; a live-data question needs ReAct's tool-decision reasoning. They complement each other.",
      },
      {
        heading: 'Prompting for Chain of Thought',
        body:
          "A simple, effective instruction: ask the model to 'think through this step by step' before answering, for reasoning-heavy questions specifically — not necessarily every single question, since it adds length/tokens for simple ones that don't need it.",
        code: {
          language: 'text',
          code:
            "For questions requiring multi-step reasoning or logic, work through the problem\nstep by step BEFORE giving your final answer. For simple factual questions,\nanswer directly without extra steps.",
        },
      },
      {
        heading: 'Detecting when CoT applies',
        body:
          "Rather than force every question through elaborate reasoning, a simple heuristic (similar to Lesson 17's memory triggers) can detect likely-reasoning-heavy questions — phrases like 'how many', 'if...then', 'explain why', or multi-clause questions — and only THEN explicitly request step-by-step reasoning.",
        code: {
          language: 'typescript',
          code:
            "const REASONING_TRIGGERS = ['how many', 'if ', 'why', 'explain', 'compare', 'which is'];\n\nfunction needsChainOfThought(question: string): boolean {\n  const lower = question.toLowerCase();\n  return REASONING_TRIGGERS.some((t) => lower.includes(t));\n}",
        },
      },
      {
        heading: 'A worked example: why CoT helps',
        body:
          "Consider: 'A bakery sells 3 cakes for every 5 loaves of bread. If they sold 40 loaves yesterday, how many cakes did they sell?' Jumping straight to an answer risks arithmetic slips; working step by step — set up the ratio, compute 40 ÷ 5 = 8, then 8 × 3 = 24 — makes each step checkable and the final answer far more reliable.",
      },
    ],
    keyTerms: [
      { term: 'Chain of Thought (CoT)', definition: "Prompting the model to work through a problem in explicit steps before answering." },
      { term: 'Reasoning trigger', definition: "A phrase pattern suggesting a question likely needs step-by-step reasoning." },
    ],
    commonMistakes: [
      "Forcing elaborate step-by-step reasoning on every question, even simple factual ones — wastes tokens and adds unnecessary length.",
      "Confusing CoT (reasoning through the PROBLEM) with ReAct (reasoning about whether to use a TOOL) — related but distinct.",
      "Not detecting WHEN CoT is actually needed, missing the chance to keep simple answers snappy.",
      "Assuming CoT guarantees a correct answer — it improves ODDS of correctness by making steps checkable, not a guarantee.",
      "Writing a reasoning-trigger list too narrow to catch common question phrasings.",
    ],
    takeaways: [
      "Chain of Thought asks the model to reason step by step before answering.",
      "It measurably improves accuracy on multi-step reasoning/logic questions specifically.",
      "CoT and ReAct are complementary but distinct — problem reasoning vs. tool-decision reasoning.",
      "A trigger heuristic can detect likely-reasoning-heavy questions to apply CoT selectively.",
      "CoT improves reliability by making steps checkable — it doesn't guarantee a correct answer.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A word-problem accuracy test',
    objective:
      "Compare accuracy on a genuinely tricky word problem with and without an explicit Chain of Thought instruction.",
    instructions: [
      "Pick (or write) a multi-step word problem with a specific correct numeric answer.",
      "Ask it with a plain system prompt, and separately with a CoT-instructing one.",
      "Compare both answers against the actual correct answer.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'cot-test.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\nconst PROBLEM = 'A train travels 60 miles in the first hour and 45 miles in the second hour. If it continues at the average of those two speeds for a third hour, how many total miles will it have traveled after 3 hours?';\n\nasync function ask(system: string) {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 400, system,\n    messages: [{ role: 'user', content: PROBLEM }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}\n\nasync function main() {\n  console.log('PLAIN:\\n', await ask('Answer the question directly.'));\n  console.log('\\nCOT:\\n', await ask('Work through this step by step before giving your final answer.'));\n}\n\nmain();",
      },
    ],
    explanation:
      "The problem requires TWO dependent calculations: the average speed (60+45)/2 = 52.5, then total distance 60+45+52.5 = 157.5 miles — a genuinely easy place to slip up if rushed. The PLAIN prompt encourages jumping straight to a number; the COT prompt encourages laying out each calculation explicitly, which both makes the final answer more reliable AND lets you (or the model itself) catch a mistake by re-checking a specific step, rather than only having a bare final number to trust or distrust.",
    expectedOutput:
      "The COT response shows explicit steps (average speed calculation, then total) leading to 157.5 miles. The PLAIN response MAY reach the same answer but with no visible working — harder to verify, and empirically more error-prone on trickier problems.",
    learned: [
      "How to construct a genuinely multi-step reasoning test question.",
      "How to compare plain vs. CoT prompting directly.",
      "Why visible steps make answers easier to verify.",
      "That CoT's benefit is most visible on genuinely multi-step problems, not trivial ones.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass automatically detects reasoning-heavy questions and applies Chain of Thought prompting selectively — better accuracy on tricky questions, without unnecessary verbosity on simple ones.",
    why:
      "This directly improves the RELIABILITY of Compass's answers on exactly the kind of question where it previously might have jumped to a wrong conclusion — logic, multi-step word problems, and 'why' questions.",
    fileLocation: "compass-agent/index.ts (add needsChainOfThought + wire into buildSystemPrompt)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near shouldRemember)',
        code:
          "const REASONING_TRIGGERS = ['how many', 'if ', 'why', 'explain', 'compare', 'which is'];\n\nfunction needsChainOfThought(question: string): boolean {\n  const lower = question.toLowerCase();\n  return REASONING_TRIGGERS.some((t) => lower.includes(t));\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (update buildSystemPrompt to add CoT conditionally)',
        code:
          "async function buildSystemPrompt(question: string): Promise<string> {\n  const relevant = await recallRelevant(question);\n  let prompt = SYSTEM_PROMPT;\n\n  if (relevant.length > 0) {\n    const plural = relevant.length === 1 ? 'memory' : 'memories';\n    console.log(`[memory] found ${relevant.length} relevant ${plural}`);\n    prompt += `\\n\\nRelevant things you remember about this user: ${relevant.join('; ')}`;\n  }\n\n  if (needsChainOfThought(question)) {\n    console.log('[reasoning] this looks like a multi-step question — thinking it through');\n    prompt += `\\n\\nThis question may need multi-step reasoning. Work through it step by step before giving your final answer.`;\n  }\n\n  return prompt;\n}",
      },
    ],
    placement:
      "Add needsChainOfThought() near your other heuristic functions (shouldRemember). Update buildSystemPrompt() to check it and conditionally append a CoT instruction — the memory-recall logic from Lesson 18 stays exactly as it was, this is purely an ADDITION.",
    implementation:
      "needsChainOfThought() runs the same lightweight substring-check pattern as shouldRemember() — cheap, fast, no extra API call. buildSystemPrompt() now conditionally builds up its final string: base prompt, PLUS memory context if relevant, PLUS a CoT instruction if the question looks reasoning-heavy — each addition independent of the others, so a question can trigger any combination (or none) of them. The console log makes this selective behavior visible too, consistent with the transparency principle from Lessons 12 and 18.",
    expectedResult:
      "Asking Compass a simple factual question gets a normal, quick answer as before. Asking a genuinely multi-step word problem now logs '[reasoning] this looks like a multi-step question...' and the response visibly works through the steps before concluding — noticeably more reliable on exactly this kind of question.",
    connects:
      "Compass now reasons well for BOTH tool decisions (ReAct) and standalone problems (CoT). Lesson 21 (Plan + Execute) goes one level further: breaking a genuinely large, multi-PART task into an explicit plan with multiple steps, each potentially needing its own tool calls and reasoning.",
  },

  quiz: [
    { id: 'c20q1', kind: 'concept', prompt: 'What does Chain of Thought prompting ask the model to do?', options: ['Skip straight to an answer', 'Work through a problem in explicit steps before giving a final answer', 'Use more tools', 'Ignore the system prompt'], answerIndex: 1, explanation: "CoT is about explicit, step-by-step reasoning through the problem itself." },
    { id: 'c20q2', kind: 'concept', prompt: 'How does Chain of Thought differ from ReAct?', options: ['They are identical', 'CoT reasons through the PROBLEM itself; ReAct reasons about whether to use a TOOL — complementary, not the same', 'ReAct is only for math', 'CoT requires a different API'], answerIndex: 1, explanation: "The two techniques address different aspects of an agent's reasoning." },
    { id: 'c20q3', kind: 'application', prompt: 'Why NOT apply Chain of Thought to every single question, even simple ones?', options: ['It’s technically impossible for simple questions', 'It adds unnecessary length/tokens for questions that don’t benefit from it', 'CoT only works with tools', 'Simple questions can’t use CoT at all'], answerIndex: 1, explanation: "Selective application avoids wasted verbosity on questions that don't need extended reasoning." },
    { id: 'c20q4', kind: 'application', prompt: 'What is needsChainOfThought() an example of?', options: ['A tool definition', 'A trigger-phrase heuristic, similar in spirit to shouldRemember()', 'An embedding function', 'A retry mechanism'], answerIndex: 1, explanation: "It follows the same lightweight substring-matching heuristic pattern used for memory-save detection." },
    { id: 'c20q5', kind: 'debug', prompt: 'A genuinely tricky multi-step word problem gets a quick, unreliable answer. Likely cause?', options: ['The API is broken', 'The question phrasing didn’t match any REASONING_TRIGGERS, so CoT wasn’t applied', 'Chain of Thought is disabled entirely', 'The temperature is too low'], answerIndex: 1, explanation: "A heuristic-based trigger can miss questions phrased in ways not covered by its trigger list." },
    { id: 'c20q6', kind: 'concept', prompt: 'Why does working through explicit steps make an answer more reliable?', options: ['It doesn’t actually help', 'Each step becomes individually checkable, reducing the chance of an unnoticed leap or arithmetic slip', 'It uses a different, smarter model', 'It bypasses the system prompt'], answerIndex: 1, explanation: "Visible, verifiable steps reduce the risk of an unjustified or incorrect jump to a conclusion." },
    { id: 'c20q7', kind: 'output', prompt: 'For the train mileage problem in the mini-project, what is the mathematically correct total?', options: ['105 miles', '157.5 miles', '120 miles', '210 miles'], answerIndex: 1, explanation: "Average speed (60+45)/2 = 52.5, so total = 60 + 45 + 52.5 = 157.5 miles." },
    { id: 'c20q8', kind: 'application', prompt: 'How does buildSystemPrompt() combine memory recall and Chain of Thought?', options: ['They’re mutually exclusive, only one can apply', 'Each addition (memory context, CoT instruction) is independent — a question can trigger any combination', 'CoT disables memory recall', 'Memory recall disables CoT'], answerIndex: 1, explanation: "The two features are additive and independent, each checked and appended separately." },
    { id: 'c20q9', kind: 'project', prompt: "Why does the final project log '[reasoning] this looks like a multi-step question...' when CoT is applied?", options: ['Purely decorative with no purpose', 'Consistent with the transparency principle from earlier lessons — showing the user/developer WHEN and WHY extra reasoning is being applied', 'It’s required by the API', 'It replaces the actual reasoning'], answerIndex: 1, explanation: "This log follows the same visibility pattern established for tool use and memory recall." },
    { id: 'c20q10', kind: 'concept', prompt: 'What does Lesson 21 build on top of ReAct and Chain of Thought?', options: ['Deployment', 'Breaking a large, multi-PART task into an explicit plan with several steps', 'A new embedding model', 'Fine-tuning'], answerIndex: 1, explanation: "Plan + Execute extends single-question reasoning into genuine multi-step task decomposition." },
  ],

  homework: {
    task:
      "Extend REASONING_TRIGGERS with at least 3 additional phrases you think are commonly used in multi-step questions (e.g. 'what percentage', 'in total', 'step by step'), and test that a previously-missed question now correctly triggers CoT.",
    requirements: [
      "Add at least 3 new trigger phrases to the REASONING_TRIGGERS array.",
      "Find (or write) a reasoning-heavy question that was previously missed by the original trigger list.",
      "Confirm it now correctly triggers the '[reasoning] this looks like a multi-step question...' log.",
    ],
    expectedOutcome:
      "A previously-missed reasoning-heavy question now correctly triggers Chain of Thought, without breaking detection for questions that already worked before.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 19,
      hint: "Lesson 19 asked you to log a note when NO tool is needed — the model answered directly — for consistent reasoning visibility.",
      steps: [
        "In askCompass()'s loop, find the branch where response.stop_reason !== 'tool_use' (the final-answer path).",
        "Right before returning the text, add console.log('[reasoning] Answered directly, no tool needed.').",
        "Test with a plain factual question (should show this log) and a tool-requiring question (should show the tool/reasoning logs instead).",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside askCompass, final-answer branch)',
          code:
            "if (response.stop_reason !== 'tool_use') {\n  console.log('[reasoning] Answered directly, no tool needed.');\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}",
        },
      ],
    },
  },
};
