import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 7 — What Is Tool Use?
 * Module 2 (Tool Use) · Lesson 7 of 30
 */
export const lesson07: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 2,
  lessonIndex: 0,
  globalNumber: 7,
  name: 'What is tool use?',
  title: 'Tool Use — Giving Compass the Ability to Act',
  subtitle: "Understand how an LLM calls a tool, and define Compass's first one: a calculator.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what tool use actually is, how the model decides to call a tool, and how to define a tool's schema in Python so the model knows how and when to use it.",
    sections: [
      {
        heading: 'What tool use really means',
        body:
          "An LLM can't run code, browse the web, or check a calendar — it can only generate text. Tool use is a protocol where you DESCRIBE a function (its name, purpose, and inputs) to the model; if it decides that function would help answer the current question, it responds with a structured request to call it, with specific arguments. YOUR code then actually runs the function and sends the result back — the model itself never executes anything.",
      },
      {
        heading: 'Defining a tool: type, function name, description, parameters',
        body:
          "In the openai package, a tool definition is a dict with \"type\": \"function\" and a nested \"function\" dict holding name (how the model refers to it), description (tells the model WHEN and WHY to use it — this matters more than you'd expect), and parameters (a JSON Schema describing exactly what arguments it needs).",
        code: {
          language: 'python',
          code:
            "calculator_tool = {\n    \"type\": \"function\",\n    \"function\": {\n        \"name\": \"calculator\",\n        \"description\": \"Evaluates a basic arithmetic expression. Use this whenever the user asks a math question or needs a numeric calculation.\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\n                \"expression\": {\"type\": \"string\", \"description\": \"A math expression, e.g. '12 * 7' or '(4 + 5) / 3'\"},\n            },\n            \"required\": [\"expression\"],\n        },\n    },\n}",
        },
      },
      {
        heading: 'Passing tools to the API',
        body:
          "You include your tool definitions in the tools parameter of the API call, exactly like any other parameter. The model then decides PER MESSAGE whether a tool would help — it might answer directly, or it might respond with one or more tool calls instead of (or alongside) text.",
        code: {
          language: 'python',
          code:
            "response = client.chat.completions.create(\n    model=MODEL,\n    max_tokens=400,\n    tools=[calculator_tool],\n    messages=[\n        {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n        {\"role\": \"user\", \"content\": \"What is 847 * 23?\"},\n    ],\n)",
        },
      },
      {
        heading: 'Recognising a tool-call response',
        body:
          "When the model wants to use a tool, response.choices[0].message.tool_calls is a non-empty list — each item has an id, and a .function.name plus a .function.arguments JSON STRING (not a parsed dict) describing what it wants to call. A truthy tool_calls list is your clear signal your code should now go run that tool (Lesson 8 covers actually executing it and sending the result back).",
        code: {
          language: 'python',
          code:
            "import json\n\ntool_calls = response.choices[0].message.tool_calls\nif tool_calls:\n    call = tool_calls[0]\n    args = json.loads(call.function.arguments)\n    print(\"Model wants to call:\", call.function.name, \"with\", args)",
        },
      },
      {
        heading: 'The description field is doing real work',
        body:
          "A vague tool description ('does math') often gets ignored or misused; a specific one ('use this whenever the user asks a math question') reliably triggers at the right moments. Writing a tool's description is itself a form of prompt engineering — the same specificity principles from Lesson 3 apply directly here.",
      },
    ],
    keyTerms: [
      { term: 'Tool use', definition: "A protocol where an LLM can request that YOUR code run a described function, using its result to continue answering." },
      { term: 'Tool definition', definition: "A dict with type: 'function' and a nested function block (name, description, parameters) describing a callable function to the model." },
      { term: 'parameters', definition: "A JSON Schema describing exactly what arguments a tool expects." },
      { term: 'tool_calls', definition: "A list on the response message requesting one or more specific tool calls with arguments." },
      { term: 'function.arguments', definition: "A JSON STRING of the arguments the model wants to pass — must be parsed with json.loads() before use." },
    ],
    commonMistakes: [
      "Writing a vague tool description, causing the model to never (or wrongly) use the tool.",
      "Forgetting the model does NOT execute the tool itself — your code must run it and send the result back (Lesson 8).",
      "Mismatching the parameters schema with what the tool function actually expects, causing runtime errors.",
      "Forgetting function.arguments is a JSON STRING, and trying to use it directly without json.loads().",
      "Defining too many overlapping tools with similar purposes, confusing which one the model should pick.",
    ],
    takeaways: [
      "Tool use lets an LLM REQUEST an action; your code actually performs it.",
      "A tool definition needs type: 'function' plus a name, a specific description, and a parameters schema.",
      "Pass tools in the tools parameter of the API call.",
      "A truthy response.choices[0].message.tool_calls signals the model wants to call one or more tools.",
      "A tool's description is prompt engineering — specificity determines when it gets used correctly.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Detecting a tool request',
    objective:
      "Practise defining a tool and recognising when the model wants to use it, without executing anything yet.",
    instructions: [
      "Define a simple 'get_time' tool with no required arguments (returns the current time).",
      "Ask a question that should trigger it ('What time is it?').",
      "Print whether the model requested the tool, and with what arguments.",
    ],
    code: [
      {
        language: 'python',
        filename: 'tool_detect.py',
        code:
          "import json\nfrom dotenv import load_dotenv\nfrom openai import OpenAI\n\nload_dotenv()\nclient = OpenAI()\nMODEL = \"gpt-4o-mini\"\n\nget_time_tool = {\n    \"type\": \"function\",\n    \"function\": {\n        \"name\": \"get_time\",\n        \"description\": \"Returns the current date and time. Use this whenever the user asks what time or date it is.\",\n        \"parameters\": {\"type\": \"object\", \"properties\": {}, \"required\": []},\n    },\n}\n\ndef main():\n    response = client.chat.completions.create(\n        model=MODEL,\n        max_tokens=200,\n        tools=[get_time_tool],\n        messages=[{\"role\": \"user\", \"content\": \"What time is it right now?\"}],\n    )\n\n    message = response.choices[0].message\n    tool_calls = message.tool_calls\n    if tool_calls:\n        print(\"Requested tool:\", tool_calls[0].function.name)\n    else:\n        print(\"Requested tool: none — answered directly:\", message.content)\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "get_time needs no arguments, so its parameters schema has empty properties and an empty required list — still a valid, complete schema. Sending a question that clearly calls for the current time causes the model to respond with a non-empty tool_calls list naming 'get_time', instead of (or before) any text — proving the model correctly recognised it needed live information it doesn't have, and reached for the described tool rather than guessing. Checking `if tool_calls:` is the OpenAI-shape equivalent of checking a stop reason — a simple truthiness check on the list.",
    expectedOutput:
      "Console shows 'Requested tool: get_time' — confirming the model identified the right tool for the question.",
    learned: [
      "How to define a tool with no arguments.",
      "How to detect a tool-call response.",
      "Why checking tool_calls truthiness is a reliable signal.",
      "How to read a tool call's function name from the response.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gets its first real tool definition — a calculator — wired into its API calls (detection only; actual execution comes in Lesson 8).",
    why:
      "This is the first concrete step toward Compass being an AGENT rather than just a Q&A bot: it can now recognise when a question needs a real calculation instead of guessing an answer from text alone.",
    fileLocation: "compass-agent/main.py (add the tool definition + pass it to ask_compass)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add near the top, after SYSTEM_PROMPT)',
        code:
          "calculator_tool = {\n    \"type\": \"function\",\n    \"function\": {\n        \"name\": \"calculator\",\n        \"description\": \"Evaluates a basic arithmetic expression. Use this whenever the user asks a math question or needs a precise numeric calculation, rather than estimating.\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\n                \"expression\": {\"type\": \"string\", \"description\": \"A math expression, e.g. '847 * 23'\"},\n            },\n            \"required\": [\"expression\"],\n        },\n    },\n}\n\nTOOLS = [calculator_tool]",
      },
      {
        language: 'python',
        filename: 'main.py (update ask_compass to pass tools + log detection)',
        code:
          "def ask_compass(question: str) -> str:\n    try:\n        response = with_retry(lambda: client.chat.completions.create(\n            model=MODEL,\n            max_tokens=400,\n            temperature=0.2,\n            tools=TOOLS,\n            messages=[\n                {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n                {\"role\": \"user\", \"content\": question},\n            ],\n        ))\n\n        message = response.choices[0].message\n        if message.tool_calls:\n            call = message.tool_calls[0]\n            args = json.loads(call.function.arguments)\n            print(f\"[tool requested] {call.function.name}({args})\")\n            return \"(I'd like to use a tool here — Lesson 8 wires that up!)\"\n\n        return message.content\n    except Exception as err:\n        print(f\"[error] Compass could not get a response: {err}\")\n        return \"Sorry, I'm having trouble right now. Please try again in a moment.\"",
      },
    ],
    placement:
      "Add the calculator_tool definition and the TOOLS list near your SYSTEM_PROMPT constant. Add `import json` near your other imports. Update ask_compass() (the non-streaming version) to pass tools=TOOLS and add the tool_calls check shown, right after the retry-wrapped call succeeds.",
    implementation:
      "TOOLS is a small list so future lessons can simply add more tool dicts to it — no other code needs to change to register a new tool. The `if message.tool_calls:` check is placed BEFORE the plain-text return, since a tool-call response's message.content is typically None rather than useful text — reading it as the final answer would be wrong. For now, detecting the request and printing it is the whole job; the placeholder message is honest about what's happening rather than pretending to answer.",
    expectedResult:
      "Asking Compass 'What is 847 times 23?' now prints \"[tool requested] calculator({'expression': '847 * 23'})\" and Compass admits it wants to use a tool — proof the model correctly recognised the need, even though nothing executes yet.",
    connects:
      "Lesson 8 is the natural next step: actually RUNNING the tool the model requested and sending the result back so Compass can give a real, correct answer instead of a placeholder.",
  },

  quiz: [
    { id: 'c7q1', kind: 'concept', prompt: 'Who actually EXECUTES a tool when the model requests one?', options: ['The model itself, internally', 'Your own code, using the arguments the model provided', 'The AI provider’s servers automatically', 'It executes nowhere — it’s simulated'], answerIndex: 1, explanation: "The model only requests a tool call; your application code is responsible for actually running it." },
    { id: 'c7q2', kind: 'concept', prompt: 'What does a function-calling tool definition need under its "function" key?', options: ['price, category, icon', 'name, description, parameters', 'id, color, size', 'model, temperature, max_tokens'], answerIndex: 1, explanation: "These three fields tell the model what the tool is called, when to use it, and what arguments it needs." },
    { id: 'c7q3', kind: 'application', prompt: 'Why does a vague tool description often cause problems?', options: ['It has no effect at all', 'The model may not reliably recognise WHEN to use the tool', 'It causes a syntax error', 'It slows down the API'], answerIndex: 1, explanation: "The description is what teaches the model when a tool applies — vagueness leads to missed or wrong usage." },
    { id: 'c7q4', kind: 'code_reading', prompt: 'What does a truthy response.choices[0].message.tool_calls indicate?', options: ['The request failed', 'The model wants to call one or more described tools instead of (or before) finishing with plain text', 'The conversation ended normally', 'A rate limit was hit'], answerIndex: 1, explanation: "A non-empty tool_calls list means the model is requesting a function call." },
    { id: 'c7q5', kind: 'debug', prompt: 'A student tries to use tool_call.function.arguments directly as a dict and gets a TypeError. Why?', options: ['The API is broken', 'function.arguments is a JSON STRING that must be parsed with json.loads() first', 'arguments is spelled wrong', 'Tools disable arguments entirely'], answerIndex: 1, explanation: "Unlike some other SDKs, arguments arrives as a raw JSON string, not a pre-parsed object." },
    { id: 'c7q6', kind: 'application', prompt: 'For a tool needing no arguments, what should parameters["properties"] be?', options: ['None', 'An empty dict {}', 'Omitted entirely, breaking the schema', 'A list'], answerIndex: 1, explanation: "An empty properties dict with an empty required list is a valid schema describing zero needed inputs." },
    { id: 'c7q7', kind: 'output', prompt: 'Given the calculator tool and the question "What is 847 * 23?", what would you expect json.loads(call.function.arguments) to look like?', options: ['{}', "{'expression': '847 * 23'}", "{'answer': 19481}", 'No arguments at all'], answerIndex: 1, explanation: "The model extracts the relevant arithmetic expression and passes it as the expression argument per the schema." },
    { id: 'c7q8', kind: 'concept', prompt: 'Why is defining a tool description considered a form of prompt engineering?', options: ['It isn’t related to prompting at all', 'Its specificity directly determines when/how reliably the model chooses to use the tool', 'Descriptions are purely for human readers, ignored by the model', 'Tool descriptions are auto-generated'], answerIndex: 1, explanation: "The same clarity/specificity principles from prompt engineering apply directly to writing tool descriptions." },
    { id: 'c7q9', kind: 'project', prompt: "Why does Compass's final project return a placeholder message instead of a real answer when a tool is requested?", options: ['A permanent limitation of tool use', 'Lesson 7 only covers DETECTING the request; actually running the tool and returning its result is Lesson 8', 'It’s a bug', 'Tools can’t return real answers ever'], answerIndex: 1, explanation: "This lesson deliberately stops at detection; execution is the next lesson's focus." },
    { id: 'c7q10', kind: 'concept', prompt: 'What completes the "agent loop" concept from Lesson 1 once tools are fully wired up?', options: ['Nothing changes', 'The model can now act (via tools) and use results to continue reasoning, not just produce text', 'The system prompt becomes irrelevant', 'Streaming becomes unnecessary'], answerIndex: 1, explanation: "Tool use is exactly the 'act, then re-decide' part of the agent loop that was missing before Module 2." },
  ],

  homework: {
    task:
      "Add a SECOND tool definition, get_word_count, that takes a text string and (conceptually) returns how many words it contains — for now, just add it to TOOLS and confirm the model correctly requests it for an appropriate question, without executing it yet.",
    requirements: [
      "Define get_word_count with a clear description and a parameters schema requiring a text string.",
      "Add it to the TOOLS list alongside calculator_tool.",
      "Test with a question like 'How many words are in this sentence: The quick brown fox jumps.' and confirm the RIGHT tool (not calculator) is requested.",
    ],
    expectedOutcome:
      "Asking a word-count question triggers get_word_count specifically, while a math question still correctly triggers calculator — proving the model distinguishes between them based on their descriptions.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 6,
      hint: "Lesson 6 asked you to add a 'help' command to the REPL that prints available commands without calling the API.",
      steps: [
        "In the REPL loop, check the stripped/lowercased input for 'help' the same way 'exit' is checked, BEFORE the empty-input guard.",
        "On match, print a short message listing 'exit' and 'help', plus a one-line reminder of what Compass does.",
        "Use continue to skip the rest of the loop body (no API call) and re-prompt.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py (inside the REPL loop)',
          code:
            "if question.lower() == \"help\":\n    print('Commands: \"exit\" to quit, \"help\" for this message.')\n    print(\"Ask me any research or task question!\\n\")\n    continue",
        },
      ],
    },
  },
};
