import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 17 — Wiring Memory into the Conversation
 * Module 3 (Memory + Context) · Lesson 17 of 30
 */
export const lesson17: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 3,
  lessonIndex: 4,
  globalNumber: 17,
  name: 'Memory management',
  title: 'Memory Management — Deciding What and When to Remember',
  subtitle: "Automatically recall relevant memories before answering, and decide when a new fact is worth saving.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to inject retrieved memories into a live conversation automatically, and how to decide (without asking the user every time) whether something is worth saving long-term.",
    sections: [
      {
        heading: 'Two separate decisions',
        body:
          "Wiring memory in fully means answering two questions automatically, every question: (1) is there anything RELEVANT already saved that would help answer this? (recall), and (2) does this exchange contain something worth REMEMBERING for next time? (save). These are independent — a question can trigger recall without a save, or vice versa.",
      },
      {
        heading: 'Injecting recalled memories into the system prompt',
        body:
          "Before calling the model, recall relevant memories and add them to the system prompt as context — similar to how habit data was injected for a different course's AI feature. The model can then naturally reference them.",
        code: {
          language: 'typescript',
          code:
            "async function buildSystemPrompt(question: string): Promise<string> {\n  const relevant = await recallRelevant(question);\n  const memoryContext = relevant.length > 0\n    ? `\\n\\nRelevant things you remember about this user: ${relevant.join('; ')}`\n    : '';\n  return SYSTEM_PROMPT + memoryContext;\n}",
        },
      },
      {
        heading: 'Deciding what’s worth saving — a simple heuristic',
        body:
          "You could ask the model itself ('was there a fact worth remembering here?'), but for a beginner-friendly approach, a simple heuristic works well: look for patterns like 'my name is', 'I prefer', 'I am a', 'remember that' in the user's message, and save the KEY FACT when detected.",
        code: {
          language: 'typescript',
          code:
            "const MEMORY_TRIGGERS = ['my name is', 'i prefer', 'i am a', 'i work as', 'remember that'];\n\nfunction shouldRemember(question: string): boolean {\n  const lower = question.toLowerCase();\n  return MEMORY_TRIGGERS.some((trigger) => lower.includes(trigger));\n}",
        },
      },
      {
        heading: 'A smarter (but costlier) alternative: ask the model',
        body:
          "A heuristic is fast and free but misses nuance. A more capable (if pricier) approach asks the model itself, as a small separate call, whether the message contains a fact worth remembering — trading a little cost for much better judgment. Worth knowing both exist; this lesson builds the heuristic version for its simplicity and zero extra cost.",
      },
      {
        heading: 'Putting it together in the loop',
        body:
          "Before the API call: recall relevant memories, build the enriched system prompt. After getting the user's question: check shouldRemember() and, if true, save it. Both steps slot cleanly into askCompass() without disrupting the tool-use loop or session-memory logic already built.",
      },
    ],
    keyTerms: [
      { term: 'Recall', definition: "Retrieving relevant saved long-term memories before answering a new question." },
      { term: 'Memory trigger', definition: "A phrase pattern (like 'my name is') suggesting a message contains a fact worth saving." },
      { term: 'Heuristic', definition: "A simple, fast rule of thumb (vs. a model-based decision) for making an automatic judgment." },
    ],
    commonMistakes: [
      "Recalling memories but never actually injecting them into the prompt — retrieval alone does nothing without that step.",
      "Saving EVERY message as a memory, creating noise and diluting genuinely important facts.",
      "A memory-trigger list too narrow, missing common phrasings of the same intent.",
      "Not deduplicating — saving 'my name is Alex' five times across a long relationship with the same user.",
      "Forgetting recall costs an extra embedding call every question — worth being aware of, even if usually cheap.",
    ],
    takeaways: [
      "Wiring memory in fully means automatic RECALL and automatic decide-to-SAVE, both per question.",
      "Injecting recalled memories into the system prompt is what makes them actually usable.",
      "A trigger-phrase heuristic is a simple, free way to decide what's worth saving.",
      "A model-based save decision is more accurate but costs more.",
      "Both recall and save integrate directly into the existing askCompass() flow.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A trigger-phrase detector',
    objective:
      "Practise the shouldRemember() heuristic on a variety of test sentences before wiring it into Compass.",
    instructions: [
      "Write shouldRemember(text) checking for a small set of trigger phrases.",
      "Test it against 5 sentences: some that SHOULD trigger it, some that shouldn't.",
      "Print each sentence with true/false next to it.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'trigger-test.ts',
        code:
          "const MEMORY_TRIGGERS = ['my name is', 'i prefer', 'i am a', 'i work as', 'remember that'];\n\nfunction shouldRemember(text: string): boolean {\n  const lower = text.toLowerCase();\n  return MEMORY_TRIGGERS.some((trigger) => lower.includes(trigger));\n}\n\nconst tests = [\n  'My name is Priya.',\n  'What is the capital of France?',\n  'I prefer short, direct answers.',\n  'Can you calculate 12 times 8?',\n  'Remember that I work as a nurse.',\n];\n\nfor (const t of tests) {\n  console.log(shouldRemember(t), '-', t);\n}",
      },
    ],
    explanation:
      "shouldRemember lowercases the input (so 'My name' and 'my name' both match) and checks whether ANY trigger phrase appears as a substring using .some(). Running it against 5 mixed sentences shows the heuristic correctly flags the ones stating a name, preference, or explicit 'remember that' request as true, while ordinary questions (capital of France, a calculation) correctly return false — a fast, honest sense of both the heuristic's usefulness AND its limits (it only catches phrasings that match, nothing cleverer).",
    expectedOutput:
      "true - My name is Priya. / false - What is the capital... / true - I prefer short... / false - Can you calculate... / true - Remember that I work...",
    learned: [
      "How to implement a simple trigger-phrase heuristic.",
      "How .some() checks for any matching condition in an array.",
      "The practical limits of a heuristic vs. genuine understanding.",
      "How to test a detection function against varied real examples.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass automatically recalls relevant memories before answering AND saves new facts it notices — memory now works transparently, with no manual save/recall commands needed.",
    why:
      "This is what makes long-term memory actually USEFUL day to day: the user doesn't have to explicitly tell Compass to remember or recall anything — it just happens, the way a person who knows you would.",
    fileLocation: "compass-agent/index.ts (add buildSystemPrompt + shouldRemember, wire into askCompass)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near your memory functions)',
        code:
          "const MEMORY_TRIGGERS = ['my name is', 'i prefer', 'i am a', 'i work as', 'remember that'];\n\nfunction shouldRemember(text: string): boolean {\n  const lower = text.toLowerCase();\n  return MEMORY_TRIGGERS.some((trigger) => lower.includes(trigger));\n}\n\nasync function buildSystemPrompt(question: string): Promise<string> {\n  const relevant = await recallRelevant(question);\n  if (relevant.length === 0) return SYSTEM_PROMPT;\n  return `${SYSTEM_PROMPT}\\n\\nRelevant things you remember about this user: ${relevant.join('; ')}`;\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (wire both into askCompass)',
        code:
          "async function askCompass(question: string): Promise<string> {\n  await compressHistory();\n  conversationHistory.push({ role: 'user', content: question });\n\n  if (shouldRemember(question)) {\n    await saveMemory(question);   // fire-and-remember; doesn't block the answer\n  }\n\n  const systemPrompt = await buildSystemPrompt(question);\n\n  try {\n    for (let turn = 0; turn < MAX_TURNS; turn++) {\n      const response = await withRetry(() =>\n        anthropic.messages.create({\n          model: 'claude-sonnet-5', max_tokens: 400, temperature: 0.2,\n          system: systemPrompt, tools: TOOLS, messages: conversationHistory,\n        })\n      );\n      // ...rest of the loop is unchanged from Lesson 15...\n    }\n  } catch (err) {\n    // ...unchanged error handling...\n  }\n}",
      },
    ],
    placement:
      "Add shouldRemember() and buildSystemPrompt() near your existing memory functions. In askCompass(), call shouldRemember(question) right after pushing it to history, and await saveMemory(question) if true. Call buildSystemPrompt(question) once, and use its result as the system field in EVERY API call inside the loop, replacing the plain SYSTEM_PROMPT constant.",
    implementation:
      "buildSystemPrompt() calls recallRelevant() (Lesson 16) and, only if it found anything, APPENDS a labeled memory section to the base system prompt — leaving it completely unchanged when there's nothing relevant, avoiding prompt clutter for ordinary questions. shouldRemember() runs on every incoming question; when it matches, saveMemory() writes the fact to disk BEFORE the API call proceeds — the user experiences no extra wait beyond the embedding call itself, and the save silently succeeds in the background of that turn. The tool-use loop's internal logic (turn cap, dispatch, tool_result handling) is completely untouched — only WHICH system prompt string gets used has changed.",
    expectedResult:
      "Telling Compass 'My name is Jordan, remember that' in one session, then asking (even in a LATER, separate run) 'What's my name?' now correctly answers 'Jordan' — memory recall and save both happened automatically, with no explicit commands needed.",
    connects:
      "Module 3 is now functionally complete: session memory, bounded growth, summarization, and true cross-session long-term memory, all wired together automatically. Lesson 18 (the Module 3 build) reviews and polishes the whole memory system before Module 4 adds planning and multi-step reasoning on top of it.",
  },

  quiz: [
    { id: 'c17q1', kind: 'concept', prompt: 'What TWO automatic decisions does full memory integration require, per question?', options: ['Only saving', 'Recalling relevant memories AND deciding whether to save something new', 'Only recalling', 'Neither — memory is fully manual'], answerIndex: 1, explanation: "Both recall and the save decision happen automatically for every question, independently." },
    { id: 'c17q2', kind: 'application', prompt: 'Why append recalled memories to the SYSTEM prompt rather than, say, ignoring them after retrieval?', options: ['Retrieval alone is sufficient', 'The model can only use retrieved memories if they’re actually included in what it reads — the prompt', 'System prompts can’t contain memory content', 'It’s purely for logging'], answerIndex: 1, explanation: "Retrieved data has to be injected into the model's input to actually influence its answer." },
    { id: 'c17q3', kind: 'concept', prompt: 'What is a "heuristic" in the context of shouldRemember()?', options: ['A type of API error', 'A simple, fast rule of thumb (trigger phrases) rather than a fully accurate model-based judgment', 'A vector database', 'A system prompt technique unrelated to memory'], answerIndex: 1, explanation: "A heuristic trades some accuracy for simplicity and zero extra cost." },
    { id: 'c17q4', kind: 'debug', prompt: 'A user says "Call me Alex" and Compass doesn’t save it. Likely cause?', options: ['saveMemory is broken', '"call me" isn’t in the MEMORY_TRIGGERS list, so the heuristic misses this phrasing', 'The API is down', 'Embeddings failed silently'], answerIndex: 1, explanation: "A trigger-phrase heuristic only catches phrasings explicitly included in its list — a real, acknowledged limitation." },
    { id: 'c17q5', kind: 'application', prompt: 'Why does buildSystemPrompt() return the PLAIN SYSTEM_PROMPT (unchanged) when relevant.length === 0?', options: ['A bug', 'To avoid cluttering the prompt with an empty/pointless memory section when nothing relevant was found', 'It always ignores memories', 'It disables tool use'], answerIndex: 1, explanation: "Only adding the memory section when there's genuinely something relevant keeps the prompt clean otherwise." },
    { id: 'c17q6', kind: 'code_reading', prompt: 'Why is shouldRemember() checked BEFORE the main API call, not after?', options: ['No particular reason', 'So the fact can be saved without depending on how the conversation loop concludes', 'It changes the tool dispatch', 'It’s required to be synchronous'], answerIndex: 1, explanation: "Deciding to save based on the user's OWN message doesn't need to wait for the model's answer." },
    { id: 'c17q7', kind: 'concept', prompt: 'What is the tradeoff of a model-based save decision vs. the heuristic?', options: ['No tradeoff, model-based is strictly better with no cost', 'Better judgment/accuracy at the cost of an extra API call', 'It’s free and instant', 'It’s less accurate than the heuristic'], answerIndex: 1, explanation: "Asking the model to judge relevance is more nuanced but adds latency and cost." },
    { id: 'c17q8', kind: 'output', prompt: 'After Compass recalls a memory like "user prefers concise answers," what should change about its NEXT reply?', options: ['Nothing, recall doesn’t affect output', 'It should tend toward a more concise style, since that context is now in its system prompt', 'It ignores memory entirely', 'It becomes less accurate'], answerIndex: 1, explanation: "Since the recalled fact is injected into the system prompt, the model can genuinely act on it." },
    { id: 'c17q9', kind: 'project', prompt: "Why doesn't wiring in automatic memory require ANY changes to the tool-use loop's core logic (turn cap, dispatch)?", options: ['It secretly does require changes', 'Memory only changes WHICH system prompt is used and WHAT gets saved — the loop’s mechanics are unrelated and untouched', 'Tool use stops working once memory is added', 'The loop needs a complete rewrite'], answerIndex: 1, explanation: "Memory integration is additive and orthogonal to the existing tool-calling mechanics." },
    { id: 'c17q10', kind: 'concept', prompt: 'What does Module 3 accomplish overall, by the end of this lesson?', options: ['Deployment to production', 'A complete memory system: session memory, bounded growth, summarization, and automatic long-term recall/save', 'Multi-agent orchestration', 'Fine-tuning a custom model'], answerIndex: 1, explanation: "This lesson completes the full memory arc built across Lessons 13-17." },
  ],

  homework: {
    task:
      "Add basic deduplication to saveMemory(): before saving a new fact, check if a very similar memory (cosine similarity above a high threshold, e.g. 0.95) already exists, and skip saving if so.",
    requirements: [
      "Before appending a new memory, embed the new text and compare it against all EXISTING memories' embeddings.",
      "If any existing memory has similarity >= 0.95 with the new one, skip saving and log that it was a likely duplicate.",
      "Test by saving 'My name is Alex' twice and confirming the second attempt is skipped.",
    ],
    expectedOutcome:
      "Saving the same (or near-identical) fact twice results in only ONE entry in memory.json, with the second attempt logged as skipped rather than creating a duplicate.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 16,
      hint: "Lesson 16 asked you to add listMemories() and a 'memories' REPL command printing every saved fact's text.",
      steps: [
        "Write async function listMemories(): Promise<string[]> { const memories = await loadMemories(); return memories.map(m => m.text); }",
        "In the REPL loop, check for 'memories' the same way other commands are checked.",
        "On match, call listMemories() and print each fact on its own line (or a 'no memories yet' message if empty), then continue.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside the REPL loop)',
          code:
            "if (trimmed.toLowerCase() === 'memories') {\n  const facts = await listMemories();\n  if (facts.length === 0) console.log('No memories saved yet.\\n');\n  else facts.forEach((f) => console.log('-', f));\n  continue;\n}",
        },
      ],
    },
  },
};
