import { bd, type BandLesson } from '../types';

/**
 * Grades 7–9 · Worlds 1 and 2 — Voice Valley and Brave Bridge
 *
 * Twelve to fifteen: the years when being watched by classmates starts to
 * matter more than almost anything, and when presentations, debates and
 * elections start to count. Examples are the rooms a teenager is actually in —
 * the classroom, the debate club, the group chat — never a boardroom.
 */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('middle', n, part, x);

export const MIDDLE_WORLD_1: BandLesson[] = [
  {
    number: 1,
    oneLine: 'Nobody is a "natural" — confident speakers are practised, and practice can be measured.',
    idea: [
      'The student who owns every class presentation and wins debates did not get there by luck. They got there by speaking a lot, getting it wrong, and adjusting. Speaking is a skill, and skills respond to practice the same way your maths or your football does.',
      'That also means your progress is measurable: pace, filler words, pauses, how much your voice moves. Today you record a baseline — not to judge it, but so that in a few weeks you have proof of how far you have come.',
    ],
    drills: [
      d(1, 'a', { title: 'Your baseline', brief: 'Talk for forty-five seconds about something you are into right now — a game, a sport, a series, a hobby. Do not plan it. This is your honest starting point.', targetSeconds: 45 }),
      d(1, 'b', { title: 'Cold read', brief: 'Read this passage aloud once without practising. It is your reading baseline.', passage: 'Every expert was once a beginner. The difference between the people who get good and the people who give up is rarely talent. It is whether they kept going through the awkward stage, when trying felt embarrassing and the results were not there yet.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(1, 'c', { title: 'Something you were bad at', brief: 'Talk about a skill you were terrible at to begin with and are better at now. What actually made you improve?', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Students performing "cool indifference" on the baseline — reassure them nobody else hears it.', 'Anyone who says they are just bad at speaking; point to the skill story in the extra drill.'],
    selfCheck: ['What is one number from my baseline I want to change?', 'Did I sound like myself or like someone presenting?'],
    realWorld: 'The first presentation of the school year, when everyone is still working out who is who.',
    writePrompt: 'Write about a skill you improved through practice: what it was like at the start, what you did, and where you are now.',
  },
  {
    number: 2,
    oneLine: 'Your class decides in the first ten seconds whether to listen or scroll mentally.',
    idea: [
      'Your audience is used to content that grabs them instantly — videos that hook in two seconds. A talk that opens with "So, um, today my presentation is on…" loses them before it starts.',
      'Attention is earned with something unexpected: a question they cannot answer yet, a statistic that sounds wrong, a story that starts in the middle, or a claim they want to argue with. Predictability is what kills it.',
    ],
    model: {
      text: 'You check your phone around eighty times a day. By the time you finish school, that is weeks of your life. So who is really in control — you, or the phone?',
      noticing: ['A number that feels personal.', 'A question that makes the audience slightly uncomfortable — in a good way.'],
    },
    drills: [
      d(2, 'a', { title: 'Ten seconds that earn the rest', brief: 'Pick a topic from any subject. Deliver only the first ten to fifteen seconds of a talk, designed so nobody could stop listening.', targetSeconds: 15 }),
      d(2, 'b', { title: 'The predictable version', brief: 'Give the same opening in the most predictable way possible, then immediately redo it with your hook. Keep the hook version going for thirty seconds.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(2, 'c', { title: 'Hook a boring subject', brief: 'Choose the most boring topic you can think of — grammar, rocks, tax — and open a talk on it that makes people want more.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Clickbait hooks that the talk never pays off.', 'Hooks that rely on shock or dark humour — attention is not the same as respect.'],
    selfCheck: ['Would I keep listening after my first sentence?', 'Did my talk deliver what my hook promised?'],
    realWorld: 'Opening a class presentation when half the room would rather be anywhere else.',
    writePrompt: 'Write three openings for the same presentation — a question, a surprising statistic and a mid-story start — and explain which works best.',
  },
  {
    number: 3,
    oneLine: 'The voice that works is the one you use with friends — not your "presentation voice".',
    idea: [
      'Talking with friends, your voice is expressive without trying: it speeds up, slows down, rises when you are excited. The moment you stand in front of the class, many people switch to a flat, careful voice that sounds nothing like them.',
      'That switch is self-consciousness, and audiences hear it as boring. The fix is to hold one real listener in your mind — explain it to them, not to "the class".',
    ],
    drills: [
      d(3, 'a', { title: 'Explaining to a friend', brief: 'Explain something you know well — a game strategy, a recipe, how an app works — as if one friend is sitting across from you.', targetSeconds: 45 }),
      d(3, 'b', { title: 'The same thing, to the class', brief: 'Now explain it again as if presenting to the whole class. Then listen to both. Try to make the class version sound like the friend version.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(3, 'c', { title: 'Voice note energy', brief: 'Explain a school topic as if you were sending a voice note to a friend who missed the lesson.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['The drop in energy between the friend and class versions.', 'Students copying a "YouTuber" voice instead of their own.'],
    selfCheck: ['Which version sounded more like me?', 'What changed in my voice between them?'],
    realWorld: 'Presenting in class without sounding like you are reading from a textbook.',
    soundLab: ['th', 'v-w'],
    writePrompt: 'Write a short explanation of something you know well, the way you would say it to a friend — contractions, examples and all.',
  },
  {
    number: 4,
    oneLine: 'A pause makes you sound in control — and gives your listener time to think.',
    idea: [
      'Nerves speed everyone up. When you rush, your words blur, you run out of breath mid-sentence, and your audience cannot process what you said before the next idea arrives.',
      'A deliberate pause after an important point does three things: it lets the idea land, it gives you a breath, and it signals confidence. It feels endless to you and sounds natural to them.',
    ],
    model: {
      text: 'In nineteen sixty-nine, humans walked on the Moon. The computer that got them there had less power than the phone in your pocket. Think about that. Less power than your phone.',
      noticing: ['A pause after "Think about that."', 'The repeated line lands because of the silence before it.'],
    },
    drills: [
      d(4, 'a', { title: 'Read it with the pauses', brief: 'Read this aloud with a clear pause at each full stop and a longer pause before the final sentence.', passage: 'In nineteen sixty-nine, humans walked on the Moon. The computer that got them there had less power than the phone in your pocket. Think about that. Less power than your phone.', targetSeconds: 20 }),
      d(4, 'b', { title: 'Rushed, then controlled', brief: 'Explain the rules of a sport as fast as you can, then explain them again with a pause after every rule. Keep the controlled version.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(4, 'c', { title: 'The dramatic reveal', brief: 'Tell a short story that ends in a twist. Hold a two-second pause just before you reveal the twist.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Pauses filled with "um" instead of silence.', 'Students who pause mid-phrase rather than after meaning.'],
    selfCheck: ['Where did I pause, and did it help the point land?', 'Did I breathe or run out of air?'],
    realWorld: 'Delivering a speech in assembly or reading aloud in English class.',
    soundLab: ['ed', 's-ending'],
    writePrompt: 'Write a short speech opening of four or five sentences and mark with // the two places you will pause longest.',
  },
  {
    number: 5,
    oneLine: 'Emphasis tells your audience which words matter — a flat voice says none of them do.',
    idea: [
      'The same sentence can mean completely different things depending on which word you stress. A flat delivery forces the listener to guess, and most do not bother.',
      'You have three dials: volume, pitch and pace. Emphasis is not only louder — dropping to a quieter, slower delivery on one key sentence is often more powerful than shouting it.',
    ],
    model: {
      text: 'I never said she stole my phone.',
      noticing: ['Stress "never" — you deny it completely.', 'Stress "phone" — she stole something else.'],
    },
    drills: [
      d(5, 'a', { title: 'Seven meanings', brief: 'Say the sentence seven times, stressing a different word each time, and briefly explain each meaning.', passage: 'I never said she stole my phone.', targetSeconds: 45 }),
      d(5, 'b', { title: 'The quiet line', brief: 'Read this passage normally, but drop your volume and slow down for the final sentence. Notice how it makes people lean in.', passage: 'We practised for months. We gave up weekends, holidays and sleep. We walked onto that stage believing we would win. We came last. And it was the best thing that ever happened to our team.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(5, 'c', { title: 'Sports commentary', brief: 'Commentate the last thirty seconds of an imaginary match, using pace and pitch to build tension towards the final moment.', targetSeconds: 35 }),
    ],
    mentorWatchFor: ['"Emphasis" meaning shouting.', 'Stress on filler words or the end of every sentence.'],
    selfCheck: ['Which word carried the most weight in my last sentence?', 'Did I try quieter emphasis, not just louder?'],
    realWorld: 'Reading dialogue in English class or making a point land in a debate.',
    soundLab: ['stress'],
    writePrompt: 'Write a short persuasive paragraph and bold or underline the single most important word in each sentence.',
  },
  {
    number: 6,
    oneLine: 'Everyone cringes at their own recording — the people who improve listen anyway.',
    idea: [
      'Your voice sounds strange recorded because you normally hear it through your own skull. Everyone else has always heard the recorded version. The cringe is universal and it fades.',
      'Listen with a job, not a judgement: count fillers on the first listen, notice pace on the second, pauses on the third. One specific fix per recording is how you actually get better.',
    ],
    drills: [
      d(6, 'a', { title: 'Baseline, revisited', brief: 'Re-record your baseline talk from lesson one on the same topic, then listen to both back to back.', targetSeconds: 45 }),
      d(6, 'b', { title: 'Say what you hear', brief: 'Listen to one of your recordings, then record a sixty-second self-review: one thing that worked, one habit you noticed, one fix for next time.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(6, 'c', { title: 'Filler hunt', brief: 'Talk for forty-five seconds about your weekend while trying to replace every "like", "um" and "basically" with a silent pause.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Self-reviews that are only negative — insist on something that worked.', 'Students who skip listening and just re-record.'],
    selfCheck: ['What specific habit did I hear?', 'What is my one fix for next time?'],
    realWorld: 'Recording a video submission or voice note for a class assignment.',
    soundLab: ['q', 'silent'],
    writePrompt: 'Write a short self-review of one recording: what worked, the habit you noticed, and the one fix you will try.',
  },
];

export const MIDDLE_WORLD_2: BandLesson[] = [
  {
    number: 7,
    oneLine: 'Nerves and excitement feel identical — the difference is the story you tell yourself.',
    idea: [
      'Racing heart, shaky hands, dry mouth, a voice that wobbles: that is adrenaline, and your body produces exactly the same response before a roller coaster you are looking forward to.',
      'Research on "reappraisal" found that saying "I am excited" rather than "calm down" improves performance, because trying to force calm fights your body. Relabelling the energy works with it. Almost every good speaker still feels nerves — they just use them.',
    ],
    drills: [
      d(7, 'a', { title: 'Talk about nerves, while nervous', brief: 'Talk honestly for forty-five seconds about what happens to you before presenting in front of classmates — body and thoughts.', targetSeconds: 45 }),
      d(7, 'b', { title: 'Reframe and go', brief: 'Say "I am excited" out loud three times, then give a sixty-second talk about something you are looking forward to.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(7, 'c', { title: 'Adrenaline talk', brief: 'Do thirty seconds of star jumps, then immediately give a forty-five-second talk while your heart is still racing. Notice that you can.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Students who claim nerves are a sign they are "bad at this".', 'Mocking between classmates — nerves need a safe room.'],
    selfCheck: ['What does my body do before I speak?', 'Did relabelling it change anything?'],
    realWorld: 'The minutes before a class presentation, a sports trial or a school election speech.',
    writePrompt: 'Write about the physical signs of nerves you experience, and a sentence you will tell yourself next time instead of "calm down".',
  },
  {
    number: 8,
    oneLine: 'Most "stage fright" is really under-preparation — know your structure and fear drops.',
    idea: [
      'Fear feeds on uncertainty: "What if I forget? What comes next?" When you know your first line, your three points and your last line, most of that uncertainty disappears.',
      'This does not mean memorising a script — scripts collapse under pressure because one forgotten word derails everything. A skeleton survives nerves because you can always find the next bone.',
    ],
    drills: [
      d(8, 'a', { title: 'First line, last line, three points', brief: 'Pick a topic — for example "Should phones be allowed in school?" — and say only your first line, three point headlines and your last line.', targetSeconds: 30 }),
      d(8, 'b', { title: 'The same talk, filled in', brief: 'Now give the full ninety-second talk from that skeleton, adding a reason or example to each point.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(8, 'c', { title: 'Skeleton from a subject', brief: 'Build a skeleton on the spot for a topic from history or science you studied this month, and deliver it.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Full scripts smuggled in as "notes".', 'Points that are phrases with no claim.'],
    selfCheck: ['Could I say my skeleton without notes?', 'Did the full talk stick to it?'],
    realWorld: 'Preparing a history presentation or a speech for a student council election.',
    writePrompt: 'Write a talk skeleton on whether phones should be allowed in school: first line, three point headlines and last line.',
  },
  {
    number: 9,
    oneLine: 'Four physical techniques work in the sixty seconds before you speak — "just relax" is not one of them.',
    idea: [
      'Breathing out longer than you breathe in slows your heart rate: in for four, out for eight. Planting your feet and dropping your shoulders tells your body you are not under threat.',
      'Two more: know your first sentence word for word so starting is automatic, and look for one friendly face in the room. None of these require you to feel calm — they work anyway.',
    ],
    drills: [
      d(9, 'a', { title: 'Four-eight, then speak', brief: 'Do three rounds of breathing in for four and out for eight. Then give a sixty-second talk about a place that matters to you.', targetSeconds: 60 }),
      d(9, 'b', { title: 'The rehearsed first line', brief: 'Rehearse one opening sentence until it is automatic, then use it to launch a sixty-second talk on any topic you choose.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(9, 'c', { title: 'Grounded stance', brief: 'Stand with feet planted and shoulders dropped for fifteen seconds, then give a forty-five-second talk without shifting your weight.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Rushing the breathing count.', 'Students who find a friendly face and then talk only to them.'],
    selfCheck: ['Which technique helped most?', 'Was my first sentence automatic?'],
    realWorld: 'Waiting your turn to present, speak in a debate or give a speech in assembly.',
    writePrompt: 'Write your personal sixty-second pre-talk routine using at least three of the techniques from this lesson.',
  },
  {
    number: 10,
    oneLine: 'The audience forgets a stumble in seconds — unless you keep pointing at it.',
    idea: [
      'Everyone stumbles: news presenters, politicians, teachers. What turns a tiny mistake into a memorable one is the reaction — the nervous laugh, the "sorry, sorry", starting the sentence again from the beginning.',
      'The recovery is simple: correct the word, keep your pace, keep going. If it was genuinely funny, a small smile is fine. What your classmates remember is how you handled it.',
    ],
    drills: [
      d(10, 'a', { title: 'Deliberate stumble, clean recovery', brief: 'Give a sixty-second talk about your favourite subject. Make two deliberate mistakes and recover from each without apologising.', targetSeconds: 60 }),
      d(10, 'b', { title: 'A passage that trips people', brief: 'Read this aloud. If you stumble, fix the word and keep going — no restarting.', passage: 'The sixth sick sheikh\'s sixth sheep is sick. Specific Pacific statistics suggest a particularly peculiar pattern. Irish wristwatches rarely register regular rhythms.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(10, 'c', { title: 'Wrong fact, fixed', brief: 'Explain a science concept, say one fact wrong on purpose, then correct it smoothly with "Actually, let me correct that…".', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Restarting whole sentences after a stumble.', 'Visible apologies and nervous laughter.'],
    selfCheck: ['Did I apologise or just fix it?', 'Did my pace stay steady after the mistake?'],
    realWorld: 'Mixing up a word during an assembly reading or a debate speech.',
    writePrompt: 'Write the phrases you will use to correct a mistake mid-talk without apologising, and one you will avoid saying.',
  },
  {
    number: 11,
    oneLine: 'A blank is just an unplanned pause — nobody can see inside your head.',
    idea: [
      'Going blank is terrifying from the inside and nearly invisible from the outside. Three seconds of silence feels like a minute to you and like a thoughtful pause to the audience.',
      'You need a recovery routine: pause, breathe, repeat or summarise your last point ("So, as I was saying, the main problem is…"), or glance at a key-word note. Going back one step usually brings the next step with it.',
    ],
    drills: [
      d(11, 'a', { title: 'The recovery line', brief: 'Give a sixty-second talk about a film or series. Halfway through, stop for three seconds, then use "So, as I was saying…" to continue.', targetSeconds: 60 }),
      d(11, 'b', { title: 'Go back one step', brief: 'Give a seventy-five-second talk with three points. After point two, pretend you have forgotten point three — summarise points one and two to find it.', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(11, 'c', { title: 'Key-word rescue', brief: 'Write three key words for a talk on social media, then deliver it for sixty seconds glancing only at those words when stuck.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Panic-fill ("um, um, so, like…") instead of silence.', 'Students who give up and sit down — rehearse the routine until it is reflex.'],
    selfCheck: ['How long did my blank actually last on the recording?', 'Did my recovery line work?'],
    realWorld: 'Losing your place in a speech during a school competition or oral exam.',
    writePrompt: 'Write your blank-mind recovery routine as three steps, and the exact sentence you will say.',
  },
  {
    number: 12,
    oneLine: 'Confidence is not what you need before speaking — it is what speaking leaves behind.',
    idea: [
      'Waiting to feel confident before you volunteer to present means waiting forever. Confidence is built backwards: you speak, it goes more or less fine, and your brain updates its prediction for next time.',
      'That is why repetition matters more than any single talk. Today you speak for two full minutes, then compare with your baseline. The gap is the evidence your brain needs.',
    ],
    drills: [
      d(12, 'a', { title: 'Two minutes, no stopping', brief: 'Talk for two minutes about something you would change about your school or city. Pause when you need to, but do not stop.', targetSeconds: 120 }),
      d(12, 'b', { title: 'Your first recording, again', brief: 'Record your lesson-one baseline topic one more time and compare the numbers with your first attempt.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(12, 'c', { title: 'The volunteer', brief: 'Talk about a time you volunteered to speak or answer when you did not have to. What happened, and what would you do next time?', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Students stopping at ninety seconds — the discomfort is the training.', 'Celebrating specific improvements in the before-and-after comparison.'],
    selfCheck: ['What improved since my baseline?', 'Where will I volunteer to speak this week?'],
    realWorld: 'Putting your hand up to present first instead of hoping you are not picked.',
    writePrompt: 'Write one situation this week where you will choose to speak up, and what you will say.',
  },
];
