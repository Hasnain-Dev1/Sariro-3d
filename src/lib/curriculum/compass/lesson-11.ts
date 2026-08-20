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
        heading: 'The problem with run_calculator’s eval()',
        body:
          "Lesson 8's run_calculator used Python's built-in eval(expression, ...) — even with restricted builtins, eval() can still be tricked into surprising behaviour by a sufficiently creative string. This was a deliberate stepping stone to get tool use working quickly; a real product needs a genuinely SAFE evaluator that never runs arbitrary code at all.",
        code: {
          language: 'text',
          code:
            "# RISKY even with restricted builtins:\neval(expression, {\"__builtins__\": {}}, {})\n# A crafted \"expression\" can still exploit surprising Python internals.",
        },
      },
      {
        heading: 'A safe arithmetic evaluator',
        body:
          "The fix: validate the expression against a strict allow-list of characters BEFORE evaluating anything — only digits, operators, parentheses, decimal points, and spaces. If anything else appears, reject it outright, no evaluation attempted. Python's ast module can also parse and evaluate ONLY a literal math expression tree, never running arbitrary code — the most robust approach.",
        code: {
          language: 'python',
          code:
            "import re\n\ndef run_calculator(expression: str) -> str:\n    is_safe = re.fullmatch(r\"[0-9+\\-*/(). ]+\", expression)\n    if not is_safe:\n        return \"Error: expression contains disallowed characters.\"\n    try:\n        result = eval(expression, {\"__builtins__\": {}}, {})\n        return str(result)\n    except Exception:\n        return \"Error: could not evaluate that expression.\"",
        },
      },
      {
        heading: 'Validating other tool inputs too',
        body:
          "Safety isn't only about code execution — it also means bounding input SIZE (a huge query could waste tokens or hang a request) and checking TYPES even though input_schema describes them (the schema is a hint to the model, not a runtime guarantee your code can skip validating).",
        code: {
          language: 'python',
          code:
            "def run_word_count(text: str) -> str:\n    if not isinstance(text, str) or len(text) > 5000:\n        return \"Error: invalid or too-large input.\"\n    return str(len(text.strip().split()))",
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
      { term: 're.fullmatch', definition: "Python's regex function checking that an ENTIRE string matches a pattern, not just part of it." },
    ],
    commonMistakes: [
      "Assuming a tool_use input is automatically safe because the model generated it.",
      "Using eval() on unvalidated input without an allow-list check first, allowing unexpected behaviour.",
      "Using re.match or re.search instead of re.fullmatch, which only check the START or ANY part of the string, not the whole thing.",
      "Trusting input_schema alone as validation — it shapes the model's request but doesn't enforce anything at runtime.",
      "Not bounding input SIZE, allowing an excessively long string to waste resources or tokens.",
    ],
    takeaways: [
      "Treat every tool argument as untrusted input, just like raw user input.",
      "An allow-list of permitted characters (checked with re.fullmatch) is a simple, effective validation technique.",
      "input_schema doesn't runtime-validate anything — your tool code still must.",
      "Bound input size, not just type/shape.",
      "Fail closed: reject uncertain or invalid input rather than proceeding.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Breaking (and then fixing) an unsafe evaluator',
    objective:
      "See the real risk of an unvalidated evaluator firsthand, then fix it with allow-list validation.",
    instructions: [
      "Write the UNSAFE version of run_calculator (no validation).",
      "Try an input that isn't pure arithmetic (e.g. something that prints a message instead of computing).",
      "Add the allow-list check with re.fullmatch and confirm the same input is now safely rejected.",
    ],
    code: [
      {
        language: 'python',
        filename: 'safe_calc_test.py',
        code:
          "import re\n\ndef unsafe_calculator(expression: str) -> str:\n    try:\n        return str(eval(expression, {\"__builtins__\": {}}, {}))\n    except Exception:\n        return \"Error\"\n\ndef safe_calculator(expression: str) -> str:\n    if not re.fullmatch(r\"[0-9+\\-*/(). ]+\", expression):\n        return \"Error: expression contains disallowed characters.\"\n    try:\n        return str(eval(expression, {\"__builtins__\": {}}, {}))\n    except Exception:\n        return \"Error: could not evaluate.\"\n\nweird_input = \"(lambda: [print('ran extra code!'), 1][1])()\"\n\nprint(\"unsafe, weird input:\", unsafe_calculator(weird_input))\nprint(\"safe, same input:   \", safe_calculator(weird_input))\nprint(\"safe, real math:    \", safe_calculator(\"12 * (4 + 3)\"))",
      },
    ],
    explanation:
      "unsafe_calculator happily evaluates whatever Python expression is inside the string — the test input isn't arithmetic at all, it's a lambda that runs arbitrary code (here, just a harmless print, but the SAME mechanism could do worse). safe_calculator's re.fullmatch check rejects that same input immediately, because it contains characters (letters, parentheses used as function/lambda syntax) outside the allow-listed arithmetic set — the expression never even reaches eval(). The final line confirms real arithmetic still works fine through the safe version.",
    expectedOutput:
      "unsafe_calculator prints 'ran extra code!' to the console (proving arbitrary execution happened) and returns 1. safe_calculator rejects the same input with a clear error, but correctly evaluates real math like '12 * (4 + 3)' to 84.",
    learned: [
      "How eval() can be exploited beyond its intended purpose.",
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
    fileLocation: "compass-agent/main.py (harden run_calculator, run_word_count, run_web_search)",
    code: [
      {
        language: 'python',
        filename: 'main.py (replace run_calculator)',
        code:
          "import re\n\ndef run_calculator(expression: str) -> str:\n    if not isinstance(expression, str) or len(expression) > 200:\n        return \"Error: invalid or too-large expression.\"\n    if not re.fullmatch(r\"[0-9+\\-*/(). ]+\", expression):\n        return \"Error: expression contains disallowed characters.\"\n    try:\n        result = eval(expression, {\"__builtins__\": {}}, {})\n        return str(result)\n    except Exception:\n        return \"Error: could not evaluate that expression.\"",
      },
      {
        language: 'python',
        filename: 'main.py (harden the other two tools)',
        code:
          "def run_word_count(text: str) -> str:\n    if not isinstance(text, str) or len(text) > 5000:\n        return \"Error: invalid or too-large input.\"\n    return str(len(text.strip().split()))\n\ndef run_web_search(query: str) -> str:\n    if not isinstance(query, str) or len(query) == 0 or len(query) > 300:\n        return \"Error: invalid search query.\"\n    try:\n        res = requests.get(\n            \"https://api.example-search.com/search\",\n            params={\"q\": query},\n            headers={\"Authorization\": f\"Bearer {os.environ.get('SEARCH_API_KEY', '')}\"},\n            timeout=10,\n        )\n        if not res.ok:\n            return \"Error: search request failed.\"\n        data = res.json()\n        results = data.get(\"results\", [])[:3]\n        if not results:\n            return \"No results found.\"\n        return \"\\n\".join(f\"{r['title']}: {r['snippet']}\" for r in results)\n    except requests.RequestException:\n        return \"Error: could not reach the search service.\"",
      },
    ],
    placement:
      "Replace run_calculator, run_word_count, and run_web_search in main.py with the hardened versions above — each now validates type, size, and (for the calculator) character content BEFORE doing any real work.",
    implementation:
      "Every tool now follows the same defensive shape: check the input is the right TYPE, check it's within a reasonable SIZE bound, and (for the calculator specifically) check it matches an allow-list pattern with re.fullmatch — all BEFORE the actual logic runs. This is fail-closed by construction: any input that doesn't pass validation returns an error string immediately, never reaching the potentially risky eval() call or an oversized network/processing operation. None of Compass's OTHER code (the loop, execute_tool, ask_compass) needs to change — validation lives entirely inside each tool's own implementation, which is exactly where it belongs.",
    expectedResult:
      "Compass's calculator now safely rejects anything that isn't real arithmetic while still correctly computing real expressions — and its other tools reject absurdly long or malformed input instead of processing it blindly.",
    connects:
      "This safety discipline — validate untrusted input, fail closed — is a habit worth carrying into every future tool Compass gains, and becomes even more important once Module 4 lets Compass plan and chain MANY tool calls autonomously with less direct human oversight per step.",
  },

  quiz: [
    { id: 'c11q1', kind: 'concept', prompt: 'Why should tool_use arguments be treated as untrusted input?', options: ['They never need validation', 'Because they ultimately reflect user intent and could contain unexpected or crafted content', 'The model always sanitizes them first', 'Only user-typed text needs validation'], answerIndex: 1, explanation: "Model-generated tool arguments still originate from user-driven requests and shouldn't be blindly trusted." },
    { id: 'c11q2', kind: 'concept', prompt: 'What was the real risk in Lesson 8’s original run_calculator?', options: ['It was too slow', 'eval() could still be tricked into surprising behaviour, even with restricted builtins, if the input contained more than pure math', 'It used too many tokens', 'It didn’t support decimals'], answerIndex: 1, explanation: "An eval-based function is inherently risky unless input is first restricted to safe characters." },
    { id: 'c11q3', kind: 'application', prompt: 'What does an allow-list validation approach do?', options: ['Blocks a list of known-bad values', 'Permits ONLY a defined set of safe characters/values, rejecting everything else', 'Logs all input for review later', 'Encrypts the input'], answerIndex: 1, explanation: "An allow-list is a positive check — only explicitly permitted content passes." },
    { id: 'c11q4', kind: 'debug', prompt: 'A calculator input like "12 + 4" fails the allow-list check unexpectedly. What might be wrong?', options: ['Nothing, this should pass', 'The regex might be using re.match instead of re.fullmatch, or missing a required character (like space)', 'Regex can’t validate numbers', 'The input is too short'], answerIndex: 1, explanation: "re.match only checks the start of the string; re.fullmatch (or a missing allowed character) is the likely fix." },
    { id: 'c11q5', kind: 'concept', prompt: 'Does input_schema runtime-enforce a tool’s argument types?', options: ['Yes, completely', 'No — it guides the model’s request shape but your code must still validate at runtime', 'Only for string types', 'Only if the model is instructed to enforce it'], answerIndex: 1, explanation: "input_schema is a hint for the model, not a runtime guarantee your tool code can rely on." },
    { id: 'c11q6', kind: 'application', prompt: 'Why bound a tool’s input SIZE (e.g. max length), not just its type?', options: ['No real reason', 'An excessively long input could waste tokens, processing time, or cause other issues', 'Size limits are required by Python', 'It only matters for numbers'], answerIndex: 1, explanation: "Size bounds prevent resource waste or unexpected behaviour from unusually large input." },
    { id: 'c11q7', kind: 'concept', prompt: 'What does "fail closed" mean?', options: ['Retry until it succeeds', 'When validation fails or is uncertain, reject the action rather than proceeding anyway', 'Always return a cached result', 'Close the whole program on any error'], answerIndex: 1, explanation: "Fail closed means uncertain or invalid input results in rejection, not a risky attempt to proceed." },
    { id: 'c11q8', kind: 'output', prompt: 'Given the hardened run_calculator, what does an expression like "print(1)" return?', options: ['It executes print(1)', 'An error string, since letters and parentheses-as-function-call fail the allow-list', 'None', 'A number'], answerIndex: 1, explanation: "The allow-list only permits digits/operators/parentheses/dots/spaces — letters like 'print' are rejected." },
    { id: 'c11q9', kind: 'project', prompt: "Why doesn't hardening the tools require any changes to Compass's main loop or execute_tool dispatch?", options: ['It secretly does require changes', "Validation lives inside each tool's own implementation, which is exactly where input-specific safety belongs", 'The loop already validated everything', 'Dispatch functions can’t be changed'], answerIndex: 1, explanation: "Each tool owning its own validation keeps the dispatch/loop layer simple and unaffected by tool-specific rules." },
    { id: 'c11q10', kind: 'concept', prompt: 'Why does this safety discipline matter MORE as an agent gains more powerful tools later?', options: ['It doesn’t matter more, it’s the same at any scale', 'More powerful tools (with real-world side effects) make unsafe or unvalidated input increasingly risky', 'Safety only matters for calculators', 'Later tools are automatically safe by design'], answerIndex: 1, explanation: "As tools gain real consequences, the habit of validating and failing closed becomes increasingly important." },
  ],

  homework: {
    task:
      "Add a rate limit to run_web_search specifically: if it's called more than 5 times within any 60-second window, return an error instead of making the request, protecting against excessive tool usage from a runaway loop or unusual input.",
    requirements: [
      "Track recent call timestamps (a module-level list) scoped to run_web_search.",
      "Before making a request, filter out timestamps older than 60 seconds, then check if the remaining count is >= 5.",
      "If over the limit, return a clear error string without making the network call; otherwise proceed and record the new timestamp.",
    ],
    expectedOutcome:
      "Calling run_web_search 6+ times rapidly results in the 6th (and further, within the window) call being rejected with a clear rate-limit message, while calls under the limit proceed normally.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 10,
      hint: "Lesson 10 asked you to add basic caching to run_web_search, returning a cached result for a repeated identical query instead of a new network request.",
      steps: [
        "Declare a module-level cache: search_cache = {}.",
        "At the top of run_web_search, check if query in search_cache; if so, print a cache hit and return the cached value immediately.",
        "After a successful fetch and summarization, store search_cache[query] = summary before returning it.",
        "Test by searching the exact same query twice and confirming only one real network request happens (print a marker inside the try block to verify).",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "search_cache: dict[str, str] = {}\n\ndef run_web_search(query: str) -> str:\n    if query in search_cache:\n        print(\"[cache hit]\", query)\n        return search_cache[query]\n    # ...existing fetch + summarize logic...\n    # before the final return: search_cache[query] = summary\n    # return summary",
        },
      ],
    },
  },
};
