import { redirect } from 'next/navigation';

/**
 * SARIRO — /subjects
 * =========================================================
 * This used to be a second catalogue: the six school subjects, the seven focus
 * courses, and a coding card whose only job was to send the visitor to
 * `/courses`. That split is what made a parent looking for maths land on a
 * coding page and leave.
 *
 * `/courses` now offers coding and every school subject side by side, so this
 * index has nothing left to say that is not said better there. The URL stays
 * alive because it is linked from the enrol flow, the focus-course pages and
 * whatever is bookmarked or indexed.
 *
 * Deliberately a TEMPORARY redirect (307). If the school audience later earns
 * its own landing page — a real possibility, the pitch is quite different from
 * the coding one — we want that decision back without having taught every
 * search engine that this URL is permanently gone.
 *
 * The pages BELOW this one are untouched and are where the redirect sends
 * people onward to: `/subjects/[subject]` and `/subjects/focus/[topic]`.
 */
export default function SubjectsIndexPage() {
  redirect('/courses#learn');
}
