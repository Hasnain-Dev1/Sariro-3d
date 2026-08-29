'use client';

/**
 * SARIRO — Desktop alerts (the traditional ding + pop-up)
 * =========================================================
 * The classic notification: a short chime and a system pop-up the moment
 * something lands, for anyone with the dashboard open.
 *
 * ── Why this needs none of the push infrastructure ─────────────────────────
 * Two different mechanisms get conflated constantly:
 *
 *   Notification API   shows a system pop-up while the page is OPEN (even in a
 *                      background tab). No service worker, no VAPID keys, no
 *                      push server, no per-message cost. Works on desktop
 *                      browsers and Android Chrome.
 *
 *   Web Push           delivers when the site is CLOSED. Needs a service
 *                      worker, VAPID keys and a server to send. On iOS it only
 *                      works for an installed PWA.
 *
 * A teacher watching for their next class, or an admin who was just assigned a
 * batch, has the tab open. The first mechanism covers them entirely — so that
 * is what this is, and it costs nothing to run.
 *
 * ── On asking for permission ───────────────────────────────────────────────
 * Never on page load. A prompt that appears before the product has done
 * anything gets denied, and a denial is close to permanent — the browser will
 * not ask again, and most people never find the setting. So permission is
 * requested only from a deliberate click on a control that says what it is for.
 */

const CHIME_FREQUENCIES = [880, 1320]; // A5 then E6 — a rising two-note chime.

let audioContext: AudioContext | null = null;

export type AlertPermission = 'unsupported' | 'default' | 'granted' | 'denied';

export function alertPermission(): AlertPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as AlertPermission;
}

/**
 * Ask for permission. Must be called from a user gesture — browsers ignore or
 * auto-deny prompts that are not, and a denial cannot be re-requested.
 */
export async function requestAlertPermission(): Promise<AlertPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    // Created inside the gesture so the audio context starts unblocked —
    // browsers suspend contexts that were not user-initiated, and a chime that
    // silently never plays is worse than no chime.
    primeChime();
    const result = await Notification.requestPermission();
    return result as AlertPermission;
  } catch {
    return 'denied';
  }
}

/** Create/resume the audio context. Safe to call repeatedly. */
export function primeChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioContext ??= new Ctor();
    if (audioContext.state === 'suspended') void audioContext.resume();
  } catch {
    /* audio is a nicety — never let it break a dashboard */
  }
}

/**
 * A short two-note chime, synthesised rather than loaded.
 *
 * No audio file: a sound this short is a handful of oscillator lines, and
 * shipping an asset means a network request, a cache entry and a decision about
 * format support for something that lasts a fifth of a second.
 */
export function playChime(): void {
  if (!audioContext || audioContext.state !== 'running') return;
  try {
    const now = audioContext.currentTime;
    CHIME_FREQUENCIES.forEach((freq, i) => {
      const osc = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const start = now + i * 0.09;
      // Quiet, and faded rather than cut — an abrupt stop clicks.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      osc.connect(gain).connect(audioContext!.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    /* nicety */
  }
}

export interface AlertOptions {
  title: string;
  body?: string;
  /** Where clicking the pop-up should take them. */
  url?: string;
  /** Collapses repeats — a second alert with the same tag replaces the first. */
  tag?: string;
}

/**
 * Show the system pop-up and play the chime.
 *
 * Silent no-op without permission: this is an enhancement, and a dashboard that
 * throws because someone declined notifications is a worse dashboard.
 */
export function showAlert({ title, body, url, tag }: AlertOptions): void {
  playChime();

  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: '/logo.svg',
      badge: '/logo.svg',
      // The chime is ours, so the OS should not add its own on top.
      silent: true,
    });

    notification.onclick = () => {
      window.focus();
      if (url) window.location.href = url;
      notification.close();
    };
  } catch {
    /* some browsers throw on constructing Notification in odd contexts */
  }
}
