import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LANGUAGE_CODES, validateLanguageCode } from '@/lib/onboarding-concierge/regional-languages';

interface LanguageDetectionRequest {
  country: string;
  city?: string;
  countryName?: string;
}

interface LanguageDetectionResponse {
  language: string;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

/**
 * Use LLM to intelligently detect the best language from our 12 supported languages
 * based on country and city information
 */
async function detectLanguageWithLLM(
  country: string,
  city?: string,
  countryName?: string
): Promise<LanguageDetectionResponse> {
  try {
    // Import OpenAI client
    const { getAIClient } = await import('@/lib/ai/client');
    const openai = getAIClient();

    const prompt = `Based on this location, which language is most spoken? Choose ONE from our supported languages.

Location: ${city ? `${city}, ` : ''}${countryName || country}

Supported languages: en, hi, es, fr, de, pt, ar, zh, ja, ru, bn, ta

Rules:
- India: Delhi/Mumbai (hi), Chennai (ta), Kolkata (bn), rest (en)
- If language not in list → return 'en'

Respond ONLY with JSON:
{"language": "en"}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a language detection expert. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Very low for consistent results
      max_tokens: 50, // Simple response
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const result = JSON.parse(content) as LanguageDetectionResponse;

    // CRITICAL: Validate that the language is in our supported list
    // If not, default to English (our fallback language)
    const validatedLanguage = validateLanguageCode(result.language);
    
    if (validatedLanguage !== result.language) {
      console.warn(`⚠️ [Language Detection] LLM returned unsupported language: ${result.language}, defaulting to English`);
      return {
        language: 'en',
        confidence: 'low',
        reason: `Unsupported language ${result.language} detected, defaulted to English`
      };
    }

    return {
      ...result,
      language: validatedLanguage // Ensure it's validated
    };
  } catch (error) {
    console.error('❌ [Language Detection] LLM error:', error);
    // Fallback to English on error
    return {
      language: 'en',
      confidence: 'low',
      reason: 'LLM detection failed, defaulted to English'
    };
  }
}

/**
 * GET - Detect language using LLM based on location
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country');
    const city = searchParams.get('city') || undefined;
    const countryName = searchParams.get('countryName') || undefined;

    if (!country) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    const result = await detectLanguageWithLLM(country, city, countryName);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error: any) {
    console.error('Language detection error:', error);
    return NextResponse.json(
      {
        language: 'en',
        confidence: 'low',
        reason: 'Detection failed, defaulted to English'
      },
      { status: 200 } // Return 200 with default English instead of error
    );
  }
}

/**
 * POST - Detect language using LLM based on location (alternative endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, city, countryName } = body as LanguageDetectionRequest;

    if (!country) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    const result = await detectLanguageWithLLM(country, city, countryName);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error: any) {
    console.error('Language detection error:', error);
    return NextResponse.json(
      {
        language: 'en',
        confidence: 'low',
        reason: 'Detection failed, defaulted to English'
      },
      { status: 200 }
    );
  }
}

