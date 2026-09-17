import type { CourseModule } from '../types';

/* Grades 10–12 · Module 5 — Competitive Debate and Model UN */
export const SENIOR_M5: CourseModule = {
  title: 'Competitive Debate and Model UN',
  outcome: 'Debate in competition formats with team roles, rebuttal and weighing, and perform as a Model UN delegate from opening speech to resolution.',
  world: { name: 'Debate Chamber', emoji: '🏛️', color: '#DC2626', tagline: 'Win the room with reasoning.' },
  lessons: [
    {
      title: 'Debate formats and what judges reward',
      oneLine: 'Each debate format has its own rules — knowing them is part of winning.',
      idea: [
        'Common school and university formats include British Parliamentary (four teams, two per side), Asian Parliamentary (three per side) and World Schools. They differ in time limits, roles and how points of information work.',
        'Judges across formats reward matter (arguments and evidence), manner (delivery) and method (structure, roles and engagement). Engaging with the other side matters as much as your own case.',
      ],
      drills: [
        { title: 'Explain the format', brief: 'Explain the structure of a debate format you might compete in — speakers, roles and timings — as if briefing a new teammate.', targetSeconds: 90 },
        { title: 'Prime Minister’s opening', brief: 'Deliver the first ninety seconds of an opening government speech on "This house would lower the voting age to sixteen": definition, framing and case preview.', targetSeconds: 90 },
      ],
      game: { name: 'Format Swap', emoji: '🔁', how: ['Teams debate a motion in one format for five minutes.', 'Switch to another format with different roles.', 'Discuss how the strategy changed.'] },
      realWorld: 'Inter-school debate championships and university debating societies.',
      mentorWatchFor: ['Ignoring format-specific roles.', 'Focusing only on delivery.'],
      selfCheck: ['Do I know my role in this format?', 'Did I frame the debate clearly?'],
      writePrompt: 'Write a briefing for a new teammate on your debate format: roles, timings and what judges reward.',
    },
    {
      title: 'Case building and team roles',
      oneLine: 'A winning case is built as a team — arguments are allocated, sequenced and made to support each other.',
      idea: [
        'Before a debate, teams brainstorm arguments, choose the strongest, avoid overlap and decide who delivers what. First speakers frame and build; later speakers extend, rebut and summarise.',
        'Prep time is short — often fifteen to thirty minutes — so teams need a fast process: brainstorm, select, allocate, then develop.',
      ],
      drills: [
        { title: 'Fifteen-minute case', brief: 'Build a case for "This house would ban advertising targeted at children." Deliver your team’s framing and two allocated arguments.', targetSeconds: 120 },
        { title: 'The extension', brief: 'As a second speaker, deliver a new argument that extends your team’s case rather than repeating it.', targetSeconds: 90 },
      ],
      game: { name: 'Prep Room Race', emoji: '⏳', how: ['Teams receive a motion and fifteen minutes.', 'They must produce a framing, three arguments and role allocation.', 'Each team presents its plan in two minutes.'] },
      realWorld: 'Competitive debate preparation and team projects under time pressure.',
      mentorWatchFor: ['Overlapping arguments between speakers.', 'No clear framing.'],
      selfCheck: ['Did my argument add something new?', 'Did our case hang together?'],
      writePrompt: 'Write a team case for a motion: framing, three arguments and which speaker delivers each.',
    },
    {
      title: 'Rebuttal and weighing',
      oneLine: 'Rebuttal shows why the other side is wrong; weighing shows why your side matters more even if both have a point.',
      idea: [
        'Effective rebuttal targets the other side’s central claim, not side issues. Weighing compares impacts: which matters more, affects more people, is more likely or lasts longer?',
        'Judges often decide close debates on weighing. "Even if they are right about cost, our benefit to public health is larger and longer-lasting" wins rounds.',
      ],
      drills: [
        { title: 'Rebut the core', brief: 'Rebut the central claim "Banning junk food advertising violates free speech" in sixty seconds.', targetSeconds: 60 },
        { title: 'Weigh it', brief: 'Deliver a ninety-second summary speech that weighs your side’s impacts against the other side’s using scale, likelihood and duration.', targetSeconds: 90 },
      ],
      game: { name: 'Weighing Scales', emoji: '⚖️', how: ['Two impacts are written on the board.', 'Teams argue which outweighs using scale, likelihood and duration.', 'The class decides which weighing was more convincing.'] },
      realWorld: 'Debate summary speeches and any decision involving trade-offs.',
      mentorWatchFor: ['Rebutting minor points only.', 'Summaries that repeat without comparing.'],
      selfCheck: ['Did I target their central claim?', 'Did I explicitly weigh?'],
      writePrompt: 'Write a summary speech that rebuts the other side’s main claim and weighs both sides’ impacts.',
    },
    {
      title: 'MUN: from position paper to opening speech',
      oneLine: 'A strong MUN delegate knows their country’s real position and states it with diplomacy and precision.',
      idea: [
        'Model UN requires research: your country’s history on the issue, its alliances, interests and past votes. The position paper becomes your opening speech.',
        'Opening speeches are short: address the chair, state the issue’s importance, your country’s position and priorities, and signal openness to cooperation.',
      ],
      model: { text: 'Honourable Chair, distinguished delegates. Access to clean energy is not only an environmental issue — it is a development issue. The Republic of India supports a just transition that recognises historic emissions and developmental needs. We propose expanded technology-transfer partnerships and look forward to working with all blocs on a balanced resolution.', noticing: ['Diplomatic register.', 'A clear national position and priorities.', 'A signal of cooperation.'] },
      drills: [
        { title: 'Opening speech', brief: 'Deliver a sixty-second MUN opening speech for a country of your choice on refugee protection.', targetSeconds: 60 },
        { title: 'Right of reply', brief: 'Respond diplomatically to a delegate who criticised your country’s record on the issue.', targetSeconds: 45 },
      ],
      game: { name: 'Mini General Assembly', emoji: '🌐', how: ['Assign each student a country.', 'Each delivers a forty-five-second opening speech.', 'The chair identifies emerging blocs from the speeches.'] },
      realWorld: 'School and international Model UN conferences.',
      mentorWatchFor: ['Personal opinions replacing country positions.', 'Undiplomatic language.'],
      selfCheck: ['Did I represent my country accurately?', 'Was my tone diplomatic?'],
      writePrompt: 'Write a MUN position summary for a country: its interests, past stance and your proposed solutions.',
    },
    {
      title: 'MUN: caucus, negotiation and resolutions',
      oneLine: 'Most MUN influence happens in caucus — negotiating, building blocs and drafting clauses.',
      idea: [
        'Moderated caucus requires short, focused speeches on sub-topics. Unmoderated caucus is negotiation: finding allies, trading priorities and writing resolution clauses.',
        'Effective delegates listen for shared interests, propose specific wording and give others credit — leadership without dominance.',
      ],
      drills: [
        { title: 'Moderated caucus speech', brief: 'Deliver a thirty-second moderated caucus speech on funding mechanisms for climate adaptation.', targetSeconds: 30 },
        { title: 'Negotiation pitch', brief: 'Persuade a delegate from a different bloc to co-sponsor your clause by finding a shared interest and offering a compromise.', targetSeconds: 90 },
      ],
      game: { name: 'Bloc Builder', emoji: '🤝', how: ['Students receive secret country priorities.', 'In ten minutes they negotiate to form blocs.', 'Each bloc presents one agreed clause.'] },
      realWorld: 'MUN committees and any negotiation where parties want different things.',
      mentorWatchFor: ['Dominating without building consensus.', 'Vague proposals.'],
      selfCheck: ['Did I find a shared interest?', 'Did I propose specific wording?'],
      writePrompt: 'Write two operative resolution clauses and the argument you would use to gain support for each.',
    },
    {
      title: 'Crossfire and cross-examination',
      oneLine: 'In crossfire, short, precise questions expose weaknesses — and calm, direct answers protect your case.',
      idea: [
        'Some formats and competitions include cross-examination. Good questions are short, lead towards a concession and avoid giving the opponent a speech.',
        'When answering: give direct answers, do not concede more than necessary, and redirect to your strongest ground when appropriate.',
      ],
      drills: [
        { title: 'Ask three questions', brief: 'Cross-examine an opponent who argues "Standardised tests measure ability fairly." Ask three short, leading questions.', targetSeconds: 60 },
        { title: 'Hold your ground', brief: 'Answer these crossfire questions directly: "Isn’t your plan expensive?", "Who pays?", "What if it fails?"', targetSeconds: 60 },
      ],
      game: { name: 'Crossfire Duel', emoji: '⚔️', how: ['Two students face off for two minutes.', 'Questions must be under fifteen words; answers under twenty seconds.', 'Judges award points for concessions won and composure kept.'] },
      realWorld: 'Debate crossfire, panel interviews and defending a proposal.',
      mentorWatchFor: ['Questions that become speeches.', 'Evasive or aggressive answers.'],
      selfCheck: ['Were my questions short and pointed?', 'Were my answers direct?'],
      writePrompt: 'Write a sequence of five crossfire questions designed to win a concession on a motion.',
    },
  ],
};

