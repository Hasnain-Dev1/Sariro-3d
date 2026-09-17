import type { CourseModule } from '../types';

/* Grades 4–6 · Module 1 — The Speaker's Toolkit */
export const PRIMARY_M1: CourseModule = {
  title: "The Speaker's Toolkit",
  outcome: 'Control volume, speed, clarity and expression, and coach yourself from your own recordings.',
  world: { name: 'Toolkit Base Camp', emoji: '🧰', color: '#0891B2', tagline: 'Pack the tools every speaker needs.' },
  lessons: [
    {
      title: 'Why speaking up matters',
      oneLine: 'Speaking up is a skill you build, like riding a bike — and it helps you everywhere, not just on a stage.',
      idea: [
        'You speak up when you answer in class, explain a game, ask for help or tell your side of a story. People who speak clearly get listened to, picked for teams and trusted with jobs.',
        'Nobody is born good at it. Speakers you admire practised. Today you record your "before" talk, so at the end of the course you can hear how far you have come.',
      ],
      drills: [
        { title: 'My "before" talk', brief: 'Introduce yourself: your name, your class, something you are proud of and something you want to get better at. This is your before recording!', targetSeconds: 45 },
        { title: 'Where I need my voice', brief: 'Tell us about three places in your life where speaking up clearly would help you, and why.', targetSeconds: 45 },
      ],
      game: { name: 'Before & After Duel', emoji: '⚔️', how: ['Everyone records a 30-second "about me" with no tips.', 'The mentor teaches three quick tips: slow down, look up, smile.', 'Record again and compare the two — the class cheers the biggest jump.'] },
      realWorld: 'Introducing yourself in a new class, club or sports team.',
      mentorWatchFor: ['Children who believe they are "just shy" — plant the idea that it is a skill.', 'Very short intros — prompt for the proud moment.'],
      selfCheck: ['Did I record my before talk?', 'Do I know one thing I want to improve?'],
      homeTip: 'Save your child’s first recording. Ask them what they want to be able to do by the end of the course, and write it on the fridge.',
      writePrompt: 'Write about one time you wished you had spoken up, and what you would say now.',
    },
    {
      title: 'Voice volume for every room',
      oneLine: 'The right volume depends on the room: a whisper for a library, a strong voice for a classroom, a bigger one for a hall.',
      idea: [
        'Volume is like a dial from one to ten. Talking to a friend is a three. Answering in class is a six. Speaking in assembly might be an eight.',
        'Loud does not mean shouting. Stand tall, breathe into your tummy and aim your voice at the person furthest away.',
      ],
      drills: [
        { title: 'Three volumes', brief: 'Say "Our class trip is on Friday" at volume three, six and eight. Record the six!', targetSeconds: 15 },
        { title: 'Reach the back row', brief: 'Read this announcement as if the person you are talking to is at the back of a big hall.', passage: 'Good morning, everyone. The school library will be closed on Friday afternoon. Please return your books by Thursday. The new adventure books arrive next week, so keep your eyes open!', targetSeconds: 25 },
      ],
      game: { name: 'Volume Dial', emoji: '🎚️', how: ['The mentor shows a number from one to ten.', 'The speaker says a sentence at that volume.', 'The class shows a thumbs up if it matched the number without shouting.'] },
      realWorld: 'Answering in class so the teacher does not have to say "louder, please".',
      mentorWatchFor: ['Shouting from the throat instead of breathing from the tummy.', 'Volume dropping at the end of sentences.'],
      selfCheck: ['Could the back row hear me?', 'Did my voice stay strong to the end of each sentence?'],
      homeTip: 'Stand in different rooms of the house and ask your child to pick the right volume for each one.',
      writePrompt: 'Write a short announcement for your class about an event you would love to have.',
    },
    {
      title: 'Not too fast, not too slow',
      oneLine: 'When you rush, people miss your words; a steady speed and small pauses help them keep up.',
      idea: [
        'Nervous or excited speakers race. Listeners need time to hear each idea, picture it and get ready for the next.',
        'Pause at full stops. Slow down for the most important sentence. Speed up a little in exciting parts, then settle again.',
      ],
      model: { text: 'The rocket stood on the launch pad. Everyone counted down. Ten, nine, eight… (speeding up) and then — whoosh — it was gone. (slowly) The sky was silent again.', noticing: ['Steady at the start.', 'Faster for the excitement.', 'Slow and quiet for the ending.'] },
      drills: [
        { title: 'Steady reader', brief: 'Read this at a steady speed, with a clear pause at every full stop.', passage: 'Octopuses are some of the cleverest animals in the sea. They can open jars, solve puzzles and even escape from their tanks. They change colour to hide from danger. Scientists are still discovering how smart they really are.', targetSeconds: 25 },
        { title: 'Speed on purpose', brief: 'Tell us about a race, a game or a ride. Speed up for the exciting part and slow down for the ending.', targetSeconds: 45 },
      ],
      game: { name: 'Speed Signs', emoji: '🚦', how: ['The mentor holds up a red, yellow or green card while a child reads.', 'Green is a little faster, yellow is steady, red is a pause.', 'The class checks the reader followed every sign.'] },
      realWorld: 'Reading your answer aloud in class so everyone follows it.',
      mentorWatchFor: ['Running through full stops.', 'Slow speakers who drag every word the same.'],
      selfCheck: ['Did I pause at full stops?', 'Did I change speed on purpose?'],
      homeTip: 'Read a page of a book aloud together. Take turns being the "speed coach" who says "slow" or "pause".',
      writePrompt: 'Write four sentences about an exciting moment. Mark with a slash where you will pause.',
    },
    {
      title: 'Crisp and clear: saying every word',
      oneLine: 'Clear speakers finish every word, so nobody has to guess what they said.',
      idea: [
        'Mumbling happens when our lips and tongue get lazy — word endings disappear and words melt together.',
        'Warm up your mouth like an athlete warms up legs: stretch your lips, click your tongue, then say the ends of words: walk-ED, cat-S, lef-T.',
      ],
      drills: [
        { title: 'Twister workout', brief: 'Say each tongue twister slowly, then faster, keeping every sound crisp.', passage: 'Red lorry, yellow lorry. She sells seashells by the seashore. Unique New York, unique New York.', targetSeconds: 20 },
        { title: 'Word endings', brief: 'Read this carefully, making every ending sound clear.', passage: 'Last week our class visited the science museum. We watched robots, touched fossils and tested magnets. The best part was the planetarium, where the lights went out and the stars appeared above us.', targetSeconds: 25 },
      ],
      game: { name: 'Mumble Detectives', emoji: '🕵️', how: ['A child reads a sentence, mumbling one word on purpose.', 'The class detectives spot the mumbled word.', 'The child says it again crisply and the class gives it a nod.'] },
      realWorld: 'Saying your name and your answers clearly the first time.',
      mentorWatchFor: ['Dropped endings: -ed, -s, -t.', 'Speaking with hands over the mouth.'],
      selfCheck: ['Did I finish every word?', 'Did the lab hear my words right?'],
      homeTip: 'Have a tongue-twister challenge at dinner. Whoever says it three times clearly wins.',
      soundLab: ['ed', 's-ending'],
      writePrompt: 'Write your own tongue twister using one sound many times, then practise it.',
    },
    {
      title: 'Expression: sounding interested',
      oneLine: 'If you sound interested, your audience feels interested too.',
      idea: [
        'A flat voice tells listeners "this is boring" even when the topic is exciting. Expression means your voice goes up, down, loud, soft, fast and slow to match the meaning.',
        'Lean on the important words — the ones that carry the meaning — and let your face join in.',
      ],
      drills: [
        { title: 'Stress the key word', brief: 'Say "I didn’t eat the last cookie" five times, stressing a different word each time. Notice how the meaning changes!', targetSeconds: 25 },
        { title: 'Amazing fact', brief: 'Read this like it is the most amazing thing you have ever learned.', passage: 'A blue whale’s heart is as big as a car. Its tongue weighs as much as an elephant. And yet this giant eats some of the tiniest creatures in the ocean.', targetSeconds: 20 },
      ],
      game: { name: 'One Sentence, Many Meanings', emoji: '🔀', how: ['Put up a sentence like "You took my pencil."', 'Children stress a different word and the class guesses the meaning.', 'Whoever creates the most different meanings wins.'] },
      realWorld: 'Telling a story so your friends lean in to listen.',
      mentorWatchFor: ['Stressing every word equally.', 'Expression on the face but not in the voice.'],
      selfCheck: ['Did my voice go up and down?', 'Did I stress the important words?'],
      homeTip: 'Read a comic strip aloud together, giving each speech bubble lots of expression.',
      soundLab: ['stress'],
      writePrompt: 'Write three amazing facts about an animal. Underline the word in each one you will stress.',
    },
    {
      title: 'Be your own coach: listening back',
      oneLine: 'Recording yourself and listening back is how you find the one thing to fix next.',
      idea: [
        'Athletes watch videos of their games. Speakers listen to their recordings. It feels strange at first, and that is normal!',
        'Listen for one thing at a time: speed, volume, "ums" or clear endings. Pick ONE thing to fix, then record again.',
      ],
      drills: [
        { title: 'Record, listen, fix', brief: 'Talk for forty-five seconds about your favourite hobby. Listen back, choose one thing to fix and record again.', targetSeconds: 45 },
        { title: 'Coach’s report', brief: 'Listen to one of your recordings and give yourself a coach’s report: one thing that was great and one thing to fix.', targetSeconds: 30 },
      ],
      game: { name: 'Spot the Um', emoji: '🔔', how: ['Play two recordings from the class (with permission).', 'Everyone taps the table at every "um" or "like".', 'Compare with the lab’s filler count — do the class and the machine agree?'] },
      realWorld: 'Practising a speech or a video message before you send it.',
      mentorWatchFor: ['Children being harsh on themselves — always one glow before one grow.', 'Trying to fix everything at once.'],
      selfCheck: ['What is the one thing I fixed?', 'Was my second recording better?'],
      homeTip: 'Listen to your child’s two recordings with them. Ask "What changed?" before you say anything.',
      writePrompt: 'Write your own coach’s report: two things you do well when speaking and one goal for this month.',
    },
  ],
};

