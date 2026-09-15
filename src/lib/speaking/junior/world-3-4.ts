import { jd, type JuniorLesson } from './types';

/* ── World 3 · Blueprint City — building a talk ───────────────────────────── */

export const JUNIOR_WORLD_3: JuniorLesson[] = [
  {
    number: 13,
    oneLine: 'A great talk is about one big idea you can say in one sentence.',
    idea: [
      'If your talk is about everything, people remember nothing.',
      'Before you start, finish this sentence: "My talk is about…". If you need the word "and" twice, your idea is too big. Make it smaller.',
    ],
    drills: [
      jd(13, 'a', { title: 'My talk in one sentence', brief: 'Pick something you love. Say "My talk is about…" in one sentence. Then say why, in two more sentences.', targetSeconds: 20 }),
      jd(13, 'b', { title: 'Small and clear', brief: 'Talk about "animals" — no, too big! Pick ONE animal and ONE thing about it. Talk for thirty seconds.', targetSeconds: 30 }),
    ],
    realWorld: 'Telling your teacher what your project is about.',
    homeTip: 'Ask "What was your day about, in one sentence?" at dinner. Then ask for one detail.',
  },
  {
    number: 14,
    oneLine: 'Your first sentence is a hook — it catches people like a fish.',
    idea: [
      'There are three great hooks: a question ("Have you ever…?"), a surprise ("Did you know…?"), or a tiny story ("Last Sunday, something strange happened…").',
      'Try all three and pick the one that makes people lean in.',
    ],
    drills: [
      jd(14, 'a', { title: 'Three hooks', brief: 'Talk about rain. Try three starts: a question, a surprise, a tiny story. Say just the first sentence each time.', targetSeconds: 20 }),
      jd(14, 'b', { title: 'Hook and go', brief: 'Choose your best hook and give a thirty-second talk about your favourite season.', targetSeconds: 30 }),
    ],
    realWorld: 'The start of your speech for class monitor.',
    homeTip: 'In the car, take turns inventing the best first sentence for a story about a flying dog.',
  },
  {
    number: 15,
    oneLine: 'Three reasons are the perfect number — and save the best one for last.',
    idea: [
      'People remember three things easily. Four is too many, two feels short.',
      'Put your reasons in order, like building a tower: good, better, BEST.',
    ],
    drills: [
      jd(15, 'a', { title: 'Three reasons', brief: 'Why is your favourite food the best? Give three reasons. Say "First… Second… And best of all…".', targetSeconds: 30 }),
      jd(15, 'b', { title: 'Best for last', brief: 'Why should everyone get a pet? Three reasons, and keep the strongest reason for the end.', targetSeconds: 40 }),
    ],
    realWorld: 'Telling your parents three reasons you should get a new bicycle.',
    homeTip: 'Let your child ask for something (a treat, a later bedtime) — but only with three reasons, best one last.',
  },
  {
    number: 16,
    oneLine: 'Signpost words like "first", "next" and "finally" help people follow your talk.',
    idea: [
      'Listeners cannot see your plan. Signpost words are like road signs that tell them where you are.',
      'Try: first, next, after that, finally. They make your talk easy to follow.',
    ],
    model: { text: 'First, get two slices of bread. Next, spread the jam. After that, press them together. Finally, eat your sandwich!', noticing: ['Four road signs: first, next, after that, finally.', 'You never get lost.'] },
    drills: [
      jd(16, 'a', { title: 'How to make a sandwich', brief: 'Explain how to make your favourite sandwich using first, next, after that, finally.', targetSeconds: 30 }),
      jd(16, 'b', { title: 'My morning', brief: 'Tell us your morning from waking up to school, with signpost words.', targetSeconds: 40 }),
    ],
    realWorld: 'Giving a new student directions around your school.',
    homeTip: 'Cook something simple together. Your child explains each step with a signpost word.',
  },
  {
    number: 17,
    oneLine: 'Finish with a strong last sentence — never "so, yeah, that\'s it".',
    idea: [
      'The last thing you say is what people remember.',
      'End by saying your big idea again, or with a wish, or a question for everyone to think about. Then stop and smile.',
    ],
    drills: [
      jd(17, 'a', { title: 'The mic drop', brief: 'Talk about why friends are important. Finish with one strong sentence, then stop and smile.', targetSeconds: 30 }),
      jd(17, 'b', { title: 'Same start, same end', brief: 'Start your talk with a question about the sea, and end by answering that same question.', targetSeconds: 40 }),
    ],
    realWorld: 'The last line of a birthday wish for your grandma.',
    homeTip: 'After your child tells you something, ask "What is your mic-drop sentence?" and cheer when they find it.',
  },
  {
    number: 18,
    oneLine: 'Cut the extra bits so your best idea shines.',
    idea: [
      'Sometimes we add lots of little details that are not important. They hide the good part.',
      'Say your talk, then say it again in half the time. The important bits stay; the extra bits fall away.',
    ],
    drills: [
      jd(18, 'a', { title: 'Short and sweet', brief: 'Tell us about your best birthday in thirty seconds.', targetSeconds: 30 }),
      jd(18, 'b', { title: 'Even shorter', brief: 'Now tell the same birthday story in fifteen seconds. Only the best part!', targetSeconds: 15 }),
    ],
    realWorld: 'Answering quickly when the teacher says "in one sentence, please".',
    homeTip: 'Play "tweet it": tell something that happened today using no more than ten words.',
  },
];

