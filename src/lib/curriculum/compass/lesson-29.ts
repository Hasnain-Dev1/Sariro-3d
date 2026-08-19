import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 29 — Launch + Demo
 * Module 5 (Deploy + Capstone) · Lesson 29 of 30
 */
export const lesson29: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 4,
  globalNumber: 29,
  name: 'Launch + demo',
  title: 'Launch Day — Compass Goes Public',
  subtitle: "Share Compass publicly and prepare a confident live demo.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to prepare and deliver a confident live demo of an agent, and what 'launching' means for a personal AI project.",
    sections: [
      {
        heading: 'What launching Compass actually means',
        body:
          "Same as any personal project in this course: launching doesn't require thousands of users. It means Compass is genuinely live, public, and something you can confidently show anyone — a friend, a classmate, an interviewer — at any time.",
      },
      {
        heading: 'Preparing a demo — script the HAPPY PATH, know the edges',
        body:
          "For a live demo, plan 2-3 SPECIFIC things to show: a simple question (proves it works), a tool-using question (proves it can act), and a complex multi-part question (proves planning + reflection). Rehearse these exact examples beforehand — a live demo is not the moment to discover your calculator tool has a bug.",
      },
      {
        heading: 'What to do if something breaks live',
        body:
          "It will, eventually — that's normal, not a catastrophe. Having a calm, prepared response ('let me try that again' or 'here's what's happening — this is actually the retry logic kicking in') turns a hiccup into a chance to show you understand your own system, rather than a moment of panic.",
      },
      {
        heading: 'Explaining WHAT makes Compass interesting',
        body:
          "For someone watching a demo, the impressive part usually isn't 'it answers questions' — it's the VISIBLE reasoning (tool announcements, '[reasoning]' logs if shown), the planning breakdown for a complex task, and the fact it remembers things across the conversation. Point these out explicitly; they're easy to miss if you don't call them out.",
      },
      {
        heading: 'Sharing it for real',
        body:
          "The actual launch action: share the live URL somewhere real — a message, a post, a portfolio link. Optionally, ask someone to genuinely try it and give you their honest first impression, which is often more valuable feedback than anything you'd notice yourself.",
      },
    ],
    keyTerms: [
      { term: 'Launch (personal project)', definition: "Making a project publicly visible and usable — not a threshold of user count." },
      { term: 'Happy path demo', definition: "A rehearsed set of examples chosen to reliably showcase a system's real capabilities." },
    ],
    commonMistakes: [
      "Improvising a live demo with untested examples instead of rehearsing specific, known-good ones.",
      "Panicking or apologizing excessively when something breaks live, instead of calmly explaining what's happening.",
      "Only showing the simplest capability (a plain Q&A) and never demonstrating tools, planning, or memory.",
      "Never actually sharing the live link with anyone — the project stays 'launched' only in theory.",
      "Not asking anyone else to genuinely try it before considering the demo 'ready'.",
    ],
    takeaways: [
      "Launching means making the project genuinely public and shareable, not reaching a user-count milestone.",
      "Rehearse 2-3 specific demo examples covering simple, tool-using, and complex/planned questions.",
      "A calm, prepared response to a live failure demonstrates understanding, not weakness.",
      "Explicitly point out what's actually interesting — visible reasoning, planning, memory.",
      "Actually share the link and get real feedback from someone else.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Script your 3-example demo',
    objective:
      "Prepare and test the exact three examples you'd use in a live demo, confirming each one works reliably.",
    instructions: [
      "Choose one simple question, one tool-requiring question, and one genuinely complex multi-part question.",
      "Run each one against your deployed Compass and confirm they behave as expected.",
      "Write one sentence for each explaining WHAT it demonstrates.",
    ],
    code: [
      {
        language: 'text',
        code:
          "DEMO SCRIPT (fill in with your own tested examples):\n\n1. SIMPLE: \"What is the capital of Japan?\"\n   Demonstrates: basic Q&A, streaming response.\n\n2. TOOL USE: \"What is 847 times 23?\"\n   Demonstrates: real tool calling, grounded (not guessed) answers, visible reasoning.\n\n3. COMPLEX: \"Research three note-taking apps, compare their features, and recommend one for students.\"\n   Demonstrates: planning, multi-step execution, self-reflection, synthesis.",
      },
    ],
    explanation:
      "Testing each example AHEAD of time, against the real deployed system, is what separates a confident demo from a risky improvisation — you already know these three specific questions work, so a live audience sees exactly the capabilities you intend to show. Writing one sentence per example forces clarity on WHY each one matters, which is exactly what you'll say out loud while demoing — turning a vague 'watch this' into a specific, confident narration of what's actually happening.",
    expectedOutput:
      "A written 3-example script, each one pre-tested against your live deployment and confirmed working, with a clear one-sentence explanation of what it demonstrates.",
    learned: [
      "How to prepare a rehearsed, reliable demo script.",
      "Why testing examples ahead of time matters for confidence.",
      "How to articulate WHY a capability is interesting, not just show it.",
      "The concrete preparation step behind a good live demo.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass is genuinely launched — shared publicly for the first time, with a rehearsed demo ready to show anyone.",
    why:
      "This is the actual moment 30 lessons of building becomes real: not just deployed, but SHOWN to real people, with you confidently able to explain what it does and why.",
    fileLocation: "No new code — this lesson is about the launch ACTION itself",
    code: [
      {
        language: 'text',
        filename: 'Launch checklist',
        code:
          "[ ] Confirm the live URL works end-to-end (ask a real question right now)\n[ ] Have your 3 demo examples ready (from the mini-project)\n[ ] Know what to say if something breaks live (calm, specific explanation)\n[ ] Share the live URL somewhere real: a message, a post, a portfolio entry\n[ ] Ask at least one other person to try it and give honest first-impression feedback\n[ ] Note their feedback — even one sentence of what surprised or confused them is valuable",
      },
    ],
    placement:
      "This is an action-oriented final project, not a code change. Work through the checklist directly: confirm the deployment, rehearse the demo, then actually share the link and gather feedback.",
    implementation:
      "There's no code to write here — the 'implementation' is doing the launch itself: verifying the live system one more time, being ready to narrate your 3 rehearsed examples confidently, and following through on actually sharing the URL rather than just having it exist. The feedback-gathering step matters more than it might seem: a fresh pair of eyes on Compass will notice something you've become blind to after 29 lessons of close familiarity — genuinely useful signal for any final polish.",
    expectedResult:
      "A real, live, working Compass, shared publicly for the first time, with real feedback from at least one other person — the actual launch, not just a deployment.",
    connects:
      "Compass is live and shared. Lesson 30, the course finale, is about writing the portfolio case study — turning this entire 30-lesson build into a story you can tell clearly, in an interview or on a resume.",
  },

  quiz: [
    { id: 'c29q1', kind: 'concept', prompt: 'What does "launching" a personal AI project actually require?', options: ['Thousands of users', 'Making it genuinely public and shareable — a real, live thing anyone can try', 'A funding round', 'A dedicated marketing campaign'], answerIndex: 1, explanation: "Launch here means real, public availability — not a user-count milestone." },
    { id: 'c29q2', kind: 'application', prompt: 'Why rehearse specific demo examples ahead of time instead of improvising live?', options: ['Improvisation is always better', 'Pre-tested examples are known to work, giving confidence instead of risking an untested question failing live', 'Rehearsal is unnecessary for a working system', 'It’s required by the course'], answerIndex: 1, explanation: "Testing examples in advance removes the risk of an untested question failing during a live demo." },
    { id: 'c29q3', kind: 'concept', prompt: 'What SHOULD you do if something breaks during a live demo?', options: ['Panic and apologize repeatedly', 'Calmly explain what’s happening (e.g. retry logic in action) and try again', 'End the demo immediately', 'Pretend it didn’t happen'], answerIndex: 1, explanation: "A calm, informed response demonstrates genuine understanding of your own system rather than distress." },
    { id: 'c29q4', kind: 'application', prompt: 'What are the THREE example types recommended for a demo script?', options: ['Only simple questions, repeated three times', 'A simple question, a tool-using question, and a complex multi-part question', 'Three identical questions', 'Only failure scenarios'], answerIndex: 1, explanation: "These three cover the range of Compass's real capabilities: basic Q&A, tool use, and planning." },
    { id: 'c29q5', kind: 'concept', prompt: 'Why explicitly POINT OUT things like visible reasoning or planning during a demo?', options: ['They’re self-explanatory and don’t need mentioning', 'These details are easy for a viewer to miss if not called out, even though they’re genuinely impressive', 'It’s unnecessary showmanship with no real value', 'Only the final answer matters, nothing else'], answerIndex: 1, explanation: "Narrating what's actually happening helps a viewer appreciate capabilities they might otherwise overlook." },
    { id: 'c29q6', kind: 'application', prompt: 'Why is asking someone else to try Compass valuable, beyond your own testing?', options: ['It isn’t valuable, self-testing is sufficient', 'A fresh perspective often notices something you’ve become blind to after extended close familiarity', 'Other people always find more bugs than you', 'It’s only useful for marketing purposes'], answerIndex: 1, explanation: "Fresh eyes provide genuinely different, useful feedback that self-testing after long familiarity often misses." },
    { id: 'c29q7', kind: 'output', prompt: 'What should you confirm FIRST, before starting a live demo?', options: ['Nothing, just start talking', 'That the live URL actually works end-to-end right now', 'That you have exactly 10 minutes', 'That the audience has read the source code'], answerIndex: 1, explanation: "A last-moment sanity check of the live deployment avoids demoing against something that's currently broken." },
    { id: 'c29q8', kind: 'debug', prompt: 'A demo audience member asks a question NOT in your rehearsed script and Compass handles it oddly. What’s the reasonable response?', options: ['Refuse to answer any unscripted questions', 'Acknowledge it honestly as an edge case and move on, or explain what might be happening', 'End the demo immediately', 'Claim it’s working perfectly regardless'], answerIndex: 1, explanation: "Honest, calm handling of an unexpected result is more credible than pretending everything is flawless." },
    { id: 'c29q9', kind: 'project', prompt: "Why does this lesson's final project have no code to write?", options: ['An error in the course', 'Because the actual deliverable is the ACTION of launching — verifying, demoing, and sharing — not new functionality', 'Code is optional in this course', 'It’s a placeholder lesson with no real content'], answerIndex: 1, explanation: "This lesson deliberately focuses on the real-world action of launching, distinct from a coding task." },
    { id: 'c29q10', kind: 'concept', prompt: 'What is the final lesson of the course (30) about?', options: ['Adding a new feature', 'Writing the portfolio case study documenting the entire build', 'Redeploying to a different platform', 'Starting a new project from scratch'], answerIndex: 1, explanation: "Lesson 30 closes the course with the written reflection/case study, the course finale." },
  ],

  homework: {
    task:
      "Record (even just for yourself) a 2-3 minute practice run of your demo script, timing it, and note one thing you'd improve about your delivery or the examples chosen.",
    requirements: [
      "Run through your 3 demo examples out loud, as if presenting to someone.",
      "Time the full run — aim for roughly 2-3 minutes.",
      "Write one honest note about what you'd improve (pacing, example choice, explanation clarity).",
    ],
    expectedOutcome:
      "A timed, practiced run-through of your demo, with one genuine self-identified improvement — real preparation, not just a mental plan.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 28,
      hint: "Lesson 28 asked you to complete the full capstone checklist against your live Compass, documenting at least 3 real findings and fixes.",
      steps: [
        "Work through each section (tool safety, memory, planning, cost, resilience, UI) against your actual deployed URL.",
        "For each section, try to break something on purpose (adversarial tool input, two browser sessions, a forced tool failure, etc.).",
        "Document at least 3 genuine findings with a short before/after note for each, redeploying and re-verifying as you go.",
      ],
      codeGuidance: [
        {
          language: 'text',
          code:
            "Example finding log entry:\n\nISSUE: Calculator tool error message included the raw regex pattern, confusing to a user.\nFIX: Changed the error string to a plain-language message: \"That doesn't look like a valid math expression.\"\nVERIFIED: Tested with a non-arithmetic input on the live site — clean, user-friendly error now shows.",
        },
      ],
    },
  },
};
