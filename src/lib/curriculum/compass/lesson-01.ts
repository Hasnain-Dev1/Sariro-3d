import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 1 — Agents vs Chatbots & Your First Agent Call
 * Module 1 (What Are AI Agents?) · Lesson 1 of 30
 * Agent Architect — Beginner (agent-101)
 */
export const lesson01: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 1,
  lessonIndex: 0,
  globalNumber: 1,
  name: 'Agents vs chatbots & your first agent call',
  title: 'What Is an AI Agent? Meet Compass',
  subtitle: "Understand what makes an agent different from a chatbot, then make Compass's first real API call.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what separates an AI agent from a plain chatbot, the core loop every agent runs, and how to make your first call to the Claude API.",
    sections: [
      {
        heading: 'A chatbot answers. An agent DOES.',
        body:
          "A chatbot takes a message and returns a message — it only produces text. An AI agent can also take ACTIONS: search the web, run a calculation, read a file, call another API — then use the RESULT of that action to decide what to do next. The word 'agent' means it can act as your agent in the world, not just talk about it.\n\nCompass, the agent you'll build across this course, starts as a simple Q&A bot in this lesson — by Lesson 30 it plans multi-step tasks and uses real tools. Every lesson adds exactly one capability.",
      },
      {
        heading: 'The agent loop',
        body:
          "Almost every AI agent, no matter how advanced, runs the same basic loop: (1) receive input, (2) the LLM decides what to do — answer directly, or use a tool, (3) if a tool was used, take its result and go back to step 2, (4) once no more actions are needed, return a final answer. Right now Compass only does steps 1, 2 (answer directly), and 4 — Lesson 6 (Tool Use) adds the loop back to step 2.",
      },
      {
        heading: 'What is an LLM, briefly?',
        body:
          "A Large Language Model (LLM) — like Claude — is trained on huge amounts of text and learns to predict what comes next, which lets it understand instructions and generate coherent, useful responses. It doesn't 'know' things live on the internet; it reasons from its training plus whatever you give it in the conversation. This is exactly why tools (Module 2) matter — they give the LLM access to fresh, real information.",
      },
      {
        heading: 'Calling the Claude API',
        body:
          "You talk to Claude by sending a list of messages and getting a reply back — the same shape used throughout this course. For a Node/TypeScript project, the official @anthropic-ai/sdk package wraps this in a clean client.",
        code: {
          language: 'typescript',
          code:
            "import Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nconst response = await anthropic.messages.create({\n  model: 'claude-sonnet-5',\n  max_tokens: 300,\n  messages: [{ role: 'user', content: 'What is an AI agent, in one sentence?' }],\n});\n\nconst text = response.content[0].type === 'text' ? response.content[0].text : '';\nconsole.log(text);",
        },
      },
      {
        heading: 'A system prompt gives your agent an identity',
        body:
          "Passing a system parameter sets the model's role and behaviour for the whole conversation — this is how Compass gets its personality (helpful, concise, honest about what it doesn't know) instead of being a generic assistant.",
        code: {
          language: 'typescript',
          code:
            "const response = await anthropic.messages.create({\n  model: 'claude-sonnet-5',\n  max_tokens: 300,\n  system: 'You are Compass, a helpful research assistant. Be concise and clear.',\n  messages: [{ role: 'user', content: userQuestion }],\n});",
        },
      },
    ],
    keyTerms: [
      { term: 'AI agent', definition: "A system that uses an LLM to decide when to take ACTIONS (using tools), not just produce text." },
      { term: 'Agent loop', definition: "Receive input → decide → (optionally act, then re-decide) → return a final answer." },
      { term: 'LLM', definition: "Large Language Model — an AI trained to understand and generate text, like Claude." },
      { term: 'System prompt', definition: "An instruction setting the AI's role/behaviour for an entire conversation." },
      { term: 'API key', definition: "A secret credential authorizing calls to the Claude API, tied to your account and billing." },
    ],
    commonMistakes: [
      "Calling any chatbot 'an agent' just because it uses an LLM — the defining trait is the ability to take actions via tools.",
      "Expecting the LLM to know live, current information without a tool — it only knows what's in its training and the conversation.",
      "Forgetting the system prompt, leaving your agent with no distinct identity or behaviour rules.",
      "Hard-coding an API key directly in code instead of an environment variable (exposes it if ever shared or committed).",
      "Not setting max_tokens sensibly — too low cuts off answers mid-sentence; too high wastes cost on short questions.",
    ],
    takeaways: [
      "An agent can take actions (tools); a chatbot can only produce text.",
      "The agent loop: input → decide → (act → re-decide)* → final answer.",
      "The Claude API takes a messages array and returns a reply.",
      "A system prompt gives your agent a consistent role and behaviour.",
      "Compass starts simple this lesson and gains one real capability per module.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A one-question CLI assistant',
    objective:
      "Practise a real Claude API call end-to-end by building a tiny command-line script that answers one hard-coded question.",
    instructions: [
      "Create a new Node/TypeScript project (or a single script) with the Anthropic SDK installed.",
      "Set ANTHROPIC_API_KEY in your environment.",
      "Write a script that sends one question and prints Claude's reply.",
      "Run it and confirm you get a real, generated answer.",
    ],
    code: [
      {
        language: 'bash',
        code:
          "npm init -y\nnpm install @anthropic-ai/sdk\nexport ANTHROPIC_API_KEY=sk-ant-your-key-here",
      },
      {
        language: 'typescript',
        filename: 'ask.ts',
        code:
          "import Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nasync function main() {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5',\n    max_tokens: 200,\n    system: 'You are a friendly explainer. Keep answers under 3 sentences.',\n    messages: [{ role: 'user', content: 'Why do agents need tools?' }],\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  console.log(text);\n}\n\nmain();",
      },
    ],
    explanation:
      "The Anthropic client is created once with your API key. messages.create sends a single user turn plus a system prompt shaping the tone. The response's content is an array (it CAN contain multiple blocks, like text and tool calls later in this course); for now we check that the first block is text and read its .text. Running this script with ts-node or after compiling proves the full loop: your code → the network → Claude → back to your terminal, with a real generated answer each time.",
    expectedOutput:
      "Running the script prints a short, genuinely generated 2-3 sentence explanation of why agents need tools — different wording each run.",
    learned: [
      "How to install and configure the Anthropic SDK.",
      "How to send a system + user message and read the reply.",
      "Why response.content is an array, not a plain string.",
      "How to keep a secret key out of your code via environment variables.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's first working brain — a real, running agent that answers questions via the Claude API with its own identity.",
    why:
      "Before Compass can use tools, remember context, or plan, it needs a working core: take a question, call Claude with a clear identity, return an answer. Every later lesson builds ON this file.",
    fileLocation: "compass-agent/ (new project) — index.ts + .env",
    code: [
      {
        language: 'bash',
        code:
          "mkdir compass-agent && cd compass-agent\nnpm init -y\nnpm install @anthropic-ai/sdk dotenv\nnpm install -D typescript ts-node @types/node\nnpx tsc --init",
      },
      {
        language: 'text',
        filename: '.env',
        code:
          "ANTHROPIC_API_KEY=sk-ant-your-key-here",
      },
      {
        language: 'typescript',
        filename: 'index.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nconst SYSTEM_PROMPT = `You are Compass, a helpful, honest research and task assistant.\nBe clear and concise. If you don't know something, say so plainly.`;\n\nasync function askCompass(question: string): Promise<string> {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5',\n    max_tokens: 400,\n    system: SYSTEM_PROMPT,\n    messages: [{ role: 'user', content: question }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}\n\nasync function main() {\n  const question = process.argv[2] ?? 'What can you help me with?';\n  console.log(`You: ${question}`);\n  const reply = await askCompass(question);\n  console.log(`Compass: ${reply}`);\n}\n\nmain();",
      },
    ],
    placement:
      "Create a fresh project folder compass-agent/. Add .env with your real key (never commit it — add .env to .gitignore). Save index.ts at the project root. Run it with npx ts-node index.ts \"your question here\".",
    implementation:
      "askCompass() is the ONE function every future lesson calls or extends — keeping it isolated now (rather than inlining the API call in main()) means Lesson 6 can slot tool-use logic INSIDE it without restructuring anything. The SYSTEM_PROMPT constant is deliberately separate and named, since it will grow across the course (tools, memory instructions, planning rules all get appended here later). process.argv[2] lets you ask a different question from the command line each run, rather than editing code every time.",
    expectedResult:
      "Running npx ts-node index.ts \"What is Paris famous for?\" prints your question, then a real, generated answer from Compass — your agent's first working brain.",
    connects:
      "This askCompass() function and SYSTEM_PROMPT are the foundation for the entire course. Lesson 2 makes the personality more deliberate through prompt-engineering technique; by Lesson 6, tools plug directly into this same function.",
  },

  quiz: [
    { id: 'c1q1', kind: 'concept', prompt: 'What is the key difference between an agent and a plain chatbot?', options: ['Agents are always faster', 'An agent can take actions (via tools), not just produce text', 'Chatbots don’t use LLMs', 'There is no real difference'], answerIndex: 1, explanation: "The defining trait of an agent is the ability to act, not just respond with text." },
    { id: 'c1q2', kind: 'concept', prompt: 'What are the steps of the basic agent loop?', options: ['Input -> output only', 'Input -> decide -> (act -> re-decide)* -> final answer', 'Train -> deploy -> monitor', 'Login -> query -> logout'], answerIndex: 1, explanation: "The loop lets an agent take zero or more actions before producing a final answer." },
    { id: 'c1q3', kind: 'code_reading', prompt: 'What does the system parameter configure in an API call?', options: ['The max token count', 'The AI’s role/behaviour for the whole conversation', 'The API key', 'The response format only'], answerIndex: 1, explanation: "system sets persona/tone/rules that apply across the conversation." },
    { id: 'c1q4', kind: 'application', prompt: 'Where should a real API key be stored?', options: ['Hard-coded in the script', 'In an environment variable (e.g. .env, never committed)', 'In a public comment', 'In the response text'], answerIndex: 1, explanation: "Environment variables keep secrets out of source code." },
    { id: 'c1q5', kind: 'debug', prompt: 'A student’s script prints undefined instead of the reply. Likely cause?', options: ['The API is down', 'They read response.content[0].text without checking .type === \'text\' first', 'max_tokens is too high', 'The system prompt is missing'], answerIndex: 1, explanation: "content[0] could be a non-text block in general; checking .type first (and TypeScript narrowing) avoids reading .text incorrectly." },
    { id: 'c1q6', kind: 'concept', prompt: 'Why can’t an LLM alone answer "what’s the weather right now"?', options: ['It’s technically impossible for any AI', 'It only knows its training data + the conversation — no live tool means no live data', 'Weather questions are against policy', 'It requires a system prompt'], answerIndex: 1, explanation: "Without a tool (like a weather API), the model has no way to fetch live, current data." },
    { id: 'c1q7', kind: 'application', prompt: 'Why isolate the API call inside an askCompass() function instead of inlining it in main()?', options: ['No real reason', 'So later lessons (tools, memory) can extend this ONE function without restructuring the whole file', 'Functions are required by TypeScript', 'It makes the file longer for no benefit'], answerIndex: 1, explanation: "A single, focused function is the natural place to grow Compass's capabilities lesson by lesson." },
    { id: 'c1q8', kind: 'output', prompt: 'Given the code shown, what does process.argv[2] represent?', options: ['The script’s filename', 'The first command-line argument after the script name', 'The API key', 'The system prompt'], answerIndex: 1, explanation: "argv[0] is the node executable, argv[1] is the script path, argv[2] is the first real argument." },
    { id: 'c1q9', kind: 'project', prompt: "Why does Compass's system prompt explicitly say 'if you don't know something, say so plainly'?", options: ['It’s required syntax', 'To discourage the model from confidently making things up (hallucinating)', 'It slows down responses', 'It has no real effect'], answerIndex: 1, explanation: "An explicit honesty instruction is a real prompt-engineering technique to reduce confident-but-wrong answers." },
    { id: 'c1q10', kind: 'concept', prompt: 'What will Compass gain in Module 2 (Tool Use)?', options: ['A user interface', 'The ability to take real actions, not just respond with text', 'Deployment to the web', 'Long-term memory'], answerIndex: 1, explanation: "Module 2 gives Compass its first real tools, completing the act-then-decide part of the agent loop." },
  ],

  homework: {
    task:
      "Extend askCompass() to accept an optional 'style' parameter ('brief' | 'detailed') and adjust the system prompt to match, so Compass can answer the same question two different ways.",
    requirements: [
      "Add a style parameter to askCompass(question, style), defaulting to 'brief'.",
      "Build a slightly different system prompt string depending on style (brief = 1-2 sentences; detailed = a fuller paragraph).",
      "Test the SAME question with both styles and confirm the replies noticeably differ in length/depth.",
    ],
    expectedOutcome:
      "Calling askCompass('Explain agents', 'brief') and askCompass('Explain agents', 'detailed') produce genuinely different-length, appropriately-styled answers.",
    extends: 'final',
    // Lesson 1 has no previous lesson, so no previousHomeworkHint here.
  },
};
