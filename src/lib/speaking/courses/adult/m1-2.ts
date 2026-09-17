import type { CourseModule } from '../types';

/* UG, PG & professionals · Professional Presence — taught as module 2 (see index.ts) */
export const ADULT_M1: CourseModule = {
  title: 'Professional Presence',
  outcome: 'Make strong first impressions and sound credible through voice, clarity, executive presence and precise language.',
  world: { name: 'The Lobby', emoji: '🏢', color: '#0F172A', tagline: 'Walk in credible.' },
  lessons: [
    {
      title: 'First impressions in professional settings',
      oneLine: 'Recruiters, clients and senior colleagues form a view within minutes — make yours deliberate.',
      idea: [
        'Whether it is a campus placement, a client call or your first week in a new team, people quickly judge competence and warmth. Both come through how you speak: clarity, composure and genuine engagement.',
        'This module starts with a baseline: how you actually sound introducing yourself and stating a view. Every later lesson improves a measurable part of it.',
      ],
      drills: [
        { title: 'Baseline: professional introduction', brief: 'Introduce yourself as you would at the start of a job interview or to a new team: role or studies, focus and what you bring.', targetSeconds: 60 },
        { title: 'Baseline: a professional opinion', brief: 'Give your view on "Should early-career professionals prioritise salary or learning?" for ninety seconds.', targetSeconds: 90 },
      ],
      game: { name: 'Three-Word Impression', emoji: '📝', how: ['Each participant delivers a sixty-second introduction.', 'Listeners write three words describing the impression.', 'Compare intended versus perceived impressions.'] },
      realWorld: 'Campus placements, client introductions and joining a new team.',
      mentorWatchFor: ['Overly casual or overly rehearsed introductions.', 'Understating achievements.'],
      selfCheck: ['What impression did I intend and what did I create?', 'Which part of my baseline most needs work?'],
      writePrompt: 'Write the three professional speaking situations that matter most to you in the next year and how you want to come across in each.',
    },
    {
      title: 'The voice of a decision-maker',
      oneLine: 'A measured pace, falling intonation and deliberate pauses signal confidence more than volume does.',
      idea: [
        'Credibility is undermined by rushing, uptalk (statements that rise like questions) and a thin, breathy voice. It is built by breathing low, pacing deliberately and finishing statements with a downward pitch.',
        'Pause before and after key numbers, recommendations and decisions. Silence gives your point weight.',
      ],
      model: { text: 'Our churn rose to eight percent last quarter. (pause) That is double our target. (pause) The main driver is onboarding. (pause) I recommend we redesign the first-week experience before we spend more on acquisition.', noticing: ['Short, declarative statements.', 'Pauses around the key number and recommendation.', 'Falling pitch on the recommendation.'] },
      drills: [
        { title: 'Credible recommendation', brief: 'Read this as a confident recommendation to senior colleagues.', passage: 'Our current process takes eleven days from request to approval. Most of that time is spent waiting, not working. If we move approvals to a shared dashboard with clear owners, we can reduce the cycle to four days. I recommend we pilot this with one team next month.', targetSeconds: 35 },
        { title: 'Your own recommendation', brief: 'Make a ninety-second recommendation about something in your studies or work, with deliberate pauses and no uptalk.', targetSeconds: 90 },
      ],
      game: { name: 'Question or Statement?', emoji: '❓', how: ['Participants say a recommendation twice: with uptalk and with a falling pitch.', 'The group votes which sounds decision-ready.', 'Everyone then delivers a recommendation that must sound certain.'] },
      realWorld: 'Recommending a decision in a meeting or answering an interviewer.',
      mentorWatchFor: ['Uptalk on recommendations.', 'Rushing past numbers.'],
      selfCheck: ['Did my statements end with a falling pitch?', 'Did I pause around key numbers?'],
      soundLab: ['stress'],
      writePrompt: 'Write a short recommendation for a real decision, marking pauses and stressed words.',
    },
    {
      title: 'Being understood on global calls',
      oneLine: 'In international and cross-regional teams, clarity beats accent — pace, articulation and plain words make you understood.',
      idea: [
        'Global teams, virtual calls and international clients mean you are regularly speaking to people with different first languages and accents. Your accent is not the problem; speed, swallowed endings, idioms and jargon are.',
        'Slow slightly, articulate endings, avoid local idioms and acronyms, and confirm understanding: "To summarise the next steps…"',
      ],
      drills: [
        { title: 'Global call update', brief: 'Give a sixty-second project update to an international team: plain words, no idioms, clear next steps.', targetSeconds: 60 },
        { title: 'Terminology clarity', brief: 'Pronounce and explain ten technical terms or acronyms from your field in plain language.', targetSeconds: 90 },
      ],
      game: { name: 'Idiom Hunt', emoji: '🌐', how: ['Participants give a short update.', 'Listeners flag any idiom, acronym or slang that a global colleague might not know.', 'The speaker rephrases each one plainly.'] },
      realWorld: 'Calls with international clients, global teams and overseas universities.',
      mentorWatchFor: ['Accent imitation instead of clarity.', 'Unexplained acronyms.'],
      selfCheck: ['Did I avoid idioms and unexplained acronyms?', 'Did I confirm next steps?'],
      soundLab: ['th', 'v-w', 'ough'],
      writePrompt: 'Rewrite a jargon- and idiom-heavy paragraph from your field for an international audience.',
    },
    {
      title: 'Executive presence in the room and on screen',
      oneLine: 'Executive presence is calm, grounded body language that makes people trust your judgement.',
      idea: [
        'Senior professionals tend to move less and more deliberately. Fidgeting, rocking, touching your face or hiding your hands signals nervousness to colleagues and interviewers.',
        'Seated: upright, forearms on the table, hands visible. Standing: grounded, open hands, gestures that mark structure. On video: centred framing, eyes to the lens, minimal movement.',
      ],
      drills: [
        { title: 'Seated at the table', brief: 'Seated as in a meeting, present a sixty-second update with visible hands, upright posture and no fidgeting.', targetSeconds: 60 },
        { title: 'Standing with structure', brief: 'Standing, present three priorities for the next quarter, using one gesture per priority and stillness between them.', targetSeconds: 75 },
      ],
      game: { name: 'Fidget Audit', emoji: '📋', how: ['A participant presents for sixty seconds.', 'A partner tallies unconscious movements.', 'Repeat and aim to halve the tally.'] },
      realWorld: 'Leadership meetings, interviews and client presentations.',
      mentorWatchFor: ['Stiffness mistaken for presence.', 'Hands hidden below the table.'],
      selfCheck: ['How many unconscious movements did I make?', 'Did my gestures reinforce my structure?'],
      writePrompt: 'Write your executive presence checklist for seated meetings, standing presentations and video calls.',
    },
    {
      title: 'Credibility leaks: "just", "sorry" and "maybe"',
      oneLine: '"I just wanted to maybe suggest" weakens good ideas — precise, calibrated language makes them land.',
      idea: [
        'Common credibility leaks in professional speech: fillers ("um", "like", "basically"), minimisers ("just", "a bit"), hedges ("I think maybe", "sort of") and unnecessary apologies ("Sorry, but…").',
        'Replace them with calibrated language: "I recommend…", "The data suggests…", "I am not certain yet; I will confirm by Friday." Precision about uncertainty is professional; vagueness is not.',
      ],
      drills: [
        { title: 'Leak audit', brief: 'Propose an idea to your team for ninety seconds. Then note every filler, minimiser, hedge and apology.', targetSeconds: 90 },
        { title: 'Precise version', brief: 'Deliver the same proposal with calibrated, precise language.', targetSeconds: 90 },
      ],
      game: { name: 'Credibility Leak Buzzer', emoji: '🔔', how: ['A participant makes a proposal.', 'The group buzzes on each leak: filler, minimiser, hedge, apology.', 'The speaker rephrases the sentence precisely.'] },
      realWorld: 'Emails read aloud, meeting proposals and interview answers.',
      mentorWatchFor: ['Over-correction into aggressive certainty.', 'Replacing one filler with another.'],
      selfCheck: ['How many credibility leaks did I have?', 'Was my uncertainty precise?'],
      writePrompt: 'Write a hedge-filled proposal, then rewrite it with precise, calibrated language.',
    },
    {
      title: 'Your weekly communication review',
      oneLine: 'Professionals who record and review their communication improve faster than those who rely on memory.',
      idea: [
        'Most people only know how they sound from impressions. Recordings give data: pace, fillers, pauses and clarity — the lab measures these for you.',
        'Build a weekly habit: record one professional answer or update, review it for one dimension and implement one change the next week.',
      ],
      drills: [
        { title: 'Weekly review', brief: 'Record a two-minute answer to "Walk me through a project you are proud of." Review data and state one change.', targetSeconds: 120 },
        { title: 'Implement the change', brief: 'Re-record the answer implementing only that change.', targetSeconds: 120 },
      ],
      game: { name: 'Data Debrief', emoji: '📈', how: ['Participants share one metric from their recording.', 'Peers suggest one practice drill for that metric.', 'Everyone commits to a measurable target for next week.'] },
      realWorld: 'Preparing for placements, promotions and important presentations.',
      mentorWatchFor: ['Reviews without measurable goals.', 'Harsh self-criticism instead of analysis.'],
      selfCheck: ['What does my data show?', 'What is my measurable target?'],
      writePrompt: 'Write your recording review log: metrics, observations, one change and next week’s target.',
    },
  ],
};

