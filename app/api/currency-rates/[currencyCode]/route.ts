import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { currencyCode: string } }
) {
  try {
    const { currencyCode } = params;

    const { data: rate, error } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('currency_code', currencyCode.toUpperCase())
      .single();

    if (error || !rate) {
      return NextResponse.json(
        { error: 'Currency rate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      currency_code: rate.currency_code,
      currency_symbol: rate.currency_symbol,
      current_rate: rate.current_rate
    });
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
