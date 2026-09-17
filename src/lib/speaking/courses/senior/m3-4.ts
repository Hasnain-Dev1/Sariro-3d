import type { CourseModule } from '../types';

/* Grades 10–12 · Argument and Structure — taught as module 1 (see index.ts) */
export const SENIOR_M3: CourseModule = {
  title: 'Argument and Structure',
  outcome: 'Lead with a thesis, open competition speeches well, build PEEL arguments with credible evidence and pre-empt objections within strict time limits.',
  world: { name: 'Logic Tower', emoji: '🗼', color: '#0891B2', tagline: 'Arguments that hold under pressure.' },
  lessons: [
    {
      title: 'Thesis-first thinking',
      oneLine: 'Panels and judges want your position first — then the reasoning that supports it.',
      idea: [
        'School essays often build slowly to a conclusion. Spoken arguments work the opposite way: state your thesis first so the listener knows what every point is supporting.',
        'A strong thesis is specific, arguable and limited: not "Technology affects education" but "Classroom AI tools should be allowed for drafting but banned for assessed work."',
      ],
      drills: [
        { title: 'Sharpen the thesis', brief: 'Turn three broad topics — urbanisation, social media and exams — into specific, arguable thesis statements.', targetSeconds: 60 },
        { title: 'Thesis-led answer', brief: 'Answer "Should university education be free?" beginning with a precise thesis and two supporting reasons.', targetSeconds: 90 },
      ],
      game: { name: 'Thesis Sharpener', emoji: '✏️', how: ['The mentor gives a vague topic.', 'Teams compete to write the sharpest arguable thesis in sixty seconds.', 'The class tests each: is it specific, arguable and limited?'] },
      realWorld: 'Interview answers, debate cases and extended essay presentations.',
      mentorWatchFor: ['Theses that are statements of fact.', 'Answers that build to the point instead of starting with it.'],
      selfCheck: ['Is my thesis specific and arguable?', 'Did I state it first?'],
      writePrompt: 'Write precise, arguable thesis statements for three current issues.',
    },
    {
      title: 'Openings for competitions and assemblies',
      oneLine: 'A competition opening earns attention and credibility in under twenty seconds.',
      idea: [
        'Judges and audiences hear many speeches. Generic openings ("Respected judges, teachers and my dear friends…") waste your most valuable seconds.',
        'Strong openings: a precise statistic with meaning, a short scenario, a striking contrast or a question that reframes the issue — followed immediately by your thesis.',
      ],
      drills: [
        { title: 'Four openings', brief: 'Deliver four openings for a speech on youth mental health: statistic, scenario, contrast and reframing question.', targetSeconds: 90 },
        { title: 'Opening plus thesis', brief: 'Deliver your best opening followed immediately by your thesis in under thirty seconds.', targetSeconds: 30 },
      ],
      game: { name: 'Twenty-Second Showdown', emoji: '⚡', how: ['Students deliver only their first twenty seconds.', 'Judges score attention and clarity out of five.', 'The top three explain their choices.'] },
      realWorld: 'Elocution competitions, assembly speeches and debate openings.',
      mentorWatchFor: ['Long formal greetings.', 'Openings that are clever but unrelated.'],
      selfCheck: ['Did I reach my thesis within thirty seconds?', 'Did my opening connect to my argument?'],
      writePrompt: 'Write four openings for a competition speech on a social issue, each followed by your thesis.',
    },
    {
      title: 'PEEL: building arguments that hold',
      oneLine: 'Point, Evidence, Explanation, Link — every argument must show why the evidence proves the point.',
      idea: [
        'Many students state a point and add evidence but never explain the connection. The Explanation is where judges and examiners see reasoning.',
        'Link each argument back to your thesis: "This is why…" Judges should never have to infer relevance.',
      ],
      drills: [
        { title: 'One PEEL argument', brief: 'Deliver one PEEL argument supporting "Cities should prioritise public transport over new roads."', targetSeconds: 75 },
        { title: 'Two PEEL arguments', brief: 'Deliver two PEEL arguments on a motion of your choice, with explicit links to your thesis.', targetSeconds: 150 },
      ],
      game: { name: 'Missing Link', emoji: '🔗', how: ['The mentor presents arguments with one PEEL element missing.', 'Teams identify the gap.', 'Teams repair the argument aloud.'] },
      realWorld: 'Debate speeches, viva explanations and scholarship interviews.',
      mentorWatchFor: ['Evidence followed by no explanation.', 'Links that repeat the point without connecting it.'],
      selfCheck: ['Did I explain why my evidence proves my point?', 'Did I link to the thesis?'],
      writePrompt: 'Write two PEEL arguments on a motion, highlighting the explanation in each.',
    },
    {
      title: 'Evidence: data, examples and sources',
      oneLine: 'Evidence is only persuasive if it is relevant, credible and explained in a way people can grasp.',
      idea: [
        'Types of evidence: statistics, research findings, expert opinion, historical examples, case studies and relevant personal experience. Each has strengths and limits.',
        'Cite sources briefly ("According to the World Health Organization…"). Explain numbers with comparisons. Never invent statistics — one fabricated figure destroys credibility.',
      ],
      drills: [
        { title: 'Evidence mix', brief: 'Support "Early childhood education has long-term benefits" using a statistic, a case example and an expert source — explaining each.', targetSeconds: 90 },
        { title: 'Challenge the evidence', brief: 'Evaluate the weakness of each piece of evidence you used, as an opponent would.', targetSeconds: 60 },
      ],
      game: { name: 'Source Check', emoji: '🧾', how: ['Teams receive claims with sources of varying quality.', 'They rank them from most to least credible.', 'They justify the ranking aloud.'] },
      realWorld: 'Research presentations, debate cases and current affairs discussions.',
      mentorWatchFor: ['Vague references like "studies show".', 'Invented or exaggerated numbers.'],
      selfCheck: ['Did I cite my sources?', 'Did I explain my numbers?'],
      writePrompt: 'Write the evidence for an argument using three types, with a short note on each source’s credibility.',
    },
    {
      title: 'Answering the counter-argument before it is raised',
      oneLine: 'Addressing the strongest objection yourself shows judgement and removes your opponent’s best weapon.',
      idea: [
        'Weak speakers ignore opposing views. Strong speakers name the most serious objection fairly, then answer it: "Critics argue… This concern is valid, but…"',
        'Answer by showing the objection is less significant, can be mitigated or is outweighed by your benefits. Never misrepresent it.',
      ],
      drills: [
        { title: 'Steel-man and answer', brief: 'For "Social media platforms should verify users’ ages", state the strongest objection fairly and answer it.', targetSeconds: 75 },
        { title: 'Integrated speech', brief: 'Deliver a two-minute persuasive speech that includes a fair counter-argument and a response.', targetSeconds: 120 },
      ],
      game: { name: 'Objection Draft', emoji: '🛡️', how: ['Students write their thesis.', 'Partners write the strongest objection.', 'Students answer it live in forty-five seconds.'] },
      realWorld: 'Debates, college interviews probing your views and policy discussions.',
      mentorWatchFor: ['Straw-man objections.', 'Defensive rather than analytical responses.'],
      selfCheck: ['Did I state the objection fairly?', 'Did I explain why my position still holds?'],
      writePrompt: 'Write the strongest objection to your position on a current issue, and a response that concedes what is valid.',
    },
    {
      title: 'Precision under time limits',
      oneLine: 'Competitions and interviews reward speakers who make their point completely within the time given.',
      idea: [
        'Running over time loses marks and goodwill. Rushing loses clarity. Precision means planning to the time: know what to cut, and speak in complete, compact sentences.',
        'Practise the same content at three lengths: two minutes, one minute and thirty seconds. Each version should still be complete.',
      ],
      drills: [
        { title: 'Two minutes', brief: 'Argue for or against compulsory community service for students in exactly two minutes.', targetSeconds: 120 },
        { title: 'Thirty seconds', brief: 'Make the same argument completely in thirty seconds.', targetSeconds: 30 },
      ],
      extraDrills: [
        { title: 'One minute', brief: 'Make the same argument completely in one minute.', targetSeconds: 60 },
      ],
      game: { name: 'Accordion Speech', emoji: '🪗', how: ['Students deliver an argument in two minutes.', 'The mentor calls a new time: one minute, then thirty seconds.', 'The class checks each version kept the thesis, reasons and conclusion.'] },
      realWorld: 'Timed debate speeches, group discussions and interview answers.',
      mentorWatchFor: ['Shorter versions that simply stop early.', 'Speed replacing editing.'],
      selfCheck: ['Was each version complete?', 'Did I finish within time?'],
      writePrompt: 'Write the same argument at three lengths: about two hundred and fifty words, one hundred and twenty words and sixty words.',
    },
  ],
};

