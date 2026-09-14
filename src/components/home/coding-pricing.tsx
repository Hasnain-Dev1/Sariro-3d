'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Code2, Crown, Rocket, Sprout, Users, User, type LucideIcon } from 'lucide-react';
import { codingTierViews, type CodingRatio, type CodingTierView } from '@/lib/pricing/coding-tiers';

/**
 * SARIRO — Coding & AI pricing, on the homepage
 * ============================================================================
 * The old cards were the one part of the homepage that did not look like the
 * rest of it: tilting 3D panels, magnetic buttons, a "Most popular" badge
 * hanging off the top edge, and the middle card pushed forward in 3D space.
 * They also only ever showed the small-batch price, though every tier has a
 * one-to-one price too.
 *
 * Now they are the site's own `.card`, the same tokens as the subject strip
 * and the school pricing card above, with plain links for buttons.
 *
 * ── "The Intermediate button does not work" ─────────────────────────────────
 * Not a bug in the card. The cookie banner and the "try a class" bar both sat
 * over the bottom-centre of the screen — exactly where the MIDDLE card's button
 * lands as it scrolls into view — so the click went to an overlay while the
 * outer cards' buttons still worked. The banner moved to a corner; the bar
 * steps aside over this section (data-hide-sticky-cta). A button nobody can
 * press is a price nobody pays.
 */

const STYLE: Record<string, { accent: string; icon: LucideIcon }> = {
  beginner: { accent: '#16A34A', icon: Sprout },
  intermediate: { accent: '#2563EB', icon: Rocket },
  expert: { accent: '#7C3AED', icon: Crown },
};

const CODING_ACCENT = '#EA580C';

/** How many features a card lists before pointing at the full comparison. */
const FEATURES_SHOWN = 6;

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export default function CodingPricing() {
  const [ratio, setRatio] = useState<CodingRatio>('1:4');
  const tiers = codingTierViews(ratio);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">
        <div className="max-w-2xl">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] mb-3"
            style={{ fontFamily: 'var(--font-grotesk)', color: CODING_ACCENT }}
          >
            <Code2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            Coding &amp; AI · any age
          </span>
          <h3
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Build real things with code and AI.
          </h3>
          <p className="text-[15px] text-slate-600 mt-2.5 leading-[1.6]">
            A course you pay for once, not a subscription. Every level is taught live by a mentor, and the
            first class is free.
          </p>
        </div>

        <RatioSwitch ratio={ratio} onChange={setRatio} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
        {tiers.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="h-full"
          >
            <TierCard tier={t} ratio={ratio} />
          </motion.div>
        ))}
      </div>

      <p className="mt-5 text-[13px] text-slate-500 text-center">
        Prices in USD, charged once per course.{' '}
        <Link href="/pricing" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900">
          Compare every feature
        </Link>
      </p>
    </div>
  );
}

function RatioSwitch({ ratio, onChange }: { ratio: CodingRatio; onChange: (r: CodingRatio) => void }) {
  const options: { value: CodingRatio; label: string; sub: string; icon: LucideIcon }[] = [
    { value: '1:4', label: 'Small batch', sub: '4 learners', icon: Users },
    { value: '1:1', label: 'One to one', sub: 'just you', icon: User },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Class size"
      className="inline-flex self-start md:self-auto rounded-2xl border border-[var(--card-border)] bg-[#FBF9F6] p-1"
    >
      {options.map((o) => {
        const active = ratio === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-left transition-colors ${
              active ? 'bg-white shadow-[0_1px_2px_rgba(42,37,31,0.08),0_6px_16px_-10px_rgba(42,37,31,0.25)]' : 'hover:bg-white/60'
            }`}
          >
            <o.icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} strokeWidth={2.3} />
            <span className="leading-tight">
              <span className={`block text-[13px] font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                {o.label}
              </span>
              <span className="block text-[11px] text-slate-400">{o.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TierCard({ tier, ratio }: { tier: CodingTierView; ratio: CodingRatio }) {
  const s = STYLE[tier.id] ?? STYLE.intermediate;
  const Icon = s.icon;
  const shown = tier.features.slice(0, FEATURES_SHOWN);
  const more = tier.features.filter((f) => f.kind === 'item').length - shown.filter((f) => f.kind === 'item').length;

  return (
    <div
      className="card card--feature relative flex flex-col h-full overflow-hidden"
      style={{
        ['--accent' as string]: s.accent,
        ...(tier.popular
          ? {
              borderColor: s.accent,
              boxShadow: `0 0 0 1px ${s.accent}, 0 24px 48px -28px color-mix(in srgb, ${s.accent} 70%, rgb(42 37 31))`,
              background: `linear-gradient(180deg, color-mix(in srgb, ${s.accent} 5%, #fff) 0%, #fff 38%)`,
            }
          : {}),
      }}
    >
      {/* A thin accent rule on every card, so the three levels read as one family. */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: s.accent, opacity: tier.popular ? 1 : 0.55 }} />

      <div className="flex items-start justify-between gap-3">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${s.accent}14`, color: s.accent }}
        >
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </span>
        {tier.popular && (
          <span
            className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
            style={{ background: s.accent, fontFamily: 'var(--font-grotesk)' }}
          >
            Most popular
          </span>
        )}
      </div>

      <h4 className="mt-4 text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {tier.name}
      </h4>
      <p className="mt-1 text-[13.5px] leading-[1.55] text-slate-600 min-h-[42px]">{tier.tagline}</p>

      {/* The price, and what it means per class. */}
      <div className="mt-5">
        {tier.price === null ? (
          <p className="text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Custom</p>
        ) : (
          <>
            {tier.was !== null && (
              <p className="flex items-center gap-2 mb-1 text-xs font-bold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white">Save {tier.savePercent}%</span>
                <span className="line-through text-red-600">{money(tier.was)}</span>
              </p>
            )}
            <p className="flex items-baseline gap-1.5">
              <span className="text-[2.75rem] leading-none font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {money(tier.price)}
              </span>
              <span className="text-[13px] font-semibold text-slate-500">one payment</span>
            </p>
            {tier.perClass !== null && (
              <p className="mt-2 text-[13px] text-slate-600 tabular-nums">
                <span className="font-bold" style={{ color: s.accent }}>{money(tier.perClass)} a class</span>
                {' · '}
                {tier.classes} live classes · {ratio === '1:1' ? 'one to one' : 'batch of 4'}
              </p>
            )}
          </>
        )}
      </div>

      <ul className="card-meta space-y-2.5 flex-1">
        {shown.map((f) =>
          f.kind === 'heading' ? (
            <li key={f.text} className="pt-1 text-[11.5px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {f.text}
            </li>
          ) : (
            <li key={f.text} className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-slate-700">
              <span
                className="mt-[1px] w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${s.accent}18`, color: s.accent }}
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
              {f.text}
            </li>
          )
        )}
        {more > 0 && (
          <li className="text-[12.5px] text-slate-500 pl-[28px]">
            + {more} more — <Link href="/pricing" className="font-semibold underline underline-offset-2 hover:text-slate-800">see all</Link>
          </li>
        )}
      </ul>

      <Link
        href={tier.href}
        className={`btn-tactile ${tier.popular ? 'btn-tactile-primary' : 'btn-tactile-light'} mt-6 w-full px-5 py-3.5 text-sm`}
      >
        {tier.cta}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