/* UG, PG & professionals · Confidence at Work — taught as module 3 */
export const ADULT_M2: CourseModule = {
  title: 'Confidence at Work',
  outcome: 'Manage speaking anxiety, prepare for high-stakes moments, recover in front of seniors, speak up as a junior and handle pushback.',
  world: { name: 'Confidence Corridor', emoji: '🧭', color: '#7C3AED', tagline: 'Speak up where it counts.' },
  lessons: [
    {
      title: 'Speaking anxiety in professional life',
      oneLine: 'Professional speaking anxiety is common and manageable — with physiology, preparation and perspective.',
      idea: [
        'Many capable professionals avoid speaking up in meetings, presenting their work or asking questions because anxiety feels unmanageable. It often costs promotions and visibility.',
        'Manage it on three levels: physiology (slow exhale breathing), preparation (known opening, structure and close) and perspective (colleagues are focused on the content, not judging you).',
      ],
      drills: [
        { title: 'Name the trigger', brief: 'Describe the professional speaking situation that makes you most anxious and what you usually do in response.', targetSeconds: 75 },
        { title: 'Breathe and deliver', brief: 'Use two slow exhale-focused breaths, then deliver a composed sixty-second update on your current work.', targetSeconds: 60 },
      ],
      game: { name: 'Exposure Ladder', emoji: '🪜', how: ['Participants list speaking situations from least to most anxious.', 'They choose the next step on their ladder.', 'They complete a simulated version in the session.'] },
      realWorld: 'Presenting in team meetings, seminars and interviews.',
      mentorWatchFor: ['Avoidance disguised as preference.', 'Anxiety severe enough to need gentler steps.'],
      selfCheck: ['What is my next step on the ladder?', 'Which technique helped most?'],
      writePrompt: 'Write your exposure ladder of professional speaking situations and the next three steps you will take.',
    },
    {
      title: 'Preparation systems for high-stakes moments',
      oneLine: 'A repeatable preparation system turns every high-stakes moment into a familiar routine.',
      idea: [
        'High-stakes moments — a promotion presentation, a board update, a final-round interview — deserve a system: define the objective, analyse the audience, structure the message, anticipate questions and rehearse under realistic conditions.',
        'A system prevents both under-preparation and endless over-preparation.',
      ],
      drills: [
        { title: 'Objective and audience', brief: 'For an upcoming important moment, state your objective, who the audience is and what they care about.', targetSeconds: 75 },
        { title: 'Anticipate the questions', brief: 'State the three hardest questions you expect and answer each concisely.', targetSeconds: 120 },
      ],
      game: { name: 'Prep Canvas', emoji: '🗂️', how: ['Participants fill a one-page canvas: objective, audience, message, questions, rehearsal plan.', 'Partners challenge any vague section.', 'Participants present their canvas in two minutes.'] },
      realWorld: 'Final-round interviews, leadership reviews and client pitches.',
      mentorWatchFor: ['Objectives that are too vague.', 'Skipping question preparation.'],
      selfCheck: ['Is my objective specific?', 'Have I prepared for the hardest questions?'],
      writePrompt: 'Complete a preparation canvas for a real upcoming high-stakes moment.',
    },
    {
      title: 'Recovering from mistakes in front of seniors',
      oneLine: 'A mistake handled calmly can build credibility — how you recover matters more than the error.',
      idea: [
        'Wrong numbers, a lost train of thought or a question you cannot answer can happen in front of senior leaders. Over-apologising or bluffing damages trust more than the mistake.',
        'Recovery: acknowledge briefly, correct precisely, commit to follow-up if needed and continue. "Correction — that figure is twelve percent, not twenty. I will send the source after this meeting."',
      ],
      drills: [
        { title: 'Correct the figure', brief: 'Deliver an update, state a wrong figure, correct it briefly and precisely, and continue.', targetSeconds: 60 },
        { title: 'I will confirm', brief: 'A director asks a detailed question you cannot answer. Respond professionally with what you know and a follow-up commitment.', targetSeconds: 40 },
      ],
      game: { name: 'Curveball Round', emoji: '⚾', how: ['Participants present a short update.', 'The facilitator introduces a mistake or unknown question.', 'The group scores recovery for brevity, honesty and composure.'] },
      realWorld: 'Leadership meetings, client reviews and thesis committees.',
      mentorWatchFor: ['Repeated apologies.', 'Bluffing to avoid admitting uncertainty.'],
      selfCheck: ['Was my correction brief?', 'Did I commit to a follow-up?'],
      writePrompt: 'Write three recovery phrases for professional mistakes and one example of when you would use each.',
    },
    {
      title: 'Speaking up in meetings when you are junior',
      oneLine: 'Junior professionals earn a voice by contributing early, briefly and with value.',
      idea: [
        'Juniors often stay silent, waiting to be certain or worried about seniority. But managers notice people who add value: a data point, a clarifying question, a risk others missed or a summary.',
        'Contribute early in the meeting, keep it to thirty seconds, link to the discussion and be ready to be challenged.',
      ],
      drills: [
        { title: 'Thirty-second contribution', brief: 'In a meeting about delaying a product launch, contribute one data-backed point in thirty seconds.', targetSeconds: 30 },
        { title: 'The clarifying question', brief: 'Ask a clarifying question that improves the discussion, then add your view briefly.', targetSeconds: 45 },
      ],
      game: { name: 'Early Entry', emoji: '🚪', how: ['Run a simulated meeting.', 'Each participant must contribute within the first three minutes.', 'Rate contributions: data, question, risk or synthesis?'] },
      realWorld: 'Team meetings, client calls and cross-functional reviews.',
      mentorWatchFor: ['Long preambles before the point.', 'Waiting until the meeting is ending.'],
      selfCheck: ['Did I contribute early?', 'What value did my contribution add?'],
      writePrompt: 'Write three contributions you could make in your next meeting: a data point, a question and a risk.',
    },
    {
      title: 'Handling tough questions and pushback',
      oneLine: 'Pushback is often a test of conviction — respond with curiosity, evidence and composure.',
      idea: [
        'When challenged ("I am not convinced this will work"), avoid defensiveness. First understand the concern, then address it with evidence, and acknowledge valid points.',
        'Framework: acknowledge ("That is a fair concern"), clarify ("Is the worry cost or timing?"), respond with evidence, and confirm ("Does that address it?").',
      ],
      drills: [
        { title: 'The sceptical director', brief: 'A director says "This proposal is too expensive." Respond using acknowledge, clarify, respond and confirm.', targetSeconds: 60 },
        { title: 'Hostile question', brief: 'Respond calmly to a combative question in a seminar: "Your methodology seems flawed. Why should we trust these results?"', targetSeconds: 60 },
      ],
      game: { name: 'Pushback Gauntlet', emoji: '🛡️', how: ['A participant presents a proposal in sixty seconds.', 'Three colleagues give escalating pushback.', 'The group scores composure and substance.'] },
      realWorld: 'Budget reviews, academic seminars and client negotiations.',
      mentorWatchFor: ['Defensive tone.', 'Conceding too quickly without evidence.'],
      selfCheck: ['Did I understand the concern first?', 'Did I stay composed?'],
      writePrompt: 'Write the three strongest objections to a proposal you might make, with an acknowledge–clarify–respond answer for each.',
    },
    {
      title: 'Impostor feelings and earned credibility',
      oneLine: 'Feeling like an impostor is common among capable people — credibility comes from preparation and evidence, not from feeling certain.',
      idea: [
        'Many high-achieving graduates and professionals feel they do not belong in the room. This can lead to over-hedging, under-claiming achievements and avoiding visibility.',
        'Counter it with evidence: know your results, own your contributions ("I led…", not "I helped a bit with…") and remember you were chosen for a reason.',
      ],
      drills: [
        { title: 'Own your achievement', brief: 'Describe a significant achievement using "I" statements with specific results, without minimising.', targetSeconds: 75 },
        { title: 'Evidence file', brief: 'State three pieces of evidence that you are qualified for the role or programme you want.', targetSeconds: 60 },
      ],
      game: { name: 'Minimiser Swap', emoji: '🔄', how: ['Participants describe an achievement naturally.', 'Peers flag minimisers ("just", "only", "a bit").', 'Participants retell it owning the contribution.'] },
      realWorld: 'Performance reviews, promotion conversations and interviews.',
      mentorWatchFor: ['Minimising achievements.', 'Overcorrecting into exaggeration.'],
      selfCheck: ['Did I own my contribution with specific results?', 'What evidence supports my credibility?'],
      writePrompt: 'Write an evidence file: five achievements with your specific contribution and measurable results.',
    },
  ],
};
