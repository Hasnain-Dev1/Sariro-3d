import { bd, type BandLesson } from '../types';

/** Grades 7–9 · Worlds 7 and 8 — interviews, orals, discussion, debate and the final speech. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('middle', n, part, x);

export const MIDDLE_WORLD_7: BandLesson[] = [
  {
    number: 37,
    oneLine: 'A strong interview answer makes one point, backs it with an example, and ends.',
    idea: [
      'At this age, interviews come for prefect and captain roles, scholarships, competitive programmes, student council and exchange trips. The panel is judging clarity and self-awareness far more than impressive achievements.',
      'Use answer, evidence, relevance, stop: give the direct answer, one real example, why it matters for this role — then stop. The most common failure is not knowing when to finish.',
    ],
    model: {
      text: 'Question: Why do you want to be sports captain? Answer: Because I am good at keeping a team together when things go badly. When we were three goals down last season, I got everyone to reset at half-time and we drew. Captains matter most in the bad moments.',
      noticing: ['Direct answer first.', 'One specific example.', 'A link back to the role, then it ends.'],
    },
    drills: [
      d(37, 'a', { title: '"Tell me about yourself"', brief: 'Answer "Tell me about yourself" for a school leadership interview in under ninety seconds: who you are, what drives you, one example.', targetSeconds: 80 }),
      d(37, 'b', { title: 'Answer, evidence, relevance, stop', brief: 'Answer "What is your biggest weakness?" using answer, evidence, relevance, stop.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(37, 'c', { title: 'The curveball', brief: 'Answer "Tell us about a time you disagreed with a teacher" honestly and respectfully.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Rehearsed answers that sound recited.', 'Weakness answers that are secretly boasts.'],
    selfCheck: ['Did my example prove my answer?', 'Did I stop cleanly?'],
    realWorld: 'Interviews for prefect, captain, scholarship or selective programmes.',
    soundLab: ['x', 'g'],
    writePrompt: 'Write answer, evidence, relevance for "Why should we choose you?" for a school role you would like.',
  },
  {
    number: 38,
    oneLine: 'In an oral exam, show your understanding, name the edge of it, and never bluff.',
    idea: [
      'Oral exams, practical vivas and science exhibition judges test whether you understand, not whether you memorised. Explaining a concept simply, with an example, scores higher than reciting a definition.',
      'When you reach the limit of what you know, say so precisely: "I know it involves… but I am not sure about…". Examiners can always tell a bluff, and a bluff costs more than honesty.',
    ],
    drills: [
      d(38, 'a', { title: 'Explain it, then its edge', brief: 'Explain a concept from science or maths you understand well, then describe clearly where your understanding runs out.', targetSeconds: 80 }),
      d(38, 'b', { title: 'Saying "I do not know" well', brief: 'Answer an exhibition judge\'s question you cannot fully answer — say what you do know, what you do not, and how you would find out.', targetSeconds: 40 }),
    ],
    extraDrills: [
      d(38, 'c', { title: 'Definition to explanation', brief: 'Give a textbook definition of a term, then explain the same idea in plain words with an everyday example.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Recited definitions with no understanding.', 'Confident guesses presented as fact.'],
    selfCheck: ['Could a younger student follow my explanation?', 'Did I state clearly where my knowledge stopped?'],
    realWorld: 'Language orals, science practical vivas and exhibition judging.',
    writePrompt: 'Write a plain-English explanation of a school concept, an everyday example, and one question about it you cannot yet answer.',
  },
  {
    number: 39,
    oneLine: 'Presenting to your own class breaks stage rules — it is small, familiar and full of interruptions.',
    idea: [
      'A classroom is not a theatre. Everyone knows you, some are judging, some are bored, and the teacher may interrupt with questions. A conversational, direct style works better than a big "performance".',
      'When interrupted, answer briefly, then signpost your way back: "Good question — that is actually my next point." Group presentations need clean handovers by name, not awkward shuffling.',
    ],
    drills: [
      d(39, 'a', { title: 'Three minutes, to your class', brief: 'Deliver a three-minute class presentation on a project, real or imagined, in a conversational tone.', targetSeconds: 180 }),
      d(39, 'b', { title: 'Interrupted, and back', brief: 'Start a presentation, pause for an imagined teacher question, answer it in one or two sentences, then signpost back to where you were.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(39, 'c', { title: 'The group handover', brief: 'Deliver your section of a group presentation: introduce your part, deliver it in sixty seconds and hand over to a named teammate.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Over-performed "stage" delivery in a small room.', 'Losing the thread after interruptions.'],
    selfCheck: ['Did I sound conversational?', 'How cleanly did I get back after the question?'],
    realWorld: 'Class presentations and group projects assessed by teachers.',
    soundLab: ['ough'],
    writePrompt: 'Write a group presentation plan with who covers which section and the exact handover sentence between each.',
  },
  {
    number: 40,
    oneLine: 'Being heard in a group is about timing and building, not volume.',
    idea: [
      'In group discussions — in class, in projects, in MUN committees — the loudest person is not the most influential. The one who listens, connects ideas and moves the group forward is.',
      'Enter with connectors: "Building on what Riya said…", "I see it differently because…", "Can we come back to…". And the most underrated move: bringing a quiet person in by name.',
    ],
    drills: [
      d(40, 'a', { title: 'Three entries, three connectors', brief: 'Imagine a group discussion on how to reduce waste at school. Make three contributions, each starting with a different connector.', targetSeconds: 60 }),
      d(40, 'b', { title: 'Bring somebody in', brief: 'In a pretend discussion, notice a quiet member, invite them in by name with an open question, and respond to what they say.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(40, 'c', { title: 'Redirect a dominator', brief: 'Politely redirect a group member who keeps talking over others, without making it personal.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Interrupting to get airtime.', 'Connectors used without actually referencing the previous idea.'],
    selfCheck: ['Did my contributions build on others?', 'Did I help anyone else get heard?'],
    realWorld: 'Group projects, MUN committees and class discussions that are assessed.',
    writePrompt: 'Write five connector phrases for group discussions: to build, to disagree, to redirect, to include someone and to summarise.',
  },
  {
    number: 41,
    oneLine: 'Impromptu speaking needs a shape, not content — pour what you know into it.',
    idea: [
      '"Say a few words about…" with no warning is where most people freeze, because they search for the perfect content. Instead, grab a structure and fill it.',
      'Past–present–future works for almost anything. Point–example–point is fast and clear. Problem–solution works for opinions. Pick the shape in the first second and you will never be stuck for the first sentence.',
    ],
    drills: [
      d(41, 'a', { title: 'Past, present, future', brief: 'Speak for sixty seconds on "technology in schools" using past, present and future — no preparation.', targetSeconds: 60 }),
      d(41, 'b', { title: 'Point, example, point', brief: 'Speak for sixty seconds on "Is it better to be a leader or a team player?" using point, example, point.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(41, 'c', { title: 'Random word challenge', brief: 'Pick a random object near you and speak about it for forty-five seconds using problem–solution.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Long silences searching for content.', 'Structures abandoned halfway.'],
    selfCheck: ['Which shape did I pick, and how fast?', 'Did I finish the shape?'],
    realWorld: 'Being asked to speak on the spot in class, at an event or in a competition round.',
    writePrompt: 'Write the three impromptu shapes from this lesson and use each to plan a response to "Should homework exist?" in three lines.',
  },
  {
    number: 42,
    oneLine: 'Hear the question, restate it, buy two seconds — then answer what was actually asked.',
    idea: [
      'After a presentation, you get the question you did not prepare for. The instinct is to start talking immediately, often answering a different question from the one asked.',
      'Restate it ("So you are asking whether…") to check understanding and buy thinking time. For a challenging question, stay calm and acknowledge any fair point before answering. It is fine to say you will check and come back.',
    ],
    drills: [
      d(42, 'a', { title: 'Restate, then answer', brief: 'After a talk on banning junk food ads, answer "Would that not just push companies to advertise online instead?" — restating it first.', targetSeconds: 60 }),
      d(42, 'b', { title: 'The challenging question', brief: 'Answer calmly: "Is this not just your opinion with no real evidence?" Acknowledge anything fair, then respond.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(42, 'c', { title: 'Question you cannot answer', brief: 'Answer a question you do not know the answer to: acknowledge it, share what you do know, and say how you would find out.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Answering a question that was not asked.', 'Defensive tone under challenge.'],
    selfCheck: ['Did I restate before answering?', 'Did I stay calm?'],
    realWorld: 'Q&A after presentations, debates and science exhibition judging.',
    writePrompt: 'Write three hard questions someone could ask about your last presentation and a calm answer to each.',
  },
];

export const MIDDLE_WORLD_8: BandLesson[] = [
  {
    number: 43,
    oneLine: 'Your plan is a guess about the room — when the room disagrees, the room wins.',
    idea: [
      'You prepare for an audience, but the real one might be tired, confused, already know your topic, or be younger than expected. Watching faces and adjusting is a core speaking skill.',
      'Signs to watch: glazed eyes (add a question or a story), confusion (slow down, give an example), impatience (cut a point and get to the ending). Changing course is not failure; it is paying attention.',
    ],
    drills: [
      d(43, 'a', { title: 'The same talk, two audiences', brief: 'Deliver the same topic twice: first to Grade 4 students visiting your school, then to parents at an open evening.', targetSeconds: 90 }),
      d(43, 'b', { title: 'Cut a point live', brief: 'Start a three-point talk. After point one, imagine the audience is losing interest — cut to your strongest point and your ending.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(43, 'c', { title: 'Win them back', brief: 'Mid-talk, imagine blank faces. Stop and use a question or a quick story to re-engage, then continue.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['"Adapting" that is only speaking louder.', 'Students who ignore obvious cues and push through.'],
    selfCheck: ['What did I change for each audience?', 'What cue would make me cut a point?'],
    realWorld: 'Presenting at open days, to younger students, or to a tired class after lunch.',
    writePrompt: 'Write how you would change one talk for three audiences: younger students, classmates and parents.',
  },
  {
    number: 44,
    oneLine: 'Slides are for what you cannot say — everything else on them competes with you.',
    idea: [
      'Text-heavy slides split attention: your audience reads ahead while you talk, and absorbs neither well. Reading your slides aloud makes you redundant.',
      'Use slides for images, diagrams, a single key number or a few words. You carry the explanation. A good test: if your slides make sense without you, you have written a document, not a presentation.',
    ],
    drills: [
      d(44, 'a', { title: 'The talk with no slides', brief: 'Give a two-minute talk on a topic usually taught with slides — like the water cycle — using only words and gestures.', targetSeconds: 120 }),
      d(44, 'b', { title: 'One image, two minutes', brief: 'Choose one image related to a subject you study and talk about it for two minutes, guiding the audience\'s eyes around it.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(44, 'c', { title: 'Slide makeover', brief: 'Describe a text-heavy slide from a school presentation, then explain your redesign: one visual, at most six words.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Turning to read the screen.', 'Slides used as a script.'],
    selfCheck: ['Would my slides make sense without me? (They should not.)', 'Where were my eyes during the talk?'],
    realWorld: 'Project presentations and assessments where slides are required.',
    writePrompt: 'Plan a four-slide presentation: for each slide, the visual and at most six words, plus what you will say.',
  },
  {
    number: 45,
    oneLine: 'In debate you are judged on how you handle what the other side said, not just your speech.',
    idea: [
      'Beginners give two separate speeches. Strong debaters listen for the other side\'s load-bearing claim — the one their case collapses without — and take that on directly.',
      'Summarise their point fairly first, then rebut: challenge the evidence, the logic or the importance. Attack arguments, never people — adjudicators mark down personal attacks and so do audiences.',
    ],
    drills: [
      d(45, 'a', { title: 'Their strongest point, said fairly', brief: 'For the motion "Social media does more harm than good", state the opposition\'s strongest argument as fairly as they would.', targetSeconds: 45 }),
      d(45, 'b', { title: 'Rebut the load-bearing claim', brief: 'Deliver a ninety-second rebuttal that identifies their key claim, challenges its evidence or logic, and restates your case.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(45, 'c', { title: 'Point of information', brief: 'Practise a short, sharp point of information in fifteen seconds, then respond to one directed at you in thirty seconds.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Rebuttals of minor points while the key claim stands.', 'Sarcasm and personal comments.'],
    selfCheck: ['Which claim was load-bearing?', 'Did I rebut it or just repeat my own case?'],
    realWorld: 'Debate clubs, inter-school competitions and MUN.',
    writePrompt: 'Write the opposition\'s strongest point for a motion, a fair summary of it, and a three-sentence rebuttal.',
  },
  {
    number: 46,
    oneLine: 'Useful feedback names a moment and a change — anything else is just an opinion about a person.',
    idea: [
      '"You were good" and "you were boring" help nobody. Useful peer feedback is specific: "When you paused after the statistic, the room went quiet — do that before your ending too."',
      'Receiving feedback is a skill too: listen fully, say thank you, ask a clarifying question, and decide later what to use. Arguing back teaches everyone to stop giving you honest feedback.',
    ],
    drills: [
      d(46, 'a', { title: 'Moment, what, change', brief: 'Give feedback on a talk you have seen: the specific moment, what happened, and one concrete change to try.', targetSeconds: 60 }),
      d(46, 'b', { title: 'The question that gets an answer', brief: 'Respond to the feedback "Your talk was a bit confusing" by thanking them and asking one question that gets specific help.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(46, 'c', { title: 'Self-feedback', brief: 'Listen to one of your recordings and give yourself moment-what-change feedback out loud.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Feedback about personality instead of moments.', 'Defensive responses in peer review.'],
    selfCheck: ['Was my feedback about a moment?', 'How did I respond to feedback on me?'],
    realWorld: 'Peer assessment in class and giving teammates useful notes before a competition.',
    writePrompt: 'Write moment-what-change feedback for two talks: a classmate\'s and your own.',
  },
  {
    number: 47,
    oneLine: 'Everything from this course, at once, on a topic you genuinely care about.',
    idea: [
      'Your final speech is the test that matters: a subject you care about, delivered with everything you have practised — a hook, one clear idea, three signposted points, a story, a strong ending, controlled pace, eye contact and stillness.',
      'Care matters more than cleverness. Audiences can tell the difference between a topic chosen to impress and one chosen because it matters to you, and they listen harder to the second.',
    ],
    drills: [
      d(47, 'a', { title: 'The skeleton, from memory', brief: 'Deliver your speech skeleton from memory: hook, one-sentence idea, three points, story, and final line.', targetSeconds: 45 }),
      d(47, 'b', { title: 'The full speech', brief: 'Deliver your full three-minute speech on something you care about, standing, from a cue card at most.', targetSeconds: 180 }),
    ],
    extraDrills: [
      d(47, 'c', { title: 'The improved take', brief: 'Listen to your full speech, choose one specific improvement, and record it again.', targetSeconds: 180 }),
    ],
    mentorWatchFor: ['Topics chosen for effect rather than conviction.', 'Speeches that are strong on content and forget delivery under pressure.'],
    selfCheck: ['Which skills from the course did I use deliberately?', 'What is my best moment in this speech?'],
    realWorld: 'School assemblies, speech competitions and student leadership campaigns.',
    writePrompt: 'Write your final speech plan: hook, one-sentence idea, three signposted points, the story you will use and your final line.',
  },
];
