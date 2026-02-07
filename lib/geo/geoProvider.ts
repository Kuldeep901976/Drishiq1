export type GeoContext = {
  country: string | null;
  country_code: string | null;
  region_code: string | null;
  city: string | null;
  timezone: string | null;
};

function mockGeo(): GeoContext {
  const samples: GeoContext[] = [
    // 🇺🇸 US (English baseline)
    {
      country: 'United States',
      country_code: 'US',
      region_code: 'NY',
      city: 'New York',
      timezone: 'America/New_York',
    },

    // 🇮🇳 India – Karnataka (Hindi/Kannada path)
    {
      country: 'India',
      country_code: 'IN',
      region_code: 'KA',
      city: 'Bengaluru',
      timezone: 'Asia/Kolkata',
    },

    // 🇮🇳 India – Tamil Nadu (Tamil test case)
    {
      country: 'India',
      country_code: 'IN',
      region_code: 'TN',
      city: 'Chennai',
      timezone: 'Asia/Kolkata',
    },

    // 🇮🇳 India – West Bengal (Bengali test case)
    {
      country: 'India',
      country_code: 'IN',
      region_code: 'WB',
      city: 'Kolkata',
      timezone: 'Asia/Kolkata',
    },

    // 🇬🇧 UK (English baseline)
    {
      country: 'United Kingdom',
      country_code: 'GB',
      region_code: 'ENG',
      city: 'London',
      timezone: 'Europe/London',
    },

    // 🇦🇺 Australia (English baseline)
    {
      country: 'Australia',
      country_code: 'AU',
      region_code: 'NSW',
      city: 'Sydney',
      timezone: 'Australia/Sydney',
    },

    // 🇨🇦 Canada – Ontario (English)
    {
      country: 'Canada',
      country_code: 'CA',
      region_code: 'ON',
      city: 'Toronto',
      timezone: 'America/Toronto',
    },

    // 🇨🇦 Canada – Quebec (French test case)
    {
      country: 'Canada',
      country_code: 'CA',
      region_code: 'QC',
      city: 'Montreal',
      timezone: 'America/Toronto',
    },

    // 🇷🇺 Russia (Russian test case)
    {
      country: 'Russia',
      country_code: 'RU',
      region_code: null,
      city: 'Moscow',
      timezone: 'Europe/Moscow',
    },

    // 🇨🇳 China (Chinese test case)
    {
      country: 'China',
      country_code: 'CN',
      region_code: null,
      city: 'Beijing',
      timezone: 'Asia/Shanghai',
    },
  ];

  return samples[Math.floor(Math.random() * samples.length)];
}


const EMPTY_GEO: GeoContext = {
  country: null,
  country_code: null,
  region_code: null,
  city: null,
  timezone: null,
};

async function liveGeo(ip: string): Promise<GeoContext> {
  // When IP is missing (e.g. localhost), use ipapi.co/json/ so they use the request's IP
  const url =
    ip && ip !== 'unknown'
      ? `https://ipapi.co/${ip}/json/`
      : 'https://ipapi.co/json/';

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return EMPTY_GEO;

    const data = await res.json();

    return {
      country: data.country_name ?? null,
      country_code: data.country_code ?? null,
      region_code: data.region_code ?? null,
      city: data.city ?? null,
      timezone: data.timezone ?? null,
    };
  } catch {
    return EMPTY_GEO;
  }
}

/**
 * Main entry used by the app.
 * GEO_MODE=live (default) -> ipapi.co by IP; no mock, returns empty geo on failure.
 * GEO_MODE=mock -> mock samples (testing only).
 */
export async function getGeoContext(ip: string): Promise<GeoContext> {
  const mode = process.env.GEO_MODE ?? 'live';

  if (mode === 'mock') {
    return mockGeo();
  }

  return liveGeo(ip);
}
