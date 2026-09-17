import type { CourseModule } from '../types';

/* Grades 7–9 · Voice and Presence — taught as module 2 (see index.ts) */
export const MIDDLE_M1: CourseModule = {
  title: 'Voice and Presence',
  outcome: 'Know how you actually come across, and control pace, pauses, clarity, body language and filler words.',
  world: { name: 'Signal Studio', emoji: '🎧', color: '#7C3AED', tagline: 'Turn up the signal, cut the noise.' },
  lessons: [
    {
      title: 'Your voice, measured',
      oneLine: 'You cannot improve what you have not measured — so hear your voice the way others hear it.',
      idea: [
        'Most people have never heard themselves speak the way others hear them. A measured recording shows your real pace, fillers, volume and presence — not what you imagine.',
        'The rest of this course asks you to structure talks, debate, persuade and go on camera. Today’s recording is the voice you will compare everything against.',
      ],
      drills: [
        { title: 'Measured: who I am', brief: 'Speak for sixty seconds: who you are, what you are into and one thing you want to be able to do as a speaker by the end of this course.', targetSeconds: 60 },
        { title: 'Measured: an opinion', brief: 'Give your honest opinion on "Should phones be allowed in class?" for sixty seconds, unplanned.', targetSeconds: 60 },
      ],
      game: { name: 'Before & After Duel', emoji: '⚔️', how: ['Everyone records a thirty-second baseline, no tips.', 'The mentor teaches three quick fixes: breathe, pause, look up.', 'Record again — the class compares scores and cheers the biggest jump.'] },
      realWorld: 'The first day at a new school, a new coaching class or a new team.',
      mentorWatchFor: ['Students dismissing the baseline as "cringe".', 'Very short baselines hiding a lack of confidence.'],
      selfCheck: ['What does my baseline show about my pace and fillers?', 'What is my one goal for this course?'],
      writePrompt: 'Write your speaking goals for this course: where you want to be able to speak confidently, and what holds you back now.',
    },
    {
      title: 'Pace, pitch and the power of the pause',
      oneLine: 'Pausing on purpose makes you sound confident; rushing and a flat pitch make you sound nervous or bored.',
      idea: [
        'Nervous speakers rush to get it over with. Listeners need a pause after an important point to process it. A pause feels long to you but sounds confident to them.',
        'Pitch variety stops you sounding monotone. Let your voice rise for questions and excitement, and drop for conclusions and serious points.',
      ],
      model: { text: 'We had three days. (pause) Three days to build a working robot. (pause) Nobody thought we could do it. (pause) We did it in two.', noticing: ['Short sentences with space around them.', 'The pause before the surprise.', 'The last line lands because of the silence before it.'] },
      drills: [
        { title: 'Pause for effect', brief: 'Read this with deliberate pauses after each key idea.', passage: 'Every year, millions of tonnes of plastic enter the ocean. Some of it breaks into pieces too small to see. Fish eat it. Birds eat it. And eventually, so do we. The question is not whether this affects us. The question is what we are going to do about it.', targetSeconds: 35 },
        { title: 'Monotone to alive', brief: 'Describe your ideal weekend twice: once in a flat monotone, once with real pitch variety and pauses. Record the second.', targetSeconds: 45 },
      ],
      game: { name: 'Pause Poker', emoji: '🃏', how: ['Everyone starts with five imaginary chips.', 'Read a passage: every deliberate pause wins a chip, every "um" loses one.', 'The highest chip count reads for the class.'] },
      realWorld: 'Answering in class without racing, and delivering the key line of a presentation.',
      mentorWatchFor: ['Pauses filled with "um".', 'Uptalk — every sentence ending like a question.'],
      selfCheck: ['Did I pause after key points?', 'Did my pitch move, or stay flat?'],
      soundLab: ['stress'],
      writePrompt: 'Write a short paragraph about something you care about and mark where you will pause and which words you will stress.',
    },
    {
      title: 'Stop mumbling: articulation that carries',
      oneLine: 'Clear speech is not about accent — it is about finishing your words so they reach the back of the room.',
      idea: [
        'Mumbling happens when your jaw barely moves and word endings disappear. It makes you sound unsure even when you know your stuff.',
        'Open your mouth more than feels natural, hit your consonants and finish every word. Your accent is fine — clarity is the goal, not sounding like someone else.',
      ],
      drills: [
        { title: 'Articulation workout', brief: 'Say these three times each, getting faster but staying crisp.', passage: 'Unique New York. Red leather, yellow leather. Toy boat, toy boat, toy boat. The tip of the tongue, the teeth, the lips.', targetSeconds: 25 },
        { title: 'Clear under speed', brief: 'Read this at a natural pace, making every ending clear.', passage: 'The results surprised everyone. Students who slept eight hours scored higher, remembered more and reported feeling less stressed than those who stayed up late revising. The experiment suggested that rest is not wasted time. It is part of learning.', targetSeconds: 30 },
      ],
      game: { name: 'Back Row Test', emoji: '📢', how: ['A student reads a sentence from the front at normal volume.', 'Students at the back write down exactly what they heard.', 'Compare — every lost word is a clarity fix.'] },
      realWorld: 'Online classes, where bad audio makes mumbling even worse.',
      mentorWatchFor: ['Students mistaking clarity for changing their accent.', 'Dropped final consonants.'],
      selfCheck: ['Did the lab hear my words correctly?', 'Did I open my mouth enough?'],
      soundLab: ['th', 'ed'],
      writePrompt: 'Write five sentences packed with words you find hard to say clearly, then practise them.',
    },
    {
      title: 'Body language that says "I’ve got this"',
      oneLine: 'Your body speaks before you do — slouching, fidgeting and hiding your hands undercut your words.',
      idea: [
        'Teen body language habits: arms crossed, hands in pockets, swaying, hair touching, staring at the floor. Each one signals "I don’t want to be here."',
        'Try this instead: feet grounded hip-width apart, shoulders relaxed, hands free to gesture, eyes on people. It will feel awkward for a week, then normal.',
      ],
      drills: [
        { title: 'Grounded and open', brief: 'Stand grounded with open hands and explain your favourite game, app or show for sixty seconds. Watch the recording for fidgets.', targetSeconds: 60 },
        { title: 'Gesture with meaning', brief: 'Explain the difference between a small problem and a huge one using gestures that match what you say.', targetSeconds: 45 },
      ],
      game: { name: 'Statue Challenge', emoji: '🗿', how: ['A student talks for thirty seconds.', 'A partner counts every sway, shuffle or fidget.', 'Beat your own count on the second try.'] },
      realWorld: 'Standing in front of the class for a presentation or walking into an interview for a school role.',
      mentorWatchFor: ['Arms crossed or hands hidden.', 'Performing confidence so much it looks fake.'],
      selfCheck: ['How many fidgets did I count?', 'Did my gestures match my words?'],
      writePrompt: 'Write down your three biggest body language habits when nervous and what you will do instead.',
    },
    {
      title: 'Cutting "um", "like" and "basically"',
      oneLine: 'Filler words make you sound less sure — replacing them with a silent pause instantly sounds smarter.',
      idea: [
        '"Um", "like", "basically", "you know" and "literally" fill gaps while your brain catches up. A few are normal; dozens distract.',
        'The fix is not willpower. It is awareness plus a replacement: when you feel a filler coming, close your mouth and pause instead.',
      ],
      drills: [
        { title: 'Filler count', brief: 'Talk for sixty seconds about the best trip you have been on. Check your filler count in the report.', targetSeconds: 60 },
        { title: 'Pause instead', brief: 'Repeat the same talk, replacing every filler with a silent pause. Compare the two filler counts.', targetSeconds: 60 },
      ],
      game: { name: 'Filler Buzzer', emoji: '🔔', how: ['A student speaks on a topic for forty-five seconds.', 'Listeners buzz (tap the desk) on every filler.', 'Three buzzes and the next person takes over the same topic.'] },
      realWorld: 'Class presentations, voice notes and answering questions in a group discussion.',
      mentorWatchFor: ['Students replacing "um" with "so" or "like".', 'Speaking in a stiff, robotic way to avoid fillers.'],
      selfCheck: ['How many fillers per minute did the lab count?', 'Did pauses replace them?'],
      writePrompt: 'Write your top three filler words and describe exactly when you use them most.',
    },
    {
      title: 'Watching yourself back without cringing',
      oneLine: 'Everyone cringes at their own recording — the trick is to watch like a coach, not a critic.',
      idea: [
        'Hearing your recorded voice feels strange because you normally hear yourself through your own skull. Everyone experiences this.',
        'Watch in three passes: sound off (body language), eyes closed (voice), then full. Note one strength and one thing to change. Then record again.',
      ],
      drills: [
        { title: 'Coach’s review', brief: 'Record a sixty-second talk on a hobby. Review it in three passes and describe your strength and your fix out loud.', targetSeconds: 60 },
        { title: 'Round two', brief: 'Record the same talk again, fixing only the one thing you chose.', targetSeconds: 60 },
      ],
      game: { name: 'Three-Pass Review', emoji: '📹', how: ['Pairs swap recordings (with permission).', 'Review with sound off, eyes closed, then full.', 'Give one specific strength and one fix for each pass.'] },
      realWorld: 'Improving before a big presentation, audition or competition.',
      mentorWatchFor: ['Harsh self-talk — insist on a strength first.', 'Trying to fix everything at once.'],
      selfCheck: ['What is my one fix?', 'Was round two better on that one thing?'],
      writePrompt: 'Write a coach’s review of your recording: one strength, one fix and how you will practise the fix.',
    },
  ],
};

