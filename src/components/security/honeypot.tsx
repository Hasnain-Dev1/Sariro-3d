'use client';

/**
 * SARIRO — Honeypot field
 *
 * A hidden form field that real users never see or fill, but bots
 * (which auto-fill every input) will populate. On the server, if the
 * honeypot field has any value, we silently drop the request (return
 * fake success) and log the IP for the rate-limit escalation layer.
 *
 * Field name is intentionally tempting ("website") so bots that
 * heuristically fill URL fields will trip it.
 *
 * Usage:
 *   <HoneypotField name="website" />     // inside any <form>
 *   // Server side: if (body.website) return fakeSuccess();
 *
 * Visual hiding uses CSS only (NOT type="hidden" — bots skip those).
 * Three layers of hiding:
 *   1. position: absolute — removes from layout flow
 *   2. left: -9999px — pushes off-screen
 *   3. aria-hidden + tabIndex={-1} + autoComplete="off" — accessibility + prevents browser autofill
 *
 * The field is also given a label ("Website (leave blank)") so screen
 * readers announce it correctly — real users on screen readers will
 * know to skip it.
 */

interface HoneypotFieldProps {
  /** Field name — should look legitimate. Default: "website". */
  name?: string;
  /** Optional — change if your form already has a "website" field. */
  label?: string;
}

export function HoneypotField({
  name = 'website',
  label = 'Website (leave blank)',
}: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '0',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
      tabIndex={-1}
    >
      <label htmlFor={`hp-${name}`}>{label}</label>
      <input
        id={`hp-${name}`}
        type="text"
        name={name}
        tabIndex={-1}
        autoComplete="off"
        // Prevent browsers from filling it with saved data
        data-1p-ignore
        data-lpignore="true"
      />
    </div>
  );
}

/**
 * Helper — call this on the server to check if a request tripped the
 * honeypot. Returns true if the field has ANY value (bot detected).
 *
 * Usage:
 *   if (isHoneypotTripped(body)) {
 *     // Log IP, return fake 200, don't process
 *     return NextResponse.json({ ok: true }, { status: 200 });
 *   }
 */
export function isHoneypotTripped(
  body: Record<string, unknown>,
  fieldName: string = 'website'
): boolean {
  const value = body?.[fieldName];
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true; // non-string values are also suspicious
}
