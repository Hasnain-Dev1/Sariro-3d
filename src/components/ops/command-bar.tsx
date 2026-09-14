'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CornerDownLeft, Search, Zap, Compass, AlertCircle, type LucideIcon } from 'lucide-react';
import { staffCommands, searchCommands, type Command, type CommandGroup } from '@/lib/ops/commands';
import type { StaffRole } from '@/lib/ops/attention';
import { useAttention } from './attention-provider';
import { goTo } from './go-to';

/**
 * SARIRO — ⌘K
 * ============================================================================
 * One keystroke to anything a member of staff does: what is waiting on them
 * (with live counts), the jobs they do, and every page they can reach. Opens
 * with ⌘K / Ctrl+K, or "/" when not typing. See lib/ops/commands.ts for what is
 * offered and how search ranks it.
 */

const OPEN_EVENT = 'sariro:command-bar';

/** Open the command bar from anywhere — a button, a hint, a keyboard handler. */
export function openCommandBar() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const GROUP_ICON: Record<CommandGroup, LucideIcon> = {
  'Needs you': AlertCircle,
  Do: Zap,
  'Go to': Compass,
};

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export default function CommandBar({ role, nav }: { role: StaffRole; nav: readonly { href: string; label: string }[] }) {
  const router = useRouter();
  const attention = useAttention();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo(() => staffCommands(role, attention?.items ?? [], nav), [role, attention?.items, nav]);
  const results = useMemo(() => searchCommands(commands, query), [commands, query]);

  const close = useCallback(() => { setOpen(false); setQuery(''); setActive(0); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !open && !isTyping(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    close();
    // After the overlay has gone, so the scroll lands on the page and not behind it.
    window.setTimeout(() => goTo(c.href, router.push), 30);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  let lastGroup: CommandGroup | null = null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-center px-3 pt-[10vh]"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Command bar"
        >
          <motion.div
            initial={{ y: -8, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="w-full max-w-xl rounded-2xl bg-white shadow-[0_32px_80px_-24px_rgba(13,11,8,0.55)] border border-[var(--card-border)] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Jump to anything — try “certificate” or “credit”"
                className="flex-1 h-14 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                aria-controls="command-results"
                aria-activedescendant={results[active] ? `cmd-${active}` : undefined}
              />
              <kbd className="hidden sm:inline text-[11px] font-bold text-slate-400 border border-slate-200 rounded-md px-1.5 py-0.5">esc</kbd>
            </div>

            <div ref={listRef} id="command-results" role="listbox" className="max-h-[56vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing matches “{query}”.</p>
              ) : (
                results.map((c, i) => {
                  const header = c.group !== lastGroup ? c.group : null;
                  lastGroup = c.group;
                  const GroupIcon = GROUP_ICON[c.group];
                  const isActive = i === active;
                  return (
                    <div key={c.id}>
                      {header && (
                        <p className="px-5 pt-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          {header}
                        </p>
                      )}
                      <button
                        type="button"
                        id={`cmd-${i}`}
                        role="option"
                        aria-selected={isActive}
                        data-index={i}
                        onMouseMove={() => setActive(i)}
                        onClick={() => run(c)}
                        className={`w-full flex items-center gap-3 px-3 mx-2 py-2.5 rounded-xl text-left transition-colors ${isActive ? 'bg-slate-100' : ''}`}
                        style={{ width: 'calc(100% - 1rem)' }}
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={c.accent ? { background: `${c.accent}14`, color: c.accent } : { background: '#F1F5F9', color: '#64748B' }}
                        >
                          <GroupIcon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-slate-900 truncate">{c.label}</span>
                          {c.hint && <span className="block text-[12px] text-slate-500 truncate">{c.hint}</span>}
                        </span>
                        {c.badge !== undefined && (
                          <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-black text-white flex items-center justify-center tabular-nums" style={{ background: c.accent ?? '#0F172A' }}>
                            {c.badge}
                          </span>
                        )}
                        {isActive && (c.badge === undefined ? <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" /> : null)}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500">
              <span className="flex items-center gap-3">
                <span><kbd className="font-bold">↑↓</kbd> move</span>
                <span className="inline-flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> open</span>
              </span>
              <span>{attention && attention.total > 0 ? `${attention.total} waiting on you` : 'All caught up'}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
