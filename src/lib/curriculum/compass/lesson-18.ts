import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 18 — Module 3 Build: The Memory Agent
 * Module 3 (Memory + Context) · Lesson 18 of 30
 */
export const lesson18: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 3,
  lessonIndex: 5,
  globalNumber: 18,
  name: 'Module 3 build — the memory agent',
  title: 'Module 3 Build — Compass, a Real Memory Agent',
  subtitle: "Polish the memory experience with visible recall feedback and a full end-to-end review.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to make memory recall transparent to the user, and review the complete memory architecture Module 3 built.",
    sections: [
      {
        heading: 'Making recall visible, like tool use was in Module 2',
        body:
          "Module 2's Lesson 12 made tool use transparent to the user ('Calculating...'). Memory deserves the same treatment: when Compass recalls something relevant, a brief note ('Remembering something about you...') builds the same trust and removes the black-box feeling.",
        code: {
          language: 'typescript',
          code:
            "async function buildSystemPrompt(question: string): Promise<string> {\n  const relevant = await recallRelevant(question);\n  if (relevant.length === 0) return SYSTEM_PROMPT;\n  console.log('[memory] recalling relevant context...');\n  return `${SYSTEM_PROMPT}\\n\\nRelevant things you remember about this user: ${relevant.join('; ')}`;\n}",
        },
      },
      {
        heading: 'Reviewing Module 3’s full architecture',
        body:
          "Compass's memory now has FOUR layers working together: session memory (a shared array across a conversation), bounded growth (trimming or summarizing so it doesn't grow forever), long-term storage (a file-based vector store surviving across runs), and automatic recall/save (deciding when to use each, without manual commands). This layered design — not one giant memory system, but several focused pieces — is a pattern worth recognising as reusable far beyond this course.",
      },
      {
        heading: 'A genuine end-to-end memory test',
        body:
          "Before considering Module 3 done, it's worth running through the full arc deliberately: state a fact, ask a follow-up in the SAME session (tests session memory), have a long enough conversation to trigger compression (tests bounded growth), then restart the program entirely and ask about the original fact again (tests true long-term persistence).",
      },
      {
        heading: 'What’s still missing',
        body:
          "Compass can remember, but it still only takes ONE step at a time when reasoning — it doesn't yet make a PLAN for a complex, multi-part task, or reflect on whether its own approach is working. Module 4 (Planning + Reasoning) is exactly that: giving Compass the ability to break down and work through a genuinely complex task, not just answer one question (even a memory-aware one) at a time.",
      },
    ],
    keyTerms: [
      { term: 'Memory transparency', definition: "Showing the user when memory recall is influencing an answer, similar to tool-use transparency." },
      { term: 'Layered memory architecture', definition: "Multiple focused memory mechanisms (session, bounded growth, long-term, auto recall/save) working together rather than one monolithic system." },
    ],
    commonMistakes: [
      "Treating memory recall as invisible/silent, missing the same trust-building opportunity tool-use transparency provided.",
      "Never testing the FULL memory arc end to end — session, compression, AND cross-run persistence together.",
      "Assuming Module 3's memory alone makes Compass capable of complex multi-step tasks — that's a separate capability (planning).",
      "Forgetting the memory system has real limits (heuristic-based saving, lossy summarization) worth being honest about.",
      "Not restarting the actual PROGRAM (not just clearing session memory) when testing long-term persistence specifically.",
    ],
    takeaways: [
      "Memory transparency (visible recall) builds the same trust tool-use transparency did.",
      "Module 3's architecture layers four focused pieces: session, bounded growth, long-term storage, auto recall/save.",
      "Test the FULL memory arc, not just individual pieces in isolation.",
      "Compass still reasons one step at a time — genuine planning is Module 4's job.",
      "A layered design (vs. one giant system) is a reusable architectural pattern.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A memory-recall status line',
    objective:
      "Practise the transparency pattern with a small standalone example showing conditional status messaging.",
    instructions: [
      "Write a function that takes a 'found' boolean and prints a status message accordingly.",
      "Test both the true and false cases.",
      "Extend it to show HOW MANY items were found, if any.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'status-test.ts',
        code:
          "function announceRecall(foundCount: number) {\n  if (foundCount === 0) return;   // silent when there's nothing to report\n  const plural = foundCount === 1 ? 'memory' : 'memories';\n  console.log(`[memory] found ${foundCount} relevant ${plural}`);\n}\n\nannounceRecall(0);\nannounceRecall(1);\nannounceRecall(3);",
      },
    ],
    explanation:
      "announceRecall stays SILENT when foundCount is 0 — an important UX choice: announcing 'found 0 memories' every single time would be noise, not useful signal. The plural handling (memory vs. memories) is a small but genuine polish detail. This exact pattern — informative when there's something to say, quiet otherwise — is what gets applied to Compass's real recall announcement in the final project.",
    expectedOutput:
      "First call prints nothing. Second prints '[memory] found 1 relevant memory'. Third prints '[memory] found 3 relevant memories'.",
    learned: [
      "How to build conditional status messaging that stays quiet when appropriate.",
      "Basic singular/plural handling in a user-facing message.",
      "Why silence is sometimes the right UX choice, not just more logging.",
      "How small polish details compound into a better overall experience.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's memory recall becomes visible to the user, and Module 3's complete memory system is verified end to end — the 'memory agent' milestone.",
    why:
      "This is the Module 3 payoff: a fully working, transparent, multi-layered memory system that makes Compass feel like it genuinely knows the person it's talking to, across time.",
    fileLocation: "compass-agent/index.ts (update buildSystemPrompt with visible recall)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (update buildSystemPrompt)',
        code:
          "async function buildSystemPrompt(question: string): Promise<string> {\n  const relevant = await recallRelevant(question);\n  if (relevant.length === 0) return SYSTEM_PROMPT;\n\n  const plural = relevant.length === 1 ? 'memory' : 'memories';\n  console.log(`[memory] found ${relevant.length} relevant ${plural}`);\n\n  return `${SYSTEM_PROMPT}\\n\\nRelevant things you remember about this user: ${relevant.join('; ')}`;\n}",
      },
    ],
    placement:
      "Replace your existing buildSystemPrompt() (from Lesson 17) with the version above — it's the same logic, with one added status line before returning the enriched prompt.",
    implementation:
      "The function behaves exactly as before functionally — recall, then enrich the system prompt if anything relevant was found — but now announces, with correct singular/plural phrasing, HOW MANY memories were considered relevant, right before that context gets used. Staying silent when relevant.length === 0 (the early return) keeps ordinary questions completely unaffected by this addition, exactly matching the mini-project's principle. This is a genuinely tiny code change delivering real user-facing trust, closing out Module 3's polish pass the same way Lesson 12 closed out Module 2's.",
    expectedResult:
      "Running the full test arc — state a fact, ask a same-session follow-up, have a long conversation trigger compression, restart the program, ask about the original fact again — now works end to end, with '[memory] found N relevant memories' visibly confirming exactly when Compass is drawing on what it remembers.",
    connects:
      "Module 3 is complete: Compass now remembers within a session, manages that memory's growth intelligently, persists real facts across separate runs, and does all of it automatically and transparently. Module 4 (Planning + Reasoning) is next — teaching Compass to break down and work through a genuinely complex, multi-part task using everything built so far.",
  },

  quiz: [
    { id: 'c18q1', kind: 'concept', prompt: 'Why does buildSystemPrompt() stay silent (no log) when relevant.length === 0?', options: ['A bug', 'Announcing "found 0 memories" every time would be noise, not useful signal', 'Logging is disabled entirely', 'It’s required by the API'], answerIndex: 1, explanation: "Silence in the common no-recall case keeps the transparency feature genuinely useful rather than noisy." },
    { id: 'c18q2', kind: 'concept', prompt: 'What are the FOUR layers of Compass’s Module 3 memory architecture?', options: ['Streaming, tools, prompts, errors', 'Session memory, bounded growth, long-term storage, automatic recall/save', 'Only long-term memory', 'Planning, reflection, execution, evaluation'], answerIndex: 1, explanation: "These four focused pieces, built across Lessons 13-17, together form the complete memory system." },
    { id: 'c18q3', kind: 'application', prompt: 'Why test the FULL memory arc (session + compression + cross-run) rather than each piece alone?', options: ['It’s unnecessary if each piece passed its own lesson’s test', 'Individually-working pieces don’t guarantee they integrate correctly as one coherent system', 'Only cross-run memory needs testing', 'Session memory doesn’t need testing'], answerIndex: 1, explanation: "Integration testing catches issues that isolated per-lesson tests might miss, same principle as Module 2's final review." },
    { id: 'c18q4', kind: 'debug', prompt: 'A test restarts the program but forgets to actually close and relaunch the process (just resets a variable instead). What does this fail to verify?', options: ['Nothing, it’s equivalent', 'True LONG-TERM persistence — resetting a variable doesn’t test the case memory.json survives across real separate runs', 'Session memory', 'Tool use'], answerIndex: 1, explanation: "A genuine process restart is required to validate that memory persists beyond the current run, not just within it." },
    { id: 'c18q5', kind: 'concept', prompt: 'What is Compass still missing at the end of Module 3?', options: ['Memory', 'The ability to plan and work through a genuinely complex, multi-step task', 'Tool use', 'A system prompt'], answerIndex: 1, explanation: "Compass still reasons one step/question at a time — planning is Module 4's distinct focus." },
    { id: 'c18q6', kind: 'code_reading', prompt: 'Why does the status message use `foundCount === 1 ? \'memory\' : \'memories\'`?', options: ['No real reason', 'Correct singular/plural grammar for a polished, natural-reading message', 'It changes the recall logic', 'It’s required syntax'], answerIndex: 1, explanation: "This is a small grammar-correctness detail that improves message quality." },
    { id: 'c18q7', kind: 'application', prompt: 'Why is transparency described as building the "same trust" tool-use transparency (Module 2) provided?', options: ['They’re unrelated concepts', 'Both make an otherwise-invisible internal decision visible to the user, reducing the black-box feeling', 'Transparency only matters for tools, not memory', 'It’s a coincidental parallel with no real connection'], answerIndex: 1, explanation: "Both features apply the same underlying UX principle — surfacing what the agent is doing internally." },
    { id: 'c18q8', kind: 'output', prompt: 'If Compass recalls exactly 2 relevant memories for a question, what should print?', options: ['"[memory] found 2 relevant memory"', '"[memory] found 2 relevant memories"', 'Nothing', 'An error'], answerIndex: 1, explanation: "2 is plural, so the correctly pluralized message should print." },
    { id: 'c18q9', kind: 'project', prompt: "Why is this lesson's final code change described as 'genuinely tiny' yet still worth its own dedicated lesson?", options: ['It isn’t actually tiny', 'Small, deliberate polish that meaningfully improves trust/UX is worth calling out and practicing explicitly, not treated as an afterthought', 'All lessons must be equally large', 'It’s filler with no real value'], answerIndex: 1, explanation: "The lesson emphasizes that thoughtful small changes are a real, worthwhile part of building quality software." },
    { id: 'c18q10', kind: 'concept', prompt: 'What will Module 4 build on top of Compass’s current memory and tool capabilities?', options: ['A completely separate, unrelated agent', 'Planning and multi-step reasoning for genuinely complex tasks', 'A user interface', 'Deployment to the web'], answerIndex: 1, explanation: "Module 4 adds planning/reasoning capability, building directly on the tool-use and memory foundations already in place." },
  ],

  homework: {
    task:
      "Write a short MEMORY.md file documenting Compass's memory architecture for your own future reference (and as a portfolio artifact): the four layers, how recall/save decisions are made, and one known limitation.",
    requirements: [
      "Briefly describe each of the four memory layers in your own words.",
      "Explain how the save decision (heuristic) and recall (embedding similarity) work.",
      "Name at least one honest limitation (e.g. the heuristic can miss unusual phrasings, or summarization is lossy).",
    ],
    expectedOutcome:
      "A clear, concise MEMORY.md that could explain Compass's memory system to someone else (or remind future-you) without needing to re-read all the code.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 17,
      hint: "Lesson 17 asked you to add deduplication to saveMemory(), skipping a save if a very similar memory (similarity >= 0.95) already exists.",
      steps: [
        "Inside saveMemory(), after computing the new embedding, loop through loaded memories and compute cosineSimilarity against each existing embedding.",
        "If any existing memory has similarity >= 0.95, log that it's a likely duplicate and return WITHOUT appending or writing the file.",
        "Otherwise, proceed with the normal append + write as before.",
        "Test by saving the same fact twice in a row and confirming only one entry ends up in memory.json.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "async function saveMemory(text: string) {\n  const memories = await loadMemories();\n  const embedding = await getEmbedding(text);\n\n  const isDuplicate = memories.some((m) => cosineSimilarity(embedding, m.embedding) >= 0.95);\n  if (isDuplicate) {\n    console.log(`[memory] skipped likely duplicate: \"${text}\"`);\n    return;\n  }\n\n  memories.push({ text, embedding });\n  await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));\n  console.log(`[memory] saved: \"${text}\"`);\n}",
        },
      ],
    },
  },
};
