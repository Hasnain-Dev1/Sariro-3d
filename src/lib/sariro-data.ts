/**
 * SARIRO — Centralized content (derived from the SARIRO blueprint).
 * Brand: "Teaching the future. We teach thinking, not just coding."
 */

export const BRAND = {
  name: "Sariro",
  founder: "Mimo Patra",
  tagline: "Teaching the future. We teach thinking, not just coding.",
  mission:
    "We don't just teach you to write code. We teach you to think — to break problems apart, to reason about systems, and to build the future with confidence.",
  email: "contact@sariro.com",
  phone: "+1 (415) 555-0142",
  location: "San Francisco · Remote-first · Worldwide",
};

/* ---------- Razorpay payment links (one per tier) ----------
   Each tier has its own Razorpay Page link. When a user clicks
   "Enroll" on any course, we route them to the link matching
   the course's `level` field. */
export const RAZORPAY_LINKS: Record<string, string> = {
  Beginner: "https://pages.razorpay.com/sarirobeginner",
  Intermediate: "https://pages.razorpay.com/sarirointermediate",
  Advanced: "https://pages.razorpay.com/sariroadvanced",
};

/** Returns the Razorpay payment link for a given course level.
 *  Falls back to the Beginner link if the level is unknown. */
export function getRazorpayLink(level: string): string {
  return RAZORPAY_LINKS[level] ?? RAZORPAY_LINKS.Beginner;
}

/* ---------- Email directory (5 mailboxes — @sariro.com) ----------
   Each entry maps a purpose to its inbox so the contact page can show
   them as a directory instead of a single "email us" card. */
export const EMAILS = [
  {
    id: "contact",
    address: "contact@sariro.com",
    label: "General",
    purpose: "Anything & everything. Questions about courses, partnerships, scholarships — start here.",
    icon: "Mail",
    accent: "#16A34A",
  },
  {
    id: "support",
    address: "support@sariro.com",
    label: "Support",
    purpose: "Already enrolled? Cohort access, refunds, technical issues, recordings.",
    icon: "LifeBuoy",
    accent: "#2563EB",
  },
  {
    id: "dev",
    address: "dev@sariro.com",
    label: "Development",
    purpose: "Technical & product. Bugs, feature requests, integrations, API access, open-source collabs.",
    icon: "Briefcase",
    accent: "#7C3AED",
  },
  {
    id: "hr",
    address: "hr@sariro.com",
    label: "Careers",
    purpose: "Join the team. Mentors, curriculum designers, ops — we hire from inside first.",
    icon: "Handshake",
    accent: "#F59E0B",
  },
  {
    id: "founder",
    address: "founder@sariro.com",
    label: "Founder",
    purpose: "Direct line to Mimo Patra. Partnerships, press, investor conversations, big ideas.",
    icon: "Sparkles",
    accent: "#06B6D4",
  },
] as const;

/* ---------- Sariro (the company) — narrative for the About page ----------
   Sits ABOVE the Mimo section so visitors learn the brand first. */
export const SARIRO_ABOUT = {
  eyebrow: "About Sariro",
  headline: "An education brand that refuses to teach the easy way.",
  lead:
    "Sariro is a cohort-based AI education studio founded in San Francisco. We teach thinking, not just typing — and we back it up with curriculum that ships real, working AI artifacts, not 'hello world' demos.",
  paragraphs: [
    "We started Sariro after a decade of watching smart students graduate unable to build anything real. They could pass exams. They could recite definitions. But ship a working AI feature? Freeze. The fix was not more tutorials — it was teaching thinking.",
    "Every Sariro cohort is small (30–40 students), live, mentor-led, and project-first. No pre-recorded video dumps. No copy-paste notebooks. You build, you ship, you defend your work — and you leave with a portfolio you can show an employer, a client, or a school.",
    "We have taught 5,000+ students across 65 nationalities, partnered with schools and districts on three continents, and shipped open-source tools used by thousands of developers. We are still obsessed with the same question: how do you teach AI in a way that actually lasts?",
  ],
  stats: [
    { value: 5000, suffix: "+", label: "Students taught", accent: "blue" },
    { value: 65, suffix: "+", label: "Nationalities", accent: "green" },
    { value: 200, suffix: "+", label: "Cohorts run", accent: "violet" },
    { value: 1000, suffix: "+", label: "Projects shipped", accent: "amber" },
  ] as const,
  principles: [
    {
      title: "Cohort-based, not self-paced",
      body: "Self-paced courses have a 4% completion rate. Cohorts have 87%. We pick the model that actually finishes.",
    },
    {
      title: "Mentor-led, not video-led",
      body: "Every cohort is led by a senior builder who has shipped AI to production. You learn from scars, not slides.",
    },
    {
      title: "Project-first, not theory-first",
      body: "Theory comes when you need it. Every module ends with something working — not a quiz.",
    },
    {
      title: "Open knowledge, not gatekept",
      body: "Our resources, syllabi, and many of our tools are open. Pay for the cohort and the mentor, not the content.",
    },
  ],
};

