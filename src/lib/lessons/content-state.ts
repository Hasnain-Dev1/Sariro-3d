/**
 * SARIRO — is there actually a lesson on this page?
 * =========================================================
 * The seeder creates a row per lesson containing `<h1>Lesson name</h1>` and
 * nothing else, so a course can be prepared before anyone writes it. That is
 * fine as a placeholder and wrong as a page.
 *
 * ── Why a stub is worse than no page at all ─────────────────────────────────
 * The viewer has a good answer for a lesson with no page: "This one is taught
 * live with your mentor — there is no written page for it yet. Your teacher
 * brings the plan to the class." It is honest, and it is true.
 *
 * A stub never reaches that answer. A row exists, the content route returns it,
 * and the learner gets a heading floating on an empty page — which reads as
 * broken rather than as unwritten. Python Elementary has forty-seven lessons in
 * exactly that state.
 *
 * So seeding a course currently makes it worse, which is the opposite of what
 * seeding is for. This module is what stops that: an effectively empty page is
 * treated as no page, and the honest message appears instead.
 */

/**
 * Below this many characters of body text, there is nothing to read.
 *
 * A real lesson runs to thousands. Forty is far under anything anyone would
 * write on purpose and far over the zero a stub leaves behind, so it separates
 * the two without needing to be precise.
 */
export const MIN_BODY_CHARS = 40;

/**
 * True when the page has a heading and no lesson.
 *
 * Headings are removed before measuring, because the stub IS a heading — a page
 * whose only content is its own title has not been written. Media and code are
 * counted as content on sight: a lesson that is one embedded video and no prose
 * is a real lesson, and stripping tags would score it zero.
 */
export function isEffectivelyEmpty(html: string | null | undefined): boolean {
  const raw = (html ?? '').trim();
  if (!raw) return true;

  // Anything that carries meaning without prose.
  if (/<(img|video|iframe|embed|object|audio|canvas|pre|code|table|svg)\b/i.test(raw)) {
    return false;
  }

  // A bulleted recap is a real lesson shape and a short one falls under the
  // character floor: "Variables hold values" and "Loops repeat work" together
  // are thirty-nine characters. Two written bullets is authorship, and hiding
  // a lesson that exists is the worse of the two mistakes this can make.
  const listItems = (raw.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi) ?? []).filter((li) =>
    li.replace(/<[^>]*>/g, '').replace(/&[a-z]+;|&#\d+;/gi, ' ').trim().length > 0
  );
  if (listItems.length >= 2) return false;

  const body = raw
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    // Entities become one character's worth of nothing rather than counting as
    // six — `&nbsp;&nbsp;&nbsp;` is not forty characters of lesson.
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return body.length < MIN_BODY_CHARS;
}

/** The inverse, for reading at call sites where the positive is clearer. */
export const hasWrittenContent = (html: string | null | undefined) => !isEffectivelyEmpty(html);
