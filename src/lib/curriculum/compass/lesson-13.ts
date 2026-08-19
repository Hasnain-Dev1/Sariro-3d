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
          "Lesson 9's messages array accumulates perfectly WITHIN one question's tool-calling loop — but it's recreated FRESH every time askCompass() is called. Ask 'What is 12 * 4?' then 'What about divided by 2?' and Compass has no idea what 'that' refers to, because each call starts from zero.",
      },
      {
        heading: 'Session memory: one messages array for the whole conversation',
        body:
          "The fix is straightforward: move the messages array OUTSIDE askCompass() entirely, so it persists across MULTIPLE calls within the same running program (the REPL session) — each new question gets APPENDED, not started fresh.",
        code: {
          language: 'typescript',
          code:
            "// Move this OUTSIDE askCompass, at module level:\nconst conversationHistory: Anthropic.MessageParam[] = [];\n\nasync function askCompass(question: string): Promise<string> {\n  conversationHistory.push({ role: 'user', content: question });\n  // ...loop uses conversationHistory instead of a fresh local array...\n}",
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
          "Every question now adds to a growing array, which means every SUBSEQUENT API call sends more tokens (the whole history, every time). This directly connects back to Lesson 2's context window concept — a long enough session will eventually need trimming or summarizing, which Lesson 15 addresses.",
      },
      {
        heading: '"Short-term" means within a session, not forever',
        body:
          "This lesson's memory lives only in a JavaScript variable — it vanishes the moment the program exits. That's intentional and fine for now: Lesson 16 introduces LONG-term memory that survives across separate program runs (via a real vector database), a genuinely different problem tackled later.",
      },
    ],
    keyTerms: [
      { term: 'Session memory', definition: "Conversation history that persists across multiple questions within one running program instance." },
      { term: 'Short-term memory', definition: "Memory that lasts for the current session only, not saved anywhere persistent." },
      { term: 'Stateless', definition: "Describes code (like Lesson 12's askCompass) that starts fresh every call, with no memory of prior calls." },
    ],
    commonMistakes: [
      "Declaring the messages array INSIDE askCompass(), recreating it (and losing history) on every call.",
      "Forgetting that a growing conversation means growing token usage on every subsequent call.",
      "Assuming session memory alone solves 'remembering forever' — it's lost when the program exits.",
      "Not pushing the user's new question onto the shared history before the loop starts.",
      "Mixing up 'the loop's per-question tool-calling messages' (Lesson 9) with 'the whole session's conversation' (this lesson) — they're related but distinct scopes.",
    ],
    takeaways: [
      "Moving the messages array OUTSIDE askCompass() gives Compass memory across questions.",
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
      "Write a script with a module-level messages array.",
      "Ask 'My favorite color is blue.' — expect an acknowledgment.",
      "THEN ask 'What is my favorite color?' using the SAME accumulated array.",
      "Confirm the second answer correctly references the first message.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'memory-test.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\nconst history: Anthropic.MessageParam[] = [];\n\nasync function ask(question: string): Promise<string> {\n  history.push({ role: 'user', content: question });\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200, messages: history,\n  });\n  const text = response.content[0].type === 'text' ? response.content[0].text : '';\n  history.push({ role: 'assistant', content: response.content });\n  return text;\n}\n\nasync function main() {\n  console.log(await ask('My favorite color is blue.'));\n  console.log(await ask('What is my favorite color?'));\n}\n\nmain();",
      },
    ],
    explanation:
      "history lives OUTSIDE ask(), so it survives between the two separate calls in main(). Each call pushes the new user question, sends the WHOLE accumulated history (not just the latest message), reads the reply, and pushes the assistant's response too — building a real, growing conversation. The second question, 'What is my favorite color?', has NO information on its own — the only reason the model can answer correctly is that the first exchange is still present in history when the second call is made.",
    expectedOutput:
      "First reply acknowledges the blue favorite color. Second reply correctly answers 'blue' — proof the model used the earlier context, not a coincidence or guess.",
    learned: [
      "How to build genuine cross-call session memory.",
      "Why history must live outside the function that uses it.",
      "How to verify memory works with a deliberate follow-up test.",
      "That both user AND assistant turns need to be pushed to preserve full context.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gains real session memory — the REPL now holds a genuine, ongoing conversation instead of independent, unconnected questions.",
    why:
      "This is one of the most noticeable upgrades in the whole course: users can finally ask natural follow-up questions, exactly like a real conversation with a person who remembers what was just said.",
    fileLocation: "compass-agent/index.ts (move messages to module scope, update askCompass)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add at module level, above askCompass)',
        code:
          "const conversationHistory: Anthropic.MessageParam[] = [];",
      },
      {
        language: 'typescript',
        filename: 'index.ts (update askCompass to use it)',
        code:
          "async function askCompass(question: string): Promise<string> {\n  conversationHistory.push({ role: 'user', content: question });\n\n  try {\n    for (let turn = 0; turn < MAX_TURNS; turn++) {\n      const response = await withRetry(() =>\n        anthropic.messages.create({\n          model: 'claude-sonnet-5', max_tokens: 400, temperature: 0.2,\n          system: SYSTEM_PROMPT, tools: TOOLS, messages: conversationHistory,\n        })\n      );\n      conversationHistory.push({ role: 'assistant', content: response.content });\n\n      if (response.stop_reason !== 'tool_use') {\n        return response.content[0].type === 'text' ? response.content[0].text : '';\n      }\n\n      const toolBlock = response.content.find((b) => b.type === 'tool_use');\n      if (!toolBlock) return 'Something went wrong reading the tool request.';\n\n      console.log(TOOL_LABELS[toolBlock.name] ?? `Using ${toolBlock.name}...`);\n      const toolOutput = await executeTool(toolBlock.name, toolBlock.input);\n      conversationHistory.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: toolOutput }] });\n    }\n    return \"That question needed more steps than I could complete.\";\n  } catch (err) {\n    console.error('[error] Compass could not get a response:', err);\n    return \"Sorry, I'm having trouble right now. Please try again in a moment.\";\n  }\n}",
      },
    ],
    placement:
      "Add const conversationHistory: Anthropic.MessageParam[] = []; near your other module-level constants (SYSTEM_PROMPT, TOOLS). Replace askCompass()'s internal local messages array with conversationHistory everywhere it's used — the function's logic (turn cap, tool dispatch) stays identical, only the SCOPE of the array changes.",
    implementation:
      "The key change is exactly ONE thing: messages moves from a local variable (recreated every call, as in Lesson 9) to a shared, module-level array that every call to askCompass() appends to and reads from. This single change makes the WHOLE REPL session — every question asked in one run of the program — into one continuous conversation the model has full context of, including all past tool calls and results. No other logic (the loop, error handling, streaming path) needs to change.",
    expectedResult:
      "In one Compass session: asking 'What is 12 times 4?' then 'And what's that divided by 2?' now correctly returns 24 — Compass understood 'that' referred to the PREVIOUS answer, something impossible before this lesson.",
    connects:
      "Compass now remembers within a session — but every question sent adds MORE tokens to every future call (Lesson 2's context window concern, now very real). Lesson 14 addresses managing that growth directly.",
  },

  quiz: [
    { id: 'c13q1', kind: 'concept', prompt: 'What was Compass missing before this lesson?', options: ['Tool use', 'Memory of earlier questions within the same session', 'A system prompt', 'Error handling'], answerIndex: 1, explanation: "Each call to askCompass() started with a fresh, empty history before this lesson." },
    { id: 'c13q2', kind: 'application', prompt: 'What single structural change gives Compass session memory?', options: ['Adding a new tool', 'Moving the messages array to module scope, outside askCompass()', 'Lowering the temperature', 'Increasing max_tokens'], answerIndex: 1, explanation: "A shared, persistent array outside the function is what lets history survive across separate calls." },
    { id: 'c13q3', kind: 'debug', prompt: 'A student keeps the messages array declared INSIDE askCompass(). What happens to memory?', options: ['It works perfectly across calls', 'It resets to empty every single call — no memory persists', 'It only remembers tool calls', 'It causes a crash'], answerIndex: 1, explanation: "A local variable is recreated fresh every function call, discarding any prior history." },
    { id: 'c13q4', kind: 'concept', prompt: 'Why does a growing conversation cost more per call over time?', options: ['It doesn’t, cost stays fixed', 'The ENTIRE accumulated history is sent with every new request, using more input tokens each time', 'Longer conversations use a different model automatically', 'Cost only depends on the newest message'], answerIndex: 1, explanation: "Since the whole history is resent each call, token usage (and cost) grows as the conversation grows." },
    { id: 'c13q5', kind: 'application', prompt: 'Why is this called "short-term" or "session" memory specifically?', options: ['It’s a permanent database', 'It only lasts while the program is running — lost when it exits', 'It only remembers the last message', 'It’s the same as long-term memory'], answerIndex: 1, explanation: "This memory lives in a JS variable, not persisted anywhere — it disappears when the process ends." },
    { id: 'c13q6', kind: 'code_reading', prompt: 'In the mini-project, why does ask() push BOTH the user question and the assistant’s reply onto history?', options: ['Only the user message matters', 'Both turns are needed so future calls have the FULL exchange, not just half of it', 'It’s redundant, one would suffice', 'Assistant replies are never needed in history'], answerIndex: 1, explanation: "A complete conversation record needs both sides of every exchange for the model to reason about correctly." },
    { id: 'c13q7', kind: 'output', prompt: 'After asking "My favorite color is blue." then "What is my favorite color?", what should the second reply say?', options: ['"I don’t know"', '"Blue" (or similar), correctly referencing the earlier message', 'A random color', 'An error'], answerIndex: 1, explanation: "With session memory working, the model has direct access to the earlier statement." },
    { id: 'c13q8', kind: 'debug', prompt: 'Without session memory, what would Compass likely say if asked "What is my favorite color?" as a first, standalone question?', options: ['"Blue"', 'Something acknowledging it doesn’t know, since no prior context exists', 'It would crash', 'It would guess correctly every time'], answerIndex: 1, explanation: "With no memory and no context provided, the model has no information to answer from." },
    { id: 'c13q9', kind: 'project', prompt: "Why does moving messages to module scope require NO changes to the tool-calling loop's internal logic (turn cap, dispatch)?", options: ['It secretly does require changes', 'The loop logic only cares about the ARRAY’s content, not where it’s declared — the scope change is purely structural', 'Tool calls stop working with session memory', 'The turn cap resets automatically'], answerIndex: 1, explanation: "The loop operates on whatever array it's given; changing its scope doesn't affect its internal behavior." },
    { id: 'c13q10', kind: 'concept', prompt: 'What problem does Lesson 14 address, now that memory grows unboundedly?', options: ['Tool safety', 'Managing/trimming growing conversation history to control token usage', 'Deployment', 'Prompt engineering'], answerIndex: 1, explanation: "The very real growth-in-tokens issue from this lesson is the direct motivation for the next one." },
  ],

  homework: {
    task:
      "Add a 'forget' command to the REPL that clears conversationHistory (conversationHistory.length = 0), letting the user start a completely fresh conversation without restarting the program.",
    requirements: [
      "Check for 'forget' the same way 'exit' and 'help' are checked in the REPL loop.",
      "On match, clear the array and print a confirmation message, then continue the loop (no API call).",
      "Confirm a question asked AFTER 'forget' has no memory of anything said before it.",
    ],
    expectedOutcome:
      "Typing 'forget' clears all prior context; asking a follow-up question referencing something from before 'forget' no longer works, proving the reset was real.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 12,
      hint: "Lesson 12 asked you to log a '[used: ...]' summary of which tools were used for the current question, after the answer is determined.",
      steps: [
        "Declare let usedTools: string[] = []; at the top of askCompass() (reset per call).",
        "Each time a tool is executed in the loop, push its name: usedTools.push(toolBlock.name);",
        "Right before returning the final answer, if usedTools.length > 0, log `[used: ${usedTools.join(', ')}]`.",
        "Test with 0, 1, and 2-tool questions and confirm the summary matches.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside askCompass)',
          code:
            "const usedTools: string[] = [];\n// ...inside the loop, when a tool is used:\nusedTools.push(toolBlock.name);\n// ...right before the final return:\nif (usedTools.length > 0) console.log(`[used: ${usedTools.join(', ')}]`);\nreturn response.content[0].type === 'text' ? response.content[0].text : '';",
        },
      ],
    },
  },
};
