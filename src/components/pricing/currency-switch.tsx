'use client';

import { useDisplayCurrency } from '@/components/pricing/site-prices-provider';

/**
 * ₹ / $ — beside every price list. Rupees for families in India (GST included,
 * pay by UPI), dollars for everybody else. Remembered on this device.
 */
export default function CurrencySwitch({ tone = 'light', className = '' }: { tone?: 'light' | 'dark'; className?: string }) {
  const { currency, setCurrency } = useDisplayCurrency();
  const dark = tone === 'dark';
  return (
    <div
      role="group"
      aria-label="Show prices in"
      className={`inline-flex items-center rounded-full p-0.5 text-[12px] font-bold ${dark ? 'bg-white/10' : 'bg-slate-100'} ${className}`}
      style={{ fontFamily: 'var(--font-grotesk)' }}
    >
      {([['INR', '₹ India'], ['USD', '$ Worldwide']] as const).map(([value, label]) => {
        const active = currency === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setCurrency(value)}
            className={`h-7 px-3 rounded-full transition-colors ${
              active
                ? dark ? 'bg-white text-slate-900' : 'bg-white text-slate-900 shadow-sm'
                : dark ? 'text-white/70 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
