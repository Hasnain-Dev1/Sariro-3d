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
  subtitle: "Give Compass memory that survives after the program exits, using real embeddings and a simple vector store.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what embeddings are, how a vector store finds relevant past information, and how to save/recall facts across separate Compass sessions.",
    sections: [
      {
        heading: 'Session memory vs. long-term memory',
        body:
          "Everything Compass remembers so far (Lessons 13-15) lives in a Python list — gone the moment the program exits. Long-term memory means SAVING important facts somewhere persistent (a file, a database) and being able to RECALL them in a completely separate, later run of the program.",
      },
      {
        heading: 'What is an embedding?',
        body:
          "An embedding is a list of numbers (a vector) representing the MEANING of a piece of text, produced by a specialized model. Two pieces of text with similar MEANING produce vectors that are mathematically close together — this is what lets you search by meaning, not just exact keyword matching.\n\nThe openai package doesn't just do chat — it exposes an embeddings endpoint too, through the SAME client you already created for chat.completions. That's a nice simplification: one client, one API key, both chat and embeddings, no second provider or package to wire up.",
        code: {
          language: 'text',
          code:
            "# Conceptually:\nembed('The user likes hiking') -> [0.12, -0.05, 0.88, ...]\nembed('outdoor activities the user enjoys') -> [0.14, -0.03, 0.85, ...]  # numerically CLOSE\nembed('favorite pizza toppings') -> [0.91, 0.44, -0.20, ...]            # numerically FAR",
        },
      },
      {
        heading: 'Generating a real embedding',
        body:
          "Reuse the same `client` object your chat calls already use — just call .embeddings.create() with a model name and the text to embed. No separate client, no separate provider, no extra API key to manage.",
        code: {
          language: 'python',
          code:
            "def get_embedding(text: str) -> list[float]:\n    response = client.embeddings.create(model=\"text-embedding-3-small\", input=[text])\n    return response.data[0].embedding",
        },
      },
      {
        heading: 'A minimal vector store: save embeddings + text together',
        body:
          "For Compass's beginner-level version, a vector store can be as simple as a JSON file: a list of {text, embedding} entries. Real production systems use a dedicated vector database for speed at scale, but the core IDEA — store text alongside its embedding, then search by similarity — is identical.",
      },
      {
        heading: 'Cosine similarity — measuring closeness',
        body:
          "To find the most RELEVANT saved memories for a new question, compute how close each stored embedding is to the question's own embedding — cosine similarity is the standard measure (a value from -1 to 1; closer to 1 means more similar).",
        code: {
          language: 'python',
          code:
            "import math\n\ndef cosine_similarity(a: list[float], b: list[float]) -> float:\n    dot = sum(x * y for x, y in zip(a, b))\n    mag_a = math.sqrt(sum(x * x for x in a))\n    mag_b = math.sqrt(sum(y * y for y in b))\n    return dot / (mag_a * mag_b)",
        },
      },
    ],
    keyTerms: [
      { term: 'Embedding', definition: "A numeric vector representing the MEANING of a piece of text, produced by an embedding model." },
      { term: 'Embeddings endpoint', definition: "The openai client's client.embeddings.create() call — generates embeddings using the SAME client and API key as chat.completions." },
      { term: 'Vector store', definition: "A place (file, database) storing text alongside its embedding, searchable by similarity." },
      { term: 'Cosine similarity', definition: "A measure of how close two vectors are in meaning; closer to 1 means more similar." },
      { term: 'RAG (Retrieval-Augmented Generation)', definition: "The general technique of retrieving relevant information and feeding it into a prompt for a grounded answer." },
    ],
    commonMistakes: [
      "Confusing session memory (Lessons 13-15, in-process only) with long-term memory (persisted to disk/database).",
      "Creating a second client just for embeddings — the same OpenAI-compatible client already handles both chat and embeddings.",
      "Comparing embeddings from DIFFERENT embedding models — vectors are only comparable within the same model's space.",
      "Saving every single message as a memory, creating noise; saving only genuinely important FACTS works better.",
      "Not handling an empty memory store gracefully (a brand-new user has nothing saved yet).",
    ],
    takeaways: [
      "Long-term memory persists ACROSS separate program runs; session memory does not.",
      "An embedding is a numeric vector representing text meaning.",
      "The same openai client used for chat also generates embeddings — one client, one key, both jobs.",
      "A simple vector store pairs text with its embedding for later retrieval.",
      "Cosine similarity measures how close two embeddings are, and retrieving relevant memories into a prompt is the core idea behind RAG.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Finding the closest match by meaning',
    objective:
      "Practise cosine similarity and semantic search with a small, fixed set of made-up 'embeddings' before using real ones.",
    instructions: [
      "Create 3 fake 3-dimensional vectors representing different 'topics'.",
      "Write cosine_similarity(a, b).",
      "Given a 'query' vector, find which of the 3 is most similar.",
    ],
    code: [
      {
        language: 'python',
        filename: 'similarity_test.py',
        code:
          "import math\n\ndef cosine_similarity(a: list[float], b: list[float]) -> float:\n    dot = sum(x * y for x, y in zip(a, b))\n    mag_a = math.sqrt(sum(x * x for x in a))\n    mag_b = math.sqrt(sum(y * y for y in b))\n    return dot / (mag_a * mag_b)\n\nmemories = [\n    {\"text\": \"User enjoys hiking\", \"vector\": [0.9, 0.1, 0.2]},\n    {\"text\": \"User loves Italian food\", \"vector\": [0.1, 0.9, 0.3]},\n    {\"text\": \"User works as a teacher\", \"vector\": [0.2, 0.3, 0.9]},\n]\n\nquery = [0.85, 0.15, 0.25]   # pretend this represents \"outdoor activities\"\n\nranked = sorted(\n    ({**m, \"score\": cosine_similarity(query, m[\"vector\"])} for m in memories),\n    key=lambda m: m[\"score\"], reverse=True,\n)\n\nprint(\"Most relevant:\", ranked[0][\"text\"], f\"(score: {ranked[0]['score']:.3f})\")",
      },
    ],
    explanation:
      "Each memory has a hand-crafted vector standing in for a real embedding (in production, an embedding MODEL generates these — this exercise isolates the SIMILARITY MATH so it's easy to reason about). cosine_similarity computes how aligned two vectors are; the query vector was deliberately made close to the 'hiking' memory's vector. The generator expression {**m, 'score': ...} builds a new dict per memory with the similarity score added, and sorted(..., reverse=True) puts the most relevant match first — exactly the retrieval step a real long-term memory system performs, just with real embeddings instead of hand-picked numbers.",
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
    fileLocation: "compass-agent/memory.json (new, auto-created) + compass-agent/main.py (add embedding + save/recall functions)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add near the top, after imports)',
        code:
          "import json\nimport math\nimport os\n\nMEMORY_FILE = \"memory.json\"\n\ndef get_embedding(text: str) -> list[float]:\n    response = client.embeddings.create(model=\"text-embedding-3-small\", input=[text])\n    return response.data[0].embedding\n\ndef cosine_similarity(a: list[float], b: list[float]) -> float:\n    dot = sum(x * y for x, y in zip(a, b))\n    mag_a = math.sqrt(sum(x * x for x in a))\n    mag_b = math.sqrt(sum(y * y for y in b))\n    return dot / (mag_a * mag_b)",
      },
      {
        language: 'python',
        filename: 'main.py (add save/load/recall functions)',
        code:
          "def load_memories() -> list[dict]:\n    if not os.path.exists(MEMORY_FILE):\n        return []   # no file yet — brand new user\n    with open(MEMORY_FILE, \"r\") as f:\n        return json.load(f)\n\ndef save_memory(text: str) -> None:\n    memories = load_memories()\n    embedding = get_embedding(text)\n    memories.append({\"text\": text, \"embedding\": embedding})\n    with open(MEMORY_FILE, \"w\") as f:\n        json.dump(memories, f, indent=2)\n    print(f'[memory] saved: \"{text}\"')\n\ndef recall_relevant(question: str, top_n: int = 3) -> list[str]:\n    memories = load_memories()\n    if not memories:\n        return []\n    query_embedding = get_embedding(question)\n    scored = [\n        (m[\"text\"], cosine_similarity(query_embedding, m[\"embedding\"]))\n        for m in memories\n    ]\n    scored.sort(key=lambda pair: pair[1], reverse=True)\n    return [text for text, _ in scored[:top_n]]",
      },
    ],
    placement:
      "Add these functions near the top of main.py, after your existing imports and TOOLS setup — no new package install needed, since embeddings come from the SAME openai client. This lesson introduces the FUNCTIONS; Lesson 17 wires them into Compass's actual conversation flow (deciding when to save/recall automatically).",
    implementation:
      "load_memories() reads memory.json and gracefully returns an empty list if the file doesn't exist yet (a brand-new user) — the fail-gracefully pattern from Module 1's reliability lessons, applied here. save_memory() appends a new fact with its real embedding (via client.embeddings.create, the same client already used for chat) and REWRITES the whole file — simple and correct for a beginner-scale memory store (a real production system would use an actual vector database for efficiency at scale). recall_relevant() embeds the new question, scores every saved memory by similarity, sorts descending, and returns just the top few most relevant facts as plain strings — ready to be inserted into a prompt.",
    expectedResult:
      "Calling save_memory(\"The user's name is Alex and they prefer concise answers.\") writes it to memory.json. Restarting the ENTIRE program (a fresh process) and calling recall_relevant(\"What's my name?\") correctly retrieves that fact — proof it survived beyond the original session.",
    connects:
      "Compass can now save and retrieve facts, but nothing decides WHEN to do so automatically yet. Lesson 17 wires this into the real conversation flow — recalling relevant memories before answering, and saving new important facts as they come up.",
  },

  quiz: [
    { id: 'c16q1', kind: 'concept', prompt: 'What is the key difference between session memory and long-term memory?', options: ['No real difference', 'Long-term memory persists across SEPARATE program runs; session memory is lost when the program exits', 'Long-term memory is faster', 'Session memory uses more tokens'], answerIndex: 1, explanation: "Persistence beyond the current process is the defining trait of long-term memory." },
    { id: 'c16q2', kind: 'concept', prompt: 'Why can Compass reuse the SAME client object for both chat and embeddings?', options: ['It can’t — embeddings always require a separate provider', 'The openai package exposes an embeddings endpoint on the same client used for chat.completions, sharing one API key', 'Embeddings are generated by the chat model itself, with no separate call', 'There is no real reason'], answerIndex: 1, explanation: "The OpenAI-compatible client wraps both chat and embeddings endpoints, so one client instance handles both jobs." },
    { id: 'c16q3', kind: 'application', prompt: 'Why does cosine similarity help find relevant memories?', options: ['It measures file size', 'It measures how close two embeddings are in meaning — higher similarity means more relevant', 'It sorts alphabetically', 'It’s unrelated to relevance'], answerIndex: 1, explanation: "Similarity scoring lets you rank stored memories by how closely they relate to a new question." },
    { id: 'c16q4', kind: 'debug', prompt: 'load_memories() raises no error but returns [] on a brand-new install. Is this correct?', options: ['No, it should crash', 'Yes — a missing memory.json is expected for a first-time user, and returning an empty list handles it gracefully', 'It should return None instead', 'It’s a bug that needs fixing'], answerIndex: 1, explanation: "Gracefully handling the 'no memory file yet' case is the intended, correct behavior." },
    { id: 'c16q5', kind: 'code_reading', prompt: 'What does recall_relevant() return when memories is an empty list?', options: ['None', 'An empty list, immediately, without calling the embeddings endpoint unnecessarily', 'A crash', 'A random fact'], answerIndex: 1, explanation: "The early return avoids a wasted embedding call when there's nothing to search yet." },
    { id: 'c16q6', kind: 'concept', prompt: 'Why can’t you compare embeddings from two DIFFERENT embedding models directly?', options: ['You always can, no issue', 'Different models produce vectors in different, incompatible numerical spaces', 'It’s a licensing restriction only', 'Embeddings are always identical regardless of model'], answerIndex: 1, explanation: "Vector spaces are model-specific; meaningful comparison requires the same embedding model." },
    { id: 'c16q7', kind: 'application', prompt: 'Why does save_memory() rewrite the WHOLE memory.json file rather than appending a line?', options: ['It’s a mistake', 'json.dump writes a complete, valid JSON array — safely rewriting the whole file keeps it valid, simple for a beginner-scale store', 'JSON files can’t be appended to at all, ever', 'It’s required by the os module'], answerIndex: 1, explanation: "A valid JSON array must be written as a whole; this simple approach is appropriate at small scale." },
    { id: 'c16q8', kind: 'output', prompt: 'After save_memory() and then restarting the program entirely, what does load_memories() return?', options: ['An empty list, memory is lost', 'The previously saved memories, read back from the file', 'An error', 'Only session memories'], answerIndex: 1, explanation: "Since the data was written to disk, it's available to a completely new process reading the same file." },
    { id: 'c16q9', kind: 'project', prompt: "Why does this lesson introduce the save/recall FUNCTIONS without wiring them into Compass's main conversation flow yet?", options: ['An oversight to be fixed accidentally', "Separating building the capability from deciding when to use it automatically keeps each step focused and testable", 'It’s impossible to wire them in yet', 'The functions don’t actually work yet'], answerIndex: 1, explanation: "This lesson deliberately isolates the mechanism; the next lesson handles automatic integration." },
    { id: 'c16q10', kind: 'concept', prompt: 'What broader technique is this lesson building the beginner-friendly core of?', options: ['Fine-tuning', 'RAG — Retrieval-Augmented Generation', 'Model routing', 'Multi-agent orchestration'], answerIndex: 1, explanation: "Retrieving relevant stored information to ground a generated answer is the essence of RAG." },
  ],

  homework: {
    task:
      "Add a list_memories() function and a REPL command 'memories' that prints every saved fact (just the text, not the embeddings) so a user can see what Compass remembers about them.",
    requirements: [
      "Write def list_memories() -> list[str] that loads and returns just the text of every saved memory.",
      "Add a 'memories' command check in the REPL loop (similar to 'help'/'forget'), printing each one on its own line.",
      "Test after saving at least 2 facts and confirm both show up correctly.",
    ],
    expectedOutcome:
      "Typing 'memories' in the REPL prints a clear list of every fact Compass has saved about the user, with no embedding data cluttering the output.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 15,
      hint: "Lesson 15 asked you to add a fallback: if summarize_messages() fails, fall back to a simple trim instead of leaving history unbounded.",
      steps: [
        "Wrap the summarization portion of compress_history() in try/except.",
        "In the except block, print a warning and perform a simple fallback trim: keep only the most recent N messages via slicing, discarding the rest (no summary attempted).",
        "Test by temporarily using an invalid model name in the summarization call, confirming the fallback trim still runs and bounds history.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "def compress_history() -> None:\n    keep_recent = 10\n    if len(conversation_history) <= keep_recent + 6:\n        return\n    to_summarize = conversation_history[:-keep_recent]\n    recent = conversation_history[-keep_recent:]\n\n    try:\n        summary = summarize_messages(to_summarize)\n        conversation_history[:] = [\n            {\"role\": \"user\", \"content\": f\"[Earlier conversation summary]: {summary}\"},\n            {\"role\": \"assistant\", \"content\": \"Understood, I have that context.\"},\n            *recent,\n        ]\n    except Exception:\n        print(\"[memory] summarization failed, falling back to simple trim\")\n        conversation_history[:] = recent",
        },
      ],
    },
  },
};
