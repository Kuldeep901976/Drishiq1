// app/api/middleware/admin-auth.ts
/**
 * Admin Authentication Middleware
 * Restricts endpoints to admin users only
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if request is from admin user
 * TODO: Implement actual admin authentication
 */
export async function requireAdmin(request: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  // Check for admin token in header
  const adminToken = request.headers.get('x-admin-token');
  if (adminToken && adminToken === process.env.ADMIN_SECRET_TOKEN) {
    return { authorized: true };
  }

  // Check for admin session (if using session-based auth)
  // const session = await getSession(request);
  // if (session?.user?.role === 'admin') {
  //   return { authorized: true };
  // }

  // For now, allow if ADMIN_SECRET_TOKEN is not set (development mode)
  if (!process.env.ADMIN_SECRET_TOKEN) {
    console.warn('⚠️ ADMIN_SECRET_TOKEN not set, allowing admin access (development mode)');
    return { authorized: true };
  }

  return {
    authorized: false,
    error: 'Admin authentication required'
  };
}

/**
 * Middleware wrapper for admin-only endpoints
 */
export function withAdminAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await requireAdmin(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request);
  };
}

