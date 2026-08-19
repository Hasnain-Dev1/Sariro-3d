import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 9 — DOM Manipulation
 * Module 2 (JavaScript Essentials) · Lesson 9 of 30
 */
export const lesson09: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 2,
  lessonIndex: 2,
  globalNumber: 9,
  name: 'DOM manipulation',
  title: 'The DOM — Making JavaScript Change What You See',
  subtitle: "Render Momentum's habit list live from JavaScript data — no more hard-coded HTML.",

  concept: {
    durationMin: 15,
    summary:
      "Understand the DOM as JavaScript's live model of the page, and learn to select, create, and update elements — turning data into visible content.",
    sections: [
      {
        heading: 'What is the DOM?',
        body:
          "When a browser loads your HTML, it builds a live, in-memory tree of every element called the DOM (Document Object Model). JavaScript can read and change this tree, and the browser instantly redraws whatever changed. This is the bridge between your data (the habits array) and what the user actually sees.",
      },
      {
        heading: 'Selecting elements',
        body:
          "Before you can change something, you select it. document.getElementById('habit-list') finds the one element with that id. document.querySelector('.habit') finds the FIRST match for a CSS-style selector; querySelectorAll returns ALL matches as a list you can loop over. getElementById is fastest for a single known id; querySelector is the flexible, general-purpose tool.",
        code: {
          language: 'javascript',
          code:
            "const list = document.getElementById('habit-list');\nconst firstCard = document.querySelector('.habit');\nconst allCards = document.querySelectorAll('.habit');   // a list of all of them",
        },
      },
      {
        heading: 'Reading and writing content',
        body:
          "textContent gets/sets an element's plain text — safe and simple. innerHTML gets/sets HTML markup itself, letting you insert tags, but is riskier (never insert raw user input with it — that's a security issue called XSS). For Momentum's habit names, textContent is the right, safe choice.",
        code: {
          language: 'javascript',
          code:
            "const heading = document.querySelector('h2');\nheading.textContent = 'Today’s 3 habits';   // changes the visible text",
        },
      },
      {
        heading: 'Creating elements from data',
        body:
          "document.createElement('li') makes a brand-new element in memory (not on the page yet). You set its properties (className, textContent), then attach it to the page with appendChild. This is exactly how you turn an ARRAY of habit objects into a real list of <li> elements — loop through the array, create one element per item, and append each one.",
        code: {
          language: 'javascript',
          code:
            "const li = document.createElement('li');\nli.className = 'habit';\nli.textContent = 'Drink water';\nlist.appendChild(li);   // now it's really on the page",
        },
      },
      {
        heading: 'Clearing and re-rendering',
        body:
          "A common, simple pattern: clear a container's existing content (container.innerHTML = '') and rebuild it from scratch every time the data changes. It's not the most performance-optimal approach for huge lists, but it's simple, predictable, and perfect for Momentum's small habit list — you'll write one renderHabits() function that always keeps the page in sync with the habits array.",
      },
    ],
    keyTerms: [
      { term: 'DOM', definition: "Document Object Model — the browser's live, in-memory tree of your page that JavaScript can read and change." },
      { term: 'getElementById', definition: "Selects the single element with a matching id." },
      { term: 'querySelector / querySelectorAll', definition: "Select the first / all elements matching a CSS-style selector." },
      { term: 'textContent', definition: "Gets or sets an element's plain text content — the safe way to insert text." },
      { term: 'createElement', definition: "Creates a new element in memory, not yet attached to the page." },
      { term: 'appendChild', definition: "Attaches a created element as a child of a container, making it visible." },
    ],
    commonMistakes: [
      "Selecting an element before the page has loaded it, getting null. <script defer> avoids this.",
      "Using innerHTML with raw text you didn't control — a security risk. Use textContent for plain text.",
      "Creating an element with createElement but forgetting appendChild — it never appears on the page.",
      "Re-selecting the same element repeatedly in a loop instead of storing it in a variable once.",
      "Forgetting to clear the OLD content before re-rendering, causing duplicate items to pile up.",
    ],
    takeaways: [
      "The DOM is JavaScript's live model of the page — change it, and the browser redraws.",
      "getElementById for one known id; querySelector(All) for CSS-style flexibility.",
      "textContent is the safe way to set plain text.",
      "createElement + appendChild turns data into real page elements.",
      "A render function that clears then rebuilds keeps the page in sync with your data.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Render a list from an array',
    objective:
      "Practise the exact create-and-append pattern Momentum needs by turning a plain array of strings into a real bulleted list on the page.",
    instructions: [
      "Create dom.html with an empty <ul id=\"fruit-list\"></ul> and link dom.js.",
      "In dom.js, declare an array of fruit names.",
      "Write a renderFruits() function that clears the list and creates one <li> per fruit.",
      "Call renderFruits() once the script runs.",
    ],
    code: [
      {
        language: 'html',
        filename: 'dom.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /></head>\n  <body>\n    <ul id=\"fruit-list\"></ul>\n    <script src=\"dom.js\" defer></script>\n  </body>\n</html>",
      },
      {
        language: 'javascript',
        filename: 'dom.js',
        code:
          "const fruits = ['Mango', 'Apple', 'Papaya'];\n\nfunction renderFruits() {\n  const list = document.getElementById('fruit-list');\n  list.innerHTML = '';   // clear old content\n\n  fruits.forEach((fruit) => {\n    const li = document.createElement('li');\n    li.textContent = fruit;\n    list.appendChild(li);\n  });\n}\n\nrenderFruits();",
      },
    ],
    explanation:
      "renderFruits() first grabs the container with getElementById, then clears it (list.innerHTML = '') so re-running the function never duplicates items. fruits.forEach loops over every string in the array; for each one, createElement makes a fresh <li>, textContent gives it the fruit's name safely, and appendChild attaches it to the list. Nothing was hard-coded in the HTML — the entire list came from the fruits array, which is exactly how Momentum's habits will render.",
    expectedOutput:
      "A bulleted list showing Mango, Apple, and Papaya — generated entirely by JavaScript from the array, with no <li> written by hand in the HTML.",
    learned: [
      "How to select a container and clear its contents.",
      "How to loop through an array with forEach.",
      "How createElement + textContent + appendChild build real elements.",
      "Why clearing before rebuilding avoids duplicates.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's habit list now renders LIVE from the habits array — the static <li> markup from Module 1 is replaced by real JavaScript rendering.",
    why:
      "This is the pivotal moment: until now, the page showed fixed text no matter what habits array holds. After this lesson, the page always reflects the DATA — add a habit in the console and it appears on screen. This is what makes an app 'dynamic' instead of a static page.",
    fileLocation: "momentum/index.html (empty the habit-list) + momentum/app.js (add renderHabits)",
    code: [
      {
        language: 'html',
        filename: 'index.html (replace the hard-coded habit list)',
        code:
          "<!-- BEFORE: three hand-written <li class=\"habit\"> items -->\n<!-- AFTER: an empty container JavaScript will fill -->\n<ul class=\"habit-list\" id=\"habit-list\"></ul>",
      },
      {
        language: 'javascript',
        filename: 'app.js (add at the bottom, after the functions from Lesson 8)',
        code:
          "function renderHabits() {\n  const list = document.getElementById('habit-list');\n  list.innerHTML = '';   // clear before rebuilding\n\n  habits.forEach((habit) => {\n    const li = document.createElement('li');\n    li.className = 'habit';\n\n    const icon = document.createElement('span');\n    icon.className = 'icon';\n    icon.textContent = habit.done ? '✅' : '⬜';\n\n    const label = document.createElement('span');\n    label.textContent = `${habit.name} · ${habit.streak}d`;\n\n    li.appendChild(icon);\n    li.appendChild(label);\n    list.appendChild(li);\n  });\n}\n\nrenderHabits();   // draw the page as soon as the script runs",
      },
    ],
    placement:
      "1) In index.html, delete the three hand-written <li class=\"habit\"> items and leave an empty <ul class=\"habit-list\" id=\"habit-list\"></ul>. 2) In app.js, add the renderHabits() function below your Lesson 8 functions, and call renderHabits() once at the bottom of the file. 3) Refresh — the page should look the same as before, but it's now 100% generated by JavaScript.",
    implementation:
      "renderHabits() follows the mini-project pattern exactly, adapted for real data. It clears #habit-list, then loops over the habits array with forEach. For each habit, it builds TWO child elements — an icon span (an emoji check that reflects habit.done) and a label span showing the name and streak via a template literal — then appends both into the <li>, and the <li> into the list. Because this reads directly from the habits array, calling addHabit('X') in the console and then renderHabits() again will make the new habit appear ON THE PAGE — something impossible with the old hard-coded HTML.",
    expectedResult:
      "Momentum's habit list looks the same visually (thanks to the existing .habit CSS class), but it's now entirely data-driven. Type addHabit('Stretch') and renderHabits() into the console and watch a fourth habit appear instantly.",
    connects:
      "The page now reflects the data whenever renderHabits() runs — but a user shouldn't need to open the console to add a habit. Lesson 10 wires real buttons and clicks to call addHabit/toggleHabit/removeHabit and then renderHabits() automatically.",
  },

  quiz: [
    { id: 'l9q1', kind: 'concept', prompt: 'What is the DOM?', options: ['A CSS framework', 'The browser’s live, in-memory tree of the page that JS can change', 'A type of database', 'A JavaScript library'], answerIndex: 1, explanation: "The DOM is the live object representation of the page that JavaScript reads and modifies." },
    { id: 'l9q2', kind: 'code_reading', prompt: 'What does document.getElementById("habit-list") return if no element has that id?', options: ['An empty array', 'null', 'undefined', 'An error is thrown'], answerIndex: 1, explanation: "getElementById returns null when nothing matches, rather than throwing." },
    { id: 'l9q3', kind: 'application', prompt: 'Which is the SAFE way to set plain text on an element?', options: ['element.innerHTML = text', 'element.textContent = text', 'element.outerHTML = text', 'element.value = text'], answerIndex: 1, explanation: "textContent inserts plain text without interpreting it as HTML, avoiding injection risks." },
    { id: 'l9q4', kind: 'debug', prompt: 'A student calls createElement("li") but nothing shows on the page. What’s missing?', options: ['textContent', 'appendChild to attach it to the page', 'A className', 'defer'], answerIndex: 1, explanation: "createElement only makes the element in memory; appendChild is what attaches it to the visible DOM." },
    { id: 'l9q5', kind: 'code_reading', prompt: 'Why does renderHabits() start with list.innerHTML = "";?', options: ['To delete the array', 'To clear old items so re-rendering doesn’t duplicate them', 'It’s required syntax', 'To hide the list'], answerIndex: 1, explanation: "Clearing first prevents old <li> elements from piling up each time you re-render." },
    { id: 'l9q6', kind: 'output', prompt: 'If habits has 3 items, how many <li> elements does renderHabits() create?', options: ['1', '3', '0', 'It depends on CSS'], answerIndex: 1, explanation: "forEach runs once per array item, creating one <li> per habit." },
    { id: 'l9q7', kind: 'concept', prompt: 'Difference between querySelector and querySelectorAll?', options: ['No difference', 'querySelector returns the first match; querySelectorAll returns all matches', 'querySelectorAll is faster always', 'querySelector only works on ids'], answerIndex: 1, explanation: "querySelector stops at the first match; querySelectorAll collects every match." },
    { id: 'l9q8', kind: 'application', prompt: 'You want to loop over an array and do something for each item. Best tool?', options: ['forEach', 'typeof', 'JSON.stringify', 'appendChild alone'], answerIndex: 0, explanation: "Array.forEach runs a function once for every item in the array." },
    { id: 'l9q9', kind: 'project', prompt: "In Momentum, why is renderHabits() called again in the console after addHabit('Stretch')?", options: ['addHabit() automatically updates the page', 'The page only updates when render runs, so it must be called after any data change', 'It fixes a bug', 'It resets the streaks'], answerIndex: 1, explanation: "Right now the page only reflects the data when renderHabits() is explicitly called — Lesson 10 automates this." },
    { id: 'l9q10', kind: 'debug', prompt: 'The habit list shows old AND new items duplicated after several renders. Likely bug?', options: ['Missing appendChild', 'The clearing line (innerHTML = "") was removed or misplaced', 'Too many habits in the array', 'CSS is broken'], answerIndex: 1, explanation: "Without clearing the container first, every render adds MORE elements instead of replacing them." },
  ],

  homework: {
    task:
      "Update renderHabits() so the streak ring's number (the <span> inside .ring) shows the CURRENT longest streak, recalculated from the habits array every time render runs — not the hard-coded '7' from Module 1.",
    requirements: [
      "Select the ring's number span (add an id, e.g. id=\"streak-number\", if it doesn't have one).",
      "Inside renderHabits(), compute the longest streak from the habits array (reuse or rewrite the Math.max/spread idea from Lesson 7).",
      "Set the span's textContent to that computed number.",
      "Test it: change a habit's streak via the console, call renderHabits(), and confirm the ring updates.",
    ],
    expectedOutcome:
      "The ring's number always matches the true longest streak in the data, and updates automatically the next time renderHabits() runs.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 8,
      hint: "Lesson 8 asked you to write getLongestStreakHabit(), returning the whole habit object with the highest streak, using return.",
      steps: [
        "Write a function that takes no parameters and reads the global habits array.",
        "Use .reduce() (or a simple loop) to compare every habit's streak and keep the highest one.",
        "Return the WHOLE habit object, not just the number.",
        "Call it and log a sentence using the returned object's .name and .streak.",
      ],
      codeGuidance: [
        {
          language: 'javascript',
          filename: 'app.js',
          code:
            "function getLongestStreakHabit() {\n  return habits.reduce((best, h) => (h.streak > best.streak ? h : best), habits[0]);\n}\n\nconst best = getLongestStreakHabit();\nconsole.log(`Your best streak is ${best.name} at ${best.streak} days.`);",
        },
      ],
    },
  },
};
