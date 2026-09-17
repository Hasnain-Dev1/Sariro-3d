import type { CourseModule } from '../types';

/* Grades 4–6 · Module 5 — Storytellers' Club */
export const PRIMARY_M5: CourseModule = {
  title: "Storytellers' Club",
  outcome: 'Tell true and invented stories with a clear plot, living characters, sensory detail, timing and suspense.',
  world: { name: 'Story Canyon', emoji: '🏜️', color: '#16A34A', tagline: 'Tell stories people ask to hear again.' },
  lessons: [
    {
      title: 'The story mountain',
      oneLine: 'Good stories climb a mountain: a start, a build-up, a big problem at the top, then the way down to the ending.',
      idea: [
        'A story mountain has five parts: opening (who and where), build-up (things start happening), problem (the top of the mountain), resolution (how it gets fixed) and ending (how things are now).',
        'When you tell a story, slow down at the top of the mountain. That is the part people are waiting for.',
      ],
      drills: [
        { title: 'Climb the mountain', brief: 'Tell a story about a lost dog using all five parts of the story mountain.', targetSeconds: 60 },
        { title: 'Mountain from a picture', brief: 'Imagine a picture of a broken kite stuck on a roof. Tell the story behind it using the story mountain.', targetSeconds: 60 },
      ],
      game: { name: 'Story Dice', emoji: '🎲', how: ['Roll three picture dice or pick three random emojis.', 'Use the first for the opening, the second for the problem, the third for the resolution.', 'Tell it in sixty seconds.'] },
      realWorld: 'Telling a story in a school storytelling competition.',
      mentorWatchFor: ['Stories with no problem.', 'Rushing past the top of the mountain.'],
      selfCheck: ['Did my story have all five parts?', 'Did I slow down at the problem?'],
      homeTip: 'Draw a story mountain on paper together and fill it in for a family story you both know.',
      writePrompt: 'Plan a story on a story mountain: one sentence for each of the five parts.',
    },
    {
      title: 'Bringing characters to life',
      oneLine: 'Characters come alive when they have their own voice, their own words and something they want.',
      idea: [
        'Instead of "the man was angry", let us hear him: "GET OFF MY LAWN!" Dialogue — the exact words characters say — makes a story feel real.',
        'Give each character a slightly different voice or way of talking, and tell us what they want. Wanting something creates the story.',
      ],
      drills: [
        { title: 'Two voices', brief: 'Read this with a different voice for the grumpy shopkeeper and the polite girl.', passage: '"We are closed," grumbled the shopkeeper, without looking up. "I am so sorry," said Zara quietly, "but my grandmother is sick, and she needs this medicine tonight." The shopkeeper slowly put down his newspaper.', targetSeconds: 25 },
        { title: 'A character who wants something', brief: 'Tell a short story about a character who wants something badly. Use their words, not just yours.', targetSeconds: 60 },
      ],
      game: { name: 'Character Hot Seat', emoji: '🪑', how: ['A child becomes a character from a story everyone knows.', 'The class asks the character questions.', 'The child answers in character’s voice without breaking.'] },
      realWorld: 'Performing in a class play or reading a story to younger children.',
      mentorWatchFor: ['"He said, she said" with no change in voice.', 'Over-acting that loses clarity.'],
      selfCheck: ['Could you tell the characters apart by voice?', 'Did my character want something?'],
      homeTip: 'Read a book chapter together where your child reads only the dialogue with voices.',
      writePrompt: 'Write a short conversation between two characters who want different things.',
    },
    {
      title: 'Painting pictures with the five senses',
      oneLine: 'Detail from the five senses lets your listeners see, hear and feel your story.',
      idea: [
        '"It was a nice beach" paints nothing. "The sand burned my feet, the waves crashed and I could taste salt on my lips" puts us there.',
        'Use one or two senses in each important moment — not every sentence, or the story drags.',
      ],
      drills: [
        { title: 'Zoom in', brief: 'Describe walking into your school canteen at lunchtime using at least four senses.', targetSeconds: 45 },
        { title: 'Senses story', brief: 'Read this slowly, letting each sense detail land.', passage: 'The forest was silent except for the crunch of leaves under my boots. Cold air stung my cheeks. Somewhere nearby, wood smoke drifted through the trees, and then I saw it: a tiny cabin with a warm yellow light in the window.', targetSeconds: 25 },
      ],
      game: { name: 'Zoom In', emoji: '🔎', how: ['A child says a moment in one plain sentence.', 'The class calls out senses: "What did you hear?" "What did it smell like?"', 'The child retells the moment with the details added.'] },
      realWorld: 'Describing a trip or festival so your friends feel they were there.',
      mentorWatchFor: ['Only sight details.', 'Lists of senses with no story.'],
      selfCheck: ['How many senses did I use?', 'Could listeners picture it?'],
      homeTip: 'At a meal or on a walk, play "five senses": each person says one thing they notice with each sense.',
      writePrompt: 'Describe your favourite festival or celebration using all five senses.',
    },
    {
      title: 'True stories from my life',
      oneLine: 'Your own stories are the best stories you have — nobody else can tell them.',
      idea: [
        'True stories do not need to be huge. Getting lost in a supermarket, a first day at school or a disaster birthday cake can be brilliant stories.',
        'Find the moment where something changed: you were scared and then brave, or something went wrong and turned funny.',
      ],
      drills: [
        { title: 'The day it went wrong', brief: 'Tell a true story about a day when something went wrong — and what happened in the end.', targetSeconds: 60 },
        { title: 'A moment I was brave', brief: 'Tell a true story about a time you did something that scared you.', targetSeconds: 60 },
      ],
      game: { name: 'Two Truths & a Tale', emoji: '🤥', how: ['Each child tells three short stories about themselves: two true, one invented.', 'The class guesses which one is the tale.', 'Discuss what details made the true ones believable.'] },
      realWorld: 'Telling a story about yourself when you meet new friends.',
      mentorWatchFor: ['"Nothing interesting ever happened to me" — dig for small moments.', 'Stories that list events with no change.'],
      selfCheck: ['Did my story have a moment where something changed?', 'Did I include how I felt?'],
      homeTip: 'Tell your child a true story from when you were their age. Then ask them for one of theirs.',
      writePrompt: 'Write the true story of a time something went wrong and what you learned from it.',
    },
    {
      title: 'Funny stories and timing',
      oneLine: 'Funny stories depend on timing: set it up, pause, then deliver the surprise.',
      idea: [
        'Humour is often a surprise — the story goes one way, and then something unexpected happens.',
        'Set it up clearly, pause just before the funny part and do not laugh first. Keep humour kind: laugh with people, not at them.',
      ],
      model: { text: 'My dad spent three hours building a bookshelf. He stood back, proud, and said, "Perfect." (pause) Then he noticed the big bag of extra screws.', noticing: ['A clear setup.', 'A pause before the surprise.', 'The funny part is short.'] },
      drills: [
        { title: 'The pause before the punchline', brief: 'Tell a funny true or made-up story. Use a clear pause right before the funny part.', targetSeconds: 45 },
        { title: 'Callback', brief: 'Tell a story with a small funny detail early on, and bring that detail back in your last line.', targetSeconds: 60 },
      ],
      game: { name: 'Callback Comedy', emoji: '😂', how: ['A child tells a short story with one funny detail near the start.', 'They bring that detail back in the final line.', 'The class rates the callback — kind humour only.'] },
      realWorld: 'Making your friends laugh at a sleepover or in a class talent show.',
      mentorWatchFor: ['Laughing before the punchline.', 'Humour that picks on someone.'],
      selfCheck: ['Did I pause before the funny part?', 'Was my humour kind?'],
      homeTip: 'Share funny family stories at dinner and practise the pause together.',
      writePrompt: 'Write a funny short story with a setup and a surprising ending line.',
    },
    {
      title: 'Suspense: keeping them guessing',
      oneLine: 'Suspense makes listeners desperate to know what happens next — slow down, drop your voice and hold back the answer.',
      idea: [
        'To build suspense, slow down, speak a little softer and add small details before the big reveal. Short sentences help: "I opened the door. Nothing. Then… a noise."',
        'A pause is your best tool. The longer you wait (just a little!), the more people lean in.',
      ],
      drills: [
        { title: 'The creaky door', brief: 'Read this with suspense: slower, softer and with pauses before the reveal.', passage: 'The house was dark. I pushed the door. It creaked. Something moved in the corner. I held my breath. Slowly, slowly, I turned on my torch, and there, blinking at me, was a very small, very surprised kitten.', targetSeconds: 30 },
        { title: 'My suspense story', brief: 'Tell a short suspense story about a mysterious box left outside your door.', targetSeconds: 60 },
      ],
      game: { name: 'Cliffhanger Circle', emoji: '🧗', how: ['A child tells a story and stops at the most exciting moment.', 'The class votes: "What happens next?"', 'The storyteller reveals the ending with a dramatic pause.'] },
      realWorld: 'Telling spooky stories at camp or on a sleepover.',
      mentorWatchFor: ['Speeding up at the exciting part.', 'Revealing the answer too early.'],
      selfCheck: ['Did I slow down and pause before the reveal?', 'Did my listeners want to know what happened?'],
      homeTip: 'Take turns telling a two-minute suspense story in low light. Rate each other’s pauses.',
      writePrompt: 'Write a suspense story of five or six sentences that ends with a surprising reveal.',
    },
  ],
};

