import type { CourseModule } from '../types';

/* Grades 7–9 · Module 5 — Debate Arena */
export const MIDDLE_M5: CourseModule = {
  title: 'Debate Arena',
  outcome: 'Build arguments with evidence, rebut respectfully, spot weak reasoning, think fast and argue either side.',
  world: { name: 'Debate Arena', emoji: '🏟️', color: '#DC2626', tagline: 'Argue well, not loud.' },
  lessons: [
    {
      title: 'How a debate works',
      oneLine: 'A debate is a structured contest of arguments — you win by reasoning, not by shouting.',
      idea: [
        'A school debate has a motion ("This house would ban homework"), a proposition side that supports it and an opposition side that argues against. Speakers take turns with strict time limits.',
        'Judges score content (arguments and evidence), style (delivery) and strategy (structure and rebuttal). Being loud or rude loses marks.',
      ],
      drills: [
        { title: 'Explain the motion', brief: 'Explain what the motion "This house would make sport compulsory" means, and what each side must prove.', targetSeconds: 60 },
        { title: 'First speaker opening', brief: 'Give a sixty-second opening as the first proposition speaker: define the motion, state your side and preview two arguments.', targetSeconds: 60 },
      ],
      game: { name: 'Mini Parliament', emoji: '🏛️', how: ['Split the class into two sides on a fun motion.', 'Openers, one rebuttal each, closers — one minute each.', 'The class votes on who argued better, not who they agree with.'] },
      realWorld: 'Inter-school debates and class debate lessons.',
      mentorWatchFor: ['Confusing personal opinion with the assigned side.', 'Ignoring time limits.'],
      selfCheck: ['Could I explain what each side must prove?', 'Did I stay within time?'],
      writePrompt: 'Write the definition and preview of two arguments for the motion "This house would ban homework".',
    },
    {
      title: 'Building an argument: claim, reason, evidence',
      oneLine: 'An argument is a claim with a reason and evidence — without evidence, it is just an opinion.',
      idea: [
        'Claim: what you believe. Reason: why it is true. Evidence: facts, examples, expert views or data that prove the reason.',
        'Then explain the impact: why does this matter? Judges reward arguments that link claim, reason, evidence and impact clearly.',
      ],
      drills: [
        { title: 'One strong argument', brief: 'Build one full argument for "Schools should have a four-day week": claim, reason, evidence and impact.', targetSeconds: 60 },
        { title: 'Two arguments, one speech', brief: 'Give a ninety-second speech with two complete arguments against "Mobile phones should be banned in schools".', targetSeconds: 90 },
      ],
      game: { name: 'Argument Builder', emoji: '🧱', how: ['Teams get cards: claims, reasons and evidence, all mixed up.', 'They build the strongest argument from the pieces.', 'Each team presents; the class spots missing links.'] },
      realWorld: 'Debates, persuasive essays and convincing your parents.',
      mentorWatchFor: ['Evidence that does not support the reason.', 'Missing impact.'],
      selfCheck: ['Did my argument have all four parts?', 'Was my evidence relevant?'],
      writePrompt: 'Write two complete arguments (claim, reason, evidence, impact) for a motion of your choice.',
    },
    {
      title: 'Rebuttal without being rude',
      oneLine: 'Rebuttal attacks the argument, never the person — and the best rebuttals explain why the other side’s point fails.',
      idea: [
        'A rebuttal has four steps: say what they argued, explain the flaw, give your counter-evidence, and say why your side still wins.',
        'Language matters: "My opponent claims… but this ignores…" sounds sharp and respectful. "That’s a stupid point" loses the room and the judges.',
      ],
      drills: [
        { title: 'Four-step rebuttal', brief: 'Rebut the argument "Homework teaches responsibility" using the four steps.', targetSeconds: 60 },
        { title: 'Rebut and rebuild', brief: 'Rebut "Uniforms reduce bullying", then return to one of your own arguments.', targetSeconds: 75 },
      ],
      game: { name: 'Yes, But…', emoji: '🥊', how: ['A student makes a thirty-second case.', 'A partner fires three objections, one at a time.', 'Answer each in one sentence starting "That is fair, and…"'] },
      realWorld: 'Disagreeing in a class debate or a group decision without starting a fight.',
      mentorWatchFor: ['Personal attacks.', 'Rebuttals that only say "that’s wrong".'],
      selfCheck: ['Did I explain WHY their point fails?', 'Was I respectful?'],
      writePrompt: 'Write a four-step rebuttal to the argument "Video games are a waste of time".',
    },
    {
      title: 'Spotting weak arguments',
      oneLine: 'Many persuasive-sounding arguments are logically broken — spotting the flaw is a superpower.',
      idea: [
        'Common fallacies: attacking the person instead of the point; "everyone does it"; slippery slope ("if we allow this, soon…"); false choice ("either we ban phones or grades collapse"); and one example treated as proof.',
        'Name the flaw calmly: "That is a slippery slope — there is no evidence one step leads to the other."',
      ],
      drills: [
        { title: 'Name the fallacy', brief: 'Read these claims and name the flaw in each out loud.', passage: 'Everyone in my class has a smartphone, so it must be fine. If we let students choose their seats, soon they will choose their teachers. You cannot trust his point about exercise, he is terrible at football.', targetSeconds: 45 },
        { title: 'Expose and correct', brief: 'Take one of the flawed claims and explain calmly why it fails and what a fair argument would sound like.', targetSeconds: 60 },
      ],
      game: { name: 'Fallacy Hunters', emoji: '🔍', how: ['The mentor reads short claims, some fair, some flawed.', 'Teams slap a card with the fallacy name when they spot one.', 'Teams must explain the flaw to win the point.'] },
      realWorld: 'Seeing through arguments in adverts, online comments and debates.',
      mentorWatchFor: ['Labelling fair arguments as fallacies.', 'Naming the fallacy without explaining it.'],
      selfCheck: ['Could I explain the flaw in plain words?', 'Did I suggest a fairer version?'],
      writePrompt: 'Find a weak argument from an advert or online post and explain what is wrong with it.',
    },
    {
      title: 'Thinking fast: points of information',
      oneLine: 'Handling a challenge mid-speech calmly shows you truly understand your case.',
      idea: [
        'In many debate formats, opponents can offer a "point of information" — a short challenge while you speak. You can accept or politely decline.',
        'When you accept: listen, answer in one or two sentences, and return to your speech: "Coming back to my argument…"',
      ],
      drills: [
        { title: 'Accept and answer', brief: 'Give a speech on "School should start at ten". Imagine a challenge: "Won’t that make school end too late?" Answer briefly and return.', targetSeconds: 75 },
        { title: 'Rapid responses', brief: 'Answer three quick challenges in one sentence each: "What about sports practice?", "Isn’t that expensive?", "Who says students will sleep more?"', targetSeconds: 45 },
      ],
      game: { name: 'POI Ping-Pong', emoji: '🏓', how: ['A student speaks for sixty seconds.', 'Opponents stand to offer short challenges.', 'The speaker must accept two and answer in under ten seconds each.'] },
      realWorld: 'Being challenged mid-presentation or in a heated class discussion.',
      mentorWatchFor: ['Losing the thread after a challenge.', 'Answers that turn into new speeches.'],
      selfCheck: ['Were my answers short?', 'Did I return to my speech?'],
      writePrompt: 'Write the three toughest challenges an opponent could raise against your favourite argument, and a one-sentence answer to each.',
    },
    {
      title: 'Arguing the side you disagree with',
      oneLine: 'Arguing the other side makes you smarter, fairer and far harder to beat.',
      idea: [
        'In competitive debate, you often argue a side you do not personally believe. This is not lying — it is understanding.',
        'When you can make the best case for the other side, you can anticipate their arguments and answer them before they are made.',
      ],
      drills: [
        { title: 'Switch sides', brief: 'Pick an opinion you hold strongly. Argue the opposite side as convincingly as you can for sixty seconds.', targetSeconds: 60 },
        { title: 'Both sides, then verdict', brief: 'Argue both sides of "Should the voting age be sixteen?" for forty-five seconds each, then give your verdict.', targetSeconds: 120 },
      ],
      game: { name: 'Side Switch', emoji: '🔄', how: ['Students argue one side for forty-five seconds.', 'The mentor claps — they switch and argue the other side immediately.', 'The class judges which side sounded more convincing.'] },
      realWorld: 'Understanding people who disagree with you, and preparing for a real debate.',
      mentorWatchFor: ['Straw-man versions of the other side.', 'Students refusing to argue a side.'],
      selfCheck: ['Did I make the other side’s best case?', 'What did I learn about my own view?'],
      writePrompt: 'Write the strongest case against something you believe, then write how you would answer it.',
    },
  ],
};

