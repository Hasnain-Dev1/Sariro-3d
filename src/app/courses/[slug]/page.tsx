'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Clock,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  Rocket,
  ShieldCheck,
  MessageCircle,
  GraduationCap,
  BrainCircuit,
  Trophy,
  Wrench,
  Compass,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import {
  Reveal,
  SplitText,
  TiltCard,
  MagneticButton,
  CountUp,
  ParallaxOrb,
} from '@/components/brand/effects-kit';
import { COURSES, MIMO } from '@/lib/sariro-data';

type Course = (typeof COURSES)[number];

/* ---------------------------------------------------------------
   Per-course extended details — syllabus, prereqs, projects, mentor
   (The base COURSES array carries title/price/duration/outcomes;
   this map layers in the rich detail needed for a full course page.)
--------------------------------------------------------------- */
type Module = { title: string; summary: string };
type Project = { title: string; summary: string; icon: typeof Rocket };
type Mentor = {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  accent: string;
};

type CourseDetail = {
  syllabus: Module[];
  prerequisites: string[];
  projects: Project[];
  mentor: Mentor;
};

const DEFAULT_MENTOR: Mentor = {
  name: MIMO.name,
  role: MIMO.title,
  bio: MIMO.bio,
  avatar: MIMO.name.charAt(0),
  accent: '#2563EB',
};

