import type { Playbook } from './types';
import { close, opening, EXPERIENCE } from './shared';

/*
 * The focus courses: one topic, forty-eight classes. A family books one of
 * these because a specific topic is hurting at school or an exam is coming, so
 * the trial must land on that topic within the first ten minutes and show a way
 * through it — not wander into the subject in general.
 */

const DESMOS = { label: 'Desmos graphing calculator', href: 'https://www.desmos.com/calculator' };
const phet = (label: string, slug: string) => ({ label: `PhET: ${label}`, href: `https://phet.colorado.edu/en/simulations/${slug}` });

const focusIntake = (interests: { id: string; label: string; emoji: string }[]) => ({
  experience: EXPERIENCE('Struggling with this topic', 'Coping, wants to be sure', 'Strong, aiming for top marks'),
  interests,
});

const EXAM_INTERESTS = [
  { id: 'exam', label: 'Board or entrance exam', emoji: '📝' },
  { id: 'school', label: 'Keeping up at school', emoji: '🏫' },
  { id: 'real', label: 'Real-world uses', emoji: '🌍' },
  { id: 'puzzles', label: 'Hard problems', emoji: '🧩' },
];

/* ── Algebra 1 ─────────────────────────────────────────────────────────────── */

export const algebra1Playbook: Playbook = {
  subject: 'algebra-1',
  title: 'Algebra 1',
  promise: 'They leave solving equations with a method they understand — the letters stop being scary.',
  intake: {
    ...focusIntake(EXAM_INTERESTS),
    warmUps: [
      { q: 'If x + 5 = 12, what is x?', options: ['7', '17', '5'], answer: 0, explain: 'Take 5 from both sides: x = 7.' },
      { q: 'Simplify: 3a + 2b + a − b', options: ['4a + b', '5ab', '4a + 3b'], answer: 0, explain: 'Collect like terms: 3a + a = 4a, and 2b − b = b.' },
      { q: 'What is 2(x + 3)?', options: ['2x + 3', '2x + 6', 'x + 6'], answer: 1, explain: 'The 2 multiplies both terms inside the bracket: 2x + 6.' },
    ],
  },
  opening: opening('Ask: “What is one algebra question from school you could not do?” Write it down — the class ends by solving it.'),
  diagnose: [
    { ask: 'Give 2x + 3 = 11 and ask them to talk you through it.', listenFor: [{ answer: 'Guesses, or unsure what to do first', means: 'new' }, { answer: 'Solves with “move it across” but cannot say why', means: 'some' }, { answer: 'Solves and explains “same to both sides”', means: 'strong' }] },
    { ask: '“Write an expression for: a number, doubled, then add 5.”', listenFor: [{ answer: 'Cannot start', means: 'new' }, { answer: '2n + 5', means: 'some' }, { answer: '2n + 5, and explains why not 2(n + 5)', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'balance', name: 'The balance scale', forWho: 'Students for whom “x” still feels like magic.', levels: ['new'], bands: ['middle', 'senior'], interests: ['school'],
      win: 'I solve two-step equations by keeping the scale balanced — and I know why it works.',
      steps: [
        { minutes: 5, title: 'Mystery bags', do: ['A bag plus 3 blocks balances 7 blocks. How many in the bag? Draw it.'] },
        { minutes: 7, title: 'Same to both sides', do: ['Translate every picture into algebra. Then 3x + 2 = 14 with the picture beside it.'], check: 'They say the rule in their own words.' },
        { minutes: 5, title: 'Their school question', do: ['Solve the question they brought, together.'] },
      ],
      ifStuck: ['One-step equations only, always with the picture.'],
      ifFlying: ['x on both sides: 5x + 2 = 3x + 10.'],
      showOff: 'The child solves their own school question for the parent, explaining each step.',
    },
    {
      id: 'patterns-to-rules', name: 'From patterns to rules', forWho: 'Students who can solve but do not see where expressions come from.', levels: ['some'], bands: ['middle', 'senior'], interests: ['puzzles', 'real'],
      win: 'I turned a pattern and a real situation into an expression and an equation.',
      steps: [
        { minutes: 5, title: 'The phone plan', do: ['₹200 a month plus ₹2 per GB. Table for 1, 2, 3 GB. Find the rule: 200 + 2g.'] },
        { minutes: 6, title: 'Ask it a question', do: ['The bill is ₹260 — how many GB? Build and solve the equation.'], check: 'They set up the equation without help.' },
        { minutes: 6, title: 'Compare plans', do: ['Plan B: ₹150 + ₹5 per GB. When is A cheaper? Solve 200 + 2g = 150 + 5g.'] },
      ],
      ifStuck: ['Only the table and the rule; skip the comparison.'],
      ifFlying: ['Graph both plans; the crossing point is the answer.'],
      showOff: 'The child tells the parent which plan the family should pick for their data use.',
    },
    {
      id: 'word-problems', name: 'Word problems, cracked', forWho: 'Strong students who lose marks on wordy exam questions.', levels: ['strong', 'some'], bands: ['middle', 'senior'], interests: ['exam', 'puzzles'],
      win: 'I have a four-step routine that turns any word problem into an equation.',
      steps: [
        { minutes: 4, title: 'The routine', do: ['Read → name the unknown → write the relationship → solve and check against the words.'] },
        { minutes: 8, title: 'Ages, money, speed', do: ['Three exam-style problems of rising difficulty. They narrate each step.'], check: 'The third done with the routine and no hints.' },
        { minutes: 5, title: 'Trap spotting', do: ['A problem with an irrelevant number. Why did it trick people?'] },
      ],
      ifStuck: ['Only the first type (ages) with a table.'],
      ifFlying: ['Simultaneous equations from a two-unknown word problem.'],
      showOff: 'The parent reads a problem aloud; the child sets up the equation.',
    },
  ],
  close: close('The child solves one fresh equation for the parent and explains the rule they used.'),
  parentTalk: {
    new: 'Algebra felt like magic tricks; today they solved equations with a method they understand and could explain. The course builds from there so each new topic rests on something solid.',
    some: 'They can do the steps; today they started to see where equations come from. That understanding is what holds up in the next grades.',
    strong: 'They are strong — the marks they lose are in wordy problems. A clear routine fixed that today, and the course would push them to harder problems.',
  },
  avoid: ['“Move it to the other side and change the sign” — teach the reason, not the trick.', 'More than one new idea per class.', 'Skipping the check step.'],
};

/* ── Algebra 2 ─────────────────────────────────────────────────────────────── */

export const algebra2Playbook: Playbook = {
  subject: 'algebra-2',
  title: 'Algebra 2',
  promise: 'They leave able to see what an equation looks like as a graph — and use that to solve it.',
  intake: {
    ...focusIntake(EXAM_INTERESTS),
    warmUps: [
      { q: 'Factorise: x² + 5x + 6', options: ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x − 2)(x − 3)'], answer: 0, explain: 'Two numbers that multiply to 6 and add to 5: 2 and 3.' },
      { q: 'What is 2³ × 2²?', options: ['2⁵', '2⁶', '4⁵'], answer: 0, explain: 'Same base, add the powers: 3 + 2 = 5.' },
      { q: 'y = x² opens…', options: ['Upward', 'Downward', 'It is a straight line'], answer: 0, explain: 'A positive x² makes a U shape. A negative one flips it.' },
    ],
  },
  opening: opening('Ask which topic worries them most — quadratics, exponents, functions or simultaneous equations — and start there.'),
  diagnose: [
    { ask: 'Give x² − 5x + 6 = 0. “How would you solve this?”', listenFor: [{ answer: 'Unsure', means: 'new' }, { answer: 'Factorises correctly', means: 'some' }, { answer: 'Factorises and links the roots to where the graph crosses the axis', means: 'strong' }] },
    { ask: '“What does the graph of y = 2ˣ look like?”', listenFor: [{ answer: 'No idea', means: 'new' }, { answer: '“It goes up”', means: 'some' }, { answer: 'Describes slow then very fast growth, never below zero', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'quadratics-visual', name: 'Quadratics you can see', forWho: 'Students who can factorise but do not see what it means.', levels: ['new', 'some'], bands: ['senior', 'middle'], interests: ['school', 'exam'],
      win: 'I can find the roots and vertex of a quadratic and sketch it before I plot it.',
      tools: [DESMOS],
      steps: [
        { minutes: 5, title: 'Sliders', do: ['Desmos: y = a(x − h)² + k with sliders. Predict each slider’s effect first.'] },
        { minutes: 7, title: 'Roots are crossings', do: ['Factorise x² − x − 6; find the roots; check where Desmos crosses the axis.'], check: 'Roots match without looking first.' },
        { minutes: 5, title: 'When factorising fails', do: ['x² + 2x − 1: use the formula; see why the roots are not whole numbers on the graph.'] },
      ],
      ifStuck: ['Only factorising and roots, graph for checking.'],
      ifFlying: ['The discriminant: predict how many roots before solving.'],
      showOff: 'The parent picks a quadratic; the child sketches it and then checks in Desmos.',
    },
    {
      id: 'exponential-stories', name: 'Exponential stories', forWho: 'Students who like real-world maths.', levels: ['some'], bands: ['senior', 'adult'], interests: ['real'],
      win: 'I modelled money growth and a spreading rumour with exponentials — and saw why they explode.',
      tools: [DESMOS],
      steps: [
        { minutes: 5, title: 'Doubling', do: ['A rumour doubles every hour from 1 person. How long to reach a whole city of a million? (about 20 hours)'] },
        { minutes: 6, title: 'Money', do: ['₹10,000 at 8% a year: 10000 × 1.08ⁿ. Graph it. When does it double?'], check: 'They write the model themselves.' },
        { minutes: 6, title: 'Linear vs exponential', do: ['₹1,000 a year vs 8% growth: which wins, and when?'] },
      ],
      ifStuck: ['Only doubling, with a table.'],
      ifFlying: ['Solving for n with logarithms — the rule of 72.'],
      showOff: 'The child tells the parent how long their savings would take to double at a given rate.',
    },
    {
      id: 'systems-puzzle', name: 'Two equations, one answer', forWho: 'Strong students aiming for top marks.', levels: ['strong'], bands: ['senior', 'adult'], interests: ['puzzles', 'exam'],
      win: 'I solved simultaneous equations three ways and know when each is fastest.',
      tools: [DESMOS],
      steps: [
        { minutes: 5, title: 'The puzzle', do: ['Two cinema tickets and a popcorn cost ₹700; one ticket and two popcorns cost ₹500. Set it up.'] },
        { minutes: 7, title: 'Three methods', do: ['Substitution, elimination, graphs. Same answer three times.'], check: 'They choose the fastest method for a new pair and justify it.' },
        { minutes: 5, title: 'Line meets curve', do: ['y = x + 1 and y = x² − 1: a linear-quadratic system, and why there can be two answers.'] },
      ],
      ifStuck: ['Elimination only, with small whole numbers.'],
      ifFlying: ['Three unknowns, or a system with no solution — what does that look like?'],
      showOff: 'The child sets the parent a ticket-and-popcorn puzzle and solves it.',
    },
  ],
  close: close('The child sketches one function from today for the parent and explains what the key numbers mean.'),
  parentTalk: {
    new: 'The algebra had become symbols without meaning; with graphs it started making sense today. The course teaches every topic that way so exams stop being guesswork.',
    some: 'They manage the methods and today connected them to graphs and real situations, which is what makes the harder questions easy.',
    strong: 'They are strong. They need exam-level challenge and speed, choosing the fastest method — which is where the course takes them.',
  },
  avoid: ['Formula first.', 'Letting Desmos answer before they predict.', 'Rushing past the meaning of the roots.'],
};

/* ── Trigonometry ──────────────────────────────────────────────────────────── */

export const trigonometryPlaybook: Playbook = {
  subject: 'trigonometry',
  title: 'Trigonometry',
  promise: 'They leave knowing sin, cos and tan are just ratios of a triangle — and use one to measure something real.',
  intake: {
    ...focusIntake(EXAM_INTERESTS),
    warmUps: [
      { q: 'In a right triangle, the longest side is called…', options: ['The adjacent', 'The hypotenuse', 'The opposite'], answer: 1, explain: 'The hypotenuse is always opposite the right angle and always the longest side.' },
      { q: 'sin 30° equals…', options: ['1/2', '√3/2', '1'], answer: 0, explain: 'sin 30° = 1/2. In a 30–60–90 triangle the side opposite 30° is half the hypotenuse.' },
      { q: 'tan = ?', options: ['opposite ÷ hypotenuse', 'opposite ÷ adjacent', 'adjacent ÷ hypotenuse'], answer: 1, explain: 'SOH CAH TOA: tan is opposite over adjacent.' },
    ],
  },
  opening: opening('Ask: “Where do you think people use triangles to measure things they cannot reach?” (buildings, ramps, ships, games)'),
  diagnose: [
    { ask: 'Draw a right triangle with an angle marked. “Label the sides.”', listenFor: [{ answer: 'Cannot label opposite and adjacent', means: 'new' }, { answer: 'Labels correctly, knows SOH CAH TOA', means: 'some' }, { answer: 'Labels, and knows why the labels move when the angle does', means: 'strong' }] },
    { ask: '“Why does sin 30° always equal 1/2, whatever size the triangle?”', listenFor: [{ answer: 'No idea', means: 'new' }, { answer: '“It is in the table”', means: 'some' }, { answer: 'Similar triangles — the ratio stays the same', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'shadow-height', name: 'Measure a building with a shadow', forWho: 'Students new to trig ratios.', levels: ['new', 'some'], bands: ['middle', 'senior'], interests: ['real', 'school'],
      win: 'I worked out the height of something I cannot reach using an angle and a tan.',
      steps: [
        { minutes: 5, title: 'Label the triangle', do: ['Opposite, adjacent, hypotenuse — relative to the marked angle. Move the angle; relabel.'] },
        { minutes: 7, title: 'The tree', do: ['Standing 10 m from a tree, the angle to the top is 40°. tan 40° = h/10 → h ≈ 8.4 m.'], check: 'They choose tan themselves and explain why.' },
        { minutes: 5, title: 'Their own', do: ['A phone clinometer app or a guessed angle: height of their building from the street.'] },
      ],
      ifStuck: ['Labelling only, then one tan question with a calculator.'],
      ifFlying: ['Two angles from two distances — find the height without knowing how far away it is.'],
      showOff: 'The child explains to the parent how they could measure their own building.',
    },
    {
      id: 'unit-circle', name: 'The unit circle is a clock', forWho: 'Students ready to go beyond right triangles.', levels: ['some'], bands: ['senior', 'adult'], interests: ['school', 'exam'],
      win: 'I can find sin and cos of any angle from the unit circle — no memorising a table.',
      tools: [phet('Trig Tour', 'trig-tour')],
      steps: [
        { minutes: 5, title: 'Around the circle', do: ['A point moves around a circle of radius 1. Its x is cos, its y is sin.'] },
        { minutes: 7, title: 'Special angles', do: ['30°, 45°, 60° from triangles inside the circle. Then 150°, 210° by symmetry.'], check: 'They find sin 150° without a calculator.' },
        { minutes: 5, title: 'Signs', do: ['Which quadrants make sin negative? Why?'] },
      ],
      ifStuck: ['Only 0°, 90°, 180°, 270° and 30/45/60.'],
      ifFlying: ['Radians: why 2π is a full turn.'],
      showOff: 'The parent names an angle; the child finds its sine on the circle.',
    },
    {
      id: 'waves', name: 'Sine waves are sound', forWho: 'Strong students who want to see trig in the real world.', levels: ['strong'], bands: ['senior', 'adult'], interests: ['real', 'puzzles'],
      win: 'I changed the amplitude and frequency of a sine wave and heard what it does to sound.',
      tools: [DESMOS, phet('Waves Intro', 'waves-intro')],
      steps: [
        { minutes: 5, title: 'The circle unrolled', do: ['The unit circle’s height, plotted against angle, is y = sin x.'] },
        { minutes: 7, title: 'a sin(bx)', do: ['Desmos sliders on a and b: predict, then check. Connect: loudness and pitch.'], check: 'They predict the effect of doubling b.' },
        { minutes: 5, title: 'Equations', do: ['Solve sin x = 0.5 for 0–360°: why two answers?'] },
      ],
      ifStuck: ['Only the graph of sin x and one slider.'],
      ifFlying: ['Adding two waves: beats and noise-cancelling headphones.'],
      showOff: 'The child shows the parent how changing one number changes the pitch.',
    },
  ],
  close: close('The child solves one triangle for the parent and names the ratio they chose.'),
  parentTalk: {
    new: 'Trigonometry felt like memorising SOH CAH TOA; today they used it to measure something real. The course keeps every topic tied to a picture so it stays understood.',
    some: 'They know the ratios and today saw why they work, which unlocks the harder topics — the unit circle, identities, equations.',
    strong: 'They are strong and ready for exam-level problems and applications like waves — the course would stretch them there.',
  },
  avoid: ['Tables of values to memorise.', 'Forgetting degrees vs radians mode on the calculator.', 'Skipping the diagram.'],
};

/* ── Calculus ──────────────────────────────────────────────────────────────── */

export const calculusPlaybook: Playbook = {
  subject: 'calculus',
  title: 'Calculus',
  promise: 'They leave understanding what a derivative actually measures — so the rules have a meaning.',
  intake: {
    ...focusIntake(EXAM_INTERESTS),
    warmUps: [
      { q: 'The gradient of y = 3x + 2 is…', options: ['2', '3', '5'], answer: 1, explain: 'In y = mx + c, m is the gradient: 3.' },
      { q: 'A car’s speedometer shows…', options: ['Average speed over the trip', 'Speed at that instant', 'Distance travelled'], answer: 1, explain: 'Instantaneous speed — which is exactly what a derivative is.' },
      { q: 'd/dx (x²) = ?', options: ['2x', 'x', '2'], answer: 0, explain: 'Bring the power down and reduce it by one: 2x.' },
    ],
  },
  opening: opening('Ask: “What does the word ‘rate’ mean to you?” Speed, interest, heart rate — calculus is the maths of all of them.'),
  diagnose: [
    { ask: '“What does dy/dx tell you?”', listenFor: [{ answer: 'Only a rule to apply', means: 'new' }, { answer: '“The gradient”', means: 'some' }, { answer: '“The instantaneous rate of change — the gradient of the tangent”', means: 'strong' }] },
    { ask: 'Give f(x) = x³ − 3x. “Where are the turning points?”', listenFor: [{ answer: 'Cannot start', means: 'new' }, { answer: 'Differentiates and sets to zero', means: 'some' }, { answer: 'Finds them and classifies max/min', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'speedometer', name: 'The speedometer', forWho: 'Students meeting calculus, or who only know the rules.', levels: ['new', 'some'], bands: ['senior', 'adult'], interests: ['school', 'real'],
      win: 'I understand the derivative as the speedometer of a function — and found one from first principles.',
      tools: [DESMOS],
      steps: [
        { minutes: 5, title: 'Average speed', do: ['A ball drops: distance = 5t². Average speed from t = 1 to t = 2, then to 1.1, then to 1.01.'] },
        { minutes: 7, title: 'Zoom in', do: ['In Desmos, draw the secant line and shrink the gap. The slope settles at 10 — the speed at t = 1.'], check: 'They say what happens to the gap and the slope.' },
        { minutes: 5, title: 'The rule appears', do: ['Repeat at t = 2, 3. Spot 10t. So d/dt (5t²) = 10t.'] },
      ],
      ifStuck: ['Only the table of average speeds getting closer.'],
      ifFlying: ['First principles with h algebraically: the limit of (f(x+h) − f(x))/h.'],
      showOff: 'The child explains to the parent what a speedometer has to do with calculus.',
    },
    {
      id: 'tangent-zoom', name: 'Zoom until it is straight', forWho: 'Students who can differentiate and want understanding and speed.', levels: ['some'], bands: ['senior', 'adult'], interests: ['exam', 'school'],
      win: 'I can find tangent lines and turning points, and sketch a curve from its derivative.',
      tools: [DESMOS],
      steps: [
        { minutes: 5, title: 'Local straightness', do: ['Zoom into any curve in Desmos until it looks straight: that line is the tangent.'] },
        { minutes: 7, title: 'Tangents', do: ['Equation of the tangent to y = x³ at x = 1. Plot to check.'], check: 'Their line touches the curve in Desmos.' },
        { minutes: 5, title: 'Turning points', do: ['f(x) = x³ − 3x: solve f′(x) = 0, classify with f″, sketch before plotting.'] },
      ],
      ifStuck: ['Only the tangent at one point.'],
      ifFlying: ['Sketch f′ from the graph of f, without the formula.'],
      showOff: 'The child sketches a cubic for the parent from its turning points, then reveals the plot.',
    },
    {
      id: 'optimise-box', name: 'The biggest box', forWho: 'Strong students ready for applications.', levels: ['strong'], bands: ['senior', 'adult'], interests: ['puzzles', 'real', 'exam'],
      win: 'I used calculus to design the box with the largest volume from a sheet of card.',
      tools: [DESMOS],
      steps: [
        { minutes: 5, title: 'The problem', do: ['A 30 cm square sheet; cut squares of side x from each corner and fold. Volume = x(30 − 2x)².'] },
        { minutes: 7, title: 'Solve', do: ['Differentiate, set to zero, choose the sensible root (x = 5), check it is a maximum.'], check: 'They reject the impossible root and say why.' },
        { minutes: 5, title: 'Check', do: ['Plot V(x) in Desmos. If they have paper at home, fold one.'] },
      ],
      ifStuck: ['Build the volume table for x = 1…7 and find the best by hand first.'],
      ifFlying: ['An open-top cylinder of fixed volume with least material.'],
      showOff: 'The child shows the parent the best box size and proves it is the biggest.',
    },
  ],
  close: close('The child explains in one sentence what a derivative measures, with an example from today.'),
  parentTalk: {
    new: 'Calculus felt like a list of rules; today they discovered one themselves by zooming into a graph. The course teaches from meaning first, so the rules never feel random.',
    some: 'They can apply the rules and today connected them to graphs, which is what the harder exam questions need.',
    strong: 'They are strong and ready for applied, exam-level problems — optimisation, rates of change — where the course takes them.',
  },
  avoid: ['The power rule before the idea of a limit.', 'Letting algebra errors hide the concept — keep numbers simple.', 'Forgetting to check answers make sense.'],
};

/* ── Mechanics ─────────────────────────────────────────────────────────────── */

export const mechanicsPlaybook: Playbook = {
  subject: 'mechanics',
  title: 'Mechanics',
  promise: 'They leave drawing a free-body diagram first, every time — and seeing how that unlocks the problem.',
  intake: {
    ...focusIntake([...EXAM_INTERESTS, { id: 'sport', label: 'Sport & vehicles', emoji: '🏎️' }]),
    warmUps: [
      { q: 'A book rests on a table. The forces on it are…', options: ['Only gravity', 'Gravity and the table pushing up', 'None'], answer: 1, explain: 'Weight down, normal reaction up — balanced, so it stays still.' },
      { q: 'F = ma. A 2 kg trolley is pushed with 10 N (no friction). Acceleration?', options: ['5 m/s²', '20 m/s²', '12 m/s²'], answer: 0, explain: 'a = F ÷ m = 10 ÷ 2 = 5 m/s².' },
      { q: 'Momentum is…', options: ['mass × velocity', 'mass × acceleration', 'force × time'], answer: 0, explain: 'p = mv. Force × time is the change in momentum (impulse).' },
    ],
  },
  opening: opening('Ask: “Which moving thing would you most like to understand — a car braking, a rocket, a cricket shot?” Use it throughout.'),
  diagnose: [
    { ask: 'A box is pulled along a rough floor. “Draw the forces.”', listenFor: [{ answer: 'Only the pull', means: 'new' }, { answer: 'Pull, friction, weight, normal — some directions wrong', means: 'some' }, { answer: 'All four correct, and says which balance', means: 'strong' }] },
    { ask: '“If the forces are balanced, is the box moving?”', listenFor: [{ answer: '“No”', means: 'new' }, { answer: '“Could be at constant speed”', means: 'some' }, { answer: 'Constant velocity or rest — Newton’s first law', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'free-body', name: 'Draw the forces first', forWho: 'Students who jump straight into formulas.', levels: ['new', 'some'], bands: ['senior', 'middle', 'adult'], interests: ['school'],
      win: 'I draw a free-body diagram for any object and use it to find the resultant force.',
      tools: [phet('Forces and Motion: Basics', 'forces-and-motion-basics')],
      steps: [
        { minutes: 5, title: 'Everyday objects', do: ['A book, a hanging lamp, a car at constant speed. Draw the forces; label each.'] },
        { minutes: 7, title: 'Resultant', do: ['The simulation: add pushes and friction; predict motion from the resultant before pressing play.'], check: 'Three correct predictions.' },
        { minutes: 5, title: 'F = ma', do: ['A 1200 kg car, 3000 N drive, 600 N resistance. Acceleration?'] },
      ],
      ifStuck: ['Only horizontal forces and resultant.'],
      ifFlying: ['Forces at an angle — resolve into components.'],
      showOff: 'The parent names an object; the child draws its free-body diagram.',
    },
    {
      id: 'ramps', name: 'Ramps and friction', forWho: 'Students ready for inclined planes.', levels: ['some'], bands: ['senior', 'adult'], interests: ['exam', 'real', 'sport'],
      win: 'I resolved forces on a slope and found whether a block slides.',
      steps: [
        { minutes: 5, title: 'Tilt the world', do: ['Rotate axes to the slope. Weight splits into mg sinθ and mg cosθ.'] },
        { minutes: 7, title: 'Does it slide?', do: ['μ = 0.3 on a 20° slope: compare friction limit with mg sinθ.'], check: 'They decide correctly and explain.' },
        { minutes: 5, title: 'Real', do: ['Why do trucks have runaway ramps filled with gravel?'] },
      ],
      ifStuck: ['Smooth slope only (no friction).'],
      ifFlying: ['A block pulled up the slope by a rope at an angle.'],
      showOff: 'The child explains to the parent why a slope that is too steep lets things slide.',
    },
    {
      id: 'collisions', name: 'Crash test', forWho: 'Strong students aiming for top marks.', levels: ['strong'], bands: ['senior', 'adult'], interests: ['sport', 'puzzles', 'exam'],
      win: 'I used conservation of momentum to predict a collision and explained why cars have crumple zones.',
      tools: [phet('Collision Lab', 'collision-lab')],
      steps: [
        { minutes: 5, title: 'Momentum', do: ['p = mv. A truck at 5 m/s vs a car at 20 m/s — which has more momentum?'] },
        { minutes: 7, title: 'Predict the crash', do: ['Collision Lab: two carts collide and stick. Calculate the final velocity, then run it.'], check: 'Prediction matches the simulation.' },
        { minutes: 5, title: 'Crumple zones', do: ['Impulse = FΔt. Same change in momentum, longer time, smaller force.'] },
      ],
      ifStuck: ['One moving cart hits a stationary one and sticks.'],
      ifFlying: ['Elastic collisions: momentum AND kinetic energy conserved.'],
      showOff: 'The child explains to the parent why airbags save lives, using impulse.',
    },
  ],
  close: close('The child draws one free-body diagram for the parent and solves for the acceleration.'),
  parentTalk: {
    new: 'Mechanics felt like formula-hunting; today they drew the forces first and the problem became clear. That habit is what the course builds.',
    some: 'They manage the basics and today handled slopes and friction with a clear method — the course deepens that for exams.',
    strong: 'They are strong. They need hard, multi-step problems — momentum, energy, projectiles — which is where the course goes.',
  },
  avoid: ['Solving without a diagram.', 'Mixing up mass and weight.', 'Skipping units and directions.'],
};

/* ── Organic chemistry ─────────────────────────────────────────────────────── */

export const organicPlaybook: Playbook = {
  subject: 'organic-chemistry',
  title: 'Organic Chemistry',
  promise: 'They leave seeing organic molecules as a small set of patterns — not hundreds of structures to memorise.',
  intake: {
    ...focusIntake([...EXAM_INTERESTS, { id: 'medicine', label: 'Medicine & biology', emoji: '💊' }]),
    warmUps: [
      { q: 'How many bonds does carbon usually form?', options: ['2', '3', '4'], answer: 2, explain: 'Carbon has four outer electrons to share, so it forms four bonds.' },
      { q: 'The name of CH₃–CH₃ is…', options: ['Methane', 'Ethane', 'Propane'], answer: 1, explain: 'Two carbons, all single bonds: eth- + -ane = ethane.' },
      { q: 'An –OH group makes a molecule an…', options: ['Alkene', 'Alcohol', 'Acid'], answer: 1, explain: 'Hydroxyl (–OH) = alcohol, like ethanol.' },
    ],
  },
  opening: opening('Ask: “Where do you think carbon compounds are in your day?” Food, fuel, medicine, plastic, your own body — organic chemistry is all of it.'),
  diagnose: [
    { ask: 'Show CH₃CH₂CH₂OH. “Name it and say what family it belongs to.”', listenFor: [{ answer: 'Cannot name it', means: 'new' }, { answer: 'Propanol, alcohol', means: 'some' }, { answer: 'Propan-1-ol, primary alcohol, predicts it can be oxidised', means: 'strong' }] },
    { ask: '“What does a curly arrow show?”', listenFor: [{ answer: 'Never seen one', means: 'new' }, { answer: 'Electrons moving, vaguely', means: 'some' }, { answer: 'A pair of electrons moving, from where to where', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'carbon-lego', name: 'Carbon Lego', forWho: 'Students who find naming overwhelming.', levels: ['new', 'some'], bands: ['senior', 'middle', 'adult'], interests: ['school', 'exam'],
      win: 'I built molecules from rules and named any straight-chain alkane, alkene and alcohol.',
      tools: [phet('Build a Molecule', 'build-a-molecule')],
      steps: [
        { minutes: 5, title: 'The rules', do: ['C makes 4 bonds, H makes 1, O makes 2. Build methane, ethane, ethanol in the simulation.'] },
        { minutes: 7, title: 'Naming machine', do: ['meth, eth, prop, but + ane/ene/anol. Name six structures, then draw from six names.'], check: 'Four of six right unaided.' },
        { minutes: 5, title: 'Isomers', do: ['C₄H₁₀ two ways. Same formula, different molecule — why that matters.'] },
      ],
      ifStuck: ['Only alkanes up to butane.'],
      ifFlying: ['Branched chains and numbering: 2-methylpropane.'],
      showOff: 'The parent says a name; the child draws the molecule.',
    },
    {
      id: 'functional-groups', name: 'Families that behave alike', forWho: 'Students who can name but not predict reactions.', levels: ['some'], bands: ['senior', 'adult'], interests: ['medicine', 'real'],
      win: 'I can spot a functional group and predict how the molecule will react.',
      steps: [
        { minutes: 5, title: 'Spot the group', do: ['Aspirin, vinegar, nail-polish remover, fruity esters: circle the functional groups.'] },
        { minutes: 7, title: 'Predict', do: ['Alkene + bromine water, alcohol + acid (ester smell), carboxylic acid + carbonate (fizz).'], check: 'They predict two products correctly.' },
        { minutes: 5, title: 'Why a smell', do: ['Esters are why bananas and pineapples smell as they do — make one on paper from ethanol and ethanoic acid.'] },
      ],
      ifStuck: ['Only alkenes vs alkanes with bromine water.'],
      ifFlying: ['Oxidation of primary vs secondary alcohols.'],
      showOff: 'The child explains to the parent where a fruit smell comes from, chemically.',
    },
    {
      id: 'mechanisms', name: 'Curly arrows make sense', forWho: 'Strong students heading for advanced exams.', levels: ['strong'], bands: ['senior', 'adult'], interests: ['exam', 'puzzles'],
      win: 'I drew a reaction mechanism with curly arrows and explained every arrow.',
      steps: [
        { minutes: 5, title: 'Electrons move', do: ['Nucleophile, electrophile: who has electrons, who wants them. δ+ and δ− on a C–Br bond.'] },
        { minutes: 7, title: 'SN2', do: ['OH⁻ with bromoethane: draw the arrows step by step; they narrate.'], check: 'Arrows start at electrons and end at an atom.' },
        { minutes: 5, title: 'SN1 vs SN2', do: ['Why does a tertiary halide go a different way? Carbocation stability.'] },
      ],
      ifStuck: ['Only polarity and which atom is attacked.'],
      ifFlying: ['Electrophilic addition to an alkene, and Markovnikov’s rule.'],
      showOff: 'The child walks the parent through the arrows of one mechanism.',
    },
  ],
  close: close('The child names and draws one molecule for the parent and predicts one reaction.'),
  parentTalk: {
    new: 'Organic chemistry felt like endless structures; today they saw it is a few rules and patterns. The course builds on that so the volume never overwhelms.',
    some: 'They can name molecules and today began predicting reactions — the skill the exams reward most.',
    strong: 'They are strong and ready for mechanisms and advanced problems, which is where the course takes them.',
  },
  avoid: ['Memorising reactions as a list.', 'Curly arrows drawn from atoms instead of electrons.', 'Skipping the 3D picture — molecules are not flat.'],
};
