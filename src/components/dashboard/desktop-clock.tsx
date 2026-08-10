'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * SARIRO — DesktopClock
 * =========================================================
 * A small desktop/taskbar-style live clock for dashboard headers.
 * Shows the current time (ticking every second) with the date below,
 * in the viewer's local timezone.
 *
 * - Renders nothing until mounted to avoid SSR/hydration mismatch
 *   (server time ≠ client time).
 * - `tabular-nums` keeps the digits from shifting width as they tick.
 * - Hidden on the smallest screens where the header stacks tightly;
 *   a corner clock is a desktop affordance.
 */
export function DesktopClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const date = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="hidden sm:flex flex-col items-end rounded-xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-2 shadow-sm shrink-0"
      aria-label={`Current time ${time}, ${date}`}
    >
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span
          className="tabular-nums text-lg font-extrabold text-slate-900 leading-none"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {time}
        </span>
      </div>
      <span
        className="text-[11px] font-semibold text-slate-500 mt-1"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {date}
      </span>
    </div>
  );
}
