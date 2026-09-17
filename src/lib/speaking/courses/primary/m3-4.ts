import type { CourseModule } from '../types';

/* Grades 4–6 · Module 3 — Build a Talk */
export const PRIMARY_M3: CourseModule = {
  title: 'Build a Talk',
  outcome: 'Build a one-minute talk with a hook, three reasons in order, linking words and an ending people remember.',
  world: { name: "Talk Builders' Workshop", emoji: '🔧', color: '#EA580C', tagline: 'Every great talk is built, not born.' },
  lessons: [
    {
      title: 'Hooks that grab your audience',
      oneLine: 'Your first sentence decides whether people listen — so start with a hook, not "Hello, today I will talk about…".',
      idea: [
        'A hook is a first line that makes people curious. Three easy hooks: a question ("Have you ever…?"), a surprising fact, or a tiny story ("Last summer, I fell into a river.").',
        'Try writing three different hooks for the same topic, then choose the one that makes YOU want to hear more.',
      ],
      model: { text: 'Question: "What if your school day started at noon?" Fact: "Teenagers’ brains really do wake up later than adults’." Story: "At seven this morning, my alarm went off, and my brain did not."', noticing: ['Three ways into the same topic.', 'None of them start with "Today I will talk about".'] },
      drills: [
        { title: 'Three hooks', brief: 'Choose a topic: pets, holidays or video games. Say three different hooks — a question, a fact and a mini story.', targetSeconds: 30 },
        { title: 'Hook and go', brief: 'Pick your best hook and continue into a forty-five-second talk.', targetSeconds: 45 },
      ],
      game: { name: 'Hook Battle', emoji: '🪝', how: ['Everyone gets the same topic.', 'Children perform a question hook, a fact hook and a story hook.', 'The class votes for the hook that made them want the next sentence.'] },
      realWorld: 'Starting a class presentation so everyone looks up.',
      mentorWatchFor: ['"Hello, my name is… and today…" openings.', 'Questions with a yes or no answer that go nowhere.'],
      selfCheck: ['Did my first sentence make people curious?', 'Did I avoid "Today I will talk about"?'],
      homeTip: 'At dinner, challenge everyone to start the story of their day with a hook.',
      writePrompt: 'Write three hooks — a question, a surprising fact and a mini story — for a talk about your favourite hobby.',
    },
    {
      title: 'Open, explain, wrap up',
      oneLine: 'Every talk has three jobs: open by saying what it is about, explain the good stuff, and wrap it up.',
      idea: [
        'The opening has your hook and says what your talk is about. The explaining part holds your main ideas. The wrap-up reminds people of the big idea and finishes strongly.',
        'Without a clear opening, people are lost. Without a wrap-up, they are left hanging, like a story with the last page torn out.',
      ],
      drills: [
        { title: 'Three-job talk', brief: 'Give a talk about your school. Open: hook and topic. Explain: two or three things about it. Wrap up: what you love most.', targetSeconds: 60 },
        { title: 'Fix the talk', brief: 'This talk has no opening or wrap-up. Add them and say the whole thing.', passage: 'Pandas eat bamboo for most of the day. They have a special thumb bone to help them grip it. Baby pandas are tiny when they are born, about the size of a stick of butter.', targetSeconds: 45 },
      ],
      game: { name: 'Talk Sandwich', emoji: '🥪', how: ['The opening and the wrap-up are the bread, the explaining is the filling.', 'Three children build one talk: one part each.', 'The class checks the sandwich has bread on both sides.'] },
      realWorld: 'Telling your teacher what your project is about.',
      mentorWatchFor: ['Talks that stop mid-point.', 'Openings that ramble.'],
      selfCheck: ['Could someone tell where my opening ended?', 'Did I wrap up, or just stop?'],
      homeTip: 'Ask your child to explain a TV show episode in three parts: how it opened, what happened and how it wrapped up.',
      writePrompt: 'Plan a talk about your favourite season: write one sentence to open, three to explain and one to wrap up.',
    },
    {
      title: 'Three reasons, in order',
      oneLine: 'Three good reasons make a point strong — and putting the best one last makes it stick.',
      idea: [
        'Our brains love threes. One reason is weak, five is too many to remember, three is just right.',
        'Order matters: start with a good reason, put another in the middle and save your strongest for last, so you finish on a high.',
      ],
      drills: [
        { title: 'Three reasons', brief: 'Why is your favourite sport the best? Give three reasons, saving the strongest for last.', targetSeconds: 45 },
        { title: 'Order them', brief: 'Argue why every school should have a pet. Give three reasons in order from good to best.', targetSeconds: 60 },
      ],
      extraDrills: [
        { title: 'Three reasons for a later bedtime', brief: 'Convince your family to let you stay up thirty minutes later on weekends. Three reasons, best last.', targetSeconds: 45 },
      ],
      game: { name: 'Rule of Three Relay', emoji: '🏃', how: ['The mentor gives a topic.', 'Three children add one reason each.', 'The class reorders the reasons so the strongest is last.'] },
      realWorld: 'Explaining to your parents three reasons you should get a new bike.',
      mentorWatchFor: ['Reasons that repeat each other.', 'The best reason used first and wasted.'],
      selfCheck: ['Did I give three different reasons?', 'Was my strongest one last?'],
      homeTip: 'When your child asks for something, ask for "three reasons, best one last" — and really consider them!',
      writePrompt: 'Write three reasons why children should have longer lunch breaks, and number them from good to best.',
    },
    {
      title: 'Linking words: first, next, finally',
      oneLine: 'Linking words are signposts — they show your listeners where they are in your talk.',
      idea: [
        'On a road trip, signs tell you where you are. In a talk, linking words do the same job: first, next, also, however, finally.',
        'They help listeners follow along, and they help you remember what comes next.',
      ],
      model: { text: 'First, turtles have been on Earth since the dinosaurs. Next, some turtles can live for more than a hundred years. Finally, and most amazingly, sea turtles return to the beach where they hatched to lay their own eggs.', noticing: ['First, next, finally mark each point.', '"And most amazingly" warns us the best part is coming.'] },
      drills: [
        { title: 'Signposted talk', brief: 'Explain how to look after a plant using first, next, then and finally.', targetSeconds: 45 },
        { title: 'Signposted reasons', brief: 'Give three reasons to visit your city or town, using first of all, another reason, and most importantly.', targetSeconds: 60 },
      ],
      game: { name: 'Map the Maze', emoji: '🗺️', how: ['One child draws a simple route that a partner cannot see.', 'They guide the partner using only signposts: first, next, after that, finally.', 'Swap. Count how many signposts made it work.'] },
      realWorld: 'Explaining the steps of a science experiment.',
      mentorWatchFor: ['"And then… and then…" instead of variety.', 'Signposts used but points blurred together.'],
      selfCheck: ['Did I use at least three different linking words?', 'Could someone follow where I was?'],
      homeTip: 'Ask your child to explain their morning routine using first, next, then and finally.',
      writePrompt: 'Write the steps for a game you like to play, using at least four different linking words.',
    },
    {
      title: 'Endings people remember',
      oneLine: 'A great ending brings back your big idea and gives people something to feel, do or think about.',
      idea: [
        'Weak endings sound like "Um, that’s it." Strong endings sound finished. Three strong endings: go back to your hook, give a call to action, or leave a big thought.',
        'Say your last line slower and a little louder. Then stop, smile and wait. Do not add "…and yeah."',
      ],
      drills: [
        { title: 'Mic-drop ending', brief: 'Talk for forty-five seconds about why reading is great. End with a line that goes back to your hook.', targetSeconds: 45 },
        { title: 'Call to action', brief: 'Talk about saving water at school. End by telling your listeners exactly what to do tomorrow.', targetSeconds: 45 },
      ],
      game: { name: 'Mic Drop', emoji: '🎤', how: ['Each child writes only the last line of a talk.', 'They deliver just that line, then pause in silence.', 'The class rates it one to five: would you clap?'] },
      realWorld: 'Finishing a speech so everyone knows to clap.',
      mentorWatchFor: ['"So yeah, that’s it."', 'Rushing the last line.'],
      selfCheck: ['Did my ending sound finished?', 'Did I pause after the last line?'],
      homeTip: 'After your child tells a story, ask "What’s your mic-drop line?" and let them try a better ending.',
      writePrompt: 'Write two different endings for a talk about protecting animals: one that goes back to the start and one that asks people to act.',
    },
    {
      title: 'The one-minute talk',
      oneLine: 'Put it all together: hook, three points with linking words, and a strong ending — in one minute.',
      idea: [
        'A one-minute talk is the perfect size to practise everything you have built: roughly ten seconds for the hook, forty for three points and ten for the ending.',
        'Plan on a keyword card, rehearse twice out loud and then give it standing tall.',
      ],
      drills: [
        { title: 'One minute on my hero', brief: 'Give a one-minute talk on someone you admire: hook, three reasons with linking words, and a strong ending.', targetSeconds: 60 },
        { title: 'One minute, surprise topic', brief: 'Pick a topic card: space, oceans or food. Plan for one minute, then give a one-minute talk.', targetSeconds: 60 },
      ],
      game: { name: 'The Minute Timer', emoji: '⏱️', how: ['A child gives a one-minute talk with a timer showing.', 'The class raises hands at the hook, each point and the ending.', 'Bonus points for finishing between fifty-five and sixty-five seconds.'] },
      realWorld: 'A short talk in morning assembly or a class show and tell.',
      mentorWatchFor: ['Running out of material at thirty seconds.', 'Going far over time.'],
      selfCheck: ['Did I have all the parts?', 'Did I finish close to one minute?'],
      homeTip: 'Time your child’s one-minute talk on your phone. Celebrate the closest to sixty seconds.',
      writePrompt: 'Plan a one-minute talk on a topic you love: your hook, three points with linking words and your ending.',
    },
  ],
};

