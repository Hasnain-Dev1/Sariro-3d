import type { CourseModule } from '../types';

/* Grades 4–6 · Module 7 — Persuade and Discuss */
export const PRIMARY_M7: CourseModule = {
  title: 'Persuade and Discuss',
  outcome: 'Tell fact from opinion, pitch an idea with reasons, disagree politely and think on your feet in a discussion.',
  world: { name: 'Idea Island', emoji: '💡', color: '#CA8A04', tagline: 'Share ideas and change minds — kindly.' },
  lessons: [
    {
      title: 'What is persuading?',
      oneLine: 'Persuading means giving people good reasons to agree with you or do something — not nagging!',
      idea: [
        'Nagging is repeating "please, please, please". Persuading is saying what you want, why it is a good idea and how it helps the listener too.',
        'Think about your listener: what do THEY care about? A parent cares about safety and homework; a friend cares about fun.',
      ],
      drills: [
        { title: 'Persuade, don’t nag', brief: 'Persuade your family to have a pizza night. Say what you want, two reasons and how it helps them too.', targetSeconds: 45 },
        { title: 'Think about them', brief: 'Persuade your teacher to give the class five extra minutes of break. Use reasons your teacher would care about.', targetSeconds: 45 },
      ],
      game: { name: 'The Ask', emoji: '🙋', how: ['"Sell me this pencil."', 'In twenty seconds, the speaker finishes with one clear thing they want the listener to do.', 'The class says what the ask was — if they cannot, it was not clear.'] },
      realWorld: 'Asking your parents for a pet, a later bedtime or a trip.',
      mentorWatchFor: ['Reasons only about the speaker.', 'No clear ask.'],
      selfCheck: ['Did I say clearly what I want?', 'Did I think about what my listener cares about?'],
      homeTip: 'Next time your child asks for something, ask "What’s in it for me?" and enjoy their reasons!',
      writePrompt: 'Write a persuasive message to your family asking for something, with reasons they would care about.',
    },
    {
      title: 'Fact or opinion?',
      oneLine: 'A fact can be checked; an opinion is what someone thinks — strong arguments use facts to support opinions.',
      idea: [
        'Fact: "Cats sleep for many hours a day." Opinion: "Cats are the best pets." You can check a fact. You can only agree or disagree with an opinion.',
        'When you persuade, share your opinion, then back it with facts or examples. Adverts often mix the two to trick you!',
      ],
      drills: [
        { title: 'Opinion plus facts', brief: 'Give your opinion about whether children should play outside every day, and support it with two facts or examples.', targetSeconds: 45 },
        { title: 'Advert detective', brief: 'Think of an advert you have seen. Say which parts were facts and which were opinions.', targetSeconds: 45 },
      ],
      game: { name: 'Fact or Feeling?', emoji: '🔍', how: ['The mentor reads ten statements.', 'The class holds up F for fact or O for opinion.', 'Pick one opinion and back it up with a fact.'] },
      realWorld: 'Not being fooled by adverts or rumours.',
      mentorWatchFor: ['Opinions presented as facts.', 'Facts with no link to the opinion.'],
      selfCheck: ['Could I tell my facts from my opinions?', 'Did facts support my opinion?'],
      homeTip: 'During an advert break, play "fact or opinion" with the family.',
      writePrompt: 'Write your opinion on a school rule and support it with two facts or examples.',
    },
    {
      title: 'Pitch a new school club',
      oneLine: 'A pitch sells an idea: the problem, your idea, why it will work and what you need.',
      idea: [
        'Inventors and business owners "pitch" ideas. A simple pitch: the problem ("There’s nothing to do at lunch"), your idea (a board-games club), why it works, and your ask ("We need one classroom on Fridays").',
        'Show energy and belief. If you are not excited, nobody else will be.',
      ],
      drills: [
        { title: 'Club pitch', brief: 'Pitch a new club for your school: the problem, your club idea, two reasons it will work and what you need.', targetSeconds: 60 },
        { title: 'Invention pitch', brief: 'Invent something that would make school better. Pitch it in one minute.', targetSeconds: 60 },
      ],
      game: { name: 'Shark Tank Junior', emoji: '🦈', how: ['Children pitch a club or invention in sixty seconds.', 'Three "sharks" in the class ask one question each.', 'Sharks invest pretend coins in the pitches they believe in.'] },
      realWorld: 'Suggesting an idea to your teacher or student council.',
      mentorWatchFor: ['No clear problem.', 'Pitches with no ask at the end.'],
      selfCheck: ['Did I explain the problem?', 'Did I make a clear ask?'],
      homeTip: 'Let your child pitch a family weekend plan with a problem, idea and ask.',
      writePrompt: 'Write a pitch for a new school club: problem, idea, two reasons and your ask.',
    },
    {
      title: 'Disagreeing politely',
      oneLine: 'You can disagree with an idea and still respect the person.',
      idea: [
        'Disagreeing is normal and healthy. Rude disagreeing ("That’s stupid!") ends conversations. Polite disagreeing keeps them going.',
        'Use polite phrases: "I see your point, but…", "I think differently because…", "That’s interesting — have you thought about…?"',
      ],
      drills: [
        { title: 'I see your point, but', brief: 'Your friend says "Summer is the best season." Disagree politely with two reasons.', targetSeconds: 40 },
        { title: 'Both sides', brief: 'Talk about whether homework should be banned. Say one good point for the other side, then your own view.', targetSeconds: 60 },
      ],
      game: { name: 'Yes, But…', emoji: '🥊', how: ['A child makes a thirty-second case.', 'A partner gives three objections, one at a time.', 'The speaker answers each in one sentence starting "That’s fair, and…"'] },
      realWorld: 'Disagreeing with a friend or teammate without falling out.',
      mentorWatchFor: ['Attacking the person, not the idea.', 'Giving in immediately.'],
      selfCheck: ['Did I use a polite phrase?', 'Did I give reasons?'],
      homeTip: 'Pick a light debate at dinner (cats or dogs?) and practise polite disagreement phrases.',
      writePrompt: 'Write a polite reply disagreeing with the opinion "Children should not have pets", using two reasons.',
    },
    {
      title: 'Class discussion skills',
      oneLine: 'In a good discussion, you listen, build on others’ ideas and make sure everyone gets a turn.',
      idea: [
        'Discussions work when people take turns, listen and link ideas: "Building on what Riya said…" or "I agree with Sam, and I’d add…"',
        'Help others too: "We haven’t heard from Arjun yet — what do you think?"',
      ],
      drills: [
        { title: 'Build on it', brief: 'Imagine a friend said "We should plant more trees at school." Build on their idea with two linking phrases.', targetSeconds: 40 },
        { title: 'Discussion leader', brief: 'Lead a pretend class discussion on "How can we make lunchtime better?" Introduce the topic, invite others and sum up.', targetSeconds: 60 },
      ],
      game: { name: 'Talking Stick', emoji: '🪄', how: ['Only the holder of the talking stick may speak.', 'To take it, you must start with "Building on what ___ said…"', 'The mentor scores listening, not loudness.'] },
      realWorld: 'Group work in class and planning a project with your team.',
      mentorWatchFor: ['Children who repeat instead of building.', 'Dominant speakers — reward inviting others.'],
      selfCheck: ['Did I build on someone else’s idea?', 'Did I help someone else join in?'],
      homeTip: 'Hold a five-minute family discussion about a weekend plan. Your child is the leader who makes sure everyone speaks.',
      writePrompt: 'Write four phrases you can use to join a discussion, build on an idea or invite someone in.',
    },
    {
      title: 'Just a Minute: thinking on your feet',
      oneLine: 'You can talk about almost anything for a minute if you use a simple plan: what it is, why it matters, an example.',
      idea: [
        'Sometimes you have to speak with no time to prepare. A quick plan helps: say what the topic is, one reason it matters, one example or story, and a closing line.',
        'Take a breath first. A two-second pause looks thoughtful, not stuck.',
      ],
      drills: [
        { title: 'Surprise topic', brief: 'Pick a random object near you. Talk about it for one minute using: what it is, why it matters, an example and a closing line.', targetSeconds: 60 },
        { title: 'Quick-fire thirty', brief: 'Talk for thirty seconds on "The best invention ever" with no preparation.', targetSeconds: 30 },
      ],
      game: { name: 'Topic Roulette', emoji: '🎡', how: ['Spin a random topic.', 'Ten seconds to think.', 'Forty-five seconds to talk — the lab scores it live.'] },
      realWorld: 'When a teacher asks you to share your thoughts with no warning.',
      mentorWatchFor: ['Freezing — prompt the four-part plan.', 'Rambling with no ending.'],
      selfCheck: ['Did I use the quick plan?', 'Did I finish with a closing line?'],
      homeTip: 'Play "Just a Minute" in the car: pick a random topic and see if your child can talk for thirty seconds.',
      writePrompt: 'Write a quick plan (topic, reason, example, closing line) for three surprise topics: rain, shoes and music.',
    },
  ],
};

