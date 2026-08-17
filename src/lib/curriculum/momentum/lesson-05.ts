import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 5 — Google Fonts & Icons
 * Module 1 (HTML + CSS Foundations) · Lesson 5 of 30
 */
export const lesson05: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 1,
  lessonIndex: 4,
  globalNumber: 5,
  name: 'Google Fonts & icons',
  title: 'Branding Momentum — Fonts, Icons & a Progress Ring',
  subtitle: "Add a real typeface, icons in every habit card, and a streak ring that makes Momentum feel finished.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to load custom web fonts from Google Fonts, pair a display and body font, add icons, and build a simple progress ring with CSS.",
    sections: [
      {
        heading: 'Web fonts and Google Fonts',
        body:
          "Browsers only ship a handful of default fonts. Web fonts let you load any typeface over the internet. Google Fonts is a free library: you pick a font, copy a <link> tag into your <head>, then use it in CSS via font-family. A good typeface instantly makes a site feel designed rather than default.",
        code: {
          language: 'html',
          filename: 'index.html (in <head>)',
          code:
            "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n<link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&family=Inter:wght@400;600&display=swap\" rel=\"stylesheet\" />",
        },
      },
      {
        heading: 'Applying and pairing fonts',
        body:
          "Once loaded, apply a font with font-family, always listing a fallback: font-family: 'Inter', sans-serif;. A classic, reliable pairing is a strong display font for headings and a clean, readable font for body text. Momentum uses Plus Jakarta Sans for headings (matching Sariro's brand) and Inter for everything else. Two fonts is plenty — more starts to look messy.",
        code: {
          language: 'css',
          code:
            "body { font-family: 'Inter', sans-serif; }\nh1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }",
        },
      },
      {
        heading: 'Adding icons',
        body:
          "Icons make actions and items instantly recognisable. Three beginner-friendly options:\n\n1. Emoji — zero setup: just type 💧 or ✅ in your HTML. Great for a quick win.\n2. Inline SVG — paste an <svg> from a free set (like Lucide or Heroicons). Crisp at any size and colourable with CSS.\n3. Icon fonts — a <link> and then class names (e.g. Material Symbols).\n\nWe'll use a small inline SVG check icon for the habit cards because it's sharp and takes the cyan brand colour via CSS.",
        code: {
          language: 'html',
          code:
            "<!-- an inline SVG check-circle icon -->\n<svg class=\"icon\" viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\"\n     stroke=\"currentColor\" stroke-width=\"2\">\n  <circle cx=\"12\" cy=\"12\" r=\"10\" />\n  <path d=\"m9 12 2 2 4-4\" />\n</svg>",
        },
      },
      {
        heading: 'A progress ring with conic-gradient',
        body:
          "CSS can draw a circular progress ring without images using conic-gradient (a gradient that sweeps around a circle). Fill part of the circle with the brand colour and the rest with a light track, then cut out the middle with a white circle to make a ring. It's a copy-paste win that makes Momentum look like a real habit tracker showing a streak.",
        code: {
          language: 'css',
          code:
            ".ring {\n  width: 64px; height: 64px; border-radius: 50%;\n  /* 70% cyan sweep, rest light grey */\n  background:\n    conic-gradient(#0891b2 70%, #e2e8f0 0),\n    #fff;\n  display: grid; place-items: center;\n}\n.ring::before {\n  content: ''; width: 48px; height: 48px;\n  border-radius: 50%; background: #fff;   /* the hole */\n}",
        },
      },
    ],
    keyTerms: [
      { term: 'Web font', definition: "A font loaded over the internet so you're not limited to the browser's defaults." },
      { term: 'Google Fonts', definition: "A free web-font library you add via a <link> tag, then use with font-family." },
      { term: 'Font pairing', definition: "Combining a display font (headings) with a body font (text) for a designed feel." },
      { term: 'Inline SVG', definition: "Vector icon markup pasted into HTML; sharp at any size and colourable with CSS." },
      { term: 'currentColor', definition: "A CSS value meaning 'the element's text color'; lets an SVG icon inherit its colour." },
      { term: 'conic-gradient', definition: "A gradient that rotates around a centre point — handy for pie/ring charts." },
    ],
    commonMistakes: [
      "Using a font in CSS without loading it via the <link> — it silently falls back to a default.",
      "Not listing a fallback (e.g. sans-serif), so text looks broken while the web font loads.",
      "Loading many font weights you never use, which slows the page. Load only what you need.",
      "Sizing an SVG with no width/height, so it renders huge.",
      "Using dozens of different icons/fonts — consistency looks more professional than variety.",
    ],
    takeaways: [
      "Load web fonts with a Google Fonts <link>, then apply with font-family (+ a fallback).",
      "Pair one display font (headings) with one body font (text).",
      "Icons: emoji for speed, inline SVG for crisp, colourable icons.",
      "Use currentColor so SVG icons inherit the brand colour.",
      "conic-gradient + a cut-out circle makes a CSS progress ring — no image needed.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A branded heading with an icon',
    objective:
      "Load a Google Font and place an inline SVG icon next to a heading, aligned neatly — the pattern Momentum's cards use.",
    instructions: [
      "Create brand.html; add the Google Fonts <link> for Plus Jakarta Sans in the head.",
      "Add a heading row: an inline SVG icon + an <h2>.",
      "Create brand.css: apply the font to the heading and use flex to align icon + text.",
      "Colour the icon cyan with currentColor.",
    ],
    code: [
      {
        language: 'html',
        filename: 'brand.html',
        code:
          "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n    <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap\" rel=\"stylesheet\" />\n    <link rel=\"stylesheet\" href=\"brand.css\" />\n  </head>\n  <body>\n    <div class=\"title\">\n      <svg class=\"icon\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n        <circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"m9 12 2 2 4-4\" />\n      </svg>\n      <h2>Today's habits</h2>\n    </div>\n  </body>\n</html>",
      },
      {
        language: 'css',
        filename: 'brand.css',
        code:
          "* { box-sizing: border-box; margin: 0; }\nbody { font-family: 'Inter', sans-serif; padding: 32px; }\n\n.title {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  color: #0891b2;   /* the icon inherits this via currentColor */\n}\n.title h2 {\n  font-family: 'Plus Jakarta Sans', sans-serif;\n  font-weight: 800;\n  color: #0a1626;\n}",
      },
    ],
    explanation:
      "The <link> loads Plus Jakarta Sans before the page renders. .title is a flex row with align-items: center so the icon and heading line up vertically, and gap: 10px spaces them. The clever part: .title has color: #0891b2, and the SVG uses stroke=\"currentColor\", so the icon automatically becomes cyan — change the parent colour and the icon follows. The <h2> overrides the font to Plus Jakarta Sans at weight 800 for a bold, branded heading, while its own colour is dark ink for contrast.",
    expectedOutput:
      "A bold 'Today's habits' heading in the Plus Jakarta Sans font, with a cyan circular check icon neatly aligned to its left.",
    learned: [
      "How to load and apply a Google Font.",
      "How flex + gap align an icon with text.",
      "How currentColor lets an SVG inherit a colour.",
      "How font-family with a fallback works.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's brand layer — the Jakarta/Inter font pair, a check icon in every habit card, and a streak progress ring in the hero.",
    why:
      "Fonts and icons are what separate a student project from something that looks shipped. This lesson gives Momentum a real typographic identity and turns the plain habit cards into recognisable, icon-led rows — plus a progress ring that hints at the streak feature JavaScript will power in Module 2.",
    fileLocation: "momentum/index.html (fonts + icons + ring markup) and momentum/style.css",
    code: [
      {
        language: 'html',
        filename: 'index.html (head + hero ring + habit markup)',
        code:
          "<!-- in <head>, above your style.css link -->\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n<link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&family=Inter:wght@400;600&display=swap\" rel=\"stylesheet\" />\n\n<!-- in #intro, add a streak ring -->\n<div class=\"ring\"><span>7</span></div>\n\n<!-- give each habit an icon + text -->\n<li class=\"habit\">\n  <svg class=\"icon\" viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n    <circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"m9 12 2 2 4-4\" />\n  </svg>\n  <span>Drink water</span>\n</li>",
      },
      {
        language: 'css',
        filename: 'style.css (add these)',
        code:
          "body { font-family: 'Inter', sans-serif; }\nh1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }\n\n/* icon + text row inside a habit card */\n.habit { display: flex; align-items: center; gap: 10px; color: #0a1626; }\n.habit .icon { color: #0891b2; flex: none; }\n\n/* streak progress ring */\n.ring {\n  width: 72px; height: 72px; border-radius: 50%;\n  background: conic-gradient(#0891b2 70%, #e2e8f0 0), #fff;\n  display: grid; place-items: center;\n  margin-bottom: 16px;\n}\n.ring span {\n  width: 54px; height: 54px; border-radius: 50%; background: #fff;\n  display: grid; place-items: center;\n  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #0891b2;\n}",
      },
    ],
    placement:
      "1) Add the two Google Fonts <link>s in <head> (before your style.css link so the font is ready). 2) Add the <div class=\"ring\"><span>7</span></div> at the top of the #intro section. 3) Update each habit <li> to contain the SVG icon + a <span> with the text. 4) Paste the CSS additions. Refresh.",
    implementation:
      "The font rules set Inter as the site-wide body font and Plus Jakarta Sans for all headings — instant brand identity. Each .habit is now a flex row: the check icon (cyan via .habit .icon color, inherited by the SVG's currentColor) sits left of the label with a gap, and flex: none stops the icon from shrinking. The .ring uses the conic-gradient trick — a 70% cyan sweep over a light track — and the inner .ring span is a white circle that both creates the ring hole AND holds the streak number '7' in bold cyan. It's a static preview now; in Module 2, JavaScript will make the sweep and number reflect the real streak.",
    expectedResult:
      "Momentum now reads in Jakarta/Inter, the hero shows a cyan progress ring with '7' in the middle (a 7-day streak), and every habit card has a cyan check icon beside its label — it finally looks like a designed product.",
    connects:
      "This completes Momentum's visual identity. Lesson 6 assembles the whole Module-1 shell into a polished, presentable page; then Module 2's JavaScript makes the checks tickable, the streak real, and the ring dynamic.",
  },

  quiz: [
    { id: 'l5q1', kind: 'concept', prompt: 'How do you add a Google Font to a page?', options: ['Install it with npm', 'Add a <link> tag in the <head>, then use font-family', 'Write it in JavaScript', 'It works automatically'], answerIndex: 1, explanation: "You include Google's <link> tag, then reference the font via font-family in CSS." },
    { id: 'l5q2', kind: 'debug', prompt: "A student set font-family: 'Poppins' but text shows a default font. Likely cause?", options: ['Poppins is not a real font', "They didn't load Poppins via a <link>", 'CSS is disabled', 'They need JavaScript'], answerIndex: 1, explanation: "A font must be loaded (via <link> or @font-face) before font-family can use it." },
    { id: 'l5q3', kind: 'concept', prompt: 'Why always add a fallback like sans-serif?', options: ['It’s required syntax', 'So text still renders sensibly if the web font fails or is loading', 'To make text bigger', 'To change the colour'], answerIndex: 1, explanation: "The fallback keeps text readable while (or if) the custom font doesn't load." },
    { id: 'l5q4', kind: 'code_reading', prompt: 'In an SVG, what does stroke="currentColor" achieve?', options: ['Makes the icon red', 'Makes the icon use the element’s text colour', 'Removes the icon', 'Sets the size'], answerIndex: 1, explanation: "currentColor pulls the CSS color value, so the icon matches the surrounding text colour." },
    { id: 'l5q5', kind: 'application', prompt: 'You want an icon and label aligned in a row inside a card. Best approach?', options: ['float the icon', 'display: flex; align-items: center; gap', 'position: absolute', 'a <table>'], answerIndex: 1, explanation: "A flex row with align-items: center and gap aligns and spaces icon + text cleanly." },
    { id: 'l5q6', kind: 'concept', prompt: 'What does conic-gradient help you build here?', options: ['A drop shadow', 'A circular progress ring', 'A gradient background image file', 'An animation'], answerIndex: 1, explanation: "conic-gradient sweeps colour around a circle — perfect for a ring/pie indicator." },
    { id: 'l5q7', kind: 'application', prompt: 'A good rule for how many fonts to use on a site?', options: ['As many as possible', 'One display + one body (about two)', 'Exactly five', 'None'], answerIndex: 1, explanation: "Two well-paired fonts look designed; too many look chaotic." },
    { id: 'l5q8', kind: 'debug', prompt: 'An inline SVG renders huge and breaks the layout. What did the student likely omit?', options: ['A fill colour', 'width and height (or a sized viewBox)', 'A class', 'The stroke'], answerIndex: 1, explanation: "Without width/height the SVG uses its default large size; set explicit dimensions." },
    { id: 'l5q9', kind: 'output', prompt: 'In .habit .icon { color: #0891b2 }, the SVG uses stroke="currentColor". What colour is the icon?', options: ['Black', 'Cyan (#0891b2)', 'White', 'Transparent'], answerIndex: 1, explanation: "currentColor resolves to the cyan color set on the icon, so the stroke is cyan." },
    { id: 'l5q10', kind: 'project', prompt: "What does Momentum's progress ring represent?", options: ['The page loading', 'A habit streak (e.g. 7 days)', 'The battery level', 'Nothing yet'], answerIndex: 1, explanation: "The ring is a streak indicator; JavaScript will later make it reflect real progress." },
  ],

  homework: {
    task:
      "Give Momentum's navigation a small brand touch: add an icon (emoji or inline SVG) beside the logo in the header, and make the nav links use a slightly bolder weight from your loaded font. Optionally add a second habit's real icon so not every card looks identical.",
    requirements: [
      "Add an icon next to the 'Momentum' logo, aligned with flex.",
      "Set the nav links to font-weight: 600 using the Inter font you loaded.",
      "Keep everything aligned and on-brand (cyan accents).",
    ],
    expectedOutcome:
      "The header logo has a small icon beside it and the nav links look crisper with a heavier weight — a subtle but professional upgrade.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 4,
      hint: "Lesson 4 asked you to make typography responsive and stack the footer on phones. Set comfortable desktop sizes, then shrink them inside your existing @media (max-width: 640px) block.",
      steps: [
        "Give #intro h2 a desktop font-size (e.g. 28px) and the intro <p> ~16px.",
        "Inside the @media (max-width: 640px) block, reduce them (e.g. h2 to 22px).",
        "In the same media block, add footer { flex-direction: column; align-items: flex-start; gap: 10px; }.",
        "Test at a wide and a narrow window.",
      ],
      codeGuidance: [
        {
          language: 'css',
          filename: 'style.css',
          code:
            "#intro h2 { font-size: 28px; }\n#intro p { font-size: 16px; }\n\n@media (max-width: 640px) {\n  #intro h2 { font-size: 22px; }\n  #intro p { font-size: 15px; }\n  footer { flex-direction: column; align-items: flex-start; gap: 10px; }\n}",
        },
      ],
    },
  },
};
