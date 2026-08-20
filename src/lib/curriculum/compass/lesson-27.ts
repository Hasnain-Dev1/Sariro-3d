import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 27 — Secrets, Config, and Live Reasoning Display
 * Module 5 (Deploy + Capstone) · Lesson 27 of 30
 */
export const lesson27: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 2,
  globalNumber: 27,
  name: 'Secrets, config, and live reasoning display',
  title: 'Secrets, Config, and Showing Compass Think',
  subtitle: "Move the API key into st.secrets, and surface Compass's tool calls and reasoning live in the chat UI.",

  concept: {
    durationMin: 15,
    summary:
      "Learn Streamlit's secrets management for API keys, and how to surface an agent's internal reasoning/tool activity as live UI updates instead of print() statements.",
    sections: [
      {
        heading: 'st.secrets: never hardcode an API key',
        body:
          "Every course so far has used a .env file with python-dotenv for local secrets. Streamlit has its own equivalent: a local .streamlit/secrets.toml file (git-ignored, same as .env) read via st.secrets, which becomes the SAME mechanism used for secrets once deployed to Streamlit Community Cloud.",
        code: {
          language: 'toml',
          filename: '.streamlit/secrets.toml (local only, git-ignored)',
          code: 'OPENAI_API_KEY = "sk-..."',
        },
      },
      {
        heading: 'Reading secrets in code',
        body:
          "st.secrets behaves like a dict, and is the natural place to construct the client so it works identically locally and once deployed. Since Compass uses the openai package's client shape throughout, the same pattern works unchanged if you later swap to Groq or Gemini via base_url.",
        code: {
          language: 'python',
          code:
            'import streamlit as st\nfrom openai import OpenAI\n\nclient = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])',
        },
      },
      {
        heading: 'print() doesn’t work the way you’d expect in a web app',
        body:
          "All of Compass's transparency features so far (Lessons 12, 18, 19, 21, 23, 24) used print() — visible in a terminal, but INVISIBLE to someone using the deployed web app, since print() output goes to the server's logs, not the browser. Streamlit needs its own equivalent: st.status() as a live-updating container.",
      },
      {
        heading: 'st.status: a live reasoning panel',
        body:
          "st.status() creates an expandable container that can be updated WHILE code runs inside it — a natural home for showing 'Thought: ...', '[step 2/4] ...', or '[router] routing to...' messages live, instead of them disappearing into server logs.",
        code: {
          language: 'python',
          code:
            'with st.status("Compass is working...", expanded=True) as status:\n    st.write("Thought: I need to check the weather in Tokyo first.")\n    # ... tool call happens here ...\n    st.write("Observation: Tokyo is 22°C and sunny.")\n    status.update(label="Done", state="complete")',
        },
      },
      {
        heading: 'Bridging print() calls into the UI',
        body:
          "Rather than rewriting every print() across Modules 1-4, a small helper collects a callback that agent functions can call INSTEAD of print(), letting the same core logic feed either the terminal (CLI) or a live st.status() panel (web), depending on which interface is running.",
        code: {
          language: 'python',
          code:
            'def route_and_answer(question: str, on_step=print) -> str:\n    if should_use_cot(question):\n        on_step("[router] routing to chain-of-thought reasoning")\n        return reason_through(question)\n    # ...same routing logic, using on_step(...) instead of print(...) throughout...',
        },
      },
    ],
    keyTerms: [
      { term: 'st.secrets', definition: "Streamlit's secrets-management system, reading from a local .streamlit/secrets.toml file or the deployed platform's secrets store." },
      { term: 'st.status', definition: "A Streamlit container that can be updated live while code runs inside it, ideal for showing an agent's step-by-step progress." },
      { term: 'on_step callback', definition: "A function parameter (defaulting to print) that lets shared agent logic report progress to either a terminal or a Streamlit UI." },
    ],
    commonMistakes: [
      "Hardcoding the API key directly in app.py instead of using st.secrets — a real security risk if the code is ever pushed publicly.",
      "Forgetting .streamlit/secrets.toml needs to be added to .gitignore, same as .env.",
      "Assuming print() statements from Modules 1-4 will show up in the deployed Streamlit UI — they go to server logs instead.",
      "Rewriting all of Compass's core logic to use st.write() directly, coupling agent logic to a specific UI framework instead of using a swappable callback.",
    ],
    takeaways: [
      "st.secrets reads from .streamlit/secrets.toml locally and the platform's secrets store once deployed — never hardcode keys.",
      "print() output is invisible to users of a deployed web app; it only reaches server logs.",
      "st.status() provides a live-updating panel, the Streamlit equivalent of print()-based transparency.",
      "An on_step callback (defaulting to print) lets the SAME agent logic serve both the CLI and the web UI.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A live progress panel',
    objective: "Practise st.status() with a simulated multi-step process before wiring it into Compass's real reasoning.",
    instructions: [
      "Create a Streamlit app with a button that triggers a simulated 3-step process.",
      "Use st.status() to show each step as it 'completes' (use time.sleep to simulate work).",
      "Mark the status complete at the end.",
    ],
    code: [
      {
        language: 'python',
        filename: 'status_demo.py',
        code:
          'import time\nimport streamlit as st\n\nif st.button("Run process"):\n    with st.status("Working...", expanded=True) as status:\n        st.write("Step 1: gathering data")\n        time.sleep(1)\n        st.write("Step 2: processing")\n        time.sleep(1)\n        st.write("Step 3: finalizing")\n        time.sleep(1)\n        status.update(label="Done!", state="complete")',
      },
    ],
    explanation:
      "This isolates the st.status() pattern from any real agent logic — each st.write() call inside the `with` block appears live in the expandable panel AS it executes, and status.update() at the end changes both the label and the collapsed/complete visual state, exactly the mechanism used for Compass's real reasoning trace in the final project.",
    expectedOutput: "Clicking 'Run process' shows an expanding status panel with each step appearing one at a time, roughly a second apart, ending with a 'Done!' label.",
    learned: [
      "How st.status() provides live progress feedback during a running process.",
      "The difference between print() (server-only) and Streamlit UI updates (visible to the actual user).",
      "How status.update() changes the panel's final label and state.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass reads its API key from st.secrets, and the chat UI shows Compass's live reasoning (thoughts, routing decisions, tool calls) in an expandable status panel for each response.",
    why:
      "This makes Compass's deployed version properly secure AND properly transparent — matching, in the browser, the same visibility print() gave the CLI version throughout Modules 1-4.",
    fileLocation: 'compass-agent/app.py + compass_agent.py (on_step callback)',
    code: [
      {
        language: 'toml',
        filename: '.streamlit/secrets.toml',
        code: 'OPENAI_API_KEY = "sk-your-key-here"',
      },
      {
        language: 'python',
        filename: 'compass_agent.py (client + on_step threaded through)',
        code:
          'import streamlit as st\nfrom openai import OpenAI\n\nclient = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])\n\n\ndef route_and_answer(question: str, on_step=print) -> str:\n    if should_use_cot(question):\n        on_step("Routing to chain-of-thought reasoning")\n        return reason_through(question)\n    if looks_multi_part(question):\n        on_step("Routing to plan+execute")\n        return plan_execute_and_recover(question, on_step=on_step)\n    on_step("Routing to standard reasoning agent")\n    return answer_with_reflection(question, on_step=on_step)',
      },
      {
        language: 'python',
        filename: 'app.py',
        code:
          'import streamlit as st\nfrom compass_agent import route_and_answer\n\nst.set_page_config(page_title="Compass", page_icon="🧭")\nst.title("🧭 Compass")\n\nif "messages" not in st.session_state:\n    st.session_state.messages = []\n\nfor msg in st.session_state.messages:\n    with st.chat_message(msg["role"]):\n        st.write(msg["content"])\n\nif prompt := st.chat_input("Ask Compass something..."):\n    st.session_state.messages.append({"role": "user", "content": prompt})\n    with st.chat_message("user"):\n        st.write(prompt)\n\n    with st.chat_message("assistant"):\n        with st.status("Compass is working...", expanded=False) as status:\n            answer = route_and_answer(prompt, on_step=st.write)\n            status.update(label="Done", state="complete")\n        st.write(answer)\n    st.session_state.messages.append({"role": "assistant", "content": answer})',
      },
    ],
    placement: "Create .streamlit/secrets.toml locally (and add it to .gitignore). Update compass_agent.py to build the client from st.secrets and accept on_step in route_and_answer() (and the functions it calls). Update app.py's chat loop as shown.",
    implementation:
      "Passing `on_step=st.write` means every progress message Compass's routing/reasoning logic reports flows directly into the live st.status() panel instead of a terminal — the SAME agent code, just fed a different reporting function. Defaulting on_step to print() keeps the CLI version (main.py from Module 4) working completely unchanged, since it never passes on_step explicitly. expanded=False keeps the reasoning trace tucked away by default (viewable by clicking to expand), so the chat stays clean for users who just want the answer.",
    expectedResult:
      "Asking Compass a multi-part question shows a collapsed 'Compass is working...' panel that, when expanded, reveals the live routing decision, plan steps, and tool activity — then collapses to 'Done' with the final answer shown below it in the chat.",
    connects:
      "Compass is now secure and properly transparent. Lesson 28 covers actually DEPLOYING this app to Streamlit Community Cloud so it's reachable by anyone with a link, not just on your own machine.",
  },

  quiz: [
    { id: 'c27q1', kind: 'concept', prompt: 'Where should the OpenAI API key be stored for a Streamlit app?', options: ['Hardcoded in app.py', 'st.secrets, backed by .streamlit/secrets.toml locally', 'In a public GitHub repo', 'In the URL'], answerIndex: 1, explanation: 'st.secrets is Streamlit’s secure secrets mechanism, matching the .env pattern used elsewhere in the course.' },
    { id: 'c27q2', kind: 'concept', prompt: 'Why don’t Compass’s existing print() statements show up in the deployed web app?', options: ['print() is broken in Streamlit', 'print() output goes to the server’s logs, not the browser the user sees', 'Streamlit disables print() entirely', 'It’s a Python 3 limitation'], answerIndex: 1, explanation: 'Server-side print output never reaches the client browser in a deployed web context.' },
    { id: 'c27q3', kind: 'application', prompt: 'What does st.status() provide that a plain print() can’t, in a Streamlit app?', options: ['Nothing different', 'A live-updating UI panel visible to the actual user in their browser', 'Faster execution', 'Automatic error handling'], answerIndex: 1, explanation: 'st.status() is a UI-visible container updated live while code inside it runs.' },
    { id: 'c27q4', kind: 'code_reading', prompt: 'What does `on_step=print` as a default parameter achieve in route_and_answer()?', options: ['Nothing, it’s unused', 'The CLI version keeps working unchanged (using print), while the web version passes on_step=st.write instead', 'It disables all output', 'It’s required syntax'], answerIndex: 1, explanation: 'The default lets the SAME function serve both interfaces without the CLI code needing any changes.' },
    { id: 'c27q5', kind: 'debug', prompt: 'A deployed Compass app crashes with a KeyError on st.secrets["OPENAI_API_KEY"]. What’s the likely cause?', options: ['The code is wrong', 'The secret wasn’t configured in the deployment platform’s secrets settings (or the local secrets.toml is missing/misnamed)', 'Streamlit is broken', 'The API key format is wrong'], answerIndex: 1, explanation: 'A missing secrets.toml (locally) or unconfigured platform secret (deployed) is the most common cause of this error.' },
    { id: 'c27q6', kind: 'application', prompt: 'Why pass on_step=st.write instead of rewriting Compass’s core logic to call st.write() directly?', options: ['No real reason', 'It keeps the agent logic decoupled from any specific UI framework, reusable by both the CLI and web interfaces', 'st.write() only works inside app.py', 'It’s required by the API'], answerIndex: 1, explanation: 'A swappable callback avoids coupling core agent logic to Streamlit specifically.' },
    { id: 'c27q7', kind: 'output', prompt: 'What does status.update(label="Done", state="complete") change?', options: ['Nothing visible', 'The status panel’s displayed label and its visual complete/collapsed state', 'The chat history', 'The API key'], answerIndex: 1, explanation: 'update() lets you change the container’s label and completion state once its work is done.' },
    { id: 'c27q8', kind: 'project', prompt: 'Why does the final project use expanded=False for the status panel by default?', options: ['No reason', 'To keep the chat visually clean for users who just want the answer, while still letting them expand to see the reasoning', 'It’s required syntax', 'To hide errors'], answerIndex: 1, explanation: 'Collapsed-by-default balances transparency (available on demand) with a clean default chat experience.' },
    { id: 'c27q9', kind: 'concept', prompt: 'What must be added to .gitignore alongside .env?', options: ['app.py', '.streamlit/secrets.toml', 'requirements.txt', 'compass_agent.py'], answerIndex: 1, explanation: 'secrets.toml contains the real API key and must never be committed, same as .env.' },
    { id: 'c27q10', kind: 'concept', prompt: 'What does Lesson 28 cover next?', options: ['More reasoning patterns', 'Actually deploying the app to Streamlit Community Cloud so it’s reachable by anyone with a link', 'Removing the chat UI', 'Adding new tools'], answerIndex: 1, explanation: 'Lesson 28 covers the real deployment process.' },
  ],

  homework: {
    task: "Thread the on_step callback through plan_execute_and_recover() and answer_with_reflection() (from Module 4) so their internal print() calls also become on_step() calls, matching route_and_answer()'s pattern.",
    requirements: [
      "Add on_step=print as a default parameter to both functions.",
      "Replace their internal print(...) calls with on_step(...).",
      "Verify the CLI version (main.py) still works unchanged, since it never passes on_step explicitly.",
    ],
    expectedOutcome: "Every layer of Compass's reasoning (routing, planning, reflection) reports through the same swappable on_step mechanism, so the Streamlit status panel shows the FULL trace, not just the top-level routing decision.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 26,
      hint: "Lesson 26 asked you to add a 'Clear conversation' button resetting st.session_state.messages.",
      steps: [
        "Add the button inside st.sidebar, e.g. st.sidebar.button('Clear conversation').",
        "On click, set st.session_state.messages = [] and call st.rerun() so the cleared UI shows immediately.",
      ],
    },
  },
};
