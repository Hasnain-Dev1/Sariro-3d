import { STORIES } from './stories';
import { SCIENCE } from './science';
import { HISTORY } from './history';
import { EVERYDAY } from './everyday';
import { WORLD } from './world';
import { IDEAS } from './ideas';
import type { Passage } from './types';

export type { Passage, PassageTopic } from './types';

/**
 * SARIRO — a minute of reading, a hundred and twenty times over
 * ============================================================================
 * The practice room had ONE passage to read aloud and four short sentences to
 * listen to, and the listening drill always started on the first. A child who
 * came back on Tuesday met exactly what they met on Monday — and a passage you
 * have read five times measures your memory, not your reading.
 *
 * So there is a library: stories, science, history, everyday life, India and
 * the world, and short talks with a point to make. Each one is about a minute
 * aloud (~150 words), written to be spoken, and shared by the read-aloud drill
 * and the listening drill. Each drill deals its own copy without repeats — see
 * deck.ts — so nobody meets the same passage twice until they have met them all.
 */
export const PASSAGES: readonly Passage[] = [...STORIES, ...SCIENCE, ...HISTORY, ...EVERYDAY, ...WORLD, ...IDEAS];

const BY_ID = new Map(PASSAGES.map((p) => [p.id, p]));

export const passageById = (id: string | null | undefined): Passage | null => (id ? BY_ID.get(id) ?? null : null);

/** A comfortable reading pace, for "about a minute". */
export const READING_WPM = 150;

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Roughly how long it takes to read aloud, in seconds. */
export const readingSeconds = (p: Passage) => Math.round((wordCount(p.text) / READING_WPM) * 60);
