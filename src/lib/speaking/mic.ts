/**
 * SARIRO — why the microphone is not going to work, if it is not
 * ============================================================================
 * The practice room asked one boolean question — "is this supported?" — and
 * answered three completely different situations with the same sentence about
 * changing browser. The commonest of the three is not a browser problem at all:
 *
 *   An http:// page has no microphone. Not "a blocked microphone" — the browser
 *   deletes navigator.mediaDevices from the page entirely, so getUserMedia is
 *   never called, no permission box is ever raised, and from the outside it
 *   looks exactly like a dead button.
 *
 * That is what a phone opening a laptop's dev server over the LAN gets, and
 * what every http://<ip>:3000 gets. The only origins a browser trusts with a
 * microphone are https:// and localhost.
 *
 * So the question is not "is it supported" but "what is in the way", and this
 * answers that. The order matters: insecure is checked first, because on an
 * insecure page every other check reports something true and useless.
 */

export type MicBlocker = '' | 'insecure' | 'no-recognition';

export interface MicMessage {
  title: string;
  body: string;
}

interface RecognitionWindow {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
  isSecureContext?: boolean;
}

/** Empty string means nothing is in the way. */
export function diagnoseMic(
  win: RecognitionWindow | undefined = typeof window !== 'undefined'
    ? (window as unknown as RecognitionWindow)
    : undefined,
  nav: { mediaDevices?: { getUserMedia?: unknown } } | undefined = typeof navigator !== 'undefined'
    ? navigator
    : undefined
): MicBlocker {
  if (!win || !nav) return 'insecure';
  // localhost counts as secure, so this never fires in local development.
  if (win.isSecureContext === false) return 'insecure';
  if (typeof nav.mediaDevices?.getUserMedia !== 'function') return 'insecure';
  if (!win.SpeechRecognition && !win.webkitSpeechRecognition) return 'no-recognition';
  return '';
}

/** The same two explanations wherever a lab needs to give one. */
export function micMessage(blocker: Exclude<MicBlocker, ''>): MicMessage {
  return blocker === 'no-recognition'
    ? {
        title: 'This browser cannot turn speech into words yet.',
        body: 'Speech recognition works in Chrome, Edge and Safari. Do the drill aloud anyway — the practice is the part that matters, and you can come back here for the measurements.',
      }
    : {
        title: 'The microphone needs a secure connection.',
        body: 'Browsers only hand over a microphone on https:// or localhost, so on this address the permission box will never even appear. Open https://sariro.com and it will ask you straight away.',
      };
}

/**
 * What to say when getUserMedia itself refuses.
 *
 * Three different refusals, three different fixes. "Check the permission" is
 * unhelpful to somebody whose laptop has no microphone, and actively wrong for
 * somebody who blocked us once — the browser then denies instantly and
 * silently forever, which reads exactly like nothing happened.
 */
export function micErrorMessage(err: unknown): string {
  const name = (err as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Your browser is blocking the microphone for this site. Tap the padlock in the address bar, set Microphone to Allow, then try again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No microphone found. Plug one in, or use a phone — the drill is the same.';
  }
  return 'Something else is using your microphone. Close any other call or recording tab and try again.';
}
