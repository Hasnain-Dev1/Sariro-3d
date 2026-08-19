import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 15 — Fetching APIs & the HabitCard Component
 * Module 3 (React + Next.js) · Lesson 15 of 30
 */
export const lesson15: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 3,
  lessonIndex: 2,
  globalNumber: 15,
  name: 'Fetching APIs (a daily quote)',
  title: 'Fetching Data — a Daily Quote & the HabitCard Component',
  subtitle: "Extract a reusable HabitCard and pull a motivational quote from a real API.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to fetch data from an external API inside useEffect, handle loading and error states, and extract a clean, reusable HabitCard component.",
    sections: [
      {
        heading: 'Extracting a component: HabitCard',
        body:
          "Right now, the habit row markup lives inline inside HabitsSection's .map(). It's cleaner — and more React-idiomatic — to extract it into its own HabitCard component that receives a habit and an onToggle function as props. This separates 'what a single habit looks like' from 'how the list of habits is managed'.",
        code: {
          language: 'tsx',
          code:
            "function HabitCard({ habit, onToggle }: { habit: Habit; onToggle: (id: number) => void }) {\n  return (\n    <li onClick={() => onToggle(habit.id)} className=\"habit\">\n      {habit.done ? '✅' : '⬜'} {habit.name} · {habit.streak}d\n    </li>\n  );\n}",
        },
      },
      {
        heading: 'What is an API, and what is fetch?',
        body:
          "An API (Application Programming Interface) is how one program asks another for data over the internet — often returning JSON. The browser's built-in fetch(url) function requests it. fetch returns a Promise (a value that will resolve LATER), so you use async/await to wait for the response, then .json() to parse the body into a usable JavaScript value.",
        code: {
          language: 'javascript',
          code:
            "async function getQuote() {\n  const response = await fetch('https://api.quotable.io/random');\n  const data = await response.json();\n  console.log(data.content);\n}",
        },
      },
      {
        heading: 'Fetching inside useEffect',
        body:
          "Fetching is a side effect (it reaches outside the component to the network), so it belongs inside useEffect — typically with an empty dependency array to fetch once when the component mounts. You store the result in state so the component re-renders once the data arrives.",
        code: {
          language: 'tsx',
          code:
            "const [quote, setQuote] = useState<string | null>(null);\n\nuseEffect(() => {\n  fetch('https://api.quotable.io/random')\n    .then((res) => res.json())\n    .then((data) => setQuote(data.content));\n}, []);   // run once on mount",
        },
      },
      {
        heading: 'Loading and error states',
        body:
          "A fetch takes time, and can fail (no internet, the API is down). Good components handle three states: loading (nothing back yet), success (data arrived), and error (something went wrong) — never assuming the happy path. This is exactly the kind of resilience covered in Momentum's Module 1 'defensive coding' habit, now applied to network calls.",
        code: {
          language: 'tsx',
          code:
            "const [loading, setLoading] = useState(true);\nconst [error, setError] = useState(false);\n\nuseEffect(() => {\n  fetch(url)\n    .then((res) => res.json())\n    .then((data) => setQuote(data.content))\n    .catch(() => setError(true))\n    .finally(() => setLoading(false));\n}, []);\n\n// in JSX: {loading ? 'Loading…' : error ? 'Could not load a quote.' : quote}",
        },
      },
      {
        heading: 'async/await vs .then()',
        body:
          "Both handle Promises; async/await often reads more like normal step-by-step code, while .then() chains are common inside useEffect callbacks (since the callback itself usually isn't async). You'll see both styles in real projects — recognise that they do the same job.",
      },
    ],
    keyTerms: [
      { term: 'API', definition: "A way for programs to exchange data over the internet, typically returning JSON." },
      { term: 'fetch', definition: "The browser's built-in function for making network requests." },
      { term: 'Promise', definition: "A value representing something that will resolve later, like a network response." },
      { term: 'async / await', definition: "Syntax for writing asynchronous (Promise-based) code in a readable, step-by-step style." },
      { term: 'Loading state', definition: "UI shown while waiting for data to arrive." },
      { term: 'Error state', definition: "UI shown when a request fails, instead of silently breaking." },
    ],
    commonMistakes: [
      "Fetching directly in the component body (not inside useEffect), causing an infinite loop of re-fetches.",
      "Forgetting the empty dependency array [], so the fetch runs on every single render.",
      "Not handling the error case, so a failed request leaves the UI stuck or broken with no explanation.",
      "Reading response data before await/.then() resolves, getting a Promise object instead of the real data.",
      "Not showing ANY loading indicator, so the UI looks frozen or broken for a moment.",
    ],
    takeaways: [
      "Extract repeated JSX into its own component (like HabitCard) for clarity and reuse.",
      "fetch(url) + .json() (or await) retrieves and parses data from an API.",
      "Fetching belongs inside useEffect, usually with an empty dependency array.",
      "Always design for loading, success, AND error states.",
      "Store fetched data in state so the component re-renders once it arrives.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A random dog fact fetcher',
    objective:
      "Practise fetch + useEffect + loading/error states with a fun, low-stakes API call.",
    instructions: [
      "Create a \"use client\" component DogFact.tsx.",
      "useState for the fact, loading, and error.",
      "useEffect to fetch from a public API on mount.",
      "Render loading / error / the fact appropriately.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/DogFact.tsx',
        code:
          "'use client';\nimport { useEffect, useState } from 'react';\n\nexport function DogFact() {\n  const [fact, setFact] = useState<string | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(false);\n\n  useEffect(() => {\n    fetch('https://dogapi.dog/api/v2/facts')\n      .then((res) => res.json())\n      .then((data) => setFact(data.data[0].attributes.body))\n      .catch(() => setError(true))\n      .finally(() => setLoading(false));\n  }, []);\n\n  if (loading) return <p>Fetching a dog fact…</p>;\n  if (error) return <p>Could not load a dog fact.</p>;\n  return <p>🐶 {fact}</p>;\n}",
      },
    ],
    explanation:
      "Three pieces of state track the three possible outcomes: fact holds the eventual result, loading starts true and flips false once the request finishes (success or failure), error flags a failure. useEffect's empty array means this fetch runs exactly once when the component first mounts. The chain calls .json() to parse the response, pulls out the fact text, and sets it into state — .catch() handles a network failure, and .finally() always turns off loading regardless of outcome. The JSX checks loading first, then error, then finally renders the real content — never assuming success.",
    expectedOutput:
      "Briefly shows 'Fetching a dog fact…', then replaces it with a real dog fact prefixed by 🐶 (or an error message if the network fails).",
    learned: [
      "How to fetch from a public API inside useEffect.",
      "How to track loading and error state alongside the data.",
      "Why the empty dependency array prevents repeated fetching.",
      "How to render conditionally based on request state.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "A HabitCard component (list refactor) and a live 'Quote of the Day' fetched from a real API, shown in Momentum's hero.",
    why:
      "Extracting HabitCard makes the habit list properly component-based, matching real production code. The daily quote gives Momentum its first real external data — and previews the fetch pattern the AI coach (Module 4) will build on heavily.",
    fileLocation: "components/HabitCard.tsx (new), components/HabitsSection.tsx (use it), components/Hero.tsx (add the quote)",
    code: [
      {
        language: 'tsx',
        filename: 'components/HabitCard.tsx',
        code:
          "import type { Habit } from '@/components/HabitsSection';\n\nexport function HabitCard({ habit, onToggle }: { habit: Habit; onToggle: (id: number) => void }) {\n  return (\n    <li\n      onClick={() => onToggle(habit.id)}\n      className=\"flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-sm\"\n    >\n      <span>{habit.done ? '✅' : '⬜'}</span>\n      <span className=\"font-semibold\">{habit.name} · {habit.streak}d</span>\n    </li>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'components/HabitsSection.tsx (replace the inline <li> with HabitCard)',
        code:
          "import { HabitCard } from '@/components/HabitCard';\n\n// ...inside the return, replace the .map() body:\n<ul className=\"space-y-2\">\n  {habits.map((habit) => (\n    <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} />\n  ))}\n</ul>",
      },
      {
        language: 'tsx',
        filename: 'components/Hero.tsx (add a fetched daily quote)',
        code:
          "'use client';\nimport { useEffect, useState } from 'react';\n\nexport function Hero() {\n  const [quote, setQuote] = useState<string | null>(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetch('https://api.quotable.io/random?tags=motivational')\n      .then((res) => res.json())\n      .then((data) => setQuote(data.content))\n      .catch(() => setQuote('Small habits, repeated, become who you are.'))\n      .finally(() => setLoading(false));\n  }, []);\n\n  return (\n    <section id=\"intro\" className=\"py-10\">\n      <h2 className=\"text-3xl font-extrabold mb-2\">Build better habits, one day at a time.</h2>\n      <p className=\"text-slate-500 mb-4\">\n        {loading ? 'Loading today's quote…' : `\"${quote}\"`}\n      </p>\n      <button className=\"bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg\">Get started</button>\n    </section>\n  );\n}",
      },
    ],
    placement:
      "1) Create components/HabitCard.tsx. 2) In HabitsSection.tsx, import it and replace the inline <li>…</li> JSX inside your .map() with <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} />. 3) Update Hero.tsx to add \"use client\", the quote state, and the useEffect fetch — replacing the static subtext paragraph.",
    implementation:
      "HabitCard takes exactly the two things it needs — a single habit and the toggle function — and renders one card, unaware of the rest of the list. HabitsSection stays the 'manager': it owns the habits state and toggleHabit logic, and simply renders one <HabitCard> per item, passing toggleHabit down as the onToggle prop. In Hero, the quote fetch follows the same load/error-fallback/loading pattern as the mini-project, using .catch() to fall back to a hard-coded quote instead of showing an error (a nicer UX for a decorative feature like this). The loading text shows briefly before the real quote — or the fallback — replaces it.",
    expectedResult:
      "The habit list behaves identically but is now built from a clean, reusable HabitCard component. The hero's subtext briefly shows a loading message, then displays a real motivational quote fetched live from the internet — a different one on each page refresh.",
    connects:
      "HabitCard is now the reusable unit the rest of the course builds on (styling, animations, drag handles all attach here later). The fetch pattern in Hero is the exact shape Module 4's Ask Orbit-style AI coach will reuse, calling the Claude API instead of a quotes API.",
  },

  quiz: [
    { id: 'l15q1', kind: 'concept', prompt: 'Why extract HabitCard into its own component?', options: ['It’s required by Next.js', 'It separates a single habit’s markup from the list-management logic, and makes it reusable', 'It makes the app slower', 'Components can’t be nested otherwise'], answerIndex: 1, explanation: "Extracting focused components is a core React practice for clarity and reuse." },
    { id: 'l15q2', kind: 'code_reading', prompt: 'In HabitCard({ habit, onToggle }), what is onToggle?', options: ['A CSS class', 'A function prop passed down from the parent, called on click', 'A built-in React hook', 'An API endpoint'], answerIndex: 1, explanation: "onToggle is a function passed as a prop, letting the child notify the parent of an action." },
    { id: 'l15q3', kind: 'concept', prompt: 'What does fetch() return?', options: ['The data immediately', 'A Promise that resolves to the response later', 'Nothing', 'A CSS object'], answerIndex: 1, explanation: "fetch is asynchronous — it returns a Promise you must await or .then() to get the actual response." },
    { id: 'l15q4', kind: 'debug', prompt: 'A fetch call runs inside useEffect with NO dependency array. What happens?', options: ['It never runs', 'It runs once', 'It re-runs after every render, potentially in a loop', 'It throws a syntax error'], answerIndex: 2, explanation: "Without a dependency array, the effect runs after every render — often causing repeated, unwanted fetches." },
    { id: 'l15q5', kind: 'application', prompt: 'Where should a network fetch call live in a React component?', options: ['Directly in the JSX', 'Inside useEffect', 'Inside useState’s initial value', 'In the component’s props'], answerIndex: 1, explanation: "Fetching is a side effect and belongs inside useEffect, not directly in render logic." },
    { id: 'l15q6', kind: 'code_reading', prompt: 'What does .finally(() => setLoading(false)) guarantee?', options: ['loading is set to false only on success', 'loading is set to false whether the fetch succeeds or fails', 'It retries the fetch', 'It cancels the request'], answerIndex: 1, explanation: ".finally() runs regardless of success or failure, ensuring loading always ends." },
    { id: 'l15q7', kind: 'output', prompt: 'Before the fetch resolves, what should the UI show?', options: ['Nothing at all, blank', 'A loading indicator/message', 'An error immediately', 'The previous page’s data'], answerIndex: 1, explanation: "A loading state gives the user feedback instead of an unexplained blank area." },
    { id: 'l15q8', kind: 'debug', prompt: "Hero's quote fetch fails (no internet). With the code shown, what does the user see?", options: ['A broken error screen', 'A fallback quote, thanks to .catch()', 'Nothing forever', 'The app crashes'], answerIndex: 1, explanation: "The .catch() handler sets a hard-coded fallback quote instead of leaving the UI broken." },
    { id: 'l15q9', kind: 'project', prompt: "Why does HabitsSection still own the habits state, even though HabitCard renders each item?", options: ['HabitCard could also hold it, no difference', 'The LIST-level component should own shared state; individual cards should stay simple and reusable', 'React forbids state in list items', 'It’s a temporary limitation'], answerIndex: 1, explanation: "Keeping state at the list level (and passing props down) keeps HabitCard simple, reusable, and unaware of the full list." },
    { id: 'l15q10', kind: 'application', prompt: 'Which correctly parses a fetch response body as JSON?', options: ['response.json()', 'JSON.parse(response)', 'response.text()', 'response.data'], answerIndex: 0, explanation: "response.json() reads and parses the response body as JSON, returning a Promise you also await/.then()." },
  ],

  homework: {
    task:
      "Add a 'New quote' button in Hero that re-fetches a different quote on demand, reusing the same fetch logic (don't duplicate it — extract a getQuote() function you can call both on mount and on click).",
    requirements: [
      "Extract the fetch logic into a function, e.g. getQuote(), callable from both useEffect and a button's onClick.",
      "Clicking the button should show the loading text briefly, then a NEW quote.",
      "The button should be disabled while loading, to prevent spamming requests.",
    ],
    expectedOutcome:
      "Clicking 'New quote' fetches and displays a different motivational quote each time, with a brief loading state and no duplicate code.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 14,
      hint: "Lesson 14 asked you to add a 'total streak days' stat computed with .reduce() over the habits state, updating live on toggle.",
      steps: [
        "Inside HabitsSection, compute const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0); directly in the component body (not in state).",
        "Render it above the <ul>, e.g. <p>Total streak days: {totalStreak}</p>.",
        "Since it's computed fresh on every render (not stored), it automatically updates whenever habits changes — including after a toggle.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/HabitsSection.tsx',
          code:
            "const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);\n\n// in the returned JSX, above the <ul>:\n<p className=\"text-sm text-slate-500 mb-3\">Total streak days: {totalStreak}</p>",
        },
      ],
    },
  },
};
