import { NextResponse } from 'next/server';

export async function GET() {
  const testIp = '8.8.8.8';

  const res = await fetch(`https://ipapi.co/${testIp}/json/`, {
    headers: { Accept: 'application/json' },
  });

  const data = await res.json();

  return NextResponse.json({
    raw: data,
    mapped: {
      country: data.country_name,
      country_code: data.country_code,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
    },
  });
}
