import type { CourseModule } from '../types';

/* Grades 1–3 · Module 5 — Pretend Play */
export const FOUNDATION_M5: CourseModule = {
  title: 'Pretend Play',
  outcome: 'Play a character — a shopkeeper, a reporter, a TV chef — and talk the way that character would.',
  world: { name: 'Puppet Theatre', emoji: '🎭', color: '#DB2777', tagline: 'Put on a character and speak like them.' },
  lessons: [
    {
      title: 'Talking puppets',
      oneLine: 'When my puppet talks, I can be brave and silly and clear all at once.',
      idea: [
        'Some children feel shy talking as themselves, but a puppet is never shy! A sock, a paper bag or a teddy can be your puppet.',
        'Give your puppet a name and a voice. Let the puppet say hello to everyone and tell them one thing about itself.',
      ],
      drills: [
        { title: 'Meet my puppet', brief: 'Make a puppet from a sock or use a toy. Let it say its name, where it lives and what it likes to eat.', targetSeconds: 25 },
        { title: 'Puppet and me', brief: 'Have a little talk with your puppet. You ask it two questions, and it answers in its own voice.', targetSeconds: 35 },
      ],
      game: { name: 'Puppet Parade', emoji: '🧦', how: ['Everyone makes a quick puppet from a sock or paper bag.', 'Puppets come to the front one by one and introduce themselves.', 'The class puppets wave and say "Hello, [name]!"'] },
      realWorld: 'Playing pretend with friends and putting on shows for your family.',
      mentorWatchFor: ['Shy children who come alive with a puppet — note it and use puppets for them again.', 'Voices too quiet behind the puppet.'],
      selfCheck: ['Did my puppet have its own voice?', 'Could everyone hear my puppet?'],
      homeTip: 'Make a sock puppet together. Let the puppet tell you about your child’s day — children often share more through a puppet!',
    },
    {
      title: "Let's play shop",
      oneLine: 'I can ask for things politely and answer when someone asks me.',
      idea: [
        'In a shop, the customer asks questions and the shopkeeper answers. "How much is this?" "It is ten rupees."',
        'Good shop talk is polite and clear. Use "please", "thank you" and "here you are".',
      ],
      model: { text: 'Customer: Good morning! May I have two bananas, please? Shopkeeper: Of course. Here you are. Customer: Thank you! Shopkeeper: Have a lovely day!', noticing: ['Hello first.', 'Please and thank you.', 'A friendly goodbye.'] },
      drills: [
        { title: 'The customer', brief: 'Pretend you are in a fruit shop. Say hello, ask for two things politely and say thank you.', targetSeconds: 20 },
        { title: 'The shopkeeper', brief: 'Now you are the shopkeeper! Welcome the customer, tell them what you sell today and what is special.', targetSeconds: 30 },
      ],
      game: { name: 'Classroom Market', emoji: '🛒', how: ['Set up a pretend shop with toys or pictures.', 'Pairs take turns being the shopkeeper and the customer.', 'The mentor gives a star for every "please" and "thank you".'] },
      realWorld: 'Buying a snack at a shop or ordering your food at a restaurant.',
      mentorWatchFor: ['Grabbing instead of asking — replay with manners.', 'Mumbled requests — ask for the "shop voice".'],
      selfCheck: ['Did I say please and thank you?', 'Did I speak clearly?'],
      homeTip: 'Next time you are at a shop or café, let your child ask for one thing themselves. Stand close and cheer them on.',
    },
    {
      title: 'Hello, Grandma! A pretend phone call',
      oneLine: 'On a phone call, my voice has to do all the work, because nobody can see me.',
      idea: [
        'On the phone, people cannot see your smile or your hands. So your voice must be clear, not too fast, and friendly.',
        'A phone call has a start ("Hello, it is me!"), a middle (your news) and an end ("Bye! Talk soon!").',
      ],
      drills: [
        { title: 'Call Grandma', brief: 'Pretend to call your grandma or a favourite grown-up. Say hello, tell one piece of news, and say goodbye.', targetSeconds: 30 },
        { title: 'Invite a friend', brief: 'Pretend to call a friend and invite them to your birthday party. Tell them the day and what you will do.', targetSeconds: 30 },
      ],
      game: { name: 'Tin Can Telephone', emoji: '📞', how: ['Pairs sit back to back so they cannot see each other.', 'One child "calls" the other and shares a piece of news.', 'The listener repeats the news back. Swap.'] },
      realWorld: 'Talking to a grandparent on a phone or video call.',
      mentorWatchFor: ['Nodding or pointing instead of saying — remind them the phone cannot see.', 'Forgetting to say goodbye.'],
      selfCheck: ['Did my voice do all the work?', 'Did my call have a hello and a goodbye?'],
      homeTip: 'Let your child make (or answer) a real call to a relative this week, with you close by. Help them plan hello, news and goodbye.',
    },
    {
      title: 'The weather reporter',
      oneLine: 'I can look at the sky and tell everyone the weather like a TV reporter.',
      idea: [
        'Weather reporters on TV stand tall, smile and use a clear voice. They tell us what the sky is doing and what to wear.',
        'Start with "Good morning, I am [name] with the weather." Say what the weather is like. End with a tip: "Take your umbrella!"',
      ],
      drills: [
        { title: 'Today’s weather', brief: 'Look out of the window. Report today’s weather like a TV reporter, and give one tip.', targetSeconds: 25 },
        { title: 'Silly weather', brief: 'Report some silly weather: it is raining jelly beans! Tell people what to do.', targetSeconds: 30 },
      ],
      game: { name: 'Weather Wheel', emoji: '🌦️', how: ['Spin a weather wheel or pick a card: sunny, rainy, snowy, windy, stormy.', 'The child reports that weather to the "camera" (a box with a hole).', 'The class acts out the weather as the reporter describes it.'] },
      realWorld: 'Telling your family if it is a good day for the park.',
      mentorWatchFor: ['Looking away from the "camera".', 'Forgetting to introduce themselves.'],
      selfCheck: ['Did I start like a reporter?', 'Did I give a helpful tip?'],
      homeTip: 'Each morning this week, ask your child to be the family weather reporter before school.',
    },
    {
      title: "Chef Mika's cooking show",
      oneLine: 'I can explain how to make something, step by step: first, next, then, last.',
      idea: [
        'Mika the Mic has a cooking show! Chefs on TV explain each step in order, so everyone can follow.',
        'Use step words: FIRST, NEXT, THEN and LAST. Show each step with your hands.',
      ],
      model: { text: 'Today we are making a jam sandwich! First, take two slices of bread. Next, spread jam on one slice. Then, put the other slice on top. Last, cut it in half and enjoy!', noticing: ['First, next, then, last.', 'One step at a time.', 'A happy ending: enjoy!'] },
      drills: [
        { title: 'My sandwich show', brief: 'Explain how to make a sandwich or a glass of lemonade using first, next, then and last.', targetSeconds: 30 },
        { title: 'Silly recipe', brief: 'Invent a silly recipe, like a rainbow cake for a dragon. Explain it step by step.', targetSeconds: 40 },
      ],
      game: { name: 'Robot Chef', emoji: '🤖', how: ['The mentor pretends to be a robot that does EXACTLY what it is told.', 'A child gives step-by-step instructions to make a pretend sandwich.', 'If a step is missing, the robot gets silly. The class helps fix the steps.'] },
      realWorld: 'Helping in the kitchen and telling a friend how to play a game.',
      mentorWatchFor: ['Steps out of order.', 'Missing step words.'],
      selfCheck: ['Did I use first, next, then and last?', 'Could someone follow my steps?'],
      homeTip: 'Make something simple together, like a fruit bowl. Your child is the TV chef and explains every step.',
    },
    {
      title: 'Teddy goes to the doctor',
      oneLine: 'I can explain how someone feels and what is wrong, so they can get help.',
      idea: [
        'When Teddy is sick, he needs to tell the doctor what hurts. The doctor asks questions and Teddy answers clearly.',
        'Being able to say "My tummy hurts" or "I feel sad because…" is one of the most important kinds of talking there is.',
      ],
      drills: [
        { title: 'Teddy tells the doctor', brief: 'Pretend to be Teddy. Tell the doctor what hurts, when it started and how you feel.', targetSeconds: 25 },
        { title: 'Doctor asks', brief: 'Now be the doctor! Ask Teddy three kind questions, then tell Teddy what to do to feel better.', targetSeconds: 35 },
      ],
      game: { name: 'Teddy Clinic', emoji: '🧸', how: ['Children bring teddies to the pretend clinic.', 'Pairs take turns as doctor and teddy’s voice.', 'The doctor must ask "What hurts?", "Since when?" and "How do you feel?"'] },
      realWorld: 'Telling a teacher, parent or doctor when you feel unwell or upset.',
      mentorWatchFor: ['Children who cannot name feelings — offer words: worried, tired, sad, sore.', 'Rushed answers.'],
      selfCheck: ['Did I say what was wrong clearly?', 'Did I use a feeling word?'],
      homeTip: 'Play doctor with a teddy at home. Help your child name feelings and body parts clearly.',
    },
  ],
};

