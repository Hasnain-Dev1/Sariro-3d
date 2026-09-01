'use client';

import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/sariro-data';

/**
 * SARIRO — the WhatsApp button
 * =========================================================
 * A floating click-to-chat button, off unless a real number is configured.
 *
 * ── Where the number comes from ─────────────────────────────────────────────
 * BRAND.whatsapp in sariro-data.ts, the one record of how to reach Sariro.
 * NEXT_PUBLIC_WHATSAPP_NUMBER overrides it when set, which is only useful for
 * pointing a test build at a different handset.
 *
 * It still renders nothing if neither yields a plausible number: a wrong number
 * is worse than no button - it fails silently, sends people to a stranger, and
 * reads as a business that has gone quiet.
 *
 * Sariro also has a branded short link (wa.me/message/NDAMWOPNYEWGE1). The
 * number form is used instead because only it accepts a prefilled `?text=`, and
 * arriving with the question already typed is most of the value.
 *
 * ── wa.me, not the Business API ─────────────────────────────────────────────
 * This is the click-to-chat link, which needs no API key, no webhook and no
 * approval, and works from every device. If the intent is instead the WhatsApp
 * Business *API* - templated sends, delivery receipts, automated class
 * reminders over WhatsApp - that is a server-side integration and a different
 * piece of work; see decisions D3/D4 about reminders over WhatsApp vs email.
 * This button is the front door, not that.
 *
 * ── Where it does NOT appear ────────────────────────────────────────────────
 * Not in the dashboards. A signed-in family has a support channel already, and
 * a floating button over a lesson page competes with the actual work. It is a
 * marketing-site affordance, so it stays on the marketing site.
 */

/** Prefilled opener. Short, and it names the site so the recipient has context. */
const GREETING = 'Hi Sariro — I have a question about your classes.';

export default function WhatsAppButton() {
  const pathname = usePathname();

  const raw = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || BRAND.whatsapp || '').replace(/[^0-9]/g, '');
  // A country code plus a subscriber number is at least 8 digits anywhere in
  // the world; below that it is a typo, not a number.
  if (raw.length < 8) return null;

  // Dashboards and auth screens have their own support paths.
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/auth')) return null;

  const href = `https://wa.me/${raw}?text=${encodeURIComponent(GREETING)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Sariro on WhatsApp"
      /**
       * Bottom-LEFT, and high enough to clear the sticky CTA.
       *
       * The right edge already carries the chapter rail, so the left corner is
       * the only free one. The bottom of that corner is contested though: the
       * sticky CTA is a `max-w-3xl` card centred at the bottom of the page, and
       * being centred it only clears `left-6` once the viewport is wider than
       * roughly 940px. Below that the two share the corner - measured at 375px,
       * the card sits 12-98px from the bottom and the button sat at 80-132px,
       * so they overlapped by about 18px.
       *
       * So the button rides above the card until lg, and drops to the normal
       * corner offset once there is room beside it. `bottom-28` clears the
       * card's tallest form (86px + 12px padding) with a gap left over.
       *
       * Sizing is one source now: it previously carried `w-13 h-13 sm:w-14`
       * (w-13 is not a Tailwind class at all) AND an inline width/height that
       * overrode the responsive one, so it was 52px everywhere by accident.
       */
      className="fixed bottom-28 left-4 lg:bottom-6 lg:left-6 z-40 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: '#25D366',
        boxShadow: '0 8px 24px -6px rgba(37,211,102,0.55)',
      }}
    >
      {/* Inline SVG rather than an icon-font or a remote asset: the CSP allows
          no external hosts, and this must not depend on a network request. */}
      <svg viewBox="0 0 24 24" width="27" height="27" fill="#fff" aria-hidden focusable="false">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
      </svg>
    </a>
  );
}
