'use client';

import AdManagerDashboard from '../../../components/AdManagerDashboard';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';

// Force dynamic rendering - admin pages should not be statically generated
export const dynamic = 'force-dynamic';

export default function AdManagerPage() {
  const { isAuthenticated, isLoading: authLoading } = useSuperAdminAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useSuperAdminAuth will redirect
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AdManagerDashboard />
    </main>
  );
} 
