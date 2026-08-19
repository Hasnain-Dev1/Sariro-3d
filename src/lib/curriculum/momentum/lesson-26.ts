import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 26 — Environment Variables & Secrets in Production
 * Module 5 (Deploy + Capstone) · Lesson 26 of 30
 */
export const lesson26: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 5,
  lessonIndex: 1,
  globalNumber: 26,
  name: 'Environment variables & secrets',
  title: 'Secrets in Production — Making Ask Momentum Work Live',
  subtitle: "Configure the API key on Vercel so Ask Momentum works on the real, public site.",

  concept: {
    durationMin: 15,
    summary:
      "Understand why local and production environments need SEPARATE secret configuration, how to set environment variables on Vercel, and how to verify they're working.",
    sections: [
      {
        heading: 'Local vs production — two separate worlds',
        body:
          "Your .env.local file only exists on YOUR computer — Vercel's servers have never seen it (and shouldn't, since it's gitignored). This is exactly why Ask Momentum breaks on the live site right now: process.env.ANTHROPIC_API_KEY is undefined on Vercel until you tell Vercel about it separately.",
      },
      {
        heading: 'Setting environment variables on Vercel',
        body:
          "In your Vercel project's dashboard: Settings → Environment Variables. Add a variable with the exact same name your code expects (ANTHROPIC_API_KEY) and paste in your real key as the value. Vercel lets you scope a variable to Production, Preview, and/or Development environments separately — usually you'll want it available in all three.",
      },
      {
        heading: 'Redeploying after adding a variable',
        body:
          "Environment variables are baked in at BUILD time for some values, and read at request time for server code like API routes. Either way, Vercel requires a fresh deployment after adding or changing a variable for it to take effect — simply pushing an empty commit, or clicking 'Redeploy' in the dashboard, applies it.",
        code: {
          language: 'bash',
          code:
            "git commit --allow-empty -m \"Trigger redeploy after adding env var\"\ngit push",
        },
      },
      {
        heading: 'Never expose a secret to the client',
        body:
          "This is worth repeating from Lesson 19: environment variables WITHOUT a special prefix stay server-only in Next.js — exactly what you want for ANTHROPIC_API_KEY. (Next.js has a separate NEXT_PUBLIC_ prefix for variables that ARE safe to expose to the browser, like a public analytics ID — never use that prefix for a secret key.)",
      },
      {
        heading: 'Verifying it actually works',
        body:
          "After redeploying, visit your live URL and test Ask Momentum for real. If it still fails, check Vercel's deployment logs (Project → Deployments → click the latest → 'Function Logs') for the actual server-side error — usually a missing/misnamed variable, or an invalid key.",
      },
    ],
    keyTerms: [
      { term: 'Production environment variable', definition: "A secret/config value set on the HOSTING PLATFORM (not just locally), needed for the live site to function." },
      { term: 'NEXT_PUBLIC_ prefix', definition: "A special Next.js prefix marking a variable as safe to expose to the browser — never used for secrets." },
      { term: 'Redeploy', definition: "Triggering a new build/deployment, required after changing environment variables for them to apply." },
      { term: 'Deployment logs', definition: "Vercel's record of a build/runtime, useful for diagnosing why something failed in production." },
    ],
    commonMistakes: [
      "Assuming .env.local automatically applies to the deployed site — it never does; it's local-only by design.",
      "Misspelling the variable name on Vercel differently from what the code reads (process.env.ANTHROPIC_API_KEY must match exactly).",
      "Forgetting to redeploy after adding/changing a variable, so the live site still runs the old, broken version.",
      "Accidentally prefixing a secret with NEXT_PUBLIC_, exposing it to every visitor's browser.",
      "Not checking deployment/function logs when something fails, guessing instead of reading the actual error.",
    ],
    takeaways: [
      "Local and production environments need environment variables configured SEPARATELY.",
      "Set secrets in Vercel's Settings → Environment Variables, matching the exact name your code uses.",
      "A redeploy is required after adding/changing a variable.",
      "Never use NEXT_PUBLIC_ for a secret — it exposes it to the browser.",
      "Deployment/function logs are the fastest way to diagnose a production-only failure.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'A visible (safe) environment check',
    objective:
      "Practise the difference between a public and private environment variable by building a tiny status endpoint — safely, without ever exposing a real secret.",
    instructions: [
      "Add a harmless variable to .env.local, e.g. NEXT_PUBLIC_APP_NAME=Momentum.",
      "Create app/api/status/route.ts that returns whether ANTHROPIC_API_KEY is SET (true/false), never its actual value.",
      "Fetch it from a page and display 'AI configured: yes/no'.",
    ],
    code: [
      {
        language: 'typescript',
        filename: 'app/api/status/route.ts',
        code:
          "import { NextResponse } from 'next/server';\n\nexport async function GET() {\n  return NextResponse.json({\n    aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY),\n    appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Unknown',\n  });\n}",
      },
      {
        language: 'tsx',
        filename: 'components/StatusCheck.tsx',
        code:
          "'use client';\nimport { useEffect, useState } from 'react';\n\nexport function StatusCheck() {\n  const [status, setStatus] = useState<{ aiConfigured: boolean; appName: string } | null>(null);\n\n  useEffect(() => {\n    fetch('/api/status').then((r) => r.json()).then(setStatus);\n  }, []);\n\n  if (!status) return <p>Checking…</p>;\n  return <p>{status.appName} — AI configured: {status.aiConfigured ? 'yes' : 'no'}</p>;\n}",
      },
    ],
    explanation:
      "The status route deliberately NEVER returns the actual key value — only Boolean(process.env.ANTHROPIC_API_KEY), a safe true/false. This is a genuinely useful debugging pattern: you can check WHETHER a secret is configured on a given environment without ever exposing it, which is exactly how you'd verify Vercel's setup without pasting your real key anywhere risky. appName demonstrates the OTHER kind of variable — a NEXT_PUBLIC_ one meant to be visible — showing both patterns side by side.",
    expectedOutput:
      "Locally (with .env.local set): 'Momentum — AI configured: yes'. On a fresh Vercel deploy BEFORE adding the key: 'Momentum — AI configured: no' (or 'Unknown' for appName if that wasn't set either) — a clean, safe way to confirm what's actually configured where.",
    learned: [
      "How to safely check whether a secret is configured, without exposing it.",
      "The practical difference between a private and NEXT_PUBLIC_ variable.",
      "How to debug environment configuration issues methodically.",
      "Why checking configuration status is safer than logging real values.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Ask Momentum works on the live, public Momentum site — the API key is properly configured in production.",
    why:
      "This closes the gap from Lesson 25: Momentum was deployed, but its AI feature was broken because the secret only existed locally. This lesson makes the LIVE site fully functional, not just the local one.",
    fileLocation: "Vercel dashboard (Settings → Environment Variables) — no code changes needed",
    code: [
      {
        language: 'text',
        filename: 'Vercel dashboard steps',
        code:
          "1. Open your project on vercel.com.\n2. Go to Settings → Environment Variables.\n3. Add: Name = ANTHROPIC_API_KEY, Value = your real key.\n4. Check all three environments (Production, Preview, Development) unless you have a reason not to.\n5. Click Save.\n6. Go to Deployments, click the ⋯ menu on the latest deployment, click \"Redeploy\"\n   (or push an empty commit to trigger a fresh build).\n7. Once the new deployment finishes, visit your live URL and test Ask Momentum for real.",
      },
      {
        language: 'bash',
        filename: 'Alternative: trigger via git',
        code:
          "git commit --allow-empty -m \"Redeploy: add ANTHROPIC_API_KEY\"\ngit push",
      },
    ],
    placement:
      "This is a dashboard configuration step, not a code change — follow the Vercel steps exactly as listed, using the SAME variable name (ANTHROPIC_API_KEY) your app/api/coach/route.ts already reads from process.env.",
    implementation:
      "Once saved, Vercel injects ANTHROPIC_API_KEY into the server environment for every future build/request — but only future ones, which is why a redeploy is required. The variable is scoped to server-side code by default (no NEXT_PUBLIC_ prefix), so it's available inside your API route exactly as it was locally, and NEVER sent to the browser. This single dashboard change is what finally makes the live Ask Momentum feature fully operational, completing the deployment from Lesson 25.",
    expectedResult:
      "Visiting your live Vercel URL and asking Ask Momentum a real question now works exactly as it did locally — a genuine, streaming, context-aware AI reply, live on the public internet.",
    connects:
      "Momentum is now fully live and fully functional — the app AND its AI feature. Lesson 27 sets up a custom domain so the URL looks as professional as the product now is.",
  },

  quiz: [
    { id: 'l26q1', kind: 'concept', prompt: 'Why does Ask Momentum work locally but fail on the freshly deployed Vercel site?', options: ['Vercel doesn’t support AI', 'The API key only exists in .env.local, which was never pushed and isn’t known to Vercel', 'The code has a bug', 'Streaming is disabled on Vercel'], answerIndex: 1, explanation: ".env.local is local-only (and gitignored); Vercel needs the same variable configured separately in its own settings." },
    { id: 'l26q2', kind: 'application', prompt: 'Where do you add a production environment variable on Vercel?', options: ['In .env.local only', 'Project Settings → Environment Variables', 'In package.json', 'In the README'], answerIndex: 1, explanation: "Vercel's dashboard has a dedicated Environment Variables section per project." },
    { id: 'l26q3', kind: 'concept', prompt: 'What must happen after adding/changing an environment variable on Vercel?', options: ['Nothing, it applies instantly', 'A redeploy is required for it to take effect', 'You must delete the project', 'You must change the variable name'], answerIndex: 1, explanation: "New or changed variables only apply to a NEW deployment, not the currently-running one." },
    { id: 'l26q4', kind: 'debug', prompt: 'A student named the Vercel variable API_KEY but the code reads process.env.ANTHROPIC_API_KEY. What happens?', options: ['It works fine, names don’t matter', 'process.env.ANTHROPIC_API_KEY is undefined, since the names must match exactly', 'Vercel auto-corrects it', 'The build fails immediately'], answerIndex: 1, explanation: "Environment variable names must match EXACTLY between where they're set and where they're read." },
    { id: 'l26q5', kind: 'concept', prompt: 'What does the NEXT_PUBLIC_ prefix mean for a variable?', options: ['It’s encrypted extra securely', 'It’s exposed to the browser — never use it for secrets', 'It only works in development', 'It’s required for all variables'], answerIndex: 1, explanation: "NEXT_PUBLIC_ variables are bundled into client-side code and visible to anyone — the opposite of what a secret needs." },
    { id: 'l26q6', kind: 'application', prompt: 'How can you safely check whether a secret is configured without exposing its value?', options: ['console.log the actual key', 'Return Boolean(process.env.KEY) from an API route, never the real value', 'Paste it into a public page', 'There’s no safe way'], answerIndex: 1, explanation: "A boolean 'is it set' check confirms configuration without ever revealing the secret itself." },
    { id: 'l26q7', kind: 'debug', prompt: 'Ask Momentum still fails after adding the key on Vercel. Best next debugging step?', options: ['Give up and remove the feature', 'Check Vercel’s deployment/function logs for the actual server error', 'Change the frontend code randomly', 'Assume the API is down'], answerIndex: 1, explanation: "The logs reveal the real error (wrong name, invalid key, etc.) instead of guessing." },
    { id: 'l26q8', kind: 'application', prompt: 'Which environments should ANTHROPIC_API_KEY typically be set for?', options: ['Production only, nowhere else', 'Usually Production, Preview, AND Development, unless you have a specific reason not to', 'It’s automatic, no choice needed', 'Only Preview'], answerIndex: 1, explanation: "Enabling it across all relevant environments ensures the feature works consistently everywhere it's tested." },
    { id: 'l26q9', kind: 'project', prompt: "Why didn't Momentum's code need to change at all in this lesson's final project?", options: ['The code was already broken', 'The route already correctly reads process.env.ANTHROPIC_API_KEY — only the hosting configuration was missing', 'Vercel rewrites your code automatically', 'It’s a coincidence'], answerIndex: 1, explanation: "The code was correct from Lesson 19 onward; this lesson fixed the missing PLATFORM configuration, not a code bug." },
    { id: 'l26q10', kind: 'concept', prompt: 'What is the safest way to trigger a redeploy after an environment variable change, without a code change to make?', options: ['Delete and recreate the whole project', 'Click "Redeploy" in the Vercel dashboard, or push an empty commit', 'Wait a week for it to apply automatically', 'It’s not possible without a code change'], answerIndex: 1, explanation: "Both the dashboard Redeploy action and an empty commit trigger a fresh build without altering any actual code." },
  ],

  homework: {
    task:
      "Add a second, harmless environment variable — NEXT_PUBLIC_APP_VERSION — set locally AND on Vercel, and display it somewhere subtle on the page (e.g. the footer), confirming you understand configuring BOTH environments end-to-end.",
    requirements: [
      "Add NEXT_PUBLIC_APP_VERSION=1.0.0 to .env.local.",
      "Add the SAME variable (same name, same or different value) on Vercel and redeploy.",
      "Render it in the footer, e.g. 'Momentum v1.0.0'.",
      "Confirm it shows correctly both locally and on the live site.",
    ],
    expectedOutcome:
      "The footer shows a version number, sourced from an environment variable, correctly displayed both on localhost and the live Vercel URL.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 25,
      hint: "Lesson 25 asked you to add a README.md describing Momentum, its tech stack, and a link to the live Vercel URL.",
      steps: [
        "Create README.md at the project root (if it doesn't already exist from create-next-app, or replace the default one).",
        "Write a short description of Momentum, a bullet list of the tech stack, and a 'Live demo' link once you have a Vercel URL.",
        "git add README.md, commit, and push so it appears on your GitHub repo page.",
      ],
      codeGuidance: [
        {
          language: 'text',
          filename: 'README.md',
          code:
            "# Momentum\n\nAn AI-powered habit tracker built with Next.js, React, TypeScript, Tailwind CSS, and the Claude API.\n\n## Live demo\nhttps://momentum-app-yourname.vercel.app\n\n## Tech stack\n- Next.js (App Router)\n- React + TypeScript\n- Tailwind CSS\n- Claude API (Anthropic) — Ask Momentum, an AI coach",
        },
      ],
    },
  },
};
