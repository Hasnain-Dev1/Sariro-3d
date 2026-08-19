import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 30 — Portfolio Write-Up
 * Module 5 (Deploy + Capstone) · Lesson 30 of 30 — COURSE FINALE
 */
export const lesson30: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 5,
  globalNumber: 30,
  name: 'Portfolio write-up',
  title: 'The Case Study — Compass, Complete',
  subtitle: "Write your case study and look back at the AI agent you built from scratch.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to write a case study that communicates real AI-engineering skill, and reflect on the complete architecture Compass ended up with.",
    sections: [
      {
        heading: 'Why the write-up matters as much as the code',
        body:
          "A recruiter or interviewer usually reads a short WRITE-UP before ever opening your code. A good case study turns 30 lessons of genuine engineering work into a story someone can understand in two minutes — and for an AI agent specifically, it's your chance to show you understand CONCEPTS (tool use, RAG, planning), not just that you called an API.",
      },
      {
        heading: 'A case study structure suited to an agent project',
        body:
          "(1) What it is — one sentence. (2) The problem — why build an agent, not just a chatbot? (3) Key capabilities — tools, memory, planning; 3-5 bullets. (4) Architecture — the request path through your system. (5) A genuine technical challenge — one real hard problem (streaming, safe tool execution, session isolation, plan+reflect) and how you solved it. (6) What you'd build next.",
      },
      {
        heading: 'Naming the concepts, not just the features',
        body:
          "'Compass can search the web' is a feature description. 'Compass uses tool calling with input validation and a dispatch pattern, wrapped in a resilient retry loop' names the actual ENGINEERING — this is what signals real understanding to someone technical reading your write-up, versus someone who followed a tutorial without grasping why.",
      },
      {
        heading: 'Talking about Compass in an interview',
        body:
          "Prepare a 60-90 second verbal version: what Compass does, ONE architectural decision you're proud of (like separating planning from execution, or the layered memory system), and ONE genuinely hard problem you solved. Practising this out loud, at least once, makes a real difference over improvising cold.",
      },
      {
        heading: 'Reflecting on the full journey',
        body:
          "Lesson 1 was a single, unremarkable API call answering one question. Thirty lessons later, Compass reasons explicitly, uses real tools safely, remembers across sessions with a genuine vector-based long-term memory, plans and self-corrects on complex tasks, and runs live on the internet for multiple simultaneous users. Every one of those capabilities was learned by BUILDING it into one real, continuously evolving agent — worth pausing to actually recognise how far that is.",
      },
    ],
    keyTerms: [
      { term: 'Case study', definition: "A short write-up explaining a project's problem, architecture, and outcome for a portfolio audience." },
      { term: 'Architecture summary', definition: "A concise description of how a request flows through a system's components." },
      { term: 'Technical challenge (in a write-up)', definition: "One specific hard problem solved, described concretely — a strong signal of genuine understanding." },
    ],
    commonMistakes: [
      "Describing Compass only by its FEATURES ('it can search the web') instead of the underlying ENGINEERING ('tool calling with validated dispatch').",
      "Never actually sharing the write-up anywhere it can be found (a repo README, a portfolio site).",
      "Being unable to explain a technical challenge concretely in an interview, only vaguely.",
      "Skipping the 'what's next' section, missing the chance to show ongoing thinking rather than a finished checklist.",
      "Comparing a first real agent project unfavorably to mature, team-built products instead of judging it on its own genuine merits.",
    ],
    takeaways: [
      "A case study communicates PROBLEM, ARCHITECTURE, and a genuine technical CHALLENGE — not just a feature list.",
      "Name the actual engineering concepts (tool calling, RAG-style retrieval, plan+reflect), not just surface features.",
      "Prepare and practise a short verbal pitch for interviews.",
      "Compass's full journey — one continuously evolving agent — is itself worth naming as your learning approach.",
      "The write-up is as much a real deliverable as the working code.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Translate features into engineering language',
    objective:
      "Practise the skill of naming concepts (not just features) by rewriting 4 feature descriptions as genuine technical statements.",
    instructions: [
      "Write 4 plain feature descriptions of Compass (e.g. 'it can do math').",
      "Rewrite each as the actual engineering concept behind it.",
      "Compare — notice how much more it signals real understanding.",
    ],
    code: [
      {
        language: 'text',
        code:
          "FEATURE -> ENGINEERING LANGUAGE\n\n\"It can do math and search the web.\"\n-> \"Implements tool calling with a JSON-schema-defined tool set, input validation,\n    and a dispatch function routing to individual tool implementations.\"\n\n\"It remembers things.\"\n-> \"Layered memory: session-scoped conversation history with sliding-window and\n    LLM-based summarization for bounded growth, plus long-term memory via\n    embeddings and cosine-similarity retrieval — a lightweight RAG pipeline.\"\n\n\"It can handle complicated requests.\"\n-> \"Uses a Plan+Execute pattern: task decomposition into ordered steps, per-step\n    execution through the full agent loop, and a bounded self-reflection/revision\n    cycle before returning a synthesized answer.\"\n\n\"It doesn't crash.\"\n-> \"Resilience via exponential-backoff retries, step-level error isolation in\n    multi-step plans, and graceful degradation with clear user-facing messages\n    at every layer.\"",
      },
    ],
    explanation:
      "Each rewrite keeps the SAME underlying truth but replaces vague, feature-level language with the actual technical vocabulary from the lessons that built it — 'tool calling', 'dispatch function', 'sliding window', 'RAG pipeline', 'Plan+Execute', 'exponential backoff'. This isn't jargon for its own sake — using the RIGHT term precisely (because you genuinely understand what it means, having built it) is exactly what distinguishes real engineering communication from a marketing-style feature list, and it's the single biggest lever for how a technical reader perceives your case study.",
    expectedOutput:
      "Four side-by-side comparisons showing the same capability described first vaguely, then with genuine, specific engineering vocabulary.",
    learned: [
      "How to translate a feature description into precise technical language.",
      "Why specific vocabulary signals real understanding to a technical reader.",
      "A direct, practiced way to write about your own project more effectively.",
      "The exact skill needed for a strong case-study write-up.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "A complete, engineering-focused case study for Compass, published alongside the live agent — the final deliverable of the entire course.",
    why:
      "This is the artifact most likely to actually get read by someone deciding whether to talk to you further — turning 30 lessons of real agent-engineering work into a story that proves genuine understanding.",
    fileLocation: "CASE-STUDY.md (new, at the project root) — plus ensuring the live link and write-up are both discoverable",
    code: [
      {
        language: 'text',
        filename: 'CASE-STUDY.md template',
        code:
          "# Compass — an AI Research & Task Agent\n\n**Live:** https://your-compass-url.vercel.app\n**Code:** https://github.com/your-username/compass-web\n\n## What it is\nCompass is a personal AI agent — not just a chatbot — built from scratch across a\n30-lesson course: one continuously evolving agent, from a single API call to a\ndeployed, multi-user, tool-using, memory-aware, self-reflecting system.\n\n## The problem\nMost AI demos are chatbots: question in, text out. Compass is built as a genuine\nAGENT — it can take real actions (tools), remember across sessions, and break\ndown and work through complex, multi-part tasks, not just answer one question\nat a time.\n\n## Key capabilities\n- Tool calling (calculator, text analysis, web search) with input validation and safe dispatch\n- Layered memory: session history, bounded via summarization, plus long-term memory via embeddings and similarity search\n- ReAct-style explicit reasoning and Chain-of-Thought for tricky questions\n- Plan + Execute: task decomposition, per-step execution, self-reflection and revision\n- Deployed as a multi-user web app with per-session isolation and structured logging\n\n## Architecture\n[Write 2-3 sentences describing the request path: browser -> API route -> shared\nagent logic (tools/memory/planning) -> Claude API, and back.]\n\n## A genuine technical challenge\n[Write 2-4 sentences about ONE real challenge — e.g. keeping conversation history\nbounded without losing meaning, safely executing tools against untrusted model\noutput, or isolating memory across concurrent web sessions — and how you solved it.]\n\n## What I'd build next\n[1-2 sentences — e.g. adaptive re-planning when a step fails, or a real vector\ndatabase instead of the file-based store, for genuine production scale.]",
      },
    ],
    placement:
      "Create CASE-STUDY.md at the project root, filling in the template with YOUR real details — especially the architecture and challenge sections, written specifically and honestly, not generically. Commit and push it so it's visible on GitHub, and make sure the live URL from Lesson 29 is linked from wherever you keep your portfolio.",
    implementation:
      "This file is the communication layer around 30 lessons of genuine agent-engineering work — the mini-project's skill (naming concepts precisely) is what makes the KEY CAPABILITIES and TECHNICAL CHALLENGE sections actually convincing rather than generic. The architecture section forces you to describe the real request path in your own words — proof you understand the system's shape, not just that individual pieces work. Filling in the challenge section HONESTLY (a real problem, concretely described) is what separates a case study that proves understanding from one that just lists technologies used.",
    expectedResult:
      "A real, live, deployed, tool-using, memory-aware, planning AI agent — with a proper, technically-precise case study documenting it — ready to share with anyone evaluating your skills.",
    connects:
      "This closes the loop that started at Lesson 1, 'What Is an AI Agent? Meet Compass.' Every concept since — tools, memory, planning, deployment — was learned by building it into ONE real, continuously evolving agent. There is no Lesson 31. From here, Compass is yours to keep extending, and the underlying skills — tool calling, RAG-style memory, agentic planning, production deployment — transfer directly to any future AI system you build.",
  },

  quiz: [
    { id: 'c30q1', kind: 'concept', prompt: 'What is the primary purpose of a case study for an AI agent portfolio project?', options: ['To list every line of code written', 'To communicate the problem, architecture, and a genuine technical challenge to a reader who won’t read the full code', 'To replace the README entirely', 'It has no real purpose beyond decoration'], answerIndex: 1, explanation: "A case study is a communication artifact for someone quickly evaluating the project's substance." },
    { id: 'c30q2', kind: 'application', prompt: 'Why describe Compass using terms like "tool calling with a dispatch function" rather than just "it can do math"?', options: ['It’s unnecessary jargon with no benefit', 'Specific, accurate technical language signals genuine understanding of the underlying engineering, not just surface features', 'Feature descriptions are always preferred by technical readers', 'There’s no meaningful difference'], answerIndex: 1, explanation: "Precise vocabulary, used correctly because you actually built the thing, is a strong signal of real understanding." },
    { id: 'c30q3', kind: 'concept', prompt: 'What makes a "technical challenge" section strong in a write-up?', options: ['Listing every technology used', 'Describing ONE specific hard problem and concretely how it was solved', 'Being as vague as possible to sound impressive', 'Skipping it entirely to save space'], answerIndex: 1, explanation: "Specificity and concreteness signal real understanding far more than a generic list." },
    { id: 'c30q4', kind: 'application', prompt: 'Why is an architecture summary (the request path) a valuable section?', options: ['It’s optional filler', 'It proves you understand how the SYSTEM fits together, not just that individual pieces work in isolation', 'Architecture is unrelated to case studies', 'It should be as detailed as the actual source code'], answerIndex: 1, explanation: "Describing the overall shape of the system demonstrates holistic understanding beyond individual features." },
    { id: 'c30q5', kind: 'concept', prompt: 'Why practise a 60-90 second verbal pitch out loud before an interview?', options: ['It’s unnecessary if the write-up exists', 'Speaking aloud reveals awkward phrasing/timing issues that silent reading doesn’t, building genuine confidence', 'Verbal pitches are never actually asked for', 'It replaces the need for a written case study'], answerIndex: 1, explanation: "Practising aloud surfaces delivery issues and builds confidence for the real interview moment." },
    { id: 'c30q6', kind: 'application', prompt: 'Which case-study section shows growth mindset rather than just describing what’s finished?', options: ['Key capabilities', 'What I’d build next', 'The live link', 'The architecture diagram'], answerIndex: 1, explanation: "A forward-looking section signals ongoing engineering thinking, not just a completed checklist." },
    { id: 'c30q7', kind: 'concept', prompt: 'What does Compass’s FULL journey — Lesson 1 to Lesson 30 — actually demonstrate about how this course teaches?', options: ['Disconnected, unrelated exercises', 'Every concept was learned by building ONE real, continuously evolving agent, with each lesson adding a genuine capability', 'Pure theory with no application', 'A focus on memorization over building'], answerIndex: 1, explanation: "The entire 30-lesson arc intentionally built one continuous agent, giving every concept immediate, real application." },
    { id: 'c30q8', kind: 'application', prompt: 'Why fill in the architecture and challenge sections with YOUR specific details rather than generic placeholders?', options: ['Generic text is equally convincing', 'Specific, honest detail is what makes a case study credible and demonstrates real, personal understanding of what was built', 'These sections are optional and rarely read', 'Templates should never be customized'], answerIndex: 1, explanation: "Genuine specificity is what separates a convincing case study from a hollow template." },
    { id: 'c30q9', kind: 'project', prompt: "Why is CASE-STUDY.md described as 'as much a real deliverable as the working code'?", options: ['It’s not actually important', "Because it's often the FIRST thing a recruiter or interviewer reads, and it's what makes 30 lessons of engineering legible to someone who won't read the code", 'Code always speaks for itself with no need for explanation', 'Write-ups are only needed for non-technical audiences'], answerIndex: 1, explanation: "The write-up is frequently the actual first (and sometimes only) thing evaluated before someone decides to look deeper." },
    { id: 'c30q10', kind: 'concept', prompt: 'What is the honest, healthy way to judge Compass relative to large, mature commercial AI products?', options: ['It should be dismissed as inferior by comparison', 'On its own genuine merits — as a real, working, first agent project demonstrating YOUR growth — not against companies with large teams and years of investment', 'It should be directly compared to enterprise-scale platforms', 'Comparison is meaningless and shouldn’t be considered at all'], answerIndex: 1, explanation: "Fairly judging a first real project on what it demonstrates about personal growth is far more useful than an unfair comparison." },
  ],

  homework: {
    task:
      "Actually share Compass's live link and case study publicly for the first time — a message to a friend or family member, a LinkedIn/social post, or adding it to an existing portfolio site — and write one honest sentence reflecting on what felt hardest across the whole 30-lesson build.",
    requirements: [
      "Share the real, live URL and/or the case study somewhere outside your own notes.",
      "Write one honest sentence about the hardest part of the whole course for you personally.",
      "Optionally: ask one person to actually try Compass and tell you their first impression.",
    ],
    expectedOutcome:
      "Compass, genuinely shared publicly for the first time — and a moment of honest reflection on 30 lessons of real agent-engineering, marking the end of Agent Architect — Beginner.",
    extends: 'both',
    previousHomeworkHint: {
      forLessonNumber: 29,
      hint: "Lesson 29 asked you to record a timed, 2-3 minute practice run of your demo script and note one thing you'd improve.",
      steps: [
        "Run through your 3 pre-tested demo examples (simple, tool-using, complex) out loud, as if presenting live.",
        "Time the full run-through — aim for roughly 2-3 minutes total.",
        "Afterward, write one honest, specific note about what you'd improve (e.g. pacing, a clearer explanation of the planning step, a better simple-question example).",
      ],
      codeGuidance: [
        {
          language: 'text',
          code:
            "Example self-review note:\n\n\"My complex-question demo took almost 90 seconds on its own because I didn't\nexplain the planning step out loud while it was happening — next time I'll\nnarrate 'it's breaking this into steps now' as soon as the plan starts, so the\nwait feels purposeful instead of silent.\"",
        },
      ],
    },
  },
};
