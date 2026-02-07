// lib/pricing-utils.ts
// DrishiQ Location-Based Pricing Utilities
// Handles pricing calculations, currency conversion, and location-based multipliers

export interface CountryInfo {
  id: string;
  country_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  drishiq_category: 'Below Par' | 'At Par' | 'Above';
  multiplier: number;
}

export interface PlanInfo {
  id: string;
  plan_code: string;
  plan_name: string;
  credits: number;
}

export interface PricingInfo {
  base_price: number;
  discounted_price: number;
  currency_code: string;
  currency_symbol: string;
  multiplier: number;
}

export interface CurrencyRate {
  currency_code: string;
  currency_symbol: string;
  current_rate: number;
}

// Base prices in INR (from CSV data)
// Note: keep numeric fields as numbers (not ultra-narrow literal types) so TS predicates can narrow them cleanly.
export const BASE_PRICES = {
  'first-light': { base: 600, prelaunch: 249, postlaunch: 499 },
  'steady-lens': { base: 3000, prelaunch: 1249, postlaunch: 2249 },
  'enterprise': { base: 6000, prelaunch: 2499, postlaunch: 4999 },
  'gift-first-light': { base: 600, discounted: 299 },
  'gift-steady-lens': { base: 1200, discounted: 599 },
  'gift-deeper-sense': { base: 3000, discounted: 1499 },
  'support-gentle-nudge': { base: 600, discounted: 249 },
  'support-shift-forward': { base: 1200, discounted: 499 },
  'support-deeper-space': { base: 3000, discounted: 1249 }
};

type BasePricesType = typeof BASE_PRICES;

// A broader shape describing plan pricing entries so guards and usage can work with numbers
export type PlanPriceShape = {
  base: number;
  prelaunch?: number;
  postlaunch?: number;
  discounted?: number;
};

// Default currency rates (can be updated from API)
export const DEFAULT_CURRENCY_RATES: CurrencyRate[] = [
  { currency_code: 'USD', currency_symbol: '$', current_rate: 83.0 }, // 1 USD = 83 INR (example)
  { currency_code: 'INR', currency_symbol: '₹', current_rate: 1.0 },
  { currency_code: 'EUR', currency_symbol: '€', current_rate: 90.0 },
  { currency_code: 'GBP', currency_symbol: '£', current_rate: 105.0 },
  { currency_code: 'CAD', currency_symbol: 'C$', current_rate: 61.0 },
  { currency_code: 'AUD', currency_symbol: 'A$', current_rate: 55.0 },
  { currency_code: 'JPY', currency_symbol: '¥', current_rate: 0.55 },
  { currency_code: 'CNY', currency_symbol: '¥', current_rate: 11.5 },
  { currency_code: 'SGD', currency_symbol: 'S$', current_rate: 61.5 },
  { currency_code: 'AED', currency_symbol: 'د.إ', current_rate: 22.6 }
];

/** Type guards for PLAN price shapes */
function isPrePostPrices(x: PlanPriceShape | any): x is { base: number; prelaunch: number; postlaunch: number } {
  return typeof x === 'object' && x !== null && typeof x.prelaunch === 'number' && typeof x.postlaunch === 'number';
}
function isDiscountedPrices(x: PlanPriceShape | any): x is { base: number; discounted: number } {
  return typeof x === 'object' && x !== null && typeof x.discounted === 'number';
}

/**
 * Get country information by country code
 */
export async function getCountryInfo(countryCode: string): Promise<CountryInfo | null> {
  try {
    const response = await fetch(`/api/countries/${countryCode}`);
    if (!response.ok) return null;
    return (await response.json()) as CountryInfo;
  } catch (error) {
    console.error('Error fetching country info:', error);
    return null;
  }
}

/**
 * Get currency rate by currency code
 */
export async function getCurrencyRate(currencyCode: string): Promise<CurrencyRate | null> {
  try {
    const response = await fetch(`/api/currency-rates/${currencyCode}`);
    if (!response.ok) return null;
    return (await response.json()) as CurrencyRate;
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    // Fallback to default rates
    return DEFAULT_CURRENCY_RATES.find(rate => rate.currency_code === currencyCode) || null;
  }
}

