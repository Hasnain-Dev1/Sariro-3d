import { bd, type BandLesson } from '../types';

/** Grades 4–6 · Worlds 5 and 6 — persuading, and telling stories people remember. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('primary', n, part, x);

export const PRIMARY_WORLD_5: BandLesson[] = [
  {
    number: 25,
    oneLine: 'To persuade someone, first know exactly what you want them to do.',
    idea: [
      'Persuading is different from informing. Informing tells people facts. Persuading asks them to DO something: vote for you, try a new food, join your club, recycle more.',
      'Before you plan a persuasive talk, finish this sentence: "I want my audience to…". If you cannot finish it, your talk will be interesting but will not change anything.',
    ],
    model: {
      text: 'I want every student in this school to bring one old book on Friday, so we can start a free library corner.',
      noticing: ['It names one clear action.', 'It says who, what and when.'],
    },
    drills: [
      d(25, 'a', { title: 'The ask', brief: 'Choose something you want your class to do, and say it in one clear sentence: who should do what, and when.', targetSeconds: 20 }),
      d(25, 'b', { title: 'Persuade the class', brief: 'Give a one-minute talk to persuade your class to do your action. End by asking them to do it clearly.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(25, 'c', { title: 'Persuade a parent', brief: 'Persuade your parents to let you do one thing this weekend. Say clearly what you want them to agree to.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Talks that list facts but never ask for anything.', 'Asks that are vague, like "be nicer" — push for a specific action.'],
    selfCheck: ['What exactly did I ask the audience to do?', 'Did I say it clearly at the end?'],
    realWorld: 'Asking your school to start a new club or change a rule.',
    homeTip: 'Let your child persuade you about something small — a meal, an outing — but only if they can say exactly what they want first.',
    writePrompt: 'Finish the sentence "I want my class to…" and write three reasons they should do it.',
  },
  {
    number: 26,
    oneLine: 'People are persuaded by three things: trusting you, caring about it, and good reasons.',
    idea: [
      'Why should they trust you? Tell them what you know or have done. Why should they care? Help them feel something, with a story or a picture in words. Do your reasons make sense? Give facts and examples.',
      'Most people only use one of the three. Great persuaders use all three: trust, feelings and reasons.',
    ],
    model: {
      text: 'I have fed the stray dogs near our school every morning for a year. Last winter, one of them nearly froze. If each class gave one old blanket, we could keep all six dogs warm.',
      noticing: ['Trust: "I have fed them for a year."', 'Feeling: "one nearly froze."', 'Reason: "six dogs, one blanket each."'],
    },
    drills: [
      d(26, 'a', { title: 'Trust, feeling, reason', brief: 'Pick a cause, like planting trees. Say one sentence for trust, one sentence for feeling and one sentence for a reason.', targetSeconds: 30 }),
      d(26, 'b', { title: 'All three together', brief: 'Give a ninety-second persuasive talk on your cause that uses trust, feeling and reasons. Try to make each one strong.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(26, 'c', { title: 'Spot the missing one', brief: 'Give a short talk using only facts. Then add a feeling sentence and a trust sentence. Say which version would persuade your friends.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Feelings that become exaggerated drama.', 'Trust sentences that are boasting rather than relevant experience.'],
    selfCheck: ['Which of the three did I use best?', 'Which one was weakest?'],
    realWorld: 'Convincing your class to vote for your idea for the school trip.',
    homeTip: 'Watch an advert together and ask: how does it make you trust it, feel something, or give reasons?',
    writePrompt: 'Write a persuasive paragraph for a cause you care about, with one trust sentence, one feeling sentence and one reason.',
  },
  {
    number: 27,
    oneLine: 'One clear fact with a comparison persuades better than lots of numbers.',
    idea: [
      'If you say lots of numbers quickly, listeners forget all of them. One number they can picture is much more powerful.',
      'Make numbers easy to imagine by comparing them: instead of "a blue whale is thirty metres long", say "a blue whale is as long as three school buses in a row".',
    ],
    model: {
      text: 'Every day, our school throws away enough plastic bottles to fill this whole classroom up to our knees.',
      noticing: ['You can picture it straight away.', 'It uses a place everyone knows.'],
    },
    drills: [
      d(27, 'a', { title: 'Make it picture-able', brief: 'Say this fact two ways: "An elephant weighs about six thousand kilograms." First the plain way, then compared with something everyone can picture.', targetSeconds: 25 }),
      d(27, 'b', { title: 'One fact, one talk', brief: 'Give a one-minute talk persuading people to save water, built around one fact you make easy to picture.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(27, 'c', { title: 'Too many numbers', brief: 'Say a talk with five numbers in a row, then say it again with only your best one and a comparison. Which one would your friends remember?', targetSeconds: 50 }),
    ],
    mentorWatchFor: ['Invented facts — encourage checking sources.', 'Comparisons that are harder to imagine than the number.'],
    selfCheck: ['What comparison did I use?', 'Could my friend repeat my fact tomorrow?'],
    realWorld: 'Presenting results from your science project or class survey.',
    homeTip: 'Pick a fact from the news or a book and turn it into a comparison together, like "as tall as ten giraffes".',
    writePrompt: 'Write one fact about a topic you care about, and turn it into a comparison that anyone in your class could picture.',
  },
  {
    number: 28,
    oneLine: 'Answer the "but…" before anyone says it — it makes you more convincing.',
    idea: [
      'When you try to persuade people, they are already thinking "but what about…?". If you ignore it, they stop listening.',
      'Say it yourself: "Some of you might think this will cost too much. Actually…". Showing you have thought about the other side makes people trust you more.',
    ],
    model: {
      text: 'Some of you might think a longer break means less learning. But studies show children concentrate better after they have played outside.',
      noticing: ['It names the objection kindly.', 'Then it answers it with a reason.'],
    },
    drills: [
      d(28, 'a', { title: 'What would they say?', brief: 'Choose an idea, like "no homework on Fridays". Say the strongest reason someone might disagree, then answer it.', targetSeconds: 45 }),
      d(28, 'b', { title: 'Persuade with the "but"', brief: 'Give a ninety-second persuasive talk that includes "Some people might say… but…" in the middle.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(28, 'c', { title: 'Both sides', brief: 'Give one reason FOR school uniforms and one reason AGAINST. Then say which side you choose and why.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Weak "straw" objections nobody really holds.', 'Children who get defensive — model a calm "that is a fair point".'],
    selfCheck: ['What was the strongest "but" against my idea?', 'Did my answer really answer it?'],
    realWorld: 'Asking your parents for something when you know what they will say.',
    homeTip: 'When your child asks for something, ask them to say your "but" first and then answer it.',
    writePrompt: 'Write your idea, the strongest reason someone might disagree, and your answer to that reason.',
  },
  {
    number: 29,
    oneLine: 'Speakers use word tricks like the rule of three and repetition to make lines memorable.',
    idea: [
      'The rule of three: "Be kind, be brave, be curious." Repetition: "We will learn. We will grow. We will win." Opposites: "It is not about winning; it is about trying."',
      'These tricks have been used for thousands of years because they work. Use one or two in a talk — too many sounds like a cartoon.',
    ],
    model: {
      text: 'We do not need to be the biggest class. We need to be the kindest class, the bravest class, and the class that never gives up.',
      noticing: ['An opposite: not biggest, but kindest.', 'The rule of three and repetition of "the … class".'],
    },
    drills: [
      d(29, 'a', { title: 'Rule of three', brief: 'Make up three rule-of-three lines about your school, your family and your favourite sport. Say them with energy.', targetSeconds: 30 }),
      d(29, 'b', { title: 'Team talk', brief: 'Give a forty-five-second pep talk to your sports team before a big match, using repetition and a rule of three.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(29, 'c', { title: 'Famous lines', brief: 'Read these lines aloud with feeling, then say which trick each one uses.', passage: 'Believe you can and you are halfway there. Ask not what your country can do for you, ask what you can do for your country. Veni, vidi, vici: I came, I saw, I conquered.', targetSeconds: 25 }),
    ],
    mentorWatchFor: ['Tricks stacked in every sentence.', 'Rule-of-three lists where the three items are not really related.'],
    selfCheck: ['Which trick did I use?', 'Did it make my line easier to remember?'],
    realWorld: 'Writing a slogan for your class captain campaign or a school event.',
    homeTip: 'Make a family motto together using the rule of three, like "Laugh loud, try hard, help others".',
    writePrompt: 'Write a pep talk for your team in four sentences that uses the rule of three and repetition.',
  },
  {
    number: 30,
    oneLine: 'Persuasion is powerful, so use it honestly and for good.',
    idea: [
      'The tricks you have learned work even when someone is not telling the truth. That is why adverts and some online videos can trick people.',
      'Good persuaders use true facts, explain their thinking and respect people who disagree. Ask yourself: "Would I be happy if people knew exactly how I persuaded them?"',
    ],
    drills: [
      d(30, 'a', { title: 'Something I truly believe', brief: 'Give a ninety-second persuasive talk about something you really believe, using only facts you know are true.', targetSeconds: 90 }),
      d(30, 'b', { title: 'Spot the trick', brief: 'Think of an advert for a toy, snack or game. Explain which persuasion trick it uses and whether it is being fully honest.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(30, 'c', { title: 'Show your thinking', brief: 'Persuade us about something, but explain HOW you decided what you believe — what made you change your mind or be sure.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Children who "win" by exaggerating — praise the honest version.', 'Adverts discussion turning into brand fandom.'],
    selfCheck: ['Were all my facts true?', 'Would I be happy if people knew how I persuaded them?'],
    realWorld: 'Deciding whether an online video or advert is telling you the whole truth.',
    homeTip: 'Pause an advert together and ask your child: "What do they want you to do, and are they telling you everything?"',
    writePrompt: 'Write about an advert or video that tried to persuade you. What trick did it use, and was it honest?',
  },
];

export const PRIMARY_WORLD_6: BandLesson[] = [
  {
    number: 31,
    oneLine: 'People forget facts but remember stories — so turn your facts into a story.',
    idea: [
      'If you say "Plants need sunlight", people nod and forget. If you say "My sunflower grew towards the window every single day, like it was chasing the sun", people remember.',
      'A story makes listeners ask "What happens next?" — and that question keeps them listening.',
    ],
    drills: [
      d(31, 'a', { title: 'Fact, then story', brief: 'Say this fact plainly: "Recycling saves trees." Then turn it into a tiny story about a person, an animal or an object.', targetSeconds: 45 }),
      d(31, 'b', { title: 'Science as a story', brief: 'Explain something from science class, like how a seed grows, as a story from the seed\'s point of view.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(31, 'c', { title: 'History hero', brief: 'Tell us about a famous person from history as a story, starting with a moment that changed their life.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Stories that forget the fact they were meant to teach.', 'Lists of events without a character.'],
    selfCheck: ['Who was the character in my story?', 'Did my story still teach the fact?'],
    realWorld: 'Making your history or science presentation interesting for the class.',
    homeTip: 'Ask your child to retell something they learned at school today as a story with a hero.',
    writePrompt: 'Write a fact from a school subject, then turn it into a short story of four or five sentences.',
  },
  {
    number: 32,
    oneLine: 'The best stories are about a moment when something changed.',
    idea: [
      'You do not need a big adventure to tell a great story. You need a moment when something changed: you learned something, you felt different, or something surprising happened.',
      'Think of: the day you learned to ride a bike, the time you were brave, the moment you realised you were wrong. That change is your story.',
    ],
    drills: [
      d(32, 'a', { title: 'The moment it changed', brief: 'Tell the story of a moment when you learned to do something new. What changed for you?', targetSeconds: 60 }),
      d(32, 'b', { title: 'Boring day, secret story', brief: 'Think of an ordinary school day. Find one small moment that changed something — a joke, a kind act, a surprise — and tell it as a story.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(32, 'c', { title: 'Before and after me', brief: 'Tell us about something you used to be scared of, and the moment you stopped being scared.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['"And then… and then…" stories with no turning point.', 'Children who think their life is too ordinary — help them find a small change.'],
    selfCheck: ['What changed in my story?', 'Did I make the change the most important part?'],
    realWorld: 'Writing and telling a personal story for an English lesson or school magazine.',
    homeTip: 'At bedtime, ask: "What was one moment today when something changed?" and listen to the story.',
    writePrompt: 'Write about a moment something changed for you: what it was like before, the moment itself, and what it was like after.',
  },
  {
    number: 33,
    oneLine: 'A great story has a beginning, a problem or surprise, and an ending.',
    idea: [
      'Beginning: who is it about and where are they? Middle: the problem, the surprise or the turn — this is the exciting part. Ending: how it worked out and what was learned.',
      'Many people spend too long on the beginning. Get to the problem quickly, because that is where the story really starts.',
    ],
    model: {
      text: 'It was sports day and I was sure I would win the race. Halfway round, my shoe flew off. I kept running with one shoe and came fourth — but everyone cheered the loudest for me.',
      noticing: ['A short beginning.', 'The surprise: the shoe flies off.', 'An ending with a feeling.'],
    },
    drills: [
      d(33, 'a', { title: 'Three-sentence story', brief: 'Tell a story in only three sentences: beginning, surprise and ending. Choose something that really happened to you.', targetSeconds: 25 }),
      d(33, 'b', { title: 'The full story', brief: 'Tell the same story again in about a minute and a half, adding more detail — especially to the surprise in the middle.', targetSeconds: 80 }),
    ],
    extraDrills: [
      d(33, 'c', { title: 'Finish the story', brief: 'Start with this beginning: "The school bus stopped in the middle of the forest." Add a surprise and an ending.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Beginnings that take half the time.', 'Endings that just stop without a feeling or lesson.'],
    selfCheck: ['How quickly did I get to the surprise?', 'What was my ending?'],
    realWorld: 'Telling a story in an English speaking assessment or a storytelling competition.',
    homeTip: 'Take turns telling "three-sentence stories" at dinner: beginning, surprise, ending.',
    writePrompt: 'Plan a story in three boxes: beginning, surprise and ending, with one or two sentences in each.',
  },
  {
    number: 34,
    oneLine: 'One great detail makes a story come alive — too many details make it boring.',
    idea: [
      '"We went to a park" is flat. "We went to a park where the swings creaked like an old door" puts the listener there. One good detail does that.',
      'But if you describe the colour of every leaf and every person\'s shoes, listeners get bored. Choose one detail for each part of your story that you can see, hear, smell or feel.',
    ],
    drills: [
      d(34, 'a', { title: 'One detail each', brief: 'Tell a story about a birthday party with exactly one strong detail for the beginning, the middle and the end.', targetSeconds: 60 }),
      d(34, 'b', { title: 'Detail overload', brief: 'Tell a short story about walking to school with far too many details on purpose. Then tell it again with just your best three.', targetSeconds: 80 }),
    ],
    extraDrills: [
      d(34, 'c', { title: 'Five senses', brief: 'Describe your favourite place using one detail for each sense: sight, sound, smell, taste and touch.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Details that are only about colour — encourage sound, smell and feel.', 'Detail-heavy beginnings that delay the story.'],
    selfCheck: ['Which detail was my best one?', 'Did any detail slow my story down?'],
    realWorld: 'Describing a place or event vividly in a creative writing or speaking task.',
    homeTip: 'On a walk, play "one great detail": each person picks the single most interesting thing they can see, hear or smell.',
    writePrompt: 'Write a description of a place you love using one detail for each of the five senses.',
  },
  {
    number: 35,
    oneLine: 'The safest joke is a funny story about yourself — never about someone else.',
    idea: [
      'Humour makes people like you and keeps them listening. But a joke about another person can hurt feelings, even if you did not mean it to.',
      'The best jokes are about funny things that happened to YOU. After the funny line, pause and let people laugh before you carry on.',
    ],
    drills: [
      d(35, 'a', { title: 'My funny moment', brief: 'Tell a funny story about a time something silly happened to you. Keep it kind and about yourself.', targetSeconds: 60 }),
      d(35, 'b', { title: 'Line, then pause', brief: 'Tell a short, clean joke or funny line. After the punchline, wait two seconds before saying anything else.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(35, 'c', { title: 'Funny start', brief: 'Start a talk about your family with a funny, kind line about yourself, then carry on with the talk.', targetSeconds: 50 }),
    ],
    mentorWatchFor: ['Jokes about classmates, teachers or appearance — redirect gently.', 'Children who laugh through their own punchline.'],
    selfCheck: ['Was my joke about me, and kind?', 'Did I pause after the funny line?'],
    realWorld: 'Making your class laugh during a presentation without upsetting anyone.',
    homeTip: 'Share a funny thing that happened to you when you were their age, and ask your child to share one back.',
    writePrompt: 'Write a funny story about yourself in a few sentences and mark where you will pause for the laugh.',
  },
  {
    number: 36,
    oneLine: 'Telling a story about yourself helps people get to know you.',
    idea: [
      'When you share a story from your life — a challenge, a mistake, a proud moment — your audience connects with you. They see a real person, not just a speaker.',
      'Choose a story you feel comfortable sharing. It is fine to tell a story about something that went wrong, as long as you can talk about what you learned.',
    ],
    drills: [
      d(36, 'a', { title: 'When things went wrong', brief: 'Tell the story of a time something went wrong for you — a lost game, a failed test, a mistake — and what you learned from it.', targetSeconds: 80 }),
      d(36, 'b', { title: 'My proudest moment', brief: 'Tell the story of your proudest moment so far. Include the beginning, the hardest part and the ending.', targetSeconds: 80 }),
    ],
    extraDrills: [
      d(36, 'c', { title: 'Who I am in one story', brief: 'Tell one short story that shows something important about who you are, like being kind, curious or determined.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Stories that are too personal or upsetting — offer an easier choice privately.', 'Endings that skip what was learned.'],
    selfCheck: ['What did my story show about me?', 'What did I learn?'],
    realWorld: 'Sharing about yourself in a class circle time or a school newspaper interview.',
    homeTip: 'Ask your child to interview you about a time you failed at something, then swap roles.',
    writePrompt: 'Write about a time something went wrong for you and what you learned from it.',
  },
];
