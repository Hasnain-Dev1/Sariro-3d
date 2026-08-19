import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 28 — SEO & Meta Tags
 * Module 5 (Deploy + Capstone) · Lesson 28 of 30
 */
export const lesson28: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 5,
  lessonIndex: 3,
  globalNumber: 28,
  name: 'SEO & meta tags',
  title: 'SEO & Meta Tags — Making Momentum Shareable and Findable',
  subtitle: "Give Momentum a proper title, description, and a rich social media preview card.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what SEO and meta tags actually do, how Next.js's Metadata API sets them cleanly, and how Open Graph tags control how a link looks when shared on social media.",
    sections: [
      {
        heading: 'What is SEO, really?',
        body:
          "SEO (Search Engine Optimization) is the practice of helping search engines (and other platforms) understand what your page is ABOUT, so they can show it accurately in search results and link previews. It's not a trick or a hack — it's giving accurate, structured information so tools like Google can do their job well.",
      },
      {
        heading: 'Meta tags — information ABOUT the page',
        body:
          "Meta tags live in <head> and describe the page without being visible content themselves. The two most fundamental: the <title> (shown in the browser tab AND as the search result headline) and a description meta tag (the snippet shown under that headline in search results).",
        code: {
          language: 'html',
          code:
            "<title>Momentum — Build better habits with AI</title>\n<meta name=\"description\" content=\"Track your daily habits, keep your streak alive, and get AI coaching from Ask Momentum.\" />",
        },
      },
      {
        heading: 'Next.js’s Metadata API',
        body:
          "Instead of hand-writing <meta> tags, the App Router lets you export a metadata object from a page or layout — Next.js generates the correct <head> tags automatically. This is cleaner, type-safe, and works whether the page is static or dynamic.",
        code: {
          language: 'typescript',
          filename: 'app/layout.tsx',
          code:
            "import type { Metadata } from 'next';\n\nexport const metadata: Metadata = {\n  title: 'Momentum — Build better habits with AI',\n  description: 'Track your daily habits, keep your streak alive, and get AI coaching from Ask Momentum.',\n};",
        },
      },
      {
        heading: 'Open Graph — how links look when shared',
        body:
          "When you paste a link into Slack, Twitter/X, or WhatsApp, the big preview card (image, title, description) you see is generated from Open Graph (OG) tags. Without them, a shared link often looks bare or ugly. Next.js's metadata object includes an openGraph field for exactly this.",
        code: {
          language: 'typescript',
          code:
            "export const metadata: Metadata = {\n  title: 'Momentum',\n  description: 'Build better habits with AI.',\n  openGraph: {\n    title: 'Momentum — Build better habits with AI',\n    description: 'Track habits, keep your streak, get AI coaching.',\n    images: ['/og-image.png'],   // a 1200x630px image in /public\n  },\n};",
        },
      },
      {
        heading: 'Why this matters for a portfolio project',
        body:
          "When you share Momentum's link with a friend, a recruiter, or on LinkedIn, a rich, branded preview card makes a genuinely strong first impression compared to a bare, generic-looking link. This lesson is small effort for a disproportionately large polish payoff.",
      },
    ],
    keyTerms: [
      { term: 'SEO', definition: "Search Engine Optimization — helping search engines understand and represent your page accurately." },
      { term: 'Meta tag', definition: "A <head> tag describing information ABOUT the page, not visible content itself." },
      { term: 'Metadata API', definition: "Next.js's way of exporting a metadata object from a page/layout instead of hand-writing <meta> tags." },
      { term: 'Open Graph (OG)', definition: "A tag standard controlling how a link's preview card (image, title, description) looks when shared on social platforms." },
      { term: 'OG image', definition: "The image (typically 1200x630px) shown in a link's social preview card." },
    ],
    commonMistakes: [
      "Leaving the default 'Create Next App' title and description, which says nothing about your actual product.",
      "Writing a description that's too vague or too long — aim for a clear, specific sentence or two.",
      "Forgetting Open Graph tags entirely, resulting in a bare or broken-looking link preview when shared.",
      "Using an OG image with the wrong dimensions, causing it to be cropped oddly on different platforms.",
      "Setting metadata only on one page when it should apply site-wide (usually belongs in the root layout, with page-specific overrides where needed).",
    ],
    takeaways: [
      "SEO is about accurately describing your page, not tricking search engines.",
      "title and description are the most fundamental meta tags.",
      "Next.js's Metadata API generates correct <head> tags from a typed object.",
      "Open Graph tags control how your link looks when shared on social platforms.",
      "A good OG image and description meaningfully improve first impressions when sharing a portfolio project.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Metadata for a mini page',
    objective:
      "Practise the Metadata API and Open Graph fields on a small standalone page before applying them to Momentum's real layout.",
    instructions: [
      "Create app/about-me/page.tsx as a small personal page.",
      "Export a metadata object with a title, description, and an openGraph block.",
      "View the page's source (or use a browser extension) to confirm the tags rendered correctly.",
    ],
    code: [
      {
        language: 'tsx',
        filename: 'app/about-me/page.tsx',
        code:
          "import type { Metadata } from 'next';\n\nexport const metadata: Metadata = {\n  title: 'About Me — Aisha’s Portfolio',\n  description: 'Student developer building real projects with Sariro.',\n  openGraph: {\n    title: 'About Me — Aisha’s Portfolio',\n    description: 'Student developer building real projects with Sariro.',\n  },\n};\n\nexport default function AboutMe() {\n  return <h1>About Me</h1>;\n}",
      },
    ],
    explanation:
      "Next.js reads this exported metadata object at build/request time and generates the correct <title>, <meta name=\"description\">, and Open Graph <meta property=\"og:...\"> tags automatically — you never write raw HTML tags by hand. Because this is exported from THIS specific page file, it only applies to /about-me, overriding whatever the root layout's metadata sets for every other page — a useful pattern for page-specific titles.",
    expectedOutput:
      "Viewing the page source (right-click → View Page Source) shows a proper <title>About Me — Aisha's Portfolio</title> and matching meta description/OG tags in the <head>, despite none of that HTML being hand-written.",
    learned: [
      "How to export page-specific metadata.",
      "How Next.js generates real <head> tags from a typed object.",
      "The relationship between page-level and layout-level metadata.",
      "How to verify metadata actually rendered.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum gets real, branded SEO metadata and an Open Graph preview image — a professional-looking, shareable link.",
    why:
      "This is a small amount of code for a disproportionately large improvement in how Momentum presents itself anywhere it's linked — search results, social shares, and messaging apps.",
    fileLocation: "app/layout.tsx (site-wide metadata) + public/og-image.png (new image)",
    code: [
      {
        language: 'typescript',
        filename: 'app/layout.tsx',
        code:
          "import type { Metadata } from 'next';\nimport './globals.css';\nimport { Sidebar } from '@/components/shell/Sidebar';\nimport { Topbar } from '@/components/shell/Topbar';\n\nexport const metadata: Metadata = {\n  title: 'Momentum — Build better habits with AI',\n  description: 'Track your daily habits, keep your streak alive, and get personal coaching from Ask Momentum — an AI habit coach built with Next.js and Claude.',\n  openGraph: {\n    title: 'Momentum — Build better habits with AI',\n    description: 'Track your daily habits, keep your streak alive, and get AI coaching from Ask Momentum.',\n    images: ['/og-image.png'],\n    type: 'website',\n  },\n};\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body className=\"bg-slate-50 text-slate-900\">\n        <div className=\"flex min-h-screen\">\n          <Sidebar />\n          <div className=\"flex-1 flex flex-col min-w-0\">\n            <Topbar />\n            <main className=\"flex-1 p-6\">{children}</main>\n          </div>\n        </div>\n      </body>\n    </html>\n  );\n}",
      },
    ],
    placement:
      "1) Add the metadata export to app/layout.tsx, right above the RootLayout component. 2) Create a 1200x630px image (a simple branded graphic — the Momentum logo, cyan/green background, and the tagline works well) and save it as public/og-image.png. 3) Deploy, then test the share preview using a tool like Twitter/X's Card Validator or by pasting the live URL into Slack/WhatsApp.",
    implementation:
      "Setting metadata in app/layout.tsx (the ROOT layout) applies these tags to every page in the app by default — appropriate for Momentum, which doesn't currently need different titles per route. The openGraph.images field points at the image you created; Next.js resolves a path starting with / from the public/ folder automatically. type: 'website' is a standard OG classification signalling this is a general website, not an article or video. Once deployed, ANY platform generating a link preview (Slack, X, LinkedIn, WhatsApp) will fetch these tags and build a proper preview card instead of showing a bare, generic link.",
    expectedResult:
      "Pasting your live Momentum URL into Slack or a messaging app now shows a rich preview card: your branded image, the real title, and description — instead of a plain, unstyled link.",
    connects:
      "Momentum is now polished for sharing and search. Lessons 29-30 pull everything from all five modules together into the final capstone build sprint and public launch.",
  },

  quiz: [
    { id: 'l28q1', kind: 'concept', prompt: 'What is SEO fundamentally about?', options: ['Tricking search engines with hidden text', 'Accurately describing your page so search engines represent it well', 'Making a page load faster only', 'A type of CSS'], answerIndex: 1, explanation: "Good SEO is about clear, accurate information, not manipulation." },
    { id: 'l28q2', kind: 'application', prompt: 'Where do you set site-wide metadata that applies to every page by default?', options: ['In each individual page only', 'In the root layout.tsx', 'In globals.css', 'In package.json'], answerIndex: 1, explanation: "Metadata exported from the root layout applies across the whole app unless a page overrides it." },
    { id: 'l28q3', kind: 'concept', prompt: 'What controls how a link looks when shared on Slack or Twitter/X?', options: ['The page’s CSS', 'Open Graph (OG) tags', 'The favicon only', 'The page’s file size'], answerIndex: 1, explanation: "Open Graph tags define the title, description, and image used in social/messaging link previews." },
    { id: 'l28q4', kind: 'code_reading', prompt: 'In the metadata object, what does description control?', options: ['The page’s visible heading', 'The snippet shown under a search result / in some previews', 'The page’s CSS colours', 'The page’s route'], answerIndex: 1, explanation: "The description meta tag provides the summary text search engines and some previews display." },
    { id: 'l28q5', kind: 'application', prompt: 'What’s a typical recommended size for an Open Graph image?', options: ['16x16px', '1200x630px', '4000x4000px', 'It doesn’t matter at all'], answerIndex: 1, explanation: "1200x630px is a widely-used OG image size that displays well across most platforms." },
    { id: 'l28q6', kind: 'debug', prompt: 'A shared Momentum link shows no image, just plain text. Likely missing piece?', options: ['The title tag', 'The openGraph.images field (or the referenced image file is missing)', 'The CSS file', 'The API route'], answerIndex: 1, explanation: "Without a valid OG image reference, most platforms fall back to a plain text preview." },
    { id: 'l28q7', kind: 'code_reading', prompt: 'Why does images: [\'/og-image.png\'] resolve correctly without a full URL?', options: ['It doesn’t work without a full URL', 'Next.js resolves a leading-slash path from the public/ folder automatically', 'It’s a typo that happens to work', 'Images always need an absolute URL'], answerIndex: 1, explanation: "Paths starting with / reference files in the public/ directory, served at the site's root." },
    { id: 'l28q8', kind: 'application', prompt: 'If ONE specific page needs a different title than the rest of the site, where do you set that?', options: ['Nowhere, it’s impossible', 'Export a metadata object from THAT page file, overriding the layout default', 'Edit globals.css', 'Change the root layout only'], answerIndex: 1, explanation: "A page-level metadata export overrides the layout's default for that specific route." },
    { id: 'l28q9', kind: 'project', prompt: "Why is good SEO/OG setup described as disproportionately valuable for a portfolio project?", options: ['It’s not actually valuable', 'A small amount of setup meaningfully improves first impressions everywhere the link is shared (recruiters, social, search)', 'It changes the app’s functionality', 'It’s required for the app to run at all'], answerIndex: 1, explanation: "Low effort, high impact on how professional the project appears when shared or found." },
    { id: 'l28q10', kind: 'concept', prompt: 'What does the <title> tag control, specifically?', options: ['The page’s main heading only', 'The browser tab text AND the search result headline', 'The favicon', 'The page’s background colour'], answerIndex: 1, explanation: "The <title> tag shows in the browser tab and is typically used as the clickable headline in search results." },
  ],

  homework: {
    task:
      "Add a favicon (the small icon shown in the browser tab) matching Momentum's brand, replacing the default Next.js icon.",
    requirements: [
      "Create or find a simple square icon representing Momentum (e.g. a green circle, or a simplified ring icon).",
      "Save it as app/favicon.ico (Next.js automatically picks up a favicon.ico in the app/ folder).",
      "Confirm the browser tab shows your new icon, both locally and after redeploying.",
    ],
    expectedOutcome:
      "The browser tab shows a custom Momentum icon instead of the default Next.js/Vercel triangle logo.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 27,
      hint: "Lesson 27 asked you to document how you connected your domain (record types used, propagation time) — or the steps you'd take if you didn't purchase one.",
      steps: [
        "Add a short section to your README.md (or a new NOTES.md) titled 'Domain setup'.",
        "List the record type(s) you added (A and/or CNAME) and the rough time it took to become active.",
        "If you didn't complete this with a real domain, write the steps you WOULD follow, showing understanding of the process.",
      ],
      codeGuidance: [
        {
          language: 'text',
          filename: 'README.md (add a section)',
          code:
            "## Domain setup\nConnected momentum-app.com via a CNAME record pointing `www` to `cname.vercel-dns.com`,\nand an A record for the root domain to Vercel's IP. Propagation took about 20 minutes.",
        },
      ],
    },
  },
};
