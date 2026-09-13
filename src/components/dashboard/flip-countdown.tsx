'use client';

import { countdownParts, urgencyOf, twoDigits, type Urgency } from '@/lib/trial/countdown';

/**
 * SARIRO — the trial clock
 * ============================================================================
 * Days, hours, minutes and seconds on split-flap cards, like a departures
 * board. Each digit flips the moment it changes.
 *
 * ── It changes character as the class gets close ────────────────────────────
 * Calm when it is days away. "Today" on the day. In the final hour the cards
 * turn blue, the seconds pulse and it says to get ready — because a countdown
 * that looks the same at three days as at eight minutes nudges nobody into
 * finding a quiet room. Inside ten minutes the page shows the Join button
 * instead of this.
 *
 * ── The digits are always the real digits ───────────────────────────────────
 * The flip is decoration layered over the true value, never the thing that
 * reveals it. An animation that stalls — a background tab, a struggling phone
 * — leaves a readable clock rather than a blank one or a wrong one; that is a
 * lesson this codebase learned on the Voice Check score.
 */

const TONES: Record<Urgency, { card: string; glow: string; label: string }> = {
  far:   { card: 'from-slate-800 to-slate-900', glow: '', label: 'Starts in' },
  today: { card: 'from-slate-800 to-slate-900', glow: '', label: 'Today · starts in' },
  soon:  { card: 'from-blue-600 to-blue-800', glow: 'shadow-[0_10px_30px_-10px_rgba(37,99,235,0.7)]', label: 'Starting soon — get ready' },
  now:   { card: 'from-green-600 to-green-800', glow: '', label: 'Starting now' },
  over:  { card: 'from-slate-800 to-slate-900', glow: '', label: 'Started' },
};

const FLIP_CSS = `
@keyframes sarFlip { 0% { transform: rotateX(-80deg); opacity: .35 } 100% { transform: rotateX(0); opacity: 1 } }
@keyframes sarPulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.6); opacity: .35 } }
`;

export default function FlipCountdown({
  iso,
  now,
  size = 'lg',
}: {
  iso: string;
  now: number;
  size?: 'lg' | 'sm';
}) {
  const msLeft = Date.parse(iso) - now;
  const urgency = urgencyOf(msLeft);
  const parts = countdownParts(msLeft);
  const tone = TONES[urgency];
  const lg = size === 'lg';

  const units: { label: string; value: number }[] = [
    ...(parts.days > 0 ? [{ label: parts.days === 1 ? 'day' : 'days', value: parts.days }] : []),
    { label: 'hours', value: parts.hours },
    { label: 'min', value: parts.minutes },
    { label: 'sec', value: parts.seconds },
  ];

  return (
    <div>
      <style>{FLIP_CSS}</style>

      <p
        className={`flex items-center gap-2 font-bold uppercase tracking-wider mb-2.5 ${lg ? 'text-[11px]' : 'text-[10px]'} ${urgency === 'soon' ? 'text-blue-700' : 'text-slate-400'}`}
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {urgency === 'soon' && (
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-blue-500" style={{ animation: 'sarPulse 1.4s ease-in-out infinite' }} />
            <span className="relative w-2 h-2 rounded-full bg-blue-600" />
          </span>
        )}
        {tone.label}
      </p>

      <div className={`flex items-start ${lg ? 'gap-2 sm:gap-3' : 'gap-1.5'}`} role="timer" aria-live="off" aria-label={units.map((u) => `${u.value} ${u.label}`).join(', ')}>
        {units.map((u, i) => (
          <div key={u.label} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className={`flex ${lg ? 'gap-1' : 'gap-0.5'}`}>
                {twoDigits(u.value).map((d, j) => (
                  <FlipCard key={j} digit={d} cardTone={tone.card} glow={tone.glow} lg={lg} />
                ))}
              </div>
              <span
                className={`mt-1.5 font-bold uppercase tracking-wider text-slate-400 ${lg ? 'text-[10px]' : 'text-[9px]'}`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {u.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span
                className={`font-black text-slate-300 ${lg ? 'text-3xl sm:text-4xl mx-0.5 sm:mx-1 mt-2' : 'text-lg mx-0.5 mt-1'}`}
                // The colon blinks with the seconds — by the clock, not by an animation.
                style={{ opacity: parts.seconds % 2 === 0 ? 1 : 0.3, transition: 'opacity 0.2s' }}
                aria-hidden="true"
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlipCard({ digit, cardTone, glow, lg }: { digit: string; cardTone: string; glow: string; lg: boolean }) {
  return (
    <div className={`relative ${lg ? 'w-10 h-14 sm:w-12 sm:h-16' : 'w-7 h-10'} [perspective:400px]`}>
      <div className={`absolute inset-0 rounded-lg bg-gradient-to-b ${cardTone} ${glow} overflow-hidden`}>
        {/* Keyed by the digit: a change remounts it, and the flip plays once. */}
        <div
          key={digit}
          className={`absolute inset-0 flex items-center justify-center font-extrabold text-white tabular-nums ${lg ? 'text-3xl sm:text-4xl' : 'text-xl'}`}
          style={{
            fontFamily: 'var(--font-jakarta)',
            transformOrigin: 'top',
            animation: 'sarFlip 0.45s cubic-bezier(.2,.8,.2,1) both',
          }}
        >
          {digit}
        </div>
        {/* The split across the middle that makes it a flap. */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.04]" />
      </div>
    </div>
  );
}
