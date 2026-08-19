import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 10 — Event Listeners
 * Module 2 (JavaScript Essentials) · Lesson 10 of 30
 */
export const lesson10: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 2,
  lessonIndex: 3,
  globalNumber: 10,
  name: 'Event listeners',
  title: 'Event Listeners — Making Momentum Respond to Clicks',
  subtitle: "Wire real buttons: check off a habit, add a new one, delete one — no console required.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to listen for user actions like clicks and typing with addEventListener, read the event object, and handle events efficiently on dynamic lists with event delegation.",
    sections: [
      {
        heading: 'What is an event?',
        body:
          "An event is something that HAPPENS in the browser: a click, a key press, a form submit, the page finishing loading. JavaScript can't do anything until something triggers it — events are that trigger. Up to now, our functions only ran because WE called them manually; from here on, USER ACTIONS call them.",
      },
      {
        heading: 'addEventListener',
        body:
          "You attach a listener to an element: element.addEventListener('click', function). The function (often called a handler) runs every time that event happens on that element. This decouples 'what happens' (the handler) from 'when it happens' (the event) — clean and flexible.",
        code: {
          language: 'javascript',
          code:
            "const btn = document.querySelector('button');\nbtn.addEventListener('click', () => {\n  console.log('Button was clicked!');\n});",
        },
      },
      {
        heading: 'The event object',
        body:
          "Your handler function automatically receives an event object describing what happened. Two things you'll use constantly: event.preventDefault() (stops a form from reloading the page on submit) and event.target (the exact element that triggered the event — vital when many similar elements share one listener).",
        code: {
          language: 'javascript',
          code:
            "form.addEventListener('submit', (event) => {\n  event.preventDefault();      // stop the page from reloading\n  console.log('Submitted!');\n});",
        },
      },
      {
        heading: 'Event delegation — one listener for many items',
        body:
          "Momentum's habit list is re-rendered often (every renderHabits() call creates BRAND NEW <li> elements). Attaching a listener to each <li> individually means you'd have to re-attach it every single render — messy and error-prone. The fix is event delegation: attach ONE listener to the stable parent container (#habit-list), and use event.target inside it to figure out which child was actually clicked. The parent never gets destroyed, so the listener never needs re-attaching.",
        code: {
          language: 'javascript',
          code:
            "list.addEventListener('click', (event) => {\n  const li = event.target.closest('.habit');   // find the habit card that was clicked\n  if (!li) return;\n  console.log('Clicked habit:', li.dataset.id);\n});",
        },
      },
      {
        heading: 'data-* attributes — attaching data to elements',
        body:
          "How does a click on an <li> know WHICH habit id it represents? By storing it right on the element with a data attribute: <li data-id=\"3\">. In JavaScript, element.dataset.id reads it back as a string. This is the standard way to attach a bit of your data model to its rendered DOM element.",
      },
    ],
    keyTerms: [
      { term: 'Event', definition: "Something that happens in the browser — a click, keypress, submit, etc." },
      { term: 'addEventListener', definition: "Attaches a handler function to an element for a specific event type." },
      { term: 'Event object', definition: "The object automatically passed to a handler, describing the event (e.g. event.target)." },
      { term: 'event.target', definition: "The exact element the event happened on." },
      { term: 'Event delegation', definition: "Listening on a stable parent instead of many children, using event.target to identify which child fired it." },
      { term: 'data-* attribute', definition: "A custom HTML attribute for storing data on an element, read via element.dataset." },
    ],
    commonMistakes: [
      "Attaching a listener to elements that get re-created every render — the listener is lost each time.",
      "Forgetting event.preventDefault() on a form, so the page reloads and your data resets.",
      "Reading event.target when the click landed on a CHILD of the element you meant (use .closest() to find the right ancestor).",
      "Comparing dataset values without converting types — dataset.id is always a string, so compare habit.id === Number(li.dataset.id).",
      "Adding a NEW listener every time you render, causing the same click to fire the handler multiple times.",
    ],
    takeaways: [
      "addEventListener(event, handler) makes an element respond to user actions.",
      "The event object gives you event.target — the element that was actually interacted with.",
      "Event delegation (one listener on a stable parent) is the right pattern for dynamic lists.",
      "data-* attributes + .dataset let you attach model data to rendered elements.",
      "closest() finds the nearest matching ancestor from wherever the click landed.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A click counter with delegation',
    objective:
      "Practise addEventListener and event delegation by building a list of buttons where clicking ANY of them, even ones added later, increments a shared counter.",
    instructions: [
      "Create clicker.html with a container div, three buttons inside it, and a counter display.",
      "Create clicker.js: add ONE click listener on the container.",
      "Use event.target to detect a button click and increment the counter.",
      "Add a 4th button dynamically and confirm it works without a new listener.",
    ],
    code: [
      {
        language: 'html',
        filename: 'clicker.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /></head>\n  <body>\n    <p>Clicks: <span id=\"count\">0</span></p>\n    <div id=\"buttons\">\n      <button>A</button>\n      <button>B</button>\n      <button>C</button>\n    </div>\n    <script src=\"clicker.js\" defer></script>\n  </body>\n</html>",
      },
      {
        language: 'javascript',
        filename: 'clicker.js',
        code:
          "let count = 0;\nconst countEl = document.getElementById('count');\nconst container = document.getElementById('buttons');\n\ncontainer.addEventListener('click', (event) => {\n  if (event.target.tagName !== 'BUTTON') return;   // ignore clicks that miss a button\n  count += 1;\n  countEl.textContent = count;\n});\n\n// Add a 4th button AFTER the listener was attached — it still works!\nconst extra = document.createElement('button');\nextra.textContent = 'D';\ncontainer.appendChild(extra);",
      },
    ],
    explanation:
      "One listener sits on #buttons, the stable parent. Every click inside it bubbles up to this listener, which checks event.target.tagName to confirm the click actually landed on a <button> (not empty space in the div). If so, it increments the shared count and updates the display. Because the listener lives on the PARENT, the dynamically-added 4th button works immediately — no second listener needed. This is exactly the trick Momentum's re-rendered habit list relies on.",
    expectedOutput:
      "Clicking any of A, B, C, or the dynamically added D increases the 'Clicks' counter by one each time.",
    learned: [
      "How to attach and use addEventListener.",
      "How event.target identifies what was actually clicked.",
      "Why one delegated listener survives new elements being added.",
      "How to guard a handler so only the right clicks count.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum becomes fully clickable — tapping a habit toggles it done, and a real 'Add habit' form creates new ones.",
    why:
      "Momentum's functions and rendering exist, but only YOU could trigger them from the console. This lesson connects real UI — clicking a card, submitting a form — to addHabit/toggleHabit/removeHabit, which is what makes Momentum an actual usable app instead of a demo.",
    fileLocation: "momentum/index.html (add an add-habit form + data-id on cards) and momentum/app.js (wire the listeners)",
    code: [
      {
        language: 'html',
        filename: 'index.html (inside the #habits section, above the list)',
        code:
          "<form id=\"add-habit-form\">\n  <input type=\"text\" id=\"new-habit-input\" placeholder=\"New habit…\" required />\n  <button type=\"submit\">Add</button>\n</form>",
      },
      {
        language: 'javascript',
        filename: 'app.js (update renderHabits to add data-id, then add listeners)',
        code:
          "function renderHabits() {\n  const list = document.getElementById('habit-list');\n  list.innerHTML = '';\n\n  habits.forEach((habit) => {\n    const li = document.createElement('li');\n    li.className = 'habit';\n    li.dataset.id = habit.id;   // <-- attach the id so clicks can identify it\n\n    const icon = document.createElement('span');\n    icon.className = 'icon';\n    icon.textContent = habit.done ? '✅' : '⬜';\n\n    const label = document.createElement('span');\n    label.textContent = `${habit.name} · ${habit.streak}d`;\n\n    li.appendChild(icon);\n    li.appendChild(label);\n    list.appendChild(li);\n  });\n}\n\n// One delegated listener handles EVERY habit click, forever — even after re-render.\nconst habitList = document.getElementById('habit-list');\nhabitList.addEventListener('click', (event) => {\n  const li = event.target.closest('.habit');\n  if (!li) return;\n  toggleHabit(Number(li.dataset.id));\n  renderHabits();   // re-draw so the check + streak reflect the change\n});\n\n// The add-habit form.\nconst form = document.getElementById('add-habit-form');\nform.addEventListener('submit', (event) => {\n  event.preventDefault();          // don't reload the page\n  const input = document.getElementById('new-habit-input');\n  const name = input.value.trim();\n  if (!name) return;               // ignore empty submissions\n  addHabit(name);\n  input.value = '';                // clear the box\n  renderHabits();\n});\n\nrenderHabits();",
      },
    ],
    placement:
      "1) Add the <form id=\"add-habit-form\"> markup inside the #habits section, above the <ul class=\"habit-list\">. 2) Replace your existing renderHabits() with the version above (adds li.dataset.id). 3) Add the two addEventListener blocks below your functions, and make sure renderHabits() is called once at the very end. 4) Refresh, click a habit card, and try adding a new habit.",
    implementation:
      "renderHabits() now stamps each <li> with data-id, so a click can be traced back to a specific habit. The habit-list listener uses event.target.closest('.habit') to find the clicked card even if the click landed on the icon or label inside it, converts the string dataset.id back to a Number (since habit.id is a number), calls toggleHabit(), and immediately calls renderHabits() again so the page reflects the new state — check mark and streak included. The form listener calls preventDefault() so submitting doesn't reload the page, reads and trims the input, guards against an empty submission, calls addHabit(), clears the input for the next entry, and re-renders. Both flows follow the same rhythm: change the DATA, then re-render.",
    expectedResult:
      "Clicking any habit card instantly toggles its check mark and streak. Typing a name into the 'New habit…' box and clicking Add instantly adds a new card to the list — Momentum is now a real, interactive app.",
    connects:
      "Every click currently resets the moment you refresh the page, because habits only lives in memory. Lesson 11 fixes that with localStorage, so everything you add or check off is still there next time you open Momentum.",
  },

  quiz: [
    { id: 'l10q1', kind: 'concept', prompt: 'What triggers a JavaScript event handler to run?', options: ['The page loading only', 'A user action or browser event, like a click', 'Refreshing the CSS', 'Nothing — you must call it manually'], answerIndex: 1, explanation: "An event handler runs automatically when its event (click, submit, etc.) occurs." },
    { id: 'l10q2', kind: 'code_reading', prompt: 'What does event.target refer to inside a click handler?', options: ['The listener function itself', 'The exact element the event occurred on', 'The whole document', 'The previous event'], answerIndex: 1, explanation: "event.target is the specific element that was actually interacted with." },
    { id: 'l10q3', kind: 'application', prompt: 'Why attach ONE listener to #habit-list instead of one per <li>?', options: ['It’s required by HTML', 'Because <li> elements are recreated on every render, so per-item listeners would be lost', 'It’s faster to type', 'querySelectorAll doesn’t work otherwise'], answerIndex: 1, explanation: "Event delegation on the stable parent survives re-renders that destroy and recreate the children." },
    { id: 'l10q4', kind: 'debug', prompt: 'A form reloads the page on submit, losing all typed data. What’s missing?', options: ['addEventListener', 'event.preventDefault() in the submit handler', 'A button element', 'CSS'], answerIndex: 1, explanation: "Without preventDefault(), the browser performs its default full-page form submission/reload." },
    { id: 'l10q5', kind: 'code_reading', prompt: 'What does li.dataset.id read if the HTML has <li data-id="3">?', options: ['The number 3', 'The string "3"', 'undefined', 'An error'], answerIndex: 1, explanation: "dataset values are always strings — convert with Number() when you need a number." },
    { id: 'l10q6', kind: 'application', prompt: 'A click lands on the icon SPAN inside a habit card, not the <li> itself. How do you still find the card?', options: ['event.target.closest(".habit")', 'event.target.parentElement only', 'It’s impossible', 'querySelector("body")'], answerIndex: 0, explanation: "closest() walks up from the exact clicked element to find the nearest ancestor matching the selector." },
    { id: 'l10q7', kind: 'concept', prompt: 'Why call renderHabits() again right after toggleHabit()?', options: ['It resets the array', 'The DOM only shows the CURRENT data when render runs, so the UI needs a fresh render to reflect the change', 'It’s optional styling', 'To remove event listeners'], answerIndex: 1, explanation: "Changing the data doesn't automatically redraw the page — render must be called again." },
    { id: 'l10q8', kind: 'output', prompt: 'A user submits the add-habit form with an empty input. What happens with the given code?', options: ['A habit named "" is added', 'addHabit() is skipped because of the empty-name guard', 'The page crashes', 'The form resets automatically'], answerIndex: 1, explanation: "if (!name) return; stops the handler before calling addHabit() when the trimmed input is empty." },
    { id: 'l10q9', kind: 'debug', prompt: 'Every click on a habit toggles it TWICE. A likely bug?', options: ['toggleHabit has an error', 'The click listener was accidentally attached more than once', 'renderHabits is missing', 'dataset.id is wrong'], answerIndex: 1, explanation: "If addEventListener runs more than once for the same element, each click fires multiple handlers." },
    { id: 'l10q10', kind: 'project', prompt: "Why does Momentum's add-habit form use type=\"text\" with required, plus a JS guard for an empty trimmed value?", options: ['Only one is needed, they’re redundant', 'The HTML required gives basic validation; the JS guard double-checks trimmed whitespace-only input', 'required breaks JavaScript', 'They serve unrelated purposes'], answerIndex: 1, explanation: "required blocks a fully empty submit; the JS check also catches input that's just whitespace." },
  ],

  homework: {
    task:
      "Add a delete button to each habit card and wire it up (using the same event-delegation listener) to call removeHabit(id) and re-render. Make sure clicking Delete doesn't ALSO toggle the habit.",
    requirements: [
      "In renderHabits(), add a small delete <button> (e.g. '✕') inside each <li>, with its own recognisable class (e.g. \"delete-btn\").",
      "In the delegated click handler, check if event.target has that class FIRST and call removeHabit if so — otherwise fall through to the toggle logic.",
      "Deleting must not also toggle the habit that was deleted.",
    ],
    expectedOutcome:
      "Each habit card shows a delete button; clicking it removes that habit and only that habit, and clicking anywhere else on the card still toggles it as before.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 9,
      hint: "Lesson 9 asked you to make the streak ring's number reflect the real longest streak, recalculated inside renderHabits().",
      steps: [
        "Give the ring's number <span> an id, e.g. id=\"streak-number\".",
        "Inside renderHabits(), after building the list, compute the max streak from habits (Math.max with a spread, or your getLongestStreakHabit() from Lesson 8's homework).",
        "Select the span and set its textContent to that number.",
        "Test by changing a streak value and re-rendering.",
      ],
      codeGuidance: [
        {
          language: 'javascript',
          filename: 'app.js (inside renderHabits, after the forEach loop)',
          code:
            "const streakNumberEl = document.getElementById('streak-number');\nif (streakNumberEl) {\n  const longest = Math.max(...habits.map((h) => h.streak));\n  streakNumberEl.textContent = longest;\n}",
        },
      ],
    },
  },
};
