import { PACE_BAND, scoreBreakdown, type ScoreBreakdown, type SpeechReport } from './analyse';
import type { ModulationReport } from './modulation';

/**
 * SARIRO — Voice Check
 * ============================================================================
 * The free speaking check anybody can take on the website: talk for 45
 * seconds, get told what your voice actually did.
 *
 * It measures nothing new. The pace, the fillers, the pauses and the score all
 * come from lib/speaking/analyse.ts — the engine enrolled students have
 * practised against for months — and expression from lib/speaking/modulation.
 * This module only decides how that is PRESENTED to a stranger: which prompt,
 * which words for the score, which four numbers, which one drill.
 *
 * ── Honest first ────────────────────────────────────────────────────────────
 * The score is the engine's, unchanged, and shown with its five parts. It is
 * already generous by design (see scoreBreakdown) — there is no second,
 * flattering number layered on top for marketing. A parent who notices the
 * score was inflated stops believing everything else on the page.
 */

/** How long the prompt asks them to speak. */
export const TARGET_SECONDS = 45;
/** Recording stops itself here, so a forgotten tab does not listen for ever. */
export const MAX_SECONDS = 60;
/** Below this there is not enough speech to measure honestly. */
export const MIN_SECONDS = 10;
export const MIN_WORDS = 15;

export interface Prompt {
  id: string;
  emoji: string;
  text: string;
}

/**
 * Things a child can talk about for a minute without preparing. Every one is
 * about THEM — the easiest subject anybody has, which keeps nerves out of the
 * measurement.
 *
 * A hundred, because six meant a child who tried three times had seen half of
 * them, and the page opened on the same one for every visitor. Shared with the
 * practice room's "sixty seconds, no notes" drill.
 */
