import type { CourseModule } from '../types';

/* UG, PG & professionals · Structured Communication — taught as module 1 (see index.ts) */
export const ADULT_M3: CourseModule = {
  title: 'Structured Communication',
  outcome: 'Lead with the bottom line, pitch in thirty seconds, structure updates, make data meaningful, be brief and explain technical work to anyone.',
  world: { name: 'Clarity Lab', emoji: '🧩', color: '#0891B2', tagline: 'Say it so it gets used.' },
  lessons: [
    {
      title: 'Bottom line first: the pyramid principle',
      oneLine: 'Busy people need your conclusion first — then the reasons, then the detail if they ask.',
      idea: [
        'Academic training teaches us to build up to a conclusion. Workplaces reward the opposite: the answer first, supported by three key reasons, with detail available on request.',
        'Test: if someone stops listening after your first sentence, would they still know what you recommend or concluded?',
      ],
      model: { text: 'We should delay the launch by two weeks. Three reasons: testing found two critical bugs, the payment integration is not certified, and support documentation is incomplete. A two-week delay costs less than a failed launch.', noticing: ['The recommendation first.', 'Three grouped reasons.', 'A one-line justification to close.'] },
      drills: [
        { title: 'Answer first', brief: 'Give a sixty-second update on a project using the pyramid: conclusion, three supporting reasons, one line of justification.', targetSeconds: 60 },
        { title: 'Flip the essay', brief: 'Take a conclusion from an assignment or report and present it bottom line first in forty-five seconds.', targetSeconds: 45 },
      ],
      game: { name: 'Stop After One', emoji: '✋', how: ['Participants begin an update.', 'The facilitator stops them after the first sentence.', 'Listeners state the conclusion — if they cannot, restart with the answer first.'] },
      realWorld: 'Emails to managers, project updates and executive summaries.',
      mentorWatchFor: ['Background before the point.', 'Reasons that overlap.'],
      selfCheck: ['Was my conclusion in the first sentence?', 'Were my reasons distinct?'],
      writePrompt: 'Rewrite a recent update or assignment conclusion using the pyramid principle.',
    },
    {
      title: 'The elevator pitch',
      oneLine: 'A thirty-second pitch says who you are, what you do, why it matters and what you want next.',
      idea: [
        'Career fairs, networking events, alumni meetings and senior leaders in corridors all offer brief windows. A prepared pitch turns chance encounters into opportunities.',
        'Formula: who you are, the problem or value you focus on, proof (one result or credential), and a specific next step — a call, an introduction or advice.',
      ],
      drills: [
        { title: 'Thirty-second pitch', brief: 'Deliver your professional elevator pitch in thirty seconds with a specific ask.', targetSeconds: 30 },
        { title: 'Tailored pitch', brief: 'Adapt your pitch for a recruiter, an alumnus in your target industry and a potential mentor.', targetSeconds: 90 },
      ],
      game: { name: 'Lift Doors', emoji: '🛗', how: ['Participants pair up as if meeting in a lift.', 'Each has thirty seconds before the "doors open".', 'The listener states what they would do next — if nothing, the ask was unclear.'] },
      realWorld: 'Career fairs, networking events and chance meetings with senior leaders.',
      mentorWatchFor: ['Pitches that are job titles only.', 'No clear ask.'],
      selfCheck: ['Did my pitch include proof?', 'Was the next step specific?'],
      writePrompt: 'Write three versions of your elevator pitch for different listeners, each under eighty words.',
    },
    {
      title: 'Situation, complication, resolution',
      oneLine: 'SCR turns status updates and proposals into a clear narrative decision-makers can follow.',
      idea: [
        'Situation: the context everyone agrees on. Complication: what has changed or gone wrong. Resolution: what you propose and why.',
        'SCR is used by consultants and leaders because it creates a logical tension and a clear answer in under a minute.',
      ],
      drills: [
        { title: 'SCR update', brief: 'Use SCR to explain a problem in a project or course and your proposed solution.', targetSeconds: 75 },
        { title: 'SCR proposal', brief: 'Use SCR to propose a new initiative to your department or student society.', targetSeconds: 90 },
      ],
      game: { name: 'SCR Sort', emoji: '🗃️', how: ['Teams receive jumbled sentences from an update.', 'They sort them into situation, complication and resolution.', 'They deliver the ordered version.'] },
      realWorld: 'Consulting presentations, stakeholder updates and project proposals.',
      mentorWatchFor: ['Overlong situations.', 'Resolutions without justification.'],
      selfCheck: ['Was the complication clear?', 'Did my resolution follow logically?'],
      writePrompt: 'Write an SCR update for a real problem you are working on.',
    },
    {
      title: 'Making numbers and data speak',
      oneLine: 'Data persuades when you give it context, comparison and a clear "so what".',
      idea: [
        'Reading out numbers ("Revenue was 4.2 crore, costs were 3.1 crore, margin was 26 percent") overwhelms listeners. Choose the one number that matters and explain what it means.',
        'Use context (compared to what?), trend (improving or declining?) and implication (so what should we do?).',
      ],
      drills: [
        { title: 'One number that matters', brief: 'From your studies or work, present one important number with context, trend and implication.', targetSeconds: 60 },
        { title: 'Data story', brief: 'Read this data summary, then explain its meaning in plain language.', passage: 'Customer complaints fell from about three hundred per month to just under one hundred after the new onboarding guide launched. Over the same period, repeat purchases rose by nearly a fifth. The support team now spends more time on complex cases instead of basic setup questions.', targetSeconds: 60 },
      ],
      game: { name: 'So What?', emoji: '🤔', how: ['A participant presents a statistic.', 'The group asks "So what?" twice.', 'The presenter must reach a decision or action.'] },
      realWorld: 'Business reviews, research presentations and data-driven recommendations.',
      mentorWatchFor: ['Number dumping.', 'No implication stated.'],
      selfCheck: ['Did I give context and comparison?', 'Did I state the "so what"?'],
      writePrompt: 'Write a data summary that presents one key number with context, trend and implication.',
    },
    {
      title: 'Brevity for busy decision-makers',
      oneLine: 'Senior people reward brevity — if you can say it in half the time, do.',
      idea: [
        'Leaders often have minutes, not hours. Long explanations signal unclear thinking. Brevity requires knowing your point, cutting background and preparing detail as backup rather than as the main message.',
        'Practise the same message at two minutes, one minute and fifteen seconds.',
      ],
      drills: [
        { title: 'One minute', brief: 'Explain a project and your ask to a senior leader in exactly one minute.', targetSeconds: 60 },
        { title: 'Fifteen seconds', brief: 'Deliver the same message in fifteen seconds.', targetSeconds: 15 },
      ],
      extraDrills: [
        { title: 'Two minutes', brief: 'Deliver the full version in two minutes, with the extra minute used for evidence only.', targetSeconds: 120 },
      ],
      game: { name: 'The Accordion', emoji: '🪗', how: ['Participants deliver a two-minute message.', 'The facilitator calls a cut to one minute, then fifteen seconds.', 'The group checks each version kept the point and the ask.'] },
      realWorld: 'Corridor conversations with executives and meeting updates with limited time.',
      mentorWatchFor: ['Shorter versions that lose the ask.', 'Speed replacing editing.'],
      selfCheck: ['Did each version keep the point and ask?', 'What did I cut?'],
      writePrompt: 'Write the same message at three lengths: two minutes, one minute and fifteen seconds.',
    },
    {
      title: 'Explaining technical work to non-experts',
      oneLine: 'The ability to explain technical work simply determines whether your work gets funded, adopted or promoted.',
      idea: [
        'Engineers, researchers, analysts and doctors often lose non-expert audiences with jargon. Start with the problem and impact, use one analogy and add technical detail only when asked.',
        'Structure: the problem in everyday terms, what you did in one sentence, an analogy, the result and why it matters to them.',
      ],
      drills: [
        { title: 'Explain your work', brief: 'Explain your thesis, project or job to a non-specialist in ninety seconds without jargon.', targetSeconds: 90 },
        { title: 'Analogy test', brief: 'Explain one technical concept from your field using a single everyday analogy.', targetSeconds: 60 },
      ],
      game: { name: 'Jargon Jail', emoji: '🚫', how: ['A participant explains their work.', 'Listeners call "Jail!" on any unexplained jargon.', 'The speaker must rephrase or explain before continuing.'] },
      realWorld: 'Explaining research to funders, technical work to clients or product decisions to leadership.',
      mentorWatchFor: ['Acronyms and jargon.', 'Analogies that distort the concept.'],
      selfCheck: ['Could a smart non-expert follow me?', 'Did I explain why it matters to them?'],
      writePrompt: 'Write a plain-language explanation of your work with one analogy and its real-world impact.',
    },
  ],
};