/* ── World 4 · Stage Street — body, eyes and notes ────────────────────────── */

export const JUNIOR_WORLD_4: JuniorLesson[] = [
  {
    number: 19,
    oneLine: 'Stand still like a strong tree — it makes you look brave.',
    idea: [
      'When we are nervous, we wiggle, sway and play with our hands. People watch the wiggling instead of listening.',
      'Plant your feet like tree roots. Keep your shoulders relaxed. Stand tall and still.',
    ],
    drills: [
      jd(19, 'a', { title: 'Tree talk', brief: 'Stand up with your feet planted like tree roots. Talk about your favourite tree or plant without wiggling.', targetSeconds: 30 }),
      jd(19, 'b', { title: 'Statue challenge', brief: 'Talk about your favourite sport for forty seconds. Try to move only your hands, not your feet.', targetSeconds: 40 }),
    ],
    realWorld: 'Standing in front of the class for show and tell.',
    homeTip: 'Film your child talking for thirty seconds. Watch with the sound off — count the wiggles, then try again.',
  },
  {
    number: 20,
    oneLine: 'Your hands can help tell the story.',
    idea: [
      'Hands can show how big, how small, how fast or how many.',
      'Use your hands on purpose: show "huge" with wide arms, "three" with three fingers. The rest of the time, keep them calm.',
    ],
    drills: [
      jd(20, 'a', { title: 'Show it with your hands', brief: 'Describe the biggest animal you know and the smallest one. Use your hands to show the sizes.', targetSeconds: 30 }),
      jd(20, 'b', { title: 'Three fingers', brief: 'Give three reasons to visit the zoo. Hold up one, two, three fingers as you say them.', targetSeconds: 30 }),
    ],
    realWorld: 'Explaining how big the fish was that you saw at the lake.',
    homeTip: 'Play charades for five minutes. It teaches that hands and faces talk too.',
  },
  {
    number: 21,
    oneLine: 'Look at one person for one sentence, then look at someone else.',
    idea: [
      'If you look at the floor, people feel you are not talking to them.',
      'Pick one face and say a whole sentence to it. Then pick another face. Everyone feels you are talking to them.',
    ],
    drills: [
      jd(21, 'a', { title: 'Talk to the camera friend', brief: 'Put a toy next to the camera. Tell the toy about your favourite game, looking at it the whole time.', targetSeconds: 30 }),
      jd(21, 'b', { title: 'Three faces', brief: 'Put three toys in a row. Say one sentence to each toy about your school.', targetSeconds: 30 }),
    ],
    realWorld: 'Talking to your whole family at a party.',
    homeTip: 'Line up three family members. Your child says one sentence to each person, looking at their eyes.',
  },
  {
    number: 22,
    oneLine: 'Write key words on a card, not your whole talk.',
    idea: [
      'If you read every word from paper, you look at the paper, not the people.',
      'Write just three or four words to remind you — like "dog, park, ball, splash" — and tell the story from your head.',
    ],
    drills: [
      jd(22, 'a', { title: 'Four word card', brief: 'Write four words about a fun day. Tell the story looking at the card only when you need to.', targetSeconds: 40 }),
      jd(22, 'b', { title: 'Peek only twice', brief: 'Tell the same story again. This time you may peek at your card only two times.', targetSeconds: 40 }),
    ],
    realWorld: 'Giving your book report in class.',
    homeTip: 'Let your child make a four-word card before telling you about their day at school.',
    soundLab: ['ea', 'oo'],
  },
  {
    number: 23,
    oneLine: 'When you talk to a camera, pretend a friend is inside it.',
    idea: [
      'A camera does not smile back, so it feels strange to talk to.',
      'Imagine your best friend is inside the lens. Smile, look at the lens, and speak a little slower than normal.',
    ],
    drills: [
      jd(23, 'a', { title: 'News reporter', brief: 'Be a TV news reporter! Tell the camera one piece of news about your day. End with "Back to you in the studio!"', targetSeconds: 30 }),
      jd(23, 'b', { title: 'Friend in the lens', brief: 'Look at the camera lens and tell your friend inside it about a movie you liked.', targetSeconds: 40 }),
    ],
    realWorld: 'Recording a video message for a friend who moved away.',
    homeTip: 'Make a family "news show" on your phone once a week, with your child as the reporter.',
    soundLab: ['c', 'ch'],
  },
];
