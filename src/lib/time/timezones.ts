/**
 * SARIRO — where somebody actually is
 * ============================================================================
 * The booking page guessed a family's time zone from the browser and never
 * showed the guess. A parent in Dubai on a laptop still set to India time saw
 * every slot ninety minutes out and had no way to know — the page never said
 * which clock it was reading.
 *
 * So the zone is now asked for, shown back, and stored on the student's
 * profile. Three places need the same answers: is this a real zone, what is it
 * called, and how far from UTC is it at this moment.
 *
 * ── Deliberately NOT 'use client' ───────────────────────────────────────────
 * The booking route validates the zone with the same function the form uses.
 * A server route importing a client module receives references rather than
 * functions and fails before it can answer — which has happened twice on this
 * project already.
 */

export const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

/**
 * Old names that browsers still report, mapped to the ones people recognise.
 *
 * V8 reports India as 'Asia/Calcutta' — which is why the only bookable
 * teacher's profile says Calcutta. Shown and stored by the current name, so a
 * family in Kolkata is not asked to confirm a city that was renamed in 2001.
 */
const ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Dacca': 'Asia/Dhaka',
  'Europe/Kiev': 'Europe/Kyiv',
};

/** Letters, digits and the separators IANA names use. Nothing else gets near Intl. */
const SHAPE = /^[A-Za-z0-9_+\-/]{1,64}$/;

/**
 * Whether this is a zone the runtime can actually compute with.
 *
 * Asked of Intl itself rather than of a hardcoded list: a list goes stale the
 * day a country changes its rules, and a stale list refuses real families.
 */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !SHAPE.test(tz)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The current name for a zone, when the runtime knows it by that name. */
export function canonicalTimeZone(tz: string): string {
  const next = ALIASES[tz];
  return next && isValidTimeZone(next) ? next : tz;
}

/** What the browser says, or India when it says nothing usable. */
export function detectTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(tz) ? canonicalTimeZone(tz) : DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/* One formatter per zone. Building them is the expensive part, and the
   picker asks for four hundred offsets at once. */
const FORMATTERS = new Map<string, Intl.DateTimeFormat>();
function formatterFor(tz: string): Intl.DateTimeFormat {
  let f = FORMATTERS.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    FORMATTERS.set(tz, f);
  }
  return f;
}

/**
 * Minutes ahead of UTC at a given instant. Negative west of Greenwich.
 *
 * At an instant, not in general — New York is −300 in January and −240 in
 * July, and a picker that showed one fixed offset would be wrong for half the
 * year in every zone that changes its clocks.
 */
export function offsetMinutes(tz: string, at: number | Date = Date.now()): number {
  const t = typeof at === 'number' ? at : at.getTime();
  const whole = Math.floor(t / 1000) * 1000;
  const parts = formatterFor(tz).formatToParts(new Date(whole));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((asUtc - whole) / 60_000);
}

/** "UTC+5:30", "UTC−5", "UTC". A real minus sign, not a hyphen. */
export function utcOffsetLabel(tz: string, at: number | Date = Date.now()): string {
  const m = offsetMinutes(tz, at);
  if (m === 0) return 'UTC';
  const sign = m > 0 ? '+' : '−';
  const abs = Math.abs(m);
  const h = Math.floor(abs / 60);
  const mm = abs % 60;
  return `UTC${sign}${h}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`;
}

/** "2:30 PM" — what the clock on their wall says right now. */
export function localTimeLabel(tz: string, at: number | Date = Date.now()): string {
  return new Date(at).toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
}

/** "New York" from 'America/New_York'. The name a person would say. */
export function cityOf(tz: string): string {
  const name = canonicalTimeZone(tz);
  if (name === 'UTC' || name === 'Etc/UTC') return 'UTC';
  return (name.split('/').pop() ?? name).replace(/_/g, ' ');
}

/** "Kolkata (UTC+5:30)" — one label, so the picker and the form never differ. */
export function timeZoneLabel(tz: string, at: number | Date = Date.now()): string {
  const city = cityOf(tz);
  return city === 'UTC' ? 'UTC' : `${city} (${utcOffsetLabel(tz, at)})`;
}

/**
 * Where Sariro's families actually are, in the order they arrive.
 *
 * Mirrors the country list in lib/phone/countries.ts — the same diaspora, so
 * somebody picking a zone finds theirs without scrolling four hundred rows.
 */
export const COMMON_TIME_ZONES: string[] = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Qatar', 'Asia/Kuwait', 'Asia/Muscat',
  'Asia/Bahrain', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Kathmandu', 'Asia/Dhaka',
  'Asia/Karachi', 'Asia/Colombo', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
  'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
];

/** Every zone this runtime knows, by current name, once each. */
export function allTimeZones(): string[] {
  const fn = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  let list: string[] = [];
  try { list = fn ? fn('timeZone') : []; } catch { list = []; }
  if (list.length === 0) list = [...COMMON_TIME_ZONES];
  return [...new Set(list.map(canonicalTimeZone))].filter(isValidTimeZone);
}

/**
 * What the picker offers: the common ones first, then everything, sorted
 * west to east so a person scanning for "about my offset" finds it.
 *
 * The detected zone is always included, even when the runtime's own list
 * leaves it out — offering somebody every zone except the one they are in is
 * the kind of thing nobody reports and everybody notices.
 */
export function timeZoneOptions(
  detected?: string | null,
  at: number | Date = Date.now()
): { common: string[]; all: string[] } {
  const all = allTimeZones();
  const d = detected && isValidTimeZone(detected) ? canonicalTimeZone(detected) : null;
  if (d && !all.includes(d)) all.push(d);

  const offsets = new Map(all.map((tz) => [tz, offsetMinutes(tz, at)]));
  all.sort((a, b) => (offsets.get(a)! - offsets.get(b)!) || a.localeCompare(b));

  const common = COMMON_TIME_ZONES.filter(isValidTimeZone);
  return { common, all };
}
