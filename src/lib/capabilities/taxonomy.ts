import type { CapabilityNode, Domain } from '@/lib/capabilities/types';

/**
 * SARIRO — The Capability Map (spine)
 * =========================================================
 * Ten domains, ~70 strands. Authored in code on purpose: this is the single most
 * consequential structure in the product, and it should be reviewable as a diff
 * and arguable in a pull request — not edited invisibly in a database row.
 *
 * Slugs are permanent. A learner's evidence points at them; renaming one throws
 * away that person's history. Names and descriptions can change freely.
 *
 * This is the SPINE — domains and strands only. Capabilities (the leaf level,
 * with stages and prerequisites) are added per strand as real journeys demand
 * them. An honest map that is shallow everywhere beats a deep map of one subject
 * pretending to be everything.
 */

export const DOMAINS: Domain[] = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    description: 'Reason precisely about quantity, structure, change and certainty.',
    strands: [
      { slug: 'number-sense', name: 'Number Sense', description: 'Understand what numbers mean and feel when an answer is wrong.' },
      { slug: 'algebraic-reasoning', name: 'Algebraic Reasoning', description: 'Work with the unknown, and see the general rule behind particular cases.' },
      { slug: 'geometry-and-space', name: 'Geometry & Space', description: 'Reason about shape, position and space, and prove what must be true of them.' },
      { slug: 'measurement', name: 'Measurement', description: 'Quantify the physical world and know how wrong your measurement might be.' },
      { slug: 'data-and-chance', name: 'Data & Chance', description: 'Read data honestly, and reason about what is likely rather than what is certain.' },
      { slug: 'proof-and-logic', name: 'Proof & Logic', description: 'Establish that something must be true, and spot when an argument only looks valid.' },
      { slug: 'mathematical-modelling', name: 'Mathematical Modelling', description: 'Turn a messy real situation into mathematics, then interpret what comes back.' },
    ],
  },
  {
    slug: 'science',
    name: 'Science',
    description: 'Ask answerable questions about the world and find out, rather than assume.',
    strands: [
      { slug: 'scientific-inquiry', name: 'Scientific Inquiry', description: 'Design a fair test, control what matters, and let evidence overrule your hope.' },
      { slug: 'physics-and-motion', name: 'Physics & Motion', description: 'Explain how things move, push, fall, heat and flow.' },
      { slug: 'matter-and-chemistry', name: 'Matter & Chemistry', description: 'Understand what things are made of and how they change into other things.' },
      { slug: 'life-and-biology', name: 'Life & Biology', description: 'Understand how living things work, from cells to ecosystems.' },
      { slug: 'earth-and-climate', name: 'Earth & Climate', description: 'Understand the planet as a system, and what is happening to it.' },
      { slug: 'space-and-astronomy', name: 'Space & Astronomy', description: 'Understand where we are, and the physics of everything further out.' },
      { slug: 'scientific-instruments', name: 'Instruments & Measurement', description: 'Use real tools to observe what unaided senses cannot.' },
    ],
  },
  {
    slug: 'technology',
    name: 'Technology',
    description: 'Instruct machines, and understand the systems the modern world runs on.',
    strands: [
      { slug: 'computational-thinking', name: 'Computational Thinking', description: 'Break a problem into steps precise enough for a machine to follow.' },
      { slug: 'programming-foundations', name: 'Programming Foundations', description: 'Write code that works, and understand why it works.' },
      { slug: 'software-systems', name: 'Software Systems', description: 'Build things larger than one file, and keep them understandable.' },
      { slug: 'data-and-databases', name: 'Data & Databases', description: 'Store, query and reason about information at scale.' },
      { slug: 'artificial-intelligence', name: 'Artificial Intelligence', description: 'Understand what these systems actually do, and build with them deliberately.' },
      { slug: 'networks-and-security', name: 'Networks & Security', description: 'Understand how machines talk, and how that trust is broken.' },
      { slug: 'digital-craft', name: 'Digital Craft', description: 'Ship real things people use — sites, apps, games, tools.' },
    ],
  },
  {
    slug: 'engineering-and-making',
    name: 'Engineering & Making',
    description: 'Design and build physical things that work under real constraints.',
    strands: [
      { slug: 'design-process', name: 'Design Process', description: 'Go from a need to a working thing, through iteration rather than luck.' },
      { slug: 'mechanisms-and-structures', name: 'Mechanisms & Structures', description: 'Understand what holds, what moves, and what fails.' },
      { slug: 'electronics-and-circuits', name: 'Electronics & Circuits', description: 'Make electricity do something useful and intended.' },
      { slug: 'robotics-and-control', name: 'Robotics & Control', description: 'Give a machine senses, decisions and movement.' },
      { slug: 'materials-and-fabrication', name: 'Materials & Fabrication', description: 'Choose the right material and actually make the part.' },
      { slug: 'systems-engineering', name: 'Systems Engineering', description: 'Make many parts work as one thing, and find the weakest link.' },
    ],
  },
  {
    slug: 'language-and-communication',
    name: 'Language & Communication',
    description: 'Understand others precisely, and be understood exactly as you intend.',
    strands: [
      { slug: 'reading-and-comprehension', name: 'Reading & Comprehension', description: 'Understand what you read, including what it does not say outright.' },
      { slug: 'writing-and-composition', name: 'Writing & Composition', description: 'Put a thought on a page so that it survives the journey to another mind.' },
      { slug: 'speaking-and-presenting', name: 'Speaking & Presenting', description: 'Hold a room and make an idea land out loud.' },
      { slug: 'listening-and-dialogue', name: 'Listening & Dialogue', description: 'Hear what was actually meant, and build on it rather than wait to talk.' },
      { slug: 'language-acquisition', name: 'Learning a Language', description: 'Acquire another language and think inside it.' },
      { slug: 'storytelling-and-narrative', name: 'Storytelling & Narrative', description: 'Shape events into a story that holds attention and means something.' },
      { slug: 'argument-and-rhetoric', name: 'Argument & Rhetoric', description: 'Make a case honestly, and recognise when one is being made on you.' },
    ],
  },
  {
    slug: 'humanities',
    name: 'Humanities',
    description: 'Understand people, societies, and how the present came to be this way.',
    strands: [
      { slug: 'history-and-change', name: 'History & Change', description: 'Understand how things came to be this way, and that they were not inevitable.' },
      { slug: 'geography-and-place', name: 'Geography & Place', description: 'Understand where things are and why that shapes what happens there.' },
      { slug: 'civics-and-society', name: 'Civics & Society', description: 'Understand how power, institutions and collective decisions actually work.' },
      { slug: 'philosophy-and-ethics', name: 'Philosophy & Ethics', description: 'Examine what is true and what is right, rigorously rather than loudly.' },
      { slug: 'cultures-and-belief', name: 'Cultures & Belief', description: 'Understand worldviews other than your own from the inside.' },
      { slug: 'law-and-justice', name: 'Law & Justice', description: 'Understand rules, rights, and the gap between legal and fair.' },
      { slug: 'psychology-and-mind', name: 'Psychology & Mind', description: 'Understand why people — including you — behave as they do.' },
    ],
  },
  {
    slug: 'arts',
    name: 'Arts',
    description: 'Make things that move people, and develop taste worth trusting.',
    strands: [
      { slug: 'visual-art-and-drawing', name: 'Visual Art & Drawing', description: 'Represent what you see and what you imagine.' },
      { slug: 'design-and-composition', name: 'Design & Composition', description: 'Arrange things so they work, and so the eye goes where you intend.' },
      { slug: 'music', name: 'Music', description: 'Hear structure in sound, and make it yourself.' },
      { slug: 'performance-and-drama', name: 'Performance & Drama', description: 'Inhabit something other than yourself in front of other people.' },
      { slug: 'film-and-photography', name: 'Film & Photography', description: 'Tell the truth, or a story, with a frame and a cut.' },
      { slug: 'creative-practice', name: 'Creative Practice', description: 'Keep making when inspiration is absent — the part nobody romanticises.' },
    ],
  },
  {
    slug: 'business-and-economics',
    name: 'Business & Economics',
    description: 'Understand how value is created, exchanged, and lost.',
    strands: [
      { slug: 'money-and-financial-literacy', name: 'Money & Financial Literacy', description: 'Handle your own money with understanding rather than anxiety.' },
      { slug: 'economics', name: 'Economics', description: 'Understand incentives, scarcity and trade at every scale.' },
      { slug: 'entrepreneurship', name: 'Entrepreneurship', description: 'Find a real problem and build something people will pay for.' },
      { slug: 'marketing-and-audience', name: 'Marketing & Audience', description: 'Understand who you are for, and reach them honestly.' },
      { slug: 'operations-and-management', name: 'Operations & Management', description: 'Make work happen reliably through other people.' },
      { slug: 'product-thinking', name: 'Product Thinking', description: 'Decide what to build, and — harder — what not to.' },
      { slug: 'negotiation-and-deals', name: 'Negotiation & Deals', description: 'Reach agreements both sides keep.' },
    ],
  },
  {
    slug: 'health-and-body',
    name: 'Health & Body',
    description: 'Understand and look after the body and mind you have to live in.',
    strands: [
      { slug: 'physical-literacy', name: 'Physical Literacy', description: 'Move well, build strength, and enjoy using your body.' },
      { slug: 'nutrition-and-fuel', name: 'Nutrition & Fuel', description: 'Understand what food does, past the marketing.' },
      { slug: 'mental-health-and-emotion', name: 'Mental Health & Emotion', description: 'Recognise and regulate your own emotional state, and ask for help early.' },
      { slug: 'human-anatomy', name: 'Human Anatomy', description: 'Know how the body is built and what it is doing right now.' },
      { slug: 'sleep-and-recovery', name: 'Sleep & Recovery', description: 'Understand rest as something that makes everything else possible.' },
      { slug: 'safety-and-first-aid', name: 'Safety & First Aid', description: 'Know what to do in the minutes before help arrives.' },
    ],
  },
  {
    slug: 'learning-itself',
    name: 'Learning Itself',
    description: 'The capabilities that make every other capability reachable.',
    isMeta: true,
    strands: [
      { slug: 'problem-solving', name: 'Problem Solving', description: 'Make progress on a problem you have never seen before.' },
      { slug: 'critical-thinking', name: 'Critical Thinking', description: 'Judge a claim on its evidence rather than on who made it.' },
      { slug: 'independent-learning', name: 'Independent Learning', description: 'Teach yourself something with nobody assigning it — the end goal of Sariro.' },
      { slug: 'creativity', name: 'Creativity', description: 'Produce something that did not exist, and know when it is good.' },
      { slug: 'focus-and-attention', name: 'Focus & Attention', description: 'Direct your attention deliberately and hold it there.' },
      { slug: 'persistence-and-resilience', name: 'Persistence & Resilience', description: 'Keep going after failing, and treat the failure as information.' },
      { slug: 'collaboration', name: 'Collaboration', description: 'Make something better with other people than you would alone.' },
      { slug: 'metacognition', name: 'Metacognition', description: 'Know what you know, what you do not, and how you personally learn best.' },
    ],
  },
];

/** The map flattened into the rows the database stores. */
export function flattenTaxonomy(): CapabilityNode[] {
  const out: CapabilityNode[] = [];
  DOMAINS.forEach((domain, di) => {
    out.push({
      slug: domain.slug,
      name: domain.name,
      kind: 'domain',
      domainSlug: domain.slug,
      parentSlug: null,
      description: domain.description,
      isMeta: !!domain.isMeta,
      sortOrder: di,
    });
    domain.strands.forEach((strand, si) => {
      out.push({
        slug: strand.slug,
        name: strand.name,
        kind: 'strand',
        domainSlug: domain.slug,
        parentSlug: domain.slug,
        description: strand.description,
        isMeta: !!domain.isMeta,
        sortOrder: si,
      });
    });
  });
  return out;
}

/** Duplicate slugs would silently merge two different capabilities. */
export function findDuplicateSlugs(): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const node of flattenTaxonomy()) {
    if (seen.has(node.slug)) dupes.push(node.slug);
    seen.add(node.slug);
  }
  return dupes;
}
