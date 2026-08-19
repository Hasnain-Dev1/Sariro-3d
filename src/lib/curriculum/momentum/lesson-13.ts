import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 13 — Why React? Components & Props
 * Module 3 (React + Next.js) · Lesson 13 of 30
 */
export const lesson13: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 3,
  lessonIndex: 0,
  globalNumber: 13,
  name: 'Why React? Components & props',
  title: 'Rebuilding Momentum in React — Components & Props',
  subtitle: "Start a real Next.js project and rebuild Momentum's UI as reusable components.",

  concept: {
    durationMin: 15,
    summary:
      "Understand why React exists, how it thinks in components, and how props pass data from a parent component to a child — the foundation for rebuilding Momentum properly.",
    sections: [
      {
        heading: 'Why move on from vanilla JavaScript?',
        body:
          "Module 2's app.js works, but notice the pain points: renderHabits() manually creates and clears DOM elements every single time ANYTHING changes, and as an app grows, that hand-written DOM code becomes messy and error-prone fast. React solves this: you describe WHAT the UI should look like for a given piece of data, and React figures out HOW to update the actual page efficiently. You stop manually touching the DOM.",
      },
      {
        heading: 'What is React, and what is Next.js?',
        body:
          "React is a JavaScript library for building UIs out of components — small, reusable pieces of interface. Next.js is a framework BUILT ON React that adds routing, project structure, and tools to ship a real app (we used its App Router basics for the SaaS course; here we start from scratch). You write React components; Next.js organises the project and serves the pages.",
      },
      {
        heading: 'JSX — HTML-like syntax inside JavaScript',
        body:
          "React components are JavaScript functions that RETURN what looks like HTML — this is JSX. It's not actually HTML; it compiles to JavaScript function calls, but you write and read it like markup, which is what makes React approachable. A few JSX rules: use className instead of class, every element must be closed (<img />), and you can drop JavaScript values into markup with curly braces { }.",
        code: {
          language: 'tsx',
          code:
            "function Greeting() {\n  const name = 'Aisha';\n  return <h1 className=\"title\">Hello, {name}!</h1>;\n}",
        },
      },
      {
        heading: 'Components — the building blocks',
        body:
          "A component is just a function that returns JSX, named with a Capital Letter (this matters — lowercase names are treated as plain HTML tags, not your component). You use it in JSX like a custom tag: <Greeting />. Big UIs are built by composing many small components together, exactly like Momentum's header/hero/habit-list/footer become separate, focused components.",
        code: {
          language: 'tsx',
          code:
            "function Header() {\n  return <header><h1>Momentum</h1></header>;\n}\n\nfunction Page() {\n  return (\n    <div>\n      <Header />\n      <p>Welcome!</p>\n    </div>\n  );\n}",
        },
      },
      {
        heading: 'Props — passing data into a component',
        body:
          "A component becomes reusable when it can receive data from whoever uses it — these are props (short for properties). You pass them like HTML attributes (<HabitCard name=\"Drink water\" />) and read them as the function's parameter (an object): function HabitCard({ name }) { ... }. Props flow ONE way: parent to child. This is exactly how one HabitCard component will render every habit in Momentum, each with different data.",
        code: {
          language: 'tsx',
          code:
            "function HabitCard({ name, streak }) {\n  return <li className=\"habit\">{name} · {streak}d</li>;\n}\n\n// used with different data each time:\n<HabitCard name=\"Drink water\" streak={7} />\n<HabitCard name=\"Read\" streak={3} />",
        },
      },
    ],
    keyTerms: [
      { term: 'React', definition: "A JavaScript library for building UIs out of small, reusable components." },
      { term: 'Next.js', definition: "A framework built on React that adds routing, structure, and tooling for real apps." },
      { term: 'JSX', definition: "HTML-like syntax written inside JavaScript that compiles down to real JS; components return it." },
      { term: 'Component', definition: "A function (Capitalized name) that returns JSX, used as a custom tag elsewhere." },
      { term: 'Props', definition: "Data passed from a parent component into a child, like HTML attributes; flows one way." },
    ],
    commonMistakes: [
      "Naming a component lowercase (habitCard) — React treats it as an unknown HTML tag, not your component.",
      "Using class instead of className in JSX — class is a reserved JavaScript word.",
      "Forgetting to destructure props: writing function HabitCard(props) then using name instead of props.name (or destructuring { name }).",
      "Trying to modify a prop inside the child component — props are read-only; the parent owns that data.",
      "Returning multiple sibling elements without wrapping them in one parent (JSX requires a single root element, or a <>...</> fragment).",
    ],
    takeaways: [
      "React lets you describe UI declaratively instead of manually touching the DOM.",
      "Components are functions (Capitalized) that return JSX.",
      "Props pass data from parent to child, one way only.",
      "JSX looks like HTML but is JavaScript — className, self-closing tags, { } for values.",
      "Big UIs are built by composing many small, focused components.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A reusable stat card component',
    objective:
      "Practise components and props by building one small StatCard component and reusing it three times with different data — proving the reusability payoff.",
    instructions: [
      "Create a new Next.js app with create-next-app (TypeScript + Tailwind + App Router).",
      "Inside app/page.tsx, define a StatCard function component that accepts label and value props.",
      "Render three <StatCard /> elements with different props inside the Home component.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'app/page.tsx',
        code:
          "function StatCard({ label, value }: { label: string; value: number }) {\n  return (\n    <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'center' }}>\n      <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>{value}</div>\n      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>\n    </div>\n  );\n}\n\nexport default function Home() {\n  return (\n    <div style={{ display: 'flex', gap: 12, padding: 40 }}>\n      <StatCard label=\"Day streak\" value={7} />\n      <StatCard label=\"Habits\" value={3} />\n      <StatCard label=\"Completed today\" value={2} />\n    </div>\n  );\n}",
      },
    ],
    explanation:
      "StatCard is defined once, as a small component with two typed props: label (a string) and value (a number). Home renders it three times, each with completely different data passed in as JSX attributes. Because StatCard doesn't hard-code any text, the SAME component produces three different-looking cards — this is the core payoff of components + props: write the shape once, reuse it for any data.",
    expectedOutput:
      "Three side-by-side cards: '7 / Day streak', '3 / Habits', '2 / Completed today' — all rendered from one StatCard definition.",
    learned: [
      "How to define a component with typed props.",
      "How to pass different data into the same component.",
      "How JSX embeds JavaScript values with { }.",
      "Why components are the reusability unit in React.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "A fresh Next.js project for Momentum, with the visual shell rebuilt as real React components.",
    why:
      "We're not porting the old HTML file — we're REBUILDING Momentum properly. Starting with the static shell as components (Header, Hero, Footer) establishes the project structure every later lesson (state, events, AI) will build inside.",
    fileLocation: "A new project: momentum-app/ (create with create-next-app) — app/page.tsx, app/layout.tsx, components/",
    code: [
      {
        language: 'bash',
        code:
          "npx create-next-app@latest momentum-app --typescript --tailwind --app --eslint\ncd momentum-app\nnpm run dev",
      },
      {
        language: 'tsx',
        filename: 'components/Header.tsx',
        code:
          "export function Header() {\n  return (\n    <header className=\"flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200\">\n      <h1 className=\"text-xl font-extrabold text-green-600\">Momentum</h1>\n      <nav className=\"flex gap-5 text-slate-600\">\n        <a href=\"#habits\">My Habits</a>\n        <a href=\"#about\">About</a>\n      </nav>\n    </header>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'components/Hero.tsx',
        code:
          "export function Hero() {\n  return (\n    <section id=\"intro\" className=\"py-10\">\n      <h2 className=\"text-3xl font-extrabold mb-2\">Build better habits, one day at a time.</h2>\n      <p className=\"text-slate-500 mb-4\">Track what matters, keep your streak alive, and let your AI coach keep you going.</p>\n      <button className=\"bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg\">Get started</button>\n    </section>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'components/Footer.tsx',
        code:
          "export function Footer() {\n  return (\n    <footer className=\"flex justify-between items-center px-8 py-5 border-t border-slate-200 text-sm text-slate-500\">\n      <p>Made with Momentum · Sariro</p>\n      <nav className=\"flex gap-4\"><a href=\"#\">Privacy</a><a href=\"#\">Contact</a></nav>\n    </footer>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'app/page.tsx',
        code:
          "import { Header } from '@/components/Header';\nimport { Hero } from '@/components/Hero';\nimport { Footer } from '@/components/Footer';\n\nexport default function Home() {\n  return (\n    <main>\n      <Header />\n      <div className=\"max-w-4xl mx-auto px-6\">\n        <Hero />\n        {/* Habit list arrives in Lesson 15 */}\n      </div>\n      <Footer />\n    </main>\n  );\n}",
      },
    ],
    placement:
      "1) Run the create-next-app command in a new folder (separate from the old vanilla-JS momentum/ project — keep that as a reference, but this is a fresh start). 2) Create a components/ folder at the project root with Header.tsx, Hero.tsx, and Footer.tsx. 3) Replace the default app/page.tsx with the version above, importing all three.",
    implementation:
      "Header, Hero, and Footer are each a small, self-contained function component returning JSX styled with Tailwind classes (className, not class). None of them take props yet — they're static, exactly matching Module 1's finished HTML shell, just expressed as composable React pieces instead of one big file. page.tsx (Next.js's home route) imports and arranges all three inside <main>, which is the SAME layering pattern from the SaaS course: small components composed into a page. This is intentionally a fresh, clean rebuild — you'll appreciate the difference once state and rendering arrive in the next lessons.",
    expectedResult:
      "Visiting localhost:3000 shows the same visual shell as the old vanilla-JS Momentum — header, hero with a button, and footer — but now built from three genuinely reusable React components instead of one static HTML file.",
    connects:
      "This is the skeleton the rest of Module 3 fills in: Lesson 14 introduces useState for real interactive data, Lesson 15 renders the habit list as components, and by Lesson 18 this becomes a fully working Next.js version of Momentum — with the SAME behaviour as Module 2, built the professional way.",
  },

  quiz: [
    { id: 'l13q1', kind: 'concept', prompt: 'What problem does React mainly solve compared to Module 2’s vanilla JS approach?', options: ['It makes CSS unnecessary', 'It removes the need to manually create/clear DOM elements on every change', 'It replaces HTML entirely', 'It only works on mobile'], answerIndex: 1, explanation: "React lets you describe the UI declaratively; it handles the manual DOM updates for you." },
    { id: 'l13q2', kind: 'code_reading', prompt: 'Why must this component start with a capital letter — function HabitCard() { ... }?', options: ['Style preference only', 'React treats capitalized names as components; lowercase as plain HTML tags', 'It’s required by Tailwind', 'JSX ignores capitalization'], answerIndex: 1, explanation: "React distinguishes custom components from built-in HTML elements by capitalization." },
    { id: 'l13q3', kind: 'debug', prompt: 'A student wrote <div class="card"> inside a .tsx file and got a warning. What’s wrong?', options: ['div is not allowed in JSX', 'JSX requires className, not class', 'card is not a valid word', 'Nothing is wrong'], answerIndex: 1, explanation: "class is a reserved JS keyword, so JSX uses className instead." },
    { id: 'l13q4', kind: 'application', prompt: 'How do you pass a number prop called streak with value 7 into a component?', options: ['streak="7"', 'streak={7}', 'streak:7', '{streak=7}'], answerIndex: 1, explanation: "Curly braces pass a real JavaScript value (a number); quotes would pass the string \"7\"." },
    { id: 'l13q5', kind: 'concept', prompt: 'Which direction do props flow?', options: ['Child to parent', 'Parent to child, one way', 'Both directions freely', 'Sideways between siblings'], answerIndex: 1, explanation: "Props are read-only data passed down from a parent component to a child." },
    { id: 'l13q6', kind: 'code_reading', prompt: 'In function StatCard({ label, value }) { ... }, what is happening?', options: ['Declaring two new components', 'Destructuring the props object into label and value', 'Creating a CSS class', 'Nothing — it’s invalid syntax'], answerIndex: 1, explanation: "This destructures the incoming props object so label/value can be used directly." },
    { id: 'l13q7', kind: 'application', prompt: 'You want the SAME card shape to display three different pieces of data. Best approach?', options: ['Write three separate components', 'Write one component and pass different props each time', 'Hard-code all three in one JSX block', 'Use CSS only'], answerIndex: 1, explanation: "One reusable component with props avoids duplicating the same markup three times." },
    { id: 'l13q8', kind: 'debug', prompt: 'A component returns two sibling <div>s with no wrapper and JSX throws an error. What’s the fix?', options: ['Delete one div', 'Wrap them in one parent element or a <>...</> fragment', 'Add more divs', 'Use class instead of className'], answerIndex: 1, explanation: "JSX requires a single root element; a fragment <>...</> wraps siblings without adding extra markup." },
    { id: 'l13q9', kind: 'project', prompt: "Why does Momentum's Header component NOT take any props yet in this lesson?", options: ['Components can never take props', "It's currently fully static — nothing about it varies yet", 'Props only work with numbers', "It's a bug to fix later"], answerIndex: 1, explanation: "Header, Hero, and Footer are static shell pieces for now; dynamic data (habits) arrives in the next lessons." },
    { id: 'l13q10', kind: 'concept', prompt: 'What is Next.js, relative to React?', options: ['A replacement for React', 'A framework built on React adding routing, structure, and tooling', 'A CSS framework', 'A database'], answerIndex: 1, explanation: "Next.js builds on React, adding things like file-based routing and project conventions." },
  ],

  homework: {
    task:
      "Turn Hero's button into a small reusable Button component that accepts children (the label text) and an onClick-ready style, then use it in both Hero and Footer (as a 'Contact us' link-style button).",
    requirements: [
      "Create components/Button.tsx accepting a children prop and rendering a styled <button>.",
      "Replace Hero's hard-coded <button> with <Button>Get started</Button>.",
      "Add a second usage somewhere else on the page (e.g. in Footer) with different text.",
      "Both buttons should look consistent (same padding/radius/font-weight) since they share one component.",
    ],
    expectedOutcome:
      "One Button component, used in two different places with different label text, both looking visually consistent.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 12,
      hint: "Lesson 12 asked you to add a live completion summary ('2 of 4 done today') above the habit list in the OLD vanilla-JS Momentum, computed the same derived way as the ring.",
      steps: [
        "In index.html, add <p id=\"summary\"></p> just above your <ul class=\"habit-list\">.",
        "Inside renderHabits(), after computing doneCount and habits.length, select #summary and set its textContent.",
        "Format it as a sentence, e.g. `${doneCount} of ${habits.length} done today`.",
        "Test with 0 habits — it should read '0 of 0 done today' without erroring.",
      ],
      codeGuidance: [
        {
          language: 'javascript',
          filename: 'app.js (inside renderHabits, near the ring update)',
          code:
            "const summaryEl = document.getElementById('summary');\nif (summaryEl) {\n  summaryEl.textContent = `${doneCount} of ${habits.length} done today`;\n}",
        },
      ],
    },
  },
};