/* Grades 10–12 · Module 6 — Admissions and Interviews */
export const SENIOR_M6: CourseModule = {
  title: 'Admissions and Interviews',
  outcome: 'Prepare for college, scholarship and panel interviews, tell your story, answer "why this course", excel in group discussion rounds and on video.',
  world: { name: 'Admissions Gate', emoji: '🚪', color: '#16A34A', tagline: 'Walk into the room ready.' },
  lessons: [
    {
      title: 'The college admissions interview',
      oneLine: 'Admissions interviews assess curiosity, fit and how you think — not memorised perfection.',
      idea: [
        'Interviewers want to know whether you are genuinely interested in the subject, how you reason and whether you would contribute to their community.',
        'Prepare themes, not scripts: your academic interests, experiences that shaped them, what you have read or explored beyond class, and your questions for them.',
      ],
      drills: [
        { title: 'Academic curiosity', brief: 'Answer "What have you read or explored beyond your syllabus that excited you?" with specifics.', targetSeconds: 90 },
        { title: 'Your question for them', brief: 'Ask the interviewer two thoughtful questions that show you researched the institution.', targetSeconds: 45 },
      ],
      game: { name: 'Hot Seat', emoji: '🔥', how: ['One student in the hot seat, three interviewers.', 'Three questions: interests, a challenge, why this institution.', 'Feedback on specificity and authenticity.'] },
      realWorld: 'University admission interviews in India and abroad.',
      mentorWatchFor: ['Generic enthusiasm without specifics.', 'Scripted, unnatural answers.'],
      selfCheck: ['Did I give specific examples?', 'Did my curiosity sound genuine?'],
      writePrompt: 'Write notes on five themes you want an interviewer to learn about you, with a specific example for each.',
    },
    {
      title: 'Your story in ninety seconds, not a list',
      oneLine: 'The most common interview question deserves a story with a thread — not your résumé read aloud.',
      idea: [
        'A list ("I am in Grade 12, I like debate, I play football, I topped my class") is forgettable. A thread connects experiences to what you want next.',
        'Structure: who you are now, the experience or interest that shaped you, and where you are heading — in about ninety seconds.',
      ],
      drills: [
        { title: 'The thread', brief: 'Answer "Tell me about yourself" in ninety seconds with a clear thread connecting your past, present and next step.', targetSeconds: 90 },
        { title: 'Thirty-second version', brief: 'Deliver a thirty-second version for a quick networking or scholarship introduction.', targetSeconds: 30 },
      ],
      game: { name: 'Two Truths & a Tale', emoji: '🤥', how: ['Each student tells three short stories about themselves: two true, one invented.', 'The class guesses the invented one.', 'Discuss which details made the true ones believable and memorable.'] },
      realWorld: 'The opening question of almost every interview.',
      mentorWatchFor: ['Résumé recitation.', 'No connection to the future.'],
      selfCheck: ['Did my answer have a thread?', 'Would the interviewer remember one detail?'],
      writePrompt: 'Write your "tell me about yourself" answer with a clear thread from past to future.',
    },
    {
      title: '"Why this course? Why this college?"',
      oneLine: 'Strong answers connect your specific motivation to specific features of the course or college.',
      idea: [
        'Weak answers are generic: "It is a good college with good placements." Strong answers show research and fit: a particular module, professor, research centre, teaching method or student opportunity.',
        'Connect three things: your motivation, what the course offers and what you would contribute.',
      ],
      drills: [
        { title: 'Why this course', brief: 'Answer "Why do you want to study this subject?" with a specific origin, a deepening experience and your future direction.', targetSeconds: 90 },
        { title: 'Why this college', brief: 'Answer "Why our college?" naming at least two specific features and what you would contribute.', targetSeconds: 75 },
      ],
      game: { name: 'Generic Detector', emoji: '📡', how: ['Students deliver "why this college" answers.', 'The class raises a card every time something could apply to any college.', 'Rewrite those parts with specifics.'] },
      realWorld: 'Admission interviews and statements of purpose.',
      mentorWatchFor: ['Answers focused only on rankings or placements.', 'Unresearched claims.'],
      selfCheck: ['Did I name specific features?', 'Did I say what I would contribute?'],
      writePrompt: 'Write "Why this course?" and "Why this college?" answers for a real institution you are considering.',
    },
    {
      title: 'Scholarship interviews: purpose, resilience, impact',
      oneLine: 'Scholarship panels look for purpose, resilience and impact — show evidence of all three.',
      idea: [
        'Scholarship interviews often involve several panellists with different priorities. Address the person asking, then include the whole panel with your eyes.',
        'Expect questions about challenges overcome, community impact and how the scholarship changes your path. Use specific stories with outcomes.',
      ],
      drills: [
        { title: 'Challenge overcome', brief: 'Answer "Tell us about a significant challenge you faced and what you learned" using situation, action and result.', targetSeconds: 90 },
        { title: 'Impact answer', brief: 'Answer "How will this scholarship help you create impact?" with a specific plan.', targetSeconds: 75 },
      ],
      game: { name: 'Three-Panel Rotation', emoji: '👥', how: ['Three panellists, each with a different focus: academics, character, community.', 'The candidate answers one question from each.', 'Panellists score how well the answer served their focus.'] },
      realWorld: 'Merit scholarships, fellowships and competitive programmes.',
      mentorWatchFor: ['Eye contact only with one panellist.', 'Challenge stories without learning or result.'],
      selfCheck: ['Did I include the whole panel?', 'Did my stories show resilience and impact?'],
      writePrompt: 'Write two scholarship interview stories — a challenge and an impact — with situation, action, result and learning.',
    },
    {
      title: 'The admissions GD round',
      oneLine: 'In admission group discussions, assessors reward reasoning, listening and leadership — not airtime.',
      idea: [
        'Group discussions test how you think and interact under competition. Opening well, adding facts, building on others, bringing the discussion back on track and summarising all score well.',
        'Interrupting, repeating and arguing to win hurt you. A calm summary at the end is often the most memorable contribution.',
      ],
      drills: [
        { title: 'Open the GD', brief: 'Open a group discussion on "Is AI a threat to employment?" with a definition, context and balanced framing.', targetSeconds: 45 },
        { title: 'Summarise the GD', brief: 'Deliver a sixty-second summary of an imagined discussion, representing views fairly and adding a conclusion.', targetSeconds: 60 },
      ],
      game: { name: 'Observed GD', emoji: '👁️', how: ['Six students discuss a topic for eight minutes.', 'Observers track openings, facts, building, interruptions and summaries.', 'Observers give each participant one strength and one change.'] },
      realWorld: 'Admission group discussions for management, law and design programmes.',
      mentorWatchFor: ['Shouting over others.', 'Silent participants waiting for a perfect moment.'],
      selfCheck: ['What type of contributions did I make?', 'Did I help the group move forward?'],
      writePrompt: 'Write an opening, two building contributions and a summary for a group discussion on a current issue.',
    },
    {
      title: 'Online interviews and video applications',
      oneLine: 'On video, your setup, eye line and energy matter as much as your answers.',
      idea: [
        'Many universities and programmes now use video interviews or recorded application answers. Look at the camera lens, position it at eye level, light your face from the front and remove background noise.',
        'Recorded answers often have strict time limits and no retakes. Practise with a timer and a one-line structure for each answer.',
      ],
      drills: [
        { title: 'Timed recorded answer', brief: 'Record a sixty-second answer to "What is one problem you would like to solve and why?" looking at the lens throughout.', targetSeconds: 60 },
        { title: 'No-retake answer', brief: 'Record a ninety-second answer to "Describe a time you changed your mind" in one take.', targetSeconds: 90 },
      ],
      game: { name: 'Lens Lock', emoji: '📷', how: ['Students record a short answer.', 'Replay with sound off and count glances away from the lens.', 'Repeat and aim to halve the count.'] },
      realWorld: 'Video admission interviews and recorded application questions.',
      mentorWatchFor: ['Looking at their own image rather than the lens.', 'Poor lighting or audio.'],
      selfCheck: ['Did I look at the lens?', 'Was my answer within time?'],
      writePrompt: 'Write your video interview checklist and one-line structures for five likely recorded questions.',
    },
  ],
};
