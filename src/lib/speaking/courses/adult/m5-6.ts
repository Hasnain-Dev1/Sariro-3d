import type { CourseModule } from '../types';

/* UG, PG & professionals · Module 5 — Meetings and Collaboration */
export const ADULT_M5: CourseModule = {
  title: 'Meetings and Collaboration',
  outcome: 'Run useful meetings, contribute and brainstorm, give stakeholder updates, disagree productively, lead hybrid calls and give feedback.',
  world: { name: 'The Meeting Room', emoji: '📋', color: '#16A34A', tagline: 'Make every meeting worth attending.' },
  lessons: [
    {
      title: 'Running a meeting people value',
      oneLine: 'A good meeting has a purpose, an agenda, a facilitator who keeps time and a clear list of decisions and owners.',
      idea: [
        'Most meetings fail because nobody states the purpose, discussions drift and people leave unsure what was decided.',
        'Open with purpose and desired outcome, keep to the agenda, bring in quiet voices, park tangents and close by confirming decisions, owners and deadlines.',
      ],
      drills: [
        { title: 'Open the meeting', brief: 'Open a thirty-minute project meeting: purpose, agenda, desired outcome and time check.', targetSeconds: 45 },
        { title: 'Close the meeting', brief: 'Close the meeting by summarising decisions, owners, deadlines and parked items.', targetSeconds: 60 },
      ],
      game: { name: 'Facilitator’s Chair', emoji: '🪑', how: ['Run a simulated ten-minute meeting.', 'The facilitator faces planned disruptions: a tangent, a dominant voice, silence.', 'The group scores how well the facilitator kept purpose and inclusion.'] },
      realWorld: 'Team meetings, student society meetings and client check-ins.',
      mentorWatchFor: ['Meetings with no stated outcome.', 'Closing without owners.'],
      selfCheck: ['Did I state purpose and outcome?', 'Did everyone leave knowing next steps?'],
      writePrompt: 'Write the opening and closing script for a meeting you will run this month.',
    },
    {
      title: 'Contributing in discussions and brainstorms',
      oneLine: 'Influence in group settings comes from timing, building on ideas and synthesis — not airtime.',
      idea: [
        'In brainstorms, quantity comes before critique: build on ideas ("Yes, and…"). In decision discussions, add evidence, challenge assumptions and synthesise.',
        'A well-timed synthesis — "It sounds like we agree on X but differ on Y" — is often the most influential contribution in the room.',
      ],
      drills: [
        { title: 'Build, challenge, synthesise', brief: 'Make three contributions to a discussion on hybrid work policy: one building, one challenging, one synthesising.', targetSeconds: 75 },
        { title: 'Yes, and', brief: 'In a brainstorm for improving employee onboarding, build on three imaginary ideas using "Yes, and…".', targetSeconds: 60 },
      ],
      game: { name: 'Talking Stick', emoji: '🪄', how: ['Only the holder may speak.', 'To take it, you must build on or synthesise the previous point.', 'The facilitator scores influence, not volume.'] },
      realWorld: 'Brainstorms, case discussions and cross-functional meetings.',
      mentorWatchFor: ['Critiquing ideas during brainstorming.', 'Repeating points without adding.'],
      selfCheck: ['Did my contributions move things forward?', 'Did I synthesise at the right moment?'],
      writePrompt: 'Write a synthesis statement for a discussion you recently had, capturing agreements and remaining differences.',
    },
    {
      title: 'Status updates and stakeholder reports',
      oneLine: 'A great update answers: are we on track, what has changed, what do you need?',
      idea: [
        'Stakeholders want to know status quickly. Use a traffic-light summary (on track, at risk, off track), key progress, risks or blockers and specific asks.',
        'Do not narrate everything you did. Report outcomes, not activity.',
      ],
      drills: [
        { title: 'Ninety-second update', brief: 'Give a ninety-second stakeholder update: status, progress, risks and asks.', targetSeconds: 90 },
        { title: 'Bad-news update', brief: 'Give an update where the project is off track, stating the cause, impact, recovery plan and what you need.', targetSeconds: 90 },
      ],
      game: { name: 'Traffic Light', emoji: '🚦', how: ['Participants give updates on imaginary projects.', 'Listeners hold up green, amber or red for the status they heard.', 'Mismatch means the status was not clear.'] },
      realWorld: 'Weekly team updates, client reports and leadership reviews.',
      mentorWatchFor: ['Activity lists instead of outcomes.', 'Hiding bad news.'],
      selfCheck: ['Was my status clear in the first sentence?', 'Did I state my asks?'],
      writePrompt: 'Write a stakeholder update for a real or realistic project using status, progress, risks and asks.',
    },
    {
      title: 'Disagreeing productively',
      oneLine: 'Productive disagreement separates ideas from people and aims for a better decision, not winning.',
      idea: [
        'Avoiding disagreement leads to poor decisions; aggressive disagreement damages relationships. Productive disagreement acknowledges the other view, explains your concern with evidence and proposes a way forward.',
        'Phrases: "I see the benefit of that; my concern is…", "What would need to be true for this to work?", "Could we test both approaches?"',
      ],
      drills: [
        { title: 'Disagree with a senior', brief: 'Your manager proposes cutting user testing to meet a deadline. Disagree productively with evidence and an alternative.', targetSeconds: 75 },
        { title: 'Find common ground', brief: 'Two colleagues disagree on strategy. Facilitate by stating shared goals and proposing a way to decide.', targetSeconds: 75 },
      ],
      game: { name: 'Disagree and Commit', emoji: '🤝', how: ['Pairs take opposing positions on a business decision.', 'Each states the other’s view fairly before disagreeing.', 'They agree a decision method and commit.'] },
      realWorld: 'Strategy discussions, peer reviews and decisions with competing priorities.',
      mentorWatchFor: ['Personal or passive-aggressive tone.', 'Disagreement without alternatives.'],
      selfCheck: ['Did I restate the other view fairly?', 'Did I propose a way forward?'],
      writePrompt: 'Write how you would disagree with a decision you think is flawed: acknowledgement, concern, evidence and alternative.',
    },
    {
      title: 'Remote and hybrid meetings',
      oneLine: 'In hybrid meetings, remote participants disappear unless the speaker deliberately includes them.',
      idea: [
        'Video lag, muted microphones and side conversations in the room make remote participants second-class. Speakers and facilitators must compensate.',
        'Look at the lens when addressing remote people, name who you are speaking to, pause for them to unmute, summarise room conversations and use the chat deliberately.',
      ],
      drills: [
        { title: 'Include the remote team', brief: 'Facilitate the start of a hybrid meeting, explicitly including remote participants by name and explaining how they can contribute.', targetSeconds: 60 },
        { title: 'Camera-first update', brief: 'Give a sixty-second update on video, looking at the lens and pausing for remote questions.', targetSeconds: 60 },
      ],
      game: { name: 'Remote Voice', emoji: '💻', how: ['Half the group joins "remotely" (facing away, only speaking when invited).', 'Run a short discussion.', 'Remote participants rate how included they felt.'] },
      realWorld: 'Hybrid teams, global calls and online seminars.',
      mentorWatchFor: ['Room-only conversations.', 'Looking at the screen instead of the lens.'],
      selfCheck: ['Did remote participants contribute?', 'Did I look at the lens?'],
      writePrompt: 'Write hybrid meeting rules you would introduce to make remote participants equal.',
    },
    {
      title: 'Giving feedback and having difficult conversations',
      oneLine: 'Useful feedback is specific, timely and about behaviour and impact — not personality.',
      idea: [
        'Use situation–behaviour–impact: "In yesterday’s client call (situation), you interrupted the client twice (behaviour), and they stopped sharing details (impact)." Then ask for their view and agree next steps.',
        'Difficult conversations — missed deadlines, conflict, underperformance — go better when prepared, private, calm and focused on the future.',
      ],
      drills: [
        { title: 'SBI feedback', brief: 'Give feedback to a teammate who keeps missing deadlines using situation, behaviour, impact, then ask for their view.', targetSeconds: 75 },
        { title: 'Positive feedback', brief: 'Give specific positive feedback to a colleague using situation, behaviour and impact.', targetSeconds: 45 },
      ],
      game: { name: 'Hidden Reason', emoji: '🎭', how: ['Pairs role-play a feedback conversation.', 'The receiver has a hidden reason for the behaviour.', 'Debrief: did the giver ask enough to discover it?'] },
      realWorld: 'Managing teams, peer reviews and project collaboration.',
      mentorWatchFor: ['Personality labels ("You are careless").', 'Delivering without listening.'],
      selfCheck: ['Was my feedback specific and behavioural?', 'Did I ask for their perspective?'],
      writePrompt: 'Write an SBI feedback conversation for a real or realistic situation, including your opening question.',
    },
  ],
};

