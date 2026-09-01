'use client';

import { useEffect, useMemo, useState } from 'react';
import { joinWindow, type JoinWindow } from './join-window';

/**
 * SARIRO — the join window, live
 * =========================================================
 * `joinWindow()` already knew the rule: doors open 15 minutes before the start.
 * What nothing did was NOTICE the moment it became true.
 *
 * Every card computed its state once, during render, from a `Date` captured at
 * that instant. A teacher with the dashboard open at 16:44 for a 17:00 class
 * still saw 16:44's answer at 16:59 — the doors had opened, the button had not
 * changed, and the only way to find out was to reload a page nobody thinks to
 * reload while waiting. The rule was right and invisible.
 *
 * This ticks, so the card changes on its own at the minute it should.
 *
 * ── Hydration ───────────────────────────────────────────────────────────────
 * Returns `null` until after mount, deliberately. Anything derived from
 * `Date.now()` during render disagrees between the server and the browser, and
 * React does not patch attribute mismatches up — it leaves the subtree
 * half-hydrated. Callers render a neutral state for one frame instead, which
 * costs nothing on a dashboard that is already behind a login.
 *
 * ── Why the timer is conditional ────────────────────────────────────────────
 * A teacher's day can hold a dozen cards. A dozen always-on intervals to watch
 * classes that are days away is pure waste, and the countdown text for
 * something 30 hours out does not change in any visible way. So a card only
 * ticks when the answer can actually change soon: inside the last two hours,
 * or while the doors are open. Everything else is computed once.
 */

/** Below this, the state is close enough to change that it is worth watching. */
const WATCH_WITHIN_MS = 2 * 60 * 60 * 1000;

/** Fine enough that "in 3 minutes" is never visibly wrong. */
const TICK_MS = 15_000;

export function useLiveJoinWindow(
  slotStartIso: string,
  slotEndIso: string | null
): JoinWindow | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // First real answer, immediately after mount.
    const first = new Date();
    setNow(first);

    const start = new Date(slotStartIso).getTime();
    const untilStart = start - first.getTime();
    // Already long over, or far in the future: one answer is the whole story.
    const worthWatching = untilStart < WATCH_WITHIN_MS && untilStart > -WATCH_WITHIN_MS;
    if (!worthWatching) return;

    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [slotStartIso]);

  return useMemo(
    () => (now ? joinWindow(slotStartIso, slotEndIso, now) : null),
    [now, slotStartIso, slotEndIso]
  );
}
