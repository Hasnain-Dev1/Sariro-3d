import { bd, type BandLesson } from '../types';

/** Grades 10–12 · Worlds 5 and 6 — persuasion that survives scrutiny, and stories that make applications real. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('senior', n, part, x);

export const SENIOR_WORLD_5: BandLesson[] = [
  {
    number: 25,
    oneLine: 'A persuasive speech asks for something specific — or it is just an informative one.',
    idea: [
      'Head-student manifestos, MUN resolutions, petitions to the principal and debate cases all succeed or fail on whether the audience knows exactly what to do: vote, adopt, amend, approve.',
      'Write the ask before the speech: who acts, what exactly, by when. Then build every argument to lower the audience\'s reasons to say no. A vague ask ("we must do more for the environment") persuades nobody to do anything.',
    ],
    model: {
      text: 'I am asking the student council to approve a trial of one phone-free lunch break a week for the rest of this term, reviewed by a student vote in March.',
      noticing: ['A specific decision-maker and action.', 'A trial and review lower the risk of agreeing.'],
    },
    drills: [
      d(25, 'a', { title: 'The ask, in one sentence', brief: 'State a specific ask for your school, community or an MUN committee: who acts, what exactly, by when.', targetSeconds: 20 }),
      d(25, 'b', { title: 'Ninety seconds towards the ask', brief: 'Build a ninety-second persuasive speech where each argument lowers the audience\'s objections, ending on your ask.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(25, 'c', { title: 'Manifesto promise', brief: 'Deliver the core promise of a head-student manifesto as one specific, measurable commitment and its justification.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Vague asks and slogans.', 'Promises that cannot be delivered.', 'Asks buried at the end of long context.'],
    selfCheck: ['Could the audience act on my exact sentence?', 'What objection did each argument remove?'],
    realWorld: 'Student council proposals, election manifestos and MUN resolutions.',
    writePrompt: 'Write a specific ask for a school or community change, with a trial or review built in, and the three objections you will address.',
  },
  {
    number: 26,
    oneLine: 'Ethos, pathos and logos — debate adjudicators reward the analysis, audiences reward all three.',
    idea: [
      'Ethos is why they should trust you; pathos is why they should care; logos is whether your reasoning holds. Competitive debaters often lean on logos; elocution speakers lean on pathos. The strongest speakers integrate all three.',
      'Know your audience: adjudicators want mechanism and analysis, an assembly responds to stakes and stories, an admissions panel wants credibility shown through specifics. Adjust the balance, never abandon any of the three.',
    ],
    model: {
      text: 'I have tutored younger students in my building for two years. Three of them nearly dropped maths because they were told they "were not maths people". Research on growth mindset shows that belief itself lowers performance — and it is a belief we can change.',
      noticing: ['Ethos: two years of tutoring.', 'Pathos: three real students.', 'Logos: research linking belief and performance.'],
    },
    drills: [
      d(26, 'a', { title: 'One sentence each', brief: 'For a cause you care about, deliver one ethos, one pathos and one logos sentence.', targetSeconds: 30 }),
      d(26, 'b', { title: 'Two minutes on your weakest', brief: 'Identify your weakest appeal and deliver a two-minute speech that strengthens it while keeping the others.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(26, 'c', { title: 'Same case, two audiences', brief: 'Deliver your case for sixty seconds to debate adjudicators, then sixty seconds to a school assembly, rebalancing the appeals.', targetSeconds: 120 }),
    ],
    mentorWatchFor: ['Emotional manipulation in place of argument.', 'Analysis with no stakes.', 'Credentials that are not relevant.'],
    selfCheck: ['Which appeal is my default?', 'How did I rebalance for a different audience?'],
    realWorld: 'Debates, elocution competitions and personal interviews.',
    writePrompt: 'Write the same case for adjudicators and for an assembly, labelling ethos, pathos and logos in each.',
  },
  {
    number: 27,
    oneLine: 'One well-sourced number, made meaningful, beats a string of statistics.',
    idea: [
      'Competition speeches often fire statistics like a list. Listeners retain none of them, and adjudicators start wondering whether any are real.',
      'Choose the one figure that carries your argument, make it meaningful with a comparison, and be ready to name its source. In MUN and debates, a single challenged, unsourced number can undermine everything else you said.',
    ],
    model: {
      text: 'About one in seven adolescents worldwide lives with a mental health condition. In a class of forty, that is five or six of the people sitting around you right now.',
      noticing: ['A global figure made local and personal.', 'The comparison makes it impossible to ignore.'],
    },
    drills: [
      d(27, 'a', { title: 'One number, two ways', brief: 'State a statistic relevant to a current debate plainly, then again with a comparison that makes it personal to your audience.', targetSeconds: 30 }),
      d(27, 'b', { title: 'A case built on one figure', brief: 'Build a ninety-second speech around one well-anchored statistic, including one sentence naming its source.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(27, 'c', { title: 'Challenged statistic', brief: 'Respond to an opponent who says "Where did that number come from?" with a calm, sourced reply.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Unsourced or invented statistics.', 'False precision.', 'Comparisons that distort the figure.'],
    selfCheck: ['Could I name my source under challenge?', 'Did my comparison stay accurate?'],
    realWorld: 'MUN, debates, science exhibitions and research presentations.',
    writePrompt: 'Write one statistic for a current debate, its exact source, and an accurate comparison for your audience.',
  },
  {
    number: 28,
    oneLine: 'Raise and answer the strongest objection yourself — it is the most persuasive move in competitive speaking.',
    idea: [
      'Adjudicators reward engagement with the best version of the other side. Audiences trust speakers who show they have considered the counter-argument.',
      'Steel-man the objection: state it as its best advocate would. Then refute it, or concede its partial validity and weigh why your case still matters more. Pre-empting it robs the opposition of their best material.',
    ],
    model: {
      text: 'The strongest objection is that stricter age verification threatens privacy for everyone. That is a real cost. But verification can be done without storing identity, as some countries already require — and the harm we prevent to children outweighs a design challenge we can solve.',
      noticing: ['States the objection at its strongest.', 'Concedes, then weighs.'],
    },
    drills: [
      d(28, 'a', { title: 'The strongest objection', brief: 'State the strongest objection to a position you hold as fairly as its best advocate would.', targetSeconds: 60 }),
      d(28, 'b', { title: 'Concede something real', brief: 'Deliver a ninety-second case that concedes a genuine point and weighs why your position still wins.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(28, 'c', { title: 'Pre-emptive rebuttal', brief: 'As first proposition, pre-empt the opposition\'s most likely argument in forty-five seconds before they make it.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Straw men.', 'Concessions that undermine the whole case.', 'Weighing claims without reasons.'],
    selfCheck: ['Would the opposition accept my description of their view?', 'Did I weigh, not just rebut?'],
    realWorld: 'Competitive debating, MUN negotiations and structured arguments with adults.',
    writePrompt: 'Write the steel-manned objection to your position, your concession and your weighing statement.',
  },
  {
    number: 29,
    oneLine: 'Rhetorical devices make lines memorable — in speeches that also have substance.',
    idea: [
      'Anaphora, tricolon, antithesis and the rhetorical question appear in almost every great speech from Churchill to Malala. They make lines quotable and give your delivery rhythm.',
      'In debate and interviews, substance wins; devices amplify it. Use one or two at your thesis and close. A speech made entirely of rhetoric sounds impressive for a minute and hollow by the adjudication.',
    ],
    model: {
      text: 'We are not the leaders of tomorrow. We are the voters of tomorrow, the workers of tomorrow, and the ones who will live in the world you are deciding today.',
      noticing: ['Antithesis: not leaders but voters.', 'Tricolon and anaphora with "of tomorrow".'],
    },
    drills: [
      d(29, 'a', { title: 'A rule of three, out loud', brief: 'Write and deliver a closing line for a debate or election speech that uses a tricolon, with context around it.', targetSeconds: 45 }),
      d(29, 'b', { title: 'The contrast pair', brief: 'Read these lines, landing each contrast, then create one antithesis of your own on an issue you care about.', passage: 'One child, one teacher, one book, one pen can change the world. It is not our differences that divide us; it is our inability to recognise, accept and celebrate those differences. We shall fight on the beaches; we shall never surrender.', targetSeconds: 35 }),
    ],
    extraDrills: [
      d(29, 'c', { title: 'Device analysis', brief: 'Recall a line from a famous speech and explain which device it uses and why it has lasted.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Rhetoric replacing argument.', 'Clichéd lines borrowed from famous speeches.', 'Theatrical delivery that undermines credibility.'],
    selfCheck: ['Did my device amplify a real argument?', 'Would someone quote my line?'],
    realWorld: 'Elocution competitions, election speeches and debate summaries.',
    writePrompt: 'Write a debate close that uses exactly two rhetorical devices on top of a substantive argument, and name them.',
  },
  {
    number: 30,
    oneLine: 'These skills persuade regardless of truth — which is why your integrity as a speaker matters.',
    idea: [
      'The same techniques win debates and spread propaganda. Selective evidence, emotional framing and confident delivery have moved populations towards terrible decisions. As you become more persuasive, you become more responsible.',
      'Ethical speakers use evidence accurately, represent opponents fairly, disclose uncertainty, and accept that the audience may reasonably disagree. In debates you sometimes argue sides you do not hold — that trains empathy, as long as you never fabricate.',
    ],
    drills: [
      d(30, 'a', { title: 'The case you actually believe', brief: 'Deliver a two-minute speech on something you genuinely believe, explicitly stating your uncertainty on one point.', targetSeconds: 120 }),
      d(30, 'b', { title: 'Show your working', brief: 'Explain how you reached a view on a contested issue, including evidence that pointed the other way.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(30, 'c', { title: 'Propaganda techniques', brief: 'Describe persuasion techniques used in a historical or modern propaganda campaign and how an audience can resist them.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Fabricated evidence in competition prep.', 'Contempt for opposing views.', 'Discussion drifting into partisan politics rather than technique.'],
    selfCheck: ['Did I use evidence honestly?', 'Would I be comfortable if the audience saw how I built my case?'],
    realWorld: 'Debates, MUN, social media and the conversations that shape your views.',
    writePrompt: 'Write about an issue where you changed your mind, and what evidence or argument changed it.',
  },
];

export const SENIOR_WORLD_6: BandLesson[] = [
  {
    number: 31,
    oneLine: 'Evidence proves a point; a story is what makes people remember and act on it.',
    idea: [
      'An admissions panel reads hundreds of applications listing "passion for science". They remember the student who described the night their experiment failed for the ninth time. Stories create memory and meaning.',
      'In speeches, pair them: a specific case that makes the issue human, followed by evidence that shows it is not an isolated example. Either alone is weaker than both together.',
    ],
    drills: [
      d(31, 'a', { title: 'Three facts, flat', brief: 'Present three facts about an issue you care about as a flat list.', targetSeconds: 60 }),
      d(31, 'b', { title: 'One of them, as a story', brief: 'Present one of those facts through a specific person or moment, then show the evidence that it is typical.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(31, 'c', { title: 'Application story', brief: 'Tell the story behind one line on your future application — an activity or achievement — so it becomes memorable.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Anecdotes presented as proof.', 'Stories with no connection to the argument.', 'Invented stories presented as real.'],
    selfCheck: ['Which person or moment carried my fact?', 'Did I show it was representative?'],
    realWorld: 'Personal statements, admissions interviews and persuasive speeches.',
    writePrompt: 'Write an achievement as a flat CV line, then as a short story with a specific moment.',
  },
  {
    number: 32,
    oneLine: 'Your best stories are moments of change, not dramatic events.',
    idea: [
      'Students often believe they need a dramatic life story for an interview or personal statement. Admissions tutors say the opposite: the most compelling stories are small moments of insight, decision or growth, told honestly.',
      'Look for before and after: the project that changed what you want to study, the argument that changed your mind, the responsibility that changed how you work. That change is what a panel wants to understand.',
    ],
    drills: [
      d(32, 'a', { title: 'The moment it changed', brief: 'Tell a sixty-second story about a moment that changed what you want to study or do.', targetSeconds: 60 }),
      d(32, 'b', { title: 'The most boring subject you have', brief: 'Take the most ordinary part of your school life and find a moment of change in it. Tell it in ninety seconds.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(32, 'c', { title: 'Why this subject', brief: 'Tell the story behind your chosen subject or career interest, focusing on the turning point rather than a lifelong passion.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Clichéd "passion since childhood" narratives.', 'Stories exaggerated for effect.', 'No clear before and after.'],
    selfCheck: ['What was different after the moment?', 'Would this work in my personal interview?'],
    realWorld: 'Personal statements, college interviews and scholarship essays presented orally.',
    writePrompt: 'Write three moments of change from your school years that could anchor an interview answer.',
  },
  {
    number: 33,
    oneLine: 'Situation, turn, resolution — and the turn is where interviewers learn about you.',
    idea: [
      'Behavioural questions in interviews ("Tell us about a time you showed leadership") are asking for a story. The common failure is spending most of the answer describing the event and too little on what you decided and did.',
      'Use STAR: situation and task briefly, action in detail, result with evidence and what you learned. The action is where the panel sees your judgement and character.',
    ],
    model: {
      text: 'Two weeks before our school fest, the sponsor pulled out. As finance head I listed every cost, cut three non-essential items and pitched to four local businesses. Two agreed, and we ran the fest within budget. I learned to plan for the worst case before the event, not during it.',
      noticing: ['Situation in one sentence.', 'Specific actions.', 'A measurable result and lesson.'],
    },
    drills: [
      d(33, 'a', { title: 'Setup, turn, resolution', brief: 'Tell a leadership or responsibility story in three sentences: situation, your action, result.', targetSeconds: 30 }),
      d(33, 'b', { title: 'The full version', brief: 'Expand it into a ninety-second STAR interview answer, spending most of the time on your action.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(33, 'c', { title: 'Teamwork STAR', brief: 'Answer "Tell us about a time a team project went wrong" using STAR, making your personal role clear.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['"We" hiding individual contribution.', 'Results with no evidence or learning.', 'Situation taking half the answer.'],
    selfCheck: ['What did I personally do?', 'Was my result specific?'],
    realWorld: 'Admissions, scholarship and internship interviews.',
    writePrompt: 'Write STAR answers for a leadership moment and a teamwork problem from your school life.',
  },
  {
    number: 34,
    oneLine: 'One precise detail makes a story credible; too many make it a recital.',
    idea: [
      '"I organised a charity event" sounds like every other application. "I persuaded forty classmates to give up a Saturday, and we raised enough to fund a year of school supplies for twelve children" sounds real and specific.',
      'Choose details that are concrete, verifiable and connected to the turn or result. Background detail about everyone involved and every step of logistics belongs nowhere in a two-minute answer.',
    ],
    drills: [
      d(34, 'a', { title: 'One detail per beat', brief: 'Tell a ninety-second story from your activities with one specific, concrete detail in each of situation, action and result.', targetSeconds: 90 }),
      d(34, 'b', { title: 'Too much detail, on purpose', brief: 'Tell the same story overloaded with logistics, then identify where a panel would lose interest.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(34, 'c', { title: 'Generic to specific', brief: 'Convert these into specific claims from your experience: "showed leadership", "passionate about science", "good at teamwork".', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Buzzwords from application templates.', 'Unverifiable claims.', 'Logistics instead of outcomes.'],
    selfCheck: ['Which detail made my story credible?', 'What did I include that did not matter?'],
    realWorld: 'Interviews, personal statements and scholarship applications.',
    writePrompt: 'Rewrite three generic statements from a draft application as specific, verifiable ones.',
  },
  {
    number: 35,
    oneLine: 'Well-judged humour builds rapport; humour that targets anyone in the room costs you.',
    idea: [
      'A light moment in an interview, a farewell speech or a debate can build connection quickly. But humour about teachers, classmates, identity or appearance can offend panels, adjudicators and audiences — and screenshots last.',
      'Self-deprecating stories about low-stakes mistakes and observations about shared experiences (exam season, school canteens, group projects) are safe. In formal settings, one light line is plenty; never joke about the competence you are asking them to trust.',
    ],
    drills: [
      d(35, 'a', { title: 'The time you were the fool', brief: 'Tell a sixty-second, light story about a low-stakes mistake you made, with a real lesson.', targetSeconds: 60 }),
      d(35, 'b', { title: 'The line, then the pause', brief: 'Deliver an observational line about school life suitable for a farewell speech, pause, then move into a sincere point.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(35, 'c', { title: 'Farewell speech opener', brief: 'Open a Grade 12 farewell speech with one warm, inclusive funny line, then transition to gratitude.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Inside jokes that exclude part of the audience.', 'Humour about teachers or classmates by name.', 'Humour that undermines serious content.'],
    selfCheck: ['Who was the target?', 'Would every person in the room be comfortable?'],
    realWorld: 'Farewell speeches, anchoring school events and interviews.',
    writePrompt: 'Write a farewell speech opening with one inclusive funny line and a transition to a sincere message.',
  },
  {
    number: 36,
    oneLine: 'A personal story is powerful when you have enough distance to tell it steadily.',
    idea: [
      'Interviewers and audiences connect with honesty about setbacks: a poor result, a rejection, a family responsibility, a failure that changed your approach. But a story that is still raw can overwhelm you mid-answer.',
      'Choose experiences you can talk about calmly and that connect to growth. You decide the boundary — you never owe a panel private pain, and a focused story about a smaller setback often works better than a painful one.',
    ],
    drills: [
      d(36, 'a', { title: 'Something that went wrong', brief: 'Tell a ninety-second story about an academic or personal setback and what you do differently now.', targetSeconds: 90 }),
      d(36, 'b', { title: 'The same story, no sympathy asked', brief: 'Retell it focused entirely on decisions and learning, asking for no sympathy.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(36, 'c', { title: 'Failure question', brief: 'Answer "Tell us about your biggest failure" in ninety seconds, suitable for a college interview.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Stories still emotionally raw.', 'Failures disguised as successes.', 'Oversharing private details under pressure.'],
    selfCheck: ['Could I tell this calmly to a stranger?', 'What growth did it show?'],
    realWorld: 'College interviews, scholarship panels and personal statements.',
    writePrompt: 'Write a setback story focused on your decisions and what changed, suitable for an interview.',
  },
];
