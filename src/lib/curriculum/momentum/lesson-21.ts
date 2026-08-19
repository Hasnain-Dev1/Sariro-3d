import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 21 — Prompt Engineering Basics
 * Module 4 (AI Features) · Lesson 21 of 30
 */
export const lesson21: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 4,
  lessonIndex: 2,
  globalNumber: 21,
  name: 'Prompt engineering basics',
  title: 'Prompt Engineering — Directing Ask Momentum',
  subtitle: "Write a genuinely good system prompt and pass real habit context into every question.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the core techniques of prompt engineering — clear instructions, role-setting, examples, and constraints — to make Ask Momentum's advice sharper and more consistent.",
    sections: [
      {
        heading: 'What is prompt engineering?',
        body:
          "Prompt engineering is the practice of writing instructions (prompts) that reliably get useful, on-target output from an AI model. It's not about tricking the model — it's about being CLEAR: the same way a well-written spec produces better code from a human developer, a well-written prompt produces better answers from an LLM.",
      },
      {
        heading: 'Role and tone (the system prompt)',
        body:
          "Lesson 19's system prompt already sets a role ('You are Ask Momentum, a habit coach') and a tone ('warm, encouraging'). This matters because it shapes EVERY reply consistently, without repeating instructions in every single user message. A vague system prompt gets vague, inconsistent replies; a specific one gets a consistent voice.",
      },
      {
        heading: 'Be specific about format and length',
        body:
          "'Keep replies short' is good; 'Keep replies to 2-3 sentences, and always end with one concrete, actionable suggestion' is much better — it tells the model exactly what SHAPE a good answer takes, not just roughly how long. Specific formatting instructions (bullet points, a fixed number of items, a particular structure) dramatically improve consistency.",
        code: {
          language: 'text',
          code:
            "BEFORE: 'Give habit advice.'\nAFTER:  'Give exactly one piece of habit advice, 2-3 sentences, ending with a specific, doable action for today.'",
        },
      },
      {
        heading: 'Providing context — this is where prompts get powerful',
        body:
          "An AI only knows what you tell it in the conversation (plus its general training). To make Ask Momentum's advice PERSONAL, we pass the user's actual habit data as extra context in the prompt — not just their raw question. This is the technique that turns a generic chatbot into an app-aware assistant.",
        code: {
          language: 'typescript',
          code:
            "const context = `The user's current habits: ${habits.map((h) => `${h.name} (${h.streak}-day streak, ${h.done ? 'done today' : 'not done today'})`).join(', ')}.`;\n\nconst fullPrompt = `${context}\\n\\nUser's question: ${message}`;",
        },
      },
      {
        heading: 'Constraints — telling the model what NOT to do',
        body:
          "Sometimes the most useful instruction is a boundary: 'Never give medical advice', 'Don't mention competitor apps', 'If asked something unrelated to habits, gently redirect the conversation back'. Constraints keep an AI feature focused and safe for its actual purpose, especially important once real users are typing whatever they want.",
      },
    ],
    keyTerms: [
      { term: 'Prompt engineering', definition: "Writing clear, specific instructions to reliably get useful output from an AI model." },
      { term: 'System prompt', definition: "The instruction that sets an AI's role, tone, and rules for an entire conversation." },
      { term: 'Context', definition: "Extra information (like real app data) included in a prompt so the AI's answer can be specific and relevant." },
      { term: 'Constraint', definition: "An explicit boundary telling the AI what NOT to do." },
      { term: 'Format instruction', definition: "A specific instruction about the SHAPE of the answer (length, structure, style)." },
    ],
    commonMistakes: [
      "Writing a vague system prompt ('be helpful') and expecting consistent, specific behaviour.",
      "Forgetting to pass real app data as context, so the AI can only give generic advice.",
      "Not setting any length/format constraint, leading to unpredictably long or short replies.",
      "Never testing edge cases (off-topic questions, empty habit lists) to see how the prompt handles them.",
      "Cramming too many unrelated instructions into one prompt instead of a few clear, prioritized rules.",
    ],
    takeaways: [
      "A specific system prompt produces a consistent role, tone, and format.",
      "Passing real app data as context is what makes AI features feel personal, not generic.",
      "Format instructions (length, structure) reduce unpredictable output.",
      "Constraints (what NOT to do) keep an AI feature focused and safe.",
      "Prompt engineering is iterative — test, read the outputs, refine.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Before/after prompt comparison',
    objective:
      "See the real impact of prompt specificity by calling the same API route with a vague vs. a well-engineered prompt and comparing the results.",
    instructions: [
      "Using your existing /api/coach route (non-streaming version is fine for this test), send the SAME user question twice.",
      "First call: pass a generic system prompt ('You are a helpful assistant.').",
      "Second call: pass a specific one (role + tone + format + one constraint).",
      "Compare the two replies side by side.",
    ],
    code: [
      {
        language: 'typescript',
        code:
          "// Two temporary test system prompts to compare:\n\nconst vaguePrompt = 'You are a helpful assistant.';\n\nconst specificPrompt = `You are Ask Momentum, a warm, encouraging habit coach.\nAlways reply in exactly 2-3 sentences.\nEnd every reply with ONE specific, doable action for today.\nIf asked something unrelated to habits, gently redirect back to habits.`;\n\n// Send the SAME question ('I keep missing my reading habit, help?') with each,\n// and compare the two responses.",
      },
    ],
    explanation:
      "The vague prompt gives Claude almost no direction beyond 'be helpful', so its reply could be any length, any tone, any structure — genuinely useful, but unpredictable for a product that needs a consistent voice. The specific prompt constrains role (habit coach), tone (warm), length (2-3 sentences), format (must end with a concrete action), and even an off-topic guardrail — every one of those specifics shows up directly in the output's shape. This comparison is the clearest way to FEEL why prompt engineering matters, rather than just reading about it.",
    expectedOutput:
      "The vague-prompt reply is generic and unpredictable in length/tone. The specific-prompt reply is consistently short, warm, and ends with one clear action — noticeably more 'on-brand' for Momentum.",
    learned: [
      "How prompt specificity directly shapes output.",
      "Why format and length instructions matter for product consistency.",
      "How a constraint (like off-topic redirection) changes behaviour.",
      "The value of comparing prompts side by side, not just guessing.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Ask Momentum gets a properly engineered system prompt AND real habit context passed on every question — its advice becomes genuinely personal.",
    why:
      "Lesson 19's version answers generically because it has no idea what habits the user actually has. This lesson is the difference between 'a chatbot bolted onto Momentum' and 'a coach that actually knows your habits'.",
    fileLocation: "app/api/coach/route.ts (better system prompt + context) and components/AskMomentum.tsx (send habit data)",
    code: [
      {
        language: 'typescript',
        filename: 'app/api/coach/route.ts (updated)',
        code:
          "export async function POST(req: NextRequest) {\n  const { message, habitsContext } = await req.json();\n  if (!message || typeof message !== 'string') {\n    return NextResponse.json({ error: 'A message is required.' }, { status: 400 });\n  }\n\n  const system = `You are Ask Momentum, a warm, encouraging habit coach built into the Momentum app.\nAlways reply in 2-3 sentences.\nWhenever possible, reference the user's ACTUAL habits and streaks by name — don't be generic.\nEnd every reply with ONE specific, doable action for today.\nIf asked something unrelated to habits or productivity, gently redirect the conversation back.\n\nThe user's current habits: ${habitsContext || 'no habits yet'}.`;\n\n  const stream = new ReadableStream({\n    async start(controller) {\n      try {\n        const claudeStream = anthropic.messages.stream({\n          model: 'claude-sonnet-5',\n          max_tokens: 300,\n          system,\n          messages: [{ role: 'user', content: message }],\n        });\n        for await (const event of claudeStream) {\n          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n            controller.enqueue(new TextEncoder().encode(event.delta.text));\n          }\n        }\n      } finally {\n        controller.close();\n      }\n    },\n  });\n  return new Response(stream);\n}",
      },
      {
        language: 'tsx',
        filename: 'components/AskMomentum.tsx (pass habits in as context)',
        code:
          "export function AskMomentum({ habits }: { habits: Habit[] }) {\n  // ...existing input/reply/loading state\n\n  async function ask() {\n    if (!input.trim()) return;\n    setLoading(true);\n    setReply('');\n\n    const habitsContext = habits\n      .map((h) => `${h.name} (${h.streak}-day streak, ${h.done ? 'done today' : 'not done today'})`)\n      .join(', ');\n\n    const res = await fetch('/api/coach', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ message: input, habitsContext }),\n    });\n    // ...existing streaming read loop unchanged\n  }\n\n  // ...\n}",
      },
    ],
    placement:
      "1) Update your /api/coach route's system prompt to the version above, reading habitsContext from the request body. 2) Update AskMomentum to accept a habits prop, build the habitsContext string before calling fetch, and include it in the request body. 3) In app/page.tsx, pass HabitsSection's habits down: <AskMomentum habits={habits} /> — you'll need to lift habits state up to page.tsx (or a shared parent) if it currently lives only inside HabitsSection.",
    implementation:
      "The system prompt now has FIVE clear directives: role, tone, exact length, a rule to reference REAL habits by name, a required closing action, and an off-topic guardrail — each one a deliberate prompt-engineering choice from the concept lesson. habitsContext is built with .map() + .join(), turning the habits array into one readable sentence Claude can actually reason about (e.g. 'Drink water (7-day streak, done today), Read 10 pages (3-day streak, not done today)'). Because this context is INSERTED INTO THE SYSTEM PROMPT (not just the user's question), Claude has it available for every reply in the conversation, and can genuinely reference '30-minute walk' or 'your 12-day streak' by name.",
    expectedResult:
      "Asking Ask Momentum for encouragement now produces a reply that names YOUR actual habits and streaks, not generic advice — e.g. 'Your 12-day walk streak is great! Reading is lagging at 3 days — try just one page tonight to keep it alive.'",
    connects:
      "Ask Momentum can now REFERENCE habit data in its text — but it still can't DO anything, like actually marking a habit done from the chat. Lesson 22 introduces tool use, letting Ask Momentum take real actions inside the app, not just talk about them.",
  },

  quiz: [
    { id: 'l21q1', kind: 'concept', prompt: 'What is prompt engineering, at its core?', options: ['Tricking an AI into bypassing its rules', 'Writing clear, specific instructions to reliably get useful output', 'A type of API authentication', 'Optimizing server performance'], answerIndex: 1, explanation: "It's about clarity and specificity in instructions, not exploiting the model." },
    { id: 'l21q2', kind: 'application', prompt: 'Which system prompt is more likely to produce consistent output?', options: ['"Be helpful."', '"Reply in exactly 2-3 sentences and end with one specific action."', '"Answer questions."', '"You are an AI."'], answerIndex: 1, explanation: "Specific format/length instructions constrain the shape of every reply consistently." },
    { id: 'l21q3', kind: 'concept', prompt: 'Why pass habitsContext into the system prompt instead of just the user’s raw question?', options: ['It’s required by the API', 'So the AI has the user’s real data available to reference in its answer', 'It makes the request faster', 'It hides the user’s question'], answerIndex: 1, explanation: "Including real app data as context is what lets the AI give specific, personal answers instead of generic ones." },
    { id: 'l21q4', kind: 'code_reading', prompt: 'What does habits.map((h) => `${h.name} (...)`).join(\', \') produce?', options: ['A single array', 'One readable sentence-like string describing every habit', 'A JSON object', 'An error'], answerIndex: 1, explanation: "map builds a formatted string per habit, and join combines them into one comma-separated string." },
    { id: 'l21q5', kind: 'concept', prompt: 'What is a "constraint" in a prompt?', options: ['A required parameter in the API call', 'An explicit instruction about what the AI should NOT do', 'A CSS rule', 'A rate limit'], answerIndex: 1, explanation: "A constraint sets a boundary, like redirecting off-topic questions or avoiding certain content." },
    { id: 'l21q6', kind: 'application', prompt: 'A user asks Ask Momentum an unrelated question (e.g. about the weather). What SHOULD happen with a well-engineered prompt?', options: ['It answers fully, off-topic', 'It gently redirects back to habits, per the constraint instruction', 'It crashes', 'It ignores the message'], answerIndex: 1, explanation: "The system prompt's off-topic constraint is designed to handle exactly this case." },
    { id: 'l21q7', kind: 'debug', prompt: "Ask Momentum keeps giving generic advice even after adding habitsContext to the prompt. Likely bug?", options: ['Claude ignores all context', 'habitsContext might be empty or not actually being sent from the client', 'The API key is wrong', 'Streaming is broken'], answerIndex: 1, explanation: "If the context string isn't correctly built or sent, the model has nothing specific to reference, regardless of the prompt wording." },
    { id: 'l21q8', kind: 'output', prompt: 'With the updated prompt, roughly what should a reply mentioning a real habit include?', options: ['Only generic encouragement, no specifics', 'A reference to an actual habit name/streak, plus one concrete action, in 2-3 sentences', 'A long essay', 'Just a single word'], answerIndex: 1, explanation: "That's exactly what the five system-prompt directives are designed to produce." },
    { id: 'l21q9', kind: 'project', prompt: "Why is habitsContext built in AskMomentum (the client) rather than the route just fetching habits itself?", options: ['The route can’t access any data', 'Because habits currently live in browser state/localStorage — the client already has them, no separate data fetch is needed yet', 'It’s faster to always build it server-side', 'There’s no real reason'], answerIndex: 1, explanation: "Since habits are currently client-side state (not in a database the server could query), passing them from the client is the simplest correct approach at this stage." },
    { id: 'l21q10', kind: 'concept', prompt: 'Is prompt engineering typically a one-shot or iterative process?', options: ['One-shot — you write it once and never touch it', 'Iterative — test, read outputs, refine', 'It’s entirely random', 'It doesn’t apply to system prompts'], answerIndex: 1, explanation: "Good prompts usually come from testing real outputs and refining wording, format, and constraints." },
  ],

  homework: {
    task:
      "Add one more constraint to the system prompt: if habitsContext is 'no habits yet' (an empty list), Ask Momentum should specifically encourage the user to add their first habit rather than giving generic advice about habits they don't have.",
    requirements: [
      "Add an explicit instruction to the system prompt for the empty-habits case.",
      "Test it by temporarily sending habitsContext: '' (or removing habits) and confirming the reply changes appropriately.",
      "Confirm normal behaviour (with real habits) is unaffected.",
    ],
    expectedOutcome:
      "With no habits, Ask Momentum's reply specifically nudges the user to add their first habit; with real habits, it references them as before.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 20,
      hint: "Lesson 20 asked you to add a typing indicator shown only while loading is true and reply is still empty, disappearing once the first chunk arrives.",
      steps: [
        "In AskMomentum's JSX, add a condition: {loading && !reply && <span>…</span>}.",
        "Since reply starts accumulating text the moment the first chunk arrives (setReply(fullText) inside the read loop), the condition automatically becomes false as soon as real content exists.",
        "No extra state is needed — this derives entirely from the existing loading and reply state.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/AskMomentum.tsx',
          code:
            "{loading && !reply && <p className=\"text-slate-400 text-sm italic\">Ask Momentum is thinking…</p>}\n{reply && <p className=\"bg-brand-soft border border-brand/20 rounded-xl p-4 text-sm\">{reply}</p>}",
        },
      ],
    },
  },
};
