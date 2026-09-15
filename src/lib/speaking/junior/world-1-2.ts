import { jd, type JuniorLesson } from './types';

/* ── World 1 · Voice Valley — finding your voice ──────────────────────────── */

export const JUNIOR_WORLD_1: JuniorLesson[] = [
  {
    number: 1,
    oneLine: 'Nobody is born a great speaker. Everybody gets better by practising — and you can see yourself getting better.',
    idea: [
      'Some people look like they were born brave on stage. They were not. They practised, again and again, until it felt easy.',
      'Today you will record yourself for the first time. It does not have to be good. It is your "before" picture, so later you can see how much you grew.',
    ],
    drills: [
      jd(1, 'a', { title: 'Hello, this is me', brief: 'Say your name, your age, and one thing you love. Smile while you say it!', targetSeconds: 20 }),
      jd(1, 'b', { title: 'Read it like a storyteller', brief: 'Read this out loud, slowly, like you are reading to a friend.', passage: 'Once there was a small green frog who wanted to sing. Every morning he practised by the pond. At first he croaked. Then one day, he sang.', targetSeconds: 20 }),
    ],
    realWorld: 'Saying hello to your new class on the first day of school.',
    homeTip: 'At dinner, ask your child to tell the family one thing about their day in three sentences. Clap at the end. That is practice.',
  },
  {
    number: 2,
    oneLine: 'People listen when you surprise them at the very start.',
    idea: [
      'If you start with "Um, hi, today I will talk about…", people start thinking about something else.',
      'Start with a question, a funny fact, or a tiny story instead. That makes people want to hear what comes next.',
    ],
    model: { text: 'Did you know an octopus has three hearts? Today I will tell you about the strangest animal in the sea.', noticing: ['It starts with a question.', 'You want to know more straight away.'] },
    drills: [
      jd(2, 'a', { title: 'Start with a question', brief: 'Talk about your favourite animal. Your first sentence must be a question, like "Did you know…?"', targetSeconds: 20 }),
      jd(2, 'b', { title: 'Start with a surprise', brief: 'Talk about your favourite food. Start with something surprising about it. No "Hello, my name is"!', targetSeconds: 30 }),
    ],
    realWorld: 'Getting your friends to listen to your weekend story.',
    homeTip: 'Take turns telling a story that must start with a question. The listener says whether the question made them curious.',
  },
  {
    number: 3,
    oneLine: 'Your best speaking voice is the one you use with your best friend.',
    idea: [
      'When you talk to a friend, your voice goes up and down and sounds happy. When people watch you, your voice can become flat, like a robot.',
      'The trick: pretend you are talking to one friend, even when many people are listening.',
    ],
    drills: [
      jd(3, 'a', { title: 'Tell a friend a game', brief: 'Explain how to play your favourite game, as if your best friend is sitting next to you.', targetSeconds: 30 }),
      jd(3, 'b', { title: 'Robot, then friend', brief: 'Say "I love going to the park" like a robot. Then say it to your best friend. Record the friend one!', targetSeconds: 15 }),
    ],
    realWorld: 'Explaining a game to your younger cousin.',
    homeTip: 'Play "robot or friend": the child says a sentence two ways, and you guess which is the friend voice.',
    soundLab: ['th', 'v-w'],
  },
  {
    number: 4,
    oneLine: 'A pause is like a full stop you can hear. It helps people understand you.',
    idea: [
      'When we are excited, we talk very fast and forget to breathe. Then words bump into each other.',
      'Stop at every full stop. Take a little breath. Count "one" in your head. Your words will sound calm and clear.',
    ],
    model: { text: 'The sun came up. The birds began to sing. And then, very slowly, the little bear opened one eye.', noticing: ['Stop at each full stop.', 'Wait a bit longer before "very slowly".'] },
    drills: [
      jd(4, 'a', { title: 'Stop at the full stops', brief: 'Read this. At every full stop, stop and count "one" in your head.', passage: 'The sun came up. The birds began to sing. And then, very slowly, the little bear opened one eye.', targetSeconds: 15 }),
      jd(4, 'b', { title: 'The long story, breathing', brief: 'Read this longer story and breathe at every full stop.', passage: 'Mia found a map under her bed. It showed a big red cross in her garden. She took a spoon and started to dig. What do you think she found? A box of old buttons, and a note from her grandma.', targetSeconds: 25 }),
    ],
    realWorld: 'Reading a notice in the school assembly.',
    homeTip: 'Read a bedtime story together and take turns reading a page. Whoever stops at every full stop gets to choose the next book.',
    soundLab: ['s-ending'],
  },
  {
    number: 5,
    oneLine: 'You can make a word important by saying it louder or slower.',
    idea: [
      'If every word sounds the same, nobody knows which words matter.',
      'Pick the most important word and give it a little push: a bit louder, a bit slower. That is called emphasis.',
    ],
    model: { text: 'I did not eat the cake.', noticing: ['Say it pushing "I" — someone else ate it!', 'Say it pushing "cake" — you ate something else!'] },
    drills: [
      jd(5, 'a', { title: 'Who ate the cake?', brief: 'Say "I did not eat the cake" three times. Each time, push a different word. Notice how the meaning changes.', targetSeconds: 15 }),
      jd(5, 'b', { title: 'The exciting list', brief: 'Read this and get more excited with each thing.', passage: 'At the fair there was a big wheel, a bouncy castle, a juggling clown, and the biggest, yummiest ice cream in the whole world!', targetSeconds: 15 }),
    ],
    realWorld: 'Saying sorry so it sounds like you really mean it.',
    homeTip: 'Say one sentence and push a different word each time. Can your child guess what you mean?',
    soundLab: ['oo'],
  },
  {
    number: 6,
    oneLine: 'Listening to your own recording is a superpower — it shows you exactly what to fix.',
    idea: [
      'Almost everybody thinks their voice sounds funny on a recording. That is normal!',
      'Listen once for one thing only, like "um". Next time, try to say it fewer times. That is how you get better fast.',
    ],
    drills: [
      jd(6, 'a', { title: 'My before and after', brief: 'Say your name, your age and one thing you love again — like in the first lesson. Is it better now?', targetSeconds: 20 }),
      jd(6, 'b', { title: 'No "um" challenge', brief: 'Talk about your favourite toy. Every time you want to say "um", close your mouth and pause instead.', targetSeconds: 30 }),
    ],
    realWorld: 'Sending a voice message to your grandparents.',
    homeTip: 'Record your child on a phone telling a joke. Listen together and count the "um"s. Try again and beat the number.',
    soundLab: ['silent'],
  },
];

