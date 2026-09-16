'use client';

import { useEffect, useState } from 'react';
import { useAuth, getRole } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { stageFor, type Stage } from '@/lib/speaking/stages';
import { bandOfLevel, SPEAKING_TRACK_SLUG } from '@/lib/speaking/bands';

/**
 * The Public Speaking stage for whoever is signed in.
 *
 * A student enrolled in one of the five band courses (lib/speaking/bands.ts)
 * gets THAT band — the course bought is the course taught, even when the grade
 * on the profile says otherwise or is missing. Anybody else — an enrolment
 * from before the bands, or no enrolment — gets the band their grade falls in.
 * Staff and teachers have no stage of their own; they get Speakers by default
 * and a picker wherever a lesson is shown (see SpeakingLessonView).
 */
export function useLearnerStage(): { stage: Stage; isLearner: boolean } {
  const { user, profile } = useAuth();
  const isLearner = getRole(profile) === 'student';
  const userId = user?.id ?? null;
  const [enrolled, setEnrolled] = useState<{ userId: string; band: Stage | null } | null>(null);

  useEffect(() => {
    if (!userId || !isLearner) return;
    let live = true;
    createClient()
      .from('enrollments')
      .select('level, created_at')
      .eq('user_id', userId)
      .eq('track', SPEAKING_TRACK_SLUG)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!live) return;
        const band = ((data ?? []) as { level: string | null }[]).map((r) => bandOfLevel(r.level)).find((b) => b) ?? null;
        setEnrolled({ userId, band });
      });
    return () => { live = false; };
  }, [userId, isLearner]);

  const band = enrolled && enrolled.userId === userId ? enrolled.band : null;
  return { stage: band ?? stageFor(profile?.grade ?? null), isLearner };
}
