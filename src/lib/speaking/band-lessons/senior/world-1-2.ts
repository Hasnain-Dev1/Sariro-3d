import { bd, type BandLesson } from '../types';

/**
 * Grades 10–12 · Worlds 1 and 2 — Voice Valley and Brave Bridge
 *
 * Fifteen to eighteen: board exams, practical vivas, college and scholarship
 * interviews, MUN and debating, head-student elections and farewell speeches.
 * The stakes are real and personal — and the audience is increasingly adults
 * who decide something about their future.
 */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('senior', n, part, x);

export const SENIOR_WORLD_1: BandLesson[] = [
  {
    number: 1,
    oneLine: 'Articulate students are not born that way — they practised, and your progress can be measured.',
    idea: [
      'The student who handles an admissions interview calmly or wins the inter-school debate usually has hundreds of hours of speaking behind them: class discussions, MUN committees, failed attempts. It is a trained skill, like the subjects you are preparing for boards.',
      'Because it is trained, it is measurable. Today you record a baseline on the kind of question you will soon face for real, so that by the time your interviews and vivas arrive, you have evidence of improvement rather than hope.',
    ],
    drills: [
      d(1, 'a', { title: 'Your baseline', brief: 'Without preparing, answer "What do you want to study after school, and why?" for sixty seconds, as if an interviewer just asked.', targetSeconds: 60 }),
      d(1, 'b', { title: 'The same passage, cold', brief: 'Read this aloud once without rehearsal as your reading baseline.', passage: 'The questions that shape your future are rarely asked in writing. They are asked across a table, by someone who has read your application and wants to know whether the person matches the paper. What you say in those twenty minutes can matter as much as three years of marks.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(1, 'c', { title: 'Sixty-second self-introduction', brief: 'Introduce yourself as you would at the start of an admissions interview or scholarship panel: who you are, what drives you, one thing you have done.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Rehearsed-sounding answers on the baseline — it should be unpolished.', 'Students who undersell achievements out of modesty.', 'Rising intonation that turns statements into questions.'],
    selfCheck: ['Did my answer sound like me or like an essay?', 'What will an interviewer remember from it?'],
    realWorld: 'College admissions interviews, scholarship panels and career counselling sessions.',
    writePrompt: 'Write about the speaking situations in the next two years that will matter most for your future, and what you want to sound like in them.',
  },
  {
    number: 2,
    oneLine: 'Judges, panels and classmates decide in the first ten seconds whether you are worth listening to.',
    idea: [
      'Debate adjudicators, MUN chairs and assembly audiences have heard hundreds of speeches that begin "Respected judges, teachers and my dear friends, today I am going to speak on…". Predictable openings are forgiven and forgotten in the same moment.',
      'Earn attention with tension: a question that challenges an assumption, a statistic that shocks, a vivid moment, or a position stated so boldly the audience wants to argue. Formal greetings can be brief — then get to something only you would say.',
    ],
    model: {
      text: 'By the time you finish school, you will have taken more than five hundred tests. How many of them asked you what you actually think?',
      noticing: ['A number every student lives.', 'A question that makes the audience reflect on their own experience.'],
    },
    drills: [
      d(2, 'a', { title: 'Ten seconds that earn the rest', brief: 'Deliver only the first fifteen seconds of a speech on "Should board exams be abolished?", designed to grab a tired assembly hall.', targetSeconds: 15 }),
      d(2, 'b', { title: 'The same thing, badly, on purpose', brief: 'Open with the traditional "Respected judges…" formula and a topic announcement, then redo it with a strong hook and continue for thirty seconds.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(2, 'c', { title: 'MUN opening statement', brief: 'Deliver the first thirty seconds of an MUN opening speech for a country on a global issue, starting with something the committee cannot ignore.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Long formal salutations eating the opening.', 'Hooks borrowed from viral videos with no connection to the argument.', 'Shock statistics with no source.'],
    selfCheck: ['Was my first sentence something only I would say?', 'Did the hook connect to my argument?'],
    realWorld: 'Debate competitions, MUN committees, assembly speeches and elocution contests.',
    writePrompt: 'Write three openings for a speech on board exams: a question, a statistic and a bold claim. Choose one and explain why.',
  },
  {
    number: 3,
    oneLine: 'The voice that persuades adults is your natural one — not a formal "speech voice".',
    idea: [
      'Many students switch into a stiff, memorised register for competitions and interviews: long formal words, a sing-song rhythm, every sentence ending the same way. Interviewers and adjudicators read that as recitation, not thinking.',
      'The voice that works is the one you use explaining something you care about to a teacher you respect: articulate, varied, direct. Keep the vocabulary of an educated conversation, not of an essay read aloud.',
    ],
    drills: [
      d(3, 'a', { title: 'Explaining to a teacher you respect', brief: 'Explain something from a subject you love to a teacher you respect, conversationally, for forty-five seconds.', targetSeconds: 45 }),
      d(3, 'b', { title: 'The same explanation, to a room', brief: 'Deliver it again as a competition speech to a hall. Then close the gap: make the hall version sound like the conversation.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(3, 'c', { title: 'De-essay a sentence', brief: 'Say an over-formal sentence such as "It is of paramount importance that we endeavour to…", then say what you mean plainly.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Sing-song elocution rhythm.', 'Memorised phrasing that collapses when interrupted.', 'Overuse of formal filler like "moreover" and "hence".'],
    selfCheck: ['Did I sound like I was thinking or reciting?', 'Which formal habits crept in?'],
    realWorld: 'Admissions interviews, elocution competitions and debates.',
    soundLab: ['th', 'v-w'],
    writePrompt: 'Rewrite a formal paragraph from an essay or speech as you would actually say it to a respected adult.',
  },
  {
    number: 4,
    oneLine: 'A deliberate pause makes a point land and makes you sound in command.',
    idea: [
      'Competition nerves and time limits push students to rush, cramming words into every second. Adjudicators and panels cannot absorb dense, breathless speech, and rushing reads as anxiety.',
      'Pause after a key claim, before your rebuttal lands, and after a rhetorical question. Two seconds of silence feels long to you and sounds authoritative to the room. Pauses also give you breath control under time pressure.',
    ],
    model: {
      text: 'We are told that exams measure ability. But the same student, on a different day, with a different night\'s sleep, gets a different mark. So what exactly are we measuring?',
      noticing: ['A pause after the claim "exams measure ability".', 'A longer pause before the final question.'],
    },
    drills: [
      d(4, 'a', { title: 'Read it with the pauses', brief: 'Read this with a clear pause after each sentence and a longer pause before the final question.', passage: 'We are told that exams measure ability. But the same student, on a different day, with a different night\'s sleep, gets a different mark. So what exactly are we measuring?', targetSeconds: 20 }),
      d(4, 'b', { title: 'Timed speech, controlled', brief: 'Deliver a sixty-second argument with a strict time limit, but keep deliberate pauses after each key point instead of rushing.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(4, 'c', { title: 'Rebuttal landing', brief: 'Deliver a short rebuttal where you pause for two seconds right before your decisive counter-point.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Filling pauses with "and" or "so".', 'Rushing more as the time warning approaches.', 'Pausing mid-phrase instead of after meaning.'],
    selfCheck: ['Did my key points get space to land?', 'Did I rush when I felt time pressure?'],
    realWorld: 'Timed debates, elocution contests and viva explanations.',
    soundLab: ['ed', 's-ending'],
    writePrompt: 'Write a short argument of five sentences and mark the two pauses that will do the most work.',
  },
  {
    number: 5,
    oneLine: 'Emphasis ranks your ideas for the listener — a flat delivery says nothing matters more than anything else.',
    idea: [
      'In a debate or a viva, the listener needs to know which word carries the argument. The same sentence stressed differently can concede, deny or accuse.',
      'You control volume, pitch and pace. Stress the contrast, slow down for the conclusion, and try lowering your voice for your most serious line — it commands more attention in a noisy hall than shouting does.',
    ],
    model: {
      text: 'I never said the government should ban it.',
      noticing: ['Stress "government": someone else should act.', 'Stress "ban": you argued for regulation, not prohibition.'],
    },
    drills: [
      d(5, 'a', { title: 'Seven meanings', brief: 'Say the sentence seven times, stressing a different word each time, and state what each version implies.', passage: 'I never said the government should ban it.', targetSeconds: 45 }),
      d(5, 'b', { title: 'The quiet line', brief: 'Read this passage and deliver the final sentence noticeably slower and quieter.', passage: 'They said we were too young to understand climate change. Too young to vote. Too young to be taken seriously. We are not too young to inherit the consequences.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(5, 'c', { title: 'Contrast stress', brief: 'Deliver a forty-five-second argument that hinges on a contrast, stressing both sides of the contrast clearly.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Shouting as emphasis.', 'Stress landing on every noun.', 'Monotone delivery of memorised content.'],
    selfCheck: ['Which word carried my argument?', 'Did I use quiet emphasis once?'],
    realWorld: 'Making arguments land in debates, MUN and speech competitions.',
    soundLab: ['stress'],
    writePrompt: 'Write a four-sentence argument and underline the word in each sentence that must carry the emphasis.',
  },
  {
    number: 6,
    oneLine: 'Hearing yourself recorded is uncomfortable — and it is the fastest coaching you will get before interviews.',
    idea: [
      'Most students never hear how they actually sound in an interview answer: the "basically" in every sentence, answers that drift, statements that end like questions. Interviewers hear all of it.',
      'Record practice answers and review with a checklist: filler rate, pace, whether the answer is clear in the first sentence, whether it ends decisively. Fix one thing per recording — that is how months of improvement fit into weeks.',
    ],
    drills: [
      d(6, 'a', { title: 'Your baseline, three weeks on', brief: 'Re-record your lesson-one answer about what you want to study and why, and compare it with your baseline.', targetSeconds: 60 }),
      d(6, 'b', { title: 'Say what you hear', brief: 'Listen to one recording and give a sixty-second self-review: one strength, one habit, one specific fix.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(6, 'c', { title: 'Interview filler audit', brief: 'Answer "Why should we admit you?" for ninety seconds, aiming to replace every filler with a silent pause.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Harsh self-criticism with no strengths named.', 'Analysis without re-recording.', 'Fillers like "basically" and "like" that students do not notice.'],
    selfCheck: ['What is my most frequent filler?', 'Did my first sentence answer the question?'],
    realWorld: 'Preparing for college, scholarship and internship interviews.',
    soundLab: ['q', 'silent'],
    writePrompt: 'Write a self-review of one recorded interview answer using the checklist from this lesson.',
  },
];

export const SENIOR_WORLD_2: BandLesson[] = [
  {
    number: 7,
    oneLine: 'Exam nerves and interview nerves are the same adrenaline as excitement — the label changes the result.',
    idea: [
      'Before a practical viva, an admissions interview or a debate final, your body releases adrenaline: fast heartbeat, dry mouth, shaky voice. Your body cannot tell the difference between threat and opportunity; your interpretation can.',
      'Harvard research found that people who told themselves "I am excited" performed better than those who tried to calm down, because fighting arousal uses up the attention you need. Top debaters and toppers still feel it — they have stopped reading it as a warning.',
    ],
    drills: [
      d(7, 'a', { title: 'Talk about being nervous, while nervous', brief: 'Describe honestly for forty-five seconds what happens to you before a high-stakes exam, viva or interview.', targetSeconds: 45 }),
      d(7, 'b', { title: 'The first minute', brief: 'Say "I am excited" out loud, then deliver the first ninety seconds of an interview answer or competition speech.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(7, 'c', { title: 'Reappraisal script', brief: 'Record the exact sentences you will tell yourself in the waiting room before your next viva or interview.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Students who equate nerves with lack of ability.', 'Over-rehearsal driven by anxiety.', 'Avoidance of competitions and leadership roles.'],
    selfCheck: ['What is my body\'s nerve signature?', 'What will I tell myself next time?'],
    realWorld: 'Practical exam vivas, admissions interviews and debate finals.',
    writePrompt: 'Write your waiting-room routine for a real upcoming viva, interview or competition, including your reappraisal sentence.',
  },
  {
    number: 8,
    oneLine: 'Most performance anxiety is uncertainty — structure and likely questions remove most of it.',
    idea: [
      'The fear before a viva or interview is mostly "What will they ask?" and "What if I blank?". Preparation targets those exact fears; telling yourself to stay calm does not.',
      'Prepare in layers: a skeleton for your likely answers or speech, the ten questions you are most likely to be asked, and your weakest area with a prepared honest answer. Skeletons survive interruptions; memorised scripts do not.',
    ],
    drills: [
      d(8, 'a', { title: 'First line, last line, three points', brief: 'For a real upcoming speech or interview answer, deliver only the first line, three headline points and the closing line.', targetSeconds: 30 }),
      d(8, 'b', { title: 'The same talk, filled in', brief: 'Deliver the full two-minute version from your skeleton, then answer the question you most fear in thirty seconds.', targetSeconds: 150 }),
    ],
    extraDrills: [
      d(8, 'c', { title: 'Question bank', brief: 'Say the ten questions you are most likely to be asked in your next interview or viva, then answer the hardest one.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Memorised answers that break under a follow-up.', 'Avoiding preparation of the weakest area.', 'Skeleton points that are topics rather than claims.'],
    selfCheck: ['Can I deliver my skeleton from memory?', 'Have I prepared my most feared question?'],
    realWorld: 'Preparing for practical vivas, college interviews and debate rounds.',
    writePrompt: 'Write a preparation sheet: speech or answer skeleton, ten likely questions, and your honest answer about your weakest area.',
  },
  {
    number: 9,
    oneLine: 'Four physical techniques work in the minute before you speak — "just relax" is not one of them.',
    idea: [
      'Extended exhales — in for four, out for eight — slow your heart rate within a minute. A grounded posture with feet planted and shoulders down stops the shallow breathing that makes voices shake.',
      'Know your opening sentence cold so the start is automatic, and warm up your voice by reading a paragraph aloud quietly in the corridor. A cold voice cracks on the first word; a warm one does not.',
    ],
    drills: [
      d(9, 'a', { title: 'Four-eight, then speak', brief: 'Do three rounds of in-for-four, out-for-eight breathing, then deliver the opening minute of a debate speech.', targetSeconds: 60 }),
      d(9, 'b', { title: 'The rehearsed first line', brief: 'Drill your interview opening sentence until automatic, then use it to start a sixty-second answer.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(9, 'c', { title: 'Corridor warm-up', brief: 'Read a paragraph aloud quietly for thirty seconds as a warm-up, then give a thirty-second self-introduction.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Rushed breathing counts.', 'Openings rehearsed but delivered too fast.', 'Collapsed posture while seated in interviews.'],
    selfCheck: ['Which technique helped most?', 'Was my first line automatic?'],
    realWorld: 'The minute before your name is called for a viva, interview or competition.',
    writePrompt: 'Write your sixty-second pre-speaking routine for a seated interview and for a standing competition speech.',
  },
  {
    number: 10,
    oneLine: 'Examiners and adjudicators forget a slip in seconds — unless your reaction makes it memorable.',
    idea: [
      'Mispronouncing a term, misquoting a figure or losing a word is normal. Marks and impressions are lost through the reaction: long apologies, visible panic, restarting the whole answer.',
      'Correct cleanly — "Sorry, the eighteenth century, not the nineteenth" — and continue at the same pace. For a factual error that matters, correct it explicitly; for a trivial slip, just keep going. Composure after an error scores better than never erring.',
    ],
    drills: [
      d(10, 'a', { title: 'Deliberate stumble, clean recovery', brief: 'Explain a concept from a board subject for sixty seconds, misstate one fact on purpose and correct it in one phrase.', targetSeconds: 60 }),
      d(10, 'b', { title: 'A passage that trips people', brief: 'Read this without restarting, correcting slips in place.', passage: 'Thermodynamics, electromagnetism and photosynthesis are particularly problematic. The anaesthetist\'s statistical analysis specified sixty-six specific specimens.', targetSeconds: 20 }),
    ],
    extraDrills: [
      d(10, 'c', { title: 'Mispronunciation recovery', brief: 'Deliver a short explanation containing difficult scientific or historical names, recovering smoothly from any mispronunciation.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Extended apologies.', 'Pace spiking after an error.', 'Self-deprecating comments mid-answer.'],
    selfCheck: ['How long did my correction take?', 'Did my composure hold?'],
    realWorld: 'Practical vivas, oral exams and timed competition speeches.',
    writePrompt: 'Write the phrases you will use to correct a factual error in a viva and a slip in a speech, without apologising repeatedly.',
  },
  {
    number: 11,
    oneLine: 'A blank is an unplanned pause — the panel usually reads it as thinking.',
    idea: [
      'Blanking is most likely when stakes are high: mid-way through a viva answer or a memorised speech. Three seconds of silence feels catastrophic inside and looks thoughtful from outside.',
      'Have a protocol: pause, breathe, summarise your last point, or buy time honestly — "Let me think about that for a moment." In a speech, glance at your cue card; in an interview, restating the question often brings the answer back.',
    ],
    drills: [
      d(11, 'a', { title: 'The recovery line', brief: 'Give a ninety-second explanation of a topic from your syllabus; mid-way, stop for three seconds and recover with a summary of the last point.', targetSeconds: 90 }),
      d(11, 'b', { title: 'Go back one step', brief: 'Deliver a three-point speech; after point two, "lose" point three and recover by summarising points one and two.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(11, 'c', { title: 'Buying thinking time', brief: 'Answer a hard interview question, first buying three seconds honestly, then giving a structured answer.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Panic-filling silence.', 'Memorised speeches with no recovery points.', 'Apologising for blanking.'],
    selfCheck: ['How long did my blank really last?', 'Which recovery felt most natural?'],
    realWorld: 'Losing your place in a viva, admissions interview or memorised speech.',
    writePrompt: 'Write your blank-mind protocol for a viva, an interview and a speech, with the exact sentences you will use.',
  },
  {
    number: 12,
    oneLine: 'Confidence comes from repetitions, not from waiting to feel ready.',
    idea: [
      'Many capable students avoid MUN, debating or head-student elections because they "are not confident enough" — and so never get the repetitions that build confidence. It works the other way round.',
      'Every time a speech goes acceptably, your brain lowers its threat prediction for the next one. The strategy is volume: speak in class, volunteer for assembly, enter the competition. Small, frequent reps beat one terrifying performance.',
    ],
    drills: [
      d(12, 'a', { title: 'Two minutes, no stopping', brief: 'Speak for two minutes arguing for a change you want in your school or country. Pause as needed, but do not stop.', targetSeconds: 120 }),
      d(12, 'b', { title: 'Your first recording, again', brief: 'Re-record your lesson-one baseline answer and compare the metrics with your first attempt.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(12, 'c', { title: 'Exposure plan', brief: 'Describe three speaking opportunities you will take this term, from lowest stakes to highest.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Plans that jump straight to the highest stakes.', 'Discounting measurable progress.', 'Avoiding leadership roles out of fear of speaking.'],
    selfCheck: ['What measurably improved since my baseline?', 'Which rep will I do this week?'],
    realWorld: 'Joining MUN or debating, running for student council, or speaking at assembly.',
    writePrompt: 'Write a term-long speaking exposure plan with three opportunities, ordered from lowest to highest stakes.',
  },
];
