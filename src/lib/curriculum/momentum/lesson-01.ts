import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 1 — HTML Structure & Semantic Tags
 * Module 1 (HTML + CSS Foundations) · Lesson 1 of 30
 * Web Builder Pro — Beginner (web-101)
 */
export const lesson01: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 1,
  lessonIndex: 0,
  globalNumber: 1,
  name: 'HTML structure & semantic tags',
  title: 'Your First Web Page — HTML Structure & Semantic Tags',
  subtitle: "Learn how every web page is built, then lay the skeleton of Momentum, your habit companion.",

  /* ─────────────────────────── CONCEPT (15 min) ─────────────────────────── */
  concept: {
    durationMin: 15,
    summary:
      "Understand what HTML is, how a page is structured with tags, and how semantic tags describe the MEANING of content — the foundation every website is built on.",
    sections: [
      {
        heading: 'What is HTML?',
        body:
          "HTML (HyperText Markup Language) is the language that describes the content of a web page. It is NOT a programming language — there are no calculations or logic. Instead, HTML is markup: you wrap pieces of content in labels called tags, and those tags tell the browser what each piece IS — a heading, a paragraph, an image, a button.\n\nEvery website you have ever visited — YouTube, your school portal, Momentum (the app you'll build) — starts as HTML. CSS makes it pretty (Lesson 2), and JavaScript makes it interactive (Module 2). HTML always comes first.",
      },
      {
        heading: 'Tags, elements, and attributes',
        body:
          "A tag looks like <p>. Most tags come in pairs: an opening tag <p> and a closing tag </p> (note the slash). Everything between them is the content. The whole thing — opening tag, content, closing tag — is called an element.\n\nTags can carry extra information called attributes, written as name=\"value\" inside the opening tag. For example, a link uses the href attribute to say where it points: <a href=\"https://sariro.com\">Visit</a>.",
        code: {
          language: 'html',
          code:
            "<p>Hello world</p>\n<!--  ^tag   ^content  ^closing tag  = one element  -->\n\n<a href=\"https://sariro.com\">Visit Sariro</a>\n<!--   ^attribute (name=\"value\")                        -->",
        },
      },
      {
        heading: 'The skeleton every HTML page needs',
        body:
          "Every HTML document has the same basic frame. <!DOCTYPE html> tells the browser this is modern HTML. <html> wraps everything. <head> holds information ABOUT the page (its title, character set) that visitors don't see directly. <body> holds everything visitors DO see.",
        code: {
          language: 'html',
          filename: 'index.html',
          code:
            "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <title>Momentum</title>\n  </head>\n  <body>\n    <h1>Momentum</h1>\n    <p>Build better habits, one day at a time.</p>\n  </body>\n</html>",
        },
      },
      {
        heading: 'Semantic tags — describing MEANING, not looks',
        body:
          "You could build an entire page out of <div> (a generic box). But better HTML uses semantic tags — tags whose NAME describes what the content is. <header> for the top, <nav> for navigation, <main> for the primary content, <section> for a grouped chunk, <footer> for the bottom.\n\nWhy bother? Semantic tags make your page easier to read for other developers, better for SEO (Google understands it), and accessible to screen readers used by people with visual impairments. Momentum will use semantic tags from day one.",
        code: {
          language: 'html',
          code:
            "<header>Logo + menu</header>\n<main>\n  <section>The habit list</section>\n</main>\n<footer>Made with Sariro</footer>",
        },
      },
      {
        heading: 'Common content tags you will use constantly',
        body:
          "Headings <h1> to <h6> (h1 is the biggest / most important, one per page). Paragraphs <p>. Links <a>. Images <img src=\"...\" alt=\"...\" /> (a self-closing tag — no separate closing tag; alt describes the image for screen readers). Lists: <ul> (unordered/bullets) or <ol> (ordered/numbers) containing <li> items. Buttons <button>.",
      },
    ],
    keyTerms: [
      { term: 'HTML', definition: "HyperText Markup Language — the markup that describes a web page's content and structure." },
      { term: 'Tag', definition: "A label in angle brackets, like <p>. Usually paired: opening <p> and closing </p>." },
      { term: 'Element', definition: "An opening tag, its content, and its closing tag together." },
      { term: 'Attribute', definition: "Extra info on a tag, written name=\"value\", e.g. href=\"...\" or alt=\"...\"." },
      { term: 'Semantic tag', definition: "A tag whose name describes the meaning of its content (header, nav, main, section, footer)." },
      { term: 'Self-closing tag', definition: "A tag with no separate closing tag, like <img /> or <br />." },
    ],
    commonMistakes: [
      "Forgetting the closing tag (</p>). Unclosed tags make the browser guess where content ends, breaking layout.",
      "Using more than one <h1> per page — there should be exactly one main heading.",
      "Leaving off the alt attribute on <img>. It's required for accessibility and shows if the image fails to load.",
      "Wrapping everything in <div> when a semantic tag (header, main, footer) would describe it better.",
      "Putting visible content in <head>. Only the browser-facing info (title, meta) goes there; everything seen goes in <body>.",
    ],
    takeaways: [
      "HTML describes content with tags; it always comes before CSS and JavaScript.",
      "Elements = opening tag + content + closing tag; attributes add info inside the opening tag.",
      "Every page needs the DOCTYPE / html / head / body skeleton.",
      "Prefer semantic tags (header, nav, main, section, footer) over plain <div> — better SEO and accessibility.",
      "Exactly one <h1>, and always give <img> an alt.",
    ],
  },

  /* ─────────────────────────── MINI PROJECT (15 min) ─────────────────────────── */
  miniProject: {
    durationMin: 15,
    title: 'A semantic "About Me" card',
    objective:
      "Build a small, correctly-structured HTML page about yourself using only semantic tags — no styling yet. This cements page structure before we apply it to Momentum.",
    instructions: [
      "Create a file called about.html.",
      "Add the full HTML skeleton (DOCTYPE, html, head with a title, body).",
      "Inside <body>, use a <header> with your name in an <h1>.",
      "Add a <main> with a <section> containing a short <p> about you and a <ul> of three hobbies.",
      "Add a <footer> with a link to something you like using <a href>.",
      "Open the file in your browser (double-click it) to see the result.",
    ],
    code: [
      {
        language: 'html',
        filename: 'about.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <title>About Me</title>\n  </head>\n  <body>\n    <header>\n      <h1>Aisha Khan</h1>\n    </header>\n\n    <main>\n      <section>\n        <p>I'm a student learning to build websites with Sariro.</p>\n        <ul>\n          <li>Sketching</li>\n          <li>Football</li>\n          <li>Coding</li>\n        </ul>\n      </section>\n    </main>\n\n    <footer>\n      <a href=\"https://sariro.com\">My favourite site</a>\n    </footer>\n  </body>\n</html>",
      },
    ],
    explanation:
      "The DOCTYPE + html/head/body skeleton is the frame the browser expects. <header> groups the top of the page (your name as the single <h1>). <main> marks the primary content, and inside it a <section> groups the intro paragraph and the hobbies list. <ul> creates a bulleted list; each <li> is one bullet. <footer> marks the bottom, and the <a> element with its href attribute becomes a clickable link. No CSS yet — the browser applies plain default styles, which is exactly what we want to see for now.",
    expectedOutput:
      "A plain page showing your name as a large heading, a sentence about you, three bulleted hobbies, and a blue underlined link at the bottom. Unstyled, but perfectly structured.",
    learned: [
      "How to write a complete HTML document from scratch.",
      "How to group content with header / main / section / footer.",
      "How to make a bulleted list and a link.",
      "That structure comes first — styling comes in Lesson 2.",
    ],
  },

  /* ─────────────────────────── FINAL PROJECT (30 min) ─────────────────────────── */
  finalProject: {
    durationMin: 30,
    feature: "Momentum's landing page skeleton — the semantic HTML structure the whole app will grow from.",
    why:
      "Before we can style Momentum or make it interactive, it needs a solid, meaningful HTML structure. Getting the semantic skeleton right now means every later lesson — CSS in Module 1, JavaScript in Module 2, the React rebuild in Module 3 — has a clean foundation to build on instead of a pile of <div>s.",
    fileLocation: "index.html (the root of your new momentum/ project folder)",
    code: [
      {
        language: 'html',
        filename: 'index.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Momentum — Build better habits</title>\n  </head>\n  <body>\n    <!-- Top bar -->\n    <header>\n      <h1>Momentum</h1>\n      <nav>\n        <a href=\"#habits\">My Habits</a>\n        <a href=\"#about\">About</a>\n      </nav>\n    </header>\n\n    <!-- Primary content -->\n    <main>\n      <section id=\"intro\">\n        <h2>Build better habits, one day at a time.</h2>\n        <p>Track what matters, keep your streak alive, and let your AI coach keep you going.</p>\n        <button>Get started</button>\n      </section>\n\n      <section id=\"habits\">\n        <h2>Today's habits</h2>\n        <ul>\n          <li>Drink water</li>\n          <li>Read 10 pages</li>\n          <li>30-minute walk</li>\n        </ul>\n      </section>\n    </main>\n\n    <!-- Bottom -->\n    <footer>\n      <p>Made with Momentum · Sariro</p>\n    </footer>\n  </body>\n</html>",
      },
    ],
    placement:
      "1) Create a new folder called momentum. 2) Inside it, create a file named exactly index.html (this is the standard name for a site's home page). 3) Paste the code above into it. 4) Open index.html in your browser by double-clicking it. Keep this file open in your editor — every Module 1 lesson adds to it.",
    implementation:
      "Notice the structure mirrors the mini-project but is shaped for a real app. The <header> now holds both the Momentum title and a <nav> with in-page links (href=\"#habits\" jumps to the element with id=\"habits\"). <main> contains two <section>s: an intro (the hero) and the habits list. We gave each section an id so navigation and, later, JavaScript and CSS can target them. The habit list is a <ul> of <li>s for now — in Module 2 JavaScript will generate these from real data, but the semantic shape stays the same. Added the <meta viewport> tag so the page behaves on phones (we use it properly in Lesson 4).",
    expectedResult:
      "Opening index.html shows the Momentum name and nav at the top, a hero with a headline, subtext and a 'Get started' button, a 'Today's habits' list of three items, and a footer. It's unstyled — plain black text on white — but it's a correctly-structured, real home page.",
    connects:
      "This skeleton is the canvas for all of Module 1: Lesson 2 styles it with CSS, Lesson 3 arranges the habits into a card grid with Flexbox, and Lesson 4 makes it responsive. In Module 2, JavaScript replaces the hard-coded <li> habits with real, saveable ones — but this semantic structure carries all the way through.",
  },

  /* ─────────────────────────── QUIZ (10 Q) ─────────────────────────── */
  quiz: [
    {
      id: 'l1q1', kind: 'concept',
      prompt: 'What is HTML mainly responsible for on a web page?',
      options: [
        'Making the page interactive with logic',
        'Describing the content and structure of the page',
        'Storing user data in a database',
        'Styling colors and fonts',
      ],
      answerIndex: 1,
      explanation: "HTML is markup that describes content and structure. CSS handles styling; JavaScript handles interactivity.",
    },
    {
      id: 'l1q2', kind: 'code_reading',
      prompt: 'In <a href="https://sariro.com">Visit</a>, what is href?',
      options: ['A tag', 'The element', 'An attribute', 'The closing tag'],
      answerIndex: 2,
      explanation: "href is an attribute (name=\"value\") on the <a> tag that says where the link points.",
    },
    {
      id: 'l1q3', kind: 'concept',
      prompt: 'Which section of the document holds content that visitors SEE?',
      options: ['<head>', '<title>', '<body>', '<meta>'],
      answerIndex: 2,
      explanation: "Everything visible lives in <body>. <head> holds behind-the-scenes info like the title and character set.",
    },
    {
      id: 'l1q4', kind: 'application',
      prompt: 'You want to mark the main navigation menu of a site. Best tag?',
      options: ['<div>', '<nav>', '<section>', '<p>'],
      answerIndex: 1,
      explanation: "<nav> is the semantic tag for navigation. It's clearer and more accessible than a generic <div>.",
    },
    {
      id: 'l1q5', kind: 'debug',
      prompt: 'A student writes <p>Hello. Their next paragraph merges into this one. What did they forget?',
      code: { language: 'html', code: "<p>Hello\n<p>World</p>" },
      options: [
        'The DOCTYPE',
        'The closing tag </p> on the first paragraph',
        'An href attribute',
        'The <body> tag',
      ],
      answerIndex: 1,
      explanation: "The first <p> was never closed with </p>, so the browser doesn't know where it ends.",
    },
    {
      id: 'l1q6', kind: 'output',
      prompt: 'What does <ul><li>A</li><li>B</li></ul> display?',
      options: [
        'A numbered list: 1. A  2. B',
        'A bulleted list: • A  • B',
        'The text "AB" with no list',
        'A link to A and B',
      ],
      answerIndex: 1,
      explanation: "<ul> is an unordered list, so items render with bullets. <ol> would make them numbered.",
    },
    {
      id: 'l1q7', kind: 'concept',
      prompt: 'How many <h1> elements should a well-structured page have?',
      options: ['As many as you like', 'Exactly one', 'At least three', 'Zero — h1 is deprecated'],
      answerIndex: 1,
      explanation: "One <h1> represents the single main heading of the page; extra headings use <h2>–<h6>.",
    },
    {
      id: 'l1q8', kind: 'code_reading',
      prompt: 'Why does <img> include an alt attribute here? <img src="cup.png" alt="A glass of water" />',
      options: [
        'To set the image width',
        'To describe the image for screen readers and when it fails to load',
        'To link the image somewhere',
        'It is optional decoration and does nothing',
      ],
      answerIndex: 1,
      explanation: "alt gives a text description used by screen readers and shown if the image can't load — it's an accessibility must.",
    },
    {
      id: 'l1q9', kind: 'project',
      prompt: "In Momentum's index.html, why did we give the habits section id=\"habits\"?",
      options: [
        'ids make text bigger',
        'So the nav link href="#habits" can jump to it, and CSS/JS can target it later',
        'It is required on every section',
        'To store the habit data',
      ],
      answerIndex: 1,
      explanation: "An id is a unique handle: it lets in-page links jump to the element and lets CSS/JavaScript select it later.",
    },
    {
      id: 'l1q10', kind: 'application',
      prompt: 'Which grouping best matches Momentum’s top area with the logo and menu?',
      options: ['<footer>', '<main>', '<header>', '<section id="intro">'],
      answerIndex: 2,
      explanation: "<header> semantically marks the top area of the page — the logo and navigation belong there.",
    },
  ],

  /* ─────────────────────────── HOMEWORK ─────────────────────────── */
  homework: {
    task:
      "Add a third <section> to Momentum's index.html with id=\"about\" (the nav already links to it). Inside, add an <h2> like 'Why Momentum?' and a short <p> explaining what the app helps people do. Also add one more habit to the habits list.",
    requirements: [
      "The new <section> must have id=\"about\" so the existing nav link works.",
      "It must contain exactly one <h2> and at least one <p>.",
      "Add a 4th <li> to the habits <ul>.",
      "The page must still open cleanly in the browser with all tags properly closed.",
    ],
    expectedOutcome:
      "Clicking 'About' in the nav jumps down to your new About section, and the habits list now shows four items. Everything is still semantic and unstyled.",
    extends: 'final',
    // Lesson 1 has no previous lesson, so no previousHomeworkHint here.
  },
};