/* ---------- Team (after Mimo, on the About page) ---------- */
export const TEAM = [
  {
    name: "Mimo Patra",
    role: "Founder & Lead Educator",
    bio: "12+ years teaching. 36 published papers. 7 patents. Mimo leads the flagship AI Foundations cohort and writes most of the curriculum.",
    avatar: "M",
    accent: "#F59E0B",
    isFounder: true,
  },
  {
    name: "Dr. Lena Okafor",
    role: "Head of School Partnerships",
    bio: "Former principal turned curriculum designer. Lena runs our school partnerships and trains teachers on the Sariro method.",
    avatar: "L",
    accent: "#16A34A",
    isFounder: false,
  },
  {
    name: "Marco Rossi",
    role: "Lead Mentor — LLM Applications",
    bio: "Senior PM at a fintech by day, Sariro mentor by night. Marco has shipped 4 RAG apps to production and reviews every Builder project.",
    avatar: "M",
    accent: "#2563EB",
    isFounder: false,
  },
  {
    name: "Priya Nair",
    role: "Lead Mentor — Computer Vision",
    bio: "ML engineer at a stealth startup. Priya wrote our evals framework and mentors the CV and Agents cohorts.",
    avatar: "P",
    accent: "#7C3AED",
    isFounder: false,
  },
  {
    name: "James Chen",
    role: "Career Mentor",
    bio: "History teacher → AI engineer. James runs our career sessions and the alumni Slack. He has reviewed 1,000+ portfolios.",
    avatar: "J",
    accent: "#06B6D4",
    isFounder: false,
  },
  {
    name: "Sofia Alvarez",
    role: "Community & Mentor Program",
    bio: "Built her first neural net at 16 with Sariro. Now runs our mentor program and the student-led AI ethics club.",
    avatar: "S",
    accent: "#EC4899",
    isFounder: false,
  },
] as const;

export const NAV_LINKS = [
  { id: "courses", label: "Courses" },
  { id: "tracks", label: "Tracks" },
  { id: "stats", label: "Impact" },
  { id: "events", label: "Events" },
  { id: "testimonials", label: "Voices" },
  { id: "pricing", label: "Pricing" },
];

export const TRUSTED_BY = [
  "McGraw-Hill",
  "Google Student Club",
  "Codingal",
  "Stanford Online",
  "MIT Bootcamps",
  "Khan Academy",
];

export const HERO_STATS = [
  { value: 5000, suffix: "+", label: "Students taught", accent: "blue" },
  { value: 65, suffix: "+", label: "Nationalities", accent: "green" },
  { value: 36, suffix: "", label: "Research papers", accent: "violet" },
  { value: 7, suffix: "", label: "Patents filed", accent: "amber" },
] as const;

export const TRACKS = [
  {
    id: "students",
    title: "For Students",
    tagline: "Become an AI builder, not just an AI user",
    description:
      "Cohort-based courses that take you from curious beginner to confident AI builder. Real projects, real mentorship, real outcomes — no fluff, no copy-paste tutorials.",
    icon: "GraduationCap",
    accent: "blue",
    points: [
      "Live cohorts of 30–40 students",
      "Personalized project feedback",
      "Lifetime community access",
      "Job-ready portfolio in 12 weeks",
    ],
    cta: "Browse student courses",
  },
  {
    id: "schools",
    title: "For Schools",
    tagline: "Bring AI literacy to your entire campus",
    description:
      "From single workshops to full-semester AI labs, we partner with schools to deliver curriculum that meets students where they are — and takes them far beyond.",
    icon: "School",
    accent: "green",
    points: [
      "Workshops, hackathons, full curriculum",
      "Teacher training included",
      "Aligned to CSTA & IB standards",
      "Flexible in-person or remote",
    ],
    cta: "Explore school packages",
  },
  {
    id: "professionals",
    title: "For Professionals",
    tagline: "Stay relevant in the age of AI",
    description:
      "Short, focused tracks for engineers, product managers, and leaders who need to ship AI features — without quitting their day job or wading through theory.",
    icon: "Briefcase",
    accent: "violet",
    points: [
      "Evening & weekend cohorts",
      "Industry-focused projects",
      "1:1 career strategy sessions",
      "Certificate of completion",
    ],
    cta: "See professional tracks",
  },
];

