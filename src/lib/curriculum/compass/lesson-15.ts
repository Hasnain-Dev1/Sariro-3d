import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 15 — Summarization
 * Module 3 (Memory + Context) · Lesson 15 of 30
 */
export const lesson15: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 3,
  lessonIndex: 2,
  globalNumber: 15,
  name: 'Summarization',
  title: 'Summarization — Compressing Memory Without Losing Meaning',
  subtitle: "Use Claude itself to compress old conversation history into a short summary instead of discarding it.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to use the model itself to summarize older conversation turns into a compact form, preserving meaning while sharply reducing token count.",
    sections: [
      {
        heading: 'The idea: use the model to compress the model’s own conversation',
        body:
          "Instead of just DROPPING old messages (Lesson 14's sliding window), ask Claude to read them and produce a short summary capturing the important facts. Replace the many original messages with ONE compact summary message — far fewer tokens, but the key information survives.",
      },
      {
        heading: 'A summarization call',
        body:
          "This is a SEPARATE, focused API call — not part of the main conversation. You send the old messages and ask specifically for a factual summary, with its own tightly-scoped system prompt.",
        code: {
          language: 'typescript',
          code:
            "async function summarizeMessages(oldMessages: Anthropic.MessageParam[]): Promise<string> {\n  const transcript = oldMessages.map((m) =>\n    `${m.role}: ${typeof m.content === 'string' ? m.content : '[tool interaction]'}`\n  ).join('\\n');\n\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5',\n    max_tokens: 200,\n    system: 'Summarize the key facts and topics from this conversation in 2-3 sentences. Be factual and concise.',\n    messages: [{ role: 'user', content: transcript }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}",
        },
      },
      {
        heading: 'Replacing old messages with the summary',
        body:
          "Once you have a summary, splice it into history as a single message (often framed as a system-style note or a synthetic user/assistant pair) in place of the many original messages it represents.",
        code: {
          language: 'typescript',
          code:
            "async function compressHistory(history: Anthropic.MessageParam[]) {\n  const toSummarize = history.slice(0, -10);   // everything except the most recent 10\n  if (toSummarize.length < 6) return;          // not worth summarizing yet\n\n  const summary = await summarizeMessages(toSummarize);\n  const recent = history.slice(-10);\n  history.length = 0;\n  history.push(\n    { role: 'user', content: `[Earlier conversation summary]: ${summary}` },\n    { role: 'assistant', content: 'Understood, I have that context.' },\n    ...recent\n  );\n}",
        },
      },
      {
        heading: 'Summarization vs. sliding window — the real tradeoff',
        body:
          "Summarization costs an EXTRA API call (and its own tokens) but preserves meaning far better than a pure sliding window. For a genuinely long-running assistant, this cost is usually worth it; for most short interactions, plain trimming (Lesson 14) is simpler and sufficient. Real agents often combine both.",
      },
      {
        heading: 'A caveat: summaries can lose precision',
        body:
          "A summary is a LOSSY compression — exact numbers, specific wording, or subtle nuance from the original conversation can get smoothed over. This is a genuine tradeoff, not a solved problem — worth being honest about rather than presenting summarization as perfect.",
      },
    ],
    keyTerms: [
      { term: 'Summarization', definition: "Using the model to compress older messages into a short summary, preserving meaning at lower token cost." },
      { term: 'Lossy compression', definition: "A compression method (like summarization) that can lose some precision/detail in exchange for size reduction." },
      { term: 'Synthetic message', definition: "A message inserted into history that wasn't part of the real exchange, like a summary framed as a conversation turn." },
    ],
    commonMistakes: [
      "Summarizing on every message, wasting an extra API call when it isn't needed yet.",
      "Summarizing too aggressively, discarding recent messages that still matter.",
      "Treating a summary as lossless — it can smooth over exact details that mattered.",
      "Forgetting the summarization call itself costs tokens and adds latency — it's not free.",
      "Not testing that a summarized conversation still lets Compass answer questions about the summarized content correctly.",
    ],
    takeaways: [
      "Summarization uses the model itself to compress old history instead of discarding it.",
      "It's a separate, focused API call with its own tight summarization prompt.",
      "Replace many old messages with one compact summary message.",
      "It costs extra tokens/latency but preserves meaning better than plain trimming.",
      "Summaries are lossy — some precision can be lost, a real tradeoff worth acknowledging.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Summarize a fake conversation',
    objective:
      "Practise the summarization call pattern on a small, made-up conversation before wiring it into Compass's real memory.",
    instructions: [
      "Create an array of 6 fake back-and-forth messages about planning a trip.",
      "Write and call summarizeMessages() on them.",
      "Print the summary and confirm it captures the key facts (destination, dates, etc.) in far fewer words.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'summarize-test.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nconst fakeConvo: Anthropic.MessageParam[] = [\n  { role: 'user', content: \"I'm planning a trip to Japan in April.\" },\n  { role: 'assistant', content: 'Great choice! April is cherry blossom season.' },\n  { role: 'user', content: \"I'll be there for 10 days, starting in Tokyo.\" },\n  { role: 'assistant', content: 'Tokyo is a great starting point. Any other cities?' },\n  { role: 'user', content: 'Maybe Kyoto and Osaka too. Budget is around $3000.' },\n  { role: 'assistant', content: \"That's a reasonable budget for a 10-day trip across those cities.\" },\n];\n\nasync function summarizeMessages(messages: Anthropic.MessageParam[]): Promise<string> {\n  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join('\\n');\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 150,\n    system: 'Summarize the key facts from this conversation in 2-3 sentences.',\n    messages: [{ role: 'user', content: transcript }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}\n\nsummarizeMessages(fakeConvo).then(console.log);",
      },
    ],
    explanation:
      "The transcript joins every message into one readable block of text — this is fed as a SINGLE user message to a fresh, separate API call with a system prompt narrowly focused on ONE job: factual summarization. The model reads the whole fake trip-planning exchange and condenses it, and a good summary should mention Japan, April, 10 days, Tokyo/Kyoto/Osaka, and the $3000 budget — the essential facts — in a fraction of the original word count.",
    expectedOutput:
      "A 2-3 sentence summary capturing: trip to Japan in April, 10 days starting in Tokyo (plus Kyoto/Osaka), ~$3000 budget — far more compact than the original 6 messages.",
    learned: [
      "How to build a summarization call using the model itself.",
      "How to format a conversation as a transcript for summarization.",
      "What a genuinely useful factual summary looks like.",
      "That summarization is its own separate, purpose-built API call.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass automatically summarizes older parts of long conversations instead of just dropping them, preserving context far more intelligently than the sliding window alone.",
    why:
      "This upgrades Lesson 14's simple (but lossy) trimming into a genuinely smarter memory strategy — Compass can stay aware of things discussed much earlier in a long session, not just recently.",
    fileLocation: "compass-agent/index.ts (add summarizeMessages + compressHistory, call instead of trimHistory)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near conversationHistory)',
        code:
          "async function summarizeMessages(oldMessages: Anthropic.MessageParam[]): Promise<string> {\n  const transcript = oldMessages.map((m) =>\n    `${m.role}: ${typeof m.content === 'string' ? m.content : '[tool interaction]'}`\n  ).join('\\n');\n\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200,\n    system: 'Summarize the key facts and topics from this conversation in 2-3 sentences. Be factual and concise.',\n    messages: [{ role: 'user', content: transcript }],\n  });\n  return response.content[0].type === 'text' ? response.content[0].text : '';\n}\n\nasync function compressHistory() {\n  const KEEP_RECENT = 10;\n  if (conversationHistory.length <= KEEP_RECENT + 6) return;   // not worth it yet\n\n  const toSummarize = conversationHistory.slice(0, -KEEP_RECENT);\n  const recent = conversationHistory.slice(-KEEP_RECENT);\n  const summary = await summarizeMessages(toSummarize);\n\n  conversationHistory.length = 0;\n  conversationHistory.push(\n    { role: 'user', content: `[Earlier conversation summary]: ${summary}` },\n    { role: 'assistant', content: 'Understood, I have that context.' },\n    ...recent\n  );\n  console.log(`[memory] summarized older history into a compact note`);\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (call compressHistory instead of trimHistory)',
        code:
          "async function askCompass(question: string): Promise<string> {\n  await compressHistory();   // smarter memory management, replacing plain trimHistory()\n  conversationHistory.push({ role: 'user', content: question });\n  // ...rest of the function is unchanged from Lesson 13-14...\n}",
      },
    ],
    placement:
      "Add summarizeMessages() and compressHistory() near your conversationHistory declaration — they can replace (or sit alongside) Lesson 14's trimHistory(). Update askCompass() to await compressHistory() instead of calling trimHistory() at the start.",
    implementation:
      "compressHistory() checks whether there's enough OLD history to be worth summarizing (avoiding a wasted extra API call on short conversations), then splits off everything except the most recent 10 messages, sends just that older portion to summarizeMessages(), and rebuilds conversationHistory as: one synthetic summary message, a matching synthetic assistant acknowledgment (so the roles alternate correctly, as the API expects), then the preserved recent messages. Because askCompass() now awaits this async step before proceeding, the compression genuinely completes before the new question is added — the SAME call-ordering principle as Lesson 14's trim, just with a smarter (if costlier) compression step.",
    expectedResult:
      "In a long Compass session, older exchanges get quietly compressed into a short summary note rather than vanishing outright — asking about something from much earlier in a long conversation still works, because the fact survived compression even though the exact original wording didn't.",
    connects:
      "Compass's SESSION memory is now genuinely solid. But it still forgets everything the moment the program exits — Lesson 16 tackles TRUE long-term memory, using a real vector database so Compass remembers across separate runs, not just within one.",
  },

  quiz: [
    { id: 'c15q1', kind: 'concept', prompt: 'What does summarization do that a sliding window doesn’t?', options: ['Nothing different', 'Preserves the MEANING of older messages in compact form, instead of discarding them outright', 'Increases token usage without benefit', 'Deletes the whole conversation'], answerIndex: 1, explanation: "Summarization compresses rather than simply drops older content." },
    { id: 'c15q2', kind: 'application', prompt: 'Why is summarizeMessages() a SEPARATE API call from the main conversation?', options: ['It’s not actually separate', 'It has its own narrow, focused purpose (pure summarization) with a dedicated system prompt', 'The main conversation can’t use system prompts', 'It’s required to use a different model'], answerIndex: 1, explanation: "Isolating the summarization task keeps its prompt focused purely on producing a good summary." },
    { id: 'c15q3', kind: 'concept', prompt: 'What is the main tradeoff of using summarization?', options: ['No tradeoff, it’s strictly better', 'It costs an extra API call/tokens and can lose some precision (lossy compression)', 'It’s free but less accurate', 'It only works for short conversations'], answerIndex: 1, explanation: "Summarization has real costs (extra call, potential loss of detail) weighed against its benefits." },
    { id: 'c15q4', kind: 'code_reading', prompt: 'Why does compressHistory() check `if (conversationHistory.length <= KEEP_RECENT + 6) return;`?', options: ['Arbitrary, no real reason', 'To avoid an unnecessary summarization call when there isn’t enough old history to be worth compressing yet', 'It’s required syntax', 'It disables summarization permanently'], answerIndex: 1, explanation: "This guard avoids wasted API calls on conversations too short to benefit from summarization." },
    { id: 'c15q5', kind: 'application', prompt: 'Why insert a synthetic assistant "Understood, I have that context." message after the summary?', options: ['It’s unnecessary padding', 'To keep the conversation’s role alternation (user/assistant) consistent, as the API expects', 'It changes the model used', 'It’s required only for tool use'], answerIndex: 1, explanation: "Maintaining alternating roles keeps the message structure valid and natural for the model to continue from." },
    { id: 'c15q6', kind: 'debug', prompt: 'A summary omits a specific number the user mentioned earlier (e.g. an exact budget). What does this illustrate?', options: ['A bug that should never happen', 'Summarization is lossy — precise details can get smoothed over in compression', 'The model is broken', 'Summaries always preserve every detail'], answerIndex: 1, explanation: "This is the expected, acknowledged tradeoff of lossy compression, not necessarily a bug." },
    { id: 'c15q7', kind: 'output', prompt: 'Given the mini-project’s fake trip conversation, what SHOULD a good summary include?', options: ['A word-for-word transcript', 'The key facts: Japan, April, 10 days, cities, budget — condensed', 'Only the assistant’s replies', 'Nothing related to the original content'], answerIndex: 1, explanation: "A useful summary captures the essential facts in far fewer words than the original." },
    { id: 'c15q8', kind: 'application', prompt: 'When might plain trimming (Lesson 14) be preferable to summarization?', options: ['Never, summarization is always better', 'For short interactions where the extra API call/cost of summarizing isn’t worth it', 'Trimming is never appropriate', 'Only for tool-heavy conversations'], answerIndex: 1, explanation: "Simpler trimming suffices for most short conversations; summarization's cost is better justified for long-running sessions." },
    { id: 'c15q9', kind: 'project', prompt: "Why does askCompass() now `await compressHistory()` instead of calling a synchronous trimHistory()?", options: ['No real reason for the change', 'compressHistory() makes a real async API call (summarization), so it must be awaited before continuing', 'await is optional here', 'It’s a stylistic choice with no functional impact'], answerIndex: 1, explanation: "Since summarization involves a real network request, the calling code must wait for it to complete." },
    { id: 'c15q10', kind: 'concept', prompt: 'What memory limitation does Compass STILL have after this lesson?', options: ['None, memory is fully solved', 'It still forgets everything when the program exits — no persistence ACROSS separate runs', 'It can’t remember anything at all', 'It can only remember tool calls'], answerIndex: 1, explanation: "This module's memory so far is all session-scoped; true persistence across runs is Lesson 16's focus." },
  ],

  homework: {
    task:
      "Add a fallback: if summarizeMessages() fails (network error, etc.), fall back to Lesson 14's simple trimHistory() approach instead of leaving history unbounded, so memory management never silently fails entirely.",
    requirements: [
      "Wrap the summarization call in try/catch inside compressHistory().",
      "On failure, log a warning and fall back to a simple slice-based trim (keep only the most recent N messages) instead of leaving history untouched.",
      "Test by temporarily breaking the summarization call (e.g. an invalid model name) and confirming the fallback trim still runs.",
    ],
    expectedOutcome:
      "If summarization fails for any reason, history still gets bounded via a simple trim as a fallback — Compass's memory management never simply stops working.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 14,
      hint: "Lesson 14 asked you to make MAX_RECENT configurable via a COMPASS_MAX_HISTORY environment variable, falling back to 18 if not set or invalid.",
      steps: [
        "Read const raw = process.env.COMPASS_MAX_HISTORY;",
        "Parse it: const parsed = Number(raw); use it only if Number.isFinite(parsed) && parsed > 0.",
        "const MAX_RECENT = Number.isFinite(parsed) && parsed > 0 ? parsed : 18;",
        "Test by running with COMPASS_MAX_HISTORY=4 set in the environment and confirming trimming triggers much sooner.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "const parsedMaxHistory = Number(process.env.COMPASS_MAX_HISTORY);\nconst MAX_RECENT = Number.isFinite(parsedMaxHistory) && parsedMaxHistory > 0 ? parsedMaxHistory : 18;",
        },
      ],
    },
  },
};
