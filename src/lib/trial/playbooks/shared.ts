import type { Level, Step } from './types';

/**
 * The parts every trial shares. The first five minutes and the last five are
 * where trials are won or lost regardless of subject: a child who is not
 * settled learns nothing, and a parent who is not told something true at the
 * end remembers nothing.
 */

export function opening(icebreaker: string, extra: string[] = []): Step {
  return {
    minutes: 5,
    title: 'Welcome, and find out who this is',
    do: [
      'Camera on, smile, say their name before anything else. Check they can hear you and see your screen.',
      'Parent in the room? Say hello to them too, then tell them they are welcome to stay or step out.',
      icebreaker,
      'Read what the family told us (above) out loud to the child: “You said you like …”. It shows you listened before you met.',
      ...extra,
      'Ask the two diagnostic questions below. Pick the path from the answers, not from the grade alone.',
    ],
    say: 'This is not a test. Nothing you do today can be wrong — I just want to see how you think.',
    check: 'They have spoken at least three full sentences to you.',
  };
}

export function close(showOff: string): Step {
  return {
    minutes: 5,
    title: 'Show it off, then the honest read',
    do: [
      showOff,
      'Ask the child: “What was the hardest bit? What would you do next?” Let them answer first.',
      'Invite the parent back. Give the honest read below — one strength, one thing to work on, what you would do in the course.',
      'Never quote prices or push a plan. A counsellor calls them; say so.',
      'End on time. A trial that runs over tells a parent the classes will too.',
    ],
    say: 'You did something today you could not do at the start of this class. That is what every class here feels like.',
    check: 'The parent heard one specific thing their child did well, in your words.',
  };
}

export const EXPERIENCE = (newLabel: string, someLabel: string, strongLabel: string): { id: Level; label: string }[] => [
  { id: 'new', label: newLabel },
  { id: 'some', label: someLabel },
  { id: 'strong', label: strongLabel },
];
