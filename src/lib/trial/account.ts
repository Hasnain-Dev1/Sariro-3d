import { randomInt } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TRIAL_HOME } from '@/lib/dashboard/trial-only';
import { sendEmail } from '@/lib/email/hostinger';
import { gradeTag } from '@/lib/grade/tag';

/**
 * SARIRO — the account a free class comes with
 * ============================================================================
 * SERVER ONLY (node:crypto). Used by both ways a family can finish the booking
 * form — a class booked on a real slot (/api/trial/self-book), and "no time
 * works, please arrange one" (/api/trial/slot-assistance). Both now end the
 * same way: the family has an account, is signed straight into it, and has an
 * email with their booking and the password for next time.
 *
 * One implementation, because two copies of "who is this person" is two
 * chances to hand somebody the wrong account.
 *
 * ── Who they are, and when they are signed straight in ──────────────────────
 * Nothing but a PROVED identity signs anybody in:
 *
 *   phone matches an account, and the phone was verified   → that account, signed in
 *   email matches an account, and the email was verified   → that account, signed in
 *   neither                                                  → a new account, signed in
 *
 * A match on something merely typed — a foreign number no SMS can reach, or an
 * email whose check could not run — still books against the account, but does
 * not hand over a session: typing a stranger's details must never open their
 * account. They sign in the usual way instead.
 *
 * ── The password ────────────────────────────────────────────────────────────
 * Only a NEW account is given one, generated here and emailed to them, so they
 * can come back after the one-time sign-in link has been used. An existing
 * account's password is never touched — resetting it would lock a returning
 * family out of an account they already use.
 *
 * Emailing a password is a deliberate trade the founder asked for: it sits in
 * the inbox as plain text. It is long, random and unique to them, the email
 * says to change it, and they never need it to reach this class — they are
 * signed straight in.
 */

/* No 0/O, 1/l/I: a password read off a phone screen and typed into a laptop
   should not fail on a character nobody can tell apart. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** xxxx-xxxx-xxxx — about 69 bits, and readable aloud. */
export function generatePassword(groups = 3, size = 4): string {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)];
  return Array.from({ length: groups }, () => Array.from({ length: size }, pick).join('')).join('-');
}

export interface TrialAccountInput {
  name: string;
  /** Lower-cased. Required by both forms; nullable for staff callers. */
  email: string | null;
  /** E.164. */
  phone: string;
  countryCode: string;
  /** India, and the code was read back. */
  phoneProved: boolean;
  /** email_is_verified actually returned true in this request. */
  emailProved: boolean;
  /** 1–14 (see lib/grade/tag.ts), or null. */
  grade: number | null;
  /** A validated IANA zone, or null. */
  timezone: string | null;
}

export type TrialAccountResult =
  | {
      ok: true;
      studentId: string;
      /** A new account was made in this request. */
      created: boolean;
      /** The identity that matched was proved here — see the header. */
      mayAutoSignIn: boolean;
      /** Only for a new account. Never for an existing one. */
      password: string | null;
      /* The address the sign-in link must be made for: the MATCHED account's
         own email, not whatever was typed. A family matched by phone who typed
         a different address would otherwise be signed in to some other
         account, or to none. Null for a phone-only account — no link then. */
      signInEmail: string | null;
    }
  | { ok: false; message: string };

export async function resolveTrialAccount(
  admin: SupabaseClient,
  input: TrialAccountInput
): Promise<TrialAccountResult> {
  const existing = async (
    id: string,
    accountEmail: string | null,
    proved: boolean
  ): Promise<TrialAccountResult> => {
    /* The zone they just confirmed replaces the one on file — but only for an
       identity this request proved. Changing a stranger's zone would shift
       every class time they are ever shown. */
    if (proved && input.timezone) {
      const { error } = await admin.from('profiles').update({ timezone: input.timezone }).eq('id', id);
      if (error) console.warn('[trial-account] could not remember the time zone:', error.message);
    }
    return { ok: true, studentId: id, created: false, mayAutoSignIn: proved, password: null, signInEmail: accountEmail };
  };

  const { data: byPhone } = await admin
    .from('profiles').select('id, email').eq('phone', input.phone).limit(1).maybeSingle();
  if (byPhone) return existing(byPhone.id as string, (byPhone.email as string | null) ?? null, input.phoneProved);

  if (input.email) {
    const { data: byEmail } = await admin
      .from('profiles').select('id').eq('email', input.email).limit(1).maybeSingle();
    if (byEmail) return existing(byEmail.id as string, input.email, input.emailProved);
  }

  /* ── Somebody new ────────────────────────────────────────────────────────── */
  const password = input.email ? generatePassword() : null;
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    input.email
      ? {
          email: input.email,
          password: password as string,
          email_confirm: true,
          phone: input.phone,
          /* Only what was proved. A foreign number no SMS reached is recorded,
             not vouched for. */
          phone_confirm: input.phoneProved,
          user_metadata: { full_name: input.name },
        }
      : { phone: input.phone, phone_confirm: input.phoneProved, user_metadata: { full_name: input.name } }
  );

  if (createErr || !created?.user) {
    /* Two tabs, or a double-click: the address was registered a moment ago by
       this same family. Book against that account rather than failing them. */
    if (input.email && /already|registered|exists/i.test(createErr?.message ?? '')) {
      const { data: again } = await admin
        .from('profiles').select('id').eq('email', input.email).limit(1).maybeSingle();
      if (again) return existing(again.id as string, input.email, input.emailProved);
    }
    console.warn('[trial-account] createUser failed:', createErr?.message);
    return { ok: false, message: 'We could not set up your account. Please try again.' };
  }

  const studentId = created.user.id;
  const row = {
    id: studentId,
    email: input.email,
    full_name: input.name,
    phone: input.phone,
    /* The truth, not a constant: a verified badge on a number no code ever
       reached would let every later screen trust it. */
    phone_verified: input.phoneProved,
    phone_country_code: input.countryCode,
    role: 'student',
    is_student: true,
    grade: input.grade,
    timezone: input.timezone,
  };

  /* A trigger may have made the row already, so this is an upsert. Its error
     is checked — it was not, and a refused write left accounts with no phone,
     which is the one thing anybody needs to chase a child who does not appear. */
  let { error: upErr } = await admin.from('profiles').upsert(row, { onConflict: 'id' });
  if (upErr?.code === '23514' && row.grade !== null) {
    /* The grade was refused — U and P need scripts/grade-tags-u-and-p.sql.
       Keep the account and the phone; lose only the grade. */
    console.warn('[trial-account] grade refused, saving the profile without it:', upErr.message);
    ({ error: upErr } = await admin.from('profiles').upsert({ ...row, grade: null }, { onConflict: 'id' }));
  }
  if (upErr) console.warn('[trial-account] profile write failed:', upErr.code, upErr.message);

  return { ok: true, studentId, created: true, mayAutoSignIn: true, password, signInEmail: input.email };
}