export const COURSES = [
  /* ============================================================
     BEGINNER COURSES — $199, 5 modules, 30 lessons (6 per module)
     ============================================================ */
  {
    id: "ai-foundations",
    title: "AI Foundations: Thinking in Systems",
    tagline: "Start here. Build the mental models that everything AI rests on.",
    level: "Beginner",
    audience: "Students",
    durationWeeks: 8,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Aug 12, 2026",
    featured: true,
    accent: "blue",
    outcomes: [
      "Reason about problems like an AI engineer",
      "Read and critique AI news without hype",
      "Build 3 portfolio-ready mini projects",
      "Understand the full AI stack end-to-end",
    ],
    syllabus: [
      { num: "01", name: "How AI Actually Works", project: "Diagram a real AI system end-to-end", lessons: ["What AI really is (and isn't)", "The AI stack: data, model, inference, UI", "How models learn: training in plain English", "Tokens, embeddings, vectors demystified", "The inference loop: prompt to output", "Why AI fails (and how to spot it)"] },
      { num: "02", name: "Thinking in Systems", project: "Map a real-world problem as an AI system", lessons: ["Systems thinking vs feature thinking", "Inputs, outputs, and feedback loops", "Constraints and trade-offs", "When to use AI vs rules-based code", "Cost and latency budgets", "Reading an AI architecture diagram"] },
      { num: "03", name: "Reading AI News Without Hype", project: "Write a hype-free teardown of an AI launch", lessons: ["The AI hype cycle, explained", "Marketing language vs technical reality", "Reading research papers as a non-researcher", "Spotting benchmark gaming", "Evaluating 'state of the art' claims", "Building your AI BS detector"] },
      { num: "04", name: "Your First AI Projects", project: "Ship 3 mini AI demos to a portfolio", lessons: ["Project 1: a prompt-driven tool", "Project 2: a RAG mini-search", "Project 3: a simple AI agent", "Using AI APIs safely and cheaply", "Version control and portfolio hygiene", "Writing a README that gets attention"] },
      { num: "05", name: "Capstone — Build a Real AI Demo", project: "Ship a polished AI demo with a landing page", lessons: ["Picking a problem worth solving", "Designing the user experience", "Building the AI core", "Wrapping it in a UI", "Deploying live on Vercel", "Demo day: presenting your work"] },
    ],
  },
  {
    id: "web-builder-pro",
    title: "Web Builder Pro",
    tagline: "Build modern AI-powered websites and web apps from scratch.",
    level: "Beginner",
    audience: "Students",
    durationWeeks: 10,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Aug 19, 2026",
    featured: true,
    accent: "cyan",
    outcomes: [
      "Deploy a live AI-powered web app with a real domain",
      "Master HTML, CSS, Tailwind, JavaScript, React, Next.js",
      "Add user authentication and a database with Supabase",
      "Integrate an AI feature (chatbot, search, or generator)",
    ],
    syllabus: [
      { num: "01", name: "Web Fundamentals", project: "Deploy your first webpage live", lessons: ["How browsers render pages", "HTML structure and semantics", "CSS and Tailwind basics", "Responsive design patterns", "Git and GitHub workflow", "Deploy to Vercel"] },
      { num: "02", name: "JavaScript for Builders", project: "Build an interactive quiz app", lessons: ["Variables, functions, logic", "DOM manipulation", "Fetch API and JSON", "Async and await", "Error handling", "Local storage and state"] },
      { num: "03", name: "React + Next.js", project: "Build a blog with CMS", lessons: ["Components and props", "State and hooks", "React Router and navigation", "Next.js App Router", "Server vs client components", "SEO and meta tags"] },
      { num: "04", name: "Backend with Supabase", project: "Build a full user auth system", lessons: ["Supabase setup and tables", "Auth with email and OAuth", "Row level security", "Realtime subscriptions", "File uploads and storage", "API routes in Next.js"] },
      { num: "05", name: "Capstone — Ship a Live AI Web App", project: "Launch your own AI web product", lessons: ["Integrating Claude or OpenAI API", "Streaming AI responses", "AI chat interface design", "Stripe payments integration", "Custom domain and analytics", "Launch and demo day"] },
    ],
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering Mastery",
    tagline: "From vibes-based prompting to engineered, reproducible prompts.",
    level: "Beginner",
    audience: "Professionals",
    durationWeeks: 6,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Jul 22, 2026",
    featured: true,
    accent: "violet",
    outcomes: [
      "Design prompts that ship to production",
      "Build a reusable prompt library for your team",
      "Evaluate prompts with real metrics",
      "Save 40%+ on API costs through better prompting",
    ],
    syllabus: [
      { num: "01", name: "Foundations of Prompting", project: "Reverse-engineer a real production prompt", lessons: ["How LLMs actually read prompts", "System vs user vs assistant roles", "Tokens, context windows, and limits", "Temperature, top-p, and sampling", "Prompt structure patterns", "Common pitfalls and anti-patterns"] },
      { num: "02", name: "Prompt Patterns & Engineering", project: "Build a library of 10 reusable patterns", lessons: ["Few-shot prompting", "Chain-of-thought reasoning", "Self-critique and refinement", "Structured output (JSON, XML)", "Tool use and function calling", "Multi-turn conversation design"] },
      { num: "03", name: "Building a Prompt Library", project: "Ship a versioned prompt library for a team", lessons: ["Prompt versioning and git", "Templating with variables", "A/B testing prompts", "Prompt composition and chaining", "Documentation standards", "Sharing and collaboration workflows"] },
      { num: "04", name: "Evaluation & Metrics", project: "Build an eval harness for your prompts", lessons: ["Why evals matter (and why most teams skip them)", "Automated vs human evals", "LLM-as-judge patterns", "Regression testing for prompts", "Cost and latency tracking", "Production monitoring"] },
      { num: "05", name: "Capstone — Production Prompt System", project: "Ship a real prompt-driven feature to production", lessons: ["Designing the feature", "Building the prompt chain", "Adding guardrails and safety", "Deploying to production", "Monitoring and iterating", "Case study write-up"] },
    ],
  },
  {
    id: "design-to-product",
    title: "Design to Product",
    tagline: "Go from idea to shipped product — design, prototype, and build with AI.",
    level: "Beginner",
    audience: "Students",
    durationWeeks: 8,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Sep 09, 2026",
    featured: false,
    accent: "amber",
    outcomes: [
      "Design a full product UI in Figma",
      "Generate UI kits with AI tools (v0, Cursor)",
      "Build a live product with no-code AI tools",
      "Launch publicly and get your first 100 users",
    ],
    syllabus: [
      { num: "01", name: "Product Thinking & Ideation", project: "Validate an idea in one day", lessons: ["Problem-first thinking", "User research basics", "Sketching and wireframing", "Competitor mapping", "Defining an MVP scope", "Pitching your idea"] },
      { num: "02", name: "Design Fundamentals (Figma)", project: "Design your first screen in Figma", lessons: ["Typography and colour", "Spacing and layout", "Component design", "Figma basics and shortcuts", "Design systems 101", "Dark and light modes"] },
      { num: "03", name: "UI Design with AI", project: "Generate a full UI kit with AI", lessons: ["v0 by Vercel for UI", "Cursor for design-to-code", "AI design tools landscape", "Design system generation", "Iterating with AI feedback", "Polishing AI-generated UI"] },
      { num: "04", name: "No-Code Building", project: "Turn your design into a live product", lessons: ["Lovable for full-stack apps", "Framer for marketing sites", "Webflow for CMS", "Connecting to databases", "Adding AI features", "Custom domains and deploy"] },
      { num: "05", name: "Capstone — Design to Live Product", project: "Ship a complete product from idea to users", lessons: ["Full product lifecycle", "AI content and assets", "Product Hunt launch", "Social media launch", "Email list building", "Portfolio case study"] },
    ],
  },
  {
    id: "ai-automation-agency",
    title: "AI Automation Agency",
    tagline: "Build AI automations for real businesses and sell them as a service.",
    level: "Beginner",
    audience: "Professionals",
    durationWeeks: 8,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Aug 26, 2026",
    featured: false,
    accent: "green",
    outcomes: [
      "Build 5 live business automation systems",
      "Land your first paying automation client",
      "Set up an agency with a retainer model",
      "Use N8N, Make, and Claude API professionally",
    ],
    syllabus: [
      { num: "01", name: "The Automation Business Model", project: "Find your first automation client", lessons: ["What businesses pay to automate", "Pricing automations", "Cold outreach templates", "Discovery call framework", "Proposal writing", "Retainer vs project pricing"] },
      { num: "02", name: "N8N Mastery", project: "Build a lead capture automation", lessons: ["N8N self-hosted setup", "Workflow basics", "Triggers and webhooks", "Error handling", "Credentials and security", "Scaling workflows"] },
      { num: "03", name: "AI-Powered Automations", project: "Build an AI email responder", lessons: ["Claude API in N8N", "AI email classification", "Smart routing", "Response generation", "Human-in-the-loop review", "Cost management"] },
      { num: "04", name: "WhatsApp & Messaging Bots", project: "Build a WhatsApp AI assistant", lessons: ["WhatsApp Business API setup", "Chatbot flow design", "Appointment booking", "Order management", "Handoff to humans", "Analytics and improvement"] },
      { num: "05", name: "Capstone — Launch Your Agency", project: "Launch your agency with 3 clients", lessons: ["Full agency setup", "Service menu design", "Case studies from pilots", "Monthly retainer system", "Client onboarding flow", "Scaling beyond yourself"] },
    ],
  },

  /* ============================================================
     INTERMEDIATE COURSES — $299, 7 modules, 42 lessons (6 per module)
     ============================================================ */
  {
    id: "app-builder-studio",
    title: "App Builder Studio",
    tagline: "Build real iOS and Android apps with AI features using React Native.",
    level: "Intermediate",
    audience: "Students",
    durationWeeks: 12,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Sep 03, 2026",
    featured: true,
    accent: "blue",
    outcomes: [
      "Ship a production mobile app to App Store and Play Store",
      "Master React Native, Expo, and TypeScript",
      "Add at least one AI-powered feature",
      "Implement push notifications and in-app purchases",
    ],
    syllabus: [
      { num: "01", name: "Mobile Dev Mindset + Expo", project: "Run your first app on your phone", lessons: ["Native vs cross-platform", "Expo setup and Expo Go", "Project structure", "Mobile UX principles", "Running on iOS and Android", "Debugging on device"] },
      { num: "02", name: "React Native Fundamentals", project: "Build a notes app", lessons: ["Core components", "Flexbox for mobile", "Expo Router navigation", "Gestures and touch", "Lists and performance", "Forms and input"] },
      { num: "03", name: "TypeScript + Data/Storage", project: "Build an offline-first app", lessons: ["Types and interfaces", "Type-safe components", "AsyncStorage", "SQLite local database", "Firebase Firestore", "Real-time sync"] },
      { num: "04", name: "Authentication + AI Features", project: "Add login with Google + AI camera analyser", lessons: ["Firebase Auth setup", "Supabase Auth", "OAuth providers", "Protected routes", "Camera API with Expo", "Image to AI analysis"] },
      { num: "05", name: "Push Notifications + Payments", project: "Add notifications and in-app purchases", lessons: ["Expo notifications", "Background tasks", "Deep linking", "Stripe mobile SDK", "Apple Pay and Google Pay", "Subscription management"] },
      { num: "06", name: "App Store Submission", project: "Submit to App Store and Play Store", lessons: ["Build and signing", "App Store Connect", "Google Play Console", "Review guidelines", "App icon and splash", "Store listing optimisation"] },
      { num: "07", name: "Capstone — Ship to Both Stores", project: "Ship your own app to both stores", lessons: ["Full app from idea to stores", "Performance and polish", "Analytics setup", "Marketing page", "Demo video", "Portfolio case study"] },
    ],
  },
  {
    id: "saas-forge",
    title: "SaaS Forge",
    tagline: "Build and launch AI-powered SaaS products that make real money.",
    level: "Intermediate",
    audience: "Professionals",
    durationWeeks: 12,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Sep 17, 2026",
    featured: true,
    accent: "green",
    outcomes: [
      "Launch a SaaS product with real paying users",
      "Build subscription billing with Stripe",
      "Implement the AI core feature with LangChain",
      "Deploy to production on AWS with CI/CD",
    ],
    syllabus: [
      { num: "01", name: "SaaS Product Thinking", project: "Validate your SaaS idea in 48 hours", lessons: ["Finding problems worth solving", "Competitor research", "MVP scoping", "Landing page before building", "Pricing strategy", "Go-to-market plan"] },
      { num: "02", name: "SaaS Architecture + Auth", project: "Build team workspaces", lessons: ["Monolith vs microservices", "Database design", "Multi-tenancy patterns", "Org-based auth", "Roles and permissions", "Invite system"] },
      { num: "03", name: "The AI Core Feature", project: "Build the AI product engine", lessons: ["AI feature design", "LangChain integration", "Streaming output", "Token and cost management", "Prompt versioning", "Guardrails and safety"] },
      { num: "04", name: "Subscription Billing", project: "Add Stripe subscriptions", lessons: ["Stripe billing portal", "Usage-based billing", "Free trials", "Dunning and failed payments", "Webhooks and reconciliation", "Tax and invoicing"] },
      { num: "05", name: "Admin Dashboard + Emails", project: "Build internal ops dashboard + onboarding flow", lessons: ["User management panel", "Revenue metrics", "Feature flags", "Resend email setup", "Transactional emails", "Drip campaigns"] },
      { num: "06", name: "Deploy, Scale, Market", project: "Deploy to production + launch marketing site", lessons: ["Docker compose", "AWS deployment", "CDN setup", "Database backups", "Landing page conversion", "Product Hunt launch"] },
      { num: "07", name: "Capstone — Launch + First 10 Users", project: "Launch your SaaS and get first 10 paying users", lessons: ["Go-to-market execution", "Cold outreach", "Demo calls", "Investor one-pager", "Iterating from feedback", "Portfolio write-up"] },
    ],
  },
  {
    id: "data-intelligence-studio",
    title: "Data Intelligence Studio",
    tagline: "Turn raw data into AI-powered insights, dashboards, and predictions.",
    level: "Intermediate",
    audience: "Professionals",
    durationWeeks: 10,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Oct 14, 2026",
    featured: false,
    accent: "violet",
    outcomes: [
      "Build a live AI-powered analytics dashboard",
      "Ship a working prediction system",
      "Create an automated data pipeline",
      "Master Python, Pandas, SQL, and scikit-learn",
    ],
    syllabus: [
      { num: "01", name: "Data Thinking + Python Basics", project: "Analyse a real dataset for insights", lessons: ["What data can tell you", "Types of analysis", "Data sources and collection", "Asking the right questions", "Python basics for data", "Jupyter notebooks"] },
      { num: "02", name: "Pandas + Data Cleaning", project: "Clean a messy real-world dataset", lessons: ["Pandas fundamentals", "DataFrames and Series", "Filtering and aggregation", "Handling missing data", "Data cleaning patterns", "Exploratory analysis"] },
      { num: "03", name: "SQL + Supabase", project: "Build a data warehouse", lessons: ["SQL fundamentals", "Joins and aggregations", "Window functions", "Supabase setup", "Data modelling", "Query optimisation"] },
      { num: "04", name: "Visualisation + Streamlit", project: "Build an interactive dashboard", lessons: ["Plotly charts", "Streamlit dashboards", "Dashboard design", "Storytelling with data", "Real-time updates", "Sharing dashboards"] },
      { num: "05", name: "AI for Data Analysis", project: "Build an AI data analyst", lessons: ["Claude API for data questions", "Natural language to SQL", "Automated insight generation", "AI-powered reporting", "Context injection", "Hallucination prevention"] },
      { num: "06", name: "ML Basics + Prediction Systems", project: "Build a churn prediction model", lessons: ["ML without deep maths", "scikit-learn pipeline", "Train/test split", "Feature engineering", "Model evaluation", "Deploying models with Streamlit"] },
      { num: "07", name: "Capstone — AI Analytics Product", project: "Build and deploy a complete AI analytics product", lessons: ["End-to-end data product", "Real data source integration", "User-facing dashboard", "Automated pipeline", "Documentation", "Portfolio presentation"] },
    ],
  },
  {
    id: "cloud-devops-launchpad",
    title: "Cloud and DevOps Launchpad",
    tagline: "Deploy, scale, and manage modern AI products in the cloud like a pro.",
    level: "Intermediate",
    audience: "Professionals",
    durationWeeks: 8,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Oct 28, 2026",
    featured: false,
    accent: "amber",
    outcomes: [
      "Build a fully automated CI/CD pipeline",
      "Deploy on a Kubernetes cluster",
      "Provision infrastructure with Terraform",
      "Set up monitoring, alerting, and security",
    ],
    syllabus: [
      { num: "01", name: "Cloud + DevOps Fundamentals", project: "Deploy your first app to AWS", lessons: ["Cloud computing concepts", "AWS core services", "IAM and security basics", "SSH and servers", "Networking fundamentals", "Cost management"] },
      { num: "02", name: "Docker Mastery", project: "Containerise a full-stack app", lessons: ["Dockerfile writing", "Multi-stage builds", "Docker compose", "Container networking", "Volumes and persistence", "Image optimisation"] },
      { num: "03", name: "CI/CD Pipelines", project: "Build an automated deploy pipeline", lessons: ["GitHub Actions workflows", "Automated testing", "Deployment gates", "Environment management", "Secrets handling", "Rollback strategies"] },
      { num: "04", name: "Kubernetes", project: "Deploy on a K8s cluster", lessons: ["Pods and deployments", "Services and ingress", "ConfigMaps and Secrets", "Auto-scaling", "Health checks", "Kustomize and Helm"] },
      { num: "05", name: "Infrastructure as Code", project: "Build entire infra with Terraform", lessons: ["Terraform basics", "AWS with Terraform", "State management", "Modules and reuse", "Variables and outputs", "Workspaces"] },
      { num: "06", name: "Monitoring + Security", project: "Build a monitoring dashboard + audit your deployment", lessons: ["Prometheus metrics", "Grafana dashboards", "Log aggregation", "Alerting setup", "HTTPS and certificates", "Security scanning"] },
      { num: "07", name: "Capstone — Production Deployment", project: "Deploy a complete AI product to production", lessons: ["End-to-end DevOps pipeline", "Blue-green deployment", "Disaster recovery", "Cost optimisation", "Documentation", "On-call readiness"] },
    ],
  },
  {
    id: "game-studio-ai",
    title: "Game Studio AI",
    tagline: "Build real games with AI — web games, mobile games, and AI mechanics.",
    level: "Intermediate",
    audience: "Students",
    durationWeeks: 10,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Nov 11, 2026",
    featured: false,
    accent: "cyan",
    outcomes: [
      "Ship three playable games to the web",
      "Master Phaser.js and Three.js for game dev",
      "Add AI-powered game mechanics (enemies, dialogue)",
      "Publish on Itch.io and earn revenue",
    ],
    syllabus: [
      { num: "01", name: "Game Design Thinking", project: "Design your first game on paper", lessons: ["Game mechanics and loops", "Player psychology", "Level design basics", "Monetisation models", "Game feel and juice", "Prototyping on paper"] },
      { num: "02", name: "Web Games with Phaser.js", project: "Build a side-scroller game", lessons: ["Phaser setup", "Sprites and animation", "Physics engine", "Collision detection", "Sound effects", "Score and lives system"] },
      { num: "03", name: "JavaScript Game Mechanics", project: "Build a puzzle game", lessons: ["Game state management", "Local leaderboards", "Save and load", "Particle effects", "Tween animations", "Mobile touch controls"] },
      { num: "04", name: "3D with Three.js", project: "Build a 3D browser game", lessons: ["Three.js scenes", "3D models and textures", "Camera controls", "Simple 3D physics", "Lighting and shadows", "Performance optimisation"] },
      { num: "05", name: "AI in Games", project: "Build a game with AI enemies", lessons: ["AI behaviour trees", "Claude for dynamic dialogue", "Procedural generation", "Adaptive difficulty", "AI-generated content", "Balancing AI gameplay"] },
      { num: "06", name: "Mobile + Multiplayer", project: "Port your game to mobile + 2-player mode", lessons: ["Capacitor for mobile", "Touch controls", "Mobile performance", "WebSocket basics", "Firebase realtime sync", "Lobby and matchmaking"] },
      { num: "07", name: "Capstone — Ship Your Game", project: "Build and launch your original game", lessons: ["Original game concept", "Full development cycle", "Marketing trailer with AI", "Itch.io publishing", "Monetisation setup", "Portfolio write-up"] },
    ],
  },
  {
    id: "ai-security-engineer",
    title: "AI Security Engineer",
    tagline: "Build AI-powered security systems, ethical hacking tools, and products.",
    level: "Intermediate",
    audience: "Professionals",
    durationWeeks: 10,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Nov 25, 2026",
    featured: false,
    accent: "blue",
    outcomes: [
      "Build an AI-powered vulnerability scanner",
      "Conduct a full penetration test",
      "Secure an AWS environment end-to-end",
      "Create a real-time security monitoring dashboard",
    ],
    syllabus: [
      { num: "01", name: "Security Mindset + OWASP", project: "Audit your own project for vulnerabilities", lessons: ["Attacker vs defender thinking", "OWASP Top 10", "Threat modelling", "Security checklists", "Responsible disclosure", "Security culture"] },
      { num: "02", name: "Network Security", project: "Map and analyse a network", lessons: ["TCP/IP and protocols", "Wireshark traffic analysis", "Port scanning with Nmap", "Network defence basics", "Firewalls and IDS", "VPN and zero trust"] },
      { num: "03", name: "Web App Security", project: "Find and fix XSS and SQL injection", lessons: ["Common web vulnerabilities", "Burp Suite basics", "Manual testing techniques", "AI-assisted code review", "Session and auth attacks", "Remediation patterns"] },
      { num: "04", name: "Ethical Hacking & Pentesting", project: "Conduct a full pentest on a test environment", lessons: ["Pentesting methodology", "Kali Linux tools", "Exploitation basics", "Privilege escalation", "Lateral movement", "Report writing"] },
      { num: "05", name: "AI for Security", project: "Build an AI vulnerability scanner", lessons: ["Claude for code analysis", "AI threat detection", "Automated security testing", "AI-generated reports", "Anomaly detection with ML", "Adversarial AI basics"] },
      { num: "06", name: "Cloud Security + Monitoring", project: "Secure an AWS environment + build dashboard", lessons: ["AWS security services", "IAM best practices", "S3 and data security", "CloudTrail monitoring", "Log analysis", "Incident response"] },
      { num: "07", name: "Capstone — Security Product", project: "Build and launch a security tool", lessons: ["Productise your scanner", "Landing page", "Pricing model", "Open-source strategy", "Portfolio and GitHub", "Demo day"] },
    ],
  },

  /* ============================================================
     ADVANCED COURSES — $699, 16 modules, 96 lessons (6 per module)
     ============================================================ */
  {
    id: "agent-architect",
    title: "Agent Architect",
    tagline: "Build autonomous AI agents and multi-agent systems that work on their own.",
    level: "Advanced",
    audience: "Professionals",
    durationWeeks: 16,
    modules: 16,
    lessons: 96,
    price: 699,
    originalPrice: 2330,
    nextCohort: "Oct 14, 2026",
    featured: true,
    accent: "violet",
    outcomes: [
      "Ship three production-ready AI agent systems",
      "Master LangChain, LangGraph, CrewAI, and MCP",
      "Build a multi-agent business automation",
      "Deploy an agent product with real users",
    ],
    syllabus: [
      { num: "01", name: "What Agents Actually Are", project: "Build your first agent in 1 hour", lessons: ["Agent vs chatbot vs API", "Tool use and reasoning", "LLM as the brain", "The ReAct loop", "Agent architectures", "When to use agents"] },
      { num: "02", name: "LangChain for Agents", project: "Build a web research agent", lessons: ["Chains and runnables", "Tool creation", "Memory types", "Structured output", "Streaming responses", "Error handling"] },
      { num: "03", name: "RAG — Giving Agents Knowledge", project: "Build a document Q&A agent", lessons: ["Vector embeddings", "Pinecone setup", "Retrieval pipeline", "Context injection", "RAG evaluation", "Hybrid search"] },
      { num: "04", name: "LangGraph — Stateful Agents", project: "Build a multi-step planning agent", lessons: ["Graph-based workflows", "State management", "Conditional edges", "Human-in-the-loop", "Subgraphs", "Persistence"] },
      { num: "05", name: "Multi-Agent with CrewAI", project: "Build a content research crew", lessons: ["Agent roles and goals", "Task delegation", "Sequential crews", "Parallel crews", "Output chaining", "Crew evaluation"] },
      { num: "06", name: "MCP — Connecting to the World", project: "Connect agent to real APIs", lessons: ["MCP architecture", "Building MCP servers", "Database integration", "External tool access", "MCP client design", "Security considerations"] },
      { num: "07", name: "Agent Memory & Learning", project: "Build an agent that remembers users", lessons: ["Short-term memory", "Long-term vector memory", "User preference learning", "Episodic recall", "Memory compression", "Privacy and consent"] },
      { num: "08", name: "Tool Creation & Function Calling", project: "Build a custom tool library", lessons: ["Tool design patterns", "Function calling APIs", "Schema definition", "Tool composition", "Error handling in tools", "Tool testing"] },
      { num: "09", name: "Planning & Reasoning Patterns", project: "Build a planning agent", lessons: ["Chain-of-thought", "Tree of thought", "Reflection patterns", "Self-critique loops", "Decomposition strategies", "When to plan vs. react"] },
      { num: "10", name: "N8N Automation with AI", project: "Build a business automation workflow", lessons: ["N8N with AI nodes", "Email processing agent", "Report generation", "Scheduled agents", "Webhook triggers", "Human escalation"] },
      { num: "11", name: "Vector DBs Deep Dive", project: "Build a production vector search", lessons: ["Pinecone vs Weaviate vs Qdrant", "Embedding models", "Indexing strategies", "Hybrid search", "Filtering and metadata", "Cost optimisation"] },
      { num: "12", name: "Agent Evaluation & Reliability", project: "Build an eval harness for agents", lessons: ["Why agent evals are hard", "Trajectory evaluation", "Outcome evaluation", "LLM-as-judge for agents", "Regression testing", "Production monitoring"] },
      { num: "13", name: "Deploy & Monitor Agents", project: "Deploy agent as a product", lessons: ["FastAPI agent endpoint", "Docker packaging", "Agent observability", "Cost monitoring", "Rate limiting", "Scaling strategies"] },
      { num: "14", name: "Multi-Agent Orchestration", project: "Build a multi-agent business system", lessons: ["Orchestration patterns", "Agent communication", "Conflict resolution", "Shared state", "Supervisor agents", "Production multi-agent"] },
      { num: "15", name: "Agent Product Design & Pricing", project: "Design your agent product", lessons: ["Domain-specific agent design", "User interface for agents", "Pricing models for agents", "Onboarding flows", "Trust and transparency", "Support and iteration"] },
      { num: "16", name: "Capstone — Ship Your Agent Product", project: "Build and launch a real agent product", lessons: ["Full product from idea to launch", "User testing", "Iterating from feedback", "Marketing an agent product", "Demo presentation", "Portfolio case study"] },
    ],
  },
];


