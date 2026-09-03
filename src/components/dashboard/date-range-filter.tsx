'use client';

import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { PRESET_LABEL, type RangePreset, type DateRange } from '@/lib/dashboard/date-ranges';

/**
 * SARIRO — the date filter
 * =========================================================
 * V2 §73. Today, this week, this month, previous month, all time, or a range
 * somebody picks.
 *
 * ── The presets are buttons, not a dropdown ─────────────────────────────────
 * Five options that get used constantly. A select would hide the current choice
 * behind a click and make switching a two-step action on the screen people
 * switch on most.
 *
 * The custom inputs only appear once Custom is chosen, because two date fields
 * sitting permanently beside five buttons is most of the width for the option
 * used least.
 */

const PRESETS: Exclude<RangePreset, 'custom'>[] = ['today', 'week', 'month', 'prev_month', 'all'];

export default function DateRangeFilter({
  value, onChange,
}: {
  value: DateRange;
  onChange: (preset: RangePreset, custom?: { from?: string; to?: string }) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const isCustom = value.preset === 'custom';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <CalendarRange className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />

      {PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-pressed={value.preset === p}
          className={`min-h-[36px] px-3 rounded-lg text-[12.5px] font-bold transition-colors ${
            value.preset === p
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {PRESET_LABEL[p]}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange('custom', { from, to })}
        aria-pressed={isCustom}
        className={`min-h-[36px] px-3 rounded-lg text-[12.5px] font-bold transition-colors ${
          isCustom ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        Custom
      </button>

      {isCustom && (
        <span className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor="range-from">From</label>
          <input
            id="range-from"
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); onChange('custom', { from: e.target.value, to }); }}
            className="min-h-[36px] rounded-lg border border-slate-300 px-2 text-[12.5px] text-slate-900"
            style={{ fontSize: '16px' }}
          />
          <span className="text-slate-400 text-[12.5px]">to</span>
          <label className="sr-only" htmlFor="range-to">To</label>
          <input
            id="range-to"
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); onChange('custom', { from, to: e.target.value }); }}
            className="min-h-[36px] rounded-lg border border-slate-300 px-2 text-[12.5px] text-slate-900"
            style={{ fontSize: '16px' }}
          />
        </span>
      )}
    </div>
  );
}
