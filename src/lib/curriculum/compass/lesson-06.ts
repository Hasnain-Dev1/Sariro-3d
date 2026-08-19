import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 6 — Module 1 Build: The Q&A Agent
 * Module 1 (What Are AI Agents?) · Lesson 6 of 30
 */
export const lesson06: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 1,
  lessonIndex: 5,
  globalNumber: 6,
  name: 'Module 1 build — the Q&A agent',
  title: 'Module 1 Build — Compass, a Real Q&A Agent',
  subtitle: "Turn Compass into a real interactive REPL loop — the Module 1 milestone.",

  concept: {
    durationMin: 15,
    summary:
      "Learn how to build an interactive command-line loop (a REPL) so Compass can hold an ongoing back-and-forth session, and review everything Module 1 covered.",
    sections: [
      {
        heading: 'What is a REPL?',
        body:
          "REPL stands for Read-Eval-Print Loop: read user input, evaluate it, print a result, then loop back to read again — exactly how a terminal-based chat should behave. Right now Compass answers ONE question per run (from process.argv[2]) and exits; a REPL lets someone keep asking questions in the same session.",
      },
      {
        heading: 'Reading input in Node.js',
        body:
          "Node's built-in readline module lets you prompt for a line of input and get it as a Promise-friendly callback. Wrapping it in a small async loop gives you a genuine interactive session.",
        code: {
          language: 'typescript',
          code:
            "import * as readline from 'readline/promises';\n\nconst rl = readline.createInterface({ input: process.stdin, output: process.stdout });\nconst answer = await rl.question('You: ');\nconsole.log('You typed:', answer);",
        },
      },
      {
        heading: 'A loop that exits cleanly',
        body:
          "A REPL needs a clear way to STOP — a command like 'exit' or 'quit' that breaks the loop and closes the readline interface. Without this, the only way out is force-quitting the terminal, which feels broken.",
      },
      {
        heading: 'Reviewing Module 1',
        body:
          "In six lessons, Compass went from nothing to a genuinely solid agent CORE: a real API connection (L1), tuned parameters for reliability (L2), a properly engineered system prompt (L3), retry-based error handling (L4), and live streaming output (L5). This lesson (L6) wraps all of that into one continuous, interactive experience — the 'Q&A agent project' milestone.",
      },
      {
        heading: 'What’s NEXT for Compass',
        body:
          "Right now Compass can only answer from what it already knows. Module 2 gives it TOOLS — the ability to calculate, look things up, and take real actions — completing the 'agent loop' concept from Lesson 1 that's been implied but not yet built.",
      },
    ],
    keyTerms: [
      { term: 'REPL', definition: "Read-Eval-Print Loop — an interactive session that repeatedly reads input, processes it, and prints a result." },
      { term: 'readline', definition: "Node.js's built-in module for reading a line of input from the terminal." },
      { term: 'Exit condition', definition: "The specific input (like 'exit') that breaks a loop and ends a program cleanly." },
    ],
    commonMistakes: [
      "Building a loop with no exit condition, forcing the user to kill the terminal to stop.",
      "Not closing the readline interface (rl.close()) when exiting, leaving the process hanging.",
      "Forgetting to trim/lowercase user input before checking for the exit command (e.g. 'Exit' vs 'exit').",
      "Re-creating the readline interface every loop iteration instead of once outside the loop.",
      "Not handling an empty input (just pressing Enter) gracefully — it shouldn't send a blank question to the API.",
    ],
    takeaways: [
      "A REPL loop lets Compass hold an ongoing interactive session.",
      "readline/promises gives clean async input handling in Node.",
      "Always build a clear, working exit condition into any loop.",
      "Module 1 gave Compass a solid, reliable core: API connection, tuning, prompting, error handling, streaming.",
      "Module 2 completes the agent loop concept by adding real tool use.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A number-guessing REPL',
    objective:
      "Practise the REPL pattern with a simple, self-contained loop before applying it to Compass's real chat session.",
    instructions: [
      "Write a script that picks a random number 1-10.",
      "Loop: ask the user to guess, tell them higher/lower/correct.",
      "Exit the loop (and the program) once they guess correctly, or if they type 'quit'.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'guess.ts',
        code:
          "import * as readline from 'readline/promises';\n\nconst rl = readline.createInterface({ input: process.stdin, output: process.stdout });\nconst target = Math.floor(Math.random() * 10) + 1;\n\nasync function main() {\n  while (true) {\n    const input = await rl.question('Guess a number 1-10 (or \"quit\"): ');\n    const trimmed = input.trim().toLowerCase();\n    if (trimmed === 'quit') break;\n\n    const guess = Number(trimmed);\n    if (Number.isNaN(guess)) { console.log('That’s not a number.'); continue; }\n    if (guess === target) { console.log('Correct!'); break; }\n    console.log(guess < target ? 'Higher!' : 'Lower!');\n  }\n  rl.close();\n}\n\nmain();",
      },
    ],
    explanation:
      "The while (true) loop keeps asking until an explicit break — either the user quits or guesses correctly. Trimming and lowercasing the input BEFORE comparing to 'quit' handles messy real input ('Quit', ' quit '). Number(trimmed) converts the text to a number, with Number.isNaN guarding against non-numeric input using continue to loop back WITHOUT counting it as a wrong guess. rl.close() at the end releases the readline interface so the process can exit cleanly — a detail easy to forget that leaves programs hanging.",
    expectedOutput:
      "An interactive terminal session: repeated prompts, 'Higher!'/'Lower!' feedback, ending with either 'Correct!' or a clean exit on 'quit'.",
    learned: [
      "How to build a real interactive REPL loop in Node.",
      "How to implement a clean, working exit condition.",
      "How to validate and handle malformed input inside a loop.",
      "Why closing the readline interface matters.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass becomes a real, ongoing chat session — the Module 1 milestone: a reliable, streaming, interactive Q&A agent.",
    why:
      "This is the payoff of Module 1: instead of running once per question, Compass now holds a genuine back-and-forth conversation in one session, with everything from Lessons 1-5 working together.",
    fileLocation: "compass-agent/index.ts (replace main() with a REPL loop)",
    code: [
      {
        language: 'typescript',
        filename: 'index.ts (replace main)',
        code:
          "import * as readline from 'readline/promises';\n\nasync function main() {\n  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });\n  console.log(\"Compass is ready. Ask a question, or type 'exit' to quit.\\n\");\n\n  while (true) {\n    const question = await rl.question('You: ');\n    const trimmed = question.trim();\n\n    if (trimmed.toLowerCase() === 'exit') {\n      console.log('Compass: Goodbye!');\n      break;\n    }\n    if (!trimmed) continue;   // ignore empty Enter presses\n\n    process.stdout.write('Compass: ');\n    await askCompassStreaming(trimmed);\n    console.log();   // blank line between exchanges\n  }\n\n  rl.close();\n}\n\nmain();",
      },
    ],
    placement:
      "Replace your existing main() function (the one that read process.argv[2] and ran once) with the version above. Everything else in index.ts — SYSTEM_PROMPT, withRetry, askCompass, askCompassStreaming — stays exactly as built in Lessons 1-5.",
    implementation:
      "The while (true) loop is the REPL: it repeatedly prompts 'You: ', reads a line, and either exits cleanly (on 'exit'), skips an empty submission (continue), or passes the question straight into askCompassStreaming() — the SAME reliable, retry-wrapped, streaming function built across Lessons 2-5. Every safeguard from this module (temperature tuning, error handling, live output) is already baked into that one function, so the REPL loop itself stays simple: read, pass to Compass, repeat. This is exactly the 'compose small, well-built pieces' principle worth internalizing early.",
    expectedResult:
      "Running npx ts-node index.ts now starts an ongoing session: 'Compass is ready...', then you can ask multiple questions in a row, each streaming live, until you type 'exit' and get a clean goodbye.",
    connects:
      "Module 1 delivered Compass's complete, reliable core. Module 2 (Tool Use) plugs directly into this SAME REPL and askCompass pattern — the next lesson gives Compass its first real tool, completing the agent loop from Lesson 1's concept.",
  },

  quiz: [
    { id: 'c6q1', kind: 'concept', prompt: 'What does REPL stand for?', options: ['Rapid Error Prevention Layer', 'Read-Eval-Print Loop', 'Remote Endpoint Protocol Link', 'Recursive Execution Program Loop'], answerIndex: 1, explanation: "REPL describes the read-input, evaluate-it, print-result, loop-again cycle." },
    { id: 'c6q2', kind: 'application', prompt: 'Why is an explicit exit condition ("exit"/"quit") important in a loop?', options: ['It’s optional styling', 'Without it, the only way to stop is force-quitting the terminal', 'It makes the loop faster', 'It’s required by TypeScript'], answerIndex: 1, explanation: "A clean, discoverable way to end the loop is expected UX for any interactive tool." },
    { id: 'c6q3', kind: 'code_reading', prompt: 'Why call trimmed.toLowerCase() before comparing to \'exit\'?', options: ['No real reason', 'So variations like "Exit" or " exit " with extra spaces still match', 'It changes the API response', 'It’s required by readline'], answerIndex: 1, explanation: "Normalizing input handles realistic variations in how a user might type the exit command." },
    { id: 'c6q4', kind: 'debug', prompt: 'A REPL never releases the terminal after the loop ends. Likely missing piece?', options: ['A system prompt', 'rl.close() after the loop', 'More max_tokens', 'A retry wrapper'], answerIndex: 1, explanation: "Without closing the readline interface, the process can hang instead of exiting." },
    { id: 'c6q5', kind: 'application', prompt: 'Why does the loop use `if (!trimmed) continue;` for empty input?', options: ['To crash on empty input', 'To skip sending a blank question to the API when the user just presses Enter', 'It has no effect', 'To exit the loop'], answerIndex: 1, explanation: "Guarding against empty submissions avoids wasting an API call on nothing." },
    { id: 'c6q6', kind: 'concept', prompt: 'What capability from Module 1 does the final REPL loop rely on for its live output?', options: ['Tool use (not built yet)', 'Streaming (askCompassStreaming from Lesson 5)', 'Long-term memory (not built yet)', 'Multi-agent orchestration (not built yet)'], answerIndex: 1, explanation: "The REPL calls askCompassStreaming, reusing Lesson 5's streaming implementation directly." },
    { id: 'c6q7', kind: 'code_reading', prompt: 'Why is readline.createInterface called ONCE outside the loop, not inside it?', options: ['It must be created fresh every iteration', 'A single interface can be reused across many question() calls', 'It’s required to be inside the loop', 'It has no effect either way'], answerIndex: 1, explanation: "One interface instance handles repeated input prompts throughout the session." },
    { id: 'c6q8', kind: 'output', prompt: 'What happens when the user types just Enter (empty input) in the final REPL?', options: ['Compass answers with an empty string', 'The loop skips it and re-prompts, with no API call made', 'The program crashes', 'It exits the loop'], answerIndex: 1, explanation: "The empty-input guard (continue) skips straight back to prompting again." },
    { id: 'c6q9', kind: 'project', prompt: "Why does the final REPL stay simple (just reading input and calling askCompassStreaming) instead of re-implementing error handling itself?", options: ['It’s missing important logic', 'Because askCompassStreaming already has retries and error handling built in from earlier lessons', 'REPL loops can’t have error handling', 'It’s a placeholder to be replaced later'], answerIndex: 1, explanation: "Composing already-solid functions keeps new code simple — the reliability work was done once, in Lesson 4-5." },
    { id: 'c6q10', kind: 'concept', prompt: 'What is Module 2 about to add to Compass?', options: ['A user interface', 'Real tools, so Compass can take actions, not just answer from what it already knows', 'Deployment', 'Long-term memory'], answerIndex: 1, explanation: "Module 2 (Tool Use) gives Compass the ability to act, completing the agent loop concept introduced in Lesson 1." },
  ],

  homework: {
    task:
      "Add a 'help' command to the REPL: typing 'help' prints a short list of available commands (exit, help) and a one-line reminder of what Compass can do, without sending anything to the API.",
    requirements: [
      "Check for 'help' the same way 'exit' is checked (trimmed, lowercased).",
      "On 'help', print a short message and continue the loop (no API call).",
      "Confirm 'exit' and normal questions still work as before.",
    ],
    expectedOutcome:
      "Typing 'help' shows a quick command reference instantly (no API delay), and the REPL continues normally afterward.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 5,
      hint: "Lesson 5 asked you to add a 'thinking' indicator ('...') that appears before streaming starts and gets erased on the first real text_delta.",
      steps: [
        "Right after writing 'Compass: ', write '...' as a placeholder: process.stdout.write('...').",
        "Add a boolean flag, e.g. let first = true, before the streaming loop.",
        "On the FIRST text_delta received, if first is true, erase the dots (e.g. process.stdout.write('\\r' + ' '.repeat(20) + '\\r')) then set first = false before writing the real text.",
        "Subsequent deltas just write normally.",
      ],
      codeGuidance: [
        {
          language: 'typescript',
          filename: 'index.ts (inside the streaming loop)',
          code:
            "process.stdout.write('...');\nlet first = true;\nfor await (const event of stream) {\n  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {\n    if (first) { process.stdout.write('\\r' + ' '.repeat(20) + '\\r'); first = false; }\n    process.stdout.write(event.delta.text);\n    fullText += event.delta.text;\n  }\n}",
        },
      ],
    },
  },
};
