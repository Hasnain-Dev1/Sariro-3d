/**
 * SARIRO — the contact-details rule
 * =========================================================
 * Why this file exists, in one paragraph:
 *
 * At Codingal, teachers and students connected on WhatsApp. When a teacher
 * left, the students went with them — the relationship had moved off the
 * platform months earlier and nobody could see it happen. The company had no
 * record, no warning, and no way to intervene, because the conversation that
 * mattered was on someone's personal phone.
 *
 * So: every conversation involving a learner stays in-house. Personal phone
 * numbers, emails and outside messengers are refused at the point of sending,
 * and the attempt is written down where the office can see it. The written
 * policy tells teachers this is a violation; this file is what makes the policy
 * true rather than aspirational.
 *
 * ── Refuse, and say why ─────────────────────────────────────────────────────
 * A blocked message is never dropped silently. Silence teaches people the
 * product is broken and makes them find another way around it. The sender is
 * told what was refused and that the attempt was recorded — which is the part
 * that actually changes behaviour.
 *
 * ── The rule only binds conversations with a learner in them ────────────────
 * HR passing a teacher's number to an admin is ordinary work. A teacher passing
 * their number to a child is the thing we are here to stop. So the same message
 * is allowed in one conversation and refused in another, and the deciding fact
 * is whether a student is on either side.
 *
 * ── Deliberately not clever ─────────────────────────────────────────────────
 * This catches plain sharing and the obvious evasions. It will not catch a
 * determined adult using a code agreed in a lesson, and pretending otherwise
 * would be worse than useless. What it does is make casual sharing impossible
 * and deliberate sharing visible — which, with a written policy behind it, is
 * what actually holds.
 */

export type PolicyVerdict = 'allow' | 'flag' | 'block';

export type PolicyReason =
  | 'phone_number'
  | 'email_address'
  | 'external_messenger'
  | 'spelled_out_number'
  | 'contact_intent';

export interface PolicyResult {
  verdict: PolicyVerdict;
  reasons: PolicyReason[];
  /** What the sender is told. Null when the message simply goes through. */
  message: string | null;
}

/**
 * Links teachers legitimately send. Stripped before anything else runs, so a
 * meeting code like `meet.google.com/abc-defg-hij` cannot read as a phone
 * number and a class link is never refused.
 */
const ALLOWED_HOSTS = [
  'meet.google.com', 'zoom.us', 'teams.microsoft.com', 'sariro.com',
  'docs.google.com', 'drive.google.com', 'forms.gle', 'classroom.google.com',
  'youtube.com', 'youtu.be', 'github.com', 'replit.com', 'scratch.mit.edu',
  'codepen.io', 'khanacademy.org', 'wikipedia.org', 'desmos.com',
];

/** Somewhere a conversation could continue out of sight. */
const MESSENGER_PATTERNS = [
  /\bwa\.me\b/i,
  /\bwhats\W?app\b/i,
  /\bchat\.whatsapp\b/i,
  /\bt\.me\b/i,
  /\btele\W?gram\b/i,
  /\bdiscord(?:\.gg|app)?\b/i,
  /\binsta(?:gram)?\.com\b/i,
  /\bsnap\W?chat\b/i,
  /\bmessenger\.com\b/i,
  /\bm\.me\b/i,
  /\bskype\b/i,
  /\bsignal\.me\b/i,
];

/**
 * A phone number, including the ways people space one out.
 *
 * Three shapes, each anchored rather than greedy:
 *   LOCAL — an Indian mobile: leading 6-9 and exactly ten digits, standing as
 *           its own token. Separators between digits catch "98765 43210" and
 *           "9-8-7-6-5-4-3-2-1-0".
 *   CC    — the same behind a 91 country code, where the digits run together
 *           and there is no word boundary to anchor on.
 *   INTL  — anything else introduced by a +.
 *
 * There is deliberately no "any long run of digits" rule. It was the first
 * thing written here and it blocked a maths teacher sending the digits of pi —
 * a rule teachers get accused by wrongly is a rule teachers stop trusting, and
 * an untrusted rule protects nobody.
 */
const PHONE_LOCAL = /\b[6-9](?:[\s.,-]?\d){9}\b/;
const PHONE_CC = /(?:^|[^\d])(?:\+\s?)?91[\s.-]{0,3}[6-9](?:[\s.,-]?\d){9}(?!\d)/;
const PHONE_INTL = /\+\d(?:[\s.()-]?\d){7,14}\b/;

