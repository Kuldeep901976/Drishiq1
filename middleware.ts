// middleware.ts
// Next.js middleware for affiliate link tracking AND admin route protection

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getAffiliateCookieName } from './lib/affiliate-utils';

// Device/visitor identity cookie names and options
const DEVICE_ID_COOKIE = 'drishiq_device_id';
const VISITOR_ID_COOKIE = 'drishiq_visitor_id';
const IDENTITY_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

function getClientIP(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

// Admin route protection
const ADMIN_PATH = /^\/admin(\/|$)/;
const ADMIN_API_PATH = /^\/api\/admin(\/|$)/;

// Public path prefixes for O(1) lookup (Set of prefixes + exact paths)
const PUBLIC_PREFIXES = new Set([
  '/admin/super-admin-signin',
  '/api/webhooks',
  '/',
  '/signup',
  '/signin',
  '/auth/',
  '/forgot-password',
  '/reset-password',
  '/user/signin',
  '/user/signup',
  '/user/create-password',
  '/api/auth',
  '/api/affiliate',
  '/api/detect-location',
  '/api/transcribe',
  '/api/intent',
  '/api/chat/onboarding-concierge',
  '/_next',
  '/favicon.ico',
  '/_next/',
  '/static/'
]);
const STATIC_EXT = /\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/;

function isPublicPath(pathname: string): boolean {
  if (STATIC_EXT.test(pathname)) return true;
  for (const p of PUBLIC_PREFIXES) {
    if (pathname === p || pathname.startsWith(p)) return true;
  }
  return false;
}

async function verifyAdminToken(token: string): Promise<Record<string, any> | null> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return null;
    }
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET),
      { algorithms: ['HS256'] }
    );
    return payload as Record<string, any>;
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // =====================================================
  // DEVICE & VISITOR IDENTITY (for all branches that return next())
  // =====================================================
  const newHeaders = new Headers(req.headers);
  const hadDeviceCookie = req.cookies.get(DEVICE_ID_COOKIE)?.value;
  const hadVisitorCookie = req.cookies.get(VISITOR_ID_COOKIE)?.value;
  const deviceId = hadDeviceCookie ?? crypto.randomUUID();
  const visitorId = hadVisitorCookie ?? crypto.randomUUID();
  const clientIp = getClientIP(req);
  newHeaders.set('x-device-id', deviceId);
  newHeaders.set('x-visitor-id', visitorId);
  newHeaders.set('x-client-ip', clientIp);

  // When cookie was missing, ensure visitor row exists (fire-and-forget; do not block response)
  if (!hadVisitorCookie) {
    const ensureUrl = new URL('/api/visitor/ensure', req.url).href;
    fetch(ensureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-visitor-id': visitorId,
        'x-client-ip': clientIp,
      },
    }).catch(() => {});
  }

  function nextWithIdentity(): NextResponse {
    const res = NextResponse.next({ request: { headers: newHeaders } });
    if (!hadDeviceCookie) {
      res.cookies.set(DEVICE_ID_COOKIE, deviceId, IDENTITY_COOKIE_OPTIONS);
    }
    if (!hadVisitorCookie) {
      res.cookies.set(VISITOR_ID_COOKIE, visitorId, IDENTITY_COOKIE_OPTIONS);
    }
    return res;
  }
  
  // =====================================================
  // SKIP AUTHENTICATION CHECK FOR PUBLIC PATHS
  // =====================================================
  if (isPublicPath(pathname)) {
    // Continue with affiliate tracking and other middleware logic
    // (handled below)
  } else {
    // =====================================================
    // ADMIN ROUTE PROTECTION
    // =====================================================
    if (ADMIN_PATH.test(pathname) || ADMIN_API_PATH.test(pathname)) {
      // Only /admin/super-admin-signin is public, all other admin routes require auth
      if (pathname === '/admin/super-admin-signin' || pathname.startsWith('/admin/super-admin-signin/')) {
        // Allow super admin signin page - no redirect needed
        // Continue to affiliate tracking below
      } else {
        // For API routes, require authentication token
        if (pathname.startsWith('/api')) {
          // Get token from cookie or Authorization header
          const token = req.cookies.get('sb-access-token')?.value || 
                        req.cookies.get('token')?.value ||
                        req.headers.get('authorization')?.replace(/^Bearer\s+/, '');
          
          if (!token) {
            return NextResponse.json(
              { error: 'Unauthorized - Super admin access required' },
              { status: 401 }
            );
          }
          
          // Super admin tokens are verified via admin-auth service in API routes
          // Regular JWT tokens are checked here
          const payload = await verifyAdminToken(token);
          
          // If it's a valid JWT with super_admin role, allow it
          // Otherwise, let the API route verify super admin token via admin-auth service
          if (payload && payload.role === 'super_admin') {
            const response = nextWithIdentity();
            response.headers.set('x-admin-id', String(payload.sub || payload.user_id || ''));
            return response;
          }
          
          // For super admin tokens (verified via admin-auth), allow through
          // The API route will verify via auth-middleware which checks super admin
          // For non-JWT tokens (super admin tokens), allow through for API route verification
          return nextWithIdentity();
        }
        
        // For admin pages (not API routes), allow them to load
        // Client-side admin layout will handle authentication checks and redirect to signup
        // Note: We can't check localStorage in middleware, so we rely on client-side protection
        // The admin layout will redirect unauthenticated users to /signup with enterprise tab
        return nextWithIdentity();
      }
    } else {
      // =====================================================
      // NON-ADMIN ROUTE PROTECTION
      // =====================================================
      // Check for user session (Supabase auth)
      const sessionToken = req.cookies.get('sb-access-token')?.value || 
                          req.cookies.get('sb-refresh-token')?.value;
      
      if (!sessionToken) {
        // No session found, redirect to signup with enterprise tab
        const signupUrl = new URL('/signup', req.url);
        signupUrl.searchParams.set('tab', 'enterprise');
        signupUrl.hash = 'enterprise';
        // Preserve the original path for redirect after signup
        signupUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signupUrl);
      }
    }
  }
  
  // =====================================================
  // AFFILIATE LINK TRACKING (existing functionality)
  // =====================================================
  
  // Check for /r/:code path
  const refCodeFromPath = pathname.match(/^\/r\/([^/]+)/)?.[1];
  
  // Check for ?ref= query parameter
  const refCodeFromQuery = searchParams.get('ref');
  
  const refCode = refCodeFromPath || refCodeFromQuery;
  
  if (refCode) {
    // Create response (with device/visitor identity headers and cookies)
    const response = nextWithIdentity();
    
    // Set affiliate cookie (will be validated and logged in API route)
    const cookieValue = JSON.stringify({
      refCode,
      timestamp: Date.now()
    });
    
    response.cookies.set(getAffiliateCookieName(), cookieValue, {
      httpOnly: false, // Needs to be readable by client-side JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days default (will be updated by API)
      path: '/'
    });
    
    // Track click asynchronously (don't block the request)
    fetch(`${req.nextUrl.origin}/api/affiliate/track-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
        'user-agent': req.headers.get('user-agent') || ''
      },
      body: JSON.stringify({
        refCode,
        path: pathname,
        query: Object.fromEntries(searchParams),
        referer: req.headers.get('referer') || ''
      })
    }).catch(err => {
      console.error('Error tracking affiliate click:', err);
      // Don't throw - tracking failure shouldn't break the user experience
    });
    
    // If it's a /r/:code path, redirect to home (or remove /r/ prefix)
    if (refCodeFromPath) {
      const redirectUrl = new URL(req.nextUrl);
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('ref', refCode);
      return NextResponse.redirect(redirectUrl);
    }
    
    return response;
  }
  
  return nextWithIdentity();
}

export const config = {
  matcher: [
    /*
     * Match all page routes (exclude api, _next/static, _next/image, favicon.ico)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/admin/:path*',
    '/api/affiliate/:path*',
    '/api/chat/:path*',
    '/api/detect-location',
  ],
};
