/**
 * SARIRO — Voice Quest: the class game for every level
 * ============================================================================
 * A public speaking class where the teacher explains and the children take
 * turns is the class every competitor sells, and it is the one children drop.
 * What children remember — and come back for — is the game: the buzzer every
 * time somebody says "um", the chip you win for a pause, the curveball card
 * flashed in the middle of your talk.
 *
 * So every lesson has one. Each is a real in-class activity (a mentor can run
 * it from these three steps), and each is tied to a moment in the real world
 * where the skill is actually needed — because "this is for your interview"
 * is a reason, and "this is lesson 37" is not.
 *
 * Keyed by the lesson's course number. Slots 24 and 48 are the showcases
 * (worlds.ts), so they have none. quest.test.ts checks every written lesson
 * has a game and no game points at a lesson that does not exist.
 */

export interface ArenaGame {
  name: string;
  emoji: string;
  /** How to run it, in class, in three steps. */
  how: [string, string, string];
  /** Where this skill is needed outside the classroom. */
  realWorld: string;
}

export const ARENA: Record<number, ArenaGame> = {
  // ── World 1 · Voice Valley ────────────────────────────────────────────────
  1: { name: 'Before & After Duel', emoji: '⚔️', how: ['Everyone records a 30-second “about me” in the first five minutes — no tips yet.', 'Teach the lesson.', 'Record it again at the end and put both scores side by side. The class cheers the biggest jump.'], realWorld: 'Introducing yourself on the first day at a new school or club.' },
  2: { name: 'Boring vs Brilliant', emoji: '😴', how: ['The mentor reads a deliberately dull 30-second talk.', 'In pairs, children fix it: add a question, a surprise or a picture in words.', 'Each pair performs; the class votes with thumbs.'], realWorld: 'Getting your friends to actually listen to your weekend story.' },
  3: { name: 'Friend or Robot?', emoji: '🤖', how: ['Each child says the same sentence three ways: as a robot, as a news anchor, and to their best friend.', 'The class guesses which version was “to a friend”.', 'Record the friend version — that is the voice the course builds on.'], realWorld: 'Explaining the rules of a game to a younger cousin.' },
  4: { name: 'Pause Poker', emoji: '🃏', how: ['Every child starts with five imaginary chips.', 'Read the passage: each deliberate pause wins a chip, each “um” loses one.', 'Highest chip count reads the passage for the class.'], realWorld: 'Reading a notice aloud in school assembly.' },
  5: { name: 'One Sentence, Five Meanings', emoji: '🔀', how: ['Put up: “I didn’t say she took the pen.”', 'Children stress a different word each time and the class guesses what it now means.', 'Record the version with the most range.'], realWorld: 'Saying sorry so it sounds like you mean it.' },
  6: { name: 'Spot the Um', emoji: '🔔', how: ['Play back two recordings from the class (with permission).', 'Everyone taps the table at each filler word.', 'Compare the taps with the lab’s filler count — the machine and the room usually agree.'], realWorld: 'Sending a voice note to your family that does not ramble.' },
  // ── World 2 · Brave Bridge ────────────────────────────────────────────────
  7: { name: 'Excited, Not Scared', emoji: '💓', how: ['Everyone does twenty star jumps and feels their heartbeat.', 'Say “I am excited” out loud together, three times.', 'Talk for 30 seconds with the heartbeat still going — nerves as fuel.'], realWorld: 'The minute before a sports final or an exam.' },
  8: { name: 'Skeleton Speed Round', emoji: '🦴', how: ['Draw a random topic card.', 'In 30 seconds say only: first line, three points, last line.', 'The class holds up fingers for each part they heard.'], realWorld: 'Being asked to “say a few words” at a family function.' },
  9: { name: 'The 60-Second Reset', emoji: '🧘', how: ['Box breathing together: in 4, hold 4, out 4, hold 4.', 'Stand tall, feet planted, shoulders down for 20 seconds.', 'Then straight into a 30-second talk — compare the pace with lesson 7.'], realWorld: 'Walking up to the stage when your name is called.' },
  10: { name: 'Oops Cards', emoji: '🃏', how: ['A child starts a 60-second talk.', 'Mid-talk the mentor flashes a card: lost word, sneeze, phone rings, wrong slide.', 'They recover without stopping; the class scores the recovery out of 3.'], realWorld: 'When your slide freezes in the middle of a class presentation.' },
  11: { name: 'Freeze Rescue', emoji: '🥶', how: ['Give everyone one rescue line: “So what that really means is…”.', 'Mid-talk the mentor shouts “Freeze!” and counts to three.', 'The speaker uses the rescue line and carries on.'], realWorld: 'Your mind going blank in a viva or an interview.' },
  12: { name: 'Three Takes', emoji: '🎬', how: ['Everyone records the same 45-second talk.', 'Immediately again. And a third time.', 'Put all three scores on screen — confidence is a graph that goes up.'], realWorld: 'Practising a speech for your sister’s wedding.' },
  // ── World 3 · Blueprint City ──────────────────────────────────────────────
  13: { name: 'Tweet It', emoji: '🐦', how: ['Each child states their whole talk in twelve words or fewer.', 'The class checks: could you repeat it back?', 'If not, cut again.'], realWorld: 'Answering “so what is your project about?” in a lift.' },
  14: { name: 'Hook Battle', emoji: '🪝', how: ['Same topic, three openings: a question, a surprising fact, a tiny story.', 'Children perform all three.', 'The class votes for the one that made them want the next sentence.'], realWorld: 'The first line of a school election speech.' },
  15: { name: 'Rule of Three Relay', emoji: '🏃', how: ['The mentor gives a topic.', 'Three children in turn add one point each.', 'The class reorders the points so the strongest is last.'], realWorld: 'Explaining to parents three reasons you should get a new bike.' },
  16: { name: 'Map the Maze', emoji: '🗺️', how: ['One child draws a simple route; another cannot see it.', 'The first guides them only with signposts: first, next, after that, finally.', 'Swap. Count how many signposts made it work.'], realWorld: 'Giving a new student directions around school.' },
  17: { name: 'Mic Drop', emoji: '🎤', how: ['Each child writes only the last line of a talk.', 'They deliver just that line, then silence.', 'The class rates 1–5: would you clap?'], realWorld: 'Ending a toast at a birthday party.' },
  18: { name: 'Word Budget', emoji: '✂️', how: ['Everyone gets a 60-word paragraph.', 'Cut it to 30 words without losing the point.', 'Read both aloud — the class picks the one that sounds stronger.'], realWorld: 'A 30-second answer when a teacher says “quickly, please”.' },
  // ── World 4 · Stage Street ────────────────────────────────────────────────
  19: { name: 'Statue Challenge', emoji: '🗿', how: ['A child talks for 30 seconds.', 'A partner counts every sway, shuffle or fidget.', 'Beat your own count on the second try.'], realWorld: 'Standing in front of the class for a project presentation.' },
  20: { name: 'Silent Movie', emoji: '🎞️', how: ['Explain how to make tea using gestures only.', 'The class guesses each step.', 'Now add words — keep only the gestures that helped.'], realWorld: 'Explaining a diagram on the board.' },
  21: { name: 'Lighthouse', emoji: '🗼', how: ['Each sentence of your talk goes to a different person’s camera.', 'Nobody gets two sentences in a row.', 'The class says whether they felt spoken to.'], realWorld: 'Talking to a panel of three interviewers.' },
  22: { name: 'Glance & Go', emoji: '👀', how: ['Write five key words on a card — no sentences.', 'Give a 60-second talk; you may glance at the card three times only.', 'The class counts glances.'], realWorld: 'Speaking at a debate with only your points on a card.' },
  23: { name: 'News Anchor', emoji: '📺', how: ['Each child reports a 30-second “news story” about their day, straight to camera.', 'End with a sign-off: “Reporting from…”.', 'Watch it back with sound off — do they look at the lens?'], realWorld: 'Recording a video for a school or scholarship application.' },
  // ── World 5 · Debate Dome ─────────────────────────────────────────────────
  25: { name: 'The Ask', emoji: '🙋', how: ['“Sell me this pencil.”', 'In 20 seconds, finish with one clear thing you want the listener to do.', 'The class says what the ask was — if they cannot, it was not clear.'], realWorld: 'Asking a teacher for an extension, and getting it.' },
  26: { name: 'Three Doors', emoji: '🚪', how: ['Convince your parents to move bedtime 30 minutes later.', 'Once with a fact (logos), once with a feeling (pathos), once with why you are trustworthy (ethos).', 'The class labels each door.'], realWorld: 'Persuading your family where to go on holiday.' },
  27: { name: 'Fact or Feeling?', emoji: '🔍', how: ['The mentor reads ten claims.', 'The class holds up F for fact or E for feeling.', 'Pick one feeling and back it with a number or an example.'], realWorld: 'Checking whether an advert is actually telling you anything.' },
  28: { name: 'Yes, But…', emoji: '🥊', how: ['A child makes a 30-second case.', 'A partner fires three objections, one at a time.', 'Answer each in one sentence starting “That is fair, and…”.'], realWorld: 'A parent says no, and you calmly answer their worry.' },
  29: { name: 'Device Bingo', emoji: '🎯', how: ['Everyone has a bingo card: repetition, rule of three, rhetorical question, contrast.', 'Speakers try to use all four in 60 seconds.', 'Listeners mark their card — first full card calls “Bingo!”.'], realWorld: 'Writing a speech for Independence Day.' },
  30: { name: 'Honest or Tricky?', emoji: '🕵️', how: ['Show three short adverts or claims.', 'The class decides: persuasion or manipulation — and why.', 'Rewrite the tricky one to be honest and still persuasive.'], realWorld: 'Not being fooled by a “too good to be true” offer.' },
  // ── World 6 · Story Forest ────────────────────────────────────────────────
  31: { name: 'Memory Test', emoji: '🧠', how: ['The mentor gives five facts, then tells a one-minute story.', 'Carry on with the lesson for ten minutes.', 'Ask the class to recall both — the story always wins.'], realWorld: 'Remembering what a speaker said at an assembly a week later.' },
  32: { name: 'Story Mining', emoji: '⛏️', how: ['Pick the most boring topic in the room (the school timetable).', 'Everyone finds a true moment inside it: the day the bell did not ring.', 'Tell it in 45 seconds.'], realWorld: 'Making a science project presentation interesting.' },
  33: { name: 'Story Dice', emoji: '🎲', how: ['Roll three picture dice (or pick three random emojis).', 'Build a story: setup with the first, turn with the second, resolution with the third.', 'Tell it in 60 seconds.'], realWorld: 'Telling a bedtime story to a younger sibling.' },
  34: { name: 'Zoom In', emoji: '🔎', how: ['Describe a moment in one plain sentence.', 'Now zoom in: add one thing you saw, heard, smelled and felt.', 'The class closes their eyes — did they see it?'], realWorld: 'Writing and telling your best holiday memory.' },
  35: { name: 'Callback Comedy', emoji: '😂', how: ['Tell a short story with one small funny detail early on.', 'Bring that detail back in the last line.', 'The class rates the callback — kind humour only.'], realWorld: 'Making a room laugh at the start of a farewell speech.' },
  36: { name: 'Two Truths & a Tale', emoji: '🤥', how: ['Each child tells three short stories about themselves: two true, one invented.', 'The class guesses the tale.', 'Discuss: what detail made the true ones believable?'], realWorld: 'Answering “tell us about yourself” without a boring list.' },
  // ── World 7 · Real World ──────────────────────────────────────────────────
  37: { name: 'Hot Seat', emoji: '🔥', how: ['One child in the “hot seat”, three interviewers.', 'Three questions: strength, a problem you solved, why you.', 'Answers use STAR: situation, task, action, result.'], realWorld: 'A school, college or first job interview.' },
  38: { name: 'Professor Mode', emoji: '🎓', how: ['Explain a school topic in one minute.', 'The class asks “why?” three times in a row.', 'Survive all three without saying “I don’t know” — say what you would check.'], realWorld: 'A science viva or an oral exam.' },
  39: { name: 'Two-Minute Teach', emoji: '👩‍🏫', how: ['Each child teaches something they are good at — a card trick, a recipe, a game.', 'One slide or one object only.', 'The class must be able to do it afterwards.'], realWorld: 'Presenting in class or in a meeting.' },
  40: { name: 'Talking Stick', emoji: '🪄', how: ['Only the holder of the “stick” (any object) may speak.', 'To take it, you must start with “Building on what ___ said…”.', 'The mentor scores listening, not loudness.'], realWorld: 'A group discussion round in a college admission.' },
  41: { name: 'Topic Roulette', emoji: '🎡', how: ['Spin a random topic (the lab has a hundred).', 'Ten seconds to think.', 'Forty-five seconds to talk — the lab scores it live.'], realWorld: 'Being asked to speak with no warning.' },
  42: { name: 'Curveball', emoji: '⚾', how: ['A child finishes a short talk.', 'The class throws an unexpected question.', 'Answer with a bridge: “That is a great question — what I can tell you is…”.'], realWorld: 'The question you did not prepare for at the end of a presentation.' },
  // ── World 8 · Grand Stage ─────────────────────────────────────────────────
  43: { name: 'Three Rooms', emoji: '🚪', how: ['Explain the same idea three times.', 'To a five-year-old, to a grandparent, to a company CEO.', 'The class spots what changed: words, speed, examples.'], realWorld: 'Explaining your work to family and to an examiner.' },
  44: { name: 'Slide Rescue', emoji: '🛟', how: ['Show a terrible slide (walls of text, eight fonts).', 'In pairs, fix it: one idea, one picture, six words or fewer.', 'Present the fixed slide in 30 seconds.'], realWorld: 'A school project presentation with slides.' },
  45: { name: 'Mini Parliament', emoji: '🏛️', how: ['Split the class into two sides on a fun motion (“Homework should be optional”).', 'Openers, one rebuttal each, closers — one minute each.', 'The class votes on who argued better, not who they agree with.'], realWorld: 'An inter-school debate.' },
  46: { name: 'Glow & Grow', emoji: '🌱', how: ['After each talk, two listeners give one “glow” (specific strength).', 'One “grow” (one change, said kindly).', 'The speaker says thank you — no arguing.'], realWorld: 'Giving feedback to a friend on their project.' },
  47: { name: 'Dress Rehearsal', emoji: '🎭', how: ['Full performance of the speech that matters to you, standing, to camera.', 'The lab records every measure.', 'The class gives one glow each — this is the one to be proud of.'], realWorld: 'Any speech that really matters to you.' },
};
