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
      "Learn how to build an interactive command-line loop (a REPL) in Python so Compass can hold an ongoing back-and-forth session, and review everything Module 1 covered.",
    sections: [
      {
        heading: 'What is a REPL?',
        body:
          "REPL stands for Read-Eval-Print Loop: read user input, evaluate it, print a result, then loop back to read again — exactly how a terminal-based chat should behave. Right now Compass answers ONE question per run (from sys.argv[1]) and exits; a REPL lets someone keep asking questions in the same session.",
      },
      {
        heading: 'Reading input in Python',
        body:
          "Python's built-in input() function prompts for a line of text and blocks until the user presses Enter — no extra library needed, unlike some other languages.",
        code: {
          language: 'python',
          code:
            "answer = input(\"You: \")\nprint(\"You typed:\", answer)",
        },
      },
      {
        heading: 'A loop that exits cleanly',
        body:
          "A REPL needs a clear way to STOP — a command like 'exit' or 'quit' that breaks the loop. Without this, the only way out is force-quitting the terminal (Ctrl+C), which feels broken.",
        code: {
          language: 'python',
          code:
            "while True:\n    user_input = input(\"You: \").strip()\n    if user_input.lower() == \"exit\":\n        print(\"Goodbye!\")\n        break",
        },
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
      { term: 'input()', definition: "Python's built-in function for reading a line of text typed by the user." },
      { term: 'Exit condition', definition: "The specific input (like 'exit') that breaks a loop and ends a program cleanly." },
    ],
    commonMistakes: [
      "Building a loop with no exit condition, forcing the user to Ctrl+C to stop.",
      "Forgetting to .strip() and .lower() user input before checking for the exit command (e.g. 'Exit' vs 'exit').",
      "Not handling an empty input (just pressing Enter) gracefully — it shouldn't send a blank question to the API.",
      "Putting the input() call inside a try block that also handles the API call, conflating two different kinds of failure.",
      "Forgetting while True: needs an explicit break somewhere, or it truly never ends.",
    ],
    takeaways: [
      "A REPL loop lets Compass hold an ongoing interactive session.",
      "Python's built-in input() gives simple, synchronous terminal input — no extra library needed.",
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
        language: 'python',
        filename: 'guess.py',
        code:
          "import random\n\ntarget = random.randint(1, 10)\n\ndef main():\n    while True:\n        raw = input('Guess a number 1-10 (or \"quit\"): ').strip().lower()\n        if raw == \"quit\":\n            break\n\n        if not raw.isdigit():\n            print(\"That's not a number.\")\n            continue\n\n        guess = int(raw)\n        if guess == target:\n            print(\"Correct!\")\n            break\n        print(\"Higher!\" if guess < target else \"Lower!\")\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    explanation:
      "The while True: loop keeps asking until an explicit break — either the user quits or guesses correctly. .strip().lower() BEFORE comparing to 'quit' handles messy real input ('Quit', ' quit '). raw.isdigit() checks the input is a valid non-negative integer string before converting with int(), using continue to loop back WITHOUT counting a non-numeric entry as a wrong guess. random.randint(1, 10) picks the target once, outside the loop, so it stays fixed for the whole game.",
    expectedOutput:
      "An interactive terminal session: repeated prompts, 'Higher!'/'Lower!' feedback, ending with either 'Correct!' or a clean exit on 'quit'.",
    learned: [
      "How to build a real interactive REPL loop in Python.",
      "How to implement a clean, working exit condition.",
      "How to validate and handle malformed input inside a loop.",
      "How str.isdigit() guards a safe conversion to int().",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass becomes a real, ongoing chat session — the Module 1 milestone: a reliable, streaming, interactive Q&A agent.",
    why:
      "This is the payoff of Module 1: instead of running once per question, Compass now holds a genuine back-and-forth conversation in one session, with everything from Lessons 1-5 working together.",
    fileLocation: "compass-agent/main.py (replace main() with a REPL loop)",
    code: [
      {
        language: 'python',
        filename: 'main.py (replace main)',
        code:
          "def main():\n    print(\"Compass is ready. Ask a question, or type 'exit' to quit.\\n\")\n\n    while True:\n        question = input(\"You: \").strip()\n\n        if question.lower() == \"exit\":\n            print(\"Compass: Goodbye!\")\n            break\n        if not question:\n            continue   # ignore empty Enter presses\n\n        print(\"Compass: \", end=\"\")\n        ask_compass_streaming(question)\n        print()   # blank line between exchanges\n\nif __name__ == \"__main__\":\n    main()",
      },
    ],
    placement:
      "Replace your existing main() function (the one that read sys.argv[1] and ran once) with the version above. Everything else in main.py — SYSTEM_PROMPT, with_retry, ask_compass, ask_compass_streaming — stays exactly as built in Lessons 1-5.",
    implementation:
      "The while True: loop is the REPL: it repeatedly prompts 'You: ', reads a line, and either exits cleanly (on 'exit'), skips an empty submission (continue), or passes the question straight into ask_compass_streaming() — the SAME reliable, retry-wrapped, streaming function built across Lessons 2-5. Every safeguard from this module (temperature tuning, error handling, live output) is already baked into that one function, so the REPL loop itself stays simple: read, pass to Compass, repeat. This is exactly the 'compose small, well-built pieces' principle worth internalizing early.",
    expectedResult:
      "Running python main.py now starts an ongoing session: 'Compass is ready...', then you can ask multiple questions in a row, each streaming live, until you type 'exit' and get a clean goodbye.",
    connects:
      "Module 1 delivered Compass's complete, reliable core. Module 2 (Tool Use) plugs directly into this SAME REPL and ask_compass pattern — the next lesson gives Compass its first real tool, completing the agent loop from Lesson 1's concept.",
  },

  quiz: [
    { id: 'c6q1', kind: 'concept', prompt: 'What does REPL stand for?', options: ['Rapid Error Prevention Layer', 'Read-Eval-Print Loop', 'Remote Endpoint Protocol Link', 'Recursive Execution Program Loop'], answerIndex: 1, explanation: "REPL describes the read-input, evaluate-it, print-result, loop-again cycle." },
    { id: 'c6q2', kind: 'application', prompt: 'Why is an explicit exit condition ("exit"/"quit") important in a loop?', options: ['It’s optional styling', 'Without it, the only way to stop is force-quitting the terminal', 'It makes the loop faster', 'It’s required by Python syntax'], answerIndex: 1, explanation: "A clean, discoverable way to end the loop is expected UX for any interactive tool." },
    { id: 'c6q3', kind: 'code_reading', prompt: 'Why call question.lower() before comparing to "exit"?', options: ['No real reason', 'So variations like "Exit" still match, regardless of capitalization', 'It changes the API response', 'It’s required by input()'], answerIndex: 1, explanation: "Normalizing input handles realistic variations in how a user might type the exit command." },
    { id: 'c6q4', kind: 'debug', prompt: 'A REPL script hangs forever with no way to stop it. Likely missing piece?', options: ['A system prompt', 'A break statement tied to an exit condition', 'More max_tokens', 'A retry wrapper'], answerIndex: 1, explanation: "Without an explicit break, while True: has no way to end on its own." },
    { id: 'c6q5', kind: 'application', prompt: 'Why does the loop use `if not question: continue` for empty input?', options: ['To crash on empty input', 'To skip sending a blank question to the API when the user just presses Enter', 'It has no effect', 'To exit the loop'], answerIndex: 1, explanation: "Guarding against empty submissions avoids wasting an API call on nothing." },
    { id: 'c6q6', kind: 'concept', prompt: 'What capability from Module 1 does the final REPL loop rely on for its live output?', options: ['Tool use (not built yet)', 'Streaming (ask_compass_streaming from Lesson 5)', 'Long-term memory (not built yet)', 'Multi-agent orchestration (not built yet)'], answerIndex: 1, explanation: "The REPL calls ask_compass_streaming, reusing Lesson 5's streaming implementation directly." },
    { id: 'c6q7', kind: 'code_reading', prompt: 'Why is input() called freshly each loop iteration instead of once outside the loop?', options: ['It should only be called once', 'Each iteration needs a NEW line of input from the user for that turn of the conversation', 'input() can only run once per program', 'It has no effect either way'], answerIndex: 1, explanation: "Each pass through the loop represents one new user turn, requiring a fresh input() call." },
    { id: 'c6q8', kind: 'output', prompt: 'What happens when the user types just Enter (empty input) in the final REPL?', options: ['Compass answers with an empty string', 'The loop skips it and re-prompts, with no API call made', 'The program crashes', 'It exits the loop'], answerIndex: 1, explanation: "The empty-input guard (continue) skips straight back to prompting again." },
    { id: 'c6q9', kind: 'project', prompt: "Why does the final REPL stay simple (just reading input and calling ask_compass_streaming) instead of re-implementing error handling itself?", options: ['It’s missing important logic', 'Because ask_compass_streaming already has retries and error handling built in from earlier lessons', 'REPL loops can’t have error handling', 'It’s a placeholder to be replaced later'], answerIndex: 1, explanation: "Composing already-solid functions keeps new code simple — the reliability work was done once, in Lesson 4-5." },
    { id: 'c6q10', kind: 'concept', prompt: 'What is Module 2 about to add to Compass?', options: ['A user interface', 'Real tools, so Compass can take actions, not just answer from what it already knows', 'Deployment', 'Long-term memory'], answerIndex: 1, explanation: "Module 2 (Tool Use) gives Compass the ability to act, completing the agent loop concept introduced in Lesson 1." },
  ],

  homework: {
    task:
      "Add a 'help' command to the REPL: typing 'help' prints a short list of available commands (exit, help) and a one-line reminder of what Compass can do, without sending anything to the API.",
    requirements: [
      "Check for 'help' the same way 'exit' is checked (stripped, lowercased).",
      "On 'help', print a short message and continue the loop (no API call).",
      "Confirm 'exit' and normal questions still work as before.",
    ],
    expectedOutcome:
      "Typing 'help' shows a quick command reference instantly (no API delay), and the REPL continues normally afterward.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 5,
      hint: "Lesson 5 asked you to add a 'thinking' indicator ('...') that appears before streaming starts and gets erased on the first real chunk.",
      steps: [
        "Right after printing 'Compass: ', print '...' as a placeholder: print('...', end='', flush=True).",
        "Add a boolean flag, e.g. first = True, before the streaming loop.",
        "On the FIRST chunk received, if first is True, erase the dots (e.g. print('\\r' + ' ' * 20 + '\\r', end='')) then set first = False before printing the real text.",
        "Subsequent chunks just print normally.",
      ],
      codeGuidance: [
        {
          language: 'python',
          filename: 'main.py (inside the streaming loop)',
          code:
            "print(\"...\", end=\"\", flush=True)\nfirst = True\nfor text in stream.text_stream:\n    if first:\n        print(\"\\r\" + \" \" * 20 + \"\\r\", end=\"\")\n        first = False\n    print(text, end=\"\", flush=True)\n    full_text += text",
        },
      ],
    },
  },
};
