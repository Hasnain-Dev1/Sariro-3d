import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 14 — useState & useEffect
 * Module 3 (React + Next.js) · Lesson 14 of 30
 */
export const lesson14: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 3,
  lessonIndex: 1,
  globalNumber: 14,
  name: 'useState & useEffect',
  title: 'React State — useState & useEffect',
  subtitle: "Give Momentum a real, reactive habits array using React state instead of manual DOM updates.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how React tracks changing data with useState and re-renders automatically, and how useEffect runs code in response to those changes — like saving to localStorage.",
    sections: [
      {
        heading: 'The problem: a plain variable doesn’t trigger a re-render',
        body:
          "In Module 2, changing habits and calling renderHabits() manually was YOUR job. In React, if you just declare let habits = [...] inside a component and change it, React has no idea anything happened — the screen won't update. React needs to be TOLD a value is state so it knows to re-render when it changes.",
      },
      {
        heading: 'useState — React’s memory for a component',
        body:
          "useState(initialValue) returns a pair: the CURRENT value, and a function to update it. By convention you destructure them as [value, setValue]. Calling the setter function does two things: it updates the value AND tells React to re-render the component with the new value. You never mutate the state variable directly — you always call the setter.",
        code: {
          language: 'tsx',
          code:
            "import { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);   // [value, setter]\n\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Clicked {count} times\n    </button>\n  );\n}",
        },
      },
      {
        heading: 'Updating arrays and objects immutably',
        body:
          "State should never be mutated directly (no .push(), no direct property assignment) — always create a NEW array or object and pass it to the setter. For arrays: spread the old array plus the new item ([...old, newItem]), or .filter() to remove one, or .map() to update one. This might feel unfamiliar coming from Module 2's habits.push(), but it's exactly how React knows something actually changed.",
        code: {
          language: 'tsx',
          code:
            "const [habits, setHabits] = useState([{ id: 1, name: 'Water', done: false }]);\n\n// ADD — spread the old array, add the new item\nsetHabits([...habits, { id: 2, name: 'Read', done: false }]);\n\n// TOGGLE — map over the array, replace only the matching item\nsetHabits(habits.map((h) => (h.id === 1 ? { ...h, done: !h.done } : h)));\n\n// REMOVE — filter it out\nsetHabits(habits.filter((h) => h.id !== 1));",
        },
      },
      {
        heading: '"use client" — this component needs the browser',
        body:
          "Interactive components (ones using useState, onClick, etc.) must be marked as Client Components with \"use client\" as the very first line of the file. Server Components (the default) can't hold state or respond to clicks — they only run once, on the server. Any component managing Momentum's habits needs this directive.",
        code: {
          language: 'tsx',
          code:
            "'use client';\n\nimport { useState } from 'react';\n// ...rest of the component",
        },
      },
      {
        heading: 'useEffect — reacting to changes',
        body:
          "useEffect(fn, dependencies) runs fn after the component renders, and again whenever a value in the dependencies array changes. This is where you put 'side effects' — things that reach outside React, like saving to localStorage. An empty array [] means 'run once, after the first render' (great for LOADING saved data); including a variable like [habits] means 'run again every time habits changes' (great for SAVING it).",
        code: {
          language: 'tsx',
          code:
            "useEffect(() => {\n  console.log('habits changed:', habits);\n}, [habits]);   // runs on mount, and again every time habits changes",
        },
      },
    ],
    keyTerms: [
      { term: 'useState', definition: "A React Hook returning [value, setter] that gives a component memory and triggers re-renders on change." },
      { term: 'setter function', definition: "The function returned by useState that updates state and re-renders the component." },
      { term: 'Immutable update', definition: "Creating a NEW array/object instead of mutating the existing one, so React detects the change." },
      { term: 'useEffect', definition: "A Hook that runs code after render, in response to changes in its dependency array." },
      { term: 'Dependency array', definition: "The list passed as useEffect's second argument; the effect re-runs when any value in it changes." },
      { term: '"use client"', definition: "A directive marking a component as interactive (runs in the browser, can use state and events)." },
    ],
    commonMistakes: [
      "Mutating state directly (habits.push(x)) instead of calling the setter with a new array — React won't notice the change.",
      "Forgetting \"use client\" on a component that uses useState, causing a build error.",
      "Omitting the dependency array on useEffect, causing it to run after EVERY render (often unintended).",
      "Putting the wrong dependencies in the array — missing one means the effect uses stale data.",
      "Expecting the state variable to update immediately after calling the setter — the update happens on the NEXT render, not instantly in the same line of code.",
    ],
    takeaways: [
      "useState gives a component memory; calling its setter re-renders the UI automatically.",
      "Always update state immutably — new arrays/objects via spread, map, or filter.",
      "Interactive components need \"use client\" as the first line.",
      "useEffect runs code in response to state changes — perfect for save/load side effects.",
      "An empty dependency array [] means 'run once on mount'.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A like-counter with useState',
    objective:
      "Practise useState and immutable array updates by building a small list of posts you can 'like', each tracked independently.",
    instructions: [
      "Create a new component file (or add to app/page.tsx) marked \"use client\".",
      "Store an array of post objects ({ id, text, likes }) in useState.",
      "Render each post with a Like button.",
      "Clicking Like increases ONLY that post's like count, using .map().",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/Likes.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\ninterface Post { id: number; text: string; likes: number }\n\nexport function Likes() {\n  const [posts, setPosts] = useState<Post[]>([\n    { id: 1, text: 'First post!', likes: 0 },\n    { id: 2, text: 'React is fun', likes: 0 },\n  ]);\n\n  function like(id: number) {\n    setPosts(posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));\n  }\n\n  return (\n    <ul>\n      {posts.map((post) => (\n        <li key={post.id}>\n          {post.text} — {post.likes} likes{' '}\n          <button onClick={() => like(post.id)}>Like</button>\n        </li>\n      ))}\n    </ul>\n  );\n}",
      },
    ],
    explanation:
      "posts is typed state holding an array of Post objects. like(id) doesn't mutate anything — it calls setPosts with a BRAND NEW array built by .map(): for each post, if its id matches, return a NEW object ({ ...p, likes: p.likes + 1 }); otherwise return the post unchanged. React sees the new array reference and re-renders. Note the key={post.id} on each <li> — React requires a unique key when rendering a list, so it can track which item is which across re-renders.",
    expectedOutput:
      "Two posts, each with its own Like button and count. Clicking one post's Like button increases only that post's number, leaving the other untouched.",
    learned: [
      "How to store an array in useState.",
      "How to immutably update one item in an array with map().",
      "Why lists need a unique key prop.",
      "How a click handler triggers a targeted state update.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's habits become real React state — the data model from Module 2, now living in useState.",
    why:
      "This is the bridge from vanilla JS to React: the SAME habit data and SAME operations (add, toggle) now live in state, so React handles re-rendering automatically instead of a manual renderHabits() call.",
    fileLocation: "components/HabitsSection.tsx (new) + app/page.tsx (use it)",
    code: [
      {
        language: 'tsx',
        filename: 'components/HabitsSection.tsx',
        code:
          "'use client';\nimport { useState } from 'react';\n\nexport interface Habit { id: number; name: string; done: boolean; streak: number }\n\nconst defaultHabits: Habit[] = [\n  { id: 1, name: 'Drink water', done: false, streak: 7 },\n  { id: 2, name: 'Read 10 pages', done: false, streak: 3 },\n  { id: 3, name: '30-minute walk', done: false, streak: 12 },\n];\n\nexport function HabitsSection() {\n  const [habits, setHabits] = useState<Habit[]>(defaultHabits);\n\n  function toggleHabit(id: number) {\n    setHabits(habits.map((h) =>\n      h.id === id\n        ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : Math.max(0, h.streak - 1) }\n        : h\n    ));\n  }\n\n  return (\n    <section id=\"habits\" className=\"py-6\">\n      <h2 className=\"text-xl font-bold mb-4\">Today's habits</h2>\n      <ul className=\"space-y-2\">\n        {habits.map((habit) => (\n          <li\n            key={habit.id}\n            onClick={() => toggleHabit(habit.id)}\n            className=\"flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-sm\"\n          >\n            <span>{habit.done ? '✅' : '⬜'}</span>\n            <span className=\"font-semibold\">{habit.name} · {habit.streak}d</span>\n          </li>\n        ))}\n      </ul>\n    </section>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'app/page.tsx (add HabitsSection)',
        code:
          "import { Header } from '@/components/Header';\nimport { Hero } from '@/components/Hero';\nimport { HabitsSection } from '@/components/HabitsSection';\nimport { Footer } from '@/components/Footer';\n\nexport default function Home() {\n  return (\n    <main>\n      <Header />\n      <div className=\"max-w-4xl mx-auto px-6\">\n        <Hero />\n        <HabitsSection />\n      </div>\n      <Footer />\n    </main>\n  );\n}",
      },
    ],
    placement:
      "1) Create components/HabitsSection.tsx with the code above — this file OWNS the habits state now. 2) Import and render <HabitsSection /> inside app/page.tsx, right after <Hero />.",
    implementation:
      "HabitsSection is marked \"use client\" since it uses useState and onClick. The habits state starts as defaultHabits — the SAME shape you used in Module 2. toggleHabit(id) is the React-immutable version of Module 2's toggleHabit function: instead of habit.done = !habit.done, it calls setHabits with a NEW array from .map(), replacing only the matching habit with a new object (spread + updated fields), leaving everything else untouched. Clicking any <li> calls toggleHabit with that habit's id; React re-renders automatically — no renderHabits(), no manual DOM code at all.",
    expectedResult:
      "A 'Today's habits' section renders three cards. Clicking any one instantly toggles its check mark and streak — driven entirely by React state, with zero manual DOM manipulation code.",
    connects:
      "Right now toggling works, but the icon/label markup is inline inside HabitsSection. Lesson 15 extracts each habit row into its own HabitCard component (receiving props), which is the proper React pattern for a list of items — and Lesson 17 makes the whole thing dynamic with data fetched from an API.",
  },

  quiz: [
    { id: 'l14q1', kind: 'concept', prompt: 'What does calling a useState setter function do?', options: ['Only updates a variable silently', 'Updates the value AND triggers a re-render', 'Deletes the component', 'Nothing until the page reloads'], answerIndex: 1, explanation: "The setter both updates the stored value and tells React to re-render with the new value." },
    { id: 'l14q2', kind: 'debug', prompt: 'A student writes habits.push(newHabit) directly, then wonders why the UI didn’t update. What’s wrong?', options: ['push() doesn’t exist', 'Mutating state directly doesn’t trigger a re-render — the setter must be called with a new array', 'newHabit is invalid', 'useState is broken'], answerIndex: 1, explanation: "React only re-renders when the setter is called with a new value; direct mutation is invisible to it." },
    { id: 'l14q3', kind: 'code_reading', prompt: 'What does habits.map((h) => (h.id === id ? { ...h, done: true } : h)) do?', options: ['Deletes the matching habit', 'Returns a new array with the matching habit replaced by an updated copy', 'Mutates the original array', 'Adds a new habit'], answerIndex: 1, explanation: "map() builds a new array; only the matching item gets a new object, others pass through unchanged." },
    { id: 'l14q4', kind: 'application', prompt: 'Which line is required at the top of a component that uses useState?', options: ['"use server"', '"use client"', 'import React', 'export default'], answerIndex: 1, explanation: "Components using state or event handlers must be Client Components via \"use client\"." },
    { id: 'l14q5', kind: 'concept', prompt: 'What does an empty dependency array [] in useEffect mean?', options: ['The effect never runs', 'The effect runs once, after the first render', 'The effect runs on every render', 'It causes an error'], answerIndex: 1, explanation: "An empty array means the effect has no dependencies to watch, so it only runs once on mount." },
    { id: 'l14q6', kind: 'output', prompt: 'Given useState(0) for count, what does [count, setCount] represent?', options: ['Two unrelated variables', 'The current value and the function to update it', 'Two setter functions', 'An array of counts'], answerIndex: 1, explanation: "useState returns a pair: the current value, then its setter function." },
    { id: 'l14q7', kind: 'debug', prompt: 'A list of items renders but React warns about a missing "key" prop. What’s the fix?', options: ['Remove the list', 'Add a unique key prop to each item in the loop, e.g. key={habit.id}', 'Use index as text instead', 'Switch to a <div> instead of <li>'], answerIndex: 1, explanation: "React needs a unique key on each list item to track it correctly across re-renders." },
    { id: 'l14q8', kind: 'code_reading', prompt: 'Why does toggleHabit use { ...h, done: !h.done } instead of h.done = !h.done?', options: ['Both work identically', 'Spread creates a NEW object, which is required for React to detect the change', 'It’s shorter to type only', '{ ...h } deletes h'], answerIndex: 1, explanation: "Spreading into a new object (rather than mutating h) is what makes the update immutable and detectable." },
    { id: 'l14q9', kind: 'project', prompt: "In HabitsSection, why does clicking an <li> call toggleHabit(habit.id) instead of toggleHabit(habit)?", options: ['Passing the whole object would error', 'Passing the id keeps the function simple and matches how you’ll find/target habits generally (e.g. from an API later)', 'IDs are required by React', 'There is no real reason'], answerIndex: 1, explanation: "Using the id as the lookup key is the conventional, flexible pattern — it matches how you'd reference a specific record from any data source." },
    { id: 'l14q10', kind: 'application', prompt: 'You want to save habits to localStorage every time it changes. Where does that code belong?', options: ['Directly inside the JSX', 'Inside a useEffect with [habits] as its dependency array', 'Inside useState’s initial value', 'It can’t be done in React'], answerIndex: 1, explanation: "A useEffect watching [habits] re-runs its save logic exactly when habits changes — the correct place for this side effect." },
  ],

  homework: {
    task:
      "Add a 'total streak days' stat above the habit list, computed from the habits state using .reduce(), and display it with a small StatCard-style element (reuse the Button component's styling approach if helpful, or write a simple one inline).",
    requirements: [
      "Compute the sum of every habit's streak with .reduce() inside HabitsSection, recalculated on every render (don't store it in separate state).",
      "Display it above the <ul>, e.g. 'Total streak days: 22'.",
      "It must update automatically when a habit is toggled (since streak changes on toggle).",
    ],
    expectedOutcome:
      "A total-streak-days number that's always correct and updates the instant you click a habit.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 13,
      hint: "Lesson 13 asked you to extract a reusable Button component (accepting children) and use it in both Hero and Footer with different text.",
      steps: [
        "Create components/Button.tsx accepting { children }: { children: React.ReactNode }.",
        "Return a <button> with your shared Tailwind classes, rendering {children} inside it.",
        "In Hero.tsx, replace the hard-coded <button>Get started</button> with <Button>Get started</Button>.",
        "In Footer.tsx, add a second usage with different text, e.g. <Button>Contact us</Button>.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/Button.tsx',
          code:
            "export function Button({ children }: { children: React.ReactNode }) {\n  return (\n    <button className=\"bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-green-700\">\n      {children}\n    </button>\n  );\n}",
        },
      ],
    },
  },
};
