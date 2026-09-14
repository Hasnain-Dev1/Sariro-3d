import type { Playbook, Tool } from './types';
import { close, opening, EXPERIENCE } from './shared';

const phet = (label: string, slug: string): Tool => ({ label: `PhET: ${label}`, href: `https://phet.colorado.edu/en/simulations/${slug}` });

/* ════════════════════════════════════════════════════════════════════════════
   Science (combined, grades 1–6)
   ════════════════════════════════════════════════════════════════════════════ */

export const sciencePlaybook: Playbook = {
  subject: 'science',
  title: 'Science',
  promise: 'They leave having predicted, tested and explained something — thinking like a scientist, not memorising like a student.',
  intake: {
    experience: EXPERIENCE('Finds science confusing', 'Enjoys it at school', 'Asks “why” about everything'),
    interests: [
      { id: 'animals', label: 'Animals', emoji: '🐾' },
      { id: 'plants', label: 'Plants & nature', emoji: '🌱' },
      { id: 'space', label: 'Space', emoji: '🌍' },
      { id: 'experiments', label: 'Experiments', emoji: '🧪' },
      { id: 'body', label: 'The human body', emoji: '🫀' },
    ],
    warmUps: [
      { q: 'You drop a coin and a feather in a room with no air at all. Which lands first?', options: ['The coin', 'The feather', 'They land together'], answer: 2, explain: 'Without air pushing back, everything falls at the same speed. Astronauts tested it on the Moon with a hammer and a feather.' },
      { q: 'What do plants need from the air to make their food?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen'], answer: 1, explain: 'Plants take in carbon dioxide and, with sunlight and water, make sugar — and give out the oxygen we breathe.' },
      { q: 'Why do we see the Moon change shape during a month?', options: ['Clouds cover parts of it', 'We see different parts lit by the Sun', 'It really changes shape'], answer: 1, explain: 'The Moon is always a ball. We see more or less of its sunlit half as it goes around the Earth.', bands: ['primary'] },
      { q: 'Which of these is a living thing?', options: ['A rock', 'A mushroom', 'A cloud'], answer: 1, explain: 'A mushroom grows, needs food and makes more mushrooms. That is what living things do.', bands: ['foundation'] },
    ],
  },
  opening: opening('Ask: “If you could be any animal for a day, which, and why?” Their answer tells you what excites them and how they reason.', ['Ask the parent to keep a glass of water, a spoon and a few small objects nearby — several paths use them.']),
  diagnose: [
    {
      ask: '“Why do you think ice floats on water?” (or, for younger children: “Why do leaves fall in autumn?”)',
      listenFor: [
        { answer: 'No idea, or “because it is light”', means: 'new' },
        { answer: 'A partly right reason from school', means: 'some' },
        { answer: 'A reason plus “I think… because…”, or asks a question back', means: 'strong' },
      ],
    },
    {
      ask: '“How could we find out if you are right?”',
      listenFor: [
        { answer: '“Look it up” or “ask someone”', means: 'new' },
        { answer: 'Suggests trying it', means: 'some' },
        { answer: 'Suggests a fair test — change one thing, keep the rest the same', means: 'strong' },
      ],
    },
  ],
  paths: [
    {
      id: 'sink-float',
      name: 'Sink or float?',
      forWho: 'Younger children who love hands-on experiments.',
      levels: ['new', 'some'],
      bands: ['foundation', 'primary'],
      interests: ['experiments'],
      win: 'I predicted which things float, tested them, and found the real reason.',
      steps: [
        { minutes: 4, title: 'Predict', do: ['Gather 6 objects at home: coin, apple, key, plastic lid, grape, ball of foil.', 'The child sorts them into “will float / will sink” and says why.'], check: 'Every prediction has a reason, even a wrong one.' },
        { minutes: 6, title: 'Test', do: ['Drop each in a bowl of water. Tick or cross each prediction together.'], say: 'A wrong prediction is the most useful thing in science — it means we are about to learn something.' },
        { minutes: 6, title: 'Explain and twist', do: ['Squash the foil into a tight ball — does it still float? Flatten it into a boat.', 'Lead to: it is not just weight, it is how much water it pushes away.'] },
      ],
      ifStuck: ['Only three objects and one clear idea: “heavy for its size sinks”.'],
      ifFlying: ['Salt water: does the grape float now? Why do ships float?', 'Design a foil boat that holds the most coins.'],
      showOff: 'The child challenges the parent to predict one object, then explains the result.',
    },
    {
      id: 'animal-detectives',
      name: 'Animal detectives',
      forWho: 'Children who love animals and sorting things.',
      levels: ['new', 'some'],
      bands: ['foundation', 'primary'],
      interests: ['animals'],
      win: 'I sorted animals like a real scientist and built a food chain.',
      steps: [
        { minutes: 5, title: 'Sort them', do: ['Show 12 animal pictures. The child sorts them however they like, then explains the groups.', 'Introduce scientists’ groups: mammals, birds, fish, reptiles, insects.'] },
        { minutes: 6, title: 'Odd ones out', do: ['Bats, penguins, whales, spiders: which group, and what tricked us?'], check: 'They use a feature (fur, feathers, gills) to justify each one.' },
        { minutes: 5, title: 'Who eats whom', do: ['Build a food chain: grass → grasshopper → frog → snake → eagle. What happens if the frogs disappear?'] },
      ],
      ifStuck: ['Only two groups: animals with backbones and without.'],
      ifFlying: ['Food webs with many arrows. Adaptations: why does a polar bear have black skin?'],
      showOff: 'The child quizzes the parent: “Is a whale a fish?” and explains the answer.',
    },
    {
      id: 'plant-lab',
      name: 'Why plants lean to the light',
      forWho: 'Children who like nature and are ready to design their own experiment.',
      levels: ['some', 'strong'],
      bands: ['primary'],
      interests: ['plants', 'experiments'],
      win: 'I designed a fair test that a real scientist would accept.',
      steps: [
        { minutes: 5, title: 'The puzzle', do: ['Show a photo of a plant leaning towards a window. Ask: why? Collect every idea.'] },
        { minutes: 6, title: 'What a plant needs', do: ['Photosynthesis in words a child would use: light + water + air → food. Draw it.'] },
        { minutes: 6, title: 'Design the test', do: ['Two identical plants, one in a box with a hole. What do we keep the same? What do we change? What do we measure?'], check: 'They name at least two things to keep the same.' },
      ],
      ifStuck: ['Skip the design; predict what happens to a plant in a dark cupboard and why.'],
      ifFlying: ['Coloured light: would a plant grow under red light? Under green?', 'Why are leaves green — what colour do they NOT use?'],
      showOff: 'The child explains their experiment plan to the parent, who agrees to run it at home.',
    },
    {
      id: 'body-machine',
      name: 'Your body is a machine',
      forWho: 'Active children curious about the human body.',
      levels: ['some', 'strong'],
      bands: ['primary', 'foundation'],
      interests: ['body'],
      win: 'I measured my own heart, changed it, and explained why.',
      steps: [
        { minutes: 4, title: 'Find your pulse', do: ['Show them how to find a pulse on the wrist or neck. Count for 15 seconds, multiply by 4.'] },
        { minutes: 5, title: 'Change it', do: ['30 seconds of star jumps. Count again. Then again after 1 minute of rest.'], check: 'Three numbers recorded in a table.' },
        { minutes: 7, title: 'Why', do: ['Muscles need oxygen → blood carries it → heart pumps faster. Draw the loop: heart → muscles → lungs → heart.', 'Make a quick bar graph of their three numbers.'] },
      ],
      ifStuck: ['Only the before/after pulse and one sentence of why.'],
      ifFlying: ['Why does breathing speed up too? What is recovery time and why do athletes have a lower resting pulse?'],
      showOff: 'The parent does the star jumps; the child measures and explains the parent’s heart.',
    },
    {
      id: 'space-scale',
      name: 'How big is space, really?',
      forWho: 'Space-lovers ready for scale and models.',
      levels: ['new', 'some', 'strong'],
      bands: ['primary', 'foundation'],
      interests: ['space'],
      win: 'I built a model of the Earth and Moon to the right size and distance.',
      tools: [{ label: 'NASA Solar System', href: 'https://science.nasa.gov/solar-system/' }],
      steps: [
        { minutes: 4, title: 'Guess the gap', do: ['If Earth is a football, how big is the Moon, and how far away? Let them guess with objects.'] },
        { minutes: 6, title: 'Build it', do: ['Earth = football, Moon = tennis ball, distance = about 30 football widths. Measure it out at home or draw it.'], say: 'Nearly everybody puts the Moon far too close. Scientists did too, for a long time.' },
        { minutes: 6, title: 'Day and night', do: ['A torch is the Sun, their fist is the Earth. Turn slowly — where is it day? Why do we have seasons? (Tilt.)'] },
      ],
      ifStuck: ['Only day and night with the torch.'],
      ifFlying: ['How long light takes from the Sun (8 minutes) — what does that mean when we look at it?', 'Phases of the Moon with a ball and a lamp.'],
      showOff: 'The child shows the parent the Earth–Moon model and asks them to guess the distance first.',
    },
  ],
  close: close('The child explains one thing they found out today to the parent, starting with “I predicted… but…”.'),
  parentTalk: {
    new: 'Science felt confusing, but today they predicted, tested and explained — and got excited when a prediction was wrong. The course builds that habit so school science stops being facts to memorise.',
    some: 'They enjoy science and already know a lot of the words. Today they started asking how we know — the course turns that into real experiments and explanations.',
    strong: 'They think like a scientist already: fair tests and good questions. They need challenge beyond the syllabus — the course would give them investigations and ideas from higher grades.',
  },
  avoid: ['Lecturing facts. Every fact should arrive as the answer to a question they asked.', 'Skipping the prediction — it is the whole point.', 'Experiments that need things the family does not have. Always have a drawing fallback.'],
};