/* Grades 4–6 · Module 2 — Confidence Camp */
export const PRIMARY_M2: CourseModule = {
  title: 'Confidence Camp',
  outcome: 'Understand nerves, calm your body, practise smartly and bounce back from mistakes or a blank mind.',
  world: { name: 'Confidence Camp', emoji: '⛺', color: '#7C3AED', tagline: 'Turn butterflies into energy.' },
  lessons: [
    {
      title: 'Why we get nervous (and why it helps)',
      oneLine: 'Nerves are your body getting ready to do something important — you can use that energy.',
      idea: [
        'Before speaking, your heart beats fast, your hands feel sweaty and your tummy flips. That is your body sending extra energy, like before a race.',
        'Scientists found that saying "I am excited" instead of "I am nervous" helps people perform better. Same feeling, different name!',
      ],
      drills: [
        { title: 'Excited, not scared', brief: 'Tell us about a time you felt nervous before something. What did your body feel like, and what happened in the end?', targetSeconds: 45 },
        { title: 'Pep talk', brief: 'Give a pep talk to a friend who is nervous about speaking in class. What would you tell them?', targetSeconds: 40 },
      ],
      game: { name: 'Excited, Not Scared', emoji: '💓', how: ['Everyone does twenty star jumps and feels their heartbeat.', 'Say "I am excited!" together three times.', 'One child speaks for thirty seconds while the heartbeat is still going — nerves as fuel.'] },
      realWorld: 'The minute before a sports match, a test or a class presentation.',
      mentorWatchFor: ['Children who hide their nerves — normalise with your own story.', 'Pep talks with "just don’t be scared" — push for real tips.'],
      selfCheck: ['Can I name what nerves feel like in my body?', 'Did I try calling it excitement?'],
      homeTip: 'Share a time you were nervous and did something anyway. Ask your child when they felt that way.',
      writePrompt: 'Write a pep talk to your future self for the next time you feel nervous before speaking.',
    },
    {
      title: 'Brave breathing and the power pose',
      oneLine: 'Slow breaths calm your body, and a strong stance helps you feel ready.',
      idea: [
        'Box breathing: breathe in for four, hold for four, out for four, hold for four. Do it twice and your heart slows down.',
        'Then stand strong: feet apart, shoulders back, chin level. Hold it for ten seconds before you walk up to speak.',
      ],
      drills: [
        { title: 'Box breath, then begin', brief: 'Do two box breaths and a power pose. Then give a thirty-second talk about your favourite weekend activity.', targetSeconds: 30 },
        { title: 'Calm under pressure', brief: 'Do jumping jacks for twenty seconds, then use box breathing, then read this calmly.', passage: 'The captain looked at the team. The score was tied and there was one minute left. "Breathe," she said. "We know what to do." And they walked back onto the field together.', targetSeconds: 25 },
      ],
      game: { name: 'The Sixty-Second Reset', emoji: '🧘', how: ['Box breathe together: in four, hold four, out four, hold four.', 'Stand in a power pose for twenty seconds.', 'Straight into a thirty-second talk — compare how calm it felt.'] },
      realWorld: 'Walking to the front when the teacher calls your name.',
      mentorWatchFor: ['Breathing into the chest and lifting shoulders.', 'Rushing the counts.'],
      selfCheck: ['Did my body feel calmer?', 'Did I stand strong while I spoke?'],
      homeTip: 'Practise box breathing together before school on a day with a test or a presentation.',
      writePrompt: 'Write the steps of your own "ready to speak" routine in order.',
    },
    {
      title: 'Practise smart: the rehearsal plan',
      oneLine: 'Practising out loud, not just in your head, is the best cure for nerves.',
      idea: [
        'Reading your talk silently is not practice. Your mouth needs to practise too! Say it out loud at least three times.',
        'A smart plan: once reading your notes, once with only key words, once standing up as if it is the real thing.',
      ],
      drills: [
        { title: 'Rehearsal one and three', brief: 'Pick a topic: your favourite book. Talk about it once from notes and once standing with no notes. Record the second one.', targetSeconds: 60 },
        { title: 'Talk to the mirror', brief: 'Give a forty-five-second talk about a place you want to visit, as if a friend is listening.', targetSeconds: 45 },
      ],
      game: { name: 'Three Takes', emoji: '🎬', how: ['Everyone records the same forty-five-second talk three times in a row.', 'Put all three scores side by side.', 'Confidence is a graph that goes up — celebrate the rise.'] },
      realWorld: 'Getting ready for a project presentation or a part in the school play.',
      mentorWatchFor: ['Children who only practise silently.', 'Memorising word for word — encourage key words.'],
      selfCheck: ['Did I practise out loud?', 'Did my third try feel easier?'],
      homeTip: 'Be the audience for one rehearsal this week. Only say what you liked — no corrections yet.',
      writePrompt: 'Write your own rehearsal plan for your next school presentation: what, when and how many times.',
    },
    {
      title: 'Mistakes, mind blanks and bouncing back',
      oneLine: 'If you trip over a word or forget what comes next, pause, breathe and carry on — the audience barely notices.',
      idea: [
        'Every speaker makes mistakes. The audience does not remember the mistake; they remember whether you kept going.',
        'Mind blank? Pause (it looks thoughtful), look at your key words, or say your rescue line: "So, the most important thing is…"',
      ],
      drills: [
        { title: 'Rescue line', brief: 'Talk about your favourite sport. Halfway through, stop on purpose, use your rescue line and carry on.', targetSeconds: 45 },
        { title: 'Oops cards', brief: 'Tell us how to make a sandwich. Imagine a sneeze, a dropped note and a lost word — recover from each one calmly.', targetSeconds: 45 },
      ],
      game: { name: 'Oops Cards', emoji: '🃏', how: ['A child starts a sixty-second talk.', 'The mentor flashes a card mid-talk: lost word, sneeze, noise, dropped paper.', 'The child recovers without stopping; the class scores the recovery out of three.'] },
      realWorld: 'When your mind goes blank while answering a question in front of the class.',
      mentorWatchFor: ['Children who apologise over and over.', 'Giggling that turns into giving up.'],
      selfCheck: ['Did I keep going?', 'Do I have a rescue line ready?'],
      homeTip: 'Play a game where your child talks about their day and you gently clap once — they must pause, breathe and carry on.',
      writePrompt: 'Write three rescue lines you can use if your mind goes blank.',
    },
    {
      title: 'Talking from keywords, not a script',
      oneLine: 'Keywords on a card keep you on track, and let you look at your audience instead of your paper.',
      idea: [
        'Reading a script word for word makes you sound like a robot and hides your face behind paper.',
        'Instead, write five or six keywords on a small card — one for each part of your talk. Glance, look up, speak.',
      ],
      model: { text: 'Card: HOOK — octopus three hearts · BODY — clever / camouflage / escape · END — "cleverest creature in the sea"', noticing: ['Only key words, no sentences.', 'One line for each part.', 'Easy to read in a glance.'] },
      drills: [
        { title: 'Five keyword talk', brief: 'Write five keywords about your favourite animal on a card. Give a talk, glancing at the card only.', targetSeconds: 60 },
        { title: 'Script to keywords', brief: 'Take any paragraph from a school book. Turn it into four keywords and explain it without reading.', targetSeconds: 45 },
      ],
      game: { name: 'Glance & Go', emoji: '👀', how: ['Each child writes five keywords on a card.', 'They give a sixty-second talk and may glance at the card only three times.', 'The class counts glances.'] },
      realWorld: 'Presenting a science project without reading from your poster.',
      mentorWatchFor: ['Whole sentences sneaking onto the card.', 'Heads staying down after the glance.'],
      selfCheck: ['Did I look up more than down?', 'Did my keywords remind me of each part?'],
      homeTip: 'Help your child turn their next homework presentation into a keyword card.',
      writePrompt: 'Write a keyword card for a talk about your favourite place, with no more than six words.',
    },
    {
      title: 'Answering when the teacher picks you',
      oneLine: 'When you are asked a question, a clear, full-sentence answer beats a mumbled "I don’t know".',
      idea: [
        'Being picked by surprise is scary. The trick: take a breath, repeat part of the question, and answer in a full sentence.',
        'Not sure? Say what you DO know: "I’m not sure, but I think it might be… because…" That is brave and smart.',
      ],
      drills: [
        { title: 'Full sentence answers', brief: 'Answer these in full sentences: What is your favourite subject and why? What did you learn this week? What would you like to learn next?', targetSeconds: 45 },
        { title: 'I think it might be', brief: 'Answer a tricky question: "Why do you think leaves change colour?" Use "I’m not sure, but I think… because…"', targetSeconds: 30 },
      ],
      game: { name: 'Hot Seat Quick Fire', emoji: '🔥', how: ['One child sits in the "hot seat".', 'The class asks three easy questions and one tricky one.', 'The child answers in full sentences — using "I think it might be…" for the tricky one.'] },
      realWorld: 'Being called on in class or asked a question by the principal.',
      mentorWatchFor: ['One-word answers.', '"I don’t know" without trying — prompt the phrase.'],
      selfCheck: ['Did I answer in a full sentence?', 'Did I try, even when I was not sure?'],
      homeTip: 'At dinner, ask your child a "why" question and praise a full-sentence answer, even if it is a guess.',
      writePrompt: 'Write full-sentence answers to three questions your teacher might ask about a topic you are studying.',
    },
  ],
};
