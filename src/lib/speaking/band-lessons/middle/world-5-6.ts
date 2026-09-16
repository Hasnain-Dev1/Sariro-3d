import { bd, type BandLesson } from '../types';

/** Grades 7–9 · Worlds 5 and 6 — persuasion that holds up, and stories people repeat. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('middle', n, part, x);

export const MIDDLE_WORLD_5: BandLesson[] = [
  {
    number: 25,
    oneLine: 'A persuasive talk has a verb in it — name the action or you are only informing.',
    idea: [
      'Informing leaves an audience knowing more. Persuading leaves them doing something different: voting, joining, signing, changing a habit. If you cannot name the action, you are not yet persuading.',
      'Write the ask before anything else: "I want Year 8 to…". Every point in the talk should move the audience one step closer to that action, and the ending should state it plainly.',
    ],
    model: {
      text: 'I want every class to replace one printed worksheet a week with a digital one, starting Monday — and I want you to vote yes at Friday\'s council meeting.',
      noticing: ['A specific, doable action.', 'A deadline and a concrete next step.'],
    },
    drills: [
      d(25, 'a', { title: 'The ask, in one sentence', brief: 'Choose a change at your school and state exactly what you want your audience to do, by when.', targetSeconds: 20 }),
      d(25, 'b', { title: 'Ninety seconds towards the ask', brief: 'Give a ninety-second talk where every point builds towards your ask, ending with the ask stated clearly.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(25, 'c', { title: 'Inform versus persuade', brief: 'Give thirty seconds informing about plastic waste, then thirty seconds persuading with a clear action. Name the difference.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Asks that are attitudes ("care more") rather than actions.', 'Talks that never actually state the ask.'],
    selfCheck: ['What verb was in my ask?', 'Did every point move towards it?'],
    realWorld: 'A student council proposal or a campaign for a school change.',
    writePrompt: 'Write your ask as one sentence with an action and a deadline, then list three points that each move the audience closer to it.',
  },
  {
    number: 26,
    oneLine: 'Credibility, emotion and logic — you need all three, and most people rely on one.',
    idea: [
      'Aristotle named them over two thousand years ago. Ethos: why should they believe you? Pathos: why should they care? Logos: does the argument actually hold together?',
      'Teen persuaders often go all pathos (emotional appeals with no evidence) or all logos (facts nobody feels). Adverts, influencers and politicians use all three — learn to spot them, then use them honestly.',
    ],
    model: {
      text: 'I have been on the school canteen committee for two years. Every week I watch full plates go in the bin — food someone\'s parents paid for. Our own count says we waste forty kilograms a week. A tasting panel could cut that in half.',
      noticing: ['Ethos: two years on the committee.', 'Pathos: full plates, parents who paid.', 'Logos: a measured number and a solution.'],
    },
    drills: [
      d(26, 'a', { title: 'One sentence each', brief: 'For a cause you care about, say one ethos sentence, one pathos sentence and one logos sentence.', targetSeconds: 30 }),
      d(26, 'b', { title: 'Two minutes on your weakest', brief: 'Identify which of the three you find hardest and give a two-minute persuasive talk that leans deliberately on that one while using all three.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(26, 'c', { title: 'Decode an advert', brief: 'Describe a video advert or influencer post you have seen and identify its ethos, pathos and logos — and which it leaned on most.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Pathos that becomes guilt-tripping.', 'Ethos that is boasting unrelated achievements.'],
    selfCheck: ['Which appeal is my natural default?', 'Which did I use weakest today?'],
    realWorld: 'Understanding and answering the persuasion aimed at you online every day.',
    writePrompt: 'Write a persuasive paragraph for a cause and label each sentence ethos, pathos or logos.',
  },
  {
    number: 27,
    oneLine: 'One number your audience can picture beats five they cannot.',
    idea: [
      'Strings of statistics wash over listeners. One well-chosen figure, made concrete, sticks: "eight million tonnes of plastic enter the ocean each year" is abstract; "a rubbish truck\'s worth every minute" is a picture.',
      'Every number needs a comparison to mean something — per student, per day, compared with last year, compared with something familiar. And check your sources: one wrong statistic can sink your whole credibility in a debate.',
    ],
    model: {
      text: 'The average teenager spends about seven hours a day on screens. That is longer than the school day. Every day.',
      noticing: ['One number.', 'A comparison everyone in the room lives.'],
    },
    drills: [
      d(27, 'a', { title: 'One number, two ways', brief: 'Say this fact plainly, then make it concrete with a comparison: "The Amazon rainforest loses an area of about fifteen football pitches every hour."', targetSeconds: 30 }),
      d(27, 'b', { title: 'A case built on one figure', brief: 'Give a ninety-second persuasive talk built around a single, well-explained statistic you know to be accurate.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(27, 'c', { title: 'Too many numbers', brief: 'Deliver a thirty-second talk packed with five statistics, then redo it with your one strongest number made vivid.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Statistics without sources.', 'Comparisons that are harder to picture than the original number.'],
    selfCheck: ['Where did my number come from?', 'Could my audience repeat it tomorrow?'],
    realWorld: 'Using data convincingly in a science fair, a geography project or a debate.',
    writePrompt: 'Write one statistic you have checked, its source, and a comparison that makes it easy to picture.',
  },
  {
    number: 28,
    oneLine: 'Raise the strongest objection yourself — it is the most persuasive move almost nobody makes.',
    idea: [
      'Your audience is silently building counter-arguments while you talk. If you ignore them, they stop listening. If you name the best one first, you look fair, confident and prepared.',
      'Steel-man it: state the objection at its strongest, not a weak version you can easily knock down. Then answer it — or concede part of it and explain why your case still holds.',
    ],
    model: {
      text: 'The strongest argument against a four-day school week is that working parents would struggle with childcare. That is a real problem. But schools that tried it ran optional clubs on the fifth day, and attendance at those clubs was high.',
      noticing: ['States the objection fairly.', 'Concedes it is real, then answers with evidence.'],
    },
    drills: [
      d(28, 'a', { title: 'The strongest objection', brief: 'Pick a position you hold and state the single strongest objection to it as fairly as its best supporter would.', targetSeconds: 60 }),
      d(28, 'b', { title: 'Concede something real', brief: 'Give a ninety-second persuasive talk that concedes one genuine point to the other side and still makes your case.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(28, 'c', { title: 'Straw man spotting', brief: 'Say a weak "straw man" version of an argument, then the strong "steel man" version, and explain the difference.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Straw-man objections set up to be knocked down.', 'Concessions that are sarcastic.'],
    selfCheck: ['Would someone who disagrees say I described their view fairly?', 'Did my answer actually address it?'],
    realWorld: 'Debating a motion or arguing your case to a teacher or parent.',
    writePrompt: 'Write the strongest objection to your position, what you concede, and why your position still holds.',
  },
  {
    number: 29,
    oneLine: 'Rhetorical devices are old because they work — use one or two, not all of them.',
    idea: [
      'The rule of three ("Education, education, education"), anaphora (repeating a sentence start), antithesis (a contrast pair) and the rhetorical question have been used from ancient Athens to modern TED talks.',
      'You already use some without noticing. Used once or twice they make a line memorable; stacked in every sentence they sound like a parody of a speech.',
    ],
    model: {
      text: 'We were told we were too young to understand. Too young to vote. Too young to matter. But we are not too young to notice when adults stop listening.',
      noticing: ['Anaphora: "Too young to…".', 'A contrast in the final sentence.'],
    },
    drills: [
      d(29, 'a', { title: 'A rule of three, out loud', brief: 'Write and deliver a short speech ending on a rule of three about something your generation cares about.', targetSeconds: 45 }),
      d(29, 'b', { title: 'The contrast pair', brief: 'Read this aloud, landing each contrast, then deliver one contrast pair of your own.', passage: 'It is not the critic who counts. We do not remember the loudest voice in the room; we remember the one that was right. Ask not what the world can give you, but what you can give the world.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(29, 'c', { title: 'Device detective', brief: 'Recall a famous speech line or song lyric and explain which device it uses and why it sticks.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Device overload — every sentence a triple.', 'Repetition delivered flatly so the pattern is lost.'],
    selfCheck: ['Which device did I use?', 'Did I use it once, powerfully?'],
    realWorld: 'Writing a memorable closing line for a debate or student election speech.',
    writePrompt: 'Write four sentences for a speech that use exactly two rhetorical devices, and name them.',
  },
  {
    number: 30,
    oneLine: 'Everything in this world works whether or not you are right — which is why ethics comes last.',
    idea: [
      'Hooks, emotional stories, selective statistics and confident delivery persuade people regardless of truth. That is exactly how misinformation spreads online, and why some very persuasive people do real harm.',
      'Ethical persuasion uses accurate evidence, represents the other side fairly, is transparent about what you want, and respects the audience\'s right to disagree. Test: would you be comfortable if your audience saw exactly how you persuaded them?',
    ],
    drills: [
      d(30, 'a', { title: 'The case you actually believe', brief: 'Give a two-minute persuasive talk on something you genuinely believe, using only evidence you have checked.', targetSeconds: 120 }),
      d(30, 'b', { title: 'Show your working', brief: 'Persuade us about something, and explain openly how you came to your view, including what nearly changed your mind.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(30, 'c', { title: 'Misinformation autopsy', brief: 'Describe a misleading post or viral claim you have seen and explain the persuasion techniques that made it spread.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Students who treat winning as the only goal.', 'Discussion of real viral content drifting into politics — keep it about technique.'],
    selfCheck: ['Was every fact I used accurate?', 'Did I represent the other side fairly?'],
    realWorld: 'Deciding what to believe and share online, and arguing honestly with friends.',
    writePrompt: 'Write about a time you were persuaded by something that turned out to be misleading. What technique worked on you?',
  },
];

export const MIDDLE_WORLD_6: BandLesson[] = [
  {
    number: 31,
    oneLine: 'Facts get filed away; stories make people ask what happens next.',
    idea: [
      'Neuroscientists find that stories activate far more of the brain than lists of facts — listeners imagine, predict and feel. That is why you remember a teacher\'s story from years ago but not the slide that followed it.',
      'Any subject can become a story: a discovery with a scientist who kept failing, a historical decision under pressure, a statistic seen through one person\'s day.',
    ],
    drills: [
      d(31, 'a', { title: 'Three facts, flat', brief: 'Give three facts about a topic from science or history in a flat, list-like way.', targetSeconds: 45 }),
      d(31, 'b', { title: 'One of them, as a story', brief: 'Take one of those facts and tell it as a story with a person, a problem and a moment of change.', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(31, 'c', { title: 'Discovery story', brief: 'Tell the story behind a scientific discovery or invention, focusing on the failures before the breakthrough.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Stories that lose the fact they were meant to carry.', 'Invented details presented as historical truth.'],
    selfCheck: ['Who was the person at the centre?', 'Did the fact become more memorable?'],
    realWorld: 'Making a history, science or geography presentation genuinely memorable.',
    writePrompt: 'Write a fact from a subject you study, then rewrite it as a short story with a person, a problem and a turning point.',
  },
  {
    number: 32,
    oneLine: 'You are not looking for a dramatic story — you are looking for the moment something changed.',
    idea: [
      'Students often think they have no stories because nothing dramatic has happened to them. But a story is not drama. It is change: a belief shifting, a relationship turning, a skill clicking, a small decision with consequences.',
      'Look for "before" and "after". The first time you disagreed with a friend and were glad you did. The match you lost and what it taught you. That change is the story.',
    ],
    drills: [
      d(32, 'a', { title: 'The moment it changed', brief: 'Tell a sixty-second story about a moment you changed your mind about something or someone.', targetSeconds: 60 }),
      d(32, 'b', { title: 'The most boring week', brief: 'Pick the most ordinary week you remember and find one small moment of change in it. Tell it as a ninety-second story.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(32, 'c', { title: 'Before and after', brief: 'Describe who you were before you started a hobby or activity, the turning point, and who you are now.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Students exaggerating events to seem interesting.', 'Stories with no clear before or after.'],
    selfCheck: ['What was different after the moment?', 'Did I make the change the centre of the story?'],
    realWorld: 'Personal narratives for English assessments, applications or school magazines.',
    writePrompt: 'Write the "before" and "after" of a moment you changed your mind, in two short paragraphs.',
  },
  {
    number: 33,
    oneLine: 'Setup, turn, resolution — and the turn is the story, so do not drown it in setup.',
    idea: [
      'Setup: who, where, what they wanted. Turn: the problem, the surprise or the decision. Resolution: what happened and what it meant.',
      'Most beginners spend sixty percent of their time on setup — names, backstory, what everyone was wearing. Get to the turn fast. Listeners will forgive a thin setup; they will not forgive a slow one.',
    ],
    model: {
      text: 'I was the last one picked for the quiz team. At the final, the captain froze on the tiebreaker question — and it was about the one book I had read three times. We won by one point, and nobody picked me last again.',
      noticing: ['Setup in one sentence.', 'The turn arrives immediately.', 'The resolution adds meaning.'],
    },
    drills: [
      d(33, 'a', { title: 'Setup, turn, resolution', brief: 'Tell a true story in exactly three sentences: one each for setup, turn and resolution.', targetSeconds: 30 }),
      d(33, 'b', { title: 'The full version', brief: 'Expand the same story to ninety seconds, spending most of the extra time on the turn.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(33, 'c', { title: 'Cut the setup', brief: 'Tell a story with a long setup, then retell it starting at the turn. Which kept attention better?', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Setup-heavy stories.', 'Resolutions that just stop instead of meaning something.'],
    selfCheck: ['How much of my time was setup?', 'What did my resolution mean?'],
    realWorld: 'Storytelling competitions, English orals and speeches with a personal story.',
    writePrompt: 'Plan a story with one sentence of setup, three sentences for the turn and one sentence of resolution.',
  },
  {
    number: 34,
    oneLine: 'One specific detail makes a story real — six turn it into a description.',
    idea: [
      '"It was a stressful exam" tells me nothing. "My pen ran out on question two and I could hear the clock over everyone\'s breathing" puts me in the room.',
      'Choose details that are specific, sensory and relevant to the turn. One per beat is usually enough. Past that, the story stalls while you describe the furniture.',
    ],
    drills: [
      d(34, 'a', { title: 'One detail per beat', brief: 'Tell a ninety-second story with exactly one vivid, specific detail in each of the setup, turn and resolution.', targetSeconds: 90 }),
      d(34, 'b', { title: 'Too much detail, on purpose', brief: 'Tell the same story with far too much detail, then describe where it lost momentum.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(34, 'c', { title: 'Upgrade the vague', brief: 'Turn these vague sentences into specific ones: "It was a nice day." "The match was tense." "She was angry."', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Clichéd details ("my heart was pounding") instead of specific ones.', 'Details unrelated to the turn.'],
    selfCheck: ['Which detail was most specific?', 'Did any detail slow the turn down?'],
    realWorld: 'Narrative speaking tasks and creative writing presented aloud.',
    writePrompt: 'Rewrite three vague sentences from a story as specific, sensory ones.',
  },
  {
    number: 35,
    oneLine: 'The safest joke targets you; the most dangerous targets someone in the room.',
    idea: [
      'Humour builds connection fast — but teenage audiences are quick to judge, and a joke that singles someone out, stereotypes a group or mocks appearance can follow you for years.',
      'Self-deprecating stories are safe and endearing. Observational humour about shared experiences (exams, school food, group chats) works too. Deliver the punchline, then pause — do not laugh through your own line.',
    ],
    drills: [
      d(35, 'a', { title: 'The time I was the fool', brief: 'Tell a sixty-second funny story where you are the one who got it wrong.', targetSeconds: 60 }),
      d(35, 'b', { title: 'The line, then the pause', brief: 'Deliver a short observational joke about school life, holding a full two-second pause after the punchline.', targetSeconds: 30 }),
    ],
    extraDrills: [
      d(35, 'c', { title: 'Humour opener', brief: 'Open a serious talk with one light, self-directed funny line, then transition smoothly into the serious content.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Jokes at classmates\' expense disguised as banter.', 'Humour that undermines a serious topic.'],
    selfCheck: ['Who was the target of my joke?', 'Did I pause after the punchline?'],
    realWorld: 'Using humour in class presentations and speeches without it backfiring.',
    writePrompt: 'Write a funny story where you are the target, and mark the punchline and the pause.',
  },
  {
    number: 36,
    oneLine: 'A personal story works when you have enough distance from it to tell it well.',
    idea: [
      'Sharing a real experience builds trust quickly — people connect with honesty. But stories that are still raw can overwhelm you mid-talk and make the audience uncomfortable rather than moved.',
      'Choose stories you can tell calmly and that have a clear lesson. You never owe an audience your private pain. It is fine to share a setback without asking for sympathy — focus on what it taught you.',
    ],
    drills: [
      d(36, 'a', { title: 'Something that went wrong', brief: 'Tell a ninety-second story about a setback — a failed trial, a bad result, a falling-out — and what you learned.', targetSeconds: 90 }),
      d(36, 'b', { title: 'No sympathy asked', brief: 'Retell the same story in a way that asks for no sympathy at all, focusing on decisions and learning.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(36, 'c', { title: 'A value in a story', brief: 'Tell a short story that shows one value you hold — fairness, persistence, loyalty — without naming the value until the end.', targetSeconds: 75 }),
    ],
    mentorWatchFor: ['Students sharing more than is safe — offer a private alternative.', 'Stories that end in self-pity rather than learning.'],
    selfCheck: ['Could I tell this calmly to strangers?', 'What did the story show about me?'],
    realWorld: 'Personal statements, leadership applications and speeches that need authenticity.',
    writePrompt: 'Write a setback story in a way that focuses on your decisions and what you learned, not on sympathy.',
  },
];
