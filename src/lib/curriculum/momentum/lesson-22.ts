import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 22 — Storing Conversations in State
 * Module 4 (AI Features) · Lesson 22 of 30
 */
export const lesson22: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 4,
  lessonIndex: 3,
  globalNumber: 22,
  name: 'Storing conversations in state',
  title: 'Chat History — Turning One Question into a Real Conversation',
  subtitle: "Give Ask Momentum memory: a full back-and-forth conversation, not a single Q&A.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to model a conversation as an array of messages, send the FULL history to the API for context, and render a real chat thread.",
    sections: [
      {
        heading: 'The problem: Ask Momentum forgets everything',
        body:
          "Right now, every question to Ask Momentum is sent alone — Claude has no idea what was asked before. Ask 'What should I focus on?' then 'Why?' and the second question makes no sense without the first. Real chat needs MEMORY: the whole conversation so far.",
      },
      {
        heading: 'Modeling a conversation as an array',
        body:
          "A conversation is naturally a list of messages, each with a role ('user' or 'assistant') and content (the text). This maps directly onto the Anthropic API's own messages format — which is exactly why we model it this way.",
        code: {
          language: 'typescript',
          code:
            "interface ChatMessage { role: 'user' | 'assistant'; content: string }\n\nconst [messages, setMessages] = useState<ChatMessage[]>([]);",
        },
      },
      {
        heading: 'Adding to the conversation immutably',
        body:
          "Just like the habits array, messages should never be mutated directly — always create a new array. When the user sends a message, append a 'user' message; once the AI's reply is complete, append an 'assistant' message.",
        code: {
          language: 'typescript',
          code:
            "setMessages((prev) => [...prev, { role: 'user', content: input }]);\n// ...after the reply streams in fully:\nsetMessages((prev) => [...prev, { role: 'assistant', content: fullReply }]);",
        },
      },
      {
        heading: 'Sending the WHOLE history to the API',
        body:
          "To let Claude 'remember' the conversation, you send the FULL messages array (not just the newest one) with every request — the Anthropic API is stateless; it only knows what's in THIS request. Your server route already accepts a messages array shape; we now pass the real accumulated history instead of a single message.",
        code: {
          language: 'typescript',
          code:
            "const response = await anthropic.messages.create({\n  model: 'claude-sonnet-5',\n  max_tokens: 300,\n  system,\n  messages: messages,   // the FULL conversation so far, not just the latest\n});",
        },
      },
      {
        heading: 'Using the functional setState form',
        body:
          "Notice setMessages((prev) => [...prev, newMsg]) uses a FUNCTION, not a plain value. This 'functional update' form guarantees you're building on the LATEST state, even if multiple updates happen close together (like adding the user message, then shortly after adding the assistant's reply) — safer than referencing the messages variable directly in rapid-fire updates.",
      },
    ],
    keyTerms: [
      { term: 'ChatMessage', definition: "A single turn in a conversation: { role: 'user' | 'assistant', content: string }." },
      { term: 'Conversation history', definition: "The full array of past messages, needed because the API itself has no memory between requests." },
      { term: 'Stateless API', definition: "An API that doesn't remember previous requests — all context must be sent again each time." },
      { term: 'Functional setState', definition: "setter((prev) => newValue) — building the new state from the most recent value, safer for rapid updates." },
    ],
    commonMistakes: [
      "Sending only the newest message to the API, losing all earlier context — the AI can't reference anything said before.",
      "Mutating the messages array directly (messages.push(...)) instead of creating a new array via the setter.",
      "Using setMessages([...messages, newMsg]) back-to-back rapidly, referencing a stale messages variable instead of the functional form.",
      "Forgetting to add the ASSISTANT's reply to history once streaming finishes, so the next question loses that context too.",
      "Letting the conversation grow unbounded forever without any limit, which can eventually hit the model's context size or cost more per call.",
    ],
    takeaways: [
      "Model a conversation as an array of { role, content } messages.",
      "The API is stateless — send the FULL history with every request, not just the latest message.",
      "Update the messages array immutably, appending both user and assistant turns.",
      "Prefer the functional setState form when updates happen in quick succession.",
      "A real chat UI renders the whole messages array, not just the latest exchange.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A local (non-AI) chat log',
    objective:
      "Practise modeling and rendering a growing conversation array before wiring it to the real API.",
    instructions: [
      "Create a \"use client\" component with a messages array in state.",
      "A controlled input + send button appends a 'user' message.",
      "Immediately after, append a hard-coded 'assistant' reply (no API yet) to simulate a response.",
      "Render the full conversation as a list.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/ChatLog.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\ninterface ChatMessage { role: 'user' | 'assistant'; content: string }\n\nexport function ChatLog() {\n  const [messages, setMessages] = useState<ChatMessage[]>([]);\n  const [input, setInput] = useState('');\n\n  function send() {\n    if (!input.trim()) return;\n    setMessages((prev) => [...prev, { role: 'user', content: input }]);\n    setInput('');\n\n    // Simulated reply (real API comes in the final project).\n    setTimeout(() => {\n      setMessages((prev) => [...prev, { role: 'assistant', content: 'Got it — noted!' }]);\n    }, 500);\n  }\n\n  return (\n    <div>\n      <ul>\n        {messages.map((m, i) => (\n          <li key={i}><strong>{m.role}:</strong> {m.content}</li>\n        ))}\n      </ul>\n      <input value={input} onChange={(e) => setInput(e.target.value)} />\n      <button onClick={send}>Send</button>\n    </div>\n  );\n}",
      },
    ],
    explanation:
      "messages grows as a proper conversation array. send() appends a 'user' message using the functional setState form (prev => [...prev, ...]), clears the input, then simulates an async reply with setTimeout, appending an 'assistant' message the SAME immutable way. Using functional updates here matters: if send() were called twice quickly, each update correctly builds on the true latest array rather than a possibly-stale closure value. The render maps over the FULL messages array, showing the whole conversation, not just the latest exchange.",
    expectedOutput:
      "Typing and sending multiple messages builds a growing list: 'user: hello', 'assistant: Got it — noted!', 'user: another one', 'assistant: Got it — noted!', and so on.",
    learned: [
      "How to model a conversation as an array of role/content messages.",
      "How to append immutably with the functional setState form.",
      "Why functional updates are safer for back-to-back state changes.",
      "How to render a full growing conversation.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Ask Momentum becomes a real multi-turn conversation — it remembers earlier questions and renders a proper chat thread.",
    why:
      "A coach that forgets what you just said isn't very useful. This lesson is what makes Ask Momentum feel like an ongoing conversation instead of a one-off Q&A box.",
    fileLocation: "app/api/coach/route.ts (accept full history) and components/AskMomentum.tsx (chat thread UI)",
    code: [
      {
        language: 'typescript',
        filename: 'app/api/coach/route.ts (accept a messages array)',
        code:
          "interface ChatMessage { role: 'user' | 'assistant'; content: string }\n\nexport async function POST(req: NextRequest) {\n  const { messages, habitsContext }: { messages: ChatMessage[]; habitsContext: string } = await req.json();\n  if (!Array.isArray(messages) || messages.length === 0) {\n    return NextResponse.json({ error: 'messages is required.' }, { status: 400 });\n  }\n\n  const system = `You are Ask Momentum, a warm, encouraging habit coach.\nAlways reply in 2-3 sentences, referencing the user's real habits by name when relevant.\nEnd every reply with one specific, doable action.\nThe user's current habits: ${habitsContext || 'no habits yet'}.`;\n\n  const stream = new ReadableStream({\n    async start(controller) {\n      try {\n        const claudeStream = anthropic.messages.stream({\n          model: 'claude-sonnet-5',\n          max_tokens: 300,\n          system,\n          messages,   // the FULL conversation history\n        });\n        for await (const event of claudeStream) {\n          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n            controller.enqueue(new TextEncoder().encode(event.delta.text));\n          }\n        }\n      } finally {\n        controller.close();\n      }\n    },\n  });\n  return new Response(stream);\n}",
      },
      {
        language: 'tsx',
        filename: 'components/AskMomentum.tsx (full chat thread)',
        code:
          "interface ChatMessage { role: 'user' | 'assistant'; content: string }\n\nexport function AskMomentum({ habits }: { habits: Habit[] }) {\n  const [messages, setMessages] = useState<ChatMessage[]>([]);\n  const [input, setInput] = useState('');\n  const [loading, setLoading] = useState(false);\n\n  async function send() {\n    if (!input.trim()) return;\n    const userMsg: ChatMessage = { role: 'user', content: input };\n    const history = [...messages, userMsg];\n    setMessages(history);\n    setInput('');\n    setLoading(true);\n\n    const habitsContext = habits.map((h) => `${h.name} (${h.streak}d)`).join(', ');\n    const res = await fetch('/api/coach', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ messages: history, habitsContext }),\n    });\n    const reader = res.body!.getReader();\n    const decoder = new TextDecoder();\n\n    let fullReply = '';\n    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);   // placeholder to stream into\n    while (true) {\n      const { done, value } = await reader.read();\n      if (done) break;\n      fullReply += decoder.decode(value);\n      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: fullReply }]);\n    }\n    setLoading(false);\n  }\n\n  return (\n    <section id=\"ask\" className=\"py-8\">\n      <h2 className=\"text-xl font-bold mb-3\">Ask Momentum</h2>\n      <div className=\"space-y-2 mb-3\">\n        {messages.map((m, i) => (\n          <p key={i} className={m.role === 'user' ? 'text-slate-800 font-semibold' : 'bg-brand-soft rounded-lg p-3 text-sm'}>\n            {m.role === 'user' ? '🧑 ' : '🌿 '}{m.content}\n          </p>\n        ))}\n      </div>\n      <div className=\"flex gap-2\">\n        <input value={input} onChange={(e) => setInput(e.target.value)} className=\"flex-1 border rounded-lg px-3 py-2\" />\n        <button onClick={send} disabled={loading} className=\"bg-brand text-white font-bold px-4 rounded-lg\">Send</button>\n      </div>\n    </section>\n  );\n}",
      },
    ],
    placement:
      "1) Update /api/coach's route to accept a messages array (from the request body) instead of a single message, and pass it straight through to anthropic.messages.stream. 2) Replace AskMomentum's single input/reply state with a full messages array, updating send() to build the history, POST it, and stream the reply into a growing placeholder message.",
    implementation:
      "history is built as [...messages, userMsg] BEFORE calling setMessages, so we have a reliable local copy to both display immediately and send to the API. The route now takes the whole conversation as messages, letting Claude see everything said so far. The streaming logic gets one clever addition: right after sending, we push an EMPTY assistant placeholder message, then on every chunk, replace ONLY that last message (prev.slice(0, -1) drops it, then we re-add it with the growing text) — this is what makes the reply appear to type itself directly inside the chat thread, rather than in a separate box.",
    expectedResult:
      "Ask Momentum now behaves like a real chat: ask a question, get a streaming reply inline in the thread, ask a FOLLOW-UP question ('why?'), and the reply correctly references the earlier exchange — because the full history is sent every time.",
    connects:
      "Ask Momentum can now hold a real conversation about your habits. Lesson 23 hardens all of this against real-world failure (network errors, rate limits, empty edge cases), and Lesson 24 (the Module 4 build) polishes and reviews the complete AI coach.",
  },

  quiz: [
    { id: 'l22q1', kind: 'concept', prompt: 'Why does Ask Momentum need to send the FULL conversation history, not just the latest message?', options: ['It’s a UI requirement only', 'The API is stateless — it has no memory of earlier messages unless they’re resent', 'It makes replies shorter', 'It’s optional, just a nice-to-have'], answerIndex: 1, explanation: "Since the API doesn't remember previous requests, all needed context must be included every time." },
    { id: 'l22q2', kind: 'code_reading', prompt: 'What shape does a ChatMessage have?', options: ['Just a string', '{ role, content }', '{ id, name }', '{ text, timestamp }'], answerIndex: 1, explanation: "This mirrors the Anthropic API's own messages format: a role and content." },
    { id: 'l22q3', kind: 'application', prompt: 'Why use setMessages((prev) => [...prev, newMsg]) instead of setMessages([...messages, newMsg])?', options: ['No real difference ever', 'The functional form guarantees building on the LATEST state, safer for rapid updates', 'It’s required syntax always', 'It’s faster to type'], answerIndex: 1, explanation: "Functional updates avoid relying on a possibly-stale closure value of messages." },
    { id: 'l22q4', kind: 'debug', prompt: 'Ask Momentum answers a follow-up question ("why?") with something totally unrelated. Likely cause?', options: ['The API is broken', 'Only the latest message was sent, not the full history', 'Streaming failed', 'The system prompt is too short'], answerIndex: 1, explanation: "Without the prior messages, the model has no idea what 'why?' is referring to." },
    { id: 'l22q5', kind: 'code_reading', prompt: 'What does prev.slice(0, -1) do in the streaming update?', options: ['Removes the FIRST message', 'Removes the LAST message (the placeholder being replaced)', 'Clears the whole array', 'Adds a new message'], answerIndex: 1, explanation: "slice(0, -1) returns everything except the last item — dropping the old placeholder before re-adding an updated one." },
    { id: 'l22q6', kind: 'concept', prompt: 'Why push an empty assistant placeholder message before streaming begins?', options: ['It’s required by the API', 'So there’s a message in the array to progressively update as chunks arrive, rendering inline in the thread', 'To reset the conversation', 'It has no purpose'], answerIndex: 1, explanation: "The placeholder gives the streaming logic a target message to replace/update as text arrives, creating the inline typing effect." },
    { id: 'l22q7', kind: 'output', prompt: 'After two full exchanges, how many items are in the messages array?', options: ['1', '2', '4', '0'], answerIndex: 2, explanation: "Each exchange adds one user message and one assistant message: 2 exchanges = 4 messages." },
    { id: 'l22q8', kind: 'application', prompt: 'Where should habitsContext be recalculated for each new question?', options: ['It’s fixed forever after the first message', 'Freshly, each time send() runs, from the current habits prop', 'Only once, hard-coded', 'It’s not needed anymore in this lesson'], answerIndex: 1, explanation: "Recomputing it each send() ensures the AI always has the CURRENT habit state, not stale data from earlier in the session." },
    { id: 'l22q9', kind: 'debug', prompt: 'A student mutates messages directly with messages.push(userMsg) instead of using the setter. What breaks?', options: ['Nothing, it works the same', 'React won’t detect the change and the UI won’t re-render with the new message', 'The API call fails', 'TypeScript blocks it automatically'], answerIndex: 1, explanation: "Direct mutation doesn't create a new array reference, so React has no signal to re-render." },
    { id: 'l22q10', kind: 'project', prompt: "Why is history built as a local variable ([...messages, userMsg]) before calling setMessages, instead of relying on messages directly?", options: ['No real reason', 'Because messages (the state variable) won’t reflect the new message until the NEXT render, but we need the up-to-date list immediately to send to the API', 'It’s required by TypeScript', 'setMessages is asynchronous by name only'], answerIndex: 1, explanation: "State updates aren't immediately reflected in the same function call, so a local variable is needed to have the current, complete list available right away for the fetch." },
  ],

  homework: {
    task:
      "Add a 'Clear conversation' button that resets messages back to an empty array, letting the user start a fresh chat with Ask Momentum without refreshing the whole page.",
    requirements: [
      "Add a button near the chat thread, e.g. 'Clear conversation'.",
      "On click, call setMessages([]) (a legitimate, explicit reset — not an update building on previous state).",
      "The button should be disabled while loading, so a reply mid-stream can't be cleared out from under itself awkwardly.",
    ],
    expectedOutcome:
      "Clicking 'Clear conversation' instantly empties the chat thread, ready for a brand-new conversation with no memory of the old one.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 21,
      hint: "Lesson 21 asked you to add a constraint: when habitsContext is empty, Ask Momentum should specifically encourage adding a first habit.",
      steps: [
        "In the system prompt template, add a line like: 'If the user has no habits yet, warmly encourage them to add their first one instead of giving generic habit advice.'",
        "Test by temporarily calling the route with habitsContext: '' or 'no habits yet' and checking the reply's focus.",
        "Confirm a normal call (with real habits) still references them as expected.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'app/api/coach/route.ts',
          code:
            "const system = `You are Ask Momentum, a warm, encouraging habit coach.\nAlways reply in 2-3 sentences, referencing the user's real habits by name when relevant.\nEnd every reply with one specific, doable action.\nIf the user has no habits yet, warmly encourage them to add their first one instead of giving generic advice.\nThe user's current habits: ${habitsContext || 'no habits yet'}.`;",
        },
      ],
    },
  },
};
