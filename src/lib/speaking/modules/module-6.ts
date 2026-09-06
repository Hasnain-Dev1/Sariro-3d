import { lesson, type SpeakingModule } from '@/lib/speaking/lesson';

/**
 * Module 6 — Storytelling
 *
 * The module students enjoy most and the one where the lab's numbers matter
 * least. A story is the one form where a long pause, a slow patch and a sudden
 * change of pace are all correct, so the reports here should be read as
 * description rather than as a score to improve.
 */
export const module6: SpeakingModule = {
  num: 6,
  title: 'Storytelling',
  outcome: 'Find the story inside your material and tell it with setup, turn and resolution.',
  lessons: [
    lesson(6, 0, 31, 'Why stories are remembered and facts are not', {
      oneLine: 'A fact asks to be filed; a story asks what happens next, and the second question is the one people stay for.',
      idea: [
        'Give an audience twelve facts and a story, and a week later they have the story and possibly one fact — usually the one that was in the story. This is not a weakness in audiences. It is what memory is for.',
        'The mechanism is anticipation. A story creates an open question in the first few seconds, and an open question is uncomfortable in a way that makes people pay attention until it closes. A fact closes immediately, which is why it slides off.',
        'This does not mean facts are useless. It means facts travel inside stories. The number you most want remembered should be the number in the story, not the number on the slide.',
      ],
      model: {
        text: 'The safety inspector had been doing the job for eleven years. On the Tuesday, for reasons he still cannot explain, he walked the line backwards. That is the only reason he saw it.',
        noticing: [
          'Three sentences, and you already want to know what he saw.',
          'The fact — eleven years — is inside the story rather than beside it, so it survives.',
          '"For reasons he still cannot explain" is an open question deliberately left open.',
        ],
      },
      drills: [
        {
          id: 'ps-6-1-facts',
          title: 'Three facts, flat',
          brief:
            'State three facts about a subject you know. Sixty seconds. Deliberately no story. Keep this recording.',
          targetSeconds: 60,
        },
        {
          id: 'ps-6-1-story',
          title: 'One of them, as a story',
          brief:
            'Take the most interesting of those three facts and tell it as something that happened to someone. Same sixty seconds. Play the two back to a friend a day later and ask which they remember.',
          targetSeconds: 60,
        },
      ],
      extraDrills: [
        {
          id: 'ps-6-1-extra-1',
          title: 'The open question',
          brief:
            'Open a story and stop before the answer. Thirty seconds that leave a listener hanging. Notice how little it takes.',
          targetSeconds: 30,
        },
        {
          id: 'ps-6-1-extra-2',
          title: 'A number inside a story',
          brief:
            'Take a statistic from your own subject and build ninety seconds of story around it, so the number arrives at the moment it matters.',
          targetSeconds: 90,
        },
      ],
      mentorWatchFor: [
        'Students who tell the story as a list of events. A sequence is not a story until something is at stake.',
        'The pace figure usually varies far more in the story version. Show them.',
        'Anyone who says they have no stories. Everybody does; they have not looked at the right week of their life yet.',
      ],
      selfCheck: [
        'Which of your two recordings would you rather listen to?',
        'Did your pace and variation differ between them? Look at the numbers.',
      ],
    }),

    lesson(6, 1, 32, 'Finding the story inside your material', {
      oneLine: 'You are not looking for a good story — you are looking for the moment something changed.',
      idea: [
        'The most common blocker is believing your material is not story-shaped. Chemistry homework, a school policy, a cricket score. None of those are stories, and all of them contain one, because a story is just a moment where something was one way and then was another.',
        'So look for the change. When did you first understand it? When did somebody get it wrong, expensively? When did the obvious answer turn out to be false? Any of those is a story and none of them requires drama.',
        'The story does not have to be yours, and it does not have to be big. "The first time I got this wrong in a test" is a perfectly good story and better than a borrowed one about a famous person, because you were there.',
      ],
      drills: [
        {
          id: 'ps-6-2-find',
          title: 'The moment it changed',
          brief:
            'Take a subject you know well. Say, out loud, the moment you first understood it — where you were, what you were doing, what changed. Sixty seconds.',
          targetSeconds: 60,
        },
        {
          id: 'ps-6-2-boring',
          title: 'The most boring subject you have',
          brief:
            'Pick the dullest thing you know about and find a story in it. Ninety seconds. If you can do this you can do it with anything.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-6-2-extra-1',
          title: 'Three candidate stories',
          brief:
            'For one subject, name three different moments that could be the story. Fifteen seconds each. Choosing is easier once you can see three.',
          targetSeconds: 45,
        },
        {
          id: 'ps-6-2-extra-2',
          title: 'Somebody getting it wrong',
          brief:
            'Tell the story of a mistake — yours or somebody else\'s — in your subject. Mistakes are the most reliable stories there are.',
          targetSeconds: 75,
        },
      ],
      mentorWatchFor: [
        'Students reaching for famous examples. Their own week is nearly always better material.',
        'Stories with no change in them. Ask "and what was different afterwards?" until there is an answer.',
        'The boring-subject drill is the one that proves the lesson. Do it in class if there is time.',
      ],
      selfCheck: [
        'What changed in your story? Say it in one sentence.',
        'Were you there? If not, is there a version where you were?',
      ],
    }),

    lesson(6, 2, 33, 'Setup, turn and resolution', {
      oneLine: 'Three parts, and the middle one is the story — most beginners spend all their time on the first.',
      idea: [
        'Setup: who, where, and what was normal. Turn: the thing that broke normal. Resolution: what was true afterwards. That is the whole architecture and it works at thirty seconds or thirty minutes.',
        'The mistake is a setup that will not end. Background, context, more background, and the audience is four minutes in with nothing at stake. A setup should be as short as it can be while still making the turn matter — often two sentences.',
        'The resolution is not "and that is why X is important". That is a moral, and a story that explains itself has stopped trusting the listener. Say what happened. Let them do the last step; they are better at it than you think, and it is the step that makes it theirs.',
      ],
      model: {
        text: 'For three years the machine ran perfectly. Then, one Tuesday in March, it stopped — and the man who built it had died the previous winter, and had never written anything down. It took us eleven weeks. We now write everything down.',
        noticing: [
          'Setup: one sentence. Three years, perfect.',
          'Turn: the stop, and the thing that made it terrible.',
          'Resolution: four words. No moral, no "which teaches us that".',
        ],
      },
      drills: [
        {
          id: 'ps-6-3-three',
          title: 'Setup, turn, resolution',
          brief:
            'Tell a story in exactly three sentences — one for each part. Then tell the same story in ninety seconds. The three-sentence version is the skeleton and it should survive.',
          targetSeconds: 30,
        },
        {
          id: 'ps-6-3-full',
          title: 'The full version',
          brief:
            'Ninety seconds, same story, properly told. Check that your setup is still short — most people expand it back out without noticing.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-6-3-extra-1',
          title: 'Start at the turn',
          brief:
            'Tell the same story beginning at the turn, and fill in the setup afterwards. It is how most good storytellers actually work.',
          targetSeconds: 90,
        },
        {
          id: 'ps-6-3-extra-2',
          title: 'End without the moral',
          brief:
            'Tell a story and stop at the last thing that happened. Resist explaining it. Sit in the silence for three seconds.',
          targetSeconds: 75,
        },
      ],
      mentorWatchFor: [
        'Setups that run to half the story. Time it in class; students are always surprised.',
        'Resolutions that explain. "Which just goes to show" is the phrase to listen for.',
        'Stories with no turn — a sequence of events where nothing broke. Very common in first attempts.',
      ],
      selfCheck: [
        'How long was your setup as a fraction of the whole? Over a third is too long.',
        'Did you explain the ending? Listen back.',
      ],
    }),

    lesson(6, 3, 34, 'Detail, and how much is enough', {
      oneLine: 'One specific detail makes a story real; six make it a description.',
      idea: [
        'Detail is what separates a story from a summary. "It was raining" is a summary. "The bus shelter had one working light and it was flickering" puts the listener there. The specific detail is doing work that no amount of adjective can.',
        'But the ratio matters. One vivid detail per beat is plenty. A story where everything is described in that much detail stops moving, and a story that stops moving stops being a story.',
        'Choose details that carry information as well as texture. The flickering light tells you it is late, the place is neglected, and nobody is coming. Three things in eight words. A detail that only decorates is one you can cut.',
      ],
      drills: [
        {
          id: 'ps-6-4-onedetail',
          title: 'One detail per beat',
          brief:
            'Tell a ninety-second story with exactly three vivid details — one in the setup, one at the turn, one in the resolution. No more. Choosing which three is the drill.',
          targetSeconds: 90,
        },
        {
          id: 'ps-6-4-toomany',
          title: 'Too much detail, on purpose',
          brief:
            'Tell the same story describing everything. Ninety seconds. Listening back to a story that will not move is the most efficient way to learn this.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-6-4-extra-1',
          title: 'The detail that carries information',
          brief:
            'Describe a place in one sentence that also tells the listener the time of day, the season and whether anyone cares for it.',
          targetSeconds: 20,
        },
        {
          id: 'ps-6-4-extra-2',
          title: 'A passage of specificity',
          brief: 'Read this. Notice how few adjectives there are and how visible it still is.',
          passage:
            'There were two chairs, one of them broken, and a kettle that had been descaled so many times the plastic had gone soft at the handle. Somebody had left a spoon in the sink. It was still warm.',
          targetSeconds: 25,
        },
      ],
      mentorWatchFor: [
        'Adjective stacking — "a beautiful, sunny, wonderful day" — which is the opposite of specificity.',
        'Students who cannot cut to three details. Ask which one they would keep.',
        'Details invented for effect. In a true story that is a problem, and module 5 lesson 30 applies.',
      ],
      selfCheck: [
        'Name your three details. Does each one tell the listener something beyond how it looked?',
        'Which version moved — the sparse one or the described one?',
      ],
    }),

    lesson(6, 4, 35, 'Humour that does not misfire', {
      oneLine: 'The safest joke is one where you are the target, and the most dangerous is one where the audience is.',
      idea: [
        'Humour buys enormous goodwill and costs nothing when it works. When it does not, it costs more than the goodwill was worth, and the failure mode is not silence — it is the audience deciding what kind of person you are.',
        'The reliable form is self-directed. A story where you were the fool is funny, safe, and does something else useful: it makes you likeable at exactly the moment you are asking to be believed.',
        'The unreliable forms all involve somebody else. Anybody in the room, anybody the room might belong to, and anybody who cannot answer back. If you have to weigh whether it is acceptable, you already have your answer.',
        'And the delivery rule: do not signal it. "This is quite funny actually" guarantees that it is not. Deliver the line straight, pause, and let the room decide. If nothing happens, carry on as though nothing was supposed to.',
      ],
      drills: [
        {
          id: 'ps-6-5-self',
          title: 'The time you were the fool',
          brief:
            'Tell a story in which you got something wrong, and let it be funny. Sixty seconds. Do not announce that it is funny.',
          targetSeconds: 60,
        },
        {
          id: 'ps-6-5-pause',
          title: 'The line, then the pause',
          brief:
            'Deliver a funny line and stop for two full seconds. The pause is where the laugh goes, and speaking through it kills more jokes than bad writing does.',
          targetSeconds: 30,
        },
      ],
      extraDrills: [
        {
          id: 'ps-6-5-extra-1',
          title: 'Recovering from silence',
          brief:
            'Deliver a joke, imagine nobody laughs, and carry on without acknowledging it. This is the skill that makes trying a joke survivable.',
          targetSeconds: 45,
        },
        {
          id: 'ps-6-5-extra-2',
          title: 'Signalled versus straight',
          brief:
            'Deliver the same line twice — once announcing it, once straight. The difference is not subtle.',
          targetSeconds: 30,
        },
      ],
      mentorWatchFor: [
        'Jokes at the expense of anyone in the room, however affectionate. Set the rule before the drill starts.',
        'Speaking through the laugh line. Very common and entirely fixable with the two-second pause.',
        'Students who apologise after a joke lands flat. That is what turns a small silence into a large one.',
      ],
      selfCheck: [
        'Was your joke about you? If not, who was it about, and would they mind?',
        'Did you pause after the line, or keep talking?',
      ],
    }),

    lesson(6, 5, 36, 'Telling a story about yourself', {
      oneLine: 'The story that works is one you have some distance from — if it still hurts, it is not ready to be material.',
      idea: [
        'Personal stories are the most powerful thing in a speaker\'s hands and the easiest to get wrong. A story about your own failure, told well, does more for your credibility than any qualification. The same story told too soon makes the room look after you instead of listening to you.',
        'The test is distance. Can you tell it without needing a particular reaction? If you need the audience to be sympathetic, or impressed, or angry on your behalf, you are not telling a story — you are asking for something, and they can feel it.',
        'Keep the ending forward-facing. "And that is why I now do X" gives the listener something to do with what you have just handed them. Without it, a personal story is an unresolved chord and the room stays uncomfortable.',
        'And it must be true. Not approximately true, not composited from three occasions. You will tell this story many times, some of those to people who were there.',
      ],
      drills: [
        {
          id: 'ps-6-6-own',
          title: 'Something that went wrong',
          brief:
            'Ninety seconds about a time you failed at something. True, specific, and ending on what you do differently now. If you cannot get through it, choose a different story — that is information, not weakness.',
          targetSeconds: 90,
        },
        {
          id: 'ps-6-6-distance',
          title: 'The same story, no sympathy asked',
          brief:
            'Tell it again, deliberately not asking the listener to feel sorry for you. It is usually a better story and often a shorter one.',
          targetSeconds: 90,
        },
      ],
      extraDrills: [
        {
          id: 'ps-6-6-extra-1',
          title: 'A story about being wrong',
          brief:
            'Not a failure — a time you were confidently wrong about something. These are funnier and easier to tell.',
          targetSeconds: 75,
        },
        {
          id: 'ps-6-6-extra-2',
          title: 'Two minutes, your best story',
          brief:
            'The one you would tell if you had one shot. Everything from this module applies at once.',
          targetSeconds: 120,
        },
      ],
      mentorWatchFor: [
        'Stories that are too raw. Say privately that it is a good story for a later year, not that it is a bad story.',
        'Endings that ask for sympathy. The second drill usually fixes it without a conversation.',
        'Composited or improved stories. Ask one follow-up question about a detail and it becomes obvious.',
      ],
      selfCheck: [
        'Could you tell your story to somebody who was there?',
        'Does it end on what you do now, or on how it felt?',
      ],
    }),
  ],
};
