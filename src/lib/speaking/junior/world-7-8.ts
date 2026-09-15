import { jd, type JuniorLesson } from './types';

/* ── World 7 · Real World — speaking in real life ─────────────────────────── */

export const JUNIOR_WORLD_7: JuniorLesson[] = [
  {
    number: 37,
    oneLine: 'When someone asks you questions, give a clear answer with one example — then stop.',
    idea: [
      'Grown-ups sometimes ask children questions — at a new school, a club, or a competition.',
      'Answer the question, give one example, and then stop talking. Short, clear answers sound confident.',
    ],
    drills: [
      jd(37, 'a', { title: 'Tell me about yourself', brief: 'Answer "Tell me about yourself" in three sentences: who you are, what you love, and something you are good at.', targetSeconds: 20 }),
      jd(37, 'b', { title: 'What are you proud of?', brief: 'Answer "What are you proud of?" with one example. Then stop.', targetSeconds: 30 }),
    ],
    realWorld: 'Meeting the teacher at a new school.',
    homeTip: 'Play "interview": ask your child three questions like a TV presenter. Praise short, clear answers.',
    soundLab: ['th', 'ed'],
    game: {
      name: 'Superhero Interview', emoji: '🦸',
      how: ['Each child picks a superhero name for themselves.', 'The class asks three questions: What is your power? What have you saved? Why should we trust you?', 'Answers must be short, with one example — then stop!'],
      realWorld: 'Meeting new grown-ups at a school or a club.',
    },
  },
  {
    number: 38,
    oneLine: 'It is okay to say "I don\'t know" — and then say what you do know.',
    idea: [
      'Sometimes you get a question you cannot answer. Do not make something up!',
      'Say "I am not sure, but I know that…" and share what you do know. That is smart and honest.',
    ],
    drills: [
      jd(38, 'a', { title: 'Explain something you know', brief: 'Explain how a rainbow happens, or anything you learned at school, in thirty seconds.', targetSeconds: 30 }),
      jd(38, 'b', { title: 'I am not sure, but…', brief: 'Answer "How far away is the moon?" — if you are not sure, say "I am not sure, but I know…".', targetSeconds: 20 }),
    ],
    realWorld: 'Answering the teacher\'s question in class.',
    homeTip: 'Ask your child tricky "why" questions. Praise "I am not sure, but…" answers.',
    game: {
      name: 'Why, Why, Why?', emoji: '❓',
      how: ['A child explains something simple, like why we wear coats.', 'The class asks "why?" three times, like a curious toddler.', 'The speaker answers or says "I am not sure, but I know…" — no guessing wildly!'],
      realWorld: 'Answering questions in class without panicking.',
    },
  },
  {
    number: 39,
    oneLine: 'Presenting to your class is like talking to friends at a table.',
    idea: [
      'You do not need a big stage voice for a classroom. Speak clearly, like explaining something to friends.',
      'If someone asks a question in the middle, answer it and carry on.',
    ],
    drills: [
      jd(39, 'a', { title: 'Teach us something', brief: 'Teach us how to do something you are good at, like drawing a cat, in forty-five seconds.', targetSeconds: 45 }),
      jd(39, 'b', { title: 'Show and teach', brief: 'Hold up an object and teach us three things about it.', targetSeconds: 60 }),
    ],
    realWorld: 'Presenting your project to your class.',
    homeTip: 'Let your child "teach" the family something they learned at school this week.',
    soundLab: ['ough'],
  },
  {
    number: 40,
    oneLine: 'In a group talk, take turns and add to what others say.',
    idea: [
      'In a group, the best talkers are also the best listeners.',
      'Wait for your turn. Then start with "I agree with Riya, and…" or "Adding to what Sam said…".',
    ],
    drills: [
      jd(40, 'a', { title: 'Adding to', brief: 'Pretend your friend said "Summer is the best season". Add to it, starting with "I agree, and…".', targetSeconds: 20 }),
      jd(40, 'b', { title: 'Kindly disagree', brief: 'Your friend said "Cats are better than dogs". Disagree kindly: "I see why you think that, but…".', targetSeconds: 30 }),
    ],
    realWorld: 'Deciding with friends what game to play.',
    homeTip: 'At dinner, use a "talking spoon": only the person holding it speaks, and they must add to what the last person said.',
  },
  {
    number: 41,
    oneLine: 'When you have to speak with no warning, use a simple shape: before, now, next.',
    idea: [
      'Sometimes a teacher says "Tell us about…" right now! No time to prepare.',
      'Use a shape: what it was like before, what it is like now, what will happen next. It works for almost anything.',
    ],
    drills: [
      jd(41, 'a', { title: 'Before, now, next', brief: 'Talk about your school using before (last year), now (this year) and next (next year).', targetSeconds: 30 }),
      jd(41, 'b', { title: 'Surprise topic', brief: 'Talk about ice cream right now, with no planning. Use before, now, next.', targetSeconds: 30 }),
    ],
    realWorld: 'When the teacher suddenly asks you to speak.',
    homeTip: 'Pick a surprise topic from a jar. Your child talks for thirty seconds using before, now, next.',
  },
  {
    number: 42,
    oneLine: 'If a question surprises you, repeat it, take a breath, then answer.',
    idea: [
      'A surprise question can make your mind jump.',
      'Say the question back ("What is my favourite subject?"), breathe, and then answer. It gives your brain a few seconds to think.',
    ],
    drills: [
      jd(42, 'a', { title: 'Say it back', brief: 'Answer "What would you do with a magic wand?" — first say the question back, then answer.', targetSeconds: 20 }),
      jd(42, 'b', { title: 'Tricky questions', brief: 'Answer "If you were a teacher, what rule would you make?" Say it back, breathe, answer.', targetSeconds: 30 }),
    ],
    realWorld: 'A surprise question at the end of your class presentation.',
    homeTip: 'Ask surprise "would you rather" questions. Your child says it back before answering.',
  },
];

