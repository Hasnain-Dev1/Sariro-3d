'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  CLASSES_PER_MONTH, DEFAULT_SITE_PRICES, cadencePlans, formatPrice, perClassFor, perMonthFor,
  type CadencePlan, type Ratio, type SitePrices,
} from '@/lib/school/pricing';
import {
  CURRENCY_STORAGE_KEY, DEFAULT_INR_PRICES, formatInr, inrCadencePlans, preferredCurrency,
  type DisplayCurrency, type InrPlanPrices,
} from '@/lib/pricing/inr-site';

/**
 * The website's live prices — dollars for the world, rupees for India — handed
 * down from the root layout (which reads both on the server), and which of the
 * two this visitor is looking at.
 *
 * Anything that prints a price reads it from here, so a change HR saves reaches
 * every card, strip and table together, and the ₹/$ switch flips all of them.
 *
 * Which currency: dollars on the first paint (the page is the same static HTML
 * for everybody), then the visitor's own choice if they made one, otherwise
 * rupees when their device is on Indian time. See lib/pricing/inr-site.ts.
 */

interface PricesValue {
  usd: SitePrices;
  inr: InrPlanPrices;
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
}

const SitePricesContext = createContext<PricesValue>({
  usd: DEFAULT_SITE_PRICES,
  inr: DEFAULT_INR_PRICES,
  currency: 'USD',
  setCurrency: () => {},
});

export function SitePricesProvider({ prices, inr, children }: { prices: SitePrices; inr?: InrPlanPrices; children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>('USD');

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY); } catch { /* storage blocked */ }
    let zone: string | null = null;
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* very old browser */ }
    const next = preferredCurrency(stored, zone);
    if (next !== 'USD') setCurrencyState(next);
  }, []);

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    try { window.localStorage.setItem(CURRENCY_STORAGE_KEY, c); } catch { /* storage blocked */ }
  }, []);

  return (
    <SitePricesContext.Provider value={{ usd: prices, inr: inr ?? DEFAULT_INR_PRICES, currency, setCurrency }}>
      {children}
    </SitePricesContext.Provider>
  );
}

/** The dollar prices. */
export function useSitePrices(): SitePrices {
  return useContext(SitePricesContext).usd;
}

/** The rupee prices, from the price list HR sets. */
export function useInrPrices(): InrPlanPrices {
  return useContext(SitePricesContext).inr;
}

/**
 * One month and one class, in whichever currency this visitor sees — for the
 * "from ₹3,000 a month" lines. Falls back to dollars if the rupee price list
 * has no monthly price for that class type.
 */
export function usePriceLine(ratio: Ratio): { perMonth: string; perClass: string; currency: DisplayCurrency } {
  const { usd, inr, currency } = useContext(SitePricesContext);
  const month = inr[ratio][1];
  if (currency === 'INR' && month) {
    return { perMonth: formatInr(month), perClass: formatInr(month / CLASSES_PER_MONTH), currency };
  }
  return { perMonth: formatPrice(perMonthFor(ratio, usd)), perClass: formatPrice(perClassFor(ratio, usd)), currency: 'USD' };
}

/** The three ways to pay for `classes` classes, in whichever currency this visitor sees. */
export function useCadencePlans(classes: number, ratio: Ratio): CadencePlan[] {
  const { usd, inr, currency } = useContext(SitePricesContext);
  const rupees = currency === 'INR' ? inrCadencePlans(classes, ratio, inr) : [];
  return rupees.length ? rupees : cadencePlans(classes, ratio, usd);
}

/** Which currency this visitor is looking at, and the way to change it. */
export function useDisplayCurrency(): { currency: DisplayCurrency; setCurrency: (c: DisplayCurrency) => void } {
  const { currency, setCurrency } = useContext(SitePricesContext);
  return { currency, setCurrency };
}
