'use client';

import { useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/magic-link',
  '/admin/super-admin-signin', // Super admin WebAuthn sign-in (isolated auth system)
]);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const checkAccess = async () => {
      // Public admin auth pages bypass guard
      // Normalize pathname (remove trailing slash, handle query params)
      const normalizedPath = pathname?.split('?')[0]?.replace(/\/$/, '') || pathname;
      const isPublicPath = PUBLIC_ADMIN_PATHS.has(normalizedPath) || PUBLIC_ADMIN_PATHS.has(pathname);
      
      console.log('🔍 [Admin Layout] Checking path:', { pathname, normalizedPath, isPublicPath });
      
      if (isPublicPath) {
        console.log('✅ [Admin Layout] Public path detected, allowing access');
        if (!isCancelled) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      console.log('🔐 Admin layout checking access for:', pathname);
      
      // Check for super admin session first (isolated WebAuthn auth system)
      const superAdminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const superAdminExpires = typeof window !== 'undefined' ? localStorage.getItem('admin_session_expires') : null;

      console.log('Super admin token exists:', !!superAdminToken);
      
      if (superAdminToken && superAdminExpires) {
        // Check if session is still valid (not expired)
        const expiresAt = new Date(superAdminExpires);
        if (expiresAt > new Date()) {
          // Verify session with admin-auth service
          try {
            const verifyRes = await fetch('/api/admin-auth/auth/verify', {
              headers: { 'Authorization': `Bearer ${superAdminToken}` }
            });

            if (verifyRes.ok) {
              // Super admin session is valid
              console.log('✅ Super admin session verified');
              if (!isCancelled) {
                setAllowed(true);
                setChecking(false);
              }
              return;
            } else {
              // Verification failed - token is invalid
              console.warn('Super admin session verification failed:', verifyRes.status);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_session_token');
                localStorage.removeItem('admin_session_expires');
              }
            }
          } catch (error) {
            // If verification fails, clear invalid session
            console.warn('Super admin session verification error:', error);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('admin_session_token');
              localStorage.removeItem('admin_session_expires');
            }
          }
        } else {
          // Session expired, clear it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_session_token');
            localStorage.removeItem('admin_session_expires');
          }
        }
      } else {
        // No token or expires - definitely not authenticated
        // Clear any stale data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_session_token');
          localStorage.removeItem('admin_session_expires');
        }
      }

      // ONLY SUPER ADMIN ACCESS ALLOWED
      // No fallback to regular admin or Supabase sessions
      // Only super admin with valid admin_session_token can access admin module

      // No valid super admin session found - redirect to signup page with enterprise tab
      console.log('❌ No valid session found, redirecting to signup');
      if (!isCancelled) {
        setAllowed(false);
        setChecking(false);
        // Redirect to signup with enterprise tab
        const signupUrl = new URL('/signup', window.location.origin);
        signupUrl.searchParams.set('tab', 'enterprise');
        signupUrl.hash = 'enterprise';
        // Preserve the original path for redirect after signup
        signupUrl.searchParams.set('redirect', pathname);
        router.replace(signupUrl.toString());
      }
    };
    checkAccess();
    return () => {
      isCancelled = true;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return <>{allowed && children}</>;
}




