/**
 * Auth Middleware
 * Provides authentication and authorization utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withRateLimit, RateLimitConfig } from '@/lib/middleware/rate-limit';

export interface AuthUser {
  id: string;
  email: string;
  [key: string]: any;
}

export interface WithAuthOptions {
  requireAdmin?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyPrefix?: string;
  };
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 10000); // Limit length
}

/**
 * Create a secure error response
 */
export function createSecureErrorResponse(
  message: string = 'An error occurred',
  status: number = 500
): NextResponse {
  // Don't expose internal error details in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : message;
  
  return NextResponse.json(
    { error: errorMessage },
    { status }
  );
}

/**
 * Get authenticated user from request
 */
async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get user from Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // First, try to verify as super admin token
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'http://localhost:3000';
        const verifyRes = await fetch(`${baseUrl}/api/admin-auth/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (verifyRes.ok) {
          const adminData = await verifyRes.json();
          if (adminData.user) {
            // Return super admin user
            return {
              id: adminData.user.id || adminData.user.user_id || 'super_admin',
              email: adminData.user.email || 'admin@drishiq.com',
              role: 'super_admin',
              ...adminData.user
            } as AuthUser;
          }
        }
      } catch (superAdminError) {
        // Not a super admin token, continue to Supabase check
      }
      
      // Try Supabase auth
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        return user as AuthUser;
      }
    }
    
    // Try to get from cookies (for browser requests)
    // Extract access_token from cookies if present
    const cookies = request.headers.get('cookie');
    if (cookies) {
      const cookieMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/);
      if (cookieMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(cookieMatch[1]));
          const accessToken = tokenData?.access_token;
          
          if (accessToken) {
            const { data: { user }, error } = await supabase.auth.getUser(accessToken);
            
            if (!error && user) {
              return user as AuthUser;
            }
          }
        } catch (e) {
          // Ignore cookie parsing errors
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Check if user is super admin
 * ONLY super admin can access admin module
 */
async function checkAdminAccess(user: AuthUser): Promise<boolean> {
  try {
    // ONLY super_admin role is allowed
    // If user is already marked as super_admin from token verification, allow access
    if (user.role === 'super_admin') {
      return true;
    }
    
    // Check database for super admin status
    const { data: userData, error } = await supabase
      .from('users')
      .select('user_type, role, is_active')
      .eq('id', user.id)
      .single();
    
    if (error || !userData) {
      return false;
    }
    
    // ONLY super_admin role is allowed - no regular admin access
    return (
      userData.role === 'super_admin' &&
      userData.is_active === true
    );
  } catch (error) {
    console.error('Error checking super admin access:', error);
    return false;
  }
}

/**
 * Wrapper for API route handlers with authentication
 * 
 * @param request - Next.js request object
 * @param handler - Handler function that receives (request, user)
 * @param options - Optional configuration
 * @returns NextResponse
 */
export function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>,
  options: WithAuthOptions = {}
): Promise<NextResponse> {
  return (async () => {
    // Apply rate limiting if configured
    if (options.rateLimit) {
      const rateLimitConfig: RateLimitConfig = {
        maxRequests: options.rateLimit.maxRequests,
        windowMs: options.rateLimit.windowMs,
        keyPrefix: options.rateLimit.keyPrefix || 'auth:api',
      };
      
      return await withRateLimit(
        request,
        rateLimitConfig,
        async (req) => {
          // Continue with auth check after rate limit passes
          return await performAuthCheck(req, handler, options);
        }
      );
    }
    
    // No rate limiting, proceed with auth check
    return await performAuthCheck(request, handler, options);
  })();
}

/**
 * Perform authentication check and call handler
 */
async function performAuthCheck(
  request: NextRequest,
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>,
  options: WithAuthOptions
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check admin access if required
    if (options.requireAdmin) {
      const isAdmin = await checkAdminAccess(user);
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }
    }
    
    // Call the handler with authenticated user
    return await handler(request, user);
    
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return createSecureErrorResponse(
      error.message || 'Authentication failed',
      500
    );
  }
}

