import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Language codes supported
const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'ar', 'zh', 'ja', 'es', 'fr', 'de', 'ru', 'pt'];

export async function GET(request: NextRequest) {
  try {
    // Get language from query parameter or header
    const searchParams = request.nextUrl.searchParams;
    const lang = searchParams.get('lang') || 
                 request.headers.get('x-language') || 
                 request.cookies.get('drishiq_lang')?.value || 
                 'en';
    
    // Normalize language code (handle short form)
    const langCode = lang.split('-')[0].toLowerCase();
    const finalLang = SUPPORTED_LANGUAGES.includes(langCode) ? langCode : 'en';
    
    // Build column names for selected language
    const domainCol = finalLang === 'en' ? 'domain_en' : `domain_${finalLang}`;
    const areaCol = finalLang === 'en' ? 'area_en' : `area_${finalLang}`;
    const challengeCol = finalLang === 'en' ? 'challenge_en' : `challenge_${finalLang}`;
    
    // Fallback columns (always use English as fallback)
    const domainFallback = 'domain_en';
    const areaFallback = 'area_en';
    const challengeFallback = 'challenge_en';
    
    // Create Supabase client with service role
    const supabase = createServiceClient();
    
    // Build dynamic select query with language columns
    // Select all columns and let us handle language selection in code
    // Note: Handle cases where is_active might not exist or column names might vary
    let query = supabase
      .from('challenges')
      .select('*');
    
    // Only filter by is_active if the column exists (handle gracefully)
    query = query.eq('is_active', true);
    
    // Order by available columns
    query = query.order('domain_key', { ascending: true });
    query = query.order('area_key', { ascending: true });
    
    const { data: challenges, error } = await query;
    
    if (error) {
      console.error('Error fetching challenges:', error);
      return NextResponse.json(
        { error: 'Failed to fetch challenges from database', details: error.message },
        { status: 500 }
      );
    }
    
    if (!challenges || challenges.length === 0) {
      // Return empty CSV format if no data
      return new NextResponse(
        'Category (Domain),Area of Challenge,Challenge,Issues\n',
        {
          headers: {
            'Content-Type': 'text/csv',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }
    
    // Build CSV header
    const csvRows: string[] = [];
    csvRows.push('Category (Domain),Area of Challenge,Challenge,Issues');
    
    // Helper function to get translated value with fallback to English
    // Database columns are: domain_en, domain_hi, area_en, area_hi, challenge_en, challenge_hi, etc.
    const getTranslated = (challenge: any, field: 'domain' | 'area' | 'challenge'): string => {
      // Try language-specific column first (e.g., domain_en, domain_hi, area_en, area_hi)
      const langColumn = `${field}_${finalLang}`;
      if (challenge[langColumn] && String(challenge[langColumn]).trim()) {
        return String(challenge[langColumn]).trim();
      }
      
      // Fallback to English column (e.g., domain_en, area_en, challenge_en)
      const enColumn = `${field}_en`;
      if (challenge[enColumn] && String(challenge[enColumn]).trim()) {
        return String(challenge[enColumn]).trim();
      }
      
      // Last resort: try the field name itself (for backwards compatibility)
      if (challenge[field] && String(challenge[field]).trim()) {
        return String(challenge[field]).trim();
      }
      
      return '';
    };
    
    // Escape CSV values
    const escapeCSV = (str: string) => {
      if (!str) return '';
      const escaped = str.replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') 
        ? `"${escaped}"` 
        : escaped;
    };
    
    // Process challenges and build CSV
    challenges.forEach((challenge: any) => {
      const domainValue = getTranslated(challenge, 'domain');
      const areaValue = getTranslated(challenge, 'area');
      const challengeValue = getTranslated(challenge, 'challenge');
      
      // Get issues - check for language-specific issues columns first
      // If language-specific issues columns exist (e.g., issues_en, issues_hi), use them
      // Otherwise, fall back to the base issues or tags column
      let issuesValue = '';
      
      // Try language-specific issues column (if it exists in the future)
      const langIssuesCol = `issues_${finalLang}`;
      if (challenge[langIssuesCol] && String(challenge[langIssuesCol]).trim()) {
        issuesValue = String(challenge[langIssuesCol]).trim();
      }
      // Fallback to English issues column (if it exists)
      else if (challenge['issues_en'] && String(challenge['issues_en']).trim()) {
        issuesValue = String(challenge['issues_en']).trim();
      }
      // Fallback to base issues column
      else if (challenge.issues && String(challenge.issues).trim()) {
        issuesValue = String(challenge.issues).trim();
      }
      // Last resort: use tags column
      else if (challenge.tags && String(challenge.tags).trim()) {
        issuesValue = String(challenge.tags).trim();
      }
      
      // Skip if essential fields are missing
      if (!domainValue || !areaValue || !challengeValue) {
        console.warn('Skipping challenge with missing data:', {
          domain: domainValue,
          area: areaValue,
          challenge: challengeValue,
          availableKeys: Object.keys(challenge)
        });
        return;
      }
      
      csvRows.push(
        `${escapeCSV(domainValue)},${escapeCSV(areaValue)},${escapeCSV(challengeValue)},${escapeCSV(issuesValue)}`
      );
    });
    
    // Log summary for debugging
    console.log(`Generated CSV with ${csvRows.length - 1} challenges for language: ${finalLang}`);
    
    const csvContent = csvRows.join('\n');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
    
  } catch (error: any) {
    console.error('Error in challenges API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
