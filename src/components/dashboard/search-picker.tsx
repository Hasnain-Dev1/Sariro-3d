'use client';

import { useCallback, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';

/**
 * SARIRO — pick one thing out of many, by typing and by filter chips
 * ============================================================================
 * The founder, 17 Sep 2026: choosing a batch or a teacher from a dropdown works
 * with ten of them and not with two hundred. A scheduler thinks "Public Speaking,
 * Grades 1–3, 1:4, no teacher yet" — so that is how this narrows: a search box
 * matching every word typed, and a row of chips per filter, each with how many
 * it leaves. Arrow keys and Enter pick without the mouse.
 *
 * Generic over the item; the caller says how to search, filter and draw one.
 */

export interface PickerFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Whether an item passes with this option chosen. */
  test: (item: T, value: string) => boolean;
  /** Chosen when the picker first shows; "" (the default) is All. */
  initial?: string;
}

interface Props<T> {
  items: readonly T[];
  getId: (item: T) => string;
  /** Everything a person might type to find it: code, name, email, course. */
  searchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** The chosen item, collapsed. Defaults to renderItem. */
  renderSelected?: (item: T) => ReactNode;
  value: string | null;
  onChange: (id: string | null, item: T | null) => void;
  ariaLabel: string;
  placeholder?: string;
  filters?: PickerFilter<T>[];
  loading?: boolean;
  emptyText?: string;
  /** Rows shown before "Show more". */
  pageSize?: number;
  /** Items shown but not choosable, with the reason. */
  disabledReason?: (item: T) => string | null;
}

export default function SearchPicker<T>({
  items, getId, searchText, renderItem, renderSelected, value, onChange, ariaLabel,
  placeholder = 'Search…', filters = [], loading = false, emptyText = 'Nothing matches.', pageSize = 30, disabledReason,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  /* Only what the person clicked; a filter that appears later starts at its own initial. */
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [limit, setLimit] = useState(pageSize);
  const [cursor, setCursor] = useState(0);

  const selected = value ? items.find((i) => getId(i) === value) ?? null : null;
  const showList = open || !selected;

  const tokens = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const matchesQuery = useMemo(() => {
    const cache = new Map<T, string>();
    return (item: T) => {
      if (!tokens.length) return true;
      let text = cache.get(item);
      if (text === undefined) { text = searchText(item).toLowerCase(); cache.set(item, text); }
      return tokens.every((t) => text!.includes(t));
    };
  }, [tokens, searchText]);

  const passes = useCallback(
    (item: T, skipKey?: string) => filters.every((f) => {
      const v = f.key in chosen ? chosen[f.key] : f.initial ?? '';
      return f.key === skipKey || !v || f.test(item, v);
    }),
    [filters, chosen]
  );

  const visible = useMemo(() => items.filter((i) => matchesQuery(i) && passes(i)), [items, matchesQuery, passes]);

  /** How many each chip would leave, given the search and the other filters. */
  const counts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const f of filters) {
      const pool = items.filter((i) => matchesQuery(i) && passes(i, f.key));
      out[f.key] = { '': pool.length };
      for (const o of f.options) out[f.key][o.value] = pool.filter((i) => f.test(i, o.value)).length;
    }
    return out;
  }, [items, matchesQuery, passes, filters]);

  const choose = (item: T) => {
    if (disabledReason?.(item)) return;
    onChange(getId(item), item);
    setOpen(false);
    setQuery('');
    setCursor(0);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const max = Math.min(visible.length, limit) - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(max, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const item = visible[cursor]; if (item) choose(item); }
    else if (e.key === 'Escape' && selected) { e.preventDefault(); setOpen(false); }
  };

  const setFilter = (key: string, v: string) => {
    setChosen((c) => ({ ...c, [key]: v }));
    setLimit(pageSize);
    setCursor(0);
  };

  if (!showList && selected) {
    return (
      <div className="flex items-start gap-2 rounded-xl border-2 border-blue-500 bg-blue-50/50 p-2.5">
        <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">{(renderSelected ?? renderItem)(selected)}</div>
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 h-8 px-2.5 rounded-lg border border-blue-200 bg-white text-[12px] font-bold text-blue-700 hover:bg-blue-50">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white" aria-label={ariaLabel}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-2.5">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCursor(0); setLimit(pageSize); }}
          onKeyDown={onKey}
          autoFocus={open}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="h-10 w-full bg-transparent text-[13px] outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
        )}
        {selected && (
          <button type="button" onClick={() => { setOpen(false); setQuery(''); }} className="shrink-0 text-[12px] font-bold text-slate-500 hover:text-slate-800">Cancel</button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="px-2.5 py-2 space-y-1.5 border-b border-slate-100">
          {filters.map((f) => (
            <div key={f.key} className="flex items-center gap-1.5 min-w-0">
              <span className="w-16 shrink-0 text-[10.5px] font-black uppercase tracking-wider text-slate-400">{f.label}</span>
              <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                {[{ value: '', label: 'All' }, ...f.options].map((o) => {
                  const on = (f.key in chosen ? chosen[f.key] : f.initial ?? '') === o.value;
                  const n = counts[f.key]?.[o.value] ?? 0;
                  return (
                    <button
                      key={o.value || 'all'}
                      type="button"
                      onClick={() => setFilter(f.key, o.value)}
                      aria-pressed={on}
                      className={`shrink-0 h-7 px-2 rounded-full border text-[11.5px] font-bold whitespace-nowrap transition-colors ${
                        on ? 'border-blue-500 bg-blue-600 text-white' : n === 0 ? 'border-slate-100 text-slate-300' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {o.label} <span className={on ? 'text-blue-100' : 'text-slate-400'}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="max-h-80 overflow-y-auto" role="listbox" aria-label={ariaLabel}>
        {loading && items.length === 0 ? (
          <p className="flex items-center gap-2 px-3 py-3 text-[12.5px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>
        ) : visible.length === 0 ? (
          <p className="px-3 py-3 text-[12.5px] text-slate-500">{emptyText}</p>
        ) : (
          <>
            {visible.slice(0, limit).map((item, i) => {
              const id = getId(item);
              const reason = disabledReason?.(item) ?? null;
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={id === value}
                  aria-disabled={!!reason}
                  onClick={() => choose(item)}
                  onMouseEnter={() => setCursor(i)}
                  className={`w-full text-left px-3 py-2 border-b border-slate-50 last:border-0 ${
                    reason ? 'opacity-50 cursor-not-allowed' : i === cursor ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  {renderItem(item)}
                  {reason && <span className="block text-[11px] font-semibold text-rose-600 mt-0.5">{reason}</span>}
                </button>
              );
            })}
            {visible.length > limit && (
              <button type="button" onClick={() => setLimit((l) => l + pageSize)} className="w-full px-3 py-2 text-[12px] font-bold text-blue-700 hover:bg-blue-50">
                Show {Math.min(pageSize, visible.length - limit)} more of {visible.length - limit}
              </button>
            )}
          </>
        )}
      </div>
      <p className="px-3 py-1.5 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
        {visible.length} of {items.length}{tokens.length ? ` matching “${query.trim()}”` : ''} · ↑ ↓ and Enter to pick
      </p>
    </div>
  );
}
