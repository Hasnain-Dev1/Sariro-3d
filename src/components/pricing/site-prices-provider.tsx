'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_SITE_PRICES, type SitePrices } from '@/lib/school/pricing';

/**
 * The website's live prices, handed down from the root layout (which reads them
 * on the server — lib/pricing/site-prices-server.ts). Anything that prints a
 * school price reads it from here, so a change HR saves reaches every card,
 * strip and table on the site together.
 *
 * Outside the provider — a test, a storybook — it is simply the defaults.
 */
const SitePricesContext = createContext<SitePrices>(DEFAULT_SITE_PRICES);

export function SitePricesProvider({ prices, children }: { prices: SitePrices; children: ReactNode }) {
  return <SitePricesContext.Provider value={prices}>{children}</SitePricesContext.Provider>;
}

export function useSitePrices(): SitePrices {
  return useContext(SitePricesContext);
}