/* Grades 4–6 · Module 8 — Spotlight Stage (five lessons; slot 48 is the showcase) */
export const PRIMARY_M8: CourseModule = {
  title: 'Spotlight Stage',
  outcome: 'Perform a poem, give a campaign speech, host an event, give kind feedback and deliver a speech that matters to you.',
  world: { name: 'Spotlight Stage', emoji: '🔦', color: '#0F766E', tagline: 'Step into the spotlight.' },
  lessons: [
    {
      title: 'Performing a poem',
      oneLine: 'Performing a poem means using rhythm, pauses and feeling so the poem comes alive.',
      idea: [
        'A poem is meant to be heard. Find its rhythm, pause at line breaks when it makes sense, and let important words land.',
        'Choose a feeling for each part — calm, excited, sad, hopeful — and let your voice change with it.',
      ],
      drills: [
        { title: 'Rhythm and pauses', brief: 'Perform this poem with its rhythm, pausing at the end of each line.', passage: 'I climbed the hill before the sun, when all the world was still, and watched the morning light run down across the sleeping hill. The birds began their song for me, the wind began to play, and I stood there, small and free, to welcome in the day.', targetSeconds: 35 },
        { title: 'My own poem', brief: 'Perform a short poem you know or wrote, using at least two changes of feeling.', targetSeconds: 45 },
      ],
      game: { name: 'Poetry Slam', emoji: '🎭', how: ['Children perform a short poem.', 'Listeners click fingers (not clap) for lines they love.', 'The class chooses one line from each performance that gave them goosebumps.'] },
      realWorld: 'Poetry recitation competitions and school celebrations.',
      mentorWatchFor: ['Sing-song reading with no meaning.', 'Racing to the end.'],
      selfCheck: ['Did I use the rhythm?', 'Did my feeling change with the poem?'],
      homeTip: 'Choose a poem together and let your child perform it at a family gathering.',
      writePrompt: 'Write a short poem of four to eight lines about a place you love, then mark where you will pause.',
    },
    {
      title: 'The class election speech',
      oneLine: 'A campaign speech tells voters who you are, what you will do and why they should trust you.',
      idea: [
        'Voters want to know three things: who you are, what you will do for THEM and why you can do it.',
        'Make promises you can keep ("I will start a suggestion box"), not ones you cannot ("No more homework ever!"). End with a memorable line.',
      ],
      drills: [
        { title: 'Vote for me', brief: 'Give a one-minute speech to be class representative: who you are, two things you will do and why you can do them.', targetSeconds: 60 },
        { title: 'Slogan and ending', brief: 'Create a campaign slogan and give a thirty-second ending to your speech that uses it.', targetSeconds: 30 },
      ],
      game: { name: 'Election Day', emoji: '🗳️', how: ['Three candidates give one-minute speeches.', 'The class asks each candidate one question.', 'Secret ballot — then discuss which promises were realistic.'] },
      realWorld: 'Running for class monitor, house captain or student council.',
      mentorWatchFor: ['Impossible promises.', 'Speeches only about the candidate, not the voters.'],
      selfCheck: ['Did I say what I would do for voters?', 'Were my promises realistic?'],
      homeTip: 'Help your child think of two realistic things they could do for their class, then practise the speech together.',
      writePrompt: 'Write a campaign speech: who you are, two realistic promises, why you can keep them and a slogan.',
    },
    {
      title: 'Hosting an event: welcome and thank-you speeches',
      oneLine: 'Hosts welcome the audience, introduce performers warmly and thank everyone at the end.',
      idea: [
        'A host (or compère) is the voice that holds an event together. A welcome says good morning, what the event is and why it is special.',
        'Introductions give a performer’s name and one line about them. Thank-yous name the people who helped. Keep each part short and warm.',
      ],
      drills: [
        { title: 'Welcome speech', brief: 'Welcome parents to your school’s Annual Day in forty-five seconds: greeting, what the event is and what they will see.', targetSeconds: 45 },
        { title: 'Introduce and thank', brief: 'Introduce the next performer warmly, then give a short vote of thanks at the end of the event.', targetSeconds: 60 },
      ],
      game: { name: 'Stage Hosts', emoji: '🎙️', how: ['Pairs host a pretend show with three acts.', 'They welcome, introduce each act and give thanks.', 'The class scores warmth, clarity and keeping it short.'] },
      realWorld: 'Anchoring a school event, a birthday party or a family celebration.',
      mentorWatchFor: ['Long, rambling introductions.', 'Forgetting names in the thank-you.'],
      selfCheck: ['Was I warm and welcoming?', 'Did I keep each part short?'],
      homeTip: 'Let your child host part of a family celebration: a short welcome or a thank-you to the cook.',
      writePrompt: 'Write a welcome speech and a thank-you speech for a school event.',
    },
    {
      title: 'Giving kind, useful feedback',
      oneLine: 'Good feedback says one specific thing that worked and one kind idea to make it even better.',
      idea: [
        '"It was good" does not help anyone. "Your hook about the octopus made me want to listen" does! Be specific.',
        'Use glow and grow: one glow (a strength) and one grow (a friendly idea). When you receive feedback, just say "Thank you".',
      ],
      drills: [
        { title: 'Glow and grow', brief: 'Listen to one of your earlier recordings and give yourself a specific glow and a specific grow.', targetSeconds: 40 },
        { title: 'Feedback for a friend', brief: 'Imagine a friend gave a talk where they spoke too fast but had a great story. Give them kind, specific feedback.', targetSeconds: 40 },
      ],
      game: { name: 'Glow & Grow', emoji: '🌱', how: ['After each talk, two listeners give one glow and one grow.', 'Every glow and grow must be specific.', 'The speaker only says "Thank you" — no arguing.'] },
      realWorld: 'Helping a friend improve their project or presentation.',
      mentorWatchFor: ['Vague praise.', 'Grows that sound like criticism.'],
      selfCheck: ['Was my feedback specific?', 'Was my grow kind?'],
      homeTip: 'After a family activity, share glows and grows with each other. Model saying "Thank you" to feedback.',
      writePrompt: 'Write a glow and a grow for a talk you watched recently, making each one specific.',
    },
    {
      title: 'A speech about someone who inspires me',
      oneLine: 'An inspiring speech shares a person’s story and what it teaches us, not just a list of facts.',
      idea: [
        'Choose someone who inspires you — a scientist, athlete, author or someone in your family. Tell one story that shows what makes them special.',
        'Then say what their story teaches you, and how it changes what you do. That is what makes a speech inspiring.',
      ],
      drills: [
        { title: 'My inspiration', brief: 'Give a ninety-second speech about someone who inspires you: a hook, one story about them, what it teaches and a strong ending.', targetSeconds: 90 },
        { title: 'The lesson', brief: 'Tell us the single most important lesson you learned from someone you admire, and how you use it.', targetSeconds: 45 },
      ],
      game: { name: 'Hall of Heroes', emoji: '🏛️', how: ['Children present their inspiring person like a museum guide.', 'Each talk must include one story and one lesson.', 'The class adds each hero’s lesson to a "Hall of Heroes" wall.'] },
      realWorld: 'A speech for a special day, like Teachers’ Day or Mother’s Day.',
      mentorWatchFor: ['Lists of achievements with no story.', 'Missing "what it teaches me".'],
      selfCheck: ['Did I tell a story?', 'Did I say what it teaches me?'],
      homeTip: 'Talk with your child about someone who inspires your family and why.',
      writePrompt: 'Write a speech about someone who inspires you: a hook, their story, the lesson and a strong ending.',
    },
  ],
};