/**
 * Convert price from INR to target currency
 *
 * current_rate is interpreted as "INR per 1 unit of currency" for that currency.
 * Example: if current_rate for USD is 83: 1 USD = 83 INR, so INR -> USD = INR / 83.
 */
export function convertCurrency(priceInINR: number, targetCurrency: string, rates: CurrencyRate[]): number {
  const rate = rates.find(r => r.currency_code === targetCurrency);
  if (!rate) return priceInINR;
  // Convert INR -> currency (INR divided by INR-per-unit-of-currency)
  if (rate.current_rate === 0) return priceInINR;
  return priceInINR / rate.current_rate;
}

/**
 * Calculate location-based pricing for a plan
 *
 * This function now safely handles the fact that some plans have {prelaunch, postlaunch}
 * and some plans have {discounted}. We guard access with type checks and fallback to base price.
 */
export function calculateLocationPricing(
  planCode: keyof typeof BASE_PRICES,
  countryInfo: CountryInfo,
  currencyRates: CurrencyRate[],
  pricingMode: 'prelaunch' | 'postlaunch' | 'gift' | 'support' = 'prelaunch'
): PricingInfo {
  const planPricesRaw = BASE_PRICES[planCode] as any;
  if (!planPricesRaw) {
    throw new Error(`Unknown plan code: ${String(planCode)}`);
  }

  const planPrices: PlanPriceShape = {
    base: Number(planPricesRaw.base),
    prelaunch: planPricesRaw.prelaunch !== undefined ? Number(planPricesRaw.prelaunch) : undefined,
    postlaunch: planPricesRaw.postlaunch !== undefined ? Number(planPricesRaw.postlaunch) : undefined,
    discounted: planPricesRaw.discounted !== undefined ? Number(planPricesRaw.discounted) : undefined
  };

  const basePriceINR = planPrices.base;

  let discountedPriceINR: number;

  // Determine discountedPriceINR with safe guards
  if (pricingMode === 'prelaunch') {
    if (isPrePostPrices(planPrices)) {
      discountedPriceINR = planPrices.prelaunch;
    } else if (isDiscountedPrices(planPrices)) {
      // gift/support-like entry; use discounted as fallback for prelaunch
      discountedPriceINR = planPrices.discounted;
    } else {
      discountedPriceINR = planPrices.base;
    }
  } else if (pricingMode === 'postlaunch') {
    if (isPrePostPrices(planPrices)) {
      discountedPriceINR = planPrices.postlaunch;
    } else if (isDiscountedPrices(planPrices)) {
      discountedPriceINR = planPrices.discounted;
    } else {
      discountedPriceINR = planPrices.base;
    }
  } else {
    // gift or support
    if (isDiscountedPrices(planPrices)) {
      discountedPriceINR = planPrices.discounted;
    } else {
      // If no discounted present, fall back to base
      discountedPriceINR = planPrices.base;
    }
  }

  // Apply location-based multiplier
  const adjustedBasePrice = basePriceINR * countryInfo.multiplier;
  const adjustedDiscountedPrice = discountedPriceINR * countryInfo.multiplier;

  // Convert to local currency
  const basePrice = convertCurrency(adjustedBasePrice, countryInfo.currency_code, currencyRates);
  const discountedPrice = convertCurrency(adjustedDiscountedPrice, countryInfo.currency_code, currencyRates);

  return {
    base_price: Math.round(basePrice * 100) / 100, // Round to 2 decimal places
    discounted_price: Math.round(discountedPrice * 100) / 100,
    currency_code: countryInfo.currency_code,
    currency_symbol: countryInfo.currency_symbol,
    multiplier: countryInfo.multiplier
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currencySymbol: string, decimals: number = 2): string {
  return `${currencySymbol}${price.toFixed(decimals)}`;
}

/**
 * Get pricing display for a plan (with base price struck through)
 */
export function getPricingDisplay(
  planCode: keyof typeof BASE_PRICES,
  countryInfo: CountryInfo,
  currencyRates: CurrencyRate[],
  pricingMode: 'prelaunch' | 'postlaunch' | 'gift' | 'support' = 'prelaunch',
  showBasePrice: boolean = true
): {
  basePrice?: string;
  discountedPrice: string;
  currencySymbol: string;
  multiplier: number;
} {
  const pricing = calculateLocationPricing(planCode, countryInfo, currencyRates, pricingMode);

  const result: {
    basePrice?: string;
    discountedPrice: string;
    currencySymbol: string;
    multiplier: number;
  } = {
    discountedPrice: formatPrice(pricing.discounted_price, pricing.currency_symbol),
    currencySymbol: pricing.currency_symbol,
    multiplier: pricing.multiplier
  };

  if (showBasePrice) {
    result.basePrice = formatPrice(pricing.base_price, pricing.currency_symbol);
  }

  return result;
}

/**
 * Get all pricing plans for a country
 */
export async function getAllPricingPlans(
  countryCode: string,
  currencyRates: CurrencyRate[] = DEFAULT_CURRENCY_RATES
): Promise<{
  mainPlans: any[];
  giftPlans: any[];
  supportPlans: any[];
} | null> {
  const countryInfo = await getCountryInfo(countryCode);
  if (!countryInfo) return null;

  const mainPlans = [
    {
      id: 'first-light',
      name: 'First Light',
      prelaunch: getPricingDisplay('first-light', countryInfo, currencyRates, 'prelaunch'),
      postlaunch: getPricingDisplay('first-light', countryInfo, currencyRates, 'postlaunch'),
      credits: 1
    },
    {
      id: 'steady-lens',
      name: 'Steady Lens',
      prelaunch: getPricingDisplay('steady-lens', countryInfo, currencyRates, 'prelaunch'),
      postlaunch: getPricingDisplay('steady-lens', countryInfo, currencyRates, 'postlaunch'),
      credits: 5
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      prelaunch: getPricingDisplay('enterprise', countryInfo, currencyRates, 'prelaunch'),
      postlaunch: getPricingDisplay('enterprise', countryInfo, currencyRates, 'postlaunch'),
      credits: 10
    }
  ];

  const giftPlans = [
    {
      id: 'gift-first-light',
      name: 'Gift First Light',
      pricing: getPricingDisplay('gift-first-light', countryInfo, currencyRates, 'gift', false),
      credits: 1
    },
    {
      id: 'gift-steady-lens',
      name: 'Gift Steady Lens',
      pricing: getPricingDisplay('gift-steady-lens', countryInfo, currencyRates, 'gift', false),
      credits: 2
    },
    {
      id: 'gift-deeper-sense',
      name: 'Gift Deeper Sense',
      pricing: getPricingDisplay('gift-deeper-sense', countryInfo, currencyRates, 'gift', false),
      credits: 5
    }
  ];

  const supportPlans = [
    {
      id: 'support-gentle-nudge',
      name: 'One Gentle Nudge',
      pricing: getPricingDisplay('support-gentle-nudge', countryInfo, currencyRates, 'support', false),
      credits: 1
    },
    {
      id: 'support-shift-forward',
      name: 'A Shift Forward',
      pricing: getPricingDisplay('support-shift-forward', countryInfo, currencyRates, 'support', false),
      credits: 2
    },
    {
      id: 'support-deeper-space',
      name: 'Deeper Space',
      pricing: getPricingDisplay('support-deeper-space', countryInfo, currencyRates, 'support', false),
      credits: 5
    }
  ];

  return { mainPlans, giftPlans, supportPlans };
}

/**
 * Detect user's country from IP or browser
 */
export async function detectUserCountry(): Promise<string> {
  try {
    // Try IP geolocation first
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return data.country_code || 'IN';
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error);
  }

  // Fallback to stored preference or default
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userCountry') || 'IN';
  }

  return 'IN';
}
