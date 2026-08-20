import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 3 — Prompt Engineering Basics
 * Module 1 (What Are AI Agents?) · Lesson 3 of 30
 */
export const lesson03: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 1,
  lessonIndex: 2,
  globalNumber: 3,
  name: 'Prompt engineering basics',
  title: 'Prompt Engineering — Directing Compass Precisely',
  subtitle: "Turn Compass's system prompt into a real, specific instruction set instead of a vague identity.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the core techniques of prompt engineering — role, format, examples, and constraints — and apply them to sharpen Compass's behaviour.",
    sections: [
      {
        heading: 'Prompt engineering is clarity, not magic',
        body:
          "Writing a good prompt is like writing a clear spec for a developer: the more specific and unambiguous you are, the more reliably you get what you want. There's no secret trick — just being deliberate about role, format, and boundaries.",
      },
      {
        heading: 'Role — who is the model right now?',
        body:
          "Compass's current system prompt says 'You are Compass, a helpful research assistant' — a good start, but vague. A stronger role statement names the DOMAIN and the STANDARD: 'You are Compass, a research assistant that gives accurate, sourced-feeling, concise answers for students and professionals.'",
      },
      {
        heading: 'Format instructions — controlling the shape of the answer',
        body:
          "'Answer the question' leaves the shape open; 'Answer in 2-3 sentences, then one bolded key takeaway' tells the model EXACTLY what shape a good answer takes. Specific format instructions dramatically improve consistency across many different questions.",
        code: {
          language: 'text',
          code:
            "VAGUE:    'Explain the topic.'\nSPECIFIC: 'Explain the topic in 3 short paragraphs: what it is, why it matters, one example.'",
        },
      },
      {
        heading: 'Few-shot examples — showing, not just telling',
        body:
          "Sometimes the clearest instruction is an EXAMPLE of exactly the output you want. Including one or two example question/answer pairs in the prompt ('few-shot' prompting) often produces more consistent formatting than a text description alone — especially for structured output.",
        code: {
          language: 'text',
          code:
            "Example format:\nQ: What is a token?\nA: A token is the small text unit an LLM processes — roughly a word or word-piece.\n\nNow answer the user's question in the same style.",
        },
      },
      {
        heading: 'Constraints — what NOT to do',
        body:
          "Explicit boundaries keep an assistant on-task and safe: 'Never make up a source', 'If the question is outside your expertise, say so', 'Don't answer questions unrelated to research or learning'. Constraints matter more once real users start typing anything they want — which is why they're worth building in EARLY, not as an afterthought.",
      },
    ],
    keyTerms: [
      { term: 'Prompt engineering', definition: "Writing clear, specific instructions to reliably get useful output from an AI model." },
      { term: 'Role prompt', definition: "The part of a system prompt establishing WHO the model is acting as." },
      { term: 'Format instruction', definition: "An instruction specifying the exact shape/structure of a good answer." },
      { term: 'Few-shot prompting', definition: "Including example input/output pairs in the prompt to demonstrate the desired style." },
      { term: 'Constraint', definition: "An explicit boundary telling the model what NOT to do." },
    ],
    commonMistakes: [
      "Writing a vague role ('be helpful') and expecting consistent, specific behaviour.",
      "Never specifying a format, leading to unpredictably long or short, differently-structured answers.",
      "Assuming few-shot examples aren't worth the extra prompt length — they often pay for themselves in consistency.",
      "Adding constraints only after something goes wrong, instead of anticipating obvious ones upfront.",
      "Cramming too many unrelated instructions into one prompt instead of a few clear, prioritized rules.",
    ],
    takeaways: [
      "Prompt engineering is about specificity, not tricks.",
      "A strong role statement names the domain and standard, not just a label.",
      "Format instructions control the SHAPE of every answer.",
      "Few-shot examples often out-perform a written description alone.",
      "Constraints (what not to do) should be designed in from the start.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Before/after prompt comparison',
    objective:
      "Feel the real impact of prompt specificity by comparing a vague system prompt against a well-engineered one on the same question.",
    instructions: [
      "Write a script that asks the SAME question twice: once with a vague system prompt, once with a specific one (role + format + one constraint).",
      "Compare the two replies for length, structure, and tone.",
    ],
    code: [
      {
        language: 'python',
        filename: 'prompt_compare.py',
        code:
          "from dotenv import load_dotenv\nfrom openai import OpenAI\n\nload_dotenv()\nclient = OpenAI()\nMODEL = \"gpt-4o-mini\"\n\nVAGUE = \"You are a helpful assistant.\"\nSPECIFIC = \"\"\"You are a research assistant.\nAlways answer in exactly 2 sentences.\nIf you are not confident in an answer, say so explicitly.\"\"\"\n\ndef ask(system: str) -> str:\n    response = client.chat.completions.create(\n        model=MODEL,\n        max_tokens=200,\n        temperature=0.2,\n        messages=[\n            {\"role\": \"system\", \"content\": system},\n            {\"role\": \"user\", \"content\": \"What causes ocean tides?\"},\n        ],\n    )\n    return response.choices[0].message.content\n\ndef main():\n    print(\"VAGUE:   \", ask(VAGUE))\n    print(\"SPECIFIC:\", ask(SPECIFIC))\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "Both calls ask the identical question with identical temperature and max_tokens — the ONLY variable is the system message content. The VAGUE reply could be any length or structure the model judges reasonable. The SPECIFIC reply is constrained to exactly 2 sentences and carries an explicit honesty instruction — you can directly observe the prompt's wording shaping the output's shape, which is the clearest way to internalize why prompt engineering matters.",
    expectedOutput:
      "The vague reply is a normal, unconstrained-length explanation. The specific reply is exactly 2 sentences, noticeably more disciplined in structure.",
    learned: [
      "How prompt specificity directly shapes output format.",
      "How to isolate ONE variable (the system message) in a comparison.",
      "The observable effect of a format instruction.",
      "Why writing precise prompts is a real, practiced skill.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's system prompt is properly engineered — a specific role, a consistent answer format, and real constraints.",
    why:
      "Lesson 1's system prompt was a good start but vague. A production-quality agent needs a DELIBERATELY engineered prompt so its behaviour stays consistent no matter what a user asks.",
    fileLocation: "compass-agent/main.py (replace SYSTEM_PROMPT)",
    code: [
      {
        language: 'python',
        filename: 'main.py (replace SYSTEM_PROMPT)',
        code:
          "SYSTEM_PROMPT = \"\"\"You are Compass, a research and task assistant for students and professionals.\n\nFormat: Answer in 2-4 sentences. If the question calls for steps, use a short numbered list instead.\n\nHonesty: If you are not confident in an answer, or it requires current/live information you don't have, say so plainly rather than guessing.\n\nScope: If a question is unrelated to research, learning, or tasks (e.g. personal medical or legal advice), politely decline and suggest a more appropriate resource.\"\"\"",
      },
    ],
    placement:
      "In main.py, replace the existing SYSTEM_PROMPT constant with the version above. No other code changes are needed — ask_compass() already sends this constant as the first, system-role message.",
    implementation:
      "The new prompt has four clearly separated directives, each addressing one concept from this lesson: a specific ROLE (research/task assistant, for a named audience), a FORMAT rule (length + a numbered-list exception for step-based answers), an HONESTY constraint (directly reducing hallucination risk), and a SCOPE constraint (keeping Compass focused and avoiding giving advice it shouldn't). Structuring the prompt as labeled sections (Format:, Honesty:, Scope:) — rather than one run-on paragraph — also tends to make instructions easier for the model to follow consistently.",
    expectedResult:
      "Asking Compass a normal question now gets a tight 2-4 sentence answer; asking something step-based gets a numbered list; asking something out of scope gets a polite decline instead of an attempted answer.",
    connects:
      "This engineered prompt is the foundation every later module extends: Lesson 6 (Tool Use) adds instructions about WHEN to use a tool; Module 3 adds memory-handling rules; Module 4 adds planning/reasoning instructions — always appended to this same, now-solid base.",
  },

  quiz: [
    { id: 'c3q1', kind: 'concept', prompt: 'What is prompt engineering fundamentally about?', options: ['Tricking the model into ignoring rules', 'Writing clear, specific instructions to reliably shape output', 'A type of API authentication', 'Reducing token usage only'], answerIndex: 1, explanation: "It's about clarity and specificity, not exploiting the model." },
    { id: 'c3q2', kind: 'application', prompt: 'Which system prompt is more likely to produce a consistent-length answer?', options: ['"Be helpful."', '"Answer in exactly 2-4 sentences."', '"You are an AI."', '"Answer questions."'], answerIndex: 1, explanation: "A specific length/format instruction constrains every reply's shape consistently." },
    { id: 'c3q3', kind: 'concept', prompt: 'What is a "constraint" in a system prompt?', options: ['A required API parameter', 'An explicit instruction about what the model should NOT do', 'A CSS rule', 'A billing limit'], answerIndex: 1, explanation: "A constraint sets an explicit boundary, like declining out-of-scope questions." },
    { id: 'c3q4', kind: 'application', prompt: 'What is few-shot prompting?', options: ['Using very few tokens', 'Including example input/output pairs in the prompt to demonstrate the desired style', 'Asking the model five separate questions', 'A model with limited training'], answerIndex: 1, explanation: "Few-shot prompting shows examples of the desired output rather than only describing it." },
    { id: 'c3q5', kind: 'debug', prompt: "Compass sometimes answers a personal medical question it shouldn't. What's the fix?", options: ['Lower the temperature', 'Add an explicit scope constraint declining that category of question', 'Increase max_tokens', 'Remove the role statement'], answerIndex: 1, explanation: "A scope constraint tells the model explicitly to decline categories outside its intended use." },
    { id: 'c3q6', kind: 'code_reading', prompt: 'In the final project’s system prompt, what does the "Honesty" section accomplish?', options: ['Nothing measurable', 'Reduces the chance of confidently wrong (hallucinated) answers by permitting uncertainty', 'Increases response length', 'Changes the model used'], answerIndex: 1, explanation: "Explicitly permitting 'I'm not sure' reduces pressure on the model to fabricate confidence." },
    { id: 'c3q7', kind: 'application', prompt: 'Why label prompt sections (Format:, Honesty:, Scope:) instead of one long paragraph?', options: ['No real benefit', 'Clear structure tends to make multiple instructions easier for the model to follow consistently', 'It’s required syntax', 'It reduces token count significantly'], answerIndex: 1, explanation: "Structured, labeled instructions are a practical technique for improving instruction-following." },
    { id: 'c3q8', kind: 'output', prompt: 'With the engineered prompt, what should happen if you ask Compass a step-based question like "how do I set up a Python project"?', options: ['A single long paragraph', 'A short numbered list, per the format rule', 'A refusal', 'Exactly 2 sentences regardless'], answerIndex: 1, explanation: "The format rule explicitly carves out a numbered-list exception for step-based answers." },
    { id: 'c3q9', kind: 'project', prompt: "Why is Compass's system prompt described as something later modules will EXTEND rather than replace?", options: ['It will be deleted eventually', 'Tool-use, memory, and planning instructions build on top of this same solid base rather than starting over', 'System prompts can only be set once', 'There’s no real reason'], answerIndex: 1, explanation: "Each module adds new directives to the same evolving system message, rather than redesigning it from scratch." },
    { id: 'c3q10', kind: 'concept', prompt: 'Is prompt engineering typically a one-shot or iterative process?', options: ['One-shot, never revisited', 'Iterative — write, test on real questions, refine', 'Random guessing', 'Irrelevant once the API key works'], answerIndex: 1, explanation: "Good prompts usually emerge from testing real outputs and refining based on what you observe." },
  ],

  homework: {
    task:
      "Add a one-shot example to Compass's system prompt showing the exact numbered-list format expected for step-based answers, and test it with a new step-based question to confirm the formatting is followed precisely.",
    requirements: [
      "Add a short example Q/A pair to the system prompt demonstrating a step-based answer in numbered-list form.",
      "Keep the example short (3-4 numbered steps) so it doesn't bloat the prompt.",
      "Test with a DIFFERENT step-based question than the example and confirm the format matches.",
    ],
    expectedOutcome:
      "A new step-based question produces a numbered list matching the style of your example, even though the topic is different.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 2,
      hint: "Lesson 2 asked you to add ask_compass_with_budget(question, max_tokens), letting the caller control max_tokens per call.",
      steps: [
        "Add a new function: def ask_compass_with_budget(question: str, max_tokens: int) -> str:",
        "Copy ask_compass's body, but use the max_tokens parameter instead of a fixed value.",
        "Keep temperature and the system message the same as ask_compass.",
        "Call it once with max_tokens=60 (short question) and once with max_tokens=500 (open-ended question), and compare.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "def ask_compass_with_budget(question: str, max_tokens: int) -> str:\n    response = client.chat.completions.create(\n        model=MODEL,\n        max_tokens=max_tokens,\n        temperature=0.2,\n        messages=[\n            {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n            {\"role\": \"user\", \"content\": question},\n        ],\n    )\n    return response.choices[0].message.content",
        },
      ],
    },
  },
};
