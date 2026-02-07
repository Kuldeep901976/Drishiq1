import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAllPricingPlans, DEFAULT_CURRENCY_RATES } from '@/lib/pricing-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'IN';

    // Get all countries
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true);

    if (countriesError) {
      throw countriesError;
    }

    // Get all currency rates
    const { data: currencyRates, error: ratesError } = await supabase
      .from('currency_rates')
      .select('*');

    if (ratesError) {
      console.warn('Currency rates not available, using defaults');
    }

    const rates = currencyRates || DEFAULT_CURRENCY_RATES;

    // Get pricing plans for the specified country
    const pricingPlans = await getAllPricingPlans(country, rates);

    if (!pricingPlans) {
      return NextResponse.json(
        { error: 'Pricing not available for this country' },
        { status: 404 }
      );
    }

    // Get country info
    const countryInfo = countries?.find(c => c.country_code === country);

    return NextResponse.json({
      countryCode: country,
      countryInfo,
      currencyRates: rates,
      plans: pricingPlans
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
