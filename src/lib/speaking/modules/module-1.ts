import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 1 — Finding Your Voice
 *
 * The first module carries an unusual load: most students arrive believing that
 * speaking well is something you are or are not, and the module has to disprove
 * that with evidence they generate themselves.
 *
 * Which is what the lab is for. A student who records the same passage in week
 * one and week three, and watches their own pace fall from 190 to 140, has been
 * shown something no amount of telling achieves.
 */
export const module1: SpeakingModule = {
  num: 1,
  title: 'Finding Your Voice',
  outcome: 'Speak in your own voice, and know what actually holds an audience.',
  lessons: [
    lesson(1, 0, 1, 'Speaking well is learnable, not a gift', {
      oneLine: 'Good speakers are not born calm and fluent — they are practised, and practice is measurable.',
      idea: [
        'Almost everybody believes public speaking is a talent. You either have presence or you do not, and the people who have it were born with it. It is the most common belief about speaking and it is wrong in a way that is easy to prove.',
        'What actually separates a good speaker from a nervous one is a small number of mechanical habits: how fast they talk, where they stop, how long their sentences run, and what they do with the gaps. Every one of those is a thing you can measure and change. None of them is a personality.',
        'This course will not make you a different person. It will make you a person who pauses.',
      ],
      model: {
        text: 'I have a dream that my four little children will one day live in a nation where they will not be judged by the colour of their skin, but by the content of their character.',
        attribution: 'Martin Luther King Jr., 1963',
        noticing: [
          'Read it aloud at your normal speed. It takes about eleven seconds. He took nearly twenty.',
          'The famous part is not the words — you have read them before and nothing happened. It is where he stopped.',
          'Count the places you could stop without the sentence breaking. There are at least four. Most people, reading it cold, use none.',
        ],
      },
      drills: [
        {
          id: 'ps-1-1-baseline',
          title: 'Your baseline',
          brief:
            'Talk for thirty seconds about what you had for breakfast. Genuinely — the subject does not matter, and it is chosen because it cannot make you nervous. This is the recording you will compare everything else against, so do not try to do it well. Just talk.',
          targetSeconds: 30,
        },
        {
          id: 'ps-1-1-passage',
          title: 'The same passage, cold',
          brief:
            'Read this aloud once, at whatever speed feels natural. Do not rehearse it. We are measuring where you are today, not where you can get to with three attempts.',
          passage:
            'I have a dream that my four little children will one day live in a nation where they will not be judged by the colour of their skin, but by the content of their character.',
          targetSeconds: 20,
        },
      ],
      extraDrills: [
        {
          id: 'ps-1-1-extra-1',
          title: 'A harder passage',
          brief: 'Longer sentences, and punctuation that matters. Read it as though somebody were listening.',
          passage:
            'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.',
          targetSeconds: 25,
        },
        {
          id: 'ps-1-1-extra-2',
          title: 'Something you know',
          brief:
            'Explain, out loud, how to get from your home to your school. Forty-five seconds. Familiar material, so any nerves you hear are about being recorded, not about the subject.',
          targetSeconds: 45,
        },
      ],
      mentorWatchFor: [
        'Whether they believe the premise. A student who thinks this is a gift will not practise, and that belief has to go first.',
        'The gap between their baseline recording and their read-aloud — a large gap usually means the nerves are about performance, not about speaking.',
        'Anyone whose first recording is under fifteen words. That is avoidance, and it is worth naming gently.',
      ],
      selfCheck: [
        'Do you know your own words-per-minute now? Write it down. You will want it in three weeks.',
        'Did the report tell you anything you did not already know about your own voice?',
      ],
    }),

    lesson(1, 1, 2, 'What makes an audience actually listen', {
      oneLine: 'Attention is not given to you because you are speaking — it is earned in the first ten seconds and lost by being predictable.',
      idea: [
        'An audience decides very quickly whether this is going to be worth their attention. Not consciously, and not fairly. They are reading your first sentence, your first pause, and whether you seem to know where you are going.',
        'What holds them after that is change. A voice that does the same thing for four minutes stops being heard the way a fan stops being heard. Change of pace, change of volume, a question, a silence, a story — each one resets the clock.',
        'The most common mistake is opening with logistics. "Hello, my name is, and today I am going to talk about" is four seconds in which nothing happened. You had their attention for free and you spent it on admin.',
      ],
      model: {
        text: 'In the time it takes me to say this sentence, three people in this room will have checked their phone. I am not offended. I am going to tell you why it happened.',
        noticing: [
          'The first sentence is about the audience, not the speaker.',
          'It makes a claim you want to check — which means you are now listening rather than deciding whether to.',
          'There is no name, no title, no agenda. Those can wait until attention is bought.',
        ],
      },
      drills: [
        {
          id: 'ps-1-2-opening',
          title: 'Ten seconds that earn the rest',
          brief:
            'Open a talk about your favourite meal — but do not say your name, the word "today", or the word "about". Ten seconds only. Then stop. The constraint is the lesson: it removes every default opening and forces you to find a real one.',
          targetSeconds: 15,
        },
        {
          id: 'ps-1-2-boring',
          title: 'The same thing, badly, on purpose',
          brief:
            'Now open the same talk in the most ordinary way you can manage. "Hello everyone, my name is…" Do it properly badly, for thirty seconds. Listening back to both is the point — you will hear the difference more clearly in your own voice than in anyone else\'s.',
          targetSeconds: 30,
        },
      ],
      extraDrills: [
        {
          id: 'ps-1-2-extra-1',
          title: 'Open on a question',
          brief: 'Thirty seconds beginning with a question you genuinely want an answer to. Not a rhetorical one — a real question, then your own answer to it.',
          targetSeconds: 30,
        },
        {
          id: 'ps-1-2-extra-2',
          title: 'Open on a number',
          brief: 'Start with a fact or a figure that surprises you, then explain why it surprised you. Forty seconds.',
          targetSeconds: 40,
        },
      ],
      mentorWatchFor: [
        'The default opening creeping back in. Almost everybody says their name in the first attempt despite being told not to.',
        'Whether their "bad" version is actually bad — some students cannot bring themselves to do it, which is worth talking about.',
        'A student whose two recordings sound identical has not yet heard the difference. Play both back in class.',
      ],
      selfCheck: [
        'Listen to both recordings back to back. At what second did you start being interested in yourself?',
        'Could someone tell, from the first ten seconds alone, what your talk is going to be about?',
      ],
    }),

    lesson(1, 2, 3, 'Your natural speaking voice', {
      oneLine: 'The voice that works is the one you already use with a friend — most people swap it for a worse one the moment they are being watched.',
      idea: [
        'Record yourself explaining something to a friend, then record yourself giving a talk on the same subject. For most people the second is slower in some places, faster in others, flatter overall, and about half a tone higher. Something happens to the voice under observation and it is almost never an improvement.',
        'The goal of this course is not to give you a "speaking voice". It is to get you back to the voice you already have when you are explaining something you care about to somebody you like. That voice is already varied, already well-paced, and already convincing.',
        'The reason it disappears is that you stop talking to a person and start performing at a room. The fix is smaller than it sounds: pick one person and talk to them.',
      ],
      drills: [
        {
          id: 'ps-1-3-friend',
          title: 'Explaining to a friend',
          brief:
            'Explain the rules of a game you like to someone who has never played it. Imagine one specific friend and talk to them. Forty-five seconds.',
          targetSeconds: 45,
        },
        {
          id: 'ps-1-3-audience',
          title: 'The same explanation, to a room',
          brief:
            'Now do it again as though you were standing in front of thirty people. Same content, same length. Compare the two reports — the difference between them is what this whole module is about.',
          targetSeconds: 45,
        },
      ],
      extraDrills: [
        {
          id: 'ps-1-3-extra-1',
          title: 'Talk to one person in the room',
          brief:
            'Third attempt at the same explanation, but this time picture one person in that room of thirty and speak only to them. Most people find this recording sounds like the first one.',
          targetSeconds: 45,
        },
        {
          id: 'ps-1-3-extra-2',
          title: 'Something you are annoyed about',
          brief:
            'Talk for a minute about something that genuinely irritates you. Irritation is useful here: it is very hard to be flat while complaining, and it shows you what your own range actually is.',
          targetSeconds: 60,
        },
      ],
      mentorWatchFor: [
        'A student whose "to a room" version is measurably worse now has proof of the thing this module claims. Point at the two numbers.',
        'Anybody whose two versions are the same — either they are already comfortable, or they are not really imagining the room.',
        'Students who speak more quietly when performing. It is more common than shouting and less often noticed.',
      ],
      selfCheck: [
        'Which of your two recordings would you rather listen to?',
        'Which one had more variation in it? Was that the one you thought was better?',
      ],
    }),

    lesson(1, 3, 4, 'Breath, pace and the pause', {
      oneLine: 'A pause is the most powerful thing you can do with a sentence, and it is free.',
      idea: [
        'Nervousness makes people speak faster. Speaking faster makes them run out of breath. Running out of breath makes them more nervous. It is the loop that ruins most first speeches, and it can be broken at any point — the easiest place is the pause.',
        'A pause does three things at once. It gives you air. It gives the listener a moment to catch up. And it makes the sentence before it sound as though you meant it. Nothing else you can do with your voice pays off in three directions like that.',
        'The uncomfortable part is that a pause feels much longer to the speaker than to the listener. A silence that feels like an eternity from the inside is about one and a half seconds from the outside. You have to be willing to feel foolish for a second and a half.',
      ],
      model: {
        text: 'We choose to go to the Moon in this decade and do the other things — not because they are easy, but because they are hard.',
        attribution: 'John F. Kennedy, 1962',
        noticing: [
          'The pause is before "not because they are easy". Everything after it lands because of the gap in front of it.',
          'Read it with no pause. The sentence still makes sense and means nothing.',
          'The pause is doing work that no word in the sentence could do.',
        ],
      },
      drills: [
        {
          id: 'ps-1-4-pauses',
          title: 'Read it with the pauses',
          brief:
            'Read this aloud and stop at every mark — properly stop, long enough to feel awkward. The report will tell you how many of them you actually took.',
          passage:
            'We choose to go to the Moon in this decade, and do the other things. Not because they are easy, but because they are hard. Because that goal will serve to organise and measure the best of our energies and skills.',
          targetSeconds: 30,
        },
        {
          id: 'ps-1-4-nopauses',
          title: 'The same passage, running',
          brief:
            'Now read it straight through without stopping anywhere. Compare the two reports. You are looking at your own longest-unbroken-run figure.',
          passage:
            'We choose to go to the Moon in this decade, and do the other things. Not because they are easy, but because they are hard. Because that goal will serve to organise and measure the best of our energies and skills.',
          targetSeconds: 25,
        },
      ],
      extraDrills: [
        {
          id: 'ps-1-4-extra-1',
          title: 'The three-second silence',
          brief:
            'Say one sentence about anything. Then stay silent for three full seconds. Then say a second sentence. The drill is entirely about tolerating the gap.',
          targetSeconds: 20,
        },
        {
          id: 'ps-1-4-extra-2',
          title: 'A long passage, breathing',
          brief: 'Read this and breathe at every full stop. It is longer than it looks read aloud.',
          passage:
            'The best and most beautiful things in the world cannot be seen or even touched. They must be felt with the heart. What we have once enjoyed we can never lose. All that we love deeply becomes a part of us.',
          targetSeconds: 35,
        },
      ],
      mentorWatchFor: [
        'The student who cannot leave a silence. Have them do the three-second drill in the room, out loud, while everyone watches. It is the fastest cure.',
        'Pace figures above 170 almost always mean shallow breathing rather than a decision to go quickly.',
        'Students who pause but fill the pause with "um". That is the next lesson, and it is worth flagging now.',
      ],
      selfCheck: [
        'What was your longest stretch without a pause? Anything over twenty seconds is worth attacking.',
        'Did the pauses feel too long while you were doing them? They almost certainly were not.',
      ],
    }),

    lesson(1, 4, 5, 'Volume, pitch and emphasis', {
      oneLine: 'Emphasis is how a listener knows which words matter — a flat delivery tells them nothing does.',
      idea: [
        'Say "I never said she stole my money" seven times, stressing a different word each time. It means seven different things. Nothing changed except which word you leaned on.',
        'That is emphasis, and it is the part of delivery most people never think about. They choose their words carefully and then deliver every one of them at the same weight, which throws away most of what they wrote.',
        'Volume, pitch and pace are the three dials. You do not need to use all three at once, and you do not need to be theatrical. A single sentence delivered more quietly than the ones around it is more dramatic than shouting, and a great deal easier to do without feeling silly.',
      ],
      model: {
        text: 'I never said she stole my money.',
        noticing: [
          'Stress "I" — somebody else said it.',
          'Stress "never" — you are denying it flatly.',
          'Stress "she" — somebody did, but not her.',
          'Stress "my" — she stole money, just not yours.',
          'Seven words, seven meanings, one change each time.',
        ],
      },
      drills: [
        {
          id: 'ps-1-5-seven',
          title: 'Seven meanings',
          brief:
            'Say the sentence seven times, stressing a different word each time. Leave a clear pause between each. Your variation figure should be well up on your earlier recordings.',
          passage: 'I never said she stole my money.',
          targetSeconds: 30,
        },
        {
          id: 'ps-1-5-quiet',
          title: 'The quiet line',
          brief:
            'Read this passage normally, but deliver the final sentence noticeably more quietly than the rest. Dropping your volume is the emphasis technique nobody expects.',
          passage:
            'They told us it could not be done. They told us the numbers did not work, that the timing was wrong, that we were too small. We did it anyway. Nobody has told us that since.',
          targetSeconds: 30,
        },
      ],
      extraDrills: [
        {
          id: 'ps-1-5-extra-1',
          title: 'One word, three ways',
          brief:
            'Pick any sentence of your own and deliver it three times: flat, then leaning on the first important word, then leaning on the last. Say which you prefer, out loud, at the end.',
          targetSeconds: 40,
        },
        {
          id: 'ps-1-5-extra-2',
          title: 'A list that builds',
          brief: 'Read this, and let each item be a little more insistent than the last.',
          passage:
            'It was not the money. It was not the time. It was not even the work. It was that nobody asked.',
          targetSeconds: 25,
        },
      ],
      mentorWatchFor: [
        'Students who hear "emphasis" as "louder". Volume down is the more useful half and needs demonstrating.',
        'A variation figure that does not move between the flat and the emphatic attempt — usually means they are changing pitch in their head and not in the room.',
        'Anyone embarrassed by the seven-meanings drill. Do it as a group and it stops being embarrassing.',
      ],
      selfCheck: [
        'Did your variation number change between your flat attempt and your emphatic one?',
        'Which word in your own last sentence were you leaning on? Did you choose it, or did it happen?',
      ],
    }),

    lesson(1, 5, 6, 'Recording yourself, and listening back', {
      oneLine: 'Everybody hates their own recorded voice, and everybody who gets good at this listens to it anyway.',
      idea: [
        'Your recorded voice sounds wrong to you because you have never heard it before. When you speak, most of what you hear arrives through the bones of your skull, which carries low frequencies far better than air does. The recording is what everyone else has always heard. They are not disappointed.',
        'Getting past that reaction is the single biggest practical advantage available to you in this course. A speaker who can listen back to themselves without flinching can fix things in a week that an unwilling speaker will still be doing in five years.',
        'Listen for one thing at a time. All at once is overwhelming and you will only hear the voice. First pass: where did I stop? Second pass: where did I speed up? Third pass: which word did I lean on? Three specific passes beat one general one every time.',
      ],
      drills: [
        {
          id: 'ps-1-6-again',
          title: 'Your baseline, three weeks on',
          brief:
            'Record the MLK passage from lesson one again, cold, no rehearsal. Then compare the two reports side by side. This is the evidence that the first lesson\'s claim was true.',
          passage:
            'I have a dream that my four little children will one day live in a nation where they will not be judged by the colour of their skin, but by the content of their character.',
          targetSeconds: 20,
        },
        {
          id: 'ps-1-6-commentary',
          title: 'Say what you hear',
          brief:
            'Play back your best recording so far. Then record yourself describing three specific things about it — not "it was okay", but what happened and where. Naming it out loud is what makes it stick.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-1-6-extra-1',
          title: 'One thing at a time',
          brief:
            'Record a minute on any subject. Listen back three times: once for pauses, once for pace, once for emphasis. Then record what you found.',
          targetSeconds: 60,
        },
        {
          id: 'ps-1-6-extra-2',
          title: 'Your own passage',
          brief:
            'Bring a passage that means something to you — a page from a book, a song lyric, something you wrote. Read it, and treat this drill as yours from now on.',
          targetSeconds: 45,
        },
      ],
      mentorWatchFor: [
        'The student who has not listened to a single recording. They will say the reports are enough. They are not.',
        'Whether the week-one and week-three numbers actually moved. If they did not, the practice is not happening and that is the conversation to have.',
        'A student who is now over-analysing and has stopped speaking naturally. Send them back to the friend drill in lesson three.',
      ],
      selfCheck: [
        'Compare lesson one and today. What moved most — pace, pauses, or fillers?',
        'Can you listen to thirty seconds of yourself without wincing yet? It comes.',
      ],
    }),
  ],
};