/* Grades 1–3 · Module 6 — Curious Questions */
export const FOUNDATION_M6: CourseModule = {
  title: 'Curious Questions',
  outcome: 'Listen with whole-body listening, ask who, what and where questions, and take turns in a conversation.',
  world: { name: "Ollie's Question Forest", emoji: '🦉', color: '#0F766E', tagline: 'Curious ears and curious questions.' },
  lessons: [
    {
      title: 'Who, what, where? Asking questions',
      oneLine: 'Ollie the Owl asks who, what, where, when and why to find out more.',
      idea: [
        'Ollie the Owl is very curious. He learns new things by asking questions that start with question words: who, what, where, when and why.',
        'A question makes your voice go up at the end. Try it: "Where do you live?"',
      ],
      drills: [
        { title: 'Question words', brief: 'Ask Ollie five questions about the forest: one with who, what, where, when and why.', targetSeconds: 25 },
        { title: 'Curious about a friend', brief: 'Pretend a new friend joined your class. Ask them four questions to get to know them.', targetSeconds: 25 },
      ],
      game: { name: 'Question Ball', emoji: '⚽', how: ['Throw a soft ball to a child and call out a question word: "Where!"', 'The child asks a question starting with that word.', 'They throw it to someone who answers, then calls a new question word.'] },
      realWorld: 'Asking the teacher when you do not understand, and getting to know new friends.',
      mentorWatchFor: ['Statements instead of questions.', 'Voices that do not go up at the end.'],
      selfCheck: ['Did I use different question words?', 'Did my voice go up at the end?'],
      homeTip: 'At dinner, your child asks each person one "who, what, where" question about their day.',
    },
    {
      title: 'Listening ears on',
      oneLine: 'Pip the Parrot listens with eyes looking, ears ready, mouth quiet and body still.',
      idea: [
        'Good listening uses your whole body: eyes look at the speaker, ears are ready, mouth is quiet, hands and feet are still.',
        'When you listen well, the speaker feels happy and brave. And you remember what they said!',
      ],
      drills: [
        { title: 'What did Pip hear?', brief: 'Read this once. Then cover it and tell us three things you remember.', passage: 'Pip the Parrot went to the market. He bought four red apples, a blue hat for his friend, and a big bag of seeds. Then he flew home and had a nap.', targetSeconds: 20 },
        { title: 'Tell it back', brief: 'Ask someone at home to tell you about their day. Then tell us what they said.', targetSeconds: 30 },
      ],
      game: { name: 'Simon Says Listen', emoji: '👂', how: ['Play "Simon says" with listening actions: "Simon says eyes on me".', 'Then the mentor tells a tiny story.', 'Children answer one question about the story to "win".'] },
      realWorld: 'Following the teacher’s instructions and remembering what your friend told you.',
      mentorWatchFor: ['Children waiting to talk rather than listening.', 'Fidgeting — praise whole-body listeners by name.'],
      selfCheck: ['Were my eyes, ears, mouth and body listening?', 'Could I remember what was said?'],
      homeTip: 'Tell your child three things you did today. Ask them to say them back to you. Swap!',
      soundLab: ['th'],
    },
    {
      title: 'Interview a friend',
      oneLine: 'I can be a reporter: ask a friend questions, listen, and tell everyone what I found out.',
      idea: [
        'Reporters interview people. They ask questions, listen carefully to the answers and then tell everybody what they learned.',
        'Start with "Hello, can I ask you some questions?" Ask three questions. Say "Thank you!" at the end.',
      ],
      drills: [
        { title: 'Reporter questions', brief: 'Interview someone at home. Ask three questions about their favourite things, then tell us what you found out.', targetSeconds: 40 },
        { title: 'Report back', brief: 'Tell us about the person you interviewed like a reporter: "I met… and I found out…"', targetSeconds: 30 },
      ],
      game: { name: 'Class Reporters', emoji: '🎤', how: ['Pairs interview each other with three questions.', 'Each child introduces their partner to the class.', 'The partner gives a thumbs up if the reporter got it right.'] },
      realWorld: 'Getting to know a new classmate or a visitor at home.',
      mentorWatchFor: ['Reporters talking about themselves instead.', 'Not listening to answers — check by asking the class.'],
      selfCheck: ['Did I ask three questions?', 'Did I tell the answers correctly?'],
      homeTip: 'Let your child interview a grandparent about when they were little. Help them think of three questions.',
    },
    {
      title: 'Taking turns to talk',
      oneLine: 'In a conversation, I talk, then I listen, then I talk — like a game of catch.',
      idea: [
        'Talking with friends is like playing catch. You throw the ball (you talk), and then your friend throws it back (they talk).',
        'If one person holds the ball all the time, the game is no fun. Wait for your turn, and give others a turn too.',
      ],
      drills: [
        { title: 'Catch conversation', brief: 'Have a conversation about favourite games with someone at home. Talk, listen, talk — at least three turns each.', targetSeconds: 45 },
        { title: 'Ask it back', brief: 'Say what you like to do on weekends, then ask "What about you?" and answer their answer with one more thing.', targetSeconds: 30 },
      ],
      game: { name: 'Talking Ball', emoji: '🏐', how: ['Only the child holding the ball may talk.', 'They say one sentence about a topic and pass the ball.', 'Anyone talking without the ball sits out one turn.'] },
      realWorld: 'Chatting with friends at lunch and playing games together.',
      mentorWatchFor: ['Children who interrupt — use the ball.', 'Children who never take the ball — pass it to them gently.'],
      selfCheck: ['Did I wait for my turn?', 'Did I give others a turn?'],
      homeTip: 'Use a "talking spoon" at dinner. Only the person holding it talks. Everyone gets a turn.',
    },
    {
      title: 'Magic words: please, thank you, excuse me',
      oneLine: 'Magic words make people happy to listen and happy to help.',
      idea: [
        'Some words are magic: please, thank you, sorry and excuse me. They make people feel respected.',
        'Use "excuse me" when you need to talk and someone else is talking. Say "please" when you ask, and "thank you" when someone helps.',
      ],
      drills: [
        { title: 'Magic word moments', brief: 'Show us how you would ask a teacher for help, say sorry for bumping someone and thank a friend. Use magic words!', targetSeconds: 30 },
        { title: 'Excuse me, please', brief: 'Pretend two grown-ups are talking and you need to ask something. Show how to politely join in.', targetSeconds: 20 },
      ],
      game: { name: 'Magic Word Wands', emoji: '🪄', how: ['The mentor acts out a situation: dropping pencils, needing water, wanting a turn.', 'A child waves a pretend wand and uses the right magic word.', 'The class says "Magic!" when it is right.'] },
      realWorld: 'Asking for help at school, at a shop, or at a friend’s house.',
      mentorWatchFor: ['Rushed or mumbled magic words.', 'Interrupting without "excuse me".'],
      selfCheck: ['Did I use magic words?', 'Did I say them clearly and kindly?'],
      homeTip: 'Count magic words at home for one day. Give a sticker for every clear "please" and "thank you".',
    },
    {
      title: 'Treasure map directions',
      oneLine: 'I can give directions so clearly that my friend finds the treasure.',
      idea: [
        'Directions help people find things. Use direction words: forward, back, left, right, up, down, next to, under.',
        'Give one step at a time and wait until your friend has done it. Then give the next one.',
      ],
      drills: [
        { title: 'Find the treasure', brief: 'Hide a toy in a room. Give someone directions to find it, one step at a time, using direction words.', targetSeconds: 40 },
        { title: 'Way to my room', brief: 'Tell us how to get from your front door to your bedroom, step by step.', targetSeconds: 30 },
      ],
      game: { name: 'Pirate Treasure Hunt', emoji: '🏴‍☠️', how: ['Hide a "treasure" in the room.', 'One child is the captain and gives directions to a blindfolded or eyes-closed pirate.', 'The pirate follows step by step until the treasure is found.'] },
      realWorld: 'Telling someone where you left your bag, or how to find your classroom.',
      mentorWatchFor: ['Pointing instead of saying.', 'Too many steps at once.'],
      selfCheck: ['Did I use direction words?', 'Did I give one step at a time?'],
      homeTip: 'Hide a small treat at home. Your child gives YOU directions to find it — only words, no pointing!',
    },
  ],
};
