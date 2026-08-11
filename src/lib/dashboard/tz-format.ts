/**
 * SARIRO — Timezone display helpers
 * =================================
 * A booking is one exact UTC instant. Rendered in the teacher's IANA zone it may
 * read "Mon 9:00 PM"; in the student's zone the SAME instant may read "Tue 6:30
 * AM" — a real day/night overlap. These helpers make each viewer's local day,
 * time, zone label, and day/night state explicit so nobody mistakes whose clock
 * they're looking at.
 */

/** Short zone label for an instant, e.g. "GMT+5:30" (falls back gracefully). */
export function zoneLabel(iso: string, timezone: string | null): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || undefined,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date(iso));
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? (timezone ?? 'local');
  } catch {
    return timezone ?? 'local';
  }
}

/** Local hour (0-23) of an instant in a zone — used to pick day vs night. */
export function localHour(iso: string, timezone: string | null): number {
  try {
    const h = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || undefined, hour: '2-digit', hourCycle: 'h23',
    }).format(new Date(iso));
    return parseInt(h, 10) || 0;
  } catch {
    return 0;
  }
}

/** Rough day/night flag: daytime = 06:00–17:59 local. */
export function isDaytime(iso: string, timezone: string | null): boolean {
  const h = localHour(iso, timezone);
  return h >= 6 && h < 18;
}

/** "Mon, Aug 11 · 6:00 PM" in the given zone (weekday + date + time). */
export function formatDayTime(iso: string, timezone: string | null): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || undefined,
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
