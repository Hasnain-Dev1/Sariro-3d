'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowRight, CheckCircle2, Sun, CalendarRange, Users, TrendingUp, Landmark, ShieldCheck, Wallet, Sprout,
  PhoneCall, Trophy, Compass, BadgeIndianRupee, type LucideIcon,
} from 'lucide-react';
import {
  ROLE_COPY, WORKSPACE_ORDER, sectionsIn, waitingAt, workspaceHref, workspaceMeta,
  type WorkspaceIcon, type WorkspaceKey, type WorkspaceRole,
} from '@/lib/ops/workspaces';
import type { AttentionItem } from '@/lib/ops/attention';
import { useAttention } from './attention-provider';
import { useWorkspace } from './workspace';
import { goTo } from './go-to';

/**
 * SARIRO — the frame around a workspace
 * ============================================================================
 *   WorkspaceTabs    the strip across the top of every workspace, with what is
 *                    waiting in each — the way between them on a phone, where
 *                    the bottom bar has room for five
 *   WorkspaceHeader  the title of a workspace: what is waiting here, the jobs
 *                    done here, and a jump to each section on the page
 *   WorkspaceTiles   on Today, one card per workspace
 */

export const WORKSPACE_ICON: Record<WorkspaceIcon, LucideIcon> = {
  today: Sun,
  classes: CalendarRange,
  people: Users,
  sales: TrendingUp,
  finance: Landmark,
  quality: ShieldCheck,
  wallet: Wallet,
  growth: Sprout,
  trials: PhoneCall,
  progress: Trophy,
  explore: Compass,
  prices: BadgeIndianRupee,
};

