import type { SpeakingCourse } from '../types';
import { MIDDLE_M1, MIDDLE_M2 } from './m1-2';
import { MIDDLE_M3, MIDDLE_M4 } from './m3-4';
import { MIDDLE_M5, MIDDLE_M6 } from './m5-6';
import { MIDDLE_M7, MIDDLE_M8 } from './m7-8';

/**
 * Public Speaking · Grades 7–9 — Speakers
 *
 * The years when the fear of being judged is loudest and speaking in front of
 * the class starts to count. Confidence under pressure, structure, debate,
 * spotting manipulation online, the student council, Model UN, podcasts and
 * reels, and a talk about a cause they care about.
 */
export const MIDDLE_COURSE: SpeakingCourse = {
  band: 'middle',
  promise: 'Confidence and influence for Grades 7–9: speaking without fear of judgement, structuring talks, debating, persuading honestly, Model UN, speaking on camera and a TED-style talk.',
  // Confidence first: at thirteen the fear of being judged is the wall, not the voice.
  modules: [MIDDLE_M2, MIDDLE_M1, MIDDLE_M3, MIDDLE_M4, MIDDLE_M5, MIDDLE_M6, MIDDLE_M7, MIDDLE_M8],
  showcases: {
    mid: { name: 'The Class Talk', emoji: '🖥️', brief: 'A ninety-second presentation on something you care about: a one-sentence message, an opener that grabs the class, three signposted PREP points and a closer that sticks — then two questions answered.' },
    final: { name: 'The Main Stage Talk', emoji: '🎤', brief: 'A two-minute persuasive talk on a cause you care about, built around your own story, with evidence, the strongest objection answered and a specific call to action.' },
  },
  warmUps: [
    { text: 'Unique New York, unique New York, you know you need unique New York.', focus: 'N, Y and the silent U' },
    { text: 'Red leather, yellow leather, red leather, yellow leather.', focus: 'R and L' },
    { text: 'Truly rural, truly rural, truly rural.', focus: 'R and L' },
    { text: 'Vincent vowed vengeance very vehemently on a wet Wednesday.', focus: 'V and W' },
    { text: 'Thirty-three thirsty thinkers thought thoroughly about Thursday.', focus: 'TH' },
    { text: 'The sixth sick sheikh’s sixth sheep’s sick.', focus: 'S, SH and K' },
    { text: 'Good blood, bad blood. Good blood, bad blood.', focus: 'OO two ways' },
    { text: 'Toy boat, toy boat, toy boat.', focus: 'T and B' },
    { text: 'Eleven benevolent elephants.', focus: 'L and V' },
    { text: 'Irish wristwatch, Swiss wristwatch.', focus: 'SH, S and W' },
    { text: 'Six thick thistle sticks.', focus: 'S and TH' },
    { text: 'The tip of the tongue, the teeth, the lips.', focus: 'Crisp consonants' },
  ],
};
