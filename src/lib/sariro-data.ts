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
    name: "Hasnain Ali",
    role: "Lead Developer & Co-Founder",
    bio: "We brought Sariro into real life. True power isn't adding until there is nothing left to give, but stripping away until there is nothing left to break.",
    avatar: "H",
    accent: "#06B6D4",
    isFounder: true,
  },
  {
    name: "Dr. Lena Okafor",
    role: "Head of School Partnerships",
    bio: "Former principal turned curriculum designer. Lena runs our school partnerships and trains teachers on the Sariro method.",
    avatar: "L",
    accent: "#16A34A",
  },
  {
    name: "Marco Rossi",
    role: "Lead Mentor — LLM Applications",
    bio: "Senior PM at a fintech by day, Sariro mentor by night. Marco has shipped 4 RAG apps to production and reviews every Builder project.",
    avatar: "M",
    accent: "#2563EB",
  },
  {
    name: "Priya Nair",
    role: "Lead Mentor — Computer Vision",
    bio: "ML engineer at a stealth startup. Priya wrote our evals framework and mentors the CV and Agents cohorts.",
    avatar: "P",
    accent: "#7C3AED",
  },
  {
    name: "James Chen",
    role: "Career Mentor",
    bio: "History teacher → AI engineer. James runs our career sessions and the alumni Slack. He has reviewed 1,000+ portfolios.",
    avatar: "J",
    accent: "#06B6D4",
  },
  {
    name: "Sofia Alvarez",
    role: "Community & Mentor Program",
    bio: "Built her first neural net at 16 with Sariro. Now runs our mentor program and the student-led AI ethics club.",
    avatar: "S",
    accent: "#EC4899",
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

export const COURSE_TRACKS = [
  {
    id: "ai-engineer",
    name: "AI Engineer Track",
    short: "AI Engineer",
    tagline: "From Python basics to building your own language models. A continuous 3-course path — no topic repeats.",
    accent: "blue",
    icon: "Brain",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    id: "web-developer",
    name: "Web Developer Track",
    short: "Web Developer",
    tagline: "From your first website to production-grade platforms on Docker, AWS, and Kubernetes. A continuous 3-course path.",
    accent: "green",
    icon: "Code2",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
] as const;

export const COURSES = [
  /* ============================================================
     AI ENGINEER TRACK — 3 continuous courses, no topic repeats
     ============================================================ */

  /* ---- AI Engineer · Beginner ----
     Python with AI Foundations — start from absolute zero.
     No prior Python. No prior AI. We teach programming thinking
     through the lens of AI from day one. */
  {
    id: "ai-eng-101",
    trackId: "ai-engineer",
    title: "Python with AI Foundations",
    tagline: "Start from zero. Learn Python by building AI-powered tools — no prior coding required.",
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
      "Write Python programs from scratch — variables, loops, functions, files",
      "Use AI (Claude API) as a pair-programmer to accelerate your learning",
      "Build 3 portfolio mini-projects: a calculator, a chatbot, a data analyzer",
      "Understand how AI actually works — tokens, embeddings, prompts (no math)",
    ],
    syllabus: [
      { num: "01", name: "Python from First Principles", project: "Build a CLI calculator", lessons: ["Installing Python + VS Code", "Variables, types, and operators", "Strings and string methods", "Numbers and basic math", "Input/output with input() and print()", "Comments and code readability"] },
      { num: "02", name: "Control Flow + Data Structures", project: "Build a to-do list manager", lessons: ["if/elif/else decisions", "for and while loops", "Lists and indexing", "Dictionaries and key-value data", "Tuples and sets (when to use each)", "List comprehensions"] },
      { num: "03", name: "Functions + Modules", project: "Build a reusable utility library", lessons: ["Defining functions + parameters", "Return values and scope", "Default + keyword arguments", "*args and **kwargs", "Importing standard library modules", "Writing your own module"] },
      { num: "04", name: "AI Foundations (No Math)", project: "Build a CLI chatbot with Claude", lessons: ["What AI really is (and isn't)", "Tokens, context windows, and limits", "Setting up Claude API access", "Your first API call in Python", "Prompting patterns for code", "Reading AI output critically"] },
      { num: "05", name: "Capstone — AI-Powered Data Analyzer", project: "Ship a Python tool that analyzes CSV data with AI", lessons: ["Reading CSV files with csv module", "Building a CLI with argparse", "Sending data to Claude for analysis", "Formatting AI responses for humans", "Packaging your tool with pip", "Demo day — present your tool"] },
    ],
  },

  /* ---- AI Engineer · Intermediate ----
     Beyond Python: Introduction to AI and Agents.
     Assumes Python from Course 1. Does NOT re-teach Python.
     Picks up where 101 left off and goes into AI apps + agents. */
  {
    id: "ai-eng-201",
    trackId: "ai-engineer",
    title: "Beyond Python: AI & Agents",
    tagline: "Pick up where Python left off. Build AI apps, RAG systems, and your first autonomous agents.",
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
      "Build a production RAG app with vector search and retrieval",
      "Create autonomous AI agents that use tools and reason step-by-step",
      "Ship a multi-agent system that completes real business tasks",
      "Deploy an AI app to the web with streaming responses",
    ],
    syllabus: [
      { num: "01", name: "Modern Python for AI", project: "Refactor your 101 chatbot into a proper package", lessons: ["Type hints + mypy basics", "Pydantic for data validation", "Virtual environments + uv/pip-tools", "Project structure for AI apps", "Environment variables + .env handling", "Logging instead of print()"] },
      { num: "02", name: "AI APIs + Streaming", project: "Build a streaming AI chat server", lessons: ["Claude vs OpenAI API differences", "Streaming responses with SSE", "Function calling / tool use", "Structured output (JSON mode)", "Token + cost management", "Error handling + retries"] },
      { num: "03", name: "RAG — Giving AI Knowledge", project: "Build a document Q&A app", lessons: ["Vector embeddings explained", "Pinecone / Supabase Vector setup", "Chunking strategies for documents", "Retrieval pipeline + reranking", "Context injection patterns", "Evaluating RAG quality"] },
      { num: "04", name: "LangChain + LangGraph", project: "Build a multi-step research agent", lessons: ["Chains and runnables", "Tool creation patterns", "LangGraph state machines", "Conditional edges + branching", "Human-in-the-loop checkpoints", "Persistence + memory"] },
      { num: "05", name: "Building Autonomous Agents", project: "Build an agent that completes a real task end-to-end", lessons: ["The ReAct loop", "Tool design for agents", "Agent memory (short + long-term)", "Planning + decomposition", "Self-critique + reflection", "When NOT to use agents"] },
      { num: "06", name: "Multi-Agent Systems", project: "Build a 3-agent crew that researches + writes + reviews", lessons: ["CrewAI basics", "Agent roles + goals", "Sequential vs parallel crews", "Task delegation patterns", "Output chaining between agents", "Production multi-agent orchestration"] },
      { num: "07", name: "Capstone — Ship an AI Agent Product", project: "Deploy a real AI agent product to the web", lessons: ["FastAPI agent endpoint", "Streaming UI with Next.js", "Vercel + Railway deployment", "Cost monitoring + rate limits", "User auth + conversation history", "Demo day + portfolio write-up"] },
    ],
  },

  /* ---- AI Engineer · Advanced ----
     Beyond Agents: Build SLMs and LLMs.
     Assumes Python + AI + Agents from Courses 1 + 2.
     Goes deep into training, fine-tuning, and building models. */
  {
    id: "ai-eng-301",
    trackId: "ai-engineer",
    title: "Beyond Agents: Build SLMs & LLMs",
    tagline: "Go from API consumer to model builder. Train, fine-tune, and ship your own language models.",
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
      "Build a Small Language Model (SLM) from scratch in PyTorch",
      "Fine-tune open-source LLMs (Llama, Mistral) on custom data",
      "Train custom embeddings + retrieval models",
      "Ship a production model serving endpoint with monitoring",
    ],
    syllabus: [
      { num: "01", name: "Math for ML (Just Enough)", project: "Implement gradient descent by hand", lessons: ["Linear algebra essentials", "Calculus for ML (derivatives)", "Probability + statistics basics", "Tensors and tensor operations", "Gradient descent intuition", "When to trust the math vs intuition"] },
      { num: "02", name: "PyTorch Foundations", project: "Build a neural network that classifies images", lessons: ["Tensors in PyTorch", "Autograd automatic differentiation", "nn.Module basics", "Training loops from scratch", "GPU + CUDA setup", "Debugging training issues"] },
      { num: "03", name: "Transformer Architecture", project: "Implement attention from scratch", lessons: ["Self-attention mechanism", "Multi-head attention", "Positional encodings", "Layer normalization", "Feed-forward networks", "Encoder vs decoder blocks"] },
      { num: "04", name: "Tokenizers + Training Data", project: "Build a custom BPE tokenizer", lessons: ["BPE vs WordPiece vs Unigram", "Training tokenizers with HuggingFace", "Data cleaning + deduplication", "Sampling strategies for pretraining", "Data mixing ratios", "Tokenization edge cases"] },
      { num: "05", name: "Pretraining Small Language Models", project: "Pretrain a 100M parameter SLM", lessons: ["Model sizing + architecture choices", "Pretraining objectives (MLM, CLM)", "Distributed training basics (DDP)", "Mixed precision training", "Checkpointing + resuming", "Pretraining cost + compute planning"] },
      { num: "06", name: "Fine-Tuning Open LLMs", project: "Fine-tune Llama 3 on a custom domain", lessons: ["Full fine-tuning vs LoRA vs QLoRA", "Instruction tuning datasets", "PEFT + LoRA implementation", "DPO + RLHF basics", "Evaluation harness (MMLU, HumanEval)", "Merge + publish fine-tuned models"] },
      { num: "07", name: "Custom Embeddings + Rerankers", project: "Train a domain-specific embedding model", lessons: ["Contrastive learning for embeddings", "Sentence-transformers library", "Triplet loss + mining strategies", "Training custom rerankers", "Evaluation (BEIR, MTEB benchmarks)", "Deploying embeddings as a service"] },
      { num: "08", name: "Quantization + Optimization", project: "Quantize a 7B model to run on a laptop", lessons: ["Post-training quantization (GPTQ, AWQ)", "GGUF format for CPU inference", "BitsAndBytes + 4-bit inference", "Speculative decoding", "KV cache optimization", "Benchmarking throughput + latency"] },
      { num: "09", name: "Inference Serving", project: "Deploy a model serving endpoint with vLLM", lessons: ["vLLM + PagedAttention", "TGI (Text Generation Inference)", "Triton Inference Server", "Batching strategies (continuous batching)", "Load balancing + autoscaling", "Cost optimization at scale"] },
      { num: "10", name: "Multimodal Models", project: "Fine-tune a vision-language model", lessons: ["CLIP + image embeddings", "Vision transformers (ViT)", "LLaVA architecture", "Cross-attention for multimodal", "Training data for VLMs", "Evaluating multimodal models"] },
      { num: "11", name: "RLHF + DPO + Alignment", project: "Align a model with DPO on preference data", lessons: ["Reward modeling", "PPO for RLHF", "DPO (Direct Preference Optimization)", "Constitutional AI basics", "Safety + red-teaming", "Measuring alignment quality"] },
      { num: "12", name: "Evaluation + Benchmarks", project: "Build a custom eval harness", lessons: ["LM-evaluation-harness", "Creating custom benchmarks", "LLM-as-judge patterns", "Human evaluation workflows", "Statistical significance in evals", "Preventing benchmark contamination"] },
      { num: "13", name: "Safety + Interpretability", project: "Audit a model for bias + jailbreaks", lessons: ["Adversarial prompts + jailbreaks", "Bias detection in models", "Mechanistic interpretability basics", "Probing + activation steering", "Red-teaming methodologies", "Responsible disclosure"] },
      { num: "14", name: "MLOps for LLMs", project: "Build a model training + deployment pipeline", lessons: ["Experiment tracking (W&B)", "Model registry + versioning", "CI/CD for ML pipelines", "Data versioning (DVC)", "Monitoring model drift", "A/B testing models in production"] },
      { num: "15", name: "Research Methods", project: "Read + reproduce a recent ML paper", lessons: ["Reading ArXiv papers efficiently", "Reproducing paper results", "Running ablation studies", "Writing experiment reports", "Open-source contribution workflow", "When to publish vs. ship"] },
      { num: "16", name: "Capstone — Ship Your Own Model", project: "Train, fine-tune, and deploy an original model product", lessons: ["Problem framing + dataset creation", "Model architecture decisions", "Training + evaluation loops", "Deployment + monitoring", "Marketing an open-source model", "Demo day + portfolio case study"] },
    ],
  },

  /* ============================================================
     WEB DEVELOPER TRACK — 3 continuous courses, no topic repeats
     ============================================================ */

  /* ---- Web Developer · Beginner ----
     Build Your First Website — HTML, CSS, JS basics.
     No prior coding. By the end you have a live website. */
  {
    id: "web-101",
    trackId: "web-developer",
    title: "Build Your First Website",
    tagline: "From zero to a live website in 8 weeks. HTML, CSS, JavaScript, and a real domain.",
    level: "Beginner",
    audience: "Students",
    durationWeeks: 8,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Aug 19, 2026",
    featured: true,
    accent: "green",
    outcomes: [
      "Build a responsive multi-page website with HTML + CSS",
      "Add interactivity with vanilla JavaScript",
      "Deploy to a live domain with HTTPS",
      "Use Git + GitHub for version control",
    ],
    syllabus: [
      { num: "01", name: "How the Web Works", project: "Deploy a static HTML page live", lessons: ["Browsers, servers, and HTTP", "DNS + domains explained", "HTML structure and semantics", "Headings, paragraphs, links, images", "Forms and inputs basics", "Deploying to Vercel/Netlify"] },
      { num: "02", name: "CSS + Responsive Design", project: "Build a personal portfolio page", lessons: ["Selectors + the box model", "Colors, fonts, and spacing", "Flexbox for layout", "CSS Grid for complex layouts", "Media queries + mobile-first", "Animations + transitions"] },
      { num: "03", name: "JavaScript Fundamentals", project: "Build an interactive quiz app", lessons: ["Variables, types, operators", "Functions + scope", "DOM manipulation", "Events (click, input, scroll)", "Arrays + objects", "Local storage"] },
      { num: "04", name: "Git + GitHub", project: "Push your portfolio to GitHub + deploy via CI", lessons: ["Git basics (init, add, commit)", "Branches + merging", "GitHub pull requests", "Reading + resolving merge conflicts", ".gitignore + best practices", "Auto-deploy with GitHub Actions"] },
      { num: "05", name: "Capstone — Live Website", project: "Ship a multi-page website on a custom domain", lessons: ["Planning the site structure", "Building all pages + responsive nav", "Adding interactivity + animations", "Custom domain + HTTPS setup", "SEO basics (meta tags, sitemap)", "Demo day — present your live site"] },
    ],
  },

  /* ---- Web Developer · Intermediate ----
     Beyond Frontend: Node, SQL, APIs, React.
     Assumes HTML/CSS/JS from Course 1. Does NOT re-teach them.
     Goes into backend, databases, APIs, and modern React. */
  {
    id: "web-201",
    trackId: "web-developer",
    title: "Beyond Frontend: Node, SQL, APIs & React",
    tagline: "Go from static sites to full-stack apps. Backend, databases, APIs, and modern React — no repeats.",
    level: "Intermediate",
    audience: "Students",
    durationWeeks: 12,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Sep 17, 2026",
    featured: true,
    accent: "green",
    outcomes: [
      "Build a backend API with Node.js + Express",
      "Design and query a PostgreSQL database",
      "Build modern React apps with hooks + server components",
      "Ship a full-stack app with auth, payments, and a real database",
    ],
    syllabus: [
      { num: "01", name: "Node.js + Express Backend", project: "Build a REST API for a todo app", lessons: ["Node.js runtime + npm", "Express.js basics", "Routing + middleware", "Request/response lifecycle", "Error handling patterns", "Environment variables + config"] },
      { num: "02", name: "SQL + PostgreSQL", project: "Design a database for a blog platform", lessons: ["Relational data modeling", "PostgreSQL setup", "CREATE TABLE + constraints", "SELECT, JOIN, GROUP BY", "Indexes + query optimization", "Migrations workflow"] },
      { num: "03", name: "API Design + Auth", project: "Add JWT auth + OAuth to your API", lessons: ["REST API design principles", "Status codes + error formats", "JWT authentication", "OAuth with Google/GitHub", "Rate limiting + security headers", "API versioning"] },
      { num: "04", name: "React Fundamentals", project: "Build a React frontend for your API", lessons: ["Components + JSX", "Props + state + hooks", "useEffect + data fetching", "React Router", "Forms + controlled inputs", "Conditional rendering + lists"] },
      { num: "05", name: "Next.js + Server Components", project: "Migrate your React app to Next.js", lessons: ["App Router fundamentals", "Server vs client components", "Server actions + mutations", "Streaming + Suspense", "API routes", "SEO + metadata"] },
      { num: "06", name: "Full-Stack Integration", project: "Build a SaaS-style app with auth + payments", lessons: ["Connecting frontend + backend", "Supabase auth + database", "Stripe payment integration", "Webhooks handling", "File uploads (S3/R2)", "Real-time with WebSockets"] },
      { num: "07", name: "Capstone — Ship a Full-Stack App", project: "Launch a real full-stack app with paying users", lessons: ["CI/CD pipeline setup", "Vercel + database deployment", "Error monitoring (Sentry)", "Analytics (PostHog)", "Custom domain + HTTPS", "Demo day + portfolio"] },
    ],
  },

  /* ---- Web Developer · Advanced ----
     Production Web: Docker, AWS, Kubernetes, Security.
     Assumes full-stack web from Course 2. Does NOT re-teach React/Node.
     Goes into infrastructure, scaling, and security. */
  {
    id: "web-301",
    trackId: "web-developer",
    title: "Production Web: Docker, AWS, K8s & Security",
    tagline: "Ship at scale. Containerize, deploy on AWS + Kubernetes, and lock down against real attacks.",
    level: "Advanced",
    audience: "Professionals",
    durationWeeks: 16,
    modules: 16,
    lessons: 96,
    price: 699,
    originalPrice: 2330,
    nextCohort: "Oct 14, 2026",
    featured: false,
    accent: "violet",
    outcomes: [
      "Containerize any app with Docker + multi-stage builds",
      "Deploy production workloads on AWS with Terraform",
      "Run Kubernetes clusters for orchestration + scaling",
      "Harden apps against OWASP Top 10 + supply chain attacks",
    ],
    syllabus: [
      { num: "01", name: "Docker Mastery", project: "Containerize your 201 full-stack app", lessons: ["Dockerfile writing", "Multi-stage builds", "Docker Compose for local dev", "Container networking", "Volumes + persistent data", "Image optimization + layer caching"] },
      { num: "02", name: "CI/CD Pipelines", project: "Build a zero-downtime deploy pipeline", lessons: ["GitHub Actions workflows", "Automated testing in CI", "Build artifacts + caching", "Deployment gates + approvals", "Environment management", "Rollback strategies"] },
      { num: "03", name: "AWS Fundamentals", project: "Deploy a web app on AWS EC2 + RDS", lessons: ["AWS core services overview", "IAM + security basics", "EC2 + security groups", "RDS for PostgreSQL", "S3 for static assets", "CloudFront CDN basics"] },
      { num: "04", name: "Infrastructure as Code", project: "Provision AWS infra with Terraform", lessons: ["Terraform basics + state", "AWS resources in Terraform", "Variables + outputs", "Modules + reuse", "Workspaces + environments", "Drift detection + remediation"] },
      { num: "05", name: "Kubernetes Fundamentals", project: "Deploy a 3-service app on K8s", lessons: ["Pods, Deployments, ReplicaSets", "Services + Ingress", "ConfigMaps + Secrets", "Namespaces + resource limits", "Probes (liveness + readiness)", "kubectl mastery"] },
      { num: "06", name: "Kubernetes Scaling + Helm", project: "Package your app as a Helm chart", lessons: ["HPA + VPA autoscaling", "Helm chart authoring", "Kustomize for env overlays", "StatefulSets for databases", "DaemonSets for agents", "K8s RBAC + security policies"] },
      { num: "07", name: "Monitoring + Observability", project: "Build a full observability stack", lessons: ["Prometheus metrics", "Grafana dashboards", "Loki for log aggregation", "Tempo for distributed tracing", "Alerting + on-call rotations", "SLOs + error budgets"] },
      { num: "08", name: "Web Security Fundamentals", project: "Audit your app for OWASP Top 10", lessons: ["OWASP Top 10 deep dive", "XSS + CSRF prevention", "SQL injection + parameterized queries", "CSP + CORS configuration", "Authentication security (MFA, sessions)", "Secrets management (Vault, AWS SM)"] },
      { num: "09", name: "Supply Chain Security", project: "Scan your dependencies for vulnerabilities", lessons: ["Dependency vulnerabilities (npm audit, Snyk)", "SBOM (Software Bill of Materials)", "Container image scanning (Trivy)", "Signed images + Cosign", "Pinned dependencies + Renovate", "Incident response for breaches"] },
      { num: "10", name: "Cloud Security", project: "Harden an AWS environment end-to-end", lessons: ["AWS IAM best practices", "VPC + private subnets", "Security groups + NACLs", "AWS WAF + Shield", "CloudTrail + GuardDuty", "Compliance (SOC2, ISO 27001) basics"] },
      { num: "11", name: "Performance Engineering", project: "Achieve sub-1s load times globally", lessons: ["Core Web Vitals optimization", "CDN + edge caching", "Image + font optimization", "JS bundle analysis + code splitting", "Database query optimization", "Caching strategies (Redis, CDN)"] },
      { num: "12", name: "Multi-Region + DR", project: "Design a multi-region active-active deployment", lessons: ["Multi-region database replication", "DNS failover (Route53)", "Blue-green + canary deploys", "Disaster recovery planning", "RTO + RPO targets", "Chaos engineering basics"] },
      { num: "13", name: "Cost Optimization", project: "Cut a real AWS bill by 40%", lessons: ["AWS cost explorer + tags", "Reserved + Savings Plans", "Spot instances for batch", "Right-sizing resources", "Storage tiering (S3 lifecycle)", "FinOps practices"] },
      { num: "14", name: "Edge Computing", project: "Deploy an edge-first app on Cloudflare Workers", lessons: ["Cloudflare Workers + Pages", "Vercel Edge Functions", "Edge databases (Turso, D1)", "Smart caching layers", "Geo-distributed state", "Latency optimization"] },
      { num: "15", name: "DevSecOps + Compliance", project: "Build a DevSecOps pipeline with security gates", lessons: ["Shift-left security", "SAST + DAST in CI", "Infrastructure security scanning", "Policy as code (OPA)", "Audit trails + compliance reporting", "Penetration testing coordination"] },
      { num: "16", name: "Capstone — Production Platform", project: "Build + ship a web platform that scales to 100K users", lessons: ["Architecture design from scratch", "Multi-service K8s deployment", "Full observability stack", "Security hardening + audit", "Cost optimization pass", "Demo to industry panel"] },
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
    oneOnOnePrice: 299,
    originalPrice: 398,
    period: "per cohort",
    accent: "green",
    tagline: "Start here. Zero-to-builder courses for first-time makers.",
    features: [
      "1 beginner cohort enrollment",
      "1:4 teacher-student ratio (1 teacher per 4 students)",
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
    oneOnOnePrice: 399,
    originalPrice: 854,
    period: "per cohort",
    accent: "blue",
    tagline: "Go deeper. Build real, shippable AI products with mentor feedback.",
    features: [
      "1 intermediate cohort enrollment",
      "1:4 teacher-student ratio (1 teacher per 4 students)",
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
    oneOnOnePrice: 899,
    originalPrice: 2330,
    period: "per cohort",
    accent: "violet",
    tagline: "Ship production-grade AI. For serious builders who want to lead.",
    features: [
      "1 advanced cohort enrollment",
      "1:4 teacher-student ratio (1 teacher per 4 students)",
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