/* UG, PG & professionals · Module 4 — Job and Career Interviews (five lessons; slot 24 is the showcase) */
export const ADULT_M4: CourseModule = {
  title: 'Job and Career Interviews',
  outcome: 'Answer "tell me about yourself", behavioural, case and technical, HR and salary questions, and perform in panel and virtual interviews.',
  world: { name: 'Interview Suite', emoji: '💼', color: '#DB2777', tagline: 'Walk out with the offer.' },
  lessons: [
    {
      title: '"Tell me about yourself" for placements and jobs',
      oneLine: 'Present, past, future — ninety seconds that position you for this specific role.',
      idea: [
        'This question opens most interviews and sets the frame for everything after. Reciting your CV wastes it. Tailor it: who you are now, the experiences that prepared you for this role and why this opportunity is your logical next step.',
        'End by connecting to the role. Rehearse it until it sounds natural, not memorised.',
      ],
      model: { text: 'I am a final-year economics student focused on data analysis. During my internship at a fintech startup, I built a customer segmentation model that the marketing team used to cut acquisition costs. That experience showed me I enjoy turning data into decisions quickly, which is exactly what this analyst role involves.', noticing: ['Present first.', 'One specific, relevant proof point.', 'A clear link to this role.'] },
      drills: [
        { title: 'Tailored answer', brief: 'Answer "Tell me about yourself" for a real target role or programme in ninety seconds using present, past and future.', targetSeconds: 90 },
        { title: 'The career-switch version', brief: 'Answer it as someone switching fields or returning after a gap, connecting past experience to the new direction.', targetSeconds: 90 },
      ],
      game: { name: 'CV or Story?', emoji: '📄', how: ['Participants answer "Tell me about yourself".', 'Listeners raise a card whenever it sounds like a CV list.', 'Participants retell with a clearer thread to the role.'] },
      realWorld: 'Campus placements, job interviews, graduate programmes and PhD admissions.',
      mentorWatchFor: ['Chronological CV recitation.', 'No link to the role.'],
      selfCheck: ['Did I link my answer to this role?', 'Was it under two minutes?'],
      writePrompt: 'Write your present–past–future answer for a specific role you want.',
    },
    {
      title: 'Behavioural answers with STAR',
      oneLine: 'STAR — situation, task, action, result — turns experiences into evidence interviewers can score.',
      idea: [
        'Behavioural questions ("Tell me about a time you handled conflict") are scored against competencies. Interviewers want specific evidence, not general claims.',
        'Keep situation and task brief, spend most time on your actions (use "I", not "we") and quantify the result. Add what you learned when relevant.',
      ],
      drills: [
        { title: 'Conflict STAR', brief: 'Answer "Tell me about a time you handled conflict in a team" using STAR.', targetSeconds: 90 },
        { title: 'Failure STAR', brief: 'Answer "Tell me about a time you failed" using STAR plus what you learned and changed.', targetSeconds: 90 },
      ],
      extraDrills: [
        { title: 'Leadership STAR', brief: 'Answer "Tell me about a time you led without formal authority" using STAR.', targetSeconds: 90 },
      ],
      game: { name: 'STAR Scoring', emoji: '⭐', how: ['A participant answers a behavioural question.', 'Panellists score each STAR element out of two.', 'The lowest-scoring element is rewritten and delivered again.'] },
      realWorld: 'Competency-based interviews at companies, consultancies and graduate schemes.',
      mentorWatchFor: ['Long situations and short actions.', '"We" hiding individual contribution.'],
      selfCheck: ['Did I spend most time on my actions?', 'Did I quantify the result?'],
      writePrompt: 'Write STAR stories for conflict, failure, leadership and working under pressure.',
    },
    {
      title: 'Case, technical and problem-solving interviews',
      oneLine: 'In case and technical rounds, interviewers score how you think aloud — clarify, structure, reason and conclude.',
      idea: [
        'Case interviews, guesstimates, coding explanations and technical problem-solving are assessed on process as much as the answer. Silence is risky; unstructured talking is worse.',
        'Clarify the question and assumptions, lay out your structure, reason step by step aloud, check your numbers and give a clear conclusion with next steps.',
      ],
      drills: [
        { title: 'Guesstimate aloud', brief: 'Estimate the number of cups of tea sold in a large city in a day, thinking aloud with clear assumptions and structure.', targetSeconds: 150 },
        { title: 'Explain your approach', brief: 'Explain how you would approach diagnosing a sudden drop in an app’s daily users.', targetSeconds: 120 },
      ],
      game: { name: 'Think-Aloud Case', emoji: '🧮', how: ['The facilitator gives a short case.', 'The candidate must speak their structure within thirty seconds.', 'The panel scores clarity of structure, assumptions and conclusion.'] },
      realWorld: 'Consulting, product, analytics and engineering interviews.',
      mentorWatchFor: ['Jumping to an answer without structure.', 'Long silences while calculating.'],
      selfCheck: ['Did I state my assumptions?', 'Did I conclude clearly?'],
      writePrompt: 'Write a structured approach to a case or technical problem common in your target field.',
    },
    {
      title: 'HR rounds, salary and difficult questions',
      oneLine: 'Questions about weaknesses, gaps, salary and leaving a job need calm, honest and brief answers.',
      idea: [
        'Difficult questions test composure and self-awareness. Answer honestly, briefly and without over-justifying. Pivot to what you learned or what you offer.',
        'Salary: research the range, state a range anchored in market data and your value, and remain open to the total package.',
      ],
      drills: [
        { title: 'Weakness and gap', brief: 'Answer "What is your biggest weakness?" and "Explain this gap in your CV" calmly and briefly.', targetSeconds: 90 },
        { title: 'Salary expectations', brief: 'Answer "What are your salary expectations?" with a researched range and openness to the package.', targetSeconds: 45 },
      ],
      game: { name: 'Awkward Question Wheel', emoji: '🎡', how: ['Spin for a difficult question: weakness, gap, salary, why leaving, failure.', 'The candidate answers in under sixty seconds.', 'The panel scores honesty, brevity and composure.'] },
      realWorld: 'HR rounds, final interviews and offer conversations.',
      mentorWatchFor: ['Fake weaknesses that are strengths.', 'Over-justifying gaps.'],
      selfCheck: ['Was I honest and brief?', 'Did I pivot to learning or value?'],
      writePrompt: 'Write concise answers to five difficult HR questions, including your researched salary range.',
    },
    {
      title: 'Panel and virtual interviews',
      oneLine: 'Panels require including every interviewer; video requires mastering the lens, the setup and the pause.',
      idea: [
        'In a panel, answer the person who asked but share eye contact across the panel, and note each panellist’s likely priorities (technical, managerial, HR).',
        'On video: camera at eye level, look at the lens, light your face, pause slightly longer before answering (because of lag) and keep answers tighter.',
      ],
      drills: [
        { title: 'Panel answer', brief: 'Answer "Why should we hire you?" as if to a panel of a hiring manager, a technical lead and HR — addressing each priority.', targetSeconds: 90 },
        { title: 'Video interview answer', brief: 'Record an answer to "Walk us through your most relevant project" looking at the lens throughout.', targetSeconds: 90 },
      ],
      game: { name: 'Panel Rotation', emoji: '👥', how: ['Three panellists each hold a hidden priority card.', 'The candidate answers three questions.', 'Panellists reveal priorities and score how well each was addressed.'] },
      realWorld: 'Panel interviews, video screening rounds and remote hiring.',
      mentorWatchFor: ['Eye contact with only one panellist.', 'Looking at the screen instead of the lens.'],
      selfCheck: ['Did I include the whole panel?', 'Did I look at the lens?'],
      writePrompt: 'Write your panel and video interview checklist, plus how you would tailor one answer to three panellists.',
    },
  ],
};