/* UG, PG & professionals · Module 6 — Presentations That Persuade */
export const ADULT_M6: CourseModule = {
  title: 'Presentations That Persuade',
  outcome: 'Analyse audiences, build a business case, use slides well, tell business stories, handle Q&A and present to senior leadership.',
  world: { name: 'The Boardroom', emoji: '📊', color: '#EA580C', tagline: 'Presentations that get decisions.' },
  lessons: [
    {
      title: 'Audience analysis for business and academic presentations',
      oneLine: 'The same content needs a different presentation for executives, technical experts, clients and examiners.',
      idea: [
        'Before building slides, answer: Who is in the room? What do they already know? What do they care about — cost, risk, growth, rigour? What decision or reaction do you want?',
        'Executives want implications and decisions; technical audiences want method and evidence; clients want outcomes for them; examiners want rigour and understanding.',
      ],
      drills: [
        { title: 'Three audiences', brief: 'Explain the same project to an executive, a technical expert and a client, adapting focus and language.', targetSeconds: 150 },
        { title: 'Audience brief', brief: 'For an upcoming presentation, describe your audience’s knowledge, priorities, concerns and the decision you want.', targetSeconds: 75 },
      ],
      game: { name: 'Three Rooms', emoji: '🚪', how: ['Participants explain one idea to three imaginary audiences.', 'The group notes what changed: focus, depth, vocabulary.', 'Discuss which adaptation mattered most.'] },
      realWorld: 'Client pitches, leadership reviews, conference talks and thesis presentations.',
      mentorWatchFor: ['One-size-fits-all presentations.', 'Adapting jargon but not priorities.'],
      selfCheck: ['What does this audience care about most?', 'What decision do I want?'],
      writePrompt: 'Write an audience analysis for a presentation you will give, and how it changes your structure.',
    },
    {
      title: 'Building the business case',
      oneLine: 'A persuasive business case links a problem to a solution with evidence, costs, benefits, risks and a clear ask.',
      idea: [
        'Decision-makers approve proposals when they see a significant problem, a credible solution, a realistic cost–benefit picture and managed risks.',
        'Structure: problem and its cost, proposed solution, evidence it will work, costs and benefits, risks and mitigations, and the specific decision you need.',
      ],
      drills: [
        { title: 'Two-minute business case', brief: 'Present a business case for a new tool, process or initiative using the full structure.', targetSeconds: 120 },
        { title: 'The risk slide', brief: 'Present the top two risks of your proposal and how you will mitigate them.', targetSeconds: 60 },
      ],
      game: { name: 'Investment Committee', emoji: '💰', how: ['Participants pitch proposals to a committee.', 'Committee members each probe one area: cost, evidence, risk.', 'The committee approves, rejects or requests more information.'] },
      realWorld: 'Budget requests, internal proposals and startup funding pitches.',
      mentorWatchFor: ['Solutions without quantified problems.', 'Ignoring risks.'],
      selfCheck: ['Did I quantify the problem?', 'Was my ask specific?'],
      writePrompt: 'Write a business case outline for an initiative you would propose at work or university.',
    },
    {
      title: 'Slides that support, not replace, you',
      oneLine: 'Slides should carry headlines and visuals — the insight should come from you.',
      idea: [
        'Dense slides turn presentations into reading sessions. Use action titles that state the takeaway ("Onboarding delays cause most churn"), one visual per slide and detailed data in an appendix.',
        'Deliver: set up the slide, reveal, pause, explain the insight and move on.',
      ],
      drills: [
        { title: 'Action titles', brief: 'Present three slides using only action titles and one visual each, explaining the insight for each.', targetSeconds: 120 },
        { title: 'Without slides', brief: 'Present the same content as if the projector failed.', targetSeconds: 90 },
      ],
      game: { name: 'Slide Makeover', emoji: '🎨', how: ['Teams receive a dense corporate slide.', 'They create an action title and one visual.', 'They present before and after.'] },
      realWorld: 'Consulting decks, academic presentations and client proposals.',
      mentorWatchFor: ['Topic titles instead of action titles.', 'Reading slides aloud.'],
      selfCheck: ['Did each slide state a takeaway?', 'Could I present without slides?'],
      writePrompt: 'Rewrite five slide titles from a real presentation as action titles.',
    },
    {
      title: 'Storytelling in business',
      oneLine: 'Stories make strategy and data memorable — a customer, a moment or a turning point brings numbers to life.',
      idea: [
        'Business stories are short and purposeful: a customer’s problem, a team’s breakthrough, a failure that changed strategy. They illustrate a point; they are not entertainment.',
        'Structure: context, challenge, action, outcome and the lesson for this audience — in under ninety seconds.',
      ],
      drills: [
        { title: 'Customer story', brief: 'Tell a ninety-second story about a customer, user or stakeholder that illustrates why your proposal matters.', targetSeconds: 90 },
        { title: 'Failure that changed us', brief: 'Tell a story about a failure in a project and the lesson that changed your approach.', targetSeconds: 90 },
      ],
      game: { name: 'Data vs Story', emoji: '📖', how: ['Two participants present the same insight: one with data only, one with a story plus data.', 'The group recalls both the next day.', 'Discuss what stuck and why.'] },
      realWorld: 'Leadership presentations, investor pitches and all-hands meetings.',
      mentorWatchFor: ['Stories without a point.', 'Stories too long for the setting.'],
      selfCheck: ['Did my story illustrate a clear point?', 'Was it under ninety seconds?'],
      writePrompt: 'Write a business story that makes a key point in a presentation you are preparing.',
    },
    {
      title: 'Q&A with authority',
      oneLine: 'Q&A is where credibility is won or lost — listen fully, answer concisely and stay composed.',
      idea: [
        'Prepare by anticipating the ten hardest questions. In the moment: listen to the whole question, pause, restate if helpful, answer directly in under a minute and check.',
        'For hostile questions, address the substance not the tone. For unknowns, say what you know and commit to follow up.',
      ],
      drills: [
        { title: 'Three hard questions', brief: 'Answer three hard questions about your proposal: cost, evidence and why now.', targetSeconds: 120 },
        { title: 'Hostile question', brief: 'Respond calmly to "Frankly, this seems like a waste of resources."', targetSeconds: 45 },
      ],
      game: { name: 'Q&A Gauntlet', emoji: '⚔️', how: ['A presenter gives a two-minute pitch.', 'The group asks rapid questions for three minutes.', 'Scores for brevity, directness and composure.'] },
      realWorld: 'Leadership reviews, conference Q&A and client pitches.',
      mentorWatchFor: ['Answers that become second presentations.', 'Defensive reactions.'],
      selfCheck: ['Were my answers direct and brief?', 'Did I stay composed?'],
      writePrompt: 'Write the ten hardest questions about a presentation you are preparing and concise answers to each.',
    },
    {
      title: 'Presenting to senior leadership',
      oneLine: 'Leadership presentations are short, decision-focused and often interrupted — be ready to jump to the ask.',
      idea: [
        'Senior leaders may skip your slides, challenge a number early or ask for the bottom line. Prepare a one-minute version, a detailed version and an appendix.',
        'Lead with the decision needed, handle interruptions as conversation, signpost back to your structure and ask for the decision explicitly.',
      ],
      drills: [
        { title: 'Three-minute leadership brief', brief: 'Present a three-minute proposal to leadership, decision first.', targetSeconds: 180 },
        { title: '"Just tell me what you need"', brief: 'Mid-presentation, a senior leader interrupts. Deliver your ask and justification in thirty seconds.', targetSeconds: 30 },
      ],
      game: { name: 'The Interrupting CEO', emoji: '👔', how: ['A participant presents to a "CEO".', 'The CEO interrupts with challenges and "skip to the end".', 'The group scores flexibility and clarity of the ask.'] },
      realWorld: 'Board updates, leadership reviews and funding decisions.',
      mentorWatchFor: ['Insisting on finishing every slide.', 'Losing structure after interruptions.'],
      selfCheck: ['Could I jump to the ask at any time?', 'Did I get a decision?'],
      writePrompt: 'Write the one-minute, three-minute and appendix versions of a leadership proposal.',
    },
  ],
};