/* ── World 2 · Brave Bridge — nerves ──────────────────────────────────────── */

export const JUNIOR_WORLD_2: JuniorLesson[] = [
  {
    number: 7,
    oneLine: 'Butterflies in your tummy mean your body is getting ready to do something exciting.',
    idea: [
      'Before you speak, your heart may beat fast and your hands may feel shaky. That is your body switching on, like a car starting.',
      'Instead of saying "I am scared", say "I am excited!" Your body feels almost the same both ways — but "excited" helps you do better.',
    ],
    drills: [
      jd(7, 'a', { title: 'How does my body feel?', brief: 'Tell us what happens in your body before you speak: your tummy, your hands, your heart.', targetSeconds: 20 }),
      jd(7, 'b', { title: 'I am excited!', brief: 'Say "I am excited!" three times, big and loud. Then talk about your favourite place for thirty seconds.', targetSeconds: 30 }),
    ],
    realWorld: 'The minute before a sports race or a school show.',
    homeTip: 'Before anything that feels scary, say "I am excited!" together, three times, like a team cheer.',
  },
  {
    number: 8,
    oneLine: 'Being ready makes the scary feeling smaller.',
    idea: [
      'A lot of fear comes from not knowing what to say next.',
      'Before you speak, plan three things: your first sentence, your middle, and your last sentence. Then you always know where you are going.',
    ],
    drills: [
      jd(8, 'a', { title: 'First, middle, last', brief: 'Pick a pet you have or want. Say only three sentences: a first sentence, one about why you love it, and a last sentence.', targetSeconds: 20 }),
      jd(8, 'b', { title: 'Fill in the middle', brief: 'Now use the same first and last sentences, and add two more things in the middle.', targetSeconds: 40 }),
    ],
    realWorld: 'Getting ready to read your poem in class.',
    homeTip: 'Draw three boxes on paper: first, middle, last. Your child draws a picture in each box, then tells the story.',
  },
  {
    number: 9,
    oneLine: 'Three quick tricks help you feel calm right before you speak.',
    idea: [
      'Trick one: smell the flower, blow out the candle — breathe in slowly, breathe out slowly.',
      'Trick two: stand like a superhero for ten seconds. Trick three: know your first sentence by heart.',
    ],
    drills: [
      jd(9, 'a', { title: 'Flower and candle', brief: 'Smell the flower (breathe in), blow out the candle (breathe out) three times. Then say your first sentence about your favourite colour.', targetSeconds: 20 }),
      jd(9, 'b', { title: 'Superhero start', brief: 'Stand like a superhero for ten seconds. Then talk about a superpower you would love to have.', targetSeconds: 30 }),
    ],
    realWorld: 'Walking up to the front of the class when your name is called.',
    homeTip: 'Practise the "flower and candle" breath together before homework or bedtime.',
  },
  {
    number: 10,
    oneLine: 'If you make a mistake, fix it quickly and keep going — people forget it in a few seconds.',
    idea: [
      'Everybody trips over words sometimes. Even newsreaders on TV.',
      'Just say the word again, smile a tiny smile, and carry on. Do not stop and say "sorry, sorry". Keep going!',
    ],
    drills: [
      jd(10, 'a', { title: 'Tricky words race', brief: 'Read this. If you trip on a word, say it again and keep going. Do not stop!', passage: 'Six sleepy sheep sat silently by the shiny ship, sharing sweet strawberries.', targetSeconds: 15 }),
      jd(10, 'b', { title: 'Oops and carry on', brief: 'Talk about your school. Make one mistake on purpose, fix it, and keep going like nothing happened.', targetSeconds: 30 }),
    ],
    realWorld: 'When you mix up a word while reading aloud in class.',
    homeTip: 'Play a tongue-twister game. The rule: whoever trips just keeps going. Laugh together at the end.',
  },
  {
    number: 11,
    oneLine: 'If you forget what to say, pause, breathe, and say the last thing again.',
    idea: [
      'Sometimes your mind goes empty. That is okay! Nobody can see inside your head.',
      'Pause. Take a breath. Say the last thing you said again. Usually the next idea comes back by itself.',
    ],
    drills: [
      jd(11, 'a', { title: 'The magic sentence', brief: 'Talk about your favourite holiday. In the middle, stop, breathe, and say "So, as I was saying…" and carry on.', targetSeconds: 30 }),
      jd(11, 'b', { title: 'Three picture words', brief: 'Think of three words about a trip (like beach, sandcastle, ice cream). Use only those words to remember your talk.', targetSeconds: 40 }),
    ],
    realWorld: 'Forgetting the next line of your part in the school play.',
    homeTip: 'Play "freeze": while your child tells a story, say "freeze!". They breathe, say "So, as I was saying…" and continue.',
  },
  {
    number: 12,
    oneLine: 'Every time you speak, you get a little braver. Brave grows with practice.',
    idea: [
      'Confidence is like a muscle. It grows each time you use it.',
      'Today you will speak for longer than ever before. Look back at your very first recording — see how far you have come!',
    ],
    drills: [
      jd(12, 'a', { title: 'One whole minute', brief: 'Talk for one minute about the best day of your life. Do not stop!', targetSeconds: 60 }),
      jd(12, 'b', { title: 'My first recording, again', brief: 'Do your very first "Hello, this is me" talk again. You are braver now!', targetSeconds: 30 }),
    ],
    realWorld: 'Talking to a new friend at the park.',
    homeTip: 'Make a "brave jar": add a sticker each time your child speaks up — ordering food, asking a question, answering the phone.',
  },
];