export const EVENTS = [
  {
    id: "summer-cohort-2026",
    title: "Summer AI Builder Cohort",
    type: "Cohort",
    date: "Aug 12 — Oct 04, 2026",
    format: "Remote",
    location: "Online · Live",
    price: "From $199",
    accent: "blue",
    description:
      "8 weeks. 40 students. 3 portfolio projects. The flagship Sariro experience.",
  },
  {
    id: "ai-hackathon-fall",
    title: "AI for Good Hackathon",
    type: "Hackathon",
    date: "Sep 20 — Sep 22, 2026",
    format: "Hybrid",
    location: "SF + Remote",
    price: "Free",
    accent: "green",
    description:
      "48 hours. Real nonprofits. Real AI solutions. $10k in prizes across 3 tracks.",
  },
  {
    id: "prompt-jam-webinar",
    title: "Prompt Jam: Live Workshop",
    type: "Webinar",
    date: "Jul 22, 2026 · 6pm PT",
    format: "Remote",
    location: "Online · 90 min",
    price: "Free",
    accent: "violet",
    description:
      "Build a production-grade prompt library in 90 minutes. Bring your laptop.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Aarav Mehta",
    role: "CS Student · IIT Bombay",
    quote:
      "Sariro is the only place that taught me WHY models work, not just how to call the API. I went from 'AI curious' to shipping a RAG app at my internship in 6 weeks.",
    avatar: "A",
    accent: "blue",
  },
  {
    name: "Dr. Lena Okafor",
    role: "Principal · Lakeside Academy",
    quote:
      "We brought Sariro in for a semester-long AI lab. The teacher training alone was worth it. Our students now lead the school's AI ethics club — they started it themselves.",
    avatar: "L",
    accent: "green",
  },
  {
    name: "Marco Rossi",
    role: "Senior PM · Fintech",
    quote:
      "I've taken 4 'AI for PMs' courses. This is the only one that respected my time. The evening cohort fit around my job and the project I shipped is now in our roadmap.",
    avatar: "M",
    accent: "violet",
  },
  {
    name: "Priya Nair",
    role: "ML Engineer · Startup",
    quote:
      "The evals module alone was worth 10x the price. I now have a framework I use every week. Mimo teaches the way I wish every senior engineer had taught me.",
    avatar: "P",
    accent: "amber",
  },
  {
    name: "James Chen",
    role: "Career Switcher",
    quote:
      "I was a history teacher. I'm now an AI engineer at a 50-person startup. Sariro didn't just teach me — it gave me the confidence to call myself a builder.",
    avatar: "J",
    accent: "cyan",
  },
  {
    name: "Sofia Alvarez",
    role: "HS Junior · Mexico City",
    quote:
      "I thought AI was for genius coders. Mimo made me realize it's for curious humans. I built my first neural net at 16 — and now I'm mentoring younger students.",
    avatar: "S",
    accent: "blue",
  },
];

