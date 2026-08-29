import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/hostinger';
import type { NotificationType } from '@/lib/dashboard/notifications-data';

/**
 * SARIRO — One way to tell someone something
 * =========================================================
 * Every notification in the product goes through here, so a caller cannot write
 * an in-app row and forget the email, or send an email that never appears in the
 * bell. Those two drifting apart is how a product ends up telling a parent
 * something by email that its own dashboard has no record of.
 *
 * ── Channels, and when each is right ───────────────────────────────────────
 *   IN-APP   always. Free, instant via Realtime, and it is the record.
 *   EMAIL    only when it would be bad to miss. Every email that did not need
 *            to be sent trains the recipient to ignore the next one.
 *
 * Web push is deliberately absent. It needs a service worker, VAPID keys and a
 * push server, and on iOS only reaches installed PWAs — the most work for the
 * least coverage in the markets this product sells into. The desktop chime and
 * pop-up (see `lib/dashboard/alerts.ts`) already cover anyone with the
 * dashboard open, which is who these messages are usually for.
 *
 * ── Failure policy ─────────────────────────────────────────────────────────
 * Nothing here throws. A notification is downstream of something that already
 * happened — a teacher was assigned, a class was cancelled — and failing that
 * operation because a mail server was slow would be strictly worse than the
 * person finding out a different way.
 */

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  /** Where the notification should take them, e.g. `/dashboard/teacher`. */
  link?: string | null;
  /**
   * Also email them. Reserve for things that are costly to miss — a cancelled
   * class, an assignment, money. Not for anything they will see next time they
   * open the dashboard anyway.
   */
  email?: boolean;
  /** Optional richer body for the email. Falls back to `message`. */
  emailBody?: string;
}

export interface NotifyResult {
  inApp: boolean;
  emailed: boolean;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sariro.com';

/**
 * Wrapped in the same shell as the existing transactional mail so a
 * notification does not look like it came from a different company.
 */
function emailTemplate(title: string, body: string, link?: string | null): string {
  const cta = link
    ? `<div style="margin-top: 28px;">
         <a href="${SITE_URL}${link}"
            style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none;
                   font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 12px;">
           Open Sariro
         </a>
       </div>`
    : '';

  return `
    <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
      <div style="background: white; border-radius: 16px; padding: 40px;">
        <div style="margin-bottom: 28px;">
          <span style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; font-weight: 800; font-size: 18px; padding: 8px 16px; border-radius: 10px;">
            Sariro
          </span>
        </div>

        <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 16px; line-height: 1.25;">
          ${title}
        </h1>

        <p style="font-size: 16px; color: #475569; line-height: 1.65; margin: 0;">
          ${body}
        </p>

        ${cta}

        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 32px 0 0; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          You are receiving this because it affects your classes or your account.
        </p>
      </div>
    </div>
  `;
}

/**
 * Tell one person one thing.
 *
 * Returns which channels actually landed rather than a bare boolean, so a caller
 * that cares (or a log) can tell "they were emailed" from "we only have this
 * in-app".
 */
export async function notifyUser(input: NotifyInput): Promise<NotifyResult> {
  const result: NotifyResult = { inApp: false, emailed: false };

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    console.warn('[notify] service role unavailable — nobody was told');
    return result;
  }

  // ── in-app: always ────────────────────────────────────────────────────
  try {
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
    });
    if (error) console.warn('[notify] in-app insert failed:', error.message);
    else result.inApp = true;
  } catch (err) {
    console.warn('[notify] in-app threw:', err instanceof Error ? err.message : String(err));
  }

  if (!input.email) return result;

  // ── email: only when asked, and only if we have an address ────────────
  try {
    // `profiles.email` is a mirror of the auth record, populated by a DB
    // trigger, and it is nullable. Every sign-in method — Google, GitHub,
    // email+password — guarantees an address on `auth.users`, so that is the
    // authoritative source and the profile is only a convenience.
    //
    // Falling through to auth means a notification cannot be lost to a profile
    // row that was created before the trigger existed, or by a trigger that
    // did not copy the column.
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', input.userId)
      .maybeSingle();

    let address = profile?.email ?? null;

    if (!address) {
      const { data: authUser } = await admin.auth.admin.getUserById(input.userId);
      address = authUser?.user?.email ?? null;
      if (address) {
        console.info('[notify] profiles.email was empty — used the auth record');
      }
    }

    if (!address) {
      console.warn('[notify] no address anywhere for this user — in-app only');
      return result;
    }

    const body = input.emailBody ?? input.message ?? '';
    const sent = await sendEmail({
      to: address,
      subject: input.title,
      html: emailTemplate(input.title, body, input.link),
    });

    result.emailed = sent.success;
    if (!sent.success) console.warn('[notify] email failed:', sent.error);
  } catch (err) {
    console.warn('[notify] email threw:', err instanceof Error ? err.message : String(err));
  }

  return result;
}

/** Tell several people the same thing. Failures are per-person, never fatal. */
export async function notifyUsers(inputs: NotifyInput[]): Promise<NotifyResult[]> {
  return Promise.all(inputs.map((i) => notifyUser(i)));
}
