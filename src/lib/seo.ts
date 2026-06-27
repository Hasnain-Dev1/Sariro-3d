import type { Metadata } from 'next';

const BASE = {
  title: 'Sariro — AI & Technology Education',
  description: 'Teaching the future. We teach thinking, not just coding. Cohort-based AI courses, school workshops, and free learning resources.',
  url: 'https://sariro.com',
};

export const PAGE_META: Record<string, Metadata> = {
  home: {
    title: 'Sariro — Teaching the Future. We Teach Thinking, Not Just Coding.',
    description: 'AI education that builds real builders, not copy-paste coders. Live cohorts, real mentors, real projects. 5,000+ students across 65 countries.',
    openGraph: {
      title: 'Sariro — Teaching the Future',
      description: 'We teach thinking, not just coding. Cohort-based AI courses by educator Mimo Patra.',
      url: BASE.url,
      siteName: 'Sariro',
      type: 'website',
    },
  },
  courses: {
    title: 'Courses — Sariro | AI Cohort-Based Learning',
    description: '8 cohort-based AI courses: AI Foundations, Prompt Engineering, LLM Applications, Computer Vision, AI Ethics, AI Agents, and more. Live, mentored, project-first.',
    openGraph: {
      title: 'Sariro Courses — Build Real AI Skills',
      description: 'No video dumps. No copy-paste tutorials. Every Sariro cohort is live, mentored, and ends with a shipped artifact.',
      url: `${BASE.url}/courses`,
    },
  },
  schools: {
    title: 'Schools — Sariro | Bring AI to Your Campus',
    description: 'Workshops, hackathons, and full-semester AI curriculum aligned to CSTA & IB standards. Teacher training included. In-person or remote.',
    openGraph: {
      title: 'Sariro for Schools — AI Literacy for Every Student',
      description: 'From single workshops to full AI labs. Aligned to CSTA & IB standards.',
      url: `${BASE.url}/schools`,
    },
  },
  events: {
    title: 'Events — Sariro | Cohorts, Hackathons & Workshops',
    description: 'Upcoming AI cohorts, hackathons, and live workshops. Show up, build something, meet your people.',
    openGraph: {
      title: 'Sariro Events — Build Something Real',
      description: 'Cohorts, hackathons, and live workshops designed to leave you with something real.',
      url: `${BASE.url}/events`,
    },
  },
  pricing: {
    title: 'Pricing — Sariro | Simple, Honest, No Surprises',
    description: 'Three tiers: Starter $149, Builder $349, School Pro (custom). 14-day money-back guarantee. Lifetime community access included.',
    openGraph: {
      title: 'Sariro Pricing — One Price. No Surprises.',
      description: 'Every tier includes lifetime community access + a real portfolio project reviewed by a senior builder.',
      url: `${BASE.url}/pricing`,
    },
  },
  about: {
    title: 'About — Sariro | Meet Founder & CEO Mimo Patra',
    description: 'Mimo Patra, Founder & CEO. 12+ years teaching, 5,000+ students, 36 papers, 7 patents. Sariro is his bet that teaching thinking changes everything.',
    openGraph: {
      title: 'About Sariro — Meet the Founder & CEO',
      description: 'An educator who refused to teach the easy way. Meet Mimo Patra and the team behind Sariro.',
      url: `${BASE.url}/about`,
    },
  },
  story: {
    title: 'Story — Sariro | How a Question Became a Movement',
    description: 'Why do smart students graduate unable to build anything real? The story of how that question became Sariro — five chapters, one transformation.',
    openGraph: {
      title: 'The Sariro Story — From Question to Movement',
      description: 'Five chapters. One transformation. The story of how refusing to teach the easy way became a movement.',
      url: `${BASE.url}/story`,
    },
  },
  resources: {
    title: 'Resources — Sariro | Free AI Learning Materials',
    description: 'Papers, blog posts, and downloads. Free AI learning resources from the Sariro team. Open knowledge for curious builders.',
    openGraph: {
      title: 'Sariro Resources — Free AI Learning Materials',
      description: 'Papers, blog posts, and downloads. Open knowledge for curious builders.',
      url: `${BASE.url}/resources`,
    },
  },
  contact: {
    title: 'Contact — Sariro | Get in Touch',
    description: 'Questions about courses, partnerships, careers, or tech? Email contact@sariro.com, support@sariro.com, hr@sariro.com, founder@sariro.com, or dev@sariro.com.',
    openGraph: {
      title: 'Contact Sariro — We Reply Within 24 Hours',
      description: 'General, support, careers, dev, or direct to the founder. 5 email channels. UTC hours.',
      url: `${BASE.url}/contact`,
    },
  },
};

export const FAQ_META: Metadata = {
  title: 'FAQ — Sariro | Frequently Asked Questions',
  description: 'Answers to common questions about Sariro courses, pricing, scholarships, refunds, prerequisites, and more.',
  openGraph: {
    title: 'Sariro FAQ — Frequently Asked Questions',
    description: 'Everything you need to know before joining a Sariro cohort.',
    url: `${BASE.url}/faq`,
  },
};

export const COURSE_DETAIL_META: Metadata = {
  title: 'Course — Sariro | AI Cohort Details',
  description: 'Full course syllabus, modules, outcomes, and enrollment details for this Sariro AI cohort.',
};