const COURSE_DETAILS: Record<string, CourseDetail> = {
  'ai-foundations': {
    syllabus: [
      { title: 'Thinking in Systems', summary: 'Decompose problems the way ML engineers do — inputs, outputs, constraints, and failure modes.' },
      { title: 'How Models Actually Work', summary: 'A no-math tour of training, inference, and why models fail in predictable ways.' },
      { title: 'Reading AI News Critically', summary: 'Spot hype, evaluate benchmarks, and tell real progress from press releases.' },
      { title: 'Your First ML Project', summary: 'Build, train, and evaluate a tiny classifier end-to-end in a notebook.' },
      { title: 'Prompting as Engineering', summary: 'Move from vibes to reproducible prompts with templates and eval loops.' },
      { title: 'Where AI Breaks', summary: 'Bias, drift, hallucinations, and what to do when your model is confidently wrong.' },
    ],
    prerequisites: [
      'Curiosity and 5 hours per week — no prior coding required',
      'A laptop that can run a modern browser',
      'Comfort with installing software by following instructions',
    ],
    projects: [
      { title: 'AI News Autopsy', summary: 'Tear apart 3 real AI headlines and write a 1-page brief separating hype from fact.', icon: Compass },
      { title: 'Tiny Classifier', summary: 'Train a model that recognizes your own handwritten digits — and ship it as a web demo.', icon: BrainCircuit },
      { title: 'Prompt Library', summary: 'Design and evaluate a reusable prompt library for a workflow you actually use.', icon: Wrench },
    ],
    mentor: DEFAULT_MENTOR,
  },
  'prompt-engineering': {
    syllabus: [
      { title: 'From Vibes to Variables', summary: 'Replace guesswork with a structured prompting vocabulary you can reason about.' },
      { title: 'The Prompt Anatomy', summary: 'Role, context, instructions, examples, constraints — and how to combine them deliberately.' },
      { title: 'Few-Shot & Chain-of-Thought', summary: 'When demonstrations beat descriptions, and when reasoning chains pay off.' },
      { title: 'Evaluation That Sticks', summary: 'Build a scored eval harness so prompt changes are decisions, not bets.' },
    ],
    prerequisites: [
      'Comfort calling an API from a script (Python or JS)',
      'An OpenAI or Anthropic API key (~$5 of credit is plenty)',
      'A real workflow you want to improve with LLMs',
    ],
    projects: [
      { title: 'Prompt Library Repo', summary: 'A versioned, eval-scored library of 10 production prompts your team can reuse.', icon: Wrench },
      { title: 'Eval Harness', summary: 'A reproducible scoring pipeline that ranks prompt variants on your own test cases.', icon: Compass },
      { title: 'Production Hot-Swap', summary: 'A/B compare two prompt variants on a live workflow and ship the winner.', icon: Rocket },
    ],
    mentor: DEFAULT_MENTOR,
  },
  'llm-applications': {
    syllabus: [
      { title: 'LLM App Architecture', summary: 'Map the full stack: orchestration, retrieval, evals, observability, guardrails.' },
      { title: 'Embeddings & Vector Stores', summary: 'Choose the right embedding model and index for your data shape and budget.' },
      { title: 'Retrieval That Works', summary: 'Chunking, hybrid search, reranking, and the failure modes nobody warns you about.' },
      { title: 'RAG End-to-End', summary: 'Wire retrieval → prompt → response → citation in a real, working app.' },
      { title: 'Evals & Guardrails', summary: 'Detect hallucinations, PII leaks, and drift before your users do.' },
      { title: 'Cost & Latency', summary: 'Cache, route, and batch your way to a bill you can defend at standup.' },
      { title: 'Observability', summary: 'Trace every request so a regression is a 5-minute fix, not a 5-day incident.' },
      { title: 'Production Deployment', summary: 'Ship to a real URL with auth, rate limits, and a graceful degradation plan.' },
      { title: 'Capstone Showcase', summary: 'Present your app to a panel of senior builders for live, honest feedback.' },
    ],
    prerequisites: [
      'Comfortable writing Python (functions, classes, basic async)',
      'Completed AI Foundations or equivalent first project',
      'An OpenAI or Anthropic API key (~$20 of credit)',
      'Familiarity with git and the command line',
    ],
    projects: [
      { title: 'RAG Knowledge Base', summary: 'A production RAG app over your own documents — with citations and eval scores.', icon: BrainCircuit },
      { title: 'Eval Harness', summary: 'A scored eval pipeline that catches hallucinations before users do.', icon: ShieldCheck },
      { title: 'Deployed Endpoint', summary: 'Your app live on a real URL with auth, rate limits, and observability.', icon: Rocket },
    ],
    mentor: DEFAULT_MENTOR,
  },
  'computer-vision': {
    syllabus: [
      { title: 'Pixels to Tensors', summary: 'How images become numbers a model can learn from — and the choices that matter.' },
      { title: 'CNNs From Scratch', summary: 'Build, train, and debug a small convnet on a real dataset, no copy-paste.' },
      { title: 'Transfer Learning', summary: 'Fine-tune a pretrained model on your own data with reproducible results.' },
      { title: 'Object Detection', summary: 'Train and deploy a YOLO model for real-time detection on video.' },
      { title: 'Data Pipelines', summary: 'Augmentation, labeling, and the data work that determines model quality.' },
      { title: 'Deployment', summary: 'Wrap your model in an API and serve it on the cloud without melting your wallet.' },
      { title: 'Evaluation & Bias', summary: 'Measure what your model actually does — across classes, contexts, and edge cases.' },
      { title: 'Capstone', summary: 'Ship a CV app that solves a real problem and defend every design choice.' },
    ],
    prerequisites: [
      'Intermediate Python and basic PyTorch or TensorFlow',
      'A GPU (Colab free tier is fine) for training exercises',
      'Familiarity with numpy arrays and image formats',
    ],
    projects: [
      { title: 'Custom Classifier', summary: 'Train a classifier on a dataset you care about — from scratch.', icon: BrainCircuit },
      { title: 'YOLO Detector', summary: 'Fine-tune a real-time object detector for a custom domain.', icon: Wrench },
      { title: 'CV Endpoint', summary: 'Deploy your model as an API a frontend can actually call.', icon: Rocket },
    ],
    mentor: DEFAULT_MENTOR,
  },
  'ai-ethics': {
    syllabus: [
      { title: 'Why Ethics Ships', summary: 'The business, legal, and moral case for designing AI responsibly from day one.' },
      { title: 'Bias Audits', summary: 'Run a real audit on a real model — and read the results without flinching.' },
      { title: 'Harm Taxonomies', summary: 'A shared vocabulary for the harms AI can cause, from discrimination to dependency.' },
      { title: 'Acceptable Use Policies', summary: 'Draft a policy your org can actually enforce — not just sign and forget.' },
      { title: 'Ethics Reviews in Practice', summary: 'Run an ethics review meeting end-to-end on a real product decision.' },
    ],
    prerequisites: [
      'No technical prerequisites — open to all roles',
      'A current or upcoming AI project you can reference (work, school, or personal)',
      'Willingness to engage with uncomfortable case studies',
    ],
    projects: [
      { title: 'Bias Audit Report', summary: 'A written audit of a real model with findings, severity scores, and remediation.', icon: ShieldCheck },
      { title: 'Acceptable Use Policy', summary: 'A draft AUP tailored to your org, ready to circulate for sign-off.', icon: Compass },
      { title: 'Ethics Review Runbook', summary: 'A facilitator guide for running ethics reviews on your own product decisions.', icon: Wrench },
    ],
    mentor: DEFAULT_MENTOR,
  },
  'agents-automation': {
    syllabus: [
      { title: 'Agent Architecture', summary: 'Reasoning loops, tool use, memory, and the building blocks of autonomous agents.' },
      { title: 'Tool Use & Function Calling', summary: 'Give your agent real capabilities — APIs, code execution, and structured outputs.' },
      { title: 'Multi-Agent Systems', summary: 'Coordinate specialist agents that collaborate, critique, and verify each other.' },
      { title: 'Memory & State', summary: 'Short-term, long-term, and episodic memory patterns that survive across runs.' },
      { title: 'Reliability Patterns', summary: 'Retries, fallbacks, human-in-the-loop, and the brakes that make agents trustworthy.' },
      { title: 'Eval Harness for Agents', summary: 'Score agent runs on real tasks so improvement is measurable, not vibes.' },
      { title: 'Capstone Deployment', summary: 'Ship a multi-agent system that completes a real workflow end-to-end.' },
    ],
    prerequisites: [
      'Strong Python — async, classes, and error handling',
      'Comfort with LLM APIs and prompting patterns',
      'A real workflow you want to automate (the messier, the better)',
    ],
    projects: [
      { title: 'Tool-Using Agent', summary: 'An agent that calls 3+ real tools to complete a multi-step task reliably.', icon: Wrench },
      { title: 'Multi-Agent System', summary: 'A team of specialist agents that collaborate on a real workflow.', icon: BrainCircuit },
      { title: 'Agent Eval Harness', summary: 'A scoring pipeline that ranks agent versions on reliability and cost.', icon: ShieldCheck },
    ],
    mentor: DEFAULT_MENTOR,
  },
};

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};

