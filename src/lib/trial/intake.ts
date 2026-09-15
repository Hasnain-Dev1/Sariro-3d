import type { TrialIntake } from './playbooks/types';

/**
 * SARIRO — the family's side of trial prep, pure
 * ============================================================================
 * /my-class asks in three small steps and saves after each one, so a family
 * that only does the first step still tells the teacher something. That makes
 * every save a PATCH: what was sent is laid over what is already stored, and a
 * step that is not part of this save is left alone.
 */

export type PrepStep = 'about' | 'sound' | 'warmup';

export const PREP_STEPS: PrepStep[] = ['about', 'sound', 'warmup'];

/** Lay a partial save over the stored answers. `undefined` never erases. */
export function mergeIntake(stored: TrialIntake | null | undefined, patch: TrialIntake): TrialIntake {
  const out: TrialIntake = { ...(stored ?? {}) };
  for (const [k, v] of Object.entries(patch) as [keyof TrialIntake, unknown][]) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** Which of the three steps the answers already cover. */
export function stepsDone(intake: TrialIntake | null | undefined): Record<PrepStep, boolean> {
  return {
    about: !!intake && (intake.experience !== undefined || (intake.interests?.length ?? 0) > 0 || intake.feeling !== undefined),
    sound: intake?.micOk === true,
    warmup: !!intake?.warmUp && intake.warmUp.total > 0,
  };
}

/**
 * Did the microphone hear a voice? Levels are 0–1 RMS samples. A few loud
 * frames, not one: a single spike is a knock on the desk, and a microphone that
 * is plugged in but muted still reports a whisper of noise.
 */
export function micHeard(levels: readonly number[], threshold = 0.04, frames = 4): boolean {
  let run = 0;
  for (const l of levels) {
    run = l >= threshold ? run + 1 : 0;
    if (run >= frames) return true;
  }
  return false;
}

/** How a teacher reads the family's feeling. */
export const FEELING: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😟', label: 'Nervous' },
  2: { emoji: '🙂', label: 'A bit unsure' },
  3: { emoji: '😊', label: 'Okay' },
  4: { emoji: '😄', label: 'Excited' },
  5: { emoji: '🤩', label: 'Can’t wait' },
};
