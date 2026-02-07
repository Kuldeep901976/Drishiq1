import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

/**
 * Create a Supabase client for server-side usage
 * Can be used in API routes, server components, and server actions
 * 
 * @param request - Optional NextRequest to extract cookies from
 * @returns Supabase client instance
 */
export function createClient(request?: NextRequest) {
  // If request is provided, try to extract auth tokens from cookies
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    
    // Try to get access token from cookies
    const accessToken = cookies['sb-access-token'] || 
                       cookies['sb-auth-token'] ||
                       extractTokenFromSupabaseCookie(cookies);
    
    if (accessToken) {
      // Create client with user's access token
      return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });
    }
  }
  
  // For admin routes or when no auth is needed, use service role if available
  // Otherwise fall back to anon key
  if (supabaseServiceRoleKey) {
    return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
  }
  
  // Fallback to anon key
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Parse cookie string into object
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  
  return cookies;
}

/**
 * Extract access token from Supabase auth cookie
 * Supabase stores auth tokens in cookies like: sb-<project-ref>-auth-token
 */
function extractTokenFromSupabaseCookie(cookies: Record<string, string>): string | null {
  // Look for Supabase auth cookie pattern
  for (const [key, value] of Object.entries(cookies)) {
    if (key.includes('auth-token') || key.includes('access-token')) {
      try {
        // Supabase cookies are JSON strings
        const parsed = JSON.parse(value);
        return parsed?.access_token || parsed?.token || null;
      } catch {
        // If not JSON, return as-is
        return value;
      }
    }
  }
  return null;
}

/**
 * Create a service role client (bypasses RLS)
 * Use this for admin operations
 */
export function createServiceClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
  }
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
}

