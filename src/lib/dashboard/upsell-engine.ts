/**
 * SARIRO — Upsell Engine
 * 
 * Pure logic for the post-completion upsell flow.
 * 
 * Chain:
 *   Beginner completed   → pitch Intermediate (same track)
 *   Intermediate completed → pitch Advanced (same track)
 *   Advanced completed    → pitch Beginner (NEXT track in cycle)
 * 
 * Track cycle:
 *   web → app → saas → agent → data → cloud → design → game → automation → security → web...
 */

import { TRACKS } from '@/lib/sariro-data';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CompletedEnrollment {
  id: string;
  track: string;
  level: CourseLevel;
  track_name: string;
}

export interface UpsellRecommendation {
  next_track_id: string;
  next_track_name: string;
  next_level: CourseLevel;
  pitch_variant: 'beginner_to_intermediate' | 'intermediate_to_advanced' | 'advanced_to_next_track';
  heading: string;
  body: string;
  primary_cta_label: string;
}

/* Returns the next track ID in the cycle (wraps around) */
export function getNextTrackId(currentTrackId: string): string {
  const idx = TRACKS.findIndex(t => t.id === currentTrackId);
  if (idx === -1) return TRACKS[0].id; // fallback
  const nextIdx = (idx + 1) % TRACKS.length;
  return TRACKS[nextIdx].id;
}

export function getTrackName(trackId: string): string {
  return TRACKS.find(t => t.id === trackId)?.name ?? trackId;
}

/**
 * Given a completed enrollment, returns the recommended next course
 * + the pitch copy to show in the popup.
 */
export function getUpsellRecommendation(
  enrollment: CompletedEnrollment,
  studentFirstName: string
): UpsellRecommendation {
  const currentTrackName = enrollment.track_name;
  const firstName = studentFirstName || 'there';

  // Beginner → Intermediate (same track)
  if (enrollment.level === 'beginner') {
    return {
      next_track_id: enrollment.track,
      next_track_name: currentTrackName,
      next_level: 'intermediate',
      pitch_variant: 'beginner_to_intermediate',
      heading: `Hey ${firstName}! You just unlocked the foundations. Ready to build for real?`,
      body: `You just finished ${currentTrackName} — Beginner. That's a real milestone — you can now build and ship a working project from scratch. But the jobs don't hire for "I know the basics." They hire for "I can build production-grade work with frameworks, APIs, and databases." That's exactly what Intermediate covers. Most students who stop at Beginner plateau in 2 months. Students who continue to Intermediate land freelance gigs within 6.`,
      primary_cta_label: `Continue to Intermediate`,
    };
  }

  // Intermediate → Advanced (same track)
  if (enrollment.level === 'intermediate') {
    return {
      next_track_id: enrollment.track,
      next_track_name: currentTrackName,
      next_level: 'advanced',
      pitch_variant: 'intermediate_to_advanced',
      heading: `Hey ${firstName}! You can already build full projects. Time to think like a senior.`,
      body: `${currentTrackName} — Intermediate is done. You can now build full-stack work with auth, databases, and APIs. That already puts you ahead of 80% of self-taught learners. But the senior roles — the ones with the serious packages — they want Advanced: system design, performance, security, scale, the architecture thinking that separates juniors from seniors. Intermediate gets you hired. Advanced gets you promoted.`,
      primary_cta_label: `Continue to Advanced`,
    };
  }

  // Advanced → Beginner (next track in cycle)
  const nextTrackId = getNextTrackId(enrollment.track);
  const nextTrackName = getTrackName(nextTrackId);
  return {
    next_track_id: nextTrackId,
    next_track_name: nextTrackName,
    next_level: 'beginner',
    pitch_variant: 'advanced_to_next_track',
    heading: `Hey ${firstName}! You've mastered one stack. Time to add a second.`,
    body: `You just finished ${currentTrackName} — Advanced. That's the full stack — you can architect, build, and ship production-grade work end to end. Serious achievement. Here's the thing: specialists in one stack are common. Specialists in two are rare — and they charge accordingly. Your next move: ${nextTrackName} — Beginner. Same teaching style, same 1:1 mentorship, brand new skill tree. Most of your knowledge transfers directly. Add a second stack to your resume.`,
    primary_cta_label: `Start ${nextTrackName}`,
  };
}

/**
 * Returns the URL the primary CTA should link to.
 * Always goes to /course-path/{trackId} where the user can pick the level.
 */
export function getUpsellCtaUrl(rec: UpsellRecommendation): string {
  return `/course-path/${rec.next_track_id}`;
}
