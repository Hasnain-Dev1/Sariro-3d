import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 20 — Chain-of-Thought Reasoning
 * Module 4 (Planning + Reasoning) · Lesson 20 of 30
 */
export const lesson20: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 2,
  globalNumber: 20,
  name: 'Chain-of-thought reasoning',
  title: 'Chain-of-Thought — Step-by-Step Reasoning Without Tools',
  subtitle: "Get more reliable answers on reasoning-heavy questions by asking Claude to think step by step, even with no tools involved.",

  concept: {
    durationMin: 15,
    summary:
      "Learn Chain-of-Thought (CoT) prompting: explicitly asking a model to reason step by step before giving a final answer, and when this technique helps most.",
    sections: [
      {
        heading: 'What Chain-of-Thought is',
        body:
          "Chain-of-Thought prompting simply asks the model to show its work — 'think step by step' — before answering. Unlike ReAct (Lesson 19), CoT doesn't necessarily involve any tool calls at all; it's about the model reasoning through logic, arithmetic, or multi-step deduction purely in text.",
        code: {
          language: 'python',
          code:
            'COT_SYSTEM_PROMPT = """When answering questions that involve multiple steps, logic, \nor arithmetic, think through the problem step by step BEFORE giving your final answer.\n\nFormat:\nReasoning: <your step-by-step thinking>\nAnswer: <your final, concise answer>"""',
        },
      },
      {
        heading: 'Why it works',
        body:
          "Models generate text one token at a time, using everything generated so far as context for what comes next. Skipping straight to a final answer means the model has to get a multi-step problem right 'in one shot' with no intermediate work to build on. Generating reasoning FIRST gives it scratch space — much like a person working through a math problem on paper rather than in their head.",
      },
      {
        heading: 'When CoT helps — and when it doesn’t',
        body:
          "CoT gives its biggest boost on problems with multiple logical/arithmetic steps, ambiguous wording that benefits from being worked through, or classification/multi-criteria decisions. For simple factual lookups ('what's the capital of France'), it adds nothing but latency and length — recognizing which category a question falls into is itself a useful judgment call, not something to apply blindly everywhere.",
      },
      {
        heading: 'Parsing out just the final answer',
        body:
          "When Compass needs the ANSWER programmatically (not just to show the user the full reasoning), a simple parse of the 'Answer:' line does the job without needing structured output APIs.",
        code: {
          language: 'python',
          code:
            'import re\n\ndef extract_final_answer(text: str) -> str:\n    match = re.search(r"Answer:\\s*(.+)", text, re.DOTALL)\n    return match.group(1).strip() if match else text.strip()',
        },
      },
    ],
    keyTerms: [
      { term: 'Chain-of-Thought (CoT)', definition: "A prompting technique asking a model to reason step by step in text before giving a final answer." },
      { term: 'Scratch space', definition: "Intermediate reasoning text a model generates that becomes context for its own next tokens, improving multi-step accuracy." },
    ],
    commonMistakes: [
      "Applying CoT to every question regardless of complexity, adding unnecessary length to simple answers.",
      "Confusing CoT with ReAct — CoT is pure reasoning, ReAct interleaves reasoning WITH tool calls.",
      "Forgetting to parse out just the final answer when the reasoning text itself shouldn't be shown to the user.",
      "Assuming CoT guarantees a correct answer — it improves reliability on complex problems, it isn't a correctness guarantee.",
    ],
    takeaways: [
      "Chain-of-Thought asks a model to reason step by step in text before answering, no tools required.",
      "It works because generated reasoning becomes context for the model's own next tokens.",
      "CoT helps most on multi-step, logical, or ambiguous problems — not simple factual lookups.",
      "A simple regex can parse out just the final answer when only that's needed programmatically.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Comparing CoT vs. direct answers',
    objective: "See the practical difference CoT makes on a multi-step logic problem versus a direct-answer prompt.",
    instructions: [
      "Pick a multi-step word problem (e.g. a simple age/math riddle).",
      "Ask Claude the SAME question once with a direct-answer system prompt, once with the COT_SYSTEM_PROMPT.",
      "Compare the two outputs and note which is more reliable.",
    ],
    code: [
      {
        language: 'python',
        filename: 'cot_test.py',
        code:
          'question = (\n    "Sara is twice as old as her brother. In 6 years, she will be "\n    "1.5 times his age. How old is Sara now?"\n)\n\ndirect = client.messages.create(\n    model="claude-sonnet-4-5",\n    max_tokens=200,\n    system="Answer concisely with just the final answer.",\n    messages=[{"role": "user", "content": question}],\n)\n\ncot = client.messages.create(\n    model="claude-sonnet-4-5",\n    max_tokens=400,\n    system=COT_SYSTEM_PROMPT,\n    messages=[{"role": "user", "content": question}],\n)\n\nprint("Direct:", direct.content[0].text)\nprint("\\nCoT:", cot.content[0].text)',
      },
    ],
    explanation:
      "This side-by-side comparison makes the CoT effect concrete rather than theoretical: the direct-answer version has to produce the correct number immediately, while the CoT version sets up an equation, solves it step by step, then states the answer — visibly showing the 'scratch space' benefit in action.",
    expectedOutput: "Both attempt an answer; the CoT version shows visible algebra steps (e.g. defining variables, an equation, solving) before its final answer line.",
    learned: [
      "How to structure a direct comparison test between two prompting strategies.",
      "What a CoT response actually looks like versus a direct one.",
      "Why multi-step word problems are a good testbed for this technique.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gains a reason_through() helper that applies Chain-of-Thought specifically for complex/logical questions, separate from its normal tool-use loop.",
    why:
      "Not every hard question needs a tool — some just need careful step-by-step reasoning. Giving Compass this as a distinct capability rounds out its reasoning toolkit.",
    fileLocation: 'compass-agent/main.py',
    code: [
      {
        language: 'python',
        filename: 'main.py',
        code:
          'import re\n\nCOT_SYSTEM_PROMPT = """When answering questions that involve multiple steps, logic, \nor arithmetic, think through the problem step by step BEFORE giving your final answer.\n\nFormat:\nReasoning: <your step-by-step thinking>\nAnswer: <your final, concise answer>"""\n\n\ndef extract_final_answer(text: str) -> str:\n    match = re.search(r"Answer:\\s*(.+)", text, re.DOTALL)\n    return match.group(1).strip() if match else text.strip()\n\n\ndef reason_through(question: str, show_reasoning: bool = True) -> str:\n    response = client.messages.create(\n        model="claude-sonnet-4-5",\n        max_tokens=600,\n        system=COT_SYSTEM_PROMPT,\n        messages=[{"role": "user", "content": question}],\n    )\n    full_text = response.content[0].text\n\n    if show_reasoning:\n        print(f"\\n{full_text}\\n")\n\n    return extract_final_answer(full_text)',
      },
    ],
    placement: "Add reason_through() alongside your other agent functions in main.py.",
    implementation:
      "reason_through() is deliberately kept SEPARATE from the main tool-use loop — it's a focused, single-purpose call for when a question is purely a reasoning problem with no need for external information. show_reasoning defaults to True so the user sees Compass's full working, matching the transparency principle established across Modules 2 and 3; setting it False lets calling code get back just the clean final answer via extract_final_answer().",
    expectedResult:
      "Calling reason_through('If a train travels 60 mph for 2.5 hours, how far does it go?') prints the full Reasoning/Answer breakdown and returns just '150 miles' as the clean extracted answer.",
    connects:
      "CoT gives Compass focused step-by-step reasoning for logic-heavy questions. Lesson 21 combines this kind of reasoning WITH multi-step task decomposition — the Plan+Execute pattern — for tasks too large to reason through in a single pass.",
  },

  quiz: [
    { id: 'c20q1', kind: 'concept', prompt: 'What is Chain-of-Thought prompting?', options: ['A tool-calling pattern', 'Asking a model to reason step by step in text before giving a final answer', 'A memory technique', 'A deployment strategy'], answerIndex: 1, explanation: 'CoT is purely about eliciting step-by-step reasoning text before the answer.' },
    { id: 'c20q2', kind: 'concept', prompt: 'How does CoT differ from ReAct?', options: ['They’re identical', 'CoT is pure reasoning with no tools; ReAct interleaves reasoning WITH tool calls', 'ReAct never involves reasoning', 'CoT requires an API flag'], answerIndex: 1, explanation: "ReAct's Action step specifically involves tool calls; CoT is reasoning alone." },
    { id: 'c20q3', kind: 'application', prompt: 'Why does generating reasoning text FIRST improve a model’s final answer?', options: ['It doesn’t', 'The reasoning becomes context for the model’s own subsequent tokens, like scratch work', 'It only affects formatting', 'It slows the model down on purpose with no benefit'], answerIndex: 1, explanation: 'Models predict tokens using everything generated so far, so visible reasoning genuinely informs the answer that follows.' },
    { id: 'c20q4', kind: 'application', prompt: 'When does CoT add little value?', options: ['Multi-step logic problems', 'Simple factual lookups like "what’s the capital of France"', 'Ambiguous wording', 'Multi-criteria decisions'], answerIndex: 1, explanation: 'Simple factual questions don’t benefit from step-by-step reasoning and just gain unnecessary length/latency.' },
    { id: 'c20q5', kind: 'code_reading', prompt: 'What does extract_final_answer() do if no "Answer:" line is found?', options: ['Raises an exception', 'Falls back to returning the full stripped text', 'Returns an empty string', 'Returns None'], answerIndex: 1, explanation: 'The `if match else text.strip()` fallback handles the case where the pattern isn’t found.' },
    { id: 'c20q6', kind: 'debug', prompt: 'reason_through() returns a full paragraph including "Reasoning:" text instead of just the final answer. What’s the likely cause?', options: ['The API is broken', 'The response text doesn’t match the expected "Answer:" format, so the regex fails and falls back to the full text', 'show_reasoning is set wrong', 'It’s intended behavior'], answerIndex: 1, explanation: "If the model doesn't follow the requested Reasoning/Answer format exactly, the regex won't find a match." },
    { id: 'c20q7', kind: 'project', prompt: 'Why does reason_through() default show_reasoning to True?', options: ['No particular reason', 'To match the transparency principle used throughout the course (tool use, memory recall)', 'It’s required by the API', 'To make responses slower'], answerIndex: 1, explanation: 'Showing the reasoning by default is consistent with the transparency pattern from Modules 2 and 3.' },
    { id: 'c20q8', kind: 'output', prompt: 'For "If a train travels 60 mph for 2.5 hours, how far does it go?", what should reason_through() return?', options: ['The full reasoning paragraph', "'150 miles' (or equivalent), the extracted final answer", 'An error', 'Nothing'], answerIndex: 1, explanation: '60 * 2.5 = 150, and extract_final_answer() pulls just that final line.' },
    { id: 'c20q9', kind: 'concept', prompt: 'Is reason_through() part of the main tool-use loop?', options: ['Yes, always', 'No, it’s deliberately kept separate for pure reasoning questions with no external info needed', 'It replaces the tool-use loop', 'It requires tools to function'], answerIndex: 1, explanation: 'reason_through() is a focused, standalone function for logic-only questions.' },
    { id: 'c20q10', kind: 'concept', prompt: 'What does Lesson 21 combine with this kind of reasoning?', options: ['Deployment', 'Multi-step task decomposition — the Plan+Execute pattern', 'A user interface', 'Voice input'], answerIndex: 1, explanation: 'Plan+Execute breaks a large task into steps, building on reasoning covered here.' },
  ],

  homework: {
    task: "Add a should_use_cot(question) heuristic that decides whether a question is reasoning-heavy enough to warrant reason_through(), versus being answered directly.",
    requirements: [
      "Use simple signals: presence of numbers plus comparison words ('twice', 'more than'), multi-clause sentences, or question words like 'how many' combined with a calculation.",
      "Return a bool.",
      "Test it against at least 3 reasoning-heavy and 3 simple factual questions.",
    ],
    expectedOutcome: "A should_use_cot() function that correctly routes reasoning-heavy questions to reason_through() and simple ones to a direct answer.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 19,
      hint: "Lesson 19 asked you to add a turn counter to printed thoughts, like '[thought 1] ...', '[thought 2] ...'.",
      steps: [
        "Initialize turn = 1 before the loop in run_agent_loop.",
        "Include it in the print: print(f\"\\n[thought {turn}] {thought}\").",
        "Increment turn at the end of each loop iteration.",
      ],
    },
  },
};