/**
 * A one-time link that signs them in and lands them on their class page.
 *
 * Generated, never emailed by Supabase — the booking form opens it directly,
 * so the family is inside their account the moment they finish the form.
 * /my-class sends anybody who already has a course on to the full dashboard.
 */
export async function trialSignInLink(
  admin: SupabaseClient,
  email: string,
  origin: string,
  next: string = TRIAL_HOME
): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    return data?.properties?.action_link ?? null;
  } catch (err) {
    console.warn('[trial-account] generateLink failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Anything a family typed, made safe to put inside an email. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface WelcomeEmail {
  to: string;
  name: string;
  /** Present only for a new account. */
  password: string | null;
  /** The booked class, or null when a counsellor is arranging the time. */
  trial: { when: string; subject: string; teacherName: string | null } | null;
  grade: number | null;
  phone: string;
  siteUrl: string;
}

/**
 * The booking, and how to get back in.
 *
 * Never throws and never blocks the booking: the class exists whether or not
 * the mail server answered. The result is returned so the caller can log it.
 */
export async function sendTrialWelcomeEmail(m: WelcomeEmail): Promise<{ success: boolean; error?: string }> {
  const name = escapeHtml(m.name.split(' ')[0] || m.name);
  const signIn = `${m.siteUrl}/auth/sign-in?next=${encodeURIComponent(TRIAL_HOME)}`;

  const booked = m.trial
    ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin:0 0 18px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#15803d;">Your free class</p>
        <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#14532d;">${escapeHtml(m.trial.when)}</p>
        <p style="margin:0;font-size:14px;color:#166534;">${escapeHtml(m.trial.subject)} · ${gradeTag(m.grade)}${m.trial.teacherName ? ` · with ${escapeHtml(m.trial.teacherName)}` : ''}</p>
      </div>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#475569;">
        The join button appears on your class page ten minutes before it starts, and we will remind you an hour ahead.
      </p>`
    : `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;margin:0 0 18px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#1d4ed8;">Your booking request</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#1e3a8a;">
          All our slots were filled when you booked. A Sariro counsellor will call you on ${escapeHtml(m.phone)} and arrange the class at a time that suits you — usually within a day.
        </p>
      </div>`;

  const credentials = m.password
    ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:0 0 18px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#475569;">Your Sariro account</p>
        <p style="margin:0 0 4px;font-size:14px;color:#334155;">Email: <strong>${escapeHtml(m.to)}</strong></p>
        <p style="margin:0 0 10px;font-size:14px;color:#334155;">Password: <strong style="font-family:ui-monospace,Menlo,monospace;letter-spacing:.04em;">${escapeHtml(m.password)}</strong></p>
        <p style="margin:0;font-size:12px;color:#64748b;">Keep this safe. To change it, use “Forgot password” on the sign-in page. Nobody from Sariro will ever ask you for it.</p>
      </div>`
    : `
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">
        Sign in with your usual email and password. Forgotten it? Use “Forgot password” on the sign-in page.
      </p>`;

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;">Sariro</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0f172a;">
        ${m.trial ? `You’re booked in, ${name}.` : `We’ve got your request, ${name}.`}
      </h1>
      ${booked}
      ${credentials}
      <p style="margin:24px 0 0;text-align:center;">
        <a href="${signIn}" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:14px;padding:13px 28px;border-radius:12px;text-decoration:none;">Open your class page</a>
      </p>
      <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
        Questions? <a href="mailto:support@sariro.com" style="color:#2563eb;">support@sariro.com</a>
      </p>
    </div>
  </div>`;

  const text = [
    m.trial ? `You're booked in, ${m.name}.` : `We've got your request, ${m.name}.`,
    m.trial
      ? `Your free class: ${m.trial.when} — ${m.trial.subject} · ${gradeTag(m.grade)}${m.trial.teacherName ? ` · with ${m.trial.teacherName}` : ''}.`
      : `All slots were filled. A Sariro counsellor will call you on ${m.phone} to arrange the class.`,
    m.password ? `Your account — email: ${m.to}  password: ${m.password}  (to change it, use "Forgot password" on the sign-in page)` : 'Sign in with your usual email and password.',
    `Open your class page: ${signIn}`,
  ].join('\n\n');

  try {
    return await sendEmail({
      to: m.to,
      subject: m.trial ? 'Your free Sariro class is booked' : 'We’ve got your Sariro booking request',
      html,
      text,
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
