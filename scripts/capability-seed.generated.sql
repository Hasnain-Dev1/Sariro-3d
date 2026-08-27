-- =============================================================================
-- SARIRO — Capability map seed   (GENERATED — do not edit by hand)
-- =============================================================================
-- Source:     src/lib/capabilities/taxonomy.ts
-- Regenerate: npx tsx scripts/generate-capability-seed.ts
--
-- Run scripts/capability-graph.sql first. Idempotent: re-running updates names
-- and descriptions in place and never orphans evidence, because slugs are the
-- identity and slugs never change.
--
-- 10 domains · 68 strands · 78 nodes total
-- =============================================================================

insert into public.capabilities (slug, name, kind, domain_slug, parent_slug, description, is_meta, sort_order)
values
  ('mathematics', 'Mathematics', 'domain', 'mathematics', null, 'Reason precisely about quantity, structure, change and certainty.', false, 0),
  ('number-sense', 'Number Sense', 'strand', 'mathematics', 'mathematics', 'Understand what numbers mean and feel when an answer is wrong.', false, 0),
  ('algebraic-reasoning', 'Algebraic Reasoning', 'strand', 'mathematics', 'mathematics', 'Work with the unknown, and see the general rule behind particular cases.', false, 1),
  ('geometry-and-space', 'Geometry & Space', 'strand', 'mathematics', 'mathematics', 'Reason about shape, position and space, and prove what must be true of them.', false, 2),
  ('measurement', 'Measurement', 'strand', 'mathematics', 'mathematics', 'Quantify the physical world and know how wrong your measurement might be.', false, 3),
  ('data-and-chance', 'Data & Chance', 'strand', 'mathematics', 'mathematics', 'Read data honestly, and reason about what is likely rather than what is certain.', false, 4),
  ('proof-and-logic', 'Proof & Logic', 'strand', 'mathematics', 'mathematics', 'Establish that something must be true, and spot when an argument only looks valid.', false, 5),
  ('mathematical-modelling', 'Mathematical Modelling', 'strand', 'mathematics', 'mathematics', 'Turn a messy real situation into mathematics, then interpret what comes back.', false, 6),
  ('science', 'Science', 'domain', 'science', null, 'Ask answerable questions about the world and find out, rather than assume.', false, 1),
  ('scientific-inquiry', 'Scientific Inquiry', 'strand', 'science', 'science', 'Design a fair test, control what matters, and let evidence overrule your hope.', false, 0),
  ('physics-and-motion', 'Physics & Motion', 'strand', 'science', 'science', 'Explain how things move, push, fall, heat and flow.', false, 1),
  ('matter-and-chemistry', 'Matter & Chemistry', 'strand', 'science', 'science', 'Understand what things are made of and how they change into other things.', false, 2),
  ('life-and-biology', 'Life & Biology', 'strand', 'science', 'science', 'Understand how living things work, from cells to ecosystems.', false, 3),
  ('earth-and-climate', 'Earth & Climate', 'strand', 'science', 'science', 'Understand the planet as a system, and what is happening to it.', false, 4),
  ('space-and-astronomy', 'Space & Astronomy', 'strand', 'science', 'science', 'Understand where we are, and the physics of everything further out.', false, 5),
  ('scientific-instruments', 'Instruments & Measurement', 'strand', 'science', 'science', 'Use real tools to observe what unaided senses cannot.', false, 6),
  ('technology', 'Technology', 'domain', 'technology', null, 'Instruct machines, and understand the systems the modern world runs on.', false, 2),
  ('computational-thinking', 'Computational Thinking', 'strand', 'technology', 'technology', 'Break a problem into steps precise enough for a machine to follow.', false, 0),
  ('programming-foundations', 'Programming Foundations', 'strand', 'technology', 'technology', 'Write code that works, and understand why it works.', false, 1),
  ('software-systems', 'Software Systems', 'strand', 'technology', 'technology', 'Build things larger than one file, and keep them understandable.', false, 2),
  ('data-and-databases', 'Data & Databases', 'strand', 'technology', 'technology', 'Store, query and reason about information at scale.', false, 3),
  ('artificial-intelligence', 'Artificial Intelligence', 'strand', 'technology', 'technology', 'Understand what these systems actually do, and build with them deliberately.', false, 4),
  ('networks-and-security', 'Networks & Security', 'strand', 'technology', 'technology', 'Understand how machines talk, and how that trust is broken.', false, 5),
  ('digital-craft', 'Digital Craft', 'strand', 'technology', 'technology', 'Ship real things people use — sites, apps, games, tools.', false, 6),
  ('engineering-and-making', 'Engineering & Making', 'domain', 'engineering-and-making', null, 'Design and build physical things that work under real constraints.', false, 3),
  ('design-process', 'Design Process', 'strand', 'engineering-and-making', 'engineering-and-making', 'Go from a need to a working thing, through iteration rather than luck.', false, 0),
  ('mechanisms-and-structures', 'Mechanisms & Structures', 'strand', 'engineering-and-making', 'engineering-and-making', 'Understand what holds, what moves, and what fails.', false, 1),
  ('electronics-and-circuits', 'Electronics & Circuits', 'strand', 'engineering-and-making', 'engineering-and-making', 'Make electricity do something useful and intended.', false, 2),
  ('robotics-and-control', 'Robotics & Control', 'strand', 'engineering-and-making', 'engineering-and-making', 'Give a machine senses, decisions and movement.', false, 3),
  ('materials-and-fabrication', 'Materials & Fabrication', 'strand', 'engineering-and-making', 'engineering-and-making', 'Choose the right material and actually make the part.', false, 4),
  ('systems-engineering', 'Systems Engineering', 'strand', 'engineering-and-making', 'engineering-and-making', 'Make many parts work as one thing, and find the weakest link.', false, 5),
  ('language-and-communication', 'Language & Communication', 'domain', 'language-and-communication', null, 'Understand others precisely, and be understood exactly as you intend.', false, 4),
  ('reading-and-comprehension', 'Reading & Comprehension', 'strand', 'language-and-communication', 'language-and-communication', 'Understand what you read, including what it does not say outright.', false, 0),
  ('writing-and-composition', 'Writing & Composition', 'strand', 'language-and-communication', 'language-and-communication', 'Put a thought on a page so that it survives the journey to another mind.', false, 1),
  ('speaking-and-presenting', 'Speaking & Presenting', 'strand', 'language-and-communication', 'language-and-communication', 'Hold a room and make an idea land out loud.', false, 2),
  ('listening-and-dialogue', 'Listening & Dialogue', 'strand', 'language-and-communication', 'language-and-communication', 'Hear what was actually meant, and build on it rather than wait to talk.', false, 3),
  ('language-acquisition', 'Learning a Language', 'strand', 'language-and-communication', 'language-and-communication', 'Acquire another language and think inside it.', false, 4),
  ('storytelling-and-narrative', 'Storytelling & Narrative', 'strand', 'language-and-communication', 'language-and-communication', 'Shape events into a story that holds attention and means something.', false, 5),
  ('argument-and-rhetoric', 'Argument & Rhetoric', 'strand', 'language-and-communication', 'language-and-communication', 'Make a case honestly, and recognise when one is being made on you.', false, 6),
  ('humanities', 'Humanities', 'domain', 'humanities', null, 'Understand people, societies, and how the present came to be this way.', false, 5),
  ('history-and-change', 'History & Change', 'strand', 'humanities', 'humanities', 'Understand how things came to be this way, and that they were not inevitable.', false, 0),
  ('geography-and-place', 'Geography & Place', 'strand', 'humanities', 'humanities', 'Understand where things are and why that shapes what happens there.', false, 1),
  ('civics-and-society', 'Civics & Society', 'strand', 'humanities', 'humanities', 'Understand how power, institutions and collective decisions actually work.', false, 2),
  ('philosophy-and-ethics', 'Philosophy & Ethics', 'strand', 'humanities', 'humanities', 'Examine what is true and what is right, rigorously rather than loudly.', false, 3),
  ('cultures-and-belief', 'Cultures & Belief', 'strand', 'humanities', 'humanities', 'Understand worldviews other than your own from the inside.', false, 4),
  ('law-and-justice', 'Law & Justice', 'strand', 'humanities', 'humanities', 'Understand rules, rights, and the gap between legal and fair.', false, 5),
  ('psychology-and-mind', 'Psychology & Mind', 'strand', 'humanities', 'humanities', 'Understand why people — including you — behave as they do.', false, 6),
  ('arts', 'Arts', 'domain', 'arts', null, 'Make things that move people, and develop taste worth trusting.', false, 6),
  ('visual-art-and-drawing', 'Visual Art & Drawing', 'strand', 'arts', 'arts', 'Represent what you see and what you imagine.', false, 0),
  ('design-and-composition', 'Design & Composition', 'strand', 'arts', 'arts', 'Arrange things so they work, and so the eye goes where you intend.', false, 1),
  ('music', 'Music', 'strand', 'arts', 'arts', 'Hear structure in sound, and make it yourself.', false, 2),
  ('performance-and-drama', 'Performance & Drama', 'strand', 'arts', 'arts', 'Inhabit something other than yourself in front of other people.', false, 3),
  ('film-and-photography', 'Film & Photography', 'strand', 'arts', 'arts', 'Tell the truth, or a story, with a frame and a cut.', false, 4),
  ('creative-practice', 'Creative Practice', 'strand', 'arts', 'arts', 'Keep making when inspiration is absent — the part nobody romanticises.', false, 5),
  ('business-and-economics', 'Business & Economics', 'domain', 'business-and-economics', null, 'Understand how value is created, exchanged, and lost.', false, 7),
  ('money-and-financial-literacy', 'Money & Financial Literacy', 'strand', 'business-and-economics', 'business-and-economics', 'Handle your own money with understanding rather than anxiety.', false, 0),
  ('economics', 'Economics', 'strand', 'business-and-economics', 'business-and-economics', 'Understand incentives, scarcity and trade at every scale.', false, 1),
  ('entrepreneurship', 'Entrepreneurship', 'strand', 'business-and-economics', 'business-and-economics', 'Find a real problem and build something people will pay for.', false, 2),
  ('marketing-and-audience', 'Marketing & Audience', 'strand', 'business-and-economics', 'business-and-economics', 'Understand who you are for, and reach them honestly.', false, 3),
  ('operations-and-management', 'Operations & Management', 'strand', 'business-and-economics', 'business-and-economics', 'Make work happen reliably through other people.', false, 4),
  ('product-thinking', 'Product Thinking', 'strand', 'business-and-economics', 'business-and-economics', 'Decide what to build, and — harder — what not to.', false, 5),
  ('negotiation-and-deals', 'Negotiation & Deals', 'strand', 'business-and-economics', 'business-and-economics', 'Reach agreements both sides keep.', false, 6),
  ('health-and-body', 'Health & Body', 'domain', 'health-and-body', null, 'Understand and look after the body and mind you have to live in.', false, 8),
  ('physical-literacy', 'Physical Literacy', 'strand', 'health-and-body', 'health-and-body', 'Move well, build strength, and enjoy using your body.', false, 0),
  ('nutrition-and-fuel', 'Nutrition & Fuel', 'strand', 'health-and-body', 'health-and-body', 'Understand what food does, past the marketing.', false, 1),
  ('mental-health-and-emotion', 'Mental Health & Emotion', 'strand', 'health-and-body', 'health-and-body', 'Recognise and regulate your own emotional state, and ask for help early.', false, 2),
  ('human-anatomy', 'Human Anatomy', 'strand', 'health-and-body', 'health-and-body', 'Know how the body is built and what it is doing right now.', false, 3),
  ('sleep-and-recovery', 'Sleep & Recovery', 'strand', 'health-and-body', 'health-and-body', 'Understand rest as something that makes everything else possible.', false, 4),
  ('safety-and-first-aid', 'Safety & First Aid', 'strand', 'health-and-body', 'health-and-body', 'Know what to do in the minutes before help arrives.', false, 5),
  ('learning-itself', 'Learning Itself', 'domain', 'learning-itself', null, 'The capabilities that make every other capability reachable.', true, 9),
  ('problem-solving', 'Problem Solving', 'strand', 'learning-itself', 'learning-itself', 'Make progress on a problem you have never seen before.', true, 0),
  ('critical-thinking', 'Critical Thinking', 'strand', 'learning-itself', 'learning-itself', 'Judge a claim on its evidence rather than on who made it.', true, 1),
  ('independent-learning', 'Independent Learning', 'strand', 'learning-itself', 'learning-itself', 'Teach yourself something with nobody assigning it — the end goal of Sariro.', true, 2),
  ('creativity', 'Creativity', 'strand', 'learning-itself', 'learning-itself', 'Produce something that did not exist, and know when it is good.', true, 3),
  ('focus-and-attention', 'Focus & Attention', 'strand', 'learning-itself', 'learning-itself', 'Direct your attention deliberately and hold it there.', true, 4),
  ('persistence-and-resilience', 'Persistence & Resilience', 'strand', 'learning-itself', 'learning-itself', 'Keep going after failing, and treat the failure as information.', true, 5),
  ('collaboration', 'Collaboration', 'strand', 'learning-itself', 'learning-itself', 'Make something better with other people than you would alone.', true, 6),
  ('metacognition', 'Metacognition', 'strand', 'learning-itself', 'learning-itself', 'Know what you know, what you do not, and how you personally learn best.', true, 7)
