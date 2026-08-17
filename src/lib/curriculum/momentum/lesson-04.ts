import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 4 — Responsive Design with Media Queries
 * Module 1 (HTML + CSS Foundations) · Lesson 4 of 30
 */
export const lesson04: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 1,
  lessonIndex: 3,
  globalNumber: 4,
  name: 'Responsive design with media queries',
  title: 'Making Momentum Work on Every Screen',
  subtitle: "Use media queries so Momentum looks great on phones, tablets, and desktops.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how responsive design adapts a layout to different screen sizes using the viewport meta tag, media queries, and relative units.",
    sections: [
      {
        heading: 'What is responsive design?',
        body:
          "People visit sites on phones, tablets, and laptops — screen widths from ~360px to 1920px+. Responsive design means one layout that reshapes itself to fit each. Instead of building separate mobile and desktop sites, you write CSS that responds to the screen width. Momentum should feel native whether it's on a phone in someone's hand or a laptop.",
      },
      {
        heading: 'The viewport meta tag (you already have it)',
        body:
          "Mobile browsers pretend to be ~980px wide and zoom out, unless you tell them not to. The <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /> tag (added in Lesson 1) tells the browser to use the real device width and not zoom. Without it, media queries barely work on phones — it's the first requirement of any responsive page.",
      },
      {
        heading: 'Media queries — CSS that reacts to width',
        body:
          "A media query is a block of CSS that only applies when a condition is true — usually a screen width. @media (max-width: 640px) { ... } means 'apply these rules only when the screen is 640px wide or narrower' (phones). You put your normal styles first, then override specific things inside the query for small screens.",
        code: {
          language: 'css',
          code:
            "/* normal (all sizes) */\n.habit { flex: 1 1 200px; }\n\n/* phones only */\n@media (max-width: 640px) {\n  .habit { flex: 1 1 100%; }   /* one card per row */\n}",
        },
      },
      {
        heading: 'Breakpoints',
        body:
          "A breakpoint is the width where your layout changes. Common ones: ~640px (phone), ~768px (tablet), ~1024px (small laptop). You don't need many — often one or two well-chosen breakpoints handle everything. Pick a breakpoint where your layout starts to look cramped, and adjust there.",
      },
      {
        heading: 'Relative units help too',
        body:
          "Fixed pixels don't scale. Relative units adapt: % is relative to the parent's size, and rem is relative to the base font size (1rem = 16px by default). Using max-width: 100% on things, and rem for spacing/type, means your layout flexes even between breakpoints. A common pattern: give a content wrapper max-width: 1000px; margin: 0 auto; so it's centred on big screens but full-width on small ones.",
      },
    ],
    keyTerms: [
      { term: 'Responsive design', definition: "One layout that adapts to any screen size instead of separate mobile/desktop sites." },
      { term: 'Viewport meta tag', definition: "Tells mobile browsers to use the real device width; required for responsiveness." },
      { term: 'Media query', definition: "A CSS block that only applies when a condition (like max-width) is met." },
      { term: 'Breakpoint', definition: "A screen width where the layout changes (e.g. 640px for phones)." },
      { term: 'rem', definition: "A relative unit equal to the root font size (1rem = 16px by default)." },
      { term: 'max-width', definition: "Caps how wide an element can get; with 100% it prevents overflow on small screens." },
    ],
    commonMistakes: [
      "Forgetting the viewport meta tag, so media queries don't take effect on real phones.",
      "Using only fixed pixel widths, which overflow small screens (add max-width: 100%).",
      "Putting mobile overrides BEFORE the base rules incorrectly — later rules win, so the query should come after.",
      "Adding too many breakpoints. Start with one (~640px) and add more only if needed.",
      "Testing only by shrinking the desktop window and forgetting to check an actual phone or dev-tools device mode.",
    ],
    takeaways: [
      "Responsive design = one adaptive layout for all screens.",
      "The viewport meta tag is required for media queries to work on phones.",
      "@media (max-width: 640px) applies rules only on narrow screens.",
      "Override just what needs to change at each breakpoint.",
      "Relative units (%, rem, max-width: 100%) keep things flexible between breakpoints.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A colour-changing responsive box',
    objective:
      "See a media query in action by making a box change its layout and colour below a breakpoint — the clearest way to understand how responsive overrides work.",
    instructions: [
      "Create responsive.html with two boxes inside a flex container.",
      "Create responsive.css: lay the boxes in a row by default.",
      "Add a @media (max-width: 600px) query that stacks them and changes their colour.",
      "Open it and drag the window narrow/wide to watch it switch.",
    ],
    code: [
      {
        language: 'html',
        filename: 'responsive.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <link rel=\"stylesheet\" href=\"responsive.css\" />\n  </head>\n  <body>\n    <div class=\"row\">\n      <div class=\"box\">One</div>\n      <div class=\"box\">Two</div>\n    </div>\n  </body>\n</html>",
      },
      {
        language: 'css',
        filename: 'responsive.css',
        code:
          "* { box-sizing: border-box; margin: 0; }\nbody { font-family: sans-serif; padding: 20px; }\n\n.row { display: flex; gap: 16px; }\n.box {\n  flex: 1;\n  padding: 32px;\n  background: #0891b2;   /* cyan on wide screens */\n  color: #fff;\n  border-radius: 12px;\n  text-align: center;\n}\n\n@media (max-width: 600px) {\n  .row { flex-direction: column; }  /* stack them */\n  .box { background: #7c3aed; }     /* violet on narrow screens */\n}",
      },
    ],
    explanation:
      "By default .row is a flex row, so the two boxes sit side by side and share the width (flex: 1 each), coloured cyan. The media query only kicks in at 600px or narrower: it changes flex-direction to column so the boxes stack vertically, and repaints them violet. Nothing else is repeated — the query overrides ONLY the two things that should change. Resize the window past 600px and you'll watch the layout and colour flip, which is exactly how responsive design feels.",
    expectedOutput:
      "On a wide window: two cyan boxes side by side. On a narrow window (under 600px): two violet boxes stacked vertically. It switches live as you resize.",
    learned: [
      "How a media query targets a screen-width range.",
      "How flex-direction: column stacks a row.",
      "That you override only what changes, not everything.",
      "How to test responsiveness by resizing the window.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum becomes fully mobile-friendly — a centred content area and a layout that adapts on phones.",
    why:
      "Most students will show Momentum on their phone. Right now the header and cards are tuned for desktop. Adding a centred wrapper plus one phone breakpoint makes Momentum look intentional on every device — a must for a portfolio piece.",
    fileLocation: "momentum/style.css (add a wrapper rule + a media query at the end)",
    code: [
      {
        language: 'css',
        filename: 'style.css (add these)',
        code:
          "/* Centre the main content on large screens */\nmain {\n  max-width: 1000px;\n  margin: 0 auto;\n  padding: 32px;\n}\n\n/* Phones: tighten spacing and stack things */\n@media (max-width: 640px) {\n  header {\n    flex-direction: column;\n    gap: 12px;\n    align-items: flex-start;\n    padding: 16px 20px;\n  }\n  main { padding: 20px; }\n  #intro h2 { font-size: 22px; }\n  .habit { flex: 1 1 100%; }   /* one habit card per row */\n}",
      },
    ],
    placement:
      "Add the centred main rule near your other main styles, and paste the @media block at the very END of style.css (so it overrides the base rules). Refresh, then narrow the browser window under 640px to watch it adapt.",
    implementation:
      "The main wrapper gets max-width: 1000px and margin: 0 auto, so on big screens the content is a centred column instead of stretching edge-to-edge, while on small screens it naturally fills the width. The media query is Momentum's phone layout: the header switches from a side-by-side bar to a stacked column (logo above nav) so nothing gets cramped, padding shrinks to reclaim space, the hero heading scales down, and each habit card goes full-width (flex: 1 1 100%) for easy tapping. Because these are overrides at the bottom of the file, they only apply under 640px.",
    expectedResult:
      "On desktop, Momentum's content sits in a tidy centred column. Shrink the window under 640px and the header stacks, spacing tightens, and habit cards become full-width, single-column — it looks like a real mobile app.",
    connects:
      "Momentum is now structurally complete and responsive. Lesson 5 adds the finishing brand layer — a proper font, icons in each card, and a progress ring — and Lesson 6 assembles everything into the polished Module-1 shell.",
  },

  quiz: [
    { id: 'l4q1', kind: 'concept', prompt: 'What is responsive design?', options: ['A separate mobile website', 'One layout that adapts to any screen size', 'A JavaScript animation', 'A type of server'], answerIndex: 1, explanation: "Responsive design is a single layout that reshapes to fit different screens." },
    { id: 'l4q2', kind: 'debug', prompt: "A student's media queries don't work on their phone, only when resizing desktop. What's likely missing?", options: ['The viewport meta tag', 'A gap property', 'display: flex', 'A class selector'], answerIndex: 0, explanation: "Without <meta name=viewport>, phones render at a fake width and media queries misbehave." },
    { id: 'l4q3', kind: 'code_reading', prompt: 'When does @media (max-width: 640px) { } apply?', options: ['On screens 640px wide or narrower', 'On screens wider than 640px', 'Only at exactly 640px', 'Never on phones'], answerIndex: 0, explanation: "max-width: 640px targets widths up to and including 640px." },
    { id: 'l4q4', kind: 'application', prompt: 'You want habit cards to become full-width on phones. Inside the query you set…', options: ['flex: 1 1 100%', 'display: none', 'gap: 0', 'color: white'], answerIndex: 0, explanation: "flex-basis of 100% makes each card take a full row (one per line)." },
    { id: 'l4q5', kind: 'concept', prompt: 'What is a breakpoint?', options: ['A CSS error', 'A screen width where the layout changes', 'A broken image', 'A JavaScript function'], answerIndex: 1, explanation: "A breakpoint is the width at which you change the layout via a media query." },
    { id: 'l4q6', kind: 'code_reading', prompt: 'What does flex-direction: column do?', options: ['Puts items in a row', 'Stacks items vertically', 'Hides items', 'Centres text'], answerIndex: 1, explanation: "It changes the flex main axis to vertical, stacking items." },
    { id: 'l4q7', kind: 'concept', prompt: '1rem equals how many pixels by default?', options: ['1px', '10px', '16px', '100px'], answerIndex: 2, explanation: "The default root font size is 16px, so 1rem = 16px unless changed." },
    { id: 'l4q8', kind: 'application', prompt: 'How do you centre a max-width content column on large screens?', options: ['text-align: center', 'margin: 0 auto with a max-width', 'display: none', 'float: right'], answerIndex: 1, explanation: "A max-width plus margin: 0 auto centres a block horizontally." },
    { id: 'l4q9', kind: 'debug', prompt: 'Mobile overrides in a media query at the TOP of the file get ignored. Why?', options: ['Media queries must be first', 'Later base rules override them; the query should come after', 'You can’t use max-width', 'rem is broken'], answerIndex: 1, explanation: "CSS applies later rules last; put the query after the base styles so its overrides win." },
    { id: 'l4q10', kind: 'project', prompt: "In Momentum's phone layout, why stack the header (flex-direction: column)?", options: ['To hide the nav', 'So the logo and nav don’t get cramped side by side on a narrow screen', 'To make it load faster', 'Because flex requires it'], answerIndex: 1, explanation: "On narrow screens a side-by-side bar gets squeezed, so stacking keeps it readable." },
  ],

  homework: {
    task:
      "Make Momentum's typography responsive. Add rules so the hero heading and body text are comfortably large on desktop but smaller on phones, and ensure the footer you built stacks nicely under 640px too.",
    requirements: [
      "Set a sensible desktop font-size on #intro h2 and the intro paragraph.",
      "Inside the existing @media (max-width: 640px) block, reduce those font sizes.",
      "Add a footer rule in the media query so the footer stacks (flex-direction: column) on phones.",
      "Check it at both a wide and a narrow window.",
    ],
    expectedOutcome:
      "Text scales down on phones so nothing feels oversized, and the footer stacks its text and links vertically on narrow screens.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 3,
      hint: "Lesson 3 asked you to lay out the footer with Flexbox — text left, two links right, using space-between (the same recipe as the header).",
      steps: [
        "Add a <nav> with two <a> links inside your <footer>.",
        "Give the footer display: flex; justify-content: space-between; align-items: center.",
        "Make the footer's nav a flex row with a gap for the two links.",
        "Refresh — the text should sit left and the links right.",
      ],
      codeGuidance: [
        {
          language: 'css',
          filename: 'style.css',
          code:
            "footer {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 20px 32px;\n  border-top: 1px solid #e2e8f0;\n}\nfooter nav { display: flex; gap: 16px; }\nfooter a { color: #475569; text-decoration: none; }",
        },
      ],
    },
  },
};
