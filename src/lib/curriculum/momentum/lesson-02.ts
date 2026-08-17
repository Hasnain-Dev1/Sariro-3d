import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 2 — CSS Selectors & the Box Model
 * Module 1 (HTML + CSS Foundations) · Lesson 2 of 30
 */
export const lesson02: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 1,
  lessonIndex: 1,
  globalNumber: 2,
  name: 'CSS selectors & the box model',
  title: 'Styling with CSS — Selectors & the Box Model',
  subtitle: "Give Momentum its first coat of paint: colours, spacing, and real habit cards.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how CSS targets HTML with selectors and how every element is a box made of content, padding, border, and margin — the two ideas behind all styling.",
    sections: [
      {
        heading: 'What is CSS and how do we add it?',
        body:
          "CSS (Cascading Style Sheets) controls how HTML looks — colours, fonts, spacing, layout. The best way to add it is an external stylesheet: a separate .css file linked from the HTML <head>. This keeps content (HTML) and style (CSS) apart, so one stylesheet can style your whole site.\n\nYou link it with a <link> tag in the <head>: <link rel=\"stylesheet\" href=\"style.css\" />.",
        code: {
          language: 'css',
          filename: 'style.css',
          code:
            "/* A CSS rule has a selector and a block of declarations */\nh1 {\n  color: #0891b2;   /* property: value; */\n  font-size: 32px;\n}",
        },
      },
      {
        heading: 'Selectors — choosing what to style',
        body:
          "A selector picks which elements a rule applies to. The three you'll use most:\n\n• Element selector: h1 { } styles every <h1>.\n• Class selector: .card { } styles every element with class=\"card\". Classes are reusable — put the same class on many elements.\n• ID selector: #intro { } styles the one element with id=\"intro\". IDs are unique — one per page.\n\nUse classes for styling (reusable) and IDs mostly for links/JavaScript. You add a class in HTML with class=\"card\".",
        code: {
          language: 'css',
          code:
            "p { color: #475569; }        /* every paragraph */\n.card { background: #fff; }   /* every class=\"card\" */\n#intro { padding: 40px; }     /* the one id=\"intro\" */",
        },
      },
      {
        heading: 'The box model — the key to spacing',
        body:
          "Every element on a page is a rectangular box with four layers, from inside out:\n\n1. Content — the text or image itself.\n2. Padding — space INSIDE the box, between content and border.\n3. Border — a line around the padding.\n4. Margin — space OUTSIDE the box, pushing other elements away.\n\nGetting comfortable with padding (inner space) vs margin (outer space) is 80% of CSS layout. Padding makes a button feel roomy; margin creates gaps between cards.",
        code: {
          language: 'css',
          code:
            ".card {\n  padding: 16px;              /* inner space */\n  border: 1px solid #e2e8f0;  /* the line */\n  margin: 12px;               /* outer gap */\n}",
        },
      },
      {
        heading: 'box-sizing: border-box (the fix everyone wants)',
        body:
          "By default, when you set width: 200px and add padding, the box gets WIDER than 200px (padding is added on top). This is confusing. The fix is box-sizing: border-box, which makes width include the padding and border — so 200px means 200px. Setting it on everything at the start of your stylesheet is standard practice.",
        code: {
          language: 'css',
          code:
            "* {\n  box-sizing: border-box;  /* width now includes padding + border */\n  margin: 0;               /* reset default browser spacing */\n}",
        },
      },
      {
        heading: 'Useful properties to know now',
        body:
          "color (text colour), background (fill), font-size, font-weight, padding, margin, border, border-radius (rounded corners), and text-align. Colours can be names (red), hex (#0891b2), or rgb(). Momentum's brand colour is cyan #0891b2 — you'll see it throughout.",
      },
    ],
    keyTerms: [
      { term: 'CSS', definition: "Cascading Style Sheets — the language that styles HTML (colours, spacing, layout)." },
      { term: 'Selector', definition: "The part of a CSS rule that chooses which elements to style (element, .class, or #id)." },
      { term: 'Class', definition: "A reusable label you add with class=\"...\"; styled with a dot, e.g. .card." },
      { term: 'Box model', definition: "Every element is a box of content → padding → border → margin." },
      { term: 'Padding', definition: "Space inside the box, between the content and the border." },
      { term: 'Margin', definition: "Space outside the box, pushing other elements away." },
      { term: 'border-radius', definition: "Rounds the corners of a box; larger values = rounder." },
    ],
    commonMistakes: [
      "Confusing padding and margin. Padding = inside (roomier content); margin = outside (gaps between elements).",
      "Styling with an ID selector for something reusable. Use a class so you can apply it to many elements.",
      "Forgetting to link the stylesheet — the CSS file exists but <link> is missing, so nothing changes.",
      "Not setting box-sizing: border-box, then being surprised widths overflow when padding is added.",
      "Writing a class in CSS as card instead of .card (the dot is required).",
    ],
    takeaways: [
      "Link one external style.css from the <head> and style your whole site from it.",
      "Element selectors style tags; .class is reusable; #id is unique.",
      "Every element is a box: content → padding → border → margin.",
      "Padding is inner space, margin is outer space.",
      "Start every stylesheet with * { box-sizing: border-box; } so widths behave.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Style a single quote card',
    objective:
      "Practise selectors and the box model by turning a plain block of text into a clean, padded, rounded card — the exact pattern Momentum's habit cards use.",
    instructions: [
      "Create quote.html with a div class=\"card\" containing a <p> quote and a <span class=\"author\">.",
      "Create quote.css and link it in the head.",
      "Reset box-sizing and margins with the * rule.",
      "Style .card with white background, padding, a light border, rounded corners, and a max-width.",
      "Style .author smaller and grey. Open it in the browser.",
    ],
    code: [
      {
        language: 'html',
        filename: 'quote.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"stylesheet\" href=\"quote.css\" />\n  </head>\n  <body>\n    <div class=\"card\">\n      <p>Small habits, repeated, become who you are.</p>\n      <span class=\"author\">— Momentum</span>\n    </div>\n  </body>\n</html>",
      },
      {
        language: 'css',
        filename: 'quote.css',
        code:
          "* { box-sizing: border-box; margin: 0; }\n\nbody {\n  background: #f8fafc;\n  padding: 40px;\n  font-family: sans-serif;\n}\n\n.card {\n  max-width: 360px;\n  background: #ffffff;\n  padding: 20px;\n  border: 1px solid #e2e8f0;\n  border-radius: 14px;\n}\n\n.author {\n  display: block;\n  margin-top: 10px;\n  font-size: 13px;\n  color: #64748b;\n}",
      },
    ],
    explanation:
      "The * rule resets box-sizing and default margins so spacing is predictable. body gets a light grey page background and padding so the card isn't glued to the edge. .card is the reusable pattern: white fill, 20px of inner padding for breathing room, a 1px light border, and 14px rounded corners. max-width keeps it from stretching too wide. .author uses display: block so it sits on its own line, with a smaller grey font to look secondary. Every value here is box-model thinking: padding for inside, margin-top for the gap above the author.",
    expectedOutput:
      "A single white, rounded card on a light-grey page containing the quote and, beneath it, a smaller grey author line. It looks like a real UI card.",
    learned: [
      "How to link and write an external stylesheet.",
      "How class selectors apply reusable styles.",
      "How padding, border, and border-radius shape a card.",
      "Why box-sizing: border-box makes widths predictable.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's first styling — a cyan-branded hero and the habit list turned into real cards.",
    why:
      "Right now Momentum is unstyled black text. Adding a stylesheet gives it an identity (the cyan brand, a clean page, card-shaped habits) and sets up the card pattern that Flexbox will arrange into a grid in Lesson 3.",
    fileLocation: "momentum/style.css (new) + momentum/index.html (add the link + classes)",
    code: [
      {
        language: 'html',
        filename: 'index.html (head + habit list changes)',
        code:
          "<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <link rel=\"stylesheet\" href=\"style.css\" />\n  <title>Momentum — Build better habits</title>\n</head>\n\n<!-- ...inside the habits section, give each item a class: -->\n<ul class=\"habit-list\">\n  <li class=\"habit\">Drink water</li>\n  <li class=\"habit\">Read 10 pages</li>\n  <li class=\"habit\">30-minute walk</li>\n</ul>",
      },
      {
        language: 'css',
        filename: 'style.css',
        code:
          "* { box-sizing: border-box; margin: 0; }\n\nbody {\n  font-family: sans-serif;\n  color: #0a1626;\n  background: #f8fafc;\n}\n\n/* Top bar */\nheader {\n  padding: 20px 32px;\n  background: #ffffff;\n  border-bottom: 1px solid #e2e8f0;\n}\nheader h1 { color: #0891b2; }\nnav a { margin-right: 16px; color: #475569; text-decoration: none; }\n\n/* Content */\nmain { padding: 32px; }\n#intro h2 { font-size: 28px; margin-bottom: 8px; }\n#intro p { color: #475569; margin-bottom: 16px; }\n\nbutton {\n  background: #0891b2;\n  color: #fff;\n  border: none;\n  padding: 10px 18px;\n  border-radius: 10px;\n  font-weight: 700;\n  cursor: pointer;\n}\n\n/* Habit cards */\n.habit-list { list-style: none; margin-top: 24px; }\n.habit {\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 16px;\n  margin-bottom: 10px;\n  font-weight: 600;\n}",
      },
    ],
    placement:
      "1) Create momentum/style.css and paste the CSS. 2) In index.html, add the <link rel=\"stylesheet\" href=\"style.css\" /> line inside <head>. 3) Add class=\"habit-list\" to the habits <ul> and class=\"habit\" to each <li>. 4) Refresh the browser.",
    implementation:
      "The stylesheet opens with the box-sizing reset. The header gets white with a bottom border to separate it from the page, and the h1 becomes Momentum's cyan. nav a removes the default underline and greys the links. The button uses padding for a comfortable hit area, cyan fill, rounded corners, and cursor: pointer so it feels clickable. The big win is .habit: list-style: none removes the bullets, and each item becomes a white, bordered, rounded, padded card with a margin gap below — exactly the box-model pattern from the mini-project, now applied to real content.",
    expectedResult:
      "Momentum now has a white top bar with a cyan 'Momentum' logo, a hero with a headline and a cyan 'Get started' button, and the three habits displayed as clean white cards instead of bullet points.",
    connects:
      "These .habit cards are stand-alone rows right now. In Lesson 3 we use Flexbox to arrange them (and the nav) into proper horizontal layouts, and in Lesson 5 we add icons and a progress ring inside each card.",
  },

  quiz: [
    { id: 'l2q1', kind: 'concept', prompt: 'What does CSS control?', options: ['The content of the page', 'How the page looks (colours, spacing, layout)', 'Where data is stored', 'Server logic'], answerIndex: 1, explanation: "CSS styles HTML — colours, fonts, spacing, and layout." },
    { id: 'l2q2', kind: 'code_reading', prompt: 'What does .habit { } select?', options: ['The element <habit>', 'Every element with class="habit"', 'The element with id="habit"', 'Nothing — it is invalid'], answerIndex: 1, explanation: "A leading dot means a class selector: it matches every element with that class." },
    { id: 'l2q3', kind: 'concept', prompt: 'Padding is…', options: ['Space outside the box', 'Space inside the box, between content and border', 'The border thickness', 'The text colour'], answerIndex: 1, explanation: "Padding is inner space; margin is outer space." },
    { id: 'l2q4', kind: 'concept', prompt: 'Which creates a GAP between two cards?', options: ['padding on each card', 'margin on each card', 'border-radius', 'color'], answerIndex: 1, explanation: "Margin is the outer space that pushes elements apart, creating gaps." },
    { id: 'l2q5', kind: 'debug', prompt: 'A student wrote card { color: red; } but nothing changed on their class="card" element. Why?', code: { language: 'css', code: "card { color: red; }" }, options: ['color is not a property', 'They need a dot: .card { }', 'red is not a colour', 'They must use an id'], answerIndex: 1, explanation: "Without the dot, card matches a <card> tag (which doesn't exist). Class selectors need .card." },
    { id: 'l2q6', kind: 'output', prompt: 'With * { box-sizing: border-box; }, a box with width: 200px and padding: 20px is how wide?', options: ['240px', '220px', '200px', '180px'], answerIndex: 2, explanation: "border-box makes the width include padding, so it stays 200px." },
    { id: 'l2q7', kind: 'application', prompt: 'You want reusable styling for many habit cards. Best selector type?', options: ['ID selector', 'Class selector', 'Element selector on <div>', 'Inline style on each'], answerIndex: 1, explanation: "Classes are reusable across many elements — ideal for repeated card styles." },
    { id: 'l2q8', kind: 'code_reading', prompt: 'What does list-style: none do on a <ul>?', options: ['Hides the list', 'Removes the bullet points', 'Makes items bold', 'Adds numbers'], answerIndex: 1, explanation: "It removes the default bullets, which we do to turn list items into cards." },
    { id: 'l2q9', kind: 'application', prompt: 'How do you round a card’s corners?', options: ['corner-round: 12px', 'border-radius: 12px', 'radius: 12px', 'round: 12px'], answerIndex: 1, explanation: "border-radius rounds the corners; higher values are rounder." },
    { id: 'l2q10', kind: 'project', prompt: "In Momentum, why give each <li> the class 'habit' instead of styling li directly?", options: ['li cannot be styled', 'So the same card style is reusable and specific to habits, not every list on the site', 'Classes load faster', 'It is required by HTML'], answerIndex: 1, explanation: "A class scopes the style to habit cards specifically and keeps it reusable, rather than affecting every <li> everywhere." },
  ],

  homework: {
    task:
      "Style the About section you added in Lesson 1's homework, and make the 'Get started' button change colour when hovered. Give the About section a card look (white background, padding, rounded corners) and add a :hover rule to the button (e.g. a darker cyan).",
    requirements: [
      "Add a class (e.g. class=\"about-card\") to the About <section> and style it like the habit cards.",
      "Add a button:hover rule that changes the background to a darker cyan (e.g. #0e7490).",
      "The page must still look clean with no broken layout.",
    ],
    expectedOutcome:
      "The About section now sits in a white rounded card, and hovering the 'Get started' button darkens it — your first interactive-feeling styling.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 1,
      hint: "Lesson 1 asked you to add an About <section id=\"about\"> with an <h2> and <p>, plus a 4th habit. The nav link href=\"#about\" already points to it — you just need the matching section to exist.",
      steps: [
        "Inside <main>, after the habits section, add a new <section id=\"about\">.",
        "Give it one <h2> (e.g. 'Why Momentum?') and a <p> explaining the app.",
        "In the habits <ul>, add a fourth <li> (e.g. 'Sleep 8 hours').",
        "Save and click 'About' in the nav — the page should scroll to your new section.",
      ],
      codeGuidance: [
        {
          language: 'html',
          filename: 'index.html (add inside main)',
          code:
            "<section id=\"about\">\n  <h2>Why Momentum?</h2>\n  <p>Momentum helps you build small daily habits and keep your streak alive.</p>\n</section>",
        },
      ],
    },
  },
};
