import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 7 — Speaking in Real Situations
 *
 * The module a parent bought the course for. Everything before this has been
 * practice; this is the interview, the viva, the presentation and the group
 * discussion — the four rooms where being able to speak actually changes what
 * happens to a student's life.
 *
 * The drills here are deliberately closer to rehearsal than to exercise. A
 * student should leave this module with actual answers to actual questions,
 * recorded, that they can play back the night before.
 */
export const module7: SpeakingModule = {
  num: 7,
  title: 'Speaking in Real Situations',
  outcome: 'Handle an interview, a viva, and a presentation to a class or a meeting.',
  lessons: [
    lesson(7, 0, 37, 'The interview', {
      oneLine: 'An interview answer is thirty to ninety seconds long, has one point, and ends — the commonest failure is not stopping.',
      idea: [
        'Interviewers are not testing whether you can talk. They are testing whether you can answer the question that was asked, in a length a human can absorb, without needing to be rescued.',
        'The shape that works nearly everywhere: answer, then evidence, then relevance. Say the thing. Give one example. Say why it matters here. Thirty to ninety seconds, then stop and let them ask the next one.',
        'Two failures dominate. Answering a different, easier question than the one asked — which every interviewer notices. And not stopping: a good ninety-second answer followed by forty seconds of "so, yeah, that was probably the main thing" undoes itself.',
        'And the silence after your answer is the interviewer\'s job to fill, not yours. Candidates lose far more ground filling it than they ever lose by leaving it — let it sit.',
      ],
      model: {
        text: 'Yes — the hardest part was that nobody owned the decision. I spent the first week just working out who to ask, and eventually I wrote it down and sent it to all four of them. Two replied within an hour. That is the thing I would do first next time.',
        noticing: [
          'Answers the question in the first six words.',
          'One example, told concretely, with a number in it.',
          'Ends on what it means going forward. Then stops — no summary, no trailing.',
        ],
      },
      drills: [
        {
          id: 'ps-7-1-tellme',
          title: '"Tell me about yourself"',
          brief:
            'The question you will definitely be asked. Ninety seconds, no more. Present, then past, then why you are in this room. Rehearse it until it is steady — this is the one answer worth knowing by heart.',
          targetSeconds: 90,
        },
        {
          id: 'ps-7-1-answer-stop',
          title: 'Answer, evidence, relevance, stop',
          brief:
            'Pick any question about yourself and answer it in that shape. Then stop recording immediately. Practising the stop is the drill.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-7-1-extra-1',
          title: 'A weakness, answered honestly',
          brief:
            'Sixty seconds on something you are genuinely not good at, and what you do about it. Rehearsed dishonesty is audible; this is easier told straight.',
          targetSeconds: 60,
        },
        {
          id: 'ps-7-1-extra-2',
          title: 'Three answers, ninety seconds each',
          brief:
            'Why this course, a time you disagreed with someone, and what you would do with a free year. Bank them.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Answers that never end. Time them out loud; students consistently underestimate their own length.',
        'Answering an adjacent question. Ask "and was that the question?" rather than correcting directly.',
        'A rehearsed "tell me about yourself" that sounds rehearsed. It should be known, not recited.',
      ],
      selfCheck: [
        'How long was your answer? Anything over two minutes is a monologue.',
        'Did you stop, or did you trail off?',
      ],
    }),

    lesson(7, 1, 38, 'The viva and the oral exam', {
      oneLine: 'You are being examined on whether you understand it, so say what you know, name what you do not, and never bluff.',
      idea: [
        'A viva is not a conversation and it is not a presentation. An examiner is probing the edges of your understanding, which means the questions will keep going until you reach something you do not know. That is the design, not a failure.',
        'So the most valuable skill is saying "I do not know" well. "I have not read that, but from what I do know I would expect X, and I would check it by Y." That answer scores. A bluffed one loses more than the question was worth, because now everything else you said is in question too.',
        'Structure every answer the same way: the direct answer, then the reasoning, then the limit. "It increases. Because the pressure term dominates at that temperature. Although I am not sure that holds above the critical point."',
        'And slow down. Viva nerves push pace up more than any other situation, and an examiner needs time to follow your reasoning, not just to hear it.',
      ],
      drills: [
        {
          id: 'ps-7-2-explain',
          title: 'Explain something you know, then the edge of it',
          brief:
            'Explain a concept from your studies for sixty seconds. Then, in the last twenty, say exactly where your understanding stops. Naming the limit is the skill.',
          targetSeconds: 80,
        },
        {
          id: 'ps-7-2-dontknow',
          title: 'Saying "I do not know" well',
          brief:
            'Answer a question you genuinely cannot answer. Thirty seconds: what you do not know, what you would expect, and how you would find out.',
          targetSeconds: 30,
        },
      ],
      extraDrills: [
        {
          id: 'ps-7-2-extra-1',
          title: 'Answer, reasoning, limit',
          brief:
            'Three questions from your subject, each answered in that exact shape. Forty seconds each.',
          targetSeconds: 120,
        },
        {
          id: 'ps-7-2-extra-2',
          title: 'The follow-up',
          brief:
            'Answer a question, then ask yourself the hardest follow-up, then answer that. Vivas are chains, not single questions.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Bluffing. It is obvious to an examiner and worth demonstrating in class why.',
        'Pace. Viva recordings are usually the fastest a student produces all course.',
        'Students who apologise for not knowing. Naming a limit is a strength; apologising for it turns it into one.',
      ],
      selfCheck: [
        'What was your pace? Compare it with your storytelling recordings.',
        'Did you name a limit, or did you keep talking until you ran out?',
      ],
    }),

    lesson(7, 2, 39, 'Presenting in a class or a meeting', {
      oneLine: 'The room is small, everybody knows you, and the rules are almost the opposite of a stage.',
      idea: [
        'A presentation to twelve people who know you is not a small version of a speech to four hundred. Projection that works on a stage is shouting in a meeting room. The formality that reads as professional to strangers reads as strange to your classmates.',
        'What transfers: structure, one idea, signposting, the ending. What does not: volume, sweep, and anything performative. Speak as you would to one person at the far end of the table, and everybody hears you.',
        'The real difference is interruption. In a meeting you will be stopped mid-point, and that is normal rather than rude. Answer briefly, then say "so, coming back to the second thing" — the signposting from module 3 is what lets you find your place again.',
        'And know your time. A five-minute slot means five. Running over in a meeting costs you more goodwill than anything you would have said in minute six was worth.',
      ],
      drills: [
        {
          id: 'ps-7-3-fivemin',
          title: 'Three minutes, to a table',
          brief:
            'Present something to an imagined room of ten. Conversational volume, full structure. Stop at three minutes exactly — check the timer against your instinct.',
          targetSeconds: 180,
        },
        {
          id: 'ps-7-3-interrupt',
          title: 'Interrupted, and back',
          brief:
            'Present for two minutes, but stop yourself twice as though interrupted, answer briefly, and signpost your way back. Practising the return is the point.',
          targetSeconds: 120,
        },
      ],
      extraDrills: [
        {
          id: 'ps-7-3-extra-1',
          title: 'Sixty seconds, cold',
          brief:
            'The update nobody warned you about. One minute, three points, no notes.',
          targetSeconds: 60,
        },
        {
          id: 'ps-7-3-extra-2',
          title: 'Stage voice versus room voice',
          brief:
            'The same ninety seconds twice — once projecting, once conversational. Compare. In a meeting the second one wins.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Stage delivery in a room-sized situation. Very common in students who have been practising speeches.',
        'Whether they can find their place after an interruption. This is where module 3 lesson 16 pays off.',
        'Time discipline. Run a visible timer in class; almost everybody overruns their first attempt.',
      ],
      selfCheck: [
        'Did you land within your time? By how much were you out?',
        'Compare your projecting and conversational recordings. Which would you rather sit across from?',
      ],
    }),

    lesson(7, 3, 40, 'Group discussion and turn-taking', {
      oneLine: 'Being heard in a group is mostly about when you speak, not how loudly — and the best move is often building on somebody else.',
      idea: [
        'A group discussion is assessed on contribution, not on volume of speech. The person who talks most is frequently marked down, and the person who says three well-placed things and brings somebody else in is frequently marked up.',
        'Entering is the mechanical problem. Wait for a natural break, then start with a connector rather than a claim: "building on what Priya said", "the thing that follows from that". A connector earns you the floor in a way that a cold start does not, because it shows you were listening.',
        'Bringing somebody in is the highest-value move available and almost nobody does it. "Arjun, you did this last year — what happened?" It costs you nothing, it makes the discussion better, and every assessor in the room notices.',
        'And disagree with the idea, by name, without the person. "I think that runs into a problem" rather than "I disagree with him".',
      ],
      drills: [
        {
          id: 'ps-7-4-connector',
          title: 'Three entries, three connectors',
          brief:
            'Imagine a discussion and record three contributions, each opening with a different connector and each under twenty seconds. Short contributions are the skill.',
          targetSeconds: 60,
        },
        {
          id: 'ps-7-4-bringin',
          title: 'Bring somebody in',
          brief:
            'Make a point, then hand it to somebody else by name with a real question. Twenty seconds. Practise it until it is natural, because under pressure it is the first thing to disappear.',
          targetSeconds: 25,
        },
      ],
      extraDrills: [
        {
          id: 'ps-7-4-extra-1',
          title: 'Disagree without attacking',
          brief:
            'Disagree with a position, out loud, without referring to the person who holds it. Thirty seconds.',
          targetSeconds: 30,
        },
        {
          id: 'ps-7-4-extra-2',
          title: 'Summarise the room',
          brief:
            'Summarise a discussion in thirty seconds, fairly, including the view you disagree with. Whoever does this ends up chairing things.',
          targetSeconds: 30,
        },
      ],
      mentorWatchFor: [
        'Students who prepare a speech and deliver it regardless of what has been said. The connector drill is aimed at exactly this.',
        'Contributions over forty seconds. In a group that is a monologue.',
        'Who brings others in. It is rare, and worth praising loudly the first time it happens.',
      ],
      selfCheck: [
        'How long were your contributions? Under twenty seconds is the target.',
        'Did you bring anybody in? Would you have, in a real room?',
      ],
    }),

    lesson(7, 4, 41, 'Impromptu speaking', {
      oneLine: 'With no time to prepare, you do not need content — you need a shape to pour whatever you have into.',
      idea: [
        'Asked to speak with no warning, most people panic about what to say. The people who are good at this are not thinking about content at all. They have a shape and they fill it, and the shape buys them the seconds in which the content arrives.',
        'Past, present, future. "That used to be true, here is what changed, here is where I think it goes." Works on almost any subject and gives you three sections without thinking.',
        'Point, example, point. Say the thing, tell a story about it, say the thing again in different words. Thirty seconds of story is thirty seconds in which your ending assembles itself.',
        'And open by buying time honestly. Repeating the question back — "whether school should start later, right" — is two seconds, sounds considered, and is not a filler. It is what the pause is for.',
      ],
      drills: [
        {
          id: 'ps-7-5-past',
          title: 'Past, present, future',
          brief:
            'Pick a subject at random — genuinely at random, first noun you see — and speak for sixty seconds using that shape. Do not prepare. Start the recording first, then choose.',
          targetSeconds: 60,
        },
        {
          id: 'ps-7-5-pep',
          title: 'Point, example, point',
          brief:
            'Another random subject, the other shape. Sixty seconds. Having two shapes means one of them will fit.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-7-5-extra-1',
          title: 'Five in a row',
          brief:
            'Five different subjects, thirty seconds each, no gap. By the fourth it stops being frightening, which is the entire finding.',
          targetSeconds: 150,
        },
        {
          id: 'ps-7-5-extra-2',
          title: 'The two-second opening',
          brief:
            'Practise repeating a question back and pausing before answering. Ten seconds. It is the most useful two seconds in impromptu speaking.',
          targetSeconds: 20,
        },
      ],
      mentorWatchFor: [
        'Students who freeze rather than reach for a shape. Ask which shape they are using; it usually restarts them.',
        'Filler in the opening two seconds. The repeat-the-question move replaces it exactly.',
        'The five-in-a-row drill produces visible improvement within one session. Worth doing in class.',
      ],
      selfCheck: [
        'Which shape came more naturally? Use that one under pressure.',
        'By your fifth attempt, was it easier? By how much?',
      ],
    }),

    lesson(7, 5, 42, 'Answering a question you did not expect', {
      oneLine: 'Hear it, understand it, buy two seconds, answer the question that was actually asked.',
      idea: [
        'The unexpected question at the end of a talk is where prepared speakers most often come apart, because everything up to that point was rehearsed and this is not.',
        'Step one is listening to the whole question. The urge to start composing an answer halfway through is very strong and it is how people end up answering something adjacent. Let them finish, even if it is slow.',
        'Step two, when you are not sure: say the question back in your own words. "So you are asking whether this holds for younger students?" It confirms you understood, it buys you three seconds, and about a third of the time the questioner corrects you, which saves you from answering the wrong thing entirely.',
        'Step three: answer briefly, and stop. A short answer invites a follow-up, which is a conversation. A long one is a second speech nobody asked for.',
        'And a hostile question is answered the same way as any other. Answer the content, ignore the tone. An audience watching you stay level while being pushed will side with you without you having to ask.',
      ],
      drills: [
        {
          id: 'ps-7-6-restate',
          title: 'Restate, then answer',
          brief:
            'Have someone ask you three questions, or write three you have not seen. Restate each in your own words before answering. Twenty seconds each.',
          targetSeconds: 60,
        },
        {
          id: 'ps-7-6-hostile',
          title: 'The hostile question',
          brief:
            'Answer a question that is really an accusation, calmly, addressing the content and not the tone. Thirty seconds. Check your pace afterwards — that is where the tell is.',
          targetSeconds: 30,
        },
      ],
      extraDrills: [
        {
          id: 'ps-7-6-extra-1',
          title: 'The question you dread',
          brief:
            'The one you hope nobody asks about your subject. Answer it out loud, properly. It is never as bad the second time.',
          targetSeconds: 60,
        },
        {
          id: 'ps-7-6-extra-2',
          title: 'Short answers only',
          brief:
            'Five questions, fifteen seconds each, hard stop. Brevity under questioning is a separate muscle.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Answers that begin before the question has finished. Almost universal and worth stopping in the moment.',
        'Pace and volume on the hostile question — the tell is usually in the numbers before it is in the words.',
        'Students who answer the question they wish had been asked. Everybody notices except them.',
      ],
      selfCheck: [
        'Did you restate before answering? Every time, or only when it was easy?',
        'On the hostile question, what happened to your pace?',
      ],
    }),
  ],
};
