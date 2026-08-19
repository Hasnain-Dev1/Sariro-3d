import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 11 — localStorage Persistence
 * Module 2 (JavaScript Essentials) · Lesson 11 of 30
 */
export const lesson11: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 2,
  lessonIndex: 4,
  globalNumber: 11,
  name: 'localStorage persistence',
  title: 'localStorage — Making Momentum Remember',
  subtitle: "Save every habit change to the browser so it survives a refresh, a tab close, even a restart.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how localStorage lets a website save data directly in the browser, how to convert objects to and from text with JSON, and how to load saved data back when the page opens.",
    sections: [
      {
        heading: 'The problem: JavaScript variables forget everything',
        body:
          "Right now, Momentum's habits array lives only in the browser's memory. The moment you refresh the page, JavaScript starts over from scratch — every habit you added, every check you made, is gone. That's a dealbreaker for a real habit tracker. We need to save data somewhere that survives a reload.",
      },
      {
        heading: 'localStorage — a tiny database in the browser',
        body:
          "Every browser gives each website a small storage area called localStorage. It stores simple key-value pairs, and — crucially — the data stays even after the tab closes or the computer restarts, until it's explicitly cleared. Two core methods: localStorage.setItem(key, value) saves a value, localStorage.getItem(key) reads it back.",
        code: {
          language: 'javascript',
          code:
            "localStorage.setItem('username', 'Aisha');\nconst name = localStorage.getItem('username');   // 'Aisha' — even after a refresh",
        },
      },
      {
        heading: 'The catch: localStorage only stores STRINGS',
        body:
          "localStorage can't store an array or object directly — only text. So to save something like the habits array, you convert it to a string first with JSON.stringify(), and convert it back to a real array/object when reading with JSON.parse(). JSON (JavaScript Object Notation) is a universal text format for representing structured data — this stringify/parse pair is one of the most common patterns in web development.",
        code: {
          language: 'javascript',
          code:
            "const data = { name: 'Momentum', version: 1 };\nconst text = JSON.stringify(data);        // '{\"name\":\"Momentum\",\"version\":1}'\nlocalStorage.setItem('app-info', text);\n\nconst saved = localStorage.getItem('app-info');\nconst parsed = JSON.parse(saved);          // back to a real object: { name: 'Momentum', version: 1 }",
        },
      },
      {
        heading: 'Save on every change, load once on startup',
        body:
          "The pattern for a persisted app: write a saveHabits() function that stringifies the current habits array into localStorage, and call it every time the data changes (inside addHabit, toggleHabit, removeHabit). Write a loadHabits() function that reads and parses it back — called ONCE when the script starts, before the first render.",
      },
      {
        heading: 'Handling the first-ever visit',
        body:
          "The very first time someone opens Momentum, localStorage.getItem() will return null — there's nothing saved yet. Your loadHabits() function needs to handle that gracefully: if nothing is saved, fall back to a default starter array instead of crashing. This is a defensive-coding habit worth building early: always plan for 'what if there's no data yet?'",
        code: {
          language: 'javascript',
          code:
            "const saved = localStorage.getItem('momentum-habits');\nconst habits = saved ? JSON.parse(saved) : defaultHabits;   // fallback if null",
        },
      },
    ],
    keyTerms: [
      { term: 'localStorage', definition: "Browser storage that persists key-value string data across page reloads and restarts." },
      { term: 'setItem / getItem', definition: "localStorage's methods for saving and reading a value by key." },
      { term: 'JSON', definition: "A text format for representing structured data (objects/arrays) as a string." },
      { term: 'JSON.stringify', definition: "Converts a JavaScript value into a JSON string, ready to store." },
      { term: 'JSON.parse', definition: "Converts a JSON string back into a real JavaScript value." },
      { term: 'Persistence', definition: "Data surviving beyond the current page load — the whole point of localStorage." },
    ],
    commonMistakes: [
      "Trying to localStorage.setItem an array/object directly without JSON.stringify — it gets silently converted to the useless string '[object Object]'.",
      "Forgetting JSON.parse when reading it back, leaving you with a string instead of real data.",
      "Not handling the null case on first visit, causing an error when JSON.parse(null) is called incorrectly.",
      "Saving only sometimes — if you forget to call saveHabits() inside one of your functions, that function's changes silently don't persist.",
      "Using a very generic key name (e.g. 'data') that could collide with something else — always use a specific, namespaced key like 'momentum-habits'.",
    ],
    takeaways: [
      "localStorage saves data in the browser across reloads and restarts.",
      "It only stores strings — use JSON.stringify to save objects/arrays, JSON.parse to read them back.",
      "Call save after every change; call load once at startup.",
      "Always handle the 'nothing saved yet' (null) case with a sensible default.",
      "Use a specific, namespaced key so your data doesn't collide with anything else.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A note that survives a refresh',
    objective:
      "Practise the save/load pattern with something simple: a text note that's still there after you reload the page.",
    instructions: [
      "Create note.html with a <textarea> and a 'Save' button.",
      "Create note.js: save the textarea's value to localStorage on button click.",
      "On page load, check localStorage for a saved note and fill the textarea if one exists.",
      "Type something, click Save, then refresh the page to prove it persisted.",
    ],
    code: [
      {
        language: 'html',
        filename: 'note.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /></head>\n  <body>\n    <textarea id=\"note\" rows=\"4\" cols=\"40\"></textarea><br />\n    <button id=\"save-btn\">Save</button>\n    <script src=\"note.js\" defer></script>\n  </body>\n</html>",
      },
      {
        language: 'javascript',
        filename: 'note.js',
        code:
          "const textarea = document.getElementById('note');\nconst saveBtn = document.getElementById('save-btn');\n\n// Load on startup: fill the textarea if something was saved before.\nconst saved = localStorage.getItem('my-note');\nif (saved) {\n  textarea.value = saved;\n}\n\n// Save whenever the button is clicked.\nsaveBtn.addEventListener('click', () => {\n  localStorage.setItem('my-note', textarea.value);\n  console.log('Saved!');\n});",
      },
    ],
    explanation:
      "On startup, the script reads 'my-note' from localStorage. Since a note is just plain text, no JSON.stringify/parse is needed here — a rare simple case. If saved isn't null, the textarea's value is pre-filled with it. The click handler writes the CURRENT textarea content back to that same key every time Save is pressed. Refresh the page and the load step runs again, reading back exactly what you last saved — that's persistence in action.",
    expectedOutput:
      "Type a sentence, click Save, refresh the page — the sentence is still in the textarea, proving it survived the reload.",
    learned: [
      "How to save a value to localStorage on a button click.",
      "How to load a saved value back when the page starts.",
      "Why persistence means writing on change and reading on startup.",
      "That plain strings don't need JSON, but objects/arrays do.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum permanently remembers your habits — added habits, checks, and streaks all survive a refresh.",
    why:
      "This is the feature that turns Momentum from a demo into a real, useful tool. A habit tracker that forgets everything on refresh is worthless — persistence is non-negotiable for this product.",
    fileLocation: "momentum/app.js (add save/load, update the three data functions to call save)",
    code: [
      {
        language: 'javascript',
        filename: 'app.js (replace the top of the file — the habits array setup)',
        code:
          "const STORAGE_KEY = 'momentum-habits';\n\nconst defaultHabits = [\n  { id: 1, name: 'Drink water', done: false, streak: 7 },\n  { id: 2, name: 'Read 10 pages', done: false, streak: 3 },\n  { id: 3, name: '30-minute walk', done: false, streak: 12 },\n];\n\nfunction loadHabits() {\n  const saved = localStorage.getItem(STORAGE_KEY);\n  return saved ? JSON.parse(saved) : defaultHabits;\n}\n\nfunction saveHabits() {\n  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));\n}\n\nconst habits = loadHabits();   // load ONCE at startup, replacing the old hard-coded array\nlet nextId = Math.max(0, ...habits.map((h) => h.id)) + 1;   // safe even after habits are added/removed",
      },
      {
        language: 'javascript',
        filename: 'app.js (add saveHabits() calls inside the three functions from Lesson 8)',
        code:
          "function addHabit(name) {\n  const newHabit = { id: nextId, name, done: false, streak: 0 };\n  habits.push(newHabit);\n  nextId += 1;\n  saveHabits();   // <-- persist\n}\n\nfunction removeHabit(id) {\n  const index = habits.findIndex((h) => h.id === id);\n  if (index !== -1) {\n    habits.splice(index, 1);\n    saveHabits();   // <-- persist\n  }\n}\n\nfunction toggleHabit(id) {\n  const habit = habits.find((h) => h.id === id);\n  if (!habit) return;\n  habit.done = !habit.done;\n  habit.streak = habit.done ? habit.streak + 1 : Math.max(0, habit.streak - 1);\n  saveHabits();   // <-- persist\n}",
      },
    ],
    placement:
      "1) Replace the top of app.js (the old `const habits = [...]` block from Lesson 7) with the STORAGE_KEY, defaultHabits, loadHabits(), saveHabits(), and the new `const habits = loadHabits();` + nextId lines. 2) Inside addHabit, removeHabit, and toggleHabit, add a `saveHabits();` call right after each one modifies the array. 3) Leave renderHabits() and your event listeners exactly as they are.",
    implementation:
      "defaultHabits is the starter data used only on someone's very first visit. loadHabits() checks localStorage first and falls back to defaultHabits if nothing's saved yet — the null-safety pattern from the concept. habits is now assigned from loadHabits() instead of being hard-coded, so every session starts from whatever was last saved. nextId is now computed dynamically from the loaded habits (using Math.max + spread, guarding with a 0 in case habits is ever empty) instead of a hard-coded 4, so ids stay unique even across sessions. Each of the three mutating functions ends with saveHabits(), which writes the ENTIRE current array back as a JSON string — simple, and correct because every function already fully updates the shared habits array before saving.",
    expectedResult:
      "Add a habit, check one off, refresh the page — everything is exactly as you left it. Close the tab entirely and reopen Momentum: still there. Open DevTools → Application → Local Storage to see the raw saved JSON.",
    connects:
      "Momentum's data layer is now complete: create, read, update, delete, and persist. Lesson 12 (the Module 2 build) polishes the whole interactive experience — a dynamic progress ring, better empty/first-visit handling, and a final review — closing out the JavaScript module before Module 3 rebuilds this exact app in React.",
  },

  quiz: [
    { id: 'l11q1', kind: 'concept', prompt: 'What problem does localStorage solve for Momentum?', options: ['It makes the page load faster', 'It saves data so it survives a page refresh', 'It styles the page', 'It validates HTML'], answerIndex: 1, explanation: "localStorage persists data across reloads, which plain JS variables cannot do." },
    { id: 'l11q2', kind: 'code_reading', prompt: 'Why does saveHabits() call JSON.stringify(habits)?', options: ['To make it load faster', 'Because localStorage can only store strings, not arrays/objects', 'It’s optional styling', 'To encrypt the data'], answerIndex: 1, explanation: "localStorage stores strings only; stringify converts the array into a storable string." },
    { id: 'l11q3', kind: 'debug', prompt: 'After reading from localStorage, a student tries habits.push(...) and gets an error saying habits.push is not a function. Likely cause?', options: ['They forgot JSON.parse, so habits is still a string', 'localStorage is broken', 'push() doesn’t exist in JS', 'The key name is wrong'], answerIndex: 0, explanation: "Without JSON.parse, getItem returns a raw string, which has no .push() array method." },
    { id: 'l11q4', kind: 'application', prompt: 'When should loadHabits() run?', options: ['Inside every render', 'Once, at startup, before the first render', 'Every time a habit is clicked', 'Never — only save matters'], answerIndex: 1, explanation: "Loading is a one-time startup step; after that, the in-memory habits array is the working copy." },
    { id: 'l11q5', kind: 'concept', prompt: 'What does localStorage.getItem return on someone’s very first visit?', options: ['An empty array', '0', 'null', 'undefined string "null"'], answerIndex: 2, explanation: "If the key has never been set, getItem returns null — your code must handle this case." },
    { id: 'l11q6', kind: 'code_reading', prompt: "In `const habits = saved ? JSON.parse(saved) : defaultHabits;`, what happens if saved is null?", options: ['It crashes', 'habits becomes defaultHabits', 'It becomes an empty string', 'JSON.parse(null) runs anyway'], answerIndex: 1, explanation: "The ternary's false branch runs when saved is falsy (null), assigning defaultHabits instead." },
    { id: 'l11q7', kind: 'debug', prompt: 'A student adds a habit, but after refreshing it’s gone. Most likely missing piece?', options: ['renderHabits() call', 'saveHabits() inside addHabit()', 'A CSS class', 'An id'], answerIndex: 1, explanation: "Without saveHabits(), the change only exists in memory and is lost on reload." },
    { id: 'l11q8', kind: 'application', prompt: 'Why use a specific key like "momentum-habits" instead of "data"?', options: ['Shorter keys are faster', 'To avoid colliding with other stored values (yours or another script’s)', 'localStorage requires hyphens', 'It’s required by JSON'], answerIndex: 1, explanation: "A specific, namespaced key avoids accidentally overwriting unrelated data under a generic name." },
    { id: 'l11q9', kind: 'project', prompt: "Why is nextId computed with Math.max(...habits.map(h => h.id)) + 1 instead of a hard-coded number now?", options: ['It looks nicer', 'Because loaded habits could already contain any ids, so a fixed number could collide', 'Math.max is required syntax', 'It prevents deleting habits'], answerIndex: 1, explanation: "Since habits now come from storage (possibly already added-to across sessions), the next id must be derived from what's actually there." },
    { id: 'l11q10', kind: 'output', prompt: 'Where can you inspect the raw saved JSON in Chrome DevTools?', options: ['Console tab only', 'Application → Local Storage', 'Network tab', 'Elements tab'], answerIndex: 1, explanation: "DevTools' Application panel has a Local Storage section showing every saved key/value for the site." },
  ],

  homework: {
    task:
      "Add a 'Reset to defaults' button that clears saved data and restores Momentum to its original 3 starter habits — useful for testing, and a real feature many apps offer.",
    requirements: [
      "Add a button (anywhere sensible, e.g. near the About section) with a clear label like 'Reset habits'.",
      "On click, call localStorage.removeItem(STORAGE_KEY) (or setItem with defaultHabits), reset the in-memory habits array, and re-render.",
      "Confirm: after clicking Reset, refreshing the page still shows only the 3 defaults, not whatever you'd customised.",
    ],
    expectedOutcome:
      "Clicking Reset instantly restores the three original habits on screen AND in storage — surviving a refresh.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 10,
      hint: "Lesson 10 asked you to add a delete button on each habit card, wired through the same delegated listener, without also triggering the toggle.",
      steps: [
        "In renderHabits(), add a small <button class=\"delete-btn\">✕</button> inside each <li>, after the label.",
        "In the delegated click handler on #habit-list, check event.target.closest('.delete-btn') FIRST.",
        "If it matches, call removeHabit(id) and renderHabits(), then return immediately — don't fall through to the toggle logic.",
        "If it doesn't match, continue to the existing toggle logic as before.",
      ],
      codeGuidance: [
        {
          language: 'javascript',
          filename: 'app.js (inside the habitList click handler)',
          code:
            "habitList.addEventListener('click', (event) => {\n  const li = event.target.closest('.habit');\n  if (!li) return;\n  const id = Number(li.dataset.id);\n\n  if (event.target.closest('.delete-btn')) {\n    removeHabit(id);\n    renderHabits();\n    return;   // stop here — don't also toggle\n  }\n\n  toggleHabit(id);\n  renderHabits();\n});",
        },
      ],
    },
  },
};
