/**
 * SARIRO — Domain accents
 * =========================================================
 * One colour per domain, used as a hairline, a shadow tint and a number badge —
 * never as a fill. A single accent held consistently across the map and every
 * strand page is what makes ten domains read as one system instead of ten
 * decisions.
 *
 * Shared so the map and the strand pages cannot drift apart: a card that glows
 * violet on `/explore` must not open a page trimmed in blue.
 */

export const DOMAIN_ACCENTS: Record<string, string> = {
  mathematics: '#2563EB',
  science: '#0891B2',
  technology: '#7C3AED',
  'engineering-and-making': '#EA580C',
  'language-and-communication': '#DB2777',
  humanities: '#CA8A04',
  arts: '#DC2626',
  'business-and-economics': '#059669',
  'health-and-body': '#16A34A',
  'learning-itself': '#0F172A',
};

export const DEFAULT_ACCENT = '#2563EB';

export function accentFor(domainSlug: string): string {
  return DOMAIN_ACCENTS[domainSlug] ?? DEFAULT_ACCENT;
}
