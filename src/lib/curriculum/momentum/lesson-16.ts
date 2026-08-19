import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 16 — Conditional Rendering & Lists
 * Module 3 (React + Next.js) · Lesson 16 of 30
 */
export const lesson16: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 3,
  lessonIndex: 3,
  globalNumber: 16,
  name: 'Conditional rendering & lists',
  title: 'Conditional Rendering — Forms, Empty States & Full CRUD',
  subtitle: "Add a real add-habit form and delete buttons — completing full CRUD in React.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the patterns for showing different UI based on a condition, and build a controlled form — completing add/toggle/delete entirely in React.",
    sections: [
      {
        heading: 'Conditional rendering with ternary and &&',
        body:
          "JSX can't use if/else statements directly inside markup, so React relies on JavaScript expressions. The ternary operator (condition ? A : B) picks between two things to render. The && operator renders something ONLY if a condition is true (and renders nothing — false — otherwise), which is perfect for optional content.",
        code: {
          language: 'tsx',
          code:
            "{loading ? <p>Loading…</p> : <p>{quote}</p>}\n\n{habits.length === 0 && <p>No habits yet — add one below!</p>}",
        },
      },
      {
        heading: 'Controlled inputs — React owns the value',
        body:
          "In a 'controlled' input, the input's value comes FROM state, and every keystroke updates that state via onChange. This means React always knows exactly what's typed — no need to read the DOM directly like Module 2's input.value.",
        code: {
          language: 'tsx',
          code:
            "const [text, setText] = useState('');\n\n<input\n  value={text}\n  onChange={(e) => setText(e.target.value)}\n/>",
        },
      },
      {
        heading: 'Handling form submission',
        body:
          "A <form>'s onSubmit handler receives the same kind of event object from Module 2 — call event.preventDefault() to stop the page reloading, then use the controlled state to do whatever the form is for (like adding a habit), and reset the input state back to '' afterward.",
        code: {
          language: 'tsx',
          code:
            "function handleSubmit(e: React.FormEvent) {\n  e.preventDefault();\n  if (!text.trim()) return;\n  addItem(text);\n  setText('');\n}\n\n<form onSubmit={handleSubmit}>…</form>",
        },
      },
      {
        heading: 'Removing an item — filter, immutably',
        body:
          "Just like toggling, deleting uses an immutable update: setHabits(habits.filter((h) => h.id !== id)) creates a NEW array without the matching habit, rather than mutating the old one. This is the same three-operation set (map to update, filter to remove, spread to add) you'll reuse constantly in React.",
      },
      {
        heading: 'Stopping a click from also triggering a parent handler',
        body:
          "If a delete button sits INSIDE a clickable card (like HabitCard, which toggles on click), clicking Delete would also fire the card's onClick — a classic bug from Module 2's homework, now in React form. The fix: call event.stopPropagation() inside the delete button's own onClick, which stops the click from 'bubbling up' to the parent's handler.",
        code: {
          language: 'tsx',
          code:
            "<button onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}>✕</button>",
        },
      },
    ],
    keyTerms: [
      { term: 'Ternary operator', definition: "condition ? A : B — picks one of two values/elements to render." },
      { term: '&& rendering', definition: "condition && <Element /> — renders the element only when condition is true." },
      { term: 'Controlled input', definition: "An input whose value comes from state and is updated via onChange." },
      { term: 'onSubmit', definition: "The form event handler for submission; almost always needs preventDefault()." },
      { term: 'stopPropagation', definition: "Stops a click event from bubbling up to a parent element's own click handler." },
    ],
    commonMistakes: [
      "Using an if statement directly inside JSX markup — JSX only accepts expressions, so use ternary or && instead.",
      "Forgetting onChange on a controlled input, making it impossible to type (the value never updates).",
      "Forgetting preventDefault() on form submit, causing a full page reload.",
      "Deleting via .splice() (mutating) instead of .filter() (immutable) — breaks React's change detection.",
      "Forgetting stopPropagation() on a nested delete button, causing a click on Delete to ALSO trigger the parent card's onClick.",
    ],
    takeaways: [
      "Use ternary (? :) to choose between two renders, && for optional content.",
      "Controlled inputs keep value and onChange in sync with state.",
      "Always preventDefault() in a form's onSubmit handler.",
      "Delete with .filter() to stay immutable.",
      "stopPropagation() prevents a nested click from also firing a parent's handler.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A controlled search filter',
    objective:
      "Practise controlled inputs and conditional rendering by filtering a list live as the user types.",
    instructions: [
      "Create a \"use client\" component with a list of names in state (or a plain constant).",
      "Add a controlled search input.",
      "Filter the list to only names containing the search text (case-insensitive).",
      "Show a 'No matches' message when the filtered list is empty.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/SearchList.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\nconst names = ['Aisha', 'Sam', 'Lucia', 'Omar', 'Zara'];\n\nexport function SearchList() {\n  const [query, setQuery] = useState('');\n\n  const filtered = names.filter((n) => n.toLowerCase().includes(query.toLowerCase()));\n\n  return (\n    <div>\n      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder=\"Search…\" />\n      {filtered.length === 0 ? (\n        <p>No matches.</p>\n      ) : (\n        <ul>{filtered.map((n) => <li key={n}>{n}</li>)}</ul>\n      )}\n    </div>\n  );\n}",
      },
    ],
    explanation:
      "query is controlled state driving the input's value, updated on every keystroke via onChange. filtered is recalculated on EVERY render directly from names and query — no separate state needed, since it's fully derived. The ternary picks between a 'No matches' message and the real list based on filtered.length, exactly the pattern Momentum's empty-habit-list state will use. Typing instantly narrows the list because React re-renders the moment query changes.",
    expectedOutput:
      "Typing 'a' shows Aisha, Lucia, Zara, Omar (all contain 'a'); typing 'xyz' shows 'No matches.' instead of an empty list.",
    learned: [
      "How to build a controlled search input.",
      "How to derive a filtered list from state on every render.",
      "How ternary picks between an empty-state message and real content.",
      "Why filtering doesn't need its own state — it's computed.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "A real add-habit form and delete buttons in React — Momentum now has full create/read/update/delete, matching Module 2's feature set.",
    why:
      "Momentum can currently only toggle habits. Without add and delete, it's not a real tracker. This lesson completes the CRUD operations entirely in React's controlled, immutable style.",
    fileLocation: "components/HabitsSection.tsx (add form + delete logic), components/HabitCard.tsx (add delete button)",
    code: [
      {
        language: 'tsx',
        filename: 'components/HabitCard.tsx (add a delete button)',
        code:
          "export function HabitCard({\n  habit, onToggle, onDelete,\n}: { habit: Habit; onToggle: (id: number) => void; onDelete: (id: number) => void }) {\n  return (\n    <li\n      onClick={() => onToggle(habit.id)}\n      className=\"flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-sm\"\n    >\n      <span>{habit.done ? '✅' : '⬜'}</span>\n      <span className=\"font-semibold flex-1\">{habit.name} · {habit.streak}d</span>\n      <button\n        onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}\n        className=\"text-slate-400 hover:text-red-500\"\n      >\n        ✕\n      </button>\n    </li>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'components/HabitsSection.tsx (add form state, addHabit, removeHabit, and empty state)',
        code:
          "const [newName, setNewName] = useState('');\n\nfunction addHabit(name: string) {\n  const nextId = Math.max(0, ...habits.map((h) => h.id)) + 1;\n  setHabits([...habits, { id: nextId, name, done: false, streak: 0 }]);\n}\n\nfunction removeHabit(id: number) {\n  setHabits(habits.filter((h) => h.id !== id));\n}\n\nfunction handleSubmit(e: React.FormEvent) {\n  e.preventDefault();\n  const trimmed = newName.trim();\n  if (!trimmed) return;\n  addHabit(trimmed);\n  setNewName('');\n}\n\n// ...in the JSX, above the <ul>:\n<form onSubmit={handleSubmit} className=\"flex gap-2 mb-4\">\n  <input\n    value={newName}\n    onChange={(e) => setNewName(e.target.value)}\n    placeholder=\"New habit…\"\n    className=\"flex-1 border border-slate-200 rounded-lg px-3 py-2\"\n  />\n  <button type=\"submit\" className=\"bg-green-600 text-white font-bold px-4 rounded-lg\">Add</button>\n</form>\n\n{habits.length === 0 ? (\n  <p className=\"text-slate-400 text-sm\">No habits yet — add your first one above!</p>\n) : (\n  <ul className=\"space-y-2\">\n    {habits.map((habit) => (\n      <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onDelete={removeHabit} />\n    ))}\n  </ul>\n)}",
      },
    ],
    placement:
      "1) Update HabitCard.tsx to accept an onDelete prop and render the delete button with stopPropagation. 2) In HabitsSection.tsx, add the newName state, addHabit, removeHabit, and handleSubmit functions near toggleHabit. 3) Add the <form> above the habit list, and wrap the <ul> in the empty-state ternary, passing onDelete={removeHabit} to each HabitCard.",
    implementation:
      "addHabit computes a safe next id the same way Module 2's homework did, then calls setHabits with a NEW array (spread + the new object) — immutable, as always. removeHabit filters the matching habit out. The form is fully controlled: newName state drives the input, handleSubmit prevents the reload, validates a trimmed non-empty value, calls addHabit, and clears the input. HabitCard's delete button calls e.stopPropagation() before onDelete, so clicking ✕ removes the habit WITHOUT also toggling it — solving the exact bug Module 2's homework had to watch out for, but now enforced cleanly by React's event system. The empty-state ternary shows a friendly message instead of a blank list when habits.length is 0.",
    expectedResult:
      "Typing a name and clicking Add instantly adds a new habit card. Clicking a card toggles it; clicking its ✕ removes ONLY that card, without toggling it first. Deleting every habit shows the 'No habits yet' message.",
    connects:
      "Momentum's React version now matches Module 2's full feature set — add, toggle, delete, empty state — but built the idiomatic React way. Lesson 17 gives it Tailwind polish (matching Module 1's finished visual identity), and Lesson 18 adds persistence to complete Module 3.",
  },

  quiz: [
    { id: 'l16q1', kind: 'concept', prompt: 'Why can’t you write a plain if/else statement directly inside JSX markup?', options: ['JSX doesn’t support logic at all', 'JSX only accepts expressions, not statements — use ternary or && instead', 'if/else is deprecated in JavaScript', 'It’s a TypeScript-only limitation'], answerIndex: 1, explanation: "JSX embeds expressions (things that produce a value), and if/else is a statement, not an expression." },
    { id: 'l16q2', kind: 'code_reading', prompt: 'What does {habits.length === 0 && <p>Empty</p>} render when habits has 3 items?', options: ['<p>Empty</p>', 'Nothing (false renders nothing)', 'An error', 'Always the paragraph'], answerIndex: 1, explanation: "Since the condition is false, && short-circuits and renders nothing." },
    { id: 'l16q3', kind: 'application', prompt: 'What makes an input "controlled" in React?', options: ['It has a placeholder', 'Its value comes from state, updated via onChange', 'It uses type="text"', 'It has a name attribute'], answerIndex: 1, explanation: "A controlled input's displayed value is driven by React state, kept in sync via onChange." },
    { id: 'l16q4', kind: 'debug', prompt: 'A form reloads the page every time it’s submitted. What’s missing?', options: ['onChange on the input', 'event.preventDefault() in the onSubmit handler', 'A key prop', 'stopPropagation()'], answerIndex: 1, explanation: "Without preventDefault(), the browser performs its default form submission (a reload)." },
    { id: 'l16q5', kind: 'code_reading', prompt: 'What does habits.filter((h) => h.id !== id) produce?', options: ['The original array, mutated', 'A new array excluding the matching habit', 'Only the matching habit', 'An error'], answerIndex: 1, explanation: "filter builds a new array keeping only items where the condition (not matching id) is true." },
    { id: 'l16q6', kind: 'debug', prompt: 'Clicking a habit card’s delete button ALSO toggles the habit. What fixes this?', options: ['Remove onClick from the card', 'Call e.stopPropagation() in the delete button’s onClick', 'Use useEffect', 'Rename the prop'], answerIndex: 1, explanation: "stopPropagation() prevents the click from bubbling up to the card's own onClick handler." },
    { id: 'l16q7', kind: 'application', prompt: 'Which pattern correctly clears a controlled input after submit?', options: ['input.value = ""', 'setNewName("")', 'delete newName', 'form.reset() only'], answerIndex: 1, explanation: "Since the input's value is driven by state, resetting the state (setNewName('')) clears it." },
    { id: 'l16q8', kind: 'output', prompt: 'Given `{loading ? "Loading…" : quote}`, if loading is false, what renders?', options: ['"Loading…"', 'The value of quote', 'Both', 'Nothing'], answerIndex: 1, explanation: "The ternary's false branch (quote) renders when loading is false." },
    { id: 'l16q9', kind: 'project', prompt: "Why does Momentum's addHabit compute nextId with Math.max(...) instead of habits.length + 1?", options: ['They’re equivalent, no reason', 'length + 1 could collide with an existing id after habits have been deleted', 'Math.max is required syntax', 'It doesn’t matter in React'], answerIndex: 1, explanation: "If habits have been added and removed, length no longer reliably predicts the next safe id; deriving from existing ids avoids collisions." },
    { id: 'l16q10', kind: 'concept', prompt: 'What’s the immutable way to ADD an item to state array items?', options: ['items.push(newItem)', 'setItems([...items, newItem])', 'items[items.length] = newItem', 'items.newItem = true'], answerIndex: 1, explanation: "Spreading the old array plus the new item creates a new array reference, which React can detect." },
  ],

  homework: {
    task:
      "Add basic validation feedback to the add-habit form: if the user tries to submit an empty (or whitespace-only) name, show a small red error message below the input instead of silently doing nothing.",
    requirements: [
      "Add an error state (e.g. useState<string | null>(null)).",
      "In handleSubmit, if the trimmed name is empty, setError to a message and return WITHOUT adding a habit.",
      "Clear the error (setError(null)) once a valid habit is successfully added.",
      "Conditionally render the error message only when it's set (using &&).",
    ],
    expectedOutcome:
      "Submitting an empty form shows 'Please enter a habit name.' beneath the input; typing a valid name and submitting clears the error and adds the habit as normal.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 15,
      hint: "Lesson 15 asked you to add a 'New quote' button that re-fetches by extracting the fetch logic into a reusable getQuote() function.",
      steps: [
        "In Hero.tsx, pull the fetch chain out of useEffect into its own function: function getQuote() { setLoading(true); fetch(...)... }",
        "Call getQuote() inside useEffect(() => { getQuote(); }, []) for the initial load.",
        "Add a button with onClick={getQuote}, and disabled={loading} so it can't be double-clicked mid-fetch.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/Hero.tsx',
          code:
            "function getQuote() {\n  setLoading(true);\n  fetch('https://api.quotable.io/random?tags=motivational')\n    .then((res) => res.json())\n    .then((data) => setQuote(data.content))\n    .catch(() => setQuote('Small habits, repeated, become who you are.'))\n    .finally(() => setLoading(false));\n}\n\nuseEffect(() => { getQuote(); }, []);\n\n// in JSX:\n<button onClick={getQuote} disabled={loading}>New quote</button>",
        },
      ],
    },
  },
};
