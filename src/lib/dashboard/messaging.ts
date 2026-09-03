'use client';

/**
 * SARIRO — the in-house chat, client side
 * =========================================================
 * V2 §27-28, widened past teacher-to-student: a teacher asking HR about a
 * settlement, an admin telling a teacher their class moved, a student reaching
 * the mentor who teaches them. One system rather than one per pairing.
 *
 * Every call goes through POST /api/messaging. Nothing here queries Supabase
 * directly, because two things have to be true that a browser query cannot
 * guarantee: `profiles` RLS is configured live rather than in this repo, and
 * the rule that students cannot message students must sit somewhere a
 * hand-written request cannot walk around. Both live in the route.
 *
 * ── Why the role travels with the person ────────────────────────────────────
 * "Who am I talking to" is the question this system exists to answer quickly.
 * A teacher needs to know they are writing to HR and not to an admin; a student
 * needs to know the person replying is their teacher. So every participant
 * carries a designation everywhere they appear — the directory, the list and
 * the thread header — and a teacher also carries their tier, because that is
 * what colleagues actually need to know about a teacher.
 */

export type Designation = 'super_admin' | 'admin' | 'hr' | 'teacher' | 'seller' | 'student';

export interface Person {
  id: string;
  name: string;
  /** Staff only. A student's directory does not carry anyone's email. */
  email: string | null;
  designation: Designation;
  /** Teachers only — 1, 2 or 3. Null for everyone else. */
  tier: number | null;
}

export interface ConversationSummary {
  id: string;
  /** The other person. These are always two-person conversations. */
  other: Person | null;
  lastMessage: string | null;
  lastMessageMine: boolean;
  lastMessageAt: string;
  unread: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/** How a designation is written wherever a person appears. */
export const DESIGNATION_LABEL: Record<Designation, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  hr: 'HR',
  teacher: 'Teacher',
  seller: 'Sales',
  student: 'Student',
};

/**
 * Colour per designation.
 *
 * Identity, not magnitude — distinct hues rather than one ramp, and the written
 * label always sits beside the colour, so nothing here depends on telling two
 * of these apart. All six are >= 4.5:1 on white for the text they carry.
 */
export const DESIGNATION_TONE: Record<Designation, { fg: string; bg: string }> = {
  super_admin: { fg: '#6D28D9', bg: '#6D28D914' },
  admin: { fg: '#1D4ED8', bg: '#1D4ED814' },
  hr: { fg: '#0E7490', bg: '#0E749014' },
  teacher: { fg: '#15803D', bg: '#15803D14' },
  seller: { fg: '#B45309', bg: '#B4530914' },
  student: { fg: '#475569', bg: '#47556914' },
};

export const isStaff = (d: Designation) => d !== 'student';

/** How a person is introduced: "Priya · Teacher, Tier 2". */
export function describe(p: Person): string {
  const role = DESIGNATION_LABEL[p.designation];
  return p.designation === 'teacher' && p.tier ? `${role}, Tier ${p.tier}` : role;
}

type Ok<T> = T & { ok: true };
interface Fail { ok: false; error: string; message?: string }

async function call<T>(payload: Record<string, unknown>): Promise<Ok<T> | Fail> {
  try {
    const res = await fetch('/api/messaging', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!json) return { ok: false, error: 'server_error' };
    return json as Ok<T> | Fail;
  } catch {
    return { ok: false, error: 'network_error' };
  }
}

/**
 * What went wrong, said to the person rather than to the log.
 *
 * `migration_missing` is the one an operator can fix, so it names the file.
 */
export function explain(error: string, message?: string): string {
  switch (error) {
    case 'migration_missing':
      return 'Chat is not set up yet — run scripts/messaging.sql in Supabase.';
    case 'unauthenticated':
      return 'Please sign in again.';
    case 'rate_limited':
      return 'That is a lot of messages at once. Give it a moment.';
    case 'forbidden':
      return message ?? 'You cannot message that person.';
    case 'policy_blocked':
      // The server writes this one; it is the policy speaking, not an error.
      return message ?? 'Personal contact details cannot be shared here.';
    case 'too_long':
      return 'That message is too long — 4,000 characters maximum.';
    case 'network_error':
      return 'No connection. Your message was not sent.';
    default:
      return message ?? 'Something went wrong.';
  }
}

/** Everyone the signed-in user is allowed to start a conversation with. */
export async function fetchDirectory(q = ''): Promise<Person[]> {
  const res = await call<{ people: Person[] }>({ action: 'directory', q });
  if (!res.ok) throw new Error(explain(res.error, res.message));
  return res.people;
}

/**
 * Every conversation the signed-in user belongs to, most recent first, plus
 * the caller's own designation — the composer needs it to know whether a
 * learner is in the room before it states the contact-details rule.
 */
export async function fetchConversations(): Promise<{ conversations: ConversationSummary[]; me: Designation }> {
  const res = await call<{ conversations: ConversationSummary[]; me: Designation }>({ action: 'conversations' });
  if (!res.ok) throw new Error(explain(res.error, res.message));
  return { conversations: res.conversations, me: res.me };
}

export async function fetchMessages(
  conversationId: string
): Promise<{ messages: Message[]; meId: string }> {
  const res = await call<{ messages: Message[]; meId: string }>({ action: 'messages', conversationId });
  if (!res.ok) throw new Error(explain(res.error, res.message));
  return { messages: res.messages, meId: res.meId };
}

/** The conversation with this person, creating it only if there is not one. */
export async function openConversationWith(personId: string): Promise<{ id?: string; error?: string }> {
  const res = await call<{ id: string }>({ action: 'open', personId });
  if (!res.ok) return { error: explain(res.error, res.message) };
  return { id: res.id };
}

export interface SendResult {
  success: boolean;
  message?: Message;
  /** A refusal. The message was not delivered. */
  error?: string;
  /** Delivered, but the sender is being reminded of the rule. */
  warning?: string | null;
  /** True when the contact-details rule refused it, rather than a fault. */
  blocked?: boolean;
}

export async function sendMessage(conversationId: string, body: string): Promise<SendResult> {
  const res = await call<{ message: Message; warning: string | null }>({
    action: 'send', conversationId, body,
  });
  if (!res.ok) {
    return {
      success: false,
      error: explain(res.error, res.message),
      blocked: res.error === 'policy_blocked',
    };
  }
  return { success: true, message: res.message, warning: res.warning };
}

/* ── Oversight ───────────────────────────────────────────────────────────── */

export interface PolicyFlag {
  id: string;
  conversation_id: string | null;
  body: string;
  reasons: string[];
  blocked: boolean;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  sender: Person | null;
  recipient: Person | null;
}

/** HR, admin and super-admin only — the server refuses everyone else. */
export async function fetchPolicyFlags(): Promise<PolicyFlag[]> {
  const res = await call<{ flags: PolicyFlag[] }>({ action: 'flags' });
  if (!res.ok) throw new Error(explain(res.error, res.message));
  return res.flags;
}

export async function reviewPolicyFlag(
  flagId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const res = await call({ action: 'review_flag', flagId, note });
  if (!res.ok) return { success: false, error: explain(res.error, res.message) };
  return { success: true };
}

/** Clears the unread count for the signed-in user. */
export async function markRead(conversationId: string): Promise<void> {
  await call({ action: 'read', conversationId });
}

/** "2:14 pm" today, "Tue" this week, "12 Aug" beyond it. */
export function whenShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
