'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SuperAdminAuth {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  checkAuth: () => Promise<void>;
}

export function useSuperAdminAuth(): SuperAdminAuth {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const checkAuth = async () => {
    setIsLoading(true);
    
    const superAdminToken = typeof window !== 'undefined' 
      ? localStorage.getItem('admin_session_token') 
      : null;
    const superAdminExpires = typeof window !== 'undefined' 
      ? localStorage.getItem('admin_session_expires') 
      : null;

      if (!superAdminToken || !superAdminExpires) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        // Include returnTo parameter if on a specific admin page
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin';
        const returnTo = currentPath.startsWith('/admin') && currentPath !== '/admin/super-admin-signin'
          ? `?returnTo=${encodeURIComponent(currentPath)}`
          : '';
        router.replace(`/admin/super-admin-signin${returnTo}`);
        return;
      }

    // Check if session is expired
    const expiresAt = new Date(superAdminExpires);
    if (expiresAt <= new Date()) {
      // Session expired
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_session_expires');
      }
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      // Include returnTo parameter
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin';
      const returnTo = currentPath.startsWith('/admin') && currentPath !== '/admin/super-admin-signin'
        ? `?returnTo=${encodeURIComponent(currentPath)}`
        : '';
      router.replace(`/admin/super-admin-signin${returnTo}`);
      return;
    }

    // Verify session with admin-auth service
    try {
      const verifyRes = await fetch('/api/admin-auth/auth/verify', {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
      });

      if (verifyRes.ok) {
        const adminData = await verifyRes.json();
        setIsAuthenticated(true);
        setUser(adminData.user || {});
        setIsLoading(false);
      } else {
        // Verification failed
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_session_token');
          localStorage.removeItem('admin_session_expires');
        }
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        // Include returnTo parameter
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin';
        const returnTo = currentPath.startsWith('/admin') && currentPath !== '/admin/super-admin-signin'
          ? `?returnTo=${encodeURIComponent(currentPath)}`
          : '';
        router.replace(`/admin/super-admin-signin${returnTo}`);
      }
    } catch (error) {
      console.error('Super admin session verification failed:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_session_expires');
      }
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      // Include returnTo parameter
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin';
      const returnTo = currentPath.startsWith('/admin') && currentPath !== '/admin/super-admin-signin'
        ? `?returnTo=${encodeURIComponent(currentPath)}`
        : '';
      router.replace(`/admin/super-admin-signin${returnTo}`);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    checkAuth
  };
}

