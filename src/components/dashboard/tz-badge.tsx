'use client';

import { Sun, Moon } from 'lucide-react';
import { zoneLabel, isDaytime } from '@/lib/dashboard/tz-format';

/**
 * TzBadge — makes explicit that a session time is shown in the VIEWER's own
 * local zone, with a sun/moon so cross-timezone day/night overlaps are obvious
 * (e.g. an evening class for the teacher that lands in the morning for a US kid).
 */
export function TzBadge({
  iso, timezone, who = 'your time',
}: { iso: string; timezone: string | null; who?: string }) {
  const day = isDaytime(iso, timezone);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400" title={timezone || 'local time'}>
      {day ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
      {who} · {zoneLabel(iso, timezone)}
    </span>
  );
}
