import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 3 — Flexbox Layouts
 * Module 1 (HTML + CSS Foundations) · Lesson 3 of 30
 */
export const lesson03: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 1,
  lessonIndex: 2,
  globalNumber: 3,
  name: 'Flexbox layouts',
  title: 'Arranging Things with Flexbox',
  subtitle: "Turn Momentum's stacked cards into a real dashboard layout — rows, spacing, and alignment.",

  concept: {
    durationMin: 15,
    summary:
      "Learn Flexbox, the modern way to arrange elements in rows or columns with easy spacing and alignment — the tool behind almost every layout you see.",
    sections: [
      {
        heading: 'The problem Flexbox solves',
        body:
          "By default, block elements (like <div> and <section>) stack vertically, one under another. But real layouts need things side by side: a logo on the left and a menu on the right, or a grid of cards. Flexbox is the CSS feature that lays children out in a row (or column) and gives you simple control over spacing and alignment.",
      },
      {
        heading: 'Turning on Flexbox',
        body:
          "You make an element a flex container by setting display: flex on it. Its DIRECT children then become flex items and line up in a row automatically. That one line already puts children side by side.",
        code: {
          language: 'css',
          code:
            ".row {\n  display: flex;   /* children now sit in a row */\n}",
        },
      },
      {
        heading: 'The main axis: justify-content',
        body:
          "justify-content controls how items are spread along the row (the main axis). Common values:\n\n• flex-start (default) — packed to the left.\n• center — centred.\n• space-between — first item left, last item right, equal gaps between.\n• space-around / space-evenly — even spacing including the ends.\n\nspace-between is how you get 'logo on the left, menu on the right' in one line.",
        code: {
          language: 'css',
          code:
            "header {\n  display: flex;\n  justify-content: space-between;  /* logo left, nav right */\n  align-items: center;             /* vertically centred */\n}",
        },
      },
      {
        heading: 'The cross axis: align-items',
        body:
          "align-items controls the OTHER direction (the cross axis — vertical when your items are in a row). center vertically centres items — perfect for lining up a logo and menu of different heights. Other values: flex-start (top), flex-end (bottom), stretch (fill the height).",
      },
      {
        heading: 'gap and flex-wrap',
        body:
          "gap adds even spacing BETWEEN flex items without fiddly margins — gap: 16px puts 16px between every card. flex-wrap: wrap lets items drop onto a new line when they run out of room, which is exactly how a responsive grid of cards behaves. Together, display: flex + flex-wrap + gap is the simplest card grid you can write.",
        code: {
          language: 'css',
          code:
            ".cards {\n  display: flex;\n  flex-wrap: wrap;   /* items flow to the next line when full */\n  gap: 16px;         /* even spacing between cards */\n}",
        },
      },
    ],
    keyTerms: [
      { term: 'Flexbox', definition: "A CSS layout system that arranges an element's children in a row or column with easy alignment and spacing." },
      { term: 'Flex container', definition: "The element with display: flex; its direct children become flex items." },
      { term: 'Main axis', definition: "The direction items flow (a row by default); controlled by justify-content." },
      { term: 'Cross axis', definition: "The perpendicular direction; controlled by align-items." },
      { term: 'justify-content', definition: "Spreads items along the row (center, space-between, etc.)." },
      { term: 'gap', definition: "Even spacing between flex items, no margins needed." },
      { term: 'flex-wrap', definition: "Allows items to wrap onto new lines instead of overflowing." },
    ],
    commonMistakes: [
      "Putting display: flex on the items instead of the container. Flex goes on the PARENT.",
      "Mixing up justify-content (main axis) and align-items (cross axis).",
      "Using margins for spacing between items when gap is cleaner and doesn't add edge margins.",
      "Expecting items to wrap without flex-wrap: wrap — by default they squish onto one line.",
      "Forgetting align-items: center, so a logo and taller menu look misaligned.",
    ],
    takeaways: [
      "display: flex on a container puts its children in a row.",
      "justify-content spreads items along the row (space-between = ends apart).",
      "align-items aligns on the cross axis (center = vertically centred).",
      "gap spaces items evenly; flex-wrap lets them flow to new lines.",
      "Flex goes on the parent, not the children.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A flex navigation bar',
    objective:
      "Build a classic top bar with a brand on the left and links on the right using a single flex container — the exact layout Momentum's header needs.",
    instructions: [
      "Create nav.html with a <header> containing a <strong> brand and a <nav> with three <a> links.",
      "Create nav.css and link it.",
      "Make the header a flex container with space-between and centre alignment.",
      "Make the nav itself a flex row with a gap between links.",
    ],
    code: [
      {
        language: 'html',
        filename: 'nav.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /><link rel=\"stylesheet\" href=\"nav.css\" /></head>\n  <body>\n    <header class=\"bar\">\n      <strong class=\"brand\">Momentum</strong>\n      <nav class=\"links\">\n        <a href=\"#\">Habits</a>\n        <a href=\"#\">About</a>\n        <a href=\"#\">Sign in</a>\n      </nav>\n    </header>\n  </body>\n</html>",
      },
      {
        language: 'css',
        filename: 'nav.css',
        code:
          "* { box-sizing: border-box; margin: 0; }\nbody { font-family: sans-serif; }\n\n.bar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 24px;\n  background: #fff;\n  border-bottom: 1px solid #e2e8f0;\n}\n.brand { color: #0891b2; font-size: 20px; }\n.links { display: flex; gap: 20px; }\n.links a { color: #475569; text-decoration: none; }",
      },
    ],
    explanation:
      ".bar is the flex container: justify-content: space-between pushes the brand to the far left and the nav to the far right, while align-items: center lines them up vertically even though they're different sizes. The padding gives the bar height and breathing room. Then .links is ALSO a flex container (flex can nest): its three links sit in a row with a clean 20px gap between them — no margins needed. This 'space-between + centered' bar is one of the most reused layouts on the web.",
    expectedOutput:
      "A white top bar: 'Momentum' in cyan on the left, three grey links evenly spaced on the right, everything vertically centred.",
    learned: [
      "How space-between pins items to opposite ends.",
      "How align-items: center vertically aligns a row.",
      "How gap spaces a row of links.",
      "That flex containers can nest inside each other.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's real header layout + a wrapping grid of habit cards.",
    why:
      "Momentum's header currently stacks the logo above the nav, and the habit cards are full-width rows. Flexbox fixes both: a professional space-between header, and habits arranged as a neat, wrapping card grid — the dashboard feel.",
    fileLocation: "momentum/style.css (update header + habit-list rules)",
    code: [
      {
        language: 'css',
        filename: 'style.css (replace the header and habit-list rules)',
        code:
          "/* Header as a flex bar */\nheader {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 32px;\n  background: #fff;\n  border-bottom: 1px solid #e2e8f0;\n}\nnav { display: flex; gap: 20px; }\nnav a { margin-right: 0; color: #475569; text-decoration: none; }\n\n/* Habit cards in a wrapping grid */\n.habit-list {\n  list-style: none;\n  margin-top: 24px;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 16px;\n}\n.habit {\n  flex: 1 1 200px;          /* grow, shrink, ~200px base width */\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 16px;\n  font-weight: 600;\n}",
      },
    ],
    placement:
      "In style.css, replace your existing header rule and .habit-list / .habit rules with the versions above. (The nav a margin-right from Lesson 2 is no longer needed — gap handles spacing now.) Refresh the browser.",
    implementation:
      "The header becomes a flex bar: the logo sits left, the nav right, both vertically centred — the layout from the mini-project applied to Momentum. For the habits, .habit-list is now a flex container with flex-wrap and a gap, so cards sit side by side and wrap to the next line when the row is full. The magic on each card is flex: 1 1 200px — shorthand for 'may grow, may shrink, start around 200px wide.' That makes cards share the row evenly and resize gracefully as the window changes, which sets up the responsive work in Lesson 4.",
    expectedResult:
      "Momentum's header now shows the cyan logo on the left and the nav links on the right. The habits appear as a row of equal-width cards that wrap to a second line when the window narrows.",
    connects:
      "flex: 1 1 200px already makes the cards flexible; in Lesson 4 we add media queries to fine-tune how many fit per row on phones, and in Lesson 5 we lay out icon + text INSIDE each card with another small flex row.",
  },

  quiz: [
    { id: 'l3q1', kind: 'concept', prompt: 'Where do you put display: flex?', options: ['On each child item', 'On the parent container', 'On the <body> only', 'In the HTML, not CSS'], answerIndex: 1, explanation: "display: flex goes on the container; its direct children become flex items." },
    { id: 'l3q2', kind: 'application', prompt: 'You want a logo on the far left and a menu on the far right in one row. Which property?', options: ['align-items: center', 'justify-content: space-between', 'flex-wrap: wrap', 'gap: 20px'], answerIndex: 1, explanation: "space-between pushes the first and last items to opposite ends." },
    { id: 'l3q3', kind: 'concept', prompt: 'align-items controls alignment on which axis?', options: ['The main axis (row direction)', 'The cross axis (perpendicular)', 'Both axes', 'Neither'], answerIndex: 1, explanation: "align-items works on the cross axis; justify-content works on the main axis." },
    { id: 'l3q4', kind: 'code_reading', prompt: 'What does gap: 16px do in a flex container?', options: ['Adds 16px padding inside each item', 'Adds 16px space between items', 'Sets item width to 16px', 'Adds a 16px border'], answerIndex: 1, explanation: "gap adds even spacing between flex items without needing margins." },
    { id: 'l3q5', kind: 'application', prompt: 'Cards overflow the row instead of moving to a new line. What’s missing?', options: ['display: flex', 'flex-wrap: wrap', 'justify-content: center', 'gap'], answerIndex: 1, explanation: "flex-wrap: wrap lets items flow onto new lines when the row is full." },
    { id: 'l3q6', kind: 'output', prompt: 'A row has 3 items and justify-content: center. Where do they sit?', options: ['Spread to both ends', 'Grouped in the middle', 'Stacked vertically', 'Pinned to the right'], answerIndex: 1, explanation: "center groups the items together in the middle of the row." },
    { id: 'l3q7', kind: 'debug', prompt: 'A student set display: flex on the <li> items to make cards sit in a row, but nothing changed. Why?', options: ['Flex must be on the parent <ul>, not the <li> children', 'li cannot be flex', 'They need flex: 1', 'They forgot a gap'], answerIndex: 0, explanation: "The flex container is the parent (<ul>); items line up because the parent is flex." },
    { id: 'l3q8', kind: 'code_reading', prompt: 'What does flex: 1 1 200px roughly mean?', options: ['Fixed 200px, never changes', 'May grow, may shrink, base width ~200px', 'Exactly 1px wide', '200 items per row'], answerIndex: 1, explanation: "It's shorthand for grow, shrink, and a flex-basis (starting width) of 200px." },
    { id: 'l3q9', kind: 'concept', prompt: 'Which combination makes a simple responsive card grid?', options: ['display: block + margin', 'display: flex + flex-wrap + gap', 'position: absolute', 'float: left only'], answerIndex: 1, explanation: "Flex with wrap and a gap flows cards into rows that reflow as space changes." },
    { id: 'l3q10', kind: 'project', prompt: "In Momentum's header, why use justify-content: space-between?", options: ['To centre the logo', 'To pin the logo left and the nav right in one line', 'To wrap the nav', 'To add padding'], answerIndex: 1, explanation: "space-between places the logo and nav at opposite ends of the header bar." },
  ],

  homework: {
    task:
      "Lay out the footer with Flexbox: put the 'Made with Momentum · Sariro' text on the left and add two small links ('Privacy', 'Contact') on the right, using space-between — matching the header pattern.",
    requirements: [
      "Add a <nav> with two links inside the <footer>.",
      "Make the footer a flex container with justify-content: space-between and align-items: center.",
      "Use gap for the two links, not margins.",
      "It must still look tidy when the window is narrow.",
    ],
    expectedOutcome:
      "The footer mirrors the header: text on the left, two links on the right, vertically centred.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 2,
      hint: "Lesson 2 asked you to style the About section as a card and add a hover colour to the button. The card style is the same recipe as .habit; hover uses the :hover pseudo-class.",
      steps: [
        "Add class=\"about-card\" to your <section id=\"about\">.",
        "Create a .about-card rule with white background, padding: 20px, a light border, and border-radius: 12px.",
        "Add a button:hover rule that darkens the background.",
        "Refresh and hover the 'Get started' button to see it change.",
      ],
      codeGuidance: [
        {
          language: 'css',
          filename: 'style.css',
          code:
            ".about-card {\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 20px;\n  margin-top: 24px;\n}\n\nbutton:hover {\n  background: #0e7490;   /* darker cyan on hover */\n}",
        },
      ],
    },
  },
};
