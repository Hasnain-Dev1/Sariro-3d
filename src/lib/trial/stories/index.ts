import { optionsFor } from '@/lib/dashboard/course-options';
import type { Band, Path } from '@/lib/trial/playbooks/types';
import { CODING_STORIES } from './coding';
import { ENGLISH_STORIES } from './english';
import { MATHS_STORIES } from './maths';
import { SCIENCE_STORIES } from './sciences';
import { SPEAKING_FOCUS_STORIES } from './speaking-focus';
import type { Story } from './types';

/**
 * SARIRO — a story for every trial
 * ============================================================================
 * Every trial subject has stories — Mathematics, English and Coding one for
 * every grade, the sciences for the grades they are taught in, Public Speaking
 * and the focus courses by age. storyFor picks the one for the child's grade,
 * or the nearest one written for that subject.
 */

export const STORIES: Story[] = [
  ...MATHS_STORIES,
  ...SCIENCE_STORIES,
  ...ENGLISH_STORIES,
  ...CODING_STORIES,
  ...SPEAKING_FOCUS_STORIES,
];

/** Grade 13 stands for university students and grown-ups (the booking form's U and P). */
const storyGrade = (grade: number | null | undefined) => (grade == null || !Number.isFinite(grade) ? null : Math.max(1, Math.min(13, Math.round(grade))));

function subjectOf(subject: string | null | undefined): string {
  const s = String(subject ?? '').trim().toLowerCase();
  // A trial booked on a specific coding track is still a coding trial.
  if (s && optionsFor('coding').some((o) => o.value === s)) return 'coding';
  return s;
}

/** The story for this subject and grade — the exact grade, else the nearest written. */
export function storyFor(subject: string | null | undefined, grade: number | null | undefined): Story | null {
  const s = subjectOf(subject);
  const list = STORIES.filter((st) => st.subject === s);
  if (!list.length) return null;
  const g = storyGrade(grade);
  if (g === null) return list[Math.floor(list.length / 2)];
  return list.reduce((best, st) => (Math.abs(st.grade - g) < Math.abs(best.grade - g) ? st : best), list[0]);
}

export const STORY_PATH_ID = 'story';

/** The presenter page for a story (app/trial/story). */
export const storyHref = (story: Story) => `/trial/story?subject=${encodeURIComponent(story.subject)}&grade=${story.grade}`;

const bandFor = (grade: number): Band => (grade >= 13 ? 'adult' : grade >= 10 ? 'senior' : grade >= 7 ? 'middle' : grade >= 4 ? 'primary' : 'foundation');

/**
 * The story as a playbook path, so the teacher's page — the class clock, the
 * checklist, "if stuck", the show-off moment — works for it unchanged.
 */
export function storyAsPath(story: Story): Path {
  const who = story.grade >= 13 ? 'grown-ups' : `Grade ${story.grade}`;
  return {
    id: STORY_PATH_ID,
    name: `${story.emoji} Story: ${story.title}`,
    forWho: `Written for ${who}: the child is ${story.role}. ${story.mission}`,
    levels: ['new', 'some', 'strong'],
    bands: [bandFor(story.grade)],
    interests: [],
    win: story.win,
    steps: [
      { minutes: 2, title: 'The hook', do: ['Read the hook with energy — then ask the child what they would do first.'], say: story.hook },
      ...story.chapters.map((c) => ({
        minutes: c.minutes,
        title: c.title,
        do: [c.task],
        say: c.scene,
        check: c.lookFor,
      })),
    ],
    ifStuck: story.chapters.map((c) => `${c.title}: ${c.nudge}`),
    ifFlying: [story.stretch],
    tools: [{ label: 'The story, one chapter at a time, for the shared screen', href: storyHref(story) }],
    showOff: `End on the cliffhanger — read it slowly: “${story.cliffhanger}” Then the child tells the parent what they solved today.`,
  };
}

export type { Story, Chapter } from './types';
