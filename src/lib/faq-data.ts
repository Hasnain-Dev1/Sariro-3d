/**
 * SARIRO — FAQ Knowledge Base (TypeScript mirror of the SQL seed)
 * Used by /api/chat for keyword-based FAQ matching (SLM preview).
 * Keep this in sync with the INSERTs in download/supabase-schema.sql.
 */

export type FaqCategory =
  | 'about'
  | 'courses'
  | 'pricing'
  | 'schools'
  | 'auth'
  | 'contact'
  | 'general';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  keywords: string[];
  priority: number; // 1-10
}

export const FAQ_KNOWLEDGE_BASE: FaqEntry[] = [
  // ===== ABOUT =====
  {
    id: 'about-what-is-sariro',
    question: 'What is Sariro?',
    answer:
      "Sariro is a live, mentor-led school founded by Mimo Patra. We teach maths, science, physics, chemistry, biology, English and coding to grades 1 to 12 — and coding at any age. Every class is live and capped at four learners, so a teacher notices the moment someone is lost. We don't sell recordings; we teach people.",
    category: 'about',
    keywords: ['sariro', 'what is sariro', 'about', 'company', 'brand', 'who', 'intro', 'explain'],
    priority: 10,
  },
  {
    id: 'about-mimo-patra',
    question: 'Who is Mimo Patra?',
    answer:
      'Mimo Patra is the founder and lead educator at Sariro. He has 12+ years of teaching experience, has mentored 5,000+ students across 65 nationalities, published 36 research papers, and filed 7 patents. Mimo leads the flagship AI Foundations cohort personally and writes most of the curriculum. His teaching philosophy: teach thinking, not just typing.',
    category: 'about',
    keywords: ['mimo', 'patra', 'founder', 'who is mimo', 'educator', 'teacher'],
    priority: 9,
  },
  {
    id: 'about-different',
    question: 'What makes Sariro different from other online classes?',
    answer:
      'Three things: (1) Cohort-based, not self-paced — our completion rate is 87% vs 4% for self-paced courses. (2) Mentor-led, not video-led — every cohort is run by a senior builder who has shipped AI to production. (3) Project-first — every module ends with something working, not a quiz. We also teach in plain language with no gatekeeping jargon.',
    category: 'about',
    keywords: ['different', 'unique', 'vs', 'compare', 'why', 'special', 'better', 'difference'],
    priority: 9,
  },
  {
    id: 'about-location',
    question: 'Where is Sariro based?',
    answer:
      'Sariro is headquartered in San Francisco, but we are remote-first and teach worldwide. Our cohorts are fully remote so students from any timezone can join. We have taught learners in 65 countries across North America, Europe, Asia, Africa, and Latin America. For school partnerships, we offer both in-person workshops and remote labs.',
    category: 'about',
    keywords: ['where', 'location', 'based', 'san francisco', 'remote', 'address', 'country', 'worldwide'],
    priority: 7,
  },
  {
    id: 'about-bootcamp',
    question: 'Is Sariro a bootcamp?',
    answer:
      'Sariro is not a traditional bootcamp. Bootcamps typically run 12+ weeks full-time, cost $10k+, and focus on broad engineering skills. Sariro runs focused 4-12 week cohorts on specific AI topics (RAG, prompt engineering, computer vision, etc.), costs $199-$699 per cohort, and is designed to fit alongside your job or studies. Think of us as specialized AI sprints, not a bootcamp replacement.',
    category: 'about',
    keywords: ['bootcamp', 'coding bootcamp', 'like', 'vs bootcamp', 'difference bootcamp'],
    priority: 6,
  },
  {
    id: 'about-philosophy',
    question: 'What is the Sariro philosophy?',
    answer:
      "Four principles shape every Sariro class: (1) Thinking over typing — we teach you to reason about problems, the typing comes naturally after. (2) Understand, do not memorise — a grade is a receipt for remembering; we teach until the reasoning holds on its own. (3) Accessible by design — plain language, no jargon, an 8-year-old and a grandpa should both follow along. (4) Community, not customers — once you're in, you're in for life with our alumni Slack.",
    category: 'about',
    keywords: ['philosophy', 'principles', 'values', 'method', 'approach', 'teaching', 'thinking'],
    priority: 8,
  },

  // ===== COURSES =====
  {
    id: 'courses-list',
    question: 'What courses does Sariro offer?',
    answer:
      'Sariro currently offers 12 cohort-based courses across 3 tiers. Beginner ($199, 5 modules, 30 lessons): AI Foundations, Web Builder Pro, Prompt Engineering, Design to Product, AI Automation Agency. Intermediate ($299, 7 modules, 42 lessons): App Builder Studio, SaaS Forge, Data Intelligence Studio, Cloud & DevOps, Game Studio AI, AI Security Engineer. Advanced ($699, 16 modules, 96 lessons): Agent Architect. Summer 2026 cohorts are open now.',
    category: 'courses',
    keywords: ['courses', 'list', 'offer', 'available', 'catalog', 'what courses', 'programs'],
    priority: 10,
  },
  {
    id: 'courses-duration',
    question: 'How long is each course?',
    answer:
      'Course lengths vary by topic: Prompt Engineering is 4 weeks (shortest), AI Ethics is 6 weeks, AI Foundations and AI Agents are 8 weeks each, Computer Vision is 10 weeks, and Building LLM Applications is 12 weeks (longest). All cohorts are live with 2 sessions per week (evenings PT). Recordings are always available if you miss a session.',
    category: 'courses',
    keywords: ['how long', 'duration', 'weeks', 'length', 'time', 'commitment', 'schedule'],
    priority: 8,
  },
  {
    id: 'courses-prerequisites',
    question: 'Do I need coding experience to enroll?',
    answer:
      "It depends on the course. Beginner courses (AI Foundations, Web Builder Pro, Prompt Engineering, Design to Product, AI Automation Agency) require ZERO coding experience — we teach from scratch. Intermediate courses (App Builder Studio, SaaS Forge, Data Intelligence Studio, Cloud & DevOps, Game Studio AI, AI Security Engineer) assume basic programming familiarity. The Advanced Agent Architect course assumes intermediate Python and AI fundamentals. If you're unsure, start with AI Foundations — it's designed for absolute beginners and gives you the mental models for everything else.",
    category: 'courses',
    keywords: ['coding', 'experience', 'beginner', 'prerequisites', 'requirements', 'skills', 'python', 'no coding'],
    priority: 9,
  },
  {
    id: 'courses-next-cohort',
    question: 'What is the next cohort start date?',
    answer:
      'Upcoming cohort start dates: Prompt Jam Workshop — Jul 22, 2026. AI Ethics — Aug 05, 2026. AI Foundations — Aug 12, 2026 (Summer cohort, 12 seats left). Building LLM Applications — Sep 03, 2026. Computer Vision — Sep 17, 2026. AI Agents & Automation — Oct 14, 2026. Cohorts fill fast — reserve your seat on the /courses page.',
    category: 'courses',
    keywords: ['next', 'cohort', 'start', 'date', 'when', 'schedule', 'upcoming', 'session'],
    priority: 8,
  },
  {
    id: 'courses-certificate',
    question: 'Will I get a certificate?',
    answer:
      "Yes. Every Sariro cohort awards a Certificate of Completion when you finish. The real value, though, is the portfolio project you ship — that's what employers actually care about. Builder-tier cohorts include 3 portfolio projects with mentor feedback, plus a career strategy session. Certificates are downloadable from your dashboard within 7 days of cohort completion.",
    category: 'courses',
    keywords: ['certificate', 'cert', 'completion', 'diploma', 'credential', 'proof', 'certificate of completion'],
    priority: 7,
  },
  {
    id: 'courses-switch-cohort',
    question: 'Can I switch cohorts if I cannot make the dates?',
    answer:
      'Yes — you can defer to the next cohort of the same course for free, as long as you request it before your original cohort starts. If you need to switch after the cohort has started, we offer one free transfer to a future cohort. Just email support@sariro.com with your enrollment details and the cohort you\'d like to move to.',
    category: 'courses',
    keywords: ['switch', 'defer', 'transfer', 'change', 'move cohort', 'reschedule', 'dates'],
    priority: 6,
  },

  // ===== PRICING =====
  {
    id: 'pricing-cost',
    question: 'How much do Sariro courses cost?',
    answer:
      'Three tiers, all in dollars: Beginner is $199 (was $398 — 50% off), Intermediate is $299 (was $854 — 65% off), and Expert is $699 (was $2,330 — 70% off). All prices are visible on the /pricing page. School packages are custom-quoted based on campus size and scope.',
    category: 'pricing',
    keywords: ['cost', 'price', 'how much', 'fee', 'tuition', 'pay', 'pricing', 'money'],
    priority: 10,
  },
  {
    id: 'pricing-scholarship',
    question: 'Do you offer scholarships?',
    answer:
      'Yes. We reserve 15% of every cohort for needs-based scholarships. To apply, email contact@sariro.com with a one-paragraph note about your situation and which course you want to take. We respond within 7 days and do not require any financial documentation — we trust you. Scholarships cover 50-100% of the course fee based on need.',
    category: 'pricing',
    keywords: ['scholarship', 'financial aid', 'free', 'discount', 'need', 'assist', 'help pay', 'cant afford'],
    priority: 9,
  },
  {
    id: 'pricing-employer',
    question: 'Can my employer pay for the course?',
    answer:
      "Absolutely. We send proper invoices and accept POs from companies. Most Builder-tier enrollments are now reimbursed through L&D budgets. After enrollment, reply to your confirmation email with your company's billing details and we'll send a custom invoice. If you need a letter justifying the course for your manager, we can provide one.",
    category: 'pricing',
    keywords: ['employer', 'company', 'reimburse', 'invoice', 'po', 'purchase order', 'work pay', 'ld budget', 'learning budget'],
    priority: 7,
  },
  {
    id: 'pricing-refund',
    question: 'What is your refund policy?',
    answer:
      '14-day money-back guarantee on every enrollment — no questions, no friction. If you start a cohort and it\'s not the right fit within the first 14 days, email support@sariro.com for a full refund. After 14 days, refunds are pro-rated based on sessions attended. School Pro packages have a separate refund clause in the contract.',
    category: 'pricing',
    keywords: ['refund', 'money back', 'cancel', 'guarantee', 'return'],
    priority: 8,
  },
  {
    id: 'pricing-hidden-fees',
    question: 'Are there any hidden fees?',
    answer:
      'No. One price covers everything: live sessions, recordings, mentor feedback, community access during the cohort, and your certificate. Higher tiers are not the same course with things withheld — Intermediate adds 1:1 mentor sessions and more project reviews, Expert adds weekly 1:1s and a capstone shipped to production. School subjects are billed by the month rather than as one course fee. We will never charge you for "premium content" or "bonus modules".',
    category: 'pricing',
    keywords: ['hidden', 'fees', 'extra', 'upsell', 'additional', 'surprise', 'transparent'],
    priority: 6,
  },

  // ===== SCHOOLS =====
  {
    id: 'schools-visit',
    question: 'Can Sariro come to my school?',
    answer:
      'Yes. We partner with schools and districts to deliver AI curriculum on campus. Options range from single workshops (1-2 days) to full-semester AI labs (12-16 weeks). We handle curriculum, teacher training, and ongoing mentor support. Email schools@sariro.com to start a conversation.',
    category: 'schools',
    keywords: ['school', 'campus', 'visit', 'partner', 'district', 'workshop', 'on site', 'class'],
    priority: 9,
  },
  {
    id: 'schools-teacher-training',
    question: 'Do you train teachers?',
    answer:
      'Yes — teacher training is included in every School Pro package. We train up to 10 of your staff on the Sariro teaching method, our curriculum framework, and how to run live AI labs. Training is 2 full days (in-person or remote) plus ongoing monthly check-ins. Many schools say the teacher training alone was worth the entire package.',
    category: 'schools',
    keywords: ['teacher', 'training', 'staff', 'faculty', 'pd', 'professional development', 'train'],
    priority: 8,
  },
  {
    id: 'schools-standards',
    question: 'Is the curriculum aligned to educational standards?',
    answer:
      "Yes. Sariro's school curriculum is aligned to CSTA (Computer Science Teachers Association) standards and IB (International Baccalaureate) framework. We provide full alignment documentation for your administration. We can also map to state-specific standards (e.g., California CS K-12) on request.",
    category: 'schools',
    keywords: ['csta', 'ib', 'standards', 'aligned', 'curriculum', 'accreditation', 'state standards'],
    priority: 7,
  },

  // ===== AUTH =====
  {
    id: 'auth-signup',
    question: 'How do I sign up?',
    answer:
      "You can sign up three ways: (1) Google One Tap — click \"Continue with Google\" on any sign-in button and you're in instantly. (2) GitHub — click \"Continue with GitHub\" if you have a GitHub account. (3) Email + password — enter your email and choose a password, then verify via the confirmation email we send. After signup, we'll ask for your name and phone number to complete your profile.",
    category: 'auth',
    keywords: ['sign up', 'register', 'create account', 'join', 'login', 'sign in', 'google', 'github'],
    priority: 10,
  },
  {
    id: 'auth-google',
    question: 'Can I sign in with Google?',
    answer:
      'Yes — Google One Tap is supported. Click any "Continue with Google" button and a Google popup will appear asking for your consent. After you approve, you\'ll be logged in instantly and your email, name, and profile photo will be fetched automatically. We\'ll still ask for your phone number to complete your profile.',
    category: 'auth',
    keywords: ['google', 'sign in with google', 'one tap', 'oauth', 'google login'],
    priority: 9,
  },
  {
    id: 'auth-reset-password',
    question: 'How do I reset my password?',
    answer:
      'On the sign-in page, click "Forgot password?" and enter your email. We\'ll send you a reset link valid for 1 hour. Click the link, choose a new password, and you\'re back in. If you signed up with Google or GitHub, you don\'t need a password — just sign in with the same provider again.',
    category: 'auth',
    keywords: ['reset', 'forgot', 'password', 'lost password', 'recover', 'locked out'],
    priority: 8,
  },

  // ===== CONTACT =====
  {
    id: 'contact-how',
    question: 'How do I contact Sariro?',
    answer:
      'Five ways: (1) contact@sariro.com — general questions. (2) support@sariro.com — already enrolled, need help. (3) dev@sariro.com — technical, integrations, OSS. (4) hr@sariro.com — careers, joining the team. (5) founder@sariro.com — partnerships, press, investor conversations. We reply to every message within 24 hours, Monday through Friday.',
    category: 'contact',
    keywords: ['contact', 'email', 'reach', 'talk', 'support', 'help', 'phone', 'message'],
    priority: 10,
  },
  {
    id: 'contact-response-time',
    question: 'What are your response times?',
    answer:
      "We reply to every message within 24 hours, Monday through Friday. Office hours are 9am-6pm Pacific Time, but we're async-friendly across timezones. Weekend messages get a Monday reply. For urgent enrollment issues (cohort starting tomorrow, etc.), mark your email subject with [URGENT] and we'll prioritize.",
    category: 'contact',
    keywords: ['response', 'time', 'reply', 'how long', 'wait', 'hours', 'office hours'],
    priority: 7,
  },
  {
    id: 'contact-call',
    question: 'Can I book a call instead of emailing?',
    answer:
      'Yes. Visit /contact and click "Book a slot" — you\'ll get a free 30-minute discovery call with our team. No pitch, just answers. Bring your questions about courses, school partnerships, or which track is right for you. Calls are scheduled in PT but we accommodate any timezone on request.',
    category: 'contact',
    keywords: ['call', 'book', 'phone call', 'discovery', 'talk to human', 'meeting', 'schedule'],
    priority: 6,
  },

  // ===== GENERAL =====
  {
    id: 'general-free',
    question: 'Is Sariro free?',
    answer:
      'Sariro is not free — cohort enrollments range from $199 to $699. However, we offer many free resources: the Sariro blog at /resources is 100% free, we run free Prompt Jam webinars regularly, the AI for Good Hackathon is free to enter, and we reserve 15% of every cohort for needs-based scholarships. If you genuinely cannot afford a cohort, email contact@sariro.com — we will work something out.',
    category: 'general',
    keywords: ['free', 'cost', 'pay', 'money', 'afford', 'free resources', 'budget'],
    priority: 8,
  },
  {
    id: 'general-certificate-recognized',
    question: 'Do you offer certificates and are they recognized?',
    answer:
      "Yes — every cohort awards a Certificate of Completion. Our certificates are recognized by employers who value project portfolios over credentials (which is most modern AI companies). The certificate alone won't get you a job, but the 3 portfolio projects you ship in a Builder-tier cohort will. We've had students land ML engineer roles at startups and FAANG companies based on their Sariro projects.",
    category: 'general',
    keywords: ['certificate', 'recognized', 'accredited', 'job', 'employment', 'value', 'certificate worth'],
    priority: 7,
  },
];

