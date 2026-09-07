/**
 * SARIRO — the card attempt that walked off the site and came back
 * ============================================================================
 * Razorpay's checkout window lives on api.razorpay.com. When a buyer's network
 * cannot reach that host, checkout.js gives up on its modal and submits a form
 * to it instead — a TOP-LEVEL navigation. The browser leaves our page, hits the
 * block, and paints its own error: a fox, a 406, and no mention of Sariro.
 *
 * We saw this on a live attempt. Every path on api.razorpay.com returned 406
 * with an empty body from `awselb/2.0` — Razorpay's load balancer refusing the
 * client before any application saw it. Bogus credentials got the same 406, and
 * so did no credentials at all, while checkout.razorpay.com and razorpay.com
 * both answered 200 from the same machine. Not our keys, not our code: that
 * network could not talk to that host.
 *
 * ── Why this cannot be prevented, only survived ─────────────────────────────
 * Once the browser navigates, our JavaScript is gone. There is no beforeunload
 * trick worth trusting and no way to hold a buyer on a page they have already
 * left.
 *
 * There is also no reliable way to test the host first. A no-cors fetch returns
 * an opaque response for a 406 exactly as it does for a 200. An <img> probe
 * fires onerror for a working endpoint too, because the endpoint does not
 * return an image. Every browser-side probe that could tell the difference is
 * blocked by the same-origin policy — which is doing its job.
 *
 * So the design is not detection. It is MEMORY: write down that a card attempt
 * started, before handing control to Razorpay. If the buyer comes back — and
 * they do come back, because Back is the only button on that error page — the
 * note is still there and we can say what happened and offer the other way to
 * pay.
 *
 * ── Why it expires ──────────────────────────────────────────────────────────
 * A note that outlives the attempt is worse than no note: somebody who paid
 * successfully last Tuesday should not be told their payment failed. The window
 * is short, and success, cancellation and failure all clear it explicitly. The
 * expiry is only the backstop for the path where none of those can run —
 * which is precisely the path this exists for.
 */

export const ATTEMPT_KEY = 'sariro:card-attempt';

/**
 * Long enough to cover a slow 3-D Secure step and a wander back, short enough
 * that it cannot be mistaken for a later, unrelated visit.
 */
export const ATTEMPT_TTL_MS = 25 * 60_000;

export interface CardAttempt {
  at: number;
  track: string;
  level: string;
  ratio: string;
  courseName: string;
}

/** Just the part of Storage this needs, so the rules can be tested without a DOM. */
export interface AttemptStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Note that a card attempt is starting.
 *
 * Called immediately BEFORE rzp.open(), because after it there may be no more
 * turns of the event loop on this page.
 */
export function recordAttempt(
  store: AttemptStore | null | undefined,
  attempt: Omit<CardAttempt, 'at'>,
  now: number = Date.now()
): void {
  if (!store) return;
  try {
    store.setItem(ATTEMPT_KEY, JSON.stringify({ ...attempt, at: now }));
  } catch {
    /* Private mode, storage disabled, quota. The recovery notice is a
       courtesy; failing to write it must never break the checkout. */
  }
}

export function clearAttempt(store: AttemptStore | null | undefined): void {
  if (!store) return;
  try {
    store.removeItem(ATTEMPT_KEY);
  } catch { /* as above */ }
}

/**
 * An attempt that started recently and never reported an ending.
 *
 * Returns null for anything it cannot vouch for — absent, unparseable, missing
 * its timestamp, expired, or stamped in the future by a clock that has been
 * moved. A corrupt note must not produce a warning about a payment that may
 * have gone through perfectly.
 */
export function readAttempt(
  store: AttemptStore | null | undefined,
  now: number = Date.now(),
  ttlMs: number = ATTEMPT_TTL_MS
): CardAttempt | null {
  if (!store) return null;

  let raw: string | null;
  try {
    raw = store.getItem(ATTEMPT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const a = parsed as Partial<CardAttempt>;
  if (typeof a.at !== 'number' || !Number.isFinite(a.at)) return null;

  // A note from the future is a wrong clock, not a recent attempt.
  if (a.at > now) return null;
  if (now - a.at > ttlMs) return null;

  return {
    at: a.at,
    track: typeof a.track === 'string' ? a.track : '',
    level: typeof a.level === 'string' ? a.level : '',
    ratio: typeof a.ratio === 'string' ? a.ratio : '',
    courseName: typeof a.courseName === 'string' ? a.courseName : '',
  };
}

/**
 * What the buyer reads when they come back.
 *
 * It does not say "payment failed", because we do not know that it did — the
 * browser left before anything could tell us. It says the window did not open,
 * which is the only thing we actually observed, and then gives the two moves
 * that work: a different network, or bank transfer.
 *
 * Mobile data is named first because it is the fastest test and it fixes the
 * case we have actually seen. The wording deliberately avoids blaming the
 * buyer's setup, since on our own evidence this can be an ISP doing something
 * nobody at either end chose.
 */
export function recoveryMessage(courseName?: string): string {
  const what = courseName ? `for ${courseName}` : 'for this course';
  return (
    `Your card payment ${what} didn't finish — the payment window couldn't open. ` +
    `This is usually the network rather than the card: some connections block Razorpay's ` +
    `payment page. Trying again on mobile data normally works. Otherwise use bank transfer ` +
    `below — it reaches us the same day.`
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The watchdog
   ══════════════════════════════════════════════════════════════════════════
   A second, smaller net, for the failure that does NOT navigate away: the
   modal that opens and then hangs on a spinner forever because its iframe
   cannot load. Nothing fires — no handler, no dismiss, no error — and the
   button spins until the buyer gives up.

   The rule is here rather than inside a setTimeout in the component so it can
   be reasoned about and tested, and so the next edit cannot quietly invert it.
   ══════════════════════════════════════════════════════════════════════════ */

export interface WatchdogState {
  /** rzp.open() has been called and nothing has reported back yet. */
  awaitingModal: boolean;
  /** Razorpay's own container is in the DOM — the modal at least mounted. */
  containerPresent: boolean;
  /** Milliseconds since open() was called. */
  elapsedMs: number;
  /** A backgrounded tab is not a stuck one; people switch away to fetch a card. */
  pageVisible: boolean;
}

/** Long enough for a slow phone on a bad connection to render the modal. */
export const WATCHDOG_MS = 12_000;

export function watchdogShouldFire(s: WatchdogState, thresholdMs: number = WATCHDOG_MS): boolean {
  if (!s.awaitingModal) return false;
  if (s.elapsedMs < thresholdMs) return false;
  // The modal mounted, so this is a person taking their time, not a block.
  if (s.containerPresent) return false;
  // Hidden tab: they may be reading an OTP in another app.
  if (!s.pageVisible) return false;
  return true;
}
