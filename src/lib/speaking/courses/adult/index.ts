import type { SpeakingCourse } from '../types';
import { ADULT_M1, ADULT_M2 } from './m1-2';
import { ADULT_M3, ADULT_M4 } from './m3-4';
import { ADULT_M5, ADULT_M6 } from './m5-6';
import { ADULT_M7, ADULT_M8 } from './m7-8';

/**
 * Public Speaking · UG, PG & professionals — Professionals
 *
 * Speaking as a career skill. Presence and confidence at work, structured
 * communication, a whole module of job and placement interviews, meetings,
 * persuasive presentations, pitching and negotiation, and thought leadership —
 * conference talks, thesis defences, camera and panels.
 */
export const ADULT_COURSE: SpeakingCourse = {
  band: 'adult',
  promise: 'Career communication for undergraduates, postgraduates and professionals: interviews and placements, meetings, business presentations, pitching, negotiation, leadership and thought-leadership talks.',
  // Structure first: at work, the bottom line in the first sentence is the skill people notice.
  modules: [ADULT_M3, ADULT_M1, ADULT_M2, ADULT_M4, ADULT_M5, ADULT_M6, ADULT_M7, ADULT_M8],
  showcases: {
    mid: { name: 'The Mock Interview', emoji: '💼', brief: 'A full mock interview for a role you want: a tailored "tell me about yourself", a STAR answer, a structured problem-solving answer and one difficult question handled with composure.' },
    final: { name: 'The Keynote', emoji: '🌟', brief: 'A three-minute signature professional talk: a governing thought, a story with a turn, evidence, the strongest objection answered and a specific call to action.' },
  },
  warmUps: [
    { text: 'Specific Pacific statistics, specifically.', focus: 'S, P and K clusters' },
    { text: 'The sixth sick sheikh’s sixth sheep’s sick.', focus: 'S, SH and K' },
    { text: 'Unique New York, unique New York, you know you need unique New York.', focus: 'N, Y and the silent U' },
    { text: 'Our quarterly quantitative analysis requires rigorous review.', focus: 'Business vocabulary clarity' },
    { text: 'Red leather, yellow leather, red leather, yellow leather.', focus: 'R and L' },
    { text: 'Strategic stakeholder alignment strengthens successful strategies.', focus: 'ST clusters' },
    { text: 'Irish wristwatch, Swiss wristwatch.', focus: 'SH, S and W' },
    { text: 'Thirty-three thirsty thinkers thought thoroughly about Thursday.', focus: 'TH' },
    { text: 'The particular pedagogical principles of peer review.', focus: 'P and multisyllable stress' },
    { text: 'Vincent vowed vengeance very vehemently on a wet Wednesday.', focus: 'V and W' },
    { text: 'Rural juror, rural juror, rural juror.', focus: 'R and L' },
    { text: 'Efficiently facilitating effective feedback.', focus: 'F and stress' },
  ],
};
