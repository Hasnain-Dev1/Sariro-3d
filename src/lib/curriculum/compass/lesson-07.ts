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
      "Learn what tool use actually is, how the model decides to call a tool, and how to define a tool's schema so Claude knows how and when to use it.",
    sections: [
      {
        heading: 'What tool use really means',
        body:
          "An LLM can't run code, browse the web, or check a calendar — it can only generate text. Tool use is a protocol where you DESCRIBE a function (its name, purpose, and inputs) to the model; if it decides that function would help answer the current question, it responds with a structured request to call it, with specific arguments. YOUR code then actually runs the function and sends the result back — the model itself never executes anything.",
      },
      {
        heading: 'Defining a tool: name, description, input schema',
        body:
          "A tool definition has three parts: a name (how the model refers to it), a description (tells the model WHEN and WHY to use it — this matters more than you'd expect), and an input_schema (a JSON Schema describing exactly what arguments it needs).",
        code: {
          language: 'typescript',
          code:
            "const calculatorTool = {\n  name: 'calculator',\n  description: 'Evaluates a basic arithmetic expression. Use this whenever the user asks a math question or needs a numeric calculation.',\n  input_schema: {\n    type: 'object' as const,\n    properties: {\n      expression: { type: 'string', description: 'A math expression, e.g. \"12 * 7\" or \"(4 + 5) / 3\"' },\n    },\n    required: ['expression'],\n  },\n};",
        },
      },
      {
        heading: 'Passing tools to the API',
        body:
          "You include your tool definitions in the tools array of the API call. The model then decides PER MESSAGE whether a tool would help — it might answer directly, or it might respond with a tool_use content block instead of (or alongside) text.",
        code: {
          language: 'typescript',
          code:
            "const response = await anthropic.messages.create({\n  model: 'claude-sonnet-5',\n  max_tokens: 400,\n  system: SYSTEM_PROMPT,\n  tools: [calculatorTool],\n  messages: [{ role: 'user', content: 'What is 847 * 23?' }],\n});",
        },
      },
      {
        heading: 'Recognising a tool_use response',
        body:
          "When the model wants to use a tool, response.content contains a block with type: 'tool_use', including the tool's name and the input arguments it decided to pass. response.stop_reason will be 'tool_use' too — a clear signal your code should now go run that tool (Lesson 8 covers actually executing it and sending the result back).",
        code: {
          language: 'typescript',
          code:
            "if (response.stop_reason === 'tool_use') {\n  const toolBlock = response.content.find((b) => b.type === 'tool_use');\n  console.log('Model wants to call:', toolBlock?.name, 'with', toolBlock?.input);\n}",
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
      { term: 'Tool definition', definition: "An object with name, description, and input_schema describing a callable function to the model." },
      { term: 'input_schema', definition: "A JSON Schema describing exactly what arguments a tool expects." },
      { term: 'tool_use block', definition: "A content block in the model's response requesting a specific tool call with arguments." },
      { term: 'stop_reason', definition: "A field on the response indicating WHY generation stopped, e.g. \"tool_use\" or \"end_turn\"." },
    ],
    commonMistakes: [
      "Writing a vague tool description, causing the model to never (or wrongly) use the tool.",
      "Forgetting the model does NOT execute the tool itself — your code must run it and send the result back (Lesson 8).",
      "Mismatching the input_schema with what the tool function actually expects, causing runtime errors.",
      "Not checking response.stop_reason, missing that a tool call is being requested.",
      "Defining too many overlapping tools with similar purposes, confusing which one the model should pick.",
    ],
    takeaways: [
      "Tool use lets an LLM REQUEST an action; your code actually performs it.",
      "A tool definition needs a name, a specific description, and an input_schema.",
      "Pass tools in the tools array of the API call.",
      "A tool_use response block + stop_reason: 'tool_use' signals the model wants to call a tool.",
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
      "Log whether the model requested the tool, and with what arguments.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'tool-detect.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nconst getTimeTool = {\n  name: 'get_time',\n  description: 'Returns the current date and time. Use this whenever the user asks what time or date it is.',\n  input_schema: { type: 'object' as const, properties: {}, required: [] },\n};\n\nasync function main() {\n  const response = await anthropic.messages.create({\n    model: 'claude-sonnet-5',\n    max_tokens: 200,\n    tools: [getTimeTool],\n    messages: [{ role: 'user', content: 'What time is it right now?' }],\n  });\n\n  console.log('stop_reason:', response.stop_reason);\n  const toolBlock = response.content.find((b) => b.type === 'tool_use');\n  console.log('Requested tool:', toolBlock?.name ?? 'none — answered directly');\n}\n\nmain();",
      },
    ],
    explanation:
      "get_time needs no arguments, so its input_schema has empty properties and an empty required array — still a valid, complete schema. Sending a question that clearly calls for the current time causes the model to respond with stop_reason: 'tool_use' and a content block naming 'get_time' instead of (or before) any text — proving the model correctly recognised it needed live information it doesn't have, and reached for the described tool rather than guessing.",
    expectedOutput:
      "Console shows 'stop_reason: tool_use' and 'Requested tool: get_time' — confirming the model identified the right tool for the question.",
    learned: [
      "How to define a tool with no arguments.",
      "How to detect a tool_use response.",
      "Why stop_reason is a reliable signal to check.",
      "That tool description quality directly affects correct triggering.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass gets its first real tool definition — a calculator — wired into its API calls (detection only; actual execution comes in Lesson 8).",
    why:
      "This is the first concrete step toward Compass being an AGENT rather than just a Q&A bot: it can now recognise when a question needs a real calculation instead of guessing an answer from text alone.",
    fileLocation: "compass-agent/index.ts (add the tool definition + pass it to askCompass)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near the top, after SYSTEM_PROMPT)',
        code:
          "const calculatorTool = {\n  name: 'calculator',\n  description: 'Evaluates a basic arithmetic expression. Use this whenever the user asks a math question or needs a precise numeric calculation, rather than estimating.',\n  input_schema: {\n    type: 'object' as const,\n    properties: {\n      expression: { type: 'string', description: 'A math expression, e.g. \"847 * 23\"' },\n    },\n    required: ['expression'],\n  },\n};\n\nconst TOOLS = [calculatorTool];",
      },
      {
        language: 'typescript',
        filename: 'index.ts (update askCompass to pass tools + log detection)',
        code:
          "async function askCompass(question: string): Promise<string> {\n  try {\n    const response = await withRetry(() =>\n      anthropic.messages.create({\n        model: 'claude-sonnet-5',\n        max_tokens: 400,\n        temperature: 0.2,\n        system: SYSTEM_PROMPT,\n        tools: TOOLS,\n        messages: [{ role: 'user', content: question }],\n      })\n    );\n\n    if (response.stop_reason === 'tool_use') {\n      const toolBlock = response.content.find((b) => b.type === 'tool_use');\n      console.log(`[tool requested] ${toolBlock?.name}(${JSON.stringify(toolBlock?.input)})`);\n      return \"(I'd like to use a tool here — Lesson 8 wires that up!)\";\n    }\n\n    return response.content[0].type === 'text' ? response.content[0].text : '';\n  } catch (err) {\n    console.error('[error] Compass could not get a response:', err);\n    return \"Sorry, I'm having trouble right now. Please try again in a moment.\";\n  }\n}",
      },
    ],
    placement:
      "Add the calculatorTool definition and the TOOLS array near your SYSTEM_PROMPT constant. Update askCompass() (the non-streaming version) to pass tools: TOOLS and add the stop_reason check shown, right after the retry-wrapped call succeeds.",
    implementation:
      "TOOLS is a small array so future lessons can simply add more tool objects to it — no other code needs to change to register a new tool. The stop_reason === 'tool_use' check is placed BEFORE the plain-text return, since a tool-use response's content[0] would be the tool_use block, not text — trying to read .text from it would fail. For now, detecting the request and logging it is the whole job; the placeholder message is honest about what's happening rather than pretending to answer.",
    expectedResult:
      "Asking Compass 'What is 847 times 23?' now logs '[tool requested] calculator({\"expression\":\"847 * 23\"})' and Compass admits it wants to use a tool — proof the model correctly recognised the need, even though nothing executes yet.",
    connects:
      "Lesson 8 is the natural next step: actually RUNNING the tool the model requested and sending the result back so Compass can give a real, correct answer instead of a placeholder.",
  },

  quiz: [
    { id: 'c7q1', kind: 'concept', prompt: 'Who actually EXECUTES a tool when the model requests one?', options: ['The model itself, internally', 'Your own code, using the arguments the model provided', 'The Anthropic servers automatically', 'It executes nowhere — it’s simulated'], answerIndex: 1, explanation: "The model only requests a tool call; your application code is responsible for actually running it." },
    { id: 'c7q2', kind: 'concept', prompt: 'What three things does a tool definition need?', options: ['name, price, category', 'name, description, input_schema', 'id, color, icon', 'model, temperature, max_tokens'], answerIndex: 1, explanation: "These three fields tell the model what the tool is called, when to use it, and what arguments it needs." },
    { id: 'c7q3', kind: 'application', prompt: 'Why does a vague tool description often cause problems?', options: ['It has no effect at all', 'The model may not reliably recognise WHEN to use the tool', 'It causes a syntax error', 'It slows down the API'], answerIndex: 1, explanation: "The description is what teaches the model when a tool applies — vagueness leads to missed or wrong usage." },
    { id: 'c7q4', kind: 'code_reading', prompt: 'What does response.stop_reason === \'tool_use\' indicate?', options: ['The request failed', 'The model wants to call a described tool instead of finishing with plain text', 'The conversation ended normally', 'A rate limit was hit'], answerIndex: 1, explanation: "This specific stop_reason signals a tool_use content block is present in the response." },
    { id: 'c7q5', kind: 'debug', prompt: 'A student tries response.content[0].text directly on a tool_use response and gets undefined/an error. Why?', options: ['The API is broken', 'content[0] is a tool_use block in that case, not a text block', 'text is spelled wrong', 'Tools disable text entirely'], answerIndex: 1, explanation: "When the model requests a tool, the relevant content block has a different shape than a plain text reply." },
    { id: 'c7q6', kind: 'application', prompt: 'For a tool needing no arguments, what should input_schema.properties be?', options: ['null', 'An empty object {}', 'Omitted entirely, breaking the schema', 'An array'], answerIndex: 1, explanation: "An empty properties object with an empty required array is a valid schema describing zero needed inputs." },
    { id: 'c7q7', kind: 'output', prompt: 'Given the calculator tool and the question "What is 847 * 23?", what would you expect in the tool_use block’s input?', options: ['{}', '{ expression: "847 * 23" }', '{ answer: 19481 }', 'No input is included'], answerIndex: 1, explanation: "The model extracts the relevant arithmetic expression and passes it as the expression argument per the schema." },
    { id: 'c7q8', kind: 'concept', prompt: 'Why is defining a tool description considered a form of prompt engineering?', options: ['It isn’t related to prompting at all', 'Its specificity directly determines when/how reliably the model chooses to use the tool', 'Descriptions are purely for human readers, ignored by the model', 'Tool descriptions are auto-generated'], answerIndex: 1, explanation: "The same clarity/specificity principles from prompt engineering apply directly to writing tool descriptions." },
    { id: 'c7q9', kind: 'project', prompt: "Why does Compass's final project return a placeholder message instead of a real answer when a tool is requested?", options: ['A permanent limitation of tool use', 'Lesson 7 only covers DETECTING the request; actually running the tool and returning its result is Lesson 8', 'It’s a bug', 'Tools can’t return real answers ever'], answerIndex: 1, explanation: "This lesson deliberately stops at detection; execution is the next lesson's focus." },
    { id: 'c7q10', kind: 'concept', prompt: 'What completes the "agent loop" concept from Lesson 1 once tools are fully wired up?', options: ['Nothing changes', 'The model can now act (via tools) and use results to continue reasoning, not just produce text', 'The system prompt becomes irrelevant', 'Streaming becomes unnecessary'], answerIndex: 1, explanation: "Tool use is exactly the 'act, then re-decide' part of the agent loop that was missing before Module 2." },
  ],

  homework: {
    task:
      "Add a SECOND tool definition, get_word_count, that takes a text string and (conceptually) returns how many words it contains — for now, just add it to TOOLS and confirm the model correctly requests it for an appropriate question, without executing it yet.",
    requirements: [
      "Define get_word_count with a clear description and an input_schema requiring a text string parameter.",
      "Add it to the TOOLS array alongside calculatorTool.",
      "Test with a question like 'How many words are in this sentence: The quick brown fox jumps.' and confirm the RIGHT tool (not calculator) is requested.",
    ],
    expectedOutcome:
      "Asking a word-count question triggers get_word_count specifically, while a math question still correctly triggers calculator — proving the model distinguishes between them based on their descriptions.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 6,
      hint: "Lesson 6 asked you to add a 'help' command to the REPL that prints available commands without calling the API.",
      steps: [
        "In the REPL loop, check the trimmed/lowercased input for 'help' the same way 'exit' is checked, BEFORE the empty-input guard.",
        "On match, print a short message listing 'exit' and 'help', plus a one-line reminder of what Compass does.",
        "Use continue to skip the rest of the loop body (no API call) and re-prompt.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside the REPL loop)',
          code:
            "if (trimmed.toLowerCase() === 'help') {\n  console.log('Commands: \"exit\" to quit, \"help\" for this message.\\nAsk me any research or task question!\\n');\n  continue;\n}",
        },
      ],
    },
  },
};