export const PRICING_TIERS = [
  {
    id: "beginner",
    name: "Beginner",
    price: 199,
    originalPrice: 398,
    period: "per cohort",
    accent: "green",
    tagline: "Start here. Zero-to-builder courses for first-time makers.",
    features: [
      "1 beginner cohort enrollment",
      "All live sessions + recordings",
      "Community access during cohort",
      "Certificate of completion",
      "1 portfolio project reviewed",
      "No coding experience required",
    ],
    cta: "Start with Beginner",
    popular: false,
  },
  {
    id: "intermediate",
    name: "Intermediate",
    price: 299,
    originalPrice: 854,
    period: "per cohort",
    accent: "blue",
    tagline: "Go deeper. Build real, shippable AI products with mentor feedback.",
    features: [
      "1 intermediate cohort enrollment",
      "Everything in Beginner, plus:",
      "1:1 mentor sessions (3x)",
      "Lifetime community access",
      "3 portfolio projects reviewed",
      "Career strategy session",
      "Priority event invites",
    ],
    cta: "Become a Builder",
    popular: true,
  },
  {
    id: "expert",
    name: "Expert",
    price: 699,
    originalPrice: 2330,
    period: "per cohort",
    accent: "violet",
    tagline: "Ship production-grade AI. For serious builders who want to lead.",
    features: [
      "1 advanced cohort enrollment",
      "Everything in Intermediate, plus:",
      "Weekly 1:1 mentor sessions",
      "Capstone project shipped to production",
      "Open-source contribution review",
      "Investor / employer intro calls",
      "Lifetime alumni Slack + mentor access",
      "Co-author opportunity on Sariro research",
    ],
    cta: "Go Expert",
    popular: false,
  },
];

