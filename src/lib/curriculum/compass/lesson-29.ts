import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 29 — Production Polish for Real Users
 * Module 5 (Deploy + Capstone) · Lesson 29 of 30
 */
export const lesson29: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 4,
  globalNumber: 29,
  name: 'Production polish for real users',
  title: 'Production Polish — Ready for Strangers',
  subtitle: "Add per-session rate limiting, cleaner error handling, and small UI refinements now that real people can reach Compass.",

  concept: {
    durationMin: 15,
    summary:
      "Learn why a deployed public app needs safeguards a personal CLI tool didn't — rate limiting, cost control, and graceful handling of real-world failure modes.",
    sections: [
      {
        heading: 'A public URL changes the risk profile',
        body:
          "Locally, Compass only ever ran when YOU typed something. Deployed at a public URL, anyone can send unlimited requests — each one a real, billed API call. A simple per-session rate limit protects both cost and the app's stability without needing a full auth system.",
        code: {
          language: 'python',
          code:
            'import time\n\nMAX_REQUESTS_PER_SESSION = 20\nMIN_SECONDS_BETWEEN_REQUESTS = 2\n\nif "request_count" not in st.session_state:\n    st.session_state.request_count = 0\n    st.session_state.last_request_time = 0.0',
        },
      },
      {
        heading: 'Enforcing the limit',
        body:
          "Both checks run right before calling route_and_answer(): a hard cap on total requests for this session, and a minimum gap between consecutive requests to prevent rapid-fire spamming.",
        code: {
          language: 'python',
          code:
            'def can_make_request() -> tuple[bool, str]:\n    if st.session_state.request_count >= MAX_REQUESTS_PER_SESSION:\n        return False, "You\'ve reached this session\'s question limit. Refresh to start a new session."\n    elapsed = time.time() - st.session_state.last_request_time\n    if elapsed < MIN_SECONDS_BETWEEN_REQUESTS:\n        return False, "Please wait a moment before asking another question."\n    return True, ""',
        },
      },
      {
        heading: 'Handling real API errors gracefully',
        body:
          "Module 1's with_retry() (Lesson 4) already handles transient errors internally, but the UI itself should also distinguish between error TYPES for a genuinely helpful message — a rate-limit error and an invalid-request error mean very different things to a user. The openai package exposes typed exception classes for this regardless of which OpenAI-compatible provider is actually behind client — the same except clauses work whether you're on OpenAI, Groq, or Gemini.",
        code: {
          language: 'python',
          code:
            'import openai\n\ndef safe_answer(prompt: str, on_step=print) -> str:\n    try:\n        return route_and_answer(prompt, on_step=on_step)\n    except openai.RateLimitError:\n        return "Compass is getting a lot of requests right now — please try again in a moment."\n    except openai.APIStatusError:\n        return "Compass hit a temporary issue reaching the model. Please try again."\n    except Exception:\n        return "Something unexpected went wrong. Please try again or rephrase your question."',
        },
      },
      {
        heading: 'Small UI refinements that matter for real users',
        body:
          "A sidebar with a few genuinely useful controls — remaining question count, a model/temperature note, and a way to download the conversation — makes the difference between a demo and something that feels like a real product.",
        code: {
          language: 'python',
          code:
            'st.sidebar.metric("Questions used", f"{st.session_state.request_count}/{MAX_REQUESTS_PER_SESSION}")\n\nif st.session_state.messages:\n    transcript = "\\n\\n".join(f"{m[\'role\'].upper()}: {m[\'content\']}" for m in st.session_state.messages)\n    st.sidebar.download_button("Download conversation", transcript, file_name="compass_conversation.txt")',
        },
      },
    ],
    keyTerms: [
      { term: 'Per-session rate limiting', definition: "Capping the number/rate of requests a single user session can make, without requiring full user accounts or authentication." },
      { term: 'st.download_button', definition: "A Streamlit widget that lets a user download generated content (like a conversation transcript) as a file." },
    ],
    commonMistakes: [
      "Deploying a public agent with NO usage limits, exposing the API key's billing to unlimited use by strangers.",
      "Showing the same generic error message for every failure type, when the API distinguishes rate limits from actual invalid requests.",
      "Rate-limiting so aggressively that normal, well-intentioned use gets blocked.",
      "Forgetting the rate limit counters need st.session_state, or they'll reset on every rerun like any other unguarded variable.",
    ],
    takeaways: [
      "A public deployment needs rate limiting to protect cost and stability — the CLI version never needed this.",
      "Distinguishing error types (rate limit vs. general API error vs. unexpected) gives users genuinely useful feedback.",
      "Small sidebar refinements (usage counter, download button) meaningfully improve the real-user experience.",
      "Rate-limit state must live in st.session_state, same as chat history.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Testing the rate limiter in isolation',
    objective: "Practise can_make_request()'s logic with simulated rapid calls before wiring it into the full app.",
    instructions: [
      "Write can_make_request() and the session_state initialization as shown in the concept section.",
      "Simulate several rapid calls in a row and observe when it starts blocking.",
      "Simulate waiting past MIN_SECONDS_BETWEEN_REQUESTS and confirm it allows a request again.",
    ],
    code: [
      {
        language: 'python',
        filename: 'rate_limit_test.py',
        code:
          'import time\n\nMAX_REQUESTS_PER_SESSION = 3\nMIN_SECONDS_BETWEEN_REQUESTS = 1\n\nstate = {"request_count": 0, "last_request_time": 0.0}\n\ndef can_make_request() -> tuple[bool, str]:\n    if state["request_count"] >= MAX_REQUESTS_PER_SESSION:\n        return False, "Session limit reached."\n    if time.time() - state["last_request_time"] < MIN_SECONDS_BETWEEN_REQUESTS:\n        return False, "Too fast, please wait."\n    return True, ""\n\nfor i in range(5):\n    ok, msg = can_make_request()\n    print(f"attempt {i+1}: allowed={ok} {msg}")\n    if ok:\n        state["request_count"] += 1\n        state["last_request_time"] = time.time()\n    time.sleep(0.3)',
      },
    ],
    explanation:
      "This mocks st.session_state with a plain dict to test the rate-limiting LOGIC in isolation from Streamlit itself — a useful technique in general, since pure logic is far easier to test outside a framework's execution model. The rapid-fire loop should show early attempts blocked by the too-fast check, then eventually blocked by the session cap.",
    expectedOutput: "The first request succeeds; several immediately following ones are blocked as 'too fast'; once MAX_REQUESTS_PER_SESSION is reached, all further ones are blocked as 'limit reached'.",
    learned: [
      "How to test session-state-dependent logic by mocking it with a plain dict.",
      "The interaction between a rate cap and a minimum-interval check.",
      "Why testing rate limiting logic in isolation is easier than testing it inside the full running app.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass's deployed app gains per-session rate limiting, error-type-aware messaging, and a sidebar with usage tracking and conversation download.",
    why:
      "This is what separates a working demo from something genuinely ready to be shared publicly — real safeguards for real, unpredictable usage.",
    fileLocation: 'compass-agent/app.py',
    code: [
      {
        language: 'python',
        filename: 'app.py',
        code:
          'import time\nimport streamlit as st\nimport openai\nfrom compass_agent import route_and_answer\n\nMAX_REQUESTS_PER_SESSION = 20\nMIN_SECONDS_BETWEEN_REQUESTS = 2\n\nst.set_page_config(page_title="Compass", page_icon="🧭")\nst.title("🧭 Compass")\n\nif "messages" not in st.session_state:\n    st.session_state.messages = []\n    st.session_state.request_count = 0\n    st.session_state.last_request_time = 0.0\n\ndef can_make_request() -> tuple[bool, str]:\n    if st.session_state.request_count >= MAX_REQUESTS_PER_SESSION:\n        return False, "You\'ve reached this session\'s question limit. Refresh to start a new session."\n    if time.time() - st.session_state.last_request_time < MIN_SECONDS_BETWEEN_REQUESTS:\n        return False, "Please wait a moment before asking another question."\n    return True, ""\n\ndef safe_answer(prompt: str, on_step=print) -> str:\n    try:\n        return route_and_answer(prompt, on_step=on_step)\n    except openai.RateLimitError:\n        return "Compass is getting a lot of requests right now — please try again in a moment."\n    except openai.APIStatusError:\n        return "Compass hit a temporary issue reaching the model. Please try again."\n    except Exception:\n        return "Something unexpected went wrong. Please try again or rephrase your question."\n\nst.sidebar.metric("Questions used", f"{st.session_state.request_count}/{MAX_REQUESTS_PER_SESSION}")\nif st.session_state.messages:\n    transcript = "\\n\\n".join(f"{m[\'role\'].upper()}: {m[\'content\']}" for m in st.session_state.messages)\n    st.sidebar.download_button("Download conversation", transcript, file_name="compass_conversation.txt")\n\nfor msg in st.session_state.messages:\n    with st.chat_message(msg["role"]):\n        st.write(msg["content"])\n\nif prompt := st.chat_input("Ask Compass something..."):\n    allowed, reason = can_make_request()\n    st.session_state.messages.append({"role": "user", "content": prompt})\n    with st.chat_message("user"):\n        st.write(prompt)\n\n    with st.chat_message("assistant"):\n        if not allowed:\n            answer = reason\n            st.warning(answer)\n        else:\n            st.session_state.request_count += 1\n            st.session_state.last_request_time = time.time()\n            with st.status("Compass is working...", expanded=False) as status:\n                answer = safe_answer(prompt, on_step=st.write)\n                status.update(label="Done", state="complete")\n            st.write(answer)\n    st.session_state.messages.append({"role": "assistant", "content": answer})',
      },
    ],
    placement: "Replace Lesson 27's app.py entirely with the version above.",
    implementation:
      "can_make_request() is checked BEFORE incrementing counters or calling the agent — a blocked request costs nothing and shows a clear st.warning() instead of silently failing or (worse) still calling the paid API. safe_answer() wraps route_and_answer() specifically to translate raw openai exceptions into messages a non-technical user can actually understand, rather than a stack trace or a generic failure — the same except clauses work regardless of which OpenAI-compatible provider is configured. The sidebar's metric and download_button are placed above the chat history so they're immediately visible without scrolling.",
    expectedResult:
      "Asking Compass more than 20 questions in one session shows a clear limit-reached warning instead of another API call; asking two questions within 2 seconds of each other shows a 'please wait' message; the sidebar shows a live usage counter and lets the visitor download their conversation as a text file at any point.",
    connects:
      "Compass is now genuinely production-ready: secure, transparent, and safeguarded. Lesson 30, the Module 5 build, brings the ENTIRE course together — every module, every lesson — into one final capstone review of the complete, deployed Compass agent.",
  },

  quiz: [
    { id: 'c29q1', kind: 'concept', prompt: 'Why does a deployed public Compass need rate limiting when the CLI version never did?', options: ['No real reason', 'A public URL means anyone can send unlimited, real, billed API requests, unlike a personal CLI tool only you run', 'Rate limiting is required by Streamlit', 'It makes the app run faster'], answerIndex: 1, explanation: 'Public reachability changes the risk profile around cost and abuse.' },
    { id: 'c29q2', kind: 'application', prompt: 'What two checks does can_make_request() perform?', options: ['Only a total session cap', 'A total session request cap, and a minimum time gap between consecutive requests', 'Only a time-based check', 'A check on message length'], answerIndex: 1, explanation: 'Both a hard cap and a minimum interval protect against different abuse patterns.' },
    { id: 'c29q3', kind: 'code_reading', prompt: 'What does safe_answer() do differently for openai.RateLimitError versus a generic Exception?', options: ['Nothing, they’re treated identically', 'It returns a specific, user-understandable message tailored to that error type, rather than one generic message for everything', 'It crashes the app for RateLimitError specifically', 'It retries automatically for both'], answerIndex: 1, explanation: 'Distinguishing error types gives more genuinely useful feedback to the user.' },
    { id: 'c29q4', kind: 'debug', prompt: 'A blocked request (rate-limited) still shows up incrementing request_count. What’s wrong with that implementation?', options: ['Nothing, it’s correct', 'A blocked request should NOT increment the counter or call the paid API — only allowed requests should', 'The counter should always increment', 'It’s a Streamlit bug'], answerIndex: 1, explanation: 'can_make_request() is checked BEFORE incrementing, so blocked requests cost nothing.' },
    { id: 'c29q5', kind: 'application', prompt: 'Why mock st.session_state with a plain dict in the mini-project instead of running inside real Streamlit?', options: ['No reason', 'It isolates and tests the pure rate-limiting LOGIC without needing the full Streamlit execution model', 'Streamlit can’t be tested at all', 'Dicts are required by the API'], answerIndex: 1, explanation: 'Testing pure logic independent of a framework is generally simpler and faster.' },
    { id: 'c29q6', kind: 'output', prompt: 'What does the sidebar show once a few questions have been asked?', options: ['Nothing', 'A "Questions used X/20" metric and a download button for the conversation transcript', 'The raw API key', 'A billing invoice'], answerIndex: 1, explanation: 'These are the two sidebar refinements added in the final project.' },
    { id: 'c29q7', kind: 'project', prompt: 'Why is can_make_request() checked BEFORE calling route_and_answer(), not after?', options: ['No particular reason', 'To avoid making (and paying for) an API call that would be denied anyway', 'It’s required syntax', 'To make the app slower on purpose'], answerIndex: 1, explanation: 'Checking first avoids wasted cost on requests that will be blocked.' },
    { id: 'c29q8', kind: 'concept', prompt: 'What happens to request_count and last_request_time across a rerun within the SAME browser session?', options: ['They reset to 0 every time', 'They persist, since they live in st.session_state, same as chat history', 'They’re stored in a database', 'They’re lost after 5 minutes'], answerIndex: 1, explanation: 'Rate-limit state needs the same persistence mechanism as chat history to work correctly.' },
    { id: 'c29q9', kind: 'application', prompt: 'Why include a download_button for the conversation transcript?', options: ['No real benefit', 'It gives real users a genuinely useful way to save their conversation, a small but meaningful product-quality touch', 'It’s required by Streamlit', 'To reduce API costs'], answerIndex: 1, explanation: 'Small, genuinely useful features like this distinguish a polished app from a bare demo.' },
    { id: 'c29q10', kind: 'concept', prompt: 'What does Lesson 30 (the Module 5 build) bring together?', options: ['Only Module 5', 'The ENTIRE course — every module and lesson — into one final capstone review of the complete deployed Compass agent', 'Only the rate-limiting logic', 'A brand-new unrelated feature'], answerIndex: 1, explanation: 'Lesson 30 is the full course capstone, reviewing everything built across all 30 lessons.' },
  ],

  homework: {
    task: "Add a friendly cooldown countdown: when a request is blocked by the minimum-interval check, show exactly how many seconds remain instead of a generic 'please wait' message.",
    requirements: [
      "Calculate the remaining wait time (MIN_SECONDS_BETWEEN_REQUESTS - elapsed).",
      "Round it to a whole number of seconds for the message.",
      "Test by sending two questions in quick succession and confirming the countdown number looks correct.",
    ],
    expectedOutcome: "A blocked request shows a message like 'Please wait 1 more second before asking another question' instead of a generic wait message.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 28,
      hint: "Lesson 28 asked you to write a README.md covering what Compass is, setup instructions, and a link to the live app.",
      steps: [
        "Create README.md at the repo root with a description, setup steps (clone, venv, pip install, secrets.toml), and the live URL once deployed.",
        "Keep it concise enough that a stranger could follow it without asking questions.",
      ],
    },
  },
};