function CountPill({ count, urgent, inverted = false }: { count: number; urgent: boolean; inverted?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10.5px] font-black flex items-center justify-center tabular-nums ${inverted ? 'bg-white/20 text-white' : 'text-white'}`}
      style={inverted ? undefined : { background: urgent ? '#DC2626' : '#D97706' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function WorkspaceTabs() {
  const ws = useWorkspace();
  const attention = useAttention();
  if (!ws) return null;
  const items = attention?.items ?? [];

  return (
    <nav aria-label="Workspaces" className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scroll-strip">
      <div className="inline-flex min-w-full sm:min-w-0 gap-1 rounded-2xl bg-white border border-[var(--card-border)] p-1.5 shadow-[0_1px_2px_rgba(42,37,31,0.05)]">
        {WORKSPACE_ORDER[ws.role].map((key) => {
          const meta = workspaceMeta(ws.role, key);
          const Icon = WORKSPACE_ICON[meta.icon];
          const href = workspaceHref(ws.role, key);
          const active = key === ws.workspace;
          const waiting = key === 'today'
            ? { count: attention?.total ?? 0, urgent: (attention?.bySeverity.urgent ?? 0) > 0 }
            : waitingAt(items, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-[13.5px] font-bold transition-colors ${
                active ? 'text-white shadow-[0_8px_18px_-10px_rgba(13,11,8,0.8)]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)', ...(active ? { background: '#15120E' } : null) }}
            >
              <Icon className="w-4 h-4" />
              {meta.label}
              <CountPill count={waiting.count} urgent={waiting.urgent} inverted={active} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function WorkspaceHeader({ actions }: { actions?: ReactNode }) {
  const ws = useWorkspace();
  const attention = useAttention();
  const router = useRouter();
  if (!ws) return null;

  const meta = workspaceMeta(ws.role, ws.workspace);
  const Icon = WORKSPACE_ICON[meta.icon];
  const href = workspaceHref(ws.role, ws.workspace);
  const here: AttentionItem[] = (attention?.items ?? []).filter((i) => waitingAt([i], href).count > 0);
  const sections = sectionsIn(ws.role, ws.workspace);

  return (
    <header className="relative mb-8 rounded-[1.4rem] overflow-hidden border border-[var(--card-border)] bg-white shadow-[0_1px_2px_rgba(42,37,31,0.05),0_24px_48px_-36px_rgba(42,37,31,0.35)]">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent}55)` }} />
      <span aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-[0.12]" style={{ background: meta.accent }} />

      <div className="relative px-5 pt-6 pb-5 sm:px-7 sm:pt-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)]" style={{ background: meta.accent }}>
              <Icon className="w-6 h-6" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {ROLE_COPY[ws.role].eyebrow}
              </p>
              <h1 className="mt-0.5 text-[1.85rem] sm:text-[2.2rem] font-extrabold leading-[1.05] tracking-[-0.02em] text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {meta.label}
              </h1>
              <p className="mt-1.5 text-[14px] text-slate-500 max-w-xl">{meta.blurb}</p>
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:max-w-[46%]">{actions}</div>}
        </div>

        {/* What is waiting in this workspace, one click from the section. */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {attention?.pending && here.length === 0 ? (
            <span className="text-[12.5px] text-slate-400">Checking what is waiting…</span>
          ) : here.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-1.5 text-[12.5px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Nothing waiting here
            </span>
          ) : (
            here.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => goTo(item.href, router.push)}
                className="group inline-flex items-center gap-2 rounded-full bg-white ring-1 px-3 py-1.5 text-[12.5px] font-semibold text-slate-800 hover:shadow-sm transition-shadow"
                style={{ ['--tw-ring-color' as string]: `${item.accent}55` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.accent }} />
                {item.title}
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* On this page */}
      {sections.length > 1 && (
        <div className="relative border-t border-slate-100 bg-[#FBF9F6] px-5 sm:px-7 py-2.5 flex items-center gap-1 overflow-x-auto scroll-strip">
          <span className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-400 mr-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
            On this page
          </span>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(`#${s.id}`, router.push)}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/** A header action. `primary` is the one thing most often done here. */
export function WorkspaceAction({
  icon: Icon, children, onClick, href, primary = false,
}: {
  icon: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}) {
  const className = `inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-[13px] font-bold transition-colors ${
    primary ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
  }`;
  const inner = (<><Icon className="w-4 h-4" />{children}</>);
  if (href) return <Link href={href} className={className} style={{ fontFamily: 'var(--font-grotesk)' }}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={className} style={{ fontFamily: 'var(--font-grotesk)' }}>{inner}</button>;
}

export function WorkspaceTiles() {
  const ws = useWorkspace();
  const attention = useAttention();
  if (!ws) return null;
  const items = attention?.items ?? [];
  const keys = WORKSPACE_ORDER[ws.role].filter((k): k is Exclude<WorkspaceKey, 'today'> => k !== 'today');

  return (
    <section className="mb-10" aria-labelledby="workspaces-heading">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 id="workspaces-heading" className="text-lg font-bold text-slate-900">{ROLE_COPY[ws.role].tilesTitle}</h2>
          <p className="text-[13px] text-slate-500">{ROLE_COPY[ws.role].tilesBlurb}</p>
        </div>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${keys.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        {keys.map((key) => {
          const meta = workspaceMeta(ws.role, key);
          const Icon = WORKSPACE_ICON[meta.icon];
          const href = workspaceHref(ws.role, key);
          const waiting = waitingAt(items, href);
          const top = items.find((i) => waitingAt([i], href).count > 0);
          const inside = sectionsIn(ws.role, key).map((s) => s.label);
          return (
            <Link
              key={key}
              href={href}
              className="group relative rounded-2xl bg-white border border-[var(--card-border)] p-5 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(42,37,31,0.45)]"
            >
              <span aria-hidden className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full blur-2xl opacity-0 group-hover:opacity-[0.14] transition-opacity" style={{ background: meta.accent }} />
              <div className="relative flex items-start justify-between gap-3">
                <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: meta.accent }}>
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </span>
                {waiting.count > 0 ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ring-1 ${waiting.urgent ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-800 ring-amber-200'}`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {waiting.count} waiting
                  </span>
                ) : attention && !attention.pending ? (
                  <span className="rounded-full px-2.5 py-1 text-[11.5px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Clear
                  </span>
                ) : null}
              </div>
              <p className="relative mt-4 text-[17px] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{meta.label}</p>
              <p className="relative mt-1 text-[13px] leading-[1.5] text-slate-500 line-clamp-2">
                {top ? top.title : meta.blurb}
              </p>
              <p className="relative mt-3 text-[11.5px] text-slate-400 line-clamp-1">{inside.join(' · ')}</p>
              <span className="relative mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color: meta.accent, fontFamily: 'var(--font-grotesk)' }}>
                Open
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
