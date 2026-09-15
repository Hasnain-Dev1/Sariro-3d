'use client';

import { useMemo, useRef, useState, type ComponentType } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';

/**
 * SARIRO — a picker for the dark playbook header
 * ============================================================================
 * The header used native <select>s styled white-on-glass. The option text was
 * darkened with `[&>option]:text-slate-900`, which only reaches options that
 * are DIRECT children — and the subjects sit inside <optgroup>s, so they stayed
 * white on the browser's white menu. A teacher opening the subject list saw
 * one highlighted row ("Mechanics") in an otherwise blank box.
 *
 * A native menu cannot be styled reliably across browsers anyway, so this is
 * our own: every option readable, grouped under headings, a search box once
 * the list is long, and the current choice ticked.
 */

export interface PickerOption {
  value: string;
  label: string;
  group?: string;
}

export default function HeroPicker({
  icon: Icon,
  value,
  options,
  onChange,
  label,
  searchable,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  /** What the list is, for screen readers and the search placeholder. */
  label: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  const showSearch = searchable ?? options.length > 10;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = q ? options.filter((o) => `${o.label} ${o.group ?? ''}`.toLowerCase().includes(q)) : options;
    const out: { group: string; items: PickerOption[] }[] = [];
    for (const o of hits) {
      const g = o.group ?? '';
      const last = out[out.length - 1];
      if (last && last.group === g) last.items.push(o);
      else out.push({ group: g, items: [o] });
    }
    return out;
  }, [options, query]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  const first = groups[0]?.items[0];

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${current?.label ?? 'none'}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 data-[state=open]:bg-white/20 px-3 h-10 text-[13px] font-bold text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Icon className="w-4 h-4 text-white/60" />
          <span className="max-w-[14rem] truncate">{current?.label ?? label}</span>
          <ChevronDown className="w-4 h-4 text-white/60 transition-transform [[data-state=open]_&]:rotate-180" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(e) => {
            if (!showSearch) {
              e.preventDefault();
              listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
            }
          }}
          className="z-[60] w-[min(20rem,calc(100vw-24px))] rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] overflow-hidden"
        >
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && first) { e.preventDefault(); choose(first.value); }
                  if (e.key === 'ArrowDown') { e.preventDefault(); listRef.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
                }}
                placeholder={`Find a ${label.toLowerCase()}…`}
                className="h-11 w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400"
              />
            </div>
          )}
          <div
            ref={listRef}
            role="listbox"
            aria-label={label}
            className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-1.5"
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
              const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
              const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
              const next = buttons[Math.min(buttons.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)))];
              if (next) { e.preventDefault(); next.focus(); }
            }}
          >
            {groups.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-slate-500">Nothing matches “{query}”.</p>}
            {groups.map(({ group, items }) => (
              <div key={group || 'all'} className="py-1">
                {group && (
                  <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {group}
                  </p>
                )}
                {items.map((o) => {
                  const selected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => choose(o.value)}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[14px] outline-none transition-colors focus-visible:bg-slate-100 hover:bg-slate-100 ${selected ? 'font-bold text-emerald-700 bg-emerald-50' : 'font-medium text-slate-800'}`}
                    >
                      <span className="truncate">{o.label}</span>
                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
