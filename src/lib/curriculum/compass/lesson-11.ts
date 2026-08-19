import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 11 — Tool Safety & Input Validation
 * Module 2 (Tool Use) · Lesson 11 of 30
 */
export const lesson11: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 2,
  lessonIndex: 4,
  globalNumber: 11,
  name: 'Tool safety & input validation',
  title: 'Tool Safety — Never Trust the Model’s Input Blindly',
  subtitle: "Validate every tool argument and replace the unsafe calculator eval with a real, safe parser.",

  concept: {
    durationMin: 15,
    summary:
      "Learn why tool inputs need validation just like user input does, and replace Compass's unsafe calculator with a genuinely safe arithmetic evaluator.",
    sections: [
      {
        heading: 'The model’s tool arguments are still untrusted input',
        body:
          "It's easy to assume that because the MODEL generated a tool call, its arguments are automatically safe — they aren't. The model is ultimately reflecting whatever the USER asked, and a user could phrase a request that leads to unexpected or malicious-looking input. Treat every tool_use input with the same care you'd give raw user input.",
      },
      {
        heading: 'The problem with runCalculator’s Function() eval',
        body:
          "Lesson 8's runCalculator used Function(\"return (\" + expression + \")\")() — this actually EXECUTES arbitrary JavaScript, not just arithmetic. A cleverly crafted expression could run code far beyond simple math. This was a deliberate stepping stone to get tool use working quickly; a real product needs a genuinely SAFE evaluator.",
        code: {
          language: 'text',
          code:
            "// DANGEROUS if expression can contain anything:\nFunction(`\"use strict\"; return (${expression})`)();\n// A crafted \"expression\" isn't limited to arithmetic — it's real JS.",
        },
      },
      {
        heading: 'A safe arithmetic evaluator',
        body:
          "The fix: validate the expression against a strict allow-list of characters BEFORE evaluating anything — only digits, operators, parentheses, decimal points, and spaces. If anything else appears, reject it outright, no evaluation attempted.",
        code: {
          language: 'typescript',
          code:
            "function runCalculator(expression: string): string {\n  const isSafe = /^[0-9+\\-*/().\\s]+$/.test(expression);\n  if (!isSafe) return 'Error: expression contains disallowed characters.';\n  try {\n    const result = Function(`\"use strict\"; return (${expression})`)();\n    return String(result);\n  } catch {\n    return 'Error: could not evaluate that expression.';\n  }\n}",
        },
      },
      {
        heading: 'Validating other tool inputs too',
        body:
          "Safety isn't only about code execution — it also means bounding input SIZE (a huge query could waste tokens or hang a request) and checking TYPES even though input_schema describes them (the schema is a hint to the model, not a runtime guarantee your code can skip validating).",
        code: {
          language: 'typescript',
          code:
            "function runWordCount(text: string): string {\n  if (typeof text !== 'string' || text.length > 5000) {\n    return 'Error: invalid or too-large input.';\n  }\n  return String(text.trim().split(/\\s+/).filter(Boolean).length);\n}",
        },
      },
      {
        heading: 'Fail closed, not open',
        body:
          "When validation fails, REJECT the input and return a clear error — never silently proceed with something you're not sure is safe. This principle ('fail closed') matters more as agents get more powerful tools (in later, more advanced material — file access, payments, etc.), but the habit starts here, with something as simple as a calculator.",
      },
    ],
    keyTerms: [
      { term: 'Untrusted input', definition: "Any data originating outside your own code's direct control — including model-generated tool arguments." },
      { term: 'Allow-list', definition: "Validating input against a strict set of PERMITTED characters/values, rejecting anything else." },
      { term: 'Fail closed', definition: "When validation fails or is uncertain, reject the action rather than proceeding anyway." },
      { term: 'input_schema (as a hint, not a guarantee)', definition: "The schema guides the model's output shape but doesn't runtime-enforce it — your code must still validate." },
    ],
    commonMistakes: [
      "Assuming a tool_use input is automatically safe because the model generated it.",
      "Using an eval-like function on unvalidated input, allowing arbitrary code execution.",
      "Trusting input_schema alone as validation — it shapes the model's request but doesn't enforce anything at runtime.",
      "Not bounding input SIZE, allowing an excessively long string to waste resources or tokens.",
      "Failing OPEN (proceeding anyway when validation is uncertain) instead of failing closed (rejecting).",
    ],
    takeaways: [
      "Treat every tool argument as untrusted input, just like raw user input.",
      "An allow-list of permitted characters is a simple, effective validation technique.",
      "input_schema doesn't runtime-validate anything — your tool code still must.",
      "Bound input size, not just type/shape.",
      "Fail closed: reject uncertain or invalid input rather than proceeding.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Breaking (and then fixing) an unsafe evaluator',
    objective:
      "See the real risk of an eval-based calculator firsthand, then fix it with allow-list validation.",
    instructions: [
      "Write the UNSAFE version of runCalculator (Function()-based, no validation).",
      "Try an input that isn't pure arithmetic (e.g. something that logs a message instead of computing).",
      "Add the allow-list check and confirm the same input is now safely rejected.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'safe-calc-test.ts',
        code:
          "function unsafeCalculator(expression: string): string {\n  try {\n    const result = Function(`\"use strict\"; return (${expression})`)();\n    return String(result);\n  } catch {\n    return 'Error';\n  }\n}\n\nfunction safeCalculator(expression: string): string {\n  const isSafe = /^[0-9+\\-*/().\\s]+$/.test(expression);\n  if (!isSafe) return 'Error: expression contains disallowed characters.';\n  try {\n    return String(Function(`\"use strict\"; return (${expression})`)());\n  } catch {\n    return 'Error: could not evaluate.';\n  }\n}\n\nconsole.log('unsafe, weird input:', unsafeCalculator('(() => { console.log(\"ran extra code!\"); return 1; })()'));\nconsole.log('safe, same input:   ', safeCalculator('(() => { console.log(\"ran extra code!\"); return 1; })()'));\nconsole.log('safe, real math:    ', safeCalculator('12 * (4 + 3)'));",
      },
    ],
    explanation:
      "unsafeCalculator happily executes whatever JavaScript is inside the parentheses — the test input isn't arithmetic at all, it's a self-invoking function that runs arbitrary code (here, just a harmless log, but the SAME mechanism could do worse). safeCalculator's regex test rejects that same input immediately, because it contains characters (letters, parentheses used as function syntax, quotes) outside the allow-listed arithmetic set — the expression never even reaches Function(). The final line confirms real arithmetic still works fine through the safe version.",
    expectedOutput:
      "unsafeCalculator prints 'ran extra code!' to the console (proving arbitrary execution happened) and returns 1. safeCalculator rejects the same input with a clear error, but correctly evaluates real math like '12 * (4 + 3)' to 84.",
    learned: [
      "How an eval-based function can be exploited beyond its intended purpose.",
      "How an allow-list regex effectively blocks non-arithmetic input.",
      "Why validation must happen BEFORE evaluation, not after.",
      "The practical difference between 'fail open' and 'fail closed' code.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's tools are all hardened with real input validation — the calculator is genuinely safe, and every tool bounds and checks its input before doing real work.",
    why:
      "This closes a real gap: Lesson 8's calculator worked, but wasn't actually safe against unusual input. Production-quality tools validate defensively, every time.",
    fileLocation: "compass-agent/index.ts (harden runCalculator, runWordCount, runWebSearch)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (replace runCalculator)',
        code:
          "function runCalculator(expression: string): string {\n  if (typeof expression !== 'string' || expression.length > 200) {\n    return 'Error: invalid or too-large expression.';\n  }\n  const isSafe = /^[0-9+\\-*/().\\s]+$/.test(expression);\n  if (!isSafe) return 'Error: expression contains disallowed characters.';\n  try {\n    const result = Function(`\"use strict\"; return (${expression})`)();\n    return String(result);\n  } catch {\n    return 'Error: could not evaluate that expression.';\n  }\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (harden the other two tools)',
        code:
          "function runWordCount(text: string): string {\n  if (typeof text !== 'string' || text.length > 5000) {\n    return 'Error: invalid or too-large input.';\n  }\n  return String(text.trim().split(/\\s+/).filter(Boolean).length);\n}\n\nasync function runWebSearch(query: string): Promise<string> {\n  if (typeof query !== 'string' || query.length === 0 || query.length > 300) {\n    return 'Error: invalid search query.';\n  }\n  try {\n    const res = await fetch(`https://api.example-search.com/search?q=${encodeURIComponent(query)}`, {\n      headers: { Authorization: `Bearer ${process.env.SEARCH_API_KEY}` },\n    });\n    if (!res.ok) return 'Error: search request failed.';\n    const data = await res.json();\n    const results = (data.results ?? []).slice(0, 3);\n    if (results.length === 0) return 'No results found.';\n    return results.map((r: { title: string; snippet: string }) => `${r.title}: ${r.snippet}`).join('\\n');\n  } catch {\n    return 'Error: could not reach the search service.';\n  }\n}",
      },
    ],
    placement:
      "Replace runCalculator, runWordCount, and runWebSearch in index.ts with the hardened versions above — each now validates type, size, and (for the calculator) character content BEFORE doing any real work.",
    implementation:
      "Every tool now follows the same defensive shape: check the input is the right TYPE, check it's within a reasonable SIZE bound, and (for the calculator specifically) check it matches an allow-list pattern — all BEFORE the actual logic runs. This is fail-closed by construction: any input that doesn't pass validation returns an error string immediately, never reaching the potentially risky Function() call or an oversized network/processing operation. None of Compass's OTHER code (the loop, executeTool, askCompass) needs to change — validation lives entirely inside each tool's own implementation, which is exactly where it belongs.",
    expectedResult:
      "Compass's calculator now safely rejects anything that isn't real arithmetic while still correctly computing real expressions — and its other tools reject absurdly long or malformed input instead of processing it blindly.",
    connects:
      "This safety discipline — validate untrusted input, fail closed — is a habit worth carrying into every future tool Compass gains, and becomes even more important once Module 4 lets Compass plan and chain MANY tool calls autonomously with less direct human oversight per step.",
  },

  quiz: [
    { id: 'c11q1', kind: 'concept', prompt: 'Why should tool_use arguments be treated as untrusted input?', options: ['They never need validation', 'Because they ultimately reflect user intent and could contain unexpected or crafted content', 'The model always sanitizes them first', 'Only user-typed text needs validation'], answerIndex: 1, explanation: "Model-generated tool arguments still originate from user-driven requests and shouldn't be blindly trusted." },
    { id: 'c11q2', kind: 'concept', prompt: 'What was the real risk in Lesson 8’s original runCalculator?', options: ['It was too slow', 'Function() could execute ANY JavaScript, not just arithmetic, if the expression contained more than math', 'It used too many tokens', 'It didn’t support decimals'], answerIndex: 1, explanation: "An eval-like function executes arbitrary code unless the input is first restricted to safe characters." },
    { id: 'c11q3', kind: 'application', prompt: 'What does an allow-list validation approach do?', options: ['Blocks a list of known-bad values', 'Permits ONLY a defined set of safe characters/values, rejecting everything else', 'Logs all input for review later', 'Encrypts the input'], answerIndex: 1, explanation: "An allow-list is a positive check — only explicitly permitted content passes." },
    { id: 'c11q4', kind: 'debug', prompt: 'A calculator input like "12 + 4" fails the allow-list regex unexpectedly. What might be wrong with the regex?', options: ['Nothing, this should pass', 'The regex might be missing a required character (e.g. space) from its allowed set', 'Regex can’t validate numbers', 'The input is too short'], answerIndex: 1, explanation: "If a legitimate character (like a space) isn't in the allow-list, valid expressions get incorrectly rejected." },
    { id: 'c11q5', kind: 'concept', prompt: 'Does input_schema runtime-enforce a tool’s argument types?', options: ['Yes, completely', 'No — it guides the model’s request shape but your code must still validate at runtime', 'Only for string types', 'Only if the model is instructed to enforce it'], answerIndex: 1, explanation: "input_schema is a hint for the model, not a runtime guarantee your tool code can rely on." },
    { id: 'c11q6', kind: 'application', prompt: 'Why bound a tool’s input SIZE (e.g. max length), not just its type?', options: ['No real reason', 'An excessively long input could waste tokens, processing time, or cause other issues', 'Size limits are required by TypeScript', 'It only matters for numbers'], answerIndex: 1, explanation: "Size bounds prevent resource waste or unexpected behaviour from unusually large input." },
    { id: 'c11q7', kind: 'concept', prompt: 'What does "fail closed" mean?', options: ['Retry until it succeeds', 'When validation fails or is uncertain, reject the action rather than proceeding anyway', 'Always return a cached result', 'Close the whole program on any error'], answerIndex: 1, explanation: "Fail closed means uncertain or invalid input results in rejection, not a risky attempt to proceed." },
    { id: 'c11q8', kind: 'output', prompt: 'Given the hardened runCalculator, what does an expression like "alert(1)" return?', options: ['It executes alert(1)', 'An error string, since letters and parentheses-as-function-call fail the allow-list', 'undefined', 'A number'], answerIndex: 1, explanation: "The allow-list only permits digits/operators/parentheses/dots/spaces — letters like 'alert' are rejected." },
    { id: 'c11q9', kind: 'project', prompt: "Why doesn't hardening the tools require any changes to Compass's main loop or executeTool dispatch?", options: ['It secretly does require changes', "Validation lives inside each tool's own implementation, which is exactly where input-specific safety belongs", 'The loop already validated everything', 'Dispatch functions can’t be changed'], answerIndex: 1, explanation: "Each tool owning its own validation keeps the dispatch/loop layer simple and unaffected by tool-specific rules." },
    { id: 'c11q10', kind: 'concept', prompt: 'Why does this safety discipline matter MORE as an agent gains more powerful tools later?', options: ['It doesn’t matter more, it’s the same at any scale', 'More powerful tools (with real-world side effects) make unsafe or unvalidated input increasingly risky', 'Safety only matters for calculators', 'Later tools are automatically safe by design'], answerIndex: 1, explanation: "As tools gain real consequences, the habit of validating and failing closed becomes increasingly important." },
  ],

  homework: {
    task:
      "Add a rate limit to runWebSearch specifically: if it's called more than 5 times within any 60-second window, return an error instead of making the request, protecting against excessive tool usage from a runaway loop or unusual input.",
    requirements: [
      "Track recent call timestamps (an array or similar) scoped to runWebSearch.",
      "Before making a request, filter out timestamps older than 60 seconds, then check if the remaining count is >= 5.",
      "If over the limit, return a clear error string without making the network call; otherwise proceed and record the new timestamp.",
    ],
    expectedOutcome:
      "Calling runWebSearch 6+ times rapidly results in the 6th (and further, within the window) call being rejected with a clear rate-limit message, while calls under the limit proceed normally.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 10,
      hint: "Lesson 10 asked you to add basic caching to runWebSearch, returning a cached result for a repeated identical query instead of a new network request.",
      steps: [
        "Declare a module-level cache: const searchCache = new Map<string, string>();",
        "At the top of runWebSearch, check if searchCache.has(query); if so, log a cache hit and return the cached value immediately.",
        "After a successful fetch and summarization, call searchCache.set(query, result) before returning it.",
        "Test by searching the exact same query twice and confirming only one real network request happens (log a marker inside the try block to verify).",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "const searchCache = new Map<string, string>();\n\nasync function runWebSearch(query: string): Promise<string> {\n  if (searchCache.has(query)) {\n    console.log('[cache hit]', query);\n    return searchCache.get(query)!;\n  }\n  // ...existing fetch + summarize logic...\n  // before the final return: searchCache.set(query, summary);\n  // return summary;\n}",
        },
      ],
    },
  },
};
