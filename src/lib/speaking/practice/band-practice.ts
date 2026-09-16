import type { Drill } from '@/components/speaking/speaking-lab';
import type { SpeakingBand } from '@/lib/speaking/bands';
import type { Prompt } from '@/lib/speaking/voice-check';
import { PROMPTS } from '@/lib/speaking/voice-check';
import type { Passage } from '@/lib/speaking/passages/types';
import { STORIES } from '@/lib/speaking/passages/stories';
import { SCIENCE } from '@/lib/speaking/passages/science';
import { HISTORY } from '@/lib/speaking/passages/history';
import { EVERYDAY } from '@/lib/speaking/passages/everyday';
import { WORLD } from '@/lib/speaking/passages/world';
import { IDEAS } from '@/lib/speaking/passages/ideas';
import { FOUNDATION_PASSAGES, PRIMARY_PASSAGES, PROFESSIONAL_PASSAGES } from '@/lib/speaking/passages/young';

/**
 * SARIRO — the practice room, one for each Public Speaking course
 * ============================================================================
 * The practice room used to be the same for everybody: a sixty-second unplanned
 * talk and minute-long passages for a six-year-old, and "invent something that
 * would make school better" for a thirty-year-old manager. Now each band's room
 * is its own, like its lessons:
 *
 *   drills     how long, and about what — show and tell for Grades 1–3,
 *              extempore for 10–12, an update to leadership for professionals
 *   topics     the free-talk cards, in the band's own world
 *   passages   the read-aloud and listening library, sized to the reader
 *   writing    the writing lab's prompts
 *   sounds     the simple Sound Lab for Grades 1–6
 *
 * A learner only ever sees their own band's room — the band of their most
 * recent Public Speaking enrolment (lib/speaking/access.ts).
 */

export type PracticeDrillKind = 'free' | 'read' | 'task';

export interface PracticeDrill extends Drill {
  /** `free` is dealt a topic card, `read` a passage; `task` stands alone. */
  kind: PracticeDrillKind;
}

export interface BandPractice {
  band: SpeakingBand;
  drills: readonly PracticeDrill[];
  topics: readonly Prompt[];
  passages: readonly Passage[];
  writingPrompts: readonly string[];
  /** Sound Lab without phonetic symbols and grown-up notes. */
  simpleSounds: boolean;
}

const pd = (band: SpeakingBand, slug: string, kind: PracticeDrillKind, d: Omit<Drill, 'id'>): PracticeDrill => ({ id: `practice:${band}:${slug}`, kind, ...d });

