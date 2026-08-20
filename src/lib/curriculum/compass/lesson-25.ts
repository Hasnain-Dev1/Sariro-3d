import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 25 — Going Live: Wrapping Compass for Streamlit
 * Module 5 (Deploy + Capstone) · Lesson 25 of 30
 */
export const lesson25: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 0,
  globalNumber: 25,
  name: 'Going live with Streamlit',
  title: 'Going Live — Wrapping Compass as a Streamlit App',
  subtitle: "Turn Compass's Python agent logic into the first version of a real, shareable web app.",

  concept: {
    durationMin: 15,
    summary:
      "Learn why Streamlit is a natural fit for shipping a Python agent, and build the first minimal Streamlit version of Compass.",
    sections: [
      {
        heading: 'Why Streamlit, and why now',
        body:
          "Compass has been a Python script you run in a terminal. Streamlit turns a plain Python file into a real web app with almost no extra code — no separate frontend framework, no HTML/CSS/JS to write. Since Compass's entire agent (Modules 1-4) is already Python, Streamlit lets that SAME code power a web UI directly, install with `pip install streamlit`.",
      },
      {
        heading: 'The smallest possible Streamlit app',
        body:
          "A Streamlit app is just a Python script that calls `st.*` functions to render UI elements — Streamlit re-runs the whole script top to bottom every time the user interacts with something.",
        code: {
          language: 'python',
          filename: 'app.py',
          code:
            'import streamlit as st\n\nst.title("Compass")\nst.write("Your AI research and task agent.")\n\nquestion = st.text_input("Ask Compass something:")\nif question:\n    st.write(f"You asked: {question}")',
        },
      },
      {
        heading: 'Running it locally',
        body:
          "Unlike a normal Python script (`python app.py`), a Streamlit app is launched with the `streamlit run` command, which starts a local web server and opens the app in a browser tab automatically.",
        code: { language: 'bash', code: 'streamlit run app.py' },
      },
      {
        heading: 'Wiring in the real Compass logic',
        body:
          "The text input becomes a real question sent to route_and_answer() (from Lesson 24) — Streamlit apps import from the same modules the CLI version does, so no agent logic needs to be rewritten, only the interface around it changes, same principle as any other deployment.",
        code: {
          language: 'python',
          filename: 'app.py (wired to Compass)',
          code:
            'import streamlit as st\nfrom compass_agent import route_and_answer  # your Module 1-4 logic\n\nst.title("Compass")\nst.caption("Your AI research and task agent.")\n\nquestion = st.text_input("Ask Compass something:")\nif question:\n    with st.spinner("Thinking..."):\n        answer = route_and_answer(question)\n    st.write(answer)',
        },
      },
    ],
    keyTerms: [
      { term: 'Streamlit', definition: "A Python framework that turns a script into a shareable web app using simple st.* function calls, no separate frontend needed." },
      { term: 'Rerun model', definition: "Streamlit's execution model: the entire script re-runs top to bottom each time the user interacts with a widget." },
      { term: 'st.spinner', definition: "A Streamlit widget showing a loading indicator while a block of code runs — used here while Compass is generating an answer." },
    ],
    commonMistakes: [
      "Running `python app.py` instead of `streamlit run app.py` — a Streamlit script needs the special runner to work.",
      "Rewriting Compass's agent logic inside app.py instead of importing the existing modules from Modules 1-4.",
      "Not understanding Streamlit's rerun model, leading to confusion about why variables seem to 'reset' on every interaction (addressed properly in Lesson 26 with st.session_state).",
      "Forgetting to add streamlit to requirements.txt before deployment.",
    ],
    takeaways: [
      "Streamlit turns a Python script into a web app with simple st.* calls — no separate frontend needed.",
      "`streamlit run app.py` launches the app; plain `python app.py` does not.",
      "The whole script re-runs top to bottom on every user interaction — Streamlit's core execution model.",
      "Existing Compass agent logic (Modules 1-4) is imported and reused unchanged, only the interface is new.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A minimal Streamlit calculator',
    objective: "Practise the basic Streamlit input/output pattern with a tiny, self-contained example before wiring in the full Compass agent.",
    instructions: [
      "Install streamlit if you haven't already: pip install streamlit.",
      "Create calc_app.py with two number inputs and an operation selector.",
      "Display the result using st.write.",
      "Run it with `streamlit run calc_app.py`.",
    ],
    code: [
      {
        language: 'python',
        filename: 'calc_app.py',
        code:
          'import streamlit as st\n\nst.title("Mini Calculator")\n\na = st.number_input("First number", value=0.0)\nb = st.number_input("Second number", value=0.0)\nop = st.selectbox("Operation", ["+", "-", "*", "/"])\n\nif op == "+":\n    result = a + b\nelif op == "-":\n    result = a - b\nelif op == "*":\n    result = a * b\nelse:\n    result = a / b if b != 0 else "undefined (divide by zero)"\n\nst.write(f"Result: {result}")',
      },
    ],
    explanation:
      "This isolates Streamlit's core input-widget-then-display pattern (st.number_input, st.selectbox, st.write) without any agent complexity yet — the SAME pattern used to wire Compass in the final project, just with simpler inputs. Notice the result recalculates automatically every time ANY widget changes, thanks to Streamlit's rerun model.",
    expectedOutput: "A web page with two number fields and a dropdown; the Result line updates live as you change any input.",
    learned: [
      "The basic Streamlit widget-then-display pattern.",
      "How Streamlit's automatic rerun keeps the UI reactive without manual event handlers.",
      "How to run and interact with a Streamlit app locally.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "The first working version of Compass as a Streamlit web app: a single question box wired directly to route_and_answer().",
    why:
      "This is the first real milestone of Module 5 — Compass's full Module 1-4 intelligence, now reachable through a browser instead of a terminal.",
    fileLocation: 'compass-agent/app.py (new)',
    code: [
      {
        language: 'python',
        filename: 'app.py',
        code:
          'import streamlit as st\nfrom compass_agent import route_and_answer\n\nst.set_page_config(page_title="Compass", page_icon="🧭")\n\nst.title("🧭 Compass")\nst.caption("Your AI research and task agent — powered by an OpenAI-compatible model.")\n\nquestion = st.text_input("Ask Compass something:", placeholder="e.g. What\'s 15% of 340?")\n\nif st.button("Ask") and question:\n    with st.spinner("Thinking..."):\n        try:\n            answer = route_and_answer(question)\n            st.success("Done")\n            st.write(answer)\n        except Exception as e:\n            st.error(f"Something went wrong: {e}")',
      },
      {
        language: 'bash',
        code: 'streamlit run app.py',
      },
    ],
    placement: "Create app.py at the root of your compass-agent project, alongside your existing main.py, importing route_and_answer from your existing module (renaming main.py's importable functions into a module named compass_agent.py if it isn't already structured that way).",
    implementation:
      "The app deliberately stays minimal for this lesson: a title, a text input, an explicit 'Ask' button (rather than triggering on every keystroke), a spinner while route_and_answer() runs, and a try/except so a failure shows a clean st.error() message instead of crashing the whole app — the same defensive boundary principle from Lesson 25's original API-route version, now applied to a Streamlit boundary instead of an HTTP one.",
    expectedResult:
      "Running `streamlit run app.py` opens a browser tab showing 'Compass' with a text box; typing a question and clicking Ask shows a spinner, then Compass's real, tool-capable, reasoning-backed answer.",
    connects:
      "Compass now has a real (if minimal) web presence. Lesson 26 turns this single-question box into an actual multi-turn CHAT interface with visible conversation history, using Streamlit's chat-specific components and st.session_state.",
  },

  quiz: [
    { id: 'c25q1', kind: 'concept', prompt: 'What does Streamlit let you build without writing separate HTML/CSS/JS?', options: ['Mobile apps', 'A real web app, using only Python and st.* function calls', 'Desktop apps', 'Database schemas'], answerIndex: 1, explanation: 'Streamlit turns a Python script into a web UI directly.' },
    { id: 'c25q2', kind: 'application', prompt: 'How do you correctly launch a Streamlit app?', options: ['python app.py', 'streamlit run app.py', 'node app.py', 'npm start'], answerIndex: 1, explanation: 'Streamlit apps require the special `streamlit run` command, not a plain Python invocation.' },
    { id: 'c25q3', kind: 'concept', prompt: 'What is Streamlit’s "rerun model"?', options: ['The app only runs once ever', 'The entire script re-runs top to bottom each time the user interacts with a widget', 'Only the changed line re-runs', 'Reruns happen on a timer'], answerIndex: 1, explanation: 'This is Streamlit’s core execution model, worth understanding before building anything more complex.' },
    { id: 'c25q4', kind: 'code_reading', prompt: 'What does st.spinner("Thinking...") do in the final project code?', options: ['Nothing visible', 'Shows a loading indicator while route_and_answer() runs inside the with block', 'Prevents the button from being clicked', 'Deletes the previous answer'], answerIndex: 1, explanation: 'st.spinner wraps a block of code and shows a loading UI for its duration.' },
    { id: 'c25q5', kind: 'debug', prompt: 'Running `python app.py` on a Streamlit script prints warnings and does nothing useful. What’s the fix?', options: ['Rewrite the whole app', 'Run it with `streamlit run app.py` instead', 'Add more imports', 'Switch to a different framework'], answerIndex: 1, explanation: 'Streamlit scripts must be launched through the streamlit CLI, not run as plain Python.' },
    { id: 'c25q6', kind: 'application', prompt: 'Why does the final project wrap route_and_answer() in a try/except?', options: ['No reason', 'So an unexpected failure shows a clean st.error() message instead of crashing the whole app', 'It’s required by Streamlit syntax', 'To make responses slower'], answerIndex: 1, explanation: 'This mirrors the same defensive-boundary principle used at API boundaries elsewhere in the course.' },
    { id: 'c25q7', kind: 'output', prompt: 'What happens when you change a number in the mini-project calculator?', options: ['Nothing until you refresh the page', 'The script reruns and the Result line updates automatically', 'An error appears', 'You must click a button first'], answerIndex: 1, explanation: 'Streamlit’s rerun model recalculates and redisplays automatically on any widget change.' },
    { id: 'c25q8', kind: 'concept', prompt: 'What Compass code gets REWRITTEN to build app.py?', options: ['All of Modules 1-4', 'None of it — route_and_answer() and the rest of the agent logic are imported and reused unchanged', 'Only the memory system', 'Only the tools'], answerIndex: 1, explanation: 'Only the interface is new; the underlying agent logic from Modules 1-4 is reused as-is.' },
    { id: 'c25q9', kind: 'project', prompt: 'Why does the final project use an explicit "Ask" button instead of triggering on every keystroke?', options: ['No reason', 'To avoid firing a real (costly) API call on every single character typed', 'Streamlit requires buttons', 'It’s faster this way technically'], answerIndex: 1, explanation: 'An explicit trigger avoids wasting API calls on incomplete input as the user types.' },
    { id: 'c25q10', kind: 'concept', prompt: 'What does Lesson 26 add on top of this minimal app?', options: ['Nothing further', 'A real multi-turn chat interface with visible conversation history using st.session_state', 'A payment system', 'A new agent tool'], answerIndex: 1, explanation: 'Lesson 26 upgrades the single-question box into a proper chat experience.' },
  ],

  homework: {
    task: "Add a sidebar (st.sidebar) showing a short 'About Compass' description and a link to the project's GitHub repo.",
    requirements: [
      "Use st.sidebar.title() and st.sidebar.write() (or st.sidebar.markdown()) for the content.",
      "Include at least 2-3 sentences describing what Compass can do (tools, memory, planning).",
      "Test that the sidebar renders alongside the main question box, not instead of it.",
    ],
    expectedOutcome: "A working sidebar panel visible alongside the main Compass interface, giving new visitors quick context about what the app does.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 24,
      hint: "Lesson 24 asked you to add a --verbose flag printing which router branch was chosen for every question, plus a tally at exit.",
      steps: [
        "Check sys.argv for '--verbose' at startup, storing it in a verbose bool.",
        "Have route_and_answer() return a tuple (answer, branch_name) instead of just the answer, or track branch choice via a module-level dict.",
        "Increment a Counter (from collections) keyed by branch name each turn.",
        "Print the Counter's contents when the REPL loop exits.",
      ],
    },
  },
};
