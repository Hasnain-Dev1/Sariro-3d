import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 25 — Deploying to Vercel
 * Module 5 (Deploy + Capstone) · Lesson 25 of 30
 */
export const lesson25: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 5,
  lessonIndex: 0,
  globalNumber: 25,
  name: 'Deploying to Vercel',
  title: 'Going Live — Deploying Momentum to Vercel',
  subtitle: "Push Momentum to GitHub and ship it to a real, public URL.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what deployment actually means, how Git and GitHub connect your code to a hosting platform, and how Vercel builds and serves a Next.js app automatically.",
    sections: [
      {
        heading: 'What does "deploying" actually mean?',
        body:
          "Right now, Momentum only exists on YOUR computer, reachable at localhost:3000 — nobody else can visit it. Deploying means taking your code, building a production version of it, and putting that build on a server the whole internet can reach at a real URL. This is the moment a project becomes a real, shareable thing.",
      },
      {
        heading: 'Git and GitHub — the bridge to deployment',
        body:
          "Git tracks changes to your code over time; GitHub hosts a copy of that history online. Modern hosting platforms (like Vercel) connect DIRECTLY to a GitHub repository: every time you push new code, the platform notices and automatically rebuilds and redeploys your site. If you haven't already, this lesson assumes your project is a Git repo pushed to GitHub.",
        code: {
          language: 'bash',
          code:
            "git init\ngit add .\ngit commit -m \"Momentum: initial commit\"\n# create a repo on github.com, then:\ngit remote add origin https://github.com/your-username/momentum-app.git\ngit push -u origin main",
        },
      },
      {
        heading: 'Why Vercel for a Next.js app?',
        body:
          "Vercel is made by the same team that builds Next.js, so it understands the framework's App Router, API routes, and Server Components natively — you don't configure anything special. You sign in with GitHub, 'Import' your repository, and Vercel detects it's a Next.js project automatically.",
      },
      {
        heading: 'The build process',
        body:
          "When you deploy, Vercel runs npm run build — this is Next.js compiling and optimising your entire app (every page, every component) into a fast, production-ready form. This is different from npm run dev, which is only for local development and isn't optimised. A successful deployment means this build completed with no errors.",
      },
      {
        heading: 'Preview vs Production deployments',
        body:
          "Vercel deploys the main branch as your PRODUCTION site (the real, public URL). Every OTHER branch or pull request also gets its own temporary PREVIEW URL — a full working copy you can share and test before merging. This lets you validate a change safely before it goes live to real visitors.",
      },
    ],
    keyTerms: [
      { term: 'Deployment', definition: "Taking your code, building it for production, and hosting it at a public URL." },
      { term: 'Git', definition: "A version control system that tracks changes to your code over time." },
      { term: 'GitHub', definition: "A platform hosting Git repositories online, connected to deployment platforms like Vercel." },
      { term: 'Vercel', definition: "A hosting platform built by the Next.js team, optimised for deploying Next.js apps automatically." },
      { term: 'Production build', definition: "The optimised, compiled version of your app created by npm run build, used for the live site." },
      { term: 'Preview deployment', definition: "A temporary, shareable URL Vercel creates for a branch or pull request, separate from production." },
    ],
    commonMistakes: [
      "Trying to deploy without pushing to GitHub first — most hosting platforms need a connected repository.",
      "Committing .env.local (with your real API key) to a PUBLIC GitHub repo — always confirm it's in .gitignore.",
      "Assuming npm run dev works locally means the PRODUCTION build (npm run build) will also succeed without testing it.",
      "Forgetting that environment variables set locally in .env.local don't automatically exist on the hosting platform — they must be added there separately (next lesson).",
      "Not checking the deployment logs when a build fails, missing the actual error message that explains why.",
    ],
    takeaways: [
      "Deployment turns a local project into a real, publicly reachable site.",
      "Git + GitHub is the standard bridge between your code and modern hosting platforms.",
      "Vercel is purpose-built for Next.js and requires almost no configuration.",
      "npm run build creates the optimised production version deployed to users.",
      "Every branch/PR can get its own preview URL, separate from the live production site.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Test your production build locally first',
    objective:
      "Practise running and inspecting a real production build BEFORE deploying, catching issues early — a habit every professional developer relies on.",
    instructions: [
      "In your momentum-app project, run npm run build.",
      "Read the build output — note the list of routes and any warnings.",
      "Run npm run start to serve the PRODUCTION build locally (different from npm run dev).",
      "Visit localhost:3000 and confirm the app works identically to dev mode.",
    ],
    code: [
      {
        language: 'bash',
        code:
          "npm run build\n# ✓ Compiled successfully\n# Route (app)                    Size\n# ┌ ○ /                          ...\n# └ ƒ /api/coach                 ...\n\nnpm run start\n# Serves the OPTIMISED build at localhost:3000 (not the dev server)",
      },
    ],
    explanation:
      "npm run build is the exact same command Vercel runs during deployment — running it locally first means you catch any build-time errors (like a TypeScript mistake that dev mode tolerated) on your own machine, with full terminal output, rather than discovering it in a remote deployment log. The output lists every route your app has and whether it's static (○) or a server function (ƒ) — API routes like /api/coach are always dynamic. npm run start then serves that SAME optimised build the way a real visitor would experience it, letting you sanity-check the production version before it's public.",
    expectedOutput:
      "The terminal shows '✓ Compiled successfully' and a table of routes. Visiting localhost:3000 after npm run start shows Momentum working exactly as it did in dev mode.",
    learned: [
      "The difference between npm run dev and npm run build + npm run start.",
      "How to read a Next.js build output.",
      "Why testing the production build locally catches issues early.",
      "That API routes always run as server functions, not static pages.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum pushed to GitHub and deployed live on Vercel — a real, public URL anyone can visit.",
    why:
      "This is the moment Momentum stops being a local project and becomes something real: shareable with friends, family, and — eventually — an interviewer looking at your portfolio.",
    fileLocation: "momentum-app/ (whole project) → GitHub → Vercel",
    code: [
      {
        language: 'bash',
        filename: 'Terminal — push to GitHub',
        code:
          "cd momentum-app\n\n# Confirm .env.local is ignored (never commit real secrets)\ncat .gitignore | grep env\n\ngit init\ngit add .\ngit commit -m \"Momentum: complete Modules 1-4\"\n\n# Create an EMPTY repo on github.com named momentum-app, then:\ngit remote add origin https://github.com/your-username/momentum-app.git\ngit branch -M main\ngit push -u origin main",
      },
      {
        language: 'text',
        filename: 'Vercel dashboard steps',
        code:
          "1. Go to vercel.com and sign in with your GitHub account.\n2. Click \"Add New… → Project\".\n3. Select your momentum-app repository and click \"Import\".\n4. Vercel auto-detects Next.js — leave the default build settings.\n5. Click \"Deploy\" (we'll add the API key in Lesson 26 before this fully works).\n6. Once it finishes, Vercel gives you a live URL like momentum-app-yourname.vercel.app.",
      },
    ],
    placement:
      "Run the Git commands in your project's terminal, in order. Create the empty GitHub repository FIRST (via github.com's \"New repository\" button) before running git remote add. Then follow the Vercel dashboard steps to import and deploy.",
    implementation:
      "git init starts tracking your project's history; git add . stages every file (EXCEPT what .gitignore excludes, which already protects .env.local by default from create-next-app); the commit saves a snapshot. Pushing sends that history to your new GitHub repository. Vercel's import step reads your repo, detects the Next.js framework automatically (no configuration needed), and its deploy button triggers exactly the npm run build process from the mini-project — but on Vercel's servers, publishing the result to a real URL. Note: Ask Momentum won't fully work yet on this first deploy, since the ANTHROPIC_API_KEY only exists in your LOCAL .env.local — Lesson 26 fixes that.",
    expectedResult:
      "A real, public URL (something like momentum-app-yourname.vercel.app) where Momentum's habit tracker, UI, and branding all work perfectly — visible to anyone, anywhere, not just on your machine.",
    connects:
      "Momentum is live, but Ask Momentum will show an error until its secret key exists on Vercel too. Lesson 26 sets up environment variables and secrets properly in production, completing the deployment.",
  },

  quiz: [
    { id: 'l25q1', kind: 'concept', prompt: 'What does "deploying" a project mean?', options: ['Deleting old code', 'Building your code for production and hosting it at a public URL', 'Writing more tests', 'Renaming files'], answerIndex: 1, explanation: "Deployment publishes a built version of your app somewhere the public internet can reach." },
    { id: 'l25q2', kind: 'concept', prompt: 'Why does Vercel work especially well for Next.js apps?', options: ['It’s the only host that supports JavaScript', 'It’s built by the Next.js team and understands the framework natively', 'It’s free forever with no limits', 'It doesn’t require Git'], answerIndex: 1, explanation: "Vercel is built specifically to support Next.js features like the App Router and API routes with zero config." },
    { id: 'l25q3', kind: 'application', prompt: 'Which command creates the optimised PRODUCTION version of a Next.js app?', options: ['npm run dev', 'npm run build', 'npm install', 'npm run lint'], answerIndex: 1, explanation: "npm run build compiles and optimises the app; dev mode is unoptimised, for local development only." },
    { id: 'l25q4', kind: 'debug', prompt: 'A student’s deployment fails on Vercel but npm run dev worked fine locally. Best next step?', options: ['Assume Vercel is broken', 'Run npm run build locally to reproduce and see the real error', 'Delete the project', 'Switch frameworks'], answerIndex: 1, explanation: "The production build is what Vercel actually runs — reproducing it locally surfaces the same error with full detail." },
    { id: 'l25q5', kind: 'concept', prompt: 'What must exist BEFORE you can import a project into Vercel?', options: ['Nothing, Vercel works with local files directly', 'A GitHub (or similar) repository with the code pushed to it', 'A paid Vercel plan', 'A custom domain'], answerIndex: 1, explanation: "Vercel deploys from a connected Git repository, so the code must be pushed to GitHub (or similar) first." },
    { id: 'l25q6', kind: 'application', prompt: 'What is a preview deployment?', options: ['The same as production, no difference', 'A temporary URL for a branch/PR, separate from the live production site', 'A local-only feature', 'A deprecated Vercel feature'], answerIndex: 1, explanation: "Preview deployments let you test a branch's changes on a real URL before merging to production." },
    { id: 'l25q7', kind: 'debug', prompt: 'A repository accidentally includes .env.local with a real API key, made public on GitHub. What should happen?', options: ['Nothing, just delete the file going forward', 'Consider the key compromised and rotate/revoke it immediately, in addition to removing the file', 'Rename the file only', 'Make the repo private and stop there'], answerIndex: 1, explanation: "Once a secret has been pushed publicly, it may already be exposed (even cached) — the safe response is to revoke and issue a new key." },
    { id: 'l25q8', kind: 'output', prompt: 'In a Next.js build output, what does the ƒ symbol typically indicate next to a route?', options: ['A static page', 'A dynamic/server-rendered route (like an API route)', 'A build error', 'A missing file'], answerIndex: 1, explanation: "ƒ marks routes that run as server functions (dynamic), as opposed to ○ for statically generated pages." },
    { id: 'l25q9', kind: 'project', prompt: 'Why won’t Ask Momentum fully work on the very first Vercel deployment in this lesson?', options: ['Vercel doesn’t support AI features', 'The ANTHROPIC_API_KEY only exists in the local .env.local file, not on Vercel yet', 'The code has a bug', 'Streaming doesn’t work in production'], answerIndex: 1, explanation: "Environment variables set locally aren't automatically available on the hosting platform — they must be configured there separately." },
    { id: 'l25q10', kind: 'concept', prompt: 'What triggers a new deployment on Vercel once a project is connected to GitHub?', options: ['Nothing, you must manually click deploy every time', 'Pushing new commits to the connected branch', 'Restarting your computer', 'Opening the Vercel dashboard'], answerIndex: 1, explanation: "Vercel watches the connected repository and automatically builds/deploys whenever new commits are pushed." },
  ],

  homework: {
    task:
      "Add a simple README.md to your project root describing what Momentum is, its tech stack, and a link to the live Vercel URL — the start of your portfolio documentation.",
    requirements: [
      "Include a short project description (what Momentum does).",
      "List the tech stack (Next.js, React, TypeScript, Tailwind, Claude API).",
      "Include the live Vercel URL once you have one.",
      "Commit and push this file so it shows up on your GitHub repo's homepage.",
    ],
    expectedOutcome:
      "Visiting your GitHub repository shows a clear, professional README describing Momentum — the first thing anyone (including a recruiter) would see.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 24,
      hint: "Lesson 24 asked you to build a small animated TypingDots indicator shown while Ask Momentum is thinking, replacing any plain-text loading message.",
      steps: [
        "Create a TypingDots component: three small spans, each with a CSS animation-delay so they pulse in sequence.",
        "Show it when loading is true and the last message (if it's the assistant placeholder) is still empty.",
        "Use Tailwind's animate-bounce or a small custom @keyframes rule for the pulse effect.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/TypingDots.tsx',
          code:
            "export function TypingDots() {\n  return (\n    <div className=\"flex gap-1 p-3\">\n      <span className=\"w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]\" />\n      <span className=\"w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]\" />\n      <span className=\"w-2 h-2 rounded-full bg-brand animate-bounce\" />\n    </div>\n  );\n}",
        },
      ],
    },
  },
};
