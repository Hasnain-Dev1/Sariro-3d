import type { CourseModule } from '../types';

/* Grades 1–3 · Module 3 — Brave Like Leo */
export const FOUNDATION_M3: CourseModule = {
  title: 'Brave Like Leo',
  outcome: 'Feel the butterflies, use a brave trick, and talk in front of the whole class anyway.',
  world: { name: 'Brave Lion Hills', emoji: '🦁', color: '#EA580C', tagline: 'Butterflies are okay. Brave is doing it anyway.' },
  lessons: [
    {
      title: 'Butterflies in my tummy',
      oneLine: 'Bunny Bea gets butterflies before she talks, and that is okay — it means something exciting is happening.',
      idea: [
        'Bunny Bea feels a wobbly tummy before she talks in front of people. Her ears go hot and her paws feel shaky. Do you ever feel like that?',
        'Those feelings are called butterflies. Everyone gets them, even grown-ups on TV. Butterflies do not mean you cannot do it. They mean your body is getting ready!',
      ],
      drills: [
        { title: 'How I feel', brief: 'Tell us about a time you felt butterflies in your tummy. What happened?', targetSeconds: 25 },
        { title: 'Brave Bunny Bea', brief: 'Read this story about Bunny Bea in a calm, brave voice.', passage: 'Bunny Bea had to sing at the school show. Her tummy felt wobbly. Her ears felt hot. Then she took a big breath and said, "I can do this." And she sang the whole song!', targetSeconds: 25 },
      ],
      game: { name: 'Butterfly Flap', emoji: '🦋', how: ['Everyone flaps their hands fast like nervous butterflies.', 'The mentor says "Slow butterflies" and hands flap slower and slower.', 'When hands are still, one child says one sentence about their day.'] },
      realWorld: 'The wobbly feeling before a school play, a class reading or a birthday song.',
      mentorWatchFor: ['Children who say they are "never scared" — normalise it, do not force.', 'Children who look worried — reassure that the class is a friendly place.'],
      selfCheck: ['Can I name my butterflies?', 'Did I talk even with butterflies?'],
      homeTip: 'Tell your child about a time YOU felt butterflies and did something anyway. Children love knowing grown-ups get nervous too.',
    },
    {
      title: 'Balloon breathing',
      oneLine: 'When I feel wobbly, I blow up my tummy like a balloon and slowly let the air out.',
      idea: [
        'Here is a brave trick. Put your hand on your tummy. Breathe in through your nose and make your tummy big like a balloon.',
        'Now let the air out slowly through your mouth, like a balloon going down. Do it three times. Your body feels calmer, and your voice gets steadier.',
      ],
      drills: [
        { title: 'Three balloons, then hello', brief: 'Do three balloon breaths. Then say "Hello everyone, today I feel ready!" in a calm voice.', targetSeconds: 15 },
        { title: 'Breathe and tell', brief: 'Do three balloon breaths. Then tell us about your favourite game in a calm, steady voice.', targetSeconds: 30 },
      ],
      game: { name: 'Balloon Party', emoji: '🎈', how: ['Everyone breathes in and grows tall like a balloon being blown up.', 'Breathe out slowly and sink down like a balloon losing air.', 'After three balloons, the calmest child starts a story round.'] },
      realWorld: 'Calming down before you go on stage, or before a test.',
      mentorWatchFor: ['Shoulders lifting instead of tummies — hands on tummies.', 'Breathing too fast — count slowly together.'],
      selfCheck: ['Did my tummy go out like a balloon?', 'Did I feel calmer after?'],
      homeTip: 'Practise three balloon breaths together at bedtime. Remind your child they can use it before talking at school.',
    },
    {
      title: 'The superhero pose',
      oneLine: 'Standing like a superhero helps me feel brave before I talk.',
      idea: [
        'Superheroes stand tall: feet apart, hands on hips, chin up, big smile. Try it now!',
        'When you stand like a superhero, you feel bigger and braver. Do it for a few seconds before you speak.',
      ],
      drills: [
        { title: 'Super me!', brief: 'Stand in your superhero pose. Then say "I am brave, I am strong, I can speak!" in a big voice.', targetSeconds: 10 },
        { title: 'My superpower', brief: 'Stand like a superhero and tell us what superpower you would have, and how you would help people.', targetSeconds: 30 },
      ],
      game: { name: 'Superhero Freeze', emoji: '🦸', how: ['Play music. Everyone dances.', 'When the music stops, freeze in a superhero pose.', 'The mentor taps one hero, who says their superhero name and power.'] },
      realWorld: 'Getting ready to answer a question in front of the class.',
      mentorWatchFor: ['Slouching after the pose — keep the tall back while talking.', 'Silliness taking over — bring back calm before speaking.'],
      selfCheck: ['Did I stand tall?', 'Did I feel braver?'],
      homeTip: 'Before school, do a superhero pose together at the door for five seconds. Say "Brave voice today!"',
    },
    {
      title: 'Oops! Mistakes are okay',
      oneLine: 'If I say a wrong word, I just say "oops" and keep going.',
      idea: [
        'Everyone makes mistakes when they talk. Even the news reader on TV! The trick is not to stop and cry, but to fix it and keep going.',
        'Say "Oops, I mean…" and carry on. Your friends will not even remember the mistake. They will remember that you kept going.',
      ],
      model: { text: 'My favourite animal is the elephant. It has a long nose called a… oops, I mean trunk! It uses its trunk to drink water.', noticing: ['He made a mistake.', 'He said "oops, I mean…"', 'He kept going happily.'] },
      drills: [
        { title: 'Oops and go on', brief: 'Talk about your favourite animal. Make one silly mistake on purpose, say "Oops, I mean…" and keep going.', targetSeconds: 25 },
        { title: 'Tricky story', brief: 'Read this story. If you get a word wrong, say "oops" and read it again.', passage: 'A spotty giraffe wanted a scarf. Her neck was very, very long. Grandma Goat knitted and knitted for seven days. At last the scarf was ready, and the giraffe was warm and happy.', targetSeconds: 25 },
      ],
      game: { name: 'The Oops Bell', emoji: '🔔', how: ['A child tells a short story.', 'When the mentor rings a bell, the child must say a silly wrong word.', 'They say "Oops, I mean…", fix it and carry on. Everyone cheers the fix.'] },
      realWorld: 'Reading aloud in class and getting a word wrong — and carrying on.',
      mentorWatchFor: ['Children who stop completely after a mistake.', 'Laughing AT someone — model laughing together, then cheering.'],
      selfCheck: ['Did I keep going after a mistake?', 'Did I feel okay?'],
      homeTip: 'Make a mistake on purpose when you read aloud, then say "Oops, I mean…" and smile. Your child learns mistakes are normal.',
    },
    {
      title: 'Stand like a tree, look like a friend',
      oneLine: 'I stand still like a tree and look at my friends when I talk.',
      idea: [
        'When we are nervous, our feet dance, our hands wiggle and our eyes look at the floor. Then people watch the wiggles, not our words.',
        'Be a tree: roots in the ground, feet still. And look at your friends’ faces, one by one, like you are saying hello with your eyes.',
      ],
      drills: [
        { title: 'Tree talk', brief: 'Stand like a tree with still feet. Tell us what you did yesterday, and look into the camera like it is a friend.', targetSeconds: 25 },
        { title: 'Tree in the wind', brief: 'Stand still like a tree and tell us about the weather today. Only your hands may move, like branches.', targetSeconds: 25 },
      ],
      game: { name: 'Statue Speakers', emoji: '🌳', how: ['A child stands like a tree and says three sentences.', 'The class watches for moving feet.', 'If the feet stayed still, the class says "Strong tree!"'] },
      realWorld: 'Standing in front of the class to share your news.',
      mentorWatchFor: ['Rocking and swaying.', 'Eyes on the floor — play "look at the friend in red".'],
      selfCheck: ['Were my feet still?', 'Did I look at people?'],
      homeTip: 'Play statues: your child tells you a joke while standing completely still. If they wobble, they tell it again.',
    },
    {
      title: 'Talking to the whole class',
      oneLine: 'I can use all my brave tricks and talk to my whole class.',
      idea: [
        'You have learned lots of brave tricks: balloon breathing, the superhero pose, "oops and go on", and standing like a tree.',
        'Today, use them all. Breathe, stand tall, look at your friends and tell them something you really want to share.',
      ],
      drills: [
        { title: 'My brave news', brief: 'Use balloon breathing and the superhero pose. Then tell the class your best news from this week.', targetSeconds: 30 },
        { title: 'Brave and proud', brief: 'Tell us about something you can do now that you could not do before. How did you learn it?', targetSeconds: 40 },
      ],
      game: { name: 'Brave Badge Ceremony', emoji: '🏅', how: ['Each child chooses one brave trick before they speak.', 'They share their news with the class.', 'Everyone gives them a "brave badge" (a sticker or a drawn star) and a cheer.'] },
      realWorld: 'Speaking up in morning circle, class assembly or a family gathering.',
      mentorWatchFor: ['Which brave trick each child chooses — note for later lessons.', 'Children still unable to speak — let them speak to one friend first.'],
      selfCheck: ['Which brave trick did I use?', 'Did I talk to the whole class?'],
      homeTip: 'Ask your child which brave trick they like best. Use it together before the next family video call.',
    },
  ],
};

