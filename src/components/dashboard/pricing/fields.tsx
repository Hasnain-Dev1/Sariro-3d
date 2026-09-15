'use client';

import { useState, type ReactNode } from 'react';
import type { Status } from '@/lib/pricing/economics';

/* Small controls shared by the pricing screens. Deliberately plain: this is a
   tool management types numbers into all afternoon, so every field shows its
   unit, keeps what is being typed, and never jumps while it is focused. */

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  placeholder,
  disabled,
  allowEmpty,
  compact,
  invalid,
}: {
  label?: ReactNode;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  hint?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  /** Blank means "not set" (null) rather than being ignored. */
  allowEmpty?: boolean;
  compact?: boolean;
  invalid?: boolean;
}) {
  /* What is typed, while typing. "1." or "" are not numbers yet, so the text is
     held here and the number is only reported once it parses. */
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === null || value === undefined ? '' : String(value));

  const input = (
    <span
      className={`flex items-center rounded-lg border bg-white transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 ${
        invalid ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'
      } ${disabled ? 'opacity-60 bg-slate-50' : ''} ${compact ? 'h-9' : 'h-10'}`}
    >
      {prefix && <span className="pl-2.5 text-[13px] font-semibold text-slate-400 select-none">{prefix}</span>}
      <input
        inputMode="decimal"
        disabled={disabled}
        value={shown}
        placeholder={placeholder}
        onFocus={() => setDraft(shown)}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const t = e.target.value.replace(/[,\s₹$%]/g, '');
          if (t === '') {
            if (allowEmpty) onChange(null);
            return;
          }
          const n = Number(t);
          if (Number.isFinite(n)) onChange(n);
        }}
        className={`min-w-0 w-full bg-transparent px-2.5 text-[14px] font-semibold text-slate-900 tabular-nums outline-none placeholder:font-normal placeholder:text-slate-400 ${compact ? 'text-[13px]' : ''}`}
      />
      {suffix && <span className="pr-2.5 text-[12px] font-semibold text-slate-400 select-none whitespace-nowrap">{suffix}</span>}
    </span>
  );

  if (!label) return input;
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-slate-600 mb-1">{label}</span>
      {input}
      {hint && <span className="block mt-1 text-[11.5px] leading-snug text-slate-500">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
      <span>
        <span className="block text-[13.5px] font-bold text-slate-900">{label}</span>
        {hint && <span className="block text-[12px] text-slate-500 leading-snug mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  size = 'md',
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg font-bold transition-colors ${size === 'sm' ? 'px-2.5 h-8 text-[12px]' : 'px-3.5 h-9 text-[13px]'} ${
            o.value === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const STATUS_STYLE: Record<Status, { cls: string; word: string }> = {
  green: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', word: 'Green' },
  yellow: { cls: 'bg-amber-50 text-amber-800 border-amber-200', word: 'Yellow' },
  red: { cls: 'bg-rose-50 text-rose-700 border-rose-200', word: 'Red' },
};

export function StatusChip({ status, label }: { status: Status; label?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'}`} />
      {label ?? s.word}
    </span>
  );
}

export function Card({ title, icon, children, aside, className = '' }: { title?: ReactNode; icon?: ReactNode; children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 ${className}`}>
      {(title || aside) && (
        <div className="flex items-start justify-between gap-3 mb-3.5">
          {title && (
            <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {icon}
              {title}
            </h3>
          )}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone = 'default', sub }: { label: ReactNode; value: ReactNode; tone?: 'default' | 'good' | 'bad' | 'muted'; sub?: ReactNode }) {
  const color = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : tone === 'muted' ? 'text-slate-500' : 'text-slate-900';
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>{label}</p>
      <p className={`mt-0.5 text-[18px] font-extrabold tabular-nums leading-tight ${color}`} style={{ fontFamily: 'var(--font-jakarta)' }}>{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-slate-500 leading-snug">{sub}</p>}
    </div>
  );
}
