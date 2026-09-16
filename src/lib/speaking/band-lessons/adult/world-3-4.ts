import { bd, type BandLesson } from '../types';

/** UG, PG & professionals · Worlds 3 and 4 — structure for busy audiences, and executive delivery. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('adult', n, part, x);

export const ADULT_WORLD_3: BandLesson[] = [
  {
    number: 13,
    oneLine: 'If you cannot state your point in one sentence, your audience will leave with none.',
    idea: [
      'A week after your presentation, a decision-maker retains one sentence at most. If you do not choose it, they will — or they will retain nothing and ask for "a quick summary" by email.',
      'Lead with the answer. Consulting firms call it the pyramid principle: governing thought first, supporting arguments below. A topic ("Q3 performance") is not a point; a claim ("Q3 missed target because onboarding delays cut sales capacity by a fifth") is.',
    ],
    model: {
      text: 'My recommendation is to delay the launch by four weeks, because shipping now risks the enterprise renewals that make up sixty percent of our revenue.',
      noticing: ['The answer comes first.', 'One reason, quantified, tied to what the audience values.'],
    },
    drills: [
      d(13, 'a', { title: 'The one sentence', brief: 'State the governing thought of a real upcoming presentation, report or thesis chapter in one sentence with no "and".', targetSeconds: 15 }),
      d(13, 'b', { title: 'Say it, then defend it', brief: 'State your one sentence, then support it for ninety seconds with no digressions into related topics.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(13, 'c', { title: 'Topic to governing thought', brief: 'Take three topics from your work or studies and convert each into a one-sentence claim a stakeholder could act on.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Chronological build-up that hides the conclusion until the end.', 'Governing thoughts that are unfalsifiable.', 'Hedged claims ("it may potentially be worth considering").'],
    selfCheck: ['Does my first sentence contain my answer?', 'Could a senior repeat it after one hearing?'],
    realWorld: 'Executive summaries, project updates and thesis defence openings.',
    writePrompt: 'Write the governing thought and three supporting arguments for a real report or presentation in pyramid form.',
  },
  {
    number: 14,
    oneLine: 'Openings earn attention or spend it — and nerves peak exactly there.',
    idea: [
      'Effective openings for professional audiences: the business problem in their terms, a surprising data point, a short real anecdote, or a direct statement of the decision needed. Ineffective ones: extended thank-yous, your biography, the agenda read aloud, or an apology.',
      'Because cortisol peaks in the first minute, script and rehearse your opening two sentences precisely. The rest can be flexible; the start should not depend on thinking clearly under stress.',
    ],
    model: {
      text: 'Last month a customer waited nineteen days for a refund we could have processed in one. She did not complain to us. She posted about it, and it was seen by forty thousand people.',
      noticing: ['A concrete case, not an abstraction.', 'Stakes the audience feels immediately.'],
    },
    drills: [
      d(14, 'a', { title: 'Four openings, one talk', brief: 'For one real presentation, deliver four openings back to back: the problem, a data point, an anecdote and the decision needed.', targetSeconds: 60 }),
      d(14, 'b', { title: 'The opening, word for word', brief: 'Rehearse the strongest opening until precise, then deliver it followed by the next forty-five seconds of the talk.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(14, 'c', { title: 'Kill the preamble', brief: 'Deliver a typical preamble-heavy opening ("Thanks for having me, a bit about myself…"), then the same content with a strong first sentence.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Agenda-first openings.', 'Anecdotes that take a minute to reach relevance.', 'Opening lines delivered too fast from nerves.'],
    selfCheck: ['Would the most senior person look up from their phone?', 'Can I deliver my opening under stress, word for word?'],
    realWorld: 'Opening a pitch, conference talk, seminar or leadership briefing.',
    writePrompt: 'Write four alternative openings for a real presentation and explain which suits your specific audience best.',
  },
  {
    number: 15,
    oneLine: 'Three well-ordered supporting points; the order itself is an argument.',
    idea: [
      'Working memory holds roughly three to four chunks. Seven bullet points in a meeting become zero retained. Group supporting material into three mutually exclusive, collectively exhaustive points.',
      'Order is strategic: lead with the point the most sceptical stakeholder cares about, or build to your strongest. Situation–complication–resolution suits recommendations; option A–option B–recommendation suits decisions.',
    ],
    model: {
      text: 'The situation: support tickets doubled this year. The complication: headcount is frozen. The resolution: a self-service help centre, which similar companies used to deflect a third of tickets.',
      noticing: ['Situation–complication–resolution.', 'Each point has one piece of support.'],
    },
    drills: [
      d(15, 'a', { title: 'Three points, one support each', brief: 'Make a ninety-second recommendation from your work or studies with three distinct points, each backed by one piece of evidence.', targetSeconds: 90 }),
      d(15, 'b', { title: 'The same three, reordered', brief: 'Deliver the same recommendation in situation–complication–resolution order and explain which order suits your audience.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(15, 'c', { title: 'Options, then recommend', brief: 'Present two options for a decision fairly, then give your recommendation with its deciding reason, in ninety seconds.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Overlapping points (not mutually exclusive).', 'Evidence dumps under each point.', 'Recommendations that do not follow from the points.'],
    selfCheck: ['Are my points distinct and complete?', 'Why this order for this audience?'],
    realWorld: 'Structuring recommendations, case interview answers and research presentations.',
    writePrompt: 'Structure a real recommendation as situation, complication and resolution, with one piece of evidence for each.',
  },
  {
    number: 16,
    oneLine: 'Listeners cannot see your document structure — signposting lets them hear it.',
    idea: [
      'A report has headings; a spoken briefing does not. Without verbal structure, stakeholders lose track of whether you are describing the problem, the options or the recommendation — and they interrupt to ask.',
      'Preview the structure, mark transitions explicitly ("That covers cost. Now risk."), number your points, and flag the close ("So, the decision I need today…"). In virtual meetings, where attention drifts, signposting matters even more.',
    ],
    model: {
      text: 'I will cover three things: where we are, what is blocking us, and what I need from this group. First, where we are.',
      noticing: ['A preview aligned to the audience\'s needs.', 'An immediate, clear entry into section one.'],
    },
    drills: [
      d(16, 'a', { title: 'Three points, signposted', brief: 'Give a ninety-second project briefing with a preview, explicit transitions and a flagged close.', targetSeconds: 90 }),
      d(16, 'b', { title: 'The same talk, unsignposted', brief: 'Deliver it with no signposting, then describe what a listener joining late would miss.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(16, 'c', { title: 'Virtual meeting version', brief: 'Deliver the briefing as if on a video call, adding a mid-point recap for people whose attention drifted.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Previews that list topics rather than the questions they answer.', 'Missing transitions between problem and recommendation.', 'Over-signposting short updates.'],
    selfCheck: ['Could someone joining late find their place?', 'Did my close state the decision or ask?'],
    realWorld: 'Leadership briefings, stand-ups and virtual meetings.',
    writePrompt: 'Write the preview, transitions and closing signpost for a real briefing, including a mid-point recap for a virtual version.',
  },
  {
    number: 17,
    oneLine: 'The last sentence is the one they act on — do not spend it on "any questions?"',
    idea: [
      'Many presentations end by fading out: "So that is everything, any questions?" The final impression becomes uncertainty, and the ask gets lost.',
      'Close with the decision or action required, a restated governing thought, or a loop back to your opening. Deliver the closing line before Q&A, then return to it after Q&A so the meeting ends on your message rather than on the last question.',
    ],
    model: {
      text: 'I started with a customer who waited nineteen days. With this change, she waits one. I need approval for the pilot by Friday.',
      noticing: ['Closes the loop from the opening anecdote.', 'Ends with a specific ask and deadline.'],
    },
    drills: [
      d(17, 'a', { title: 'Open and close the same loop', brief: 'Deliver only the opening and closing sentences of a presentation, where the close resolves the opening.', targetSeconds: 30 }),
      d(17, 'b', { title: 'Say it and stop', brief: 'Deliver a ninety-second update ending with a clear ask, then hold silence for two seconds before any further words.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(17, 'c', { title: 'Close after Q&A', brief: 'Simulate answering a final question, then bring the meeting back to your key message and ask in two sentences.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Endings that introduce new information.', 'Asks without owners or deadlines.', 'Letting Q&A become the ending.'],
    selfCheck: ['What exactly did I ask for, from whom, by when?', 'Did I reclaim the ending after questions?'],
    realWorld: 'Closing a pitch, a funding request or a steering committee update.',
    writePrompt: 'Write your closing statement for before Q&A and your re-close for after Q&A, both with a specific ask.',
  },
  {
    number: 18,
    oneLine: 'Every accurate but non-essential detail competes with the point that matters.',
    idea: [
      'Subject-matter experts struggle most here: they know the nuance, the caveats and the history, and want to show rigour. For decision-makers, that depth buries the signal.',
      'Apply a so-what test to every point and slide. Put detail in an appendix or a follow-up document. A ten-minute slot delivered in eight minutes is remembered as crisp; a ten-minute slot run to fifteen is remembered as a problem.',
    ],
    drills: [
      d(18, 'a', { title: 'Two minutes', brief: 'Explain a piece of your work or research in two minutes, including all the nuance you would naturally include.', targetSeconds: 120 }),
      d(18, 'b', { title: 'The same talk in sixty seconds', brief: 'Deliver it in sixty seconds for a senior audience, keeping only what serves the decision or conclusion.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(18, 'c', { title: 'Elevator version', brief: 'Deliver the thirty-second version for someone you meet in a lift who could fund, hire or support your work.', targetSeconds: 30 }),
    ],
    mentorWatchFor: ['Caveats front-loaded before the conclusion.', 'The short version that is just the long version faster.', 'Methodology detail pushed on non-technical audiences.'],
    selfCheck: ['What did I move to the appendix?', 'Did the short version lose anything the audience needed?'],
    realWorld: 'Fitting research or project work into a short leadership or conference slot.',
    writePrompt: 'List every point in a real presentation, apply the so-what test, and mark each as keep, appendix or cut.',
  },
];

export const ADULT_WORLD_4: BandLesson[] = [
  {
    number: 19,
    oneLine: 'Stillness reads as executive presence — and nobody is still by accident.',
    idea: [
      'Shifting weight, pacing without purpose, adjusting glasses, clicking a pen and touching your face all signal anxiety to an interview panel or a client. They also pull attention away from your content.',
      'Plant your feet, keep your weight centred and let your hands rest when not gesturing. Move with intent — to the screen to point, a step forward for your key message. Seated in meetings, sit upright with forearms on the table.',
    ],
    drills: [
      d(19, 'a', { title: 'Sixty seconds, standing', brief: 'Deliver a sixty-second pitch for a project or idea while standing completely grounded, moving only once, on purpose.', targetSeconds: 60 }),
      d(19, 'b', { title: 'Standing versus sitting', brief: 'Deliver the same forty-five seconds standing, then seated as in a meeting. Note what changes in your voice and presence.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(19, 'c', { title: 'Purposeful movement', brief: 'Deliver a three-part update, moving one deliberate step only at each transition.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Self-touching gestures under questioning.', 'Leaning back or slouching when seated.', 'Rigid stillness that looks defensive.'],
    selfCheck: ['What unconscious movement did I make?', 'Did every move have a purpose?'],
    realWorld: 'Interview panels, pitches and standing presentations to leadership.',
    writePrompt: 'Write your three most common nervous physical habits and the grounded alternative for standing and seated settings.',
  },
  {
    number: 20,
    oneLine: 'A gesture should carry meaning you would otherwise have to say — anything else is noise.',
    idea: [
      'Effective gestures illustrate structure (counting options), scale (growth, decline), comparison (this approach versus that), or sequence (a timeline across the space in front of you).',
      'Repetitive batons on every word, steepled hands held too long or constant motion dilute impact. On video, keep gestures within the frame and slightly slower, or they blur.',
    ],
    drills: [
      d(20, 'a', { title: 'Sentences with shape', brief: 'Describe a trend, a comparison between two options and a three-step process, using one precise gesture for each.', targetSeconds: 45 }),
      d(20, 'b', { title: 'Three points, three fingers', brief: 'Deliver a sixty-second, three-point recommendation, counting points visibly and resting your hands between them.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(20, 'c', { title: 'In frame', brief: 'Deliver a forty-five-second explanation as if on camera, keeping all gestures within the frame of a laptop webcam.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Gestures lagging behind words.', 'Out-of-frame gestures on video.', 'Pointing at the audience.'],
    selfCheck: ['Which gestures added meaning?', 'Were my hands calm between them?'],
    realWorld: 'Explaining data, trade-offs and processes in presentations and video calls.',
    writePrompt: 'Script a short explanation of a trade-off and note the gesture that will represent each option.',
  },
  {
    number: 21,
    oneLine: 'Give each person a complete thought — sweeping the room connects with nobody.',
    idea: [
      'In boardrooms and interview panels, eye contact signals confidence and credibility. Darting eyes signal anxiety; fixing on only the most senior person alienates everyone else.',
      'Deliver one complete thought to one person, then move. In a panel, start and end answers with the questioner but include others in the middle. On video, look at the lens for key points and at faces while listening.',
    ],
    drills: [
      d(21, 'a', { title: 'One person, one thought', brief: 'Imagine a five-person panel. Deliver a ninety-second answer giving each "person" a complete thought, starting and ending with the questioner.', targetSeconds: 90 }),
      d(21, 'b', { title: 'The sweep, for comparison', brief: 'Deliver the same answer sweeping your eyes continuously, then describe the difference in connection.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(21, 'c', { title: 'Lens for the key point', brief: 'On a video recording, look at faces on screen while framing your answer and at the lens for your key sentence.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Eye contact only with the most senior person.', 'Looking up and away while formulating answers.', 'On video, reading from notes placed below the camera.'],
    selfCheck: ['Did I include the whole panel?', 'Where did my eyes go when thinking?'],
    realWorld: 'Panel interviews, board presentations and client meetings.',
    writePrompt: 'Write a plan for eye contact in a panel interview: who you start with, how you include others, and where you end.',
  },
  {
    number: 22,
    oneLine: 'Notes should hold your structure, not your sentences — a script gets read aloud.',
    idea: [
      'Full-text notes or reading speaker notes from a second screen produce a flat, downward-looking delivery that stakeholders read as lack of mastery. And when interrupted, finding your place in prose is slow.',
      'Use a one-page structure: governing thought, three point headlines with their key figure, the close and prepared answers to likely questions. Figures and names you must get exactly right can be written in full; everything else should be prompts.',
    ],
    drills: [
      d(22, 'a', { title: 'Five words, two minutes', brief: 'Deliver a two-minute presentation from a card of at most five prompt words plus any exact figures.', targetSeconds: 120 }),
      d(22, 'b', { title: 'The script, for comparison', brief: 'Read one minute of the same content from a full script, then compare the two recordings for credibility.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(22, 'c', { title: 'Interrupted from notes', brief: 'Present from prompt notes, simulate an interruption with a question, answer it, and find your place again quickly.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Speaker notes read verbatim from a second screen.', 'Exact figures not written down, leading to errors.', 'Losing the thread after interruptions.'],
    selfCheck: ['What did my notes contain?', 'How quickly did I recover my place after interruption?'],
    realWorld: 'Presenting to leadership, delivering a conference talk or a thesis presentation.',
    soundLab: ['ea', 'oo'],
    writePrompt: 'Create a one-page speaking outline for a real presentation: governing thought, three headlines with figures, close and likely questions.',
  },
  {
    number: 23,
    oneLine: 'The camera gives nothing back, so video presence has to be deliberately projected.',
    idea: [
      'Remote interviews, recorded pitches, webinars and hybrid meetings are now routine. Energy that works in a room reads as flat on camera, and looking at faces on screen reads as looking down.',
      'Raise the camera to eye level, frame head and shoulders with the eyes a third from the top, light your face from the front, and look into the lens for important points. Increase vocal energy slightly and pause more — audio lag and compression eat rushed speech.',
    ],
    drills: [
      d(23, 'a', { title: 'To the lens', brief: 'Record a ninety-second video introduction for a remote interview or client call, delivering key sentences into the lens.', targetSeconds: 90 }),
      d(23, 'b', { title: 'To the room, then to the camera', brief: 'Deliver thirty seconds as if to a room, then the same content optimised for camera. Compare energy and eye line.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(23, 'c', { title: 'Recorded pitch', brief: 'Record a sixty-second asynchronous video pitch for an idea, as for a hiring platform or internal innovation programme.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Camera below eye level.', 'Reading notes placed off to the side.', 'Energy lower on camera than in person.'],
    selfCheck: ['Where was my eye line?', 'Did my energy survive the camera?'],
    realWorld: 'Remote interviews, recorded pitches, webinars and hybrid meetings.',
    soundLab: ['c', 'ch'],
    writePrompt: 'Write a checklist for your video set-up and delivery before your next remote interview or important call.',
  },
];
