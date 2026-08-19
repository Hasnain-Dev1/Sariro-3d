import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 19 — The ReAct Pattern
 * Module 4 (Planning + Reasoning) · Lesson 19 of 30
 */
export const lesson19: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 0,
  globalNumber: 19,
  name: 'The ReAct pattern',
  title: 'ReAct — Reasoning Before Every Action',
  subtitle: "Make Compass explain its thinking before each tool call, not just silently call tools.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the ReAct (Reason + Act) pattern — interleaving explicit reasoning with each action — and why visible reasoning improves both quality and debuggability.",
    sections: [
      {
        heading: 'What ReAct means',
        body:
          "ReAct stands for Reason + Act. Instead of an agent silently jumping straight to a tool call, it first articulates WHY: 'The user wants a current fact, so I should search' — THEN acts. This single habit, baked into the prompt, measurably improves an agent's tool choices and makes its behaviour far easier to debug when something goes wrong.",
      },
      {
        heading: 'Why explicit reasoning helps',
        body:
          "LLMs tend to produce BETTER decisions when they 'think out loud' first — the reasoning itself seems to improve the quality of what follows, not just explain it after the fact. This is a genuinely observed effect, not just a nice-to-have for humans reading along.",
      },
      {
        heading: 'Prompting for ReAct-style output',
        body:
          "You can encourage this pattern directly in the system prompt: instruct the model to briefly state its reasoning before deciding to use a tool or answer directly.",
        code: {
          language: 'text',
          code:
            "Before using a tool or answering, briefly state your reasoning in one sentence\n(e.g. 'This needs a calculation, so I'll use the calculator.'). Keep the reasoning\nshort — one sentence, not a full paragraph.",
        },
      },
      {
        heading: 'Where does the reasoning show up?',
        body:
          "With a well-crafted prompt, the model's text response BEFORE a tool_use block often contains this reasoning naturally. You can capture and log it (or show it to the user) alongside the tool announcement from Module 2's transparency work — a natural extension of that same idea.",
        code: {
          language: 'typescript',
          code:
            "const reasoningBlock = response.content.find((b) => b.type === 'text');\nif (reasoningBlock && response.stop_reason === 'tool_use') {\n  console.log(`[reasoning] ${reasoningBlock.text}`);\n}",
        },
      },
      {
        heading: 'ReAct is a mindset, not a new API feature',
        body:
          "Nothing here requires a new SDK capability — ReAct is purely a PROMPTING technique layered on the exact tool-use loop already built in Module 2. This is a good reminder that many powerful agent patterns are about HOW you prompt and structure the conversation, not new underlying machinery.",
      },
    ],
    keyTerms: [
      { term: 'ReAct', definition: "Reason + Act — an agent explicitly reasons about WHY before taking an action." },
      { term: 'Explicit reasoning', definition: "The model stating its thought process in words, rather than jumping directly to a decision." },
    ],
    commonMistakes: [
      "Assuming ReAct requires new API functionality — it's purely a prompting pattern on the existing loop.",
      "Letting the reasoning become a long, rambling paragraph instead of one focused sentence — defeats the purpose and wastes tokens.",
      "Not actually capturing/using the reasoning text once it's produced — the value comes from surfacing it, not just generating it.",
      "Forgetting the reasoning appears as regular text content, requiring the same content-block handling as any other text response.",
      "Expecting ReAct to fix a poorly-described tool — good tool descriptions (Module 2) still matter just as much.",
    ],
    takeaways: [
      "ReAct means the agent reasons ('why') BEFORE acting, not just after.",
      "Explicit reasoning measurably improves decision quality, not just readability.",
      "It's a prompting technique layered onto the existing tool-use loop — no new API needed.",
      "Capture and (optionally) surface the reasoning text for transparency and debugging.",
      "Keep the reasoning short — one sentence, not a paragraph.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Comparing silent vs. ReAct-style tool use',
    objective:
      "Observe the practical difference between a plain tool-use prompt and a ReAct-style one, side by side.",
    instructions: [
      "Ask the same tricky question with two different system prompts: one plain, one ReAct-style.",
      "Compare whether reasoning text appears before the tool call in each case.",
      "Note any difference in which tool gets chosen, if the question is ambiguous.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'react-compare.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\nconst calculatorTool = { name: 'calculator', description: 'Evaluates arithmetic.', input_schema: { type: 'object' as const, properties: { expression: { type: 'string' } }, required: ['expression'] } };\n\nasync function ask(system: string, question: string) {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200, system, tools: [calculatorTool],\n    messages: [{ role: 'user', content: question }],\n  });\n  return response.content;\n}\n\nasync function main() {\n  const plain = await ask('You are a helpful assistant.', 'What is 15% of 240?');\n  const react = await ask(\n    'Before using a tool, briefly state your reasoning in one sentence.',\n    'What is 15% of 240?'\n  );\n  console.log('PLAIN:', JSON.stringify(plain, null, 2));\n  console.log('REACT:', JSON.stringify(react, null, 2));\n}\n\nmain();",
      },
    ],
    explanation:
      "Both calls ask the identical question with an identical tool available — the only difference is the system prompt. Inspecting the PLAIN response's content array, you'll typically see just a tool_use block. The REACT response's content array typically includes a text block FIRST (the brief reasoning) alongside the tool_use block — a directly observable structural difference caused purely by the prompting instruction, not any code change.",
    expectedOutput:
      "The PLAIN response's content is mostly just a tool_use block. The REACT response's content includes a short text block (like 'This requires a percentage calculation, so I will use the calculator.') before the tool_use block.",
    learned: [
      "How to directly compare prompting strategies on the same question.",
      "What ReAct-style reasoning actually looks like in the raw response content.",
      "That prompting technique alone can change the STRUCTURE of a response.",
      "How to inspect response.content to see reasoning + tool_use together.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass now reasons out loud before every tool call — its decision-making becomes visible and (in practice) more reliable.",
    why:
      "This upgrades Compass's tool use from 'silently correct, hopefully' to 'visibly reasoned, and easier to trust and debug' — a meaningful step toward feeling like genuine reasoning rather than a black box.",
    fileLocation: "compass-agent/index.ts (update SYSTEM_PROMPT + capture reasoning in the loop)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add a ReAct instruction to SYSTEM_PROMPT)',
        code:
          "const SYSTEM_PROMPT = `You are Compass, a research and task assistant for students and professionals.\n\nFormat: Answer in 2-4 sentences. If the question calls for steps, use a short numbered list instead.\n\nReasoning: Before using a tool, briefly state your reasoning in ONE short sentence (e.g. \"This needs a calculation, so I'll use the calculator.\"). Keep it brief.\n\nHonesty: If you are not confident in an answer, or it requires current/live information you don't have, say so plainly rather than guessing.\n\nScope: If a question is unrelated to research, learning, or tasks, politely decline and suggest a more appropriate resource.`;",
      },
      {
        language: 'typescript',
        filename: 'index.ts (capture + log reasoning inside the loop)',
        code:
          "if (response.stop_reason === 'tool_use') {\n  const reasoningBlock = response.content.find((b) => b.type === 'text');\n  if (reasoningBlock && 'text' in reasoningBlock) {\n    console.log(`[reasoning] ${reasoningBlock.text}`);\n  }\n\n  const toolBlock = response.content.find((b) => b.type === 'tool_use');\n  if (!toolBlock) return 'Something went wrong reading the tool request.';\n  console.log(TOOL_LABELS[toolBlock.name] ?? `Using ${toolBlock.name}...`);\n  // ...rest of tool execution unchanged...\n}",
      },
    ],
    placement:
      "Add the new 'Reasoning:' section to SYSTEM_PROMPT (keep every other section from Lesson 3 unchanged). In askCompass()'s loop, right after entering the tool_use branch, add the reasoningBlock lookup and log BEFORE the existing toolBlock/TOOL_LABELS logic.",
    implementation:
      "The system prompt now explicitly instructs one-sentence reasoning before any tool call — this is the ENTIRE mechanism; no SDK changes are needed. In the loop, response.content.find((b) => b.type === 'text') looks for a text block ALONGSIDE the tool_use block (both can appear in the same response) — if found, it's logged with a '[reasoning]' prefix before the existing '[tool]' announcement, so the console output now shows Compass's thought process immediately followed by the action it decided to take.",
    expectedResult:
      "Asking Compass a math question now logs something like '[reasoning] This requires a percentage calculation, so I should use the calculator.' followed by 'Calculating...' and the grounded final answer — visibly showing WHY the tool was chosen, not just that it was.",
    connects:
      "This explicit reasoning habit is the foundation Lesson 20 (Chain of Thought) extends to NON-tool questions too, and Lesson 21 (Plan + Execute) builds into genuine multi-step task planning.",
  },

  quiz: [
    { id: 'c19q1', kind: 'concept', prompt: 'What does ReAct stand for?', options: ['Real-time Action', 'Reason + Act', 'Recursive Action', 'Reactive Agent'], answerIndex: 1, explanation: "ReAct describes interleaving explicit reasoning with actions." },
    { id: 'c19q2', kind: 'concept', prompt: 'Does ReAct require a new API feature?', options: ['Yes, a special ReAct endpoint', 'No — it’s a prompting technique on the existing tool-use loop', 'Yes, a different model', 'Yes, a new SDK version'], answerIndex: 1, explanation: "ReAct is achieved purely through prompt instructions, using the same tool-use mechanism already built." },
    { id: 'c19q3', kind: 'application', prompt: 'Why does the system prompt ask for exactly ONE short sentence of reasoning, not a full paragraph?', options: ['No real reason', 'To keep the reasoning focused and avoid wasting tokens on a rambling explanation', 'Longer reasoning is impossible', 'It’s required by the API'], answerIndex: 1, explanation: "A brief, focused reasoning statement serves the purpose without unnecessary verbosity." },
    { id: 'c19q4', kind: 'code_reading', prompt: 'What does response.content.find((b) => b.type === \'text\') look for in a tool_use response?', options: ['The tool’s arguments', 'A text content block — typically the reasoning — alongside the tool_use block', 'The API key', 'The system prompt'], answerIndex: 1, explanation: "Both a text block and a tool_use block can appear together in one response's content array." },
    { id: 'c19q5', kind: 'concept', prompt: 'What effect does explicit reasoning have, beyond just being readable to humans?', options: ['None, it’s purely cosmetic', 'It measurably tends to improve the quality of the decision that follows', 'It slows down every response significantly', 'It disables tool use'], answerIndex: 1, explanation: "Thinking out loud tends to genuinely improve subsequent decisions, not just explain them after the fact." },
    { id: 'c19q6', kind: 'debug', prompt: 'A student adds the reasoning instruction but never logs/captures the text block. What’s the practical result?', options: ['The feature works fully as intended', 'The model still reasons, but the user/developer never SEES it — the transparency benefit is lost', 'It causes an error', 'Tool use stops working'], answerIndex: 1, explanation: "Generating reasoning without surfacing it forfeits the visibility/debugging benefit, even if internal quality still improves." },
    { id: 'c19q7', kind: 'application', prompt: 'Why place the reasoning log BEFORE the tool announcement log in the loop?', options: ['No particular reason', 'So the console output reads in the natural order: think, then announce the action, then execute', 'It’s required by TypeScript', 'It changes the tool dispatch order'], answerIndex: 1, explanation: "Ordering the output to match the natural reason-then-act sequence makes it more readable and coherent." },
    { id: 'c19q8', kind: 'output', prompt: 'With the ReAct prompt active, what would you expect BEFORE a calculator tool_use block?', options: ['Nothing extra', 'A short text block stating why a calculation is needed', 'An error', 'A second tool_use block'], answerIndex: 1, explanation: "The prompt instructs a brief reasoning statement to precede the tool decision." },
    { id: 'c19q9', kind: 'project', prompt: "Why does ReAct not replace the need for good tool DESCRIPTIONS from Module 2?", options: ['It does replace them entirely', 'Good descriptions still teach the model WHEN a tool applies — ReAct adds visible reasoning on top of that existing decision-making', 'Tool descriptions are ignored once ReAct is active', 'They serve identical purposes'], answerIndex: 1, explanation: "ReAct and tool descriptions are complementary — one shapes when a tool triggers, the other surfaces the thinking behind that trigger." },
    { id: 'c19q10', kind: 'concept', prompt: 'What does Lesson 20 (Chain of Thought) extend this idea to?', options: ['Only tool-use questions', 'Reasoning for NON-tool questions too, not just before a tool call', 'Deployment', 'Memory management'], answerIndex: 1, explanation: "Chain of Thought applies explicit step-by-step reasoning more broadly, even when no tool is involved." },
  ],

  homework: {
    task:
      "Extend the reasoning capture to also log when NO tool is needed — if the model answers directly (no tool_use), log a short note confirming that, e.g. '[reasoning] Answered directly, no tool needed.'",
    requirements: [
      "In the non-tool-use branch (stop_reason !== 'tool_use') of askCompass(), add a log line before returning the final text.",
      "Keep it simple — a fixed message is fine, no need to extract special reasoning text for this case.",
      "Test with both a tool-requiring question and a plain question, confirming the right message logs in each case.",
    ],
    expectedOutcome:
      "A plain question (no tool needed) now logs '[reasoning] Answered directly, no tool needed.' before the final answer, giving consistent visibility regardless of whether a tool was used.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 18,
      hint: "Lesson 18 asked you to write a MEMORY.md documenting Compass's memory architecture, the four layers, and one known limitation.",
      steps: [
        "Create MEMORY.md at the project root.",
        "Describe the four layers in your own words: session memory (Lesson 13), bounded growth via trimming/summarization (Lessons 14-15), long-term storage via embeddings (Lesson 16), and automatic recall/save (Lesson 17).",
        "Explain the save heuristic (trigger phrases) and recall mechanism (cosine similarity over embeddings).",
        "Name at least one honest limitation, e.g. the heuristic missing unusual phrasings, or summarization being lossy.",
      ],
      codeGuidance: [
        {
          language: 'text',
          filename: 'MEMORY.md (outline)',
          code:
            "# Compass Memory Architecture\n\n1. Session memory — a shared array persisting within one run.\n2. Bounded growth — sliding window / summarization keeps token cost in check.\n3. Long-term storage — memory.json stores {text, embedding} pairs across runs.\n4. Auto recall/save — trigger-phrase heuristic decides saves; cosine similarity ranks recall.\n\nKnown limitation: the save heuristic only catches phrasings matching its trigger list.",
        },
      ],
    },
  },
};