const EMAIL = /\b[A-Za-z0-9._%+-]+\s?(?:@|\(at\)|\[at\]|\sat\s)\s?[A-Za-z0-9.-]+\s?(?:\.|\(dot\)|\sdot\s)\s?[A-Za-z]{2,}\b/i;

/** Saying you want to move the conversation, with or without a number. */
const CONTACT_INTENT = [
  /\bmy\s+(?:personal\s+)?(?:number|no|mobile|cell|contact)\b/i,
  /\b(?:call|text|ping|message|msg|dm|reach)\s+me\s+(?:on|at)\b/i,
  /\badd\s+me\s+on\b/i,
  /\bsave\s+(?:my|this)\s+number\b/i,
  /\bgive\s+me\s+your\s+(?:number|mobile|contact)\b/i,
  /\bshare\s+(?:your|my)\s+(?:number|contact)\b/i,
  /\boutside\s+(?:the\s+)?(?:platform|app|portal)\b/i,
];

const DIGIT_WORDS: Record<string, string> = {
  zero: '0', oh: '0', o: '0', one: '1', two: '2', to: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9', naught: '0', nought: '0',
  ek: '1', do: '2', teen: '3', char: '4', paanch: '5', panch: '5', chhe: '6',
  che: '6', saat: '7', aath: '8', nau: '9', shunya: '0',
};

/**
 * The longest run of consecutive number-words in the text.
 *
 * A teacher counting to ten with a Grade 1 class is not smuggling a phone
 * number, so the run's starting digit matters as much as its length — see the
 * caller below.
 */
function longestDigitWordRun(text: string): { length: number; first: string } {
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  let best = { length: 0, first: '' };
  let run: string[] = [];
  for (const w of words) {
    const d = DIGIT_WORDS[w];
    if (d) {
      run.push(d);
      if (run.length > best.length) best = { length: run.length, first: run[0] };
    } else {
      run = [];
    }
  }
  return best;
}

/** Remove links we are happy to carry, so their contents are never scanned. */
function stripAllowedLinks(text: string): string {
  return text.replace(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(\/[^\s]*)?/gi, (match, host: string) => {
    const h = host.toLowerCase();
    return ALLOWED_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`)) ? ' ' : match;
  });
}

const REFUSAL =
  'Personal contact details cannot be shared here. Sharing phone numbers, ' +
  'email addresses or outside messengers with a student is a policy violation, ' +
  'and this attempt has been recorded. Keep the conversation on Sariro.';

/**
 * Decide what happens to a message.
 *
 * `involvesStudent` — whether a learner is on either side of the conversation.
 * Staff talking to staff are not policed; that is ordinary company business.
 */
export function evaluateMessage(
  body: string,
  { involvesStudent }: { involvesStudent: boolean }
): PolicyResult {
  if (!involvesStudent) return { verdict: 'allow', reasons: [], message: null };

  const text = stripAllowedLinks(body);
  const reasons: PolicyReason[] = [];

  if (MESSENGER_PATTERNS.some((re) => re.test(text))) reasons.push('external_messenger');
  if (EMAIL.test(text)) reasons.push('email_address');
  if (PHONE_LOCAL.test(text) || PHONE_CC.test(text) || PHONE_INTL.test(text)) {
    reasons.push('phone_number');
  }

  const run = longestDigitWordRun(text);
  // Ten number-words starting 6-9 is a mobile read aloud. A counting lesson
  // starts at one, and an Indian mobile never does, so the first digit is what
  // separates a violation from a Grade 1 class.
  const spelledLikePhone = '6789'.includes(run.first);
  if (run.length >= 10 && spelledLikePhone) reasons.push('spelled_out_number');

  if (reasons.length > 0) {
    return { verdict: 'block', reasons, message: REFUSAL };
  }

  // Nothing concrete, but the shape of someone trying. Goes through, and the
  // office gets to see it — a pattern across weeks is the real signal.
  if (CONTACT_INTENT.some((re) => re.test(text))) reasons.push('contact_intent');
  // A part-spelled mobile. Counting lessons never start at 6-9, so this does
  // not fire on one.
  if (run.length >= 8 && spelledLikePhone) reasons.push('spelled_out_number');

  if (reasons.length > 0) {
    return {
      verdict: 'flag',
      reasons,
      message: 'Sent. A reminder: personal contact details must not be shared with students.',
    };
  }

  return { verdict: 'allow', reasons: [], message: null };
}

/** How a reason is written in the review panel. */
export const REASON_LABEL: Record<PolicyReason, string> = {
  phone_number: 'Phone number',
  email_address: 'Email address',
  external_messenger: 'Outside messenger',
  spelled_out_number: 'Number spelled out',
  contact_intent: 'Asked to move off-platform',
};
