import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 2 — Managing Nerves
 *
 * The module students are most likely to have arrived for, and the one where
 * bad advice is most common. "Just relax" and "imagine them in their underwear"
 * are the two things everybody has been told and neither has ever worked for
 * anybody. What works is preparation and a small number of physical techniques,
 * and the lab lets a student see nerves as a number rather than a feeling.
 */
export const module2: SpeakingModule = {
  num: 2,
  title: 'Managing Nerves',
  outcome: 'Handle nerves with preparation and with techniques that work in the moment.',
  lessons: [
    lesson(2, 0, 7, 'What nervousness actually is', {
      oneLine: 'The physical symptoms of terror and of excitement are identical — what differs is the sentence you tell yourself about them.',
      idea: [
        'Faster heart, shallow breathing, dry mouth, shaking hands, a stomach that has decided to leave. That is adrenaline, and it is the same chemistry whether you are about to give a speech or about to open a present. Your body has prepared you for something important. It cannot tell which kind.',
        'The instruction "calm down" fails because you cannot go from high arousal to low arousal on command. What you can do is relabel it. Studies of this are unusually consistent: people told to say "I am excited" out loud before speaking perform better than people told to say "I am calm", because one is achievable and the other is a lie your body can hear.',
        'The other half is knowing that it fades. Nerves peak in the thirty seconds before you start and again in the first thirty seconds of speaking, and then they drop sharply. If you can get through the first minute, the rest is much easier than the first minute suggested it would be.',
      ],
      drills: [
        {
          id: 'ps-2-1-nervous',
          title: 'Talk about being nervous, while nervous',
          brief:
            'Record yourself describing, out loud, what happens to your body before you speak. Be specific — hands, breath, stomach, voice. Naming it is most of the technique.',
          targetSeconds: 45,
        },
        {
          id: 'ps-2-1-firstminute',
          title: 'The first minute',
          brief:
            'Give a talk on any subject for ninety seconds. Do not stop, whatever happens. Afterwards, look at where in the recording your pace was fastest — for most people it is the first fifteen seconds, and that is the shape of the nerve curve.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-2-1-extra-1',
          title: 'Say it out loud',
          brief:
            'Before you record, say "I am excited" out loud three times. Then talk for a minute about anything. It sounds ridiculous and it measurably helps.',
          targetSeconds: 60,
        },
        {
          id: 'ps-2-1-extra-2',
          title: 'The passage under pressure',
          brief: 'Read this after twenty star jumps, so your heart is genuinely fast. Learning to speak with adrenaline in you is the actual skill.',
          passage:
            'Courage is not the absence of fear, but the judgement that something else is more important than fear. The timid presume it is lacking among the brave.',
          targetSeconds: 25,
        },
      ],
      mentorWatchFor: [
        'A student who says they are not nervous at all. Usually true for the room they are in and untrue for a bigger one — do not argue, just note it.',
        'Pace in the first fifteen seconds against pace overall. The gap is the nerve curve made visible and students find it convincing.',
        'Anybody whose voice shakes audibly. That is worth a private word rather than a class one.',
      ],
      selfCheck: [
        'Where in your ninety-second recording were you fastest?',
        'Name three physical things your body does. Can you feel them starting before you notice you are nervous?',
      ],
    }),

    lesson(2, 1, 8, 'Preparation as the cure for fear', {
      oneLine: 'Most of what feels like stage fright is under-preparation wearing a disguise.',
      idea: [
        'There is a kind of nervousness that is just adrenaline, and there is a kind that is your brain correctly reporting that you do not know what you are going to say. The second kind is far more common and it is entirely fixable.',
        'The test is simple. Can you say your first sentence, your last sentence, and your three middle points without looking at anything? If not, the nerves you feel are accurate, and no breathing technique will touch them.',
        'Preparation does not mean memorising. A memorised speech breaks the moment you lose a word, and it sounds memorised, which is worse. What you want is to know the shape so well that you could get lost and find your way back.',
      ],
      drills: [
        {
          id: 'ps-2-2-shape',
          title: 'First line, last line, three points',
          brief:
            'Pick a subject. Record only these five things, in order, with a clear pause between each: your opening sentence, your three points, your closing sentence. Nothing else. Thirty seconds. This is the skeleton, and if you can say it from memory you are prepared.',
          targetSeconds: 30,
        },
        {
          id: 'ps-2-2-full',
          title: 'The same talk, filled in',
          brief:
            'Now give the whole talk, ninety seconds, using that skeleton. Notice how much less frightening it is when you already know where you are going.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-2-2-extra-1',
          title: 'Unprepared, on purpose',
          brief:
            'Talk for a minute about a subject you have not thought about at all — the history of the paperclip, or why the sky is that colour. Feel the difference. That feeling is what preparation removes.',
          targetSeconds: 60,
        },
        {
          id: 'ps-2-2-extra-2',
          title: 'Same skeleton, different order',
          brief:
            'Take your three points and deliver them in a different order. If the talk still works, you know the shape rather than a script.',
          targetSeconds: 75,
        },
      ],
      mentorWatchFor: [
        'The skeleton drill exposes anyone who has not prepared, immediately and without confrontation. That is what it is for.',
        'Students who write out a full script. Ask them to give it once without the script — the gap is the lesson.',
        'A student who is genuinely prepared and still terrified. That is the other kind of nerves, and module 2 lesson 3 is what they need.',
      ],
      selfCheck: [
        'Could you say your skeleton right now, without looking?',
        'Was the prepared version calmer than the unprepared one? By how much?',
      ],
    }),

    lesson(2, 2, 9, 'Techniques that work in the moment', {
      oneLine: 'Four things you can do in the sixty seconds before you speak, all of them physical, none of them "relax".',
      idea: [
        'The techniques that work share a property: they act on the body rather than on the mind. You cannot instruct yourself to feel differently, but you can change your breathing, and your feelings follow within about thirty seconds.',
        'Long exhale. Breathe in for four, out for eight. The out-breath is the part that matters — it is what tells your nervous system the emergency is over. Three of these is enough.',
        'Feet, hands, jaw. Push your feet into the floor. Let your hands hang and shake them out. Unclench your jaw, which is almost certainly clenched. Three seconds each.',
        'And the one nobody does: say your first sentence out loud, quietly, before you begin. The first sentence is where voices crack, and a sentence you have already said once today is much less likely to be the one that breaks.',
      ],
      drills: [
        {
          id: 'ps-2-3-technique',
          title: 'Four-eight, then speak',
          brief:
            'Do three long exhales — in for four, out for eight — then immediately record a minute on any subject. Compare the pace figure to your usual. For most people it drops by ten to twenty words a minute without trying.',
          targetSeconds: 60,
        },
        {
          id: 'ps-2-3-firstline',
          title: 'The rehearsed first line',
          brief:
            'Say your opening sentence quietly to yourself twice. Then record the talk properly, starting with that sentence. The opening should be the steadiest part of the recording rather than the shakiest.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-2-3-extra-1',
          title: 'Straight in, no preparation',
          brief:
            'Record a minute with no breathing and no rehearsed opening, so you have the comparison. Do this one second, not first — the order matters.',
          targetSeconds: 60,
        },
        {
          id: 'ps-2-3-extra-2',
          title: 'Reading while settling',
          brief: 'Do the breathing, then read this. It is a passage that rewards being unhurried.',
          passage:
            'Be still. The quietest voice in the room is often the one everyone leans in to hear. You do not have to fill the silence. You only have to be worth waiting for.',
          targetSeconds: 25,
        },
      ],
      mentorWatchFor: [
        'Students who skip the breathing because it feels silly. Do it as a class, out loud, and it stops feeling silly.',
        'The pace difference between the with-technique and without-technique recordings. It is usually large enough to be persuasive on its own.',
        'Anyone holding their breath rather than exhaling. Very common and completely counter-productive.',
      ],
      selfCheck: [
        'What was your pace with the breathing, and without it?',
        'Which of the four techniques will you actually remember to do? Pick one and only one.',
      ],
    }),

    lesson(2, 3, 10, 'Recovering from a mistake mid-speech', {
      oneLine: 'The audience forgets a stumble in about four seconds unless you keep drawing attention to it.',
      idea: [
        'You will lose a word, say the wrong name, or start a sentence you cannot finish. Everybody does. What separates speakers is not whether it happens but what they do in the next two seconds.',
        'The instinct is to apologise, explain, or start the sentence again from the beginning. All three make it worse, because all three tell the audience something went wrong. Left alone, most stumbles are not even noticed — the listener is following your meaning, not auditing your grammar.',
        'The recovery is: stop, breathe once, and continue from the next idea rather than the broken sentence. Not the same sentence again. The next one. If it was a real mistake — a wrong fact, a wrong name — correct it plainly, once, and move on. "Sorry, 2019, not 2018" and then straight back in. No second apology.',
      ],
      model: {
        text: 'And in 2018 — 2019 — the whole thing changed.',
        noticing: [
          'One correction, no apology, no pause for embarrassment.',
          'The sentence continues as though the correction were part of it, because it was.',
          'Compare: "Sorry, I meant 2019, sorry, let me start that again." Now everybody is thinking about the mistake.',
        ],
      },
      drills: [
        {
          id: 'ps-2-4-stumble',
          title: 'Deliberate stumble, clean recovery',
          brief:
            'Talk for a minute and, somewhere in the middle, deliberately break a sentence. Then recover the way this lesson describes: stop, breathe, continue with the next idea. Practising the recovery when it is planned is what makes it available when it is not.',
          targetSeconds: 60,
        },
        {
          id: 'ps-2-4-hard',
          title: 'A passage that trips people',
          brief:
            'Read this out loud. It is written to be stumbled over. When you stumble — and you will — do not restart. Carry on.',
          passage:
            'The sixth sick sheikh\'s sixth sheep is sick, and the seller of shells by the seashore is certain that she saw six thick thistle sticks.',
          targetSeconds: 20,
        },
      ],
      extraDrills: [
        {
          id: 'ps-2-4-extra-1',
          title: 'Correct one fact, cleanly',
          brief:
            'Tell a story that includes a date or a name. Get it wrong on purpose, correct it in three words, and keep going. No apology anywhere.',
          targetSeconds: 45,
        },
        {
          id: 'ps-2-4-extra-2',
          title: 'The unfinishable sentence',
          brief:
            'Start a sentence you have no ending for. Let it die. Then start a new one and continue the talk. This is the most useful thirty seconds in the module.',
          targetSeconds: 45,
        },
      ],
      mentorWatchFor: [
        'Students who apologise anyway. Almost everybody does on the first attempt.',
        'The restart reflex — going back to the beginning of the broken sentence rather than forward to the next idea.',
        'Anyone who cannot bring themselves to make a deliberate mistake. That reluctance is worth talking about directly.',
      ],
      selfCheck: [
        'Listen back to your stumble. How long was the gap actually — and how long did it feel?',
        'Did you apologise? Count how many times.',
      ],
    }),

    lesson(2, 4, 11, 'What to do when your mind goes blank', {
      oneLine: 'A blank is not the end of the talk — it is a pause you did not plan, and the audience cannot tell the difference.',
      idea: [
        'Going blank feels like falling. What is actually happening is that adrenaline has temporarily crowded out working memory, and it passes in a few seconds. The problem is what most people do during those seconds: panic visibly, which extends them.',
        'The reliable escape is to say something true about where you are. "The point I want to land here is important, so let me get it right." That buys four seconds, is not a lie, and does not sound like a rescue.',
        'The other escape is to go back one step rather than forward. Repeat, in different words, the last thing you said. Restating the previous point almost always reminds you of the next one, because that is how the thought was connected in the first place.',
        'And keep one thing written down: not the speech, but your three points. A glance at three words is not reading from a script — it is the difference between a two-second recovery and a two-minute one.',
      ],
      drills: [
        {
          id: 'ps-2-5-blank',
          title: 'The recovery line',
          brief:
            'Talk for a minute. Halfway through, stop completely and use a recovery line — "let me put that another way", "the point underneath this is" — then find your way back. Practise the line so it is there when you need it.',
          targetSeconds: 60,
        },
        {
          id: 'ps-2-5-back',
          title: 'Go back one step',
          brief:
            'Give a talk with three points. After the second one, deliberately blank — then restate point two in different words until point three comes back to you.',
          targetSeconds: 75,
        },
      ],
      extraDrills: [
        {
          id: 'ps-2-5-extra-1',
          title: 'Three words on a card',
          brief:
            'Write your three points on a card. Give a two-minute talk. Glance at the card exactly twice. Notice that nobody would have known.',
          targetSeconds: 120,
        },
        {
          id: 'ps-2-5-extra-2',
          title: 'Silence, held',
          brief:
            'Talk for a minute and take one deliberate five-second silence in the middle. Not a recovery — just a silence. Learning that the room survives it is the whole point.',
          targetSeconds: 60,
        },
      ],
      mentorWatchFor: [
        'Students who fill the blank with "um" rather than silence. Silence is better and they need to hear the two side by side.',
        'A recovery line delivered in a panicked voice defeats the purpose. It has to sound deliberate.',
        'Anyone who will not use notes at all out of pride. Notes are not cheating and this is the lesson to say so.',
      ],
      selfCheck: [
        'What is your recovery line? Say it now. If you had to think, it is not ready.',
        'In your five-second silence — did anything bad happen?',
      ],
    }),

    lesson(2, 5, 12, 'Confidence as a result of repetition', {
      oneLine: 'Confidence is not a prerequisite for speaking well; it is what is left behind after you have spoken well a few times.',
      idea: [
        'People wait to feel confident before they volunteer. It is the wrong way round. Confidence is downstream of evidence, and the only evidence that counts is having done it and survived.',
        'This is why the lab matters more than any lesson in this module. Ten recordings is ten pieces of evidence. A student who has spoken into a microphone forty times has a different relationship with a room than one who has read about it forty times, and the difference is not knowledge.',
        'What to expect: the nerves do not disappear. Experienced speakers report roughly the same physical symptoms as beginners. What changes is that the symptoms stop meaning anything — you notice the fast heart, think "there it is", and start talking.',
      ],
      drills: [
        {
          id: 'ps-2-6-full',
          title: 'Two minutes, no stopping',
          brief:
            'The longest thing you have done so far. Two minutes on a subject you care about, no notes, no restarts. If you stumble, recover the way module 2 taught you and keep going.',
          targetSeconds: 120,
        },
        {
          id: 'ps-2-6-compare',
          title: 'Your first recording, again',
          brief:
            'Record the breakfast drill from lesson one one more time. Put the two reports side by side. This is the module\'s closing argument and you are the one making it.',
          targetSeconds: 30,
        },
      ],
      extraDrills: [
        {
          id: 'ps-2-6-extra-1',
          title: 'Three minutes',
          brief: 'Longer again. Most people find the third minute easier than the first, which is the point.',
          targetSeconds: 180,
        },
        {
          id: 'ps-2-6-extra-2',
          title: 'Cold, no preparation, two minutes',
          brief:
            'Pick a subject at random and start immediately. Compare with your unprepared attempt from lesson eight. The gap is what twelve lessons of practice bought you.',
          targetSeconds: 120,
        },
      ],
      mentorWatchFor: [
        'Whether the student has actually used the lab between classes. The recording count tells you and the improvement curve confirms it.',
        'Students who now speak well in the lab and still freeze in the room. That is an audience problem, not a speaking problem — module 4 is theirs.',
        'The comparison drill is the moment to make a fuss. Do it publicly if the student will allow it.',
      ],
      selfCheck: [
        'How many recordings have you made? If it is under ten, that is the finding.',
        'Compare lesson one and lesson twelve. What is the single biggest change?',
      ],
    }),
  ],
};