/* ════════════════════════════════════════════════════════════════════════════
   Physics (grades 7–12)
   ════════════════════════════════════════════════════════════════════════════ */

export const physicsPlaybook: Playbook = {
  subject: 'physics',
  title: 'Physics',
  promise: 'They leave seeing a formula as a description of something real they can picture — not a string of letters to memorise.',
  intake: {
    experience: EXPERIENCE('Finds physics hard', 'Managing at school', 'Loves it, wants more'),
    interests: [
      { id: 'cars', label: 'Cars & speed', emoji: '🏎️' },
      { id: 'space', label: 'Space & rockets', emoji: '🚀' },
      { id: 'electricity', label: 'Electricity & gadgets', emoji: '⚡' },
      { id: 'sport', label: 'Sport', emoji: '🏏' },
      { id: 'how', label: 'How things work', emoji: '⚙️' },
    ],
    warmUps: [
      { q: 'A car goes 120 km in 2 hours. What is its average speed?', options: ['60 km/h', '120 km/h', '240 km/h'], answer: 0, explain: 'Speed = distance ÷ time = 120 ÷ 2 = 60 km/h.' },
      { q: 'You push a heavy box and it does not move. Is there a force on it?', options: ['No — it did not move', 'Yes — your push, balanced by friction', 'Only gravity'], answer: 1, explain: 'Forces can balance. No movement means the forces cancel, not that there are none.' },
      { q: 'On the Moon, your mass is… ', options: ['Less', 'The same', 'More'], answer: 1, explain: 'Mass is how much of you there is. Your WEIGHT is less, because the Moon pulls less.' },
      { q: 'A ball is thrown straight up. At the very top, its speed is…', options: ['Zero', 'Maximum', 'The same as when thrown'], answer: 0, explain: 'For an instant it stops before falling back — but gravity is still pulling on it.', bands: ['senior', 'adult'] },
    ],
  },
  opening: opening('Ask: “What is something that moves that you find cool?” — a bike, a rocket, a cricket ball. That object becomes the example for the whole class.'),
  diagnose: [
    { ask: '“What is the difference between mass and weight?”', listenFor: [{ answer: 'Thinks they are the same', means: 'new' }, { answer: 'Knows weight is a force, mass is amount', means: 'some' }, { answer: 'Gives W = mg and an example on another planet', means: 'strong' }] },
    { ask: 'Show a distance–time graph with a flat section. “What is happening here?”', listenFor: [{ answer: 'Unsure, or “moving at constant speed”', means: 'new' }, { answer: '“Stopped”', means: 'some' }, { answer: '“Stopped — the gradient is speed, and it is zero”', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'walk-the-graph', name: 'Walk the graph', forWho: 'Students who find motion graphs abstract.', levels: ['new', 'some'], bands: ['middle'], interests: ['cars', 'sport'],
      win: 'I can read a motion graph and act it out — and draw one for any journey.',
      steps: [
        { minutes: 5, title: 'Act it', do: ['They walk toward and away from their camera while you sketch distance against time live.'] },
        { minutes: 6, title: 'Predict the shape', do: ['Describe four walks (slow away, fast away, standing still, coming back). They sketch each graph before you draw it.'], check: 'Two correct predictions in a row.' },
        { minutes: 6, title: 'Story to graph', do: ['“Walk to school, stop at a shop, run the rest.” They draw it; gradient = speed.'] },
      ],
      ifStuck: ['Only two shapes: straight line (steady) and flat (stopped).'],
      ifFlying: ['Velocity–time graphs: area under the line is distance.', 'Acceleration from the gradient.'],
      showOff: 'The parent describes a journey; the child draws the graph for it.',
    },
    {
      id: 'newton-sport', name: 'Newton at the cricket pitch', forWho: 'Sport lovers ready for forces and F = ma.', levels: ['some'], bands: ['middle', 'senior'], interests: ['sport', 'cars'],
      win: 'I explained why a fielder pulls their hands back when catching — with physics.',
      steps: [
        { minutes: 5, title: 'Three laws, three moments', do: ['A ball at rest, a ball hit, a batter pushed back. Match each to a law.'] },
        { minutes: 6, title: 'F = ma with numbers', do: ['Same bat force on a tennis ball vs a cricket ball — which accelerates more and by how much?'] },
        { minutes: 6, title: 'The catch', do: ['Why pull hands back? Longer stopping time → smaller force. Let them reason to it.'], check: 'They say “more time, less force” in their own words.' },
      ],
      ifStuck: ['Only the first law with everyday examples (seatbelts).'],
      ifFlying: ['Momentum and impulse: F × t = change in momentum. Airbags and helmets.'],
      showOff: 'The child throws a soft ball to the parent twice — catch stiff, catch soft — and explains.',
    },
    {
      id: 'circuits', name: 'Build a circuit', forWho: 'Gadget-lovers new to electricity.', levels: ['new', 'some'], bands: ['middle', 'senior'], interests: ['electricity', 'how'],
      win: 'I built series and parallel circuits and worked out why house lights are wired in parallel.',
      tools: [phet('Circuit Construction Kit', 'circuit-construction-kit-dc')],
      steps: [
        { minutes: 5, title: 'Light one bulb', do: ['Battery, wire, bulb. What makes it a complete circuit?'] },
        { minutes: 6, title: 'Two bulbs, two ways', do: ['Series then parallel. Predict brightness first. Remove one bulb in each — what happens?'], check: 'They predict the parallel case correctly on the second try.' },
        { minutes: 6, title: 'Your house', do: ['If one light breaks, the rest stay on — so which wiring? Add an ammeter and read current.'] },
      ],
      ifStuck: ['Only series, and what “complete circuit” means.'],
      ifFlying: ['V = IR with the voltmeter. Why do bulbs in series dim?'],
      showOff: 'The child shares the simulation and explains to the parent why fairy lights go out together.',
    },
    {
      id: 'projectile', name: 'Why the ball curves down', forWho: 'Strong senior students ready to calculate.', levels: ['some', 'strong'], bands: ['senior', 'adult'], interests: ['sport', 'space'],
      win: 'I predicted where a projectile lands, then checked it in a simulation.',
      tools: [phet('Projectile Motion', 'projectile-motion')],
      steps: [
        { minutes: 5, title: 'Two motions at once', do: ['Horizontal steady, vertical accelerating. Drop one ball and throw another sideways — which lands first?'] },
        { minutes: 7, title: 'Calculate', do: ['Launch at 20 m/s, 45°. Components, time of flight, range. They do the maths.'], check: 'Their range is within 5% of the simulation.' },
        { minutes: 5, title: 'Best angle', do: ['Which angle gives the longest range? Why is it not 45° for a real cricket ball? (air resistance, launch height)'] },
      ],
      ifStuck: ['Horizontal launch only (no angle).'],
      ifFlying: ['Derive range = v² sin2θ / g. Why sin2θ peaks at 45°.'],
      showOff: 'The parent picks a launch angle; the child predicts the range before the simulation runs.',
    },
    {
      id: 'mars-weight', name: 'Weigh yourself on Mars', forWho: 'Space lovers of any level — a great first physics class.', levels: ['new', 'some'], bands: ['middle', 'senior'], interests: ['space'],
      win: 'I calculated my weight on four planets and explained why mass stays the same.',
      steps: [
        { minutes: 4, title: 'Mass vs weight', do: ['Their mass in kg stays with them. Weight = mass × g.'] },
        { minutes: 7, title: 'Planet tour', do: ['g on Earth 9.8, Moon 1.6, Mars 3.7, Jupiter 24.8. Calculate their weight on each (in newtons).'], check: 'Four correct answers with units.' },
        { minutes: 6, title: 'Why g changes', do: ['Bigger planet, stronger pull — but also distance from the centre. Why could you jump higher on Mars?'] },
      ],
      ifStuck: ['Only Earth and Moon, with a calculator.'],
      ifFlying: ['Newton’s law of gravitation: calculate g on Mars from its mass and radius.'],
      showOff: 'The child tells the parent their weight on Jupiter — and why they would not be any fatter.',
    },
  ],
  close: close('The child explains one formula from today to the parent using the object they chose at the start.'),
  parentTalk: {
    new: 'Physics felt like formulas; today they saw what the formulas describe and used one correctly. The course starts from pictures and experiments so the maths makes sense.',
    some: 'They manage the school work and picked up the ideas quickly once they could see them in a simulation. The course builds genuine understanding ahead of exams.',
    strong: 'They are ahead — calculating and checking against simulations. The course would stretch them with harder problems and topics from the next grades.',
  },
  avoid: ['Writing a formula before the idea is clear.', 'Forgetting units — insist on them from the first answer.', 'Letting the simulation do the thinking: always predict first.'],
};

/* ════════════════════════════════════════════════════════════════════════════
   Chemistry (grades 7–12)
   ════════════════════════════════════════════════════════════════════════════ */

export const chemistryPlaybook: Playbook = {
  subject: 'chemistry',
  title: 'Chemistry',
  promise: 'They leave able to picture the particles behind something they see every day — and to predict what will happen next.',
  intake: {
    experience: EXPERIENCE('Finds chemistry confusing', 'Doing fine at school', 'Ahead, wants a challenge'),
    interests: [
      { id: 'cooking', label: 'Cooking & food', emoji: '🍳' },
      { id: 'colours', label: 'Colours & reactions', emoji: '🎨' },
      { id: 'medicine', label: 'Medicine', emoji: '💊' },
      { id: 'environment', label: 'Environment', emoji: '🌍' },
      { id: 'explosions', label: 'Explosions (safely)', emoji: '💥' },
    ],
    warmUps: [
      { q: 'When sugar dissolves in tea, where does the sugar go?', options: ['It disappears', 'It spreads out between the water particles', 'It turns into water'], answer: 1, explain: 'The sugar is still there — that is why the tea tastes sweet. Its particles are spread through the water.' },
      { q: 'What is the chemical formula of water?', options: ['HO₂', 'H₂O', 'H₂O₂'], answer: 1, explain: 'Two hydrogen atoms and one oxygen. H₂O₂ is hydrogen peroxide — very different!' },
      { q: 'Lemon juice is…', options: ['An acid', 'A base (alkali)', 'Neutral'], answer: 0, explain: 'Sour tastes usually mean acids. Soap and baking soda are bases.' },
      { q: 'Balance it: H₂ + O₂ → H₂O. How many H₂O?', options: ['1', '2', '3'], answer: 1, explain: '2H₂ + O₂ → 2H₂O: four H and two O on each side.', bands: ['senior', 'adult'] },
    ],
  },
  opening: opening('Ask: “What happens in your kitchen that you think might be chemistry?” Cooking, cleaning, rust — use their example throughout.'),
  diagnose: [
    { ask: '“What is the difference between an atom and a molecule?”', listenFor: [{ answer: 'Unsure', means: 'new' }, { answer: 'Molecule = atoms joined', means: 'some' }, { answer: 'Gives examples (O₂, H₂O) and mentions bonds', means: 'strong' }] },
    { ask: '“Is melting ice a chemical change? Why?”', listenFor: [{ answer: 'Yes, or unsure', means: 'new' }, { answer: 'No — it is still water', means: 'some' }, { answer: 'No — no new substance, only particle arrangement changes; contrasts with burning', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'particles', name: 'Why ice melts', forWho: 'Students new to the particle model.', levels: ['new'], bands: ['middle'], interests: ['cooking'],
      win: 'I can explain melting, boiling and dissolving by drawing what the particles do.',
      tools: [phet('States of Matter', 'states-of-matter-basics')],
      steps: [
        { minutes: 5, title: 'Be the particles', do: ['Solid: arms locked, vibrating. Liquid: sliding past. Gas: flying about. They act it out on camera.'] },
        { minutes: 6, title: 'Heat it up', do: ['States of Matter simulation: add heat to ice, watch. Predict what happens at 100 °C.'], check: 'They explain melting as particles gaining energy to break free.' },
        { minutes: 6, title: 'Kitchen puzzles', do: ['Why does a cold glass get wet outside? Why does perfume spread across a room?'] },
      ],
      ifStuck: ['Only solid/liquid/gas drawings and the ice example.'],
      ifFlying: ['Why does salt melt ice on roads? Why does water boil at lower temperature on a mountain?'],
      showOff: 'The child draws the particles in ice, water and steam for the parent and explains the changes.',
    },
    {
      id: 'cabbage-ph', name: 'The red cabbage colour test', forWho: 'Students who love colours and hands-on reactions.', levels: ['new', 'some'], bands: ['middle'], interests: ['colours', 'cooking'],
      win: 'I made my own acid–base indicator and predicted the colour of household liquids.',
      steps: [
        { minutes: 4, title: 'Acids and bases', do: ['Sour vs soapy. Sort household items the child names into guesses.'] },
        { minutes: 8, title: 'The indicator', do: ['If they have red cabbage: chop, soak in hot water, strain (with a parent). Otherwise show photos/video of the colours.', 'Add lemon juice (pink), water (purple), baking soda (green-blue).'], check: 'They predict at least one colour correctly before it happens.' },
        { minutes: 5, title: 'The pH scale', do: ['Place each liquid on a 0–14 scale. Neutralisation: add baking soda to the lemon mix — what happens?'] },
      ],
      ifStuck: ['Photos only, and just acid vs base.'],
      ifFlying: ['Why antacids work. Write the word equation for neutralisation.'],
      showOff: 'The parent picks a liquid; the child predicts its colour and explains why.',
    },
    {
      id: 'build-atom', name: 'Build an atom', forWho: 'Students ready for atomic structure.', levels: ['some'], bands: ['middle', 'senior'], interests: ['colours', 'medicine', 'explosions'],
      win: 'I built atoms and ions and can read an element’s square on the periodic table.',
      tools: [phet('Build an Atom', 'build-an-atom')],
      steps: [
        { minutes: 5, title: 'Protons decide', do: ['Build hydrogen, helium, carbon. What changes the element? (protons)'] },
        { minutes: 6, title: 'Charge and mass', do: ['Add an electron — ion. Add a neutron — isotope. They predict the label before the sim shows it.'], check: 'Correctly name one ion and one isotope.' },
        { minutes: 6, title: 'The periodic table', do: ['Read sodium’s square. Why is sodium explosive in water but table salt is safe to eat?'] },
      ],
      ifStuck: ['Only protons, neutrons, electrons and where they live.'],
      ifFlying: ['Electron shells and why group 1 metals react so violently.'],
      showOff: 'The parent picks an element number; the child builds it and names its particles.',
    },
    {
      id: 'balancing', name: 'Balancing equations as a puzzle', forWho: 'Senior students who find equations tedious.', levels: ['some', 'strong'], bands: ['senior', 'adult'], interests: ['explosions', 'environment'],
      win: 'I can balance equations quickly and explain why atoms must balance.',
      tools: [phet('Balancing Chemical Equations', 'balancing-chemical-equations')],
      steps: [
        { minutes: 4, title: 'Atoms are never lost', do: ['Lego idea: take a model apart and rebuild — same bricks. That is conservation of mass.'] },
        { minutes: 7, title: 'Puzzle ladder', do: ['Four equations, rising difficulty: H₂ + O₂, CH₄ burning, rusting of iron, a double displacement.'], check: 'They balance the third without help.' },
        { minutes: 6, title: 'Real stakes', do: ['Burning a litre of petrol makes more than 2 kg of CO₂ — how can gas weigh more than the fuel? (oxygen from the air)'] },
      ],
      ifStuck: ['Only the first two, with atom-counting tables.'],
      ifFlying: ['Moles: how many grams of water from 4 g of hydrogen?'],
      showOff: 'The child balances an equation the parent picks from a list, explaining each step.',
    },
    {
      id: 'reaction-rates', name: 'Make it faster', forWho: 'Strong students ready to design experiments.', levels: ['strong'], bands: ['senior', 'adult'], interests: ['cooking', 'environment', 'medicine'],
      win: 'I explained reaction rates with collision theory and designed a fair experiment.',
      tools: [phet('Reactions & Rates', 'reactions-and-rates')],
      steps: [
        { minutes: 5, title: 'Everyday rates', do: ['Why do we keep food in the fridge? Why does crushed tablet dissolve faster?'] },
        { minutes: 6, title: 'Collision theory', do: ['Simulation: temperature, concentration, surface area. Predict each change.'] },
        { minutes: 6, title: 'Design it', do: ['Plan an experiment on antacid tablets and water temperature: variables, measurements, a table, a graph shape.'], check: 'Independent, dependent and controlled variables all named.' },
      ],
      ifStuck: ['Only temperature and one clear explanation.'],
      ifFlying: ['Catalysts and activation energy diagrams. Enzymes in the body.'],
      showOff: 'The child explains to the parent why the fridge slows reactions, using collision theory.',
    },
  ],
  close: close('The child explains one everyday thing — from their kitchen example — at particle level to the parent.'),
  parentTalk: {
    new: 'Chemistry felt abstract, but once they could see the particles it clicked. The course builds from pictures to equations so nothing is memorised without meaning.',
    some: 'They are keeping up at school and understood the why behind today’s topic quickly. The course deepens that so the harder grades feel familiar.',
    strong: 'They are ahead — balancing and reasoning with confidence. They need harder problems and experiment design, which the course provides.',
  },
  avoid: ['Anything unsafe at home — only kitchen-safe liquids, always with a parent.', 'Symbols before the idea.', 'Talking through a simulation instead of asking for predictions.'],
};

/* ════════════════════════════════════════════════════════════════════════════
   Biology (grades 7–12)
   ════════════════════════════════════════════════════════════════════════════ */

export const biologyPlaybook: Playbook = {
  subject: 'biology',
  title: 'Biology',
  promise: 'They leave seeing living things as systems that make sense — and able to explain one to someone else.',
  intake: {
    experience: EXPERIENCE('Finds biology a lot to memorise', 'Doing fine at school', 'Ahead, wants depth'),
    interests: [
      { id: 'animals', label: 'Animals', emoji: '🐾' },
      { id: 'body', label: 'Human body & health', emoji: '🫀' },
      { id: 'microbes', label: 'Germs & microbes', emoji: '🦠' },
      { id: 'plants', label: 'Plants & ecosystems', emoji: '🌿' },
      { id: 'genetics', label: 'Genetics & DNA', emoji: '🧬' },
    ],
    warmUps: [
      { q: 'What is the basic unit of all living things?', options: ['The atom', 'The cell', 'The organ'], answer: 1, explain: 'Every living thing is made of cells — from bacteria (one cell) to you (about 37 trillion).' },
      { q: 'Where in the body is most food digested and absorbed?', options: ['Stomach', 'Small intestine', 'Large intestine'], answer: 1, explain: 'The stomach starts the job; the small intestine does most of the digesting and absorbing.' },
      { q: 'Antibiotics work against…', options: ['Viruses', 'Bacteria', 'Both'], answer: 1, explain: 'Antibiotics kill bacteria. They do nothing to a virus like a cold — which is why doctors do not give them for colds.' },
      { q: 'Brown eyes (B) are dominant over blue (b). A Bb parent and a bb parent: chance of a blue-eyed child?', options: ['25%', '50%', '75%'], answer: 1, explain: 'Bb × bb gives Bb, Bb, bb, bb — half blue.', bands: ['senior', 'adult'] },
    ],
  },
  opening: opening('Ask: “What is the most amazing thing a living thing can do, in your opinion?” Their answer picks the path.'),
  diagnose: [
    { ask: '“What is inside a cell, and what does each part do?”', listenFor: [{ answer: 'Knows “nucleus” only', means: 'new' }, { answer: 'Names several parts with roles', means: 'some' }, { answer: 'Compares plant and animal cells, links structure to function', means: 'strong' }] },
    { ask: '“Why do you get out of breath when you run?”', listenFor: [{ answer: '“Because you are tired”', means: 'new' }, { answer: 'Muscles need more oxygen', means: 'some' }, { answer: 'Respiration, oxygen debt or lactic acid', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'cell-city', name: 'The cell is a city', forWho: 'Students who find cell parts a list to memorise.', levels: ['new', 'some'], bands: ['middle'], interests: ['body', 'microbes'],
      win: 'I designed a city where every building does the job of a cell part — and I will never forget them.',
      steps: [
        { minutes: 5, title: 'Meet the parts', do: ['Show an animal cell: nucleus, membrane, cytoplasm, mitochondria, ribosomes.'] },
        { minutes: 7, title: 'Build the city', do: ['The child maps each part to a city building (nucleus = city hall, mitochondria = power station) and defends each choice.'], check: 'Every choice is justified by the job, not the look.' },
        { minutes: 5, title: 'Plant city', do: ['What extra buildings does a plant city need? (cell wall, chloroplasts, vacuole)'] },
      ],
      ifStuck: ['Only nucleus, membrane, mitochondria.'],
      ifFlying: ['Why do muscle cells have more mitochondria? Red blood cells have no nucleus — why?'],
      showOff: 'The child gives the parent a tour of their cell city.',
    },
    {
      id: 'sandwich-journey', name: 'A sandwich’s journey', forWho: 'Younger middle-school students new to body systems.', levels: ['new'], bands: ['middle'], interests: ['body'],
      win: 'I followed my lunch through my body and know what happens at every stop.',
      steps: [
        { minutes: 5, title: 'Map it', do: ['Draw the route: mouth → oesophagus → stomach → small intestine → large intestine.'] },
        { minutes: 7, title: 'At each stop', do: ['What happens to the bread (starch), cheese (protein, fat)? Which enzymes? Keep it simple.'], check: 'They explain what the small intestine does in their own words.' },
        { minutes: 5, title: 'Where does it go?', do: ['Blood carries sugar to muscles and brain. Why do you feel sleepy after a big lunch?'] },
      ],
      ifStuck: ['Only the route and one job per organ.'],
      ifFlying: ['Villi and surface area — why is the small intestine so long?'],
      showOff: 'The child narrates the sandwich’s journey to the parent like a tour guide.',
    },
    {
      id: 'food-web', name: 'Break the food web', forWho: 'Nature lovers ready for systems thinking.', levels: ['new', 'some'], bands: ['middle', 'senior'], interests: ['animals', 'plants'],
      win: 'I predicted what happens to a whole ecosystem when one species disappears.',
      steps: [
        { minutes: 5, title: 'Build a web', do: ['A pond or forest: 8 organisms. The child draws the arrows (energy flows toward the eater).'] },
        { minutes: 6, title: 'Remove one', do: ['Take away the frogs. Trace every knock-on effect. Then add an invasive species.'], check: 'They find at least two indirect effects.' },
        { minutes: 6, title: 'Real case', do: ['Wolves returned to Yellowstone and rivers changed course. Let them reason how.'] },
      ],
      ifStuck: ['A single food chain and one removal.'],
      ifFlying: ['Energy pyramids — why are there so few top predators?'],
      showOff: 'The parent removes an organism; the child explains the chain reaction.',
    },
    {
      id: 'genetics', name: 'Why you look like your family', forWho: 'Senior students curious about DNA.', levels: ['some', 'strong'], bands: ['senior', 'adult'], interests: ['genetics'],
      win: 'I can predict the chance of a trait with a Punnett square and explain what DNA actually does.',
      steps: [
        { minutes: 5, title: 'DNA to trait', do: ['DNA → gene → protein → trait. One analogy they choose: recipe book, instruction manual.'] },
        { minutes: 7, title: 'Punnett squares', do: ['Eye colour, tongue rolling, earlobes. Two crosses done together, one alone.'], check: 'The third cross correct without help.' },
        { minutes: 5, title: 'Beyond simple', do: ['Why do most traits (height) not fit a Punnett square? Environment and many genes.'] },
      ],
      ifStuck: ['Only dominant/recessive with one cross.'],
      ifFlying: ['Sex-linked traits: why colour blindness is more common in boys.'],
      showOff: 'The child works out a trait probability for the parent’s own family.',
    },
    {
      id: 'microbes', name: 'Invisible life', forWho: 'Students fascinated by germs and health.', levels: ['some'], bands: ['middle', 'senior'], interests: ['microbes', 'body'],
      win: 'I know the difference between bacteria and viruses and why that matters when you are ill.',
      steps: [
        { minutes: 5, title: 'Scale', do: ['How small? A bacterium vs a virus vs a human cell — with an analogy (a football stadium).'] },
        { minutes: 6, title: 'Friend or enemy', do: ['Gut bacteria, yoghurt, cholera, flu. Sort and explain.'] },
        { minutes: 6, title: 'Defence', do: ['The immune system as an army; vaccines as a training exercise; why antibiotics do not cure colds.'], check: 'They correctly say which illness an antibiotic would help.' },
      ],
      ifStuck: ['Only “good and bad bacteria” and handwashing.'],
      ifFlying: ['Antibiotic resistance as natural selection happening in real time.'],
      showOff: 'The child explains to the parent why the doctor did not give antibiotics for their last cold.',
    },
  ],
  close: close('The child teaches the parent one system from today using their own analogy.'),
  parentTalk: {
    new: 'Biology felt like memorising, but with a picture and an analogy they explained a whole system today. The course teaches everything that way, so it sticks.',
    some: 'They are managing well and quickly linked ideas together today. The course builds that systems thinking ahead of the harder grades.',
    strong: 'They are genuinely ahead — reasoning about genetics and ecosystems beyond their grade. The course would give them depth and challenge.',
  },
  avoid: ['A list of labels to copy.', 'Graphic medical images with younger students.', 'Long monologues — ask them to predict or explain every two minutes.'],
};
