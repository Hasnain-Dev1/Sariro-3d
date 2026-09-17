import type { Drill } from '@/components/speaking/speaking-lab';
import type { SpeakingBand } from '@/lib/speaking/bands';
import type { Prompt } from '@/lib/speaking/voice-check';
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
 * recent Public Speaking enrolment (lib/speaking/access.ts). Each room follows
 * its course (lib/speaking/courses): Mika, Leo and Tara for Grades 1–3, class
 * reporting and pitches for 4–6, and an interview deck for UG, PG and work.
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
  /** What a card from `topics` is called in the room: a topic, or an interview question. */
  topicNoun: string;
}

const pd = (band: SpeakingBand, slug: string, kind: PracticeDrillKind, d: Omit<Drill, 'id'>): PracticeDrill => ({ id: `practice:${band}:${slug}`, kind, ...d });

export const BAND_PRACTICE: Record<SpeakingBand, BandPractice> = {
  foundation: {
    band: 'foundation',
    drills: [
      pd('foundation', 'show-and-tell', 'free', { title: 'Show and tell with Leo', brief: 'Use your big Leo the Lion voice! Talk about the card for thirty seconds: what it is, why you like it, and one fun thing.', targetSeconds: 30 }),
      pd('foundation', 'read-aloud', 'read', { title: 'Read like Tara the Turtle', brief: 'Read the story slowly, like Tara the Turtle. Stop and count "one" at every full stop.', targetSeconds: 25 }),
      pd('foundation', 'pretend-play', 'task', { title: "Mika's pretend show", brief: 'Pretend you are on TV with Mika the Mic! Be a weather reporter or a TV chef. Say hello, tell us your news or your recipe, and say goodbye.', targetSeconds: 30 }),
    ],
    topics: [
      { id: 'f-pet', emoji: '🐶', text: 'Your favourite animal — and its animal voice!' },
      { id: 'f-toy', emoji: '🧸', text: 'Your favourite toy' },
      { id: 'f-food', emoji: '🍎', text: 'A yummy food, with yummy words' },
      { id: 'f-superhero', emoji: '🦸', text: 'The superhero you would like to be' },
      { id: 'f-park', emoji: '🛝', text: 'What you like to do at the park' },
      { id: 'f-family', emoji: '👨‍👩‍👧', text: 'Someone special in your family' },
      { id: 'f-festival', emoji: '🪔', text: 'Your favourite festival' },
      { id: 'f-birthday', emoji: '🎂', text: 'Your best birthday' },
      { id: 'f-puppet', emoji: '🧦', text: 'A puppet friend — what is its name?' },
      { id: 'f-helper', emoji: '👩‍🚒', text: 'A helper you want to say thank you to' },
      { id: 'f-dream', emoji: '🚀', text: 'What you want to be when you grow up' },
      { id: 'f-nature', emoji: '🐌', text: 'Something you found outside' },
    ],
    passages: FOUNDATION_PASSAGES,
    writingPrompts: [],
    simpleSounds: true,
    topicNoun: 'card',
  },
  primary: {
    band: 'primary',
    drills: [
      pd('primary', 'forty-five', 'free', { title: 'Forty-five seconds on a topic', brief: 'Talk about the topic card for forty-five seconds. Start with a hook, give two reasons, and end with a strong last line.', targetSeconds: 45 }),
      pd('primary', 'read-aloud', 'read', { title: 'Read it like a presenter', brief: 'Read the passage aloud as if presenting to your class. Pause at full stops and stress the most important words.', targetSeconds: 45 }),
      pd('primary', 'report', 'task', { title: 'Class news reporter', brief: 'Report the biggest news from your class or home this week like a TV reporter: the headline first, then who, what, where, when and why, and a sign-off.', targetSeconds: 60 }),
    ],
    topics: [
      { id: 'p-project', emoji: '🔬', text: 'Present a school project you are proud of' },
      { id: 'p-review', emoji: '⭐', text: 'Review a book or film — no spoilers!' },
      { id: 'p-club', emoji: '💡', text: 'Pitch a new club for your school' },
      { id: 'p-how', emoji: '⚙️', text: 'Explain how something works' },
      { id: 'p-brave', emoji: '🦁', text: 'A true story about a time you were brave' },
      { id: 'p-sport', emoji: '⚽', text: 'Convince your class to try your favourite sport' },
      { id: 'p-place', emoji: '🏞️', text: 'Your favourite place, with all five senses' },
      { id: 'p-hero', emoji: '🌟', text: 'Someone who inspires you, and what they teach you' },
      { id: 'p-rep', emoji: '🗳️', text: 'If you were class representative, what would you change?' },
      { id: 'p-game', emoji: '🎲', text: 'The rules of your favourite game' },
      { id: 'p-mystery', emoji: '📦', text: 'A suspense story about a mystery box' },
      { id: 'p-invention', emoji: '🤖', text: 'An invention that would make school better' },
    ],
    passages: PRIMARY_PASSAGES,
    writingPrompts: [
      'Write three reasons why your favourite book or film is worth reading or watching.',
      'Describe your favourite place so clearly that someone could picture it with their eyes closed.',
      'Write a hook and a strong last line for a talk about your favourite animal.',
      'Write about a time you were brave, in four or five sentences.',
      'Persuade your class to start a new school club. Give your idea and three reasons.',
    ],
    simpleSounds: true,
    topicNoun: 'topic',
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
    topicNoun: 'topic',
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
    topicNoun: 'topic',
  },
  adult: {
    band: 'adult',
    drills: [
      pd('adult', 'interview', 'free', { title: 'Interview question', brief: 'Answer the question as in a real interview: the direct answer first, one specific example with a result, why it matters for the role — then stop.', targetSeconds: 90 }),
      pd('adult', 'read-aloud', 'read', { title: 'Read it to the room', brief: 'Read the passage aloud as if presenting to colleagues: pause after key numbers, slow down for the recommendation.', targetSeconds: 60 }),
      pd('adult', 'update', 'task', { title: 'Sixty-second meeting update', brief: 'Give a sixty-second update on something you are working on or studying: status first, then progress, one risk and what you need.', targetSeconds: 60 }),
    ],
    topics: [
      { id: 'a-about', emoji: '🙋', text: 'Tell me about yourself.' },
      { id: 'a-why-role', emoji: '🎯', text: 'Why do you want this role?' },
      { id: 'a-conflict', emoji: '🤝', text: 'Describe a time you handled conflict in a team.' },
      { id: 'a-weakness', emoji: '🪞', text: 'What is your biggest weakness?' },
      { id: 'a-project', emoji: '📊', text: 'Walk me through a project you are proud of.' },
      { id: 'a-hire', emoji: '✅', text: 'Why should we hire you?' },
      { id: 'a-failure', emoji: '🔁', text: 'Tell me about a time you failed, and what you learned.' },
      { id: 'a-deadline', emoji: '⏳', text: 'How do you handle several tight deadlines at once?' },
      { id: 'a-lead', emoji: '🧭', text: 'Tell me about a time you led without formal authority.' },
      { id: 'a-gap', emoji: '🧩', text: 'Explain a gap or change of direction in your career.' },
      { id: 'a-future', emoji: '🚀', text: 'Where do you see yourself in five years?' },
      { id: 'a-salary', emoji: '💼', text: 'What are your salary expectations?' },
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
    topicNoun: 'question',
  },
};

export const practiceFor = (band: SpeakingBand): BandPractice => BAND_PRACTICE[band];

export function passageIn(practice: BandPractice, id: string | null | undefined): Passage | null {
  return id ? practice.passages.find((p) => p.id === id) ?? null : null;
}
