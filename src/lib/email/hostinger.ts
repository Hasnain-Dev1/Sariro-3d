/**
 * SARIRO — Email utility using Hostinger mail API
 * =========================================================
 * Sends transactional emails via Hostinger's mail API.
 *
 * Env vars required:
 *   HOSTINGER_MAIL_API_TOKEN — API token from the Hostinger Panel (email provisioning tab)
 *   HOSTINGER_MAIL_MAILBOX_ID — resourceId of the managed mailbox the token is scoped to
 *                               (from GET /api/v1/me → data.mailboxes[].resourceId)
 * Optional:
 *   HOSTINGER_MAIL_FROM_NAME — display name shown on outgoing mail (default "Sariro")
 *
 * Note: the sender address is the managed mailbox itself (identified by the mailbox
 * resourceId in the URL path). The API has no `from`/`reply_to` body fields — only an
 * optional `displayName`. A successful send returns HTTP 204 (no body).
 *
 * Usage:
 *   import { sendEmail } from '@/lib/email/hostinger';
 *   await sendEmail({
 *     to: 'student@example.com',
 *     subject: 'Booking Confirmed',
 *     html: '<h1>Your demo class is booked!</h1>',
 *   });
 */

const HOSTINGER_MAIL_BASE = 'https://api.mail.hostinger.com';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Overrides HOSTINGER_MAIL_FROM_NAME for this message. */
  displayName?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send an email via Hostinger's mail API.
 * Returns { success: true } on success, { success: false, error } on failure.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiToken = process.env.HOSTINGER_MAIL_API_TOKEN;
  const mailboxId = process.env.HOSTINGER_MAIL_MAILBOX_ID;
  const displayName =
    params.displayName || process.env.HOSTINGER_MAIL_FROM_NAME || 'Sariro';

  if (!apiToken) {
    console.warn('[email] HOSTINGER_MAIL_API_TOKEN not set — email not sent');
    return { success: false, error: 'mail_api_not_configured' };
  }
  if (!mailboxId) {
    console.warn('[email] HOSTINGER_MAIL_MAILBOX_ID not set — email not sent');
    return { success: false, error: 'mail_mailbox_not_configured' };
  }

  try {
    // POST /api/v1/mailboxes/{mailboxResourceId}/send — sends from the managed
    // mailbox and saves a copy to its Sent folder. Success is HTTP 204.
    const response = await fetch(
      `${HOSTINGER_MAIL_BASE}/api/v1/mailboxes/${mailboxId}/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          to: [params.to],
          subject: params.subject,
          html: params.html,
          ...(params.text ? { text: params.text } : {}),
          displayName,
        }),
      }
    );

    // 204 No Content = sent and saved to Sent folder.
    if (response.status === 204) {
      return { success: true };
    }

    // Surface validation details (422 maps field → array of error messages).
    let detail = '';
    try {
      const bodyJson = await response.json();
      detail =
        bodyJson?.error ||
        bodyJson?.code ||
        (bodyJson?.params ? JSON.stringify(bodyJson.params) : '');
    } catch {
      // non-JSON body — ignore
    }
    console.warn('[email] Hostinger API error:', response.status, detail);
    return { success: false, error: `api_error_${response.status}` };
  } catch (err) {
    console.warn('[email] send error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'unknown_error',
    };
  }
}

/**
 * Send booking confirmation email to the student.
 * Called when a demo class booking is submitted.
 */
export async function sendBookingConfirmationEmail(params: {
  studentName: string;
  email: string;
  phone: string;
  preferredSlot: string;
  timezone: string;
}): Promise<SendEmailResult> {
  const { studentName, email, preferredSlot, timezone } = params;

  if (!email) {
    return { success: false, error: 'no_email_provided' };
  }

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
      <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #F59E0B 100%); color: white; font-weight: 800; font-size: 24px; padding: 12px 24px; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif;">
            Sariro
          </div>
        </div>

        <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
          Your Demo Class is Booked! 🎉
        </h1>

        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          Hi ${studentName},
        </p>

        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          Thank you for booking a free demo class with Sariro. We're excited to meet you!
        </p>

        <!-- Booking details -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            Your Preferred Window
          </p>
          <p style="font-size: 16px; font-weight: 700; color: #14532d; margin-bottom: 4px;">
            ${preferredSlot}
          </p>
          <p style="font-size: 14px; color: #15803d;">
            Timezone: ${timezone}
          </p>
        </div>

        <!-- Window disclaimer -->
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: 600; color: #92400e; margin: 0;">
            📞 Our representative will get over a call to confirm your slot in the window you selected.
          </p>
        </div>

        <!-- What happens next -->
        <div style="margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 12px;">
            What happens next:
          </p>
          <ol style="font-size: 15px; color: #475569; line-height: 1.8; padding-left: 20px;">
            <li>We'll call you within 24 hours to confirm the exact time</li>
            <li>You'll receive a Google Meet link + prep instructions</li>
            <li>Show up, meet your teacher, and build something real!</li>
          </ol>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://sariro.com/courses" style="display: inline-block; background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%); color: #0f172a; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-family: 'Space Grotesk', sans-serif;">
            Browse Courses While You Wait
          </a>
        </div>

        <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; text-align: center;">
          Questions? Email us at <a href="mailto:support@sariro.in" style="color: #2563EB;">support@sariro.in</a>
        </p>
      </div>
      <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
        © 2026 Sariro. Teaching the future.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Your Demo Class is Booked! 🎉 — Sariro',
    html,
  });
}