import { bd, type BandLesson } from '../types';

/** Grades 10–12 · Worlds 7 and 8 — admissions interviews, vivas, group discussions, MUN and debate. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('senior', n, part, x);

export const SENIOR_WORLD_7: BandLesson[] = [
  {
    number: 37,
    oneLine: 'A strong admissions answer makes one point, proves it with an example, and stops.',
    idea: [
      'College, scholarship and internship interviews ask versions of the same questions: tell us about yourself, why this course, why this university, a challenge you faced. Panels want clarity, genuine motivation and self-awareness.',
      'Use answer–evidence–relevance–stop: a direct answer, one specific example, a link to the course or opportunity, then silence. The most common failure is continuing until a good answer becomes a rambling one.',
    ],
    model: {
      text: 'Question: Why economics? Answer: Because I want to understand why sensible policies fail. When our city introduced odd-even traffic rules, I tracked how people adapted around them for a school project. That gap between the policy and human behaviour is exactly what behavioural economics studies.',
      noticing: ['A direct answer first.', 'A specific personal example.', 'A link to the course, then it stops.'],
    },
    drills: [
      d(37, 'a', { title: '"Tell me about yourself"', brief: 'Answer "Tell me about yourself" for a college or scholarship interview in under ninety seconds.', targetSeconds: 90 }),
      d(37, 'b', { title: 'Answer, evidence, relevance, stop', brief: 'Answer "Why do you want to study this subject?" using answer, evidence, relevance, stop.', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(37, 'c', { title: 'Why this university', brief: 'Answer "Why this university?" with specifics about the course or programme, not rankings or location.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Rankings and prestige as motivation.', 'Recited personal statements.', 'Answers longer than two minutes.'],
    selfCheck: ['Did my example prove my answer?', 'Did I stop when the point was made?'],
    realWorld: 'College admissions, scholarship and internship interviews.',
    soundLab: ['x', 'g'],
    writePrompt: 'Write answer–evidence–relevance for "Why this subject?" and "Why this university?" for a real target.',
  },
  {
    number: 38,
    oneLine: 'In a practical viva or oral exam, show understanding, name the edge of it, and never bluff.',
    idea: [
      'Board practical vivas, project defences and olympiad interviews test whether you understand your work — the method, the reasons behind it and its limits. Examiners probe until they find the edge of your knowledge.',
      'Explain in your own words with the reasoning, own your method\'s limitations before being asked, and when you do not know, say what you do know, what would answer the question, and whether it affects your result.',
    ],
    drills: [
      d(38, 'a', { title: 'Explain something you know, then the edge of it', brief: 'Explain a practical experiment or project you did, why you used that method, and its main limitation.', targetSeconds: 80 }),
      d(38, 'b', { title: 'Saying "I do not know" well', brief: 'Answer an examiner\'s question beyond your syllabus: what you know, what would answer it, and why.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(38, 'c', { title: 'Sources of error', brief: 'Explain three sources of error in a practical experiment and how each would affect your result.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Memorised procedures with no reasoning.', 'Bluffing on theory beyond the syllabus.', 'Limitations admitted only under pressure.'],
    selfCheck: ['Did I explain why, not just what?', 'Did I name limitations proactively?'],
    realWorld: 'Board practical vivas, project defences and olympiad or research interviews.',
    writePrompt: 'Write the likely viva questions for a practical or project you did, with reasoning-based answers and one limitation.',
  },
  {
    number: 39,
    oneLine: 'Presenting to a panel or class rewards conversation and responsiveness, not performance.',
    idea: [
      'Project presentations, exhibition judging and school leadership presentations happen in small rooms with people who interrupt, question and know the subject. A performed, memorised delivery handles none of that well.',
      'Lead with your key finding, keep a conversational tone, treat questions as part of the presentation, and signpost back to your structure after each one. If the panel is ready to discuss, let the discussion happen.',
    ],
    drills: [
      d(39, 'a', { title: 'Three minutes, to a table', brief: 'Deliver a three-minute project presentation to an imagined panel of teachers, leading with your key finding.', targetSeconds: 180 }),
      d(39, 'b', { title: 'Interrupted, and back', brief: 'Deliver a presentation, respond to a challenging question about your method mid-way, then signpost back and continue.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(39, 'c', { title: 'Exhibition pitch', brief: 'Give a sixty-second pitch of your science exhibition project to a judge walking past, ending with an invitation to ask questions.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Memorised delivery that breaks when interrupted.', 'Defensiveness about method questions.', 'Burying the finding at the end.'],
    selfCheck: ['Did I lead with my finding?', 'How did I handle the interruption?'],
    realWorld: 'Project presentations, science exhibitions and leadership selection panels.',
    soundLab: ['ough'],
    writePrompt: 'Write a sixty-second exhibition pitch and the three questions a judge is most likely to ask.',
  },
  {
    number: 40,
    oneLine: 'In group discussions and MUN, influence comes from timing and synthesis, not volume.',
    idea: [
      'Group discussion rounds for admissions, MUN caucuses and class seminars are assessed on contribution quality: initiating, building, synthesising and including others. The loudest participant is frequently marked down.',
      'Enter with purpose — "Building on Kabir\'s point…", "Let me bring together what we have agreed…", "Aisha, you have not had a chance yet". A clear synthesis near the end is often the highest-scoring contribution in the room.',
    ],
    drills: [
      d(40, 'a', { title: 'Three entries, three connectors', brief: 'Make three contributions to an imagined group discussion on "Should university admissions consider more than exam marks?" — build, challenge, synthesise.', targetSeconds: 60 }),
      d(40, 'b', { title: 'Bring somebody in', brief: 'Invite a quiet participant in by name with an open question, then connect their answer to the discussion.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(40, 'c', { title: 'MUN unmoderated caucus', brief: 'In forty-five seconds, pitch a compromise clause that brings two opposing blocs together.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Talking over others to gain airtime.', 'Contributions unrelated to previous speakers.', 'Silence until the end.'],
    selfCheck: ['Did I move the discussion forward?', 'Did I include someone?'],
    realWorld: 'Group discussion rounds, MUN committees and seminar-style classes.',
    writePrompt: 'Write connector phrases for initiating, building, challenging, synthesising and including in a group discussion.',
  },
  {
    number: 41,
    oneLine: 'Extempore and impromptu rounds reward structure — pour what you know into a shape.',
    idea: [
      'Extempore competitions, surprise interview questions and "just say a few words" moments reward the student who organises quickly, not the one with the most facts.',
      'Pick a shape in the first two seconds: past–present–future; point–reason–example–point; problem–cause–solution; for–against–verdict. Then speak to it, and land a clear final sentence before time runs out.',
    ],
    drills: [
      d(41, 'a', { title: 'Past, present, future', brief: 'Speak for sixty seconds on "Artificial intelligence in classrooms" using past, present and future, with no preparation.', targetSeconds: 60 }),
      d(41, 'b', { title: 'Point, example, point', brief: 'Speak for sixty seconds on "Should voting age be lowered to sixteen?" using point–reason–example–point.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(41, 'c', { title: 'For, against, verdict', brief: 'Speak for sixty seconds on a random motion using for, against and your verdict.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Freezing while searching for facts.', 'Structures abandoned mid-way.', 'No final verdict sentence.'],
    selfCheck: ['How quickly did I pick a shape?', 'Did I land a final sentence?'],
    realWorld: 'Extempore competitions, surprise interview questions and anchoring events.',
    writePrompt: 'Write the four impromptu shapes and apply each to "Is social media good for democracy?" in three lines.',
  },
  {
    number: 42,
    oneLine: 'Hear the question fully, restate it, buy two seconds, then answer what was actually asked.',
    idea: [
      'Points of information, Q&A after presentations and follow-up interview questions test composure. Under pressure, students answer the question they prepared for instead of the one asked, or become defensive.',
      'Listen to the end, restate or clarify, then answer concisely. For hostile questions, acknowledge what is fair, keep your tone even and address the substance. Declining a point of information politely is also a skill.',
    ],
    drills: [
      d(42, 'a', { title: 'Restate, then answer', brief: 'Answer "But would lowering the voting age not just let parents influence more votes?" by restating it, then responding.', targetSeconds: 60 }),
      d(42, 'b', { title: 'The hostile question', brief: 'Respond evenly to "That sounds like something you read online — do you actually understand it?"', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(42, 'c', { title: 'Point of information', brief: 'Accept a point of information mid-speech, answer it in two sentences, and return to your structure.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Answering a different question.', 'Defensive or sarcastic tone.', 'Accepting too many points of information.'],
    selfCheck: ['Did I answer what was asked?', 'Did my tone stay even?'],
    realWorld: 'Debate points of information, presentation Q&A and interview follow-ups.',
    writePrompt: 'Write five tough follow-up questions for your next interview or presentation, including one hostile one, with concise answers.',
  },
];

export const SENIOR_WORLD_8: BandLesson[] = [
  {
    number: 43,
    oneLine: 'Your prepared speech is a plan — when the room tells you something different, the room wins.',
    idea: [
      'An assembly after a long exam, a panel running late, an MUN committee that has already moved on, a judge who clearly knows more than you: the audience you get is rarely the one you prepared for.',
      'Read the signals — restlessness, repeated clarifications, a chair checking the time — and adjust: cut to your strongest point, go deeper where there is doubt, or turn explanation into discussion. Adapting shows command.',
    ],
    drills: [
      d(43, 'a', { title: 'The same talk, two audiences', brief: 'Deliver the same topic twice: to Grade 6 students at an orientation, then to parents and teachers at an annual day.', targetSeconds: 90 }),
      d(43, 'b', { title: 'Cut a point live', brief: 'Start a five-minute speech; after one minute you are told you have two minutes left. Compress to your key point and close.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(43, 'c', { title: 'Committee has moved on', brief: 'You prepared a speech on one clause, but the MUN committee has shifted to another. Adapt your points to the new debate in sixty seconds.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Pushing through prepared material regardless.', 'Speeding up instead of cutting.', 'Talking down to younger audiences.'],
    selfCheck: ['What did I change for each audience?', 'What did I cut when time shrank?'],
    realWorld: 'Assemblies, annual day speeches, MUN committees and interviews running late.',
    writePrompt: 'Write one talk in three lengths — thirty seconds, two minutes and five minutes — and the signals that would make you switch.',
  },
  {
    number: 44,
    oneLine: 'Slides should carry what you cannot say — dense slides compete with you for the panel\'s attention.',
    idea: [
      'School project presentations often use slides as the script: bullet points read aloud with your back to the audience. Judges and teachers then read ahead and stop listening.',
      'Use action titles that state the takeaway, one chart or image per slide, and minimal text. Keep detailed data for a handout or a backup slide you show only if asked.',
    ],
    drills: [
      d(44, 'a', { title: 'The talk with no slides at all', brief: 'Deliver a two-minute version of a project presentation that normally uses slides, using only structure and language.', targetSeconds: 120 }),
      d(44, 'b', { title: 'One image, two minutes', brief: 'Present one graph or diagram from a subject you study for two minutes, guiding attention: what to look at, what it shows, why it matters.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(44, 'c', { title: 'Action titles', brief: 'Read out topic-style slide titles from a project, then convert each into an action title stating the takeaway.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Reading bullet points aloud.', 'Turning away from the audience.', 'Graphs shown without explanation.'],
    selfCheck: ['Did each slide carry one message?', 'Did I guide the audience through the graph?'],
    realWorld: 'Project presentations, science exhibitions and school events.',
    writePrompt: 'Plan a five-slide project presentation with action titles, one visual per slide and what you will say for each.',
  },
  {
    number: 45,
    oneLine: 'Debate is judged on clash — how you handle the other side\'s best argument.',
    idea: [
      'Adjudicators reward speakers who engage directly with the opposing case. Two parallel speeches that never meet score poorly, however polished each one is.',
      'Identify the opposition\'s load-bearing claim, represent it fairly, and challenge its evidence, logic or weighting. Then weigh: explain why your impacts matter more. Keep it about the argument, never the speaker.',
    ],
    drills: [
      d(45, 'a', { title: 'Their strongest point, said fairly', brief: 'For the motion "This house would ban homework in secondary school", state the opposition\'s strongest argument fairly.', targetSeconds: 45 }),
      d(45, 'b', { title: 'Rebut the load-bearing claim', brief: 'Deliver a ninety-second rebuttal targeting the opposition\'s key claim, then weigh why your side wins.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(45, 'c', { title: 'Reply speech', brief: 'Deliver a sixty-second reply speech summarising the key clashes of a debate and why your side won each.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Rebutting minor points while the key claim stands.', 'Personal attacks on speakers.', 'No weighing of impacts.'],
    selfCheck: ['Which claim was load-bearing?', 'Did I weigh, or just list?'],
    realWorld: 'Inter-school debates, parliamentary debating and MUN.',
    writePrompt: 'Map a debate: the key clashes, the opposition\'s load-bearing claim, your rebuttal and your weighing.',
  },
  {
    number: 46,
    oneLine: 'Feedback that wins the next round names the exact moment and one change — praise and criticism of the person do neither.',
    idea: [
      'Peer feedback in debate clubs, MUN delegations and class presentations is often either flattering or harsh, and rarely useful. Useful feedback is specific: the moment, what happened, the effect, and one change.',
      'Receiving feedback well is a leadership skill: listen fully, thank them, ask for a specific example, and decide later. Asking "What is one thing I should change before the final?" gets better answers than "Was I good?"',
    ],
    drills: [
      d(46, 'a', { title: 'Moment, what, change', brief: 'Give feedback on a speech or presentation you watched using moment, what happened, effect and one change.', targetSeconds: 60 }),
      d(46, 'b', { title: 'The question that gets an answer', brief: 'Respond to "Your speech lacked impact" with thanks and one question that gets specific, usable feedback.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(46, 'c', { title: 'Adjudicator-style feedback', brief: 'Give ninety seconds of adjudicator-style oral feedback on a debate, explaining the deciding clash.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Feedback about personality.', 'Defensiveness when receiving.', 'Only positive feedback between friends.'],
    selfCheck: ['Was my feedback specific and actionable?', 'Did I ask for specifics when I received feedback?'],
    realWorld: 'Debate club, MUN preparation and peer review of presentations.',
    writePrompt: 'Write moment–what–effect–change feedback on a speech, and the question you will ask when feedback is vague.',
  },
  {
    number: 47,
    oneLine: 'Your final speech brings every skill together, on a subject you would stand up for in front of your whole school.',
    idea: [
      'Your final speech should be one you could deliver for real: at a competition, as a head-student candidate, at your farewell, or as the answer to "What do you care about?" in an interview.',
      'Integrate the course: a thesis in one sentence, a strong opening, three distinct arguments with signposts, a story with a turn, the strongest objection answered, a decisive close, controlled pace, composure and cue-card notes.',
    ],
    drills: [
      d(47, 'a', { title: 'The skeleton, from memory', brief: 'Deliver your final speech skeleton from memory: opening, thesis, three arguments, story, objection, close.', targetSeconds: 45 }),
      d(47, 'b', { title: 'The full speech', brief: 'Deliver your full speech of up to four and a half minutes, standing, from a cue card only.', targetSeconds: 270 }),
    ],
    extraDrills: [
      d(47, 'c', { title: 'The improved take', brief: 'Review your full recording, choose one specific improvement, and deliver the speech again.', targetSeconds: 270 }),
    ],
    mentorWatchFor: ['Topics chosen for competitions rather than conviction.', 'Strong content with delivery collapsing under pressure.', 'Missing objection or weak close.'],
    selfCheck: ['Which skills did I integrate deliberately?', 'Would I give this speech for real?'],
    realWorld: 'Competitions, school leadership campaigns, farewell speeches and interviews.',
    writePrompt: 'Write your final speech plan: opening, thesis, three arguments, story, objection and answer, and close.',
  },
];
