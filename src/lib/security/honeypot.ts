/**
 * SARIRO — Honeypot server-side helpers
 *
 * Pure functions for server-side honeypot detection. Separate from the
 * client component file (which has 'use client') so these can be safely
 * imported from API routes without bundling issues.
 */

/**
 * Checks if a request body tripped the honeypot field. Returns true if
 * the field has ANY value (bot detected).
 *
 * Usage:
 *   if (isHoneypotTripped(body)) {
 *     recordHoneypotTrip(ip);
 *     return NextResponse.json({ ok: true }); // fake success
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
