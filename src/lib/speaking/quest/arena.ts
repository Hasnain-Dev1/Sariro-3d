/**
 * SARIRO — Voice Quest: the class game for every level
 * ============================================================================
 * A public speaking class where the teacher explains and the children take
 * turns is the class every competitor sells, and it is the one children drop.
 * What learners remember — and come back for — is the game: the buzzer every
 * time somebody says "um", the chip you win for a pause, the curveball card
 * flashed in the middle of your talk.
 *
 * So every lesson has one, written into its course (lib/speaking/courses): a
 * real in-class activity a mentor can run from three steps, tied to a moment in
 * the learner's own life where the skill is actually needed.
 */
export interface ArenaGame {
  name: string;
  emoji: string;
  /** How to run it, in class, in three steps. */
  how: [string, string, string];
  /** Where this skill is needed outside the classroom. */
  realWorld: string;
}