/* Grades 4–6 · Module 4 — Presenting in Class (five lessons; slot 24 is the showcase) */
export const PRIMARY_M4: CourseModule = {
  title: 'Presenting in Class',
  outcome: 'Present a school project with a poster or prop, eye contact and a team, and read aloud well in assembly.',
  world: { name: 'Project Planet', emoji: '🪐', color: '#DB2777', tagline: 'Make every project presentation shine.' },
  lessons: [
    {
      title: 'Presenting a school project',
      oneLine: 'A project presentation tells people what you studied, what you found out and why it matters.',
      idea: [
        'A project talk has a simple plan: WHAT you studied, HOW you found out, WHAT you discovered, and WHY it is interesting.',
        'Do not read your whole project out. Choose the three most interesting things and tell them like a discovery.',
      ],
      drills: [
        { title: 'My project in one minute', brief: 'Present a project you have done (or would like to do): what, how, what you found and why it matters.', targetSeconds: 60 },
        { title: 'The best discovery', brief: 'Tell us the single most surprising thing you learned in a school project, and why it surprised you.', targetSeconds: 40 },
      ],
      game: { name: 'Science Fair Speed Tour', emoji: '🔬', how: ['Children stand by their "project stall" (a drawing or book).', 'Visitors walk round; each presenter has forty-five seconds per visitor.', 'Visitors give a sticker to the most interesting presentation.'] },
      realWorld: 'Presenting your science, history or geography project to the class.',
      mentorWatchFor: ['Reading the poster word for word.', 'Too many facts, no "why it matters".'],
      selfCheck: ['Did I choose my three most interesting points?', 'Did I say why it matters?'],
      homeTip: 'Ask your child to present their current school project to the family as if at a science fair.',
      writePrompt: 'Write the what, how, found and why of a project you have done or would like to do.',
    },
    {
      title: 'Posters, models and props',
      oneLine: 'A poster or prop should help your talk, not hide you.',
      idea: [
        'A good poster has a big title, a few pictures and very few words. A prop — a model, an object — makes people lean in.',
        'Stand beside your poster, not in front of it. Point, then turn back to your audience before you speak.',
      ],
      drills: [
        { title: 'Show the prop', brief: 'Use any object at home as a prop. Present it for forty-five seconds: what it is, how it works and one surprising thing.', targetSeconds: 45 },
        { title: 'Point, turn, talk', brief: 'Describe a picture or poster, pointing to three parts. Turn back to the camera each time before you speak.', targetSeconds: 45 },
      ],
      game: { name: 'Poster Rescue', emoji: '🛟', how: ['Show a messy poster with too many words.', 'In pairs, children redesign it: big title, three pictures, very few words.', 'Present the fixed poster in thirty seconds.'] },
      realWorld: 'Using a chart, map or model in a class presentation.',
      mentorWatchFor: ['Talking to the poster instead of the audience.', 'Props that become toys mid-talk.'],
      selfCheck: ['Did my prop help, not distract?', 'Did I face my audience when talking?'],
      homeTip: 'Help your child plan a poster with a big title and three pictures — no paragraphs allowed.',
      writePrompt: 'Plan a poster for a talk about the planets: the title, three pictures and at most ten words.',
    },
    {
      title: 'Eye contact and standing tall',
      oneLine: 'Looking at people and standing still shows confidence, even when you feel wobbly inside.',
      idea: [
        'Eye contact tells your audience "I am talking to YOU." Look at one person for a sentence, then another. Include the sides of the room.',
        'Plant your feet, keep your hands relaxed or use them to show your points, and try not to sway or play with your clothes.',
      ],
      drills: [
        { title: 'Lighthouse talk', brief: 'Talk about your favourite holiday. Imagine three people: look at a different one for each sentence.', targetSeconds: 45 },
        { title: 'Statue feet', brief: 'Tell a funny story while keeping your feet completely planted. Use your hands for the story only.', targetSeconds: 45 },
      ],
      game: { name: 'Lighthouse', emoji: '🗼', how: ['A child gives a talk, sending each sentence to a different person.', 'Listeners raise a hand when they feel spoken to.', 'Nobody should get two sentences in a row.'] },
      realWorld: 'Presenting to your class and to visitors on school open day.',
      mentorWatchFor: ['Eyes on the ceiling or floor.', 'Swaying, fiddling with sleeves or hair.'],
      selfCheck: ['Did I look at different people?', 'Were my feet still?'],
      homeTip: 'When your child tells you something, gently check they look at you. Praise it when they do.',
      writePrompt: 'Write three things you will do with your eyes, feet and hands during your next presentation.',
    },
    {
      title: 'Team presentations',
      oneLine: 'In a team talk, everyone knows their part and hands over smoothly to the next person.',
      idea: [
        'Team presentations go wrong when people interrupt, forget whose turn it is or all talk about the same thing.',
        'Split the talk into parts, one per person. Practise hand-overs: "Now Aisha will tell you how we built it."',
      ],
      drills: [
        { title: 'My part and the hand-over', brief: 'Pretend you are in a team presenting "Our dream playground". Give your part and hand over to the next speaker by name.', targetSeconds: 45 },
        { title: 'Opening for the team', brief: 'Open a team presentation: hook, introduce each team member and what they will talk about.', targetSeconds: 45 },
      ],
      game: { name: 'Baton Pass', emoji: '🏃‍♀️', how: ['Teams of three plan a ninety-second talk.', 'Each speaker holds a "baton" (a marker) while talking.', 'They must pass it with a hand-over sentence — no silent passes.'] },
      realWorld: 'Group projects and presenting with friends.',
      mentorWatchFor: ['One child taking over.', 'Hand-overs like "Uh… your turn."'],
      selfCheck: ['Did I know my part?', 'Did I hand over by name?'],
      homeTip: 'Plan a family "team talk" about your last holiday — everyone takes one part and hands over.',
      writePrompt: 'Plan a team presentation for three people: each person’s part and the hand-over sentence between them.',
    },
    {
      title: 'Reading aloud in assembly',
      oneLine: 'Reading aloud well means looking up, pausing at punctuation and speaking slowly enough for a big hall.',
      idea: [
        'In a big hall, sound echoes, so slow down more than you think. Hold your paper at chest height, not in front of your face.',
        'Use the "read, look, say" trick: read a line with your eyes, look up, then say it.',
      ],
      drills: [
        { title: 'Assembly reading', brief: 'Read this as if to the whole school in assembly. Use read, look, say.', passage: 'Good morning, everyone. This week is Kindness Week. Every day, we challenge you to do one kind thing for someone else. It might be holding a door, helping a friend with their work or saying something kind. Small acts can make a big difference.', targetSeconds: 30 },
        { title: 'Poem for the hall', brief: 'Read this poem slowly and clearly for a big hall.', passage: 'The world is wide and full of things to see, the mountains high, the rivers running free. So open your eyes and open your heart, and every day will be a brand new start.', targetSeconds: 20 },
      ],
      game: { name: 'Echo Hall', emoji: '🏛️', how: ['One child reads from the far end of the room.', 'The class at the other end writes down one word they did not hear clearly.', 'The reader tries again, slower, until every word arrives.'] },
      realWorld: 'Reading a prayer, notice or poem in school assembly.',
      mentorWatchFor: ['Paper covering the face.', 'Speeding up out of nerves.'],
      selfCheck: ['Did I look up between lines?', 'Was I slow enough for a big room?'],
      homeTip: 'Have your child read a short news article aloud from across the room, using read, look, say.',
      writePrompt: 'Write a short assembly announcement for an event you would like your school to hold.',
    },
  ],
};
