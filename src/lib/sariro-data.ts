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
  email: "hello@sariro.ai",
  phone: "+1 (415) 555-0142",
  location: "San Francisco · Remote-first · Worldwide",
};

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
  {
    id: "ai-foundations",
    title: "AI Foundations: Thinking in Systems",
    tagline: "Start here. Build the mental models that everything else rests on.",
    level: "Beginner",
    audience: "Students",
    durationWeeks: 8,
    modules: 6,
    price: 149,
    nextCohort: "Aug 12, 2026",
    featured: true,
    accent: "blue",
    outcomes: [
      "Reason about problems like an AI engineer",
      "Read and critique AI news without hype",
      "Build 3 portfolio-ready mini projects",
    ],
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering Mastery",
    tagline: "From 'vibes-based prompting' to engineered, reproducible prompts.",
    level: "Beginner",
    audience: "Professionals",
    durationWeeks: 4,
    modules: 4,
    price: 99,
    nextCohort: "Jul 22, 2026",
    featured: true,
    accent: "violet",
    outcomes: [
      "Design prompts that ship to production",
      "Build a reusable prompt library",
      "Evaluate prompts with real metrics",
    ],
  },
  {
    id: "llm-applications",
    title: "Building LLM Applications",
    tagline: "Ship a real RAG app from scratch — embeddings, retrieval, eval.",
    level: "Intermediate",
    audience: "Students",
    durationWeeks: 12,
    modules: 9,
    price: 349,
    nextCohort: "Sep 03, 2026",
    featured: true,
    accent: "green",
    outcomes: [
      "Production RAG app in your portfolio",
      "Understand vector DBs end-to-end",
      "Eval & guardrails that actually work",
    ],
  },
  {
    id: "computer-vision",
    title: "Computer Vision with PyTorch",
    tagline: "From pixels to production — train, fine-tune, and deploy CV models.",
    level: "Intermediate",
    audience: "Students",
    durationWeeks: 10,
    modules: 8,
    price: 299,
    nextCohort: "Sep 17, 2026",
    featured: false,
    accent: "amber",
    outcomes: [
      "Train a custom classifier from scratch",
      "Fine-tune YOLO for real-time detection",
      "Deploy a CV endpoint to the cloud",
    ],
  },
  {
    id: "ai-ethics",
    title: "AI Ethics & Responsible Design",
    tagline: "The course every AI builder should take before shipping anything.",
    level: "All Levels",
    audience: "Professionals",
    durationWeeks: 6,
    modules: 5,
    price: 199,
    nextCohort: "Aug 05, 2026",
    featured: false,
    accent: "blue",
    outcomes: [
      "Audit a model for bias and harm",
      "Write an AI acceptable-use policy",
      "Lead an ethics review at your org",
    ],
  },
  {
    id: "agents-automation",
    title: "AI Agents & Workflow Automation",
    tagline: "Build autonomous agents that actually complete real tasks.",
    level: "Advanced",
    audience: "Professionals",
    durationWeeks: 8,
    modules: 7,
    price: 399,
    nextCohort: "Oct 14, 2026",
    featured: false,
    accent: "cyan",
    outcomes: [
      "Multi-agent system in your portfolio",
      "Tool-use + function-calling mastery",
      "Eval harness for agent reliability",
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
    price: "From $149",
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
    id: "starter",
    name: "Starter",
    price: 149,
    period: "per cohort",
    accent: "blue",
    tagline: "Dip your toes in. Perfect for first-time builders.",
    features: [
      "1 cohort enrollment",
      "All live sessions + recordings",
      "Community access during cohort",
      "Certificate of completion",
      "1 portfolio project reviewed",
    ],
    cta: "Start with Starter",
    popular: false,
  },
  {
    id: "builder",
    name: "Builder",
    price: 349,
    period: "per cohort",
    accent: "green",
    tagline: "Go deep. Build a real, shippable AI application.",
    features: [
      "1 advanced cohort enrollment",
      "Everything in Starter, plus:",
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
    id: "school-pro",
    name: "School Pro",
    price: null,
    period: "custom",
    accent: "violet",
    tagline: "Bring AI to your entire campus — we'll design it together.",
    features: [
      "Full-semester AI curriculum",
      "Teacher training (up to 10 staff)",
      "Workshops + hackathon included",
      "Custom learning portal",
      "Quarterly impact reports",
      "Dedicated success manager",
      "CSTA / IB alignment docs",
    ],
    cta: "Talk to our team",
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

export const FOOTER_LINKS = {
  Learn: ["Courses", "Tracks", "Events", "Resources", "YouTube"],
  Company: ["About Mimo", "Blog", "Careers", "Press kit"],
  Support: ["Contact", "FAQ", "Privacy Policy", "Refund Policy"],
};
