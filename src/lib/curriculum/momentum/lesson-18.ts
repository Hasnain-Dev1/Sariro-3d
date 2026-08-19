import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 18 — Module 3 Build: The Persisted Next.js App
 * Module 3 (React + Next.js) · Lesson 18 of 30
 */
export const lesson18: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 3,
  lessonIndex: 5,
  globalNumber: 18,
  name: 'Module 3 build — Momentum as a Next.js app',
  title: 'Module 3 Build — a Persisted, Production-Structured Momentum',
  subtitle: "Add localStorage persistence in React and wrap up the Next.js rebuild.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to persist React state to localStorage safely, understand a subtlety of Server-Side Rendering, and review the complete Module 3 architecture.",
    sections: [
      {
        heading: 'Persisting React state: load once, save on change',
        body:
          "The pattern from Module 2 still applies, just expressed with Hooks: use useEffect with an empty array to LOAD from localStorage once when the component mounts (updating state with the setter), and a second useEffect watching [habits] to SAVE every time it changes.",
        code: {
          language: 'tsx',
          code:
            "useEffect(() => {\n  const saved = localStorage.getItem('momentum-habits');\n  if (saved) setHabits(JSON.parse(saved));\n}, []);              // load once\n\nuseEffect(() => {\n  localStorage.setItem('momentum-habits', JSON.stringify(habits));\n}, [habits]);        // save on every change",
        },
      },
      {
        heading: 'A subtlety: localStorage doesn’t exist on the server',
        body:
          "Next.js can render components on the SERVER first (even Client Components render once server-side before hydrating in the browser). The server has no localStorage — trying to access it outside useEffect would crash. This is exactly why the load logic lives inside useEffect: effects only run in the browser, AFTER the component has mounted, so localStorage is always safely available there.",
      },
      {
        heading: 'Avoiding a flash of default data',
        body:
          "Since useState's initial value runs before the load effect, the component briefly shows defaultHabits before the saved data replaces it a moment later — a small 'flash'. A common fix is an isLoaded boolean: render nothing (or a loading skeleton) until the load effect has run once, THEN show the real content.",
        code: {
          language: 'tsx',
          code:
            "const [isLoaded, setIsLoaded] = useState(false);\n\nuseEffect(() => {\n  const saved = localStorage.getItem('momentum-habits');\n  if (saved) setHabits(JSON.parse(saved));\n  setIsLoaded(true);\n}, []);\n\nif (!isLoaded) return null;   // or a skeleton",
        },
      },
      {
        heading: 'Reviewing Module 3’s architecture',
        body:
          "Momentum's React version now has a clear shape: HabitsSection owns state (habits, form input) and logic (add/toggle/remove/persist); HabitCard is a small, stateless display component driven entirely by props; Hero independently manages its own quote-fetching state. This separation — some components OWN state, others just DISPLAY based on props — is the core architectural pattern of real React apps.",
      },
      {
        heading: 'What’s NEXT for Momentum',
        body:
          "Module 4 replaces the static quote fetch with a real AI coach powered by the Claude API — a bigger, streaming version of the exact fetch/loading/error pattern from Lesson 15. Module 5 deploys this whole app live to the internet. The React foundation built in this module is what makes both possible.",
      },
    ],
    keyTerms: [
      { term: 'Hydration', definition: "The process where a server-rendered React page becomes interactive in the browser." },
      { term: 'Load effect', definition: "A useEffect with an empty dependency array used to read saved data once on mount." },
      { term: 'Save effect', definition: "A useEffect watching a piece of state, used to persist it whenever it changes." },
      { term: 'isLoaded flag', definition: "A boolean used to avoid briefly showing default data before saved data has loaded." },
      { term: 'Stateless component', definition: "A component (like HabitCard) that renders purely from props, without owning its own state." },
    ],
    commonMistakes: [
      "Reading localStorage directly in the component body (not inside useEffect) — this crashes during server rendering.",
      "Only writing a load effect and forgetting the save effect, so changes are never persisted.",
      "Not handling the brief 'flash' of default data before saved data loads, for apps where that matters visually.",
      "Watching the wrong dependency array on the save effect (e.g. [] instead of [habits]), so it never re-saves.",
      "Mixing state ownership — letting HabitCard try to manage its own copy of done instead of relying on props from the parent.",
    ],
    takeaways: [
      "Load once with an empty-array useEffect; save with a useEffect watching the data.",
      "localStorage only exists in the browser — always access it inside useEffect, never during render.",
      "An isLoaded flag avoids flashing default data before real saved data arrives.",
      "Some components own state and logic; others (like HabitCard) just display based on props.",
      "This same load/save Hook pattern will reappear constantly in real React projects.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A persisted theme toggle',
    objective:
      "Practise the load/save useEffect pattern with a light/dark toggle that remembers your choice across refreshes.",
    instructions: [
      "Create a \"use client\" ThemeToggle component.",
      "useState for a boolean isDark, defaulting to false.",
      "Load the saved preference once on mount; save it whenever it changes.",
      "A button flips isDark and shows the current mode.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/ThemeToggle.tsx',
        code:
          "'use client';\nimport { useEffect, useState } from 'react';\n\nexport function ThemeToggle() {\n  const [isDark, setIsDark] = useState(false);\n\n  useEffect(() => {\n    const saved = localStorage.getItem('dark-mode');\n    if (saved) setIsDark(saved === 'true');\n  }, []);\n\n  useEffect(() => {\n    localStorage.setItem('dark-mode', String(isDark));\n  }, [isDark]);\n\n  return (\n    <button onClick={() => setIsDark(!isDark)}>\n      {isDark ? '🌙 Dark mode' : '☀️ Light mode'} (click to switch)\n    </button>\n  );\n}",
      },
    ],
    explanation:
      "The first useEffect (empty array) runs once on mount and checks localStorage for a saved 'dark-mode' string, converting it back to a boolean with === 'true' (since localStorage only stores strings). The second useEffect watches [isDark] and re-saves it every time it changes — String(isDark) converts the boolean to text for storage. Clicking the button flips isDark via the setter, which triggers a re-render AND the save effect, in that order. Refresh the page and the FIRST effect restores exactly what was last chosen.",
    expectedOutput:
      "Clicking the button toggles between '☀️ Light mode' and '🌙 Dark mode'. Refreshing the page keeps whichever mode you last selected, instead of resetting to light.",
    learned: [
      "How to load a saved boolean from localStorage.",
      "How to save a value automatically whenever state changes.",
      "Why booleans need explicit string conversion for storage.",
      "The general shape of the load/save Hook pattern.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's React version now persists across refreshes — the Module 3 milestone: a complete, working, branded, persisted Next.js app.",
    why:
      "This is the final piece Module 3 was missing. Without persistence, the React rebuild would be a regression from Module 2's vanilla-JS version. With it, Momentum's Next.js version is genuinely production-shaped.",
    fileLocation: "components/HabitsSection.tsx (add load/save effects)",
    code: [
      {
        language: 'tsx',
        filename: 'components/HabitsSection.tsx (add near the top of the component)',
        code:
          "'use client';\nimport { useEffect, useState } from 'react';\n\nconst STORAGE_KEY = 'momentum-habits';\n\nconst defaultHabits: Habit[] = [\n  { id: 1, name: 'Drink water', done: false, streak: 7 },\n  { id: 2, name: 'Read 10 pages', done: false, streak: 3 },\n  { id: 3, name: '30-minute walk', done: false, streak: 12 },\n];\n\nexport function HabitsSection() {\n  const [habits, setHabits] = useState<Habit[]>(defaultHabits);\n  const [isLoaded, setIsLoaded] = useState(false);\n\n  // Load once, on mount — localStorage only exists in the browser.\n  useEffect(() => {\n    const saved = localStorage.getItem(STORAGE_KEY);\n    if (saved) setHabits(JSON.parse(saved));\n    setIsLoaded(true);\n  }, []);\n\n  // Save every time habits changes — but not before the initial load finishes,\n  // or we'd briefly overwrite saved data with the default starter habits.\n  useEffect(() => {\n    if (!isLoaded) return;\n    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));\n  }, [habits, isLoaded]);\n\n  // ...toggleHabit, addHabit, removeHabit, handleSubmit stay exactly as before.\n}",
      },
    ],
    placement:
      "Add the STORAGE_KEY constant, the two new useEffect blocks, and the isLoaded state near the top of HabitsSection.tsx, right after the existing habits useState. Leave every other function (toggleHabit, addHabit, removeHabit, handleSubmit) and all the JSX exactly as they are.",
    implementation:
      "The load effect runs once (empty array) and, if there's saved data, replaces the default habits with it via setHabits — then flips isLoaded to true regardless. The save effect watches BOTH habits and isLoaded: the `if (!isLoaded) return;` guard is the key detail — without it, the save effect would fire on the VERY FIRST render (with the still-default habits) and immediately overwrite any real saved data before the load effect even finishes. Once isLoaded is true, every subsequent change to habits triggers a real save. This guarded two-effect pattern is the correct, safe way to combine 'load on mount' and 'save on change' without them fighting each other.",
    expectedResult:
      "Add a habit, toggle a few, refresh the page — everything is exactly as you left it, just like Module 2's vanilla-JS version, but now built on React's Hook system. Close the tab and reopen: still there.",
    connects:
      "Module 3 is complete: Momentum is now a fully working, branded, persisted Next.js application — the professional-grade rebuild of Module 2's vanilla-JS app. Module 4 adds the feature that makes Momentum special: Ask Momentum, an AI coach powered by the Claude API, built on the exact fetch/state patterns you've now mastered.",
  },

  quiz: [
    { id: 'l18q1', kind: 'concept', prompt: 'Why must localStorage access happen inside useEffect, not directly in the component body?', options: ['Style preference', 'localStorage doesn’t exist during server rendering and would crash there', 'useState requires it', 'It’s faster inside useEffect'], answerIndex: 1, explanation: "Next.js can render components on the server first, where there is no browser localStorage; effects only run client-side, after mount." },
    { id: 'l18q2', kind: 'code_reading', prompt: 'What does the `if (!isLoaded) return;` guard inside the save effect prevent?', options: ['Nothing, it’s unnecessary', 'The save effect overwriting real saved data with the default habits on first render', 'Habits from ever saving', 'A syntax error'], answerIndex: 1, explanation: "Without the guard, the save effect could fire before the load effect finishes, wiping out real saved data with defaults." },
    { id: 'l18q3', kind: 'application', prompt: 'Which dependency array makes an effect run ONCE, on mount?', options: ['[habits]', '[]', 'No array at all', '[isLoaded, habits]'], answerIndex: 1, explanation: "An empty array means the effect has nothing to watch for changes, so it only runs after the first render." },
    { id: 'l18q4', kind: 'debug', prompt: 'A student’s save effect has [] as its dependency array. Habits never persist. Why?', options: ['[] is invalid', 'The effect only ever runs once and never re-runs when habits changes', 'localStorage is broken', 'JSON.stringify failed'], answerIndex: 1, explanation: "With an empty array, the save effect runs only on mount, so later changes to habits are never saved." },
    { id: 'l18q5', kind: 'concept', prompt: 'What is HabitCard, architecturally, in this app?', options: ['A component that owns its own persisted state', 'A stateless component that displays based on props from its parent', 'A page route', 'A useEffect hook'], answerIndex: 1, explanation: "HabitCard has no state of its own; it purely renders based on the habit and callback props it receives." },
    { id: 'l18q6', kind: 'output', prompt: 'On someone’s very FIRST visit (nothing in localStorage), what does the load effect do?', options: ['Crashes', 'saved is null, so setHabits is never called and defaultHabits remains', 'It sets habits to an empty array', 'It throws an error from JSON.parse'], answerIndex: 1, explanation: "The `if (saved)` check skips setHabits when nothing is stored yet, leaving the initial defaultHabits in place." },
    { id: 'l18q7', kind: 'application', prompt: 'Why convert a boolean to a string before saving it to localStorage?', options: ['Booleans can’t be saved at all', 'localStorage only stores strings, so String(isDark) or JSON.stringify is required', 'It’s optional styling', 'Booleans are always saved as numbers'], answerIndex: 1, explanation: "localStorage's API only accepts and returns strings, so non-string values must be converted." },
    { id: 'l18q8', kind: 'debug', prompt: 'Momentum briefly shows the 3 DEFAULT habits before the real saved ones appear a moment later. Best fix?', options: ['Remove the load effect', 'Use an isLoaded flag to delay rendering until the load effect has run', 'Switch to sessionStorage', 'It cannot be fixed'], answerIndex: 1, explanation: "Gating the render on isLoaded avoids showing default data before the real saved data has been read." },
    { id: 'l18q9', kind: 'project', prompt: "What is Module 3's overall achievement for Momentum?", options: ['Adding an AI coach', 'Rebuilding the same product professionally in React/Next.js, fully persisted', 'Deploying it live', 'Adding payments'], answerIndex: 1, explanation: "Module 3 rebuilds Momentum's Module-2 feature set using React's component/state model, ending with full persistence." },
    { id: 'l18q10', kind: 'concept', prompt: 'What comes next for Momentum after this lesson?', options: ['Nothing, the course is done', 'Module 4 adds a real AI coach using the Claude API', 'Deleting the React version', 'Reverting to vanilla JS'], answerIndex: 1, explanation: "Module 4 builds Ask Momentum, an AI feature, on top of this React foundation." },
  ],

  homework: {
    task:
      "Add a small 'Saved' indicator that briefly flashes near the streak ring every time habits successfully saves, giving the user quiet confirmation their data is safe (a common real-app pattern).",
    requirements: [
      "Add a savedFlash boolean state.",
      "Inside the save effect (after the actual save), set savedFlash to true, then use setTimeout to set it back to false after ~1200ms.",
      "Conditionally render a small 'Saved ✓' text when savedFlash is true.",
      "It should NOT flash on the very first load — only on real subsequent saves.",
    ],
    expectedOutcome:
      "Toggling or adding a habit briefly shows a 'Saved ✓' message near the ring for about a second, then it fades away — but it doesn't appear on page load itself.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 17,
      hint: "Lesson 17 asked you to make the add-habit form stack on phones (flex-col md:flex-row) and add a focus ring to the input.",
      steps: [
        "Change the form's className from flex gap-2 to flex flex-col md:flex-row gap-2.",
        "Add w-full to both the input and button so they fill the width when stacked.",
        "Add focus:outline-none focus:ring-2 focus:ring-brand to the input's className.",
        "Resize your browser window to confirm both layouts look correct.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/HabitsSection.tsx',
          code:
            "<form onSubmit={handleSubmit} className=\"flex flex-col md:flex-row gap-2 mb-4\">\n  <input\n    value={newName}\n    onChange={(e) => setNewName(e.target.value)}\n    placeholder=\"New habit…\"\n    className=\"w-full flex-1 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand\"\n  />\n  <button type=\"submit\" className=\"w-full md:w-auto bg-brand text-white font-bold px-4 py-2 rounded-lg\">Add</button>\n</form>",
        },
      ],
    },
  },
};