on conflict (slug) do update set
  name        = excluded.name,
  kind        = excluded.kind,
  domain_slug = excluded.domain_slug,
  parent_slug = excluded.parent_slug,
  description = excluded.description,
  is_meta     = excluded.is_meta,
  sort_order  = excluded.sort_order;

-- Anything in the table that is no longer in the authored map is reported, not
-- deleted — a stray row may already have a learner's evidence pointing at it.
do $$
declare stray_count integer;
begin
  select count(*) into stray_count
  from public.capabilities
  where slug not in ('mathematics', 'number-sense', 'algebraic-reasoning', 'geometry-and-space', 'measurement', 'data-and-chance', 'proof-and-logic', 'mathematical-modelling', 'science', 'scientific-inquiry', 'physics-and-motion', 'matter-and-chemistry', 'life-and-biology', 'earth-and-climate', 'space-and-astronomy', 'scientific-instruments', 'technology', 'computational-thinking', 'programming-foundations', 'software-systems', 'data-and-databases', 'artificial-intelligence', 'networks-and-security', 'digital-craft', 'engineering-and-making', 'design-process', 'mechanisms-and-structures', 'electronics-and-circuits', 'robotics-and-control', 'materials-and-fabrication', 'systems-engineering', 'language-and-communication', 'reading-and-comprehension', 'writing-and-composition', 'speaking-and-presenting', 'listening-and-dialogue', 'language-acquisition', 'storytelling-and-narrative', 'argument-and-rhetoric', 'humanities', 'history-and-change', 'geography-and-place', 'civics-and-society', 'philosophy-and-ethics', 'cultures-and-belief', 'law-and-justice', 'psychology-and-mind', 'arts', 'visual-art-and-drawing', 'design-and-composition', 'music', 'performance-and-drama', 'film-and-photography', 'creative-practice', 'business-and-economics', 'money-and-financial-literacy', 'economics', 'entrepreneurship', 'marketing-and-audience', 'operations-and-management', 'product-thinking', 'negotiation-and-deals', 'health-and-body', 'physical-literacy', 'nutrition-and-fuel', 'mental-health-and-emotion', 'human-anatomy', 'sleep-and-recovery', 'safety-and-first-aid', 'learning-itself', 'problem-solving', 'critical-thinking', 'independent-learning', 'creativity', 'focus-and-attention', 'persistence-and-resilience', 'collaboration', 'metacognition');

  if stray_count > 0 then
    raise notice 'Sariro: % capability rows are not in taxonomy.ts — review before deleting.', stray_count;
  end if;
end $$;
