import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 19 — ReAct: Reasoning + Acting
 * Module 4 (Planning + Reasoning) · Lesson 19 of 30
 */
export const lesson19: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 4,
  lessonIndex: 1,
  globalNumber: 19,
  name: 'ReAct — reasoning and acting together',
  title: 'ReAct — Interleaving Thought and Action',
  subtitle: "Give Compass an explicit reasoning trace before every tool call, so it plans out loud.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the ReAct (Reason + Act) pattern: prompting the model to think through WHY it's using a tool before it uses it, producing more reliable multi-step behavior.",
    sections: [
      {
        heading: 'The problem with reacting instantly',
        body:
          "Compass's current tool loop (Module 2) works, but it reaches for tools reactively — it sees a question, decides on a tool, calls it. For genuinely complex questions ('compare the weather in Tokyo and NYC and tell me which is better for a 3-day trip'), jumping straight to action without a visible plan often means missing steps or doing them in a confusing order.",
      },
      {
        heading: 'The ReAct pattern: Thought → Action → Observation → repeat',
        body:
          "ReAct (from the 2022 paper 'ReAct: Synergizing Reasoning and Acting in Language Models') asks the model to output an explicit THOUGHT ('I need to check the weather in both cities first') before each ACTION (a tool call), then an OBSERVATION (the tool result), then loop. This is done by instructing the model, in the system prompt, to reason in this structure before acting.",
        code: {
          language: 'python',
          code:
            'REACT_SYSTEM_PROMPT = """You are Compass, a careful reasoning assistant.\nFor any non-trivial request, think step by step BEFORE using a tool.\n\nFollow this pattern:\nThought: <what you need to figure out, and why>\nAction: <call the relevant tool>\nObservation: <you will receive the tool result>\n...repeat Thought/Action/Observation as needed...\nThought: I now have enough information to answer.\nFinal Answer: <your answer to the user>\n\nAlways think before acting. Never skip straight to an action for multi-part requests."""',
        },
      },
      {
        heading: 'Why visible reasoning improves reliability',
        body:
          "Making the model articulate its thought before acting isn't just for the user's benefit — it measurably improves the model's OWN behavior. Language models reason better when they generate reasoning tokens first, the same principle behind Lesson 3's structured prompting, now applied specifically to multi-step tool use.",
      },
      {
        heading: 'Extracting the thought from a response',
        body:
          "With the openai package's tool-calling shape, a plain (non-tool) reply's text sits directly at response.choices[0].message.content, so extracting it is a one-line check. But there's a real wrinkle worth understanding: when the model decides to call a tool, message.content is often None or empty, and the tool-call details live in message.tool_calls instead — the SDK doesn't reliably hand back reasoning text and a tool call in the same response the way some other providers' mixed content blocks do. The practical fix is to lean on the ReAct system prompt's own Thought → Action structure: prompt the model to write its Thought as plain text in one turn, THEN call the tool in the next turn. You still get the same visible reasoning-before-acting benefit — it just plays out turn-by-turn across the loop instead of inside a single response.",
        code: {
          language: 'python',
          code:
            'def extract_thought(response) -> str | None:\n    content = response.choices[0].message.content\n    return content.strip() if content and content.strip() else None',
        },
      },
    ],
    keyTerms: [
      { term: 'ReAct', definition: "A prompting pattern that interleaves explicit reasoning (Thought) with tool calls (Action) and their results (Observation)." },
      { term: 'Reasoning trace', definition: "The visible sequence of Thought/Action/Observation steps a ReAct agent produces while working through a task." },
    ],
    commonMistakes: [
      "Assuming ReAct requires a special API parameter — it's purely a prompting pattern built on the model's ordinary text replies and tool calls.",
      "Writing a ReAct system prompt but never actually surfacing the Thought text to the user, losing the transparency benefit.",
      "Expecting ReAct to eliminate all reasoning errors — it improves reliability, it doesn't guarantee correctness.",
      "Assuming a single response will always carry BOTH a Thought and a tool call — with OpenAI-shape tool calling, reasoning text and a tool call often land in separate turns instead.",
      "Forcing ReAct-style thinking on every trivial question, adding unnecessary verbosity to simple requests.",
    ],
    takeaways: [
      "ReAct interleaves Thought, Action, and Observation instead of jumping straight to tool calls.",
      "Visible reasoning genuinely improves a model's own multi-step behavior, not just user-facing transparency.",
      "response.choices[0].message.content carries the reasoning text when the model isn't calling a tool that turn.",
      "With OpenAI-shape tool calling, Thought and Action typically arrive as separate turns, not one mixed response — the ReAct prompt's structure is what makes that work.",
      "ReAct is a prompting pattern, not a special API feature.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Extracting and printing thoughts',
    objective: "Practise pulling the reasoning text out of a plain-text response before a tool call turn happens.",
    instructions: [
      "Write extract_thought(response) as shown in the concept section.",
      "Given a mock response object shaped like a real chat completion, verify it returns the message text.",
      "Print the thought clearly labeled before showing the tool call that follows it on the next turn.",
    ],
    code: [
      {
        language: 'python',
        filename: 'thought_test.py',
        code:
          'from types import SimpleNamespace\n\ndef extract_thought(response) -> str | None:\n    content = response.choices[0].message.content\n    return content.strip() if content and content.strip() else None\n\nmock_response = SimpleNamespace(choices=[\n    SimpleNamespace(message=SimpleNamespace(\n        content="I need to check today\'s date first.",\n        tool_calls=None,\n    ))\n])\n\nthought = extract_thought(mock_response)\nprint(f"Thought: {thought}")',
      },
    ],
    explanation:
      "extract_thought() reads response.choices[0].message.content directly and returns it only if it's non-empty, stripped of whitespace. This mirrors how a ReAct-style loop actually behaves with the openai package: the model writes its Thought as plain text on one turn (content set, tool_calls empty), then calls a tool on the NEXT turn (content usually empty, tool_calls set) — extract_thought() just needs to recognize which kind of turn it's looking at.",
    expectedOutput: "Thought: I need to check today's date first.",
    learned: [
      "How to pull reasoning text out of a chat completion response.",
      "Why content and tool_calls tend to show up on separate turns rather than together.",
      "The mechanical foundation for surfacing ReAct-style thoughts to users.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass adopts the ReAct system prompt and prints each Thought before showing the corresponding tool call.",
    why:
      "This is the foundation Module 4 builds on: making Compass's reasoning process visible and more reliable before adding planning and self-reflection on top.",
    fileLocation: 'compass-agent/main.py',
    code: [
      {
        language: 'python',
        filename: 'main.py',
        code:
          'import json\nfrom openai import OpenAI\n\nclient = OpenAI()\nMODEL = "gpt-4o-mini"\n\nREACT_SYSTEM_PROMPT = """You are Compass, a careful reasoning assistant.\nFor any non-trivial request, think step by step BEFORE using a tool.\n\nFollow this pattern:\nThought: <what you need to figure out, and why>\nAction: <call the relevant tool>\n...repeat as needed...\nThought: I now have enough information to answer.\nFinal Answer: <your answer to the user>"""\n\n\ndef extract_thought(response) -> str | None:\n    content = response.choices[0].message.content\n    return content.strip() if content and content.strip() else None\n\n\ndef run_agent_loop(user_message: str) -> str:\n    messages = [\n        {"role": "system", "content": REACT_SYSTEM_PROMPT},\n        {"role": "user", "content": user_message},\n    ]\n\n    for _ in range(MAX_TURNS):\n        response = client.chat.completions.create(\n            model=MODEL, max_tokens=1024, tools=ALL_TOOLS, messages=messages,\n        )\n        message = response.choices[0].message\n        thought = extract_thought(response)\n        if thought:\n            print(f"\\n[thought] {thought}")\n\n        if not message.tool_calls:\n            return message.content or (thought or "(no answer)")\n\n        messages.append(message)\n        for tool_call in message.tool_calls:\n            args = json.loads(tool_call.function.arguments)\n            result = execute_tool(tool_call.function.name, args)\n            messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": str(result)})\n\n    return "I wasn\'t able to finish reasoning through this in time."',
      },
    ],
    placement: "Add REACT_SYSTEM_PROMPT and extract_thought() near your other constants/helpers, then replace your Module 2 agent loop with run_agent_loop() above.",
    implementation:
      "REACT_SYSTEM_PROMPT leads off messages as the first, role:\"system\" entry — any memory context recalled earlier (Lesson 17) gets folded into that same system string before the loop starts, so ReAct reasoning and memory-awareness compose together rather than one replacing the other. Each turn through the loop, extract_thought() pulls out and prints any reasoning text; because the openai-shape API tends to separate a Thought turn (text, no tool_calls) from an Action turn (tool_calls, little or no text), the printed trace naturally shows a thought BEFORE the tool call it precedes, even though they arrive across two turns rather than one response.",
    expectedResult:
      "Asking a genuinely multi-part question now produces a visible sequence like '[thought] I need to check the weather in Tokyo first' → tool call → '[thought] Now I need NYC's weather too' → tool call → a final synthesized answer.",
    connects:
      "ReAct gives Compass a visible, structured reasoning trace. Lesson 20 builds on this with Chain-of-Thought prompting for reasoning that doesn't require any tool calls at all — pure step-by-step thinking through a problem.",
  },

  quiz: [
    { id: 'c19q1', kind: 'concept', prompt: 'What does ReAct stand for?', options: ['React and Act', 'Reasoning + Acting', 'Reactive Actions', 'Real Actions'], answerIndex: 1, explanation: 'ReAct interleaves explicit reasoning with tool actions.' },
    { id: 'c19q2', kind: 'concept', prompt: 'Is ReAct a special API parameter or a prompting pattern?', options: ['A special API parameter', 'A prompting pattern built on the model’s ordinary text replies and tool calls', 'A separate model', 'A Python library'], answerIndex: 1, explanation: 'ReAct is achieved purely through how the system prompt is written and how ordinary responses are read across turns.' },
    { id: 'c19q3', kind: 'application', prompt: 'Why does visible reasoning improve the MODEL’s own behavior, not just user trust?', options: ['It doesn’t, it’s purely cosmetic', 'Generating reasoning tokens first measurably improves the model’s own subsequent decisions', 'It slows down the model on purpose', 'It only affects formatting'], answerIndex: 1, explanation: "This mirrors the structured-prompting principle from Lesson 3 — reasoning-first genuinely changes output quality." },
    { id: 'c19q4', kind: 'code_reading', prompt: 'What does extract_thought() return if response.choices[0].message.content is None or empty?', options: ['An empty string', 'None', 'Raises an exception', 'The tool name'], answerIndex: 1, explanation: 'The `content and content.strip()` check fails on None/empty, so the function returns None.' },
    { id: 'c19q5', kind: 'debug', prompt: 'A ReAct agent skips printing any thought for a simple factual question. What’s the likely cause?', options: ['A bug', 'The model reasonably judged the question trivial and answered directly without needing to reason first', 'The API is broken', 'Tools are misconfigured'], answerIndex: 1, explanation: 'Not every question needs multi-step reasoning; simple ones can be answered directly.' },
    { id: 'c19q6', kind: 'output', prompt: 'In run_agent_loop, when is a thought printed relative to its corresponding tool call?', options: ['After the tool call', 'Before the tool call, typically on the turn just before the model requests it', 'Never printed', 'Only at the very end'], answerIndex: 1, explanation: "With the openai-shape API, a Thought and its Action usually land on separate turns, and the thought is printed as soon as it's extracted, ahead of the tool call that follows." },
    { id: 'c19q7', kind: 'application', prompt: 'Why would forcing ReAct-style reasoning on every trivial question be a mistake?', options: ['It isn’t a mistake', 'It adds unnecessary verbosity and latency for questions that don’t need multi-step reasoning', 'ReAct only works on complex questions technically', 'It breaks the API'], answerIndex: 1, explanation: 'ReAct is most valuable for genuinely multi-part or ambiguous tasks, not simple lookups.' },
    { id: 'c19q8', kind: 'concept', prompt: 'What comes after Thought and Action in the ReAct pattern?', options: ['Reflection', 'Observation (the tool result)', 'Summary', 'Nothing'], answerIndex: 1, explanation: 'The loop is Thought -> Action -> Observation, repeating as needed.' },
    { id: 'c19q9', kind: 'project', prompt: 'Why does the REACT_SYSTEM_PROMPT get combined with any recalled memory context into ONE system message?', options: ['No reason', 'So the messages list stays valid (one role:"system" entry) while still layering ReAct reasoning AND memory-awareness together', 'To remove memory entirely', 'It’s unrelated to memory'], answerIndex: 1, explanation: 'The openai-shape API expects the system prompt as a single leading message, so ReAct and memory content are combined into that one string.' },
    { id: 'c19q10', kind: 'concept', prompt: 'What does Lesson 20 build on top of ReAct?', options: ['Deployment', 'Chain-of-Thought prompting for pure step-by-step reasoning without tool calls', 'A user interface', 'Memory management'], answerIndex: 1, explanation: 'Chain-of-Thought is the next reasoning pattern, focused on non-tool reasoning.' },
  ],

  homework: {
    task: "Add a turn counter to the printed thoughts, e.g. '[thought 1] ...', '[thought 2] ...', so a multi-step reasoning trace is easy to follow at a glance.",
    requirements: [
      "Track the current turn number inside run_agent_loop's loop.",
      "Include it in the printed thought line.",
      "Test with a question that requires at least 2 tool calls to confirm the numbering increments correctly.",
    ],
    expectedOutcome: "A numbered reasoning trace like '[thought 1] ...', '[thought 2] ...' printed as Compass works through a multi-step question.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 18,
      hint: "Lesson 18 asked you to write a MEMORY.md documenting Compass's memory architecture — the four layers, how save/recall decisions are made, and one honest limitation.",
      steps: [
        "Create MEMORY.md in your project root.",
        "Write one short section per layer: session memory, bounded growth, long-term storage, automatic recall/save.",
        "Add a 'Limitations' section naming at least one honest weakness, like the save heuristic missing unusual phrasings.",
      ],
    },
  },
};
