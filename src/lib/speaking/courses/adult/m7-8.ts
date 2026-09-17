import type { CourseModule } from '../types';

/* UG, PG & professionals · Module 7 — Influence and Negotiation */
export const ADULT_M7: CourseModule = {
  title: 'Influence and Negotiation',
  outcome: 'Pitch ideas and ventures, network with purpose, negotiate, run client conversations, lead teams and communicate bad news.',
  world: { name: 'The Deal Table', emoji: '🤝', color: '#CA8A04', tagline: 'Move people and decisions.' },
  lessons: [
    {
      title: 'Pitching ideas, products and startups',
      oneLine: 'A strong pitch makes the problem painful, the solution obvious and the ask easy to say yes to.',
      idea: [
        'Whether pitching a startup to investors, a product to customers or an idea internally, the structure is similar: problem, solution, why now, proof or traction, why you, and the ask.',
        'Investors and decision-makers listen for clarity and conviction. If you cannot explain it simply, they assume you have not thought it through.',
      ],
      drills: [
        { title: 'Two-minute pitch', brief: 'Pitch a startup, product or internal idea: problem, solution, why now, proof, why you and the ask.', targetSeconds: 120 },
        { title: 'Investor question', brief: 'Answer "Why won’t a bigger competitor just copy this?" convincingly.', targetSeconds: 60 },
      ],
      game: { name: 'Shark Tank', emoji: '🦈', how: ['Participants pitch in two minutes.', 'Three "investors" ask one tough question each.', 'Investors allocate a pretend budget and explain their choices.'] },
      realWorld: 'Startup competitions, investor meetings and internal innovation pitches.',
      mentorWatchFor: ['Solutions before the problem is felt.', 'No clear ask.'],
      selfCheck: ['Did the problem feel real?', 'Was the ask clear?'],
      writePrompt: 'Write a two-minute pitch outline for a venture or internal idea, including answers to two investor objections.',
    },
    {
      title: 'Networking and professional small talk',
      oneLine: 'Networking is about curiosity and follow-up — ask good questions, share briefly, connect genuinely.',
      idea: [
        'Many people dislike networking because it feels transactional. Reframe it as professional curiosity: learning what others work on and finding genuine connections.',
        'Useful moves: an easy opener, an open question about their work, a brief share about yours, a natural close and a specific follow-up.',
      ],
      drills: [
        { title: 'Opener to follow-up', brief: 'Simulate a networking conversation at a conference: opener, question, brief share, close and follow-up request.', targetSeconds: 90 },
        { title: 'Graceful exit', brief: 'Exit a networking conversation gracefully and arrange a follow-up.', targetSeconds: 30 },
      ],
      game: { name: 'Mixer Rounds', emoji: '🍵', how: ['Participants rotate in three-minute conversations.', 'Each must learn one specific thing about the other’s work.', 'At the end, participants recall one detail about each person.'] },
      realWorld: 'Conferences, alumni events, industry meetups and career fairs.',
      mentorWatchFor: ['Leading with asks.', 'Monologues about oneself.'],
      selfCheck: ['Did I ask genuine questions?', 'Did I arrange a specific follow-up?'],
      writePrompt: 'Write your networking plan for an upcoming event: openers, questions, your brief share and follow-up message.',
    },
    {
      title: 'Negotiation conversations',
      oneLine: 'Good negotiators prepare their alternatives, understand the other side’s interests and trade rather than concede.',
      idea: [
        'Before negotiating a salary, a deadline or a contract, know your best alternative if no deal is reached, your target and your walk-away point.',
        'In the conversation, ask about interests behind positions, anchor with a justified number, trade concessions ("If we extend the timeline, could we reduce scope?") and summarise agreements.',
      ],
      drills: [
        { title: 'Salary negotiation', brief: 'Negotiate a job offer: thank them, state your researched counter with justification and explore the total package.', targetSeconds: 90 },
        { title: 'Deadline trade', brief: 'A client wants a project two weeks earlier. Negotiate by trading scope, resources or price.', targetSeconds: 90 },
      ],
      game: { name: 'Hidden Interests', emoji: '🔐', how: ['Pairs receive confidential role briefs with different interests.', 'They negotiate for ten minutes.', 'Reveal briefs and discuss which interests were discovered.'] },
      realWorld: 'Salary offers, vendor contracts, project timelines and client pricing.',
      mentorWatchFor: ['Conceding without trading.', 'Anchoring without justification.'],
      selfCheck: ['Did I discover their interests?', 'Did I trade rather than concede?'],
      writePrompt: 'Write your preparation for a real negotiation: alternatives, target, walk-away point, their interests and possible trades.',
    },
    {
      title: 'Client and sales conversations',
      oneLine: 'Consultative selling starts with understanding the client’s problem before presenting your solution.',
      idea: [
        'Clients buy when they feel understood. Ask diagnostic questions about their situation, challenges, impact and priorities before pitching anything.',
        'Then connect your solution to what they told you, handle objections by understanding them first, and agree clear next steps.',
      ],
      drills: [
        { title: 'Discovery questions', brief: 'Open a first meeting with a prospective client by asking four diagnostic questions about their challenges and priorities.', targetSeconds: 75 },
        { title: 'Tailored solution', brief: 'Present your solution by explicitly linking it to what the client said, and handle the objection "It’s too expensive."', targetSeconds: 90 },
      ],
      game: { name: 'Listen Before You Pitch', emoji: '👂', how: ['The "client" has a hidden problem card.', 'The seller may only ask questions for three minutes.', 'The seller then pitches — scored on how well it fits the hidden problem.'] },
      realWorld: 'Client meetings, consulting engagements and sales calls.',
      mentorWatchFor: ['Pitching before discovery.', 'Arguing with objections.'],
      selfCheck: ['Did I understand the client’s problem first?', 'Did my solution reference their words?'],
      writePrompt: 'Write a discovery question plan and how you would link your offering to three likely client needs.',
    },
    {
      title: 'Leading a team: vision and motivation',
      oneLine: 'Leaders communicate where the team is going, why it matters and what each person’s part is.',
      idea: [
        'New managers often focus on tasks and forget meaning. Teams perform better when they understand the purpose, the goal, how success is measured and how their role contributes.',
        'Kick-offs, all-hands updates and one-to-ones all need this clarity, delivered with genuine belief and openness to questions.',
      ],
      drills: [
        { title: 'Team kick-off', brief: 'Kick off a new quarter with your team: purpose, goal, success measures and each role’s contribution.', targetSeconds: 120 },
        { title: 'Re-energise the team', brief: 'After a tough month, speak to your team honestly about challenges, recognise effort and refocus on the goal.', targetSeconds: 90 },
      ],
      game: { name: 'Why It Matters', emoji: '🎯', how: ['Participants present a team goal.', 'Listeners ask "Why does that matter?" three times.', 'The leader must reach a purpose people care about.'] },
      realWorld: 'Team kick-offs, all-hands meetings and leading student organisations.',
      mentorWatchFor: ['Task lists without purpose.', 'Forced positivity after setbacks.'],
      selfCheck: ['Did I explain why it matters?', 'Did each role feel connected to the goal?'],
      writePrompt: 'Write a team kick-off talk with purpose, goal, success measures and role contributions.',
    },
    {
      title: 'Communicating bad news and crisis',
      oneLine: 'In bad news and crises, people need facts, empathy, a plan and a time for the next update.',
      idea: [
        'Delays, layoffs, product failures and data errors must be communicated quickly and honestly. Spin and silence destroy trust faster than the problem itself.',
        'Structure: what happened, who is affected, what you are doing, what people should do, and when you will update next. Acknowledge impact with genuine empathy.',
      ],
      drills: [
        { title: 'Client delay', brief: 'Tell a client their project will be delayed by three weeks: cause, impact, plan, what you need from them and the next update.', targetSeconds: 90 },
        { title: 'Service outage', brief: 'Deliver a sixty-second statement to users about a service outage with facts, empathy, action and timing.', targetSeconds: 60 },
      ],
      game: { name: 'Crisis Briefing', emoji: '🚨', how: ['Teams receive a crisis scenario with incomplete facts.', 'They prepare a sixty-second statement in five minutes.', 'A "press" panel asks tough follow-up questions.'] },
      realWorld: 'Project delays, product incidents and difficult organisational announcements.',
      mentorWatchFor: ['Blame or excessive technical detail.', 'Promises that cannot be kept.'],
      selfCheck: ['Did I include facts, empathy, plan and timing?', 'Did I avoid spin?'],
      writePrompt: 'Write a bad-news message for a realistic situation using what happened, impact, action, guidance and next update.',
    },
  ],
};

