import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 8 — Performance and Beyond
 *
 * FIVE lessons. Slot 48 is the final assessment — see testPositions in
 * lib/school/curriculum.ts.
 *
 * The last lesson is the point of the whole course: a speech about something
 * that matters to the student, delivered to people, with everything applied at
 * once. Everything before it has been building the tools to make that possible.
 */
export const module8: SpeakingModule = {
  num: 8,
  title: 'Performance and Beyond',
  outcome: 'Read the room and adapt, use slides without hiding behind them, and hold a position in debate.',
  lessons: [
    lesson(8, 0, 43, 'Adapting to the audience in front of you', {
      oneLine: 'The talk you prepared is a plan, and the room in front of you is the situation — when they disagree, the room wins.',
      idea: [
        'Every speaker has had the experience of delivering a prepared talk to a room it was not right for. Too long, too basic, too technical, too cheerful for the mood. The material was fine. It was aimed at the wrong people.',
        'You can read a room in the first minute if you look. Are they leaning in or looking down? Did the opening land? Are they taking notes, or checking the time? None of that requires interpretation — you are looking at whether they are with you.',
        'Then adapt with the three levers you have. Cut — drop a point rather than compress everything. Change the level — more example, less abstraction, or the reverse. Change the energy — a flat room needs a question, not more volume.',
        'The reason to cut rather than to speed up is that speed is the one adaptation that makes everything worse. A room that has drifted will not be recovered by receiving the same material faster.',
      ],
      drills: [
        {
          id: 'ps-8-1-two',
          title: 'The same talk, two audiences',
          brief:
            'Ninety seconds on your subject, aimed at experts. Then ninety seconds of the same, aimed at people who have never met it. Same claim, different everything else.',
          targetSeconds: 90,
        },
        {
          id: 'ps-8-1-cut',
          title: 'Cut a point live',
          brief:
            'Plan three points and deliver only two, deciding which to drop as you go. Practising the decision is what makes it available in a real room.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-8-1-extra-1',
          title: 'For a room of ten-year-olds',
          brief:
            'Explain your subject to children. Sixty seconds. Simplifying without patronising is one of the hardest things in this course.',
          targetSeconds: 60,
        },
        {
          id: 'ps-8-1-extra-2',
          title: 'The flat room',
          brief:
            'Imagine the room has drifted. Record the next sixty seconds of your talk as a recovery — a question, a story, a change of energy. Not more volume.',
          targetSeconds: 60,
        },
      ],
      mentorWatchFor: [
        'Two versions that differ only in vocabulary. Adaptation is about what you cut and what you exemplify, not about longer words.',
        'Students who adapt by speeding up. Check the pace figure; it names the problem for you.',
        'Simplification that slides into patronising. It is a real risk and worth naming.',
      ],
      selfCheck: [
        'What did you cut for the non-expert version? If nothing, you rewrote rather than adapted.',
        'Compare the pace of your two versions.',
      ],
    }),

    lesson(8, 1, 44, 'Using slides without hiding behind them', {
      oneLine: 'Slides are for what you cannot say — everything else on them is competing with you.',
      idea: [
        'An audience cannot read and listen at the same time. Put a paragraph on a screen and you have chosen: they will read it, and whatever you say over the top is lost. This is not a preference, it is how attention works.',
        'So the rule is that a slide carries what words cannot: a photograph, a graph, a diagram, a single number. If a slide could be said out loud in one sentence, say it out loud and delete the slide.',
        'The hiding is the deeper problem. Bullet points exist because they are a script the speaker can read while facing away, and a talk delivered to a screen is not a talk. If the slides can be understood without you, you are the one who is optional.',
        'Practical: build the talk first and the slides afterwards. A talk built inside slide software becomes a document with a person reading it.',
      ],
      drills: [
        {
          id: 'ps-8-2-noslides',
          title: 'The talk with no slides at all',
          brief:
            'Two minutes on something you would normally present with slides. Nothing to look at. If it does not survive this, the slides were doing the talking.',
          targetSeconds: 120,
        },
        {
          id: 'ps-8-2-oneimage',
          title: 'One image, two minutes',
          brief:
            'Now imagine exactly one slide — a photograph or a graph. Deliver the same talk, describing what is on it rather than reading it. That is what a slide is for.',
          targetSeconds: 120,
        },
      ],
      extraDrills: [
        {
          id: 'ps-8-2-extra-1',
          title: 'Say the bullet points aloud',
          brief:
            'Take a slide full of text and just say it. Notice that it takes fifteen seconds and did not need to be written down.',
          targetSeconds: 30,
        },
        {
          id: 'ps-8-2-extra-2',
          title: 'One number on a screen',
          brief:
            'Build sixty seconds around a single figure, as though it were alone on a slide. Module 5 lesson 27 applies.',
          targetSeconds: 60,
        },
      ],
      mentorWatchFor: [
        'Talks that collapse without slides. That is the finding and it is worth sitting with.',
        'Students who describe a slide by reading it. Describing and reading are different and the difference is audible.',
        'Anyone who built the deck first. Ask; the answer is usually visible in the structure.',
      ],
      selfCheck: [
        'Did your talk survive with no slides?',
        'Could your slides be understood without you? If yes, that is a document.',
      ],
    }),

    lesson(8, 2, 45, 'Debating a position', {
      oneLine: 'A debate is not a speech with an opponent — you are being judged on how you handle what they said.',
      idea: [
        'The commonest debating error is delivering your prepared case regardless of what the other side has argued. It is safe, it is easy, and it loses, because the judge is watching for engagement and you have shown none.',
        'So take notes while they speak, and open by naming their strongest point. "Their case rests on X. Let me take that seriously for a moment." You have now demonstrated that you were listening, which most opponents will not have.',
        'Then choose your ground. You cannot answer everything in three minutes. Pick the load-bearing claim — the one that, if it falls, takes the rest with it — and spend your time there rather than distributing it evenly.',
        'And hold your position under pressure without becoming rigid. "That is fair, and it does not change the main point, because…" concedes a detail and keeps the argument. Conceding nothing at all reads as not having listened, which is the thing you were trying to avoid.',
      ],
      drills: [
        {
          id: 'ps-8-3-steelman',
          title: 'Their strongest point, said fairly',
          brief:
            'State the opposing case as well as its own advocate would. Forty-five seconds. If your version is weaker than theirs, you are not ready to argue against it.',
          targetSeconds: 45,
        },
        {
          id: 'ps-8-3-rebut',
          title: 'Rebut the load-bearing claim',
          brief:
            'Name the one claim their case depends on, and spend ninety seconds on that alone. Resist answering everything.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-8-3-extra-1',
          title: 'Switch sides',
          brief:
            'Argue the position you actually hold, then argue the opposite, ninety seconds each. Whichever is harder is the one you understand least.',
          targetSeconds: 180,
        },
        {
          id: 'ps-8-3-extra-2',
          title: 'Concede and hold',
          brief:
            'Concede one real point and explain why your case survives. Thirty seconds. Module 5 lesson 28 is the same skill under more pressure.',
          targetSeconds: 30,
        },
      ],
      mentorWatchFor: [
        'Prepared cases delivered regardless. Ask what the other side said; the answer tells you whether they listened.',
        'Steel-manning that is secretly straw-manning. Have the opponent judge whether their case was fairly stated.',
        'Students who concede nothing. It reads as not listening, however strong the argument.',
      ],
      selfCheck: [
        'Was your version of their case one they would accept?',
        'Which claim did you choose to attack, and was it really load-bearing?',
      ],
    }),

    lesson(8, 3, 46, 'Giving and receiving feedback', {
      oneLine: 'Useful feedback names a moment and a change — everything else is an opinion about a person.',
      idea: [
        'The feedback most people give is "that was really good" and the feedback most people want is "what should I do differently". The gap between those two is why a class of students can watch each other for a term and nobody improves.',
        'Useful feedback has three parts: the moment, what happened, and what to try. "At about a minute in, when you got to the second point, you sped right up — try a full stop before it." Nothing about the person. Nothing general.',
        'Receiving it is a separate skill and mostly consists of not defending. The urge to explain why you did the thing is very strong and it wastes the only feedback you will get. Write it down, say thank you, decide later whether you agree.',
        'And ask for something specific. "Was that clear?" produces "yes". "Where did you lose me?" produces a moment. You will get the quality of feedback your question deserves.',
      ],
      drills: [
        {
          id: 'ps-8-4-give',
          title: 'Moment, what, change',
          brief:
            'Play back one of your own earlier recordings and give yourself feedback in that shape, out loud. Three pieces. Being specific about yourself is harder than about anyone else.',
          targetSeconds: 60,
        },
        {
          id: 'ps-8-4-ask',
          title: 'The question that gets an answer',
          brief:
            'Record three specific questions you could ask somebody who watched you speak. Not "was it good". Twenty seconds.',
          targetSeconds: 25,
        },
      ],
      extraDrills: [
        {
          id: 'ps-8-4-extra-1',
          title: 'Take it without defending',
          brief:
            'Have somebody give you three pieces of feedback. Record yourself repeating them back with no justification of any kind. Harder than it sounds.',
          targetSeconds: 45,
        },
        {
          id: 'ps-8-4-extra-2',
          title: 'Feedback on a stranger',
          brief:
            'Watch any speech online and give ninety seconds of feedback in the three-part shape. Practising on somebody you do not know removes the politeness problem.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Feedback about the person rather than the moment. "You are confident" is not actionable.',
        'Defending. It happens within three seconds and students rarely notice they are doing it.',
        'Students who cannot find anything to say about their own recordings. Give them one specific thing to listen for.',
      ],
      selfCheck: [
        'Did your feedback name a moment, or a quality?',
        'When you last received feedback, did you explain yourself? Be honest.',
      ],
    }),

    lesson(8, 4, 47, 'A speech about something that matters to you', {
      oneLine: 'Everything in this course, at once, on a subject you actually care about — which is the only test that counts.',
      idea: [
        'This is the last lesson and it is the reason for the other forty-five. Four to five minutes, to real people, on something you genuinely hold. Not an exercise on an assigned topic. Yours.',
        'The subject matters more than any technique. An audience forgives a great deal from somebody who obviously means it, and forgives almost nothing from somebody performing. Choose something you would argue about at a dinner table.',
        'What to bring from each module: one clear idea and a shape (module 3), an opening that earns attention and an ending that closes the loop (module 3), a story with a turn in it (module 6), one number with a comparison (module 5), the strongest objection raised and answered (module 5), and the pauses (module 1, which will be the first thing to go when you are nervous).',
        'And the thing that will actually decide it: whether you have said it out loud enough times. Not read it. Said it. The lab is right there, and the difference between a fourth rehearsal and a first is larger than the difference between any two techniques in this course.',
      ],
      drills: [
        {
          id: 'ps-8-5-skeleton',
          title: 'The skeleton, from memory',
          brief:
            'Opening sentence, three points, closing sentence. Nothing else. If you cannot say it from memory, you are not ready to rehearse the full thing.',
          targetSeconds: 45,
        },
        {
          id: 'ps-8-5-full',
          title: 'The full speech',
          brief:
            'Four to five minutes, everything applied. Record it. Then record it again tomorrow, and again the day after — and compare the three reports. That comparison is the last thing this course has to teach you.',
          targetSeconds: 270,
        },
      ],
      extraDrills: [
        {
          id: 'ps-8-5-extra-1',
          title: 'The same speech in ninety seconds',
          brief:
            'Cut it to a third. What survives is the speech; the rest was elaboration. Module 3 lesson 18, at full scale.',
          targetSeconds: 90,
        },
        {
          id: 'ps-8-5-extra-2',
          title: 'Opening and closing alone',
          brief:
            'Just the first fifteen seconds and the last fifteen. Rehearse those until they are exact. The middle can be loose; these cannot.',
          targetSeconds: 30,
        },
      ],
      mentorWatchFor: [
        'Subjects chosen because they seem appropriate. Ask what they would argue about at dinner and use that instead.',
        'Whether they rehearsed out loud. The recording count answers it and the delivery confirms it.',
        'This is the lesson to compare against their very first recording, in front of the class if they will allow it. Forty-seven lessons of argument, settled by two numbers.',
      ],
      selfCheck: [
        'How many times did you say it out loud before the real one? Under four is under-rehearsed.',
        'Put your lesson-one recording next to this one. What changed?',
      ],
    }),
  ],
};
