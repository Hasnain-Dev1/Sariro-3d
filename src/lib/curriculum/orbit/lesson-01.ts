import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Orbit · Lesson 1 — Project Setup & the App Router
 * Module 1 (Foundation & the Shell) · Lesson 1 of 30
 */
export const lesson01: StructuredLesson = {
  courseId: 'web-201',
  moduleNum: 1,
  lessonIndex: 0,
  globalNumber: 1,
  name: 'Project setup & the App Router',
  title: 'Setting Up Orbit with Next.js & the App Router',
  subtitle: "Scaffold the project and build the shell every Orbit screen will live inside.",

  /* ─────────────────────────── CONCEPT (15 min) ─────────────────────────── */
  concept: {
    durationMin: 15,
    summary:
      "Understand what Next.js and the App Router are, how the app/ folder maps URLs to UI, and why components render on the server by default.",
    sections: [
      {
        heading: 'What is Next.js, and why build Orbit on it?',
        body:
          "Next.js is a framework built on top of React. React alone gives you components; Next.js adds the things every real product needs: routing (turning URLs into pages), rendering on the server for speed and SEO, a build system, and a place to run backend code. Orbit is a real SaaS — it needs pages, a database, auth, and APIs — so a framework saves us from wiring all of that by hand.\n\nWe use the App Router, the modern Next.js routing system based on a folder called app/. Every route in Orbit — the dashboard, a project board, the billing page — will be a folder inside app/.",
      },
      {
        heading: 'The app/ folder is your routing map',
        body:
          "In the App Router, folders are URLs and special files are the UI for those URLs. You don't configure routes anywhere — the file system IS the config.\n\n• app/page.tsx → the site's home page (/)\n• app/dashboard/page.tsx → /dashboard\n• app/w/[wid]/page.tsx → /w/<any-id> (a dynamic route)\n\nTwo files do most of the work: page.tsx (the unique UI of a route) and layout.tsx (shared UI that wraps a page and everything nested under it — like a sidebar that stays put while the page inside changes).",
        code: {
          language: 'text',
          filename: 'app/ structure',
          code:
            "app/\n  layout.tsx      # wraps EVERY page (html, body, fonts)\n  page.tsx        # the home page  ->  /\n  dashboard/\n    page.tsx      # ->  /dashboard",
        },
      },
      {
        heading: 'Server Components by default',
        body:
          "This is the biggest mental shift from plain React. In the App Router, every component is a Server Component unless you say otherwise. Server Components run on the server, never ship their code to the browser, and can talk directly to a database — perfect for fetching Orbit's data.\n\nWhen you need interactivity (clicks, state, useEffect), you opt a component into the browser by adding the string \"use client\" at the very top of the file. We'll lean on this split constantly: the page shell is a Server Component; the interactive board is a Client Component. (That's Lesson 2.)",
        code: {
          language: 'tsx',
          filename: 'app/page.tsx',
          code:
            "// No \"use client\" here -> this is a Server Component.\nexport default function Home() {\n  return <h1>Welcome to Orbit</h1>;\n}",
        },
      },
      {
        heading: 'Running the project',
        body:
          "You create a Next.js app with create-next-app, choosing TypeScript and Tailwind CSS. npm run dev starts a development server (default http://localhost:3000) with hot reload — save a file and the browser updates instantly. Tailwind is a utility-CSS system: instead of writing CSS files, you compose classes like flex, gap-4, and text-cyan-600 right in the markup. Orbit's entire look is built from Tailwind utilities plus a small set of brand tokens.",
        code: {
          language: 'bash',
          code:
            "npx create-next-app@latest orbit --typescript --tailwind --app --eslint\ncd orbit\nnpm run dev   # open http://localhost:3000",
        },
      },
    ],
    keyTerms: [
      { term: 'App Router', definition: "Next.js routing system where folders in app/ become URLs and files like page.tsx/layout.tsx become the UI." },
      { term: 'page.tsx', definition: "The unique UI for a route. app/billing/page.tsx renders at /billing." },
      { term: 'layout.tsx', definition: "Shared UI that wraps a page and all nested routes; it does not re-render when you navigate between children." },
      { term: 'Server Component', definition: "A component that runs on the server, ships no JS to the browser, and can fetch data directly. The default in the App Router." },
      { term: 'Client Component', definition: "A component marked with \"use client\" that runs in the browser and can use state, effects, and event handlers." },
      { term: 'Tailwind CSS', definition: "A utility-first CSS framework; you style by composing classes (e.g. p-4, rounded-lg) instead of writing separate CSS." },
    ],
    commonMistakes: [
      "Adding \"use client\" to everything out of habit — it ships extra JS and blocks direct data fetching. Keep components on the server unless they need interactivity.",
      "Forgetting that layout.tsx must render {children}; if you omit it, nested pages disappear.",
      "Naming the route file something other than page.tsx (e.g. index.tsx). The App Router only renders page.tsx.",
      "Putting \"use client\" anywhere but the first line of the file — it must be the very first statement.",
    ],
    takeaways: [
      "Folders in app/ are routes; page.tsx is the page, layout.tsx is the shared wrapper.",
      "Components are Server Components by default; add \"use client\" only when you need interactivity.",
      "layout.tsx must render {children} — that's where the page slots in.",
      "npm run dev gives you a hot-reloading local server at localhost:3000.",
    ],
  },

  /* ─────────────────────────── MINI PROJECT (15 min) ─────────────────────────── */
  miniProject: {
    durationMin: 15,
    title: 'A two-page site with a shared layout',
    objective:
      "Prove you understand routing and layouts by building a tiny site where a shared header stays fixed while the page content changes between two routes.",
    instructions: [
      "In a fresh Next.js app, replace app/layout.tsx with the version below (a shared header + {children}).",
      "Replace app/page.tsx with the Home page.",
      "Create app/about/page.tsx for a second route.",
      "Run npm run dev and click between Home and About — notice the header never reloads.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'app/layout.tsx',
        code:
          "import Link from 'next/link';\nimport './globals.css';\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body>\n        <header style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #e2e8f0' }}>\n          <strong>MiniSite</strong>\n          <Link href=\"/\">Home</Link>\n          <Link href=\"/about\">About</Link>\n        </header>\n        <main style={{ padding: 24 }}>{children}</main>\n      </body>\n    </html>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'app/page.tsx',
        code:
          "export default function Home() {\n  return <h1>Home page</h1>;\n}",
      },
      {
        language: 'tsx',
        filename: 'app/about/page.tsx',
        code:
          "export default function About() {\n  return <h1>About page</h1>;\n}",
      },
    ],
    explanation:
      "RootLayout receives children — whatever page matches the current URL — and renders it inside <main>. Because the header lives in the layout, not the page, it is rendered once and persists across navigations; only {children} swaps. next/link's <Link> does a client-side navigation (no full page reload), which is why the header doesn't flash. The about/ folder with a page.tsx automatically creates the /about route — no router config needed.",
    expectedOutput:
      "A page with a persistent 'MiniSite | Home | About' header. Clicking About changes the heading to 'About page' and the URL to /about, while the header stays perfectly still.",
    learned: [
      "How folders become routes (app/about/ → /about).",
      "How a layout wraps pages via {children}.",
      "Why <Link> navigation is instant (no full reload).",
      "The difference between per-page UI (page.tsx) and shared UI (layout.tsx).",
    ],
  },

  /* ─────────────────────────── FINAL PROJECT (30 min) ─────────────────────────── */
  finalProject: {
    durationMin: 30,
    feature: "Orbit's application shell — the root layout with a sidebar and top bar that every workspace screen renders inside.",
    why:
      "Every screen we build for the next 29 lessons — the board, members, billing, Ask Orbit — lives inside the same frame: a left sidebar for navigation and a top bar for context. Building the shell first means every future feature has a home the moment we create it, and the app looks like a real product from day one.",
    fileLocation: "app/globals.css, app/layout.tsx, components/shell/Sidebar.tsx, components/shell/Topbar.tsx",
    code: [
      {
        language: 'css',
        filename: 'app/globals.css (add Orbit tokens)',
        code:
          "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Orbit brand tokens — Sariro Web track = cyan */\n:root {\n  --accent: #06b6d4;        /* cyan-500 */\n  --accent-ink: #0e7490;    /* cyan-700 */\n  --accent-soft: #e4f6fa;\n  --ink: #0a1626;\n  --muted: #5e7186;\n  --border: #e2e8f0;\n}",
      },
      {
        language: 'tsx',
        filename: 'components/shell/Sidebar.tsx',
        code:
          "import Link from 'next/link';\nimport { LayoutGrid, Users, CreditCard, Settings, Sparkles } from 'lucide-react';\n\nconst NAV = [\n  { href: '/w/demo', label: 'Board', icon: LayoutGrid },\n  { href: '/w/demo/members', label: 'Members', icon: Users },\n  { href: '/w/demo/ask', label: 'Ask Orbit', icon: Sparkles },\n  { href: '/w/demo/billing', label: 'Billing', icon: CreditCard },\n  { href: '/w/demo/settings', label: 'Settings', icon: Settings },\n];\n\nexport function Sidebar() {\n  return (\n    <aside className=\"w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col\">\n      <div className=\"flex items-center gap-2 px-4 h-14 border-b border-slate-100\">\n        <span className=\"w-6 h-6 rounded-full bg-cyan-500\" />\n        <strong className=\"font-extrabold tracking-tight\">Orbit</strong>\n      </div>\n      <nav className=\"p-2 flex flex-col gap-0.5\">\n        {NAV.map(({ href, label, icon: Icon }) => (\n          <Link key={href} href={href}\n            className=\"flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-cyan-50 hover:text-cyan-700\">\n            <Icon className=\"w-4 h-4\" /> {label}\n          </Link>\n        ))}\n      </nav>\n    </aside>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'components/shell/Topbar.tsx',
        code:
          "export function Topbar() {\n  return (\n    <header className=\"h-14 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center px-5\">\n      <h1 className=\"text-sm font-bold text-slate-800\">Demo Workspace</h1>\n      <div className=\"ml-auto w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 grid place-items-center text-xs font-bold\">\n        DK\n      </div>\n    </header>\n  );\n}",
      },
      {
        language: 'tsx',
        filename: 'app/layout.tsx',
        code:
          "import './globals.css';\nimport { Sidebar } from '@/components/shell/Sidebar';\nimport { Topbar } from '@/components/shell/Topbar';\n\nexport const metadata = { title: 'Orbit', description: 'Team collaboration, in orbit.' };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body className=\"bg-slate-50 text-slate-900\">\n        <div className=\"flex min-h-screen\">\n          <Sidebar />\n          <div className=\"flex-1 flex flex-col min-w-0\">\n            <Topbar />\n            <main className=\"flex-1 p-6\">{children}</main>\n          </div>\n        </div>\n      </body>\n    </html>\n  );\n}",
      },
    ],
    placement:
      "1) Paste the tokens into your existing app/globals.css (keep the three @tailwind lines at the top). 2) Create a components/shell/ folder and add Sidebar.tsx and Topbar.tsx. 3) Replace app/layout.tsx with the version above. 4) Install icons with `npm i lucide-react`. 5) Put a simple placeholder in app/page.tsx (e.g. <h2>Board coming in Lesson 16</h2>) so there's something in the main area.",
    implementation:
      "The RootLayout is a Server Component (no \"use client\"), so it renders on the server and ships almost no JavaScript — ideal for a static frame. It lays out a flex row: a fixed-width Sidebar plus a flexible column holding the Topbar and the {children} main area. Sidebar and Topbar are also Server Components — they're pure markup for now, which keeps the shell fast. The NAV array drives the sidebar links so adding a screen later is a one-line change. Every future page.tsx we create automatically renders inside this frame because it flows into {children}.",
    expectedResult:
      "Visiting localhost:3000 shows a real product frame: an 'Orbit' sidebar with Board/Members/Ask Orbit/Billing/Settings links, a top bar reading 'Demo Workspace' with an avatar, and your placeholder in the content area. Hovering a nav item tints it cyan.",
    connects:
      "This is the canvas for the whole course. Lesson 2 turns the workspace switcher into a Server-vs-Client split; Lesson 3 makes /w/[wid] a real dynamic route so the sidebar links resolve to actual workspaces; and from Lesson 16 the main area fills with the live task board.",
  },

  /* ─────────────────────────── QUIZ (10 Q) ─────────────────────────── */
  quiz: [
    {
      id: 'l1q1', kind: 'concept',
      prompt: 'In the App Router, what makes a folder in app/ become a visitable URL?',
      options: [
        'Adding a route to a routes.config.ts file',
        'Placing a page.tsx file inside the folder',
        'Exporting a const named route',
        'Importing the folder in layout.tsx',
      ],
      answerIndex: 1,
      explanation: "A folder becomes a route only when it contains a page.tsx (the UI for that URL). The file system is the router config.",
    },
    {
      id: 'l1q2', kind: 'concept',
      prompt: 'By default, a component in the App Router is a…',
      options: ['Client Component', 'Server Component', 'Static HTML file', 'Web Worker'],
      answerIndex: 1,
      explanation: "Everything is a Server Component unless you add \"use client\". Server Components ship no JS and can fetch data directly.",
    },
    {
      id: 'l1q3', kind: 'code_reading',
      prompt: 'What is the role of {children} in this file?',
      code: { language: 'tsx', filename: 'app/layout.tsx', code: "export default function RootLayout({ children }) {\n  return <body><Sidebar />{children}</body>;\n}" },
      options: [
        'It renders the currently-matched page inside the layout',
        'It lists all child folders of app/',
        'It is a placeholder that must be deleted before deploy',
        'It imports every component automatically',
      ],
      answerIndex: 0,
      explanation: "children is the matched page (or nested layout). Omitting it means nested pages never render.",
    },
    {
      id: 'l1q4', kind: 'application',
      prompt: 'You want a component to use useState and an onClick handler. What must you do?',
      options: [
        'Nothing — Server Components support state',
        'Add "use client" as the first line of the file',
        'Rename the file to client.tsx',
        'Wrap it in <Suspense>',
      ],
      answerIndex: 1,
      explanation: "State and event handlers only work in Client Components, which you opt into with \"use client\" at the top of the file.",
    },
    {
      id: 'l1q5', kind: 'output',
      prompt: 'Given app/settings/page.tsx exists, what URL renders it?',
      options: ['/page/settings', '/settings', '/app/settings', '/settings/page'],
      answerIndex: 1,
      explanation: "The folder path under app/ is the URL: app/settings/page.tsx → /settings.",
    },
    {
      id: 'l1q6', kind: 'debug',
      prompt: 'A student’s nested pages render as a blank area. Their layout looks like this. What’s wrong?',
      code: { language: 'tsx', filename: 'app/layout.tsx', code: "export default function RootLayout({ children }) {\n  return <body><Sidebar /></body>;\n}" },
      options: [
        'Sidebar must be a Client Component',
        'The layout never renders {children}',
        'layout.tsx must be named layout.jsx',
        'They forgot "use client"',
      ],
      answerIndex: 1,
      explanation: "The layout drops {children}, so the matched page has nowhere to render. Add {children} after <Sidebar />.",
    },
    {
      id: 'l1q7', kind: 'concept',
      prompt: 'Which statement about layout.tsx is TRUE?',
      options: [
        'It re-renders fully every time you navigate between its child routes',
        'It persists across navigation between its child routes',
        'It can only be used once, at the app root',
        'It replaces the need for page.tsx',
      ],
      answerIndex: 1,
      explanation: "A layout wraps its children and does NOT re-render when you move between those children — which is why a sidebar in the layout stays put.",
    },
    {
      id: 'l1q8', kind: 'application',
      prompt: 'Why keep Orbit’s Sidebar and Topbar as Server Components for now?',
      options: [
        'Server Components can’t be styled',
        'They are static markup, so shipping zero JS keeps the shell fast',
        'Client Components can’t use Tailwind',
        'It’s required for lucide-react icons',
      ],
      answerIndex: 1,
      explanation: "They have no interactivity yet, so rendering them on the server avoids shipping unnecessary JavaScript.",
    },
    {
      id: 'l1q9', kind: 'project',
      prompt: 'In Orbit’s shell, where will every future page (board, billing, Ask Orbit) actually render?',
      options: [
        'Inside the Sidebar component',
        'In the {children} slot of the root layout’s <main>',
        'In a new browser tab',
        'Directly inside globals.css',
      ],
      answerIndex: 1,
      explanation: "Pages flow into {children} within <main>, so they automatically appear inside the sidebar+topbar frame.",
    },
    {
      id: 'l1q10', kind: 'output',
      prompt: 'What does `npm run dev` give you?',
      options: [
        'A production build in /out',
        'A local dev server with hot reload (default port 3000)',
        'A deployed URL on Vercel',
        'A database connection',
      ],
      answerIndex: 1,
      explanation: "npm run dev starts the development server on localhost:3000 with hot reload; deploying and databases come later.",
    },
  ],

  /* ─────────────────────────── HOMEWORK ─────────────────────────── */
  homework: {
    task:
      "Extend Orbit's shell so it feels like your product. Add a 'workspace switcher' button at the top of the sidebar (just static markup for now) showing a workspace name and a small chevron, and add one more nav item of your choice (e.g. 'Activity').",
    requirements: [
      "The switcher sits above the nav list, inside the sidebar, styled to match (rounded, hover state).",
      "It shows a workspace initial in a cyan circle + the workspace name.",
      "Add exactly one new nav item using the same NAV array pattern (don’t hand-write a second block).",
      "The shell must still render correctly with the Topbar and {children} area intact.",
    ],
    expectedOutcome:
      "The sidebar now leads with a workspace switcher chip and lists six nav items. Everything still lives inside the same layout; the main content area is unchanged.",
    extends: 'final',
    // Lesson 1 has no previous lesson, so no previousHomeworkHint here.
  },
};