/* UG, PG & professionals · Module 8 — Thought Leadership (five lessons; slot 48 is the showcase) */
export const ADULT_M8: CourseModule = {
  title: 'Thought Leadership',
  outcome: 'Give conference talks, defend research, speak on camera and podcasts, perform on or moderate panels and deliver a signature professional talk.',
  world: { name: 'Keynote Stage', emoji: '🌟', color: '#2563EB', tagline: 'Be the voice people quote.' },
  lessons: [
    {
      title: 'Conference and seminar talks',
      oneLine: 'A conference talk earns attention by offering one clear insight the audience can use.',
      idea: [
        'Conference audiences sit through many talks. The memorable ones state a clear insight early, support it with evidence or cases and end with practical implications.',
        'Respect the time slot, tailor to the conference audience and prepare for questions from experts in your field.',
      ],
      drills: [
        { title: 'The insight in one minute', brief: 'Open a conference talk: hook, your core insight and why it matters to this audience.', targetSeconds: 60 },
        { title: 'Case and implication', brief: 'Present one case or finding that supports your insight and the practical implication.', targetSeconds: 120 },
      ],
      game: { name: 'Lightning Talks', emoji: '⚡', how: ['Participants give five-minute talks with strict timing.', 'The audience writes the insight they remember.', 'Compare recalled insights with intended ones.'] },
      realWorld: 'Industry conferences, academic seminars and meetups.',
      mentorWatchFor: ['Insights buried late.', 'Running over time.'],
      selfCheck: ['Did the audience remember my insight?', 'Did I finish on time?'],
      writePrompt: 'Write a conference talk abstract and outline with your insight, evidence and implications.',
    },
    {
      title: 'Thesis defence and research presentations',
      oneLine: 'In a defence, demonstrate command of your work, own its limits and never bluff.',
      idea: [
        'Thesis defences, dissertation vivas and research committee reviews probe until they find the edge of your knowledge — that is the purpose, not a sign of failure.',
        'Present contribution, method, findings and limitations clearly. Defend choices with trade-offs. When you do not know, say what you know, what would answer the question and whether it affects your conclusions.',
      ],
      drills: [
        { title: 'Contribution and limitation', brief: 'Explain the core contribution of your thesis or major project, then state its most important limitation.', targetSeconds: 90 },
        { title: 'Defend a method', brief: 'Justify one methodological decision, including the alternative you rejected and why.', targetSeconds: 75 },
      ],
      extraDrills: [
        { title: '"I do not know" well', brief: 'Answer a committee question outside your data: what you know, what would answer it and whether it affects your conclusion.', targetSeconds: 45 },
      ],
      game: { name: 'Committee Room', emoji: '🎓', how: ['A participant presents research in three minutes.', 'Three committee members probe method, findings and limits.', 'Scores for command, honesty and composure.'] },
      realWorld: 'Master’s and PhD defences, research reviews and grant panels.',
      mentorWatchFor: ['Defensiveness under critique.', 'Bluffing on adjacent literature.'],
      selfCheck: ['Did I name limitations before being asked?', 'Did I stay precise about what I did not know?'],
      writePrompt: 'Write the three hardest committee questions about your work and a precise, non-defensive answer to each.',
    },
    {
      title: 'Camera, podcasts, LinkedIn video and webinars',
      oneLine: 'On camera and audio, energy, framing and a single clear idea determine whether people keep watching.',
      idea: [
        'Short professional videos, podcast guest spots and webinars build visibility. Hook in the first few seconds, deliver one idea and end with a clear takeaway or call to action.',
        'Technical basics matter: eye-level camera, lens contact, front lighting, clean audio and slightly more energy than in person.',
      ],
      drills: [
        { title: 'Sixty-second LinkedIn video', brief: 'Record a sixty-second video sharing one professional insight with a hook and takeaway.', targetSeconds: 60 },
        { title: 'Podcast guest answer', brief: 'Answer a podcast host’s question "What is the biggest misconception about your field?" conversationally and concisely.', targetSeconds: 90 },
      ],
      game: { name: 'Scroll Test', emoji: '📱', how: ['Participants play the first five seconds of their videos.', 'The group votes: would you keep watching?', 'Rework hooks that lose the vote.'] },
      realWorld: 'LinkedIn content, webinars, podcasts and recorded training.',
      mentorWatchFor: ['Slow openings.', 'Looking at the screen instead of the lens.'],
      selfCheck: ['Did I hook within five seconds?', 'Was there one clear takeaway?'],
      writePrompt: 'Write scripts for three sixty-second professional videos, each with a hook, one insight and a takeaway.',
    },
    {
      title: 'Panels: speaking on one and moderating one',
      oneLine: 'Panellists stand out with concise, distinct views; moderators succeed by balancing voices and sharpening the conversation.',
      idea: [
        'As a panellist: keep answers under ninety seconds, bring a distinct perspective, build on or respectfully challenge others and use concrete examples.',
        'As a moderator: introduce panellists briefly, ask sharp questions, prevent monologues, balance airtime, bring in audience questions and close with key takeaways.',
      ],
      drills: [
        { title: 'Panellist answer', brief: 'As a panellist on "The future of work", give a distinct, example-based answer in under ninety seconds and build on another panellist’s point.', targetSeconds: 90 },
        { title: 'Moderator open and close', brief: 'Open a panel with introductions and the framing question, then close with three takeaways.', targetSeconds: 120 },
      ],
      game: { name: 'Live Panel', emoji: '🎙️', how: ['Four panellists and one moderator run a ten-minute panel.', 'The moderator must manage a planned monologue.', 'The audience scores balance, sharpness and insight.'] },
      realWorld: 'Industry events, alumni panels and conferences.',
      mentorWatchFor: ['Panellists repeating each other.', 'Moderators who lose control of time.'],
      selfCheck: ['Was my perspective distinct?', 'As moderator, did I balance voices?'],
      writePrompt: 'Write a moderator’s plan for a panel: introductions, five questions, a monologue interruption line and closing takeaways.',
    },
    {
      title: 'Your signature professional talk',
      oneLine: 'Your signature talk combines everything: one insight, credible evidence, a story, persuasive structure and composed delivery.',
      idea: [
        'A signature talk is the talk you want to be known for — at a conference, a leadership offsite, a guest lecture or a keynote. It expresses your professional point of view.',
        'Build it around a governing thought, a story with a turn, evidence, the strongest objection answered and a specific call to action.',
      ],
      drills: [
        { title: 'Full rehearsal', brief: 'Deliver your signature professional talk under full performance conditions.', targetSeconds: 240 },
        { title: 'The closing minute', brief: 'Deliver your closing minute with a clear call to action and conviction.', targetSeconds: 60 },
      ],
      game: { name: 'Dress Rehearsal', emoji: '🎭', how: ['Full performance, standing, to camera.', 'The lab records every measure.', 'The group gives one glow each — this is the one to be proud of.'] },
      realWorld: 'Keynotes, guest lectures, leadership offsites and industry conferences.',
      mentorWatchFor: ['Too many ideas.', 'Endings without a call to action.'],
      selfCheck: ['Is my governing thought clear?', 'Did my ending ask the audience to do something?'],
      writePrompt: 'Write the full outline of your signature talk with governing thought, story, evidence, objection and call to action.',
    },
  ],
};