export const BAND_PRACTICE: Record<SpeakingBand, BandPractice> = {
  foundation: {
    band: 'foundation',
    drills: [
      pd('foundation', 'show-and-tell', 'free', { title: 'Show and tell', brief: 'Talk about the picture card below for thirty seconds. Say what it is, why you like it, and one fun fact. Big clear voice!', targetSeconds: 30 }),
      pd('foundation', 'read-aloud', 'read', { title: 'Read like a storyteller', brief: 'Read the story out loud slowly. Stop and breathe at every full stop, like a storyteller.', targetSeconds: 25 }),
      pd('foundation', 'tell-a-friend', 'task', { title: 'Tell a friend', brief: 'Tell your best friend about the best thing that happened to you this week. Start with "Guess what?"', targetSeconds: 30 }),
    ],
    topics: [
      { id: 'f-pet', emoji: '🐶', text: 'Your favourite animal' },
      { id: 'f-toy', emoji: '🧸', text: 'Your favourite toy' },
      { id: 'f-food', emoji: '🍎', text: 'A food you love to eat' },
      { id: 'f-colour', emoji: '🌈', text: 'Your favourite colour, and why' },
      { id: 'f-superhero', emoji: '🦸', text: 'A superhero you would like to be' },
      { id: 'f-park', emoji: '🛝', text: 'What you like to do at the park' },
      { id: 'f-family', emoji: '👨‍👩‍👧', text: 'Someone special in your family' },
      { id: 'f-festival', emoji: '🪔', text: 'Your favourite festival' },
      { id: 'f-rain', emoji: '☔', text: 'What you do on a rainy day' },
      { id: 'f-birthday', emoji: '🎂', text: 'Your best birthday' },
    ],
    passages: FOUNDATION_PASSAGES,
    writingPrompts: [],
    simpleSounds: true,
  },
  primary: {
    band: 'primary',
    drills: [
      pd('primary', 'forty-five', 'free', { title: 'Forty-five seconds on a topic', brief: 'Talk about the topic card for forty-five seconds. Start with a hook, give two reasons, and end with a strong last line.', targetSeconds: 45 }),
      pd('primary', 'read-aloud', 'read', { title: 'Read it like a presenter', brief: 'Read the passage aloud as if presenting to your class. Pause at full stops and stress the most important words.', targetSeconds: 45 }),
      pd('primary', 'explain', 'task', { title: 'Explain it to a younger child', brief: 'Explain something you learned at school this week to a six-year-old, using simple words and one example.', targetSeconds: 60 }),
    ],
    topics: PROMPTS,
    passages: PRIMARY_PASSAGES,
    writingPrompts: [
      'Write three reasons why your favourite book or film is worth reading or watching.',
      'Describe your favourite place so clearly that someone could picture it with their eyes closed.',
      'Write a hook and a strong last line for a talk about your favourite animal.',
      'Write about a time you were brave, in four or five sentences.',
      'Persuade your class to start a new school club. Give your idea and three reasons.',
    ],
    simpleSounds: true,
  },
  middle: {
    band: 'middle',
    drills: [
      pd('middle', 'free-60', 'free', { title: 'Sixty seconds, no notes', brief: 'Talk about the topic card for a minute without planning. The point is to hear what your unplanned speech actually sounds like.', targetSeconds: 60 }),
      pd('middle', 'read-aloud', 'read', { title: 'Read it as though you mean it', brief: 'Read the passage aloud. Use the full stops and commas as places to pause instead of pushing straight through.', targetSeconds: 60 }),
      pd('middle', 'argue', 'task', { title: 'Argue a side', brief: 'Choose a side on "Should phones be banned in school?" and argue it for ninety seconds with three reasons and one objection answered.', targetSeconds: 90 }),
    ],
    topics: [
      { id: 'm-social', emoji: '📱', text: 'Is social media making your generation more or less connected?' },
      { id: 'm-homework', emoji: '📚', text: 'Should homework be optional?' },
      { id: 'm-role-model', emoji: '⭐', text: 'Someone your age who has done something impressive' },
      { id: 'm-game', emoji: '🎮', text: 'What a video game has taught you' },
      { id: 'm-change-school', emoji: '🏫', text: 'One change that would make your school better' },
      { id: 'm-ai', emoji: '🤖', text: 'Should students be allowed to use AI for homework?' },
      { id: 'm-sport', emoji: '⚽', text: 'The most underrated sport, and why' },
      { id: 'm-climate', emoji: '🌍', text: 'One thing teenagers can actually do about climate change' },
      { id: 'm-friendship', emoji: '🤝', text: 'What makes a friendship last' },
      { id: 'm-uniform', emoji: '👕', text: 'Are school uniforms fair?' },
      { id: 'm-screen', emoji: '📺', text: 'A series or film everybody your age should watch' },
      { id: 'm-future-job', emoji: '🚀', text: 'A job that does not exist yet but will by the time you graduate' },
    ],
    passages: [...STORIES, ...SCIENCE, ...HISTORY, ...EVERYDAY, ...WORLD],
    writingPrompts: [
      'Write the opening paragraph of a speech on whether phones should be allowed in school.',
      'Describe a moment you changed your mind about someone.',
      'Explain something from a subject you study to someone who knows nothing about it.',
      'Argue for something you do not actually believe. Make it convincing.',
      'Write a strong closing line for an election speech, and the paragraph that leads up to it.',
    ],
    simpleSounds: false,
  },
  senior: {
    band: 'senior',
    drills: [
      pd('senior', 'extempore', 'free', { title: 'Ninety-second extempore', brief: 'Speak on the topic card for ninety seconds with no preparation. Pick a structure in the first two seconds and finish with a clear verdict.', targetSeconds: 90 }),
      pd('senior', 'read-aloud', 'read', { title: 'Read it for an audience', brief: 'Read the passage aloud as if at a competition or assembly: controlled pace, deliberate pauses and clear emphasis.', targetSeconds: 60 }),
      pd('senior', 'interview', 'task', { title: 'Interview answer', brief: 'Answer "Why do you want to study your chosen subject?" as in a college interview: answer, evidence, relevance, stop.', targetSeconds: 90 }),
    ],
    topics: [
      { id: 's-exams', emoji: '📝', text: 'Should board exams be replaced by continuous assessment?' },
      { id: 's-voting', emoji: '🗳️', text: 'Should the voting age be lowered to sixteen?' },
      { id: 's-ai-jobs', emoji: '🤖', text: 'Will AI create more jobs than it destroys?' },
      { id: 's-abroad', emoji: '✈️', text: 'Is studying abroad worth the cost?' },
      { id: 's-career', emoji: '🎯', text: 'Passion or stability: how should you choose a career?' },
      { id: 's-social-media', emoji: '📱', text: 'Should social media platforms verify users\' ages?' },
      { id: 's-coaching', emoji: '🏫', text: 'Has coaching culture helped or harmed students?' },
      { id: 's-climate', emoji: '🌍', text: 'Should wealthy countries pay more for climate action?' },
      { id: 's-leader', emoji: '🏛️', text: 'What makes a good school leader?' },
      { id: 's-gap-year', emoji: '🧭', text: 'Should students take a gap year before college?' },
      { id: 's-sport', emoji: '🏆', text: 'Should sport be compulsory until Grade 12?' },
      { id: 's-news', emoji: '📰', text: 'How should young people decide what news to trust?' },
    ],
    passages: [...STORIES, ...SCIENCE, ...HISTORY, ...EVERYDAY, ...WORLD, ...IDEAS],
    writingPrompts: [
      'Write the thesis and three arguments for a debate motion you care about.',
      'Answer "Why this course?" for a college application in one paragraph.',
      'Describe a setback and what you learned from it, as you would in a personal statement.',
      'Write a rebuttal to the strongest argument against your own view on a current issue.',
      'Write the opening of a farewell or head-student speech.',
    ],
    simpleSounds: false,
  },
  adult: {
    band: 'adult',
    drills: [
      pd('adult', 'update', 'free', { title: 'Sixty-second update', brief: 'Speak on the topic card for sixty seconds as if to your manager or a seminar group: the answer first, then two supporting points.', targetSeconds: 60 }),
      pd('adult', 'read-aloud', 'read', { title: 'Read it to the room', brief: 'Read the passage aloud as if presenting to colleagues: pause after key numbers, slow down for the recommendation.', targetSeconds: 60 }),
      pd('adult', 'explain-work', 'task', { title: 'Explain your work to a non-specialist', brief: 'Explain what you work on or study to someone outside your field in ninety seconds, with no jargon and one concrete example.', targetSeconds: 90 }),
    ],
    topics: [
      { id: 'a-project', emoji: '📊', text: 'Give a status update on a project you are working on' },
      { id: 'a-decision', emoji: '⚖️', text: 'Recommend a decision your team needs to make' },
      { id: 'a-hybrid', emoji: '🏢', text: 'Is hybrid work better for early-career professionals?' },
      { id: 'a-ai-work', emoji: '🤖', text: 'How AI will change your field in the next five years' },
      { id: 'a-failure', emoji: '🔁', text: 'A professional mistake and what it taught you' },
      { id: 'a-pitch', emoji: '💡', text: 'Pitch an idea that would save your organisation time or money' },
      { id: 'a-intro', emoji: '🤝', text: 'Introduce yourself at a networking event' },
      { id: 'a-research', emoji: '🔬', text: 'Explain a finding from your studies or work' },
      { id: 'a-leadership', emoji: '🧭', text: 'What makes a manager worth working for?' },
      { id: 'a-feedback', emoji: '💬', text: 'Give constructive feedback on a meeting you attended' },
      { id: 'a-career', emoji: '🚀', text: 'Why you want your next role' },
      { id: 'a-negotiate', emoji: '🧾', text: 'Negotiate a deadline extension with a client' },
    ],
    passages: [...PROFESSIONAL_PASSAGES, ...IDEAS, ...HISTORY, ...WORLD, ...SCIENCE],
    writingPrompts: [
      'Write the executive summary of a recommendation: the answer first, three supporting points and the ask.',
      'Write a STAR answer for "Tell me about a time you handled conflict".',
      'Rewrite a jargon-heavy paragraph from your work so a new joiner could follow it.',
      'Write an email delivering bad news to a client, honestly and with a plan.',
      'Write the opening of a conference talk about your field.',
    ],
    simpleSounds: false,
  },
};

export const practiceFor = (band: SpeakingBand): BandPractice => BAND_PRACTICE[band];

export function passageIn(practice: BandPractice, id: string | null | undefined): Passage | null {
  return id ? practice.passages.find((p) => p.id === id) ?? null : null;
}
