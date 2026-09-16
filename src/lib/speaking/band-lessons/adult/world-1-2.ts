import { bd, type BandLesson } from '../types';

/**
 * UG, PG & professionals · Worlds 1 and 2 — Voice Valley and Brave Bridge
 *
 * Undergraduates presenting in seminars, postgraduates facing a viva, and
 * working people in meetings, interviews and client calls. The stakes are
 * grades, jobs and credibility, and the audience is peers and seniors — so the
 * examples are college, placement season and the workplace.
 */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('adult', n, part, x);

export const ADULT_WORLD_1: BandLesson[] = [
  {
    number: 1,
    oneLine: 'Strong speakers in meetings and interviews are practised, not born — and practice is measurable.',
    idea: [
      'The colleague who presents calmly to leadership, or the classmate who handles a viva with ease, almost always got there through repetition. Speaking under scrutiny is a trainable skill, in the same way writing or analysis is.',
      'Because it is a skill, it can be measured: words per minute, filler rate, pause use, vocal range. Today you record an honest baseline on something you might actually be asked at work or in college, so that your improvement is evidence rather than a feeling.',
    ],
    drills: [
      d(1, 'a', { title: 'Your baseline', brief: 'Without preparing, explain what you study or what your role involves, as if a senior person you have just met asked you. Sixty seconds.', targetSeconds: 60 }),
      d(1, 'b', { title: 'The same passage, cold', brief: 'Read this aloud once, without rehearsal, as a reading baseline.', passage: 'The most expensive meetings are not the long ones. They are the ones where nobody said the important thing clearly, so the decision was made twice, a week apart, by people who each thought the other had understood.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(1, 'c', { title: 'Your sixty-second introduction', brief: 'Deliver the introduction you would give at the start of a networking event or first team meeting: who you are, what you work on, what you want to learn.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Learners who over-prepare the baseline — it should reflect their unrehearsed habits.', 'Jargon-heavy role descriptions a non-specialist could not follow.', 'Self-deprecating framing before starting.'],
    selfCheck: ['Which number in my baseline matters most for my work or studies?', 'Could someone outside my field follow what I said?'],
    realWorld: 'Explaining your work to a new manager, a panel or a senior stakeholder.',
    writePrompt: 'Write the two situations at work or college where speaking clearly matters most for you, and what "better" would look like in each.',
  },
  {
    number: 2,
    oneLine: 'In a meeting or a talk, attention is earned in the first ten seconds and lost to predictability.',
    idea: [
      'Colleagues and classmates walk in carrying their inbox. An opening like "So, I have been asked to give an update on…" confirms they can keep thinking about something else.',
      'Earn attention with relevance and tension: the decision that needs making, the number that changed, the problem that costs them something, or a clear statement of what they will get from the next five minutes.',
    ],
    model: {
      text: 'We lost three clients last quarter for the same reason, and none of them told us what it was. I found out. It will take four minutes to explain and one decision to fix.',
      noticing: ['A cost the audience already cares about.', 'A time promise and a clear pay-off.'],
    },
    drills: [
      d(2, 'a', { title: 'Ten seconds that earn the rest', brief: 'Deliver only the first fifteen seconds of a project update or seminar presentation, designed so a distracted senior would look up.', targetSeconds: 15 }),
      d(2, 'b', { title: 'The same thing, badly, on purpose', brief: 'Open the same update in the most predictable, preamble-heavy way you have heard, then redo it with your strong opening and continue for thirty seconds.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(2, 'c', { title: 'Hook a technical topic', brief: 'Open a talk on a dry technical subject from your field — a compliance change, a methodology, a data pipeline — in a way that earns attention.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Openings that thank everyone and outline the agenda before saying why it matters.', 'Hooks that overpromise for a routine update.', 'Burying the decision needed at the end.'],
    selfCheck: ['Did my first sentence say why this matters to them?', 'Would a busy senior keep listening?'],
    realWorld: 'The opening of a team update, client call, seminar or conference talk.',
    writePrompt: 'Rewrite the opening of your next update or presentation so its first sentence names a cost, a decision or a benefit for the audience.',
  },
  {
    number: 3,
    oneLine: 'Your credible voice is your conversational one — not the formal "presentation voice" people switch to.',
    idea: [
      'Explaining something to a trusted colleague over coffee, you are clear, varied and persuasive without effort. Stand up in front of a panel and many people switch to a stiff, over-formal register full of passive sentences and flat intonation.',
      'That register reads as nervousness or distance. Aim for the voice you use with one respected peer: the same vocabulary level, contractions, natural emphasis — only slightly slower and more structured.',
    ],
    drills: [
      d(3, 'a', { title: 'Explaining to a colleague', brief: 'Explain a recent piece of work, research or coursework to one trusted peer, conversationally, in forty-five seconds.', targetSeconds: 45 }),
      d(3, 'b', { title: 'The same explanation, to a panel', brief: 'Explain it again as if to a senior panel. Then compare and move the panel version closer to the conversational one.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(3, 'c', { title: 'Strip the corporate voice', brief: 'Say a deliberately jargon-filled sentence about "leveraging synergies to drive outcomes", then say what it actually means in plain words.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Register shift into passive, formal phrasing under observation.', 'Uptalk that makes statements sound like questions.', 'Speed increasing with seniority of the imagined audience.'],
    selfCheck: ['Which version sounded more credible?', 'What formal habits crept in?'],
    realWorld: 'Presenting to senior leadership, a thesis committee or a client without sounding scripted.',
    soundLab: ['th', 'v-w'],
    writePrompt: 'Take a paragraph of formal or jargon-heavy writing from your work or studies and rewrite it as you would say it to a respected colleague.',
  },
  {
    number: 4,
    oneLine: 'A deliberate pause signals authority and gives complex ideas time to land.',
    idea: [
      'Under pressure, professionals accelerate — especially when presenting to seniors — and fill every gap with "um" or "so". Dense information delivered without pauses is not absorbed.',
      'Pause after key numbers, before a recommendation and after a question. Silence of one or two seconds reads as confidence and control, and it is the cheapest upgrade available to your delivery.',
    ],
    model: {
      text: 'Our onboarding takes twenty-one days. Our competitors take five. Every extra day costs us a new hire\'s full salary with none of their output. So the question is simple. Why are we still taking three weeks?',
      noticing: ['A pause after each number lets the comparison land.', 'A longer pause before the final question.'],
    },
    drills: [
      d(4, 'a', { title: 'Read it with the pauses', brief: 'Read this aloud with a clear pause after each number and a longer one before the final question.', passage: 'Our onboarding takes twenty-one days. Our competitors take five. Every extra day costs us a new hire\'s full salary with none of their output. So the question is simple. Why are we still taking three weeks?', targetSeconds: 25 }),
      d(4, 'b', { title: 'The dense update', brief: 'Give a sixty-second update containing at least three figures from your work or studies, pausing after each so it lands.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(4, 'c', { title: 'Hold the silence', brief: 'Ask your audience a real question mid-talk and hold three full seconds of silence before continuing.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Pauses immediately filled with "so" or "right".', 'Pace rising when numbers appear.', 'Pausing mid-phrase rather than after meaning units.'],
    selfCheck: ['Did my key numbers get their own pause?', 'How did the silence feel versus how it sounded?'],
    realWorld: 'Presenting results, budgets or research findings to seniors or examiners.',
    soundLab: ['ed', 's-ending'],
    writePrompt: 'Write a short update with three key figures and mark where you will pause after each and before your recommendation.',
  },
  {
    number: 5,
    oneLine: 'Emphasis tells stakeholders which words matter — a flat delivery implies nothing does.',
    idea: [
      'In a monotone update, the risk sounds exactly as important as the routine item, so the risk is missed. Emphasis is how you rank information for the listener in real time.',
      'Use volume, pitch and pace deliberately. Stress the contrast word ("revenue grew, but margin fell"), slow down for the recommendation, and try lowering your voice for the most serious sentence — it commands more attention than raising it.',
    ],
    model: {
      text: 'I never said we should cut the budget.',
      noticing: ['Stress "never": a denial.', 'Stress "cut": you suggested something else, perhaps reallocating.'],
    },
    drills: [
      d(5, 'a', { title: 'Seven meanings', brief: 'Say the sentence seven times, stressing a different word each time, and state the implied meaning of each.', passage: 'I never said we should cut the budget.', targetSeconds: 45 }),
      d(5, 'b', { title: 'The quiet line', brief: 'Read this status update normally, then deliver the final sentence noticeably slower and quieter.', passage: 'The migration is on schedule. Testing is ninety percent complete, and the team has handled two outages well. But there is one thing you need to hear today. If the vendor slips again, we miss the launch date.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(5, 'c', { title: 'Rank the risks', brief: 'Deliver a sixty-second project status with three items, using emphasis so the one real risk is unmistakable.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Emphasis on every sentence, which flattens everything again.', 'Risks delivered in the same tone as good news.', 'Upward inflection on recommendations.'],
    selfCheck: ['Could a listener tell which item was the risk?', 'Did I use quieter emphasis at least once?'],
    realWorld: 'Status updates, risk reporting and recommendations in meetings.',
    soundLab: ['stress'],
    writePrompt: 'Write a three-item status update and underline the word in each sentence that must carry the emphasis.',
  },
  {
    number: 6,
    oneLine: 'Listening back to yourself is uncomfortable, and it is the fastest feedback you will ever get.',
    idea: [
      'Most professionals never hear how they sound in meetings or interviews, so habits formed years ago persist: "basically" in every sentence, trailing off, a rising tone on statements.',
      'Record real practice — an interview answer, a meeting update — and listen with a checklist: filler rate, pace, whether sentences end strongly, whether the main point is clear within thirty seconds. Fix one thing per recording.',
    ],
    drills: [
      d(6, 'a', { title: 'Your baseline, three weeks on', brief: 'Re-record your lesson-one role explanation and compare it directly with your baseline.', targetSeconds: 60 }),
      d(6, 'b', { title: 'Say what you hear', brief: 'Listen to one of your recordings and record a sixty-second self-review: one strength, one habit, one specific fix.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(6, 'c', { title: 'Filler audit', brief: 'Record a ninety-second answer to "Walk me through your last project" and aim to replace every filler with a silent pause.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Self-reviews that are purely critical.', 'Learners who analyse but never re-record.', 'Filler words that are field-specific ("essentially", "at the end of the day").'],
    selfCheck: ['What is my most frequent filler?', 'What is my one fix for the next recording?'],
    realWorld: 'Preparing for interviews, recorded presentations and video submissions.',
    soundLab: ['q', 'silent'],
    writePrompt: 'Write a self-review of one recording against the checklist: filler rate, pace, strong sentence endings, clarity of main point.',
  },
];

export const ADULT_WORLD_2: BandLesson[] = [
  {
    number: 7,
    oneLine: 'Performance anxiety and excitement are the same physiology — the label you give it changes the outcome.',
    idea: [
      'Before an interview, a viva or presenting to leadership, adrenaline produces a racing heart, dry mouth and shaky voice. The body cannot distinguish threat from opportunity; your interpretation does.',
      'Harvard research on arousal reappraisal found that telling yourself "I am excited" improved performance compared with "I am calm", because suppression fights your physiology while reframing uses it. Experienced presenters still feel it — they have stopped reading it as a warning.',
    ],
    drills: [
      d(7, 'a', { title: 'Talk about being nervous, while nervous', brief: 'Describe honestly, for forty-five seconds, what happens to you before a high-stakes conversation — interview, viva, senior presentation.', targetSeconds: 45 }),
      d(7, 'b', { title: 'The first minute', brief: 'Say "I am excited" out loud, then deliver the first ninety seconds of an important upcoming presentation or interview answer.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(7, 'c', { title: 'Reappraisal script', brief: 'Record the exact sentences you will say to yourself in the five minutes before your next high-stakes meeting.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Learners who treat any nerves as evidence of unsuitability.', 'Over-rehearsal driven by anxiety that removes spontaneity.', 'Avoidance patterns such as always volunteering others to present.'],
    selfCheck: ['What is my body\'s signature response?', 'What sentence will I tell myself next time?'],
    realWorld: 'Job interviews, thesis defences and presenting to senior leadership.',
    writePrompt: 'Write your pre-performance routine for a real upcoming event, including the reappraisal sentence you will use.',
  },
  {
    number: 8,
    oneLine: 'Most "presentation nerves" are under-preparation wearing a disguise.',
    idea: [
      'The anxiety before a meeting often comes from uncertainty about structure, likely questions or the recommendation itself. Preparation resolves those uncertainties; reassurance does not.',
      'Prepare in layers: the one-sentence purpose, a skeleton of opening, three points and close, the three hardest questions you expect, and your answer to each. Do not script every word — scripts break under interruption, skeletons do not.',
    ],
    drills: [
      d(8, 'a', { title: 'First line, last line, three points', brief: 'For a real upcoming meeting or presentation, deliver only your first line, three headline points and your closing line.', targetSeconds: 30 }),
      d(8, 'b', { title: 'The same talk, filled in', brief: 'Deliver the full two-minute version from the skeleton, then answer the hardest question you expect in thirty seconds.', targetSeconds: 150 }),
    ],
    extraDrills: [
      d(8, 'c', { title: 'Pre-mortem', brief: 'Talk through the three ways your next presentation could go wrong and exactly what you would do in each case.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Word-for-word scripts presented as preparation.', 'Preparation that ignores likely questions.', 'Skeletons whose points are topics rather than claims.'],
    selfCheck: ['Can I deliver my skeleton from memory?', 'Have I prepared for the hardest question?'],
    realWorld: 'Preparing for a client pitch, a board update or a dissertation presentation.',
    writePrompt: 'Write your preparation sheet for a real upcoming presentation: purpose sentence, skeleton, and three hard questions with answers.',
  },
  {
    number: 9,
    oneLine: 'Four physical techniques work in the minute before you speak — none of them is "relax".',
    idea: [
      'Extended exhales (in for four, out for eight) activate the parasympathetic nervous system and slow your heart rate. A grounded stance — feet planted, shoulders down — reduces the shallow breathing that makes your voice shake.',
      'Know your opening sentence cold so the start is automatic, and before an online call, run a thirty-second warm-up of reading something aloud so your voice is not cold on its first word.',
    ],
    drills: [
      d(9, 'a', { title: 'Four-eight, then speak', brief: 'Do three rounds of in-for-four, out-for-eight breathing, then deliver a sixty-second opening to a meeting you are leading.', targetSeconds: 60 }),
      d(9, 'b', { title: 'The rehearsed first line', brief: 'Drill your opening sentence until automatic, then use it to begin a sixty-second interview answer.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(9, 'c', { title: 'Cold-voice warm-up', brief: 'Read a paragraph aloud for thirty seconds as a vocal warm-up, then immediately give a thirty-second update as if joining a video call.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Breathing techniques rushed so they increase tension.', 'Opening lines memorised but delivered too fast.', 'Collapsed posture on video calls.'],
    selfCheck: ['Which technique made the biggest difference?', 'Was my first line automatic?'],
    realWorld: 'The minute before walking into an interview or unmuting on an important call.',
    writePrompt: 'Write a sixty-second pre-talk routine for both in-person and online settings.',
  },
  {
    number: 10,
    oneLine: 'Stakeholders forget a stumble in seconds — unless you make it the story.',
    idea: [
      'Misstating a number, losing a word or clicking to the wrong slide is universal. What damages credibility is the reaction: extended apology, visible fluster, or restarting from the top.',
      'Correct cleanly ("Sorry — forty percent, not fourteen") and continue at the same pace. If a factual error is material, correct it explicitly; if it is trivial, just keep going. Composure after a slip builds more trust than never slipping.',
    ],
    drills: [
      d(10, 'a', { title: 'Deliberate stumble, clean recovery', brief: 'Give a sixty-second results summary, misstate a figure on purpose, correct it in one short phrase and continue.', targetSeconds: 60 }),
      d(10, 'b', { title: 'A passage that trips people', brief: 'Read this without restarting, correcting any slip in place.', passage: 'The statistically significant specifications specify a particularly peculiar prioritisation. Our regulatory reporting requirements require rigorous, repeatable reconciliation.', targetSeconds: 20 }),
    ],
    extraDrills: [
      d(10, 'c', { title: 'Wrong slide', brief: 'Simulate clicking to the wrong slide mid-presentation: acknowledge briefly, navigate, and resume your sentence.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Over-apologising.', 'Pace spiking after an error.', 'Visible self-criticism ("I am terrible at this").'],
    selfCheck: ['How long did my correction take?', 'Did my composure hold?'],
    realWorld: 'Correcting a misstatement in a client meeting, lecture or earnings-style update.',
    writePrompt: 'Write the exact phrases you will use to correct a material error and a trivial slip, without over-apologising.',
  },
  {
    number: 11,
    oneLine: 'A blank is an unplanned pause — the room cannot tell the difference.',
    idea: [
      'Blanking is most likely when stakes are high and working memory is loaded, such as mid-way through a complex explanation to an examiner or a client. It feels catastrophic and usually looks like a thoughtful pause.',
      'Have a recovery protocol: pause, breathe, summarise the last point ("So, the key constraint is budget…"), or check your notes openly. In meetings you can also turn it into a question: "Before I continue — does that part make sense?"',
    ],
    drills: [
      d(11, 'a', { title: 'The recovery line', brief: 'Give a ninety-second explanation of a process in your field. Mid-way, stop for three seconds and recover with a summary of the last point.', targetSeconds: 90 }),
      d(11, 'b', { title: 'Go back one step', brief: 'Deliver a three-point update; after point two, "lose" point three and recover by summarising points one and two.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(11, 'c', { title: 'Question as a bridge', brief: 'Use a check-in question as a bridge after a simulated blank during a client-style explanation, then continue.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Panicked filler during blanks.', 'Apologising for losing the thread.', 'Notes too dense to find a place in quickly.'],
    selfCheck: ['How long did the blank really last on the recording?', 'Which recovery felt most natural?'],
    realWorld: 'Losing your thread in a viva, interview or client presentation.',
    writePrompt: 'Write your blank-mind protocol with the exact bridging sentences you will use in a meeting and in an exam.',
  },
  {
    number: 12,
    oneLine: 'Confidence is the residue of repetition, not a prerequisite for speaking.',
    idea: [
      'Many capable professionals avoid presenting until they "feel ready" — and so never accumulate the repetitions that would make them ready. Confidence follows exposure: each time a talk goes acceptably, your threat prediction recalibrates.',
      'The practical strategy is deliberate volume: speak first in meetings, volunteer for the update, ask the question at the seminar. Small, frequent reps matter more than occasional big ones.',
    ],
    drills: [
      d(12, 'a', { title: 'Two minutes, no stopping', brief: 'Speak for two minutes making the case for a change in your team, course or organisation. Pause as needed, but do not stop.', targetSeconds: 120 }),
      d(12, 'b', { title: 'Your first recording, again', brief: 'Re-record your lesson-one baseline and compare the metrics with your first attempt.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(12, 'c', { title: 'Exposure plan', brief: 'Describe three speaking opportunities you will take in the next two weeks, from lowest to highest stakes.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Plans that only include high-stakes events.', 'Waiting for readiness rather than scheduling reps.', 'Discounting measurable progress.'],
    selfCheck: ['What measurably improved since my baseline?', 'Which low-stakes rep will I do this week?'],
    realWorld: 'Building presence in team meetings, seminars and professional networks.',
    writePrompt: 'Write a two-week exposure plan with three speaking opportunities, ordered from lowest to highest stakes.',
  },
];
