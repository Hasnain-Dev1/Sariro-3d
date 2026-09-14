'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Command, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { ATTENTION_SHORT, greetingFor, type AttentionItem, type Severity } from '@/lib/ops/attention';
import { useAttention } from './attention-provider';
import { goTo } from './go-to';
import { OPS_ICON } from './ops-icon';
import { openCommandBar } from './command-bar';

/**
 * SARIRO — Today
 * ============================================================================
 * The first thing on a staff dashboard: what is waiting on this person, most
 * urgent first, one click from the place it gets done. Replaces the scroll —
 * a super admin used to read thirty panels top to bottom to find out whether
 * anything needed them.
 *
 * Every count comes from the panel's own fetcher (attention-provider.tsx), so
 * the number here and the list it opens always agree.
 */

const SEVERITY_LABEL: Record<Severity, { label: string; dot: string; text: string; chip: string }> = {
  urgent: { label: 'Urgent', dot: '#F87171', text: 'text-red-700', chip: 'bg-red-50 text-red-700 ring-red-200' },
  today: { label: 'Today', dot: '#FBBF24', text: 'text-amber-700', chip: 'bg-amber-50 text-amber-800 ring-amber-200' },
  watch: { label: 'Watch', dot: '#34D399', text: 'text-emerald-700', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

function useNow(everyMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}

function ago(ms: number | null, now: number): string {
  if (!ms) return 'Checking…';
  const mins = Math.floor((now - ms) / 60_000);
  if (mins < 1) return 'Updated just now';
  if (mins === 1) return 'Updated a minute ago';
  if (mins < 60) return `Updated ${mins} minutes ago`;
  return `Updated ${Math.floor(mins / 60)}h ago`;
}

export default function TodayQueue() {
  const attention = useAttention();
  const { profile } = useAuth();
  const router = useRouter();
  const now = useNow(30_000);
  const [greeting, setGreeting] = useState({ hello: 'Hello', date: '' });

  // The clock is the reader's, so it is read after mount rather than on the server.
  useEffect(() => {
    const d = new Date();
    setGreeting({
      hello: greetingFor(d.getHours()),
      date: d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    });
  }, []);

  if (!attention) return null;
  const { items, total, bySeverity, failed, allClear, pending, refresh, lastUpdated } = attention;
  const firstName = (profile?.full_name ?? '').trim().split(/\s+/)[0] || 'there';
  const nothingYet = pending && items.length === 0;

  const headline = nothingYet
    ? 'Checking what needs you…'
    : allClear
      ? 'Nothing is waiting on you.'
      : items.length === 0
        ? 'Nothing found yet.'
        : `${total} ${total === 1 ? 'thing needs' : 'things need'} you`;

  return (
    <section id="today" className="mb-10" aria-labelledby="today-heading">
      <div className="rounded-[1.4rem] overflow-hidden border border-[var(--card-border)] bg-white shadow-[0_1px_2px_rgba(42,37,31,0.05),0_24px_48px_-32px_rgba(42,37,31,0.35)]">
        {/* The masthead */}
        <div
          className="relative px-5 py-6 sm:px-8 sm:py-7 text-white"
          style={{ background: 'radial-gradient(120% 140% at 0% 0%, #3B2F22 0%, #1A1611 55%, #0D0B08 100%)' }}
        >
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Today{greeting.date ? ` · ${greeting.date}` : ''}
              </p>
              <p className="mt-2 text-[15px] text-white/70">{greeting.hello}, {firstName}.</p>
              <h2 id="today-heading" className="mt-1 text-[1.9rem] sm:text-[2.35rem] font-extrabold leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {headline}
              </h2>

              {!nothingYet && items.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(['urgent', 'today', 'watch'] as Severity[]).filter((s) => bySeverity[s] > 0).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/90 tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_LABEL[s].dot }} />
                      {bySeverity[s]} {SEVERITY_LABEL[s].label.toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openCommandBar}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 h-10 text-[13px] font-bold text-white transition-colors"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Jump anywhere
                <kbd className="inline-flex items-center gap-0.5 rounded-md bg-white/15 px-1.5 py-0.5 text-[11px] font-bold text-white/80">
                  <Command className="w-3 h-3" />K
                </kbd>
              </button>
              <button
                type="button"
                onClick={refresh}
                aria-label="Check again"
                title={ago(lastUpdated, now)}
                className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 w-10 h-10 text-white transition-colors"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] text-white/40">{ago(lastUpdated, now)}</p>
        </div>

        {/* The work */}
        <div className="p-4 sm:p-6 bg-[#FBF9F6]">
          {allClear ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white border border-emerald-200 px-5 py-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <p className="text-[14.5px] text-slate-700">
                <span className="font-bold text-slate-900">All clear.</span> Every queue is empty — classes decided, requests answered, invoices in the books.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((item) => (
                <QueueCard key={item.key} item={item} onOpen={() => goTo(item.href, router.push)} />
              ))}
              {nothingYet && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {failed.length > 0 && (
            <p className="mt-3 flex items-start gap-2 text-[12.5px] text-slate-600">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Could not check {failed.map((k) => ATTENTION_SHORT[k]).join(', ')} just now — the panels below still work.{' '}
                <button type="button" onClick={refresh} className="font-bold text-slate-800 underline underline-offset-2">Try again</button>
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function QueueCard({ item, onOpen }: { item: AttentionItem; onOpen: () => void }) {
  const Icon = OPS_ICON[item.icon];
  const sev = SEVERITY_LABEL[item.severity];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative text-left rounded-2xl bg-white border border-[var(--card-border)] p-4 pl-5 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(42,37,31,0.45)] focus-visible:outline-none focus-visible:ring-2"
      style={{ ['--tw-ring-color' as string]: item.accent }}
    >
      <span aria-hidden className="absolute left-0 inset-y-0 w-1" style={{ background: item.accent }} />
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.accent}14`, color: item.accent }}>
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${sev.chip}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
              {sev.label}
            </span>
            <span className="text-[1.9rem] leading-none font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {item.count}
            </span>
          </div>
          <p className="mt-2 text-[15px] font-bold text-slate-900 leading-snug">{item.title}</p>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-slate-500 line-clamp-2">{item.why}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color: item.accent, fontFamily: 'var(--font-grotesk)' }}>
            Resolve
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-[var(--card-border)] p-4 pl-5">
      <div className="flex items-start gap-3 animate-pulse">
        <span className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-16 rounded bg-slate-100" />
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
