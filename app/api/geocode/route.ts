import { NextRequest, NextResponse } from 'next/server';

interface GeocodeResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  formatted: string;
}

// Shared geocoding logic
async function geocodePlace(place: string) {
  const suggestionsOnly = false;
  const limit = 1;

  // Primary: Use OpenStreetMap Nominatim API (free, no key required)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=${limit}&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'DrishiQ/1.0' // Required by Nominatim
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 seconds
    }
  );

  if (!response.ok) {
    throw new Error(`Nominatim API returned ${response.status}`);
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'Location not found'
    };
  }

  const result = data[0];
  
  // Get latitude and longitude
  const latitude = parseFloat(result.lat);
  const longitude = parseFloat(result.lon);
  
  // Validate coordinates
  if (isNaN(latitude) || isNaN(longitude)) {
    return {
      success: false,
      error: 'Invalid coordinates received'
    };
  }
  
  // Get country from address structure
  const country = result.address?.country || result.address?.country_code || 'Unknown';

  // Calculate timezone from coordinates
  let timezone = 'UTC';
  try {
    // Try TimeAPI.io first (reliable, free)
    const timezoneResponse = await fetch(
      `https://timeapi.io/api/TimeZone/coordinate?latitude=${latitude}&longitude=${longitude}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (timezoneResponse.ok) {
      const timezoneData = await timezoneResponse.json();
      if (timezoneData.timeZone) {
        timezone = timezoneData.timeZone;
      }
    }
  } catch (err) {
    console.error('Error fetching timezone from TimeAPI:', err);
    
    // Fallback: Try Google Timezone API if key is available
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const googleResponse = await fetch(
          `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${googleApiKey}`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          if (googleData.timeZoneId) {
            timezone = googleData.timeZoneId;
          }
        }
      } catch (googleErr) {
        console.error('Error fetching timezone from Google:', googleErr);
      }
    }
  }

  return {
    success: true,
    data: {
      latitude,
      longitude,
      timezone,
      country,
      formatted: result.display_name
    }
  };
}

export async function GET(request: NextRequest) {
  const place = request.nextUrl.searchParams.get('place');
  
  if (!place) {
    return NextResponse.json({
      success: false,
      error: 'Place parameter required'
    }, { status: 400 });
  }

  // Check if suggestions are requested
  const suggestionsOnly = request.nextUrl.searchParams.get('suggestions') === 'true';
  const limit = suggestionsOnly ? 5 : 1; // Return more results for suggestions

  try {
    // Primary: Use OpenStreetMap Nominatim API (free, no key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=${limit}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DrishiQ/1.0' // Required by Nominatim
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Location not found'
      }, { status: 404 });
    }

    // If suggestions are requested, return array of suggestions
    if (suggestionsOnly) {
      const suggestions = data.map((result: any) => ({
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      }));
      
      return NextResponse.json({
        success: true,
        suggestions
      });
    }

    const result = data[0];
    
    // Get latitude and longitude
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates received'
      }, { status: 400 });
    }
    
    // Get country from address structure
    const country = result.address?.country || result.address?.country_code || 'Unknown';

    // Calculate timezone from coordinates
    let timezone = 'UTC';
    try {
      // Try TimeAPI.io first (reliable, free)
      const timezoneResponse = await fetch(
        `https://timeapi.io/api/TimeZone/coordinate?latitude=${latitude}&longitude=${longitude}`,
        {
          headers: {
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (timezoneResponse.ok) {
        const timezoneData = await timezoneResponse.json();
        if (timezoneData.timeZone) {
          timezone = timezoneData.timeZone;
        }
      }
    } catch (err) {
      console.error('Error fetching timezone from TimeAPI:', err);
      
      // Fallback: Try Google Timezone API if key is available
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (googleApiKey) {
        try {
          const timestamp = Math.floor(Date.now() / 1000);
          const googleResponse = await fetch(
            `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${googleApiKey}`,
            { signal: AbortSignal.timeout(5000) }
          );
          
          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            if (googleData.timeZoneId) {
              timezone = googleData.timeZoneId;
            }
          }
        } catch (googleErr) {
          console.error('Error fetching timezone from Google:', googleErr);
        }
      }
    }

    const geocodeResult: GeocodeResponse = {
      latitude,
      longitude,
      timezone,
      country,
      formatted: result.display_name
    };

    return NextResponse.json({
      success: true,
      data: geocodeResult
    });

  } catch (error: any) {
    console.error('Geocoding error:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Geocoding service timed out. Please try again.'
      }, { status: 504 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to geocode location'
    }, { status: 500 });
  }
}

// POST endpoint: Geocode a place and return full data
export async function POST(request: NextRequest) {
  try {
    const { place } = await request.json();
    
    if (!place) {
      return NextResponse.json({
        success: false,
        error: 'Place parameter required'
      }, { status: 400 });
    }

    // Use shared geocoding logic
    const result = await geocodePlace(place);
    
    if (!result.success) {
      return NextResponse.json(result, { status: result.error === 'Location not found' ? 404 : 500 });
    }

    // Return FLAT payload for backward compatibility with profile page
    if (!result.data) {
      return NextResponse.json({ error: 'No data returned' }, { status: 500 });
    }
    const { latitude, longitude, timezone, country, formatted } = result.data;
    return NextResponse.json({ latitude, longitude, timezone, country, formatted });
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({
      success: false,
      error: 'Geocoding failed'
    }, { status: 500 });
  }
}

