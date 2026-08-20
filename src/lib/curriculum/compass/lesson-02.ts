import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 2 — LLM Fundamentals: Tokens, Context & Temperature
 * Module 1 (What Are AI Agents?) · Lesson 2 of 30
 */
export const lesson02: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 1,
  lessonIndex: 1,
  globalNumber: 2,
  name: 'LLM fundamentals: tokens, context, temperature',
  title: 'Under the Hood — Tokens, Context Windows & Temperature',
  subtitle: "Understand the three settings that control how Compass thinks and how much it can remember.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what tokens are, why every model has a context window limit, and how temperature and max_tokens shape an agent's output.",
    sections: [
      {
        heading: 'Tokens — the unit an LLM actually works in',
        body:
          "An LLM doesn't read words — it reads tokens, small chunks of text (often a word, part of a word, or punctuation). 'agents' might be one token; 'unbelievable' might split into 2-3. Both your input AND the model's output are measured and billed in tokens, which is why max_tokens and prompt length matter for cost and speed.",
      },
      {
        heading: 'The context window',
        body:
          "Every model has a MAXIMUM number of tokens it can consider at once — the context window (covering the system message, conversation history, and the reply together). If a conversation grows past this limit, older messages must be trimmed or summarized, or the request fails. This is exactly why Module 3 (Memory) becomes necessary — Compass can't just keep every message forever.",
      },
      {
        heading: 'max_tokens — capping the reply',
        body:
          "max_tokens limits how long the MODEL's reply can be (not the input). Too low and Compass gets cut off mid-sentence; too high wastes cost on a short answer that didn't need the room. A good default scales with the task: ~150-300 for a quick answer, more for something like a written plan.",
        code: {
          language: 'python',
          code:
            "# A short factual question doesn't need much room:\nmax_tokens = 150\n\n# A multi-step plan needs more:\nmax_tokens = 800",
        },
      },
      {
        heading: 'Temperature — predictable vs creative',
        body:
          "temperature (0 to 1, sometimes up to 2 depending on provider) controls randomness in the model's word choices. Low (0-0.3) gives consistent, focused, repeatable-feeling answers — good for factual Q&A or code. Higher (0.7-1) gives more varied, creative phrasing — good for brainstorming or writing. Compass, as a research assistant, should lean LOW — users want reliable answers, not surprising ones.",
        code: {
          language: 'python',
          code:
            "response = client.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    max_tokens=300,\n    temperature=0.2,   # Compass: focused, consistent answers\n    messages=[{\"role\": \"user\", \"content\": question}],\n)",
        },
      },
      {
        heading: 'Choosing a model — and staying provider-agnostic',
        body:
          "Different models trade off speed, cost, and capability. A fast, cheaper model suits simple lookups; a more capable model suits complex reasoning or planning. Because Compass talks to any OpenAI-compatible provider through the same client shape, this choice is just a MODEL constant — swapping to a Groq-hosted open-weight model or a Gemini model for cost or speed reasons means changing one string, not rewriting logic. Production agents often ROUTE between models by task difficulty, a technique you'll see named explicitly in later, more advanced material. For now, Compass uses one consistent model throughout.",
      },
    ],
    keyTerms: [
      { term: 'Token', definition: "The small chunk of text (word/sub-word/punctuation) an LLM actually processes and is billed by." },
      { term: 'Context window', definition: "The maximum number of tokens (input + output combined) a model can consider at once." },
      { term: 'max_tokens', definition: "A parameter capping how long the model's REPLY can be." },
      { term: 'Temperature', definition: "A parameter controlling randomness/creativity in the model's output; lower = more consistent." },
      { term: 'Model routing', definition: "Choosing a cheaper/faster or more capable model based on task difficulty (a production technique)." },
    ],
    commonMistakes: [
      "Assuming tokens = words 1-to-1 — they don't map cleanly, especially for unusual words or non-English text.",
      "Setting max_tokens too low for the task, causing replies to cut off mid-sentence.",
      "Using a high temperature for a factual assistant like Compass, causing inconsistent answers to the same question.",
      "Forgetting the context window is FINITE — a long-running conversation eventually needs trimming or summarizing.",
      "Not accounting for BOTH input and output tokens when estimating cost — both count.",
    ],
    takeaways: [
      "LLMs process tokens, not words; both input and output are measured in them.",
      "The context window is a hard limit on total tokens per request.",
      "max_tokens caps the reply length; scale it to the task.",
      "Lower temperature = consistent/focused; higher = varied/creative.",
      "Compass uses a low temperature since reliability matters more than variety for a research assistant.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A temperature comparison script',
    objective:
      "See temperature's real effect by asking the SAME question at two different settings and comparing the outputs.",
    instructions: [
      "Write a script that calls the API twice with the same prompt.",
      "First call: temperature 0. Second call: temperature 0.9.",
      "Run it a few times and compare — note whether the low-temperature answer stays consistent across runs.",
    ],
    code: [
      {
        language: 'python',
        filename: 'temperature_test.py',
        code:
          "from dotenv import load_dotenv\nfrom openai import OpenAI\n\nload_dotenv()\nclient = OpenAI()\n\ndef ask(temperature: float) -> str:\n    response = client.chat.completions.create(\n        model=\"gpt-4o-mini\",\n        max_tokens=100,\n        temperature=temperature,\n        messages=[{\"role\": \"user\", \"content\": \"Give me one creative name for a coffee shop.\"}],\n    )\n    return response.choices[0].message.content\n\ndef main():\n    print(\"temp 0:  \", ask(0))\n    print(\"temp 0.9:\", ask(0.9))\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "Both calls send the IDENTICAL prompt — the only difference is the temperature parameter. Running this script several times shows temperature 0 producing very similar (often near-identical) answers each run, while temperature 0.9 produces genuinely different, more varied names each time. This makes the abstract concept concrete: temperature isn't a mysterious setting, it's a direct dial on output variety you can watch change in real time.",
    expectedOutput:
      "Two coffee-shop names print — the temp-0 one stays roughly the same across repeated runs; the temp-0.9 one changes noticeably each run.",
    learned: [
      "How to pass and compare the temperature parameter.",
      "The observable difference between low and high temperature.",
      "Why consistency vs creativity is a real, controllable tradeoff.",
      "How to structure a quick A/B comparison script.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's API call gets tuned parameters — a sensible temperature and a task-aware max_tokens — plus a token-usage log for cost awareness.",
    why:
      "Lesson 1's ask_compass() used defaults. A real agent tunes these deliberately: Compass should feel consistent and reliable, and a developer should be able to SEE roughly what each call costs.",
    fileLocation: "compass-agent/main.py (update ask_compass)",
    code: [
      {
        language: 'python',
        filename: 'main.py (update ask_compass)',
        code:
          "def ask_compass(question: str) -> str:\n    response = client.chat.completions.create(\n        model=MODEL,\n        max_tokens=400,\n        temperature=0.2,   # consistent, focused answers for a research assistant\n        messages=[\n            {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n            {\"role\": \"user\", \"content\": question},\n        ],\n    )\n\n    # Cheap cost awareness: log token usage every call.\n    usage = response.usage\n    print(f\"[usage] input: {usage.prompt_tokens} tokens, output: {usage.completion_tokens} tokens\")\n\n    return response.choices[0].message.content",
      },
    ],
    placement:
      "In main.py, replace the client.chat.completions.create call inside ask_compass() with the version above — add temperature=0.2 and the usage print line right after the response arrives, before returning the text.",
    implementation:
      "temperature=0.2 locks in the low-randomness behaviour a research assistant needs — the SAME question should get a similarly reliable answer each time, not a lottery. response.usage is returned by the API alongside the reply and reports exactly how many prompt (input) and completion (output) tokens that specific call used; printing it gives you a real, visible sense of cost per interaction as you keep building Compass, instead of cost being an invisible abstraction.",
    expectedResult:
      "Running Compass now prints a usage line like '[usage] input: 42 tokens, output: 88 tokens' before every answer, and asking the same factual question twice in a row gives noticeably consistent responses.",
    connects:
      "Token-awareness matters even more once Module 3 adds conversation history (more tokens per call) and Module 4 adds multi-step reasoning (multiple calls per question) — this lesson's habit of watching usage carries through the whole course.",
  },

  quiz: [
    { id: 'c2q1', kind: 'concept', prompt: 'What is a token, in the context of an LLM?', options: ['A billing currency only', 'The small text chunk (word/sub-word/punctuation) the model actually processes', 'A type of API key', 'A conversation ID'], answerIndex: 1, explanation: "Tokens are the units of text the model reads and generates; billing is a consequence of that, not the definition." },
    { id: 'c2q2', kind: 'concept', prompt: 'What does the context window limit?', options: ['How many API keys you can have', 'The total tokens (input + output) a model can consider in one request', 'The number of tools available', 'The temperature range'], answerIndex: 1, explanation: "The context window is a hard cap on total tokens per request." },
    { id: 'c2q3', kind: 'application', prompt: 'A student wants Compass to give the SAME reliable answer to a factual question every time. Which temperature fits best?', options: ['0.9', 'Close to 0 (e.g. 0.2)', '2.0', 'Temperature doesn’t affect consistency'], answerIndex: 1, explanation: "Low temperature reduces randomness, producing more consistent answers." },
    { id: 'c2q4', kind: 'debug', prompt: "A reply keeps cutting off mid-sentence. Most likely fix?", options: ['Lower the temperature', 'Increase max_tokens', 'Change the model', 'Remove the system message'], answerIndex: 1, explanation: "max_tokens caps the reply length; too low truncates longer answers." },
    { id: 'c2q5', kind: 'code_reading', prompt: 'What does response.usage.completion_tokens tell you?', options: ['How many tokens were in the user’s question', 'How many tokens the MODEL’s reply used', 'The temperature setting', 'The model name'], answerIndex: 1, explanation: "usage.completion_tokens reports the token count of the generated reply specifically." },
    { id: 'c2q6', kind: 'concept', prompt: 'Why might a long-running conversation eventually fail or need trimming?', options: ['The API has a daily limit only', 'The accumulated tokens can exceed the context window', 'Temperature drifts over time', 'It never happens'], answerIndex: 1, explanation: "As conversation history grows, total tokens can exceed what the context window allows." },
    { id: 'c2q7', kind: 'application', prompt: 'Why does Compass use a LOWER max_tokens for a quick factual question than for a multi-step plan?', options: ['Random choice', 'To match the reply length to the task, avoiding cut-off answers or wasted cost', 'max_tokens must always be the same', 'It has no real effect on anything'], answerIndex: 1, explanation: "Scaling max_tokens to the expected answer length balances completeness and cost." },
    { id: 'c2q8', kind: 'output', prompt: 'Running the temperature mini-project TWICE at temperature 0, you should see…', options: ['Two wildly different names', 'Very similar or identical names both times', 'An error the second time', 'No output at all'], answerIndex: 1, explanation: "Near-zero temperature produces highly consistent output across repeated identical calls." },
    { id: 'c2q9', kind: 'project', prompt: "Why does logging token usage matter for Compass specifically, going forward?", options: ['It’s purely decorative', 'Because Module 3 (memory) and Module 4 (planning) will increase tokens-per-call, so tracking usage early builds a useful habit', 'Usage logging is required by the SDK', 'It replaces the need for an API key'], answerIndex: 1, explanation: "As Compass grows more capable, understanding cost/usage becomes increasingly important — this habit starts now." },
    { id: 'c2q10', kind: 'concept', prompt: 'What is "model routing"?', options: ['A CSS layout technique', 'Choosing a cheaper/faster or more capable model depending on task difficulty', 'A type of API error', 'A memory management strategy'], answerIndex: 1, explanation: "Model routing balances cost/speed against capability by picking the right model per task." },
  ],

  homework: {
    task:
      "Add an ask_compass_with_budget(question, max_tokens) variant that lets the CALLER choose max_tokens per question, and test it with a short factual question (low budget) and an open-ended one (higher budget).",
    requirements: [
      "The function should accept question and max_tokens as parameters.",
      "Keep temperature and the system message the same as ask_compass().",
      "Test with max_tokens=60 for a factual question and max_tokens=500 for something like 'explain how agents plan multi-step tasks'.",
    ],
    expectedOutcome:
      "The low-budget call returns a short, complete answer (not cut off); the high-budget call returns a fuller explanation, both using the same reliable temperature.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 1,
      hint: "Lesson 1 asked you to extend ask_compass() with a style parameter ('brief' | 'detailed') that changes the system prompt accordingly.",
      steps: [
        "Add a second parameter: def ask_compass(question: str, style: str = 'brief') -> str:",
        "Build the system string conditionally: brief asks for 1-2 sentences; detailed asks for a fuller paragraph with an example.",
        "Pass the chosen string as the system-role message content in the messages list.",
        "Call ask_compass('Explain agents', 'brief') and ask_compass('Explain agents', 'detailed') and compare the output lengths.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "def ask_compass(question: str, style: str = \"brief\") -> str:\n    if style == \"detailed\":\n        system = \"You are Compass, a helpful research assistant. Give a full, clear paragraph with an example.\"\n        max_tokens = 500\n    else:\n        system = \"You are Compass, a helpful research assistant. Answer in 1-2 sentences.\"\n        max_tokens = 150\n\n    response = client.chat.completions.create(\n        model=MODEL,\n        max_tokens=max_tokens,\n        messages=[\n            {\"role\": \"system\", \"content\": system},\n            {\"role\": \"user\", \"content\": question},\n        ],\n    )\n    return response.choices[0].message.content",
        },
      ],
    },
  },
};
