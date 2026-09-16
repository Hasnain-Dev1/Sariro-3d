import { bd, type BandLesson } from '../types';

/** UG, PG & professionals · Worlds 5 and 6 — influence, evidence, and stories at work. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('adult', n, part, x);

export const ADULT_WORLD_5: BandLesson[] = [
  {
    number: 25,
    oneLine: 'A persuasive case names the decision — if you cannot state the ask, you are only informing.',
    idea: [
      'Stakeholders sit through many "informative" presentations that end without a decision, which then requires another meeting. Persuasion is defined by the action: approve, fund, hire, adopt, change.',
      'Define the ask precisely before building the case: who decides, what exactly they approve, by when, and what happens if they do not. Structure every point to reduce the decision-maker\'s risk in saying yes.',
    ],
    model: {
      text: 'I am asking for approval to run a six-week pilot with two teams, costing four lakh rupees, with a go or no-go review on the first of March.',
      noticing: ['Scope, cost and timeline are explicit.', 'A built-in review lowers the risk of saying yes.'],
    },
    drills: [
      d(25, 'a', { title: 'The ask, in one sentence', brief: 'State a real or realistic ask from your work or studies: decision, owner, scope and deadline, in one sentence.', targetSeconds: 20 }),
      d(25, 'b', { title: 'Ninety seconds towards the ask', brief: 'Build a ninety-second case where each point reduces the decision-maker\'s risk, ending on the ask.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(25, 'c', { title: 'The cost of no', brief: 'Make your case by describing concretely what happens if the decision is not made, then state the ask.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Asks buried after long context.', 'Vague asks ("support for the initiative").', 'Ignoring the decision-maker\'s risks.'],
    selfCheck: ['Could the decision-maker say yes or no to my exact sentence?', 'What risk did I remove for them?'],
    realWorld: 'Budget requests, project proposals and pitches for funding or buy-in.',
    writePrompt: 'Write your ask with owner, scope, cost and deadline, then list the three risks a decision-maker would worry about and how you address each.',
  },
  {
    number: 26,
    oneLine: 'Credibility, relevance and evidence — most professionals over-rely on the last one.',
    idea: [
      'Ethos is why they should trust you: relevant experience, track record, honesty about limitations. Pathos, at work, is why it matters to them: impact on customers, teams, goals or careers. Logos is whether the reasoning and data hold.',
      'Analytical professionals often present pure logos and wonder why a sound proposal fails. Decisions are made by people with priorities and fears; connect the data to what the decision-maker actually values.',
    ],
    model: {
      text: 'I ran our last two vendor migrations, and the second one cost a third less because of one change. Our support team is already working weekends to keep up. The data shows this vendor would cut ticket volume by a quarter.',
      noticing: ['Ethos: direct, relevant experience.', 'Pathos: the team\'s weekends.', 'Logos: a measurable outcome.'],
    },
    drills: [
      d(26, 'a', { title: 'One sentence each', brief: 'For a real proposal, deliver one ethos, one pathos and one logos sentence tailored to a specific stakeholder.', targetSeconds: 30 }),
      d(26, 'b', { title: 'Two minutes on your weakest', brief: 'Identify your weakest appeal and deliver a two-minute case that strengthens it while keeping the other two.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(26, 'c', { title: 'Stakeholder translation', brief: 'Present the same proposal twice in sixty seconds each: once to a finance lead, once to a team lead, adjusting the appeals.', targetSeconds: 120 }),
    ],
    mentorWatchFor: ['Data without stakes.', 'Emotional appeals that feel manipulative in a professional setting.', 'Credentials unrelated to the proposal.'],
    selfCheck: ['What does this decision-maker actually value?', 'Which appeal did I underuse?'],
    realWorld: 'Cross-functional proposals, investor conversations and academic funding bids.',
    writePrompt: 'Write the same proposal framed for two different stakeholders, noting how the ethos, pathos and logos shift.',
  },
  {
    number: 27,
    oneLine: 'One figure a listener can hold, with a comparison, beats a slide of numbers.',
    idea: [
      'Dashboards train people to present many metrics. Spoken, most of them evaporate. Select the single number that carries the argument and anchor it: against a target, a baseline, a competitor or a unit the audience understands.',
      'State precision appropriate to the decision ("roughly a third" rather than "thirty-two point seven percent" unless the decimal matters). Know the source and method — a senior who catches one unsupported number will discount everything else.',
    ],
    model: {
      text: 'Our churn rose to eight percent. That means for every twelve customers we sign, we lose one within a year — and acquiring each of them costs us more than their first year\'s revenue.',
      noticing: ['The number is made concrete.', 'It is anchored to a cost the audience already watches.'],
    },
    drills: [
      d(27, 'a', { title: 'One number, two ways', brief: 'State a real metric from your work or studies plainly, then again with a comparison that makes its significance obvious.', targetSeconds: 30 }),
      d(27, 'b', { title: 'A case built on one figure', brief: 'Build a ninety-second recommendation around a single well-anchored figure, including one sentence on its source.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(27, 'c', { title: 'Dashboard to story', brief: 'Take a dashboard-style list of five metrics and present only the one that matters for a decision, explaining why the others do not.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['False precision.', 'Metrics without baselines.', 'Figures whose source the presenter cannot explain.'],
    selfCheck: ['What did I compare my number to?', 'Could I defend its source under questioning?'],
    realWorld: 'Business reviews, research findings and data-driven recommendations.',
    writePrompt: 'Write one key metric, its source and method in one line, and a comparison that makes it meaningful to a decision-maker.',
  },
  {
    number: 28,
    oneLine: 'Pre-empt the strongest objection — it is the move that most builds trust with sceptics.',
    idea: [
      'Experienced stakeholders are listening for the flaw. If you do not address it, they raise it — often after you have gone, in a meeting you are not in.',
      'Steel-man the strongest objection early, in terms its holder would accept. Then answer it, or concede its validity and show why your recommendation still stands or how you mitigate the risk. Candour about downsides increases trust in your upside.',
    ],
    model: {
      text: 'The strongest objection is timing: we are mid-quarter, and any change risks the targets. That is fair. That is why the pilot touches only two teams and does not change any customer-facing process until review.',
      noticing: ['States the objection in the objector\'s terms.', 'Concedes, then shows the mitigation.'],
    },
    drills: [
      d(28, 'a', { title: 'The strongest objection', brief: 'State the most serious objection a sceptical senior would raise to your proposal, as fairly as they would.', targetSeconds: 60 }),
      d(28, 'b', { title: 'Concede something real', brief: 'Deliver a ninety-second case that concedes a genuine downside and explains the mitigation.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(28, 'c', { title: 'Pre-meeting objection map', brief: 'Name each stakeholder in a real decision and the objection each is most likely to hold.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Minimising downsides.', 'Objections phrased dismissively.', 'Mitigations that are vague commitments.'],
    selfCheck: ['Would the sceptic agree I stated their concern fairly?', 'Is my mitigation specific?'],
    realWorld: 'Steering committees, change proposals and negotiations.',
    writePrompt: 'Write an objection map for a real decision: stakeholder, likely objection, and your concession or mitigation.',
  },
  {
    number: 29,
    oneLine: 'Classical rhetorical devices still work in boardrooms — in small doses.',
    idea: [
      'Tricolon ("faster, cheaper, safer"), antithesis ("we do not have a sales problem; we have a retention problem"), anaphora and the rhetorical question all make a key message memorable and quotable.',
      'Professional audiences are allergic to theatrics. Use one device for your governing thought or close, not throughout. The best test: would someone repeat this line in the meeting after yours?',
    ],
    model: {
      text: 'We do not have a hiring problem. We have a keeping problem. We keep hiring people we then lose within a year.',
      noticing: ['Antithesis reframes the problem.', 'Repetition of "keep" makes it stick.'],
    },
    drills: [
      d(29, 'a', { title: 'A rule of three, out loud', brief: 'Craft and deliver a closing line for a real proposal that uses a tricolon, with context around it.', targetSeconds: 45 }),
      d(29, 'b', { title: 'The contrast pair', brief: 'Read these lines aloud, landing each contrast, then create an antithesis that reframes a problem in your field.', passage: 'We do not have a sales problem; we have a retention problem. The question is not whether we can afford to invest, but whether we can afford not to. Culture is not what we say; it is what we tolerate.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(29, 'c', { title: 'Quotable line', brief: 'Write and deliver one sentence summarising your recommendation that a colleague could repeat verbatim in another meeting.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Clichéd corporate slogans.', 'Devices that overclaim.', 'Performative delivery that undermines credibility.'],
    selfCheck: ['Would a colleague repeat my line?', 'Did I use a device once, where it counted?'],
    realWorld: 'Framing strategy, closing pitches and summarising recommendations.',
    writePrompt: 'Write three candidate "quotable lines" for a real recommendation using different devices, and choose one.',
  },
  {
    number: 30,
    oneLine: 'These techniques persuade regardless of truth — which is exactly why professional ethics matter.',
    idea: [
      'Selective data, confident framing and compelling narratives have sold failed products, justified bad strategies and misled investors. Persuasive skill amplifies whatever it is applied to, including your own blind spots.',
      'Ethical persuasion discloses material risks and uncertainty, represents alternatives fairly, avoids conflicts of interest or declares them, and respects the decision-maker\'s autonomy. Long careers are built on being the person whose recommendations hold up.',
    ],
    drills: [
      d(30, 'a', { title: 'The case you actually believe', brief: 'Deliver a two-minute recommendation you genuinely hold, explicitly stating the key uncertainty and how confident you are.', targetSeconds: 120 }),
      d(30, 'b', { title: 'Show your working', brief: 'Explain how you reached a professional or academic conclusion, including evidence that pointed the other way.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(30, 'c', { title: 'Disclosure practice', brief: 'Present a proposal that you have a personal interest in, disclosing that interest clearly and appropriately at the start.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Overstated confidence.', 'Omitted material risks.', 'Treating stakeholders as obstacles to be managed.'],
    selfCheck: ['Did I state my uncertainty honestly?', 'Would I be comfortable if the audience saw how I built the case?'],
    realWorld: 'Investment recommendations, research claims and strategic advice.',
    writePrompt: 'Write about a time you saw persuasion used misleadingly at work or in academia, and what an ethical version would have looked like.',
  },
];

export const ADULT_WORLD_6: BandLesson[] = [
  {
    number: 31,
    oneLine: 'Data informs decisions; stories are what people remember and repeat.',
    idea: [
      'A stakeholder might forget your churn statistic by Friday, but they will remember the customer who called three times and then left. Stories create memory and meaning; data provides proof. Effective professionals pair them.',
      'Case studies, user stories, a single patient in a clinical study, one field visit: any of these can carry the weight of a dataset into a room where decisions get made.',
    ],
    drills: [
      d(31, 'a', { title: 'Three facts, flat', brief: 'Present three findings from your work or research as a flat list of facts.', targetSeconds: 60 }),
      d(31, 'b', { title: 'One of them, as a story', brief: 'Present one finding through a specific person, customer or case, then state the data it represents.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(31, 'c', { title: 'Story plus proof', brief: 'Open a recommendation with a thirty-second case, then give the data showing the case is typical, not an exception.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Anecdotes presented as proof.', 'Stories without a link to the decision.', 'Confidential details shared carelessly.'],
    selfCheck: ['Which person or case carried my finding?', 'Did I show the story was representative?'],
    realWorld: 'Research presentations, product reviews and business cases.',
    writePrompt: 'Write a finding as data, then as a short case story, and one sentence connecting the two.',
  },
  {
    number: 32,
    oneLine: 'Your work is full of stories — they live in the moments an assumption, a plan or a direction changed.',
    idea: [
      'Professionals often believe their work has no stories. But every project, experiment and career has turning points: the assumption that turned out wrong, the customer conversation that reframed a product, the failed experiment that revealed the real variable.',
      'Look for the before, the moment of change, and the after. Those moments are also the raw material for interview answers and conference talks.',
    ],
    drills: [
      d(32, 'a', { title: 'The moment it changed', brief: 'Tell a sixty-second story about a moment in your work or studies when your understanding of a problem changed.', targetSeconds: 60 }),
      d(32, 'b', { title: 'The most boring subject you have', brief: 'Take the most routine part of your work or research and find a turning point in it. Tell it in ninety seconds.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(32, 'c', { title: 'Career turning point', brief: 'Tell the story of the decision that most shaped your academic or professional path, focusing on the moment of choice.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Chronological project summaries without a turn.', 'Turning points that are external luck rather than insight or decision.', 'Over-polished stories that sound rehearsed.'],
    selfCheck: ['What was different after the moment?', 'Would this work as an interview example?'],
    realWorld: 'Behavioural interview answers, conference talks and team retrospectives.',
    writePrompt: 'Write three turning-point moments from your work or studies that you could use as stories.',
  },
  {
    number: 33,
    oneLine: 'Situation, turn, resolution — and the turn is where the value is.',
    idea: [
      'Behavioural interviews use STAR (situation, task, action, result); conference talks and pitches use setup, conflict, resolution. The shared failure is spending too long on context and too little on the decision or insight.',
      'Keep setup to two or three sentences. Spend most of your time on the turn — the problem, the decision and your specific action. End with a measurable result and what it taught you.',
    ],
    model: {
      text: 'Our app\'s sign-up rate was stuck at twelve percent. I noticed half the drop-offs happened on one screen asking for company size. We removed the field. Sign-ups rose to nineteen percent in a month, and we learned to question every field we asked for.',
      noticing: ['One sentence of situation.', 'A specific insight and action.', 'A measured result and lesson.'],
    },
    drills: [
      d(33, 'a', { title: 'Setup, turn, resolution', brief: 'Tell a work or academic story in three sentences: situation, your action at the turn, and the result.', targetSeconds: 30 }),
      d(33, 'b', { title: 'The full version', brief: 'Expand it into a ninety-second STAR interview answer, spending most of the time on your action.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(33, 'c', { title: 'Context diet', brief: 'Tell a story with a long context section, then retell it with context cut to two sentences. Compare.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['"We" hiding what the speaker personally did.', 'Results without numbers or learning.', 'Context taking over half the answer.'],
    selfCheck: ['What did I personally do at the turn?', 'Was my result measurable?'],
    realWorld: 'Behavioural interviews, performance reviews and case study presentations.',
    writePrompt: 'Write a STAR answer for a real achievement with situation in two sentences and the action as the longest section.',
  },
  {
    number: 34,
    oneLine: 'One precise detail creates credibility; a paragraph of detail creates fatigue.',
    idea: [
      'Specificity signals truth. "We improved efficiency" is generic; "we cut invoice processing from four days to six hours" is credible. The same applies to narrative: one concrete detail puts listeners in the room.',
      'Choose details that are specific, verifiable and relevant to the turn or the result. Anything else — the history of the team, every stakeholder\'s name, the full tool stack — belongs in a follow-up, not the story.',
    ],
    drills: [
      d(34, 'a', { title: 'One detail per beat', brief: 'Tell a ninety-second professional story with one specific, concrete detail in each of situation, action and result.', targetSeconds: 90 }),
      d(34, 'b', { title: 'Too much detail, on purpose', brief: 'Tell the same story overloaded with background detail, then identify exactly where a listener would disengage.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(34, 'c', { title: 'Generic to specific', brief: 'Convert these generic claims into specific ones from your experience: "improved communication", "handled a difficult client", "led the project".', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Buzzwords in place of specifics.', 'Numbers that cannot be substantiated.', 'Detail about tools rather than outcomes.'],
    selfCheck: ['Which detail made my story most credible?', 'What did I include that belongs in a follow-up?'],
    realWorld: 'CV-based interviews, client case studies and project retrospectives.',
    writePrompt: 'Rewrite three generic achievement statements from your CV or work as specific, verifiable ones.',
  },
  {
    number: 35,
    oneLine: 'Professional humour is safest when you are the target and riskiest when a colleague is.',
    idea: [
      'Well-judged humour builds rapport, eases tension in difficult meetings and makes talks memorable. Badly judged humour — about colleagues, clients, cultures, gender or seniority — can damage relationships and reputations permanently.',
      'Use self-deprecating stories about low-stakes mistakes, or observations about shared experiences (endless reply-all threads, the meeting that could have been an email). Never undercut your own competence on the thing you are asking them to trust you with.',
    ],
    drills: [
      d(35, 'a', { title: 'The time you were the fool', brief: 'Tell a sixty-second, low-stakes story about a professional or academic mistake you made, with a light tone and a real lesson.', targetSeconds: 60 }),
      d(35, 'b', { title: 'The line, then the pause', brief: 'Deliver an observational line about shared work or college life, pause after it, then transition to a serious point.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(35, 'c', { title: 'Tension breaker', brief: 'Open a difficult update with one appropriate light line, then move directly and respectfully into the bad news.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Humour that targets people present or absent.', 'Self-deprecation that undermines core competence.', 'Humour used to avoid delivering bad news clearly.'],
    selfCheck: ['Who was the target?', 'Did the humour support or undercut my credibility?'],
    realWorld: 'Team meetings, conference talks and difficult updates.',
    writePrompt: 'Write a light, self-directed opening line for a presentation and check it against the rules in this lesson.',
  },
  {
    number: 36,
    oneLine: 'Personal stories build trust at work when you have enough distance to tell them well.',
    idea: [
      'Leaders who share relevant personal experience — a failure, a career pivot, a hard lesson — are rated as more trustworthy. But oversharing in professional settings, or sharing an experience that is still raw, can make colleagues uncomfortable and cost you composure.',
      'Choose stories you can tell steadily, that connect to the professional point, and that do not require the audience to take care of you. You decide the boundary; you owe no one private details.',
    ],
    drills: [
      d(36, 'a', { title: 'Something that went wrong', brief: 'Tell a ninety-second story about a professional or academic failure and what you now do differently because of it.', targetSeconds: 90 }),
      d(36, 'b', { title: 'The same story, no sympathy asked', brief: 'Retell it focused entirely on decisions, lessons and changes in practice, asking for no sympathy.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(36, 'c', { title: 'Leadership story', brief: 'Tell a short story that shows how you handle responsibility, suitable for a leadership interview or a new team introduction.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Stories still emotionally raw.', 'Failures framed as secret successes.', 'Personal detail beyond what the point requires.'],
    selfCheck: ['Could I tell this steadily to a senior stranger?', 'What professional point did it serve?'],
    realWorld: 'Leadership interviews, onboarding a new team and mentoring conversations.',
    writePrompt: 'Write a failure story focused on decisions and changed practice, suitable for an interview.',
  },
];
