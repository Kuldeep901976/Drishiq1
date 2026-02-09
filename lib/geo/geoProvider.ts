export type GeoContext = {
  country: string | null;
  country_code: string | null;
  region_code: string | null;
  city: string | null;
  timezone: string | null;
};

/** Mock scenario index 0–9: use GEO_MOCK_SCENARIO=0..9 or x-mock-geo-index header to test a specific scenario. */
const MOCK_GEO_SAMPLES: GeoContext[] = [
  // 0: 🇺🇸 US (English baseline)
  {
    country: 'United States',
    country_code: 'US',
    region_code: 'NY',
    city: 'New York',
    timezone: 'America/New_York',
  },
  // 1: 🇮🇳 India – Karnataka (Hindi/Kannada path)
  {
    country: 'India',
    country_code: 'IN',
    region_code: 'KA',
    city: 'Bengaluru',
    timezone: 'Asia/Kolkata',
  },
  // 2: 🇮🇳 India – Tamil Nadu (Tamil test case)
  {
    country: 'India',
    country_code: 'IN',
    region_code: 'TN',
    city: 'Chennai',
    timezone: 'Asia/Kolkata',
  },
  // 3: 🇮🇳 India – West Bengal (Bengali test case)
  {
    country: 'India',
    country_code: 'IN',
    region_code: 'WB',
    city: 'Kolkata',
    timezone: 'Asia/Kolkata',
  },
  // 4: 🇬🇧 UK (English baseline)
  {
    country: 'United Kingdom',
    country_code: 'GB',
    region_code: 'ENG',
    city: 'London',
    timezone: 'Europe/London',
  },
  // 5: 🇦🇺 Australia (English baseline)
  {
    country: 'Australia',
    country_code: 'AU',
    region_code: 'NSW',
    city: 'Sydney',
    timezone: 'Australia/Sydney',
  },
  // 6: 🇨🇦 Canada – Ontario (English)
  {
    country: 'Canada',
    country_code: 'CA',
    region_code: 'ON',
    city: 'Toronto',
    timezone: 'America/Toronto',
  },
  // 7: 🇨🇦 Canada – Quebec (French test case)
  {
    country: 'Canada',
    country_code: 'CA',
    region_code: 'QC',
    city: 'Montreal',
    timezone: 'America/Toronto',
  },
  // 8: 🇷🇺 Russia (Russian test case)
  {
    country: 'Russia',
    country_code: 'RU',
    region_code: null,
    city: 'Moscow',
    timezone: 'Europe/Moscow',
  },
  // 9: 🇨🇳 China (Chinese test case)
  {
    country: 'China',
    country_code: 'CN',
    region_code: null,
    city: 'Beijing',
    timezone: 'Asia/Shanghai',
  },
];

/** Stable index 0..max from a string (for one scenario per session in mock). */
function hashToIndex(s: string, max: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % max;
}

/**
 * In mock mode: one geo per session (like live: one IP → one region), but you can pick which scenario for testing.
 * Priority: overrideIndex (0..9) > GEO_MOCK_SCENARIO env > hash(sessionId) > random.
 * - Pass overrideIndex (e.g. from x-mock-geo-index header) to test a specific scenario without restarting.
 * - GEO_MOCK_SCENARIO=0..9 = fixed scenario for all requests.
 * - Otherwise same session_id → same scenario (stable); different sessions get different scenarios (hash).
 */
function mockGeo(
  sessionId: string | null | undefined,
  overrideIndex: number | null | undefined
): GeoContext {
  const n = MOCK_GEO_SAMPLES.length;
  let index: number;

  if (overrideIndex != null && Number.isInteger(overrideIndex) && overrideIndex >= 0 && overrideIndex < n) {
    index = overrideIndex;
  } else {
    const raw = process.env.GEO_MOCK_SCENARIO?.trim();
    const parsed = raw !== undefined && raw !== '' ? parseInt(raw, 10) : NaN;
    const fixedIndex = !Number.isNaN(parsed) && parsed >= 0 && parsed < n ? parsed : null;
    index =
      fixedIndex !== null
        ? fixedIndex
        : sessionId
          ? hashToIndex(sessionId, n)
          : Math.floor(Math.random() * n);
  }
  return MOCK_GEO_SAMPLES[index];
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
 * GEO_MODE=live (default) -> ipapi.co by IP; one IP → one geo/region.
 * GEO_MODE=mock -> one scenario per session (stable); pass sessionId + optional mockGeoIndex (0..9) to test a specific scenario.
 */
export async function getGeoContext(
  ip: string,
  sessionId?: string | null,
  mockGeoIndex?: number | null
): Promise<GeoContext> {
  const raw = process.env.GEO_MODE ?? 'live';
  const mode = (typeof raw === 'string' ? raw : String(raw)).toLowerCase().trim();

  if (mode === 'mock') {
    return mockGeo(sessionId ?? null, mockGeoIndex ?? null);
  }

  return liveGeo(ip);
}
