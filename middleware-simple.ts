// middleware.ts - Synchronous Language Detection: Preferred → Location → Default
import { NextRequest, NextResponse } from 'next/server';

// Language mapping by country
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  'IN': 'hi',  // India → Hindi
  'ES': 'es',  // Spain → Spanish
  'MX': 'es',  // Mexico → Spanish
  'AR': 'es',  // Argentina → Spanish
  'FR': 'fr',  // France → French
  'DE': 'de',  // Germany → German
  'CN': 'zh',  // China → Chinese
  'JP': 'ja',  // Japan → Japanese
  'SA': 'ar',  // Saudi Arabia → Arabic
  'AE': 'ar',  // UAE → Arabic
  'BD': 'bn',  // Bangladesh → Bengali
  'LK': 'ta',  // Sri Lanka → Tamil
  'RU': 'ru',  // Russia → Russian
  'BR': 'pt',  // Brazil → Portuguese
  'PT': 'pt',  // Portugal → Portuguese
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let detectedLang = 'en'; // Default English
  
  // 1. Check for language cookie (drishiq_lang - single source of truth)
  const preferredLang = request.cookies.get('drishiq_lang')?.value;
  if (preferredLang && ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'ta', 'bn', 'ru', 'pt'].includes(preferredLang)) {
    detectedLang = preferredLang;
    console.log('🌍 Language Detection: Using language from cookie:', preferredLang);
  } else {
    // 2. Check location (IP geolocation) - Simplified for now
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // For localhost/development, use default English
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log('🌍 Language Detection: Local IP detected, using default English');
    } else {
      // In production, you would make an API call here to get country from IP
      // For now, we'll use a simple heuristic based on common IP patterns
      // This is a placeholder - in real implementation, use a geolocation service
      console.log('🌍 Language Detection: Production IP detected, would check geolocation');
      // detectedLang = await getCountryFromIP(ip); // This would be async in real implementation
    }
  }

  // Add language to request headers for the page
  const response = NextResponse.next();
  response.headers.set('x-language', detectedLang);
  
  // Set cookie for future requests (only if not already set)
  if (!preferredLang) {
    response.cookies.set('drishiq_lang', detectedLang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    console.log('🌍 Language Detection: Set cookie for future requests:', detectedLang);
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

