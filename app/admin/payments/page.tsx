'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function AdminPayments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const checkAdminAccess = useCallback(async () => {
    try {
      if (!supabase) {
        setError('Database service unavailable');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for super admin session first
      const superAdminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const superAdminExpires = typeof window !== 'undefined' ? localStorage.getItem('admin_session_expires') : null;
      
      if (!superAdminToken || !superAdminExpires || new Date(superAdminExpires) <= new Date()) {
        // No valid super admin session, redirect to super admin signin
        const returnTo = `?returnTo=${encodeURIComponent(window.location.pathname)}`;
        router.push(`/admin/super-admin-signin${returnTo}`);
        return;
      }
      
      if (!session) {
        // Also check for regular admin session as fallback
        const returnTo = `?returnTo=${encodeURIComponent(window.location.pathname)}`;
        router.push(`/admin/super-admin-signin${returnTo}`);
        return;
      }

      // TODO: Update to use consolidated users table
      // Check if user is admin
      // const { data: adminUser } = await supabase
      //   .from('admin_users')
      //   .select('*')
      //   .eq('user_id', session.user.id)
      //   .single();

      // if (!adminUser) {
      //   setError('You do not have admin access');
      //   setLoading(false);
      //   return;
      // }

      setLoading(false);
    } catch (error) {
      setError('Failed to load admin dashboard');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              🏠 Admin Dashboard
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage subscriptions, pricing, and revenue analytics
              </p>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              🏠 Admin Dashboard
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'subscriptions', name: 'Subscriptions' },
                { id: 'transactions', name: 'Transactions' },
                { id: 'pricing', name: 'Pricing' },
                { id: 'analytics', name: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Payment Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="text-2xl font-bold text-blue-600">$12,450</div>
                    <div className="text-sm text-gray-600">Monthly Revenue</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-2xl font-bold text-green-600">342</div>
                    <div className="text-sm text-gray-600">Active Subscriptions</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="text-2xl font-bold text-yellow-600">89</div>
                    <div className="text-sm text-gray-600">Credit Purchases</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="text-2xl font-bold text-purple-600">$45.20</div>
                    <div className="text-sm text-gray-600">Avg Revenue Per User</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Subscription Management</h3>
                <p className="text-gray-600">View and manage all user subscriptions</p>
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <p className="text-gray-500">Subscription management interface would be implemented here</p>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <p className="text-gray-600">View all payment transactions and refunds</p>
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <p className="text-gray-500">Transaction history interface would be implemented here</p>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Pricing Configuration</h3>
                <p className="text-gray-600">Manage pricing plans and regional pricing</p>
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <p className="text-gray-500">Pricing management interface would be implemented here</p>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
                <p className="text-gray-600">Revenue trends, cohort analysis, and payment insights</p>
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <p className="text-gray-500">Revenue analytics interface would be implemented here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 
