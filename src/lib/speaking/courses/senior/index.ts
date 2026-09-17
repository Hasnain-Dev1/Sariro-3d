import type { SpeakingCourse } from '../types';
import { SENIOR_M1, SENIOR_M2 } from './m1-2';
import { SENIOR_M3, SENIOR_M4 } from './m3-4';
import { SENIOR_M5, SENIOR_M6 } from './m5-6';
import { SENIOR_M7, SENIOR_M8 } from './m7-8';

/**
 * Public Speaking · Grades 10–12 — Leaders
 *
 * The years when speaking decides things: vivas and practical exams, research
 * presentations, competitive debate and Model UN, college and scholarship
 * interviews, group discussion rounds, head-student campaigns, anchoring and a
 * signature talk to take into applications.
 */
export const SENIOR_COURSE: SpeakingCourse = {
  band: 'senior',
  promise: 'High-stakes speaking for Grades 10–12: vivas, research presentations, competitive debate and Model UN, admissions and scholarship interviews, leadership speeches and a TEDx-style signature talk.',
  // Argument first: at sixteen, what panels and judges reward is thinking made audible.
  modules: [SENIOR_M3, SENIOR_M1, SENIOR_M2, SENIOR_M4, SENIOR_M5, SENIOR_M6, SENIOR_M7, SENIOR_M8],
  showcases: {
    mid: { name: 'The Academic Defence', emoji: '🎓', brief: 'Present a research question or project in ninety seconds — thesis first, PEEL arguments with credible evidence, one limitation named — then defend it against an examiner’s follow-up questions.' },
    final: { name: 'The Signature Talk', emoji: '✨', brief: 'Your TEDx-style signature talk: one idea told through your own story, with evidence, the strongest objection answered and a close delivered with conviction.' },
  },
  warmUps: [
    { text: 'The sixth sick sheikh’s sixth sheep’s sick.', focus: 'S, SH and K' },
    { text: 'Unique New York, unique New York, you know you need unique New York.', focus: 'N, Y and the silent U' },
    { text: 'Specific Pacific statistics, specifically.', focus: 'S, P and K clusters' },
    { text: 'Red leather, yellow leather, red leather, yellow leather.', focus: 'R and L' },
    { text: 'Vincent vowed vengeance very vehemently on a wet Wednesday.', focus: 'V and W' },
    { text: 'Thirty-three thirsty thinkers thought thoroughly about Thursday.', focus: 'TH' },
    { text: 'Irish wristwatch, Swiss wristwatch.', focus: 'SH, S and W' },
    { text: 'A regular, irregular, regular, irregular argument.', focus: 'R and G' },
    { text: 'The epitome of hyperbole is an unusual rhetorical flourish.', focus: 'Stress in long words' },
    { text: 'Truly rural, truly rural, truly rural.', focus: 'R and L' },
    { text: 'Eleven benevolent elephants.', focus: 'L and V' },
    { text: 'Statistical analysis of particular circumstances.', focus: 'Multisyllable clarity' },
  ],
};
