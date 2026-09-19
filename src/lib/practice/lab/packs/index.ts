import type { Challenge, LabLanguage, Tier } from '../types';
import { JAVASCRIPT } from './javascript';
import { PYTHON } from './python';
import { WEB } from './web';

/**
 * SARIRO — Code Lab: the packs, and which one each course opens on
 * ============================================================================
 * Every coding student can use every pack; the course decides which opens
 * first and which tier is suggested. Java (Java Basics, AP Computer Science)
 * has no in-browser runner yet, so those courses open on JavaScript — the
 * nearest syntax — until it does.
 */

export interface Pack {
  lang: LabLanguage;
  label: string;
  /** The file name shown on the editor tab. */
  file: string;
  challenges: Challenge[];
}

export const PACKS: Record<LabLanguage, Pack> = {
  python: { lang: 'python', label: 'Python', file: 'main.py', challenges: PYTHON },
  javascript: { lang: 'javascript', label: 'JavaScript', file: 'main.js', challenges: JAVASCRIPT },
  web: { lang: 'web', label: 'HTML & CSS', file: 'index.html', challenges: WEB },
};

export const ALL_CHALLENGES: Challenge[] = [...PYTHON, ...JAVASCRIPT, ...WEB];

const BY_ID = new Map(ALL_CHALLENGES.map((c) => [c.id, c]));
export const challengeById = (id: string): Challenge | undefined => BY_ID.get(id);

const PYTHON_FIRST = new Set(['python', 'data', 'agent', 'automation', 'security', 'cloud', 'scratch']);
const WEB_FIRST = new Set(['web-basics', 'design']);

/** The packs in the order a course's learner sees them — their course's language first. */
export function packOrder(track: string | null | undefined): LabLanguage[] {
  const t = String(track ?? '').toLowerCase();
  if (PYTHON_FIRST.has(t)) return ['python', 'javascript', 'web'];
  if (WEB_FIRST.has(t)) return ['web', 'javascript', 'python'];
  return ['javascript', 'python', 'web'];
}

/** Whether the course's own language has no runner yet (Java). */
export const awaitingRunner = (track: string | null | undefined) => ['java', 'ap-cs'].includes(String(track ?? '').toLowerCase());

/** The tier a course level suggests: Elementary 1 … Advanced 4 (`level` is the room's 1–4 index). */
export const suggestedTier = (level: number | null | undefined): Tier => Math.max(1, Math.min(4, Math.round(level ?? 1))) as Tier;
