import { jd, type JuniorLesson } from './types';

/* ── World 5 · Debate Dome — persuading, kindly ───────────────────────────── */

export const JUNIOR_WORLD_5: JuniorLesson[] = [
  {
    number: 25,
    oneLine: 'When you want to convince someone, first know exactly what you want them to do.',
    idea: [
      'Persuading means changing what someone does. So you need to know the "ask" — the thing you want.',
      '"Please let me join the football club" is an ask. "Football is nice" is not. Say your ask clearly at the end.',
    ],
    drills: [
      jd(25, 'a', { title: 'My clear ask', brief: 'Ask your family for one thing you really want, in one clear sentence starting with "Please…".', targetSeconds: 15 }),
      jd(25, 'b', { title: 'Sell me this pencil', brief: 'Talk for thirty seconds to make someone want your pencil. End with your ask: "Will you buy it?"', targetSeconds: 30 }),
    ],
    realWorld: 'Asking your teacher for one more day to finish a project.',
    homeTip: 'When your child asks for something, say "What exactly is your ask?" before answering.',
  },
  {
    number: 26,
    oneLine: 'People are convinced by good reasons, real feelings, and trusting you.',
    idea: [
      'There are three ways to convince: a good reason ("it is healthy"), a feeling ("it makes me so happy"), and trust ("I always keep my promises").',
      'The best speakers use all three.',
    ],
    drills: [
      jd(26, 'a', { title: 'Reason, feeling, trust', brief: 'Convince your parents you should get a pet. Give one reason, one feeling, and one promise.', targetSeconds: 30 }),
      jd(26, 'b', { title: 'A later bedtime', brief: 'Convince us your bedtime should be ten minutes later. Use a reason, a feeling and trust.', targetSeconds: 40 }),
    ],
    realWorld: 'Persuading your family where to go on a day out.',
    homeTip: 'Let your child argue for a family weekend plan using a reason, a feeling and a promise.',
  },
  {
    number: 27,
    oneLine: 'A fact or a number makes your reason stronger — if people can picture it.',
    idea: [
      '"Dogs are very fast" is okay. "A greyhound can run as fast as a car in town" is much stronger, because you can picture it.',
      'Use one fact, and compare it to something people know.',
    ],
    drills: [
      jd(27, 'a', { title: 'Picture the fact', brief: 'Tell us about a giant animal, like a blue whale. Compare its size to something we know, like a bus.', targetSeconds: 30 }),
      jd(27, 'b', { title: 'Why we should save water', brief: 'Give a short talk about saving water. Include one fact and something to compare it to.', targetSeconds: 40 }),
    ],
    realWorld: 'Showing your class why your science fair idea matters.',
    homeTip: 'Look up one amazing animal fact together and practise saying it with a comparison.',
  },
  {
    number: 28,
    oneLine: 'Say what the other person might worry about — then answer it.',
    idea: [
      'If you want a puppy, your parents might think "Who will walk it?"',
      'Say their worry first — "I know you worry about walks" — and then answer it — "I will walk it every morning". That is very convincing.',
    ],
    drills: [
      jd(28, 'a', { title: 'Answer the worry', brief: 'You want a puppy. Say one worry your parents have, then answer it.', targetSeconds: 20 }),
      jd(28, 'b', { title: 'Two worries, two answers', brief: 'You want a class trip to the zoo. Say two worries your teacher might have, and answer both.', targetSeconds: 40 }),
    ],
    realWorld: 'Asking to go to a sleepover.',
    homeTip: 'When your child asks for something, ask "What do you think I am worried about?" and let them answer it.',
  },
  {
    number: 29,
    oneLine: 'Speaker tricks: say things in threes, and repeat your best line.',
    idea: [
      'Some word tricks have been used for thousands of years. Two easy ones: saying things in threes ("fast, fun and free") and repeating a strong line.',
      'Use them to make your talk sound like a real speech.',
    ],
    model: { text: 'Reading is fun. Reading is exciting. Reading takes you anywhere you want to go.', noticing: ['"Reading" three times.', 'The last one is the biggest.'] },
    drills: [
      jd(29, 'a', { title: 'Magic threes', brief: 'Describe your favourite place with three words, like "sunny, sandy and super". Then talk about it.', targetSeconds: 20 }),
      jd(29, 'b', { title: 'Repeat the best line', brief: 'Give a short speech about why we should play outside. Repeat your best sentence three times.', targetSeconds: 40 }),
    ],
    realWorld: 'A speech for your school\'s sports day.',
    homeTip: 'Find a line from a favourite book that repeats. Read it together with big energy.',
  },
  {
    number: 30,
    oneLine: 'Good persuading is honest. Tricking people is not.',
    idea: [
      'You can use these speaker tricks to tell the truth — or to trick people. Adverts sometimes trick us.',
      'A good speaker only persuades people about things that are true and fair.',
    ],
    drills: [
      jd(30, 'a', { title: 'Something I really believe', brief: 'Talk about something you truly believe is good, like being kind. Only say true things.', targetSeconds: 30 }),
      jd(30, 'b', { title: 'Spot the trick', brief: 'Imagine a toy advert that says "the best toy EVER, everyone has one!". Explain why that might be a trick.', targetSeconds: 30 }),
    ],
    realWorld: 'Deciding whether a toy advert is telling the truth.',
    homeTip: 'Watch one advert together. Ask: what is true, and what are they trying to make you feel?',
    game: {
      name: 'Honest or Tricky?', emoji: '🕵️',
      how: ['The mentor shows three silly toy adverts ("Everyone in the world has this robot!").', 'Children shout "honest!" or "tricky!" and say why.', 'Together, rewrite the tricky advert so it is true and still exciting.'],
      realWorld: 'Not being fooled by an advert that says "everyone has one".',
    },
  },
];

