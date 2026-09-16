import { bd, type BandLesson } from '../types';

/** Grades 4–6 · Worlds 3 and 4 — building a talk, and standing up to give it. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('primary', n, part, x);

export const PRIMARY_WORLD_3: BandLesson[] = [
  {
    number: 13,
    oneLine: 'A good talk is about one big idea you can say in a single sentence.',
    idea: [
      'Ask your classmates what a presentation was about a week later, and they will remember one sentence at most. So decide what that sentence should be before you start.',
      'Try it: "My talk is about why every school should have a vegetable garden." If your sentence has "and" in it — "about gardens and pets and recycling" — you have three talks squashed into one. Pick the best.',
    ],
    model: {
      text: 'My talk is about why dogs make better class pets than fish.',
      noticing: ['One clear idea you could agree or disagree with.', 'Compare: "My talk is about animals" — that is a topic, not an idea.'],
    },
    drills: [
      d(13, 'a', { title: 'My big idea in one sentence', brief: 'Choose a topic you care about and say what your talk would be about in ONE sentence, with no "and" in it. Try three times until it is sharp.', targetSeconds: 15 }),
      d(13, 'b', { title: 'Say it and stick to it', brief: 'Say your one-sentence big idea, then talk for one minute giving reasons for it. If you drift onto something else, come back.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(13, 'c', { title: 'Topic into big idea', brief: 'Take the topic "school holidays" and turn it into three different one-sentence big ideas, like "Summer holidays should be shorter".', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Topics dressed up as ideas ("My talk is about tigers") — ask "what about tigers?"', 'Big ideas nobody could disagree with; nudge towards something with a point.'],
    selfCheck: ['Can I say my big idea from memory?', 'Does my sentence have an "and" in it?'],
    realWorld: 'Choosing what your class presentation or book review is really about.',
    homeTip: 'After watching a film together, ask your child to say what it was about in one sentence. Then you try — and compare.',
    writePrompt: 'Write the one-sentence big idea for a talk you would like to give, and two reasons that support it.',
  },
  {
    number: 14,
    oneLine: 'Plan your opening word for word — it is where you need confidence most.',
    idea: [
      'Four openings grab attention: a question, a surprising fact, a tiny story, or a bold statement. Two openings lose attention: "Um, so, my name is…" and "Sorry, I am not very good at this."',
      'Because nerves are strongest at the very beginning, learn your first two sentences by heart. The rest can be in your own words.',
    ],
    model: {
      text: 'Last summer, a tiny frog saved my holiday. It was sitting in my shoe when I tried to put it on, and it taught me something I will never forget.',
      noticing: ['A tiny story that makes you want to know more.', 'No apology, no "my name is".'],
    },
    drills: [
      d(14, 'a', { title: 'Four openings, one topic', brief: 'Pick one topic, like your favourite season. Say four different openings for it: a question, a fact, a tiny story and a bold statement.', targetSeconds: 50 }),
      d(14, 'b', { title: 'Learn it by heart', brief: 'Choose your best opening, practise it until you know it by heart, then use it to start a forty-second talk.', targetSeconds: 40 }),
    ],
    extraDrills: [
      d(14, 'c', { title: 'Fix the boring start', brief: 'Say this boring opening: "Hello, my project is about the moon." Then fix it three different ways.', targetSeconds: 35 }),
    ],
    mentorWatchFor: ['Openings that apologise or explain nerves.', 'Children who read their opening — this is the part to know by heart.'],
    selfCheck: ['Which type of opening did I choose?', 'Could I say my first two sentences without looking?'],
    realWorld: 'Starting your book report, show and tell, or class captain speech.',
    homeTip: 'Pick an everyday topic like "breakfast". Take turns inventing the most exciting opening sentence you can.',
    writePrompt: 'Write four openings for one topic — question, fact, tiny story and bold statement — and circle the one you will use.',
  },
  {
    number: 15,
    oneLine: 'Three main points is the perfect number — people can remember three.',
    idea: [
      'Listeners can hold about three things in their heads. Two feels unfinished, and five is too many to remember. So the middle of your talk should have three main points.',
      'Give each point one example or reason. Then think about order: many speakers save their strongest point for last, so the talk builds up.',
    ],
    model: {
      text: 'Reading every day is great for three reasons. First, it grows your vocabulary. Second, it takes you to places you cannot visit. And most importantly, it helps you understand how other people feel.',
      noticing: ['Three points, clearly counted.', 'The strongest point is saved for last and labelled "most importantly".'],
    },
    drills: [
      d(15, 'a', { title: 'Three reasons', brief: 'Give a talk on "Why everyone should learn to swim" with three clear points and one example for each.', targetSeconds: 75 }),
      d(15, 'b', { title: 'Strongest point last', brief: 'Give the same talk again, but reorder your points so the strongest one comes last. Which order sounds better?', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(15, 'c', { title: 'Three on the spot', brief: 'Your teacher shouts a topic — "homework", "pets" or "rainy days". Give three quick points about it immediately.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Points that repeat each other in different words.', 'Examples that are longer than the point itself.'],
    selfCheck: ['Did I have exactly three points?', 'Which of my points was strongest, and where did I put it?'],
    realWorld: 'Explaining to your parents three reasons why you should get a pet.',
    homeTip: 'Ask your child for three reasons for something they want — a later bedtime, a trip, a new game. Help them put the best reason last.',
    writePrompt: 'Write three reasons why everyone should learn to swim, with one example each. Number them in the order you will say them.',
  },
  {
    number: 16,
    oneLine: 'Signpost words help your audience follow your talk like road signs.',
    idea: [
      'When you read, you can see paragraphs and headings. When people listen, they cannot. Signpost words show them where you are in your talk.',
      'Use words like "First", "Next", "Another reason", "On the other hand" and "Finally". They sound simple, but they make you easy to follow and sound very organised.',
    ],
    model: {
      text: 'First, let me tell you how the pyramids were built. Next, I will show you who built them. Finally, you will find out why they are still standing today.',
      noticing: ['"First", "Next" and "Finally" act like road signs.', 'The listener knows the plan from the start.'],
    },
    drills: [
      d(16, 'a', { title: 'Road signs on', brief: 'Give a talk about how to make your favourite snack, using at least four signpost words like First, Next, After that and Finally.', targetSeconds: 60 }),
      d(16, 'b', { title: 'Road signs off', brief: 'Now give the same talk again WITHOUT any signpost words. Notice how much harder it is to follow — then say which version was clearer.', targetSeconds: 70 }),
    ],
    extraDrills: [
      d(16, 'c', { title: 'Signposted project', brief: 'Present a school project you have done with a signposted plan at the start: "First I will…, then…, and finally…".', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Signposts announced but then not followed.', 'Overuse of "and then" instead of real signposts.'],
    selfCheck: ['How many signpost words did I use?', 'Did my plan at the start match what I actually said?'],
    realWorld: 'Explaining how to do a science experiment step by step.',
    homeTip: 'Ask your child to explain how to brush teeth or make a sandwich using First, Next, Then and Finally.',
    writePrompt: 'Write step-by-step instructions for something you can do well, using at least four signpost words.',
  },
  {
    number: 17,
    oneLine: 'Your last sentence is the one people remember — make it strong.',
    idea: [
      'Many talks end with "So, yeah, that is it." That throws away the most memorable moment of the whole talk.',
      'End with a strong last line instead: repeat your big idea in new words, finish the story you started, or ask the audience to do something. Then stop, and smile.',
    ],
    model: {
      text: 'So next time you see a spider, do not scream. Say thank you. It has probably eaten a hundred flies this week.',
      noticing: ['It asks the audience to do something.', 'It ends with a fun fact — then stops.'],
    },
    drills: [
      d(17, 'a', { title: 'Close the loop', brief: 'Start a short talk with a question, and end it by answering that same question in your last sentence.', targetSeconds: 45 }),
      d(17, 'b', { title: 'The mic-drop line', brief: 'Give a talk about something you think everyone should try. End with a strong line that asks the audience to do it — then stop talking.', targetSeconds: 50 }),
    ],
    extraDrills: [
      d(17, 'c', { title: 'Fix "so yeah"', brief: 'Say a short talk that ends with "So, yeah, that is it." Then do it again with three different strong endings.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['"Thank you, any questions?" as the ending — the strong line comes first.', 'Speakers who keep talking after their best ending.'],
    selfCheck: ['What was my last sentence?', 'Did I stop straight after it?'],
    realWorld: 'Ending your class captain speech so people remember why to vote for you.',
    homeTip: 'After your child tells you about their day, ask: "What is your mic-drop line?" — one sentence that sums it up.',
    writePrompt: 'Write three possible endings for a talk about something everyone should try, and choose the strongest one.',
  },
  {
    number: 18,
    oneLine: 'Cut anything that does not help your big idea — shorter talks are often better.',
    idea: [
      'When you know a lot about a topic, you want to say all of it. But every extra fact competes with the important ones, and your audience gets lost.',
      'Keep asking: does this help my big idea? If not, cut it — even if it is interesting. A one-minute talk that is clear beats a three-minute talk that wanders.',
    ],
    drills: [
      d(18, 'a', { title: 'Two minutes of everything', brief: 'Talk for ninety seconds about your favourite animal and include every fact you know.', targetSeconds: 90 }),
      d(18, 'b', { title: 'The best forty-five seconds', brief: 'Now give the same talk in forty-five seconds, keeping only the facts that support one big idea.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(18, 'c', { title: 'Trailer version', brief: 'Tell us about your favourite film or book in exactly thirty seconds, like a movie trailer — only the most exciting parts.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['The short version that is just the long one said faster.', 'Children who cut the example and keep the waffle.'],
    selfCheck: ['What did I cut, and why?', 'Was the short version clearer?'],
    realWorld: 'Fitting your presentation into the three minutes your teacher gave you.',
    homeTip: 'Ask your child to tell you about a film in one minute, then in thirty seconds. Which parts stayed?',
    writePrompt: 'Write your talk about your favourite animal in five sentences, then cross out the two that do not help your big idea.',
  },
];

export const PRIMARY_WORLD_4: BandLesson[] = [
  {
    number: 19,
    oneLine: 'Standing tall and still makes you look and feel confident.',
    idea: [
      'When we are nervous we sway, rock from foot to foot, twist our hair or play with our sleeves. The audience watches the moving, not the talking.',
      'Stand with your feet a little apart, weight on both feet, shoulders relaxed and hands loosely by your sides. It feels strange at first — but it looks confident, and soon you start to feel it too.',
    ],
    drills: [
      d(19, 'a', { title: 'Statue talk', brief: 'Stand up with feet apart and hands relaxed. Give a one-minute talk about your favourite place without moving your feet at all.', targetSeconds: 60 }),
      d(19, 'b', { title: 'Wobbly, then steady', brief: 'Give a thirty-second talk while swaying and fidgeting on purpose. Then give it again standing like a statue. Which felt more confident?', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(19, 'c', { title: 'Superhero stance', brief: 'Hold a superhero stance for twenty seconds, then give a forty-second talk about someone you admire, staying steady.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Locked knees and stiff arms — relaxed and still, not frozen.', 'Hands hidden in pockets or behind the back.'],
    selfCheck: ['Did my feet stay still?', 'What did my hands do?'],
    realWorld: 'Standing at the front of the class for your presentation.',
    homeTip: 'Play "statue speech": your child talks for thirty seconds; if their feet move, they start again. Take turns.',
    writePrompt: 'Write a checklist of four things to remember about how to stand before your next presentation.',
  },
  {
    number: 20,
    oneLine: 'Use gestures that show what you mean — not random waving.',
    idea: [
      'A good gesture helps your words: holding up three fingers for three points, showing something huge with wide arms, or pointing to the past behind you.',
      'Random gestures, like waving your hands on every word, distract people. Plan two or three gestures that really help, and keep your hands relaxed the rest of the time.',
    ],
    drills: [
      d(20, 'a', { title: 'Show it with your hands', brief: 'Describe the biggest, smallest and fastest things you have ever seen, using one clear gesture for each.', targetSeconds: 45 }),
      d(20, 'b', { title: 'Counting on fingers', brief: 'Give a talk with three reasons why reading is fun. Hold up one, two and three fingers as you say each reason.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(20, 'c', { title: 'Tell a story with your hands', brief: 'Tell a short story about climbing a mountain, using gestures to show climbing, the height and the view at the top.', targetSeconds: 50 }),
    ],
    mentorWatchFor: ['Constant hand movement on every word.', 'Gestures that happen after the word instead of with it.'],
    selfCheck: ['Which gestures matched my words?', 'Were my hands calm the rest of the time?'],
    realWorld: 'Explaining the size of a dinosaur skeleton you saw at the museum.',
    homeTip: 'Play charades-style: your child describes an object using one gesture and a few words, and you guess what it is.',
    writePrompt: 'Write a short talk of four sentences and draw a small hand symbol next to the words where you will use a gesture.',
  },
  {
    number: 21,
    oneLine: 'Look at one person for a whole sentence, then move to another.',
    idea: [
      'Some speakers stare at the floor, the ceiling or only at the teacher. Others move their eyes around so fast that nobody feels spoken to.',
      'Try this instead: look at one classmate while you say a whole sentence, then move to someone else for the next sentence. Everyone feels included, and you feel less nervous talking to one person at a time.',
    ],
    drills: [
      d(21, 'a', { title: 'One sentence, one person', brief: 'Imagine five classmates in front of you, or put five toys around the room. Give a one-minute talk about your favourite hobby, looking at one for each sentence.', targetSeconds: 60 }),
      d(21, 'b', { title: 'The camera classmate', brief: 'Record a forty-five-second talk about a school trip while looking straight into the camera, as if it is a classmate you are telling.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(21, 'c', { title: 'Floor, then friends', brief: 'Give a thirty-second talk looking only at the floor. Then give it again looking at your imaginary audience. Say how different it felt.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Eyes darting across the room too fast.', 'Talking only to the teacher.'],
    selfCheck: ['Did I finish a sentence before moving my eyes?', 'Where did my eyes go when I was thinking?'],
    realWorld: 'Talking to your whole class during show and tell or a group presentation.',
    homeTip: 'At dinner, your child tells a story and must look at a different family member for each sentence.',
    writePrompt: 'Write the names of five people you could imagine in your audience and one sentence you would say to each.',
  },
  {
    number: 22,
    oneLine: 'Notes should have key words, not every sentence — so you talk, not read.',
    idea: [
      'If you write your whole talk on paper, you will read it with your head down and a flat voice. Your audience will switch off.',
      'Use a small card with just key words: one for your opening, three for your points, one for your ending. Glance at a word, look up, and talk in your own words.',
    ],
    drills: [
      d(22, 'a', { title: 'Five words only', brief: 'Write five key words on a card for a talk about your favourite festival. Give a one-minute talk looking at the card only between points.', targetSeconds: 60 }),
      d(22, 'b', { title: 'Script versus key words', brief: 'Write two sentences about your school and read them aloud. Then say the same thing using only two key words. Which sounded more like you?', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(22, 'c', { title: 'Picture notes', brief: 'Draw three tiny pictures instead of words for a talk about your weekend, then give the talk using only your picture notes.', targetSeconds: 50 }),
    ],
    mentorWatchFor: ['Key-word cards that secretly contain full sentences.', 'Children reading while looking down — encourage glance, look up, speak.'],
    selfCheck: ['How many words were on my card?', 'Did I look up more than down?'],
    realWorld: 'Presenting a book review or project using a small cue card.',
    homeTip: 'Ask your child to make a five-word cue card for telling you about their week, then tell it without reading.',
    soundLab: ['ea', 'oo'],
    writePrompt: 'Write the five key words you would put on a cue card for a talk about your favourite festival.',
  },
  {
    number: 23,
    oneLine: 'When you talk to a camera, talk to one person behind the lens.',
    idea: [
      'Recording a video for your class, a school competition or a family message feels strange, because the camera does not smile or nod back.',
      'Imagine your favourite person is behind the lens. Look into the lens, not at yourself on the screen, smile at the start, and keep your energy a little higher than normal.',
    ],
    drills: [
      d(23, 'a', { title: 'Video message', brief: 'Record a one-minute video message for your class blog about something your class did this term. Look into the lens the whole time.', targetSeconds: 60 }),
      d(23, 'b', { title: 'Screen or lens?', brief: 'Record thirty seconds looking at yourself on the screen, then thirty seconds looking into the lens. Watch both and say which one felt like talking to you.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(23, 'c', { title: 'Mini YouTube review', brief: 'Record a forty-five-second review of a toy, game or book, as if for a kids review channel. Smile at the start and end.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Eyes on their own face on screen instead of the lens.', 'Energy that drops to a whisper on camera.'],
    selfCheck: ['Did I look at the lens or at myself?', 'Did I sound as lively as in class?'],
    realWorld: 'Recording a video for an online class, school competition or family message.',
    homeTip: 'Help your child record a short video message for a relative. Stick a tiny smiley sticker next to the camera lens to look at.',
    soundLab: ['c', 'ch'],
    writePrompt: 'Write the script outline for a one-minute class video: your opening line, three things to say, and your sign-off.',
  },
];
