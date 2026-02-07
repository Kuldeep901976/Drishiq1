import { NextResponse } from 'next/server';
import { getCachedJson, setCachedJson, CACHE_TTL } from '@/lib/redis';

// Default currency rates
const DEFAULT_CURRENCY_RATES = [
  { currency_code: 'USD', currency_symbol: '$', current_rate: 83.0 },
  { currency_code: 'INR', currency_symbol: '₹', current_rate: 1.0 },
  { currency_code: 'EUR', currency_symbol: '€', current_rate: 90.0 },
  { currency_code: 'GBP', currency_symbol: '£', current_rate: 105.0 },
  { currency_code: 'CAD', currency_symbol: 'C$', current_rate: 61.0 },
  { currency_code: 'AUD', currency_symbol: 'A$', current_rate: 55.0 },
  { currency_code: 'JPY', currency_symbol: '¥', current_rate: 0.55 },
  { currency_code: 'CNY', currency_symbol: '¥', current_rate: 11.5 },
  { currency_code: 'SGD', currency_symbol: 'S$', current_rate: 61.5 },
  { currency_code: 'AED', currency_symbol: 'د.إ', current_rate: 22.6 },
  { currency_code: 'MXN', currency_symbol: '$', current_rate: 4.8 },
  { currency_code: 'BRL', currency_symbol: 'R$', current_rate: 16.5 }
];

const CACHE_KEY = 'api:currency-rates';

export async function GET() {
  try {
    const cached = await getCachedJson<typeof DEFAULT_CURRENCY_RATES>(CACHE_KEY);
    if (cached) {
      const response = NextResponse.json(cached);
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    await setCachedJson(CACHE_KEY, DEFAULT_CURRENCY_RATES, CACHE_TTL.currencyRates);

    const response = NextResponse.json(DEFAULT_CURRENCY_RATES);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120');
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




















