import { bd, type BandLesson } from '../types';

/** Grades 10–12 · Worlds 3 and 4 — arguments with structure, and presence under scrutiny. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('senior', n, part, x);

export const SENIOR_WORLD_3: BandLesson[] = [
  {
    number: 13,
    oneLine: 'If you cannot state your argument in one sentence, the adjudicator will not be able to either.',
    idea: [
      'Debate adjudicators, examiners and interviewers write down one line summarising what you argued. If you do not make that line obvious, they will write their own version — usually a weaker one.',
      'A topic ("social media and teenagers") is not an argument. A thesis ("Social media platforms should be legally required to verify users\' ages") is. If your thesis contains "and", you are running two cases and neither will be fully defended.',
    ],
    model: {
      text: 'This house believes that internships, not entrance exams, should decide admission to professional courses — because they measure the skills those courses actually need.',
      noticing: ['A single, arguable claim.', 'The reason is built into the thesis.'],
    },
    drills: [
      d(13, 'a', { title: 'The one sentence', brief: 'State the thesis of a debate, essay or presentation you are working on in one sentence with no "and".', targetSeconds: 15 }),
      d(13, 'b', { title: 'Say it, then defend it', brief: 'State your thesis, then defend it for ninety seconds without drifting into related issues.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(13, 'c', { title: 'Motion to thesis', brief: 'Take the motion "Technology in education" and produce three distinct, arguable one-sentence theses.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Theses nobody would contest.', 'Double-barrelled claims.', 'Topics dressed as arguments.'],
    selfCheck: ['Could an adjudicator write my thesis down after hearing it once?', 'Is it genuinely arguable?'],
    realWorld: 'Debate cases, extended essays presented orally and MUN position statements.',
    writePrompt: 'Write a one-sentence thesis for a current debate motion and the three strongest arguments supporting it.',
  },
  {
    number: 14,
    oneLine: 'Your opening is where nerves peak — so it is the part you should be able to say in your sleep.',
    idea: [
      'Strong openings for competitions and interviews: a sharp question, a precise statistic, a short real case, or a bold statement of your position. Weak ones: a long list of salutations, a dictionary definition, or an apology.',
      'Adrenaline peaks in the first minute. Rehearse your opening two sentences until they are automatic, so the hardest moment of the speech does not depend on thinking clearly.',
    ],
    model: {
      text: 'In twenty twenty-three, a seventeen-year-old found a flaw in a banking app that exposed a million accounts. She reported it for free. The bank\'s response tells us everything about how we treat young people\'s talent.',
      noticing: ['A real, specific case.', 'The final sentence sets up the argument.'],
    },
    drills: [
      d(14, 'a', { title: 'Four openings, one talk', brief: 'For one speech topic, deliver four openings: a question, a statistic, a case and a bold claim.', targetSeconds: 60 }),
      d(14, 'b', { title: 'The opening, word for word', brief: 'Rehearse your strongest opening until precise, then deliver it followed by the next forty-five seconds of your speech.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(14, 'c', { title: 'Beyond the dictionary', brief: 'Deliver an opening that starts with a dictionary definition, then replace it with a stronger one.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Definitions as openings.', 'Examples used without verifying they are true.', 'Openings delivered too fast.'],
    selfCheck: ['Would an adjudicator put their pen down to listen?', 'Can I deliver my opening under pressure?'],
    realWorld: 'Speech competitions, debate first-proposition speeches and interview introductions.',
    writePrompt: 'Write four openings for one speech and explain which is strongest for your specific audience.',
  },
  {
    number: 15,
    oneLine: 'Three distinct, well-ordered arguments beat seven overlapping ones.',
    idea: [
      'Adjudicators and examiners reward arguments that are distinct and developed, not numerous. Seven thin points signal a list; three developed ones signal thinking.',
      'Each argument needs a claim, a reason and evidence or an example. Order strategically: lead with the argument the opposition most needs to answer, or build to your strongest. Principled–practical–impact is a reliable debate order.',
    ],
    model: {
      text: 'Our case rests on three arguments. First, the principle: students have a right to participate in decisions about their education. Second, the practice: schools with student councils report better policies. Third, the impact: engagement rises when students have a voice.',
      noticing: ['Principled, practical, impact.', 'Each argument is distinct.'],
    },
    drills: [
      d(15, 'a', { title: 'Three points, one support each', brief: 'Argue for or against compulsory community service for Grade 11 with three distinct arguments, each with one piece of support.', targetSeconds: 90 }),
      d(15, 'b', { title: 'The same three, reordered', brief: 'Deliver the same case in principled–practical–impact order and explain which order is stronger for this motion.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(15, 'c', { title: 'Merge the overlaps', brief: 'List five overlapping points on a motion aloud, then merge them into three distinct arguments.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Overlapping arguments.', 'Evidence dumps without analysis.', 'Arguments not linked back to the thesis.'],
    selfCheck: ['Are my three arguments genuinely distinct?', 'Why did I choose that order?'],
    realWorld: 'Debate cases, persuasive speeches and structured viva answers.',
    writePrompt: 'Write a principled, practical and impact argument for a motion, each with a claim, reason and example.',
  },
  {
    number: 16,
    oneLine: 'Adjudicators cannot see your structure — signposting lets them mark it.',
    idea: [
      'In a debate, the adjudicator is taking notes in real time. If they cannot tell when your first argument ends and your rebuttal begins, your structure earns you nothing.',
      'Preview ("I will make two arguments and rebut one claim"), label transitions ("That is the principle; now the practical harm"), and summarise ("So we have shown…"). Clear signposting is often the difference between close rounds.',
    ],
    model: {
      text: 'I will do two things: rebut the opposition\'s claim about cost, and extend our argument on fairness. First, the rebuttal.',
      noticing: ['A preview the adjudicator can write down.', 'An explicit entry into the first section.'],
    },
    drills: [
      d(16, 'a', { title: 'Three points, signposted', brief: 'Deliver a ninety-second debate speech with a preview, labelled transitions and a summary.', targetSeconds: 90 }),
      d(16, 'b', { title: 'The same talk, unsignposted', brief: 'Deliver the same content with no signposting, then describe what an adjudicator\'s notes would miss.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(16, 'c', { title: 'Second speaker structure', brief: 'As a second speaker, signpost your rebuttal, your new argument and your summary clearly in sixty seconds.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Previews that promise a structure not delivered.', 'Rebuttal and constructive material blurring together.', 'Missing summaries.'],
    selfCheck: ['Could an adjudicator map my speech from my signposts?', 'Did my preview match my delivery?'],
    realWorld: 'Competitive debating, MUN speeches and structured oral exams.',
    writePrompt: 'Write the signposting script — preview, transitions and summary — for a second speaker\'s debate speech.',
  },
  {
    number: 17,
    oneLine: 'The last sentence is what the adjudicator writes down — do not waste it.',
    idea: [
      'Competition speeches often end with "Thank you, and I am open to points of information" or trail off when the bell rings. The final impression becomes the time limit.',
      'Plan your close: restate the thesis memorably, close the loop from your opening, or state the choice before the audience. Watch the clock and begin your close before the final bell, so your ending is never cut off.',
    ],
    model: {
      text: 'We began with a seventeen-year-old who found a flaw and was ignored. Proposition\'s world listens to her. Opposition\'s world sends her abroad. We are proud to propose.',
      noticing: ['Closes the loop from the opening.', 'Frames the choice between the two sides.'],
    },
    drills: [
      d(17, 'a', { title: 'Open and close the same loop', brief: 'Deliver only the opening and closing sentences of a speech, where the close resolves the opening.', targetSeconds: 30 }),
      d(17, 'b', { title: 'Say it and stop', brief: 'Deliver a ninety-second speech that begins its close at seventy-five seconds and ends on a strong line with two seconds of silence.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(17, 'c', { title: 'Bell-proof ending', brief: 'Deliver a two-sentence emergency close you could use if you run out of time mid-argument.', targetSeconds: 20 }),
    ],
    mentorWatchFor: ['Endings cut off by the bell.', 'New arguments introduced in the close.', 'Filler sign-offs.'],
    selfCheck: ['What was my final line?', 'Did I start my close in time?'],
    realWorld: 'Debate summaries, elocution contests and head-student election speeches.',
    writePrompt: 'Write a planned close and a bell-proof emergency close for a current speech or debate.',
  },
  {
    number: 18,
    oneLine: 'Every accurate but irrelevant fact competes with the argument that wins the round.',
    idea: [
      'Students who have researched deeply want to show it: every statistic, every example, every nuance. Under a time limit, that breadth buries the analysis that actually earns marks.',
      'Apply a so-what test to every point: does it prove the thesis or answer the opposition? If not, cut it. A speech that uses seven of eight minutes on three developed arguments beats one that sprints through six.',
    ],
    drills: [
      d(18, 'a', { title: 'Two minutes', brief: 'Deliver a two-minute speech including all the research you have on a topic.', targetSeconds: 120 }),
      d(18, 'b', { title: 'The same talk in sixty seconds', brief: 'Deliver it in sixty seconds, keeping only what proves the thesis. State what you cut and why.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(18, 'c', { title: 'Thirty-second case', brief: 'Summarise your entire case for a motion in thirty seconds for a team briefing before the round.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Speed replacing selection.', 'Keeping impressive but irrelevant statistics.', 'Cutting analysis instead of examples.'],
    selfCheck: ['What did I cut that I was proud of researching?', 'Is the short version more persuasive?'],
    realWorld: 'Timed debates, presentations with strict limits and interview answers.',
    writePrompt: 'List every point from a speech and label each keep, cut or save for rebuttal, with a reason.',
  },
];

export const SENIOR_WORLD_4: BandLesson[] = [
  {
    number: 19,
    oneLine: 'Stillness reads as composure — to interview panels, examiners and adjudicators alike.',
    idea: [
      'Under scrutiny, bodies leak nerves: bouncing knees under the interview table, swaying at the lectern, playing with a pen during a viva. Panels notice these before they notice your answer.',
      'Standing, plant your feet and move only with purpose. Seated, sit upright with both feet on the floor and hands resting on the table or your lap. Stillness does not mean stiffness — it means every movement is chosen.',
    ],
    drills: [
      d(19, 'a', { title: 'Sixty seconds, standing', brief: 'Deliver a sixty-second competition speech opening while grounded, moving only once, deliberately.', targetSeconds: 60 }),
      d(19, 'b', { title: 'Standing versus sitting', brief: 'Deliver the same forty-five-second answer standing, then seated as in an interview. Note changes in voice and presence.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(19, 'c', { title: 'Viva posture', brief: 'Answer a seated viva-style question for sixty seconds with both feet flat, hands still and upright posture throughout.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Bouncing knees and pen fiddling when seated.', 'Leaning on the lectern.', 'Rigid posture that looks defensive.'],
    selfCheck: ['What movements did I not choose?', 'How did seated posture change my voice?'],
    realWorld: 'Interview panels, practical vivas and competition lecterns.',
    writePrompt: 'Write your nervous physical habits in seated and standing settings and the composed alternative for each.',
  },
  {
    number: 20,
    oneLine: 'A gesture should carry meaning you would otherwise have to say.',
    idea: [
      'Effective gestures show structure (counting arguments), scale (rising costs), contrast (proposition versus opposition), and sequence (a timeline). They help an adjudicator follow and remember.',
      'Constant chopping, repeated pointing at the audience and hands glued to the lectern distract or signal anxiety. Plan gestures for your key moments and let your hands rest the rest of the time.',
    ],
    drills: [
      d(20, 'a', { title: 'Sentences with shape', brief: 'Describe a rising trend, a contrast between two positions and a three-stage process, each with one precise gesture.', targetSeconds: 45 }),
      d(20, 'b', { title: 'Three points, three fingers', brief: 'Deliver a sixty-second, three-argument case, counting arguments visibly and resting your hands between them.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(20, 'c', { title: 'Contrast gesture', brief: 'Deliver a forty-five-second rebuttal using space to separate the opposition\'s claim from your answer.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Pointing at opponents.', 'Gestures lagging behind words.', 'Hands gripping the lectern.'],
    selfCheck: ['Which gestures helped the listener follow?', 'Were my hands calm otherwise?'],
    realWorld: 'Debate speeches, MUN addresses and science exhibition presentations.',
    writePrompt: 'Script a short rebuttal and note the gesture you will use for the opposition\'s claim and for your answer.',
  },
  {
    number: 21,
    oneLine: 'Give each panel member a complete thought — darting eyes signal anxiety.',
    idea: [
      'In admissions interviews and panel vivas, eye contact signals honesty and confidence. Looking only at the person who asked, or up at the ceiling while thinking, weakens both.',
      'Start your answer with the questioner, share middle thoughts with the rest of the panel, and return to the questioner to finish. In a hall, deliver one complete thought to one section of the audience before moving.',
    ],
    drills: [
      d(21, 'a', { title: 'One person, one thought', brief: 'Imagine a three-person admissions panel. Answer "Why this course?" in ninety seconds, starting and ending with the questioner and including the others.', targetSeconds: 90 }),
      d(21, 'b', { title: 'The sweep, for comparison', brief: 'Deliver the same answer sweeping your eyes quickly around the panel, then describe the difference.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(21, 'c', { title: 'Online panel', brief: 'Answer an interview question as if on a video call, looking at the lens for your key sentence.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Eye contact only with the questioner.', 'Looking up and away while thinking.', 'Reading notes during interview answers.'],
    selfCheck: ['Did I include the whole panel?', 'Where did my eyes go while I thought?'],
    realWorld: 'College interviews, scholarship panels and oral examinations.',
    writePrompt: 'Write an eye contact plan for a three-person panel interview: start, middle and finish.',
  },
  {
    number: 22,
    oneLine: 'Notes should hold your structure, not your sentences — scripts get read, and reading loses marks.',
    idea: [
      'Many elocution and debate speakers memorise or read full scripts. The result is a recitation rhythm, little eye contact, and total collapse if a line is forgotten or a point of information interrupts.',
      'Use a cue card with your thesis, argument headlines, key evidence you must get exactly right, and your close. Everything else in your own words. Your wording will vary each time — that variation is what sounds like thinking.',
    ],
    drills: [
      d(22, 'a', { title: 'Five words, two minutes', brief: 'Deliver a two-minute debate speech from a cue card of at most five prompts plus exact figures.', targetSeconds: 120 }),
      d(22, 'b', { title: 'The script, for comparison', brief: 'Read one minute of the same speech from a full script, then compare both recordings.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(22, 'c', { title: 'Point of information', brief: 'Deliver a speech from prompts, simulate a point of information mid-way, answer it, and find your place.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Recitation rhythm from memorised scripts.', 'Cue cards with tiny full sentences.', 'Collapse after interruptions.'],
    selfCheck: ['What was on my cue card?', 'How did I handle the interruption?'],
    realWorld: 'Debates with points of information, elocution contests and presentations.',
    soundLab: ['ea', 'oo'],
    writePrompt: 'Convert a full written speech into a cue card with thesis, headlines, exact evidence and close.',
  },
  {
    number: 23,
    oneLine: 'Online interviews and recorded submissions need presence projected through a lens.',
    idea: [
      'Many college and scholarship interviews are online, and some applications ask for recorded video answers. Energy that works in a room looks flat on camera, and looking at the interviewer\'s face on screen looks like looking down.',
      'Raise your camera to eye level, frame head and shoulders, light your face from the front, and look into the lens for key sentences. Speak slightly slower with a little more energy — connection lag swallows rushed speech.',
    ],
    drills: [
      d(23, 'a', { title: 'To the lens', brief: 'Record a ninety-second video answer to "Tell us about yourself" as for a college application, delivering key sentences into the lens.', targetSeconds: 90 }),
      d(23, 'b', { title: 'To the room, then to the camera', brief: 'Deliver thirty seconds as if to a room, then the same content optimised for camera. Compare eye line and energy.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(23, 'c', { title: 'Timed video response', brief: 'Record a sixty-second answer with thirty seconds of preparation, as many recorded application platforms require.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Camera below eye level.', 'Reading notes off-screen.', 'Low energy on camera.'],
    selfCheck: ['Where was my eye line?', 'Did my energy come through?'],
    realWorld: 'Online admissions interviews and recorded application videos.',
    soundLab: ['c', 'ch'],
    writePrompt: 'Write a set-up and delivery checklist for an online interview or recorded application video.',
  },
];
