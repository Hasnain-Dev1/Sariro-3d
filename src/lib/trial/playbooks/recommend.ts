import type { Band, Level, Path, Playbook, TrialIntake, WarmUp } from './types';
import { GRADE_UNDERGRADUATE } from '@/lib/grade/tag';

/**
 * SARIRO — which path, for this child
 * ============================================================================
 * The playbook has the alternatives; this picks the order to offer them in,
 * from what we know before the class starts: the grade, what the family said
 * about experience and interests, and how the warm-up went.
 *
 * It never hides a path. A teacher knows things a form does not — a child who
 * ticked "brand new" and turns out to have built three games — so every path
 * stays one click away and the top one is only a starting suggestion, with the
 * reasons written out so the teacher can disagree with them.
 */

export function bandOf(grade: number | null | undefined): Band | null {
  if (grade === null || grade === undefined || !Number.isFinite(grade)) return null;
  if (grade >= GRADE_UNDERGRADUATE) return 'adult';
  if (grade >= 10) return 'senior';
  if (grade >= 7) return 'middle';
  if (grade >= 4) return 'primary';
  if (grade >= 1) return 'foundation';
  return null;
}

export const BAND_LABEL: Record<Band, string> = {
  foundation: 'Grades 1–3',
  primary: 'Grades 4–6',
  middle: 'Grades 7–9',
  senior: 'Grades 10–12',
  adult: 'UG, PG & professionals',
};

export const LEVEL_LABEL: Record<Level, string> = {
  new: 'New to it',
  some: 'Some experience',
  strong: 'Ahead',
};

const UP: Record<Level, Level> = { new: 'some', some: 'strong', strong: 'strong' };
const DOWN: Record<Level, Level> = { new: 'new', some: 'new', strong: 'some' };

/**
 * Where to pitch the start. What the family said, nudged by the warm-up: a
 * clean sweep moves one step up, getting none right moves one step down. With
 * nothing said at all, "some" — the middle is the cheapest place to be wrong.
 */
export function startingLevel(intake: TrialIntake | null | undefined): Level {
  const said = intake?.experience ?? 'some';
  const w = intake?.warmUp;
  if (!w || w.total <= 0) return said;
  if (w.correct >= w.total) return UP[said];
  if (w.correct === 0) return DOWN[said];
  return said;
}

export interface RankedPath {
  path: Path;
  score: number;
  /** Why it is here, in the order that matters. */
  reasons: string[];
  /** Does not suit this child's grade — offered last, never hidden. */
  offBand: boolean;
}

export function rankPaths(
  playbook: Playbook,
  who: { grade: number | null | undefined; intake?: TrialIntake | null }
): RankedPath[] {
  const band = bandOf(who.grade);
  const level = startingLevel(who.intake);
  const interests = new Set(who.intake?.interests ?? []);
  const interestName = (id: string) => playbook.intake.interests.find((i) => i.id === id)?.label.toLowerCase() ?? id;

  const ranked = playbook.paths.map((path, index) => {
    const reasons: string[] = [];
    let score = 0;
    const bandFits = band === null || path.bands.includes(band);
    if (band && bandFits) { score += 4; reasons.push(`Suits ${BAND_LABEL[band]}`); }
    if (path.levels.includes(level)) { score += 3; reasons.push(`Pitched for “${LEVEL_LABEL[level].toLowerCase()}”`); }
    const liked = path.interests.filter((i) => interests.has(i));
    if (liked.length) { score += 2 * liked.length; reasons.push(`They said they like ${liked.map(interestName).join(' and ')}`); }
    return { path, score: score - index * 0.01, reasons, offBand: !bandFits };
  });

  return ranked.sort((a, b) => Number(a.offBand) - Number(b.offBand) || b.score - a.score);
}

/**
 * Three warm-up questions for this child: ones written for their band first,
 * then the ones written for everybody. Stable order, so the family and the
 * teacher see the same three.
 */
export function warmUpsFor(playbook: Playbook, grade: number | null | undefined, count = 3): WarmUp[] {
  const band = bandOf(grade);
  const forBand = band ? playbook.intake.warmUps.filter((w) => w.bands?.includes(band)) : [];
  const general = playbook.intake.warmUps.filter((w) => !w.bands);
  const pool = [...forBand, ...general];
  return (pool.length >= count ? pool : [...pool, ...playbook.intake.warmUps.filter((w) => !pool.includes(w))]).slice(0, count);
}

/** Clean what a family sent before it is stored. Unknown ids are dropped. */
export function cleanIntake(playbook: Playbook | null, raw: unknown): TrialIntake {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: TrialIntake = {};
  const levels = new Set(['new', 'some', 'strong']);
  if (typeof r.experience === 'string' && levels.has(r.experience)) out.experience = r.experience as Level;
  if (Array.isArray(r.interests)) {
    const known = new Set(playbook?.intake.interests.map((i) => i.id) ?? []);
    out.interests = [...new Set(r.interests.filter((i): i is string => typeof i === 'string' && known.has(i)))].slice(0, 6);
  }
  if (typeof r.feeling === 'number' && Number.isInteger(r.feeling) && r.feeling >= 1 && r.feeling <= 5) out.feeling = r.feeling;
  if (typeof r.question === 'string' && r.question.trim()) out.question = r.question.trim().slice(0, 280);
  const w = r.warmUp as { correct?: unknown; total?: unknown } | undefined;
  if (w && Number.isInteger(w.correct) && Number.isInteger(w.total) && (w.total as number) > 0 && (w.total as number) <= 10
    && (w.correct as number) >= 0 && (w.correct as number) <= (w.total as number)) {
    out.warmUp = { correct: w.correct as number, total: w.total as number };
  }
  if (typeof r.micOk === 'boolean') out.micOk = r.micOk;
  return out;
}
