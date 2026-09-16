import { bd, type BandLesson } from '../types';

/**
 * Grades 4–6 · Worlds 1 and 2 — Voice Valley and Brave Bridge
 *
 * Nine to twelve: old enough to present a project, read in assembly and argue
 * with a sibling; young enough that "audience" means their own class. Every
 * example is a room they are actually in.
 */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('primary', n, part, x);

export const PRIMARY_WORLD_1: BandLesson[] = [
  {
    number: 1,
    oneLine: 'Great speakers are not born confident — they practise, and you can hear yourself getting better.',
    idea: [
      'The student who presents brilliantly in assembly was not always like that. They spoke up, got it a bit wrong, listened back, and tried again. Speaking is a skill, like cycling or football, and skills grow with practice.',
      'Today you record your "before". It does not need to be good. In a few weeks you will listen to it again and hear exactly how far you have come.',
    ],
    drills: [
      d(1, 'a', { title: 'Introduce yourself to a new class', brief: 'Imagine it is your first day in a new class. Say your name, your grade, something you are good at and something you want to learn this year.', targetSeconds: 30 }),
      d(1, 'b', { title: 'Read it like a news presenter', brief: 'Read this out loud clearly and calmly, as if you are presenting the school news in assembly.', passage: 'Good morning, everyone. This week our football team won their first match of the season. The library has new books about space and dinosaurs. And on Friday, the science fair opens in the main hall.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(1, 'c', { title: 'Three facts about me', brief: 'Tell us three facts about yourself — one true thing nobody in class knows, one thing you love, and one thing you are proud of.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Children who rush to finish the recording — the baseline should sound like them, not like a race.', 'Anyone who refuses to record: let them record just their name today. Starting is the goal.'],
    selfCheck: ['Did I say all four things in my introduction?', 'Which part felt easiest to say?'],
    realWorld: 'Introducing yourself when you join a new class, club or sports team.',
    homeTip: 'Ask your child to introduce themselves to you as if you were a new teacher. Then swap: you introduce yourself and they give you one tip.',
    writePrompt: 'Write your new-class introduction: your name, your grade, something you are good at and something you want to learn.',
  },
  {
    number: 2,
    oneLine: 'The first ten seconds decide whether your class listens — so do not waste them.',
    idea: [
      'Most talks start with "Hi, my name is… and today I am going to talk about…". By the end of that sentence, half the class is looking out of the window.',
      'Start with something that makes people curious instead: a question, a surprising fact, or the most exciting moment of your story. You can say your topic after you have their attention.',
    ],
    model: {
      text: 'What weighs as much as a car but can swim faster than you can run? A dolphin. Today I will tell you why dolphins are the smartest animals in the ocean.',
      noticing: ['It starts with a question you want answered.', 'The topic comes AFTER the hook, not before it.'],
    },
    drills: [
      d(2, 'a', { title: 'Hook your project', brief: 'Pick a school project you have done or would like to do. Start with a question or a surprising fact, then say what the project is about.', targetSeconds: 30 }),
      d(2, 'b', { title: 'Boring, then brilliant', brief: 'Start a talk about your favourite sport the boring way — "Hi, today I will talk about…". Then start again with a hook. Keep the brilliant one going for thirty seconds.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(2, 'c', { title: 'Start in the middle', brief: 'Tell a story about something funny that happened at school, but start at the most exciting moment — "And then the fire alarm went off…".', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Hooks that are questions with a boring answer ("Do you like pizza?"). Push for one the class cannot answer straight away.', 'Children who still say their name first out of habit — let the class spot it.'],
    selfCheck: ['Was my first sentence a hook, or an introduction?', 'Would my best friend want to hear the next sentence?'],
    realWorld: 'Presenting your science project or book review to the class.',
    homeTip: 'At dinner, everyone tells one thing about their day — but it must start with a question or a surprise. Vote for the best hook.',
    writePrompt: 'Write three different hooks for the same topic: a question, a surprising fact and a "start in the middle" sentence. Circle your favourite.',
  },
  {
    number: 3,
    oneLine: 'Your best presenting voice is the one you use when you explain something to a friend.',
    idea: [
      'When you explain a game to your friend, your voice goes up and down, you speed up at the exciting bits and slow down for the tricky rules. That is a great speaking voice.',
      'Many children stand in front of the class and switch to a flat "reading voice". The trick is to imagine you are explaining it to one friend, even when thirty people are listening.',
    ],
    drills: [
      d(3, 'a', { title: 'Explain it to your best friend', brief: 'Explain how to play a game you love — board game, video game or playground game — as if your best friend is sitting right next to you.', targetSeconds: 45 }),
      d(3, 'b', { title: 'Reading voice versus friend voice', brief: 'Say "The water cycle is how water moves around our planet" in a flat reading voice. Then say it again as if you are telling a friend something amazing, and keep going for twenty seconds.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(3, 'c', { title: 'Teach a younger child', brief: 'Explain what a volcano is to a six-year-old. Use simple words and a voice that makes them excited to learn.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['The moment a child switches into "presentation mode" — point it out kindly and ask them to talk to you instead.', 'Monotone reading of known facts; ask what the most surprising part is and let them lift it.'],
    selfCheck: ['Did my voice go up and down, or stay flat?', 'Would a friend enjoy listening to that?'],
    realWorld: 'Explaining the rules of a game to friends at break time.',
    homeTip: 'Ask your child to explain something from school today as if you were their best friend. Tell them which bit sounded most exciting.',
    soundLab: ['th', 'v-w'],
    writePrompt: 'Write the three most important rules of your favourite game, the way you would explain them to a friend.',
  },
  {
    number: 4,
    oneLine: 'A pause gives your listeners time to understand — and makes you sound calm and in control.',
    idea: [
      'When we are nervous we speed up, forget to breathe, and our words tumble into each other. The audience cannot keep up, and we run out of breath.',
      'Use every full stop as a place to breathe. Before an important sentence, wait a second longer. It feels very long to you, but to the audience it sounds confident.',
    ],
    model: {
      text: 'The explorers had walked for three days. Their food was gone. Their water was nearly finished. And then, on the fourth morning, they saw the river.',
      noticing: ['A breath at every full stop.', 'A longer pause before "And then" makes everyone lean in.'],
    },
    drills: [
      d(4, 'a', { title: 'Breathe at the full stops', brief: 'Read this story aloud. Take a breath at every full stop, and wait a little longer before the last sentence.', passage: 'The explorers had walked for three days. Their food was gone. Their water was nearly finished. And then, on the fourth morning, they saw the river.', targetSeconds: 20 }),
      d(4, 'b', { title: 'The assembly notice', brief: 'Read this notice slowly and clearly, as if the whole school is listening. Pause at every full stop and comma.', passage: 'Attention, please. The school trip to the museum is on Thursday. Everyone must bring a packed lunch, a water bottle and a signed permission slip. The bus leaves at nine o\'clock sharp, so please do not be late.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(4, 'c', { title: 'Too fast, then just right', brief: 'Tell us about your last holiday as fast as you can. Then tell it again with pauses between your sentences. Keep the calm version.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Children who pause mid-sentence instead of at punctuation — show them where the full stops are.', 'Pauses that are held but with a rush straight after; the sentence after the pause should stay slow.'],
    selfCheck: ['Did I breathe at every full stop?', 'Did my pause before the important sentence feel long or confident?'],
    realWorld: 'Reading a notice or a prayer in school assembly.',
    homeTip: 'Take turns reading a page of a book aloud. The listener raises a finger every time the reader pauses at a full stop.',
    soundLab: ['s-ending', 'ed'],
    writePrompt: 'Write a short notice for your school assembly with at least four sentences. Mark a / where you will pause.',
  },
  {
    number: 5,
    oneLine: 'Stress the important words so your listeners know what matters most.',
    idea: [
      'If every word sounds the same, the listener has to guess which ones are important. Emphasis is how you tell them.',
      'You can emphasise a word by saying it a little louder, a little slower, or a little softer than the words around it. One well-chosen word per sentence is usually enough.',
    ],
    model: {
      text: 'I never said she broke the window.',
      noticing: ['Stress "I" and someone else said it.', 'Stress "window" and she broke something else!'],
    },
    drills: [
      d(5, 'a', { title: 'One sentence, many meanings', brief: 'Say "I never said she broke the window" four times, stressing a different word each time. Notice how the meaning changes.', passage: 'I never said she broke the window.', targetSeconds: 25 }),
      d(5, 'b', { title: 'The winning goal', brief: 'Read this match report and stress the most exciting words. Make the listener feel the excitement.', passage: 'With one minute left, the score was still zero. Arjun ran down the left wing, passed to Meera, and she kicked it hard. The ball flew past the goalkeeper. Goal! We had won the cup!', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(5, 'c', { title: 'Quiet can be powerful', brief: 'Tell a short spooky story. Say the scariest sentence quietly and slowly instead of loudly. Notice how everyone listens.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Shouting every "important" word — emphasis only works when most words are normal.', 'Stress on small words like "the" and "and".'],
    selfCheck: ['Which word did I stress in each sentence?', 'Did I try making a word softer, not just louder?'],
    realWorld: 'Reading your lines in the school play so the audience understands the story.',
    homeTip: 'Say "Who ate my chocolate?" stressing a different word each time. Your child explains what each version means.',
    soundLab: ['stress'],
    writePrompt: 'Write a match report or an exciting moment from your life in four sentences. Underline the one word in each sentence you will stress.',
  },
  {
    number: 6,
    oneLine: 'Listening to your own recording shows you exactly what to fix next.',
    idea: [
      'Everyone thinks their recorded voice sounds strange. That is completely normal — you hear your voice through your own head, and everyone else hears it through the air.',
      'Listen back for one thing at a time: first "um", then speed, then pauses. Pick one thing to improve for the next recording. That is how good speakers get better quickly.',
    ],
    drills: [
      d(6, 'a', { title: 'My first recording, again', brief: 'Record your new-class introduction from lesson one again. Then listen back and count your "um"s.', targetSeconds: 30 }),
      d(6, 'b', { title: 'Beat your own score', brief: 'Talk about your favourite book or film for forty-five seconds. Every time you feel an "um" coming, close your mouth and pause instead.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(6, 'c', { title: 'Be your own coach', brief: 'Record a thirty-second talk about your weekend, listen back, and then say out loud one thing you did well and one thing to change.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Children who only say "it was bad" — ask for one specific thing they heard.', 'Recordings deleted before listening; the listening is the lesson.'],
    selfCheck: ['How many "um"s did I count?', 'What is the ONE thing I will change next time?'],
    realWorld: 'Sending a clear voice message to your grandparents or a friend.',
    homeTip: 'Record your child telling a joke on your phone. Listen together, count the "um"s, then try to beat the score.',
    soundLab: ['q', 'silent'],
    writePrompt: 'After listening to your recording, write down two things you did well and one thing you will change next time.',
  },
];

export const PRIMARY_WORLD_2: BandLesson[] = [
  {
    number: 7,
    oneLine: 'Nervous and excited feel the same in your body — choose to call it excitement.',
    idea: [
      'Before you present, your heart beats faster, your hands feel sweaty and your tummy flips. That is adrenaline, your body getting ready to do something important. Athletes feel it before a race too.',
      'Scientists found that people who say "I am excited" instead of "I am nervous" actually perform better. Your body feels the same — the words you tell yourself change what happens next.',
    ],
    drills: [
      d(7, 'a', { title: 'What nerves feel like', brief: 'Describe what your body does before you speak in front of the class: your heart, your hands, your voice, your tummy. Be honest!', targetSeconds: 30 }),
      d(7, 'b', { title: 'Excited, not scared', brief: 'Say "I am excited!" three times with energy. Then give a forty-five-second talk about something you are looking forward to this year.', targetSeconds: 50 }),
    ],
    extraDrills: [
      d(7, 'c', { title: 'Heartbeat talk', brief: 'Do twenty star jumps, then straight away talk for thirty seconds about your favourite hobby while your heart is still racing.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Children who say they never feel nervous — normalise it by sharing your own nerves.', 'Anyone who freezes: let them say just "I am excited" today.'],
    selfCheck: ['What did my body do before I spoke?', 'Did saying "I am excited" change how I felt?'],
    realWorld: 'The minutes before a school performance, a sports final or a class test.',
    homeTip: 'Before something that feels scary — a match, a test, a show — say "I am excited!" together three times like a team chant.',
    writePrompt: 'Write about a time you felt nervous. What did your body do, and what happened in the end?',
  },
  {
    number: 8,
    oneLine: 'Being prepared shrinks the fear — know your first line, your three points and your last line.',
    idea: [
      'Most fear before presenting comes from not knowing what you will say next. When you have a plan, there is much less to be scared of.',
      'You do not need to learn every word. Learn your first sentence, your three main points, and your last sentence. That is your talk skeleton, and it holds everything else up.',
    ],
    drills: [
      d(8, 'a', { title: 'The skeleton', brief: 'Choose a topic like "why we need more trees". Say only your first sentence, your three points in a few words each, and your last sentence.', targetSeconds: 30 }),
      d(8, 'b', { title: 'Put the muscles on', brief: 'Now give the full talk on the same topic, using your skeleton, adding one example to each point.', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(8, 'c', { title: 'Skeleton speed round', brief: 'Pick any topic from your school subjects and make a skeleton on the spot: first line, three points, last line.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Scripts written word for word — ask for the skeleton only.', 'Three points that are really the same point said three ways.'],
    selfCheck: ['Can I say my skeleton from memory?', 'Did my full talk follow it, or wander off?'],
    realWorld: 'Getting ready to present a group project to the class.',
    homeTip: 'Draw a skeleton on paper: head for the first line, three ribs for the points, feet for the last line. Your child fills it in and presents.',
    writePrompt: 'Write the skeleton for a talk about your favourite animal: first line, three points and last line.',
  },
  {
    number: 9,
    oneLine: 'Three quick tricks calm your body in the minute before you speak.',
    idea: [
      'Trick one is box breathing: breathe in for four, hold for four, out for four, hold for four. It slows your heartbeat. Trick two is standing tall with your feet planted, like a tree with roots.',
      'Trick three is knowing your first sentence perfectly, so the start happens even if your mind feels busy. Once you are going, the nerves usually fade.',
    ],
    drills: [
      d(9, 'a', { title: 'Box breathing, then begin', brief: 'Do two rounds of box breathing: in for four, hold for four, out for four, hold for four. Then say your first sentence about your favourite subject and keep going.', targetSeconds: 45 }),
      d(9, 'b', { title: 'Tree roots', brief: 'Stand with your feet planted and shoulders relaxed for ten seconds. Then give a one-minute talk about a place you love, without shifting your feet.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(9, 'c', { title: 'Perfect first line', brief: 'Practise one first sentence five times until it is perfect, then use it to start a forty-second talk about your best friend.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Rushed breathing counts — count aloud with the class the first time.', 'Swaying and rocking once the talk starts.'],
    selfCheck: ['Did box breathing slow me down?', 'Did my feet stay still?'],
    realWorld: 'Walking up to the front when your name is called for a class presentation.',
    homeTip: 'Practise box breathing together before homework or bedtime: trace a square in the air while you breathe.',
    writePrompt: 'Write your perfect first sentence for your next class presentation, and the three tricks you will use before you start.',
  },
  {
    number: 10,
    oneLine: 'If you make a mistake, fix it and keep going — the audience forgets in seconds.',
    idea: [
      'Every speaker trips over words: newsreaders, teachers, even famous actors. The audience only remembers a mistake if you make a big fuss about it.',
      'If you mix up a word, say it again correctly and carry on. No "sorry, sorry, I messed up". A tiny smile is fine. Keeping going is what the audience remembers.',
    ],
    drills: [
      d(10, 'a', { title: 'Tongue twister race', brief: 'Read this aloud as clearly as you can. If you trip, say the word again and keep going — do not stop or start over.', passage: 'Six slippery snails slid slowly seaward. Fresh fried fish, fish fresh fried, fried fish fresh. Red lorry, yellow lorry, red lorry, yellow lorry.', targetSeconds: 20 }),
      d(10, 'b', { title: 'The deliberate mistake', brief: 'Talk about your school for forty-five seconds. Make one mistake on purpose, fix it calmly, and carry on as if nothing happened.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(10, 'c', { title: 'Science words challenge', brief: 'Read these tricky science words in sentences without stopping, even if you stumble.', passage: 'Photosynthesis is how plants make food. Evaporation turns water into vapour. Condensation turns vapour back into droplets. Precipitation is rain, snow or hail.', targetSeconds: 25 }),
    ],
    mentorWatchFor: ['Children who restart the whole passage after a stumble.', 'Apologies to the audience — cheer the child who just fixes it and moves on.'],
    selfCheck: ['When I tripped, did I stop or carry on?', 'Did I apologise? (I do not need to!)'],
    realWorld: 'Mixing up a line when you read aloud in class.',
    homeTip: 'Play tongue twisters at dinner. The rule: whoever trips just keeps going. Laugh together at the end, not in the middle.',
    writePrompt: 'Write your own tongue twister of at least two sentences, then practise reading it without stopping.',
  },
  {
    number: 11,
    oneLine: 'If your mind goes blank, pause, breathe and repeat your last point — it will come back.',
    idea: [
      'Sometimes, in the middle of a talk, your mind goes completely empty. It feels like forever, but to the audience it is just a short pause. They cannot see inside your head.',
      'Pause. Breathe. Say "So, as I was saying…" and repeat your last point. Or look at your notes for your next key word. The next idea almost always comes back.',
    ],
    drills: [
      d(11, 'a', { title: 'The rescue sentence', brief: 'Talk about a trip you have been on. Halfway through, stop, breathe, say "So, as I was saying…", repeat your last point, and carry on.', targetSeconds: 60 }),
      d(11, 'b', { title: 'Key words only', brief: 'Write three key words about a festival you celebrate. Give a one-minute talk using only those three words as your notes.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(11, 'c', { title: 'Freeze and continue', brief: 'Tell a story about your pet or a pet you would like. When you feel stuck, pause for two seconds and ask the audience a question to buy time.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Children who panic-fill a blank with "um um um" — rehearse the silent breath.', 'Key-word notes that turn into full sentences.'],
    selfCheck: ['Did I use the rescue sentence?', 'Could I give the talk with only three key words?'],
    realWorld: 'Forgetting the next part of your speech in a class presentation or school play.',
    homeTip: 'While your child tells a story, call "Freeze!". They pause, breathe, say "So, as I was saying…" and carry on.',
    writePrompt: 'Write three key words for a talk about a festival, and one rescue sentence you will use if you forget what comes next.',
  },
  {
    number: 12,
    oneLine: 'Confidence is a muscle — every time you speak up, it gets stronger.',
    idea: [
      'You do not need to feel confident before you speak. Confidence is what you feel AFTER you have spoken a few times and found out that it went fine.',
      'Today you will speak for longer than ever. Then listen to your first recording from lesson one. The difference is the proof that practice works.',
    ],
    drills: [
      d(12, 'a', { title: 'Ninety seconds, no stopping', brief: 'Talk for ninety seconds about the best day of your life. Keep going the whole time — pause if you need to, but do not stop.', targetSeconds: 90 }),
      d(12, 'b', { title: 'Before and after', brief: 'Record your new-class introduction one more time. Then compare it with your very first recording and say what has changed.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(12, 'c', { title: 'Speak up in real life', brief: 'Tell us about one time this week you spoke up — answered a question, asked for help, ordered food. How did it feel?', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Children who stop at sixty seconds — the goal is to keep going through the discomfort.', 'Celebrate the before-and-after difference out loud.'],
    selfCheck: ['What has changed since my first recording?', 'Where did I speak up in real life this week?'],
    realWorld: 'Putting your hand up to answer a question in class without worrying.',
    homeTip: 'Start a "brave list" on the fridge. Add a line each time your child speaks up: answering the phone, asking a shopkeeper, reading in class.',
    writePrompt: 'Write your own "brave list": three times you spoke up this month, and one brave thing you want to try next.',
  },
];
