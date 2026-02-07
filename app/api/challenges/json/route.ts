import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Language codes supported
const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'ar', 'zh', 'ja', 'es', 'fr', 'de', 'ru', 'pt'];

export async function GET(request: NextRequest) {
  try {
    // Get language from query parameter
    const searchParams = request.nextUrl.searchParams;
    const lang = searchParams.get('lang') || 'en';
    
    // Normalize language code (handle short form)
    const langCode = lang.split('-')[0].toLowerCase();
    // Only use if it's a valid language code (2-3 characters, not a variant name like 'invitation')
    const finalLang = (langCode.length >= 2 && langCode.length <= 3 && SUPPORTED_LANGUAGES.includes(langCode)) 
      ? langCode 
      : 'en';
    
    // Create Supabase client with service role (bypasses RLS)
    let supabase;
    try {
      // Check if service role key exists
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
        return NextResponse.json(
          { 
            error: 'Server configuration error', 
            details: 'SUPABASE_SERVICE_ROLE_KEY environment variable is missing. Please configure it in your .env.local file.' 
          },
          { status: 500 }
        );
      }
      supabase = createServiceClient();
    } catch (err: any) {
      console.error('Error creating Supabase service client:', err);
      return NextResponse.json(
        { error: 'Failed to initialize database connection', details: err.message || String(err) },
        { status: 500 }
      );
    }
    
    // Fetch challenges from database
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('domain_key', { ascending: true })
      .order('area_key', { ascending: true })
      .order('display_order', { ascending: true });
    
    const { data: challenges, error } = await query;
    
    if (error) {
      console.error('Error fetching challenges:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if table doesn't exist
      const errorMessage = error.message || String(error);
      const errorCode = error.code || error.hint || '';
      
      if (errorCode === 'PGRST205' || 
          errorMessage?.includes('schema cache') || 
          errorMessage?.includes('Could not find the table') ||
          errorMessage?.includes('relation "challenges" does not exist') ||
          errorMessage?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Table not found', 
            details: 'The challenges table doesn\'t exist in the database. Please run the SQL migration script at \'database/migrations/20250120_create_challenges_table.sql\' in your Supabase SQL Editor to create the table.',
            code: errorCode || 'TABLE_NOT_FOUND',
            hint: 'Run the migration script to create the challenges table'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch challenges from database', 
          details: errorMessage || 'Unknown error occurred',
          code: errorCode || 'UNKNOWN_ERROR',
          hint: error.hint || undefined
        },
        { status: 500 }
      );
    }
    
    if (!challenges || challenges.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }
    
    // Return challenges as JSON
    return NextResponse.json({ 
      data: challenges, 
      error: null,
      language: finalLang
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
    
  } catch (error: any) {
    console.error('Error in challenges JSON API:', error);
    const errorMessage = error?.message || String(error) || 'Unknown error occurred';
    const errorCode = error?.code || 'INTERNAL_ERROR';
    
    // Check if it's a table not found error
    if (errorMessage?.includes('relation "challenges" does not exist') ||
        errorMessage?.includes('does not exist') ||
        errorMessage?.includes('schema cache')) {
      return NextResponse.json(
        { 
          error: 'Table not found', 
          details: 'The challenges table doesn\'t exist in the database. Please run the SQL migration script at \'database/migrations/20250120_create_challenges_table.sql\' in your Supabase SQL Editor to create the table.',
          code: 'TABLE_NOT_FOUND',
          hint: 'Run the migration script to create the challenges table'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
}