export const PROMPTS: readonly Prompt[] = [
  { id: 'food', emoji: '🍕', text: 'Convince us your favourite food is the best in the world.' },
  { id: 'superpower', emoji: '🦸', text: 'If you had one superpower, what would it be — and what would you do first?' },
  { id: 'proud', emoji: '🏆', text: 'Tell us about a time you felt really proud of yourself.' },
  { id: 'place', emoji: '🗺️', text: 'If you could visit any place tomorrow, where would you go and why?' },
  { id: 'teach', emoji: '🧑‍🏫', text: 'Teach us how to do something you are good at.' },
  { id: 'invention', emoji: '💡', text: 'Invent something that would make school better. Sell it to us.' },
  { id: 'best-day', emoji: '🌞', text: 'Describe the best day you have ever had, from the moment you woke up.' },
  { id: 'pet', emoji: '🐶', text: 'If you could have any animal as a pet, which would you choose and why?' },
  { id: 'hero', emoji: '⭐', text: 'Who is someone you really look up to, and what makes them special?' },
  { id: 'rule', emoji: '📜', text: 'If you could make one new rule for the whole country, what would it be?' },
  { id: 'book', emoji: '📚', text: 'Tell us about a book or film everybody should see, without giving away the ending.' },
  { id: 'future-job', emoji: '🚀', text: 'What job would you love to do when you grow up, and why does it suit you?' },
  { id: 'festival', emoji: '🪔', text: 'Tell us about your favourite festival and how your family celebrates it.' },
  { id: 'friend', emoji: '🤝', text: 'Describe your best friend to someone who has never met them.' },
  { id: 'time-travel', emoji: '⏳', text: 'If you could travel to any time in history, when would you go?' },
  { id: 'hobby', emoji: '🎨', text: 'What do you love doing in your free time? Make us want to try it.' },
  { id: 'fear', emoji: '🦁', text: 'Tell us about something you used to be scared of, and how you got over it.' },
  { id: 'holiday', emoji: '🏖️', text: 'Plan the perfect school holiday for us. Where do we go, and what do we do?' },
  { id: 'robot', emoji: '🤖', text: 'If you had a robot helper for one week, what jobs would you give it?' },
  { id: 'cook', emoji: '🍳', text: 'Explain how to make your favourite snack, step by step.' },
  { id: 'change-school', emoji: '🏫', text: 'If you were head of your school for a day, what would you change?' },
  { id: 'sport', emoji: '⚽', text: 'Which sport is the best in the world? Convince someone who hates it.' },
  { id: 'mistake', emoji: '🔧', text: 'Tell us about a mistake you made that taught you something useful.' },
  { id: 'grandparent', emoji: '👵', text: 'Tell us a story an older person in your family once told you.' },
  { id: 'app', emoji: '📱', text: 'Invent an app that would make life easier for kids. What does it do?' },
  { id: 'animal-day', emoji: '🐘', text: 'If you could be any animal for a day, which would you be and what would you do?' },
  { id: 'kindness', emoji: '💛', text: 'Describe a time someone was kind to you when you really needed it.' },
  { id: 'city', emoji: '🏙️', text: 'What is the best thing about the town or city where you live?' },
  { id: 'lunch', emoji: '🍱', text: 'Design the perfect school lunch. Tell us what is on the plate and why.' },
  { id: 'weekend', emoji: '🎉', text: 'Walk us through your ideal weekend, hour by hour.' },
  { id: 'talent', emoji: '🎤', text: 'What is a hidden talent you have that most people do not know about?' },
  { id: 'space', emoji: '🪐', text: 'Would you like to live on another planet? Give us your reasons.' },
  { id: 'season', emoji: '🌧️', text: 'Which season do you love most, and what makes it better than the rest?' },
  { id: 'museum', emoji: '🏛️', text: 'If you opened a museum about your life, what would be in it?' },
  { id: 'challenge', emoji: '🧗', text: 'Tell us about the hardest thing you have ever done.' },
  { id: 'teacher', emoji: '🍎', text: 'Describe a teacher who made a difference to you, and how.' },
  { id: 'toy', emoji: '🧸', text: 'Tell us about a toy or object you have kept for years, and why it matters.' },
  { id: 'wish', emoji: '🌠', text: 'If you had three wishes, but none could be for yourself, what would they be?' },
  { id: 'game', emoji: '🎲', text: 'Invent a brand new game and explain the rules to us.' },
  { id: 'nature', emoji: '🌳', text: 'Describe your favourite place in nature so clearly that we can picture it.' },
  { id: 'music', emoji: '🎵', text: 'Tell us about a song you love and how it makes you feel.' },
  { id: 'phones', emoji: '📵', text: 'Should children be allowed phones at school? Pick a side and defend it.' },
  { id: 'homework', emoji: '📝', text: 'Should homework be banned? Convince us either way.' },
  { id: 'monster', emoji: '👾', text: 'Invent a friendly monster. What does it look like, and what does it love?' },
  { id: 'rainy-day', emoji: '☔', text: 'You are stuck indoors on a rainy day. How do you make it fun?' },
  { id: 'news', emoji: '📰', text: 'Tell us about something interesting you learned recently.' },
  { id: 'dream-house', emoji: '🏡', text: 'Describe your dream house, room by room.' },
  { id: 'apology', emoji: '🙏', text: 'Tell us about a time you had to say sorry, and how it went.' },
  { id: 'journey', emoji: '🚆', text: 'Describe the most memorable journey you have ever taken.' },
  { id: 'brave', emoji: '🛡️', text: 'Tell us about a time you were brave, even though you were nervous.' },
  { id: 'chores', emoji: '🧹', text: 'Which household chore is the worst? Persuade us to do it for you.' },
  { id: 'zoo', emoji: '🦒', text: 'Should zoos exist? Tell us what you think and why.' },
  { id: 'money', emoji: '💰', text: 'If someone gave you a thousand rupees to help your neighbourhood, how would you spend it?' },
  { id: 'magic-door', emoji: '🚪', text: 'You open a door in your school and find a secret room. What is inside?' },
  { id: 'celebrity', emoji: '🎬', text: 'If you could spend a day with anyone famous, who would it be and what would you ask?' },
  { id: 'language', emoji: '🗣️', text: 'If you could speak any language perfectly overnight, which would you pick?' },
  { id: 'recipe-life', emoji: '🥘', text: 'What is the recipe for a happy life? List the ingredients.' },
  { id: 'weather-control', emoji: '⛅', text: 'If you could control the weather for a week, what would you do?' },
  { id: 'first-memory', emoji: '👶', text: 'What is one of the earliest things you can remember?' },
  { id: 'teach-adult', emoji: '👨‍👩‍👧', text: 'What is something you know that most adults do not? Teach us.' },
  { id: 'invisible', emoji: '👻', text: 'You are invisible for one hour. What do you do, and what do you not do?' },
  { id: 'best-gift', emoji: '🎁', text: 'Tell us about the best gift you have ever given someone.' },
  { id: 'island', emoji: '🏝️', text: 'You are stranded on an island with three things. Which three, and why?' },
  { id: 'dinosaur', emoji: '🦖', text: 'Dinosaurs come back tomorrow. Is that good news or bad news?' },
  { id: 'social-media', emoji: '💬', text: 'What is one thing that is good, and one thing that is bad, about the internet?' },
  { id: 'ocean', emoji: '🌊', text: 'Would you rather explore the deep ocean or outer space? Convince us.' },
  { id: 'uniform', emoji: '👕', text: 'Are school uniforms a good idea? Give us your strongest argument.' },
  { id: 'hometown-guide', emoji: '🧭', text: 'Be a tour guide. Show a visitor the three best spots near your home.' },
  { id: 'bedtime', emoji: '🌙', text: 'Should children choose their own bedtime? Make your case.' },
  { id: 'career-day', emoji: '👩‍🔬', text: 'Describe a job that sounds boring, and make it sound exciting.' },
  { id: 'kind-act', emoji: '🌻', text: 'What is a small act of kindness anyone could do today?' },
  { id: 'favourite-subject', emoji: '🔬', text: 'Which school subject is secretly the most useful? Prove it.' },
  { id: 'animal-talk', emoji: '🦜', text: 'If animals could talk, which one would have the most interesting things to say?' },
  { id: 'twenty-years', emoji: '🔮', text: 'Describe what your life might look like twenty years from now.' },
  { id: 'lost', emoji: '🗺', text: 'Tell us about a time you got lost, and how you found your way.' },
  { id: 'sibling', emoji: '👫', text: 'What is the best, and the hardest, thing about brothers, sisters or cousins?' },
  { id: 'clean-city', emoji: '♻️', text: 'How could your city become cleaner? Give us three real ideas.' },
  { id: 'hidden-gem', emoji: '💎', text: 'Tell us about something small that always makes you happy.' },
  { id: 'dream-trip', emoji: '✈️', text: 'You can take your whole class on one trip. Where do you go?' },
  { id: 'cartoon', emoji: '📺', text: 'Which cartoon character would make the best friend in real life?' },
  { id: 'patience', emoji: '🐢', text: 'Tell us about something that took you a long time to learn.' },
  { id: 'new-sport', emoji: '🏓', text: 'Invent a new Olympic sport and explain how to win it.' },
  { id: 'if-mayor', emoji: '🏛', text: 'You are mayor for a month. What is the first problem you fix?' },
  { id: 'snack-debate', emoji: '🥭', text: 'Mango or banana: which is the better fruit? Settle it once and for all.' },
  { id: 'morning-person', emoji: '⏰', text: 'Are you a morning person or a night person? What does that say about you?' },
  { id: 'surprise', emoji: '🎈', text: 'Plan a surprise for someone you love. What happens?' },
  { id: 'reading-vs-screens', emoji: '📖', text: 'Books or videos: which is the better way to learn something new?' },
  { id: 'helping-hand', emoji: '🙌', text: 'Tell us about a time you helped someone and it made your day.' },
  { id: 'time-machine-future', emoji: '🛸', text: 'Visit the year three thousand. What has changed, and what is still the same?' },
  { id: 'favourite-place-home', emoji: '🛋️', text: 'Where is your favourite spot at home, and what do you do there?' },
  { id: 'rain-or-sun', emoji: '🌦️', text: 'Would you rather have endless summer or endless monsoon? Why?' },
  { id: 'shop', emoji: '🏪', text: 'If you opened a shop, what would you sell and how would you get customers?' },
  { id: 'cricket-captain', emoji: '🏏', text: 'You are captain of a team for the final. Give your team talk.' },
  { id: 'animal-rescue', emoji: '🐾', text: 'Should every family adopt a street animal? Share your view.' },
  { id: 'no-electricity', emoji: '🕯️', text: 'Imagine a week with no electricity. How would your life change?' },
  { id: 'best-advice', emoji: '💬', text: 'What is the best piece of advice anyone has ever given you?' },
  { id: 'invent-holiday', emoji: '📅', text: 'Invent a new national holiday. What do people celebrate, and how?' },
  { id: 'thank-you', emoji: '💌', text: 'Say thank you to someone who deserves it, as if they were listening.' },
  { id: 'proud-of-country', emoji: '🇮🇳', text: 'What is one thing about India that you would show off to the world?' },
  { id: 'one-minute-older', emoji: '🎂', text: 'What would you tell your younger self if you could talk to them for one minute?' },
];

