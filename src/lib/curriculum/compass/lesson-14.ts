import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 14 — Managing Conversation History
 * Module 3 (Memory + Context) · Lesson 14 of 30
 */
export const lesson14: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 3,
  lessonIndex: 1,
  globalNumber: 14,
  name: 'Managing conversation history',
  title: 'Managing Growth — Trimming Compass’s Conversation History',
  subtitle: "Keep Compass's memory bounded so a long session doesn't blow past the context window or cost too much.",

  concept: {
    durationMin: 15,
    summary:
      "Learn strategies for keeping a growing conversation history under control — trimming old messages while preserving what matters.",
    sections: [
      {
        heading: 'The real problem: unbounded growth',
        body:
          "Lesson 13's conversationHistory grows forever within a session. A long chat could eventually approach the context window limit (Lesson 2), and even before that, every extra message means more tokens (and more cost) on EVERY future call — even ones about something completely unrelated to early messages.",
      },
      {
        heading: 'Strategy 1: a simple sliding window',
        body:
          "The simplest fix: keep only the last N messages, dropping the oldest ones as new ones arrive. Easy to implement, but has an obvious downside — genuinely important early context (like the user's name, stated once) gets silently forgotten once it slides out of the window.",
        code: {
          language: 'typescript',
          code:
            "const MAX_HISTORY = 20;   // keep the most recent 20 messages\n\nfunction trimHistory(history: Anthropic.MessageParam[]) {\n  if (history.length > MAX_HISTORY) {\n    history.splice(0, history.length - MAX_HISTORY);\n  }\n}",
        },
      },
      {
        heading: 'Strategy 2: keep the first message, slide the rest',
        body:
          "A small improvement: ALWAYS keep the very first exchange (often containing the user's initial framing or key facts) plus a sliding window of the most recent ones — a cheap way to reduce (not eliminate) the 'forgot something important early on' problem.",
        code: {
          language: 'typescript',
          code:
            "function trimHistory(history: Anthropic.MessageParam[]) {\n  const KEEP_RECENT = 18;\n  if (history.length > KEEP_RECENT + 2) {\n    const first = history.slice(0, 2);           // first user+assistant turn\n    const recent = history.slice(-KEEP_RECENT);   // most recent turns\n    history.length = 0;\n    history.push(...first, ...recent);\n  }\n}",
        },
      },
      {
        heading: 'Strategy 3: summarization (previewed here, built in Lesson 15)',
        body:
          "The most powerful approach: periodically ask the MODEL ITSELF to summarize older messages into a short paragraph, then replace those many messages with ONE compact summary message. This preserves the meaning while drastically shrinking token count — this is exactly what Lesson 15 builds in full.",
      },
      {
        heading: 'When to trim',
        body:
          "Trimming doesn't need to happen every single message — checking and trimming only when history exceeds a threshold (rather than on every push) keeps the logic simple and avoids unnecessary work on short conversations.",
      },
    ],
    keyTerms: [
      { term: 'Sliding window', definition: "Keeping only the most recent N messages, dropping the oldest as new ones arrive." },
      { term: 'Context management', definition: "Strategies for keeping conversation history within a model's usable/affordable size." },
      { term: 'Trimming', definition: "The act of removing older messages from history to control its size." },
    ],
    commonMistakes: [
      "Never trimming at all, letting history grow until it approaches or exceeds the context window.",
      "Trimming too aggressively, losing genuinely important early context.",
      "Trimming in the middle of a tool_use / tool_result pair, breaking the required pairing the API expects.",
      "Checking and trimming on EVERY message when it's only needed occasionally, adding unnecessary overhead.",
      "Forgetting a sliding window still loses information — it doesn't preserve everything, just recency.",
    ],
    takeaways: [
      "A sliding window is the simplest history-management strategy, at the cost of losing old context.",
      "Keeping the first exchange plus a recent window is a cheap partial improvement.",
      "Summarization (Lesson 15) is the most powerful but most complex approach.",
      "Trim only when needed (past a threshold), not on every single message.",
      "Be careful not to split a tool_use/tool_result pair when trimming.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A sliding-window simulator',
    objective:
      "Practise the sliding-window trimming logic on a plain array of fake messages, before applying it to Compass's real history.",
    instructions: [
      "Create an array of 30 fake message strings.",
      "Write trimHistory(history, max) that keeps only the last `max` items.",
      "Run it and confirm the array shrinks to the right size, keeping the MOST RECENT items.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'trim-test.ts',
        code:
          "function trimHistory<T>(history: T[], max: number) {\n  if (history.length > max) {\n    history.splice(0, history.length - max);\n  }\n}\n\nconst fakeHistory = Array.from({ length: 30 }, (_, i) => `message ${i + 1}`);\nconsole.log('before:', fakeHistory.length);\n\ntrimHistory(fakeHistory, 10);\nconsole.log('after:', fakeHistory.length);\nconsole.log('kept:', fakeHistory);",
      },
    ],
    explanation:
      "splice(0, history.length - max) removes items STARTING FROM INDEX 0 (the oldest) for however many items exceed the max — leaving exactly the last `max` items in place, mutating the array directly rather than creating a new one. Running this on 30 fake messages trimmed to 10 shows 'message 21' through 'message 30' remain — proof the trim correctly keeps the MOST RECENT entries, not a random or oldest subset.",
    expectedOutput:
      "'before: 30', 'after: 10', and 'kept:' shows exactly messages 21 through 30 — the ten most recent.",
    learned: [
      "How splice removes a range from the start of an array.",
      "How to verify a sliding window keeps the correct (recent) items.",
      "Why mutating in place (vs. reassigning) matters for a shared array reference.",
      "A generic trimHistory function reusable for any array type.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's conversation history is now bounded — a sliding window (with the first exchange preserved) keeps token usage under control in long sessions.",
    why:
      "Without this, a long conversation with Compass would keep growing in cost and eventually risk exceeding the context window. This lesson makes long-running sessions genuinely sustainable.",
    fileLocation: "compass-agent/index.ts (add trimHistory + call it inside askCompass)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near conversationHistory)',
        code:
          "const MAX_RECENT = 18;\n\nfunction trimHistory() {\n  if (conversationHistory.length <= MAX_RECENT + 2) return;   // nothing to do yet\n\n  const first = conversationHistory.slice(0, 2);       // preserve the opening exchange\n  const recent = conversationHistory.slice(-MAX_RECENT); // keep the most recent turns\n  conversationHistory.length = 0;\n  conversationHistory.push(...first, ...recent);\n  console.log(`[memory] trimmed conversation to ${conversationHistory.length} messages`);\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (call it at the start of askCompass)',
        code:
          "async function askCompass(question: string): Promise<string> {\n  trimHistory();   // keep memory bounded BEFORE adding the new question\n  conversationHistory.push({ role: 'user', content: question });\n  // ...rest of the function is unchanged from Lesson 13...\n}",
      },
    ],
    placement:
      "Add the MAX_RECENT constant and trimHistory() function near your conversationHistory declaration. Call trimHistory() as the FIRST line inside askCompass(), before pushing the new question — everything else in the function stays exactly as Lesson 13 left it.",
    implementation:
      "trimHistory() only does work once the array exceeds MAX_RECENT + 2 (the +2 accounts for the preserved first exchange), so short conversations are completely untouched — matching the 'trim only when needed' principle. When it DOES trim, it keeps the very first user+assistant exchange (often containing important initial context) plus the most recent MAX_RECENT messages, discarding everything in between. Calling it at the START of askCompass(), before the new question is added, ensures the trim happens on the PRIOR history, then the fresh question is added to the now-bounded array.",
    expectedResult:
      "A very long Compass session (many back-and-forth questions) now logs '[memory] trimmed conversation to N messages' periodically, keeping token usage from growing indefinitely, while the earliest stated context and recent exchanges both remain available.",
    connects:
      "This sliding-window approach is simple but lossy — genuinely important MIDDLE context can still get dropped. Lesson 15 builds a smarter approach: summarizing older messages with the model itself instead of just discarding them outright.",
  },

  quiz: [
    { id: 'c14q1', kind: 'concept', prompt: 'What real problem does unbounded conversation history growth cause?', options: ['Nothing, it’s harmless', 'Growing token usage/cost per call, and eventually risking the context window limit', 'The API rejects long conversations immediately', 'It only affects the UI'], answerIndex: 1, explanation: "Every additional message increases the tokens sent (and possibly billed) on every future call." },
    { id: 'c14q2', kind: 'concept', prompt: 'What is a sliding window strategy?', options: ['Encrypting old messages', 'Keeping only the most recent N messages, dropping older ones', 'Summarizing every message', 'Deleting the whole conversation'], answerIndex: 1, explanation: "A sliding window is the simplest trimming approach: keep recent, drop old." },
    { id: 'c14q3', kind: 'application', prompt: 'Why also preserve the FIRST exchange, not just a sliding window of recent messages?', options: ['No real benefit', 'Important context stated early (like a name or key fact) is otherwise silently lost once it slides out', 'It’s required by the API', 'It reduces token usage further'], answerIndex: 1, explanation: "Keeping the opening exchange cheaply mitigates (not eliminates) losing important early context." },
    { id: 'c14q4', kind: 'debug', prompt: 'A trim function runs on EVERY single message, even in short 3-message conversations. What’s the downside?', options: ['No downside at all', 'Unnecessary overhead/complexity for conversations that don’t need trimming yet', 'It breaks the API', 'It’s required regardless of length'], answerIndex: 1, explanation: "Checking and trimming only past a threshold avoids needless work on short conversations." },
    { id: 'c14q5', kind: 'code_reading', prompt: 'What does history.splice(0, history.length - max) remove?', options: ['The most recent items', 'The OLDEST items, however many exceed max', 'A random selection', 'Nothing, it’s read-only'], answerIndex: 1, explanation: "splice starting at index 0 removes from the beginning (oldest) for the calculated excess count." },
    { id: 'c14q6', kind: 'concept', prompt: 'What is the main downside of a pure sliding-window approach?', options: ['It’s too complex to implement', 'It can silently lose genuinely important context that falls outside the recent window', 'It increases token usage', 'It has no downsides'], answerIndex: 1, explanation: "Recency-based trimming doesn't distinguish important from unimportant older messages." },
    { id: 'c14q7', kind: 'application', prompt: 'Why call trimHistory() BEFORE pushing the new question, not after?', options: ['No real difference', 'So the new question always survives trimming and isn’t immediately at risk of being cut', 'It’s required syntax', 'It changes the tool dispatch logic'], answerIndex: 1, explanation: "Trimming first ensures the trim operates on prior history, guaranteeing the newest question is safely included afterward." },
    { id: 'c14q8', kind: 'debug', prompt: 'A trim accidentally splits a tool_use message from its matching tool_result. What’s the risk?', options: ['No risk, they’re independent', 'The API can reject or misinterpret an incomplete tool_use/tool_result pairing', 'It automatically repairs itself', 'It only affects streaming'], answerIndex: 1, explanation: "Tool call pairs are expected to stay together; splitting them can cause API errors or confusion." },
    { id: 'c14q9', kind: 'project', prompt: "Why does Compass's final project log '[memory] trimmed conversation to N messages' when trimming happens?", options: ['Purely decorative, no purpose', 'Visibility into WHEN trimming occurs helps a developer understand and debug memory behavior over a long session', 'It’s required by the API', 'It replaces the need for testing'], answerIndex: 1, explanation: "Observable logging of internal behavior aids debugging and understanding, similar to the token-usage logging from Module 1." },
    { id: 'c14q10', kind: 'concept', prompt: 'What is the "smarter" alternative to plain trimming, built in the next lesson?', options: ['Deleting all history', 'Summarization — condensing older messages into a compact summary instead of discarding them', 'Using a bigger model', 'Ignoring the context window entirely'], answerIndex: 1, explanation: "Lesson 15 builds summarization, preserving meaning while still shrinking token count." },
  ],

  homework: {
    task:
      "Make MAX_RECENT configurable via an environment variable (COMPASS_MAX_HISTORY), falling back to 18 if not set, so the trimming threshold can be tuned without editing code.",
    requirements: [
      "Read process.env.COMPASS_MAX_HISTORY, parse it as a number, and use it if valid; otherwise default to 18.",
      "Test by setting the environment variable to a small number (e.g. 4) and confirming trimming happens much sooner in a short test conversation.",
    ],
    expectedOutcome:
      "Setting COMPASS_MAX_HISTORY=4 in the environment causes trimming to trigger after just a few exchanges, visibly different from the default behavior.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 13,
      hint: "Lesson 13 asked you to add a 'forget' command to the REPL that clears conversationHistory entirely.",
      steps: [
        "In the REPL loop, check the trimmed/lowercased input for 'forget' alongside the existing 'exit' and 'help' checks.",
        "On match, set conversationHistory.length = 0 (clears the array in place) and print a confirmation message.",
        "Use continue to skip the rest of the loop body (no API call) and re-prompt.",
        "Test: state something, type 'forget', then ask about it again — it should no longer be remembered.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside the REPL loop)',
          code:
            "if (trimmed.toLowerCase() === 'forget') {\n  conversationHistory.length = 0;\n  console.log('Compass: Okay, starting fresh!\\n');\n  continue;\n}",
        },
      ],
    },
  },
};
