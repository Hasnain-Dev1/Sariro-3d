import { checkAnswer } from '../check';
import type { Item } from '../types';

/**
 * SARIRO — Meteor Storm: the rules (pure)
 * ============================================================================
 * One step of the game at a time — spawn, fall, land — and one shot at a time.
 * The component (components/practice/games/meteor-storm.tsx) only draws what
 * these return and feeds them the clock and the keyboard, so every rule here is
 * tested without a browser.
 */

export interface Meteor {
  id: number;
  item: Item;
  /** 0–100 across. */
  x: number;
  /** 0–100 down; 100 is the ground. */
  y: number;
  /** Percent of the height per second. */
  speed: number;
}

export interface StormState {
  meteors: Meteor[];
  score: number;
  combo: number;
  hearts: number;
  hits: number;
  misses: number;
  nextId: number;
  /** ms timestamp of the last spawn. */
  lastSpawn: number;
  over: boolean;
}

export const STORM_HEARTS = 3;
export const MAX_ON_SCREEN = 4;

export const newStorm = (): StormState => ({
  meteors: [], score: 0, combo: 0, hearts: STORM_HEARTS, hits: 0, misses: 0, nextId: 1, lastSpawn: -Infinity, over: false,
});

/** A new meteor every 3.2 s at first, down to every 1.3 s. */
export const spawnEvery = (score: number) => Math.max(1300, 3200 - score * 4);
/** Falls the height in 20 s at first, in about 7 s at the fastest. */
export const fallSpeed = (score: number) => 5 + Math.min(9, score / 60);
/** Points for a hit on a combo of `combo` before it. */
export const pointsFor = (combo: number) => Math.round(10 * Math.min(5, 1 + combo * 0.5));

/**
 * Advance the storm to `now` (ms), `dt` seconds after the last step. `spawn`
 * makes the next question and where it falls. Returns the new state and the
 * meteors that hit the ground this step.
 */
export function stepStorm(
  st: StormState,
  now: number,
  dt: number,
  spawn: () => { item: Item; x: number }
): { st: StormState; landed: Meteor[] } {
  if (st.over) return { st, landed: [] };
  let meteors = st.meteors;
  let { nextId, lastSpawn } = st;
  if (meteors.length < MAX_ON_SCREEN && now - lastSpawn >= spawnEvery(st.score)) {
    const s = spawn();
    meteors = [...meteors, { id: nextId++, item: s.item, x: s.x, y: -8, speed: fallSpeed(st.score) }];
    lastSpawn = now;
  }
  const landed: Meteor[] = [];
  meteors = meteors
    .map((m) => ({ ...m, y: m.y + m.speed * dt }))
    .filter((m) => (m.y >= 100 ? (landed.push(m), false) : true));
  const hearts = Math.max(0, st.hearts - landed.length);
  return {
    st: { ...st, meteors, nextId, lastSpawn, hearts, combo: landed.length ? 0 : st.combo, over: hearts <= 0 },
    landed,
  };
}

/**
 * One shot: the answer destroys the LOWEST meteor it is right for (the most
 * urgent one). A shot that hits nothing breaks the combo but costs no heart.
 */
export function fireStorm(st: StormState, answer: string): { st: StormState; hit: Meteor | null; gained: number } {
  const text = answer.trim();
  if (!text || st.over) return { st, hit: null, gained: 0 };
  const hit = [...st.meteors]
    .sort((a, b) => b.y - a.y)
    .find((m) => checkAnswer(m.item.answer, { kind: 'text', text }).correct) ?? null;
  if (!hit) return { st: { ...st, combo: 0, misses: st.misses + 1 }, hit: null, gained: 0 };
  const gained = pointsFor(st.combo);
  return {
    st: { ...st, meteors: st.meteors.filter((m) => m.id !== hit.id), score: st.score + gained, combo: st.combo + 1, hits: st.hits + 1 },
    hit,
    gained,
  };
}
