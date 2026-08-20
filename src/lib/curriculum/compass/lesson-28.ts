import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Compass · Lesson 28 — Deploying to Streamlit Community Cloud
 * Module 5 (Deploy + Capstone) · Lesson 28 of 30
 */
export const lesson28: StructuredLesson = {
  courseId: 'agent-101',
  moduleNum: 5,
  lessonIndex: 3,
  globalNumber: 28,
  name: 'Deploying to Streamlit Community Cloud',
  title: 'Going Public — Deploying Compass for Real',
  subtitle: "Push Compass to GitHub and deploy it with Streamlit Community Cloud, so anyone with a link can use it.",

  concept: {
    durationMin: 15,
    summary:
      "Learn the GitHub → Streamlit Community Cloud deployment pipeline: repo structure, requirements.txt, secrets configuration, and what happens after deploying.",
    sections: [
      {
        heading: 'What Compass needs before deploying',
        body:
          "Three things need to exist in the repo root: app.py (the entry point Streamlit runs), requirements.txt (every package Compass imports — streamlit, openai, requests, python-dotenv; embeddings come from the same openai package, so no separate embeddings package is needed), and a .gitignore excluding .streamlit/secrets.toml and any local memory.json/revisions.log files.",
        code: {
          language: 'text',
          filename: 'requirements.txt',
          code: 'streamlit\nopenai\nrequests\npython-dotenv',
        },
      },
      {
        heading: 'Pushing to GitHub',
        body:
          "Streamlit Community Cloud deploys directly from a GitHub repository — there's no separate build/upload step like Vercel's CLI; the platform watches the repo itself.",
        code: {
          language: 'bash',
          code:
            'git init\ngit add app.py compass_agent.py requirements.txt .gitignore\ngit commit -m "Compass: ready for deployment"\ngit remote add origin https://github.com/your-username/compass-agent.git\ngit push -u origin main',
        },
      },
      {
        heading: 'Deploying on share.streamlit.io',
        body:
          "From share.streamlit.io, connect your GitHub account, pick the compass-agent repo, set the main file path to app.py, and click Deploy. Streamlit installs requirements.txt automatically and starts the app.",
      },
      {
        heading: 'Configuring secrets on the deployed app',
        body:
          "The deployed app has NO access to your local .streamlit/secrets.toml (correctly, since it's git-ignored) — secrets must be entered separately through the app's Settings → Secrets panel on share.streamlit.io, using the exact same TOML format.",
        code: {
          language: 'toml',
          filename: 'Settings → Secrets (pasted into the web UI, not a file)',
          code: 'OPENAI_API_KEY = "sk-your-key-here"',
        },
      },
      {
        heading: 'After deploying',
        body:
          "The app gets a public URL like your-app-name.streamlit.app. Every push to the connected GitHub branch automatically redeploys the app — the same continuous-deployment behavior as Vercel, just for a Python app instead of a Next.js one.",
      },
    ],
    keyTerms: [
      { term: 'requirements.txt', definition: "A plain-text file listing every Python package a project depends on, used to reproduce the environment during deployment." },
      { term: 'Streamlit Community Cloud', definition: "A free hosting platform for Streamlit apps, deploying directly from a connected GitHub repository." },
      { term: 'Continuous deployment', definition: "Automatically redeploying an app whenever new commits are pushed to its connected branch." },
    ],
    commonMistakes: [
      "Forgetting to include a package in requirements.txt that's imported in the code, causing a ModuleNotFoundError on deploy.",
      "Committing .streamlit/secrets.toml (or memory.json, revisions.log) to the public repo instead of git-ignoring them.",
      "Assuming local secrets.toml carries over automatically — deployed secrets must be entered separately in the platform's Settings panel.",
      "Pointing the deployment at the wrong main file path (not app.py) when configuring the app on share.streamlit.io.",
    ],
    takeaways: [
      "requirements.txt must list every package Compass actually imports, or deployment will fail.",
      "Streamlit Community Cloud deploys directly from a connected GitHub repo, no separate build/upload step.",
      "Deployed secrets are configured separately in Settings → Secrets, not read from a local file.",
      "Every push to the connected branch automatically redeploys the live app.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Auditing your requirements.txt',
    objective: "Practise identifying every third-party import Compass actually uses, to build an accurate requirements.txt before deploying.",
    instructions: [
      "Search your compass_agent.py and app.py files for every `import` and `from ... import` line.",
      "List each third-party package name (ignore standard library ones like json, re, time, sys).",
      "Write the resulting requirements.txt.",
    ],
    code: [
      {
        language: 'bash',
        filename: 'find third-party imports (Unix/macOS/WSL)',
        code: "grep -rhE '^(import|from) ' *.py | sort -u",
      },
      {
        language: 'text',
        filename: 'requirements.txt (example result)',
        code: 'streamlit\nopenai\nrequests\npython-dotenv',
      },
    ],
    explanation:
      "This exercise catches the single most common deployment failure: a package imported in code but missing from requirements.txt, which works fine locally (since it's already installed in your environment) but breaks immediately on a fresh deployment machine that only installs what requirements.txt lists.",
    expectedOutput: "A requirements.txt file listing exactly the third-party packages your code actually imports — no more, no less.",
    learned: [
      "How to audit a project's actual dependencies from its import statements.",
      "Why 'works on my machine' can hide a missing requirements.txt entry.",
      "The standard-library vs. third-party distinction relevant to requirements.txt.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Compass is pushed to GitHub and deployed live on Streamlit Community Cloud, reachable by anyone with the URL.",
    why:
      "This is the actual finish line for 'deployment' — Compass stops being something only YOU can run, and becomes a real, shareable product.",
    fileLocation: 'compass-agent/ (repo root: app.py, compass_agent.py, requirements.txt, .gitignore)',
    code: [
      {
        language: 'text',
        filename: '.gitignore',
        code: '.streamlit/secrets.toml\n.env\nmemory.json\nrevisions.log\n__pycache__/\n*.pyc\nvenv/',
      },
      {
        language: 'bash',
        filename: 'push to GitHub',
        code:
          'git init\ngit add app.py compass_agent.py requirements.txt .gitignore\ngit commit -m "Compass: ready for deployment"\ngit branch -M main\ngit remote add origin https://github.com/your-username/compass-agent.git\ngit push -u origin main',
      },
      {
        language: 'text',
        filename: 'share.streamlit.io deployment steps',
        code:
          '1. Sign in to share.streamlit.io with GitHub\n2. Click "New app"\n3. Select the compass-agent repository and main branch\n4. Set "Main file path" to app.py\n5. Click "Advanced settings" -> "Secrets" -> paste OPENAI_API_KEY = "sk-..."\n6. Click "Deploy"',
      },
    ],
    placement: "Ensure app.py, compass_agent.py, requirements.txt, and .gitignore all exist at the repo root before pushing — Streamlit's deployment expects the main file at the path you specify relative to the repo root.",
    implementation:
      "The .gitignore explicitly excludes BOTH secrets (secrets.toml, .env) AND local runtime files that shouldn't ship with the deployed code (memory.json, revisions.log — each deployed session should start fresh, not inherit your personal local memory). The Advanced settings step is where the deployed app gets its own copy of OPENAI_API_KEY, entered directly through the web UI rather than any file — this is the deployed equivalent of the local secrets.toml from Lesson 27.",
    expectedResult:
      "After deploying, visiting https://your-app-name.streamlit.app in any browser (even one that's never touched your local machine) loads a fully working Compass chat interface — tools, memory reasoning, and planning all functioning exactly as they did locally.",
    connects:
      "Compass is now genuinely live. Lesson 29 adds real-world polish — handling rate limits and errors gracefully in front of actual strangers, plus a few UI refinements (sidebar settings, conversation export) that matter once real users are involved.",
  },

  quiz: [
    { id: 'c28q1', kind: 'concept', prompt: 'What three things does a repo need at minimum before deploying to Streamlit Community Cloud?', options: ['Only app.py', 'app.py, requirements.txt, and a proper .gitignore', 'A Dockerfile', 'A package.json'], answerIndex: 1, explanation: 'These are the essential pieces the platform needs to install dependencies and run the app.' },
    { id: 'c28q2', kind: 'application', prompt: 'What happens if a package is imported in code but missing from requirements.txt?', options: ['Nothing, it works fine', 'Deployment fails with a ModuleNotFoundError, since the platform only installs what’s listed', 'Streamlit installs it automatically anyway', 'It’s silently ignored'], answerIndex: 1, explanation: 'The deployment environment starts fresh and only has what requirements.txt specifies.' },
    { id: 'c28q3', kind: 'concept', prompt: 'How does Streamlit Community Cloud get the code to deploy?', options: ['A manual file upload', 'It deploys directly from a connected GitHub repository', 'Via FTP', 'Via a CLI push command'], answerIndex: 1, explanation: 'Unlike some platforms, Streamlit Community Cloud watches a connected GitHub repo rather than requiring a separate upload/build step.' },
    { id: 'c28q4', kind: 'debug', prompt: 'The deployed app crashes with a KeyError looking for OPENAI_API_KEY even though secrets.toml works locally. What’s the fix?', options: ['Nothing can be done', 'Add the secret through the deployed app’s Settings → Secrets panel — local secrets.toml doesn’t transfer automatically', 'Rewrite the whole app', 'Switch back to a .env file'], answerIndex: 1, explanation: 'Deployed secrets must be entered separately since the local file is git-ignored and never uploaded.' },
    { id: 'c28q5', kind: 'application', prompt: 'Why does the .gitignore exclude memory.json and revisions.log, not just secrets.toml?', options: ['No reason', 'These are local runtime files, not source code — each deployed session should start fresh, not inherit personal local data', 'They’re too large to upload', 'Streamlit forbids them'], answerIndex: 1, explanation: 'Shipping personal local runtime artifacts with the source code would be inappropriate and confusing for a fresh deployment.' },
    { id: 'c28q6', kind: 'output', prompt: 'What URL format does a deployed Streamlit Community Cloud app get?', options: ['A random IP address', 'something like your-app-name.streamlit.app', 'localhost:8501 (unchanged)', 'A .vercel.app domain'], answerIndex: 1, explanation: 'Streamlit Community Cloud apps are served under the streamlit.app domain.' },
    { id: 'c28q7', kind: 'concept', prompt: 'What happens when you push a new commit to the connected GitHub branch after deploying?', options: ['Nothing until you manually redeploy', 'The live app automatically redeploys with the new changes (continuous deployment)', 'The old deployment is permanently frozen', 'You must delete and recreate the app'], answerIndex: 1, explanation: 'Streamlit Community Cloud automatically redeploys on new pushes to the connected branch.' },
    { id: 'c28q8', kind: 'project', prompt: 'What does "Main file path" refer to during deployment configuration?', options: ['The requirements.txt location', 'The entry-point Python file Streamlit should run (app.py)', 'The .gitignore path', 'The secrets.toml path'], answerIndex: 1, explanation: 'This tells the platform which file is the actual Streamlit app to launch.' },
    { id: 'c28q9', kind: 'application', prompt: 'Why is auditing actual imports (mini-project) a useful step before writing requirements.txt?', options: ['It’s unnecessary busywork', 'It catches the common "works locally, fails on deploy" gap between what’s installed locally and what’s actually declared as a dependency', 'It has no real purpose', 'It replaces the need for a .gitignore'], answerIndex: 1, explanation: 'Local environments often have extra packages installed that aren’t actually declared, hiding this gap until deployment.' },
    { id: 'c28q10', kind: 'concept', prompt: 'What does Lesson 29 add once Compass is genuinely live?', options: ['Nothing further is needed', 'Real-world polish — rate limit/error handling and UI refinements for actual strangers using the app', 'A rewrite in a different language', 'Removing the chat interface'], answerIndex: 1, explanation: 'Lesson 29 focuses on production-readiness polish now that real users are in the picture.' },
  ],

  homework: {
    task: "Write a short README.md for the compass-agent repo covering what it is, setup instructions (clone, venv, pip install, secrets), and a link to the live deployed app.",
    requirements: [
      "Include a one-paragraph description of what Compass does.",
      "Include setup steps: git clone, python -m venv, pip install -r requirements.txt, configuring secrets.toml.",
      "Include the live app URL once deployed.",
    ],
    expectedOutcome: "A README.md that would let a stranger clone, set up, and run Compass locally (or just click through to the live version) without needing to ask you anything.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 27,
      hint: "Lesson 27 asked you to thread the on_step callback through plan_execute_and_recover() and answer_with_reflection() so their internal reporting also flows through the same mechanism.",
      steps: [
        "Add on_step=print as a default parameter to both function signatures.",
        "Replace every internal print(...) call inside them with on_step(...).",
        "Since route_and_answer() already calls these with on_step=on_step, no changes are needed there — just make sure the parameter is actually being passed through, not dropped.",
      ],
    },
  },
};
