import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 6 — Module 1 Build: The Polished Shell
 * Module 1 (HTML + CSS Foundations) · Lesson 6 of 30
 */
export const lesson06: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 1,
  lessonIndex: 5,
  globalNumber: 6,
  name: 'Module 1 build — the Momentum shell',
  title: 'Module 1 Build — Assembling the Polished Momentum Shell',
  subtitle: "Bring HTML, CSS, Flexbox, responsiveness, and branding together into one finished page.",

  concept: {
    durationMin: 15,
    summary:
      "Review how the pieces from Lessons 1–5 combine, and learn the finishing touches — visual hierarchy, a consistent spacing scale, organised CSS, and micro-interactions — that make a page feel complete.",
    sections: [
      {
        heading: 'Composing a page from parts',
        body:
          "You've built Momentum in layers: semantic HTML structure (L1), the box model and colours (L2), Flexbox layout (L3), responsiveness (L4), and fonts/icons (L5). A finished page is just these parts working together: a header, a hero, a card grid, an about section, and a footer — each a small, well-understood block. Thinking in blocks is how professionals build big pages without feeling overwhelmed.",
      },
      {
        heading: 'Visual hierarchy — guiding the eye',
        body:
          "Good design tells the viewer where to look first. You create hierarchy with four tools: size (bigger = more important), weight (bolder stands out), colour (the cyan accent draws attention), and space (whitespace isolates and elevates). Momentum's hero heading is large and bold; the habit labels are medium; the footer is small and grey. That ordering isn't random — it's hierarchy.",
      },
      {
        heading: 'A spacing scale for consistency',
        body:
          "Random spacing (13px here, 27px there) looks sloppy. Professionals use a small, consistent scale — for example 4, 8, 12, 16, 24, 32px — and reuse those values everywhere. Momentum already leans on 16px and 24px repeatedly. Consistency in spacing is one of the biggest, cheapest wins for a polished look.",
      },
      {
        heading: 'Organising your CSS',
        body:
          "As a stylesheet grows, order and comments matter. A good structure: (1) resets and base (body, box-sizing), (2) layout (header, main, footer), (3) components (.habit, .ring, button), (4) responsive (@media at the end). Group related rules and add short comments. Future-you (and your teacher) will thank you.",
      },
      {
        heading: 'Micro-interactions and polish',
        body:
          "Small motions make a UI feel alive. A transition smooths a change over time: transition: transform 0.15s ease; then transform: translateY(-2px) on hover makes a card gently lift. Add a subtle box-shadow for depth. These details take minutes but read as craftsmanship.",
        code: {
          language: 'css',
          code:
            ".habit {\n  transition: transform 0.15s ease, box-shadow 0.15s ease;\n}\n.habit:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 20px rgba(8,145,178,0.12);\n}",
        },
      },
    ],
    keyTerms: [
      { term: 'Visual hierarchy', definition: "Using size, weight, colour, and space to guide the eye to what matters most." },
      { term: 'Spacing scale', definition: "A small set of reused spacing values (4/8/16/24/32) for consistency." },
      { term: 'Component', definition: "A reusable block of UI (a card, a button) you compose pages from." },
      { term: 'transition', definition: "A CSS property that animates a change (like hover) smoothly over time." },
      { term: 'box-shadow', definition: "A shadow around a box that adds depth; subtle values look best." },
      { term: 'Micro-interaction', definition: "A small motion or feedback (hover lift, colour change) that makes UI feel responsive." },
    ],
    commonMistakes: [
      "Inconsistent spacing values scattered through the CSS — pick a scale and reuse it.",
      "Everything the same size and weight, so nothing stands out (no hierarchy).",
      "Overusing shadows and animations; heavy effects look amateur. Keep them subtle.",
      "One giant unordered stylesheet with no comments — hard to maintain.",
      "Skipping a final responsive check after adding polish; new styles can break small screens.",
    ],
    takeaways: [
      "Build big pages as a set of small, understood blocks.",
      "Create hierarchy with size, weight, colour, and space.",
      "Reuse a small spacing scale for a consistent, tidy look.",
      "Organise CSS: base → layout → components → responsive.",
      "Subtle transitions and shadows add polish without noise.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A polished stat card',
    objective:
      "Combine everything from Module 1 into one small component — a stat card with an icon, a big number, a label, and a hover lift — the craftsmanship pattern you'll reuse everywhere.",
    instructions: [
      "Create stat.html with a card containing an icon, a big number, and a label.",
      "Create stat.css: load a font, style the card, build hierarchy (big bold number, small grey label).",
      "Add a transition + hover lift and a subtle shadow.",
    ],
    code: [
      {
        language: 'html',
        filename: 'stat.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Inter&display=swap\" rel=\"stylesheet\" />\n    <link rel=\"stylesheet\" href=\"stat.css\" />\n  </head>\n  <body>\n    <div class=\"stat\">\n      <div class=\"num\">7</div>\n      <div class=\"label\">Day streak</div>\n    </div>\n  </body>\n</html>",
      },
      {
        language: 'css',
        filename: 'stat.css',
        code:
          "* { box-sizing: border-box; margin: 0; }\nbody { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px; }\n\n.stat {\n  width: 160px;\n  background: #fff;\n  border: 1px solid #e2e8f0;\n  border-radius: 16px;\n  padding: 20px;\n  text-align: center;\n  transition: transform 0.15s ease, box-shadow 0.15s ease;\n}\n.stat:hover {\n  transform: translateY(-3px);\n  box-shadow: 0 8px 24px rgba(8,145,178,0.14);\n}\n.num {\n  font-family: 'Plus Jakarta Sans', sans-serif;\n  font-weight: 800;\n  font-size: 40px;\n  color: #0891b2;\n}\n.label { font-size: 13px; color: #64748b; margin-top: 4px; }",
      },
    ],
    explanation:
      "Every Module-1 idea appears here. The card uses the box model (padding, border, radius) and a loaded font. Hierarchy is deliberate: .num is huge, bold, and cyan (the thing you notice first); .label is small and grey (secondary). The transition + hover lift and a soft cyan-tinted shadow add the micro-interaction that makes it feel responsive to touch. This tiny component is the same craftsmanship you'll layer onto Momentum's cards.",
    expectedOutput:
      "A neat white card showing a large cyan '7' above a small grey 'Day streak' label. Hovering lifts it slightly with a soft shadow.",
    learned: [
      "How to compose a component using every Module-1 skill.",
      "How to build clear visual hierarchy.",
      "How transitions and shadows add polish.",
      "A reusable card pattern for the rest of the course.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "The finished Module 1 Momentum shell — every piece assembled, polished, and responsive.",
    why:
      "This is the milestone that ends Module 1: a complete, presentable Momentum home page. It's the visual foundation the entire app is built on. Getting it clean and consistent now means Module 2's JavaScript has a polished stage to bring to life.",
    fileLocation: "momentum/style.css (add polish) — final review of index.html + style.css",
    code: [
      {
        language: 'css',
        filename: 'style.css (add polish + confirm structure)',
        code:
          "/* ---- Components: habit card polish ---- */\n.habit {\n  transition: transform 0.15s ease, box-shadow 0.15s ease;\n}\n.habit:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 20px rgba(8,145,178,0.12);\n  border-color: #b8e6ef;\n}\n\n/* consistent section rhythm using the spacing scale */\n#intro { margin-bottom: 32px; }\n#habits h2 { margin-bottom: 16px; }\n.about-card { margin-top: 32px; }\n\n/* button micro-interaction */\nbutton { transition: background 0.15s ease; }",
      },
      {
        language: 'html',
        filename: 'index.html (final structure — confirm you have this shape)',
        code:
          "<body>\n  <header> Momentum logo + nav </header>\n  <main>\n    <section id=\"intro\"> ring + headline + subtext + button </section>\n    <section id=\"habits\"> heading + .habit-list of icon cards </section>\n    <section id=\"about\" class=\"about-card\"> Why Momentum? </section>\n  </main>\n  <footer> text + links </footer>\n</body>",
      },
    ],
    placement:
      "Add the polish rules to the components area of style.css (after your .habit rule). Then do a final review: confirm your index.html matches the structure comment, the @media block is at the END of the stylesheet, and every section uses consistent 16/24/32px spacing. Refresh and hover a habit card.",
    implementation:
      "The final touches apply the concept lesson directly. Each .habit now lifts and casts a soft cyan shadow on hover, with a subtle border tint — a micro-interaction that makes the list feel interactive even before JavaScript. The margin rules impose a consistent vertical rhythm (32px between major sections, 16px under headings) drawn from the spacing scale. The button gets a smooth background transition to pair with the hover colour from earlier homework. Nothing structural changes — this is the disciplined polish pass that turns 'working' into 'finished'.",
    expectedResult:
      "A complete Momentum home page: branded header, a hero with the streak ring and a cyan call-to-action, a responsive grid of icon habit cards that gently lift on hover, an about card, and a footer — consistent, on-brand, and mobile-friendly. Module 1 done.",
    connects:
      "Module 1 delivered the entire visual shell as static HTML/CSS. Module 2 (Lessons 7–12) adds JavaScript: the habit checks become tickable, new habits can be added, streaks count up, and everything saves with localStorage — bringing this polished shell to life.",
  },

  quiz: [
    { id: 'l6q1', kind: 'concept', prompt: 'Which four tools create visual hierarchy?', options: ['Size, weight, colour, space', 'Padding, margin, border, gap', 'HTML, CSS, JS, SVG', 'Flex, grid, float, table'], answerIndex: 0, explanation: "Size, weight, colour, and whitespace guide the eye to what matters most." },
    { id: 'l6q2', kind: 'concept', prompt: 'Why use a spacing scale (4/8/16/24/32)?', options: ['It’s required by CSS', 'Consistent, reused spacing looks tidy and professional', 'It makes the page load faster', 'It changes colours'], answerIndex: 1, explanation: "Reusing a small set of spacing values keeps the layout consistent and clean." },
    { id: 'l6q3', kind: 'code_reading', prompt: 'What does transition: transform 0.15s ease do?', options: ['Instantly moves an element', 'Animates transform changes smoothly over 0.15s', 'Hides the element', 'Sets a background'], answerIndex: 1, explanation: "It eases any change to transform over 0.15 seconds, smoothing hover motion." },
    { id: 'l6q4', kind: 'application', prompt: 'Best way to make a card gently lift on hover?', options: ['margin-top: -2px', 'transform: translateY(-2px) with a transition', 'display: none', 'font-size: larger'], answerIndex: 1, explanation: "translateY moves it up, and the transition makes the motion smooth." },
    { id: 'l6q5', kind: 'concept', prompt: 'A good order for a growing stylesheet is…', options: ['Random', 'Base → layout → components → responsive', 'Responsive → base only', 'Components first, no base'], answerIndex: 1, explanation: "Base, then layout, then components, then media queries keeps CSS maintainable." },
    { id: 'l6q6', kind: 'debug', prompt: 'After adding polish, the phone layout breaks. What should you always do?', options: ['Delete the media query', 'Re-check the responsive view after new styles', 'Remove all shadows', 'Switch fonts'], answerIndex: 1, explanation: "New styles can affect small screens; always re-test responsiveness after changes." },
    { id: 'l6q7', kind: 'concept', prompt: 'Which is a sign of over-design?', options: ['One accent colour used sparingly', 'Subtle shadows', 'Heavy animations and many clashing fonts', 'Consistent spacing'], answerIndex: 2, explanation: "Excessive motion and too many fonts read as amateur; restraint looks professional." },
    { id: 'l6q8', kind: 'project', prompt: 'What does Momentum’s Module-1 shell NOT do yet?', options: ['Show habit cards', 'Look responsive', 'Actually tick habits or save data', 'Use the brand font'], answerIndex: 2, explanation: "It's all static HTML/CSS; interactivity and saving come with JavaScript in Module 2." },
    { id: 'l6q9', kind: 'application', prompt: 'Thinking of a page as blocks (header/hero/cards/footer) helps you…', options: ['Avoid CSS entirely', 'Build and reason about large pages without overwhelm', 'Skip responsiveness', 'Remove HTML'], answerIndex: 1, explanation: "Composing from small, understood components makes large layouts manageable." },
    { id: 'l6q10', kind: 'output', prompt: 'box-shadow: 0 6px 20px rgba(8,145,178,0.12) produces…', options: ['A hard black border', 'A soft, low-opacity cyan-tinted shadow below the element', 'A gradient background', 'No visible effect ever'], answerIndex: 1, explanation: "It's a soft shadow offset downward with 12% cyan — subtle depth on hover." },
  ],

  homework: {
    task:
      "Polish pass on your own Momentum: apply a consistent spacing scale (replace any odd values with 8/16/24/32), add a hover lift to the About card too, and take a before/after screenshot. Make sure it still looks right on a phone-width window.",
    requirements: [
      "Audit your style.css and align spacing values to the scale.",
      "Add a transition + hover lift to .about-card (matching the habit cards).",
      "Confirm the @media block is at the end and the phone layout still works.",
      "Save both a desktop and a mobile-width screenshot of the finished shell.",
    ],
    expectedOutcome:
      "A consistent, polished Momentum shell that lifts on hover, spaces evenly, and looks clean on both desktop and phone — ready for JavaScript in Module 2.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 5,
      hint: "Lesson 5 asked you to add an icon beside the logo and make nav links bolder. Wrap the logo + icon in a flex row and set the links' font-weight.",
      steps: [
        "In the header, wrap the icon and 'Momentum' text in a flex container (align-items: center; gap: 8px).",
        "Reuse the inline SVG icon pattern (or an emoji) beside the logo.",
        "Add nav a { font-weight: 600; } so links look crisper.",
        "Keep the cyan accent on the logo icon via currentColor.",
      ],
      codeGuidance: [
        {
          language: 'html',
          filename: 'index.html (header logo)',
          code:
            "<div class=\"logo\" style=\"display:flex; align-items:center; gap:8px; color:#0891b2;\">\n  <svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n    <circle cx=\"12\" cy=\"12\" r=\"9\" /><path d=\"M12 7v5l3 2\" />\n  </svg>\n  <h1>Momentum</h1>\n</div>",
        },
      ],
    },
  },
};