/* Grades 7–9 · Confidence Under Pressure — taught as module 1 */
export const MIDDLE_M2: CourseModule = {
  title: 'Confidence Under Pressure',
  outcome: 'Deal with the fear of being judged, prepare so fear shrinks, recover from a blank mind and speak up in class.',
  world: { name: 'Pressure Point', emoji: '🌋', color: '#DC2626', tagline: 'Speak up even when it feels risky.' },
  lessons: [
    {
      title: 'The fear of being judged',
      oneLine: 'Most people are far too busy worrying about themselves to judge you as harshly as you imagine.',
      idea: [
        'The "spotlight effect" is a real finding: we believe others notice our mistakes far more than they do. The audience forgets your stumble within minutes.',
        'Fear of judgement is strongest in the teenage years because your brain is extra sensitive to social status. Knowing that helps: the fear is normal, not a sign you are bad at this.',
      ],
      drills: [
        { title: 'Baseline: name the fear', brief: 'Your first recording — your "before". Speak for sixty seconds about what you think people will think when you speak in public, and whether that has ever actually happened.', targetSeconds: 60 },
        { title: 'Talk to a younger you', brief: 'Give advice to a younger student who is scared of being laughed at when they speak.', targetSeconds: 60 },
      ],
      game: { name: 'Spotlight Test', emoji: '🔦', how: ['A student makes a small deliberate mistake while talking (a wrong word, a pause).', 'Afterwards, ask the class what they noticed.', 'Usually almost nobody noticed — discuss the spotlight effect.'] },
      realWorld: 'Speaking in front of classmates you want to impress.',
      mentorWatchFor: ['Students dismissing the fear to seem cool.', 'Genuine anxiety that needs a quieter first step.'],
      selfCheck: ['What am I actually afraid will happen?', 'Has it ever really happened?'],
      writePrompt: 'Write about the worst thing you imagine happening when you speak, and what realistically would happen.',
    },
    {
      title: 'Preparation that shrinks fear',
      oneLine: 'Fear shrinks when you know your opening cold, your structure clearly and your ending by heart.',
      idea: [
        'Most speaking fear is fear of the unknown. Reduce the unknowns: memorise your first two sentences and your last one, and know your three points by keyword.',
        'Rehearse out loud at least three times, once standing, once to someone and once recording. Silent reading does not count.',
      ],
      drills: [
        { title: 'Opening and closing cold', brief: 'Choose a topic for a two-minute talk. Deliver only your memorised opening and closing lines, word-perfect.', targetSeconds: 30 },
        { title: 'Full rehearsal', brief: 'Deliver the full talk from keywords only, standing, as if in class.', targetSeconds: 120 },
      ],
      game: { name: 'Skeleton Speed Round', emoji: '🦴', how: ['Draw a random topic card.', 'In thirty seconds say only: first line, three points, last line.', 'The class holds up a finger for each part they heard.'] },
      realWorld: 'Preparing for a class presentation, speech competition or school event.',
      mentorWatchFor: ['Memorising entire scripts word for word.', 'Rehearsing only silently.'],
      selfCheck: ['Do I know my opening and closing by heart?', 'Did I rehearse out loud?'],
      writePrompt: 'Write your rehearsal plan for your next presentation, including your first two sentences and your last sentence.',
    },
    {
      title: 'When your mind goes blank',
      oneLine: 'A blank mind is survivable: pause, breathe, repeat your last point and use a bridge phrase.',
      idea: [
        'When stress spikes, your memory can freeze for a second. The worst move is panicking out loud. The best move is a calm pause — the audience sees thoughtfulness, not failure.',
        'Recovery tools: repeat your last sentence in other words, glance at your keywords, or bridge: "What this really comes down to is…"',
      ],
      drills: [
        { title: 'Freeze rescue', brief: 'Talk about a subject you study. Stop mid-sentence on purpose, count three, use a bridge phrase and continue.', targetSeconds: 60 },
        { title: 'Lost the thread', brief: 'Talk about your favourite film, deliberately jump off topic, then bring yourself back with "Coming back to my main point…"', targetSeconds: 60 },
      ],
      game: { name: 'Freeze Rescue', emoji: '🥶', how: ['Everyone gets a rescue line.', 'Mid-talk, the mentor shouts "Freeze!" and counts to three.', 'The speaker uses the rescue line and carries on.'] },
      realWorld: 'Forgetting a line in a speech or losing your answer in an oral test.',
      mentorWatchFor: ['Nervous laughter and "sorry, sorry".', 'Starting the whole talk again from the beginning.'],
      selfCheck: ['Did I stay calm during the pause?', 'Which recovery tool worked for me?'],
      writePrompt: 'Write three bridge phrases and describe a time your mind went blank and how you could have recovered.',
    },
    {
      title: 'Getting a word in: speaking up early',
      oneLine: 'Speaking early in a discussion is easier than waiting — the longer you wait, the harder it gets.',
      idea: [
        'In class discussions, the pressure grows with every minute you stay silent. Aim to contribute within the first few minutes, even with a small point.',
        'Easy entries: agree and add ("I agree, and another example is…"), ask a question, or summarise ("So far we’ve said…").',
      ],
      drills: [
        { title: 'Agree and add', brief: 'Your class is discussing "Should school start later?" Make three short contributions: agree and add, ask a question, and summarise.', targetSeconds: 60 },
        { title: 'Early entry', brief: 'Open a discussion on "Is it fair to have school uniforms?" with a clear view and one reason in under thirty seconds.', targetSeconds: 30 },
      ],
      game: { name: 'Two-Minute Rule', emoji: '⏱️', how: ['Start a class discussion.', 'Every student must contribute once within the first two minutes.', 'The mentor tracks entries — celebrate the quick ones.'] },
      realWorld: 'Class discussions, group projects and team meetings for clubs.',
      mentorWatchFor: ['Students who always wait until the end.', 'Students who dominate — encourage them to invite others.'],
      selfCheck: ['Did I speak early?', 'Which entry type did I use?'],
      writePrompt: 'Write three contributions you could make in a class discussion about social media use, using different entry types.',
    },
    {
      title: 'Handling laughter, whispers and awkward moments',
      oneLine: 'Awkward moments lose their power when you acknowledge them lightly and keep going.',
      idea: [
        'A voice cracks, someone laughs, a friend whispers, the projector dies. What the audience remembers is how you reacted.',
        'Light acknowledgement works: a smile, "Well, that was dramatic," then back to your point. Do not argue, over-apologise or freeze.',
      ],
      drills: [
        { title: 'Keep your cool', brief: 'Give a sixty-second talk. Imagine three interruptions — laughter, a phone ringing, your slide failing — and handle each with one calm line.', targetSeconds: 60 },
        { title: 'The comeback line', brief: 'Practise three light, kind comeback lines for awkward moments and use one in a short talk.', targetSeconds: 45 },
      ],
      game: { name: 'Chaos Cards', emoji: '🌀', how: ['A student gives a talk.', 'The mentor plays a chaos card: a cough fit, the lights go off, someone laughs.', 'The class scores the recovery for calm and kindness.'] },
      realWorld: 'When something goes wrong in a presentation or a classmate laughs mid-speech.',
      mentorWatchFor: ['Comebacks that are mean.', 'Losing composure and stopping the talk.'],
      selfCheck: ['Did I stay calm?', 'Was my comeback light and kind?'],
      writePrompt: 'Write about an awkward moment you have seen during a presentation and how the speaker could have handled it.',
    },
    {
      title: 'Building a confidence streak',
      oneLine: 'Confidence is built by small, repeated wins — not one big brave moment.',
      idea: [
        'Confidence follows action, not the other way round. Each time you speak and survive, your brain updates: "That was fine."',
        'Build a streak: one small speaking challenge every day for a week — answer a question, voice a note, ask a shop assistant for help, share an opinion at dinner.',
      ],
      drills: [
        { title: 'My challenge ladder', brief: 'Describe a seven-day speaking challenge ladder for yourself, from easiest to hardest, and why each step matters.', targetSeconds: 60 },
        { title: 'Day one', brief: 'Complete day one right now: give a sixty-second opinion on a topic you care about, straight to camera.', targetSeconds: 60 },
      ],
      game: { name: 'Three Takes', emoji: '🎬', how: ['Everyone records the same forty-five-second talk.', 'Immediately again, and a third time.', 'Put the three scores side by side — confidence is a graph that goes up.'] },
      realWorld: 'Getting comfortable enough to volunteer for school roles and competitions.',
      mentorWatchFor: ['Ladders that start too hard.', 'Students skipping days — encourage restarting, not quitting.'],
      selfCheck: ['What is my next step on the ladder?', 'Did I complete today’s challenge?'],
      writePrompt: 'Write your seven-day speaking challenge ladder and tick off each day as you complete it.',
    },
  ],
};
