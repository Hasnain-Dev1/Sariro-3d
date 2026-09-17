import type { CourseModule } from '../types';

/* Grades 10–12 · Module 7 — Leadership Speaking */
export const SENIOR_M7: CourseModule = {
  title: 'Leadership Speaking',
  outcome: 'Campaign for leadership roles, host events, give ceremonial speeches, motivate teams, handle difficult conversations and speak responsibly on social issues.',
  world: { name: 'Leadership Summit', emoji: '🏔️', color: '#CA8A04', tagline: 'Lead with your words.' },
  lessons: [
    {
      title: 'Running for head student: vision, record and plan',
      oneLine: 'Leadership campaigns are won by vision, credibility and realistic plans — not popularity alone.',
      idea: [
        'Senior leadership roles attract strong candidates. Voters and staff look for a clear vision, evidence you can deliver and specific initiatives that address real student concerns.',
        'Structure: the problem you have noticed, your vision, two or three concrete initiatives, evidence of your track record and a clear ask.',
      ],
      drills: [
        { title: 'Campaign speech', brief: 'Deliver a two-minute head-student campaign speech: problem, vision, three initiatives, track record and ask.', targetSeconds: 120 },
        { title: 'Candidates’ forum', brief: 'Answer a tough question at a candidates’ forum: "How will you represent students who never speak up?"', targetSeconds: 60 },
      ],
      game: { name: 'Candidates’ Forum', emoji: '🗳️', how: ['Three candidates give ninety-second speeches.', 'The audience asks one tough question each.', 'Anonymous vote and discussion of what persuaded.'] },
      realWorld: 'Head-student, house captain and council elections.',
      mentorWatchFor: ['Vague promises.', 'Speeches that attack other candidates.'],
      selfCheck: ['Were my initiatives concrete?', 'Did I show evidence I can deliver?'],
      writePrompt: 'Write a head-student campaign speech with a vision, three concrete initiatives and evidence of your track record.',
    },
    {
      title: 'Anchoring and hosting school events',
      oneLine: 'A great anchor sets the tone, keeps the event flowing and makes performers and guests feel valued.',
      idea: [
        'Anchoring requires a script with flexibility: welcome, context for the event, smooth introductions, transitions between items and handling delays gracefully.',
        'Your energy sets the audience’s energy. Research guests’ names and titles carefully, and have a filler line ready for technical delays.',
      ],
      drills: [
        { title: 'Opening an annual day', brief: 'Open your school’s annual day: welcome dignitaries by title, set the tone and introduce the first performance.', targetSeconds: 90 },
        { title: 'Handling a delay', brief: 'The next act is not ready. Fill forty-five seconds gracefully and keep the audience engaged.', targetSeconds: 45 },
      ],
      game: { name: 'Live Hosting Relay', emoji: '🎙️', how: ['Pairs host a pretend event with five items.', 'The mentor adds surprises: a missing performer, a microphone failure.', 'Hosts adapt live; the class scores flow and poise.'] },
      realWorld: 'Anchoring annual days, cultural fests, farewells and inter-school events.',
      mentorWatchFor: ['Mispronounced names and titles.', 'Transitions that are just "next is…"'],
      selfCheck: ['Did my transitions connect items?', 'Did I handle the delay smoothly?'],
      writePrompt: 'Write an anchor script for the opening, two transitions and a delay filler for a school event.',
    },
    {
      title: 'Farewell, welcome and vote-of-thanks speeches',
      oneLine: 'Ceremonial speeches work when they are specific, warm and brief.',
      idea: [
        'A farewell speech shares specific memories, gratitude and hope. A welcome speech makes guests feel expected and valued. A vote of thanks names people and their specific contributions.',
        'The most common mistake is length. Two to three minutes with specific details beats ten minutes of generic praise.',
      ],
      drills: [
        { title: 'Farewell speech', brief: 'Deliver a two-minute farewell speech for your graduating class: a specific shared memory, gratitude and a hopeful close.', targetSeconds: 120 },
        { title: 'Vote of thanks', brief: 'Deliver a sixty-second vote of thanks naming specific contributions of guests, staff and organisers.', targetSeconds: 60 },
      ],
      game: { name: 'Specific or Generic?', emoji: '🔍', how: ['Students read two versions of a thank-you: one generic, one specific.', 'The class discusses which feels sincere.', 'Everyone rewrites a generic line with specifics.'] },
      realWorld: 'Graduation farewells, guest welcomes and closing ceremonies.',
      mentorWatchFor: ['Generic praise.', 'Inside jokes that exclude most of the audience.'],
      selfCheck: ['Were my details specific?', 'Was it brief?'],
      writePrompt: 'Write a farewell speech for your class with two specific memories, thanks and a hopeful ending.',
    },
    {
      title: 'Motivating a team: captains and club leads',
      oneLine: 'Motivation comes from purpose, belief and a clear next step — not just shouting "Let’s go!"',
      idea: [
        'Before a match, competition or big project, a leader reminds the team why it matters, what they are capable of and exactly what to focus on next.',
        'After setbacks, acknowledge reality honestly, highlight what is in their control and give a specific focus for the next attempt.',
      ],
      drills: [
        { title: 'Before the final', brief: 'Give a sixty-second talk as captain before a final: purpose, belief and one clear focus.', targetSeconds: 60 },
        { title: 'After a loss', brief: 'Your debate team lost a close semi-final. Give a sixty-second talk that is honest, encouraging and forward-looking.', targetSeconds: 60 },
      ],
      game: { name: 'Locker Room Talk', emoji: '🏅', how: ['The mentor sets a scenario: before a final, at half-time losing, after a defeat.', 'Captains give a sixty-second team talk.', 'The team rates: did it make you want to go again?'] },
      realWorld: 'Sports captaincy, club leadership and team projects.',
      mentorWatchFor: ['Hype without substance.', 'Blame after setbacks.'],
      selfCheck: ['Did I give a clear focus?', 'Was I honest after the setback?'],
      writePrompt: 'Write two team talks: one before a big event and one after a setback.',
    },
    {
      title: 'Difficult conversations as a student leader',
      oneLine: 'Leaders have hard conversations privately, respectfully and focused on behaviour and solutions.',
      idea: [
        'Student leaders must sometimes address a teammate who is not contributing, a conflict between members or feedback to staff about a problem.',
        'Use a simple structure: describe the specific situation, explain its impact, listen to their view and agree on a next step together.',
      ],
      drills: [
        { title: 'The non-contributor', brief: 'Speak to a club member who has missed three meetings and deadlines. Describe the situation, impact, invite their view and agree a step.', targetSeconds: 90 },
        { title: 'Feedback upward', brief: 'Raise a concern with a teacher coordinator that an event schedule is overloading students.', targetSeconds: 75 },
      ],
      game: { name: 'Role-Play Round', emoji: '🎭', how: ['Pairs draw difficult-conversation scenarios.', 'One plays the leader, one the other person with a hidden reason.', 'Debrief: did listening uncover the hidden reason?'] },
      realWorld: 'Leading clubs, councils and team projects.',
      mentorWatchFor: ['Accusatory language.', 'Solving without listening.'],
      selfCheck: ['Did I describe behaviour, not character?', 'Did I listen before solving?'],
      writePrompt: 'Write how you would open a difficult conversation with a teammate, including the situation, impact and your question to them.',
    },
    {
      title: 'Speaking responsibly about social issues',
      oneLine: 'When speaking on sensitive issues, accuracy, empathy and respect for affected people matter as much as passion.',
      idea: [
        'Speeches on gender, caste, mental health, religion or poverty can inform and inspire — or harm through stereotypes and inaccuracies.',
        'Check facts, avoid generalisations, use respectful language, centre the voices of affected people and acknowledge complexity rather than offering simple villains.',
      ],
      drills: [
        { title: 'Responsible awareness speech', brief: 'Deliver a ninety-second awareness speech on youth mental health that is accurate, empathetic and avoids stigma.', targetSeconds: 90 },
        { title: 'Rewrite a harmful line', brief: 'Take a stereotyping sentence about any group, explain why it is harmful and deliver a respectful, accurate alternative.', targetSeconds: 60 },
      ],
      game: { name: 'Language Audit', emoji: '📝', how: ['Teams review short speech extracts on social issues.', 'They flag stigma, generalisation or inaccuracy.', 'They propose respectful replacements.'] },
      realWorld: 'Awareness campaigns, assemblies and competition speeches on social themes.',
      mentorWatchFor: ['Well-meaning stereotypes.', 'Statistics without sources.'],
      selfCheck: ['Was I accurate and respectful?', 'Did I acknowledge complexity?'],
      writePrompt: 'Write an awareness speech on a social issue, then review it for accuracy, stigma and generalisations.',
    },
  ],
};

