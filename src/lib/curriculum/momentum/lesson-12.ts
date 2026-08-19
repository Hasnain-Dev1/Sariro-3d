import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 12 — Module 2 Build: The Fully Interactive App
 * Module 2 (JavaScript Essentials) · Lesson 12 of 30
 */
export const lesson12: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 2,
  lessonIndex: 5,
  globalNumber: 12,
  name: 'Module 2 build — the interactive Momentum app',
  title: 'Module 2 Build — A Fully Interactive, Persisted Momentum',
  subtitle: "Make the streak ring live, handle empty states, and finish the vanilla-JS version of Momentum.",

  concept: {
    durationMin: 15,
    summary:
      "Learn to compute and reflect derived UI state (like a dynamic progress ring), handle empty/edge cases gracefully, and review the JavaScript fundamentals that power a real interactive app.",
    sections: [
      {
        heading: 'Derived state — values computed FROM your data',
        body:
          "Momentum's habits array is the source of truth. Everything else on screen — the streak ring, a completion count, an empty-list message — should be DERIVED from it every render, not tracked separately. This is a core front-end principle: compute what you can from your real data instead of maintaining duplicate, easily-out-of-sync copies.",
      },
      {
        heading: 'A dynamic progress ring with inline styles',
        body:
          "In Module 1, the ring's conic-gradient sweep was a fixed 70% in CSS. Now that we have real data, JavaScript can calculate the TRUE percentage of habits done today and set it directly via element.style.background — an inline style set from JS, overriding the CSS default for that one property.",
        code: {
          language: 'javascript',
          code:
            "const doneCount = habits.filter((h) => h.done).length;\nconst percent = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;\n\nconst ring = document.querySelector('.ring');\nring.style.background = `conic-gradient(#0891b2 ${percent}%, #e2e8f0 0), #fff`;",
        },
      },
      {
        heading: 'Handling empty states',
        body:
          "What if a user deletes every single habit? A blank list looks broken, not intentional. Good apps check for the empty case and show a helpful message instead. A simple pattern: if (habits.length === 0) { show a message } else { render the list as normal }.",
        code: {
          language: 'javascript',
          code:
            "if (habits.length === 0) {\n  list.innerHTML = '<li class=\"empty\">No habits yet — add your first one above!</li>';\n  return;\n}",
        },
      },
      {
        heading: 'Reviewing the full data flow',
        body:
          "Module 2 built one consistent loop, worth naming clearly: LOAD data on startup → RENDER it to the DOM → user triggers an EVENT → a FUNCTION changes the data → SAVE the data → RENDER again. Every interactive feature in Momentum (and in almost every web app you'll ever build) follows this same loop. Recognising it is one of the most transferable skills from this module.",
      },
      {
        heading: 'Defensive touches that read as polish',
        body:
          "Small things separate a 'working' app from a 'solid' one: guarding against empty input (Lesson 10), a safe fallback on first load (Lesson 11), an empty-state message (this lesson), and never trusting that an element exists before using it (checking null before .textContent). None of these are complicated — they're just habits of care.",
      },
    ],
    keyTerms: [
      { term: 'Derived state', definition: "A value computed from your real data (like a percentage) rather than stored separately." },
      { term: 'element.style', definition: "Sets an inline CSS style directly from JavaScript, overriding the stylesheet for that property." },
      { term: 'Empty state', definition: "The UI shown when there's no data to display — should be intentional, not a blank void." },
      { term: 'Data flow loop', definition: "Load → render → event → update data → save → render again — the cycle behind an interactive app." },
      { term: 'filter()', definition: "An array method that returns a new array containing only the items matching a condition." },
    ],
    commonMistakes: [
      "Storing a percentage or count as its own variable that's updated separately — it drifts out of sync. Always compute it fresh from the data.",
      "Dividing by habits.length without checking it's not zero, causing NaN.",
      "Forgetting the empty state, so deleting all habits leaves a confusing blank area.",
      "Using element.style for many properties at once instead of a CSS class — fine for one dynamic value like this ring, but classes are usually better for whole style changes.",
      "Not testing the 'first ever visit' and 'delete everything' edge cases before considering a feature done.",
    ],
    takeaways: [
      "Compute UI values (like percentages) FROM your data every render — don't store duplicates.",
      "element.style.property sets one inline style from JavaScript.",
      "Always design an empty state for when there's no data.",
      "The core loop: load → render → event → update → save → render.",
      "Polish is mostly about handling the edge cases, not adding more features.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A live percentage bar',
    objective:
      "Practise computing derived state and reflecting it visually — the exact pattern behind Momentum's dynamic streak ring.",
    instructions: [
      "Create bar.html with a list of tasks (some done: true, some false) and an empty progress bar div.",
      "Create bar.js: compute the percentage done and set the bar's width from JS.",
      "Add a button that marks one more task done and re-runs the calculation.",
    ],
    code: [
      {
        language: 'html',
        filename: 'bar.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /></head>\n  <body>\n    <div style=\"width:200px;height:12px;background:#e2e8f0;border-radius:6px;overflow:hidden;\">\n      <div id=\"bar\" style=\"height:100%;background:#16a34a;width:0%;\"></div>\n    </div>\n    <p id=\"label\"></p>\n    <button id=\"complete-btn\">Complete one task</button>\n    <script src=\"bar.js\" defer></script>\n  </body>\n</html>",
      },
      {
        language: 'javascript',
        filename: 'bar.js',
        code:
          "const tasks = [\n  { name: 'Task A', done: true },\n  { name: 'Task B', done: false },\n  { name: 'Task C', done: false },\n  { name: 'Task D', done: false },\n];\n\nfunction updateBar() {\n  const doneCount = tasks.filter((t) => t.done).length;\n  const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;\n\n  document.getElementById('bar').style.width = `${percent}%`;\n  document.getElementById('label').textContent = `${doneCount}/${tasks.length} done (${percent}%)`;\n}\n\ndocument.getElementById('complete-btn').addEventListener('click', () => {\n  const next = tasks.find((t) => !t.done);\n  if (next) next.done = true;\n  updateBar();\n});\n\nupdateBar();   // initial draw",
      },
    ],
    explanation:
      "updateBar() derives everything it needs from the tasks array: doneCount with .filter(), and percent with a divide-and-guard against zero. It never stores the percentage anywhere permanent — it's recalculated fresh every call, so it can never go stale. The button's handler finds the first not-done task with .find(), flips it, and calls updateBar() again — the same 'change data, then re-render' rhythm from Momentum. Setting .style.width directly moves the coloured bar without touching the CSS file.",
    expectedOutput:
      "A progress bar starting at 25% (1 of 4 done). Each click on 'Complete one task' grows the bar and updates the label until it reaches 100%.",
    learned: [
      "How to compute a percentage from an array with filter().",
      "How to set an inline style from JavaScript.",
      "Why derived values should be recalculated, not stored.",
      "How to guard a calculation against dividing by zero.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's streak ring becomes truly dynamic, an empty state is added, and Module 2 is wrapped up as a finished, persisted, interactive app.",
    why:
      "This is the Module 2 milestone: Momentum should now feel like a small real product — add, check, delete, and reload, all working, with sensible behaviour even at the edges (no habits at all). It's the version you'd be proud to show someone.",
    fileLocation: "momentum/app.js (update renderHabits with the ring + empty state)",
    code: [
      {
        language: 'javascript',
        filename: 'app.js (final renderHabits() for Module 2)',
        code:
          "function renderHabits() {\n  const list = document.getElementById('habit-list');\n  list.innerHTML = '';\n\n  // Empty state — no habits at all.\n  if (habits.length === 0) {\n    const empty = document.createElement('li');\n    empty.className = 'empty';\n    empty.textContent = 'No habits yet — add your first one above!';\n    list.appendChild(empty);\n  } else {\n    habits.forEach((habit) => {\n      const li = document.createElement('li');\n      li.className = 'habit';\n      li.dataset.id = habit.id;\n\n      const icon = document.createElement('span');\n      icon.className = 'icon';\n      icon.textContent = habit.done ? '✅' : '⬜';\n\n      const label = document.createElement('span');\n      label.textContent = `${habit.name} · ${habit.streak}d`;\n\n      const del = document.createElement('button');\n      del.className = 'delete-btn';\n      del.textContent = '✕';\n\n      li.appendChild(icon);\n      li.appendChild(label);\n      li.appendChild(del);\n      list.appendChild(li);\n    });\n  }\n\n  // Derived state: the streak ring reflects TODAY's real completion percentage.\n  const doneCount = habits.filter((h) => h.done).length;\n  const percent = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;\n  const ring = document.querySelector('.ring');\n  const ringNumber = document.getElementById('streak-number');\n  if (ring) ring.style.background = `conic-gradient(#0891b2 ${percent}%, #e2e8f0 0), #fff`;\n  if (ringNumber) ringNumber.textContent = habits.length ? Math.max(...habits.map((h) => h.streak)) : 0;\n}",
      },
    ],
    placement:
      "Replace your entire renderHabits() function with the version above — it consolidates the habit list, delete buttons, empty state, and the dynamic ring into one place. Everything else (loadHabits, saveHabits, addHabit, removeHabit, toggleHabit, and your event listeners) stays exactly as you built it in Lessons 8–11.",
    implementation:
      "The function now branches: if habits.length === 0, it renders one friendly empty-state <li> instead of an empty list. Otherwise it builds each habit card as before, now including a delete button as part of the standard render (from your Lesson 10 homework). After the list is built either way, the function computes derived state — doneCount and percent from today's habits — and, guarding with `if (ring)` / `if (ringNumber)` in case those elements don't exist on every page, updates the ring's conic-gradient sweep and its centre number directly via .style and .textContent. Because this all lives inside renderHabits(), it automatically re-syncs every single time ANYTHING changes — add, toggle, or delete — with zero extra code needed elsewhere.",
    expectedResult:
      "Checking off habits visibly fills the streak ring toward 100%; deleting every habit shows a clean 'No habits yet' message instead of a blank box; refreshing the page always restores exactly where you left off. Momentum is now a complete, working, persisted app.",
    connects:
      "Module 2 is done: Momentum is fully interactive, data-driven, and persistent — built entirely in vanilla JavaScript. Module 3 rebuilds this SAME product using React and Next.js, so you'll recognise every concept (state, rendering, events) in a more powerful, component-based form.",
  },

  quiz: [
    { id: 'l12q1', kind: 'concept', prompt: 'What does "derived state" mean?', options: ['Data loaded from a server', 'A value computed from existing data rather than stored separately', 'A CSS animation', 'A type of event'], answerIndex: 1, explanation: "Derived state is calculated fresh from the real data (like a percentage), so it can't go stale." },
    { id: 'l12q2', kind: 'code_reading', prompt: 'What does habits.filter((h) => h.done).length compute?', options: ['The total number of habits', 'The number of habits marked done', 'The average streak', 'The longest streak'], answerIndex: 1, explanation: "filter keeps only the done habits, and .length counts how many remain." },
    { id: 'l12q3', kind: 'debug', prompt: 'percent is NaN when habits.length is 0. Why, and how is it fixed?', options: ['JavaScript can’t do math', 'Dividing by zero; fixed with a guard like habits.length ? … : 0', 'filter() is broken', 'A typo in doneCount'], answerIndex: 1, explanation: "Dividing by zero produces NaN; the ternary guard avoids it by returning 0 instead." },
    { id: 'l12q4', kind: 'application', prompt: 'How do you set an inline style from JavaScript?', options: ['element.className = "..."', 'element.style.property = value', 'element.textContent = value', 'element.dataset = value'], answerIndex: 1, explanation: "element.style.propertyName sets that one CSS property directly on the element." },
    { id: 'l12q5', kind: 'concept', prompt: 'Why show an empty-state message instead of just an empty <ul>?', options: ['It’s required by HTML', 'A blank area looks broken; a message shows it’s intentional and guides the user', 'It saves memory', 'It’s faster to render'], answerIndex: 1, explanation: "A deliberate empty-state message tells the user what happened and what to do next." },
    { id: 'l12q6', kind: 'output', prompt: 'If 2 of 4 habits are done, what percent does the ring show?', options: ['25%', '50%', '75%', '100%'], answerIndex: 1, explanation: "2 done out of 4 total = 50%." },
    { id: 'l12q7', kind: 'concept', prompt: 'What is the core data-flow loop this module built?', options: ['Style → animate → repeat', 'Load → render → event → update data → save → render', 'Fetch → cache → discard', 'HTML → CSS → JS, in that fixed order forever'], answerIndex: 1, explanation: "This load/render/event/update/save/render cycle is the backbone of Momentum's interactivity." },
    { id: 'l12q8', kind: 'debug', prompt: 'The ring update code checks `if (ring) { ... }` before using it. Why?', options: ['Stylistic preference only', 'To avoid an error if .ring doesn’t exist on the current page/element', 'ring is always null', 'It’s required by conic-gradient'], answerIndex: 1, explanation: "Guarding against a missing element prevents a runtime error if the selector finds nothing." },
    { id: 'l12q9', kind: 'project', prompt: "Why does renderHabits() recompute the ring INSIDE itself rather than in a separate function called elsewhere?", options: ['It has to be one giant function', 'So the ring always updates automatically whenever anything triggers a re-render, with no extra calls needed', 'Ring updates are unrelated to habits', 'JavaScript requires it'], answerIndex: 1, explanation: "Bundling it into renderHabits() means every add/toggle/delete flow (which already calls renderHabits()) keeps the ring in sync for free." },
    { id: 'l12q10', kind: 'application', prompt: 'What happens if you delete all habits with this final renderHabits()?', options: ['The page crashes', 'A "No habits yet" message appears and the ring resets to 0%', 'The old list stays visible', 'localStorage is cleared automatically'], answerIndex: 1, explanation: "The length === 0 branch shows the empty state, and the guarded percent calculation returns 0." },
  ],

  homework: {
    task:
      "Add a small completion summary above the habit list, e.g. '2 of 4 done today', computed the same derived way as the ring — and make it update live with every change.",
    requirements: [
      "Add a <p id=\"summary\"></p> element above the habit list in the HTML.",
      "Inside renderHabits(), compute doneCount/habits.length (reuse the existing variables) and set the summary's textContent.",
      "It must correctly say '0 of 0 done today' when the list is empty, with no errors.",
    ],
    expectedOutcome:
      "A live summary line that always matches the ring and the actual habit states, updating instantly on every add/toggle/delete.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 11,
      hint: "Lesson 11 asked you to add a 'Reset to defaults' button that clears saved data and restores the 3 starter habits.",
      steps: [
        "Add a button, e.g. <button id=\"reset-btn\">Reset habits</button>, somewhere sensible on the page.",
        "On click, splice out everything currently in habits and push in fresh copies of defaultHabits (so you're not just reassigning — habits stays the SAME array reference other code relies on).",
        "Reset nextId back to one more than the highest default id.",
        "Call saveHabits() and renderHabits() so the reset is both visible and persisted.",
      ],
      codeGuidance: [
        {
          language: 'javascript',
          filename: 'app.js',
          code:
            "document.getElementById('reset-btn').addEventListener('click', () => {\n  habits.splice(0, habits.length, ...defaultHabits.map((h) => ({ ...h })));\n  nextId = Math.max(...defaultHabits.map((h) => h.id)) + 1;\n  saveHabits();\n  renderHabits();\n});",
        },
      ],
    },
  },
};