/* ---------------------------------------------------------------
   Not-found state
--------------------------------------------------------------- */
function CourseNotFound({ slug }: { slug: string }) {
  return (
    <BrandLayout>
      <section className="relative min-h-[80vh] flex items-center justify-center py-24 overflow-hidden">
        <ParallaxOrb color="rgba(239, 68, 68, 0.08)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-lg mx-auto px-4 text-center">
          <Reveal>
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Compass className="w-8 h-8 text-slate-400" strokeWidth={2.2} />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              Course not found
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-slate-600 mb-2">
              We could not find a course matching
              <code className="mx-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-sm font-mono">
                {slug || '(empty)'}
              </code>
              in our catalog.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-sm text-slate-500 mb-8">
              It may have been retired, renamed, or the link may have a typo. Browse the full catalog to find your next cohort.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <Link href="/courses" className="btn-tactile btn-tactile-primary px-6 py-3.5">
              <ArrowLeft className="w-4 h-4" />
              Back to all courses
            </Link>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}

/* ---------------------------------------------------------------
   Main page
--------------------------------------------------------------- */
export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

  // SEO: set document title client-side
  useEffect(() => {
    const course = COURSES.find((c) => c.id === slug);
    if (course) {
      document.title = `${course.title} — Sariro | AI Cohort Details`;
    } else {
      document.title = 'Course — Sariro | AI Cohort Details';
    }
  }, [slug]);

  const course: Course | undefined = useMemo(
    () => COURSES.find((c) => c.id === slug),
    [slug]
  );

  if (!course) {
    return <CourseNotFound slug={slug} />;
  }

  const accent = ACCENT_HEX[course.accent] ?? '#2563EB';
  const detail = COURSE_DETAILS[course.id];
  const syllabus = detail?.syllabus ?? defaultSyllabus(course);
  const prerequisites = detail?.prerequisites ?? defaultPrerequisites(course);
  const projects = detail?.projects ?? defaultProjects(course);
  const mentor = detail?.mentor ?? DEFAULT_MENTOR;
  const related = COURSES.filter((c) => c.id !== course.id).slice(0, 3);

  // Split title for gradient emphasis on the subtitle portion (e.g. "AI Foundations: Thinking in Systems")
  const [titleMain, ...titleRest] = course.title.split(':');
  const titleSuffix = titleRest.length ? titleRest.join(':').trim() : 'cohort.';

  return (
    <BrandLayout>
      {/* ============ HERO ============ */}
      <PageHero
        eyebrow={`${course.audience} · ${course.level}`}
        accentColor={accent}
        breadcrumb={`Courses > ${course.title}`}
        variant="courses"
        title={
          <>
            {titleMain.trim()}
            {titleRest.length > 0 ? ':' : ''}
            {titleRest.length > 0 ? <br /> : ' '}
            <span className="gradient-text">{titleSuffix}</span>
          </>
        }
        subtitle={course.tagline}
      >
        <a href="#enroll" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm" style={{ background: accent, boxShadow: `0 10px 0 -1px ${accent}99, 0 18px 30px -12px ${accent}88` }}>
          <Sparkles className="w-4 h-4" />
          Enroll now
        </a>
        <Link href="/contact" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <MessageCircle className="w-4 h-4" />
          Talk to us
        </Link>
      </PageHero>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============ MAIN BODY: 2-column ============ */}
      <section className="relative py-12 sm:py-16 bg-slate-50 overflow-hidden">
        <ParallaxOrb color={`${accent}1A`} size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.06)" size={320} speed={-70} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* LEFT: syllabus + outcomes + prerequisites */}
            <div className="lg:col-span-2 space-y-8">
              {/* Syllabus */}
              <Reveal>
                <div className="card-3d p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${accent}15`, color: accent }}
                    >
                      <LayoutGrid className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2
                        className="text-xl font-extrabold text-slate-900"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        Full syllabus
                      </h2>
                      <p className="text-sm text-slate-500">
                        {course.modules} modules · {course.durationWeeks} weeks · live + recorded
                      </p>
                    </div>
                  </div>

                  <ol className="relative space-y-3">
                    {/* Vertical timeline line */}
                    <span
                      className="absolute left-[19px] top-2 bottom-2 w-0.5 opacity-20"
                      style={{ background: accent }}
                      aria-hidden
                    />
                    {syllabus.map((m, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex items-start gap-4 pl-0"
                      >
                        <span
                          className="relative z-10 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm"
                          style={{
                            background: `${accent}15`,
                            color: accent,
                            fontFamily: 'var(--font-jakarta)',
                            border: `2px solid #fff`,
                            boxShadow: `0 0 0 1px ${accent}30`,
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 pt-1">
                          <h3
                            className="text-base font-bold text-slate-900 leading-snug"
                            style={{ fontFamily: 'var(--font-jakarta)' }}
                          >
                            {m.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed mt-1">{m.summary}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </div>
              </Reveal>

              {/* Outcomes */}
              <Reveal delay={0.05}>
                <div className="card-3d p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${accent}15`, color: accent }}
                    >
                      <Trophy className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2
                        className="text-xl font-extrabold text-slate-900"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        What you'll walk out with
                      </h2>
                      <p className="text-sm text-slate-500">The abilities you'll have on Monday after cohort ends.</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {course.outcomes.map((o, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: accent }} />
                        <span className="text-sm sm:text-base text-slate-700 leading-relaxed">{o}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              {/* Prerequisites */}
              <Reveal delay={0.05}>
                <div className="card-3d p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${accent}15`, color: accent }}
                    >
                      <ShieldCheck className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2
                        className="text-xl font-extrabold text-slate-900"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        Before you start
                      </h2>
                      <p className="text-sm text-slate-500">What you'll need on day one to keep up.</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {prerequisites.map((p, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="flex items-start gap-3"
                      >
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full mt-0.5 flex items-center justify-center text-[10px] font-bold"
                          style={{ background: `${accent}15`, color: accent }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm sm:text-base text-slate-700 leading-relaxed">{p}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: sticky enrollment card */}
            <div className="lg:col-span-1">
              <div id="enroll" className="lg:sticky lg:top-24">
                <Reveal>
                  <TiltCard className="rounded-3xl" maxTilt={4} glare={false}>
                    <div
                      className="relative rounded-3xl p-6 sm:p-7 text-white overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${accent} 0%, #0F172A 100%)`,
                        boxShadow: '0 20px 40px -16px rgba(15, 23, 42, 0.4)',
                      }}
                    >
                      {/* Decorative grid */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                          backgroundSize: '24px 24px',
                        }}
                      />
                      <div className="relative">
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm mb-4"
                          style={{ fontFamily: 'var(--font-grotesk)' }}
                        >
                          <Sparkles className="w-3 h-3" />
                          Enrollment open
                        </span>

                        <div className="mb-5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                            Tuition
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className="text-4xl sm:text-5xl font-extrabold"
                              style={{ fontFamily: 'var(--font-jakarta)' }}
                            >
                              $<CountUp value={course.price} duration={1.6} />
                            </span>
                            <span className="text-sm text-white/70">USD · one-time</span>
                          </div>
                          <p className="text-xs text-white/60 mt-1">Includes everything. No upsells, ever.</p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-6">
                          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-center">
                            <CalendarDays className="w-4 h-4 mx-auto mb-1 opacity-80" />
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>
                              Next cohort
                            </div>
                            <div className="text-xs font-bold text-white mt-0.5">{course.nextCohort}</div>
                          </div>
                          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-center">
                            <Clock className="w-4 h-4 mx-auto mb-1 opacity-80" />
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>
                              Duration
                            </div>
                            <div className="text-xs font-bold text-white mt-0.5">
                              <CountUp value={course.durationWeeks} duration={1.4} /> wks
                            </div>
                          </div>
                          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 text-center">
                            <LayoutGrid className="w-4 h-4 mx-auto mb-1 opacity-80" />
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>
                              Modules
                            </div>
                            <div className="text-xs font-bold text-white mt-0.5">
                              <CountUp value={course.modules} duration={1.4} />
                            </div>
                          </div>
                        </div>

                        {/* CTAs */}
                        <Link
                          href="/contact"
                          className="btn-tactile w-full justify-center px-5 py-3.5 text-sm text-white"
                          style={{ background: '#FFFFFF', color: accent, boxShadow: '0 10px 0 -1px rgba(15,23,42,0.15), 0 18px 30px -12px rgba(255,255,255,0.25)' }}
                        >
                          <Sparkles className="w-4 h-4" />
                          Enroll now
                          <ArrowRight className="w-4 h-4" />
                        </Link>

                        <MagneticButton
                          as="a"
                          href="/contact"
                          strength={0.2}
                          className="btn-tactile mt-3 w-full justify-center px-5 py-3 text-sm text-white bg-white/10 backdrop-blur-sm hover:bg-white/20"
                        >
                          <span className="inline-flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Talk to us first
                          </span>
                        </MagneticButton>

                        <p className="text-[11px] text-white/60 text-center mt-4 leading-relaxed">
                          14-day money-back guarantee · Scholarships available · Lifetime community access
                        </p>
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ============ WHAT YOU'LL BUILD ============ */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color={`${accent}1A`} size={380} speed={90} position="top-20 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}
            >
              The portfolio
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="What you'll build" highlight="you'll build" highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                Every Sariro course ends with real, shipped artifacts you can show an employer, a client, or yourself. Here are the three you'll leave with.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={i} delay={i * 0.1}>
                  <TiltCard className="h-full" maxTilt={6}>
                    <div className="card-3d p-6 h-full flex flex-col">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `${accent}15`, color: accent }}
                      >
                        <Icon className="w-6 h-6" strokeWidth={2.2} />
                      </div>
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        Project {String(i + 1).padStart(2, '0')}
                      </div>
                      <h3
                        className="text-lg font-extrabold text-slate-900 mb-2"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {p.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{p.summary}</p>
                      <div
                        className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold"
                        style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        Reviewed by your mentor
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============ WHO TEACHES THIS ============ */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color={`${accent}1A`} size={400} speed={100} position="top-10 right-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}
            >
              Your mentor
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Who teaches this" highlight="teaches this" highlightClassName="gradient-text" />
            </h2>
          </div>

          <Reveal>
            <TiltCard className="rounded-3xl" maxTilt={4} glare={false}>
              <div className="card-3d p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                      style={{ background: mentor.accent }}
                    />
                    <div
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${mentor.accent}, #0F172A)`,
                        fontFamily: 'var(--font-jakarta)',
                        boxShadow: `0 16px 32px -12px ${mentor.accent}66`,
                      }}
                    >
                      {mentor.avatar}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="flex-1">
                    <h3
                      className="text-xl sm:text-2xl font-extrabold text-slate-900"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {mentor.name}
                    </h3>
                    <div
                      className="text-xs font-bold uppercase tracking-wider mb-3 mt-1"
                      style={{ color: mentor.accent, fontFamily: 'var(--font-grotesk)' }}
                    >
                      {mentor.role}
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {mentor.bio}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-5">
                      {MIMO.numbers.slice(0, 4).map((n) => (
                        <div key={n.label} className="text-center">
                          <div
                            className="text-lg font-extrabold"
                            style={{ color: mentor.accent, fontFamily: 'var(--font-jakarta)' }}
                          >
                            {n.value}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                            {n.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="sm:self-end">
                    <Link
                      href="/about"
                      className="btn-tactile btn-tactile-light px-4 py-2.5 text-xs whitespace-nowrap"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      Full bio
                    </Link>
                  </div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ============ RELATED COURSES ============ */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={360} speed={80} position="top-20 -left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}
              >
                Keep going
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="Related courses" highlight="Related" highlightClassName="gradient-text" />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-3 text-slate-600">
                  Other cohorts that pair well with this one — or that you might prefer depending on where you are in your journey.
                </p>
              </Reveal>
            </div>
            <Link href="/courses" className="btn-tactile btn-tactile-light px-5 py-3 text-sm self-start sm:self-auto">
              <LayoutGrid className="w-4 h-4" />
              All courses
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((c, i) => {
              const cAccent = ACCENT_HEX[c.accent] ?? '#2563EB';
              return (
                <Reveal key={c.id} delay={i * 0.1}>
                  <TiltCard className="h-full" maxTilt={6}>
                    <Link href={`/courses/${c.id}`} className="block h-full">
                      <div className="card-3d p-6 h-full flex flex-col group hover:-translate-y-1 transition-transform">
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
                            style={{ background: `${cAccent}15`, color: cAccent, fontFamily: 'var(--font-grotesk)' }}
                          >
                            {c.audience}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                            {c.level}
                          </span>
                        </div>
                        <h3
                          className="text-lg font-extrabold text-slate-900 leading-tight mb-2"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {c.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">{c.tagline}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                              From
                            </span>
                            <div
                              className="text-xl font-extrabold"
                              style={{ color: cAccent, fontFamily: 'var(--font-jakarta)' }}
                            >
                              ${c.price}
                            </div>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold"
                            style={{ color: cAccent, fontFamily: 'var(--font-grotesk)' }}
                          >
                            View
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ BOTTOM CTA ============ */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color={`${accent}26`} size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text={`Ready to build ${course.title.split(':')[0]}?`} highlight="Ready" highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              The next cohort starts <span className="font-bold text-slate-900">{course.nextCohort}</span>. Spots are limited to 40 students so everyone gets real mentor attention — don't wait until the last week.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="btn-tactile px-6 py-3.5 text-white"
                style={{ background: accent, boxShadow: `0 10px 0 -1px ${accent}99, 0 18px 30px -12px ${accent}88` }}
              >
                <Sparkles className="w-4 h-4" />
                Reserve my spot
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="btn-tactile btn-tactile-light px-6 py-3.5">
                See pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}

/* ---------------------------------------------------------------
   Fallback generators (only used if a course lacks a details entry)
--------------------------------------------------------------- */
function defaultSyllabus(course: Course): Module[] {
  return Array.from({ length: course.modules }).map((_, i) => ({
    title: `Module ${String(i + 1).padStart(2, '0')}`,
    summary: `A live, mentored session covering a core concept of ${course.title}, with a build-along exercise and Q&A.`,
  }));
}

function defaultPrerequisites(_course: Course): string[] {
  return [
    'Curiosity and 5 hours per week',
    'A laptop with a modern browser',
    'Willingness to ask questions and ship real projects',
  ];
}

function defaultProjects(course: Course): Project[] {
  return [
    { title: 'Foundations Project', summary: `Apply the core concepts of ${course.title} to a small, shippable artifact.`, icon: BrainCircuit },
    { title: 'Applied Build', summary: 'A second, more ambitious project that builds on the foundations and ships to a real URL.', icon: Wrench },
    { title: 'Capstone', summary: 'A final project reviewed by a senior mentor, ready for your portfolio and resume.', icon: Rocket },
  ];
}