/* ── World 8 · Grand Stage — performing ───────────────────────────────────── */

export const JUNIOR_WORLD_8: JuniorLesson[] = [
  {
    number: 43,
    oneLine: 'Change how you talk for different listeners.',
    idea: [
      'You talk differently to a baby, to your friend, and to your head teacher.',
      'Before you speak, ask: who is listening? Use easy words for little ones and polite words for grown-ups.',
    ],
    drills: [
      jd(43, 'a', { title: 'To a baby, to a friend', brief: 'Explain what a rainbow is to a baby, then to a friend.', targetSeconds: 30 }),
      jd(43, 'b', { title: 'To an alien', brief: 'Explain what a school is to an alien who has never seen one.', targetSeconds: 40 }),
    ],
    realWorld: 'Explaining your drawing to your little cousin and to your grandparents.',
    homeTip: 'Take turns explaining something (like a phone) to "a baby", "a grandparent" and "a robot".',
    game: {
      name: 'Three Listeners', emoji: '👶',
      how: ['A child explains the same thing three times: to a baby, to a grandparent, to an alien.', 'The class guesses which listener it is from the words and voice.', 'Talk about what changed each time.'],
      realWorld: 'Talking to little children and to grown-ups.',
    },
  },
  {
    number: 44,
    oneLine: 'A poster or picture should help you — not do the talking for you.',
    idea: [
      'If your poster has lots of words, people read it instead of listening to you.',
      'Use one big picture and very few words. You tell the rest.',
    ],
    drills: [
      jd(44, 'a', { title: 'One picture talk', brief: 'Draw or hold up one picture. Tell us about it for thirty seconds.', targetSeconds: 30 }),
      jd(44, 'b', { title: 'No poster at all', brief: 'Tell us about your favourite planet with no pictures. Make us see it with your words.', targetSeconds: 40 }),
    ],
    realWorld: 'Presenting a poster at the science fair.',
    homeTip: 'Help your child make a poster with one big picture and no more than five words.',
    game: {
      name: 'Poster Rescue', emoji: '🖼️',
      how: ['The mentor shows a messy poster full of tiny words.', 'In pairs, children fix it: one big picture, five words or fewer.', 'Each pair presents their fixed poster in thirty seconds.'],
      realWorld: 'A school project with a poster.',
    },
  },
  {
    number: 45,
    oneLine: 'In a friendly debate, listen to the other side, then give your reasons.',
    idea: [
      'A debate is two sides talking about a question, like "Should homework be fun?"',
      'The best debaters say what the other side said fairly, then explain why they think differently.',
    ],
    drills: [
      jd(45, 'a', { title: 'My side', brief: 'Should children have a longer lunch break? Pick a side and give two reasons.', targetSeconds: 30 }),
      jd(45, 'b', { title: 'Both sides', brief: 'Say one reason FOR school uniforms and one reason AGAINST. Then say which side you pick.', targetSeconds: 40 }),
    ],
    realWorld: 'A class debate about a fun question.',
    homeTip: 'Have a friendly family debate: "Pizza or pasta?" Each person must say the other side\'s best reason first.',
  },
  {
    number: 46,
    oneLine: 'Kind feedback says one great thing and one thing to try next time.',
    idea: [
      'When a friend speaks, tell them one thing they did really well — say exactly what.',
      'Then one small thing to try next time. When you get feedback, just say "thank you".',
    ],
    drills: [
      jd(46, 'a', { title: 'Glow and grow', brief: 'Think of a talk you heard. Say one "glow" (something great) and one "grow" (something to try).', targetSeconds: 20 }),
      jd(46, 'b', { title: 'Thank you', brief: 'Pretend someone told you to speak slower. Say thank you, and then say your talk again, slower.', targetSeconds: 30 }),
    ],
    realWorld: 'Helping a friend get better at their presentation.',
    homeTip: 'After your child shows you something, give one glow and one grow. Ask them to do the same for you.',
  },
  {
    number: 47,
    oneLine: 'Your big speech: everything you learned, about something you care about.',
    idea: [
      'Pick something you really care about: animals, the planet, your family, a hobby.',
      'Use a hook, three reasons, a story, a strong ending — and stand tall. This is your moment to shine!',
    ],
    drills: [
      jd(47, 'a', { title: 'My speech plan', brief: 'Say your hook, your three reasons, and your ending — just the plan, no extra words.', targetSeconds: 30 }),
      jd(47, 'b', { title: 'My big speech', brief: 'Give your whole speech about something you care about. Stand tall and smile!', targetSeconds: 90 }),
    ],
    realWorld: 'Giving a speech at your school\'s annual day.',
    homeTip: 'Invite the family to be the audience for your child\'s big speech. Film it and keep it — it is a milestone.',
  },
];