/** A different prompt from the one they just had. */
export function nextPrompt(currentId: string | null, rand: () => number = Math.random): Prompt {
  const pool = PROMPTS.filter((p) => p.id !== currentId);
  return pool[Math.floor(rand() * pool.length)] ?? PROMPTS[0];
}

export type Validity =
  | { ok: true }
  | { ok: false; reason: 'no_words' | 'too_short' | 'too_few_words'; message: string };

/**
 * Whether there is enough here to put a number on. A score for eight words is
 * a random number with a decimal point, and giving a child one would be worse
 * than giving them none.
 */
export function checkRecording(input: { durationMs: number; words: number; heardWords: boolean }): Validity {
  if (!input.heardWords) {
    return {
      ok: false,
      reason: 'no_words',
      message: 'We could not hear any words. Check the microphone is allowed, speak up a little, and try again.',
    };
  }
  if (input.durationMs < MIN_SECONDS * 1000) {
    return {
      ok: false,
      reason: 'too_short',
      message: `Keep going a little longer — at least ${MIN_SECONDS} seconds gives us enough to measure.`,
    };
  }
  if (input.words < MIN_WORDS) {
    return {
      ok: false,
      reason: 'too_few_words',
      message: 'We only caught a few words. Try again, and keep talking until the timer is nearly done.',
    };
  }
  return { ok: true };
}

