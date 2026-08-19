import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 16 — Long-Term Memory with Vectors
 * Module 3 (Memory + Context) · Lesson 16 of 30
 */
export const lesson16: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 3,
  lessonIndex: 3,
  globalNumber: 16,
  name: 'Long-term memory (vectors)',
  title: 'Long-Term Memory — Remembering Across Sessions',
  subtitle: "Give Compass memory that survives after the program exits, using embeddings and a simple vector store.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what embeddings are, how a vector store finds relevant past information, and how to save/recall facts across separate Compass sessions.",
    sections: [
      {
        heading: 'Session memory vs. long-term memory',
        body:
          "Everything Compass remembers so far (Lessons 13-15) lives in a JavaScript array — gone the moment the program exits. Long-term memory means SAVING important facts somewhere persistent (a file, a database) and being able to RECALL them in a completely separate, later run of the program.",
      },
      {
        heading: 'What is an embedding?',
        body:
          "An embedding is a list of numbers (a vector) representing the MEANING of a piece of text, produced by a specialized model. Two pieces of text with similar MEANING produce vectors that are mathematically close together — this is what lets you search by meaning, not just exact keyword matching.",
        code: {
          language: 'typescript',
          code:
            "// Conceptually:\nembed('The user likes hiking') -> [0.12, -0.05, 0.88, ...]\nembed('outdoor activities the user enjoys') -> [0.14, -0.03, 0.85, ...]  // numerically CLOSE\nembed('favorite pizza toppings') -> [0.91, 0.44, -0.20, ...]            // numerically FAR",
        },
      },
      {
        heading: 'A minimal vector store: save embeddings + text together',
        body:
          "For Compass's beginner-level version, a vector store can be as simple as a JSON file: an array of { text, embedding } entries. Real production systems use a dedicated vector database for speed at scale, but the core IDEA — store text alongside its embedding, then search by similarity — is identical.",
        code: {
          language: 'typescript',
          code:
            "interface MemoryEntry { text: string; embedding: number[]; }\n\nasync function saveMemory(text: string, entries: MemoryEntry[]) {\n  const embedding = await getEmbedding(text);\n  entries.push({ text, embedding });\n}",
        },
      },
      {
        heading: 'Cosine similarity — measuring closeness',
        body:
          "To find the most RELEVANT saved memories for a new question, compute how close each stored embedding is to the question's own embedding — cosine similarity is the standard measure (a value from -1 to 1; closer to 1 means more similar).",
        code: {
          language: 'typescript',
          code:
            "function cosineSimilarity(a: number[], b: number[]): number {\n  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);\n  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));\n  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));\n  return dot / (magA * magB);\n}",
        },
      },
      {
        heading: 'Recalling relevant memories for a new question',
        body:
          "When a new question comes in: embed it, compute similarity against every saved memory, sort by similarity, and pull the top few into the prompt as context — this is the exact idea behind Retrieval-Augmented Generation (RAG), which more advanced material covers at production scale; here you're building the beginner-friendly core of it.",
      },
    ],
    keyTerms: [
      { term: 'Embedding', definition: "A numeric vector representing the MEANING of a piece of text, produced by an embedding model." },
      { term: 'Vector store', definition: "A place (file, database) storing text alongside its embedding, searchable by similarity." },
      { term: 'Cosine similarity', definition: "A measure of how close two vectors are in meaning; closer to 1 means more similar." },
      { term: 'Retrieval', definition: "Finding the most relevant stored memories for a new question, based on similarity." },
      { term: 'RAG (Retrieval-Augmented Generation)', definition: "The general technique of retrieving relevant information and feeding it into a prompt for a grounded answer." },
    ],
    commonMistakes: [
      "Confusing session memory (Lessons 13-15, in-process only) with long-term memory (persisted to disk/database).",
      "Comparing embeddings from DIFFERENT embedding models — vectors are only comparable within the same model's space.",
      "Saving every single message as a memory, creating noise; saving only genuinely important FACTS works better.",
      "Not handling an empty memory store gracefully (a brand-new user has nothing saved yet).",
      "Forgetting that persisted memory needs a real file/database write, not just an in-memory array.",
    ],
    takeaways: [
      "Long-term memory persists ACROSS separate program runs; session memory does not.",
      "An embedding is a numeric vector representing text meaning.",
      "A simple vector store pairs text with its embedding for later retrieval.",
      "Cosine similarity measures how close two embeddings are.",
      "Retrieving relevant memories and adding them to a prompt is the core idea behind RAG.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Finding the closest match by meaning',
    objective:
      "Practise cosine similarity and semantic search with a small, fixed set of made-up 'embeddings' before using real ones.",
    instructions: [
      "Create 3 fake 3-dimensional vectors representing different 'topics'.",
      "Write cosineSimilarity(a, b).",
      "Given a 'query' vector, find which of the 3 is most similar.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'similarity-test.ts',
        code:
          "function cosineSimilarity(a: number[], b: number[]): number {\n  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);\n  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));\n  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));\n  return dot / (magA * magB);\n}\n\nconst memories = [\n  { text: 'User enjoys hiking', vector: [0.9, 0.1, 0.2] },\n  { text: 'User loves Italian food', vector: [0.1, 0.9, 0.3] },\n  { text: 'User works as a teacher', vector: [0.2, 0.3, 0.9] },\n];\n\nconst query = [0.85, 0.15, 0.25];   // pretend this represents \"outdoor activities\"\n\nconst ranked = memories\n  .map((m) => ({ ...m, score: cosineSimilarity(query, m.vector) }))\n  .sort((a, b) => b.score - a.score);\n\nconsole.log('Most relevant:', ranked[0].text, `(score: ${ranked[0].score.toFixed(3)})`);",
      },
    ],
    explanation:
      "Each memory has a hand-crafted vector standing in for a real embedding (in production, an embedding MODEL generates these — this exercise isolates the SIMILARITY MATH so it's easy to reason about). cosineSimilarity computes how aligned two vectors are; the query vector was deliberately made close to the 'hiking' memory's vector. Mapping every memory to its similarity score and sorting descending puts the most relevant match first — exactly the retrieval step a real long-term memory system performs, just with real embeddings instead of hand-picked numbers.",
    expectedOutput:
      "'Most relevant: User enjoys hiking (score: 0.9xx)' — the highest similarity score, correctly identifying the closest match.",
    learned: [
      "How to implement and use cosine similarity.",
      "How to rank a set of stored items by relevance to a query.",
      "The separation between 'similarity math' and 'generating real embeddings'.",
      "The core retrieval mechanic behind long-term semantic memory.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gains real long-term memory — it can save a fact to disk and recall it in a COMPLETELY SEPARATE run of the program.",
    why:
      "This is the biggest memory upgrade in the course: Compass can now genuinely remember things about you across days, not just within one chat session.",
    fileLocation: "compass-agent/memory.json (new, auto-created) + compass-agent/index.ts (add embedding + save/recall functions)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near the top, after imports)',
        code:
          "import * as fs from 'fs/promises';\n\ninterface MemoryEntry { text: string; embedding: number[] }\nconst MEMORY_FILE = './memory.json';\n\nasync function getEmbedding(text: string): Promise<number[]> {\n  const response = await anthropic.embeddings.create({ model: 'voyage-3', input: text });\n  return response.data[0].embedding;\n}\n\nfunction cosineSimilarity(a: number[], b: number[]): number {\n  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);\n  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));\n  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));\n  return dot / (magA * magB);\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (add save/load/recall functions)',
        code:
          "async function loadMemories(): Promise<MemoryEntry[]> {\n  try {\n    const raw = await fs.readFile(MEMORY_FILE, 'utf-8');\n    return JSON.parse(raw);\n  } catch {\n    return [];   // no file yet — brand new user\n  }\n}\n\nasync function saveMemory(text: string) {\n  const memories = await loadMemories();\n  const embedding = await getEmbedding(text);\n  memories.push({ text, embedding });\n  await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));\n  console.log(`[memory] saved: \"${text}\"`);\n}\n\nasync function recallRelevant(question: string, topN = 3): Promise<string[]> {\n  const memories = await loadMemories();\n  if (memories.length === 0) return [];\n  const queryEmbedding = await getEmbedding(question);\n  return memories\n    .map((m) => ({ text: m.text, score: cosineSimilarity(queryEmbedding, m.embedding) }))\n    .sort((a, b) => b.score - a.score)\n    .slice(0, topN)\n    .map((m) => m.text);\n}",
      },
    ],
    placement:
      "Add these functions near the top of index.ts, after your existing imports and TOOLS setup. This lesson introduces the FUNCTIONS; Lesson 17 wires them into Compass's actual conversation flow (deciding when to save/recall automatically).",
    implementation:
      "loadMemories() reads memory.json and gracefully returns an empty array if the file doesn't exist yet (a brand-new user) — the fail-gracefully pattern from Module 1's reliability lessons, applied here. saveMemory() appends a new fact with its real embedding and REWRITES the whole file — simple and correct for a beginner-scale memory store (a real production system would use an actual vector database for efficiency at scale). recallRelevant() embeds the new question, scores every saved memory by similarity, and returns just the top few most relevant facts as plain strings — ready to be inserted into a prompt.",
    expectedResult:
      "Calling saveMemory('The user's name is Alex and they prefer concise answers.') writes it to memory.json. Restarting the ENTIRE program (a fresh process) and calling recallRelevant('What's my name?') correctly retrieves that fact — proof it survived beyond the original session.",
    connects:
      "Compass can now save and retrieve facts, but nothing decides WHEN to do so automatically yet. Lesson 17 wires this into the real conversation flow — recalling relevant memories before answering, and saving new important facts as they come up.",
  },

  quiz: [
    { id: 'c16q1', kind: 'concept', prompt: 'What is the key difference between session memory and long-term memory?', options: ['No real difference', 'Long-term memory persists across SEPARATE program runs; session memory is lost when the program exits', 'Long-term memory is faster', 'Session memory uses more tokens'], answerIndex: 1, explanation: "Persistence beyond the current process is the defining trait of long-term memory." },
    { id: 'c16q2', kind: 'concept', prompt: 'What is an embedding?', options: ['A type of API key', 'A numeric vector representing the MEANING of a piece of text', 'A compressed file format', 'A kind of system prompt'], answerIndex: 1, explanation: "Embeddings are vectors capturing semantic meaning, produced by an embedding model." },
    { id: 'c16q3', kind: 'application', prompt: 'Why does cosine similarity help find relevant memories?', options: ['It measures file size', 'It measures how close two embeddings are in meaning — higher similarity means more relevant', 'It sorts alphabetically', 'It’s unrelated to relevance'], answerIndex: 1, explanation: "Similarity scoring lets you rank stored memories by how closely they relate to a new question." },
    { id: 'c16q4', kind: 'debug', prompt: 'loadMemories() throws no error but returns [] on a brand-new install. Is this correct?', options: ['No, it should crash', 'Yes — a missing memory.json is expected for a first-time user, and returning an empty array handles it gracefully', 'It should return null instead', 'It’s a bug that needs fixing'], answerIndex: 1, explanation: "Gracefully handling the 'no memory file yet' case is the intended, correct behavior." },
    { id: 'c16q5', kind: 'code_reading', prompt: 'What does recallRelevant() return when memories.length === 0?', options: ['undefined', 'An empty array, immediately, without calling the embedding API unnecessarily', 'A crash', 'A random fact'], answerIndex: 1, explanation: "The early return avoids a wasted embedding call when there's nothing to search yet." },
    { id: 'c16q6', kind: 'concept', prompt: 'Why can’t you compare embeddings from two DIFFERENT embedding models directly?', options: ['You always can, no issue', 'Different models produce vectors in different, incompatible numerical spaces', 'It’s a licensing restriction only', 'Embeddings are always identical regardless of model'], answerIndex: 1, explanation: "Vector spaces are model-specific; meaningful comparison requires the same embedding model." },
    { id: 'c16q7', kind: 'application', prompt: 'Why does saveMemory() rewrite the WHOLE memory.json file rather than appending a line?', options: ['It’s a mistake', 'JSON.stringify produces a complete, valid JSON array — safely rewriting the whole file keeps it valid, simple for a beginner-scale store', 'JSON files can’t be appended to at all, ever', 'It’s required by fs/promises'], answerIndex: 1, explanation: "A valid JSON array must be written as a whole; this simple approach is appropriate at small scale." },
    { id: 'c16q8', kind: 'output', prompt: 'After saveMemory() and then restarting the program entirely, what does loadMemories() return?', options: ['An empty array, memory is lost', 'The previously saved memories, read back from the file', 'An error', 'Only session memories'], answerIndex: 1, explanation: "Since the data was written to disk, it's available to a completely new process reading the same file." },
    { id: 'c16q9', kind: 'project', prompt: "Why does this lesson introduce the save/recall FUNCTIONS without wiring them into Compass's main conversation flow yet?", options: ['An oversight to be fixed accidentally', "Separating building the capability from deciding when to use it automatically keeps each step focused and testable", 'It’s impossible to wire them in yet', 'The functions don’t actually work yet'], answerIndex: 1, explanation: "This lesson deliberately isolates the mechanism; the next lesson handles automatic integration." },
    { id: 'c16q10', kind: 'concept', prompt: 'What broader technique is this lesson building the beginner-friendly core of?', options: ['Fine-tuning', 'RAG — Retrieval-Augmented Generation', 'Model routing', 'Multi-agent orchestration'], answerIndex: 1, explanation: "Retrieving relevant stored information to ground a generated answer is the essence of RAG." },
  ],

  homework: {
    task:
      "Add a listMemories() function and a REPL command 'memories' that prints every saved fact (just the text, not the embeddings) so a user can see what Compass remembers about them.",
    requirements: [
      "Write async function listMemories() that loads and returns just the text of every saved memory.",
      "Add a 'memories' command check in the REPL loop (similar to 'help'/'forget'), printing each one on its own line.",
      "Test after saving at least 2 facts and confirm both show up correctly.",
    ],
    expectedOutcome:
      "Typing 'memories' in the REPL prints a clear list of every fact Compass has saved about the user, with no embedding data cluttering the output.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 15,
      hint: "Lesson 15 asked you to add a fallback: if summarizeMessages() fails, fall back to a simple trim instead of leaving history unbounded.",
      steps: [
        "Wrap the summarization portion of compressHistory() in try/catch.",
        "In the catch block, log a warning and perform a simple fallback trim: keep only the most recent N messages via slice, discarding the rest (no summary attempted).",
        "Test by temporarily using an invalid model name in the summarization call, confirming the fallback trim still runs and bounds history.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "async function compressHistory() {\n  const KEEP_RECENT = 10;\n  if (conversationHistory.length <= KEEP_RECENT + 6) return;\n  const toSummarize = conversationHistory.slice(0, -KEEP_RECENT);\n  const recent = conversationHistory.slice(-KEEP_RECENT);\n\n  try {\n    const summary = await summarizeMessages(toSummarize);\n    conversationHistory.length = 0;\n    conversationHistory.push(\n      { role: 'user', content: `[Earlier conversation summary]: ${summary}` },\n      { role: 'assistant', content: 'Understood, I have that context.' },\n      ...recent\n    );\n  } catch {\n    console.warn('[memory] summarization failed, falling back to simple trim');\n    conversationHistory.length = 0;\n    conversationHistory.push(...recent);\n  }\n}",
        },
      ],
    },
  },
};
