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
        heading: 'Extracting the thought from Claude’s response',
        body:
          "With Claude's tool-use API, the model's `text` content blocks (returned alongside any `tool_use` blocks) naturally contain this reasoning when prompted for it — there's no special API flag, just a well-designed system prompt and reading the text blocks Claude already returns.",
        code: {
          language: 'python',
          code:
            'def extract_thought(response) -> str | None:\n    for block in response.content:\n        if block.type == "text" and block.text.strip():\n            return block.text.strip()\n    return None',
        },
      },
    ],
    keyTerms: [
      { term: 'ReAct', definition: "A prompting pattern that interleaves explicit reasoning (Thought) with tool calls (Action) and their results (Observation)." },
      { term: 'Reasoning trace', definition: "The visible sequence of Thought/Action/Observation steps a ReAct agent produces while working through a task." },
    ],
    commonMistakes: [
      "Assuming ReAct requires a special API parameter — it's purely a prompting pattern using existing text + tool_use blocks.",
      "Writing a ReAct system prompt but never actually surfacing the Thought text to the user, losing the transparency benefit.",
      "Expecting ReAct to eliminate all reasoning errors — it improves reliability, it doesn't guarantee correctness.",
      "Forcing ReAct-style thinking on every trivial question, adding unnecessary verbosity to simple requests.",
    ],
    takeaways: [
      "ReAct interleaves Thought, Action, and Observation instead of jumping straight to tool calls.",
      "Visible reasoning genuinely improves a model's own multi-step behavior, not just user-facing transparency.",
      "Claude's text content blocks naturally carry this reasoning when the system prompt asks for it.",
      "ReAct is a prompting pattern, not a special API feature.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Extracting and printing thoughts',
    objective: "Practise pulling the reasoning text out of a Claude response alongside any tool_use blocks.",
    instructions: [
      "Write extract_thought(response) as shown in the concept section.",
      "Given a mock response object with mixed text/tool_use blocks, verify it returns only the text.",
      "Print the thought clearly labeled before showing the tool call that follows it.",
    ],
    code: [
      {
        language: 'python',
        filename: 'thought_test.py',
        code:
          'from types import SimpleNamespace\n\ndef extract_thought(response) -> str | None:\n    for block in response.content:\n        if block.type == "text" and block.text.strip():\n            return block.text.strip()\n    return None\n\nmock_response = SimpleNamespace(content=[\n    SimpleNamespace(type="text", text="I need to check today\'s date first."),\n    SimpleNamespace(type="tool_use", name="get_date", input={}),\n])\n\nthought = extract_thought(mock_response)\nprint(f"Thought: {thought}")',
      },
    ],
    explanation:
      "extract_thought() loops through response.content and returns the FIRST non-empty text block, ignoring tool_use blocks. This mirrors exactly how Claude structures a ReAct-style response: reasoning as text, then the tool call as a separate content block in the same message.",
    expectedOutput: "Thought: I need to check today's date first.",
    learned: [
      "How to separate reasoning text from tool-call content in a Claude response.",
      "Why text and tool_use blocks coexist in the same API response.",
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
          'REACT_SYSTEM_PROMPT = """You are Compass, a careful reasoning assistant.\nFor any non-trivial request, think step by step BEFORE using a tool.\n\nFollow this pattern:\nThought: <what you need to figure out, and why>\nAction: <call the relevant tool>\n...repeat as needed...\nThought: I now have enough information to answer.\nFinal Answer: <your answer to the user>"""\n\n\ndef extract_thought(response) -> str | None:\n    for block in response.content:\n        if block.type == "text" and block.text.strip():\n            return block.text.strip()\n    return None\n\n\ndef run_agent_loop(user_message: str) -> str:\n    messages = [{"role": "user", "content": user_message}]\n\n    for _ in range(MAX_TURNS):\n        response = client.messages.create(\n            model="claude-sonnet-4-5",\n            system=build_system_prompt(user_message, base=REACT_SYSTEM_PROMPT),\n            max_tokens=1024,\n            tools=ALL_TOOLS,\n            messages=messages,\n        )\n\n        thought = extract_thought(response)\n        if thought:\n            print(f"\\n[thought] {thought}")\n\n        if response.stop_reason != "tool_use":\n            return thought or "(no answer)"\n\n        messages.append({"role": "assistant", "content": response.content})\n        tool_results = []\n        for block in response.content:\n            if block.type == "tool_use":\n                result = execute_tool(block.name, block.input)\n                tool_results.append({\n                    "type": "tool_result",\n                    "tool_use_id": block.id,\n                    "content": str(result),\n                })\n        messages.append({"role": "user", "content": tool_results})\n\n    return "I wasn\'t able to finish reasoning through this in time."',
      },
    ],
    placement: "Add REACT_SYSTEM_PROMPT and extract_thought() near your other constants/helpers, then replace your Module 2 agent loop with run_agent_loop() above.",
    implementation:
      "build_system_prompt() (from Lesson 17) gets a small signature change to accept a `base` prompt to layer memory context onto — here it's REACT_SYSTEM_PROMPT instead of the plain SYSTEM_PROMPT. Each turn through the loop, extract_thought() pulls out and prints any reasoning text BEFORE the tool call it precedes, giving a live, readable trace of Compass's reasoning as it works through a multi-step question.",
    expectedResult:
      "Asking a genuinely multi-part question now produces a visible sequence like '[thought] I need to check the weather in Tokyo first' → tool call → '[thought] Now I need NYC's weather too' → tool call → a final synthesized answer.",
    connects:
      "ReAct gives Compass a visible, structured reasoning trace. Lesson 20 builds on this with Chain-of-Thought prompting for reasoning that doesn't require any tool calls at all — pure step-by-step thinking through a problem.",
  },

  quiz: [
    { id: 'c19q1', kind: 'concept', prompt: 'What does ReAct stand for?', options: ['React and Act', 'Reasoning + Acting', 'Reactive Actions', 'Real Actions'], answerIndex: 1, explanation: 'ReAct interleaves explicit reasoning with tool actions.' },
    { id: 'c19q2', kind: 'concept', prompt: 'Is ReAct a special API parameter or a prompting pattern?', options: ['A special API parameter', 'A prompting pattern using existing text + tool_use content blocks', 'A separate model', 'A Python library'], answerIndex: 1, explanation: 'ReAct is achieved purely through how the system prompt is written and how existing response content is read.' },
    { id: 'c19q3', kind: 'application', prompt: 'Why does visible reasoning improve the MODEL’s own behavior, not just user trust?', options: ['It doesn’t, it’s purely cosmetic', 'Generating reasoning tokens first measurably improves the model’s own subsequent decisions', 'It slows down the model on purpose', 'It only affects formatting'], answerIndex: 1, explanation: "This mirrors the structured-prompting principle from Lesson 3 — reasoning-first genuinely changes output quality." },
    { id: 'c19q4', kind: 'code_reading', prompt: 'What does extract_thought() return if response.content has no text blocks at all?', options: ['An empty string', 'None', 'Raises an exception', 'The tool name'], answerIndex: 1, explanation: 'The function falls through the loop and returns None if no non-empty text block is found.' },
    { id: 'c19q5', kind: 'debug', prompt: 'A ReAct agent skips printing any thought for a simple factual question. What’s the likely cause?', options: ['A bug', 'The model reasonably judged the question trivial and answered directly without needing to reason first', 'The API is broken', 'Tools are misconfigured'], answerIndex: 1, explanation: 'Not every question needs multi-step reasoning; simple ones can be answered directly.' },
    { id: 'c19q6', kind: 'output', prompt: 'In run_agent_loop, when is a thought printed relative to its corresponding tool call?', options: ['After the tool call', 'Before the tool call, since it’s extracted from the same response that requests the call', 'Never printed', 'Only at the very end'], answerIndex: 1, explanation: "The thought and the tool_use block arrive in the SAME response, and the thought is printed before executing the tool." },
    { id: 'c19q7', kind: 'application', prompt: 'Why would forcing ReAct-style reasoning on every trivial question be a mistake?', options: ['It isn’t a mistake', 'It adds unnecessary verbosity and latency for questions that don’t need multi-step reasoning', 'ReAct only works on complex questions technically', 'It breaks the API'], answerIndex: 1, explanation: 'ReAct is most valuable for genuinely multi-part or ambiguous tasks, not simple lookups.' },
    { id: 'c19q8', kind: 'concept', prompt: 'What comes after Thought and Action in the ReAct pattern?', options: ['Reflection', 'Observation (the tool result)', 'Summary', 'Nothing'], answerIndex: 1, explanation: 'The loop is Thought -> Action -> Observation, repeating as needed.' },
    { id: 'c19q9', kind: 'project', prompt: 'Why does build_system_prompt() need a `base` parameter now?', options: ['No reason', 'So it can layer memory context onto EITHER the plain SYSTEM_PROMPT or the new REACT_SYSTEM_PROMPT', 'To remove memory entirely', 'It’s unrelated to memory'], answerIndex: 1, explanation: 'This lets ReAct and memory-aware prompting compose together instead of one replacing the other.' },
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
