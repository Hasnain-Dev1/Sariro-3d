import type { CourseModule } from '../types';

/* Grades 7–9 · Module 7 — Real Conversations */
export const MIDDLE_M7: CourseModule = {
  title: 'Real Conversations',
  outcome: 'Stand out in group discussions and extempore, introduce yourself well, talk to adults, speak as a MUN delegate and on camera.',
  world: { name: 'Real World Zone', emoji: '🌍', color: '#CA8A04', tagline: 'Speaking where it actually counts.' },
  lessons: [
    {
      title: 'Group discussion that gets you noticed',
      oneLine: 'In a group discussion, the people who get noticed move the conversation forward — not the loudest.',
      idea: [
        'Group discussions are used in class, in competitions and later in admissions. Assessors notice people who start well, build on others, bring facts, include quieter members and summarise.',
        'Talking over people, repeating points and staying silent all score badly.',
      ],
      drills: [
        { title: 'Start the discussion', brief: 'Open a group discussion on "Should schools teach financial literacy?" — define it, give your view and invite others.', targetSeconds: 45 },
        { title: 'Build and summarise', brief: 'Make two contributions that build on imaginary teammates’ points, then summarise the discussion.', targetSeconds: 75 },
      ],
      game: { name: 'Talking Stick', emoji: '🪄', how: ['Only the holder of the stick may speak.', 'To take it, you must start with "Building on what ___ said…"', 'The mentor scores listening, not loudness.'] },
      realWorld: 'Group discussions in class, competitions and later in admissions.',
      mentorWatchFor: ['Interrupting.', 'Silent students — coach them to make an early, short entry.'],
      selfCheck: ['Did I move the discussion forward?', 'Did I include someone else?'],
      writePrompt: 'Write an opening, a building contribution and a summary for a discussion on whether exams should be abolished.',
    },
    {
      title: 'Extempore: speaking on the spot',
      oneLine: 'With a thirty-second plan — a stance, two points and an example — you can speak on almost anything.',
      idea: [
        'Extempore competitions give you a topic and a minute to prepare. Pick a stance or angle immediately, choose two or three points, find one example and plan your last line.',
        'Speak with confidence even if the topic is unfamiliar: define it, relate it to something you know, and stay honest.',
      ],
      drills: [
        { title: 'Thirty seconds to plan', brief: 'Topic: "The internet has made us lonelier." Plan for thirty seconds, then speak for ninety.', targetSeconds: 90 },
        { title: 'Random object', brief: 'Choose a random object near you. Speak for sixty seconds on what it says about modern life.', targetSeconds: 60 },
      ],
      game: { name: 'Topic Roulette', emoji: '🎡', how: ['Spin a random topic.', 'Thirty seconds to think.', 'Sixty seconds to talk — the lab scores it live.'] },
      realWorld: 'Extempore competitions and being asked to speak without warning.',
      mentorWatchFor: ['Freezing — prompt the plan.', 'Rambling without a stance.'],
      selfCheck: ['Did I take a clear stance?', 'Did I end on a planned line?'],
      writePrompt: 'Write thirty-second plans for three random topics: rain, rules and robots.',
    },
    {
      title: 'Introducing yourself at new schools, clubs and competitions',
      oneLine: 'A good introduction is short, specific and gives people something to remember and ask about.',
      idea: [
        '"Hi, I’m Rohan, I’m in Grade 8" is forgettable. Add one interesting detail and a hook for conversation: "…and I spent last summer building a drone that crashed into a tree."',
        'Formula: name, context (class, school, role), one memorable detail, and a question or connection to the listener.',
      ],
      drills: [
        { title: 'Thirty-second intro', brief: 'Introduce yourself to a new club using name, context, a memorable detail and a connection.', targetSeconds: 30 },
        { title: 'Competition intro', brief: 'Introduce yourself and your team at the start of a quiz or science competition.', targetSeconds: 45 },
      ],
      game: { name: 'Memory Circle', emoji: '🧠', how: ['Everyone gives a thirty-second intro.', 'At the end, students try to recall one detail about each person.', 'The most remembered intros are discussed — what made them stick?'] },
      realWorld: 'Joining a new school, club, sports team or summer camp.',
      mentorWatchFor: ['Intros that list too many facts.', 'Bragging instead of interesting details.'],
      selfCheck: ['Did I include one memorable detail?', 'Did I connect with the listener?'],
      writePrompt: 'Write three versions of your introduction: for a new class, a club and a competition.',
    },
    {
      title: 'Talking to adults with confidence',
      oneLine: 'Speaking to teachers, principals and relatives confidently means being polite, direct and clear about what you need.',
      idea: [
        'Many teens either mumble or become overly casual with adults. The sweet spot: polite greeting, a clear purpose, the key details and a thank-you.',
        'Asking for a deadline extension? "Good morning, Ma’am. Could I ask about the science project? I was ill on Tuesday and missed two days. Could I submit it on Monday instead?"',
      ],
      drills: [
        { title: 'The polite request', brief: 'Ask a teacher for an extension: greeting, purpose, reason, specific request and thank-you.', targetSeconds: 40 },
        { title: 'Phone call', brief: 'Call a local library to ask about volunteering opportunities for students. Introduce yourself and ask two questions.', targetSeconds: 60 },
      ],
      game: { name: 'Adult Role-Play', emoji: '🧑‍🏫', how: ['The mentor plays a busy principal, a coach or a shopkeeper.', 'Students have forty-five seconds to make a clear request.', 'The class gives feedback: polite, direct, clear?'] },
      realWorld: 'Talking to teachers, coaches, relatives and people at shops or offices.',
      mentorWatchFor: ['Rambling before the request.', 'Too casual or too timid.'],
      selfCheck: ['Was my purpose clear quickly?', 'Was I polite and direct?'],
      writePrompt: 'Write what you would say to request something important from a teacher or coach.',
    },
    {
      title: 'Model UN: your first delegate speech',
      oneLine: 'A MUN delegate speaks for a country, not themselves — clearly, formally and with a proposal.',
      idea: [
        'Model United Nations lets students debate world issues as country delegates. An opening speech: greet the chair, state your country’s position, give a reason or fact and propose a solution.',
        'Use formal language ("The delegate of Brazil believes…") and speak for that country’s real interests, even when they differ from your own view.',
      ],
      model: { text: 'Honourable chair, fellow delegates. The delegate of Kenya believes access to clean water is a right, not a privilege. Millions in our region walk hours each day to collect water. Kenya proposes a regional fund for community wells, supported by member states and monitored by the UN. Thank you.', noticing: ['Formal greeting.', 'Position, reason and a concrete proposal.', 'Short and structured.'] },
      drills: [
        { title: 'Opening speech', brief: 'Choose a country. Give a sixty-second MUN opening speech on plastic pollution: greeting, position, fact and proposal.', targetSeconds: 60 },
        { title: 'Respond to another delegate', brief: 'Respond formally to a delegate who disagrees with your proposal and suggest a compromise.', targetSeconds: 45 },
      ],
      game: { name: 'Mini General Assembly', emoji: '🌐', how: ['Assign each student a country.', 'Each delivers a forty-five-second position on one issue.', 'Hold a quick vote on the best proposal.'] },
      realWorld: 'School and inter-school Model UN conferences.',
      mentorWatchFor: ['Students giving personal opinions instead of the country’s position.', 'Informal language.'],
      selfCheck: ['Did I speak as my country?', 'Did I make a proposal?'],
      writePrompt: 'Write a MUN opening speech for a country of your choice on a global issue.',
    },
    {
      title: 'Podcasts, reels and speaking to a camera',
      oneLine: 'On camera, the lens is one person — talk to them like a friend, with energy and a clear point.',
      idea: [
        'Speaking to a camera feels weird because there is no reaction. Imagine one real person behind the lens. Look at the lens, not the screen.',
        'Online attention is short: hook in the first three seconds, one idea, and slightly more energy than feels natural.',
      ],
      drills: [
        { title: 'Thirty-second reel', brief: 'Record a thirty-second "one tip" video about something you are good at. Hook in the first sentence and look at the lens.', targetSeconds: 30 },
        { title: 'Podcast intro', brief: 'Record the introduction to your own podcast: name, what it is about and why people should listen.', targetSeconds: 45 },
      ],
      game: { name: 'News Anchor', emoji: '📺', how: ['Each student reports a thirty-second news story straight to camera.', 'End with a sign-off.', 'Watch with sound off — did they look at the lens?'] },
      realWorld: 'Video assignments, school YouTube channels and online classes.',
      mentorWatchFor: ['Eyes on the screen instead of the lens.', 'Low energy that looks flat on camera.'],
      selfCheck: ['Did I look at the lens?', 'Did I hook in the first sentence?'],
      writePrompt: 'Write a script for a thirty-second educational reel on a topic you know well.',
    },
  ],
};

