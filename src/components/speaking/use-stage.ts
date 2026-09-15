'use client';

import { useAuth, getRole } from '@/components/auth/auth-provider';
import { stageFor, type Stage } from '@/lib/speaking/stages';

/**
 * The Public Speaking stage for whoever is signed in, from their grade. Staff
 * and teachers have no stage of their own; they get Speakers by default and a
 * picker wherever a lesson is shown (see SpeakingLessonView).
 */
export function useLearnerStage(): { stage: Stage; isLearner: boolean } {
  const { profile } = useAuth();
  const role = getRole(profile);
  return { stage: stageFor(profile?.grade ?? null), isLearner: role === 'student' };
}