export const MIMO = {
  name: "Mimo Patra",
  title: "Founder & Lead Educator",
  bio: "AI educator, researcher, and patent-holding inventor. Mimo has taught 5,000+ students across 65 nationalities, published 36 research papers, and filed 7 patents — all while staying obsessed with one question: how do you teach AI in a way that lasts?",
  numbers: [
    { value: "12+", label: "Years teaching" },
    { value: "5K+", label: "Students mentored" },
    { value: "36", label: "Papers published" },
    { value: "7", label: "Patents filed" },
  ],
  principles: [
    {
      title: "Thinking over typing",
      body: "Anyone can copy a tutorial. We teach you to think — to break problems apart, to ask the right questions, to reason about systems. The typing comes naturally after.",
    },
    {
      title: "Build real things",
      body: "Every Sariro course ends with something you can show an employer, a client, or a school. Not a 'hello world' — a real, working, evaluated AI artifact.",
    },
    {
      title: "Accessible by design",
      body: "AI education shouldn't be gatekept by jargon. We teach in plain language. An 8-year-old and a grandpa should both be able to follow along.",
    },
    {
      title: "Community, not customers",
      body: "Once you're in, you're in. Lifetime community access, mentorship opportunities, and a network that shows up when you ship — and when you stumble.",
    },
  ],
};

/* Summer 2026 launch pricing — early-bird discount window
   (active until Aug 12, 2026). `originalPrice` is the standard
   cohort price; `price` is the discounted price shown live. */
export const DISCOUNT_LABEL = 'Summer launch — 25% off';
export const DISCOUNT_DEADLINE = 'Aug 12, 2026';

/** Returns the integer discount percent for a tier/course, or 0 if no discount. */
export function discountPercent(price: number | null, original?: number | null): number {
  if (!price || !original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export const FOOTER_LINKS = {
  Learn: ["Courses", "Tracks", "Events", "Resources", "YouTube"],
  Company: ["About Mimo", "Blog", "Careers", "Press kit"],
  Support: ["Contact", "FAQ", "Privacy Policy", "Refund Policy"],
};
