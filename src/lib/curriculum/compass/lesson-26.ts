import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 26 — A Real Chat UI with st.session_state
 * Module 5 (Deploy + Capstone) · Lesson 26 of 30
 */
export const lesson26: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 1,
  globalNumber: 26,
  name: 'A real chat UI',
  title: 'A Real Chat UI — Compass with Conversation History',
  subtitle: "Use Streamlit's chat components and st.session_state to give Compass a proper multi-turn interface.",

  concept: {
    durationMin: 15,
    summary:
      "Learn Streamlit's chat-specific components (st.chat_message, st.chat_input) and st.session_state, the mechanism that lets state survive across Streamlit's constant script reruns.",
    sections: [
      {
        heading: 'The problem: reruns wipe out normal variables',
        body:
          "Lesson 25's rerun model means a plain Python list defined inside app.py would be RECREATED EMPTY every single time the script reruns — which happens on every message. Without a way to persist state ACROSS reruns, there's no way to keep a running conversation history.",
      },
      {
        heading: 'st.session_state: the fix',
        body:
          "st.session_state is a dict-like object that Streamlit preserves for a given user's session across reruns. Anything stored there survives, letting you build genuinely stateful apps despite the rerun-everything execution model.",
        code: {
          language: 'python',
          code:
            'if "messages" not in st.session_state:\n    st.session_state.messages = []  # only runs on the FIRST load of a session\n\n# on every rerun after that, st.session_state.messages already has the history',
        },
      },
      {
        heading: "Streamlit's chat components",
        body:
          "st.chat_message(role) renders a styled chat bubble (with an avatar) for 'user' or 'assistant', and st.chat_input() renders a chat-style input box pinned to the bottom of the page — purpose-built for exactly this kind of interface.",
        code: {
          language: 'python',
          code:
            'for msg in st.session_state.messages:\n    with st.chat_message(msg["role"]):\n        st.write(msg["content"])\n\nif prompt := st.chat_input("Ask Compass something..."):\n    st.session_state.messages.append({"role": "user", "content": prompt})\n    with st.chat_message("user"):\n        st.write(prompt)',
        },
      },
      {
        heading: 'Wiring Compass into the chat loop',
        body:
          "After appending the user's message, the SAME route_and_answer() logic runs, and its result is appended back into session_state as an assistant message — displayed the same way the history is.",
        code: {
          language: 'python',
          code:
            'if prompt := st.chat_input("Ask Compass something..."):\n    st.session_state.messages.append({"role": "user", "content": prompt})\n    with st.chat_message("user"):\n        st.write(prompt)\n\n    with st.chat_message("assistant"):\n        with st.spinner("Thinking..."):\n            answer = route_and_answer(prompt)\n        st.write(answer)\n    st.session_state.messages.append({"role": "assistant", "content": answer})',
        },
      },
    ],
    keyTerms: [
      { term: 'st.session_state', definition: "A dict-like Streamlit object that persists per-user data across the script's constant reruns." },
      { term: 'st.chat_message', definition: "A Streamlit component rendering a styled chat bubble for a given role ('user' or 'assistant')." },
      { term: 'st.chat_input', definition: "A Streamlit component rendering a chat-style text input pinned to the bottom of the page, returning the submitted text (or None)." },
    ],
    commonMistakes: [
      "Using a plain Python list/variable for chat history instead of st.session_state — it gets wiped on every rerun.",
      "Re-initializing st.session_state.messages = [] unconditionally instead of only when the key doesn't exist yet, which would erase history every rerun.",
      "Forgetting to append BOTH the user message and the assistant's reply into session_state.",
      "Confusing st.chat_input (bottom-pinned, chat-specific) with st.text_input (a regular form field) from Lesson 25.",
    ],
    takeaways: [
      "st.session_state persists data across Streamlit's constant script reruns — the fix for Lesson 25's stateless problem.",
      "Initialize session_state keys with an `if key not in st.session_state:` guard, not unconditionally.",
      "st.chat_message and st.chat_input are purpose-built chat UI components.",
      "Both the user's message and Compass's reply must be appended to session_state to build real history.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A session-aware counter',
    objective: "Practise st.session_state in isolation with a simple persistent counter before applying it to full chat history.",
    instructions: [
      "Create counter_app.py using st.session_state to track a count.",
      "Add a button that increments it.",
      "Verify the count persists across button clicks (reruns) instead of resetting to 0 each time.",
    ],
    code: [
      {
        language: 'python',
        filename: 'counter_app.py',
        code:
          'import streamlit as st\n\nif "count" not in st.session_state:\n    st.session_state.count = 0\n\nst.write(f"Count: {st.session_state.count}")\n\nif st.button("Increment"):\n    st.session_state.count += 1\n    st.rerun()',
      },
    ],
    explanation:
      "Without st.session_state, `count = 0` would reset to 0 on EVERY rerun (i.e. every button click), making increments impossible to observe. The `if \"count\" not in st.session_state` guard ensures initialization happens exactly once per session, while every subsequent rerun reads and updates the SAME persisted value.",
    expectedOutput: "Clicking Increment repeatedly increases the displayed count: 0, 1, 2, 3... instead of staying stuck at 0 or 1.",
    learned: [
      "Why st.session_state is necessary for any state that must survive Streamlit's rerun model.",
      "The guarded-initialization pattern for session state.",
      "How st.rerun() can be used to immediately reflect a state change.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's Streamlit app becomes a real multi-turn chat interface with visible conversation history, using st.chat_message, st.chat_input, and st.session_state.",
    why:
      "This is the interface Compass deserves — matching how people actually expect to talk to an AI agent, with full context of the conversation so far, not a single question-answer box.",
    fileLocation: 'compass-agent/app.py',
    code: [
      {
        language: 'python',
        filename: 'app.py',
        code:
          'import streamlit as st\nfrom compass_agent import route_and_answer\n\nst.set_page_config(page_title="Compass", page_icon="🧭")\nst.title("🧭 Compass")\nst.caption("Your AI research and task agent — powered by Claude.")\n\nif "messages" not in st.session_state:\n    st.session_state.messages = []\n\nfor msg in st.session_state.messages:\n    with st.chat_message(msg["role"]):\n        st.write(msg["content"])\n\nif prompt := st.chat_input("Ask Compass something..."):\n    st.session_state.messages.append({"role": "user", "content": prompt})\n    with st.chat_message("user"):\n        st.write(prompt)\n\n    with st.chat_message("assistant"):\n        with st.spinner("Thinking..."):\n            try:\n                answer = route_and_answer(prompt)\n            except Exception as e:\n                answer = f"Something went wrong: {e}"\n        st.write(answer)\n    st.session_state.messages.append({"role": "assistant", "content": answer})',
      },
    ],
    placement: "Replace Lesson 25's app.py entirely with the version above.",
    implementation:
      "The `if 'messages' not in st.session_state:` guard runs exactly once per browser session, giving each visitor their OWN independent history (solving the multi-user memory concern that a shared memory.json file would have created). The history loop redisplays every past message on each rerun (necessary, since Streamlit reruns the whole script), while the `if prompt := st.chat_input(...)` walrus-operator pattern only fires the block when the user actually submits a new message, appending both sides of the exchange into session_state so the next rerun's history loop includes them.",
    expectedResult:
      "Opening the app shows a chat interface; asking multiple questions in sequence shows a growing, correctly-ordered conversation with both user and Compass messages, surviving across every interaction within that browser session.",
    connects:
      "The chat UI is real and functional. Lesson 27 handles configuration properly — moving the ANTHROPIC_API_KEY out of hardcoded values and into Streamlit's secrets system, plus showing Compass's tool/reasoning steps live in the UI instead of just the final answer.",
  },

  quiz: [
    { id: 'c26q1', kind: 'concept', prompt: 'Why does a plain Python list fail to hold chat history across interactions in Streamlit?', options: ['Lists are too slow', 'The whole script reruns on every interaction, recreating a plain list as empty each time', 'Lists can’t hold dicts', 'Streamlit doesn’t support lists'], answerIndex: 1, explanation: 'Streamlit’s rerun model wipes ordinary local variables; only st.session_state persists.' },
    { id: 'c26q2', kind: 'application', prompt: 'Why guard session_state initialization with `if "messages" not in st.session_state:`?', options: ['No reason', 'So messages isn’t reset to an empty list on every single rerun, which would erase history', 'It’s required syntax', 'To make the app slower'], answerIndex: 1, explanation: 'Without the guard, history would be wiped every rerun, defeating the purpose of session_state.' },
    { id: 'c26q3', kind: 'concept', prompt: 'What does st.chat_input() return when the user hasn’t submitted anything yet?', options: ['An empty string', 'None (which is falsy, so the `if prompt := ...` block is skipped)', 'Raises an exception', 'The previous message again'], answerIndex: 1, explanation: 'The walrus-operator pattern relies on None being falsy to skip the block until real input arrives.' },
    { id: 'c26q4', kind: 'code_reading', prompt: 'What does the `for msg in st.session_state.messages:` loop do on every rerun?', options: ['Nothing, it only runs once', 'Redisplays the ENTIRE conversation history so far, since Streamlit reruns the whole script', 'Deletes old messages', 'Sends messages to the API again'], answerIndex: 1, explanation: 'Because the whole script reruns, redisplaying history each time is necessary to keep it visible.' },
    { id: 'c26q5', kind: 'debug', prompt: 'Two different browser tabs open the same Compass app and see SEPARATE conversation histories. Is this expected?', options: ['No, it’s a bug', 'Yes — st.session_state is per-session, so each browser session gets its own independent history', 'Only if using incognito mode', 'Only on localhost'], answerIndex: 1, explanation: 'Session state is scoped per user session, which is exactly the multi-user isolation the app needs.' },
    { id: 'c26q6', kind: 'application', prompt: 'Why append BOTH the user prompt and Compass’s answer to st.session_state.messages?', options: ['Only the answer matters', 'So the next rerun’s history loop displays the complete back-and-forth exchange, not just one side', 'It’s required by the API', 'To reduce memory usage'], answerIndex: 1, explanation: 'Both sides must be stored for the history to render a genuine conversation.' },
    { id: 'c26q7', kind: 'output', prompt: 'What renders for each message in the history loop?', options: ['Plain unstyled text only', 'A styled chat bubble via st.chat_message(role), with an avatar matching the role', 'A popup window', 'Nothing until the page refreshes'], answerIndex: 1, explanation: 'st.chat_message renders role-appropriate styled chat bubbles.' },
    { id: 'c26q8', kind: 'project', prompt: 'Why is route_and_answer() wrapped in try/except inside the chat loop?', options: ['No reason', 'So a failure shows an inline error message in the chat instead of crashing the whole app mid-conversation', 'It’s required by Streamlit', 'To slow down responses'], answerIndex: 1, explanation: 'A defensive boundary keeps one failed response from breaking the entire session.' },
    { id: 'c26q9', kind: 'concept', prompt: 'What existing Compass function powers the actual reply inside the chat loop?', options: ['A brand-new function written just for Streamlit', 'route_and_answer() from Lesson 24, reused unchanged', 'save_memory() alone', 'reflect_on_answer() alone'], answerIndex: 1, explanation: 'The full Module 1-4 reasoning pipeline is reused via route_and_answer().' },
    { id: 'c26q10', kind: 'concept', prompt: 'What does Lesson 27 address next?', options: ['Nothing further', 'Proper configuration (secrets) and showing live tool/reasoning steps in the UI', 'Removing the chat interface', 'Switching away from Streamlit'], answerIndex: 1, explanation: 'Lesson 27 covers secrets management and surfacing live agent activity in the interface.' },
  ],

  homework: {
    task: "Add a 'Clear conversation' button that resets st.session_state.messages back to an empty list.",
    requirements: [
      "Place the button somewhere sensible (e.g. the sidebar).",
      "On click, reset st.session_state.messages = [] and call st.rerun() so the UI updates immediately.",
      "Test that a fresh conversation genuinely starts empty after clicking it.",
    ],
    expectedOutcome: "A working 'Clear conversation' control that fully resets the visible chat history on demand.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 25,
      hint: "Lesson 25 asked you to add a sidebar with an 'About Compass' description and a GitHub link.",
      steps: [
        "Use st.sidebar.title('About Compass') and st.sidebar.markdown() with a short description.",
        "Include a markdown link to your repo, e.g. st.sidebar.markdown('[GitHub](https://github.com/your-username/compass-agent)').",
      ],
    },
  },
};
