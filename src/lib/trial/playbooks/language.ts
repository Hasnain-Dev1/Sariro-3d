import type { Playbook } from './types';
import { close, opening, EXPERIENCE } from './shared';

/* ════════════════════════════════════════════════════════════════════════════
   English (grades 1–12)
   ════════════════════════════════════════════════════════════════════════════ */

export const englishPlaybook: Playbook = {
  subject: 'english',
  title: 'English',
  promise: 'They leave having read, written or said something better than they could at the start — and knowing exactly what made it better.',
  intake: {
    experience: EXPERIENCE('Struggles with reading or writing', 'Doing fine at school', 'Reads and writes far ahead'),
    interests: [
      { id: 'stories', label: 'Stories & books', emoji: '📚' },
      { id: 'poems', label: 'Poems & songs', emoji: '🎵' },
      { id: 'debate', label: 'Arguing a point', emoji: '🗣️' },
      { id: 'writing', label: 'Writing my own', emoji: '📝' },
      { id: 'films', label: 'Films & comics', emoji: '🎬' },
      { id: 'sounds', label: 'Pronunciation & accent', emoji: '🔤' },
    ],
    warmUps: [
      { q: 'Which word has a silent letter?', options: ['Knife', 'Kite', 'Kind'], answer: 0, explain: 'The K in knife is silent — it is only there for your eyes.' },
      { q: 'Pick the correct sentence.', options: ['Their going to the park.', 'They’re going to the park.', 'There going to the park.'], answer: 1, explain: 'They’re = they are. Their = belongs to them. There = a place.' },
      { q: 'Which ending makes “walked” end in a “t” sound?', options: ['It always adds “id”', 'After k, the -ed sounds like t', 'It is silent'], answer: 1, explain: 'After a breathy sound like k, -ed is said “t”: walkt. After t or d it is “id”: want-id.', bands: ['primary', 'middle', 'senior', 'adult'] },
      { q: '“The wind whispered through the trees.” What is this called?', options: ['A simile', 'Personification', 'Alliteration'], answer: 1, explain: 'Wind cannot whisper — giving it a human action is personification.', bands: ['middle', 'senior', 'adult'] },
      { q: 'Which word rhymes with “cat”?', options: ['Hat', 'Cut', 'Car'], answer: 0, explain: 'Cat and hat share the same ending sound: -at.', bands: ['foundation'] },
    ],
  },
  opening: opening('Ask: “What is the last story you loved — a book, a film, a game?” Ask them to tell you the best bit in three sentences. You now have a speaking and structure sample.'),
  diagnose: [
    { ask: 'Ask them to read two sentences at their grade aloud, then say what they mean.', listenFor: [{ answer: 'Hesitant decoding, meaning lost', means: 'new' }, { answer: 'Reads fluently, gets the literal meaning', means: 'some' }, { answer: 'Reads with expression and spots tone or an implied meaning', means: 'strong' }] },
    { ask: '“Write one sentence about your morning — make it interesting.” (Give 60 seconds.)', listenFor: [{ answer: 'A short plain sentence with errors', means: 'new' }, { answer: 'A correct sentence with some detail', means: 'some' }, { answer: 'Varied structure, a vivid word, maybe a clause', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'sound-it-out', name: 'Sound it out', forWho: 'Young readers building phonics and confidence.', levels: ['new', 'some'], bands: ['foundation'], interests: ['stories', 'sounds'],
      win: 'I read tricky words by breaking them into sounds — and found the letters that do not make a sound.',
      tools: [{ label: 'Sound Lab', soundLab: ['silent', 'oo'] }],
      steps: [
        { minutes: 5, title: 'Sound buttons', do: ['Write cat, ship, rain. Put a dot under each sound; the child taps and blends.'] },
        { minutes: 6, title: 'The sneaky letters', do: ['Open the Sound Lab on “silent letters”. Hear knife, write, lamb; play the sort game together.'], check: 'They spot the silent letter in a new word.' },
        { minutes: 6, title: 'Read a mini story', do: ['A four-sentence story with 3 target words. They read, you praise specific decoding.'] },
      ],
      ifStuck: ['Only three-letter words and one digraph (sh).'],
      ifFlying: ['Split digraphs (cake, bike). Make up a silly sentence using only “oo” words.'],
      showOff: 'The child reads the mini story to the parent, pointing at a silent letter.',
    },
    {
      id: 'story-six', name: 'A story in six sentences', forWho: 'Children who like stories and want to write their own.', levels: ['new', 'some'], bands: ['foundation', 'primary'], interests: ['stories', 'writing', 'films'],
      win: 'I wrote a story with a beginning, a problem and an ending — and made one sentence brilliant.',
      steps: [
        { minutes: 4, title: 'Story spine', do: ['Once upon a time… Every day… Until one day… Because of that… Until finally… Ever since then…'] },
        { minutes: 8, title: 'Write it', do: ['They fill the spine with a character they invent. You type or they write.'], check: 'All six parts done.' },
        { minutes: 5, title: 'Make it shine', do: ['Pick one sentence. Swap a boring word (went, nice) for a vivid one; add a sound or a smell.'] },
      ],
      ifStuck: ['Say it aloud first; you scribe. Three sentences are fine.'],
      ifFlying: ['Add dialogue with correct punctuation. Start with the problem instead of “Once upon a time”.'],
      showOff: 'The child reads their story aloud to the parent with expression.',
    },
    {
      id: 'headline-fix', name: 'Fix the headline', forWho: 'Children ready for grammar that does not feel like grammar.', levels: ['some'], bands: ['primary', 'middle'], interests: ['films', 'writing'],
      win: 'I found and fixed the mistakes in funny news headlines — and know the rule behind each.',
      steps: [
        { minutes: 5, title: 'Silly headlines', do: ['Show 5 made-up headlines with errors: “Dog eats it’s homework”, “Their going to space”.'] },
        { minutes: 7, title: 'Detectives', do: ['Find the error, fix it, name the rule in their own words.'], check: 'At least 3 fixes with a correct rule.' },
        { minutes: 5, title: 'Write their own', do: ['They write a headline for their own day — you check it.'] },
      ],
      ifStuck: ['Only its/it’s and their/there/they’re.'],
      ifFlying: ['Ambiguous headlines (“Kids make nutritious snacks”) — fix by changing the structure.'],
      showOff: 'The child challenges the parent to find the mistake in one headline.',
    },
    {
      id: 'persuade-principal', name: 'Convince the principal', forWho: 'Older students who like to argue a point.', levels: ['some', 'strong'], bands: ['middle', 'senior', 'adult'], interests: ['debate', 'writing'],
      win: 'I wrote a persuasive paragraph that uses evidence, a counter-argument and a strong ending.',
      steps: [
        { minutes: 4, title: 'Pick a cause', do: ['Longer lunch, no homework on Fridays, a school pet. They pick.'] },
        { minutes: 8, title: 'PEEL paragraph', do: ['Point, Evidence, Explain, Link. Then add “Some people say… however…”.'], check: 'Each PEEL part present.' },
        { minutes: 5, title: 'Sharpen', do: ['Cut every weak word (maybe, kind of, really). Add one rhetorical question.'] },
      ],
      ifStuck: ['Only Point and Evidence, said aloud before writing.'],
      ifFlying: ['Emotive language vs manipulation — where is the line? Rewrite for a different audience.'],
      showOff: 'The child reads the paragraph as if to the principal; the parent decides if they are convinced.',
    },
    {
      id: 'poetry-rhythm', name: 'Hear the rhythm', forWho: 'Students who like music, poems or lyrics.', levels: ['some', 'strong'], bands: ['middle', 'senior'], interests: ['poems'],
      win: 'I found the rhythm and techniques in a poem and wrote four lines that use them.',
      steps: [
        { minutes: 5, title: 'Clap it', do: ['A short public-domain poem (e.g. Stevenson’s “From a Railway Carriage”). Clap the beats. Why does it sound like a train?'] },
        { minutes: 6, title: 'Name the tricks', do: ['Rhyme, repetition, alliteration, onomatopoeia — find each.'], check: 'They find two without help.' },
        { minutes: 6, title: 'Write four lines', do: ['A poem about something that moves — a bike, the rain — using a steady beat and one technique.'] },
      ],
      ifStuck: ['Only rhyme and beat.'],
      ifFlying: ['Iambic rhythm: da-DUM. Why do songs and speeches use it?'],
      showOff: 'The child performs their four lines with the beat.',
    },
    {
      id: 'spellings-that-lie', name: 'Spellings that lie', forWho: 'Any student whose pronunciation or spelling trips them up — especially when reading aloud.', levels: ['new', 'some', 'strong'], bands: ['primary', 'middle', 'senior', 'adult'], interests: ['sounds'],
      win: 'I learned why Q, -ed and TH each have more than one sound — and can say them correctly in real sentences.',
      tools: [{ label: 'Sound Lab', soundLab: ['q', 'ed', 'th'] }],
      steps: [
        { minutes: 5, title: 'The Q mystery', do: ['Say queen, antique, queue. Ask: same letter, same sound? Open the Sound Lab on Q and hear all three.'] },
        { minutes: 7, title: 'Sort it', do: ['Play the sort game on -ed together, then alone. Teach the rule: t/d → “id”.'], check: 'Silver or gold on their own round.' },
        { minutes: 5, title: 'Real life', do: ['“Real life” tab: they read two sentences aloud; correct only the target sounds.'] },
      ],
      ifStuck: ['Only Q — hear, repeat, sort once.'],
      ifFlying: ['TH three ways (think, this, Thailand) and V vs W minimal pairs.'],
      showOff: 'The child teaches the parent the three sounds of Q.',
    },
  ],
  close: close('The child reads aloud or shows what they wrote, then names the one thing that made it better.'),
  parentTalk: {
    new: 'Reading and writing are hard work for them right now, but today they decoded and wrote more than they expected with the right steps. The course builds that confidence steadily, one skill at a time.',
    some: 'They are doing well at school and improved a piece of writing noticeably in one class once they knew what to look for. The course sharpens that into real fluency.',
    strong: 'They read and write well beyond their grade. They need challenging texts, sharper writing and speaking — the course would push their craft, not repeat grammar.',
  },
  avoid: ['Correcting every error — pick the one that matters most.', 'Reading the text for them.', 'Worksheets. Everything should end in something they read, wrote or said.'],
};

/* ════════════════════════════════════════════════════════════════════════════
   Public Speaking (any age)
   ════════════════════════════════════════════════════════════════════════════ */

export const speakingPlaybook: Playbook = {
  subject: 'public-speaking',
  title: 'Public Speaking',
  promise: 'They leave having heard themselves get better in thirty minutes — measured, not just told.',
  intake: {
    experience: EXPERIENCE('Very shy about speaking', 'Talks fine, gets nervous in front of people', 'Already confident on stage'),
    interests: [
      { id: 'confidence', label: 'Confidence', emoji: '💪' },
      { id: 'stories', label: 'Telling stories', emoji: '📖' },
      { id: 'debate', label: 'Debating', emoji: '🗣️' },
      { id: 'interviews', label: 'Interviews', emoji: '💼' },
      { id: 'presenting', label: 'Presenting at school', emoji: '📊' },
      { id: 'accent', label: 'Pronunciation & accent', emoji: '🔤' },
    ],
    warmUps: [
      { q: 'Your mind goes blank mid-speech. The best move?', options: ['Say “um” until it comes back', 'Pause, breathe, repeat your last point', 'Apologise and sit down'], answer: 1, explain: 'A pause looks like thinking. Repeating your last point buys time and usually brings the next one back.' },
      { q: 'How does the Q sound in “antique”?', options: ['kw', 'k', 'kyoo'], answer: 1, explain: 'Just “k”. Q has three sounds: queen (kw), antique (k) and queue (kyoo).' },
      { q: 'A good speaking pace for a talk is about…', options: ['80 words a minute', '140 words a minute', '220 words a minute'], answer: 1, explain: 'Around 120–165 words a minute is easy to follow. Nerves usually push people well above it.' },
      { q: 'Which opening grabs attention best?', options: ['“Hello, my name is… and today I will talk about…”', '“Have you ever wondered why…?”', '“Sorry, I am a bit nervous.”'], answer: 1, explain: 'A question pulls the audience in. The other two waste your most valuable ten seconds.' },
    ],
  },
  opening: opening('Ask them to tell you about their favourite food for 20 seconds — with the camera on. Do not comment yet; that is the “before” recording.', ['Open the Voice Check (below) on your screen so the family can see the measurements live.']),
  diagnose: [
    { ask: 'Listen to the 20-second answer. How did it sound?', listenFor: [{ answer: 'Whispered, very short, looked away', means: 'new' }, { answer: 'Clear but rushed, several “um”s, flat voice', means: 'some' }, { answer: 'Steady pace, few fillers, some expression', means: 'strong' }] },
    { ask: '“When do you speak in front of people, and how does it feel?”', listenFor: [{ answer: 'Avoids it, or “scary”', means: 'new' }, { answer: 'Sometimes at school, nervous', means: 'some' }, { answer: 'Debates, assemblies, enjoys it', means: 'strong' }] },
  ],
  paths: [
    {
      id: 'voice-check-fix', name: 'Measure it, fix one thing, measure again', forWho: 'Anyone — the fastest visible improvement in a single class.', levels: ['new', 'some'], bands: ['foundation', 'primary', 'middle', 'senior', 'adult'], interests: ['confidence', 'presenting'],
      win: 'My filler words went down (or my pace became steady) in one class — and I saw the numbers.',
      tools: [{ label: 'Sariro Voice Check', href: '/voice-check' }],
      steps: [
        { minutes: 5, title: 'The baseline', do: ['Voice Check: they speak for 60 seconds on a topic card. Screen-share the live meters: pace dial, “um” counter.'], check: 'A baseline report saved.' },
        { minutes: 6, title: 'One fix', do: ['Pick the single worst number. Fillers → “close your mouth instead of um”. Pace → “breathe at every full stop”.', 'Practise that one fix on three short sentences.'], say: 'We are only fixing one thing. Great speakers improved one thing at a time.' },
        { minutes: 6, title: 'The after', do: ['Same topic, 60 seconds. Put both reports side by side and let THEM read the difference.'], check: 'The chosen number improved.' },
      ],
      ifStuck: ['30 seconds instead of 60, and a topic they love (a game, a pet).'],
      ifFlying: ['Fix a second thing: pitch variation — say one sentence with five different emphases.'],
      showOff: 'The child shows the parent the before-and-after numbers and explains the one fix.',
    },
    {
      id: 'three-sounds-of-q', name: 'Q has three sounds', forWho: 'Anyone curious about pronunciation — a fun, surprising first class.', levels: ['new', 'some', 'strong'], bands: ['primary', 'middle', 'senior', 'adult'], interests: ['accent'],
      win: 'I discovered Q, -ed and TH each have several sounds, beat the sort game, and said real sentences right.',
      tools: [{ label: 'Sound Lab', soundLab: ['q', 'ed', 'th', 'v-w'] }],
      steps: [
        { minutes: 4, title: 'The surprise', do: ['“Say queen, antique and queue.” Ask what the Q does each time. Open the Sound Lab on Q.'] },
        { minutes: 6, title: 'The game', do: ['Sort game on Q, then -ed. Hear each word in British, American and Indian voices.'], check: 'Silver or gold on at least one pattern.' },
        { minutes: 6, title: 'Real life', do: ['“Is this the queue for tickets, or do I scan the QR code?” — they say it, you coach only the target sounds.', 'Twister: “Queen Quinn quickly queued for quiche.”'] },
      ],
      ifStuck: ['Only Q, with lots of hearing and repeating.'],
      ifFlying: ['V vs W minimal pairs (vest/west) and the TH that sounds like T (Thailand).'],
      showOff: 'The child challenges the parent to say “antique queue” correctly.',
    },
    {
      id: 'show-and-tell', name: 'Show and tell, with a pause', forWho: 'Shy younger children.', levels: ['new'], bands: ['foundation', 'primary'], interests: ['confidence', 'stories'],
      win: 'I talked about my favourite thing for a whole minute — loudly, with a pause.',
      steps: [
        { minutes: 4, title: 'The object', do: ['They fetch a favourite toy or object. Three questions: what is it, where did it come from, why do you love it?'] },
        { minutes: 6, title: 'The big voice', do: ['Say the first sentence in a mouse voice, a normal voice, a “reach the back of the room” voice. Keep the last one.', 'Add one pause after “And the best thing about it is…”.'] },
        { minutes: 6, title: 'Perform', do: ['One minute, camera on, standing up. Lots of genuine praise for one specific thing.'], check: 'They finish without stopping.' },
      ],
      ifStuck: ['30 seconds, sitting down, answering your questions.'],
      ifFlying: ['Add a question to the audience at the start: “Have you ever seen one of these?”.'],
      showOff: 'The child does the show-and-tell for the parent.',
    },
    {
      id: 'story-spine-speech', name: 'A story that lands', forWho: 'Children who love stories and are ready for structure.', levels: ['some'], bands: ['primary', 'middle', 'senior'], interests: ['stories'],
      win: 'I told a 90-second story with a real beginning, a twist and an ending people remembered.',
      steps: [
        { minutes: 4, title: 'Find the story', do: ['“Tell me about a time something went wrong — and then got better.”'] },
        { minutes: 6, title: 'Setup, turn, resolution', do: ['Shape it into three parts. Zoom into one moment with a sound or a feeling.'] },
        { minutes: 7, title: 'Tell it twice', do: ['Tell it once. Coach one thing (a pause before the turn). Tell it again.'], check: 'The second telling has the pause and is under 90 seconds.' },
      ],
      ifStuck: ['Ask questions that pull the story out; they answer, then retell.'],
      ifFlying: ['A callback: an early detail that returns in the last line.'],
      showOff: 'The child tells the story to the parent.',
    },
    {
      id: 'mini-debate', name: 'Two sides in five minutes', forWho: 'Students who love arguing a point.', levels: ['some', 'strong'], bands: ['middle', 'senior', 'adult'], interests: ['debate'],
      win: 'I argued a side with a clear structure — and answered an objection on the spot.',
      steps: [
        { minutes: 4, title: 'PREP', do: ['Point, Reason, Example, Point. Motion: “Homework should be optional.”'] },
        { minutes: 6, title: 'Argue it', do: ['60 seconds for their side. You argue back for 30.'] },
        { minutes: 7, title: 'The rebuttal', do: ['Teach “That is fair, and…”. They answer your objection in one sentence. Then switch sides.'], check: 'They argue the side they disagree with.' },
      ],
      ifStuck: ['Only PREP on a fun topic (cats vs dogs).'],
      ifFlying: ['Rhetorical devices: rule of three and contrast in the closing line.'],
      showOff: 'The parent picks a side; the child argues against them in 60 seconds.',
    },
    {
      id: 'interview-hot-seat', name: 'The hot seat', forWho: 'Teens and adults preparing for interviews or admissions.', levels: ['some', 'strong'], bands: ['senior', 'adult'], interests: ['interviews'],
      win: 'I answered three real interview questions with STAR answers and a confident opening.',
      steps: [
        { minutes: 4, title: 'The first 30 seconds', do: ['“Tell me about yourself” in three parts: now, before, next. No list of hobbies.'] },
        { minutes: 7, title: 'STAR answers', do: ['“A problem you solved”: Situation, Task, Action, Result. Record it in Voice Check; look at pace and fillers.'], check: 'All four STAR parts, under 90 seconds.' },
        { minutes: 6, title: 'The curveball', do: ['An unexpected question. Teach the bridge: “That is a great question — what I can tell you is…”.'] },
      ],
      ifStuck: ['Only “tell me about yourself”, rehearsed twice.'],
      ifFlying: ['A weakness question answered honestly with what they are doing about it.'],
      showOff: 'The parent asks one interview question; the child answers with STAR.',
    },
  ],
  close: close('The child gives a 30-second version of what they worked on for the parent — the “after” performance.'),
  parentTalk: {
    new: 'Speaking up is hard for them right now, and today they spoke for a full minute and improved measurably. Confidence here is built by repetition in a small group — exactly what the course does.',
    some: 'They talk well but nerves show up as speed and filler words. In one class we cut that down and they saw the numbers change. The course turns that into a habit.',
    strong: 'They are already confident. What they need is craft — structure, persuasion, stories, handling questions — which is where the course takes them.',
  },
  avoid: ['Criticising in front of the parent. Praise out loud, coach one thing at a time.', 'Long explanations — they should be speaking for most of the class.', 'Mocking an accent. Sound Lab teaches clarity, never “proper” voices.'],
};
