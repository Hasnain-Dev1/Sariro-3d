import type { CourseModule } from '../types';

/* Grades 10–12 · The Credible Voice — taught as module 2 (see index.ts) */
export const SENIOR_M1: CourseModule = {
  title: 'The Credible Voice',
  outcome: 'Understand how panels and examiners judge speakers, and sound credible through pace, clarity, presence and precise language.',
  world: { name: 'Credibility Court', emoji: '⚖️', color: '#DB2777', tagline: 'Sound like someone worth listening to.' },
  lessons: [
    {
      title: 'How panels, examiners and audiences judge you',
      oneLine: 'Interview panels, examiners and judges form impressions within seconds — and those impressions shape how they hear everything after.',
      idea: [
        'In the next two years you will face admission interviews, practical exams, competitions and leadership selections. Assessors judge content, but they also judge clarity, composure and credibility — often in the first thirty seconds.',
        'Credibility comes from three signals: you sound prepared, you sound calm and you speak precisely. This module trains each one deliberately, starting with an honest baseline.',
      ],
      drills: [
        { title: 'Baseline: introduce yourself to a panel', brief: 'Introduce yourself as you would to an admissions panel: who you are, what you study and one thing you are genuinely curious about.', targetSeconds: 60 },
        { title: 'Baseline: an opinion under scrutiny', brief: 'Give a reasoned view on "Should board exams be replaced by continuous assessment?" as if a judge is scoring you.', targetSeconds: 90 },
      ],
      game: { name: 'First Thirty Seconds', emoji: '⏱️', how: ['Students deliver only the first thirty seconds of a self-introduction.', 'The class writes three words describing the impression.', 'Compare the impressions with what the speaker intended.'] },
      realWorld: 'Admission interviews, scholarship panels and leadership selections.',
      mentorWatchFor: ['Casual openings that undercut credibility.', 'Students over-rehearsed to the point of sounding robotic.'],
      selfCheck: ['What impression did my first thirty seconds create?', 'Which credibility signal is my weakest?'],
      writePrompt: 'Write an honest assessment of how you currently come across in high-stakes speaking and the three situations you most need to prepare for.',
    },
    {
      title: 'Sounding certain in front of a panel',
      oneLine: 'Authority sounds like a steady pace, downward-ending statements and deliberate pauses.',
      idea: [
        'Rushing signals anxiety. Ending statements with a rising pitch — uptalk — makes claims sound like questions. Filling silence signals discomfort.',
        'Authoritative speakers slow down for key ideas, end statements with a downward pitch and use pauses to let points land. None of this requires being loud.',
      ],
      model: { text: 'The data is clear. (pause) Students who sleep less than seven hours perform worse on memory tasks. (pause) Not slightly worse. (pause) Significantly worse. (pause) And yet most of us sacrifice sleep before every exam.', noticing: ['Statements end with a falling pitch.', 'Pauses isolate the key contrast.', 'The pace slows for the final line.'] },
      drills: [
        { title: 'Downward statements', brief: 'Read this with every statement ending on a falling pitch, pausing after each sentence.', passage: 'Climate policy is no longer a distant debate. It shapes the jobs we will apply for, the cities we will live in and the costs we will pay. The generation now in school will not simply inherit these decisions. We will be the ones who have to make them work.', targetSeconds: 35 },
        { title: 'Authority on a topic you know', brief: 'Explain a concept from your strongest subject for ninety seconds with a controlled pace, deliberate pauses and no uptalk.', targetSeconds: 90 },
      ],
      game: { name: 'Question or Statement?', emoji: '❓', how: ['Students say the same sentence twice: once with uptalk, once with a falling pitch.', 'The class votes which version sounds more certain.', 'Everyone then delivers a claim that must sound certain.'] },
      realWorld: 'Stating your view to an interview panel or delivering an assembly speech.',
      mentorWatchFor: ['Uptalk on key claims.', 'Monotone mistaken for authority.'],
      selfCheck: ['Did my statements end with a falling pitch?', 'Did pauses support my key points?'],
      soundLab: ['stress'],
      writePrompt: 'Write a short paragraph stating a firm position on an issue, marking pauses and the words to stress.',
    },
    {
      title: 'Subject terminology, said with confidence',
      oneLine: 'Your accent is not a problem — unclear articulation is. Clarity, not imitation, is the goal.',
      idea: [
        'Many students worry their accent sounds "wrong" to international panels. Admissions officers and examiners hear many accents; what they need is to understand you easily.',
        'Clarity comes from full word endings, clear consonants, appropriate pace and correct stress on key words — especially subject terminology you will use in interviews and vivas.',
      ],
      drills: [
        { title: 'Terminology precision', brief: 'Say ten technical terms from your subjects slowly and clearly, then use each in a sentence.', targetSeconds: 90 },
        { title: 'Clear at natural pace', brief: 'Read this clearly at a natural pace.', passage: 'Photosynthesis converts light energy into chemical energy stored in glucose. The process occurs in the chloroplasts, where chlorophyll absorbs light, water molecules are split and carbon dioxide is fixed into organic compounds. Without it, almost every food chain on Earth would collapse.', targetSeconds: 30 },
      ],
      game: { name: 'Terminology Relay', emoji: '🔤', how: ['Teams list difficult terms from a subject.', 'Each member pronounces one clearly and uses it in a sentence.', 'The lab checks recognition — misheard words go back into the pile.'] },
      realWorld: 'Vivas, interviews with international universities and online entrance interviews.',
      mentorWatchFor: ['Students trying to fake an accent.', 'Mispronounced subject terms.'],
      selfCheck: ['Did the lab recognise my terminology?', 'Was I clear without imitating anyone?'],
      soundLab: ['ch', 'g', 'x'],
      writePrompt: 'Write a list of ten terms from your subjects that you must pronounce confidently, with a sentence for each.',
    },
    {
      title: 'Sitting and standing before a panel',
      oneLine: 'Presence is controlled stillness — every movement should mean something.',
      idea: [
        'Panels notice nervous movement: swaying, clicking pens, touching faces, shifting in chairs. Presence means stillness by default and movement with purpose.',
        'Seated interviews: sit back, upright, hands resting visibly. Standing: grounded feet, open hands, gestures that match your structure — one, two, three.',
      ],
      drills: [
        { title: 'Seated interview presence', brief: 'Sit as if before a panel and answer "What are you most proud of?" with stillness and visible, calm hands.', targetSeconds: 75 },
        { title: 'Standing with purpose', brief: 'Stand and explain three reasons for a view, using a gesture for each reason and stillness in between.', targetSeconds: 75 },
      ],
      game: { name: 'Fidget Audit', emoji: '📋', how: ['A student answers an interview question.', 'Partners tally every unconscious movement.', 'The student answers again and aims to halve the tally.'] },
      realWorld: 'Seated admission interviews and standing presentations.',
      mentorWatchFor: ['Rigid, unnatural stillness.', 'Hands hidden under the table.'],
      selfCheck: ['How many unconscious movements did I make?', 'Did my gestures support my structure?'],
      writePrompt: 'Write your personal presence checklist for seated interviews and standing speeches.',
    },
    {
      title: 'When "I kind of think" costs marks',
      oneLine: '"I kind of think maybe" undermines a good answer — precise language sounds prepared.',
      idea: [
        'Fillers ("um", "like") and hedges ("I guess", "sort of", "kind of", "maybe") make strong content sound uncertain. Some caution is intelligent; constant hedging is not.',
        'Replace hedges with calibrated language: "The evidence suggests…", "I am confident that…", "One limitation is…" — precise about certainty, not vague.',
      ],
      drills: [
        { title: 'Hedge hunt', brief: 'Answer "What career are you considering and why?" for ninety seconds. Then note every hedge and filler.', targetSeconds: 90 },
        { title: 'Calibrated rewrite', brief: 'Answer again using calibrated language: clear certainty where you are sure, precise caution where you are not.', targetSeconds: 90 },
      ],
      game: { name: 'Hedge Buzzer', emoji: '🔔', how: ['A student answers an interview question.', 'The class buzzes on every hedge or filler.', 'Each buzz means rephrasing that sentence precisely.'] },
      realWorld: 'Interview answers where hedging makes you sound unprepared.',
      mentorWatchFor: ['Over-correction into arrogance.', 'New fillers replacing old ones.'],
      selfCheck: ['How many hedges did I use?', 'Did I express uncertainty precisely?'],
      writePrompt: 'Write a hedge-filled answer to an interview question, then rewrite it with calibrated, precise language.',
    },
    {
      title: 'Mock panel: judging yourself like an examiner',
      oneLine: 'Elite performers review footage systematically — you should review your speaking the same way.',
      idea: [
        'Random self-review ("I sounded awful") is useless. Structured review focuses on one dimension at a time and ends with one specific change.',
        'Use the lab’s measures as data: pace, fillers, pauses, clarity. Track them across weeks. Improvement you can see is motivating.',
      ],
      drills: [
        { title: 'Structured review', brief: 'Record a two-minute answer on a current affairs topic. Review content, voice and presence separately and state one change for each.', targetSeconds: 120 },
        { title: 'Implement one change', brief: 'Re-record the answer implementing only the most important change.', targetSeconds: 120 },
      ],
      game: { name: 'Coach’s Film Room', emoji: '🎬', how: ['Pairs exchange recordings.', 'Each review focuses on one assigned dimension.', 'Present findings as a coach would to an athlete: data, observation, one drill.'] },
      realWorld: 'Preparing systematically for interviews, competitions and auditions.',
      mentorWatchFor: ['Vague self-criticism.', 'Ignoring data that contradicts self-perception.'],
      selfCheck: ['What does my data show across recordings?', 'Did my change improve the measure?'],
      writePrompt: 'Write a structured review of your recording with data, observations and your top three priorities.',
    },
  ],
};

