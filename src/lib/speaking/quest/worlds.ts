/**
 * SARIRO — Voice Quest: the map
 * ============================================================================
 * Every public speaking class on the internet is a list of forty-eight videos.
 * A list is something you fall off. A map is something you go back to — you
 * can see where you are, how far you have come, and the next place with a
 * light on.
 *
 * So a course's eight modules are eight worlds, each lesson is a level, and
 * the two assessment slots (24 and 48) are the showcases a world builds up to.
 * Each of the five courses draws its own map (lib/speaking/courses): Grades 1–3
 * travel from Mika's Music Park to the Superstar Stage, professionals from the
 * Lobby to the Keynote Stage.
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

/* ── Warm-ups: a tongue twister to start every level ────────────────────────
   Thirty seconds that make a room laugh and wake every mouth in it up — and
   read into the speaking lab, "words heard right" turns a silly sentence into
   a score a learner wants to beat. Each course has its own set. */

export interface Twister {
  text: string;
  /** The sound it drills. */
  focus: string;
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
