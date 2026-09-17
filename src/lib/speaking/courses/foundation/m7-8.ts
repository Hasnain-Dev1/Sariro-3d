import type { CourseModule } from '../types';

/* Grades 1–3 · Module 7 — My Big World */
export const FOUNDATION_M7: CourseModule = {
  title: 'My Big World',
  outcome: 'Give a short talk about yourself and your world, with a reason — "because" — for what you think.',
  world: { name: 'Explorer Island', emoji: '🏝️', color: '#CA8A04', tagline: 'Talk about the world you live in.' },
  lessons: [
    {
      title: 'All about me',
      oneLine: 'I can give a little talk all about me, with a start, three things and an end.',
      idea: [
        'An "all about me" talk is like a mini show. Start with hello and your name. Then share three things about you. End with "Thank you for listening!"',
        'Pick things that make you, YOU: something you love, something you are good at, and something you want to learn.',
      ],
      drills: [
        { title: 'Three things about me', brief: 'Say hello and your name. Tell us something you love, something you are good at and something you want to learn. Say thank you.', targetSeconds: 35 },
        { title: 'Me, then and now', brief: 'Tell us something you could not do when you were little, and what you can do now.', targetSeconds: 30 },
      ],
      game: { name: 'Me Bag', emoji: '🎒', how: ['Each child brings (or draws) three things that show who they are.', 'They pull each thing out of a bag and say why it is about them.', 'The class guesses what the next thing might be.'] },
      realWorld: 'Introducing yourself at a new club, class or summer camp.',
      mentorWatchFor: ['Missing start or end.', 'Children who say "I don’t know what I’m good at" — help them find one.'],
      selfCheck: ['Did I start with hello and end with thank you?', 'Did I share three things?'],
      homeTip: 'Help your child make an "all about me" poster with three drawings. Let them present it to the family.',
    },
    {
      title: 'My favourite place',
      oneLine: 'I can take my friends on a trip to my favourite place, just with words.',
      idea: [
        'When you describe a place, pretend you are a tour guide. Say where it is, what you can see, what you can hear and what you do there.',
        'End with why you love it. Your friends should feel like they visited!',
      ],
      model: { text: 'My favourite place is the beach near my grandma’s house. You can see big blue waves and little crabs. You can hear the seagulls. I love building sandcastles there, because the sand is soft and warm.', noticing: ['Where it is.', 'See and hear.', 'Why she loves it — because…'] },
      drills: [
        { title: 'Tour guide', brief: 'Be a tour guide for your favourite place. Say where it is, what you see, what you hear and why you love it.', targetSeconds: 35 },
        { title: 'Dream place', brief: 'Invent a dream place, like a candy island or a castle in the clouds. Take us on a tour!', targetSeconds: 40 },
      ],
      game: { name: 'Magic Carpet Ride', emoji: '🧞', how: ['Everyone sits on a pretend magic carpet with eyes closed.', 'A child describes a place they love as the carpet "lands" there.', 'Others open their eyes and say one thing they "saw".'] },
      realWorld: 'Telling your class about a holiday or a trip.',
      mentorWatchFor: ['Naming the place with no description.', 'Missing "because".'],
      selfCheck: ['Did I use seeing and hearing words?', 'Did I say why I love it?'],
      homeTip: 'On your next outing, ask your child to be the tour guide and describe everything to you.',
    },
    {
      title: 'My best day ever',
      oneLine: 'I can tell about my best day, in order, with lots of feeling.',
      idea: [
        'Your best day ever is a story! Tell it in order: in the morning, then in the afternoon, and at night.',
        'Share the feelings too. Were you excited? Surprised? So happy you jumped?',
      ],
      drills: [
        { title: 'Morning to night', brief: 'Tell us about your best day ever: what happened in the morning, the afternoon and at night.', targetSeconds: 40 },
        { title: 'The best moment', brief: 'Tell us about the very best moment of that day. What did you see, hear and feel?', targetSeconds: 30 },
      ],
      game: { name: 'Clock Story', emoji: '⏰', how: ['Draw a big clock with morning, afternoon and night.', 'A child moves the hand as they tell each part of their best day.', 'The class shouts the feeling word they heard for each part.'] },
      realWorld: 'Telling your family about a birthday party or a school trip.',
      mentorWatchFor: ['Jumping around in time.', 'Flat voices on exciting parts.'],
      selfCheck: ['Did I tell it in order?', 'Did my voice show my feelings?'],
      homeTip: 'Look at photos from a happy day together. Your child tells the story from morning to night.',
    },
    {
      title: 'Because! Giving a reason',
      oneLine: 'When I say what I like, I say "because" and give a reason.',
      idea: [
        'Saying "I like cats" is good. Saying "I like cats BECAUSE they are soft and they purr" is even better! A reason helps people understand you.',
        'Try giving two reasons: "because… and also because…"',
      ],
      drills: [
        { title: 'One because', brief: 'Tell us your favourite season and give a reason with "because".', targetSeconds: 20 },
        { title: 'Two becauses', brief: 'Tell us which is better: the beach or the mountains. Give two reasons: "because… and also because…"', targetSeconds: 30 },
      ],
      game: { name: 'Because Chain', emoji: '🔗', how: ['The mentor says "I like ice cream because it is cold."', 'The next child says their own like and a because.', 'Challenge round: add "and also because…"'] },
      realWorld: 'Telling your parents why you should go to the park today.',
      mentorWatchFor: ['Reasons that repeat the like ("I like it because I like it").', 'Children who stop before the because.'],
      selfCheck: ['Did I say because?', 'Did my reason make sense?'],
      homeTip: 'Whenever your child says "I want…", ask "Because?" and wait for a reason. Praise good reasons.',
    },
    {
      title: 'Thank you, helpers!',
      oneLine: 'I can give a little thank-you talk to a helper in my world.',
      idea: [
        'Lots of people help us: teachers, doctors, bus drivers, cooks, cleaners and police officers.',
        'A thank-you talk says who you are thanking, what they do and why it matters to you. It makes people feel wonderful.',
      ],
      drills: [
        { title: 'Thank a helper', brief: 'Choose a helper. Say who they are, what they do, and thank them with a reason.', targetSeconds: 30 },
        { title: 'Helper for a day', brief: 'Pretend you are a helper, like a firefighter or a doctor. Tell us about your job and how you help people.', targetSeconds: 35 },
      ],
      game: { name: 'Helper Hats', emoji: '👷', how: ['Put helper picture cards in a hat.', 'A child picks one and says "Thank you, [helper], because…"', 'The class guesses the helper from the thank-you before the card is shown.'] },
      realWorld: 'Saying thank you to your teacher, bus driver or school cook.',
      mentorWatchFor: ['Thank-yous with no reason.', 'Children who choose family — welcome it.'],
      selfCheck: ['Did I say what they do?', 'Did I say why I am thankful?'],
      homeTip: 'Help your child record a thank-you voice message or video for a helper in your life, like a teacher or grandparent.',
      soundLab: ['s-ending'],
    },
    {
      title: 'Nature detective',
      oneLine: 'I can look closely at nature and describe what I find like a detective.',
      idea: [
        'Detectives look very closely. A nature detective looks at leaves, bugs, flowers and clouds and uses describing words.',
        'Say what you found, what it looks like, and one question you wonder about it: "I wonder why…"',
      ],
      drills: [
        { title: 'Detective report', brief: 'Look at a plant, a leaf or the sky. Describe it closely, and end with "I wonder why…"', targetSeconds: 30 },
        { title: 'Nature news', brief: 'Read this detective report like a news reader.', passage: 'Detective report! Today I found a snail on the garden wall. Its shell was brown and curly. It moved very, very slowly. It left a shiny silver line behind it. I wonder where it was going.', targetSeconds: 25 },
      ],
      game: { name: 'Magnifying Glass', emoji: '🔍', how: ['Each child holds a pretend magnifying glass over a nature picture or object.', 'They say three describing words about it.', 'They finish with "I wonder…" and the class tries to answer.'] },
      realWorld: 'Sharing what you found on a school nature walk.',
      mentorWatchFor: ['One-word descriptions — push for colour, shape and size.', 'Missing "I wonder" questions.'],
      selfCheck: ['Did I use describing words?', 'Did I ask an "I wonder" question?'],
      homeTip: 'Go on a five-minute nature walk. Your child is the detective and reports three things they found.',
    },
  ],
};