/* Grades 1–3 · Module 4 — Storytime (five lessons; slot 24 is the showcase) */
export const FOUNDATION_M4: CourseModule = {
  title: 'Storytime',
  outcome: 'Tell a short story with a beginning, a middle and an end, and give the characters their own voices.',
  world: { name: "Ollie's Story Tree", emoji: '🌳', color: '#7C3AED', tagline: 'Every story has a start, a middle and a happy end.' },
  lessons: [
    {
      title: 'Once upon a time: beginning, middle, end',
      oneLine: 'Ollie the Owl says every story needs a beginning, a middle and an end.',
      idea: [
        'Ollie the Owl lives in the Story Tree and knows every story in the world. He says all stories have three parts.',
        'The BEGINNING tells who and where. The MIDDLE is when something happens — a problem! The END is how it gets fixed.',
      ],
      model: { text: 'Beginning: Once upon a time, a little duck lived by a pond. Middle: One day, she lost her way in the tall grass. End: She followed the sound of the water and found her way home.', noticing: ['Who and where.', 'The problem.', 'How it was fixed.'] },
      drills: [
        { title: 'Ollie’s three parts', brief: 'Read this story. Make a little stop between the beginning, the middle and the end.', passage: 'Once upon a time, a little duck lived by a pond. One day, she lost her way in the tall grass. She followed the sound of the water, and she found her way home.', targetSeconds: 20 },
        { title: 'My own three-part story', brief: 'Make up a story about a lost kitten. Tell the beginning, the middle and the end.', targetSeconds: 35 },
      ],
      game: { name: 'Story Sandwich', emoji: '🥪', how: ['The top bread is the beginning, the filling is the middle, the bottom bread is the end.', 'Three children make one story together: one part each.', 'The class checks: did the sandwich have all three parts?'] },
      realWorld: 'Telling your family what happened at school today, in order.',
      mentorWatchFor: ['Stories with no problem in the middle.', 'Stories that never end — "And then… and then…"'],
      selfCheck: ['Did my story have a beginning, middle and end?', 'Was there a problem that got fixed?'],
      homeTip: 'At bedtime, ask your child to tell a story in three parts. Hold up one, two, three fingers as they go.',
    },
    {
      title: 'Funny voices for story characters',
      oneLine: 'Each character in my story can have their own special voice.',
      idea: [
        'Stories are more fun when the giant sounds big and the mouse sounds tiny. You already know high, low, big and small voices!',
        'Give each character a voice, and use your own normal voice for the storyteller parts.',
      ],
      drills: [
        { title: 'Two characters', brief: 'Read this story with a big deep voice for the giant and a tiny squeaky voice for the mouse.', passage: 'A giant walked through the forest. "Who is there?" he said in a big deep voice. "Only me," said a tiny mouse. "Please do not step on me!" The giant smiled and sat down very carefully.', targetSeconds: 25 },
        { title: 'Three little pigs', brief: 'Tell a short part of The Three Little Pigs. Give the wolf and a pig different voices.', targetSeconds: 35 },
      ],
      game: { name: 'Voice Swap', emoji: '🎙️', how: ['The mentor names a character: a king, a baby, a robot, a witch.', 'Each child says "Where is my lunch?" in that character’s voice.', 'The class votes for the most fun voice.'] },
      realWorld: 'Reading a story to your little cousin and making them laugh.',
      mentorWatchFor: ['All characters sounding the same.', 'The storyteller voice getting lost.'],
      selfCheck: ['Did each character sound different?', 'Could people tell who was talking?'],
      homeTip: 'Read a picture book together. You read the storyteller part, and your child does all the character voices.',
    },
    {
      title: 'What happens next? The story chain',
      oneLine: 'I can listen to my friend’s story and add what happens next.',
      idea: [
        'A story chain is a story that friends make together. One person starts, and the next person adds a sentence.',
        'To add a good sentence, you must listen very carefully to what came before. Then add something new and exciting.',
      ],
      drills: [
        { title: 'Add the next part', brief: 'Here is the start: "A dragon knocked on my door." Say what happens next, and then what happens after that.', targetSeconds: 25 },
        { title: 'Finish the story', brief: 'Here is the start and middle: "A robot came to school. It did not know how to play." Tell us how the story ends.', targetSeconds: 30 },
      ],
      game: { name: 'Story Chain Circle', emoji: '⛓️', how: ['Sit in a circle. The mentor says the first sentence.', 'Each child adds one sentence, keeping the story going.', 'The last child must end it with "…and they lived happily ever after."'] },
      realWorld: 'Making up games and stories with your friends at playtime.',
      mentorWatchFor: ['Children who ignore what came before.', 'Stories drifting into silliness — bring them back to the problem.'],
      selfCheck: ['Did I listen to the part before mine?', 'Did my part make sense?'],
      homeTip: 'On a car ride, make a story chain: you say one sentence, your child says the next. Keep going until someone ends it.',
    },
    {
      title: 'Telling a story from pictures',
      oneLine: 'I can look at pictures and turn them into a story.',
      idea: [
        'Pictures can tell stories without words. Look at each picture and ask: Who is there? What are they doing? What happens next?',
        'Then join the pictures with words like "First", "Then" and "At the end".',
      ],
      drills: [
        { title: 'Three pictures', brief: 'Imagine three pictures: a boy with a kite, the kite stuck in a tree, a girl climbing up to help. Tell the story using First, Then and At the end.', targetSeconds: 30 },
        { title: 'Draw and tell', brief: 'Draw three quick pictures of a story. Then tell it using your pictures.', targetSeconds: 40 },
      ],
      game: { name: 'Picture Walk', emoji: '🖼️', how: ['Put three picture cards on the floor.', 'A child walks from picture to picture telling the story.', 'Shuffle the cards and see if a new story can be told.'] },
      realWorld: 'Explaining a picture book or a comic to a friend.',
      mentorWatchFor: ['Naming what is in the picture ("a boy, a kite") instead of telling a story.', 'Forgetting joining words.'],
      selfCheck: ['Did I use First, Then and At the end?', 'Did the pictures become a story?'],
      homeTip: 'Take three photos from your phone gallery. Ask your child to make up a story that joins them.',
    },
    {
      title: 'Retelling a story I love',
      oneLine: 'I can tell a story I know in my own words, with voices and feelings.',
      idea: [
        'You know lots of stories: fairy tales, stories from books and stories grandparents tell. Retelling means telling it in your OWN words.',
        'Remember the recipe: beginning, middle and end. Add character voices and feelings. You are the storyteller now!',
      ],
      drills: [
        { title: 'A fairy tale, my way', brief: 'Retell a fairy tale you love, like Goldilocks, in your own words. Remember the beginning, middle and end.', targetSeconds: 40 },
        { title: 'Grandma’s story', brief: 'Tell a story someone in your family told you, or a story from your favourite book.', targetSeconds: 45 },
      ],
      game: { name: 'Storyteller’s Chair', emoji: '🪑', how: ['Put a special "storyteller’s chair" at the front.', 'The child in the chair retells a story they love.', 'Listeners hold up a hand when they hear the problem, and clap at the happy end.'] },
      realWorld: 'Telling a story at a sleepover or a family get-together.',
      mentorWatchFor: ['Children reciting word for word — encourage their own words.', 'Very long retellings — help pick the main parts.'],
      selfCheck: ['Did I use my own words?', 'Did I do voices and feelings?'],
      homeTip: 'Swap roles: tonight, your child tells YOU the bedtime story, in their own words.',
    },
  ],
};