/* Grades 7–9 · Module 8 — The Main Stage (five lessons; slot 48 is the showcase) */
export const MIDDLE_M8: CourseModule = {
  title: 'The Main Stage',
  outcome: 'Adapt to any audience, deliver a TED-style idea with humour and feedback built in, and speak for a cause.',
  world: { name: 'Main Stage', emoji: '🎤', color: '#2563EB', tagline: 'Bring it all together.' },
  lessons: [
    {
      title: 'Reading the audience and adapting',
      oneLine: 'The same message needs different words for your friends, your teachers and your grandparents.',
      idea: [
        'Before any talk, ask: Who are they? What do they already know? What do they care about? Then adjust your vocabulary, examples and length.',
        'During the talk, read signals: confused faces mean slow down or give an example; restless ones mean cut to the point.',
      ],
      drills: [
        { title: 'Three rooms', brief: 'Explain why sleep matters three times: to a Grade 3 class, to your friends and to your school’s parent meeting.', targetSeconds: 120 },
        { title: 'Adapt mid-talk', brief: 'Start explaining a science concept, imagine confused faces, and adapt with a simpler example.', targetSeconds: 60 },
      ],
      game: { name: 'Three Rooms', emoji: '🚪', how: ['Explain the same idea three times.', 'To a five-year-old, a grandparent and a company CEO.', 'The class spots what changed: words, speed, examples.'] },
      realWorld: 'Explaining your work to classmates, parents and judges.',
      mentorWatchFor: ['Talking down to younger audiences.', 'Changing volume but not content.'],
      selfCheck: ['What changed between versions?', 'Did I choose examples for each audience?'],
      writePrompt: 'Write how you would explain climate change to a young child, a classmate and a local council.',
    },
    {
      title: 'The TED-style talk: an idea worth sharing',
      oneLine: 'A TED-style talk shares one idea, supported by a personal story, evidence and a clear takeaway.',
      idea: [
        'Great idea talks follow a pattern: a hook, a personal story that led to the idea, the idea explained simply, evidence or examples, and what the audience should think or do.',
        'Choose an idea you genuinely believe, not a topic you think sounds impressive.',
      ],
      drills: [
        { title: 'My idea in two minutes', brief: 'Give a two-minute idea talk: hook, a personal story, the idea, one piece of evidence and a takeaway.', targetSeconds: 120 },
        { title: 'The personal story', brief: 'Tell only the personal story that led to your idea, in under sixty seconds.', targetSeconds: 60 },
      ],
      game: { name: 'Idea Pitch Night', emoji: '💡', how: ['Students pitch their idea in one sentence.', 'The class chooses three ideas to develop.', 'Those students give ninety-second versions with a story.'] },
      realWorld: 'TEDx-style school events, youth conferences and assemblies.',
      mentorWatchFor: ['Talks with several ideas.', 'Stories disconnected from the idea.'],
      selfCheck: ['Is my idea one sentence?', 'Does my story lead to it?'],
      writePrompt: 'Write the outline of an idea talk: hook, personal story, idea, evidence and takeaway.',
    },
    {
      title: 'Humour that lands (and when to skip it)',
      oneLine: 'Good humour comes from truth and surprise — and it should never cost someone else.',
      idea: [
        'The easiest humour is observational: something true and relatable said with a twist. Self-deprecating humour works too, in small doses.',
        'Skip jokes about appearance, identity or someone in the room. If you are unsure whether a joke is kind, leave it out.',
      ],
      drills: [
        { title: 'Relatable opener', brief: 'Open a talk about school mornings with a relatable, observational funny line, then continue into your point.', targetSeconds: 60 },
        { title: 'The callback', brief: 'Tell a short story with a funny detail early on and call back to it at the end.', targetSeconds: 60 },
      ],
      game: { name: 'Callback Comedy', emoji: '😂', how: ['Tell a short story with one small funny detail early on.', 'Bring that detail back in the last line.', 'The class rates the callback — kind humour only.'] },
      realWorld: 'Farewell speeches, class events and making an audience relax.',
      mentorWatchFor: ['Humour at someone’s expense.', 'Forced jokes that break the flow.'],
      selfCheck: ['Was my humour kind?', 'Did it support my point?'],
      writePrompt: 'Write three observational funny lines about school life that nobody would find hurtful.',
    },
    {
      title: 'Feedback: giving it, taking it, using it',
      oneLine: 'Useful feedback is specific and actionable — and taking it well is a skill of its own.',
      idea: [
        'Give feedback that is specific ("Your pause before the statistic made it hit"), actionable ("Try cutting your intro to two sentences") and kind.',
        'When receiving: listen, do not defend, ask a clarifying question, thank them, then decide what to use.',
      ],
      drills: [
        { title: 'Give feedback', brief: 'Watch or listen to any short speech online and give specific, actionable feedback in sixty seconds.', targetSeconds: 60 },
        { title: 'Take feedback', brief: 'Imagine feedback that your talk was too long and too fast. Respond without defending, ask one question and say what you will change.', targetSeconds: 40 },
      ],
      game: { name: 'Glow & Grow', emoji: '🌱', how: ['After each talk, two listeners give one glow and one grow.', 'Each must be specific and actionable.', 'The speaker only says "Thank you" and one thing they will change.'] },
      realWorld: 'Peer review in class and coaching from teachers.',
      mentorWatchFor: ['Vague praise.', 'Defensive responses.'],
      selfCheck: ['Was my feedback specific?', 'Did I receive feedback without defending?'],
      writePrompt: 'Write feedback for a speech you watched: two specific strengths and one actionable improvement.',
    },
    {
      title: 'A talk on a cause I care about',
      oneLine: 'Your most powerful talk is about something you genuinely care about — built with everything you have learned.',
      idea: [
        'Choose a cause that matters to you: mental health, animal welfare, the environment, equality, a local problem.',
        'Structure it: a hook, why you care (your story), the problem with evidence, what can be done, and a specific call to action.',
      ],
      drills: [
        { title: 'Cause talk rehearsal', brief: 'Deliver a two-minute talk on a cause you care about: hook, your story, the problem, solutions and a call to action.', targetSeconds: 120 },
        { title: 'The ending that moves', brief: 'Deliver only your final thirty seconds so powerfully that the audience wants to act.', targetSeconds: 30 },
      ],
      game: { name: 'Dress Rehearsal', emoji: '🎭', how: ['Full performance of the talk, standing, to camera.', 'The lab records every measure.', 'The class gives one glow each — this is the one to be proud of.'] },
      realWorld: 'Speeches for school campaigns, clubs and community events.',
      mentorWatchFor: ['Causes chosen to impress rather than genuine interest.', 'Weak or vague calls to action.'],
      selfCheck: ['Did my story show why I care?', 'Was my call to action specific?'],
      writePrompt: 'Write the full outline of your cause talk: hook, story, evidence, solutions and call to action.',
    },
  ],
};
