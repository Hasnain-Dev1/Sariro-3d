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
        heading: 'Injecting recalled memories into the system message',
        body:
          "Before calling the model, recall relevant memories and add them to the system message content as context. The model can then naturally reference them. build_system_prompt() builds a plain STRING here — it becomes the content of the first message (role 'system') in the messages list passed to chat.completions.create.",
        code: {
          language: 'python',
          code:
            "def build_system_prompt(question: str) -> str:\n    relevant = recall_relevant(question)\n    if not relevant:\n        return SYSTEM_PROMPT\n    memory_context = \"; \".join(relevant)\n    return f\"{SYSTEM_PROMPT}\\n\\nRelevant things you remember about this user: {memory_context}\"",
        },
      },
      {
        heading: 'Deciding what’s worth saving — a simple heuristic',
        body:
          "You could ask the model itself ('was there a fact worth remembering here?'), but for a beginner-friendly approach, a simple heuristic works well: look for patterns like 'my name is', 'i prefer', 'i am a', 'remember that' in the user's message, and save the KEY FACT when detected.",
        code: {
          language: 'python',
          code:
            "MEMORY_TRIGGERS = [\"my name is\", \"i prefer\", \"i am a\", \"i work as\", \"remember that\"]\n\ndef should_remember(question: str) -> bool:\n    lower = question.lower()\n    return any(trigger in lower for trigger in MEMORY_TRIGGERS)",
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
          "Before the API call: recall relevant memories, build the enriched system message string. After getting the user's question: check should_remember() and, if true, save it. Both steps slot cleanly into ask_compass() without disrupting the tool-use loop or session-memory logic already built.",
      },
    ],
    keyTerms: [
      { term: 'Recall', definition: "Retrieving relevant saved long-term memories before answering a new question." },
      { term: 'Memory trigger', definition: "A phrase pattern (like 'my name is') suggesting a message contains a fact worth saving." },
      { term: 'Heuristic', definition: "A simple, fast rule of thumb (vs. a model-based decision) for making an automatic judgment." },
      { term: 'any()', definition: "Python's built-in function returning True if ANY item in an iterable satisfies a condition." },
    ],
    commonMistakes: [
      "Recalling memories but never actually injecting them into the system message — retrieval alone does nothing without that step.",
      "Saving EVERY message as a memory, creating noise and diluting genuinely important facts.",
      "A memory-trigger list too narrow, missing common phrasings of the same intent.",
      "Not deduplicating — saving 'my name is Alex' five times across a long relationship with the same user.",
      "Forgetting recall costs an extra embedding call every question — worth being aware of, even if usually cheap.",
    ],
    takeaways: [
      "Wiring memory in fully means automatic RECALL and automatic decide-to-SAVE, both per question.",
      "Injecting recalled memories into the system message is what makes them actually usable.",
      "A trigger-phrase heuristic is a simple, free way to decide what's worth saving.",
      "A model-based save decision is more accurate but costs more.",
      "Both recall and save integrate directly into the existing ask_compass() flow.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A trigger-phrase detector',
    objective:
      "Practise the should_remember() heuristic on a variety of test sentences before wiring it into Compass.",
    instructions: [
      "Write should_remember(text) checking for a small set of trigger phrases.",
      "Test it against 5 sentences: some that SHOULD trigger it, some that shouldn't.",
      "Print each sentence with True/False next to it.",
    ],
    code: [
      {
        language: 'python',
        filename: 'trigger_test.py',
        code:
          "MEMORY_TRIGGERS = [\"my name is\", \"i prefer\", \"i am a\", \"i work as\", \"remember that\"]\n\ndef should_remember(text: str) -> bool:\n    lower = text.lower()\n    return any(trigger in lower for trigger in MEMORY_TRIGGERS)\n\ntests = [\n    \"My name is Priya.\",\n    \"What is the capital of France?\",\n    \"I prefer short, direct answers.\",\n    \"Can you calculate 12 times 8?\",\n    \"Remember that I work as a nurse.\",\n]\n\nfor t in tests:\n    print(should_remember(t), \"-\", t)",
      },
    ],
    explanation:
      "should_remember lowercases the input (so 'My name' and 'my name' both match) and checks whether ANY trigger phrase appears as a substring using Python's any() built-in with a generator expression. Running it against 5 mixed sentences shows the heuristic correctly flags the ones stating a name, preference, or explicit 'remember that' request as True, while ordinary questions (capital of France, a calculation) correctly return False — a fast, honest sense of both the heuristic's usefulness AND its limits (it only catches phrasings that match, nothing cleverer).",
    expectedOutput:
      "True - My name is Priya. / False - What is the capital... / True - I prefer short... / False - Can you calculate... / True - Remember that I work...",
    learned: [
      "How to implement a simple trigger-phrase heuristic.",
      "How any() with a generator expression checks for a matching condition.",
      "The practical limits of a heuristic vs. genuine understanding.",
      "How to test a detection function against varied real examples.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass automatically recalls relevant memories before answering AND saves new facts it notices — memory now works transparently, with no manual save/recall commands needed.",
    why:
      "This is what makes long-term memory actually USEFUL day to day: the user doesn't have to explicitly tell Compass to remember or recall anything — it just happens, the way a person who knows you would.",
    fileLocation: "compass-agent/main.py (add build_system_prompt + should_remember, wire into ask_compass)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add near your memory functions)',
        code:
          "MEMORY_TRIGGERS = [\"my name is\", \"i prefer\", \"i am a\", \"i work as\", \"remember that\"]\n\ndef should_remember(text: str) -> bool:\n    lower = text.lower()\n    return any(trigger in lower for trigger in MEMORY_TRIGGERS)\n\ndef build_system_prompt(question: str) -> str:\n    relevant = recall_relevant(question)\n    if not relevant:\n        return SYSTEM_PROMPT\n    return f\"{SYSTEM_PROMPT}\\n\\nRelevant things you remember about this user: {'; '.join(relevant)}\"",
      },
      {
        language: 'python',
        filename: 'main.py (wire both into ask_compass)',
        code:
          "def ask_compass(question: str) -> str:\n    compress_history()\n    conversation_history.append({\"role\": \"user\", \"content\": question})\n\n    if should_remember(question):\n        save_memory(question)   # persists before the answer even comes back\n\n    system_prompt = build_system_prompt(question)\n\n    try:\n        for _ in range(MAX_TURNS):\n            response = with_retry(lambda: client.chat.completions.create(\n                model=MODEL, max_tokens=400, temperature=0.2,\n                tools=TOOLS,\n                messages=[{\"role\": \"system\", \"content\": system_prompt}, *conversation_history],\n            ))\n            # ...rest of the loop is unchanged from Lesson 15...\n    except Exception as err:\n        # ...unchanged error handling...\n        pass",
      },
    ],
    placement:
      "Add should_remember() and build_system_prompt() near your existing memory functions. In ask_compass(), call should_remember(question) right after appending it to history, and save_memory(question) if True. Call build_system_prompt(question) once, and use its result as the FIRST message (role 'system') in EVERY API call inside the loop, replacing the plain SYSTEM_PROMPT constant.",
    implementation:
      "build_system_prompt() calls recall_relevant() (Lesson 16) and, only if it found anything, APPENDS a labeled memory section to the base system prompt string — leaving it completely unchanged when there's nothing relevant, avoiding prompt clutter for ordinary questions. should_remember() runs on every incoming question; when it matches, save_memory() writes the fact to disk BEFORE the API call proceeds — the user experiences no extra wait beyond the embedding call itself, and the save silently succeeds before the main answer flow continues. The tool-use loop's internal logic (turn cap, dispatch, tool-result handling) is completely untouched — only WHICH string becomes the system message has changed.",
    expectedResult:
      "Telling Compass 'My name is Jordan, remember that' in one session, then asking (even in a LATER, separate run) 'What's my name?' now correctly answers 'Jordan' — memory recall and save both happened automatically, with no explicit commands needed.",
    connects:
      "Module 3 is now functionally complete: session memory, bounded growth, summarization, and true cross-session long-term memory, all wired together automatically. Lesson 18 (the Module 3 build) reviews and polishes the whole memory system before Module 4 adds planning and multi-step reasoning on top of it.",
  },

  quiz: [
    { id: 'c17q1', kind: 'concept', prompt: 'What TWO automatic decisions does full memory integration require, per question?', options: ['Only saving', 'Recalling relevant memories AND deciding whether to save something new', 'Only recalling', 'Neither — memory is fully manual'], answerIndex: 1, explanation: "Both recall and the save decision happen automatically for every question, independently." },
    { id: 'c17q2', kind: 'application', prompt: 'Why append recalled memories to the SYSTEM message rather than, say, ignoring them after retrieval?', options: ['Retrieval alone is sufficient', 'The model can only use retrieved memories if they’re actually included in what it reads — the messages list', 'System messages can’t contain memory content', 'It’s purely for logging'], answerIndex: 1, explanation: "Retrieved data has to be injected into the model's input to actually influence its answer." },
    { id: 'c17q3', kind: 'concept', prompt: 'What is a "heuristic" in the context of should_remember()?', options: ['A type of API error', 'A simple, fast rule of thumb (trigger phrases) rather than a fully accurate model-based judgment', 'A vector database', 'A system-message technique unrelated to memory'], answerIndex: 1, explanation: "A heuristic trades some accuracy for simplicity and zero extra cost." },
    { id: 'c17q4', kind: 'debug', prompt: 'A user says "Call me Alex" and Compass doesn’t save it. Likely cause?', options: ['save_memory is broken', '"call me" isn’t in the MEMORY_TRIGGERS list, so the heuristic misses this phrasing', 'The API is down', 'Embeddings failed silently'], answerIndex: 1, explanation: "A trigger-phrase heuristic only catches phrasings explicitly included in its list — a real, acknowledged limitation." },
    { id: 'c17q5', kind: 'application', prompt: 'Why does build_system_prompt() return the PLAIN SYSTEM_PROMPT (unchanged) when relevant is empty?', options: ['A bug', 'To avoid cluttering the system message with an empty/pointless memory section when nothing relevant was found', 'It always ignores memories', 'It disables tool use'], answerIndex: 1, explanation: "Only adding the memory section when there's genuinely something relevant keeps the prompt clean otherwise." },
    { id: 'c17q6', kind: 'code_reading', prompt: 'Why is should_remember() checked BEFORE the main API call, not after?', options: ['No particular reason', 'So the fact can be saved without depending on how the conversation loop concludes', 'It changes the tool dispatch', 'It’s required to be synchronous'], answerIndex: 1, explanation: "Deciding to save based on the user's OWN message doesn't need to wait for the model's answer." },
    { id: 'c17q7', kind: 'concept', prompt: 'What is the tradeoff of a model-based save decision vs. the heuristic?', options: ['No tradeoff, model-based is strictly better with no cost', 'Better judgment/accuracy at the cost of an extra API call', 'It’s free and instant', 'It’s less accurate than the heuristic'], answerIndex: 1, explanation: "Asking the model to judge relevance is more nuanced but adds latency and cost." },
    { id: 'c17q8', kind: 'output', prompt: 'After Compass recalls a memory like "user prefers concise answers," what should change about its NEXT reply?', options: ['Nothing, recall doesn’t affect output', 'It should tend toward a more concise style, since that context is now in its system message', 'It ignores memory entirely', 'It becomes less accurate'], answerIndex: 1, explanation: "Since the recalled fact is injected into the system message, the model can genuinely act on it." },
    { id: 'c17q9', kind: 'project', prompt: "Why doesn't wiring in automatic memory require ANY changes to the tool-use loop's core logic (turn cap, dispatch)?", options: ['It secretly does require changes', 'Memory only changes WHICH system message is used and WHAT gets saved — the loop’s mechanics are unrelated and untouched', 'Tool use stops working once memory is added', 'The loop needs a complete rewrite'], answerIndex: 1, explanation: "Memory integration is additive and orthogonal to the existing tool-calling mechanics." },
    { id: 'c17q10', kind: 'concept', prompt: 'What does Module 3 accomplish overall, by the end of this lesson?', options: ['Deployment to production', 'A complete memory system: session memory, bounded growth, summarization, and automatic long-term recall/save', 'Multi-agent orchestration', 'Fine-tuning a custom model'], answerIndex: 1, explanation: "This lesson completes the full memory arc built across Lessons 13-17." },
  ],

  homework: {
    task:
      "Add basic deduplication to save_memory(): before saving a new fact, check if a very similar memory (cosine similarity above a high threshold, e.g. 0.95) already exists, and skip saving if so.",
    requirements: [
      "Before appending a new memory, embed the new text and compare it against all EXISTING memories' embeddings.",
      "If any existing memory has similarity >= 0.95, skip saving and print that it was a likely duplicate.",
      "Test by saving 'My name is Alex' twice and confirming the second attempt is skipped.",
    ],
    expectedOutcome:
      "Saving the same (or near-identical) fact twice results in only ONE entry in memory.json, with the second attempt printed as skipped rather than creating a duplicate.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 16,
      hint: "Lesson 16 asked you to add list_memories() and a 'memories' REPL command printing every saved fact's text.",
      steps: [
        "Write def list_memories() -> list[str]: return [m['text'] for m in load_memories()]",
        "In the REPL loop, check for 'memories' the same way other commands are checked.",
        "On match, call list_memories() and print each fact on its own line (or a 'no memories yet' message if empty), then continue.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py (inside the REPL loop)',
          code:
            "if question.lower() == \"memories\":\n    facts = list_memories()\n    if not facts:\n        print(\"No memories saved yet.\\n\")\n    else:\n        for f in facts:\n            print(\"-\", f)\n    continue",
        },
      ],
    },
  },
};
