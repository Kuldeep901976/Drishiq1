export type GeoContext = {
  country: string | null;
  country_code: string | null;
  region_code: string | null;
  city: string | null;
  timezone: string | null;
};

function mockGeo(): GeoContext {
  const samples: GeoContext[] = [
    {
      country: 'United States',
      country_code: 'US',
      region_code: 'NY',
      city: 'New York',
      timezone: 'America/New_York',
    },
    {
      country: 'India',
      country_code: 'IN',
      region_code: 'KA',
      city: 'Bengaluru',
      timezone: 'Asia/Kolkata',
    },
    {
      country: 'United Kingdom',
      country_code: 'GB',
      region_code: 'ENG',
      city: 'London',
      timezone: 'Europe/London',
    },
    {
      country: 'Australia',
      country_code: 'AU',
      region_code: 'NSW',
      city: 'Sydney',
      timezone: 'Australia/Sydney',
    },
    {
      country: 'Canada',
      country_code: 'CA',
      region_code: 'ON',
      city: 'Toronto',
      timezone: 'America/Toronto',
    },
  ];

  return samples[Math.floor(Math.random() * samples.length)];
}

async function liveGeo(ip: string): Promise<GeoContext> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return mockGeo();

    const data = await res.json();

    return {
      country: data.country_name ?? null,
      country_code: data.country_code ?? null,
      region_code: data.region_code ?? null,
      city: data.city ?? null,
      timezone: data.timezone ?? null,
    };
  } catch {
    return mockGeo();
  }
}

/**
 * Main entry used by the app.
 * Controlled by GEO_MODE env variable.
 *
 * GEO_MODE=mock  -> always mock
 * GEO_MODE=live  -> ipapi
 */
export async function getGeoContext(ip: string): Promise<GeoContext> {
  const mode = process.env.GEO_MODE ?? 'mock';

  if (mode === 'live') {
    return liveGeo(ip);
  }

  return mockGeo();
}