/* Grades 7–9 · Module 6 — Persuasion and Influence */
export const MIDDLE_M6: CourseModule = {
  title: 'Persuasion and Influence',
  outcome: 'Spot manipulation, use credibility, emotion and logic honestly, run a campaign speech and stand up for a cause.',
  world: { name: 'Influence Lab', emoji: '🧲', color: '#DB2777', tagline: 'Change minds, honestly.' },
  lessons: [
    {
      title: 'Persuasion or manipulation? Ads and influencers',
      oneLine: 'Persuasion gives people good reasons; manipulation tricks them — and you see both every day online.',
      idea: [
        'Influencers and adverts use tricks: fake scarcity ("only two left!"), social proof ("everyone is buying it"), hidden sponsorships and emotional pressure.',
        'Honest persuasion uses real reasons, accurate facts and respects the listener’s choice. Learning the tricks protects you and makes you a more trustworthy speaker.',
      ],
      drills: [
        { title: 'Decode an ad', brief: 'Describe an advert or influencer post you have seen and explain which persuasion tricks it used.', targetSeconds: 60 },
        { title: 'Honest version', brief: 'Rewrite that ad as an honest pitch and deliver it.', targetSeconds: 45 },
      ],
      game: { name: 'Honest or Tricky?', emoji: '🕵️', how: ['Show three short adverts or claims.', 'The class decides: persuasion or manipulation — and why.', 'Rewrite the tricky one to be honest and still persuasive.'] },
      realWorld: 'Not being fooled by sponsored posts and "limited time" offers.',
      mentorWatchFor: ['Cynicism that everything is manipulation.', 'Missing hidden sponsorships.'],
      selfCheck: ['Can I name the tricks I saw?', 'Was my honest version still persuasive?'],
      writePrompt: 'Analyse an advert or influencer post: the tricks it uses and how you would make it honest.',
    },
    {
      title: 'Ethos, pathos, logos — for real life',
      oneLine: 'People are persuaded by who you are (ethos), how they feel (pathos) and whether it makes sense (logos).',
      idea: [
        'Ethos: why should they trust you? Experience, honesty, fairness. Pathos: what feeling will move them — hope, concern, pride? Logos: facts, reasons and logic.',
        'The best persuasion blends all three. Too much emotion feels manipulative; too much logic feels cold; no credibility and nobody listens.',
      ],
      drills: [
        { title: 'Three doors', brief: 'Convince your parents to extend your curfew by thirty minutes. Do it once with ethos, once with pathos and once with logos.', targetSeconds: 90 },
        { title: 'Blend them', brief: 'Persuade your school to start a recycling programme using all three in one sixty-second speech.', targetSeconds: 60 },
      ],
      game: { name: 'Three Doors', emoji: '🚪', how: ['Everyone persuades the class about the same thing.', 'Listeners hold up E, P or L cards when they hear each appeal.', 'The best blend wins.'] },
      realWorld: 'Convincing parents, teachers or teammates.',
      mentorWatchFor: ['Pathos that becomes guilt-tripping.', 'Ethos claims that are not true.'],
      selfCheck: ['Did I use all three appeals?', 'Did any feel manipulative?'],
      writePrompt: 'Write a persuasive paragraph using ethos, pathos and logos, and label each one.',
    },
    {
      title: 'The student council campaign speech',
      oneLine: 'Voters choose the candidate who understands their problems and has believable solutions.',
      idea: [
        'A campaign speech has four parts: connect (show you understand students’ problems), credential (why you), commit (two or three specific, realistic promises) and call (ask for their vote).',
        'Avoid impossible promises ("no more exams"). Voters trust specifics: "a suggestion box reviewed every Friday".',
      ],
      drills: [
        { title: 'Campaign speech', brief: 'Give a ninety-second student council speech: connect, credential, two realistic commitments and a call for votes.', targetSeconds: 90 },
        { title: 'Answer the voters', brief: 'Answer a tough voter question: "Last year’s council promised things and did nothing. Why are you different?"', targetSeconds: 45 },
      ],
      game: { name: 'Election Day', emoji: '🗳️', how: ['Three candidates give ninety-second speeches.', 'The class asks each one a tough question.', 'Secret ballot — then discuss which promises were believable.'] },
      realWorld: 'Running for student council, house captain or club leader.',
      mentorWatchFor: ['Promises outside a student’s power.', 'Speeches only about the candidate.'],
      selfCheck: ['Were my promises specific and realistic?', 'Did I ask for the vote?'],
      writePrompt: 'Write a student council campaign speech using connect, credential, commit and call.',
    },
    {
      title: 'Stories that persuade',
      oneLine: 'Facts inform, but stories move people to care and act.',
      idea: [
        'Charities rarely lead with statistics; they tell the story of one person. A single, specific story makes an abstract problem real.',
        'Structure: the person and the situation, the problem or turning point, what changed, and what it means for your argument.',
      ],
      drills: [
        { title: 'One person’s story', brief: 'Persuade the class to care about an issue — bullying, food waste or animal welfare — by telling one person’s or animal’s story.', targetSeconds: 90 },
        { title: 'Story then ask', brief: 'Tell a thirty-second story, then connect it to a clear ask in thirty seconds.', targetSeconds: 60 },
      ],
      game: { name: 'Fact vs Story', emoji: '📖', how: ['Two students persuade on the same issue: one uses only facts, one tells a story.', 'The class votes which moved them more.', 'Discuss: how could you combine both?'] },
      realWorld: 'Fundraising for a school charity drive.',
      mentorWatchFor: ['Stories that are exaggerated or invented as real.', 'Stories with no link to the ask.'],
      selfCheck: ['Was my story specific?', 'Did it connect to my point?'],
      writePrompt: 'Write a persuasive story about one person affected by an issue you care about, ending with an ask.',
    },
    {
      title: 'The call to action',
      oneLine: 'Persuasion is not finished until you tell people exactly what to do next.',
      idea: [
        '"We should all care more about the environment" changes nothing. "Bring a reusable bottle to school every day next week" does.',
        'A strong call to action is specific, easy, time-bound and explains the benefit.',
      ],
      drills: [
        { title: 'Make it specific', brief: 'Turn this vague call into a specific one and deliver a forty-five-second speech ending with it: "People should read more."', targetSeconds: 45 },
        { title: 'Action speech', brief: 'Give a ninety-second speech on a school issue ending with a specific, time-bound call to action.', targetSeconds: 90 },
      ],
      game: { name: 'The Ask', emoji: '🙋', how: ['"Sell me this pencil."', 'In twenty seconds, finish with one clear action.', 'The class says what the ask was — if they cannot, it was not clear.'] },
      realWorld: 'Asking classmates to join a club, donate or sign up for an event.',
      mentorWatchFor: ['Vague endings.', 'Too many actions at once.'],
      selfCheck: ['Was my call to action specific and time-bound?', 'Did I explain the benefit?'],
      writePrompt: 'Write three calls to action for a school campaign, each specific, easy and time-bound.',
    },
    {
      title: 'Speaking up for what you believe',
      oneLine: 'Standing up for something takes courage — and the right words make it far more effective.',
      idea: [
        'Speaking up might mean defending a friend, challenging an unfair rule or raising an issue with a teacher. The goal is to be heard, not to win a fight.',
        'Stay calm, use "I" statements ("I feel this rule is unfair because…"), give a reason and suggest a solution.',
      ],
      drills: [
        { title: 'Challenge a rule respectfully', brief: 'Speak to your principal about a school rule you think is unfair: the rule, why, and your suggested change.', targetSeconds: 75 },
        { title: 'Standing up for someone', brief: 'Practise what you would say to calmly defend a classmate being teased, in thirty seconds.', targetSeconds: 30 },
      ],
      game: { name: 'Speak Up Scenarios', emoji: '📣', how: ['Pairs draw a scenario card: an unfair rule, a friend being left out, a group ignoring an idea.', 'One student speaks up calmly using an "I" statement.', 'The class rates it: calm, clear, constructive.'] },
      realWorld: 'Raising a concern with a teacher or defending a friend.',
      mentorWatchFor: ['Accusatory "you" language.', 'Complaints without a suggested solution.'],
      selfCheck: ['Did I use "I" statements?', 'Did I suggest a solution?'],
      writePrompt: 'Write what you would say to raise an issue you care about at school, with a reason and a solution.',
    },
  ],
};
