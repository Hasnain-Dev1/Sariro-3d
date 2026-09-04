/**
 * SARIRO — the company, as it appears on a tax invoice
 * =========================================================
 * One place. Every invoice reads from here, so a change to the registered
 * office or the GSTIN is one edit rather than a search through components.
 *
 * These are legal identifiers on a document sent to paying customers and filed
 * against GST returns. Do not edit them casually — a wrong GSTIN on an issued
 * invoice is a correction the customer has to make on their side too.
 */

export const COMPANY = {
  legalName: 'SARIRO PVT. LTD.',
  cin: 'U85499WR2026PTC296357',
  gstin: '19ABUCS8431M1ZB',

  address: {
    line1: 'DWARAKA PALLY MADAKATA RD, LOKEPUR BANKURA',
    line2: 'BANKURA, LOKEPUR, BANKURA - I',
    line3: 'BANKURA - 722102, WEST BENGAL',
    country: 'India',
  },

  email: 'support@sariro.com',
  phone: '+91 6295 461 132',

  /** Already in the repo at public/logo.svg. */
  logoSrc: '/logo.svg',

  /**
   * The round company seal, above the authorised signatory line.
   *
   * Loaded the same way as the logo — a file in public/, referenced by path —
   * so replacing the stamp is dropping in a new file, not editing a component.
   *
   * WebP with transparency, roughly 600x600, matching mimo-portrait.webp
   * alongside it. It prints at about 88pt on the invoice; anything smaller goes
   * soft on paper where the type beside it is sharp.
   */
  stampSrc: '/images/sariro-stamp.webp',
} as const;

/**
 * The state a GSTIN belongs to is its first two digits. 19 is West Bengal.
 *
 * This decides whether a sale to an Indian customer is intra-state (CGST+SGST)
 * or inter-state (IGST) — see lib/invoice/calculate.ts. Deriving it from the
 * GSTIN rather than writing "West Bengal" separately means the two cannot
 * disagree if the company ever registers elsewhere.
 */
export const HOME_STATE_CODE = COMPANY.gstin.slice(0, 2);

/** GST state codes, for choosing the customer's state on an Indian invoice. */
export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' }, { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' }, { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' }, { code: '34', name: 'Puducherry' },
  { code: '36', name: 'Telangana' }, { code: '37', name: 'Andhra Pradesh' },
];

export interface Currency { code: string; symbol: string; label: string }

/** INR first — it is the common case and the one GST applies to. */
export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'Pound Sterling' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
];

/**
 * Countries offered in the picker.
 *
 * India first — it is both the common case and the one that decides the tax
 * treatment. After that, the places Indian families actually live, then the
 * rest alphabetically.
 *
 * `Other` is last and is not a fallback for laziness: no list is complete, and
 * the one place a missing country hurts most is the document a customer keeps.
 * Choosing it reveals a text field, so a sale to somewhere unanticipated is a
 * typed name rather than a wrong one.
 */
export const COUNTRIES = [
  'India',
  // Where the diaspora is.
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'United Arab Emirates', 'Singapore', 'Qatar', 'Saudi Arabia', 'Kuwait',
  'Oman', 'Bahrain', 'New Zealand', 'Malaysia',
  // The rest.
  'Argentina', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Chile', 'China',
  'Colombia', 'Czechia', 'Denmark', 'Egypt', 'Ethiopia', 'Finland', 'France',
  'Germany', 'Ghana', 'Greece', 'Hong Kong', 'Hungary', 'Indonesia', 'Ireland',
  'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Lebanon', 'Luxembourg',
  'Maldives', 'Mauritius', 'Mexico', 'Morocco', 'Myanmar', 'Nepal',
  'Netherlands', 'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland',
  'Portugal', 'Romania', 'Russia', 'Rwanda', 'Senegal', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan',
  'Tanzania', 'Thailand', 'Türkiye', 'Uganda', 'Ukraine', 'Vietnam', 'Zambia',
  'Zimbabwe',
  'Other',
] as const;

/** The sentinel that reveals the free-text field. */
export const OTHER_COUNTRY = 'Other';