/* Grades 10–12 · Module 4 — Academic Speaking (five lessons; slot 24 is the showcase) */
export const SENIOR_M4: CourseModule = {
  title: 'Academic Speaking',
  outcome: 'Handle vivas and practical exams, present research, explain complex ideas simply, contribute in seminars and answer examiners’ follow-ups.',
  world: { name: "Scholars' Hall", emoji: '🎓', color: '#7C3AED', tagline: 'Show what you actually understand.' },
  lessons: [
    {
      title: 'The viva and the practical exam',
      oneLine: 'A viva tests whether you understand your work — explain your reasoning, not just the steps.',
      idea: [
        'In practical exams and vivas, examiners ask why you chose a method, what a result means and what could have gone wrong. Memorised procedures are not enough.',
        'Answer with reasoning: "I chose this method because…", "This result suggests…, although a limitation is…" Precision and honesty beat confident guesses.',
      ],
      drills: [
        { title: 'Explain your experiment', brief: 'Explain a practical or project you have done: aim, method, key result and one limitation.', targetSeconds: 120 },
        { title: 'The why question', brief: 'Answer an examiner’s question: "Why did you choose that method rather than an alternative?"', targetSeconds: 60 },
      ],
      game: { name: 'Professor Mode', emoji: '🎓', how: ['A student explains a school topic in one minute.', 'The class asks "why?" three times in a row.', 'Survive all three without saying "I don’t know" — say what you would check.'] },
      realWorld: 'Board practical vivas, science fairs and project evaluations.',
      mentorWatchFor: ['Reciting steps without reasoning.', 'Bluffing when uncertain.'],
      selfCheck: ['Did I explain why, not just what?', 'Did I name a limitation?'],
      writePrompt: 'Write the five questions an examiner is most likely to ask about a practical or project, with reasoned answers.',
    },
    {
      title: 'Presenting a research project',
      oneLine: 'A research presentation tells a story: the question, why it matters, what you did, what you found and what it means.',
      idea: [
        'Extended essays, science research and independent projects require presenting to teachers or judges. The biggest mistake is presenting everything you did chronologically.',
        'Structure it as: research question, significance, approach, key findings (the two or three that matter), implications and limitations.',
      ],
      drills: [
        { title: 'Three-minute research talk', brief: 'Present a real or planned research project using question, significance, approach, findings, implications and limitations.', targetSeconds: 180 },
        { title: 'The significance pitch', brief: 'Explain why your research question matters to someone outside your subject in sixty seconds.', targetSeconds: 60 },
      ],
      game: { name: 'Research Fair', emoji: '🧪', how: ['Students present research in three minutes.', 'Judges score clarity of the question and significance.', 'Each presenter answers one judge question.'] },
      realWorld: 'Extended essays, science research competitions and independent study presentations.',
      mentorWatchFor: ['Chronological narration.', 'Significance left unclear.'],
      selfCheck: ['Was my research question clear in the first thirty seconds?', 'Did I state implications and limitations?'],
      writePrompt: 'Write the outline of a research presentation: question, significance, approach, findings, implications and limitations.',
    },
    {
      title: 'Explaining complex ideas simply',
      oneLine: 'If you can explain a difficult idea simply, examiners know you truly understand it.',
      idea: [
        'Complexity is easy to hide behind jargon. Explaining simply requires identifying the core idea, using an analogy and building step by step.',
        'The test: could an intelligent fourteen-year-old follow you? If not, simplify the language without losing accuracy.',
      ],
      drills: [
        { title: 'Analogy explanation', brief: 'Explain a difficult concept from your subjects — such as inflation, entropy or natural selection — using one strong analogy.', targetSeconds: 90 },
        { title: 'Two levels', brief: 'Explain the same concept to a Grade 8 student, then to your subject teacher.', targetSeconds: 150 },
      ],
      game: { name: 'Explain It Like They’re Fourteen', emoji: '🧠', how: ['A student explains a complex idea.', 'The class raises hands at any unexplained jargon.', 'The explainer must replace it with plain language or an analogy.'] },
      realWorld: 'Interviews asking you to explain your academic interests.',
      mentorWatchFor: ['Analogies that mislead.', 'Oversimplification that becomes inaccurate.'],
      selfCheck: ['Did my analogy clarify the core idea?', 'Did I stay accurate?'],
      writePrompt: 'Write an explanation of a complex concept with an analogy, then note where the analogy breaks down.',
    },
    {
      title: 'Seminar contributions that count',
      oneLine: 'In seminars, quality beats quantity — one well-reasoned contribution can shape the discussion.',
      idea: [
        'University seminars and IB or A-level discussions reward students who analyse, connect ideas and ask probing questions — not those who speak most.',
        'High-value contributions: connecting readings, challenging an assumption, offering a counter-example, synthesising the discussion or asking a question that deepens it.',
      ],
      drills: [
        { title: 'Challenge an assumption', brief: 'In a seminar on "Is economic growth always good?", challenge an assumption respectfully and explain why it matters.', targetSeconds: 60 },
        { title: 'Synthesise', brief: 'Summarise three different viewpoints from an imagined seminar and identify the key disagreement.', targetSeconds: 75 },
      ],
      game: { name: 'Contribution Cards', emoji: '🃏', how: ['Students receive cards: connect, challenge, question, synthesise.', 'During a discussion, each must play their card once.', 'The class evaluates the quality of each contribution.'] },
      realWorld: 'Seminar-style classes, university interviews and academic discussions.',
      mentorWatchFor: ['Contributions that repeat others.', 'Challenges that feel personal.'],
      selfCheck: ['What kind of contribution did I make?', 'Did it deepen the discussion?'],
      writePrompt: 'Write four seminar contributions on a topic you study: a connection, a challenge, a question and a synthesis.',
    },
    {
      title: 'The examiner’s follow-up question',
      oneLine: 'Follow-up questions probe the edge of your knowledge — handle them with clarity and intellectual honesty.',
      idea: [
        'Examiners and interviewers often push beyond your prepared answer: "What if…?", "How would that change if…?", "What evidence would disprove that?"',
        'Useful approach: acknowledge the complexity, reason aloud from what you know, identify assumptions and reach a tentative conclusion. Thinking visibly is valued.',
      ],
      drills: [
        { title: 'Reason aloud', brief: 'Answer: "If social media disappeared tomorrow, how would politics change?" Reason aloud and reach a tentative conclusion.', targetSeconds: 90 },
        { title: 'Beyond the syllabus', brief: 'Answer a question just beyond your knowledge in a subject you study, showing how you would reason towards an answer.', targetSeconds: 75 },
      ],
      game: { name: 'The Five Whys', emoji: '🔎', how: ['A student makes a claim.', 'The panel asks follow-up questions five times.', 'The class scores reasoning, honesty and composure.'] },
      realWorld: 'Oxbridge-style interviews, vivas and scholarship panels.',
      mentorWatchFor: ['Guessing confidently.', 'Shutting down with "I don’t know".'],
      selfCheck: ['Did I reason visibly?', 'Did I stay honest about uncertainty?'],
      writePrompt: 'Write a chain of three increasingly difficult follow-up questions on your favourite subject, and how you would reason through each.',
    },
  ],
};
