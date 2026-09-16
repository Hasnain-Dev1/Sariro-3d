'use client';

import { BAND_LABEL, BAND_ORDER, bandLevel } from '@/lib/speaking/bands';

/**
 * SARIRO — which Public Speaking course: the age band
 * ============================================================================
 * Public Speaking is five courses (lib/speaking/bands.ts), so every screen that
 * creates a batch or enrols a student in it has to ask which one. One control,
 * so the batch and the enrolment screens cannot offer different bands.
 */
export default function SpeakingBandPicker({
  value, onChange, disabled,
}: {
  /** The stored level, e.g. `band-middle`. */
  value: string;
  onChange: (level: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
        Age band — each is its own course
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BAND_ORDER.map((b) => {
          const level = bandLevel(b);
          const on = value === level;
          return (
            <button
              key={b}
              type="button"
              onClick={() => onChange(level)}
              disabled={disabled}
              aria-pressed={on}
              className={`min-h-[44px] px-2 rounded-xl text-[12.5px] font-bold border-2 transition-colors disabled:opacity-50 ${
                on ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {BAND_LABEL[b]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
