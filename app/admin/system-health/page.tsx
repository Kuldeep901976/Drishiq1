'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SystemHealth from '@/components/SystemHealth';
import Footer from '@/components/Footer';

export default function SystemHealthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Check for localStorage admin session first (super admin)
      const adminSession = typeof window !== 'undefined' ? localStorage.getItem('admin_session') : null;
      if (adminSession && adminSession.trim()) {
        try {
          const adminUser = JSON.parse(adminSession);
          setUser(adminUser);
          setIsAdmin(true);
          setAuthLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse admin_session from localStorage:', e);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_session');
          }
        }
      }

      // Check for super admin token
      const superAdminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const superAdminExpires = typeof window !== 'undefined' ? localStorage.getItem('admin_session_expires') : null;
      
      if (superAdminToken && superAdminExpires) {
        const expiresAt = new Date(superAdminExpires);
        if (expiresAt > new Date()) {
          try {
            const verifyRes = await fetch('/api/admin-auth/auth/verify', {
              headers: { 'Authorization': `Bearer ${superAdminToken}` }
            });
            if (verifyRes.ok) {
              const adminData = await verifyRes.json();
              setUser(adminData.user || {});
              setIsAdmin(true);
              setAuthLoading(false);
              return;
            }
          } catch (error) {
            console.warn('Super admin session verification failed:', error);
          }
        }
      }

      // Fallback to Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      setUser(session.user);

      // Check admin access via API (handles both admin and super_admin)
      const response = await fetch('/api/admin/check-access');
      if (response.ok) {
        const { isAdmin: adminStatus } = await response.json();
        if (adminStatus) {
          setIsAdmin(true);
        } else {
          router.push('/admin/login');
        }
      } else {
        // Fallback to direct DB check
        const { data: userData } = await supabase
          .from('users')
          .select('user_type, role, is_active')
          .eq('id', session.user.id)
          .single();

        if ((userData?.user_type === 'admin' || userData?.role === 'super_admin') && userData?.is_active) {
          setIsAdmin(true);
        } else {
          router.push('/admin/login');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/admin/login');
    } finally {
      setAuthLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system health...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
              <p className="text-gray-600 mt-2">
                Monitor system performance, status, and health metrics
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to Admin
            </button>
          </div>
        </div>

        {/* System Health Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <SystemHealth userRole={user?.role || 'admin'} />
        </div>
      </div>

      <Footer />
    </div>
  );
}


