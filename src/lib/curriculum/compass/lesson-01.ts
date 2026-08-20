import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 1 — Agents vs Chatbots & Your First Agent Call
 * Module 1 (What Are AI Agents?) · Lesson 1 of 30
 * Agent Architect — Beginner (agent-101)
 *
 * Compass is built in Python throughout this course, ending in a real Streamlit
 * app in Module 5. The course uses the OpenAI-compatible SDK shape (openai
 * package) since it's the widest-supported standard — the SAME code works with
 * OpenAI, Groq, and Gemini's OpenAI-compatible endpoint by swapping base_url.
 */
export const lesson01: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 1,
  lessonIndex: 0,
  globalNumber: 1,
  name: 'Agents vs chatbots & your first agent call',
  title: 'What Is an AI Agent? Meet Compass',
  subtitle: "Understand what makes an agent different from a chatbot, then make Compass's first real API call in Python.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what separates an AI agent from a plain chatbot, the core loop every agent runs, and how to make your first call to an AI model from Python using a provider-agnostic SDK.",
    sections: [
      {
        heading: 'A chatbot answers. An agent DOES.',
        body:
          "A chatbot takes a message and returns a message — it only produces text. An AI agent can also take ACTIONS: search the web, run a calculation, read a file, call another API — then use the RESULT of that action to decide what to do next. The word 'agent' means it can act as your agent in the world, not just talk about it.\n\nCompass, the agent you'll build across this course, starts as a simple Q&A bot in this lesson — by Lesson 30 it plans multi-step tasks and runs live in a real Streamlit app. Every lesson adds exactly one capability.",
      },
      {
        heading: 'The agent loop',
        body:
          "Almost every AI agent, no matter how advanced, runs the same basic loop: (1) receive input, (2) the model decides what to do — answer directly, or use a tool, (3) if a tool was used, take its result and go back to step 2, (4) once no more actions are needed, return a final answer. Right now Compass only does steps 1, 2 (answer directly), and 4 — Lesson 6 (Tool Use) adds the loop back to step 2.",
      },
      {
        heading: 'What is an LLM, briefly?',
        body:
          "A Large Language Model (LLM) is trained on huge amounts of text and learns to predict what comes next, which lets it understand instructions and generate coherent, useful responses. It doesn't 'know' things live on the internet; it reasons from its training plus whatever you give it in the conversation. This is exactly why tools (Module 2) matter — they give the model access to fresh, real information.\n\nThis course deliberately builds Compass on a PROVIDER-AGNOSTIC foundation: the openai Python package, talking to a `chat.completions` style API. This exact SDK shape works unchanged with OpenAI's own models, Groq's fast open-weight hosting, and Google's Gemini — each one exposes an OpenAI-compatible endpoint, so switching providers is a one-line change (base_url + api_key + model name), not a rewrite. The AGENT PATTERNS you learn (the loop, tool calling, memory, planning) are what actually matter, and they transfer identically regardless of which provider answers the call.",
      },
      {
        heading: 'Setting up a Python project',
        body:
          "Python projects typically use a virtual environment to keep dependencies isolated, and pip to install packages. You'll want Python 3.10+ for this course.",
        code: {
          language: 'bash',
          code:
            "python -m venv venv\nsource venv/bin/activate      # on Windows: venv\\Scripts\\activate\npip install openai python-dotenv",
        },
      },
      {
        heading: 'Calling the API',
        body:
          "You talk to the model by sending a list of messages and getting a reply back. The official openai Python package wraps this in a clean client. Including a message with role 'system' first sets the model's role and behaviour for the whole conversation — this is how Compass gets its personality (helpful, concise, honest about what it doesn't know).",
        code: {
          language: 'python',
          code:
            "from openai import OpenAI\n\nclient = OpenAI()   # reads OPENAI_API_KEY from the environment\n\nresponse = client.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    max_tokens=300,\n    messages=[\n        {\"role\": \"system\", \"content\": \"You are Compass, a helpful research assistant. Be concise and clear.\"},\n        {\"role\": \"user\", \"content\": \"What is an AI agent, in one sentence?\"},\n    ],\n)\n\nprint(response.choices[0].message.content)",
        },
      },
      {
        heading: 'Swapping providers without rewriting anything',
        body:
          "Because Groq and Gemini both expose OpenAI-compatible endpoints, the SAME client code above works for either — only the constructor call changes.",
        code: {
          language: 'python',
          code:
            "# Groq (fast, open-weight models)\nclient = OpenAI(api_key=GROQ_API_KEY, base_url=\"https://api.groq.com/openai/v1\")\n\n# Gemini (OpenAI-compatible endpoint)\nclient = OpenAI(api_key=GEMINI_API_KEY, base_url=\"https://generativelanguage.googleapis.com/v1beta/openai/\")",
        },
      },
    ],
    keyTerms: [
      { term: 'AI agent', definition: "A system that uses an LLM to decide when to take ACTIONS (using tools), not just produce text." },
      { term: 'Agent loop', definition: "Receive input → decide → (optionally act, then re-decide) → return a final answer." },
      { term: 'LLM', definition: "Large Language Model — an AI trained to understand and generate text, like GPT, Gemini, or Groq-hosted open-weight models." },
      { term: 'System message', definition: "A message with role 'system', setting the AI's role/behaviour for an entire conversation." },
      { term: 'OpenAI-compatible endpoint', definition: "An API that accepts requests in the same shape as OpenAI's, letting the same SDK/code work with multiple providers." },
      { term: 'Virtual environment', definition: "An isolated Python environment (venv) keeping a project's dependencies separate from the rest of your system." },
    ],
    commonMistakes: [
      "Calling any chatbot 'an agent' just because it uses an LLM — the defining trait is the ability to take actions via tools.",
      "Expecting the model to know live, current information without a tool — it only knows what's in its training and the conversation.",
      "Forgetting the system message, leaving your agent with no distinct identity or behaviour rules.",
      "Hard-coding an API key directly in code instead of an environment variable (exposes it if ever shared or committed).",
      "Not activating the virtual environment before installing packages, polluting your global Python install.",
    ],
    takeaways: [
      "An agent can take actions (tools); a chatbot can only produce text.",
      "The agent loop: input → decide → (act → re-decide)* → final answer.",
      "client.chat.completions.create takes a messages list and returns a reply.",
      "A system message gives your agent a consistent role and behaviour.",
      "The openai SDK shape works unchanged across OpenAI, Groq, and Gemini via base_url — agent patterns transfer identically.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A one-question CLI assistant',
    objective:
      "Practise a real API call end-to-end by building a tiny command-line script that answers one hard-coded question.",
    instructions: [
      "Create a virtual environment and install openai + python-dotenv.",
      "Set OPENAI_API_KEY in a .env file.",
      "Write a script that sends one question and prints the reply.",
      "Run it and confirm you get a real, generated answer.",
    ],
    code: [
      {
        language: 'bash',
        code:
          "python -m venv venv\nsource venv/bin/activate\npip install openai python-dotenv\necho 'OPENAI_API_KEY=sk-your-key-here' > .env",
      },
      {
        language: 'python',
        filename: 'ask.py',
        code:
          "from dotenv import load_dotenv\nfrom openai import OpenAI\n\nload_dotenv()\nclient = OpenAI()\n\ndef main():\n    response = client.chat.completions.create(\n        model=\"gpt-4o-mini\",\n        max_tokens=200,\n        messages=[\n            {\"role\": \"system\", \"content\": \"You are a friendly explainer. Keep answers under 3 sentences.\"},\n            {\"role\": \"user\", \"content\": \"Why do agents need tools?\"},\n        ],\n    )\n    print(response.choices[0].message.content)\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "load_dotenv() reads your .env file so OPENAI_API_KEY becomes available as a real environment variable — OpenAI() picks it up automatically, so the key never appears in your code. client.chat.completions.create sends a system message shaping the tone plus a user turn, and response.choices[0].message.content reads the generated reply directly. The if __name__ == \"__main__\": guard is a standard Python idiom meaning 'only run main() when this file is executed directly' — it becomes useful once other files start importing from this one.",
    expectedOutput:
      "Running python ask.py prints a short, genuinely generated 2-3 sentence explanation of why agents need tools — different wording each run.",
    learned: [
      "How to set up a Python virtual environment and install packages.",
      "How to load a secret key from a .env file safely.",
      "How to send a system + user message and read the reply.",
      "The if __name__ == \"__main__\": entry-point pattern.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's first working brain — a real, running agent that answers questions via the API with its own identity.",
    why:
      "Before Compass can use tools, remember context, or plan, it needs a working core: take a question, call the model with a clear identity, return an answer. Every later lesson builds ON this file.",
    fileLocation: "compass-agent/ (new project) — main.py + .env",
    code: [
      {
        language: 'bash',
        code:
          "mkdir compass-agent && cd compass-agent\npython -m venv venv\nsource venv/bin/activate\npip install openai python-dotenv\necho 'OPENAI_API_KEY=sk-your-key-here' > .env",
      },
      {
        language: 'python',
        filename: 'main.py',
        code:
          "import sys\nfrom dotenv import load_dotenv\nfrom openai import OpenAI\n\nload_dotenv()\nclient = OpenAI()\nMODEL = \"gpt-4o-mini\"\n\nSYSTEM_PROMPT = \"\"\"You are Compass, a helpful, honest research and task assistant.\nBe clear and concise. If you don't know something, say so plainly.\"\"\"\n\ndef ask_compass(question: str) -> str:\n    response = client.chat.completions.create(\n        model=MODEL,\n        max_tokens=400,\n        messages=[\n            {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n            {\"role\": \"user\", \"content\": question},\n        ],\n    )\n    return response.choices[0].message.content\n\ndef main():\n    question = sys.argv[1] if len(sys.argv) > 1 else \"What can you help me with?\"\n    print(f\"You: {question}\")\n    reply = ask_compass(question)\n    print(f\"Compass: {reply}\")\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    placement:
      "Create a fresh project folder compass-agent/. Add .env with your real key (never commit it — add .env to a .gitignore file). Save main.py at the project root. Run it with python main.py \"your question here\".",
    implementation:
      "ask_compass() is the ONE function every future lesson calls or extends — keeping it isolated now (rather than inlining the API call in main()) means Lesson 6 can slot tool-use logic INSIDE it without restructuring anything. SYSTEM_PROMPT and MODEL are deliberately separate, named module-level values, since SYSTEM_PROMPT will grow across the course (tools, memory instructions, planning rules all get appended here later) and MODEL becomes the ONE place to swap providers later (e.g. changing to a Groq or Gemini model name). sys.argv[1] lets you ask a different question from the command line each run, rather than editing code every time — sys.argv[0] is always the script name itself, so the first real argument is at index 1.",
    expectedResult:
      "Running python main.py \"What is Paris famous for?\" prints your question, then a real, generated answer from Compass — your agent's first working brain.",
    connects:
      "This ask_compass() function, SYSTEM_PROMPT, and MODEL constant are the foundation for the entire course. Lesson 2 makes the personality more deliberate through prompt-engineering technique; by Lesson 6, tools plug directly into this same function.",
  },

  quiz: [
    { id: 'c1q1', kind: 'concept', prompt: 'What is the key difference between an agent and a plain chatbot?', options: ['Agents are always faster', 'An agent can take actions (via tools), not just produce text', 'Chatbots don’t use LLMs', 'There is no real difference'], answerIndex: 1, explanation: "The defining trait of an agent is the ability to act, not just respond with text." },
    { id: 'c1q2', kind: 'concept', prompt: 'What are the steps of the basic agent loop?', options: ['Input -> output only', 'Input -> decide -> (act -> re-decide)* -> final answer', 'Train -> deploy -> monitor', 'Login -> query -> logout'], answerIndex: 1, explanation: "The loop lets an agent take zero or more actions before producing a final answer." },
    { id: 'c1q3', kind: 'code_reading', prompt: 'What does a message with role "system" configure in an API call?', options: ['The max token count', 'The AI’s role/behaviour for the whole conversation', 'The API key', 'The response format only'], answerIndex: 1, explanation: "The system message sets persona/tone/rules that apply across the conversation." },
    { id: 'c1q4', kind: 'application', prompt: 'Where should a real API key be stored?', options: ['Hard-coded in the script', 'In an environment variable (e.g. a .env file, never committed)', 'In a public comment', 'In the response text'], answerIndex: 1, explanation: "Environment variables keep secrets out of source code." },
    { id: 'c1q5', kind: 'debug', prompt: 'A student’s script raises an authentication error even though they set OPENAI_API_KEY in .env. Likely cause?', options: ['The API is down', 'They forgot to call load_dotenv() before creating the client', 'max_tokens is too high', 'The system message is missing'], answerIndex: 1, explanation: "Without load_dotenv(), the .env file's values never actually become environment variables the SDK can read." },
    { id: 'c1q6', kind: 'concept', prompt: 'Why can’t an LLM alone answer "what’s the weather right now"?', options: ['It’s technically impossible for any AI', 'It only knows its training data + the conversation — no live tool means no live data', 'Weather questions are against policy', 'It requires a system message'], answerIndex: 1, explanation: "Without a tool (like a weather API), the model has no way to fetch live, current data." },
    { id: 'c1q7', kind: 'application', prompt: 'Why isolate the API call inside an ask_compass() function instead of inlining it in main()?', options: ['No real reason', 'So later lessons (tools, memory) can extend this ONE function without restructuring the whole file', 'Functions are required by Python', 'It makes the file longer for no benefit'], answerIndex: 1, explanation: "A single, focused function is the natural place to grow Compass's capabilities lesson by lesson." },
    { id: 'c1q8', kind: 'output', prompt: 'Given the code shown, what does sys.argv[1] represent?', options: ['The script’s filename', 'The first command-line argument after the script name', 'The API key', 'The system prompt'], answerIndex: 1, explanation: "sys.argv[0] is the script path, sys.argv[1] is the first real argument passed on the command line." },
    { id: 'c1q9', kind: 'project', prompt: "Why does Compass's system prompt explicitly say if you don't know something, say so plainly?", options: ['It’s required syntax', 'To discourage the model from confidently making things up (hallucinating)', 'It slows down responses', 'It has no real effect'], answerIndex: 1, explanation: "An explicit honesty instruction is a real prompt-engineering technique to reduce confident-but-wrong answers." },
    { id: 'c1q10', kind: 'concept', prompt: 'Why does this course build Compass on the openai-package SDK shape specifically, even for a beginner course?', options: ['Other providers don’t support agents', 'That SDK shape is an OpenAI-compatible standard — the same code works unchanged with OpenAI, Groq, and Gemini by swapping base_url', 'It’s the only provider with a Python SDK', 'It’s required for Streamlit'], answerIndex: 1, explanation: "The concept lesson explains this SDK shape is a genuinely portable standard across multiple providers, not locked to one." },
  ],

  homework: {
    task:
      "Extend ask_compass() to accept an optional style parameter ('brief' | 'detailed') and adjust the system prompt to match, so Compass can answer the same question two different ways.",
    requirements: [
      "Add a style parameter to ask_compass(question, style='brief').",
      "Build a slightly different system prompt string depending on style (brief = 1-2 sentences; detailed = a fuller paragraph).",
      "Test the SAME question with both styles and confirm the replies noticeably differ in length/depth.",
    ],
    expectedOutcome:
      "Calling ask_compass('Explain agents', 'brief') and ask_compass('Explain agents', 'detailed') produce genuinely different-length, appropriately-styled answers.",
    extends: 'final',
    // Lesson 1 has no previous lesson, so no previousHomeworkHint here.
  },
};
