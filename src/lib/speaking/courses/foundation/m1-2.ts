import type { CourseModule } from '../types';

/* Grades 1–3 · Module 1 — Hello, Voice! */
export const FOUNDATION_M1: CourseModule = {
  title: 'Hello, Voice!',
  outcome: 'Say hello to a group, and use a loud, soft, high, low, slow and happy voice on purpose.',
  world: { name: "Mika's Music Park", emoji: '🎤', color: '#16A34A', tagline: 'Meet your voice and all the things it can do.' },
  lessons: [
    {
      title: 'Hello! This is me',
      oneLine: 'Mika the Mic says: everybody starts somewhere, and today is my start.',
      idea: [
        'Mika is a little microphone who loves to hear children talk. Mika says there is no wrong way to start. You just say hello!',
        'Today you will say who you are. It is your first recording. Later, you will listen to it again and see how much you have grown.',
      ],
      model: { text: 'Hello! My name is Aarav. I am seven years old. I love dinosaurs, and my favourite one is the T-rex!', noticing: ['He says his name first.', 'He tells us one thing he loves.', 'He sounds happy, like he is talking to a friend.'] },
      drills: [
        { title: 'Hello, Mika!', brief: 'Say hello, your name, how old you are, and one thing you love. Smile while you talk!', targetSeconds: 15 },
        { title: 'Two things I love', brief: 'Say your name, then tell us two things you love and why you love one of them.', targetSeconds: 25 },
      ],
      game: { name: 'Pass the Mic', emoji: '🎤', how: ['Sit in a circle. Pass a toy microphone (or a spoon!) around.', 'Whoever holds it says "Hello, my name is…" and one thing they love.', 'Everyone waves hello back. Go round again, a little louder.'] },
      realWorld: 'Saying hello to your new class on the first day of school.',
      mentorWatchFor: ['Children who whisper — praise any attempt, do not push yet.', 'Children who say only their name — prompt with "And what do you love?"'],
      selfCheck: ['Did I say my name?', 'Did I smile?'],
      homeTip: 'At dinner, pass a spoon around like a microphone. Whoever holds it says one thing they loved today. Everyone claps.',
    },
    {
      title: "Leo's lion voice and the mouse voice",
      oneLine: 'Leo the Lion can roar and a mouse can squeak — I can choose a big voice or a small voice.',
      idea: [
        'Leo the Lion has a BIG voice. A little mouse has a tiny voice. You have both!',
        'When lots of people are listening, use your Leo voice, so the friend at the very back can hear. A big voice is not shouting. It is strong and clear, from your tummy.',
      ],
      model: { text: 'Mouse voice: "I like apples." Leo voice: "I LIKE APPLES!" Just right: "I like apples." (clear enough for the back of the room)', noticing: ['The mouse voice is too quiet for a room.', 'Shouting hurts ears.', 'The Leo voice is strong but still kind.'] },
      drills: [
        { title: 'Mouse, then Leo', brief: 'Say "Good morning, everyone!" in a tiny mouse voice. Then say it in your big, strong Leo voice. Record the Leo one!', targetSeconds: 10 },
        { title: 'Leo reads a poem', brief: 'Read this little poem in your Leo voice, so someone far away can hear you.', passage: 'I am a lion, big and strong. I can roar all day long. But when I talk to friends in school, a clear, kind voice is the rule.', targetSeconds: 20 },
      ],
      game: { name: 'Volume Dial', emoji: '🎚️', how: ['The mentor holds up fingers: one finger is a mouse voice, five fingers is a lion voice.', 'Everyone says the same sentence at the volume shown.', 'Finish on three fingers — the "whole classroom" voice.'] },
      realWorld: 'Answering the teacher so the whole class hears you the first time.',
      mentorWatchFor: ['Shouting instead of projecting — model breathing from the tummy.', 'Shy children: let them roar with the whole group first.'],
      selfCheck: ['Could someone at the back of the room hear me?', 'Was my voice strong, not shouty?'],
      homeTip: 'Stand at the other end of a room and ask your child to tell you what they ate for lunch in their "Leo voice". Clap when you hear every word.',
    },
    {
      title: 'Up high, down low: animal voices',
      oneLine: 'My voice can go up like a bird and down like a bear — that makes talking fun to listen to.',
      idea: [
        'A tiny bird goes "tweet, tweet" up high. A big bear goes "grrr" down low. Your voice can go high and low too.',
        'When your voice goes up and down, people love listening. When it stays flat like a robot, people get sleepy!',
      ],
      drills: [
        { title: 'Bird, bear, me', brief: 'Say "Hello, my friend" like a tiny bird, then like a big bear, then in your own happy voice.', targetSeconds: 15 },
        { title: 'The animal parade', brief: 'Read this story and make your voice go high for the mouse and low for the elephant.', passage: 'Down the road came a little mouse. "Squeak, squeak," she said, very high. Then came a big elephant. "Hello, little mouse," he said, very low. And they walked home together.', targetSeconds: 25 },
      ],
      extraDrills: [
        { title: 'Robot or real?', brief: 'Say "I love going to the park" like a robot. Then say it like a real, excited child.', targetSeconds: 10 },
      ],
      game: { name: 'Animal Voice Guess', emoji: '🐘', how: ['A child picks a secret animal card.', 'They say "Good morning, class" in that animal’s voice — high or low, big or small.', 'The class guesses the animal. The best guesser goes next.'] },
      realWorld: 'Reading a bedtime story to a younger brother, sister or cousin.',
      mentorWatchFor: ['Flat, robot voices — play the bird and bear game again.', 'Children copying exactly — encourage their own version.'],
      selfCheck: ['Did my voice go up and down?', 'Did I sound like a real person, not a robot?'],
      homeTip: 'Read one page of a picture book together. Your child does the voices: high for small animals, low for big ones.',
    },
    {
      title: 'Tara the Turtle says slow down',
      oneLine: 'Tara the Turtle talks slowly and stops at every full stop, so everyone understands her.',
      idea: [
        'When we are excited, our words run like a rabbit and bump into each other. Tara the Turtle never rushes.',
        'Tara has a trick: at every full stop, she stops and counts "one" in her head. Then she takes a little breath and goes on.',
      ],
      model: { text: 'The sun came up. The birds began to sing. And then, very slowly, the little bear opened one eye.', noticing: ['Stop at each full stop.', 'Wait a tiny bit longer before "very slowly".'] },
      drills: [
        { title: 'Tara reads', brief: 'Read this like Tara the Turtle. At every full stop, stop and count "one" in your head.', passage: 'The sun came up. The birds began to sing. And then, very slowly, the little bear opened one eye.', targetSeconds: 15 },
        { title: 'Rabbit, then turtle', brief: 'Read this very fast like a rabbit. Then read it slowly like Tara. Record the turtle one!', passage: 'Mia found a map under her bed. It showed a big red cross in the garden. She took a spoon and started to dig. What did she find? A box of shiny buttons!', targetSeconds: 25 },
      ],
      game: { name: 'Turtle Race', emoji: '🐢', how: ['Everyone reads the same short passage.', 'The winner is NOT the fastest — it is the one who stops at every full stop.', 'The class holds up a turtle thumb for every stop they hear.'] },
      realWorld: 'Reading a sentence aloud in class so everyone can follow.',
      mentorWatchFor: ['Rushing through full stops.', 'Holding breath — remind them to breathe at the stop.'],
      selfCheck: ['Did I stop at the full stops?', 'Did I take little breaths?'],
      homeTip: 'When your child tells you something exciting, say "Turtle talk, please!" and let them tell it again slowly. Praise the slow version.',
      soundLab: ['silent'],
    },
    {
      title: 'Happy, sad, surprised: voices with feelings',
      oneLine: 'My voice can show how I feel, so people feel it too.',
      idea: [
        'Say "It is raining" in a happy voice. Now say it in a sad voice. The words are the same, but the feeling is different!',
        'Good speakers put feelings in their voice. If your story is exciting, sound excited. If it is a sad part, go softer and slower.',
      ],
      drills: [
        { title: 'Three feelings', brief: 'Say "We are going to the zoo" three ways: happy, sad and surprised.', targetSeconds: 15 },
        { title: 'The lost balloon', brief: 'Read this story. Sound happy at the start, sad in the middle and surprised at the end.', passage: 'Riya had a big red balloon. She loved it so much. Then the wind blew it away, up into the sky. Riya was very sad. But the next morning, the balloon was stuck in her window!', targetSeconds: 25 },
      ],
      game: { name: 'Feelings Faces', emoji: '🎭', how: ['The mentor holds up a face card: happy, sad, angry, scared or surprised.', 'Everyone says "My cat ate my sandwich" with that feeling.', 'Children take turns picking the card for the class.'] },
      realWorld: 'Telling your family about your day so they feel how exciting it was.',
      mentorWatchFor: ['Faces showing feeling but voices staying flat.', 'Over-acting that becomes shouting.'],
      selfCheck: ['Could someone hear my feeling?', 'Did my face match my voice?'],
      homeTip: 'Play "guess my feeling": you say "Dinner is ready" in a feeling voice, and your child guesses it. Then swap.',
    },
    {
      title: "Pip the Parrot's copycat game",
      oneLine: 'Pip the Parrot listens very carefully, so he can say it back exactly — good speakers are good listeners.',
      idea: [
        'Pip the Parrot is the best listener in the park. He listens to every word, then says it back, word for word.',
        'When you listen carefully, you learn how words should sound. Then you can say them clearly too.',
      ],
      drills: [
        { title: 'Copy Pip', brief: 'Listen to someone read this sentence (or read it once yourself), then say it back clearly without looking.', passage: 'Pip the Parrot likes green grapes and yellow bananas.', targetSeconds: 10 },
        { title: 'Pip’s longer message', brief: 'Read this message once, then try to say it back from memory.', passage: 'Please bring your red book, a pencil and a big smile to school tomorrow.', targetSeconds: 15 },
      ],
      game: { name: 'Parrot Chain', emoji: '🦜', how: ['The first child whispers a short sentence to the next.', 'Each child says it back out loud, then whispers it on.', 'At the end, compare: did the sentence stay the same?'] },
      realWorld: 'Remembering exactly what the teacher asked you to bring tomorrow.',
      mentorWatchFor: ['Children who talk while others speak.', 'Guessing words instead of listening — slow the sentence down.'],
      selfCheck: ['Did I listen to every word?', 'Did I say it back clearly?'],
      homeTip: 'Say a funny sentence like "The purple cow ate seven pancakes." Your child copies it like Pip. Make it longer each time.',
      soundLab: ['oo'],
    },
  ],
};

