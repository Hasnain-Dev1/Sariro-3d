import type { SpeakingCourse } from '../types';
import { PRIMARY_M1, PRIMARY_M2 } from './m1-2';
import { PRIMARY_M3, PRIMARY_M4 } from './m3-4';
import { PRIMARY_M5, PRIMARY_M6 } from './m5-6';
import { PRIMARY_M7, PRIMARY_M8 } from './m7-8';

/**
 * Public Speaking · Grades 4–6 — Explorers
 *
 * School life, made into missions. Nine-to-eleven-year-olds present projects,
 * read in assembly, report the class news, interview grandparents, tell stories
 * with suspense and give their first campaign speech. Drills run up to ninety
 * seconds, writing is three or four sentences, and parents get a home tip.
 */
export const PRIMARY_COURSE: SpeakingCourse = {
  band: 'primary',
  promise: 'Confident speaking for school life, Grades 4–6: project presentations, assembly readings, a newsroom, a storytellers’ club, a first pitch and a class election speech.',
  modules: [PRIMARY_M1, PRIMARY_M2, PRIMARY_M3, PRIMARY_M4, PRIMARY_M5, PRIMARY_M6, PRIMARY_M7, PRIMARY_M8],
  showcases: {
    mid: { name: 'Class Presentation Day', emoji: '🪐', brief: 'Present a project to the class: a hook, three signposted points with a poster or prop, eye contact throughout and an ending that makes people clap.' },
    final: { name: 'The Spotlight Speech', emoji: '🔦', brief: 'Your big speech about something or someone you care about: a hook, a true story, three reasons and a memorable last line.' },
  },
  warmUps: [
    { text: 'Red lorry, yellow lorry, red lorry, yellow lorry.', focus: 'R and L' },
    { text: 'She sells seashells by the seashore.', focus: 'S and SH' },
    { text: 'Peter Piper picked a peck of pickled peppers.', focus: 'P' },
    { text: 'Fred fed Ted bread, and Ted fed Fred bread.', focus: 'F, T and D' },
    { text: 'A proper copper coffee pot.', focus: 'P and K' },
    { text: 'Which witch is which? Which witch is which?', focus: 'W' },
    { text: 'Betty bought a bit of better butter.', focus: 'B and T' },
    { text: 'I scream, you scream, we all scream for ice cream.', focus: 'Where one word ends' },
    { text: 'Six slippery snails slid slowly seaward.', focus: 'S' },
    { text: 'Around the rugged rocks the ragged rascal ran.', focus: 'R' },
    { text: 'Queen Quinn quickly queued for quiche.', focus: 'Q three ways' },
    { text: 'He walked, he played, he wanted, he waited.', focus: '-ED three ways' },
  ],
};
