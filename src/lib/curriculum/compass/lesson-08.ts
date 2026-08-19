import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 8 — Executing Tools & Returning Results
 * Module 2 (Tool Use) · Lesson 8 of 30
 */
export const lesson08: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 2,
  lessonIndex: 1,
  globalNumber: 8,
  name: 'Tool execution + results',
  title: 'Executing Tools — Closing the Loop',
  subtitle: "Actually run the calculator and send its result back to Claude for a real, final answer.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to execute a requested tool, send its result back to the model in a tool_result message, and get a final, grounded answer.",
    sections: [
      {
        heading: 'The full round trip',
        body:
          "Tool use is a CONVERSATION, not a single call: (1) you send a question with tools available, (2) the model replies with a tool_use block, (3) YOUR code runs the actual tool function, (4) you send a NEW message containing a tool_result with that output, (5) the model reads the result and gives a final text answer. This is the agent loop from Lesson 1, now fully real.",
      },
      {
        heading: 'Executing the tool',
        body:
          "The tool_use block gives you the tool's name and input arguments — you write a plain function that does the real work (here, evaluating a math expression) and call it based on which tool was requested.",
        code: {
          language: 'typescript',
          code:
            "function runCalculator(expression: string): string {\n  try {\n    // A safe-ish evaluator for basic arithmetic (Lesson 8's simple approach).\n    const result = Function(`\"use strict\"; return (${expression})`)();\n    return String(result);\n  } catch {\n    return 'Error: could not evaluate that expression.';\n  }\n}",
        },
      },
      {
        heading: 'Sending a tool_result back',
        body:
          "You build a NEW messages array: the original user message, the model's tool_use response (as an assistant turn), and a new user turn containing a tool_result block referencing the tool's tool_use_id and your output. Sending this back lets the model finish its answer using REAL data.",
        code: {
          language: 'typescript',
          code:
            "const followUp = await anthropic.messages.create({\n  model: 'claude-sonnet-5',\n  max_tokens: 400,\n  tools: TOOLS,\n  messages: [\n    { role: 'user', content: question },\n    { role: 'assistant', content: response.content },   // the model's tool_use turn\n    {\n      role: 'user',\n      content: [{\n        type: 'tool_result',\n        tool_use_id: toolBlock.id,\n        content: toolOutput,\n      }],\n    },\n  ],\n});",
        },
      },
      {
        heading: 'Why the tool_use_id matters',
        body:
          "Every tool_use block has a unique id. Your tool_result MUST reference that exact id — this is how the model matches your result to the specific request it made, especially important once an agent can request MULTIPLE tools at once (a later lesson).",
      },
      {
        heading: 'A model can loop through multiple tool calls',
        body:
          "Sometimes the model needs one tool result before it can decide whether ANOTHER tool call is needed — a genuine multi-step loop. For now, Compass handles a single tool round-trip; Module 4 (Planning + Reasoning) builds a proper repeating loop that keeps going until the model is done.",
      },
    ],
    keyTerms: [
      { term: 'tool_result', definition: "A message content block sending a tool's output back to the model, referencing its tool_use_id." },
      { term: 'tool_use_id', definition: "A unique id on a tool_use block, used to match a later tool_result to the correct request." },
      { term: 'Round trip', definition: "The full exchange: question → tool_use request → your execution → tool_result → final answer." },
      { term: 'Grounded answer', definition: "A reply based on REAL tool output, not the model's own (possibly wrong) internal guess." },
    ],
    commonMistakes: [
      "Forgetting to include the model's ORIGINAL tool_use response as an assistant turn in the follow-up messages array.",
      "Sending a tool_result with the wrong (or missing) tool_use_id, so the model can't match it to its request.",
      "Not handling a tool execution failure — if runCalculator throws, the follow-up needs to know that too.",
      "Assuming one tool round-trip always finishes the answer — sometimes another tool call is needed.",
      "Using an unsafe evaluator for arbitrary user input in a REAL product (this lesson's simple Function()-based evaluator is a stepping stone, not production-safe).",
    ],
    takeaways: [
      "A full tool-use exchange is a multi-message round trip, not one call.",
      "Execute the tool yourself, then send its output back as a tool_result.",
      "Always include the model's original tool_use turn AND match the tool_use_id exactly.",
      "The final follow-up call returns a real, grounded text answer.",
      "Some agents need to loop through several tool calls — a pattern built out fully in Module 4.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A complete tool round trip',
    objective:
      "Practise the full request → execute → result → final-answer cycle with a simple tool, end to end.",
    instructions: [
      "Define a get_time tool (no arguments, as in Lesson 7).",
      "Ask a question that triggers it.",
      "Execute it (just return the real current time from JS).",
      "Send the result back and print the model's FINAL answer.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'round-trip.ts',
        code:
          "import 'dotenv/config';\nimport Anthropic from '@anthropic-ai/sdk';\n\nconst anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });\n\nconst getTimeTool = {\n  name: 'get_time',\n  description: 'Returns the current date and time.',\n  input_schema: { type: 'object' as const, properties: {}, required: [] },\n};\n\nasync function main() {\n  const question = 'What time is it right now?';\n  const first = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200, tools: [getTimeTool],\n    messages: [{ role: 'user', content: question }],\n  });\n\n  const toolBlock = first.content.find((b) => b.type === 'tool_use');\n  if (!toolBlock) { console.log('No tool needed:', first.content); return; }\n\n  const toolOutput = new Date().toString();   // \"execute\" the tool for real\n\n  const followUp = await anthropic.messages.create({\n    model: 'claude-sonnet-5', max_tokens: 200, tools: [getTimeTool],\n    messages: [\n      { role: 'user', content: question },\n      { role: 'assistant', content: first.content },\n      { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: toolOutput }] },\n    ],\n  });\n\n  console.log(followUp.content[0].type === 'text' ? followUp.content[0].text : '');\n}\n\nmain();",
      },
    ],
    explanation:
      "The first call detects the need for get_time and returns a tool_use block. new Date().toString() IS the actual tool execution — a genuine real value, not simulated. The followUp call rebuilds the full conversation: the original question, the model's own tool_use turn (passed through unchanged as first.content), and a new tool_result turn carrying the real time, matched to the exact tool_use_id. The model then reads that real value and answers with it directly — a genuinely grounded, correct final answer rather than a guess.",
    expectedOutput:
      "The final printed text states the actual current date/time, correctly derived from the real value your code provided — not a made-up guess.",
    learned: [
      "How to execute a tool for real and capture its output.",
      "How to construct a correct follow-up messages array.",
      "Why matching tool_use_id is essential.",
      "How a grounded, tool-based answer differs from a guessed one.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's calculator tool is FULLY wired — it detects, executes, and returns a real, correct grounded answer to math questions.",
    why:
      "This closes the loop Lesson 7 started: Compass no longer just admits it wants a tool — it genuinely uses one and gives a correct, computed answer.",
    fileLocation: "compass-agent/index.ts (add runCalculator + complete the round trip in askCompass)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (add near TOOLS)',
        code:
          "function runCalculator(expression: string): string {\n  try {\n    const result = Function(`\"use strict\"; return (${expression})`)();\n    return String(result);\n  } catch {\n    return 'Error: could not evaluate that expression.';\n  }\n}",
      },
      {
        language: 'typescript',
        filename: 'index.ts (replace the tool_use handling in askCompass)',
        code:
          "async function askCompass(question: string): Promise<string> {\n  try {\n    const response = await withRetry(() =>\n      anthropic.messages.create({\n        model: 'claude-sonnet-5', max_tokens: 400, temperature: 0.2,\n        system: SYSTEM_PROMPT, tools: TOOLS,\n        messages: [{ role: 'user', content: question }],\n      })\n    );\n\n    if (response.stop_reason === 'tool_use') {\n      const toolBlock = response.content.find((b) => b.type === 'tool_use');\n      if (!toolBlock) return 'Something went wrong reading the tool request.';\n\n      let toolOutput: string;\n      if (toolBlock.name === 'calculator') {\n        const { expression } = toolBlock.input as { expression: string };\n        toolOutput = runCalculator(expression);\n        console.log(`[tool] calculator(\"${expression}\") = ${toolOutput}`);\n      } else {\n        toolOutput = 'Error: unknown tool.';\n      }\n\n      const followUp = await withRetry(() =>\n        anthropic.messages.create({\n          model: 'claude-sonnet-5', max_tokens: 400, temperature: 0.2,\n          system: SYSTEM_PROMPT, tools: TOOLS,\n          messages: [\n            { role: 'user', content: question },\n            { role: 'assistant', content: response.content },\n            { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: toolOutput }] },\n          ],\n        })\n      );\n      return followUp.content[0].type === 'text' ? followUp.content[0].text : '';\n    }\n\n    return response.content[0].type === 'text' ? response.content[0].text : '';\n  } catch (err) {\n    console.error('[error] Compass could not get a response:', err);\n    return \"Sorry, I'm having trouble right now. Please try again in a moment.\";\n  }\n}",
      },
    ],
    placement:
      "Add runCalculator near your TOOLS array. Replace the tool_use branch inside askCompass() (the placeholder from Lesson 7) with the full round-trip version above — everything else in the file (SYSTEM_PROMPT, withRetry, TOOLS) stays the same.",
    implementation:
      "The if (toolBlock.name === 'calculator') check makes the code EXTENSIBLE — Lesson 9's homework tool and future tools just add another branch here. runCalculator is wrapped in try/catch internally, so a malformed expression returns a clear error string INSTEAD of crashing — and that error string is itself sent back to Claude as the tool_result, letting the model explain the problem to the user naturally rather than your code needing special-case handling for it. The followUp call reuses withRetry, so this second network round-trip is just as resilient as the first.",
    expectedResult:
      "Asking Compass 'What is 847 times 23?' now logs '[tool] calculator(\"847 * 23\") = 19481' and Compass replies with a real, correct, grounded answer — e.g. '847 × 23 is 19,481.'",
    connects:
      "Compass now has ONE fully working tool. Lesson 9 gives it a SECOND real tool (not just detected, but executed) to reinforce the pattern and start thinking about multi-tool selection, ahead of Module 4's full multi-step reasoning loop.",
  },

  quiz: [
    { id: 'c8q1', kind: 'concept', prompt: 'What are the FIVE steps of a complete tool-use round trip?', options: ['Ask, wait, ask again', 'Send question -> tool_use response -> execute tool -> send tool_result -> final answer', 'Login, query, logout, retry, done', 'Prompt, temperature, tokens, model, response'], answerIndex: 1, explanation: "This is the full cycle described in the concept section — a genuine multi-message exchange." },
    { id: 'c8q2', kind: 'code_reading', prompt: 'Why must the follow-up messages array include the model’s ORIGINAL tool_use response as an assistant turn?', options: ['It’s optional and can be skipped', 'So the model has full context of what it asked for when it reads the result', 'It changes the API key', 'It’s only for logging'], answerIndex: 1, explanation: "Including the model's own prior turn preserves conversational context for interpreting the result correctly." },
    { id: 'c8q3', kind: 'concept', prompt: 'What is tool_use_id used for?', options: ['Rate limiting', 'Matching a tool_result to the specific tool_use request it answers', 'Billing', 'Model selection'], answerIndex: 1, explanation: "It's the identifier connecting a result back to the exact request that triggered it." },
    { id: 'c8q4', kind: 'debug', prompt: 'A follow-up call is sent WITHOUT the tool_use_id matching the original request. What happens?', options: ['It works exactly the same', 'The model can’t correctly match the result to its request, likely causing confusion or an error', 'It automatically retries', 'The API ignores tool_use_id entirely'], answerIndex: 1, explanation: "Correct matching is required for the model to interpret the tool_result properly." },
    { id: 'c8q5', kind: 'application', prompt: 'Why wrap runCalculator’s evaluation in try/catch?', options: ['It’s unnecessary', 'A malformed expression could throw; catching it lets a clear error message be returned instead of crashing', 'It changes the tool’s name', 'It’s required by the API'], answerIndex: 1, explanation: "Defensive error handling inside the tool itself prevents a bad input from crashing the whole flow." },
    { id: 'c8q6', kind: 'output', prompt: 'What does the followUp call ultimately return, once a tool_result has been sent?', options: ['Another tool_use request always', 'A final, grounded text answer using the real tool output', 'The same tool_use block again', 'An empty response'], answerIndex: 1, explanation: "With the real result in hand, the model typically completes its answer as plain text." },
    { id: 'c8q7', kind: 'application', prompt: 'Why send the calculator’s ERROR string back as a tool_result instead of handling the error separately in your own code?', options: ['You must always crash on tool errors', 'Letting the model see the error lets IT explain the problem to the user naturally, without special-case code', 'It’s not possible to send an error as a result', 'Error strings are invalid tool_result content'], answerIndex: 1, explanation: "The model can incorporate the error into a natural-language explanation, avoiding duplicate error-handling logic." },
    { id: 'c8q8', kind: 'code_reading', prompt: 'Why does the tool_use handling check toolBlock.name against specific known tool names?', options: ['It’s unnecessary', 'To route execution to the correct function per tool, and stay extensible as more tools are added', 'Names are ignored by the API', 'It only matters for the calculator tool'], answerIndex: 1, explanation: "Checking the name lets the code dispatch to the right implementation, and scales cleanly as more tools are added." },
    { id: 'c8q9', kind: 'project', prompt: "Why does the followUp call in Compass's final project reuse withRetry, just like the first call?", options: ['It’s redundant and unnecessary', 'The follow-up is ALSO a real network call that can transiently fail, so it deserves the same reliability', 'withRetry only works once per session', 'Retries are only needed for tool_use responses'], answerIndex: 1, explanation: "Every network call, including the follow-up, benefits from the same resilience pattern." },
    { id: 'c8q10', kind: 'concept', prompt: 'What limitation does this lesson’s implementation still have, addressed later in Module 4?', options: ['It cannot use any tools at all', 'It handles only ONE tool round-trip; a full repeating loop for multiple sequential tool calls comes later', 'It cannot use the calculator tool', 'It has no error handling'], answerIndex: 1, explanation: "This lesson handles a single round-trip; a genuine multi-step loop is Module 4's focus." },
  ],

  homework: {
    task:
      "Implement the get_word_count tool from Lesson 7's homework FOR REAL: add a runWordCount(text) function, wire it into the tool_use branch, and confirm Compass gives a correct, grounded word count.",
    requirements: [
      "Write runWordCount(text: string): string that splits on whitespace and returns the count as a string.",
      "Add an else-if branch for toolBlock.name === 'get_word_count' calling it.",
      "Test with a real sentence and confirm the returned count is actually correct.",
    ],
    expectedOutcome:
      "Asking Compass to count words in a sentence returns the CORRECT count, grounded in a real computation — not a guess.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 7,
      hint: "Lesson 7 asked you to define a SECOND tool, get_word_count, and confirm the model requests it correctly for word-count questions (detection only, no execution yet).",
      steps: [
        "Define get_word_count with a description like 'Counts the number of words in a piece of text.'",
        "Its input_schema needs one required string property, e.g. text.",
        "Add it to the TOOLS array: const TOOLS = [calculatorTool, getWordCountTool];",
        "Ask a word-count question and a math question separately, confirming each triggers the RIGHT tool by name in the logged output.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts',
          code:
            "const getWordCountTool = {\n  name: 'get_word_count',\n  description: 'Counts the number of words in a piece of text. Use this when the user asks how many words something has.',\n  input_schema: {\n    type: 'object' as const,\n    properties: { text: { type: 'string', description: 'The text to count words in.' } },\n    required: ['text'],\n  },\n};\nconst TOOLS = [calculatorTool, getWordCountTool];",
        },
      ],
    },
  },
};
