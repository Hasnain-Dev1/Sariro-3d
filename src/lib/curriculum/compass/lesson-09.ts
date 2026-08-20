import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 9 — Multi-Step Reasoning & Tool Selection
 * Module 2 (Tool Use) · Lesson 9 of 30
 */
export const lesson09: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 2,
  lessonIndex: 2,
  globalNumber: 9,
  name: 'Multi-step reasoning',
  title: 'Multi-Step Reasoning — When One Tool Isn’t Enough',
  subtitle: "Build a real loop so Compass can call several tools in sequence to answer one question.",

  concept: {
    durationMin: 15,
    summary:
      "Learn why some questions need more than one tool call, and build a general-purpose loop in Python that keeps going until the model has everything it needs.",
    sections: [
      {
        heading: 'When one round trip isn’t enough',
        body:
          "Lesson 8's code handles exactly ONE tool call. But consider: 'What is the word count of \"twelve times eleven\" multiplied by the answer to that multiplication?' — a genuinely tricky question that might need the calculator AND the word counter, in sequence, with each result informing the next step. A real agent needs to keep looping through tool calls until the model is actually DONE, not just handle one and stop.",
      },
      {
        heading: 'The generalized agent loop',
        body:
          "Instead of one if stop_reason == 'tool_use', wrap the whole exchange in a loop: keep calling the API, and EVERY time the response wants a tool, execute it, append the result, and call again — repeat until stop_reason is something other than 'tool_use' (like 'end_turn', meaning the model is finished).",
        code: {
          language: 'python',
          code:
            "messages = [{\"role\": \"user\", \"content\": question}]\n\nwhile True:\n    response = client.messages.create(\n        model=\"claude-sonnet-5\", max_tokens=400, tools=TOOLS, messages=messages,\n    )\n    messages.append({\"role\": \"assistant\", \"content\": response.content})\n\n    if response.stop_reason != \"tool_use\":\n        return response.content[0].text\n\n    tool_block = next(b for b in response.content if b.type == \"tool_use\")\n    tool_output = execute_tool(tool_block.name, tool_block.input)\n    messages.append({\"role\": \"user\", \"content\": [{\"type\": \"tool_result\", \"tool_use_id\": tool_block.id, \"content\": tool_output}]})",
        },
      },
      {
        heading: 'A dispatch function for multiple tools',
        body:
          "As tool count grows, a chain of if/elif gets messy. A dispatch function keeps things tidy and makes adding a new tool a one-line change.",
        code: {
          language: 'python',
          code:
            "def execute_tool(name: str, tool_input: dict) -> str:\n    if name == \"calculator\":\n        return run_calculator(tool_input[\"expression\"])\n    if name == \"get_word_count\":\n        return run_word_count(tool_input[\"text\"])\n    return \"Error: unknown tool.\"",
        },
      },
      {
        heading: 'Preventing an infinite loop',
        body:
          "A buggy prompt or an unusual edge case could theoretically cause the model to keep requesting tools forever. Real agent code always caps the number of loop iterations — if you hit the cap, stop and return whatever you have, rather than looping indefinitely.",
        code: {
          language: 'python',
          code:
            "MAX_TURNS = 6\nfor turn in range(MAX_TURNS):\n    ...   # loop body\nelse:\n    return \"That question needed more steps than I could complete.\"   # cap reached",
        },
      },
      {
        heading: 'This is the real shape of an agent',
        body:
          "This loop — call, check, act, repeat until done — IS what people mean by 'an AI agent' in the broadest sense. Everything after this lesson (memory, planning, deployment) adds capability around this same core loop, not a different one.",
      },
    ],
    keyTerms: [
      { term: 'Agent loop (generalized)', definition: "Repeatedly calling the model and executing requested tools until it stops requesting them." },
      { term: 'Dispatch function', definition: "A function routing execution to the right tool implementation based on the tool's name." },
      { term: 'Turn cap', definition: "A maximum number of loop iterations, preventing a runaway/infinite tool-calling loop." },
      { term: 'end_turn', definition: "A stop_reason meaning the model has finished and produced a final answer." },
    ],
    commonMistakes: [
      "Handling only one tool call and assuming that's always enough — some questions genuinely need several in sequence.",
      "Forgetting to append the assistant's tool_use response into the messages list before continuing the loop.",
      "No turn cap, risking a runaway loop on an edge case or bug.",
      "A long if/elif chain for tool dispatch that gets unmanageable as more tools are added.",
      "Not accumulating messages correctly — losing earlier context between loop iterations.",
    ],
    takeaways: [
      "Some questions need MULTIPLE tool calls in sequence, not just one.",
      "A for loop (with a turn cap) repeats: call → check stop_reason → execute if needed → repeat.",
      "A dispatch function keeps multi-tool routing clean as tools grow.",
      "Always cap loop iterations to prevent runaway behaviour.",
      "This general loop IS the core shape of an agent — everything later builds around it.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A two-tool chained question',
    objective:
      "Prove the multi-step loop works by asking a question that genuinely needs two sequential tool calls.",
    instructions: [
      "Reuse the calculator and get_time tools from earlier lessons.",
      "Ask something like 'What is 12 times 4, and what year is it?' — plausibly two separate tool calls.",
      "Run it through a loop (not a single if) and print each tool call as it happens.",
    ],
    code: [
      {
        language: 'python',
        filename: 'multi_tool.py',
        code:
          "from datetime import datetime\nfrom dotenv import load_dotenv\nimport anthropic\n\nload_dotenv()\nclient = anthropic.Anthropic()\nTOOLS = [calculator_tool, get_time_tool]   # reuse from earlier lessons\n\ndef execute_tool(name: str, tool_input: dict) -> str:\n    if name == \"calculator\":\n        return str(eval(tool_input[\"expression\"], {\"__builtins__\": {}}, {}))\n    if name == \"get_time\":\n        return str(datetime.now())\n    return \"unknown tool\"\n\ndef main():\n    messages = [{\"role\": \"user\", \"content\": \"What is 12 times 4, and what year is it right now?\"}]\n\n    for _ in range(5):\n        response = client.messages.create(\n            model=\"claude-sonnet-5\", max_tokens=300, tools=TOOLS, messages=messages,\n        )\n        messages.append({\"role\": \"assistant\", \"content\": response.content})\n\n        if response.stop_reason != \"tool_use\":\n            print(\"FINAL:\", response.content[0].text)\n            return\n\n        tool_block = next(b for b in response.content if b.type == \"tool_use\")\n        output = execute_tool(tool_block.name, tool_block.input)\n        print(f\"[tool] {tool_block.name} ->\", output)\n        messages.append({\"role\": \"user\", \"content\": [{\"type\": \"tool_result\", \"tool_use_id\": tool_block.id, \"content\": output}]})\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "The messages list accumulates the ENTIRE conversation — every assistant tool_use turn and every user tool_result turn — so the model always has full context. The for loop with a cap of 5 keeps calling the API; each time stop_reason is 'tool_use', it dispatches, executes, prints, and appends the result, then loops again. Only when stop_reason is something else does it print the FINAL answer and return. Watching the console shows (likely) two separate '[tool] ...' print lines before the final combined answer — direct proof the loop handled multiple sequential tool calls correctly.",
    expectedOutput:
      "Console shows something like '[tool] calculator -> 48', then '[tool] get_time -> ...', then 'FINAL: 12 times 4 is 48, and the current year is 2026.'",
    learned: [
      "How to build a real repeating agent loop.",
      "How to accumulate conversation state across multiple tool calls.",
      "How a turn cap prevents runaway loops.",
      "How to observe multi-step reasoning happening live.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's tool handling becomes a real, general-purpose loop — it can chain multiple tool calls for one question, with a dispatch function and a safety turn cap.",
    why:
      "This replaces Lesson 8's single-round-trip logic with the genuine, general shape of an agent — handling ANY number of sequential tool calls a question might need, not just exactly one.",
    fileLocation: "compass-agent/main.py (replace the tool_use handling with a loop)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add a dispatch function)',
        code:
          "def execute_tool(name: str, tool_input: dict) -> str:\n    if name == \"calculator\":\n        return run_calculator(tool_input[\"expression\"])\n    if name == \"get_word_count\":\n        return run_word_count(tool_input[\"text\"])\n    return \"Error: unknown tool.\"",
      },
      {
        language: 'python',
        filename: 'main.py (replace ask_compass with a looping version)',
        code:
          "MAX_TURNS = 6\n\ndef ask_compass(question: str) -> str:\n    messages = [{\"role\": \"user\", \"content\": question}]\n\n    try:\n        for _ in range(MAX_TURNS):\n            response = with_retry(lambda: client.messages.create(\n                model=\"claude-sonnet-5\", max_tokens=400, temperature=0.2,\n                system=SYSTEM_PROMPT, tools=TOOLS, messages=messages,\n            ))\n            messages.append({\"role\": \"assistant\", \"content\": response.content})\n\n            if response.stop_reason != \"tool_use\":\n                return response.content[0].text\n\n            tool_block = next((b for b in response.content if b.type == \"tool_use\"), None)\n            if not tool_block:\n                return \"Something went wrong reading the tool request.\"\n\n            tool_output = execute_tool(tool_block.name, tool_block.input)\n            print(f\"[tool] {tool_block.name}({tool_block.input}) = {tool_output}\")\n            messages.append({\"role\": \"user\", \"content\": [{\"type\": \"tool_result\", \"tool_use_id\": tool_block.id, \"content\": tool_output}]})\n\n        return \"That question needed more steps than I could complete — try breaking it into smaller questions.\"\n    except Exception as err:\n        print(f\"[error] Compass could not get a response: {err}\")\n        return \"Sorry, I'm having trouble right now. Please try again in a moment.\"",
      },
    ],
    placement:
      "Add the execute_tool dispatch function near your tool implementations. Replace the ENTIRE ask_compass() function (Lesson 8's single-round-trip version) with the looping version above — it fully supersedes it.",
    implementation:
      "messages now lives at the TOP of the function and accumulates every turn — the model, the tool result, the model again — exactly as in the mini-project. The for _ in range(MAX_TURNS) loop caps how many API calls one question can trigger, and the return AFTER the loop (Python's for/else-equivalent falling through naturally) is the safety fallback if a question genuinely needs more steps than the cap allows (rare, but handled explicitly rather than looping forever). execute_tool replaces Lesson 8's inline if/else, so adding a third tool later means writing its implementation and adding ONE line to execute_tool — nothing else in ask_compass() changes.",
    expectedResult:
      "Asking Compass a question needing two tools (e.g. a calculation AND a word count) now correctly chains both tool calls, printing each, before returning one combined, correct final answer.",
    connects:
      "Compass's core loop is now genuinely agent-shaped. Lesson 10 gives it a THIRD real capability (a simple web-search tool) to keep reinforcing multi-tool selection, ahead of Module 3 adding memory so Compass can also recall PAST conversations, not just chain actions within one.",
  },

  quiz: [
    { id: 'c9q1', kind: 'concept', prompt: 'Why does a single if stop_reason == "tool_use" sometimes fall short?', options: ['It never falls short', 'Some questions genuinely need MULTIPLE sequential tool calls, not just one', 'It’s a syntax error', 'stop_reason is unreliable'], answerIndex: 1, explanation: "A question can require chaining several tool results together, which a single check can't handle." },
    { id: 'c9q2', kind: 'code_reading', prompt: 'Why does the loop append the assistant’s tool_use response into messages BEFORE checking stop_reason again?', options: ['It’s unnecessary', 'So the full conversation history (including that turn) is available for the NEXT call in the loop', 'It deletes old messages', 'It only affects logging'], answerIndex: 1, explanation: "Each loop iteration needs the complete, accumulated conversation to reason correctly." },
    { id: 'c9q3', kind: 'application', prompt: 'What does a turn cap (MAX_TURNS) protect against?', options: ['High token costs only', 'A runaway/infinite loop if the model keeps requesting tools indefinitely', 'Invalid API keys', 'Slow network connections'], answerIndex: 1, explanation: "A hard cap guarantees the loop eventually stops, even in an unusual edge case." },
    { id: 'c9q4', kind: 'debug', prompt: 'A student’s loop never terminates on a normal question. Likely bug?', options: ['The turn cap is too low', 'stop_reason is being checked incorrectly, so it never recognises "end_turn"', 'Too many tools are defined', 'temperature is too low'], answerIndex: 1, explanation: "If the exit condition (stop_reason != 'tool_use') is broken, the loop can't recognise when the model is actually done." },
    { id: 'c9q5', kind: 'concept', prompt: 'What is a dispatch function for, in this context?', options: ['Sending emails', 'Routing execution to the correct tool implementation based on its name', 'Formatting the system prompt', 'Managing API keys'], answerIndex: 1, explanation: "It keeps multi-tool routing organized as more tools are added." },
    { id: 'c9q6', kind: 'application', prompt: 'Why is a dispatch function better than a long if/elif chain as tools grow?', options: ['No real difference', 'It stays easy to extend — adding a tool means one new line, not restructuring a growing chain', 'if/elif chains are invalid syntax', 'Dispatch functions run faster at the CPU level'], answerIndex: 1, explanation: "A clean routing structure scales better as the number of tools increases." },
    { id: 'c9q7', kind: 'output', prompt: 'For a question needing 2 tool calls, roughly how many total API calls does the loop make?', options: ['1', '3 (2 tool-requesting calls + 1 final answer call)', '0', 'Exactly 2, always'], answerIndex: 1, explanation: "Each tool_use response triggers another call; the final call (with both results available) produces the answer." },
    { id: 'c9q8', kind: 'debug', prompt: 'The loop hits MAX_TURNS without finishing. What does the final project’s code do?', options: ['Crashes', 'Returns an explicit fallback message after the loop, rather than looping forever', 'Silently returns nothing', 'Retries indefinitely'], answerIndex: 1, explanation: "The code explicitly handles the exhausted-turns case with a clear fallback response." },
    { id: 'c9q9', kind: 'project', prompt: "Why does Compass's messages list need to be built OUTSIDE the for loop, not recreated each iteration?", options: ['No real reason', 'So conversation history accumulates correctly across turns instead of resetting each time', 'It’s required Python syntax', 'It only affects performance'], answerIndex: 1, explanation: "Recreating messages each iteration would lose all prior context, breaking multi-step reasoning." },
    { id: 'c9q10', kind: 'concept', prompt: 'Why is this generalized loop described as the "real shape" of an agent?', options: ['It’s just one implementation detail among many equally valid ones', 'Call -> check -> act -> repeat until done IS the core pattern every capability in this course builds around', 'Agents don’t actually use loops', 'It only applies to Compass specifically'], answerIndex: 1, explanation: "This call/check/act/repeat structure is the foundational pattern behind agent behaviour generally, not just this course's implementation." },
  ],

  homework: {
    task:
      "Add printing that shows the TOTAL number of turns a question took to answer, so you can observe how simple vs. multi-step questions differ in practice.",
    requirements: [
      "Track a turn counter inside the loop (increment it each iteration).",
      "When the final answer is returned, print something like '[info] answered in 2 turn(s)'.",
      "Test with a simple question (should be ~1 turn) and a multi-tool question (should be 2+ turns) and compare.",
    ],
    expectedOutcome:
      "A simple factual question prints '1 turn(s)'; a question needing two tools prints '2 turn(s)' (or more) — visible, concrete evidence of multi-step reasoning happening.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 8,
      hint: "Lesson 8 asked you to implement run_word_count(text) for real and wire it into the (at that point, single-round-trip) tool_use branch.",
      steps: [
        "Write def run_word_count(text: str) -> str: return str(len(text.strip().split())).",
        "In the tool_use branch, add an elif for tool_block.name == 'get_word_count', calling run_word_count with the text argument.",
        "Test with a real sentence and manually count the words to confirm the result is correct.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "def run_word_count(text: str) -> str:\n    words = [w for w in text.strip().split() if w]\n    return str(len(words))",
        },
      ],
    },
  },
};
