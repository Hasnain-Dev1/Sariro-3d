/**
 * SARIRO — Email utility using Hostinger mail API
 * =========================================================
 * Sends transactional emails via Hostinger's mail API.
 *
 * Env vars required:
 *   HOSTINGER_MAIL_API_TOKEN — API token from Hostinger
 *   HOSTINGER_MAIL_FROM — sender email (e.g. support@sariro.in)
 *
 * Usage:
 *   import { sendEmail } from '@/lib/email/hostinger';
 *   await sendEmail({
 *     to: 'student@example.com',
 *     subject: 'Booking Confirmed',
 *     html: '<h1>Your demo class is booked!</h1>',
 *   });
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
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
  const fromEmail = params.from || process.env.HOSTINGER_MAIL_FROM || 'support@sariro.in';
  const fromName = process.env.HOSTINGER_MAIL_FROM_NAME || 'Sariro';

  if (!apiToken) {
    console.warn('[email] HOSTINGER_MAIL_API_TOKEN not set — email not sent');
    return { success: false, error: 'mail_api_not_configured' };
  }

  try {
    // Hostinger mail API endpoint
    const response = await fetch('https://api.hostinger.com/v1/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: [
          {
            email: params.to,
          },
        ],
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo
          ? { email: params.replyTo }
          : { email: fromEmail },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[email] Hostinger API error:', response.status, errorText);
      return { success: false, error: `api_error_${response.status}` };
    }

    return { success: true };
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
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            Your Booking Details
          </p>
          <p style="font-size: 16px; font-weight: 700; color: #14532d; margin-bottom: 4px;">
            ${preferredSlot}
          </p>
          <p style="font-size: 14px; color: #15803d;">
            Timezone: ${timezone}
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
    replyTo: 'support@sariro.in',
  });
}