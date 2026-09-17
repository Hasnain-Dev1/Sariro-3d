import type { CourseModule } from '../types';

/* Grades 7–9 · Module 3 — Structure That Works */
export const MIDDLE_M3: CourseModule = {
  title: 'Structure That Works',
  outcome: 'Say your message in one sentence and build a talk with an opener, PREP points, signposts and a closer that sticks.',
  world: { name: 'Blueprint Lab', emoji: '📐', color: '#0891B2', tagline: 'Build talks that stand up.' },
  lessons: [
    {
      title: 'Your message in one sentence',
      oneLine: 'If you cannot say your point in one sentence, your audience will not be able to either.',
      idea: [
        'Most weak talks are not badly delivered — they are unclear. The speaker has a topic ("climate change") but no message ("Our school could cut its electricity use by a fifth with three simple changes").',
        'Before you plan anything, write your core message in one sentence of under twenty words. Everything else in the talk should support it.',
      ],
      drills: [
        { title: 'Topic to message', brief: 'Turn three topics — social media, sport and homework — into one-sentence messages. Say each clearly.', targetSeconds: 45 },
        { title: 'Message-led talk', brief: 'Pick one of your messages and give a sixty-second talk that proves it.', targetSeconds: 60 },
      ],
      game: { name: 'Tweet It', emoji: '🐦', how: ['Each student states their whole talk in twelve words or fewer.', 'The class checks: could you repeat it back?', 'If not, cut again.'] },
      realWorld: 'Answering "So what is your project about?" in one clear sentence.',
      mentorWatchFor: ['Topics disguised as messages.', 'Messages with two ideas joined by "and".'],
      selfCheck: ['Is my message one sentence?', 'Does every part of my talk support it?'],
      writePrompt: 'Write one-sentence messages for three talks you might give this term, each under twenty words.',
    },
    {
      title: 'First lines that win over a room of teenagers',
      oneLine: 'Your classmates decide in seconds whether to listen — open with something they did not expect.',
      idea: [
        'Teenage audiences are tough. "Good morning, today I am going to talk about…" loses them instantly.',
        'Openers that work: a bold statement, a question that makes them think, a surprising statistic, a short relatable story, or a "what if".',
      ],
      drills: [
        { title: 'Five openers', brief: 'For a talk on screen time, deliver five different openers: bold statement, question, statistic, story and "what if".', targetSeconds: 60 },
        { title: 'Open and run', brief: 'Use your strongest opener to begin a sixty-second talk on screen time.', targetSeconds: 60 },
      ],
      game: { name: 'Hook Battle', emoji: '🪝', how: ['Same topic, three openings: a question, a surprising fact, a tiny story.', 'Students perform all three.', 'The class votes for the opener that made them want the next sentence.'] },
      realWorld: 'Starting a speech in assembly or a presentation to your class.',
      mentorWatchFor: ['Cheesy rhetorical questions.', 'Openers unrelated to the message.'],
      selfCheck: ['Did my opener connect to my message?', 'Would my classmates look up?'],
      writePrompt: 'Write five different openers for a talk on whether school should start later.',
    },
    {
      title: 'PREP: point, reason, example, point',
      oneLine: 'PREP turns a rambling answer into a clear, convincing one in under a minute.',
      idea: [
        'PREP: state your Point, give a Reason, back it with an Example, and restate your Point. It works for class answers, debates, interviews and discussions.',
        'Examples make reasons believable. "Exercise helps focus" is a reason; "After our class started morning runs, test scores rose" is an example.',
      ],
      model: { text: 'Point: School should teach money skills. Reason: most of us will manage money long before we use half of what is on the syllabus. Example: my older cousin got a credit card at eighteen and was in debt by nineteen. Point: a term of money skills would prevent that.', noticing: ['The point comes first.', 'The example is specific and real.', 'The point returns at the end.'] },
      drills: [
        { title: 'PREP answer', brief: 'Use PREP to answer: "Should students be allowed to use AI for homework?"', targetSeconds: 60 },
        { title: 'Double PREP', brief: 'Give two PREP points in a row on "Is social media good for teenagers?"', targetSeconds: 90 },
      ],
      game: { name: 'PREP Relay', emoji: '🏃', how: ['Four students line up.', 'The first says the Point, the next the Reason, then the Example, then the Point again.', 'The class checks each piece before the baton passes.'] },
      realWorld: 'Answering a teacher’s question or making a point in a debate.',
      mentorWatchFor: ['Examples that are vague or invented.', 'Forgetting to restate the point.'],
      selfCheck: ['Did I use all four parts?', 'Was my example specific?'],
      writePrompt: 'Write a PREP answer to "Should schools ban junk food?"',
    },
    {
      title: 'Signposting so nobody gets lost',
      oneLine: 'Signposts tell your audience where they are — and make you sound organised.',
      idea: [
        'Listeners cannot scroll back like readers can. Signposts help: "I have three reasons", "My second reason…", "Now, the counter-argument…", "To wrap up…"',
        'Transitions link ideas: "That leads to…", "On the other hand…", "Which is exactly why…"',
      ],
      drills: [
        { title: 'Signposted talk', brief: 'Give a ninety-second talk on "Three things every new student should know about my school" with clear signposts.', targetSeconds: 90 },
        { title: 'Smooth transitions', brief: 'Explain the pros and cons of online learning using at least four different transitions.', targetSeconds: 60 },
      ],
      game: { name: 'Map the Maze', emoji: '🗺️', how: ['One student draws a route that a partner cannot see.', 'They guide the partner using only signposts.', 'Swap. Count how many signposts made it work.'] },
      realWorld: 'Explaining a complex topic in a science or history presentation.',
      mentorWatchFor: ['"And also… and also…"', 'Signposts that promise three points but deliver two.'],
      selfCheck: ['Could a listener tell which point I was on?', 'Did I use varied transitions?'],
      writePrompt: 'Write the signposts and transitions for a talk with three reasons and one counter-argument.',
    },
    {
      title: 'Closers that stick',
      oneLine: 'People remember the last thing you say — end on purpose, not with "so yeah".',
      idea: [
        'Strong closers: return to your opening (a full circle), a call to action, a memorable one-line summary or a question that stays with them.',
        'Slow down for your last line. Deliver it, pause, then say thank you. Never trail off.',
      ],
      drills: [
        { title: 'Full circle', brief: 'Give a sixty-second talk that opens with a question and closes by answering it.', targetSeconds: 60 },
        { title: 'Three closers', brief: 'For the topic "Why everyone should learn to cook", deliver three different closers.', targetSeconds: 45 },
      ],
      game: { name: 'Mic Drop', emoji: '🎤', how: ['Each student writes only the last line of a talk.', 'They deliver it, then silence.', 'The class rates one to five: would you clap?'] },
      realWorld: 'Ending a speech, an election pitch or a project presentation.',
      mentorWatchFor: ['"So yeah, that’s it."', 'New information in the conclusion.'],
      selfCheck: ['Did my ending sound finished?', 'Did I pause before thank you?'],
      writePrompt: 'Write three different closing lines for a talk on protecting local wildlife.',
    },
    {
      title: 'Cut it: editing your talk',
      oneLine: 'A shorter, focused talk beats a longer one that wanders.',
      idea: [
        'Most first drafts are too long. Cut anything that does not support your one-sentence message — even if it is interesting.',
        'Useful test: if you removed this sentence, would the audience miss it? If not, cut it.',
      ],
      drills: [
        { title: 'Half the words', brief: 'Explain your favourite hobby in ninety seconds. Then explain it again in forty-five seconds without losing the point.', targetSeconds: 45 },
        { title: 'Cut the passage', brief: 'Read this, then say it again in half the words with the same meaning.', passage: 'So basically what I wanted to say today, and I think this is really important actually, is that I think we should all probably try to recycle more, because it is basically good for the environment and stuff, and also it does not really take that much time if you think about it.', targetSeconds: 30 },
      ],
      game: { name: 'Word Budget', emoji: '✂️', how: ['Everyone gets a sixty-word paragraph.', 'Cut it to thirty words without losing the point.', 'Read both aloud — the class picks the stronger one.'] },
      realWorld: 'Fitting a presentation into a strict time limit.',
      mentorWatchFor: ['Cutting the example instead of the waffle.', 'Losing the message in the cut.'],
      selfCheck: ['Did the shorter version keep the message?', 'What did I cut?'],
      writePrompt: 'Write a rambling paragraph on any topic, then rewrite it in half the words.',
    },
  ],
};