/* Grades 10–12 · Module 8 — Your Signature Talk (five lessons; slot 48 is the showcase) */
export const SENIOR_M8: CourseModule = {
  title: 'Your Signature Talk',
  outcome: 'Build and deliver a TEDx-style signature talk with professional visuals, pressure-tested rehearsal and a feedback loop.',
  world: { name: 'Signature Stage', emoji: '✨', color: '#2563EB', tagline: 'The talk people remember you for.' },
  lessons: [
    {
      title: 'Storytelling for a TEDx-style talk',
      oneLine: 'The best idea talks are built around a journey: what you believed, what happened and what you now understand.',
      idea: [
        'A signature talk shares one idea through your experience. The narrative arc: the status quo, the moment that challenged it, the struggle or exploration, and the insight you now offer.',
        'Show, do not tell: scenes with specific details, dialogue and emotion make the audience experience the insight, not just hear it.',
      ],
      drills: [
        { title: 'Find your arc', brief: 'Describe the arc of your talk: what you believed, the moment that challenged it, what you explored and your insight.', targetSeconds: 120 },
        { title: 'Tell the key scene', brief: 'Tell the pivotal scene of your story with sensory detail and dialogue.', targetSeconds: 90 },
      ],
      game: { name: 'Scene Zoom', emoji: '🎥', how: ['A student summarises a moment in one sentence.', 'The class asks for sights, sounds, words spoken and feelings.', 'The student retells it as a vivid ninety-second scene.'] },
      realWorld: 'TEDx youth events, college essays told aloud and competition speeches.',
      mentorWatchFor: ['Stories that summarise instead of showing.', 'Insights that are clichés.'],
      selfCheck: ['Does my story lead to a clear insight?', 'Did I show a scene?'],
      writePrompt: 'Write the pivotal scene of your signature talk with specific details and dialogue.',
    },
    {
      title: 'Visuals and slides like a professional',
      oneLine: 'Professional slides are visual, minimal and choreographed with what you say.',
      idea: [
        'Professional speakers use slides as a visual amplifier: a single image, one striking number or a short phrase. Text-heavy slides compete with the speaker.',
        'Choreograph: say the setup, reveal the slide, pause for the audience to absorb it, then explain. Practise clicking at exactly the right moment.',
      ],
      drills: [
        { title: 'Slide reveal timing', brief: 'Present three imagined slides — an image, a statistic and a phrase — narrating the setup, reveal, pause and explanation for each.', targetSeconds: 120 },
        { title: 'No-slide backup', brief: 'Deliver the same section as if the projector failed, making the visuals vivid through words.', targetSeconds: 90 },
      ],
      game: { name: 'Slide Rescue', emoji: '🛟', how: ['Show a cluttered slide from a real school presentation.', 'Teams redesign it with one visual idea.', 'Present the before and after, explaining the reveal timing.'] },
      realWorld: 'Research presentations, competitions and conference-style talks.',
      mentorWatchFor: ['Reading slides.', 'Revealing a slide before setting it up.'],
      selfCheck: ['Did each slide have one idea?', 'Could I deliver without slides?'],
      writePrompt: 'Write a slide plan for your signature talk: each visual and the exact line that introduces it.',
    },
    {
      title: 'Rehearsing a high-stakes speech',
      oneLine: 'High-stakes rehearsal moves from structure to fluency to pressure — until the talk survives anything.',
      idea: [
        'Stage one: structure fluency — you can explain the talk’s flow from memory. Stage two: delivery — timing, pauses and emphasis. Stage three: pressure — a live audience, distractions and time cuts.',
        'Rehearse the first and last minutes most. They carry the most weight and the most nerves.',
      ],
      drills: [
        { title: 'Structure from memory', brief: 'Explain the flow of your signature talk section by section without notes.', targetSeconds: 90 },
        { title: 'First and last minute', brief: 'Deliver the first sixty seconds and the last sixty seconds of your talk under full performance conditions.', targetSeconds: 120 },
      ],
      game: { name: 'Pressure Test', emoji: '🧯', how: ['Students deliver their talk sections.', 'The mentor introduces distractions: noise, a time warning, an interruption.', 'The class scores composure and continuity.'] },
      realWorld: 'Preparing for finals, auditions and important public talks.',
      mentorWatchFor: ['Rehearsing only the middle.', 'Skipping pressure rehearsal.'],
      selfCheck: ['Can I deliver my opening and closing perfectly?', 'Did my talk survive distractions?'],
      writePrompt: 'Write your three-stage rehearsal schedule for your signature talk, with dates and goals.',
    },
    {
      title: 'Feedback loops: coaches, peers and recordings',
      oneLine: 'Improvement accelerates when feedback is targeted, varied and acted upon quickly.',
      idea: [
        'Use three sources: data from recordings (pace, fillers, pauses), expert feedback from mentors, and audience feedback from peers who represent your real listeners.',
        'Ask targeted questions: "Where did you lose interest?", "What was the one idea you remember?", "Which moment felt least convincing?"',
      ],
      drills: [
        { title: 'Targeted feedback request', brief: 'Deliver a ninety-second section of your talk, then ask three targeted feedback questions aloud.', targetSeconds: 90 },
        { title: 'Revise and redeliver', brief: 'Redeliver the section after applying one piece of feedback, explaining what changed.', targetSeconds: 90 },
      ],
      game: { name: 'Glow & Grow', emoji: '🌱', how: ['After each talk section, two listeners give one glow and one grow.', 'The speaker asks one targeted follow-up question.', 'The speaker commits to one change.'] },
      realWorld: 'Working with coaches, teachers and peers before competitions.',
      mentorWatchFor: ['Generic feedback questions.', 'Collecting feedback without changing anything.'],
      selfCheck: ['What did my data, mentor and peers each tell me?', 'What did I change?'],
      writePrompt: 'Write a feedback log: the feedback you received from three sources and the changes you will make.',
    },
    {
      title: 'Your TEDx-style talk, delivered',
      oneLine: 'Everything comes together: one idea, your story, evidence, visuals and delivery you have tested under pressure.',
      idea: [
        'Your signature talk is the capstone of this course: a talk you could deliver at a TEDx youth event, a competition final or an admissions showcase.',
        'On the day: follow your routine, own the first sentence, trust the structure, pause for your key lines and end with conviction.',
      ],
      drills: [
        { title: 'Full dress rehearsal', brief: 'Deliver your full signature talk under performance conditions.', targetSeconds: 240 },
        { title: 'The closing minute', brief: 'Deliver your closing minute with maximum clarity, pauses and conviction.', targetSeconds: 60 },
      ],
      game: { name: 'Dress Rehearsal', emoji: '🎭', how: ['Full performance, standing, to camera.', 'The lab records every measure.', 'The class gives one glow each — this is the one to be proud of.'] },
      realWorld: 'TEDx youth talks, competition finals and admissions showcases.',
      mentorWatchFor: ['Last-minute content changes that disrupt fluency.', 'Rushing the ending.'],
      selfCheck: ['Did I deliver my idea clearly?', 'Did my ending land?'],
      writePrompt: 'Write the final version of your signature talk outline, with your exact opening and closing lines.',
    },
  ],
};
