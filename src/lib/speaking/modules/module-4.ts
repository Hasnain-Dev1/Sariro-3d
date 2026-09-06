import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 4 — Delivery
 *
 * FIVE lessons, not six. Slot 24 is the mid-course assessment — see
 * testPositions in lib/school/curriculum.ts. A sixth lesson written here would
 * be silently discarded by the syllabus builder.
 *
 * This is also the module where the lab can measure least. Posture, gesture and
 * eye contact do not show up in an audio envelope, so the drills lean on the
 * mentor and on the student's own camera. The lesson notes say so plainly
 * rather than pretending a microphone can see.
 */
export const module4: SpeakingModule = {
  num: 4,
  title: 'Delivery',
  outcome: 'Stand, gesture and make eye contact deliberately rather than by accident.',
  lessons: [
    lesson(4, 0, 19, 'Posture, and learning to stand still', {
      oneLine: 'Stillness reads as confidence, and almost nobody is still by accident.',
      idea: [
        'Watch anybody nervous give a talk and you will see the same things: weight shifting from foot to foot, a slow drift sideways, hands finding something to hold. None of it is decided. It is the body dealing with adrenaline that has nowhere to go.',
        'The audience does not consciously notice any of it. What they notice is a general impression of unease, which they then attribute to the content. Standing still is not about looking impressive; it is about removing a signal that undermines everything you say.',
        'The fix is a starting position you can return to. Feet about shoulder width, weight even, arms hanging. It feels exposed because your hands have nothing to do. Return to it after every gesture and the drift stops.',
      ],
      drills: [
        {
          id: 'ps-4-1-still',
          title: 'Sixty seconds, standing',
          brief:
            'Stand up. Feet planted, weight even. Talk for a minute without moving your feet at all. The microphone cannot see this — you will have to be honest, or film yourself on your phone at the same time.',
          targetSeconds: 60,
        },
        {
          id: 'ps-4-1-voice',
          title: 'Standing versus sitting',
          brief:
            'Give the same forty-five second talk sitting down, then standing. Compare the two reports. Most people are measurably louder and more varied standing, which is why it matters even on a video call.',
          targetSeconds: 45,
        },
      ],
      extraDrills: [
        {
          id: 'ps-4-1-extra-1',
          title: 'Film your feet',
          brief:
            'Point your phone camera at your feet and give a two-minute talk. Watch it back with the sound off. Almost everybody is surprised.',
          targetSeconds: 120,
        },
        {
          id: 'ps-4-1-extra-2',
          title: 'The reset',
          brief:
            'Talk for a minute. Every time you notice you have moved, deliberately return to your starting position. Noticing is the skill.',
          targetSeconds: 60,
        },
      ],
      mentorWatchFor: [
        'The sideways drift. Mark the floor with tape and it becomes visible to the student rather than only to you.',
        'Locked knees, which look still and cause fainting. Feet planted, knees soft.',
        'Students who stand well for thirty seconds and then forget. Stillness is a habit, not a decision.',
      ],
      selfCheck: [
        'Were you louder standing or sitting? Check the numbers rather than guessing.',
        'Watch your feet video. How many times did you move?',
      ],
    }),

    lesson(4, 1, 20, 'Gesture that means something', {
      oneLine: 'A gesture should be a word you could not say — everything else is fidgeting with extra steps.',
      idea: [
        'There are three kinds of hand movement on stage. Gestures that carry meaning: shape, size, direction, counting. Gestures that carry rhythm: the beat of an emphasised word. And movement that carries nothing, which is nerves leaking out through the arms.',
        'The first two are useful and mostly unconscious in good speakers. The third is what to remove, and you remove it by giving the hands somewhere to be: hanging, or lightly together in front of you, returned to between real gestures.',
        'The most common bad advice is "use your hands more". A speaker instructed to gesture produces gestures that mean nothing, on a beat that fits nothing, and it is worse than stillness. Gesture when the sentence has a shape in it. Otherwise let your arms be arms.',
      ],
      drills: [
        {
          id: 'ps-4-2-shape',
          title: 'Sentences with shape',
          brief:
            'Describe the layout of your bedroom, out loud, for forty-five seconds. Spatial description forces real gesture, and you will find your hands doing something useful without being told to.',
          targetSeconds: 45,
        },
        {
          id: 'ps-4-2-counting',
          title: 'Three points, three fingers',
          brief:
            'Give a sixty-second talk with three points, and hold up the number as you reach each one. It is the simplest meaningful gesture there is and audiences track it without noticing.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-4-2-extra-1',
          title: 'Hands still, on purpose',
          brief:
            'Give a minute with your hands completely still. Uncomfortable, and it shows you which of your gestures were doing work and which were nerves.',
          targetSeconds: 60,
        },
        {
          id: 'ps-4-2-extra-2',
          title: 'Film yourself, sound off',
          brief:
            'Two minutes on camera. Watch it back muted. Any movement you cannot explain is one to lose.',
          targetSeconds: 120,
        },
      ],
      mentorWatchFor: [
        'Repeated identical gestures — the same chop on every sentence. It is a beat gesture that has stopped meaning anything.',
        'Hands in pockets, behind the back, or gripping the other hand. All three are hiding places.',
        'Students who over-gesture after this lesson. Send them to the hands-still drill.',
      ],
      selfCheck: [
        'Watch your muted video. Which gestures meant something?',
        'Where do your hands go when they are not doing anything? Decide, rather than leaving it to chance.',
      ],
    }),

    lesson(4, 2, 21, 'Eye contact with a real audience', {
      oneLine: 'Talk to one person until you finish a thought, then move to another — sweeping the room reaches nobody.',
      idea: [
        'The advice to "make eye contact with the audience" produces a nervous sweep across the room, landing nowhere, which reads as scanning for exits. It is worse than looking at the back wall.',
        'What works is one person, one thought. Find a face, deliver a complete sentence to them, then move. Three or four people over a five-minute talk is plenty. Everybody in that section feels included, because from the fourth row you cannot tell who is being looked at.',
        'It also does something for you. Talking to a person is a conversation, and your voice does conversational things — variation, warmth, pace changes — that it will not do when addressing a room in the abstract. This is the same finding as module 1 lesson 3, arriving from the other direction.',
      ],
      drills: [
        {
          id: 'ps-4-3-one',
          title: 'One person, one thought',
          brief:
            'Put three objects around the room at eye height. Give a ninety-second talk, delivering a complete sentence to each in turn. Never move away mid-sentence.',
          targetSeconds: 90,
        },
        {
          id: 'ps-4-3-sweep',
          title: 'The sweep, for comparison',
          brief:
            'Now deliver the same talk while continuously scanning the room. Film both if you can. The difference on camera is dramatic.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-4-3-extra-1',
          title: 'Talk to one photograph',
          brief:
            'Prop up a photo of somebody you know and talk to them for a minute. Your voice will be noticeably warmer than your usual recordings.',
          targetSeconds: 60,
        },
        {
          id: 'ps-4-3-extra-2',
          title: 'The hostile face',
          brief:
            'Imagine one person in the room is unconvinced. Deliver ninety seconds looking mostly at them. Learning to speak to the sceptic rather than away from them is a real skill.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Eyes on the ceiling or the floor at the start of each sentence — a thinking habit that reads as evasion.',
        'Students who look only at the friendly faces. Name it; they will not have noticed.',
        'Whether the voice changes between the one-person and sweep versions. Usually it does, and the numbers show it.',
      ],
      selfCheck: [
        'Did your variation figure differ between the two attempts?',
        'When you were talking to the photograph, did you sound different? Play it against your lesson one recording.',
      ],
    }),

    lesson(4, 3, 22, 'Using notes without reading them', {
      oneLine: 'Notes should hold your structure, not your sentences — a page of prose is a script, and a script gets read.',
      idea: [
        'Notes are not cheating and nobody in the audience minds them. What the audience minds is being read to, and that happens the moment your notes contain full sentences, because a full sentence on paper is irresistible.',
        'What to write: three to five words per point. Nouns, not sentences. "Onboarding — three weeks — the form" is enough to recover a two-minute passage you already know, and impossible to read aloud.',
        'The exceptions worth writing out in full are the opening sentence, the closing sentence, and any number or quotation you must get exactly right. Everything else is a prompt.',
        'And practise glancing. A glance is half a second, down and back up, at the end of a sentence, not in the middle. Looking down mid-sentence is what makes notes visible.',
      ],
      drills: [
        {
          id: 'ps-4-4-keywords',
          title: 'Five words, two minutes',
          brief:
            'Write no more than five words on a card. Give a two-minute talk from it. If you find yourself reading, your notes are too detailed.',
          targetSeconds: 120,
        },
        {
          id: 'ps-4-4-script',
          title: 'The script, for comparison',
          brief:
            'Write the same talk out in full and read it. Compare the reports. Read prose is measurably flatter and faster than spoken thought, and you will hear it.',
          targetSeconds: 120,
        },
      ],
      extraDrills: [
        {
          id: 'ps-4-4-extra-1',
          title: 'Glancing practice',
          brief:
            'Ninety seconds, glancing at your card exactly three times, always at the end of a sentence. Count them.',
          targetSeconds: 90,
        },
        {
          id: 'ps-4-4-extra-2',
          title: 'Opening and closing written, middle loose',
          brief:
            'Write only your first and last sentences. Deliver two minutes. This is how most experienced speakers actually work.',
          targetSeconds: 120,
        },
      ],
      mentorWatchFor: [
        'Cards with sentences on them. Ask to see the card; the problem is usually visible before they speak.',
        'Mid-sentence glances, which break the line far more than end-of-sentence ones.',
        'Students who refuse notes entirely and then blank. Notes are insurance, and this is the lesson to make that argument.',
      ],
      selfCheck: [
        'How many words are on your card? Over ten and it is a script.',
        'Compare the pace of your read version and your spoken version. Which sounded like you?',
      ],
    }),

    lesson(4, 4, 23, 'Speaking to a camera', {
      oneLine: 'A camera gives you nothing back, which is why speaking to one feels wrong and has to be learned separately.',
      idea: [
        'Every instinct you have as a speaker is calibrated to feedback — a nod, a frown, someone leaning in. A lens gives you none of it, so the natural response is to speed up, flatten out, and finish early. This is why competent speakers are often poor on video.',
        'The fix is to supply the missing person. Look at the lens, not at your own face in the corner, and picture one specific human on the other side. Speak to them. It is the same technique as module 1 lesson 3 and module 4 lesson 3, which by now should be a pattern you recognise.',
        'Two mechanical things. Camera at eye height, so you are not looking down at your audience. And speak about ten per cent more slowly than feels right — the flattening that video does to a voice makes normal pace sound rushed.',
      ],
      drills: [
        {
          id: 'ps-4-5-camera',
          title: 'To the lens',
          brief:
            'Record ninety seconds on your phone, camera at eye height, looking at the lens and not at your own image. Then use the lab for the audio alongside it. Two different measurements of the same attempt.',
          targetSeconds: 90,
        },
        {
          id: 'ps-4-5-compare',
          title: 'To the room, then to the camera',
          brief:
            'Same sixty-second talk twice — once as though to a room, once to a lens. Compare pace and variation. The camera version is usually faster and flatter, and knowing your own gap is the point.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-4-5-extra-1',
          title: 'One person behind the lens',
          brief:
            'Picture a specific person and talk to them through the camera for a minute. Compare with your first camera attempt.',
          targetSeconds: 60,
        },
        {
          id: 'ps-4-5-extra-2',
          title: 'Ten per cent slower',
          brief:
            'Deliberately slow down on camera until it feels too slow. Check the number — it is probably now normal.',
          targetSeconds: 60,
        },
      ],
      mentorWatchFor: [
        'Eyes on the self-view. Extremely common and immediately visible to anyone watching.',
        'Camera below eye level. It is unflattering and, more importantly, it changes how the speaker holds their head and voice.',
        'The pace gap between room and camera. Most students are surprised by how large theirs is.',
      ],
      selfCheck: [
        'What was your pace to a room, and to a camera?',
        'Did you look at the lens or at yourself? Watch it back and be honest.',
      ],
    }),
  ],
};
