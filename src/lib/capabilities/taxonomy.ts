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
      { slug: 'number-sense', name: 'Number Sense', description: 'Understand what numbers mean and feel when an answer is wrong.', keywords: ['counting', 'arithmetic', 'fractions', 'decimals', 'percentages', 'times tables', 'place value', 'integers'] },
      { slug: 'algebraic-reasoning', name: 'Algebraic Reasoning', description: 'Work with the unknown, and see the general rule behind particular cases.', keywords: ['algebra', 'equations', 'variables', 'quadratics', 'simultaneous equations', 'sequences', 'graphs', 'functions'] },
      { slug: 'geometry-and-space', name: 'Geometry & Space', description: 'Reason about shape, position and space, and prove what must be true of them.', keywords: ['geometry', 'shapes', 'angles', 'trigonometry', 'pythagoras', 'area', 'volume', 'coordinates', 'vectors'] },
      { slug: 'measurement', name: 'Measurement', description: 'Quantify the physical world and know how wrong your measurement might be.', keywords: ['units', 'metric', 'imperial', 'conversion', 'estimation', 'precision', 'error', 'scale'] },
      { slug: 'data-and-chance', name: 'Data & Chance', description: 'Read data honestly, and reason about what is likely rather than what is certain.', keywords: ['statistics', 'probability', 'data', 'mean', 'median', 'averages', 'charts', 'distributions', 'sampling'] },
      { slug: 'proof-and-logic', name: 'Proof & Logic', description: 'Establish that something must be true, and spot when an argument only looks valid.', keywords: ['logic', 'proof', 'reasoning', 'induction', 'set theory', 'boolean', 'truth tables'] },
      { slug: 'mathematical-modelling', name: 'Mathematical Modelling', description: 'Turn a messy real situation into mathematics, then interpret what comes back.', keywords: ['calculus', 'differentiation', 'integration', 'optimisation', 'modelling', 'applied maths', 'differential equations'] },
    ],
  },
  {
    slug: 'science',
    name: 'Science',
    description: 'Ask answerable questions about the world and find out, rather than assume.',
    strands: [
      { slug: 'scientific-inquiry', name: 'Scientific Inquiry', description: 'Design a fair test, control what matters, and let evidence overrule your hope.', keywords: ['experiment', 'hypothesis', 'scientific method', 'variables', 'lab', 'observation', 'evidence'] },
      { slug: 'physics-and-motion', name: 'Physics & Motion', description: 'Explain how things move, push, fall, heat and flow.', keywords: ['physics', 'forces', 'motion', 'energy', 'gravity', 'mechanics', 'waves', 'electricity', 'thermodynamics'] },
      { slug: 'matter-and-chemistry', name: 'Matter & Chemistry', description: 'Understand what things are made of and how they change into other things.', keywords: ['chemistry', 'atoms', 'molecules', 'elements', 'periodic table', 'reactions', 'bonding', 'acids'] },
      { slug: 'life-and-biology', name: 'Life & Biology', description: 'Understand how living things work, from cells to ecosystems.', keywords: ['biology', 'cells', 'genetics', 'dna', 'evolution', 'ecology', 'human body', 'plants', 'microbiology'] },
      { slug: 'earth-and-climate', name: 'Earth & Climate', description: 'Understand the planet as a system, and what is happening to it.', keywords: ['geology', 'weather', 'climate', 'climate change', 'oceans', 'rocks', 'environment', 'sustainability'] },
      { slug: 'space-and-astronomy', name: 'Space & Astronomy', description: 'Understand where we are, and the physics of everything further out.', keywords: ['astronomy', 'space', 'planets', 'stars', 'solar system', 'cosmology', 'astrophysics', 'orbits', 'rockets'] },
      { slug: 'scientific-instruments', name: 'Instruments & Measurement', description: 'Use real tools to observe what unaided senses cannot.', keywords: ['microscope', 'telescope', 'sensors', 'lab equipment', 'calibration', 'measurement'] },
    ],
  },
  {
    slug: 'technology',
    name: 'Technology',
    description: 'Instruct machines, and understand the systems the modern world runs on.',
    strands: [
      { slug: 'computational-thinking', name: 'Computational Thinking', description: 'Break a problem into steps precise enough for a machine to follow.', keywords: ['algorithms', 'decomposition', 'pseudocode', 'flowcharts', 'scratch', 'computer science', 'logic'] },
      { slug: 'programming-foundations', name: 'Programming Foundations', description: 'Write code that works, and understand why it works.', keywords: ['programming', 'coding', 'python', 'javascript', 'java', 'loops', 'functions', 'variables', 'syntax'] },
      { slug: 'software-systems', name: 'Software Systems', description: 'Build things larger than one file, and keep them understandable.', keywords: ['software engineering', 'architecture', 'apis', 'git', 'testing', 'react', 'frameworks', 'backend', 'frontend'] },
      { slug: 'data-and-databases', name: 'Data & Databases', description: 'Store, query and reason about information at scale.', keywords: ['sql', 'databases', 'postgres', 'data structures', 'queries', 'spreadsheets', 'data engineering', 'vectors'] },
      { slug: 'artificial-intelligence', name: 'Artificial Intelligence', description: 'Understand what these systems actually do, and build with them deliberately.', keywords: ['ai', 'machine learning', 'llm', 'chatgpt', 'agents', 'prompt engineering', 'neural networks', 'deep learning', 'rag', 'memory'] },
      { slug: 'networks-and-security', name: 'Networks & Security', description: 'Understand how machines talk, and how that trust is broken.', keywords: ['networking', 'internet', 'http', 'dns', 'cybersecurity', 'encryption', 'authentication', 'servers', 'secrets'] },
      { slug: 'digital-craft', name: 'Digital Craft', description: 'Ship real things people use — sites, apps, games, tools.', keywords: ['web development', 'websites', 'apps', 'html', 'css', 'ui', 'game development', 'mobile apps', 'deployment'] },
    ],
  },
  {
    slug: 'engineering-and-making',
    name: 'Engineering & Making',
    description: 'Design and build physical things that work under real constraints.',
    strands: [
      { slug: 'design-process', name: 'Design Process', description: 'Go from a need to a working thing, through iteration rather than luck.', keywords: ['design thinking', 'prototyping', 'iteration', 'cad', 'requirements', 'user needs'] },
      { slug: 'mechanisms-and-structures', name: 'Mechanisms & Structures', description: 'Understand what holds, what moves, and what fails.', keywords: ['mechanics', 'gears', 'levers', 'bridges', 'statics', 'load', 'stress', 'structures'] },
      { slug: 'electronics-and-circuits', name: 'Electronics & Circuits', description: 'Make electricity do something useful and intended.', keywords: ['electronics', 'circuits', 'arduino', 'breadboard', 'voltage', 'resistors', 'soldering', 'microcontrollers'] },
      { slug: 'robotics-and-control', name: 'Robotics & Control', description: 'Give a machine senses, decisions and movement.', keywords: ['robotics', 'robots', 'sensors', 'actuators', 'automation', 'control systems', 'raspberry pi', 'drones'] },
      { slug: 'materials-and-fabrication', name: 'Materials & Fabrication', description: 'Choose the right material and actually make the part.', keywords: ['materials', '3d printing', 'woodwork', 'metalwork', 'laser cutting', 'manufacturing', 'machining'] },
      { slug: 'systems-engineering', name: 'Systems Engineering', description: 'Make many parts work as one thing, and find the weakest link.', keywords: ['systems', 'integration', 'reliability', 'failure analysis', 'requirements', 'testing'] },
    ],
  },
  {
    slug: 'language-and-communication',
    name: 'Language & Communication',
    description: 'Understand others precisely, and be understood exactly as you intend.',
    strands: [
      { slug: 'reading-and-comprehension', name: 'Reading & Comprehension', description: 'Understand what you read, including what it does not say outright.', keywords: ['reading', 'comprehension', 'literacy', 'inference', 'vocabulary', 'texts', 'analysis'] },
      { slug: 'writing-and-composition', name: 'Writing & Composition', description: 'Put a thought on a page so that it survives the journey to another mind.', keywords: ['writing', 'essays', 'grammar', 'punctuation', 'editing', 'technical writing', 'copywriting'] },
      { slug: 'speaking-and-presenting', name: 'Speaking & Presenting', description: 'Hold a room and make an idea land out loud.', keywords: ['public speaking', 'presentation', 'pitching', 'speeches', 'confidence', 'voice'] },
      { slug: 'listening-and-dialogue', name: 'Listening & Dialogue', description: 'Hear what was actually meant, and build on it rather than wait to talk.', keywords: ['listening', 'conversation', 'interviewing', 'empathy', 'feedback', 'discussion'] },
      { slug: 'language-acquisition', name: 'Learning a Language', description: 'Acquire another language and think inside it.', keywords: ['english', 'spanish', 'french', 'arabic', 'urdu', 'mandarin', 'german', 'languages', 'fluency', 'grammar'] },
      { slug: 'storytelling-and-narrative', name: 'Storytelling & Narrative', description: 'Shape events into a story that holds attention and means something.', keywords: ['storytelling', 'creative writing', 'fiction', 'screenwriting', 'plot', 'character', 'narrative'] },
      { slug: 'argument-and-rhetoric', name: 'Argument & Rhetoric', description: 'Make a case honestly, and recognise when one is being made on you.', keywords: ['debate', 'argument', 'persuasion', 'rhetoric', 'fallacies', 'critical reading'] },
    ],
  },
  {
    slug: 'humanities',
    name: 'Humanities',
    description: 'Understand people, societies, and how the present came to be this way.',
    strands: [
      { slug: 'history-and-change', name: 'History & Change', description: 'Understand how things came to be this way, and that they were not inevitable.', keywords: ['history', 'ancient', 'medieval', 'modern', 'war', 'revolution', 'civilisation'] },
      { slug: 'geography-and-place', name: 'Geography & Place', description: 'Understand where things are and why that shapes what happens there.', keywords: ['geography', 'maps', 'countries', 'capitals', 'population', 'urbanisation', 'climate zones'] },
      { slug: 'civics-and-society', name: 'Civics & Society', description: 'Understand how power, institutions and collective decisions actually work.', keywords: ['government', 'democracy', 'politics', 'citizenship', 'policy', 'institutions', 'voting'] },
      { slug: 'philosophy-and-ethics', name: 'Philosophy & Ethics', description: 'Examine what is true and what is right, rigorously rather than loudly.', keywords: ['philosophy', 'ethics', 'morality', 'existentialism', 'epistemology', 'metaphysics'] },
      { slug: 'cultures-and-belief', name: 'Cultures & Belief', description: 'Understand worldviews other than your own from the inside.', keywords: ['religion', 'culture', 'anthropology', 'islam', 'christianity', 'hinduism', 'buddhism', 'traditions'] },
      { slug: 'law-and-justice', name: 'Law & Justice', description: 'Understand rules, rights, and the gap between legal and fair.', keywords: ['law', 'legal', 'rights', 'constitution', 'justice', 'courts', 'contracts'] },
      { slug: 'psychology-and-mind', name: 'Psychology & Mind', description: 'Understand why people — including you — behave as they do.', keywords: ['psychology', 'behaviour', 'cognition', 'memory', 'motivation', 'neuroscience', 'mental models'] },
    ],
  },
  {
    slug: 'arts',
    name: 'Arts',
    description: 'Make things that move people, and develop taste worth trusting.',
    strands: [
      { slug: 'visual-art-and-drawing', name: 'Visual Art & Drawing', description: 'Represent what you see and what you imagine.', keywords: ['drawing', 'painting', 'sketching', 'illustration', 'art', 'perspective', 'colour', 'anatomy'] },
      { slug: 'design-and-composition', name: 'Design & Composition', description: 'Arrange things so they work, and so the eye goes where you intend.', keywords: ['graphic design', 'layout', 'typography', 'colour theory', 'ui design', 'branding', 'figma'] },
      { slug: 'music', name: 'Music', description: 'Hear structure in sound, and make it yourself.', keywords: ['music', 'guitar', 'piano', 'singing', 'music theory', 'composition', 'production', 'rhythm'] },
      { slug: 'performance-and-drama', name: 'Performance & Drama', description: 'Inhabit something other than yourself in front of other people.', keywords: ['acting', 'theatre', 'drama', 'improvisation', 'stage', 'performance'] },
      { slug: 'film-and-photography', name: 'Film & Photography', description: 'Tell the truth, or a story, with a frame and a cut.', keywords: ['photography', 'film', 'video', 'cinematography', 'editing', 'camera', 'lighting'] },
      { slug: 'creative-practice', name: 'Creative Practice', description: 'Keep making when inspiration is absent — the part nobody romanticises.', keywords: ['creativity', 'portfolio', 'critique', 'practice', 'inspiration', 'habit'] },
    ],
  },
  {
    slug: 'business-and-economics',
    name: 'Business & Economics',
    description: 'Understand how value is created, exchanged, and lost.',
    strands: [
      { slug: 'money-and-financial-literacy', name: 'Money & Financial Literacy', description: 'Handle your own money with understanding rather than anxiety.', keywords: ['money', 'budgeting', 'saving', 'investing', 'debt', 'tax', 'personal finance', 'banking'] },
      { slug: 'economics', name: 'Economics', description: 'Understand incentives, scarcity and trade at every scale.', keywords: ['economics', 'supply and demand', 'inflation', 'markets', 'macroeconomics', 'microeconomics', 'trade'] },
      { slug: 'entrepreneurship', name: 'Entrepreneurship', description: 'Find a real problem and build something people will pay for.', keywords: ['startup', 'business', 'founder', 'mvp', 'fundraising', 'business model', 'validation'] },
      { slug: 'marketing-and-audience', name: 'Marketing & Audience', description: 'Understand who you are for, and reach them honestly.', keywords: ['marketing', 'seo', 'social media', 'branding', 'advertising', 'content', 'growth', 'audience'] },
      { slug: 'operations-and-management', name: 'Operations & Management', description: 'Make work happen reliably through other people.', keywords: ['management', 'leadership', 'teams', 'hiring', 'processes', 'project management', 'delegation'] },
      { slug: 'product-thinking', name: 'Product Thinking', description: 'Decide what to build, and — harder — what not to.', keywords: ['product management', 'roadmap', 'user research', 'prioritisation', 'mvp', 'product design'] },
      { slug: 'negotiation-and-deals', name: 'Negotiation & Deals', description: 'Reach agreements both sides keep.', keywords: ['negotiation', 'sales', 'deals', 'contracts', 'persuasion', 'pricing'] },
    ],
  },
  {
    slug: 'health-and-body',
    name: 'Health & Body',
    description: 'Understand and look after the body and mind you have to live in.',
    strands: [
      { slug: 'physical-literacy', name: 'Physical Literacy', description: 'Move well, build strength, and enjoy using your body.', keywords: ['fitness', 'exercise', 'sports', 'strength', 'running', 'flexibility', 'coordination'] },
      { slug: 'nutrition-and-fuel', name: 'Nutrition & Fuel', description: 'Understand what food does, past the marketing.', keywords: ['nutrition', 'diet', 'food', 'calories', 'protein', 'vitamins', 'healthy eating'] },
      { slug: 'mental-health-and-emotion', name: 'Mental Health & Emotion', description: 'Recognise and regulate your own emotional state, and ask for help early.', keywords: ['mental health', 'anxiety', 'stress', 'emotions', 'mindfulness', 'therapy', 'wellbeing'] },
      { slug: 'human-anatomy', name: 'Human Anatomy', description: 'Know how the body is built and what it is doing right now.', keywords: ['anatomy', 'body', 'muscles', 'bones', 'organs', 'physiology'] },
      { slug: 'sleep-and-recovery', name: 'Sleep & Recovery', description: 'Understand rest as something that makes everything else possible.', keywords: ['sleep', 'rest', 'recovery', 'circadian', 'fatigue', 'burnout'] },
      { slug: 'safety-and-first-aid', name: 'Safety & First Aid', description: 'Know what to do in the minutes before help arrives.', keywords: ['first aid', 'cpr', 'safety', 'emergency', 'injury', 'risk'] },
    ],
  },
  {
    slug: 'learning-itself',
    name: 'Learning Itself',
    description: 'The capabilities that make every other capability reachable.',
    isMeta: true,
    strands: [
      { slug: 'problem-solving', name: 'Problem Solving', description: 'Make progress on a problem you have never seen before.', keywords: ['problem solving', 'puzzles', 'strategy', 'debugging', 'troubleshooting', 'heuristics'] },
      { slug: 'critical-thinking', name: 'Critical Thinking', description: 'Judge a claim on its evidence rather than on who made it.', keywords: ['critical thinking', 'bias', 'evidence', 'fallacies', 'scepticism', 'reasoning'] },
      { slug: 'independent-learning', name: 'Independent Learning', description: 'Teach yourself something with nobody assigning it — the end goal of Sariro.', keywords: ['self study', 'study skills', 'research', 'note taking', 'learning how to learn', 'autodidact'] },
      { slug: 'creativity', name: 'Creativity', description: 'Produce something that did not exist, and know when it is good.', keywords: ['creativity', 'ideas', 'brainstorming', 'imagination', 'originality', 'innovation'] },
      { slug: 'focus-and-attention', name: 'Focus & Attention', description: 'Direct your attention deliberately and hold it there.', keywords: ['focus', 'concentration', 'attention', 'deep work', 'distraction', 'procrastination'] },
      { slug: 'persistence-and-resilience', name: 'Persistence & Resilience', description: 'Keep going after failing, and treat the failure as information.', keywords: ['resilience', 'grit', 'perseverance', 'failure', 'motivation', 'discipline'] },
      { slug: 'collaboration', name: 'Collaboration', description: 'Make something better with other people than you would alone.', keywords: ['teamwork', 'collaboration', 'pair work', 'group projects', 'conflict', 'communication'] },
      { slug: 'metacognition', name: 'Metacognition', description: 'Know what you know, what you do not, and how you personally learn best.', keywords: ['metacognition', 'reflection', 'self assessment', 'feedback', 'goal setting', 'learning styles'] },
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
