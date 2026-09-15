import Image from 'next/image';
import { BRAND } from '@/lib/sariro-data';

/**
 * SARIRO — the logo, in one place
 * ============================================================================
 * The mark is public/logo.svg: the blue S on black that the invoices, the
 * emails and the trial certificate already carry. Everywhere else drew a
 * stand-in — a gradient square with a letter S in the dashboards and on the
 * course certificate, a graduation cap in the site header, footer and sign-in
 * screens — so a family saw four different "logos" and none of them was ours.
 *
 * Deliberately not 'use client': the certificate pages render on the server.
 */

/** The square mark on its own. `label` only when nothing beside it says "Sariro". */
export function SariroMark({
  size = 36,
  label,
  priority,
  className = '',
}: {
  size?: number;
  label?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden bg-black ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.27) }}
    >
      <Image
        src="/logo.svg"
        alt={label ?? ''}
        aria-hidden={label ? undefined : true}
        width={size}
        height={size}
        priority={priority}
        unoptimized
        className="w-full h-full"
      />
    </span>
  );
}

/** The mark and the name, with an optional line under the name. */
export function SariroLogo({
  size = 36,
  tone = 'dark',
  subtitle,
  priority,
  className = '',
  nameClassName = 'text-lg',
}: {
  size?: number;
  /** 'light' on a dark background. */
  tone?: 'dark' | 'light';
  subtitle?: string;
  priority?: boolean;
  className?: string;
  nameClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SariroMark size={size} priority={priority} />
      <span className="flex flex-col leading-none text-left">
        <span
          className={`font-extrabold tracking-tight ${tone === 'light' ? 'text-white' : 'text-slate-900'} ${nameClassName}`}
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {BRAND.name}
        </span>
        {subtitle && (
          <span
            className={`mt-1 text-[10px] uppercase tracking-[0.18em] font-semibold ${tone === 'light' ? 'text-slate-400' : 'text-slate-500'}`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
