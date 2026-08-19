import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 7 — Variables, Types & Operators
 * Module 2 (JavaScript Essentials) · Lesson 7 of 30
 */
export const lesson07: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 2,
  lessonIndex: 0,
  globalNumber: 7,
  name: 'Variables, types & operators',
  title: 'JavaScript Basics — Variables, Types & Operators',
  subtitle: "Momentum comes alive: give it a real data model of habits, in JavaScript.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how JavaScript stores data with variables, the core data types, and the operators used to compute and compare values — the raw material every script is built from.",
    sections: [
      {
        heading: 'What is JavaScript, and how do we run it?',
        body:
          "HTML is structure and CSS is style — JavaScript (JS) is behaviour. It's a real programming language: it can make decisions, repeat actions, and react to what a user does. It runs INSIDE the browser, directly on your page.\n\nYou connect a JS file with a <script> tag, usually right before </body> so the page's HTML exists before the script runs: <script src=\"app.js\" defer></script>. The defer attribute tells the browser to run the script only after the whole page has loaded.",
        code: {
          language: 'html',
          code:
            "  <!-- just before </body> -->\n  <script src=\"app.js\" defer></script>\n</body>",
        },
      },
      {
        heading: 'Declaring variables: let and const',
        body:
          "A variable is a named box that holds a value. Modern JavaScript uses two keywords: let for a value that WILL change, and const for a value that WON'T be reassigned. Prefer const by default — reach for let only when you know the value needs to change later (like a counter).\n\n(You may see var in old code — avoid it; let/const fix var's confusing behaviour.)",
        code: {
          language: 'javascript',
          code:
            "const appName = 'Momentum';   // never reassigned\nlet streak = 7;                // will change over time\nstreak = 8;                    // fine — let allows this\n// appName = 'X';               // ERROR — const cannot be reassigned",
        },
      },
      {
        heading: 'The core data types',
        body:
          "Every value in JS has a type. The ones you'll use constantly:\n\n• string — text, in quotes: 'Drink water'\n• number — any number, no separate int/float: 7, 3.5\n• boolean — true or false\n• array — an ordered list: ['a', 'b', 'c']\n• object — named properties: { name: 'Drink water', done: false }\n\nUse typeof to check a value's type: typeof 7 is 'number'.",
        code: {
          language: 'javascript',
          code:
            "const habitName = 'Drink water';   // string\nconst streakCount = 7;              // number\nconst isDone = false;               // boolean\nconst habitNames = ['Water', 'Read', 'Walk'];  // array\nconst habit = { name: 'Drink water', done: false };  // object",
        },
      },
      {
        heading: 'Operators — doing things with values',
        body:
          "Arithmetic: + - * / (and % for remainder). Comparison: === (equals — always use THIS, not ==) and !== (not equal), plus < > <= >=. Logical: && (and), || (or), ! (not). Assignment shorthand: streak += 1 means streak = streak + 1.\n\n=== checks both value AND type, avoiding weird bugs === always wins over ==.",
        code: {
          language: 'javascript',
          code:
            "let streak = 7;\nstreak += 1;              // streak is now 8\n\nconst isLongStreak = streak >= 7;   // true\nconst canCelebrate = isLongStreak && isDone;  // true only if BOTH",
        },
      },
      {
        heading: 'Template literals — building strings',
        body:
          "Backticks (`) let you embed variables directly inside a string using ${...} — far cleaner than joining strings with +. This is how you'll build dynamic text throughout Momentum, like a streak message.",
        code: {
          language: 'javascript',
          code:
            "const streak = 7;\nconst message = `You're on a ${streak}-day streak!`;\nconsole.log(message);   // You're on a 7-day streak!",
        },
      },
    ],
    keyTerms: [
      { term: 'Variable', definition: "A named container for a value, declared with let or const." },
      { term: 'const', definition: "Declares a variable that cannot be reassigned after its first value." },
      { term: 'let', definition: "Declares a variable whose value can change later." },
      { term: 'Type', definition: "What kind of value something is: string, number, boolean, array, or object." },
      { term: '===', definition: "Strict equality — checks value AND type; the comparison operator to prefer over ==." },
      { term: 'Template literal', definition: "A backtick string that can embed variables with ${...}." },
      { term: 'console.log', definition: "Prints a value to the browser's developer console — the main way to inspect what your code is doing." },
    ],
    commonMistakes: [
      "Using == instead of ===. == can produce surprising results (e.g. '5' == 5 is true); === is predictable.",
      "Trying to reassign a const, which throws an error. Use let if the value needs to change.",
      "Forgetting quotes around strings ('Drink water' vs Drink water — the second is invalid code).",
      "Mixing up = (assignment) and === (comparison) — one sets a value, the other checks one.",
      "Building strings with messy + concatenation instead of a cleaner template literal.",
    ],
    takeaways: [
      "A <script defer> tag connects JavaScript to your HTML.",
      "Use const by default; let only when a value will change.",
      "Know the five core types: string, number, boolean, array, object.",
      "Always compare with === , not ==.",
      "Template literals (`text ${variable}`) build dynamic strings cleanly.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A streak calculator in the console',
    objective:
      "Practise variables, types, and operators by computing and logging a few derived values about a habit streak — no HTML changes needed, just open the console.",
    instructions: [
      "Create calc.js and link it from a blank calc.html with <script src=\"calc.js\" defer></script>.",
      "Declare a const habitName and a let streak.",
      "Compute whether the streak is 'long' (7 or more) with a boolean.",
      "Build a message with a template literal and log it.",
      "Open the page, then your browser's DevTools console (F12) to see the output.",
    ],
    code: [
      {
        language: 'javascript',
        filename: 'calc.js',
        code:
          "const habitName = 'Drink water';\nlet streak = 9;\n\nconst isLongStreak = streak >= 7;\nconst bonusPoints = streak * 10;\n\nconst message = `${habitName}: ${streak}-day streak (long streak: ${isLongStreak}). Bonus: ${bonusPoints} pts.`;\n\nconsole.log(message);",
      },
    ],
    explanation:
      "habitName is a const string (it won't change), streak is a let number (it can go up). isLongStreak is a boolean computed with the >= comparison operator. bonusPoints uses the * operator to derive a new number from streak. The template literal weaves all four values into one readable sentence without messy string-joining, and console.log prints it where you can see it — the exact debugging habit you'll use for the rest of the course.",
    expectedOutput:
      "In the DevTools console: 'Drink water: 9-day streak (long streak: true). Bonus: 90 pts.'",
    learned: [
      "How to declare and use const vs let.",
      "How to compute a boolean with a comparison operator.",
      "How to build a string with a template literal.",
      "How to read output in the browser console.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's first JavaScript file — a real habit data model to replace the hard-coded HTML list.",
    why:
      "Every habit in Momentum has been sitting as plain, unchangeable HTML text. To ever add, check off, or save a habit, that information needs to live in JavaScript as DATA we can change. This lesson creates that data model — the foundation the next five lessons build on.",
    fileLocation: "momentum/app.js (new file) + momentum/index.html (link the script)",
    code: [
      {
        language: 'html',
        filename: 'index.html (just before </body>)',
        code:
          "  <script src=\"app.js\" defer></script>\n</body>",
      },
      {
        language: 'javascript',
        filename: 'app.js',
        code:
          "// Momentum's habit data — the single source of truth.\n// Each habit is an object: a name, whether it's done today, and a streak.\nconst habits = [\n  { id: 1, name: 'Drink water', done: false, streak: 7 },\n  { id: 2, name: 'Read 10 pages', done: false, streak: 3 },\n  { id: 3, name: '30-minute walk', done: false, streak: 12 },\n];\n\n// A couple of computed values, proven with a console log for now —\n// we'll show these on the page for real once DOM manipulation (Lesson 9) lands.\nconst totalHabits = habits.length;\nconst longestStreak = Math.max(...habits.map((h) => h.streak));\n\nconsole.log(`Momentum loaded with ${totalHabits} habits. Longest streak: ${longestStreak} days.`);",
      },
    ],
    placement:
      "1) Create momentum/app.js with the code above. 2) In index.html, add the <script src=\"app.js\" defer></script> line right before the closing </body> tag. 3) Open index.html and check your browser console (F12 → Console tab) for the log message.",
    implementation:
      "habits is a const array of objects — this is Momentum's real data model, replacing the static <li> text from Module 1. Each object has an id (so we can find it later), a name, a done boolean, and a streak number. totalHabits uses .length; longestStreak uses Math.max together with the spread operator (...) to find the biggest streak across all habits — you'll see more array methods like .map() in upcoming lessons. Nothing on the PAGE looks different yet (that's normal — we're building the data layer first); the proof is the console message confirming your script is wired up and reading real data.",
    expectedResult:
      "The page looks unchanged, but opening DevTools shows: 'Momentum loaded with 3 habits. Longest streak: 12 days.' — proof your JavaScript is connected and Momentum's habits now live as real, changeable data.",
    connects:
      "This habits array is the single source of truth for the rest of the app. Lesson 8 writes functions that operate on it (add/remove), Lesson 9 renders it to the actual page, Lesson 10 makes it respond to clicks, and Lesson 11 saves it so it survives a refresh.",
  },

  quiz: [
    { id: 'l7q1', kind: 'concept', prompt: 'Which keyword should you use by default for a variable?', options: ['var', 'let', 'const', 'static'], answerIndex: 2, explanation: "Prefer const by default; switch to let only when the value needs to change." },
    { id: 'l7q2', kind: 'code_reading', prompt: 'What type is habits in const habits = [ {…}, {…} ]?', options: ['object', 'array', 'string', 'boolean'], answerIndex: 1, explanation: "Square brackets create an array — here, an array of objects." },
    { id: 'l7q3', kind: 'debug', prompt: 'This code throws an error. Why?', code: { language: 'javascript', code: "const streak = 5;\nstreak = 6;" }, options: ['5 is not a valid number', 'const cannot be reassigned', 'Missing semicolon', 'streak is undefined'], answerIndex: 1, explanation: "const locks the variable after its first assignment; use let if it needs to change." },
    { id: 'l7q4', kind: 'concept', prompt: 'Why prefer === over ==?', options: ['=== is shorter to type', '=== checks value AND type, avoiding surprising results', '== is deprecated and errors', 'There is no difference'], answerIndex: 1, explanation: "=== is strict and predictable; == can coerce types in confusing ways." },
    { id: 'l7q5', kind: 'output', prompt: 'What does `${habitName}: ${streak} days` output if habitName is "Read" and streak is 3?', options: ['${habitName}: ${streak} days', 'Read: 3 days', 'habitName: streak days', 'An error'], answerIndex: 1, explanation: "A template literal substitutes the variables' values into the string." },
    { id: 'l7q6', kind: 'application', prompt: 'You need a value that starts at 0 and increases each time a habit is checked. Best choice?', options: ['const', 'let', 'A string', 'A boolean'], answerIndex: 1, explanation: "A value that changes over time needs let, not const." },
    { id: 'l7q7', kind: 'code_reading', prompt: 'What is the type of { name: "Drink water", done: false }?', options: ['array', 'string', 'object', 'boolean'], answerIndex: 2, explanation: "Curly braces with key: value pairs make an object." },
    { id: 'l7q8', kind: 'application', prompt: 'Which operator combination gives a boolean answering "is streak at least 7"?', options: ['streak + 7', 'streak >= 7', 'streak = 7', 'streak * 7'], answerIndex: 1, explanation: ">= is a comparison operator that produces true or false." },
    { id: 'l7q9', kind: 'project', prompt: "In Momentum's app.js, why does each habit object include an id?", options: ['It’s required by CSS', 'So we can find/update/remove the exact habit later', 'To make it a string', 'For SEO'], answerIndex: 1, explanation: "An id gives each habit a unique handle, which future lessons use to target one specific habit." },
    { id: 'l7q10', kind: 'debug', prompt: 'A student wrote console.log(Momentum loaded); and got an error. What’s wrong?', options: ['console.log doesn’t exist', 'Missing quotes — it needs to be a string: "Momentum loaded"', 'Too many arguments', 'defer is missing'], answerIndex: 1, explanation: "Without quotes, JavaScript tries to read Momentum and loaded as variable names that don't exist." },
  ],

  homework: {
    task:
      "Add a fourth habit object to the habits array (pick any habit) with its own id, name, done: false, and a streak number. Then compute and log the AVERAGE streak across all habits using the array's .length and a total you calculate.",
    requirements: [
      "The new object needs a unique id (not 1, 2, or 3) and all four fields.",
      "Calculate the total of all streaks (you can add them manually with + for now, or try a loop if you're curious) and divide by habits.length.",
      "Log a sentence with a template literal showing the average, e.g. 'Average streak: 6.5 days.'",
    ],
    expectedOutcome:
      "The console now shows 4 habits loaded and an average-streak message with a sensible number.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 6,
      hint: "Lesson 6 asked you to align your spacing to the 8/16/24/32 scale, add a hover lift to the About card, and take before/after screenshots.",
      steps: [
        "Search style.css for odd spacing values (like 13px, 18px, 27px) and round them to the nearest scale value.",
        "Copy the .habit:hover rule's transform/box-shadow onto a new .about-card:hover rule.",
        "Resize your browser to phone width and confirm nothing overlaps.",
        "Take one screenshot at desktop width and one at ~375px width.",
      ],
      codeGuidance: [
        {
          language: 'css',
          filename: 'style.css',
          code:
            ".about-card {\n  transition: transform 0.15s ease, box-shadow 0.15s ease;\n}\n.about-card:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 20px rgba(8,145,178,0.10);\n}",
        },
      ],
    },
  },
};