/* Grades 4–6 · Module 6 — Reporter Room */
export const PRIMARY_M6: CourseModule = {
  title: 'Reporter Room',
  outcome: 'Report news, interview someone, explain how things work, give instructions, review books and host a quiz.',
  world: { name: 'Newsroom HQ', emoji: '📰', color: '#2563EB', tagline: 'Inform, explain and ask great questions.' },
  lessons: [
    {
      title: 'Be a news reporter',
      oneLine: 'A news report answers who, what, where, when and why — the most important part first.',
      idea: [
        'Reporters start with the headline: the biggest news in one sentence. Then they add who, what, where, when and why.',
        'News reporters sound calm and clear, look at the camera and sign off: "Back to you in the studio!"',
      ],
      model: { text: 'Breaking news from Class Five: a family of ducks has moved into the school pond! The ducks arrived on Monday morning. The head teacher says the pond area will stay quiet so the ducklings can grow. This is Kabir, reporting from Sunshine School.', noticing: ['Headline first.', 'Who, what, where, when and why.', 'A sign-off.'] },
      drills: [
        { title: 'School news', brief: 'Report a piece of real or made-up news from your school. Headline first, then the five Ws, then a sign-off.', targetSeconds: 45 },
        { title: 'News from home', brief: 'Report the biggest news from your home this week as a TV reporter.', targetSeconds: 45 },
      ],
      game: { name: 'News Anchor', emoji: '📺', how: ['Each child reports a thirty-second news story straight to camera.', 'They end with a sign-off: "Reporting from…"', 'Watch it back with the sound off — did they look at the lens?'] },
      realWorld: 'Presenting a class newsletter or a school radio announcement.',
      mentorWatchFor: ['Burying the headline at the end.', 'Missing where or when.'],
      selfCheck: ['Did I start with the headline?', 'Did I answer who, what, where, when and why?'],
      homeTip: 'Watch a short news clip for children together, then ask your child to report the family’s news the same way.',
      writePrompt: 'Write a news report about a real or imaginary event at your school, headline first.',
    },
    {
      title: 'Interviewing someone',
      oneLine: 'Great interviewers ask open questions and really listen, so they can ask a good follow-up.',
      idea: [
        'Closed questions get yes or no: "Do you like cooking?" Open questions get stories: "What got you interested in cooking?"',
        'The best interviewers listen to the answer and ask a follow-up: "What was the hardest part?"',
      ],
      drills: [
        { title: 'Open questions', brief: 'Interview a family member about their favourite childhood memory. Ask three open questions and one follow-up.', targetSeconds: 90 },
        { title: 'Report the interview', brief: 'Tell us the most interesting thing you found out in your interview, like a reporter.', targetSeconds: 45 },
      ],
      game: { name: 'Celebrity Interview', emoji: '🎙️', how: ['One child plays a famous person (an athlete, an inventor, an explorer).', 'A reporter asks three open questions and one follow-up.', 'The class spots any closed questions and helps reopen them.'] },
      realWorld: 'Interviewing a grandparent for a history project.',
      mentorWatchFor: ['Yes/no questions.', 'Moving to the next question without listening.'],
      selfCheck: ['Were my questions open?', 'Did I ask a follow-up?'],
      homeTip: 'Let your child interview you about your job. Answer fully so they can practise a follow-up question.',
      writePrompt: 'Write five open interview questions for someone whose job you find interesting.',
    },
    {
      title: 'Explaining how something works',
      oneLine: 'A clear explanation starts simple, goes step by step and uses an example people already know.',
      idea: [
        'To explain how something works, start with what it does, then how, step by step. Compare it to something familiar: "The heart is like a pump."',
        'Check your listener is following: "Does that make sense so far?"',
      ],
      drills: [
        { title: 'How it works', brief: 'Explain how a rainbow forms, or how a bicycle moves. Use one comparison to something familiar.', targetSeconds: 60 },
        { title: 'Explain to a six-year-old', brief: 'Explain something you learned at school this week to a six-year-old, using simple words and an example.', targetSeconds: 60 },
      ],
      game: { name: 'Explain Like I’m Five', emoji: '👶', how: ['A child explains a school topic.', 'The class acts as five-year-olds and says "Huh?" whenever a word is too hard.', 'The explainer swaps in a simpler word or an example.'] },
      realWorld: 'Explaining homework to a friend or a younger sibling.',
      mentorWatchFor: ['Jargon without explanation.', 'Jumping steps.'],
      selfCheck: ['Did I use an everyday comparison?', 'Would a younger child understand?'],
      homeTip: 'Ask your child to explain one thing they learned this week as if you know nothing about it.',
      writePrompt: 'Write an explanation of how something works, using one comparison to something everyday.',
    },
    {
      title: 'Giving clear instructions',
      oneLine: 'Good instructions are short, in order and say exactly what to do.',
      idea: [
        'Instructions fail when they skip steps or are vague: "Do the thing with the paper." Say exactly what to do, one action per step.',
        'Start with what we are making, give numbered steps and finish with a check: "You should now have…"',
      ],
      drills: [
        { title: 'Paper plane', brief: 'Give instructions to make a paper plane. Each step is one action.', targetSeconds: 60 },
        { title: 'Robot instructions', brief: 'Give instructions for brushing teeth to a robot who takes every word literally.', targetSeconds: 45 },
      ],
      game: { name: 'Robot Chef', emoji: '🤖', how: ['The mentor pretends to be a robot that does exactly what it is told.', 'A child gives instructions for making a jam sandwich.', 'Any vague step makes the robot get it wrong — the class helps fix the instruction.'] },
      realWorld: 'Teaching friends a new game or explaining a craft activity.',
      mentorWatchFor: ['Vague words like "thing" and "stuff".', 'Two actions in one step.'],
      selfCheck: ['Was each step one action?', 'Could someone follow without asking?'],
      homeTip: 'Let your child give you step-by-step instructions to draw something without showing you the picture.',
      writePrompt: 'Write step-by-step instructions for a simple game or recipe, one action per step.',
    },
    {
      title: 'Book and film reviews',
      oneLine: 'A review tells people what something is about, what was great or not, and who would enjoy it — without spoilers.',
      idea: [
        'A spoken review has four parts: what it is (title and type), what it is about (no spoilers!), your opinion with reasons, and a rating with who would like it.',
        'Reasons make a review useful: not just "It was good" but "The ending surprised me because…"',
      ],
      drills: [
        { title: 'Spoiler-free review', brief: 'Review a book or film you love: what it is, what it is about without spoilers, two reasons you liked it and a star rating.', targetSeconds: 60 },
        { title: 'The honest review', brief: 'Review something you did not enjoy — a book, film or game — fairly: one good thing and one reason it was not for you.', targetSeconds: 45 },
      ],
      game: { name: 'Critics’ Corner', emoji: '⭐', how: ['Two children review the same book or film.', 'The class listens for spoilers — a spoiler costs a point.', 'The class decides whose review would make them want to watch it.'] },
      realWorld: 'Recommending a book in the school library or to friends.',
      mentorWatchFor: ['Retelling the whole plot.', 'Opinions with no reasons.'],
      selfCheck: ['Did I avoid spoilers?', 'Did I give reasons for my opinion?'],
      homeTip: 'After the next family film, ask everyone for a thirty-second, spoiler-free review with a star rating.',
      writePrompt: 'Write a spoiler-free review of a book or film with two reasons and a star rating.',
    },
    {
      title: 'Hosting a quiz',
      oneLine: 'A quiz host speaks clearly, keeps energy up and keeps the game moving.',
      idea: [
        'Hosts welcome players, explain the rules simply, read questions clearly (twice if needed) and keep the energy fun.',
        'Use your voice to build excitement: "And the answer is…" (pause) "…Jupiter!"',
      ],
      drills: [
        { title: 'Welcome and rules', brief: 'Welcome players to your quiz show, give it a name and explain the rules in three sentences.', targetSeconds: 30 },
        { title: 'Host a round', brief: 'Host a quiz round: read three questions clearly, pause and reveal each answer with excitement.', targetSeconds: 60 },
      ],
      game: { name: 'Classroom Quiz Show', emoji: '🏆', how: ['Two teams compete.', 'Children take turns being the host for one round.', 'The class votes for the host with the best energy and clearest voice.'] },
      realWorld: 'Running a quiz at a class party or family gathering.',
      mentorWatchFor: ['Rushing through questions.', 'Rules that are too long.'],
      selfCheck: ['Were my rules clear?', 'Did I keep the energy up?'],
      homeTip: 'Have a family quiz night with your child as host. Help them write five questions.',
      writePrompt: 'Write a quiz show opening: the name of your show, a welcome and three simple rules.',
    },
  ],
};