/* ---------- SLM: keyword-based FAQ matcher (preview, no LLM yet) ----------
   Returns the best-matching FAQ for a user question, or null if no match.
   Scoring: +3 for each keyword found in the question, weighted by priority.
   Threshold: score >= 3 to be considered a match. */
export function matchFaq(userQuestion: string): { entry: FaqEntry; confidence: number } | null {
  const q = userQuestion.toLowerCase().trim();
  if (!q || q.length < 2) return null;

  let bestMatch: { entry: FaqEntry; confidence: number } | null = null;
  let bestScore = 0;

  for (const entry of FAQ_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) {
        // Longer keyword matches are weighted higher (more specific)
        score += 3 + Math.min(kw.length * 0.1, 2);
      }
    }
    // Also check if the question text itself matches
    if (q.includes(entry.question.toLowerCase().split(' ').slice(0, 3).join(' '))) {
      score += 5; // strong boost if first 3 words of question match
    }
    // Multiply by priority (1-10) scaled down
    score = score * (0.5 + entry.priority * 0.05);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { entry, confidence: Math.min(score / 10, 1) };
    }
  }

  // Threshold: need at least one keyword match (score >= 3)
  return bestScore >= 3 ? bestMatch : null;
}

/* ---------- Greeting / small-talk detection (pre-LLM) ----------
   Handles "hi", "hello", "hey", "thanks" etc. without LLM call. */
