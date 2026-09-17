import type { SpeakingCourse } from '../types';
import { FOUNDATION_M1, FOUNDATION_M2 } from './m1-2';
import { FOUNDATION_M3, FOUNDATION_M4 } from './m3-4';
import { FOUNDATION_M5, FOUNDATION_M6 } from './m5-6';
import { FOUNDATION_M7, FOUNDATION_M8 } from './m7-8';

/**
 * Public Speaking · Grades 1–3 — Sprouts
 *
 * Learning through play. A six-year-old does not learn "vocal variety"; they
 * learn Leo the Lion's big voice and the mouse's small one. Every lesson is a
 * game, a character or a pretend situation, drills are under a minute, nobody
 * writes, and every lesson ends with two minutes for a parent at home.
 *
 * The guides are Sariro's own characters. Licensed ones (Mickey Mouse and
 * friends) cannot be used in a paid course without Disney's permission.
 */
export const FOUNDATION_COURSE: SpeakingCourse = {
  band: 'foundation',
  promise: 'Play-based speaking for Grades 1–3: animal voices, show and tell, puppets, stories and a Superstar Show — with friendly characters as guides and a two-minute home activity after every class.',
  cast: [
    { name: 'Mika the Mic', emoji: '🎤', teaches: 'your voice, and the courage to start' },
    { name: 'Leo the Lion', emoji: '🦁', teaches: 'a big, brave, clear voice' },
    { name: 'Tara the Turtle', emoji: '🐢', teaches: 'slowing down and pausing' },
    { name: 'Pip the Parrot', emoji: '🦜', teaches: 'listening and saying it back' },
    { name: 'Ollie the Owl', emoji: '🦉', teaches: 'questions and stories' },
    { name: 'Bunny Bea', emoji: '🐰', teaches: 'butterflies, and being brave anyway' },
  ],
  modules: [FOUNDATION_M1, FOUNDATION_M2, FOUNDATION_M3, FOUNDATION_M4, FOUNDATION_M5, FOUNDATION_M6, FOUNDATION_M7, FOUNDATION_M8],
  showcases: {
    mid: { name: 'The Little Stage', emoji: '🌟', brief: 'Your first show! Walk to the stage, stand like a tree, and show and tell something special — what it is, why you love it and one fun thing — then take a bow.' },
    final: { name: 'The Superstar Show', emoji: '🏆', brief: 'The big show: a poem, a story or your dream talk, with a big Leo voice, a superhero pose, a smile for your audience and a bow at the end.' },
  },
  warmUps: [
    { text: 'Big bear, big bear, bounce the ball.', focus: 'B — bouncy lips' },
    { text: 'Six silly snakes sit in the sun.', focus: 'S — the snake sound' },
    { text: 'Red lorry, yellow lorry.', focus: 'R and L' },
    { text: 'Fuzzy funny frogs find flies.', focus: 'F — teeth on lip' },
    { text: 'Mummy made me mash my muffin.', focus: 'M — humming lips' },
    { text: 'Tiny Tim tickles tigers.', focus: 'T — tongue taps' },
    { text: 'Pink pigs play in purple puddles.', focus: 'P — popping lips' },
    { text: 'Wiggly worms wear warm woolly socks.', focus: 'W — round lips' },
    { text: 'Clever cats count cupcakes.', focus: 'C and K' },
    { text: 'Three thick thumbs.', focus: 'TH — tongue out' },
    { text: 'Lazy lions lick lollipops.', focus: 'L — tongue up' },
    { text: 'Dizzy ducks dance on the dock.', focus: 'D' },
  ],
};
