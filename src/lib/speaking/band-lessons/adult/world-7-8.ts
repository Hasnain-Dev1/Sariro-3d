import { bd, type BandLesson } from '../types';

/** UG, PG & professionals · Worlds 7 and 8 — interviews, vivas, meetings, debate and the final talk. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('adult', n, part, x);

export const ADULT_WORLD_7: BandLesson[] = [
  {
    number: 37,
    oneLine: 'A strong interview answer is thirty to ninety seconds, makes one point and ends.',
    idea: [
      'Placement interviews, graduate programmes, job switches and PhD admissions all reward the same thing: clear, relevant, evidenced answers. The most common failure is not a weak answer but an answer that keeps going until it becomes weak.',
      'Use answer–evidence–relevance–stop. Lead with the direct answer, give one specific example, connect it to the role or programme, and stop. Silence after your answer is the interviewer\'s turn, not a gap you must fill.',
    ],
    model: {
      text: 'Question: Why this role? Answer: Because I want to work where analysis turns into decisions quickly. In my internship I built a pricing model that the team used within a week, and that speed of impact is what I enjoyed most. This role sits right next to the people making those calls.',
      noticing: ['A direct answer first.', 'One specific, credible example.', 'Relevance to the role, then it stops.'],
    },
    drills: [
      d(37, 'a', { title: '"Tell me about yourself"', brief: 'Answer "Tell me about yourself" for a real target role or programme in under ninety seconds: present, past, why this next step.', targetSeconds: 90 }),
      d(37, 'b', { title: 'Answer, evidence, relevance, stop', brief: 'Answer "Tell me about a time you handled conflict in a team" using answer, evidence, relevance, stop.', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(37, 'c', { title: 'Salary or gap question', brief: 'Answer either "What are your salary expectations?" or "Explain this gap in your CV" calmly, briefly and without over-justifying.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Answers exceeding two minutes.', 'CV recitation for "tell me about yourself".', 'Weaknesses that are disguised strengths.'],
    selfCheck: ['Did I stop when the point was made?', 'Did my evidence prove my answer?'],
    realWorld: 'Campus placements, job interviews, graduate programmes and PhD admissions.',
    soundLab: ['x', 'g'],
    writePrompt: 'Write answer–evidence–relevance for "Tell me about yourself" and "Why this role?" for a real opportunity.',
  },
  {
    number: 38,
    oneLine: 'In a viva or defence, show command of your work, mark its limits and never bluff.',
    idea: [
      'A thesis defence, dissertation viva or technical interview tests understanding and judgement. Examiners probe until they find the edge of your knowledge — that is the point of the exercise, not a sign of failure.',
      'Explain clearly, own your methodological choices and their trade-offs, and state limitations before they are extracted from you. When you do not know, say what you do know, what would answer it, and why it does or does not affect your conclusions.',
    ],
    drills: [
      d(38, 'a', { title: 'Explain something you know, then the edge of it', brief: 'Explain the core contribution of your thesis, project or specialism, then state clearly its most important limitation.', targetSeconds: 80 }),
      d(38, 'b', { title: 'Saying "I do not know" well', brief: 'Answer an examiner\'s question outside your data: what you know, what would answer it, and whether it affects your conclusion.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(38, 'c', { title: 'Defend a choice', brief: 'Justify one methodological or design decision you made, including the alternative you rejected and why.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Defensive responses to legitimate critique.', 'Bluffing on adjacent literature.', 'Limitations only admitted under pressure.'],
    selfCheck: ['Did I name limitations before being asked?', 'Did I stay precise about what I did not know?'],
    realWorld: 'Thesis defences, dissertation vivas, technical interviews and peer review discussions.',
    writePrompt: 'Write the three hardest questions an examiner could ask about your work, and a precise, non-defensive answer to each.',
  },
  {
    number: 39,
    oneLine: 'Presenting in a meeting follows different rules from a stage — it is small, interrupted and political.',
    idea: [
      'In a meeting, the audience knows you, has competing priorities and can interrupt at any time. Seniors may jump to the conclusion or challenge a number mid-way. A theatrical delivery feels out of place.',
      'Lead with the conclusion, be ready to go deep or skip ahead, handle interruptions as part of the conversation, and signpost back to your structure afterwards. Read the room: if the decision-maker is ready, ask for the decision early.',
    ],
    drills: [
      d(39, 'a', { title: 'Three minutes, to a table', brief: 'Deliver a three-minute update to an imagined leadership team, conclusion first, conversational in tone.', targetSeconds: 180 }),
      d(39, 'b', { title: 'Interrupted, and back', brief: 'Deliver an update, respond to a mid-way challenge on a key number, then signpost back to your structure and continue.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(39, 'c', { title: 'Skip to the end', brief: 'Mid-presentation, a senior says "Just tell me what you need." Deliver your ask and justification in thirty seconds.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Insisting on finishing slides when the decision-maker is ready.', 'Defensive tone under interruption.', 'Losing structure after digressions.'],
    selfCheck: ['Could I jump to the ask at any point?', 'How did I handle the challenge?'],
    realWorld: 'Leadership reviews, client meetings and seminar presentations.',
    soundLab: ['ough'],
    writePrompt: 'Write a one-minute "skip to the end" version of a real update, and the two challenges you are most likely to face mid-way.',
  },
  {
    number: 40,
    oneLine: 'Influence in group discussion comes from timing and synthesis, not airtime.',
    idea: [
      'Group discussions happen in placement assessments, seminars, cross-functional meetings and case interviews. Assessors and colleagues value people who move discussions forward: clarifying, synthesising, building on and including others.',
      'Use deliberate entries: "Building on Arjun\'s point…", "Let me summarise where we are…", "We have not heard from Leela yet — what is your view?". A well-timed synthesis is often the most influential contribution in the room.',
    ],
    drills: [
      d(40, 'a', { title: 'Three entries, three connectors', brief: 'Make three contributions to an imagined discussion on hybrid work policy, each using a different connector: build, challenge, synthesise.', targetSeconds: 60 }),
      d(40, 'b', { title: 'Bring somebody in', brief: 'Invite a quiet participant into the discussion by name with an open question, then connect their answer to the group\'s direction.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(40, 'c', { title: 'The synthesis', brief: 'After an imagined ten-minute debate, summarise the positions, the agreement and the open question in forty-five seconds.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Dominating airtime.', 'Contributions that ignore previous speakers.', 'Silence until a "perfect" point is ready.'],
    selfCheck: ['Did I move the discussion forward?', 'Did I include anyone?'],
    realWorld: 'Group discussion rounds in placements, seminars and cross-functional meetings.',
    writePrompt: 'Write connector phrases for building, challenging, synthesising, including and redirecting in a professional discussion.',
  },
  {
    number: 41,
    oneLine: 'Impromptu speaking needs a structure, not preparation — pour your knowledge into a shape.',
    idea: [
      '"Can you give us a quick update?", "What is your take?" and "Introduce yourself to the group" arrive without warning. People freeze searching for content when they need a container.',
      'Reliable shapes: past–present–future; point–reason–example–point (PREP); problem–options–recommendation; what–so what–now what. Pick one in the first second and speak to it.',
    ],
    drills: [
      d(41, 'a', { title: 'Past, present, future', brief: 'Give a sixty-second impromptu take on "the impact of AI on your field" using past, present and future.', targetSeconds: 60 }),
      d(41, 'b', { title: 'Point, example, point', brief: 'Give a sixty-second impromptu answer to "Should entry-level roles require degrees?" using PREP.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(41, 'c', { title: 'What, so what, now what', brief: 'Give an impromptu thirty-second update on a project using what, so what, now what.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Long silent searches before starting.', 'Abandoning the structure mid-way.', 'Rambling beyond the time a question deserves.'],
    selfCheck: ['How quickly did I choose a shape?', 'Did I land the ending?'],
    realWorld: 'Unexpected updates in meetings, networking introductions and panel questions.',
    writePrompt: 'Write the four impromptu structures and apply each to "What is the biggest challenge in your field?" in three lines.',
  },
  {
    number: 42,
    oneLine: 'Hear the question, restate it, buy two seconds, answer what was actually asked.',
    idea: [
      'Q&A is often where credibility is won or lost. Under pressure people answer the question they prepared for rather than the one asked, or become defensive when challenged.',
      'Listen to the end, restate or clarify ("So your concern is about cost overruns?"), then answer concisely. For hostile questions, acknowledge the legitimate part, keep your tone even and respond to substance. It is professional to say "I will confirm that and follow up by Thursday."',
    ],
    drills: [
      d(42, 'a', { title: 'Restate, then answer', brief: 'Answer "How does your proposal account for the budget freeze?" by restating the concern, then answering concisely.', targetSeconds: 60 }),
      d(42, 'b', { title: 'The hostile question', brief: 'Respond evenly to "Frankly, this looks like it was put together in a rush — why should we trust these numbers?"', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(42, 'c', { title: 'Follow-up commitment', brief: 'Answer a question you cannot fully answer with what you know, a specific follow-up commitment, and why it does not change your recommendation.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Answering a different question.', 'Defensive or sarcastic tone.', 'Vague follow-up promises without dates.'],
    selfCheck: ['Did I answer the question actually asked?', 'Did my tone stay even under challenge?'],
    realWorld: 'Q&A after presentations, investor meetings and thesis defences.',
    writePrompt: 'Write the five toughest questions for a real presentation, including one hostile one, and a concise answer for each.',
  },
];

export const ADULT_WORLD_8: BandLesson[] = [
  {
    number: 43,
    oneLine: 'Your plan is a hypothesis about the room — when the room tells you otherwise, adapt.',
    idea: [
      'You prepared for an engaged audience with thirty minutes; you get a distracted one with ten, a decision-maker who has already decided, or a technical audience that knows more than expected.',
      'Read the signals — phones out, crossed arms, repeated clarifying questions, a senior checking the time — and adjust: compress to the ask, go deeper on the contested point, switch from explanation to discussion. Adaptation signals command, not weakness.',
    ],
    drills: [
      d(43, 'a', { title: 'The same talk, two audiences', brief: 'Deliver the same finding twice: to a technical peer group, then to non-technical executives.', targetSeconds: 90 }),
      d(43, 'b', { title: 'Cut a point live', brief: 'Start a ten-minute talk; after one minute you are told you have three minutes left. Compress to your key point and ask.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(43, 'c', { title: 'Switch to discussion', brief: 'Mid-presentation, sense disagreement and switch to an open question that surfaces the concern, then respond.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Pushing through prepared material regardless of signals.', 'Adapting by speeding up rather than cutting.', 'Over-simplifying for senior audiences.'],
    selfCheck: ['What signal would make me cut?', 'What changed between my two audiences?'],
    realWorld: 'Shortened agenda slots, mixed audiences and sceptical stakeholders.',
    writePrompt: 'Write three versions of one talk: thirty seconds, three minutes and ten minutes, and the signals that would trigger each.',
  },
  {
    number: 44,
    oneLine: 'Slides are for what you cannot say — dense decks compete with you for attention.',
    idea: [
      'Corporate and academic decks often double as documents, so they end up crammed with text. Presented live, they split attention and invite the audience to read ahead or get lost in detail.',
      'Separate the presentation from the read-ahead document. Live slides should carry one message each, stated in an action title, supported by one chart or image. If a slide needs to be read aloud to be understood, it belongs in the appendix.',
    ],
    drills: [
      d(44, 'a', { title: 'The talk with no slides at all', brief: 'Deliver a two-minute version of a presentation that normally relies on a deck, using only structure and language.', targetSeconds: 120 }),
      d(44, 'b', { title: 'One image, two minutes', brief: 'Present one chart or diagram from your work for two minutes, guiding attention: what to look at, what it means, so what.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(44, 'c', { title: 'Action titles', brief: 'Read out the topic titles of a typical deck, then convert each into an action title that states the takeaway.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Reading slides verbatim.', 'Topic titles instead of action titles.', 'Charts without a guided takeaway.'],
    selfCheck: ['Did each slide have one message?', 'Did I guide the audience\'s eyes on the chart?'],
    realWorld: 'Business reviews, academic conferences and client presentations.',
    writePrompt: 'Convert five slide titles from a real or typical deck into action titles that state the takeaway.',
  },
  {
    number: 45,
    oneLine: 'In structured debate you are judged on how you handle the opposing case, not on your speech alone.',
    idea: [
      'Formal debate, moot court, case competitions and contested strategy meetings reward clash. Identify the opposing case\'s load-bearing claim — the premise without which it falls — and engage it directly.',
      'Represent it fairly, then challenge its evidence, logic, relevance or weighting. Separate the argument from the person, and concede minor points to strengthen your position on the major one.',
    ],
    drills: [
      d(45, 'a', { title: 'Their strongest point, said fairly', brief: 'For the motion "Remote work harms early-career development", state the opposing side\'s strongest case fairly.', targetSeconds: 45 }),
      d(45, 'b', { title: 'Rebut the load-bearing claim', brief: 'Deliver a ninety-second rebuttal targeting the opposition\'s key premise, conceding one minor point.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(45, 'c', { title: 'Weighing', brief: 'Accept that both sides have valid points and argue in sixty seconds why your side\'s impact should weigh more.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Rebutting peripheral claims.', 'Straw-manning.', 'Personalising disagreement in workplace-style debate.'],
    selfCheck: ['What was their load-bearing claim?', 'Did I weigh impacts, not just list points?'],
    realWorld: 'Case competitions, moot court, policy debates and strategy disagreements.',
    writePrompt: 'Map a debate: the opposing load-bearing claim, your fair summary of it, your rebuttal and your weighing statement.',
  },
  {
    number: 46,
    oneLine: 'Actionable feedback names a situation, a behaviour and one change — "be more strategic" is not feedback.',
    idea: [
      'Managers, supervisors and peers often give vague feedback ("be more strategic", "work on presence") that is impossible to act on. Useful feedback is observable and specific: situation, behaviour, impact, and one suggested change.',
      'Receiving feedback is equally a professional skill. Listen without defending, thank them, ask for a specific example, and decide later what to apply. Ask for feedback in ways that make specificity easy: "What is one thing I should change before the client meeting?"',
    ],
    drills: [
      d(46, 'a', { title: 'Moment, what, change', brief: 'Give feedback on a presentation you recently saw using situation, behaviour, impact and one change.', targetSeconds: 60 }),
      d(46, 'b', { title: 'The question that gets an answer', brief: 'Respond to the feedback "You need more executive presence" by thanking them and asking a question that gets a specific, usable answer.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(46, 'c', { title: 'Feedback upward', brief: 'Give respectful, specific feedback to a senior about a meeting they ran, using situation, behaviour and impact.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Trait-based feedback.', 'Defensiveness when receiving.', 'Avoiding upward feedback entirely.'],
    selfCheck: ['Was my feedback observable and actionable?', 'Did I ask for specifics when receiving?'],
    realWorld: 'Performance conversations, supervisor meetings and peer reviews.',
    writePrompt: 'Write situation–behaviour–impact–change feedback for a colleague, and the question you will ask when you receive vague feedback.',
  },
  {
    number: 47,
    oneLine: 'Your final talk integrates the whole course, on a subject you would put your professional name to.',
    idea: [
      'Your final talk should be one you might actually give: a pitch for an idea, a research talk, a leadership message or a talk about something your field gets wrong. Conviction on a real subject is the only test that counts.',
      'Integrate the whole course: governing thought first, a strong opening, three structured points, a story with a turn, anticipated objections, a clear ask or close, controlled pace and pauses, grounded presence, and prompt-only notes.',
    ],
    drills: [
      d(47, 'a', { title: 'The skeleton, from memory', brief: 'Deliver your final talk\'s skeleton from memory: opening, governing thought, three points, story, objection, close.', targetSeconds: 45 }),
      d(47, 'b', { title: 'The full speech', brief: 'Deliver your full talk of up to four and a half minutes, standing or to camera, from prompt notes only.', targetSeconds: 270 }),
    ],
    extraDrills: [
      d(47, 'c', { title: 'The improved take', brief: 'Review your full recording, pick one specific improvement, and deliver the talk again.', targetSeconds: 270 }),
    ],
    mentorWatchFor: ['Safe topics chosen to avoid judgement.', 'Strong structure with delivery that collapses under pressure.', 'Missing ask or close.'],
    selfCheck: ['Which course skills did I integrate deliberately?', 'Would I give this talk for real?'],
    realWorld: 'Conference talks, pitches, leadership addresses and research presentations.',
    writePrompt: 'Write your final talk outline: opening, governing thought, three points, story, objection and answer, and close.',
  },
];
