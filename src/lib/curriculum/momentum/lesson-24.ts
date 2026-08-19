import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 24 — Module 4 Build: Ask Momentum, Complete
 * Module 4 (AI Features) · Lesson 24 of 30
 */
export const lesson24: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 4,
  lessonIndex: 5,
  globalNumber: 24,
  name: 'Module 4 build — Ask Momentum, complete',
  title: 'Module 4 Build — Ask Momentum, a Finished AI Coach',
  subtitle: "Auto-scroll, suggested prompts, and a full review of the AI coach feature.",

  concept: {
    durationMin: 15,
    summary:
      "Add the finishing UX details real chat products have — auto-scroll and quick-start prompts — and review the complete architecture of an AI feature built across this module.",
    sections: [
      {
        heading: 'Auto-scrolling to the newest message',
        body:
          "As a conversation grows, new messages appear below the visible area unless the chat auto-scrolls. The pattern: a useRef pointing at an empty div AFTER the last message, and a useEffect that calls scrollIntoView on it every time messages changes.",
        code: {
          language: 'tsx',
          code:
            "const bottomRef = useRef<HTMLDivElement>(null);\n\nuseEffect(() => {\n  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });\n}, [messages]);\n\n// in the JSX, after the mapped messages:\n<div ref={bottomRef} />",
        },
      },
      {
        heading: 'What is useRef, briefly?',
        body:
          "useRef creates a value that PERSISTS across renders but, unlike state, changing it does NOT trigger a re-render. Attached to a DOM element via the ref prop, .current gives you direct access to that real element — exactly what scrollIntoView needs.",
      },
      {
        heading: 'Suggested prompts — reducing the blank-page problem',
        body:
          "An empty chat input can be intimidating — what should the user even ask? Many AI products offer a few clickable suggested questions. Clicking one fills the input (or sends immediately) instead of asking the user to think of something from scratch.",
        code: {
          language: 'tsx',
          code:
            "const SUGGESTIONS = ['What should I focus on today?', 'Why is my reading streak stuck?', 'Give me a motivation boost'];\n\n{SUGGESTIONS.map((s) => (\n  <button key={s} onClick={() => setInput(s)}>{s}</button>\n))}",
        },
      },
      {
        heading: 'Reviewing Module 4’s complete architecture',
        body:
          "Trace the full path: a click sets input via a controlled field → send() builds history and calls YOUR server route → the route validates input, builds a system prompt WITH real habit context, and streams from Claude → the client reads chunks and updates a placeholder message → errors at any stage are caught and shown clearly. This is a genuinely production-shaped AI feature, built entirely from concepts you already knew (state, effects, fetch, forms) plus the AI-specific layer (streaming, prompting, context).",
      },
      {
        heading: 'A note on cost and scope for a real product',
        body:
          "A shipped product would also track usage/cost per user, cache repeated questions, and possibly limit free-tier message counts — worth knowing exists, even though implementing it is beyond this course's scope. Recognising these as the 'next things a real team would add' is itself valuable engineering awareness.",
      },
    ],
    keyTerms: [
      { term: 'useRef', definition: "A Hook that persists a value across renders without causing a re-render when it changes; often used to reference a real DOM element." },
      { term: 'scrollIntoView', definition: "A DOM method that scrolls an element into the visible viewport." },
      { term: 'Suggested prompts', definition: "Clickable example questions that help a user start a conversation with an AI feature." },
      { term: 'Auto-scroll', definition: "Automatically scrolling to the newest content as it's added, a standard chat UX pattern." },
    ],
    commonMistakes: [
      "Using state instead of a ref for something that doesn't need to trigger a re-render, like a scroll target.",
      "Forgetting the dependency array on the auto-scroll effect, or watching the wrong value (should be [messages]).",
      "Overloading the UI with too many suggested prompts, cluttering a simple feature.",
      "Not testing auto-scroll with a genuinely long conversation, where the effect matters most.",
      "Treating 'it works on the happy path' as 'it's done' — polish and edge-case review matter as much as the core feature.",
    ],
    takeaways: [
      "useRef + scrollIntoView is the standard React pattern for auto-scrolling a chat.",
      "Suggested prompts lower the barrier to starting a conversation.",
      "A finished AI feature combines: state, effects, fetch, streaming, prompting, and error handling — all concepts already covered.",
      "Real products also consider cost/usage tracking, beyond this course's scope but good to know exists.",
      "Polish passes (small UX details) are what separate 'it works' from 'it feels good to use'.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'An auto-scrolling message list',
    objective:
      "Practise the useRef + scrollIntoView pattern with a simple growing list, before applying it to the real Ask Momentum thread.",
    instructions: [
      "Create a \"use client\" component with a scrollable, fixed-height message container.",
      "A button appends a new message to a list each click.",
      "Use a ref + useEffect to scroll to the bottom every time the list grows.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/AutoScrollList.tsx',
        code:
          "'use client';\nimport { useEffect, useRef, useState } from 'react';\n\nexport function AutoScrollList() {\n  const [items, setItems] = useState<string[]>([]);\n  const bottomRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });\n  }, [items]);\n\n  return (\n    <div>\n      <button onClick={() => setItems((prev) => [...prev, `Message ${prev.length + 1}`])}>\n        Add message\n      </button>\n      <div style={{ height: 150, overflowY: 'auto', border: '1px solid #e2e8f0' }}>\n        {items.map((item, i) => <p key={i}>{item}</p>)}\n        <div ref={bottomRef} />\n      </div>\n    </div>\n  );\n}",
      },
    ],
    explanation:
      "bottomRef is attached to an empty div placed AFTER every rendered message — the effect watches [items] and calls scrollIntoView on that ref's current element every time a new one is added, smoothly scrolling the container so the newest message is always visible. Because useRef's value persists without causing its own re-render, this ref just sits quietly available for the effect to use, exactly the role it plays.",
    expectedOutput:
      "Clicking 'Add message' repeatedly fills the small scrollable box, which automatically scrolls down to reveal each newest message as it's added.",
    learned: [
      "How to attach a ref to a DOM element.",
      "How to auto-scroll using scrollIntoView inside a useEffect.",
      "Why a ref, not state, is the right tool for a scroll target.",
      "The dependency-array trigger for 'run when this list grows'.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Ask Momentum gets auto-scroll and suggested starter prompts — the final polish that completes Module 4's AI coach.",
    why:
      "This is the Module 4 milestone: Ask Momentum should now feel like a genuinely finished feature — easy to start using, easy to follow as it grows, and resilient when things go wrong.",
    fileLocation: "components/AskMomentum.tsx (add ref + suggestions)",
    code: [
      {
        language: 'tsx',
        filename: 'components/AskMomentum.tsx (final version additions)',
        code:
          "const SUGGESTIONS = [\n  'What should I focus on today?',\n  'Why is my streak stuck?',\n  'Give me a motivation boost',\n];\n\nexport function AskMomentum({ habits }: { habits: Habit[] }) {\n  // ...existing messages/input/loading/error state\n  const bottomRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });\n  }, [messages]);\n\n  // ...existing send() unchanged\n\n  return (\n    <section id=\"ask\" className=\"py-8\">\n      <h2 className=\"text-xl font-bold mb-3\">Ask Momentum</h2>\n\n      {messages.length === 0 && (\n        <div className=\"flex flex-wrap gap-2 mb-3\">\n          {SUGGESTIONS.map((s) => (\n            <button\n              key={s}\n              onClick={() => setInput(s)}\n              className=\"text-xs bg-brand-soft text-brand-dark border border-brand/20 rounded-full px-3 py-1.5\"\n            >\n              {s}\n            </button>\n          ))}\n        </div>\n      )}\n\n      <div className=\"space-y-2 mb-3 max-h-72 overflow-y-auto\">\n        {messages.map((m, i) => (\n          <p key={i} className={m.role === 'user' ? 'text-slate-800 font-semibold' : 'bg-brand-soft rounded-lg p-3 text-sm'}>\n            {m.role === 'user' ? '🧑 ' : '🌿 '}{m.content}\n          </p>\n        ))}\n        {error && <p className=\"text-red-500 text-sm\">{error}</p>}\n        <div ref={bottomRef} />\n      </div>\n\n      <div className=\"flex gap-2\">\n        <input value={input} onChange={(e) => setInput(e.target.value)} className=\"flex-1 border rounded-lg px-3 py-2\" />\n        <button onClick={send} disabled={loading} className=\"bg-brand text-white font-bold px-4 rounded-lg\">Send</button>\n      </div>\n      <button onClick={() => setMessages([])} disabled={loading} className=\"text-xs text-slate-400 hover:text-slate-600 mt-2\">\n        Clear conversation\n      </button>\n    </section>\n  );\n}",
      },
    ],
    placement:
      "Add the SUGGESTIONS array, the bottomRef + its useEffect, the suggestion buttons (shown only when messages.length === 0), and the <div ref={bottomRef} /> at the end of the scrollable message container, inside your existing AskMomentum component. Leave send(), the route, and everything from Lessons 19-23 as they are.",
    implementation:
      "The suggestion buttons only render when messages.length === 0 — the moment the first message is sent, they disappear, since they've served their purpose (getting the conversation started). Clicking one calls setInput(s), filling the controlled input exactly as if the user had typed it — they could then edit it or just click Send. The bottomRef + useEffect pair follows the mini-project's pattern exactly, now watching the real messages array, so every new user question or streaming reply keeps the latest content in view. max-h-72 overflow-y-auto on the message container gives the chat a bounded, scrollable area rather than growing the whole page indefinitely.",
    expectedResult:
      "Opening Ask Momentum for the first time shows three clickable suggestion chips instead of a blank box. As a conversation grows, the thread automatically scrolls to keep the latest message visible — Ask Momentum now looks and feels like a finished, professional AI feature.",
    connects:
      "Module 4 is complete: Momentum has a real, streaming, context-aware, resilient, polished AI coach. Module 5 takes this ENTIRE application — habits, React architecture, and Ask Momentum — and deploys it live to the internet with a real domain, closing out the course.",
  },

  quiz: [
    { id: 'l24q1', kind: 'concept', prompt: 'What does useRef provide that useState doesn’t?', options: ['Nothing different', 'A value that persists across renders WITHOUT causing a re-render when changed', 'Automatic API calls', 'Built-in styling'], answerIndex: 1, explanation: "Refs persist without triggering re-renders, unlike state, making them ideal for things like DOM references." },
    { id: 'l24q2', kind: 'code_reading', prompt: 'What does bottomRef.current?.scrollIntoView(...) do?', options: ['Deletes the referenced element', 'Scrolls the referenced element into the visible viewport', 'Creates a new element', 'Sends a network request'], answerIndex: 1, explanation: "scrollIntoView is a DOM method that scrolls its element into view." },
    { id: 'l24q3', kind: 'application', prompt: 'Why watch [messages] as the auto-scroll effect’s dependency?', options: ['Random choice', 'So it re-runs (and re-scrolls) every time a new message is added', 'To prevent scrolling ever', 'It’s required syntax with no meaning'], answerIndex: 1, explanation: "The effect should re-fire whenever the message list changes, which is exactly what [messages] watches." },
    { id: 'l24q4', kind: 'concept', prompt: 'Why show suggested prompts only when messages.length === 0?', options: ['They must always show', 'They help start a conversation from a blank state; once messages exist, they’re no longer needed', 'It’s a bug otherwise', 'They control the API'], answerIndex: 1, explanation: "Suggestions solve the 'blank page' problem for a NEW conversation; they'd clutter an ongoing one." },
    { id: 'l24q5', kind: 'code_reading', prompt: 'What happens when a user clicks a suggestion button?', options: ['A message is sent immediately with no way to edit', 'setInput(s) fills the input field with that suggestion text', 'Nothing happens', 'It clears the conversation'], answerIndex: 1, explanation: "Clicking a suggestion sets the controlled input's value, letting the user send it as-is or edit it first." },
    { id: 'l24q6', kind: 'debug', prompt: 'A chat thread stops auto-scrolling after adding a max-h-72 overflow-y-auto container. What might be missing?', options: ['Nothing, this shouldn’t affect scrolling', 'The bottomRef div must still be INSIDE the scrollable container, after the last message', 'overflow-y-auto breaks refs entirely', 'useEffect no longer works in a scrollable div'], answerIndex: 1, explanation: "scrollIntoView scrolls within the nearest scrollable ancestor — the ref target must be inside that container." },
    { id: 'l24q7', kind: 'concept', prompt: 'What is the FULL path a question takes through Ask Momentum, in order?', options: ['Input -> API directly -> reply', 'Input -> your server route -> Claude API (streaming) -> your route -> client renders chunks', 'Input -> localStorage -> reply', 'Input -> CSS -> reply'], answerIndex: 1, explanation: "The browser never talks to Claude directly — it goes through your own server route both ways." },
    { id: 'l24q8', kind: 'application', prompt: 'What’s a reasonable NEXT step for a real product, beyond this course’s scope?', options: ['Nothing, it’s fully done forever', 'Tracking usage/cost per user and possibly rate-limiting free users', 'Removing error handling', 'Removing streaming'], answerIndex: 1, explanation: "Production AI features commonly add usage tracking and tiered limits, which is real engineering awareness even if not implemented here." },
    { id: 'l24q9', kind: 'project', prompt: "Why is 'Clear conversation' still disabled while loading, even in this final version?", options: ['No real reason', 'To avoid clearing history out from under an in-progress streaming reply', 'It’s a leftover bug', 'disabled has no effect on buttons'], answerIndex: 1, explanation: "Clearing mid-stream could create a confusing state where a reply is still streaming into a now-empty conversation." },
    { id: 'l24q10', kind: 'concept', prompt: 'What has Module 4 added to Momentum overall?', options: ['A payment system', 'A real, streaming, context-aware, resilient AI coach (Ask Momentum)', 'A new database', 'A mobile app version'], answerIndex: 1, explanation: "Module 4's entire arc built Ask Momentum from a basic API call to a polished, production-shaped AI feature." },
  ],

  homework: {
    task:
      "Add a subtle 'Ask Momentum is thinking' typing indicator with three animated dots (a small CSS animation) shown in place of the empty placeholder message while waiting for the first chunk — replacing any plain-text version from earlier lessons with a more polished visual.",
    requirements: [
      "Create a small TypingDots component (three spans with a staggered CSS animation, or a simple @keyframes pulse).",
      "Show it exactly when loading is true and the last message (if assistant) is still empty.",
      "It should smoothly disappear the moment real text starts streaming in.",
    ],
    expectedOutcome:
      "A small, polished animated typing indicator appears briefly before each AI reply starts streaming, then is replaced by the growing text.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 23,
      hint: "Lesson 23 asked you to detect the '[error]...' marker mid-stream and show it as a clean error message instead of raw text in the chat bubble.",
      steps: [
        "While accumulating fullReply in the read loop, check if it includes '\\n[error]'.",
        "If found, split on that marker: the part before is any partial good reply, the part after is the error text.",
        "Call setError with the error part, and update the assistant placeholder with only the partial reply (or remove it if empty).",
        "Stop appending further chunks to the bubble once the marker is detected.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/AskMomentum.tsx (inside the read loop)',
          code:
            "fullReply += decoder.decode(value);\nif (fullReply.includes('\\n[error]')) {\n  const [partial, errMsg] = fullReply.split('\\n[error]');\n  setError(errMsg || 'Something went wrong.');\n  setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: partial }]);\n  break;\n}\nsetMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: fullReply }]);",
        },
      ],
    },
  },
};