export interface ScoreBand {
  label: string;
  blurb: string;
  tone: 'gold' | 'green' | 'blue' | 'violet';
}

/** What the number means, in words a child is glad to read. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return { label: 'Stage-ready', blurb: 'Clear, steady and easy to follow. That is a voice people listen to.', tone: 'gold' };
  if (score >= 70) return { label: 'Confident speaker', blurb: 'Most of what makes a good speaker is already there.', tone: 'green' };
  if (score >= 55) return { label: 'Strong start', blurb: 'A few habits away from sounding really confident.', tone: 'blue' };
  return { label: 'Warming up', blurb: 'Everybody starts somewhere — and the second try is usually a big jump.', tone: 'violet' };
}

export interface Tile {
  key: 'pace' | 'fillers' | 'pauses' | 'expression';
  label: string;
  value: string;
  unit: string;
  good: boolean;
  /** One sentence about what the number means for THEM. */
  hint: string;
}

/** The four numbers worth showing a stranger, each with what it means. */
export function tilesFor(report: SpeechReport, modulation: ModulationReport | null): Tile[] {
  const { wpm, verdict } = report.pace;
  const pace: Tile = {
    key: 'pace',
    label: 'Pace',
    value: String(wpm),
    unit: 'words / min',
    good: verdict === 'good',
    hint:
      verdict === 'high'
        ? `A little fast — ${PACE_BAND.min}–${PACE_BAND.max} is easiest to follow.`
        : verdict === 'low'
          ? `A little slow — ${PACE_BAND.min}–${PACE_BAND.max} keeps listeners with you.`
          : 'Just right — easy for anybody to follow.',
  };

  const top = topFiller(report);
  const fillers: Tile = {
    key: 'fillers',
    label: 'Filler words',
    value: String(report.fillers.certain),
    unit: report.fillers.certain === 1 ? 'filler' : 'fillers',
    good: report.fillers.perMinute <= 2,
    hint:
      report.fillers.certain === 0
        ? 'No "um" or "uh" at all. That sounds confident.'
        : `Mostly "${top}". A short silence sounds stronger.`,
  };

  const pauses: Tile = {
    key: 'pauses',
    label: 'Pauses',
    value: String(report.pauses.count),
    unit: report.pauses.count === 1 ? 'pause' : 'pauses',
    good: report.pauses.count > 0,
    hint:
      report.pauses.count === 0
        ? 'No pauses — a breath between ideas helps people keep up.'
        : 'Good — pausing gives every idea room to land.',
  };

  const scored = modulation?.scored ?? false;
  const band = modulation?.band ?? 'steady';
  const expression: Tile = {
    key: 'expression',
    label: 'Expression',
    value: scored ? String(modulation!.expressiveness) : '—',
    unit: scored ? band : 'needs a longer recording',
    good: scored ? band !== 'flat' : !report.delivery.monotone,
    hint: !scored
      ? 'Speak a little longer and louder for us to hear your voice move.'
      : band === 'flat'
        ? 'Quite flat — let your voice rise and fall like a story.'
        : band === 'lively'
          ? 'Lively! Your voice moves in a way that holds attention.'
          : 'Steady — a little more rise and fall would add colour.',
  };

  return [pace, fillers, pauses, expression];
}