/* ── World 6 · Story Forest — stories ─────────────────────────────────────── */

export const JUNIOR_WORLD_6: JuniorLesson[] = [
  {
    number: 31,
    oneLine: 'People remember stories much more than facts.',
    idea: [
      'If I say "bees make honey", you might forget. If I tell you about a tiny bee who visited hundreds of flowers in one day, working with her whole hive to fill one jar of honey, you will remember.',
      'Stories make people ask "what happens next?"',
    ],
    drills: [
      jd(31, 'a', { title: 'Fact to story', brief: 'Take the fact "plants need water". Turn it into a tiny story about a thirsty flower.', targetSeconds: 30 }),
      jd(31, 'b', { title: 'What happens next?', brief: 'Tell a story about a lost kitten. Stop at an exciting moment and ask "What do you think happened?"', targetSeconds: 40 }),
    ],
    realWorld: 'Making your science project exciting for the class.',
    homeTip: 'Turn one fact from homework into a bedtime story together.',
  },
  {
    number: 32,
    oneLine: 'The best stories are about the moment something changed.',
    idea: [
      'A story is not just "I went to the park". It is "I went to the park, and then my kite got stuck in a tree!"',
      'Look for the moment something changed — that is where your story lives.',
    ],
    drills: [
      jd(32, 'a', { title: 'And then…', brief: 'Tell us about a normal day, but find the moment something changed and say "And then…".', targetSeconds: 30 }),
      jd(32, 'b', { title: 'A boring thing, made exciting', brief: 'Brushing your teeth is boring… unless something happened! Make up the moment something changed.', targetSeconds: 40 }),
    ],
    realWorld: 'Telling your friends what happened on your holiday.',
    homeTip: 'At dinner, ask "What was the moment today when something changed?"',
  },
  {
    number: 33,
    oneLine: 'Every story has a beginning, a problem, and an ending.',
    idea: [
      'Beginning: who and where. Problem: what went wrong. Ending: how it was fixed.',
      'The problem is the most exciting part, so do not take too long getting there.',
    ],
    model: { text: 'Leo had a red balloon. Suddenly, the wind pulled it away into the sky! Leo ran and ran, and a tall girl jumped and caught the string.', noticing: ['Beginning: Leo and his balloon.', 'Problem: the wind. Ending: the tall girl.'] },
    drills: [
      jd(33, 'a', { title: 'Beginning, problem, ending', brief: 'Tell a story about a robot. Use three parts: beginning, problem, ending.', targetSeconds: 40 }),
      jd(33, 'b', { title: 'Story dice', brief: 'Pick three things: a dragon, a bicycle and a cake. Tell a story with a beginning, a problem and an ending.', targetSeconds: 60 }),
    ],
    realWorld: 'Telling a bedtime story to a younger brother or sister.',
    homeTip: 'Pick three random objects in the room. Your child makes a story with a beginning, a problem and an ending.',
  },
  {
    number: 34,
    oneLine: 'One special detail makes your story come alive.',
    idea: [
      '"We had lunch" is flat. "We had hot, cheesy pizza that stretched like a rope" makes people see it!',
      'Add one detail you saw, heard, smelled, tasted or felt.',
    ],
    drills: [
      jd(34, 'a', { title: 'Use your senses', brief: 'Describe your favourite meal. Say one thing you see, smell and taste.', targetSeconds: 30 }),
      jd(34, 'b', { title: 'The rainy day', brief: 'Read this, then tell your own weather story with one special detail.', passage: 'The rain went pitter patter on the window. My boots squelched in the mud. The air smelled like wet grass and chocolate cake.', targetSeconds: 40 }),
    ],
    realWorld: 'Writing and telling your best holiday memory.',
    homeTip: 'Play "five senses": describe the kitchen right now using one thing for each sense.',
  },
  {
    number: 35,
    oneLine: 'The kindest jokes are about yourself, never about someone else.',
    idea: [
      'Funny stories make people smile. The best ones are about a silly thing that happened to you.',
      'Never make a joke about someone in the room. And after the funny bit, wait a second — let people laugh.',
    ],
    drills: [
      jd(35, 'a', { title: 'My silly moment', brief: 'Tell a funny story about a time you did something silly. Pause after the funny part.', targetSeconds: 30 }),
      jd(35, 'b', { title: 'The pause for laughs', brief: 'Tell a joke you know. After the punchline, wait two seconds before you smile.', targetSeconds: 20 }),
    ],
    realWorld: 'Making your class laugh during show and tell.',
    homeTip: 'Share a silly thing that happened to you as a child. Let your child share one back.',
  },
  {
    number: 36,
    oneLine: 'Your own stories are the most interesting ones you have.',
    idea: [
      'Nobody else has lived your life, so nobody else has your stories.',
      'A story about a time you tried something hard, or learned something, makes people feel they know you.',
    ],
    drills: [
      jd(36, 'a', { title: 'The day I learned', brief: 'Tell us about a time you learned to do something hard, like riding a bike or swimming.', targetSeconds: 40 }),
      jd(36, 'b', { title: 'My best story', brief: 'Tell your very best story about yourself for one minute.', targetSeconds: 60 }),
    ],
    realWorld: 'Answering "tell us about yourself" at a new club.',
    homeTip: 'Look at an old family photo together. Your child tells the story behind it.',
  },
];
