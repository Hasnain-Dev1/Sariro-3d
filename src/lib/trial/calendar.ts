/**
 * SARIRO — putting the free class in the family's own calendar
 * ============================================================================
 * The strongest defence against a no-show is not a reminder from us — it is the
 * class sitting in the calendar the family already lives in, buzzing on their
 * phone on its own. So the trial page offers both routes a household actually
 * uses: a Google Calendar link, and an .ics file that iPhone, Outlook and
 * everything else open natively.
 *
 * Pure, so the file format can be tested without a browser. RFC 5545 is strict
 * about escaping and line length, and a malformed .ics fails silently — the
 * phone simply declines to add the event and nobody finds out why.
 */

export interface ClassEvent {
  /** Stable per booking, so adding it twice updates rather than duplicates. */
  uid: string;
  title: string;
  description: string;
  startIso: string;
  endIso: string;
  /** Where the join button lives. */
  url: string;
}

/** 20260915T123000Z — the UTC form both Google and .ics accept. */
export function calendarStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(e: ClassEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${calendarStamp(e.startIso)}/${calendarStamp(e.endIso)}`,
    details: `${e.description}\n\nJoin from your class page: ${e.url}`,
    location: e.url,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Text as RFC 5545 requires it: backslash, semicolon, comma and newline escaped. */
export function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Lines longer than 75 octets must be folded: CRLF, then a space. Folded by
 * UTF-8 bytes rather than characters, so a line full of emoji or Hindi cannot
 * sneak past the limit.
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (encoder.encode(current + ch).length > limit) {
      out.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join('\r\n ');
}

export function icsFile(e: ClassEvent, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sariro//Free class//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${calendarStamp(now.toISOString())}`,
    `DTSTART:${calendarStamp(e.startIso)}`,
    `DTEND:${calendarStamp(e.endIso)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `DESCRIPTION:${escapeIcs(`${e.description}\n\nJoin from your class page: ${e.url}`)}`,
    `URL:${e.url}`,
    // A phone alarm fifteen minutes before, owned by the family's own calendar.
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs('Your free Sariro class starts in 15 minutes')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
