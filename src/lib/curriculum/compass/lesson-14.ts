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
          "Lesson 13's conversation_history grows forever within a session. A long chat could eventually approach the context window limit (Lesson 2), and even before that, every extra message means more tokens (and more cost) on EVERY future call — even ones about something completely unrelated to early messages.",
      },
      {
        heading: 'Strategy 1: a simple sliding window',
        body:
          "The simplest fix: keep only the last N messages, dropping the oldest ones as new ones arrive. Easy to implement with Python's list slicing, but has an obvious downside — genuinely important early context (like the user's name, stated once) gets silently forgotten once it slides out of the window.",
        code: {
          language: 'python',
          code:
            "MAX_HISTORY = 20   # keep the most recent 20 messages\n\ndef trim_history(history: list[dict]) -> None:\n    if len(history) > MAX_HISTORY:\n        del history[:-MAX_HISTORY]   # remove everything except the last MAX_HISTORY items",
        },
      },
      {
        heading: 'Strategy 2: keep the first message, slide the rest',
        body:
          "A small improvement: ALWAYS keep the very first exchange (often containing the user's initial framing or key facts) plus a sliding window of the most recent ones — a cheap way to reduce (not eliminate) the 'forgot something important early on' problem.",
        code: {
          language: 'python',
          code:
            "def trim_history(history: list[dict]) -> None:\n    keep_recent = 18\n    if len(history) > keep_recent + 2:\n        first = history[:2]           # first user+assistant turn\n        recent = history[-keep_recent:]   # most recent turns\n        history[:] = first + recent",
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
          "Trimming doesn't need to happen every single message — checking and trimming only when history exceeds a threshold (rather than on every append) keeps the logic simple and avoids unnecessary work on short conversations.",
      },
    ],
    keyTerms: [
      { term: 'Sliding window', definition: "Keeping only the most recent N messages, dropping the oldest as new ones arrive." },
      { term: 'Context management', definition: "Strategies for keeping conversation history within a model's usable/affordable size." },
      { term: 'List slicing', definition: "Python's syntax (list[start:end]) for extracting or replacing a portion of a list, used here to trim history." },
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
      "Practise the sliding-window trimming logic on a plain list of fake messages, before applying it to Compass's real history.",
    instructions: [
      "Create a list of 30 fake message strings.",
      "Write trim_history(history, max_len) that keeps only the last max_len items.",
      "Run it and confirm the list shrinks to the right size, keeping the MOST RECENT items.",
    ],
    code: [
      {
        language: 'python',
        filename: 'trim_test.py',
        code:
          "def trim_history(history: list, max_len: int) -> None:\n    if len(history) > max_len:\n        del history[:-max_len]\n\nfake_history = [f\"message {i + 1}\" for i in range(30)]\nprint(\"before:\", len(fake_history))\n\ntrim_history(fake_history, 10)\nprint(\"after:\", len(fake_history))\nprint(\"kept:\", fake_history)",
      },
    ],
    explanation:
      "del history[:-max_len] removes everything from the START of the list UP TO (but not including) the last max_len items — leaving exactly the last max_len items in place, mutating the list directly rather than creating a new one. Running this on 30 fake messages trimmed to 10 shows 'message 21' through 'message 30' remain — proof the trim correctly keeps the MOST RECENT entries, not a random or oldest subset.",
    expectedOutput:
      "'before: 30', 'after: 10', and 'kept:' shows exactly messages 21 through 30 — the ten most recent.",
    learned: [
      "How Python's del with negative slicing removes a range from the start of a list.",
      "How to verify a sliding window keeps the correct (recent) items.",
      "Why mutating in place (vs. reassigning) matters for a shared list reference.",
      "A generic trim_history function reusable for any list type.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's conversation history is now bounded — a sliding window (with the first exchange preserved) keeps token usage under control in long sessions.",
    why:
      "Without this, a long conversation with Compass would keep growing in cost and eventually risk exceeding the context window. This lesson makes long-running sessions genuinely sustainable.",
    fileLocation: "compass-agent/main.py (add trim_history + call it inside ask_compass)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add near conversation_history)',
        code:
          "MAX_RECENT = 18\n\ndef trim_history() -> None:\n    if len(conversation_history) <= MAX_RECENT + 2:\n        return   # nothing to do yet\n\n    first = conversation_history[:2]        # preserve the opening exchange\n    recent = conversation_history[-MAX_RECENT:]   # keep the most recent turns\n    conversation_history[:] = first + recent\n    print(f\"[memory] trimmed conversation to {len(conversation_history)} messages\")",
      },
      {
        language: 'python',
        filename: 'main.py (call it at the start of ask_compass)',
        code:
          "def ask_compass(question: str) -> str:\n    trim_history()   # keep memory bounded BEFORE adding the new question\n    conversation_history.append({\"role\": \"user\", \"content\": question})\n    # ...rest of the function is unchanged from Lesson 13...",
      },
    ],
    placement:
      "Add the MAX_RECENT constant and trim_history() function near your conversation_history declaration. Call trim_history() as the FIRST line inside ask_compass(), before appending the new question — everything else in the function stays exactly as Lesson 13 left it.",
    implementation:
      "trim_history() only does work once the list exceeds MAX_RECENT + 2 (the +2 accounts for the preserved first exchange), so short conversations are completely untouched — matching the 'trim only when needed' principle. When it DOES trim, it keeps the very first user+assistant exchange (often containing important initial context) plus the most recent MAX_RECENT messages, discarding everything in between. Calling it at the START of ask_compass(), before the new question is added, ensures the trim happens on the PRIOR history, then the fresh question is added to the now-bounded list.",
    expectedResult:
      "A very long Compass session (many back-and-forth questions) now prints '[memory] trimmed conversation to N messages' periodically, keeping token usage from growing indefinitely, while the earliest stated context and recent exchanges both remain available.",
    connects:
      "This sliding-window approach is simple but lossy — genuinely important MIDDLE context can still get dropped. Lesson 15 builds a smarter approach: summarizing older messages with the model itself instead of just discarding them outright.",
  },

  quiz: [
    { id: 'c14q1', kind: 'concept', prompt: 'What real problem does unbounded conversation history growth cause?', options: ['Nothing, it’s harmless', 'Growing token usage/cost per call, and eventually risking the context window limit', 'The API rejects long conversations immediately', 'It only affects the UI'], answerIndex: 1, explanation: "Every additional message increases the tokens sent (and possibly billed) on every future call." },
    { id: 'c14q2', kind: 'concept', prompt: 'What is a sliding window strategy?', options: ['Encrypting old messages', 'Keeping only the most recent N messages, dropping older ones', 'Summarizing every message', 'Deleting the whole conversation'], answerIndex: 1, explanation: "A sliding window is the simplest trimming approach: keep recent, drop old." },
    { id: 'c14q3', kind: 'application', prompt: 'Why also preserve the FIRST exchange, not just a sliding window of recent messages?', options: ['No real benefit', 'Important context stated early (like a name or key fact) is otherwise silently lost once it slides out', 'It’s required by the API', 'It reduces token usage further'], answerIndex: 1, explanation: "Keeping the opening exchange cheaply mitigates (not eliminates) losing important early context." },
    { id: 'c14q4', kind: 'debug', prompt: 'A trim function runs on EVERY single message, even in short 3-message conversations. What’s the downside?', options: ['No downside at all', 'Unnecessary overhead/complexity for conversations that don’t need trimming yet', 'It breaks the API', 'It’s required regardless of length'], answerIndex: 1, explanation: "Checking and trimming only past a threshold avoids needless work on short conversations." },
    { id: 'c14q5', kind: 'code_reading', prompt: 'What does del history[:-max_len] remove?', options: ['The most recent items', 'The OLDEST items, however many exceed max_len', 'A random selection', 'Nothing, it’s read-only'], answerIndex: 1, explanation: "The negative slice targets everything before the last max_len items, i.e. the oldest ones." },
    { id: 'c14q6', kind: 'concept', prompt: 'What is the main downside of a pure sliding-window approach?', options: ['It’s too complex to implement', 'It can silently lose genuinely important context that falls outside the recent window', 'It increases token usage', 'It has no downsides'], answerIndex: 1, explanation: "Recency-based trimming doesn't distinguish important from unimportant older messages." },
    { id: 'c14q7', kind: 'application', prompt: 'Why call trim_history() BEFORE appending the new question, not after?', options: ['No real difference', 'So the new question always survives trimming and isn’t immediately at risk of being cut', 'It’s required syntax', 'It changes the tool dispatch logic'], answerIndex: 1, explanation: "Trimming first ensures the trim operates on prior history, guaranteeing the newest question is safely included afterward." },
    { id: 'c14q8', kind: 'debug', prompt: 'A trim accidentally splits a tool_use message from its matching tool_result. What’s the risk?', options: ['No risk, they’re independent', 'The API can reject or misinterpret an incomplete tool_use/tool_result pairing', 'It automatically repairs itself', 'It only affects streaming'], answerIndex: 1, explanation: "Tool call pairs are expected to stay together; splitting them can cause API errors or confusion." },
    { id: 'c14q9', kind: 'project', prompt: "Why does Compass's final project print '[memory] trimmed conversation to N messages' when trimming happens?", options: ['Purely decorative, no purpose', 'Visibility into WHEN trimming occurs helps a developer understand and debug memory behavior over a long session', 'It’s required by the API', 'It replaces the need for testing'], answerIndex: 1, explanation: "Observable printing of internal behavior aids debugging and understanding, similar to the token-usage logging from Module 1." },
    { id: 'c14q10', kind: 'concept', prompt: 'What is the "smarter" alternative to plain trimming, built in the next lesson?', options: ['Deleting all history', 'Summarization — condensing older messages into a compact summary instead of discarding them', 'Using a bigger model', 'Ignoring the context window entirely'], answerIndex: 1, explanation: "Lesson 15 builds summarization, preserving meaning while still shrinking token count." },
  ],

  homework: {
    task:
      "Make MAX_RECENT configurable via an environment variable (COMPASS_MAX_HISTORY), falling back to 18 if not set, so the trimming threshold can be tuned without editing code.",
    requirements: [
      "Read os.environ.get('COMPASS_MAX_HISTORY'), parse it as an int, and use it if valid; otherwise default to 18.",
      "Test by setting the environment variable to a small number (e.g. 4) and confirming trimming happens much sooner in a short test conversation.",
    ],
    expectedOutcome:
      "Setting COMPASS_MAX_HISTORY=4 in the environment causes trimming to trigger after just a few exchanges, visibly different from the default behavior.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 13,
      hint: "Lesson 13 asked you to add a 'forget' command to the REPL that clears conversation_history entirely.",
      steps: [
        "In the REPL loop, check the stripped/lowercased input for 'forget' alongside the existing 'exit' and 'help' checks.",
        "On match, call conversation_history.clear() (clears the list in place) and print a confirmation message.",
        "Use continue to skip the rest of the loop body (no API call) and re-prompt.",
        "Test: state something, type 'forget', then ask about it again — it should no longer be remembered.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py (inside the REPL loop)',
          code:
            "if question.lower() == \"forget\":\n    conversation_history.clear()\n    print(\"Compass: Okay, starting fresh!\\n\")\n    continue",
        },
      ],
    },
  },
};