export function isGreeting(message: string): boolean {
  const m = message.toLowerCase().trim();
  return /^(hi|hello|hey|yo|sup|hiya|heya|greetings|good (morning|afternoon|evening))\b/.test(m);
}

export function greetingResponse(): string {
  const responses = [
    "Hey there! 👋 I'm the Sariro assistant. Ask me anything about our courses, pricing, or how to get started. What brings you here today?",
    "Hi! Welcome to Sariro. I can help with questions about courses, enrollment, scholarships, and more. What would you like to know?",
    "Hello! I'm here to help. Try asking me 'What is Sariro?' or 'How much do courses cost?' — or anything else on your mind.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export function isThanks(message: string): boolean {
  const m = message.toLowerCase().trim();
  return /^(thanks|thank you|thx|ty|appreciate)\b/.test(m);
}

export function thanksResponse(): string {
  return "You're welcome! Anything else I can help with? If you have a specific question I didn't cover, just ask — or I can connect you with a human at contact@sariro.com.";
}

export function fallbackResponse(): string {
  return "I'm not sure I have a great answer for that yet — I'm still learning! Try asking about Sariro, our courses, pricing, scholarships, or how to contact us. For anything else, drop a note to contact@sariro.com and a human will reply within 24 hours.";
}

/* ---------- Quick replies (shown as chips in the chat panel) ---------- */
export const QUICK_REPLIES = [
  'What is Sariro?',
  'How much do courses cost?',
  'Do I need coding experience?',
  'How do I sign up?',
  'Do you offer scholarships?',
  'How do I contact you?',
];
