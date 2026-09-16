import { bd, type BandLesson } from '../types';

/** Grades 7–9 · Worlds 3 and 4 — structure, and delivery in front of peers. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('middle', n, part, x);

export const MIDDLE_WORLD_3: BandLesson[] = [
  {
    number: 13,
    oneLine: 'If you cannot say your talk in one sentence, it is about too many things.',
    idea: [
      'A week after your presentation, your classmates will remember one sentence at most. Decide in advance what that sentence is, or they will pick one for you — probably the wrong one.',
      'A topic is not an idea. "Climate change" is a topic. "Our school could halve its electricity bill with three changes" is an idea. If your sentence contains "and", you have two talks — choose one.',
    ],
    model: {
      text: 'This presentation argues that video games teach more problem-solving than most homework does.',
      noticing: ['A claim, not a subject.', 'Specific enough that someone could disagree — which makes it worth listening to.'],
    },
    drills: [
      d(13, 'a', { title: 'The one sentence', brief: 'Say, in one sentence with no "and", what your next presentation for any subject is arguing. Retry until it is a claim, not a topic.', targetSeconds: 15 }),
      d(13, 'b', { title: 'Say it, then defend it', brief: 'State your one sentence, then spend seventy-five seconds defending it. Each time you drift to another topic, pull yourself back.', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(13, 'c', { title: 'Topic to claim', brief: 'Take the topic "social media" and turn it into three different one-sentence claims someone could argue against.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Claims so safe nobody would disagree ("Pollution is bad").', 'Students who cannot drop a second idea they love.'],
    selfCheck: ['Is my sentence a claim or a topic?', 'Does it contain "and"?'],
    realWorld: 'Planning a history or geography presentation that actually argues something.',
    writePrompt: 'Write your one-sentence claim for a presentation, then write the two strongest reasons that support it.',
  },
  {
    number: 14,
    oneLine: 'The opening is where nerves peak — so it is the part to know word for word.',
    idea: [
      'Four openings work: a question the room wants answered, a surprising number, a story starting mid-action, or a bold claim. Two always fail: introducing yourself and your topic, and apologising for being nervous.',
      'Because your heart rate is highest in the first thirty seconds, rehearse your opening until it is automatic. Everything after it can be flexible, but the start should not depend on thinking clearly.',
    ],
    model: {
      text: 'Last year, a fourteen-year-old in Kerala built a water filter from sand and charcoal that cleaned a whole village\'s well. She had no lab. She had a question.',
      noticing: ['Starts mid-story with a peer the audience relates to.', 'The final short line sets up the whole talk.'],
    },
    drills: [
      d(14, 'a', { title: 'Four openings, one talk', brief: 'For one topic, deliver four different openings back to back: a question, a number, a mid-story start and a bold claim.', targetSeconds: 60 }),
      d(14, 'b', { title: 'The opening, word for word', brief: 'Choose your strongest opening, rehearse it five times, and record it perfectly followed by the next thirty seconds of the talk.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(14, 'c', { title: 'Rescue a weak opening', brief: 'Deliver the opening "Hi, I am presenting on renewable energy" — then give three stronger alternatives.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Hooks borrowed from the internet that do not connect to the talk.', '"Before I start…" preambles.'],
    selfCheck: ['Which opening type did I choose and why?', 'Could I deliver it with my eyes closed?'],
    realWorld: 'Opening a speech in a debate, an election or a science exhibition.',
    writePrompt: 'Write four openings for one presentation topic and explain in one sentence why you chose your final one.',
  },
  {
    number: 15,
    oneLine: 'Three well-ordered points beat seven random ones — and order changes the argument.',
    idea: [
      'Listeners can hold about three points. Fewer feels thin; more gets forgotten. Each point needs one piece of support — a reason, an example or a fact — not five.',
      'Order is strategy. Strongest last leaves a big impression; strongest first grabs sceptics early. Problem–cause–solution and past–present–future are orders your audience already understands.',
    ],
    model: {
      text: 'School should start at nine for three reasons. Teenagers\' body clocks genuinely shift later. Tired students learn less. And schools that changed start times saw attendance and grades improve.',
      noticing: ['Three points, one support each.', 'The evidence point is saved for last.'],
    },
    drills: [
      d(15, 'a', { title: 'Three points, one support each', brief: 'Argue for or against school uniforms with three points, giving exactly one support for each.', targetSeconds: 90 }),
      d(15, 'b', { title: 'The same three, reordered', brief: 'Deliver the same talk with the points in a different order. Say which order is more persuasive and why.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(15, 'c', { title: 'Problem, cause, solution', brief: 'Pick a problem at your school and structure a ninety-second talk as problem, cause, solution.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Points that overlap — "it is expensive" and "it costs a lot".', 'Supports longer than the points they support.'],
    selfCheck: ['Were my three points genuinely different?', 'Why did I choose that order?'],
    realWorld: 'Structuring an argument in a class debate or a persuasive essay you have to present.',
    writePrompt: 'Write three distinct points with one support each on a school issue, and number them in your chosen order with a reason for it.',
  },
  {
    number: 16,
    oneLine: 'Your audience cannot see your structure — signposts let them hear it.',
    idea: [
      'Readers see paragraphs and headings. Listeners get none of that. Without signposts, a well-structured talk sounds like one long stream, and people lose track of where you are.',
      'Preview ("I will cover three things"), mark transitions ("That is the cost — now the benefits"), and flag the conclusion ("So, to bring this together"). It feels obvious to you; it is a relief to them.',
    ],
    model: {
      text: 'I want to cover three things: why the app became popular, what it does to our attention, and what we can do about it. Let us start with why it took off.',
      noticing: ['A preview of the whole talk.', 'A clear marker into the first section.'],
    },
    drills: [
      d(16, 'a', { title: 'Three points, signposted', brief: 'Give a ninety-second talk on a book, film or series you would recommend, with a preview, clear transitions and a signposted conclusion.', targetSeconds: 90 }),
      d(16, 'b', { title: 'The same talk, unsignposted', brief: 'Give the same talk with no signposts at all. Listen to both and describe the difference for a listener.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(16, 'c', { title: 'Transition drill', brief: 'Link these three ideas smoothly using a different transition phrase each time: school clubs, friendships, stress.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Previews that promise a different structure from the one delivered.', 'Every transition being "and also".'],
    selfCheck: ['Did my preview match my talk?', 'Could a listener tell when I changed section?'],
    realWorld: 'Presenting a group project where each member covers a different section.',
    writePrompt: 'Write a preview sentence, two transition sentences and a conclusion signpost for a book or film recommendation.',
  },
  {
    number: 17,
    oneLine: 'The last sentence is what people walk out with — do not waste it on "so, yeah".',
    idea: [
      'Endings are remembered disproportionately. Most students trail off: "So, yeah, that is my presentation, any questions?" The final impression becomes awkwardness.',
      'Strong endings close a loop from the opening, restate the idea in a memorable line, or call the audience to act. Then stop — silence after a strong line is part of the line.',
    ],
    model: {
      text: 'At the start I asked who is in control — you or your phone. After today, I hope the answer is you. Put it face down for one hour tonight, and find out.',
      noticing: ['It closes the loop from the opening question.', 'It ends with a concrete challenge, then stops.'],
    },
    drills: [
      d(17, 'a', { title: 'Open and close the same loop', brief: 'Deliver just the first sentence and the last sentence of a talk, where the ending answers or echoes the opening.', targetSeconds: 30 }),
      d(17, 'b', { title: 'Say it and stop', brief: 'Give a sixty-second talk ending with a strong final line. Hold two seconds of silence after it before stopping the recording.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(17, 'c', { title: 'Three endings', brief: 'For the same talk, deliver three different endings: a loop, a memorable restatement and a call to action.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Endings that add a new point.', 'Filling the final silence with "so, yeah".'],
    selfCheck: ['What was my final sentence?', 'Did I hold the silence after it?'],
    realWorld: 'Ending an election speech so people remember your one key promise.',
    writePrompt: 'Write three possible final lines for a talk — a loop, a restatement and a call to action — and choose one.',
  },
  {
    number: 18,
    oneLine: 'Every interesting sentence that is not about your point competes with the one that is.',
    idea: [
      'When you research a topic, you find fascinating things, and it hurts to leave them out. But your audience cannot tell which facts matter — they treat everything as equal, and the important points get buried.',
      'Test every sentence: does it serve my one-sentence idea? If not, cut it. Time limits in class are a gift — they force the talk to become clearer.',
    ],
    drills: [
      d(18, 'a', { title: 'Two minutes of everything', brief: 'Give a two-minute talk on a topic you know well, including every interesting detail you can think of.', targetSeconds: 120 }),
      d(18, 'b', { title: 'The same talk in sixty seconds', brief: 'Now deliver it in sixty seconds, keeping only what serves one clear idea. Say what you cut and why.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(18, 'c', { title: 'Thirty-second trailer', brief: 'Pitch your favourite book, game or film in exactly thirty seconds, like a trailer.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['The "cut" version that is just faster, not shorter.', 'Cutting the evidence and keeping the tangents.'],
    selfCheck: ['What did I cut that I liked?', 'Is the short version clearer?'],
    realWorld: 'Fitting a presentation into a strict three-minute limit for a competition or assessment.',
    writePrompt: 'List every point from a two-minute talk, then cross out everything that does not serve your one-sentence idea.',
  },
];

export const MIDDLE_WORLD_4: BandLesson[] = [
  {
    number: 19,
    oneLine: 'Stillness reads as confidence — and almost nobody is still by accident.',
    idea: [
      'Under pressure, bodies leak nerves: swaying, shifting weight, touching hair, pulling sleeves, clicking pens. Your classmates will notice every one of these before they notice your argument.',
      'Plant your feet hip-width apart, keep your weight even, let your arms rest. Move only on purpose — for example, one step when you change sections. It feels unnatural at first and looks self-assured.',
    ],
    drills: [
      d(19, 'a', { title: 'Sixty seconds, planted', brief: 'Stand, plant your feet, and give a sixty-second talk about something you are good at without shifting your weight once.', targetSeconds: 60 }),
      d(19, 'b', { title: 'Fidget, then still', brief: 'Give a thirty-second talk while fidgeting deliberately, then the same talk completely still. Describe which one felt more confident.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(19, 'c', { title: 'Purposeful step', brief: 'Give a talk with three sections. Stand still during each and take one deliberate step only when you move to the next section.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Stillness that becomes rigid.', 'Hands in pockets or arms crossed defensively.'],
    selfCheck: ['What did my body do that I did not choose?', 'Did I move only on purpose?'],
    realWorld: 'Standing at the front for a class presentation or election speech.',
    writePrompt: 'Write the three nervous habits you most often notice in yourself and what you will do instead.',
  },
  {
    number: 20,
    oneLine: 'A good gesture adds meaning; a random one just adds distraction.',
    idea: [
      'Gestures work when they carry information: counting points on fingers, showing size, contrasting "this side" and "that side", marking a timeline in the air.',
      'Constant hand movement, repeated chopping and fiddling with notes do the opposite — they compete with your words. Plan two or three meaningful gestures and let your hands rest the rest of the time.',
    ],
    drills: [
      d(20, 'a', { title: 'Sentences with shape', brief: 'Deliver sentences that need gestures: something rising, a comparison between two options, a process with steps. Use one clear gesture for each.', targetSeconds: 45 }),
      d(20, 'b', { title: 'Three points, three fingers', brief: 'Give a sixty-second talk with three points, counting them on your fingers, and keep your hands relaxed between points.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(20, 'c', { title: 'Timeline in the air', brief: 'Explain a historical event using your hands to place past, present and future in space as you speak.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Gestures that arrive after the words.', 'Repetitive chopping on every sentence.'],
    selfCheck: ['Which gestures carried meaning?', 'Were my hands still between them?'],
    realWorld: 'Explaining a process or a timeline in a science or history presentation.',
    writePrompt: 'Write a short talk and mark the three places where a planned gesture will add meaning.',
  },
  {
    number: 21,
    oneLine: 'Hold one person\'s eyes for a whole thought, then move — sweeping the room reaches nobody.',
    idea: [
      'Looking at the floor tells your audience you are uncomfortable. Scanning the room fast looks nervous too, and nobody actually feels addressed.',
      'Give one classmate a full sentence or thought, then move to someone in a different part of the room. It is calmer for you — you are only ever talking to one person — and everyone feels included.',
    ],
    drills: [
      d(21, 'a', { title: 'One person, one thought', brief: 'Place a few objects around the room as "classmates". Give a ninety-second talk, holding each object\'s "eyes" for a complete thought before moving.', targetSeconds: 90 }),
      d(21, 'b', { title: 'The sweep, for comparison', brief: 'Give the same talk scanning quickly across the room. Then describe which felt more connected.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(21, 'c', { title: 'Friendly face trap', brief: 'Give a sixty-second talk and deliberately include people on all sides of the room, not just your friends in front.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Speaking only to the teacher or only to friends.', 'Eyes going up to the ceiling while thinking.'],
    selfCheck: ['Did I finish thoughts before moving my eyes?', 'Did I include the whole room?'],
    realWorld: 'Holding a class\'s attention during a group presentation or debate.',
    writePrompt: 'Write a short plan for where in the room you will look during each section of your next presentation.',
  },
  {
    number: 22,
    oneLine: 'Notes should hold your structure, not your sentences — scripts get read.',
    idea: [
      'A page of full sentences guarantees reading: head down, flat voice, no eye contact. And if you lose your place, finding it again in a paragraph is almost impossible under pressure.',
      'A cue card with five to eight key words — opening, points, key example, ending — lets you glance, look up and speak. Your wording will vary slightly each time, which is exactly what makes it sound natural.',
    ],
    drills: [
      d(22, 'a', { title: 'Eight words, two minutes', brief: 'Make a cue card of at most eight words and give a two-minute talk on a topic of your choice, glancing down only between points.', targetSeconds: 120 }),
      d(22, 'b', { title: 'The script, for comparison', brief: 'Write out one minute of the same talk word for word and read it. Compare the recording with your key-word version.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(22, 'c', { title: 'Lost your place', brief: 'Give a talk from a cue card, deliberately drop the card halfway, pick it up, find your next key word and continue calmly.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Tiny handwriting that turns a cue card into a script.', 'Reading the key word aloud instead of speaking from it.'],
    selfCheck: ['How many words were on my card?', 'How often was I looking down?'],
    realWorld: 'Presenting a project in class with a cue card instead of reading your slides.',
    soundLab: ['ea', 'oo'],
    writePrompt: 'Turn a paragraph you have written into a cue card of no more than eight key words.',
  },
  {
    number: 23,
    oneLine: 'A camera gives nothing back — so you have to bring the energy it will not.',
    idea: [
      'Video presentations, online classes, school channel reports and competition submissions all need you to talk to a lens that never nods or reacts. Energy that feels normal in a room looks flat on camera.',
      'Look into the lens, not at your own face on the screen. Imagine one specific person behind it. Lift your energy slightly above normal, and frame yourself with your eyes about a third from the top of the picture.',
    ],
    drills: [
      d(23, 'a', { title: 'To the lens', brief: 'Record a ninety-second video explaining something you learned this week, looking into the lens throughout.', targetSeconds: 90 }),
      d(23, 'b', { title: 'Screen versus lens', brief: 'Record thirty seconds looking at your own image, then thirty seconds into the lens. Watch both and describe what changes for a viewer.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(23, 'c', { title: 'School news report', brief: 'Record a sixty-second school news update on camera, with a clear opening, two stories and a sign-off.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Eyes drifting to the screen.', 'Energy dropping to a mumble on video.'],
    selfCheck: ['Where were my eyes?', 'Did my energy come through the camera?'],
    realWorld: 'Recording a video assignment, an online class presentation or a school channel report.',
    soundLab: ['c', 'ch'],
    writePrompt: 'Write the outline for a sixty-second video report: opening line, two main pieces of content and a sign-off.',
  },
];
