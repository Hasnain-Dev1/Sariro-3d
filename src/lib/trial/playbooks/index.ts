import type { Playbook } from './types';
import { optionsFor } from '@/lib/dashboard/course-options';
import { codingPlaybook } from './coding';
import { mathsPlaybook } from './maths';
import { sciencePlaybook, physicsPlaybook, chemistryPlaybook, biologyPlaybook } from './sciences';
import { englishPlaybook, speakingPlaybook } from './language';
import {
  algebra1Playbook, algebra2Playbook, trigonometryPlaybook, calculusPlaybook, mechanicsPlaybook, organicPlaybook,
} from './focus';

/**
 * SARIRO — every trial, planned
 * ============================================================================
 * One playbook per trial subject a family can book (lib/trial/subjects.ts).
 * playbooks.test.ts checks the two lists agree, so a subject added to the
 * booking page without a plan fails the build rather than a family's trial.
 */

export const PLAYBOOKS: Playbook[] = [
  codingPlaybook,
  mathsPlaybook,
  sciencePlaybook,
  physicsPlaybook,
  chemistryPlaybook,
  biologyPlaybook,
  englishPlaybook,
  speakingPlaybook,
  algebra1Playbook,
  algebra2Playbook,
  trigonometryPlaybook,
  calculusPlaybook,
  mechanicsPlaybook,
  organicPlaybook,
];

/**
 * The playbook for a trial's subject. A trial booked before coding was one
 * subject carries a specific coding track (web-builder-pro); that is still a
 * coding trial.
 */
export function playbookFor(subject: string | null | undefined): Playbook | null {
  const s = (subject ?? '').trim().toLowerCase();
  if (!s) return null;
  const direct = PLAYBOOKS.find((p) => p.subject === s);
  if (direct) return direct;
  if (optionsFor('coding').some((o) => o.value === s)) return codingPlaybook;
  return null;
}

export type { Playbook, Path, Step, Level, Band, TrialIntake, WarmUp, DiagnosticQuestion, Tool } from './types';
export { rankPaths, bandOf, startingLevel, warmUpsFor, cleanIntake, BAND_LABEL, LEVEL_LABEL, type RankedPath } from './recommend';