/* Grades 10–12 · Performance Under Pressure — taught as module 3 */
export const SENIOR_M2: CourseModule = {
  title: 'Performance Under Pressure',
  outcome: 'Manage high-stakes nerves, rehearse in ways that transfer, recover mid-speech, think on your feet and speak to authority.',
  world: { name: 'Pressure Chamber', emoji: '🔥', color: '#EA580C', tagline: 'Perform when it counts.' },
  lessons: [
    {
      title: 'High-stakes nerves: boards, auditions and finals',
      oneLine: 'Pressure does not disappear with experience — performers learn to work with it.',
      idea: [
        'When stakes are high — a board practical, an audition, a scholarship interview — your body releases adrenaline. Heart rate, breathing and thinking speed change.',
        'Useful reframe: arousal is energy. Practical control: slow exhale-focused breathing, a pre-performance routine and a first sentence you know perfectly.',
      ],
      drills: [
        { title: 'Pre-performance routine', brief: 'Describe your own two-minute pre-performance routine, then perform it and deliver a sixty-second opening statement.', targetSeconds: 60 },
        { title: 'Stress inoculation', brief: 'Do thirty seconds of vigorous movement, then immediately deliver a composed ninety-second answer to "Why should we select you?"', targetSeconds: 90 },
      ],
      game: { name: 'Heart-Rate Speech', emoji: '💓', how: ['Students raise their heart rate with quick exercise.', 'They deliver a composed answer while still breathing hard.', 'The class rates composure — nerves as fuel.'] },
      realWorld: 'Board practicals, auditions, scholarship interviews and competition finals.',
      mentorWatchFor: ['Routines that are too long or complicated.', 'Students suppressing nerves rather than managing them.'],
      selfCheck: ['What is my pre-performance routine?', 'Could I stay composed with a racing heart?'],
      writePrompt: 'Write your pre-performance routine step by step, including your guaranteed first sentence.',
    },
    {
      title: 'Rehearsal that actually transfers',
      oneLine: 'Rehearsal only works if it resembles the real thing — standing, timed, interrupted and out loud.',
      idea: [
        'Reading notes silently feels productive but does not prepare you for performing. Effective rehearsal simulates conditions: standing or seated as on the day, timed, with an audience or camera.',
        'Rehearse in stages: content fluency, then delivery, then pressure — interruptions, hard questions and time cuts.',
      ],
      drills: [
        { title: 'Timed and standing', brief: 'Deliver a two-minute speech on a topic of your choice, standing and timed, as if at a competition.', targetSeconds: 120 },
        { title: 'The time cut', brief: 'Deliver the same speech after being told you only have seventy-five seconds, keeping the message intact.', targetSeconds: 75 },
      ],
      game: { name: 'Simulation Round', emoji: '🎯', how: ['Recreate a real setting: panel chairs, a timer, formal greetings.', 'Students deliver their rehearsed piece under full conditions.', 'Debrief: what did simulation reveal that practice missed?'] },
      realWorld: 'Preparing for Model UN, debate finals and interviews.',
      mentorWatchFor: ['Rehearsal without time pressure.', 'Only rehearsing the parts students already know well.'],
      selfCheck: ['Did I rehearse under real conditions?', 'Could I cut time without losing the message?'],
      writePrompt: 'Write a three-stage rehearsal plan for your next important speaking event.',
    },
    {
      title: 'Recovering mid-speech',
      oneLine: 'Recovery is a skill: pause, re-anchor to your structure and continue without apologising.',
      idea: [
        'Losing your place, stumbling over a statistic or having technology fail are inevitable over enough performances. Assessors often judge the recovery more than the mistake.',
        'Tools: a deliberate pause, a structural anchor ("My second argument is…"), a brief correction without drama, and continuing forward rather than restarting.',
      ],
      drills: [
        { title: 'Planned disruption', brief: 'Deliver a ninety-second speech. Deliberately lose your place halfway, pause, re-anchor with a signpost and continue.', targetSeconds: 90 },
        { title: 'The wrong statistic', brief: 'Mid-speech, state a number, correct it calmly in one sentence and continue.', targetSeconds: 60 },
      ],
      game: { name: 'Oops Cards', emoji: '🃏', how: ['A student delivers a sixty-second speech.', 'Mid-way, the mentor flashes a disruption: lost place, slide failure, noise.', 'The class scores the recovery out of three.'] },
      realWorld: 'Competition speeches, class presentations and live events.',
      mentorWatchFor: ['Over-apologising.', 'Restarting from the beginning.'],
      selfCheck: ['Did I recover without apologising?', 'Did my structure help me re-anchor?'],
      writePrompt: 'Write the structural anchors for a speech so you can re-enter at any point after losing your place.',
    },
    {
      title: 'Thinking on your feet',
      oneLine: 'Unprepared questions are survivable with a quick framework: clarify, structure, answer, conclude.',
      idea: [
        'Interviews, vivas and discussions throw unexpected questions. The panic response is to start talking immediately. Better: pause briefly, clarify if needed, and choose a structure.',
        'Quick structures: past–present–future; problem–cause–solution; two sides and a verdict; point–example–implication.',
      ],
      drills: [
        { title: 'Unseen question', brief: 'Answer with a quick structure: "What is the biggest challenge facing your generation?"', targetSeconds: 90 },
        { title: 'Three structures', brief: 'Answer "Is technology making education better?" three times, using a different structure each time.', targetSeconds: 180 },
      ],
      game: { name: 'Topic Roulette', emoji: '🎡', how: ['Spin a random question.', 'Ten seconds to choose a structure.', 'Sixty seconds to answer — the class names the structure used.'] },
      realWorld: 'Unexpected interview questions and extempore rounds.',
      mentorWatchFor: ['Rambling without structure.', 'Long silences before starting.'],
      selfCheck: ['Did I choose a structure quickly?', 'Did I conclude clearly?'],
      writePrompt: 'Write answers to three unexpected interview questions using a different quick structure for each.',
    },
    {
      title: 'Speaking to people with authority over you',
      oneLine: 'With principals, examiners and interviewers, be respectful without being submissive.',
      idea: [
        'Many students either become overly deferential — apologising, hedging, agreeing with everything — or overly casual. Both reduce credibility.',
        'Aim for respectful confidence: polite greeting, direct communication, reasoned disagreement when warranted ("I see it slightly differently, because…") and gracious closing.',
      ],
      drills: [
        { title: 'Requesting a meeting', brief: 'Request a meeting with your principal to propose a student-led initiative: purpose, benefit and specific request.', targetSeconds: 60 },
        { title: 'Respectful disagreement', brief: 'An interviewer says "Most students choose your course for the salary." Disagree respectfully with your reason.', targetSeconds: 45 },
      ],
      game: { name: 'The Principal’s Office', emoji: '🏫', how: ['The mentor plays a busy principal with limited time.', 'Students make a proposal in sixty seconds.', 'The "principal" pushes back once; students must respond respectfully and confidently.'] },
      realWorld: 'Proposals to school leadership, admission interviews and coaching feedback.',
      mentorWatchFor: ['Excessive apologising.', 'Arguing rather than disagreeing respectfully.'],
      selfCheck: ['Was I direct and respectful?', 'Did I disagree without backing down or becoming defensive?'],
      writePrompt: 'Write a proposal you could make to your school principal, including how you would respond to one objection.',
    },
    {
      title: 'Your speaking portfolio',
      oneLine: 'Documenting your speaking — competitions, roles and recordings — gives you evidence for applications and interviews.',
      idea: [
        'University applications and interviews ask for evidence of communication and leadership. A speaking portfolio tracks your debates, MUN conferences, presentations, hosting roles and results.',
        'It also gives you stories: specific experiences you can reference when asked about challenges, teamwork or growth.',
      ],
      drills: [
        { title: 'Portfolio highlights', brief: 'Describe the three most significant speaking experiences you have had so far and what each demonstrated.', targetSeconds: 120 },
        { title: 'Turn it into a story', brief: 'Tell one of those experiences as a ninety-second interview story: situation, challenge, action and result.', targetSeconds: 90 },
      ],
      game: { name: 'Portfolio Pitch', emoji: '📁', how: ['Students list their speaking experiences.', 'Partners help identify gaps: debate, hosting, interviews, camera.', 'Each student commits to filling one gap this term.'] },
      realWorld: 'College applications, scholarship essays and interviews asking for evidence of communication.',
      mentorWatchFor: ['Students undervaluing smaller experiences.', 'Lists without reflection.'],
      selfCheck: ['What evidence do I have?', 'What gap will I fill this term?'],
      writePrompt: 'Write your speaking portfolio: experiences so far, what each shows and the opportunities you will pursue next.',
    },
  ],
};
