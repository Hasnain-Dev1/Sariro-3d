import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 8 — Functions & Scope
 * Module 2 (JavaScript Essentials) · Lesson 8 of 30
 */
export const lesson08: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 2,
  lessonIndex: 1,
  globalNumber: 8,
  name: 'Functions & scope',
  title: 'Functions & Scope — Teaching Momentum to Do Things',
  subtitle: "Write reusable functions that add and remove habits from Momentum's data.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to package logic into reusable functions, pass them information via parameters, get results back with return, and understand scope — where a variable is visible.",
    sections: [
      {
        heading: 'What is a function?',
        body:
          "A function is a named, reusable block of code. Instead of writing the same logic over and over, you write it once as a function and CALL it whenever you need it. Functions are how programs stay organised as they grow — Momentum will have functions like addHabit, toggleHabit, and renderHabits, each doing one clear job.",
        code: {
          language: 'javascript',
          code:
            "function greet() {\n  console.log('Welcome to Momentum!');\n}\n\ngreet();   // calling it — prints the message\ngreet();   // call it again anytime",
        },
      },
      {
        heading: 'Parameters and arguments',
        body:
          "A function becomes far more useful when it can accept input. Parameters are named placeholders in the function's definition; arguments are the actual values you pass in when calling it. This lets one function work for many different inputs instead of being hard-coded.",
        code: {
          language: 'javascript',
          code:
            "function greetByName(name) {       // 'name' is the parameter\n  console.log(`Welcome, ${name}!`);\n}\n\ngreetByName('Aisha');   // 'Aisha' is the argument -> Welcome, Aisha!\ngreetByName('Sam');     // -> Welcome, Sam!",
        },
      },
      {
        heading: 'return — sending a value back',
        body:
          "Some functions don't just DO something (like logging) — they COMPUTE something and hand it back with return. Once return runs, the function stops and gives that value to whoever called it. You can then store it in a variable.",
        code: {
          language: 'javascript',
          code:
            "function double(n) {\n  return n * 2;\n}\n\nconst result = double(21);   // result is 42 — the function's job is to answer, not print",
        },
      },
      {
        heading: 'Arrow functions',
        body:
          "Arrow functions are a shorter way to write a function, especially handy for small ones. function(x) { return x * 2; } becomes (x) => x * 2 — no function keyword, no braces or return needed for a single expression. You'll see both styles; arrow functions are common for short helpers.",
        code: {
          language: 'javascript',
          code:
            "const double = (n) => n * 2;\nconst greet = (name) => console.log(`Hi ${name}`);\n\ndouble(21);   // 42",
        },
      },
      {
        heading: 'Scope — where a variable can be seen',
        body:
          "Scope is the region of code where a variable exists. A variable declared INSIDE a function only exists inside that function (local scope) — code outside can't see it. A variable declared OUTSIDE any function (like Momentum's habits array) is global — every function can see and use it. This is exactly why we made habits a top-level const: every function that needs habit data can reach it.",
        code: {
          language: 'javascript',
          code:
            "const streak = 7;             // global — visible everywhere below\n\nfunction show() {\n  const bonus = streak * 10;  // bonus is LOCAL to show()\n  console.log(bonus);\n}\nshow();\n// console.log(bonus);        // ERROR — bonus doesn't exist out here",
        },
      },
    ],
    keyTerms: [
      { term: 'Function', definition: "A named, reusable block of code you define once and call whenever needed." },
      { term: 'Parameter', definition: "A named placeholder in a function's definition for a value it will receive." },
      { term: 'Argument', definition: "The actual value passed into a function when it's called." },
      { term: 'return', definition: "Sends a value back out of a function and ends its execution." },
      { term: 'Arrow function', definition: "A shorter function syntax: (params) => expression." },
      { term: 'Scope', definition: "Where a variable is visible — local (inside a function) or global (outside any function)." },
    ],
    commonMistakes: [
      "Defining a function but forgetting to CALL it — nothing happens until you write functionName().",
      "Expecting a function without return to give you a usable value — it returns undefined.",
      "Trying to use a local variable outside the function it was declared in.",
      "Confusing parameter names with argument values — the parameter is the placeholder, the argument is what you actually pass.",
      "Redeclaring a global variable's name inside a function, accidentally shadowing it.",
    ],
    takeaways: [
      "Functions package logic so you write it once and reuse it everywhere.",
      "Parameters let a function accept input; arguments are the values you pass in.",
      "return hands a computed value back to the caller.",
      "Arrow functions are a shorter syntax for the same idea.",
      "Global variables (like habits) are visible to every function; local variables are not.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A tiny shopping list with functions',
    objective:
      "Practise writing functions with parameters and return by building add/remove logic for a simple list — the exact pattern Momentum's habit functions use.",
    instructions: [
      "Create list.js (and a blank list.html linking it).",
      "Declare a global const items array.",
      "Write an addItem(name) function that pushes a new item and logs the updated list.",
      "Write a removeItem(name) function that filters the item out.",
      "Call both functions a few times and check the console.",
    ],
    code: [
      {
        language: 'javascript',
        filename: 'list.js',
        code:
          "const items = ['Notebook', 'Pen'];\n\nfunction addItem(name) {\n  items.push(name);\n  console.log(`Added \"${name}\". List:`, items);\n}\n\nfunction removeItem(name) {\n  const index = items.indexOf(name);\n  if (index !== -1) {\n    items.splice(index, 1);\n  }\n  console.log(`Removed \"${name}\". List:`, items);\n}\n\naddItem('Backpack');\naddItem('Water bottle');\nremoveItem('Pen');",
      },
    ],
    explanation:
      "items is a global array both functions can reach. addItem(name) takes a parameter, uses .push() to add it to the array, then logs the result — a template literal for the message plus the array itself so you can inspect it. removeItem(name) uses .indexOf() to find where the item sits, and if found (index !== -1), .splice(index, 1) removes exactly one item at that position. Notice neither function uses return — they don't need to hand back a value, they just change the shared items array and report what happened.",
    expectedOutput:
      "Console shows three lines: the list after adding 'Backpack', after adding 'Water bottle', and after removing 'Pen' — each showing the current full array.",
    learned: [
      "How to write a function with a parameter.",
      "How .push() and .splice() modify an array.",
      "Why functions that CHANGE shared data don't always need return.",
      "How to trace a program's state through console.log.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's core functions — addHabit, removeHabit, and toggleHabit — the logic that will drive every interaction.",
    why:
      "The habits array from Lesson 7 is just data sitting still. To let a user actually add a new habit, delete one, or check one off, we need FUNCTIONS that change that data in controlled, reusable ways. These three functions are the engine the DOM (Lesson 9) and click handlers (Lesson 10) will plug into.",
    fileLocation: "momentum/app.js (add functions below the habits array)",
    code: [
      {
        language: 'javascript',
        filename: 'app.js (add below the habits array)',
        code:
          "// A counter so every new habit gets a unique id, even after several adds.\nlet nextId = 4;\n\nfunction addHabit(name) {\n  const newHabit = { id: nextId, name, done: false, streak: 0 };\n  habits.push(newHabit);\n  nextId += 1;\n  console.log('Added habit:', newHabit);\n}\n\nfunction removeHabit(id) {\n  const index = habits.findIndex((h) => h.id === id);\n  if (index !== -1) {\n    habits.splice(index, 1);\n    console.log(`Removed habit #${id}`);\n  }\n}\n\nfunction toggleHabit(id) {\n  const habit = habits.find((h) => h.id === id);\n  if (!habit) return;\n  habit.done = !habit.done;\n  habit.streak = habit.done ? habit.streak + 1 : Math.max(0, habit.streak - 1);\n  console.log(`Toggled #${id}:`, habit);\n}\n\n// Quick manual test — try these in the console too!\naddHabit('Meditate');\ntoggleHabit(1);\nremoveHabit(2);",
      },
    ],
    placement:
      "Add this code to app.js, directly below the habits array and the totalHabits/longestStreak lines from Lesson 7. Keep the test calls at the bottom for now (delete them once you're comfortable — Lesson 10 will call these functions from real button clicks instead).",
    implementation:
      "addHabit(name) builds a new habit object using the SAME shape as the seeded ones (id, name, done, streak), using a global nextId counter (a let, since it increases) so ids never collide. removeHabit(id) uses .findIndex() to locate the habit by id, then .splice() to remove it — the same pattern as the mini-project. toggleHabit(id) uses .find() to get the actual habit object, flips its done boolean with !habit.done, and adjusts streak up or down depending on the new state (Math.max(0, ...) stops it going negative). Every function operates on the GLOBAL habits array because of scope — no parameter needs to pass the array itself.",
    expectedResult:
      "Opening the console shows: 'Added habit: {id: 4, name: \"Meditate\", ...}', then 'Toggled #1: {..., done: true, streak: 8}', then 'Removed habit #2'. The habits array now genuinely has 3 items after these test calls, changed entirely through function calls — not by hand-editing the array.",
    connects:
      "These three functions are the complete 'backend' of Momentum's habit logic. Lesson 9 makes the RESULTS of these functions visible on the page (DOM manipulation), and Lesson 10 wires them to real buttons so a user — not your test calls — triggers them.",
  },

  quiz: [
    { id: 'l8q1', kind: 'concept', prompt: 'What is a function?', options: ['A type of variable', 'A named, reusable block of code', 'An HTML tag', 'A CSS property'], answerIndex: 1, explanation: "A function packages logic so you can reuse it by calling its name." },
    { id: 'l8q2', kind: 'code_reading', prompt: 'In function addHabit(name) { … }, what is name?', options: ['An argument', 'A parameter', 'A return value', 'A global variable'], answerIndex: 1, explanation: "name is the placeholder defined in the function signature — a parameter." },
    { id: 'l8q3', kind: 'output', prompt: 'What does this log?', code: { language: 'javascript', code: "function double(n) { return n * 2; }\nconsole.log(double(5));" }, options: ['undefined', '10', '5', 'An error'], answerIndex: 1, explanation: "double(5) returns 5 * 2, which is 10." },
    { id: 'l8q4', kind: 'debug', prompt: 'A function is defined but nothing happens when the page runs. Likely cause?', options: ['It has a return statement', 'The function was never called', 'It uses an arrow function', 'It has a parameter'], answerIndex: 1, explanation: "Defining a function doesn't run it — you must call it: functionName()." },
    { id: 'l8q5', kind: 'concept', prompt: 'What does scope determine?', options: ['How fast code runs', 'Where a variable is visible/usable', 'The colour of text', 'Which file loads first'], answerIndex: 1, explanation: "Scope defines the region of code where a variable can be accessed." },
    { id: 'l8q6', kind: 'code_reading', prompt: 'Why can toggleHabit() read the habits array without receiving it as a parameter?', options: ['It’s a coincidence', 'habits is global, so every function can see it', 'JavaScript passes all arrays automatically', 'It uses return'], answerIndex: 1, explanation: "habits is declared outside any function, making it global and visible everywhere." },
    { id: 'l8q7', kind: 'application', prompt: 'Which arrow function correctly doubles a number?', options: ['const double = (n) => n * 2;', 'const double = (n) -> n * 2;', 'function double = (n) => n * 2', 'arrow double(n) { n * 2 }'], answerIndex: 0, explanation: "Correct arrow syntax: (params) => expression." },
    { id: 'l8q8', kind: 'code_reading', prompt: 'What does habits.findIndex((h) => h.id === id) return if no habit matches?', options: ['null', 'undefined', '-1', 'An error'], answerIndex: 2, explanation: "findIndex returns -1 when no element satisfies the condition." },
    { id: 'l8q9', kind: 'project', prompt: "In Momentum's toggleHabit, why is done flipped with !habit.done instead of setting it to true?", options: ['To always mark it done', 'So calling it again UN-does it (a true toggle)', 'It’s required syntax', 'To avoid using booleans'], answerIndex: 1, explanation: "! inverts the current value, so the same function both checks and unchecks a habit." },
    { id: 'l8q10', kind: 'debug', prompt: 'A student tries console.log(bonus) outside a function where bonus was declared with const inside it. What happens?', options: ['It logs 0', 'ReferenceError — bonus is not defined out there', 'It logs undefined silently', 'It works fine'], answerIndex: 1, explanation: "bonus is local to the function; outside that scope it doesn't exist." },
  ],

  homework: {
    task:
      "Write one more function, getLongestStreakHabit(), that returns the single habit object with the highest streak (not just the number). Log its name using a template literal.",
    requirements: [
      "The function must use return to hand back the habit OBJECT, not print it directly.",
      "Use an array method (e.g. reduce, or a loop) rather than hard-coding which habit is longest.",
      "Call it once and log a sentence like 'Your best streak is 30-minute walk at 12 days.'",
    ],
    expectedOutcome:
      "Calling getLongestStreakHabit() and logging its result correctly names whichever habit currently has the highest streak — and stays correct even after you addHabit/toggleHabit more.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 7,
      hint: "Lesson 7 asked you to add a fourth habit object and log the average streak across all habits.",
      steps: [
        "In app.js, add one more object to the habits array with a unique id (e.g. 4) and its own name/done/streak.",
        "Add up every habit's streak (habits[0].streak + habits[1].streak + ... or loop through them).",
        "Divide the total by habits.length to get the average.",
        "Log it with a template literal, e.g. `Average streak: ${average} days.`",
      ],
      codeGuidance: [
        {
          language: 'javascript',
          filename: 'app.js',
          code:
            "const total = habits.reduce((sum, h) => sum + h.streak, 0);\nconst average = total / habits.length;\nconsole.log(`Average streak: ${average} days.`);",
        },
      ],
    },
  },
};