/* Grades 7–9 · Module 4 — Presentations That Aren't Boring (five lessons; slot 24 is the showcase) */
export const MIDDLE_M4: CourseModule = {
  title: "Presentations That Aren't Boring",
  outcome: 'Present schoolwork people actually watch, with slides that help, interesting facts, smooth group hand-overs and calm Q&A.',
  world: { name: 'Slide City', emoji: '🖥️', color: '#EA580C', tagline: 'Own the room, not the slides.' },
  lessons: [
    {
      title: 'School presentations people actually watch',
      oneLine: 'A presentation is not your notes read aloud — it is a performance with a message.',
      idea: [
        'Boring presentations share the same mistakes: reading slides, too much information, no story, no energy.',
        'Fix the plan: one message, an opener that hooks, three key points with an example each, and a closer. Speak TO the class, not AT the screen.',
      ],
      drills: [
        { title: 'Rescue a boring talk', brief: 'Take a school topic you studied recently and present it for ninety seconds with a hook, three points and a closer.', targetSeconds: 90 },
        { title: 'Energy check', brief: 'Present the same topic again, adding more vocal energy and one moment of audience interaction, such as a question.', targetSeconds: 90 },
      ],
      game: { name: 'Boring vs Brilliant', emoji: '😴', how: ['The mentor reads a deliberately dull thirty-second presentation.', 'Pairs fix it: add a hook, a story, a question.', 'Each pair performs; the class votes.'] },
      realWorld: 'History, science and geography presentations in class.',
      mentorWatchFor: ['Reading from notes or the screen.', 'Information overload.'],
      selfCheck: ['Did I have one clear message?', 'Did I talk to the class, not the screen?'],
      writePrompt: 'Plan a ninety-second presentation on a school topic: message, hook, three points with examples and closer.',
    },
    {
      title: 'Slides that help instead of hide',
      oneLine: 'Slides are for pictures and key words — you are the presentation.',
      idea: [
        'Walls of text force the audience to read instead of listen. One idea per slide, a strong image, and six words or fewer is a good rule.',
        'Never read your slides. Introduce each one: "This graph shows something surprising…" then face your audience.',
      ],
      drills: [
        { title: 'Talk to the slide', brief: 'Imagine a slide with one image: a melting glacier. Present it for forty-five seconds without reading any text.', targetSeconds: 45 },
        { title: 'Three slides', brief: 'Plan three slides with six words or fewer each on a topic you like, and present them for ninety seconds.', targetSeconds: 90 },
      ],
      game: { name: 'Slide Rescue', emoji: '🛟', how: ['Show a terrible slide: walls of text, eight fonts.', 'Pairs fix it: one idea, one picture, six words or fewer.', 'Present the fixed slide in thirty seconds.'] },
      realWorld: 'Any presentation with slides at school.',
      mentorWatchFor: ['Turning back to the screen.', 'Slides stuffed with full sentences.'],
      selfCheck: ['Were my slides six words or fewer?', 'Did I face the audience?'],
      writePrompt: 'Design a three-slide outline — six words or fewer per slide — and write what you will say for each.',
    },
    {
      title: 'Making facts and numbers interesting',
      oneLine: 'Numbers stick when you compare them to something people can picture.',
      idea: [
        '"The Great Pacific Garbage Patch is 1.6 million square kilometres" means little. "It is twice the size of Texas" means a lot.',
        'Use one striking number instead of ten, compare it to something familiar, and pause after you say it.',
      ],
      drills: [
        { title: 'Picture the number', brief: 'Present three facts from a subject you study, each compared to something your classmates can picture.', targetSeconds: 60 },
        { title: 'One number, big impact', brief: 'Read this, pausing after the key comparison.', passage: 'Every minute, the equivalent of one garbage truck of plastic is dumped into the ocean. One truck. Every single minute. By the time this lesson ends, that is about forty trucks.', targetSeconds: 25 },
      ],
      game: { name: 'Number Makeover', emoji: '🔢', how: ['The mentor shows a boring statistic.', 'Teams race to create the best comparison.', 'The class votes for the one they will remember tomorrow.'] },
      realWorld: 'Presenting survey results or science data in class.',
      mentorWatchFor: ['Too many numbers.', 'Comparisons that confuse more than help.'],
      selfCheck: ['Did I compare numbers to something familiar?', 'Did I pause after the key number?'],
      writePrompt: 'Write three interesting facts from any subject and a comparison that makes each one memorable.',
    },
    {
      title: 'Presenting as a group without chaos',
      oneLine: 'Good group presentations feel like one talk with several voices, not four separate talks.',
      idea: [
        'Group chaos looks like: people interrupting, repeating each other, standing awkwardly and not knowing when to speak.',
        'Plan it: one shared message, clear parts, rehearsed hand-overs ("Now Ananya will show you what we found"), and everyone looks at whoever is speaking.',
      ],
      drills: [
        { title: 'The hand-over', brief: 'Deliver your section of a group presentation on "How to improve our school canteen" and hand over by name to the next speaker.', targetSeconds: 60 },
        { title: 'Opening the group talk', brief: 'Open a group presentation: hook, the shared message and a preview of who covers what.', targetSeconds: 45 },
      ],
      game: { name: 'Baton Pass', emoji: '🏃‍♀️', how: ['Teams of three plan a ninety-second talk.', 'Speakers hold a baton while talking.', 'They must pass it with a hand-over sentence — no silent passes.'] },
      realWorld: 'Group projects, science fairs and team competitions.',
      mentorWatchFor: ['One student dominating.', 'Team members looking at their phones or the floor while others speak.'],
      selfCheck: ['Did we sound like one talk?', 'Were our hand-overs smooth?'],
      writePrompt: 'Plan a group presentation for four people: the message, each person’s section and every hand-over line.',
    },
    {
      title: 'Handling questions after you present',
      oneLine: 'Q&A is where you show you actually understand — listen, pause, answer briefly and check.',
      idea: [
        'Listen to the whole question. Pause. Repeat or rephrase it if needed. Answer in two or three sentences. Then check: "Does that answer your question?"',
        'If you do not know, say so honestly and add what you do know or how you would find out. Never bluff.',
      ],
      drills: [
        { title: 'Three questions', brief: 'After a short talk on your favourite subject, answer these: "Why does it matter?", "What was the hardest part?" and "What would you do differently?"', targetSeconds: 90 },
        { title: 'Honest "I don’t know"', brief: 'Answer a question you do not know: "What will that subject look like in fifty years?" Say what you do know and how you would find out.', targetSeconds: 45 },
      ],
      game: { name: 'Curveball', emoji: '⚾', how: ['A student finishes a short talk.', 'The class throws an unexpected question.', 'Answer with a bridge: "Good question — what I can tell you is…"'] },
      realWorld: 'Questions from teachers and classmates after a presentation.',
      mentorWatchFor: ['Long, rambling answers.', 'Bluffing instead of admitting uncertainty.'],
      selfCheck: ['Were my answers short?', 'Did I stay honest?'],
      writePrompt: 'Write the three hardest questions someone could ask about your last presentation and your answers.',
    },
  ],
};
