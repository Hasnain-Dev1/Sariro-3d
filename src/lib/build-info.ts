/**
 * SARIRO — what is actually deployed
 * =========================================================
 * Written because of a real hour lost. A deploy was run, the server restarted
 * (uptime confirmed it), and the site still served code from 25 commits back.
 * Nothing in the app could answer the only question that mattered — *which
 * build is this?* — so the answer had to be inferred from page titles and 404s.
 *
 * The cause is worth understanding, because it will happen again. `start` runs
 * `bun .next/standalone/server.js`, a PRE-BUILT artifact. Pulling new source and
 * restarting the process changes nothing: unless `next build` runs, the restarted
 * server re-serves the same compiled app. It looks exactly like a failed deploy
 * and exactly like a caching problem, and it is neither.
 *
 * These values are baked in at BUILD time, not read at runtime. That is the
 * whole point: if the build did not run, this does not change either, and
 * `/api/health` says so.
 *
 *   curl -s https://sariro.com/api/health | grep build
 */

/**
 * Set by `next.config.ts` at build time. Falls back to 'unknown' when the build
 * could not determine it (no git available on the build host, say) — which is
 * still useful, because `buildTime` alone answers "did a build happen?"
 */
export const BUILD_COMMIT = process.env.NEXT_PUBLIC_BUILD_COMMIT || 'unknown';

/** ISO timestamp of when `next build` ran. */
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown';

/** How old the running build is, in whole minutes. */
export function buildAgeMinutes(): number | null {
  if (BUILD_TIME === 'unknown') return null;
  const then = Date.parse(BUILD_TIME);
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round((Date.now() - then) / 60_000));
}

/** "3 minutes ago" / "14 hours ago" — the form a human checks a deploy with. */
export function buildAgeLabel(): string {
  const mins = buildAgeMinutes();
  if (mins === null) return 'unknown';
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.round(hours / 24)} days ago`;
}
