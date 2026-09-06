import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 5 — Persuasion
 *
 * The module where a student stops trying to be heard and starts trying to
 * change something. It carries the course's one explicit ethical lesson,
 * deliberately placed at the end of the module rather than the start: the
 * techniques have to be real before a warning about them means anything.
 */
export const module5: SpeakingModule = {
  num: 5,
  title: 'Persuasion',
  outcome: 'Build a persuasive case, and present evidence so it lands.',
  lessons: [
    lesson(5, 0, 25, 'Knowing what you want them to do', {
      oneLine: 'A persuasive talk has a verb in it — if you cannot name the action, you are informing, not persuading.',
      idea: [
        'Most talks that intend to persuade never say what they want. They present a problem thoroughly, establish that it is serious, and then stop, leaving the audience agreeing and doing nothing. Agreement is not the goal. Agreement is free.',
        'Write the ask as a sentence with a verb and a subject: "I want the head of year to move assembly to Thursday." Now the whole talk has a job, and every part of it can be tested against whether it moves somebody towards that.',
        'The ask should be smaller than you think. People say yes to small things and think about big ones. "Try it for one term" gets agreement that "change it permanently" does not, and one term is how permanent things start.',
      ],
      model: {
        text: 'So here is what I am asking. Not that we scrap it. Just that we run one week without it, in November, and count what actually breaks.',
        noticing: [
          'The ask is explicit and has a verb.',
          'It is deliberately smaller than the speaker\'s real position — "not that we scrap it" removes the objection before it is raised.',
          'It has a date and a measure, so saying yes is a decision rather than a feeling.',
        ],
      },
      drills: [
        {
          id: 'ps-5-1-ask',
          title: 'The ask, in one sentence',
          brief:
            'Say what you want somebody to do. One sentence, with a verb, naming who does it. Ten seconds. Then say it again, smaller.',
          targetSeconds: 20,
        },
        {
          id: 'ps-5-1-toward',
          title: 'Ninety seconds towards the ask',
          brief:
            'Give a talk that ends on that sentence. Everything before it must earn it. If a section does not move the listener closer to saying yes, cut it — module 3 lesson 18 applies here more than anywhere.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-5-1-extra-1',
          title: 'The same case, three asks',
          brief:
            'One argument, three different requests: a big one, a small one, and a trial. Say which you would actually make.',
          targetSeconds: 45,
        },
        {
          id: 'ps-5-1-extra-2',
          title: 'Informing versus persuading',
          brief:
            'Give sixty seconds that only informs, then sixty that persuades, on the same subject. Hearing the difference in your own voice is the lesson.',
          targetSeconds: 120,
        },
      ],
      mentorWatchFor: [
        'Talks with no ask at all. Ask the student what they want to happen and watch them realise they had not decided.',
        'Asks that are feelings — "I want people to care more". Not a verb anybody can perform.',
        'Students who cannot make the ask smaller. Usually a sign they think compromise is losing.',
      ],
      selfCheck: [
        'What is your ask? Say it now, in one sentence.',
        'Could somebody in your audience do it tomorrow?',
      ],
    }),

    lesson(5, 1, 26, 'Ethos, pathos and logos', {
      oneLine: 'Why should they believe you, why should they care, and does the argument hold — you need all three and most people use one.',
      idea: [
        'Aristotle named these two and a half thousand years ago and nothing better has replaced them. Ethos is your standing: why this person, on this subject. Pathos is what the audience feels. Logos is whether the reasoning works.',
        'Almost everybody has a default. Analytical people give all logos and wonder why nobody moved. Warm people give all pathos and get agreement that evaporates by lunchtime. The talks that actually change things use all three, usually in that order: standing, then feeling, then reasoning.',
        'Ethos is the one people neglect most and it is the cheapest to establish. One sentence about why you, specifically, are the person saying this. Not a CV — a reason. "I have run this event for three years" is enough, and without it your evidence has to do work it should not have to.',
      ],
      model: {
        text: 'I have marked six hundred of these papers. I want to tell you about the eleven that made me stop, and then I want to show you the number that explains them.',
        noticing: [
          'Ethos in the first six words — six hundred papers is standing, not boasting.',
          'Pathos promised next: eleven papers that made her stop is a story about to happen.',
          'Logos last: a number that explains them. All three, in one sentence, in the right order.',
        ],
      },
      drills: [
        {
          id: 'ps-5-2-three',
          title: 'One sentence each',
          brief:
            'On your subject: one sentence of ethos, one of pathos, one of logos. Say them in that order with pauses between. Thirty seconds. Notice which one you found hardest.',
          targetSeconds: 30,
        },
        {
          id: 'ps-5-2-weakest',
          title: 'Two minutes on your weakest',
          brief:
            'Whichever of the three you found hardest, build a whole talk out of it. Working the weak side is the only way it gets less weak.',
          targetSeconds: 120,
        },
      ],
      extraDrills: [
        {
          id: 'ps-5-2-extra-1',
          title: 'Logos only',
          brief: 'Ninety seconds of pure reasoning, no story, no standing. Then listen to how cold it is.',
          targetSeconds: 90,
        },
        {
          id: 'ps-5-2-extra-2',
          title: 'Pathos only',
          brief: 'Ninety seconds of pure feeling, no evidence. Then ask yourself whether you would act on it tomorrow.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Which of the three the student defaults to. It is usually stable and worth naming to them explicitly.',
        'Ethos delivered as boasting. The difference is whether it explains the talk or decorates the speaker.',
        'Students who think pathos means being sad. Anger, delight and curiosity are all pathos.',
      ],
      selfCheck: [
        'Which was hardest to write? That is your weak side.',
        'Say your ethos sentence. Does it explain why you are speaking, or is it a list of things about you?',
      ],
    }),

    lesson(5, 2, 27, 'Evidence, and how to present it', {
      oneLine: 'One number a listener can hold beats five they cannot — and every number needs a comparison to mean anything.',
      idea: [
        'A statistic on its own is a noise. "Forty-two thousand" means nothing until you know whether that is a lot. The comparison is not decoration; it is the part that carries the meaning.',
        'The most useful move is to scale the number to something in the room. "Enough to fill this hall eleven times." "One in every four people you passed today." A listener who can picture it will still have it tomorrow.',
        'And use fewer. A talk with one memorable figure is more persuasive than one with six, because six figures is a table, and nobody remembers a table. Choose the one that does the most work and let the others go.',
      ],
      model: {
        text: 'We waste about eight hundred hours a year on it. That is one person, full time, from January to May, doing nothing else.',
        noticing: [
          'The raw number first, then the comparison that makes it land.',
          'The comparison is human-scale — a person and a stretch of months, not a percentage.',
          'One figure, said twice, in two ways. Not six figures said once each.',
        ],
      },
      drills: [
        {
          id: 'ps-5-3-number',
          title: 'One number, two ways',
          brief:
            'State a figure that matters to your argument. Then restate it as a comparison your listener can picture. Twenty seconds. If the comparison is harder than the number, you have found the real work.',
          targetSeconds: 20,
        },
        {
          id: 'ps-5-3-evidence',
          title: 'A case built on one figure',
          brief:
            'Ninety seconds using exactly one statistic. Everything else is reasoning and example. Most people find this harder than using five.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-5-3-extra-1',
          title: 'Five figures, on purpose',
          brief:
            'Deliver a minute crammed with numbers. Listen back and try to recall any of them. That experiment settles the argument.',
          targetSeconds: 60,
        },
        {
          id: 'ps-5-3-extra-2',
          title: 'Read a passage of comparison',
          brief: 'Read this and notice how each figure is anchored to something you can see.',
          passage:
            'A blue whale\'s heart weighs as much as a small car. Its arteries are wide enough for a child to crawl through. And it beats, at the deepest part of a dive, twice a minute.',
          targetSeconds: 25,
        },
      ],
      mentorWatchFor: [
        'Percentages with no base. "Up forty per cent" from what, and of what?',
        'Comparisons that are not comparisons — "a huge number" is an adjective, not an anchor.',
        'Students who cannot cut to one figure. Ask which one they would keep if they had ten seconds.',
      ],
      selfCheck: [
        'Say your one number and its comparison from memory.',
        'Could a listener repeat it to somebody else tomorrow?',
      ],
    }),

    lesson(5, 3, 28, 'Anticipating the objection', {
      oneLine: 'Raise the strongest objection yourself, early, and answer it — it is the most persuasive thing you can do and almost nobody does it.',
      idea: [
        'Your audience is arguing with you the whole time you are speaking. They have an objection, and until it is dealt with they are not listening to anything else — they are waiting for a gap in which to raise it.',
        'So raise it for them. "The obvious problem with this is cost, and it is a real problem, so let me deal with it now." Three things happen at once: the objection is disarmed, you have shown you understand the other side, and you have bought the credibility to be believed on everything else.',
        'It has to be the strongest objection, not a weak one you can knock over. An audience knows the difference immediately, and demolishing a straw man costs you more standing than saying nothing would have.',
      ],
      model: {
        text: 'Now, the fair criticism of this is that we tried something similar in 2021 and it failed. That is true. I was there. Here is what was different, and here is what I think we got wrong.',
        noticing: [
          '"The fair criticism" — naming it as fair rather than as a misunderstanding.',
          '"I was there" is ethos delivered at the exact moment it is needed most.',
          'Concedes something real. An argument that concedes nothing is not believed.',
        ],
      },
      drills: [
        {
          id: 'ps-5-4-objection',
          title: 'The strongest objection',
          brief:
            'State your case in one sentence. Then state the best argument against it — genuinely the best — and answer it. Sixty seconds.',
          targetSeconds: 60,
        },
        {
          id: 'ps-5-4-concede',
          title: 'Concede something real',
          brief:
            'Ninety seconds in which you admit one thing your opponents are right about, and explain why your case survives it anyway.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-5-4-extra-1',
          title: 'Argue the other side',
          brief:
            'Ninety seconds arguing against your own position, as well as you can. It is the fastest way to find out whether you understand it.',
          targetSeconds: 90,
        },
        {
          id: 'ps-5-4-extra-2',
          title: 'The weak objection, for contrast',
          brief:
            'Deliberately raise a feeble objection and knock it down. Listen back. You can hear the dishonesty, and so can an audience.',
          targetSeconds: 45,
        },
      ],
      mentorWatchFor: [
        'Straw men. Ask the class whether that was really the strongest objection.',
        'Students who cannot state the other side at all. They have not understood their own argument yet.',
        'Concessions that concede nothing — "some people say X, but they are wrong" is not a concession.',
      ],
      selfCheck: [
        'Is the objection you raised genuinely the strongest one? Ask somebody who disagrees with you.',
        'What did you concede? If the answer is nothing, try again.',
      ],
    }),

    lesson(5, 4, 29, 'Rhetorical devices that still work', {
      oneLine: 'Four devices, two and a half thousand years old, still doing the same job — and one of them you already use.',
      idea: [
        'The rule of three. "Government of the people, by the people, for the people." Three has a completeness that two lacks and four dilutes. It is the most reliable device there is and you already use it without noticing.',
        'Repetition of an opening phrase. "I have a dream that…" four times over. It builds because the listener starts anticipating the phrase, and anticipation is attention.',
        'The contrast pair. "Ask not what your country can do for you; ask what you can do for your country." Two halves that mirror each other, the second reversing the first. It is memorable because the shape is memorable.',
        'And the deliberate short sentence after a long one. A paragraph of complex reasoning, then four words. It stops the room. Use it once in a talk, not four times.',
      ],
      model: {
        text: 'We will not be quiet, we will not be patient, and we will not be told that next year is soon enough. Not this time.',
        noticing: [
          'Rule of three, with a repeated opening — two devices in one sentence.',
          '"Not this time" is the short sentence after the long one, doing the stopping.',
          'Read it without the last three words. It deflates.',
        ],
      },
      drills: [
        {
          id: 'ps-5-5-three',
          title: 'A rule of three, out loud',
          brief:
            'Make your case in three parallel phrases. Then say it again with only two, and again with four. Listen to why three wins.',
          targetSeconds: 45,
        },
        {
          id: 'ps-5-5-contrast',
          title: 'The contrast pair',
          brief:
            'Write one contrast pair for your subject and deliver it. Then deliver the passage below and compare the shape of yours to the shape of these.',
          passage:
            'It is not that we lack the time. It is that we have never been asked to spend it on this.',
          targetSeconds: 30,
        },
      ],
      extraDrills: [
        {
          id: 'ps-5-5-extra-1',
          title: 'Long, long, short',
          brief:
            'Deliver two long complex sentences and then one of four words. The pause before the short sentence is doing as much as the words.',
          targetSeconds: 40,
        },
        {
          id: 'ps-5-5-extra-2',
          title: 'Too many devices',
          brief:
            'Cram four devices into sixty seconds. Listen back. Rhetoric you can hear as rhetoric has stopped working, and that is worth experiencing once.',
          targetSeconds: 60,
        },
      ],
      mentorWatchFor: [
        'Devices delivered flat. A rule of three needs the third item to land harder, and that is delivery, not writing.',
        'Students who now sound like a politician. The over-use drill is the cure and it is best done deliberately.',
        'A contrast pair whose halves are not actually parallel. Say it aloud twice and the wobble is audible.',
      ],
      selfCheck: [
        'Say your rule of three. Does the third item land hardest?',
        'Which device felt natural, and which felt like costume?',
      ],
    }),

    lesson(5, 5, 30, 'The ethics of persuasion', {
      oneLine: 'Everything in this module works whether or not you are right, which is exactly why it is the last lesson.',
      idea: [
        'You now have techniques that move people. They work on true claims and false ones equally well, and they work best on people who trust you. That is not a comfortable fact and it is not one this course is going to skip past.',
        'The line is simpler than the philosophy suggests. Would you be willing to show this audience exactly how you constructed this talk? If the answer is yes, you are persuading. If explaining your technique would make them feel got at, you are manipulating.',
        'Three specific rules. Do not present a figure you would not defend. Do not use a story you would not repeat with the person in it standing beside you. And do not raise an objection you know is not the real one in order to avoid the one that is.',
        'The practical argument, if the moral one does not land: persuasion is repeated. You will speak to these people again. Somebody who realises they were handled does not merely disagree with you next time — they discount everything you have ever said.',
      ],
      drills: [
        {
          id: 'ps-5-6-honest',
          title: 'The case you actually believe',
          brief:
            'Two minutes making the strongest possible case for something you genuinely hold, using every technique from this module. Nothing in it you would not defend.',
          targetSeconds: 120,
        },
        {
          id: 'ps-5-6-showwork',
          title: 'Show your working',
          brief:
            'Now record yourself explaining how you built that talk — the ask, the ethos, the number, the objection, the devices. If explaining it feels fine, the talk was honest.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-5-6-extra-1',
          title: 'The line, in your words',
          brief:
            'Sixty seconds on where you think persuasion becomes manipulation. There is no correct answer and having said yours out loud matters.',
          targetSeconds: 60,
        },
        {
          id: 'ps-5-6-extra-2',
          title: 'A case you do not hold',
          brief:
            'Argue for something you disagree with, honestly and without distortion. Then say out loud what you would not do to win it.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Students who find the show-your-working drill uncomfortable. That discomfort is the lesson landing and should be discussed, not smoothed over.',
        'Anyone who concludes the techniques are therefore bad. The answer is that a sharp knife is not a moral category.',
        'The "case you do not hold" drill can go wrong. Set the boundary before it starts.',
      ],
      selfCheck: [
        'Would you be happy for your audience to hear your show-your-working recording?',
        'Was there anything in your talk you would quietly rather they did not check?',
      ],
    }),
  ],
};