/* Grades 1–3 · Module 2 — Show and Tell */
export const FOUNDATION_M2: CourseModule = {
  title: 'Show and Tell',
  outcome: 'Hold up something special and talk about it: what it is, why you love it, and one fun thing about it.',
  world: { name: 'Treasure Box Town', emoji: '📦', color: '#0891B2', tagline: 'Every treasure has a story to tell.' },
  lessons: [
    {
      title: 'My favourite toy',
      oneLine: 'I can show my favourite toy and say three things about it.',
      idea: [
        'Show and tell has a secret recipe: say WHAT it is, WHY you love it, and one FUN thing about it.',
        'Hold your toy up high, so everyone can see it. Look at your friends, not at the toy!',
      ],
      model: { text: 'This is my teddy bear. His name is Mr Buttons. I love him because he is so soft. A fun thing: he has been to the beach three times!', noticing: ['What it is.', 'Why she loves it.', 'One fun thing.'] },
      drills: [
        { title: 'What, why, fun', brief: 'Hold up your favourite toy. Say what it is, why you love it and one fun thing about it.', targetSeconds: 25 },
        { title: 'My toy talks!', brief: 'Pretend your toy can talk. Let the toy say hello and tell us about YOU.', targetSeconds: 25 },
      ],
      game: { name: 'Three-Finger Show and Tell', emoji: '✋', how: ['Hold up one finger for WHAT, two for WHY, three for FUN.', 'Each child shows a toy and counts on their fingers as they talk.', 'The class counts along with them.'] },
      realWorld: 'Showing and telling in class, and telling a new friend about your toys.',
      mentorWatchFor: ['Looking only at the toy.', 'Stopping after "This is my toy" — use the finger prompts.'],
      selfCheck: ['Did I say what, why and one fun thing?', 'Did I look at my friends?'],
      homeTip: 'Before bedtime, your child picks one toy and does a "what, why, fun" show and tell for the family.',
    },
    {
      title: 'Guess what is in the box!',
      oneLine: 'I can describe something so well that my friends can guess it without seeing it.',
      idea: [
        'Describing means painting a picture with words. What colour is it? How big? Is it soft or hard? What does it do?',
        'If your friends can guess it, your words were great!',
      ],
      drills: [
        { title: 'Mystery object', brief: 'Pick something in your room. Do not say its name! Say its colour, its size, how it feels and what it does.', targetSeconds: 25 },
        { title: 'Mystery animal', brief: 'Think of an animal. Describe how it looks, where it lives and what it eats. End with "What am I?"', targetSeconds: 30 },
      ],
      game: { name: 'The Mystery Box', emoji: '🎁', how: ['Put an object in a box or bag without anyone seeing.', 'One child peeks and gives three clues: colour, size, what it does.', 'The class guesses. Whoever guesses right gives the next clues.'] },
      realWorld: 'Telling a shopkeeper or a teacher about something you lost, so they can find it.',
      mentorWatchFor: ['Saying the name of the object by accident — celebrate the laugh and restart.', 'Only one clue — ask "What does it feel like?"'],
      selfCheck: ['Did I give colour, size and feel clues?', 'Did my friends guess it?'],
      homeTip: 'Play "I spy with my describing eye" in the car or at home. Give three clues without saying the name.',
    },
    {
      title: 'A picture of my family',
      oneLine: 'I can talk about the people I love, one at a time.',
      idea: [
        'When we talk about our family, we can take our listeners on a little tour. Point to one person, say their name and one special thing about them.',
        'Use joining words: "This is… and this is… and last is…"',
      ],
      drills: [
        { title: 'Family tour', brief: 'Show a picture (or draw one) of your family. Talk about each person: their name and one special thing.', targetSeconds: 30 },
        { title: 'My special person', brief: 'Tell us about one special person in your life. What do you do together? Why do you love them?', targetSeconds: 30 },
      ],
      game: { name: 'Family Portrait Gallery', emoji: '🖼️', how: ['Everyone draws their family on paper (stick people are great!).', 'Children walk to the front like a museum guide.', 'Point to each person and say one special thing.'] },
      realWorld: 'Telling your teacher who is picking you up from school today.',
      mentorWatchFor: ['Children with sensitive family situations — let them choose any special person or a pet.', 'Lists without details — ask "What is special about them?"'],
      selfCheck: ['Did I say one special thing about each person?', 'Did I use "and" to join my sentences?'],
      homeTip: 'Look at a family photo album together. Your child is the tour guide and tells you about each person.',
    },
    {
      title: 'My yummy food',
      oneLine: 'I can make my friends hungry just by talking about my favourite food.',
      idea: [
        'Great describers use their five senses. How does the food look? Smell? Taste? Feel? Does it crunch or slurp?',
        'Words like "crunchy", "sweet", "warm" and "gooey" make people imagine the food.',
      ],
      model: { text: 'My favourite food is my grandma’s mango ice cream. It is cold and sweet and yellow like the sun. When I eat it, it melts on my tongue!', noticing: ['She says how it looks: yellow like the sun.', 'How it feels: cold.', 'How it tastes: sweet.'] },
      drills: [
        { title: 'Yummy words', brief: 'Tell us about your favourite food. Use at least two yummy words, like crunchy, sweet, spicy or soft.', targetSeconds: 25 },
        { title: 'Chef’s special', brief: 'Pretend you own a restaurant. Tell us about your special dish so we all want to eat it!', targetSeconds: 30 },
      ],
      game: { name: 'Taste Word Bingo', emoji: '🍓', how: ['Put six taste words on the board: sweet, sour, crunchy, soft, spicy, cold.', 'Each child talks about a food.', 'The class ticks off every taste word they hear. Can someone use three?'] },
      realWorld: 'Telling your family what you want for your birthday dinner.',
      mentorWatchFor: ['"It is nice" — ask "Nice how? Sweet? Crunchy?"', 'Children who rush — remind them of Tara the Turtle.'],
      selfCheck: ['Did I use yummy words?', 'Would my friends want to eat it?'],
      homeTip: 'At a meal, ask everyone to describe one food on the table using a sense word. Your child goes first.',
      soundLab: ['ea'],
    },
    {
      title: 'My pet, or the pet I wish I had',
      oneLine: 'I can tell a little story about an animal I love.',
      idea: [
        'Talking about a pet is easy when you tell what it looks like, what it does, and something funny it did.',
        'No pet? No problem! Tell us about the pet you dream of having. You can make it as silly as you like.',
      ],
      drills: [
        { title: 'Meet my pet', brief: 'Tell us about your pet, or the pet you wish you had: its name, what it looks like and what it loves to do.', targetSeconds: 25 },
        { title: 'The funny thing my pet did', brief: 'Tell a funny thing your pet did, or a funny thing your dream pet would do.', targetSeconds: 30 },
      ],
      game: { name: 'Pet Show', emoji: '🐶', how: ['Children act as the pet while a friend introduces it.', 'The friend says the pet’s name, looks and favourite thing.', 'The "pet" does a trick when its name is called. Swap roles.'] },
      realWorld: 'Telling a friend about your pet on a playdate.',
      mentorWatchFor: ['Upset about a lost pet — offer the dream pet instead.', 'Very long lists — help pick the one funniest thing.'],
      selfCheck: ['Did I say what my pet looks like?', 'Did I tell something it does?'],
      homeTip: 'Ask your child to introduce a pet, a stuffed animal or a neighbour’s dog to you like a TV presenter.',
    },
    {
      title: 'Show and tell day',
      oneLine: 'I can walk to the front, show something special and talk about it like a star.',
      idea: [
        'Today is a big show and tell! Walk to the front slowly. Stand still. Hold your treasure up high.',
        'Use the recipe: what it is, why you love it, one fun thing. End with "Thank you!" and a smile.',
      ],
      drills: [
        { title: 'My treasure', brief: 'Pick your special treasure. Say what it is, why you love it, one fun thing — and finish with "Thank you!"', targetSeconds: 30 },
        { title: 'Question time', brief: 'Do your show and tell again, then answer this question: "Where did you get it?"', targetSeconds: 40 },
      ],
      game: { name: 'Star of the Show', emoji: '⭐', how: ['Each child walks to the "stage" (a mat or a line of tape).', 'They do their show and tell and say "Thank you!"', 'The class gives one clap for loud voice, one for looking at friends, one for smiling.'] },
      realWorld: 'Show and tell at school, and sharing something special at a family get-together.',
      mentorWatchFor: ['Forgetting "Thank you" — model it with a bow.', 'Shuffling feet — show "tree feet".'],
      selfCheck: ['Did I walk and stand like a star?', 'Did I say thank you at the end?'],
      homeTip: 'Let your child choose something for tomorrow’s show and tell. Practise it once in the living room with a big clap at the end.',
    },
  ],
};
