'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface AnalyticsData {
  overview: any[];
  topPages: any[];
  funnelData: any[];
  utmPerformance: any[];
  userJourney: any[];
  attribution: any[];
  realTime: any[];
}

export default function AdminAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData>({
    overview: [],
    topPages: [],
    funnelData: [],
    utmPerformance: [],
    userJourney: [],
    attribution: [],
    realTime: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
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

      // Check if user is admin by trying to access analytics data
      const response = await fetch('/api/analytics/dashboard?type=overview&limit=1');
      
      if (response.status === 403) {
        setError('You do not have admin access');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load analytics data');
      }

      setLoading(false);
    } catch (error) {
      logger.error('Failed to check admin access');
      setError('Failed to load analytics dashboard');
      setLoading(false);
    }
  }, [router]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);

      const endpoints = [
        { key: 'overview', url: `/api/analytics/dashboard?type=overview&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` },
        { key: 'topPages', url: '/api/analytics/dashboard?type=top-pages' },
        { key: 'funnelData', url: '/api/analytics/dashboard?type=conversion-funnel&funnel=Invitation Request Funnel' },
        { key: 'utmPerformance', url: `/api/analytics/dashboard?type=utm-performance&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` },
        { key: 'userJourney', url: `/api/analytics/dashboard?type=user-journey&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` },
        { key: 'attribution', url: `/api/analytics/dashboard?type=attribution&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` },
        { key: 'realTime', url: '/api/analytics/dashboard?type=real-time' }
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => 
          fetch(endpoint.url).then(res => res.json().then(data => ({ key: endpoint.key, data })))
        )
      );

      const newData = { ...data };
      responses.forEach(({ key, data: responseData }) => {
        newData[key as keyof AnalyticsData] = responseData.data || [];
      });

      setData(newData);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to load analytics data');
      setError('Failed to load analytics data');
      setLoading(false);
    }
  }, [dateRange, data]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    if (loading === false) {
      loadAnalyticsData();
    }
  }, [dateRange, loading, loadAnalyticsData]);

  const StatCard = ({ title, value, subtitle, trend, color = 'blue' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {trend !== undefined && (
          <div className={`text-right ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-sm font-medium">
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const DataTable = ({ title, columns, rows }: {
    title: string;
    columns: string[];
    rows: any[];
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.values(row).map((cell: any, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof cell === 'number' ? cell.toLocaleString() : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            <button
              onClick={() => router.push('/admin')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const overviewStats = data.overview.reduce((acc, item) => {
    acc.totalSessions += item.total_sessions || 0;
    acc.uniqueUsers += item.unique_users || 0;
    acc.totalPageViews += item.total_page_views || 0;
    acc.conversions += item.conversions || 0;
    return acc;
  }, { totalSessions: 0, uniqueUsers: 0, totalPageViews: 0, conversions: 0 });

  const conversionRate = overviewStats.totalSessions > 0 
    ? ((overviewStats.conversions / overviewStats.totalSessions) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Comprehensive analytics and insights for DrishiQ platform
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Admin
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={loadAnalyticsData}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Sessions" 
            value={overviewStats.totalSessions.toLocaleString()}
            subtitle="Unique visits"
          />
          <StatCard 
            title="Unique Users" 
            value={overviewStats.uniqueUsers.toLocaleString()}
            subtitle="Individual visitors"
          />
          <StatCard 
            title="Page Views" 
            value={overviewStats.totalPageViews.toLocaleString()}
            subtitle="Total page loads"
          />
          <StatCard 
            title="Conversion Rate" 
            value={`${conversionRate}%`}
            subtitle={`${overviewStats.conversions} conversions`}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'pages', name: 'Top Pages' },
                { id: 'utm', name: 'UTM Performance' },
                { id: 'funnel', name: 'Conversion Funnel' },
                { id: 'journey', name: 'User Journey' },
                { id: 'attribution', name: 'Attribution' },
                { id: 'realtime', name: 'Real-time' }
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
                <DataTable
                  title="Daily Overview"
                  columns={['Date', 'Sessions', 'Users', 'Page Views', 'Conversions', 'Rate %']}
                  rows={data.overview.slice(0, 10)}
                />
              </div>
            )}

            {activeTab === 'pages' && (
              <DataTable
                title="Top Pages"
                columns={['Page URL', 'Views', 'Unique Sessions', 'Avg Load Time', 'Errors']}
                rows={data.topPages.slice(0, 20)}
              />
            )}

            {activeTab === 'utm' && (
              <DataTable
                title="UTM Campaign Performance"
                columns={['Source', 'Medium', 'Campaign', 'Sessions', 'Duration', 'Page Views', 'Conversions']}
                rows={data.utmPerformance.slice(0, 20)}
              />
            )}

            {activeTab === 'funnel' && (
              <DataTable
                title="Conversion Funnel Analysis"
                columns={['Step', 'Sessions', 'Conversion Rate %']}
                rows={data.funnelData}
              />
            )}

            {activeTab === 'journey' && (
              <DataTable
                title="User Journey Analysis"
                columns={['Stage', 'Touchpoint', 'Count', 'Avg Time']}
                rows={data.userJourney.slice(0, 20)}
              />
            )}

            {activeTab === 'attribution' && (
              <DataTable
                title="Attribution Analysis"
                columns={['Conversion Type', 'First Touch', 'Last Touch', 'Conversions', 'Total Value']}
                rows={data.attribution.slice(0, 20)}
              />
            )}

            {activeTab === 'realtime' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Real-time Activity ({data.realTime.length} active sessions)
                </h3>
                <DataTable
                  title=""
                  columns={['Session', 'Device', 'Browser', 'Country', 'Source', 'Page Views', 'Last Activity']}
                  rows={data.realTime.slice(0, 50).map((session: any) => ({
                    session_id: session.session_id?.substring(0, 8) + '...',
                    device_type: session.device_type,
                    browser: session.browser,
                    country: session.country || 'Unknown',
                    utm_source: session.utm_source || 'Direct',
                    page_views: session.page_views,
                    last_activity: new Date(session.last_activity).toLocaleTimeString()
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 