/* Grades 1–3 · Module 8 — Superstar Show (five lessons; slot 48 is the showcase) */
export const FOUNDATION_M8: CourseModule = {
  title: 'Superstar Show',
  outcome: 'Perform a poem, a joke and a little talk for an audience, and get ready for the big show.',
  world: { name: 'Superstar Stage', emoji: '⭐', color: '#2563EB', tagline: 'Lights, voice, action!' },
  lessons: [
    {
      title: 'Rhymes and poems with actions',
      oneLine: 'I can say a poem with a strong rhythm and actions that match the words.',
      idea: [
        'Poems have a beat, like music. When you say a poem, clap or tap the beat and let the rhyming words shine.',
        'Add actions: if the poem says "jump", jump! Actions help you remember and make it fun to watch.',
      ],
      drills: [
        { title: 'Twinkle poem', brief: 'Say this poem with a beat and actions for the stars, the sky and sleeping.', passage: 'Little star up in the sky, twinkle, twinkle, way up high. When the moon comes out to play, I close my eyes and drift away.', targetSeconds: 20 },
        { title: 'The jumping frog', brief: 'Perform this poem with big actions and a strong rhythm.', passage: 'Jump, little frog, jump up high, jump to the lily pad, jump to the sky. Splash in the water, swim in the sun, jumping and splashing is so much fun!', targetSeconds: 20 },
      ],
      game: { name: 'Poem Drum', emoji: '🥁', how: ['The mentor taps a drum or table to the poem’s beat.', 'Children say the poem to the beat with actions.', 'Speed up the drum for a fun, fast final round.'] },
      realWorld: 'Saying a poem at a school assembly or a family festival.',
      mentorWatchFor: ['Rushing and losing the rhythm.', 'Actions without words.'],
      selfCheck: ['Did I keep the beat?', 'Did my actions match the words?'],
      homeTip: 'Learn a short rhyme together this week with actions, and perform it for someone at home.',
    },
    {
      title: 'Jokes and riddles time',
      oneLine: 'I can tell a joke with a pause before the funny part.',
      idea: [
        'Jokes need a secret ingredient: a PAUSE. Ask the question, wait a moment, then say the funny answer.',
        'Say it clearly and do not laugh before the end! Then enjoy the laughs.',
      ],
      model: { text: 'Why did the teddy bear say no to dessert? … (pause) … Because he was already stuffed!', noticing: ['The question first.', 'A little pause.', 'The funny answer, said clearly.'] },
      drills: [
        { title: 'Joke with a pause', brief: 'Tell this joke. Make a big pause before the answer.', passage: 'What do you call a sleeping dinosaur? A dino-snore!', targetSeconds: 10 },
        { title: 'Riddle me this', brief: 'Tell us two riddles or jokes you know. Pause before each answer.', targetSeconds: 30 },
      ],
      game: { name: 'Joke Jar', emoji: '🫙', how: ['Put kid-friendly joke cards in a jar.', 'A child picks one and tells it with a pause.', 'The class gives laughs out of three — but everyone gets at least one!'] },
      realWorld: 'Making your family laugh at dinner.',
      mentorWatchFor: ['No pause before the punchline.', 'Unkind jokes — keep them kind.'],
      selfCheck: ['Did I pause before the funny part?', 'Did I say it clearly?'],
      homeTip: 'Start a family joke night. Everyone tells one joke, and your child reminds everyone to pause!',
    },
    {
      title: 'I can teach you!',
      oneLine: 'I can be the teacher and show my friends how to do something I am good at.',
      idea: [
        'Being the teacher is fun! Pick something you know how to do: a dance move, drawing a cat or tying shoelaces.',
        'Say what you will teach, show the steps one at a time, and check: "Can you do it too?"',
      ],
      drills: [
        { title: 'Mini teacher', brief: 'Teach us something you are good at in three steps. Start with "Today I will teach you…"', targetSeconds: 40 },
        { title: 'Teach a game', brief: 'Teach us the rules of your favourite playground game. End with "Now let’s play!"', targetSeconds: 40 },
      ],
      game: { name: 'Little Teachers', emoji: '👩‍🏫', how: ['A child becomes the teacher for two minutes.', 'They teach the class a simple action, like a clap pattern.', 'The class tries it. If they can do it, the teacher gets a gold star.'] },
      realWorld: 'Showing a younger child how to play a game or tie their shoes.',
      mentorWatchFor: ['Doing the thing without explaining it.', 'Skipping steps.'],
      selfCheck: ['Did I say what I would teach?', 'Could my friends do it after?'],
      homeTip: 'Let your child teach YOU something this week — a game, a drawing or a song. Be a curious student!',
    },
    {
      title: 'When I grow up',
      oneLine: 'I can share my big dream and say why it matters to me.',
      idea: [
        'Everybody has dreams! Maybe you want to be an astronaut, a vet, a chef or an inventor.',
        'A dream talk says what you want to be, why you want it, and one thing you would do. Say it with a big, proud voice.',
      ],
      drills: [
        { title: 'My dream job', brief: 'Tell us what you want to be when you grow up, why, and one thing you would do in that job.', targetSeconds: 35 },
        { title: 'A day in my dream job', brief: 'Pretend it is the future. Tell us about one day in your dream job, from morning to night.', targetSeconds: 45 },
      ],
      game: { name: 'Future Me Parade', emoji: '🚀', how: ['Children dress up or pretend to be their future selves.', 'They walk in a parade and stop to say "I am a [job] and I help people by…"', 'The class cheers each future hero.'] },
      realWorld: 'Talking about your dreams with your teacher, family and friends.',
      mentorWatchFor: ['Children who have no answer — let them pick a fun one for today.', 'Missing reasons.'],
      selfCheck: ['Did I say why I want it?', 'Did I sound proud?'],
      homeTip: 'Ask your child about their dream job and tell them what you wanted to be when you were little.',
    },
    {
      title: 'Rehearsing for the big show',
      oneLine: 'Superstars practise lots before a show, so on the day it feels easy.',
      idea: [
        'Before the big Superstar Show, we rehearse. Rehearse means practise, again and again, just like a real show.',
        'Pick your best talk from the whole course. Practise it three times: once slowly, once with actions and once like it is the real show.',
      ],
      drills: [
        { title: 'Practice one: slow', brief: 'Choose your show talk. Say it slowly like Tara the Turtle, remembering every part.', targetSeconds: 40 },
        { title: 'Practice two: superstar', brief: 'Now do it like the real show: superhero pose, big Leo voice, look at your friends, smile and say thank you.', targetSeconds: 45 },
      ],
      game: { name: 'Dress Rehearsal', emoji: '🎬', how: ['Set up the "stage" just like the real show.', 'Each child practises their show talk once.', 'Friends give one "glow" (something great) to each star.'] },
      realWorld: 'Getting ready for a school play, a recital or a family performance.',
      mentorWatchFor: ['Children who have not chosen a talk yet — help them pick.', 'Nerves — remind them of balloon breathing.'],
      selfCheck: ['Did I practise three times?', 'Am I ready for the big show?'],
      homeTip: 'Set up a pretend stage at home. Your child rehearses their show talk for the family, with a big bow at the end.',
    },
  ],
};
