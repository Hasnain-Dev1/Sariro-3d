import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 17 — Tailwind CSS in Depth
 * Module 3 (React + Next.js) · Lesson 17 of 30
 */
export const lesson17: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 3,
  lessonIndex: 4,
  globalNumber: 17,
  name: 'Tailwind CSS in depth',
  title: 'Tailwind CSS — Bringing Back Momentum’s Brand',
  subtitle: "Restore the green identity, icons, and streak ring inside the React version.",

  concept: {
    durationMin: 15,
    summary:
      "Go deeper into Tailwind's utility system — responsive prefixes, hover/focus states, and custom theme colours — to restore Momentum's full brand identity in React.",
    sections: [
      {
        heading: 'Recap: utility classes',
        body:
          "You've been using Tailwind classes since Lesson 13 (px-4, rounded-lg, font-bold). Each class does ONE small styling job; you compose many of them to build a look, right inside className — no separate CSS file needed for most things.",
      },
      {
        heading: 'Responsive prefixes',
        body:
          "Tailwind's responsive design uses prefixes instead of separate media queries. A class like md:flex-row means 'apply flex-row at the md breakpoint (768px) and up'. Unprefixed classes apply to ALL sizes as the base, and prefixed ones override at that breakpoint upward — mobile-first, matching Module 1's Lesson 4 concept, expressed differently.",
        code: {
          language: 'tsx',
          code:
            "<div className=\"flex flex-col md:flex-row gap-4\">\n  {/* stacked on phones, row on tablets and up */}\n</div>",
        },
      },
      {
        heading: 'Hover, focus, and other state variants',
        body:
          "Prefix a class with a state to apply it only in that state: hover:bg-green-700, focus:ring-2, disabled:opacity-50. This replaces writing separate :hover rules in a stylesheet — the interaction styling sits right next to the base styling.",
        code: {
          language: 'tsx',
          code:
            "<button className=\"bg-green-600 hover:bg-green-700 disabled:opacity-50\">\n  Add\n</button>",
        },
      },
      {
        heading: 'Custom brand colours via Tailwind config',
        body:
          "Rather than typing bg-[#16a34a] everywhere, you can register Momentum's brand colour once in tailwind.config.ts and use bg-brand, text-brand, etc. This keeps the brand colour consistent and makes a future re-theme a one-line change — exactly like the theme.css variables from Sariro's own lesson platform.",
        code: {
          language: 'typescript',
          filename: 'tailwind.config.ts',
          code:
            "import type { Config } from 'tailwindcss';\n\nexport default {\n  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],\n  theme: {\n    extend: {\n      colors: {\n        brand: { DEFAULT: '#16a34a', dark: '#15803d', soft: '#eafbf0' },\n      },\n    },\n  },\n} satisfies Config;",
        },
      },
      {
        heading: 'When to break out to an inline style',
        body:
          "Tailwind covers almost everything, but a COMPUTED value — like a progress percentage only known at runtime — can't be a fixed utility class. For those cases, use a regular inline style={{ ... }} alongside your Tailwind classes. This is exactly what Momentum's streak ring needs: static Tailwind for the shape, one computed inline style for the live percentage.",
      },
    ],
    keyTerms: [
      { term: 'Responsive prefix', definition: "A breakpoint prefix (sm:, md:, lg:) applying a class from that width upward." },
      { term: 'State variant', definition: "A prefix like hover: or disabled: applying a class only in that interaction state." },
      { term: 'tailwind.config', definition: "The file where you register custom theme values like brand colours." },
      { term: 'Utility-first', definition: "Styling by composing small, single-purpose classes instead of writing custom CSS." },
      { term: 'Inline style', definition: "The style={{ }} prop, used for values Tailwind can't express as a fixed class (like a computed percentage)." },
    ],
    commonMistakes: [
      "Writing bg-green-600 md:bg-blue-600 and expecting BOTH to apply at once — the responsive one overrides at its breakpoint, only one wins per size.",
      "Forgetting that Tailwind is mobile-first: unprefixed classes are the SMALL-screen base, not desktop.",
      "Hard-coding a hex colour repeatedly instead of registering it once in the config.",
      "Trying to express a runtime-computed value (like a percentage) as a Tailwind class — it needs an inline style instead.",
      "Piling on too many one-off utility classes for something reused often — consider a small component instead.",
    ],
    takeaways: [
      "Tailwind classes compose directly in className — no separate CSS file for most styling.",
      "Responsive prefixes (md:, lg:) are mobile-first — they apply from that size upward.",
      "State variants (hover:, disabled:) handle interaction styling inline.",
      "Register brand colours once in tailwind.config for consistency.",
      "Use inline style={{ }} only for values Tailwind can't express as a fixed class.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A responsive, interactive pricing card',
    objective:
      "Practise responsive prefixes and state variants together by building one card that reflows on mobile and reacts to hover/focus.",
    instructions: [
      "Create a PricingCard component (or add to a page).",
      "Make it stack content vertically on phones, side-by-side on md and up.",
      "Add a hover lift and shadow to the whole card.",
      "Add a button with hover and disabled states.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'components/PricingCard.tsx',
        code:
          "export function PricingCard() {\n  return (\n    <div className=\"flex flex-col md:flex-row items-center gap-4 p-6 bg-white border border-slate-200 rounded-2xl transition-transform hover:-translate-y-1 hover:shadow-lg\">\n      <div>\n        <h3 className=\"text-lg font-bold\">Momentum Pro</h3>\n        <p className=\"text-slate-500 text-sm\">Unlimited habits + AI coach</p>\n      </div>\n      <button className=\"ml-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg\">\n        Upgrade\n      </button>\n    </div>\n  );\n}",
      },
    ],
    explanation:
      "flex-col md:flex-row stacks content on phones and lays it out horizontally from the md breakpoint (768px) up — no separate media query written. hover:-translate-y-1 hover:shadow-lg together lift the whole card on hover, combined with transition-transform for a smooth animation. The button layers hover:bg-green-700 for interaction feedback and disabled:opacity-50 so it visibly dims if it's ever rendered with the disabled attribute — all without leaving the className string.",
    expectedOutput:
      "On a narrow screen, the card's content stacks top-to-bottom; on a wider screen it's a row. Hovering the whole card gives it a lift and shadow; hovering the button darkens it.",
    learned: [
      "How to combine responsive and state variants in one className.",
      "How Tailwind's mobile-first breakpoints work in practice.",
      "How to animate a hover effect with transition- utilities.",
      "How to style a disabled state without extra logic.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum's full brand identity restored in React — green theme registered properly, icons on habits, and a live streak ring.",
    why:
      "Module 3 has been functionally solid but visually plain (default Tailwind greys). This lesson brings back everything from Module 1's polish pass — brand colour, icons, the progress ring — but built the professional way: a registered theme color instead of scattered hex values.",
    fileLocation: "tailwind.config.ts (brand colour), components/HabitCard.tsx (icon), components/HabitsSection.tsx (ring)",
    code: [
      {
        language: 'typescript',
        filename: 'tailwind.config.ts',
        code:
          "import type { Config } from 'tailwindcss';\n\nexport default {\n  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],\n  theme: {\n    extend: {\n      colors: {\n        brand: { DEFAULT: '#16a34a', dark: '#15803d', soft: '#eafbf0' },\n      },\n    },\n  },\n} satisfies Config;",
      },
      {
        language: 'tsx',
        filename: 'components/HabitCard.tsx (swap green-* for brand)',
        code:
          "<li\n  onClick={() => onToggle(habit.id)}\n  className=\"flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-transform\"\n>\n  <span className={habit.done ? 'text-brand' : 'text-slate-300'}>\n    {habit.done ? '✅' : '⬜'}\n  </span>\n  <span className=\"font-semibold flex-1\">{habit.name} · {habit.streak}d</span>\n  <button onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }} className=\"text-slate-400 hover:text-red-500\">✕</button>\n</li>",
      },
      {
        language: 'tsx',
        filename: 'components/HabitsSection.tsx (add a live streak ring)',
        code:
          "// derived, computed fresh every render — no extra state needed\nconst doneCount = habits.filter((h) => h.done).length;\nconst percent = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;\nconst longestStreak = habits.length ? Math.max(...habits.map((h) => h.streak)) : 0;\n\n// ...in the JSX, above the form:\n<div\n  className=\"w-16 h-16 rounded-full grid place-items-center mb-4\"\n  style={{ background: `conic-gradient(#16a34a ${percent}%, #e2e8f0 0)` }}\n>\n  <div className=\"w-12 h-12 rounded-full bg-white grid place-items-center font-extrabold text-brand\">\n    {longestStreak}\n  </div>\n</div>",
      },
    ],
    placement:
      "1) Create/update tailwind.config.ts with the brand colours. 2) In HabitCard.tsx, swap any green-* utility for brand / brand-dark, and add the icon colour + hover lift. 3) In HabitsSection.tsx, compute doneCount/percent/longestStreak near the top of the component and render the ring div above your add-habit form.",
    implementation:
      "Registering brand in the Tailwind config means text-brand and bg-brand now resolve to Momentum's exact green everywhere, matching Module 1's CSS variable approach but through Tailwind's system. The ring reuses the SAME conic-gradient trick from Module 1 and Module 2's final builds, but now percent and longestStreak are derived directly from React state on every render — exactly like Lesson 14's total-streak homework — so the ring stays live automatically the moment a habit is toggled, with zero manual update code. The ring's outer div uses Tailwind for shape (w-16 h-16 rounded-full) and a computed inline style only for the one thing Tailwind can't express: the runtime percentage.",
    expectedResult:
      "Momentum's React version now looks like the finished Module 1 shell: green accents, a check-icon that turns brand-green when done, hover-lift cards, and a live progress ring showing the longest streak that visibly fills as habits are completed.",
    connects:
      "Visually, Momentum is now complete and consistent across both the vanilla-JS (Module 2) and React (Module 3) versions. Lesson 18 adds the final missing piece — localStorage persistence in React — closing out Module 3 with a fully working, branded, persisted Next.js app.",
  },

  quiz: [
    { id: 'l17q1', kind: 'concept', prompt: 'What does md:flex-row mean in Tailwind?', options: ['flex-row always, md is ignored', 'Apply flex-row from the md breakpoint (768px) and up', 'Apply flex-row only below 768px', 'It’s invalid syntax'], answerIndex: 1, explanation: "Tailwind is mobile-first: prefixed classes apply from that breakpoint upward." },
    { id: 'l17q2', kind: 'application', prompt: 'Which class styles a button only while hovered?', options: ['bg-green-700', 'hover:bg-green-700', 'active-bg-green-700', ':hover-green-700'], answerIndex: 1, explanation: "The hover: prefix applies a class only during the hover state." },
    { id: 'l17q3', kind: 'concept', prompt: 'Why register a brand colour in tailwind.config instead of typing bg-[#16a34a] repeatedly?', options: ['Tailwind requires it', 'One source of truth — a re-theme becomes a one-line change', 'It’s the only way to use green', 'It disables dark mode'], answerIndex: 1, explanation: "A registered token keeps the colour consistent and makes future re-theming trivial." },
    { id: 'l17q4', kind: 'code_reading', prompt: 'What does className={habit.done ? "text-brand" : "text-slate-300"} do?', options: ['Always applies text-brand', 'Picks a Tailwind class based on habit.done', 'Applies both classes', 'Throws an error'], answerIndex: 1, explanation: "This is a ternary choosing between two class strings based on the done state." },
    { id: 'l17q5', kind: 'application', prompt: 'When should you use an inline style={{ }} instead of a Tailwind class?', options: ['Always, Tailwind is discouraged', 'When the value is computed at runtime and can’t be a fixed class', 'Never, it’s forbidden', 'Only for colours'], answerIndex: 1, explanation: "Inline styles handle dynamic, computed values (like a live percentage) that fixed utility classes can't express." },
    { id: 'l17q6', kind: 'debug', prompt: 'A student wrote flex-row md:flex-col expecting BOTH row and column at once on desktop. What actually happens?', options: ['Both apply simultaneously', 'The md: version overrides at that breakpoint — only column applies from md up', 'Neither applies', 'An error is thrown'], answerIndex: 1, explanation: "Only one flex-direction can apply at a time; the breakpoint-prefixed class overrides the base at that size." },
    { id: 'l17q7', kind: 'output', prompt: 'Given percent = 60, what does conic-gradient(#16a34a 60%, #e2e8f0 0) draw?', options: ['A solid green circle', 'A ring 60% green, 40% grey', 'A square', 'Nothing visible'], answerIndex: 1, explanation: "The conic-gradient sweeps green for the first 60% of the circle, then grey for the remainder." },
    { id: 'l17q8', kind: 'concept', prompt: 'Tailwind’s general styling approach is called…', options: ['Component-first', 'Utility-first', 'ID-first', 'Inline-only'], answerIndex: 1, explanation: "Utility-first means composing small, single-purpose classes directly in markup." },
    { id: 'l17q9', kind: 'project', prompt: "Why is Momentum's ring percentage NOT stored in its own useState?", options: ['It has to be stored for React to work', 'It’s fully derivable from habits, so storing it separately would risk it going stale', 'Tailwind requires state for gradients', 'It would break the config'], answerIndex: 1, explanation: "Deriving it fresh every render (like doneCount/percent) guarantees it's always correct without extra state to keep in sync." },
    { id: 'l17q10', kind: 'application', prompt: 'Which correctly disables a button’s interactivity styling when disabled?', options: ['disabled-opacity-50', 'disabled:opacity-50 on the button, with the disabled attribute set', 'opacity:disabled', 'It’s automatic, no class needed'], answerIndex: 1, explanation: "The disabled: variant applies its class only when the element actually has the disabled attribute." },
  ],

  homework: {
    task:
      "Add a responsive tweak: on small screens, stack the add-habit form's input and button vertically (full width each); from md up, keep them side by side as they are now. Also add a subtle focus ring to the input for keyboard accessibility.",
    requirements: [
      "Change the form's className to use flex-col md:flex-row (or similar) so it stacks on phones.",
      "Ensure both the input and button are full-width on the stacked (mobile) layout.",
      "Add focus:ring-2 focus:ring-brand (or similar) to the input.",
      "Test at both a narrow and wide window width.",
    ],
    expectedOutcome:
      "On a phone-width screen, the input and Add button stack full-width; on desktop they sit side by side as before. Clicking into the input shows a visible green focus ring.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 16,
      hint: "Lesson 16 asked you to add validation feedback: an error message when the add-habit form is submitted empty.",
      steps: [
        "Add const [error, setError] = useState<string | null>(null); in HabitsSection.",
        "In handleSubmit, if the trimmed name is empty: setError('Please enter a habit name.'); return; — don't call addHabit.",
        "On a successful add, call setError(null) to clear any previous error.",
        "Render {error && <p className=\"text-red-500 text-xs mt-1\">{error}</p>} just below the form.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/HabitsSection.tsx',
          code:
            "function handleSubmit(e: React.FormEvent) {\n  e.preventDefault();\n  const trimmed = newName.trim();\n  if (!trimmed) {\n    setError('Please enter a habit name.');\n    return;\n  }\n  addHabit(trimmed);\n  setNewName('');\n  setError(null);\n}",
        },
      ],
    },
  },
};
