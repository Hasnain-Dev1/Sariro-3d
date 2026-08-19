import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 30 — Launch + Portfolio Write-Up
 * Module 5 (Deploy + Capstone) · Lesson 30 of 30 — COURSE FINALE
 */
export const lesson30: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 5,
  lessonIndex: 5,
  globalNumber: 30,
  name: 'Launch + portfolio write-up',
  title: 'Launch Day — Momentum Goes Live',
  subtitle: "Write your case study, ship it publicly, and look back at everything you built.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to write a portfolio case study that actually communicates your skills, prepare to talk about Momentum in an interview, and understand what 'launching' really means for a personal project.",
    sections: [
      {
        heading: 'Why a case study matters more than the code itself',
        body:
          "A recruiter or interviewer will rarely read your full source code first — they'll read a short WRITE-UP about the project, then maybe click through. A good case study explains the PROBLEM Momentum solves, the DECISIONS you made and why, and the OUTCOME — turning 30 lessons of work into a story someone can understand in two minutes.",
      },
      {
        heading: 'The structure of a strong case study',
        body:
          "A reliable shape: (1) What it is — one sentence. (2) The problem — why does this exist? (3) Key features — 3-5 bullets, not an exhaustive list. (4) Tech stack — what you used and, briefly, why. (5) A technical challenge — one specific hard problem you solved (streaming, immutable state, prompt engineering — you have plenty of real options from this course) and HOW you solved it. (6) What you'd do next — shows growth mindset, not just 'I'm done'.",
      },
      {
        heading: 'Talking about Momentum in an interview',
        body:
          "Interviewers often ask 'walk me through a project you built.' Prepare a 60-90 second verbal version of your case study: what it does, one technical decision you're proud of, and one thing that was genuinely hard and how you solved it. Practising this OUT LOUD once or twice beforehand makes a real difference versus improvising cold.",
      },
      {
        heading: 'What "launching" a personal project actually means',
        body:
          "You don't need thousands of users for Momentum to count as 'launched' — sharing it publicly (a tweet, a LinkedIn post, sending the link to friends and family) is the launch. The goal isn't virality; it's having a REAL, live, working thing you can point anyone to, at any time, that represents what you can build.",
      },
      {
        heading: 'Reflecting on the journey',
        body:
          "You started at Lesson 1 with a blank HTML file and no CSS. By Lesson 30, Momentum is a deployed, AI-powered, persisted, responsive, accessible Next.js application with a real domain. Every concept — the box model, functions, React state, streaming, DNS — was learned by BUILDING one real, continuous product. That's the whole philosophy of this course, and it's worth pausing to actually recognise how far that is.",
      },
    ],
    keyTerms: [
      { term: 'Case study', definition: "A short write-up explaining a project's problem, decisions, and outcome for a portfolio audience." },
      { term: 'Technical challenge (in a write-up)', definition: "One specific hard problem you solved, described concretely — a strong signal of real understanding." },
      { term: 'Elevator pitch', definition: "A short, rehearsed verbal summary of a project, ready for an interview or casual conversation." },
      { term: 'Launch (personal project)', definition: "Making a project publicly visible/shareable — not a threshold of user count." },
    ],
    commonMistakes: [
      "Writing a case study that's just a feature list with no explanation of WHY decisions were made.",
      "Never actually sharing the live link with anyone — the project stays 'launched' only in theory.",
      "Being unable to explain a technical challenge concretely in an interview, only vaguely ('I used React').",
      "Treating the case study as an afterthought instead of a real communication skill worth practising.",
      "Comparing your first real project to huge, mature products instead of judging it on its own genuine merits.",
    ],
    takeaways: [
      "A case study communicates the PROBLEM, DECISIONS, and OUTCOME — not just a feature list.",
      "Prepare and practise a short verbal pitch for interviews.",
      "Launching a personal project means making it real and shareable — not chasing user count.",
      "Describing one concrete technical challenge (and its solution) is a strong signal of genuine understanding.",
      "This course's whole arc — ONE product, built lesson by lesson — is itself worth naming as your learning approach.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Draft your 90-second pitch',
    objective:
      "Practise turning a project into a short, clear verbal pitch — a genuinely transferable interview skill, not just a Momentum-specific exercise.",
    instructions: [
      "Write out, in plain sentences (not bullet points), a 90-second spoken pitch for Momentum.",
      "Cover: what it is, one technical decision you made, and one real challenge you solved.",
      "Read it out loud and time yourself — trim if it runs long.",
      "Say it out loud a SECOND time without reading, from memory/understanding.",
    ],
    code: [
      {
        language: 'text',
        code:
          "EXAMPLE STRUCTURE (fill in with your own real details):\n\n\"Momentum is an AI-powered habit tracker I built from scratch — it's a Next.js app\nwhere you track daily habits, keep streaks alive, and chat with an AI coach that\nknows your actual habit data.\n\nOne decision I'm proud of is rebuilding it TWICE — first in vanilla JavaScript with\nmanual DOM updates, then in React. That let me really understand WHY React exists,\ninstead of just being told to use it.\n\nThe hardest part was streaming the AI's replies in real time instead of making the\nuser wait for the whole response. I had to learn how ReadableStreams work on both\nthe server and client, and build the UI so the reply visibly types itself in.\"",
      },
    ],
    explanation:
      "This isn't about memorising a script word-for-word — it's about having the SHAPE of the pitch internalised (what/decision/challenge) so you can speak confidently about Momentum without freezing up. Saying it out loud twice, the second time without reading, is what actually builds that confidence; reading silently in your head doesn't reveal awkward phrasing or timing issues the way speaking aloud does. This exact skill transfers directly to real interviews, where you'll be asked this question in some form almost every time.",
    expectedOutput:
      "A written pitch you can deliver comfortably in under 90 seconds, covering what Momentum is, one real decision, and one real challenge — practised out loud at least twice.",
    learned: [
      "How to structure a concise project pitch.",
      "Why speaking a pitch aloud reveals issues silent reading doesn't.",
      "How to pick ONE genuine technical challenge worth highlighting.",
      "A transferable interview-prep skill, not just a Momentum exercise.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "A complete, written case study for Momentum, and a public launch — sharing the live link for the first time.",
    why:
      "This is the final deliverable of the entire course: not just a working app, but a properly PRESENTED one, publicly shared — the actual artifact a portfolio, resume, or LinkedIn profile needs.",
    fileLocation: "CASE-STUDY.md (new, at the project root) — plus actually sharing the live URL",
    code: [
      {
        language: 'text',
        filename: 'CASE-STUDY.md template',
        code:
          "# Momentum — AI-Powered Habit Tracker\n\n**Live:** https://your-domain-or-vercel-url.com\n**Code:** https://github.com/your-username/momentum-app\n\n## What it is\nMomentum is a habit-tracking app with an AI coach, built from scratch across a\n30-lesson course — one continuous project from a blank HTML file to a deployed,\nAI-powered Next.js app on a real domain.\n\n## The problem\nMost habit trackers are either too simple (a plain checklist) or too complex.\nMomentum focuses on one thing done well: track habits, see your streak, and get\nreal, personal encouragement from an AI that actually knows your data.\n\n## Key features\n- Habit tracking with live streak counting\n- Full persistence (localStorage) — nothing is ever lost on refresh\n- Ask Momentum: a streaming AI coach (Claude API) that references your real habits\n- Fully responsive, keyboard-accessible, branded UI\n\n## Tech stack\nNext.js (App Router) · React · TypeScript · Tailwind CSS · Claude API (Anthropic) · Vercel\n\n## A technical challenge\n[Write 2-3 sentences about ONE real challenge — e.g. immutable state updates,\nstreaming responses, or the load/save localStorage race condition from Lesson 18 —\nand how you solved it.]\n\n## What I'd build next\n[1-2 sentences — e.g. a real database + accounts so habits sync across devices,\nor weekly AI-generated progress summaries.]",
      },
    ],
    placement:
      "Create CASE-STUDY.md at the project root, fill in the template with YOUR real details (especially the technical-challenge and what's-next sections — make these genuinely specific to your build, not generic). Commit and push it so it's visible on GitHub. Then: actually share the live URL somewhere real — a message to a friend, a LinkedIn post, or simply saving it prominently in your own portfolio notes.",
    implementation:
      "This file is deliberately NOT application code — it's the communication layer around 30 lessons of real engineering work, and it's just as much a deliverable as the app itself. The template mirrors the concept lesson's structure exactly: what/problem/features/stack/challenge/next. Filling the CHALLENGE section honestly (not vaguely) is what separates a case study that proves real understanding from one that just lists technologies. This is the single artifact most likely to actually get read by someone deciding whether to talk to you further.",
    expectedResult:
      "A real, live, deployed, AI-powered, responsive, accessible Momentum app — with a proper case study documenting it — publicly shared for the first time. The course's flagship project, complete.",
    connects:
      "This closes the loop that started at Lesson 1, 'Your First Web Page.' Everything since has been one continuous build. There is no Lesson 31 — from here, Momentum is yours to keep extending, and the skills (HTML/CSS, JavaScript, React, AI integration, deployment) transfer directly to any future project you build.",
  },

  quiz: [
    { id: 'l30q1', kind: 'concept', prompt: 'What is the primary purpose of a case study for a portfolio project?', options: ['To list every line of code written', 'To communicate the problem, decisions, and outcome clearly to someone who won’t read the full code', 'To replace the README', 'It has no real purpose'], answerIndex: 1, explanation: "A case study is a communication artifact aimed at someone quickly evaluating the project." },
    { id: 'l30q2', kind: 'application', prompt: 'What makes a "technical challenge" section strong in a write-up?', options: ['Listing every technology used', 'Describing ONE specific hard problem and concretely how it was solved', 'Being as vague as possible', 'Skipping it entirely'], answerIndex: 1, explanation: "Specificity signals real understanding far more than a generic list of tools." },
    { id: 'l30q3', kind: 'concept', prompt: 'What does "launching" mean for a personal project like Momentum?', options: ['Reaching 10,000 users', 'Making it publicly visible/shareable — a real, live thing you can point anyone to', 'Getting funded', 'Winning an award'], answerIndex: 1, explanation: "Launch here means the project genuinely exists publicly, not a user-count milestone." },
    { id: 'l30q4', kind: 'application', prompt: 'Why practise a project pitch OUT LOUD rather than just writing it?', options: ['It’s unnecessary, writing is enough', 'Speaking aloud reveals awkward phrasing and timing issues silent reading doesn’t', 'It’s required by recruiters specifically', 'It makes the project better technically'], answerIndex: 1, explanation: "Verbal delivery surfaces problems (pacing, unclear phrasing) that reading silently hides." },
    { id: 'l30q5', kind: 'concept', prompt: 'Which case-study section shows growth mindset rather than just describing what’s done?', options: ['Tech stack', 'What I’d build next', 'Live link', 'Key features'], answerIndex: 1, explanation: "A 'what's next' section signals ongoing thinking about the project, not just a finished checklist." },
    { id: 'l30q6', kind: 'application', prompt: 'In a 90-second interview pitch, what’s a reasonable structure?', options: ['A full walkthrough of every file', 'What it is, one decision made, one real challenge solved', 'Only the tech stack list', 'Apologizing for imperfections'], answerIndex: 1, explanation: "A concise what/decision/challenge structure fits the time and gives concrete, memorable substance." },
    { id: 'l30q7', kind: 'concept', prompt: 'Why does rebuilding Momentum TWICE (vanilla JS, then React) make a strong talking point?', options: ['It doesn’t — it’s wasted effort', 'It demonstrates genuinely understanding WHY React solves real problems, not just following tutorials', 'React is objectively better so there’s nothing to explain', 'It shows indecision'], answerIndex: 1, explanation: "Having felt the pain React solves (from Module 2) is a concrete, understood reason, not a cargo-culted choice." },
    { id: 'l30q8', kind: 'application', prompt: 'Where should the case study live so it’s actually discoverable?', options: ['A private note only you can see', 'Committed to the project repo (e.g. CASE-STUDY.md) and/or linked from a portfolio', 'Deleted after writing', 'Only spoken, never written'], answerIndex: 1, explanation: "It needs to be visible/discoverable to actually serve its purpose for recruiters or collaborators." },
    { id: 'l30q9', kind: 'project', prompt: "What does Momentum's full journey — Lesson 1 to Lesson 30 — actually demonstrate about the course's teaching approach?", options: ['Random unrelated exercises', 'Every concept was learned by building ONE real, continuously evolving product', 'Only theory, no application', 'A focus on memorization over building'], answerIndex: 1, explanation: "The entire 30-lesson arc intentionally built one continuous product, so every concept had immediate, real application." },
    { id: 'l30q10', kind: 'concept', prompt: 'What is the honest, healthy way to compare Momentum to large, mature products?', options: ['It should be judged as inferior and dismissed', 'On its own genuine merits — a real, working, first project — not against companies with large teams and years of work', 'It should be compared directly to enterprise SaaS', 'Comparison is irrelevant, don’t think about it at all'], answerIndex: 1, explanation: "Judging a first real project fairly (what it demonstrates about YOUR growth) is more useful than an unfair comparison to mature products." },
  ],

  homework: {
    task:
      "Actually share Momentum's live link publicly for the first time — a message to a friend or family member, a LinkedIn/social post, or adding it to an existing portfolio site — and write one sentence reflecting on what felt hardest across the whole 30-lesson build.",
    requirements: [
      "Share the real, live URL somewhere outside your own notes (a message, a post, a portfolio entry).",
      "Write one honest sentence about the hardest part of the whole course for you personally.",
      "Optionally: ask one person to actually try Momentum and tell you their first impression.",
    ],
    expectedOutcome:
      "Momentum, genuinely shared publicly for the first time — and a moment of honest reflection on 30 lessons of real building, marking the end of Web Builder Pro — Beginner.",
    extends: 'both',
    previousHomeworkHint: {
      forLessonNumber: 29,
      hint: "Lesson 29 asked you to complete the full capstone review checklist on your live site and document at least 3 real issues found and fixed.",
      steps: [
        "Go through each section of Lesson 29's checklist (responsiveness, accessibility, edge cases, performance) directly against your deployed URL.",
        "For each issue you find, note it, fix it in the relevant file, and redeploy.",
        "Write a short before/after note for at least 3 findings — even small ones, like a missing focus ring or an overflowing long name.",
        "Re-verify each fix actually resolved the issue on the live site, not just locally.",
      ],
      codeGuidance: [
        {
          language: 'text',
          code:
            "Example finding log entry:\n\nISSUE: Add-habit button had no visible keyboard focus indicator.\nFIX: Added `focus:outline-none focus:ring-2 focus:ring-brand` to the button's className.\nVERIFIED: Tabbed to the button on the live site — a clear green ring now appears.",
        },
      ],
    },
  },
};