export interface VoiceDrill {
  title: string;
  steps: string;
  seconds: number;
}

/**
 * The filler worth naming. A certain one ("um") before a hedged one ("like"),
 * because "like" is as often a real word — "I like it" — and telling a child
 * their verbs were fillers is how they stop believing the rest.
 */
export function topFiller(report: SpeechReport): string {
  const b = report.fillers.breakdown;
  return b.find((f) => f.certain)?.word ?? b[0]?.word ?? 'um';
}

/** The part of the score with the most room to grow. Ties go in listed order. */
export function weakestPart(b: ScoreBreakdown): keyof ScoreBreakdown {
  const order: (keyof ScoreBreakdown)[] = ['fillers', 'pausing', 'pace', 'delivery', 'phrasing'];
  return order.reduce((worst, k) => (b[k] < b[worst] ? k : worst), order[0]);
}

/**
 * One thing to try, right now, for the part that cost the most points.
 * One — a list of five tips is a list of none.
 */
export function drillFor(report: SpeechReport): VoiceDrill {
  const part = weakestPart(scoreBreakdown(report));

  switch (part) {
    case 'fillers': {
      const word = topFiller(report);
      // "an um", "an uh" — but "a like", "a basically".
      const article = /^[aeiou]/i.test(word) ? 'an' : 'a';
      return {
        title: 'The silent swap',
        steps: `Say your answer again. Every time ${article} "${word}" is coming, close your mouth and pause instead. Silence sounds confident — "${word}" does not.`,
        seconds: 20,
      };
    }
    case 'pausing':
      return {
        title: 'The power pause',
        steps: 'Pick your best sentence. Say it, stop for two full seconds, then say why it matters. Feel how much stronger it lands.',
        seconds: 20,
      };
    case 'pace':
      return report.pace.verdict === 'low'
        ? {
            title: 'Keep it rolling',
            steps: 'Say your first two sentences again without stopping between words. Keep your energy up all the way to the full stop.',
            seconds: 20,
          }
        : {
            title: 'The speed bump',
            steps: 'Say your first sentence again, taking one full breath at every comma. Make it last twice as long as before.',
            seconds: 20,
          };
    case 'delivery':
      return report.delivery.tooQuiet
        ? {
            title: 'Back of the room',
            steps: 'Imagine someone at the far end of a big room. Say your first sentence so they hear every word — clearly, not shouting.',
            seconds: 15,
          }
        : {
            title: 'Colour your voice',
            steps: 'Say "I can’t believe it!" three ways: surprised, excited, then whispering a secret. That rise and fall is expression.',
            seconds: 15,
          };
    case 'phrasing':
    default:
      return {
        title: 'One idea, one breath',
        steps: 'Say your answer again as short ideas. Finish one idea, breathe, then start the next.',
        seconds: 20,
      };
  }
}

/** What goes out with the share card. */
export function shareMessage(score: number, band: ScoreBand, url: string): string {
  return `I scored ${score}/100 — "${band.label}" — on the Sariro Voice Check. Free, and it takes 45 seconds: ${url}`;
}
