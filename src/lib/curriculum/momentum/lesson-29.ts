import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 29 — Capstone Build Sprint
 * Module 5 (Deploy + Capstone) · Lesson 29 of 30
 */
export const lesson29: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 5,
  lessonIndex: 4,
  globalNumber: 29,
  name: 'Capstone build sprint',
  title: 'Capstone Build Sprint — Polishing Momentum End to End',
  subtitle: "A full responsiveness, accessibility, and bug-hunt pass across the entire app.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the professional practice of a pre-launch review: checking responsiveness, accessibility, edge cases, and performance across an entire app before calling it done.",
    sections: [
      {
        heading: 'Why a dedicated review pass matters',
        body:
          "Across 28 lessons, you built Momentum feature by feature, testing each piece as you went. But features interact in ways you don't always notice mid-build — a review pass across the WHOLE app, testing it as a real first-time user would, catches things individual-lesson testing misses. Professional teams call this a 'QA pass' or 'polish sprint', and it always happens before a real launch.",
      },
      {
        heading: 'Responsiveness — test every breakpoint, every screen',
        body:
          "Resize your browser (or use DevTools' device toolbar) across phone, tablet, and desktop widths, and click through EVERY section: header, hero, habit list, Ask Momentum, footer. Look specifically for text overflowing its container, elements overlapping, or touch targets too small to tap comfortably.",
      },
      {
        heading: 'Accessibility — a quick, high-value pass',
        body:
          "Three checks that catch most common issues: (1) every <img> has meaningful alt text, (2) every interactive element (buttons, inputs, links) is reachable and usably visible using ONLY the Tab key — no mouse, (3) text has enough colour contrast against its background to read comfortably. These aren't just 'nice to have' — they determine whether real people with disabilities can actually use your app.",
      },
      {
        heading: 'Edge cases — the states easy to forget',
        body:
          "Deliberately test the states that don't show up in normal day-to-day use: zero habits (empty state), a habit with a VERY long name (does it break the layout?), the AI feature with no internet connection, and rapidly clicking a button multiple times. Each Module already added defensive handling for several of these — verify they actually hold up together.",
      },
      {
        heading: 'A basic performance check',
        body:
          "Chrome DevTools' Lighthouse tab (or PageSpeed Insights on your live URL) gives you a free, automated report on performance, accessibility, and SEO — often surfacing issues you'd otherwise miss, like an oversized image or a missing meta tag. It's not the final word on quality, but it's a fast, useful gut-check before launch.",
      },
    ],
    keyTerms: [
      { term: 'QA pass / polish sprint', definition: "A dedicated review testing a finished app as a real user would, before launch." },
      { term: 'Breakpoint testing', definition: "Checking a layout at multiple screen widths (phone/tablet/desktop) for issues." },
      { term: 'Accessibility (a11y)', definition: "Ensuring an app is usable by people with disabilities — keyboard navigation, alt text, contrast, etc." },
      { term: 'Edge case', definition: "An unusual but valid state (empty data, very long input, no connection) that's easy to forget testing." },
      { term: 'Lighthouse', definition: "A free, built-in Chrome tool auditing a page's performance, accessibility, and SEO." },
    ],
    commonMistakes: [
      "Only testing the exact scenarios built during development, missing how features interact together.",
      "Skipping keyboard-only navigation testing — many real accessibility issues only show up this way.",
      "Never testing with an empty or extreme dataset (0 habits, or 20 very long habit names).",
      "Assuming 'it worked once' means 'it always works' — re-test after every change, not just once.",
      "Treating a Lighthouse score as the only measure of quality instead of one useful signal among several.",
    ],
    takeaways: [
      "A dedicated whole-app review pass catches issues individual feature testing misses.",
      "Test responsiveness across real breakpoints by actually resizing and clicking through.",
      "Alt text, keyboard navigation, and colour contrast are a fast, high-value accessibility check.",
      "Deliberately test edge cases: empty state, long input, no connection, rapid clicks.",
      "Lighthouse gives a fast, free, useful (but not definitive) quality signal.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A keyboard-only navigation test',
    objective:
      "Practise a real accessibility check by navigating a page using ONLY the keyboard — a concrete, fast skill every developer should have.",
    instructions: [
      "Open any page of your Momentum app (or another project).",
      "Click once on the address bar, then use ONLY the Tab key to move forward (Shift+Tab to go back) and Enter/Space to activate.",
      "Try to: focus the nav links, focus the add-habit input and type in it, focus and 'click' the Add button, focus a habit card.",
      "Write down anything that was impossible or confusing to reach this way.",
    ],
    code: [
      {
        language: 'text',
        code:
          "Keyboard-only test checklist:\n[ ] Can Tab reach every nav link?\n[ ] Can Tab reach the add-habit input, and can you type in it?\n[ ] Can Tab reach the Add button, and does Enter/Space activate it?\n[ ] Is it ALWAYS visually clear which element currently has focus?\n[ ] Can Tab reach and toggle a habit card?\n[ ] Can Tab reach the Ask Momentum input and Send button?",
      },
    ],
    explanation:
      "This isn't a coding exercise in the usual sense — it's a real-world testing skill. Every browser has a default focus outline (usually a blue ring) showing which element is currently selected via Tab; if you ever can't tell where focus is, or an element is completely SKIPPED by Tab, that's a genuine accessibility bug some real users would hit every single day. Clickable <div>s (instead of real <button> elements) are the most common cause of an element being unreachable by keyboard — this is exactly why Momentum's HabitCard uses semantic elements and native onClick handlers throughout.",
    expectedOutput:
      "A checklist with each item marked pass/fail, and notes on anything that couldn't be reached or was unclear using only the keyboard.",
    learned: [
      "How to test keyboard-only navigation, a core accessibility check.",
      "Why clickable divs (vs real buttons) commonly break keyboard access.",
      "How to spot a missing or unclear focus indicator.",
      "That accessibility testing is fast and doesn't require special tools to start.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "A full end-to-end review and polish pass across Momentum — responsiveness, accessibility, edge cases, and a Lighthouse check — with fixes applied.",
    why:
      "This is the capstone sprint: pulling together everything from all four previous modules into one final quality pass before Lesson 30's public launch. It's the difference between 'it works' and 'it's ready to show people'.",
    fileLocation: "Across the whole momentum-app/ project — whichever files the review surfaces issues in",
    code: [
      {
        language: 'text',
        filename: 'Capstone review checklist',
        code:
          "RESPONSIVENESS\n[ ] Header/nav looks right at phone, tablet, desktop widths\n[ ] Habit list wraps/stacks correctly at every width\n[ ] Ask Momentum's chat thread and input are usable on a phone\n[ ] No text overflow or overlapping elements anywhere\n\nACCESSIBILITY\n[ ] Every <img> (if any) has meaningful alt text\n[ ] Tab reaches every interactive element in a logical order\n[ ] Focus is always visually clear\n[ ] Text has sufficient colour contrast against its background\n\nEDGE CASES\n[ ] 0 habits shows the empty state cleanly\n[ ] A very long habit name doesn't break the card layout\n[ ] Ask Momentum with no network shows a clear error, not a stuck spinner\n[ ] Rapidly clicking Add/Send doesn't create duplicates or break state\n\nPERFORMANCE / SEO\n[ ] Run Lighthouse (Chrome DevTools) on the live URL\n[ ] Note and address any high-impact warnings (e.g. oversized images)\n[ ] Confirm the OG preview card (Lesson 28) still renders correctly",
      },
      {
        language: 'tsx',
        filename: 'Example fix: a long habit name overflow',
        code:
          "// If a long habit name breaks the card layout, add text wrapping:\n<span className=\"font-semibold flex-1 min-w-0 break-words\">\n  {habit.name} · {habit.streak}d\n</span>",
      },
    ],
    placement:
      "Work through the checklist above systematically, section by section, across your ACTUAL deployed Momentum site (not just localhost — some issues only show up in production). Fix each issue you find directly in the relevant component file, redeploy, and re-check.",
    implementation:
      "This lesson's 'implementation' work IS the fixes you make while going through the checklist — every project surfaces different issues, so there's no single fixed code block. The example shown (min-w-0 break-words on a habit label) is a common real fix: flex children don't shrink below their content size by default, so a very long name can overflow; min-w-0 allows the flex item to shrink, and break-words wraps long text instead of overflowing. Apply this SAME systematic approach — find, understand why, fix minimally, re-test — to whatever your own review surfaces.",
    expectedResult:
      "A Momentum deployment that holds up cleanly across screen sizes, is fully keyboard-navigable, handles every edge case gracefully, and scores reasonably well on Lighthouse — genuinely ready for real visitors.",
    connects:
      "Momentum is now feature-complete AND polished. Lesson 30 is the final step: writing the portfolio case study and publicly launching the project you've built across this entire course.",
  },

  quiz: [
    { id: 'l29q1', kind: 'concept', prompt: 'Why do a dedicated whole-app review pass, if each feature was already tested during its own lesson?', options: ['It’s unnecessary busywork', 'Features can interact in ways individual testing misses; a full pass catches those', 'It’s only for finding typos', 'To slow down the project'], answerIndex: 1, explanation: "Integration issues between features often only surface when testing the whole app together." },
    { id: 'l29q2', kind: 'application', prompt: 'What’s the fastest way to test keyboard accessibility?', options: ['Read the code only', 'Navigate the entire page using only Tab/Shift+Tab/Enter, no mouse', 'Run Lighthouse only', 'Ask a friend to guess'], answerIndex: 1, explanation: "Directly testing with keyboard-only navigation reveals real accessibility gaps quickly." },
    { id: 'l29q3', kind: 'concept', prompt: 'Which of these is a genuine edge case worth testing?', options: ['A habit list with exactly 3 habits (the default)', 'Zero habits, or one with a very long name', 'The page loading normally', 'Clicking a button once'], answerIndex: 1, explanation: "Edge cases are unusual-but-valid states like empty data or extreme input, not the everyday default case." },
    { id: 'l29q4', kind: 'code_reading', prompt: 'What does min-w-0 do on a flex child, in this context?', options: ['Sets a fixed minimum width', 'Allows the flex item to shrink below its content’s natural width, letting text wrap properly', 'Hides the element', 'Increases font size'], answerIndex: 1, explanation: "Flex items default to not shrinking below their content size; min-w-0 removes that floor so wrapping/truncation can work." },
    { id: 'l29q5', kind: 'application', prompt: 'What does Lighthouse check, broadly?', options: ['Only spelling errors', 'Performance, accessibility, and SEO signals', 'Only your Git history', 'Database schema'], answerIndex: 1, explanation: "Lighthouse audits several quality dimensions, not just one narrow thing." },
    { id: 'l29q6', kind: 'debug', prompt: 'A habit card breaks its layout with an unusually long name. Likely underlying CSS issue?', options: ['Missing padding', 'A flex child not allowed to shrink/wrap (fixable with min-w-0 + break-words)', 'Wrong font', 'Missing a key prop'], answerIndex: 1, explanation: "This is the classic flexbox overflow issue addressed by allowing the item to shrink and wrap." },
    { id: 'l29q7', kind: 'application', prompt: 'Why test on the LIVE deployed site, not just localhost, during this review?', options: ['No real reason, they’re identical', 'Some issues (env vars, real network conditions, production build behaviour) only appear in the deployed version', 'localhost is always broken', 'It’s required by Vercel'], answerIndex: 1, explanation: "The production environment can surface issues (like missing env vars or real-world network conditions) that don't show up locally." },
    { id: 'l29q8', kind: 'concept', prompt: 'Why check colour contrast specifically?', options: ['It’s a cosmetic-only concern', 'Insufficient contrast makes text hard or impossible to read for many real users', 'It affects load speed only', 'It’s unrelated to accessibility'], answerIndex: 1, explanation: "Contrast is a core, measurable accessibility requirement affecting real readability." },
    { id: 'l29q9', kind: 'project', prompt: "Why does rapidly clicking 'Add' or 'Send' matter as a test case?", options: ['It never matters', 'It can reveal race conditions or duplicate submissions if guards (like a disabled state during loading) are missing', 'It’s only relevant to games', 'Buttons can’t be clicked twice technically'], answerIndex: 1, explanation: "Rapid clicking is a realistic way users interact, and it surfaces missing guards against duplicate/overlapping actions." },
    { id: 'l29q10', kind: 'concept', prompt: 'What is the overall goal of a capstone build sprint like this one?', options: ['Adding brand new features', 'Systematically finding and fixing issues across the whole app before launch', 'Rewriting the app from scratch', 'Removing all previous work'], answerIndex: 1, explanation: "A capstone sprint is about POLISH and QUALITY across what's already built, not new feature work." },
  ],

  homework: {
    task:
      "Complete the full capstone checklist from this lesson against your OWN deployed Momentum, documenting at least 3 issues you found (however small) and the fix you applied for each.",
    requirements: [
      "Go through every section of the checklist (responsiveness, accessibility, edge cases, performance) on your live site.",
      "Document at least 3 real findings with a before/after note (even minor ones count — e.g. 'button had no visible focus ring → added focus:ring-2').",
      "Redeploy after each fix and re-verify it's actually resolved.",
    ],
    expectedOutcome:
      "A short written log of real issues found and fixed on your live Momentum deployment — genuine evidence of a professional QA pass, not just a checklist ticked blindly.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 28,
      hint: "Lesson 28 asked you to add a custom favicon replacing the default Next.js icon.",
      steps: [
        "Design or find a simple square icon representing Momentum (a green circle or simplified ring works well).",
        "Export/save it as app/favicon.ico — Next.js automatically detects and uses a favicon.ico placed directly in the app/ folder.",
        "Restart your dev server (favicons can be aggressively cached) and check the browser tab.",
        "Redeploy and confirm the live site also shows the new icon.",
      ],
      codeGuidance: [
        {
          language: 'text',
          code:
            "No code needed — this is a file-placement task:\napp/\n  favicon.ico   <-- your custom icon goes here, Next.js picks it up automatically",
        },
      ],
    },
  },
};
