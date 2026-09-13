'use client';

import { CalendarPlus, Download } from 'lucide-react';
import { googleCalendarUrl, icsFile, type ClassEvent } from '@/lib/trial/calendar';

/**
 * Two ways into the calendar a family already lives in — see lib/trial/calendar.ts.
 *
 * The class page's own address is read at the moment of the click rather than
 * during render: the server does not know which host the family is on, and
 * guessing at render time would give the server and the browser two different
 * links and a hydration mismatch.
 */
export default function AddToCalendar({
  event,
  compact = false,
}: {
  event: Omit<ClassEvent, 'url'>;
  compact?: boolean;
}) {
  const withUrl = (): ClassEvent => ({ ...event, url: `${window.location.origin}/my-class` });

  const google = () => {
    window.open(googleCalendarUrl(withUrl()), '_blank', 'noopener,noreferrer');
  };

  const ics = () => {
    const blob = new Blob([icsFile(withUrl())], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'sariro-free-class.ics';
    a.click();
    URL.revokeObjectURL(href);
  };

  const btn = `inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 ${
    compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-[12px]'
  }`;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-4'}`}>
      <button type="button" onClick={google} className={btn} style={{ fontFamily: 'var(--font-grotesk)' }}>
        <CalendarPlus className="w-3.5 h-3.5 text-blue-600" /> Add to Google Calendar
      </button>
      <button type="button" onClick={ics} className={btn} style={{ fontFamily: 'var(--font-grotesk)' }}>
        <Download className="w-3.5 h-3.5 text-slate-500" /> iPhone / Outlook
      </button>
    </div>
  );
}
