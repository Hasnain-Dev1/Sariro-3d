/**
 * SARIRO — a trial class told as a story
 * ============================================================================
 * Mimo, 18 Sep 2026: every grade should have its own story and its own trial
 * activity — real-world problem solving, with a hook.
 *
 * A story is the half hour's spine for ONE grade in one subject. The child is
 * somebody in it (the market manager, the ship's engineer, the museum's app
 * developer); each chapter opens with a scene — its own small hook — and ends
 * with something the CHILD works out. The class ends on a cliffhanger that the
 * course picks up, so the trial is chapter one of something, not a one-off.
 *
 *   hook         the first thing said in class, and the teaser the family
 *                sees on the class-ready page before the trial
 *   chapters     three, about 17 minutes together: scene → task → what to
 *                listen for → a nudge if stuck
 *   stretch      for a child who is flying
 *   cliffhanger  the last line: what happens next — in the course
 *
 * The teacher's playbook offers the story as the first path for the child's
 * grade (lib/trial/stories/index.ts: storyAsPath), and /trial/story presents
 * it on a shared screen, one chapter at a time.
 */

export interface Chapter {
  title: string;
  /** Read aloud or shown on screen: what happens. */
  scene: string;
  /** What the child does. */
  task: string;
  /** For the teacher: the answer, or what a good answer sounds like. */
  lookFor: string;
  /** Said if they are stuck — a nudge, not the answer. */
  nudge: string;
  minutes: number;
}

export interface Story {
  /** The trial subject slug (lib/trial/subjects.ts). */
  subject: string;
  /** 1–12; 13 for university and grown-ups. */
  grade: number;
  title: string;
  emoji: string;
  /** Who the child is in the story: "the market manager". */
  role: string;
  hook: string;
  /** The real-world problem, one line. */
  mission: string;
  chapters: [Chapter, Chapter, Chapter];
  stretch: string;
  cliffhanger: string;
  /** What the child can say they did. */
  win: string;
  /** The idea underneath, for the teacher and the parent. */
  skill: string;
}
