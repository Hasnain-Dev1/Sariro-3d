import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 3 — Structuring What You Say
 *
 * The module where the course stops being about the voice and starts being
 * about the content. A well-delivered talk with no shape is still a talk
 * nobody can repeat afterwards, and being repeatable is most of what "it was
 * good" actually means.
 */
export const module3: SpeakingModule = {
  num: 3,
  title: 'Structuring What You Say',
  outcome: 'Structure a talk around one clear idea, with an opening that earns attention.',
  lessons: [
    lesson(3, 0, 13, 'One idea, clearly stated', {
      oneLine: 'If you cannot say what your talk is about in one sentence, it is about too many things.',
      idea: [
        'Ask somebody what a talk was about a week later and you get one sentence at most. That is the whole return on a twenty-minute speech: one sentence, in their words, possibly wrong. Your job is to decide in advance what that sentence will be.',
        'Most talks fail here rather than in delivery. The speaker knows six interesting things and says all six, and the listener leaves with none, because six things with equal weight is the same as no things.',
        'The test is brutal and useful. Write your talk\'s one sentence. If it contains "and", you have two talks. Pick one, and demote the other to a supporting point or throw it away.',
      ],
      model: {
        text: 'This talk is about why our onboarding takes three weeks when it should take three days.',
        noticing: [
          'One claim, specific, with a number in it.',
          'It tells you what the talk will argue before you have heard it, which does not spoil anything — it makes the rest easier to follow.',
          'Compare: "This talk is about onboarding and culture and some ideas I have had." Three subjects, no claim.',
        ],
      },
      drills: [
        {
          id: 'ps-3-1-sentence',
          title: 'The one sentence',
          brief:
            'Say, in a single sentence with no "and" in it, what your next talk is about. Then stop recording. Ten seconds. If it takes you three attempts, that is the drill working.',
          targetSeconds: 15,
        },
        {
          id: 'ps-3-1-defend',
          title: 'Say it, then defend it',
          brief:
            'State your one sentence, then spend sixty seconds arguing for it and nothing else. Every time you wander to a second subject, stop and come back.',
          targetSeconds: 75,
        },
      ],
      extraDrills: [
        {
          id: 'ps-3-1-extra-1',
          title: 'Three talks from one subject',
          brief:
            'Take a broad subject — school, sport, your city — and say three DIFFERENT one-sentence talks that could come out of it. Seeing that a subject is not a talk is the lesson.',
          targetSeconds: 45,
        },
        {
          id: 'ps-3-1-extra-2',
          title: 'The and test',
          brief:
            'Say a one-sentence summary that deliberately contains "and". Then say the two separate talks hiding inside it.',
          targetSeconds: 40,
        },
      ],
      mentorWatchFor: [
        'Sentences that are topics rather than claims. "My talk is about climate change" is a subject; "my talk is about why recycling is the least useful thing you can do" is a talk.',
        'Students who cannot drop the second idea. Ask which one they would keep if they had ninety seconds.',
        'A one-sentence summary the student cannot say from memory is not yet simple enough.',
      ],
      selfCheck: [
        'Say your sentence now, from memory. Did it change from the one you recorded?',
        'Does it contain "and"? Be honest.',
      ],
    }),

    lesson(3, 1, 14, 'Openings that earn attention', {
      oneLine: 'The first fifteen seconds decide whether the next ten minutes get listened to or endured.',
      idea: [
        'Four openings work reliably: a question the audience wants answered, a number that surprises, a story that starts in the middle, or a claim they will want to argue with. Every one of them puts something in the listener\'s head that only you can resolve.',
        'Two openings fail reliably: your name and title, and an apology. "I am not really a speaker" is an instruction to lower expectations, delivered at the exact moment you needed them raised.',
        'The opening is also the sentence you should have most rehearsed, because it is where nerves are highest and where recovery is hardest. Know it word for word even if the rest is loose.',
      ],
      model: {
        text: 'Three years ago I was asked to leave a room. It was the best thing that happened to me that year, and I want to tell you why.',
        noticing: [
          'A story that starts in the middle — you already want to know what the room was.',
          'The second sentence promises a resolution, so the listener knows to stay.',
          'Fourteen words before anything about the speaker. No name, no title.',
        ],
      },
      drills: [
        {
          id: 'ps-3-2-four',
          title: 'Four openings, one talk',
          brief:
            'Take one subject and open it four different ways — a question, a number, a story-in-the-middle, and a claim to argue with. Ten seconds each, with a pause between. Then decide which you would keep.',
          targetSeconds: 60,
        },
        {
          id: 'ps-3-2-rehearsed',
          title: 'The opening, word for word',
          brief:
            'Pick your best opening and deliver it three times, identically. The third one should be steady. This is the only part of a talk worth memorising.',
          targetSeconds: 40,
        },
      ],
      extraDrills: [
        {
          id: 'ps-3-2-extra-1',
          title: 'Open with a real question',
          brief: 'Ask the audience something and leave three seconds of silence for them to answer in their heads. Then continue.',
          targetSeconds: 40,
        },
        {
          id: 'ps-3-2-extra-2',
          title: 'The failed opening',
          brief:
            'Deliver the worst opening you can — name, title, apology, agenda. Listen back. It is useful to have heard yourself do it.',
          targetSeconds: 30,
        },
      ],
      mentorWatchFor: [
        'Apologetic openings. "I did not have much time to prepare" is the most common and the most damaging.',
        'Students whose four openings all sound the same. Usually means they have written one and reworded it.',
        'Whether the rehearsed opening is actually steadier by the third attempt — if not, they are not rehearsing, they are repeating.',
      ],
      selfCheck: [
        'Which of your four openings made you want to hear the rest?',
        'Can you say your opening from memory, right now, exactly?',
      ],
    }),

    lesson(3, 2, 15, 'The middle: three points, well ordered', {
      oneLine: 'Three is the number of things a listener will hold, and the order you put them in changes the argument.',
      idea: [
        'People remember three things. Not because three is magic, but because two feels thin and four is where a listener starts choosing which ones to keep. Give them four and they will keep three, and you do not get to choose which.',
        'Order matters more than most speakers think. Strongest last is the usual advice and it is usually right — the final point is the one that colours everything. But if you suspect the audience is sceptical, lead with your strongest, because you may not get to the end of their patience.',
        'Each point needs a claim and one piece of support. Not three pieces. A point supported three ways takes as long as three points and lands as one.',
      ],
      drills: [
        {
          id: 'ps-3-3-three',
          title: 'Three points, one support each',
          brief:
            'Give a ninety-second talk with exactly three points. Each point gets one claim and one example. When you find yourself adding a second example, stop and move to the next point.',
          targetSeconds: 90,
        },
        {
          id: 'ps-3-3-reorder',
          title: 'The same three, reordered',
          brief:
            'Deliver the same three points with the strongest first instead of last. Listen back to both. They are different arguments.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-3-3-extra-1',
          title: 'Five points, cut to three',
          brief:
            'List five points on your subject out loud. Then say which two you are cutting and why. The cutting is the skill.',
          targetSeconds: 60,
        },
        {
          id: 'ps-3-3-extra-2',
          title: 'One point, done properly',
          brief:
            'Ninety seconds on ONE point. Harder than three, and it teaches you how much support a claim actually needs.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Talks that have four or five points because nothing was cut. Ask which one they would drop under time pressure.',
        'Points that are really the same point twice. Common and hard for the student to see alone.',
        'Whether reordering actually changed the feel. If the student cannot hear a difference, the points are probably of equal weight, which means none is the strongest.',
      ],
      selfCheck: [
        'Say your three points from memory. Did you get all three?',
        'Which order did you prefer, and why?',
      ],
    }),

    lesson(3, 3, 16, 'Signposting and transitions', {
      oneLine: 'A listener cannot see your structure — signposting is how you let them hear it.',
      idea: [
        'You know there are three points because you wrote them. The audience knows only what you tell them, and if you never tell them, a talk with a perfect structure sounds like an undifferentiated stream.',
        'Signposting is small and cheap. "There are three reasons." "That was the first." "Which brings me to the part that actually matters." Each one is a handrail, and a listener who knows where they are in a talk stays with it far longer than one who does not.',
        'Transitions are where amateur and practised speakers differ most audibly. The amateur transition is "so", "and", "anyway", "moving on". The practised one closes the previous idea and opens the next in the same sentence: "which is why the second reason is harder."',
      ],
      model: {
        text: 'So that is what it cost us. The more interesting question is what it bought — and there are two answers, and only one of them is the one we expected.',
        noticing: [
          'The first sentence closes what came before.',
          'The second opens what comes next AND tells you how many parts it has.',
          'The last clause promises a surprise, which is a reason to keep listening through the boring answer to get to the interesting one.',
        ],
      },
      drills: [
        {
          id: 'ps-3-4-signpost',
          title: 'Three points, signposted',
          brief:
            'Give the three-point talk again, but announce the structure at the start and mark each transition out loud. It will feel over-explained. It is not.',
          targetSeconds: 90,
        },
        {
          id: 'ps-3-4-nosign',
          title: 'The same talk, unsignposted',
          brief:
            'Now deliver it with no structural language at all. Listen back to both and ask which one you could summarise afterwards.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-3-4-extra-1',
          title: 'Transitions only',
          brief:
            'Record just your three transitions, one after another. Thirty seconds. If they are all "so" and "and", that is the finding.',
          targetSeconds: 30,
        },
        {
          id: 'ps-3-4-extra-2',
          title: 'Read a signposted passage',
          brief: 'Read this and notice how much easier it is to follow than an unsignposted equivalent.',
          passage:
            'There are three things I want to leave you with. The first is simple. The second is uncomfortable. And the third, which I think is the only one that matters, is the one nobody in this room is going to like.',
          targetSeconds: 25,
        },
      ],
      mentorWatchFor: [
        'Transitions made of filler — "so", "um so", "anyway". The transitions-only drill exposes this in thirty seconds.',
        'Over-signposting, which is rarer but does happen: a talk that is all handrail and no staircase.',
        'Students who signpost in writing and not in delivery — they wrote "firstly" and said "and then".',
      ],
      selfCheck: [
        'Which of your two recordings could you summarise a day later?',
        'Listen to your transitions alone. How many distinct ones did you use?',
      ],
    }),

    lesson(3, 4, 17, 'Endings that land', {
      oneLine: 'The last sentence is the one they walk out with — most speakers waste it on "so, yeah, that\'s it".',
      idea: [
        'Endings are the most under-prepared part of almost every talk. The speaker runs out of material, notices they have run out, and says so. "That is all I had", "any questions", "yeah". Whatever they said thirty seconds earlier is now competing with an admission of having finished.',
        'A good ending does one of three things: it returns to the opening, it states the one sentence explicitly, or it asks for something. Returning to the opening is the most satisfying and the easiest — you set something up in the first fifteen seconds and you close it in the last fifteen.',
        'And then stop. The single most common ending error is continuing after the ending: delivering a good final line and then adding "so, um, yeah". Say it, and be quiet.',
      ],
      model: {
        text: 'I told you at the start that I was asked to leave a room. I have never been asked back. And I have never once wanted to be.',
        noticing: [
          'Returns to the opening image, which closes a loop the listener has been holding.',
          'Three short sentences after a long talk — the shortening is what signals the end without announcing it.',
          'No "thank you for listening". No "any questions". It is over, and everybody knows.',
        ],
      },
      drills: [
        {
          id: 'ps-3-5-callback',
          title: 'Open and close the same loop',
          brief:
            'Record an opening and an ending, nothing in between. The ending must return to the opening. Thirty seconds total. This pairing is the easiest structure in speaking and almost nobody uses it.',
          targetSeconds: 30,
        },
        {
          id: 'ps-3-5-stop',
          title: 'Say it and stop',
          brief:
            'Deliver a strong final sentence and then stay silent for five seconds without stopping the recording. Sitting in that silence is the skill.',
          targetSeconds: 20,
        },
      ],
      extraDrills: [
        {
          id: 'ps-3-5-extra-1',
          title: 'Three endings',
          brief:
            'End the same talk three ways — callback, one-sentence restatement, and an ask. Say which you would use.',
          targetSeconds: 45,
        },
        {
          id: 'ps-3-5-extra-2',
          title: 'The bad ending',
          brief:
            'Deliver a good closing line and then ruin it with "so yeah, that is it, um, thanks". Listening back to this is worth more than being told.',
          targetSeconds: 25,
        },
      ],
      mentorWatchFor: [
        'The trailing "so yeah". It survives everything and needs naming every single time.',
        'Endings that are summaries. A summary is not an ending — it is admin that happens before one.',
        'Students who cannot hold the five-second silence. Same muscle as module 1 lesson 4.',
      ],
      selfCheck: [
        'What is your last sentence? Say it now.',
        'Did you add anything after it? Listen back and check.',
      ],
    }),

    lesson(3, 5, 18, 'Cutting whatever does not serve the point', {
      oneLine: 'Every sentence that is merely interesting is competing with the sentence that matters.',
      idea: [
        'You will have material you like that does not belong. A good aside, a fact you enjoyed finding, a joke that works. Cutting those is the hardest editing there is, because nothing is wrong with them — they are simply not doing the job.',
        'The test for each part of a talk: if I removed this, would my one sentence be weaker? If the answer is no, it goes, however good it is.',
        'Cutting also buys the thing you most need, which is time. A ten-minute talk delivered in eight has room for pauses; the same talk delivered in ten and a half is delivered at a rush, and the rush costs you more than the material bought.',
      ],
      drills: [
        {
          id: 'ps-3-6-long',
          title: 'Two minutes',
          brief: 'Give a two-minute talk on any subject. Do not edit it. This is the raw version.',
          targetSeconds: 120,
        },
        {
          id: 'ps-3-6-cut',
          title: 'The same talk in sixty seconds',
          brief:
            'Now deliver the same talk in half the time. Not faster — shorter. You must cut, and what survives is what the talk was actually about.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-3-6-extra-1',
          title: 'Thirty seconds',
          brief: 'Half it again. Brutal, and the most useful drill in this module.',
          targetSeconds: 30,
        },
        {
          id: 'ps-3-6-extra-2',
          title: 'Name what you cut',
          brief:
            'Record yourself saying what you removed and why. Saying "I cut the best joke because it was not about my point" out loud is how the habit forms.',
          targetSeconds: 45,
        },
      ],
      mentorWatchFor: [
        'Students who deliver the sixty-second version by speaking faster. Check the pace figure — it tells you immediately.',
        'What survived the cut is usually the real talk. Point that out; it is often better than the two-minute version.',
        'A student who cannot cut anything has not decided what the talk is about. Send them back to lesson 13.',
      ],
      selfCheck: [
        'Was your sixty-second version worse than the two-minute one? Most people find it is not.',
        'What was the best thing you cut? Could it be its own talk?',
      ],
    }),
  ],
};
