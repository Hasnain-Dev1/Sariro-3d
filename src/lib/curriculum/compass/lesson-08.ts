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
          language: 'python',
          code:
            "def run_calculator(expression: str) -> str:\n    try:\n        # A simple evaluator for basic arithmetic (Lesson 8's approach).\n        result = eval(expression, {\"__builtins__\": {}}, {})\n        return str(result)\n    except Exception:\n        return \"Error: could not evaluate that expression.\"",
        },
      },
      {
        heading: 'Sending a tool_result back',
        body:
          "You build a NEW messages list: the original user message, the model's tool_use response (as an assistant turn), and a new user turn containing a tool_result block referencing the tool's id (tool_use_id) and your output. Sending this back lets the model finish its answer using REAL data.",
        code: {
          language: 'python',
          code:
            "follow_up = client.messages.create(\n    model=\"claude-sonnet-5\",\n    max_tokens=400,\n    tools=TOOLS,\n    messages=[\n        {\"role\": \"user\", \"content\": question},\n        {\"role\": \"assistant\", \"content\": response.content},   # the model's tool_use turn\n        {\n            \"role\": \"user\",\n            \"content\": [{\n                \"type\": \"tool_result\",\n                \"tool_use_id\": tool_block.id,\n                \"content\": tool_output,\n            }],\n        },\n    ],\n)",
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
      "Forgetting to include the model's ORIGINAL tool_use response as an assistant turn in the follow-up messages list.",
      "Sending a tool_result with the wrong (or missing) tool_use_id, so the model can't match it to its request.",
      "Not handling a tool execution failure — if run_calculator raises, the follow-up needs to know that too.",
      "Assuming one tool round-trip always finishes the answer — sometimes another tool call is needed.",
      "Using Python's plain eval() on arbitrary user-influenced input in a REAL product without restriction (this lesson's restricted eval with empty builtins is a stepping stone toward Lesson 11's full safety treatment, not production-final).",
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
      "Execute it (just return the real current time from Python).",
      "Send the result back and print the model's FINAL answer.",
    ],
    code: [
      {
        language: 'python',
        filename: 'round_trip.py',
        code:
          "from datetime import datetime\nfrom dotenv import load_dotenv\nimport anthropic\n\nload_dotenv()\nclient = anthropic.Anthropic()\n\nget_time_tool = {\n    \"name\": \"get_time\",\n    \"description\": \"Returns the current date and time.\",\n    \"input_schema\": {\"type\": \"object\", \"properties\": {}, \"required\": []},\n}\n\ndef main():\n    question = \"What time is it right now?\"\n    first = client.messages.create(\n        model=\"claude-sonnet-5\", max_tokens=200, tools=[get_time_tool],\n        messages=[{\"role\": \"user\", \"content\": question}],\n    )\n\n    tool_block = next((b for b in first.content if b.type == \"tool_use\"), None)\n    if not tool_block:\n        print(\"No tool needed:\", first.content)\n        return\n\n    tool_output = str(datetime.now())   # \"execute\" the tool for real\n\n    follow_up = client.messages.create(\n        model=\"claude-sonnet-5\", max_tokens=200, tools=[get_time_tool],\n        messages=[\n            {\"role\": \"user\", \"content\": question},\n            {\"role\": \"assistant\", \"content\": first.content},\n            {\"role\": \"user\", \"content\": [{\"type\": \"tool_result\", \"tool_use_id\": tool_block.id, \"content\": tool_output}]},\n        ],\n    )\n\n    print(follow_up.content[0].text)\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "The first call detects the need for get_time and returns a tool_use block. datetime.now() IS the actual tool execution — a genuine real value, not simulated. The follow_up call rebuilds the full conversation: the original question, the model's own tool_use turn (passed through unchanged as first.content), and a new tool_result turn carrying the real time, matched to the exact tool_use_id. The model then reads that real value and answers with it directly — a genuinely grounded, correct final answer rather than a guess.",
    expectedOutput:
      "The final printed text states the actual current date/time, correctly derived from the real value your code provided — not a made-up guess.",
    learned: [
      "How to execute a tool for real and capture its output.",
      "How to construct a correct follow-up messages list.",
      "Why matching tool_use_id is essential.",
      "How a grounded, tool-based answer differs from a guessed one.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's calculator tool is FULLY wired — it detects, executes, and returns a real, correct grounded answer to math questions.",
    why:
      "This closes the loop Lesson 7 started: Compass no longer just admits it wants a tool — it genuinely uses one and gives a correct, computed answer.",
    fileLocation: "compass-agent/main.py (add run_calculator + complete the round trip in ask_compass)",
    code: [
      {
        language: 'python',
        filename: 'main.py (add near TOOLS)',
        code:
          "def run_calculator(expression: str) -> str:\n    try:\n        result = eval(expression, {\"__builtins__\": {}}, {})\n        return str(result)\n    except Exception:\n        return \"Error: could not evaluate that expression.\"",
      },
      {
        language: 'python',
        filename: 'main.py (replace the tool_use handling in ask_compass)',
        code:
          "def ask_compass(question: str) -> str:\n    try:\n        response = with_retry(lambda: client.messages.create(\n            model=\"claude-sonnet-5\", max_tokens=400, temperature=0.2,\n            system=SYSTEM_PROMPT, tools=TOOLS,\n            messages=[{\"role\": \"user\", \"content\": question}],\n        ))\n\n        if response.stop_reason == \"tool_use\":\n            tool_block = next((b for b in response.content if b.type == \"tool_use\"), None)\n            if not tool_block:\n                return \"Something went wrong reading the tool request.\"\n\n            if tool_block.name == \"calculator\":\n                tool_output = run_calculator(tool_block.input[\"expression\"])\n                print(f\"[tool] calculator({tool_block.input['expression']!r}) = {tool_output}\")\n            else:\n                tool_output = \"Error: unknown tool.\"\n\n            follow_up = with_retry(lambda: client.messages.create(\n                model=\"claude-sonnet-5\", max_tokens=400, temperature=0.2,\n                system=SYSTEM_PROMPT, tools=TOOLS,\n                messages=[\n                    {\"role\": \"user\", \"content\": question},\n                    {\"role\": \"assistant\", \"content\": response.content},\n                    {\"role\": \"user\", \"content\": [{\"type\": \"tool_result\", \"tool_use_id\": tool_block.id, \"content\": tool_output}]},\n                ],\n            ))\n            return follow_up.content[0].text\n\n        return response.content[0].text\n    except Exception as err:\n        print(f\"[error] Compass could not get a response: {err}\")\n        return \"Sorry, I'm having trouble right now. Please try again in a moment.\"",
      },
    ],
    placement:
      "Add run_calculator near your TOOLS list. Replace the tool_use branch inside ask_compass() (the placeholder from Lesson 7) with the full round-trip version above — everything else in the file (SYSTEM_PROMPT, with_retry, TOOLS) stays the same.",
    implementation:
      "The if tool_block.name == 'calculator': check makes the code EXTENSIBLE — Lesson 9's homework tool and future tools just add another branch here. run_calculator is wrapped in try/except internally, so a malformed expression returns a clear error string INSTEAD of crashing — and that error string is itself sent back to Claude as the tool_result, letting the model explain the problem to the user naturally rather than your code needing special-case handling for it. The follow_up call reuses with_retry, so this second network round-trip is just as resilient as the first.",
    expectedResult:
      "Asking Compass 'What is 847 times 23?' now prints '[tool] calculator('847 * 23') = 19481' and Compass replies with a real, correct, grounded answer — e.g. '847 × 23 is 19,481.'",
    connects:
      "Compass now has ONE fully working tool. Lesson 9 gives it a SECOND real tool (not just detected, but executed) to reinforce the pattern and start thinking about multi-tool selection, ahead of Module 4's full multi-step reasoning loop.",
  },

  quiz: [
    { id: 'c8q1', kind: 'concept', prompt: 'What are the FIVE steps of a complete tool-use round trip?', options: ['Ask, wait, ask again', 'Send question -> tool_use response -> execute tool -> send tool_result -> final answer', 'Login, query, logout, retry, done', 'Prompt, temperature, tokens, model, response'], answerIndex: 1, explanation: "This is the full cycle described in the concept section — a genuine multi-message exchange." },
    { id: 'c8q2', kind: 'code_reading', prompt: 'Why must the follow-up messages list include the model’s ORIGINAL tool_use response as an assistant turn?', options: ['It’s optional and can be skipped', 'So the model has full context of what it asked for when it reads the result', 'It changes the API key', 'It’s only for logging'], answerIndex: 1, explanation: "Including the model's own prior turn preserves conversational context for interpreting the result correctly." },
    { id: 'c8q3', kind: 'concept', prompt: 'What is tool_use_id used for?', options: ['Rate limiting', 'Matching a tool_result to the specific tool_use request it answers', 'Billing', 'Model selection'], answerIndex: 1, explanation: "It's the identifier connecting a result back to the exact request that triggered it." },
    { id: 'c8q4', kind: 'debug', prompt: 'A follow-up call is sent WITHOUT the tool_use_id matching the original request. What happens?', options: ['It works exactly the same', 'The model can’t correctly match the result to its request, likely causing confusion or an error', 'It automatically retries', 'The API ignores tool_use_id entirely'], answerIndex: 1, explanation: "Correct matching is required for the model to interpret the tool_result properly." },
    { id: 'c8q5', kind: 'application', prompt: 'Why wrap run_calculator’s evaluation in try/except?', options: ['It’s unnecessary', 'A malformed expression could raise; catching it lets a clear error message be returned instead of crashing', 'It changes the tool’s name', 'It’s required by the API'], answerIndex: 1, explanation: "Defensive error handling inside the tool itself prevents a bad input from crashing the whole flow." },
    { id: 'c8q6', kind: 'output', prompt: 'What does the follow_up call ultimately return, once a tool_result has been sent?', options: ['Another tool_use request always', 'A final, grounded text answer using the real tool output', 'The same tool_use block again', 'An empty response'], answerIndex: 1, explanation: "With the real result in hand, the model typically completes its answer as plain text." },
    { id: 'c8q7', kind: 'application', prompt: 'Why send the calculator’s ERROR string back as a tool_result instead of handling the error separately in your own code?', options: ['You must always crash on tool errors', 'Letting the model see the error lets IT explain the problem to the user naturally, without special-case code', 'It’s not possible to send an error as a result', 'Error strings are invalid tool_result content'], answerIndex: 1, explanation: "The model can incorporate the error into a natural-language explanation, avoiding duplicate error-handling logic." },
    { id: 'c8q8', kind: 'code_reading', prompt: 'What does eval(expression, {"__builtins__": {}}, {}) attempt to do?', options: ['Nothing, it’s invalid syntax', 'Evaluate the expression as Python code, with builtins restricted as a basic safety measure', 'Print the expression as text', 'Validate the expression only, without running it'], answerIndex: 1, explanation: "eval() runs the string as Python code; passing empty builtins/locals dicts restricts (but doesn't fully secure) what it can access — full safety is Lesson 11's job." },
    { id: 'c8q9', kind: 'project', prompt: "Why does the follow_up call in Compass's final project reuse with_retry, just like the first call?", options: ['It’s redundant and unnecessary', 'The follow-up is ALSO a real network call that can transiently fail, so it deserves the same reliability', 'with_retry only works once per session', 'Retries are only needed for tool_use responses'], answerIndex: 1, explanation: "Every network call, including the follow-up, benefits from the same resilience pattern." },
    { id: 'c8q10', kind: 'concept', prompt: 'What limitation does this lesson’s implementation still have, addressed later in Module 4?', options: ['It cannot use any tools at all', 'It handles only ONE tool round-trip; a full repeating loop for multiple sequential tool calls comes later', 'It cannot use the calculator tool', 'It has no error handling'], answerIndex: 1, explanation: "This lesson handles a single round-trip; a genuine multi-step loop is Module 4's focus." },
  ],

  homework: {
    task:
      "Implement the get_word_count tool from Lesson 7's homework FOR REAL: add a run_word_count(text) function, wire it into the tool_use branch, and confirm Compass gives a correct, grounded word count.",
    requirements: [
      "Write def run_word_count(text: str) -> str that splits on whitespace and returns the count as a string.",
      "Add an elif branch for tool_block.name == 'get_word_count' calling it.",
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
        "Add it to TOOLS: TOOLS = [calculator_tool, get_word_count_tool]",
        "Ask a word-count question and a math question separately, confirming each triggers the RIGHT tool by name in the printed output.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py',
          code:
            "get_word_count_tool = {\n    \"name\": \"get_word_count\",\n    \"description\": \"Counts the number of words in a piece of text. Use this when the user asks how many words something has.\",\n    \"input_schema\": {\n        \"type\": \"object\",\n        \"properties\": {\"text\": {\"type\": \"string\", \"description\": \"The text to count words in.\"}},\n        \"required\": [\"text\"],\n    },\n}\nTOOLS = [calculator_tool, get_word_count_tool]",
        },
      ],
    },
  },
};
