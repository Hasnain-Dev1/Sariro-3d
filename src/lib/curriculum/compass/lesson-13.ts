import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 13 — Short-Term Memory
 * Module 3 (Memory + Context) · Lesson 13 of 30
 */
export const lesson13: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 3,
  lessonIndex: 0,
  globalNumber: 13,
  name: 'Short-term memory',
  title: 'Short-Term Memory — Remembering Within a Session',
  subtitle: "Give Compass a persistent conversation across multiple questions in the same REPL session.",

  concept: {
    durationMin: 15,
    summary:
      "Understand the difference between within-loop memory (already built) and cross-question session memory, and give Compass the latter.",
    sections: [
      {
        heading: 'What Compass already has vs. what it’s missing',
        body:
          "Lesson 9's messages list accumulates perfectly WITHIN one question's tool-calling loop — but it's recreated FRESH every time ask_compass() is called. Ask 'What is 12 * 4?' then 'What about divided by 2?' and Compass has no idea what 'that' refers to, because each call starts from zero.",
      },
      {
        heading: 'Session memory: one messages list for the whole conversation',
        body:
          "The fix is straightforward: move the messages list OUTSIDE ask_compass() entirely, so it persists across MULTIPLE calls within the same running program (the REPL session) — each new question gets APPENDED, not started fresh.",
        code: {
          language: 'python',
          code:
            "# Move this OUTSIDE ask_compass, at module level:\nconversation_history: list = [{\"role\": \"system\", \"content\": SYSTEM_PROMPT}]\n\ndef ask_compass(question: str) -> str:\n    conversation_history.append({\"role\": \"user\", \"content\": question})\n    # ...loop uses conversation_history instead of a fresh local list...",
        },
      },
      {
        heading: 'Why this changes follow-up questions completely',
        body:
          "With session memory, 'What about divided by 2?' works correctly — the model can see the ENTIRE prior exchange (including the earlier calculation) and understands 'that' refers to it. This is the difference between a stateless Q&A tool and something that feels like an actual ongoing conversation.",
      },
      {
        heading: 'Memory grows — and that has a cost',
        body:
          "Every question now adds to a growing list, which means every SUBSEQUENT API call sends more tokens (the whole history, every time). This directly connects back to Lesson 2's context window concept — a long enough session will eventually need trimming or summarizing, which Lesson 15 addresses.",
      },
      {
        heading: '"Short-term" means within a session, not forever',
        body:
          "This lesson's memory lives only in a Python list in memory — it vanishes the moment the program exits. That's intentional and fine for now: Lesson 16 introduces LONG-term memory that survives across separate program runs (via a real vector-based store), a genuinely different problem tackled later.",
      },
    ],
    keyTerms: [
      { term: 'Session memory', definition: "Conversation history that persists across multiple questions within one running program instance." },
      { term: 'Short-term memory', definition: "Memory that lasts for the current session only, not saved anywhere persistent." },
      { term: 'Stateless', definition: "Describes code (like Lesson 12's ask_compass) that starts fresh every call, with no memory of prior calls." },
    ],
    commonMistakes: [
      "Declaring the messages list INSIDE ask_compass(), recreating it (and losing history) on every call.",
      "Forgetting that a growing conversation means growing token usage on every subsequent call.",
      "Assuming session memory alone solves 'remembering forever' — it's lost when the program exits.",
      "Not appending the user's new question onto the shared history before the loop starts.",
      "Mixing up 'the loop's per-question tool-calling messages' (Lesson 9) with 'the whole session's conversation' (this lesson) — they're related but distinct scopes.",
    ],
    takeaways: [
      "Moving the messages list OUTSIDE ask_compass() gives Compass memory across questions.",
      "Session memory makes follow-up questions ('what about...') work correctly.",
      "A growing conversation means growing token cost per call — a real tradeoff.",
      "Short-term/session memory is NOT persistent across separate program runs.",
      "Long-term, cross-session memory is a distinct problem, solved later in this module.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A follow-up-aware mini chat',
    objective:
      "Prove session memory works by asking a question, then a follow-up that only makes sense with context from the first.",
    instructions: [
      "Write a script with a module-level history list.",
      "Ask 'My favorite color is blue.' — expect an acknowledgment.",
      "THEN ask 'What is my favorite color?' using the SAME accumulated list.",
      "Confirm the second answer correctly references the first message.",
    ],
    code: [
      {
        language: 'python',
        filename: 'memory_test.py',
        code:
          "from dotenv import load_dotenv\nfrom openai import OpenAI\n\nload_dotenv()\nclient = OpenAI()\nMODEL = \"gpt-4o-mini\"\nhistory: list = []\n\ndef ask(question: str) -> str:\n    history.append({\"role\": \"user\", \"content\": question})\n    response = client.chat.completions.create(\n        model=MODEL, max_tokens=200, messages=history,\n    )\n    message = response.choices[0].message\n    history.append(message)\n    return message.content\n\ndef main():\n    print(ask(\"My favorite color is blue.\"))\n    print(ask(\"What is my favorite color?\"))\n\nif __name__ == \"__main__\":\n    main()",
        },
      ],
    explanation:
      "history lives OUTSIDE ask(), so it survives between the two separate calls in main(). Each call appends the new user question, sends the WHOLE accumulated history (not just the latest message), reads the reply, and appends the assistant's message too — building a real, growing conversation. The second question, 'What is my favorite color?', has NO information on its own — the only reason the model can answer correctly is that the first exchange is still present in history when the second call is made.",
    expectedOutput:
      "First reply acknowledges the blue favorite color. Second reply correctly answers 'blue' — proof the model used the earlier context, not a coincidence or guess.",
    learned: [
      "How to build genuine cross-call session memory.",
      "Why history must live outside the function that uses it.",
      "How to verify memory works with a deliberate follow-up test.",
      "That both user AND assistant turns need to be appended to preserve full context.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gains real session memory — the REPL now holds a genuine, ongoing conversation instead of independent, unconnected questions.",
    why:
      "This is one of the most noticeable upgrades in the whole course: users can finally ask natural follow-up questions, exactly like a real conversation with a person who remembers what was just said.",
    fileLocation: "compass-agent/main.py (move messages to module scope, update ask_compass)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add at module level, above ask_compass)',
        code:
          "conversation_history: list = [{\"role\": \"system\", \"content\": SYSTEM_PROMPT}]",
      },
      {
        language: 'python',
        filename: 'main.py (update ask_compass to use it)',
        code:
          "def ask_compass(question: str) -> str:\n    conversation_history.append({\"role\": \"user\", \"content\": question})\n\n    try:\n        for _ in range(MAX_TURNS):\n            response = with_retry(lambda: client.chat.completions.create(\n                model=MODEL, max_tokens=400, temperature=0.2,\n                tools=TOOLS, messages=conversation_history,\n            ))\n            message = response.choices[0].message\n            conversation_history.append(message)\n\n            if not message.tool_calls:\n                return message.content\n\n            tool_call = message.tool_calls[0]\n            try:\n                args = json.loads(tool_call.function.arguments)\n            except (json.JSONDecodeError, TypeError):\n                args = {}\n\n            print(TOOL_LABELS.get(tool_call.function.name, f\"Using {tool_call.function.name}...\"))\n            tool_output = execute_tool(tool_call.function.name, args)\n            conversation_history.append({\"role\": \"tool\", \"tool_call_id\": tool_call.id, \"content\": tool_output})\n\n        return \"That question needed more steps than I could complete.\"\n    except Exception as err:\n        print(f\"[error] Compass could not get a response: {err}\")\n        return \"Sorry, I'm having trouble right now. Please try again in a moment.\"",
      },
    ],
    placement:
      "Add conversation_history: list = [{\"role\": \"system\", \"content\": SYSTEM_PROMPT}] near your other module-level constants (SYSTEM_PROMPT, TOOLS) — it now carries the system message as its permanent first entry. Replace ask_compass()'s internal local messages list with conversation_history everywhere it's used — the function's logic (turn cap, tool dispatch) stays identical, only the SCOPE of the list changes (and the system prompt moves from a per-call kwarg to a standing first message).",
    implementation:
      "The key change is exactly ONE thing: messages moves from a local variable (recreated every call, as in Lesson 9) to a shared, module-level list that every call to ask_compass() appends to and reads from. Because the openai package has no separate system= kwarg, SYSTEM_PROMPT is seeded as conversation_history's very first entry, once, and never re-added. This single change makes the WHOLE REPL session — every question asked in one run of the program — into one continuous conversation the model has full context of, including all past tool calls and results. No other logic (the loop, error handling, streaming path) needs to change.",
    expectedResult:
      "In one Compass session: asking 'What is 12 times 4?' then 'And what's that divided by 2?' now correctly returns 24 — Compass understood 'that' referred to the PREVIOUS answer, something impossible before this lesson.",
    connects:
      "Compass now remembers within a session — but every question sent adds MORE tokens to every future call (Lesson 2's context window concern, now very real). Lesson 14 addresses managing that growth directly.",
  },

  quiz: [
    { id: 'c13q1', kind: 'concept', prompt: 'What was Compass missing before this lesson?', options: ['Tool use', 'Memory of earlier questions within the same session', 'A system prompt', 'Error handling'], answerIndex: 1, explanation: "Each call to ask_compass() started with a fresh, empty history before this lesson." },
    { id: 'c13q2', kind: 'application', prompt: 'What single structural change gives Compass session memory?', options: ['Adding a new tool', 'Moving the messages list to module scope, outside ask_compass()', 'Lowering the temperature', 'Increasing max_tokens'], answerIndex: 1, explanation: "A shared, persistent list outside the function is what lets history survive across separate calls." },
    { id: 'c13q3', kind: 'debug', prompt: 'A student keeps the messages list declared INSIDE ask_compass(). What happens to memory?', options: ['It works perfectly across calls', 'It resets to empty every single call — no memory persists', 'It only remembers tool calls', 'It causes a crash'], answerIndex: 1, explanation: "A local variable is recreated fresh every function call, discarding any prior history." },
    { id: 'c13q4', kind: 'concept', prompt: 'Why does a growing conversation cost more per call over time?', options: ['It doesn’t, cost stays fixed', 'The ENTIRE accumulated history is sent with every new request, using more input tokens each time', 'Longer conversations use a different model automatically', 'Cost only depends on the newest message'], answerIndex: 1, explanation: "Since the whole history is resent each call, token usage (and cost) grows as the conversation grows." },
    { id: 'c13q5', kind: 'application', prompt: 'Why is this called "short-term" or "session" memory specifically?', options: ['It’s a permanent database', 'It only lasts while the program is running — lost when it exits', 'It only remembers the last message', 'It’s the same as long-term memory'], answerIndex: 1, explanation: "This memory lives in a Python list, not persisted anywhere — it disappears when the process ends." },
    { id: 'c13q6', kind: 'code_reading', prompt: 'In the mini-project, why does ask() append BOTH the user question and the assistant’s message onto history?', options: ['Only the user message matters', 'Both turns are needed so future calls have the FULL exchange, not just half of it', 'It’s redundant, one would suffice', 'Assistant replies are never needed in history'], answerIndex: 1, explanation: "A complete conversation record needs both sides of every exchange for the model to reason about correctly." },
    { id: 'c13q7', kind: 'output', prompt: 'After asking "My favorite color is blue." then "What is my favorite color?", what should the second reply say?', options: ['"I don’t know"', '"Blue" (or similar), correctly referencing the earlier message', 'A random color', 'An error'], answerIndex: 1, explanation: "With session memory working, the model has direct access to the earlier statement." },
    { id: 'c13q8', kind: 'debug', prompt: 'Without session memory, what would Compass likely say if asked "What is my favorite color?" as a first, standalone question?', options: ['"Blue"', 'Something acknowledging it doesn’t know, since no prior context exists', 'It would crash', 'It would guess correctly every time'], answerIndex: 1, explanation: "With no memory and no context provided, the model has no information to answer from." },
    { id: 'c13q9', kind: 'project', prompt: "Why is SYSTEM_PROMPT seeded as conversation_history's first entry instead of passed as a separate argument each call?", options: ['It’s just a style choice with no reason', 'The openai package has no separate system= kwarg — the system message is just the first item in the messages list', 'System messages are optional in this SDK', 'It must be re-added on every single call'], answerIndex: 1, explanation: "Unlike some other SDK shapes, a system role message is simply the first entry in the same messages list, added once." },
    { id: 'c13q10', kind: 'concept', prompt: 'What problem does Lesson 14 address, now that memory grows unboundedly?', options: ['Tool safety', 'Managing/trimming growing conversation history to control token usage', 'Deployment', 'Prompt engineering'], answerIndex: 1, explanation: "The very real growth-in-tokens issue from this lesson is the direct motivation for the next one." },
  ],

  homework: {
    task:
      "Add a 'forget' command to the REPL that clears conversation_history back to just the system message (keeping conversation_history[0], clearing the rest), letting the user start a completely fresh conversation without restarting the program.",
    requirements: [
      "Check for 'forget' the same way 'exit' and 'help' are checked in the REPL loop.",
      "On match, trim the list back to only its first (system) entry and print a confirmation message, then continue the loop (no API call).",
      "Confirm a question asked AFTER 'forget' has no memory of anything said before it.",
    ],
    expectedOutcome:
      "Typing 'forget' clears all prior context (except the system message); asking a follow-up question referencing something from before 'forget' no longer works, proving the reset was real.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 12,
      hint: "Lesson 12 asked you to print a '[used: ...]' summary of which tools were used for the current question, after the answer is determined.",
      steps: [
        "Declare used_tools = [] at the top of ask_compass() (reset per call).",
        "Each time a tool is executed in the loop, append its name: used_tools.append(tool_call.function.name).",
        "Right before returning the final answer, if used_tools is non-empty, print f\"[used: {', '.join(used_tools)}]\".",
        "Test with 0, 1, and 2-tool questions and confirm the summary matches.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py (inside ask_compass)',
          code:
            "used_tools = []\n# ...inside the loop, when a tool is used:\nused_tools.append(tool_call.function.name)\n# ...right before the final return:\nif used_tools:\n    print(f\"[used: {', '.join(used_tools)}]\")\nreturn message.content",
        },
      ],
    },
  },
};
