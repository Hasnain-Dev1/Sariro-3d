/**
 * SARIRO — Voice Quest: the map
 * ============================================================================
 * Every public speaking class on the internet is a list of forty-eight videos.
 * A list is something you fall off. A map is something you go back to — you
 * can see where you are, how far you have come, and the next place with a
 * light on.
 *
 * So the course's eight modules are eight worlds, each lesson is a level, and
 * the two assessment slots (24 and 48) are the showcases a world builds up to.
 * Nothing here changes the syllabus — the module and lesson numbers are the
 * curriculum's own (lib/school/curriculum.ts) — it only gives them a place.
 */

export interface World {
  /** The module number. */
  num: number;
  name: string;
  emoji: string;
  color: string;
  /** What you can do when you leave it. */
  tagline: string;
}

export const WORLDS: World[] = [
  { num: 1, name: 'Voice Valley', emoji: '🎙️', color: '#2563EB', tagline: 'Find the voice you already have.' },
  { num: 2, name: 'Brave Bridge', emoji: '🌉', color: '#7C3AED', tagline: 'Walk across the nerves.' },
  { num: 3, name: 'Blueprint City', emoji: '🏗️', color: '#0891B2', tagline: 'Build talks that stand up.' },
  { num: 4, name: 'Stage Street', emoji: '🎭', color: '#EA580C', tagline: 'Own the space you speak in.' },
  { num: 5, name: 'Debate Dome', emoji: '🏛️', color: '#DC2626', tagline: 'Change a mind, honestly.' },
  { num: 6, name: 'Story Forest', emoji: '🌳', color: '#16A34A', tagline: 'Be the one people remember.' },
  { num: 7, name: 'Real World', emoji: '🌍', color: '#CA8A04', tagline: 'Interviews, vivas, meetings — for real.' },
  { num: 8, name: 'Grand Stage', emoji: '🏆', color: '#DB2777', tagline: 'Perform it.' },
];

export function worldOf(moduleNum: number): World {
  return WORLDS.find((w) => w.num === moduleNum) ?? WORLDS[0];
}

/* ── Warm-ups: a tongue twister to start every level ────────────────────────
   Thirty seconds that make a room laugh and wake every mouth in it up — and
   read into the speaking lab, "words heard right" turns a silly sentence into
   a score a child wants to beat. Traditional twisters, plus a few written for
   the Sound Lab patterns (the queen who queued for quiche). */

export interface Twister {
  text: string;
  /** The sound it drills. */
  focus: string;
}

export const TWISTERS: Twister[] = [
  { text: 'Red lorry, yellow lorry, red lorry, yellow lorry.', focus: 'R and L' },
  { text: 'She sells seashells by the seashore.', focus: 'S and SH' },
  { text: 'Peter Piper picked a peck of pickled peppers.', focus: 'P' },
  { text: 'Unique New York, unique New York, you know you need unique New York.', focus: 'N, Y and the silent U' },
  { text: 'Queen Quinn quickly queued for quiche.', focus: 'Q three ways: kw, kyoo, k' },
  { text: 'Fred fed Ted bread, and Ted fed Fred bread.', focus: 'F, T and D' },
  { text: 'Truly rural, truly rural, truly rural.', focus: 'R and L' },
  { text: 'A proper copper coffee pot.', focus: 'P and K' },
  { text: 'Which witch is which? Which witch is which?', focus: 'W' },
  { text: 'Vincent vowed vengeance very vehemently on a wet Wednesday.', focus: 'V and W' },
  { text: 'Thirty-three thirsty thinkers thought thoroughly about Thursday.', focus: 'TH' },
  { text: 'Betty bought a bit of better butter.', focus: 'B and T' },
  { text: 'I scream, you scream, we all scream for ice cream.', focus: 'Where one word ends' },
  { text: 'Around the rugged rocks the ragged rascal ran.', focus: 'R' },
  { text: 'Good blood, bad blood. Good blood, bad blood.', focus: 'OO two ways' },
  { text: 'He walked, he played, he wanted, he waited.', focus: '-ED three ways' },
  { text: 'Six slippery snails slid slowly seaward.', focus: 'S' },
  { text: 'Eleven benevolent elephants.', focus: 'L and V' },
];

export function twisterFor(lessonNumber: number): Twister {
  return TWISTERS[(Math.max(1, lessonNumber) - 1) % TWISTERS.length];
}

/* ── Showcases: the assessment slots, as the level a world builds to ───────── */

export interface Showcase {
  /** Curriculum slot. */
  slot: 24 | 48;
  name: string;
  emoji: string;
  /** Worlds whose levels count toward unlocking it. */
  worlds: number[];
  /** Levels cleared in those worlds before it opens. */
  unlockAfter: number;
  brief: string;
}

export const SHOWCASES: Showcase[] = [
  {
    slot: 24, name: 'Showcase I — The Mid-Course Stage', emoji: '🎤', worlds: [1, 2, 3, 4], unlockAfter: 12,
    brief: 'Everything from the first four worlds in one performance: a talk with a real opening, three signposted points and an ending that lands — delivered standing, to camera, without reading.',
  },
  {
    slot: 48, name: 'Showcase II — The Grand Stage', emoji: '🏆', worlds: [5, 6, 7, 8], unlockAfter: 12,
    brief: 'A persuasive talk built around a story about you, with a question answered at the end. The whole course, in two minutes.',
  },
];
