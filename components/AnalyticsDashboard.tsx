'use client';

import React, { useState, useEffect } from 'react';
import { trackEvent } from './GoogleAnalytics';

interface AnalyticsDashboardProps {
  userRole: string;
}

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  topReferrers: Array<{ source: string; sessions: number }>;
  deviceBreakdown: Array<{ device: string; percentage: number }>;
  realTimeUsers: number;
  conversions: Array<{ goal: string; count: number; rate: number }>;
}

export default function AnalyticsDashboard({ userRole }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Load data once on mount and when timeRange changes - no polling
  // User can manually refresh if needed
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        
        // Track analytics dashboard view
        trackEvent('analytics_dashboard_viewed', {
          time_range: timeRange,
          user_role: userRole
        });
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed auto-refresh polling - data loads on mount and when timeRange changes
  // If real-time updates are needed, use WebSockets or Server-Sent Events instead

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    trackEvent('analytics_time_range_changed', {
      from_range: timeRange,
      to_range: range,
      user_role: userRole
    });
  };

  const exportData = (format: 'csv' | 'pdf') => {
    trackEvent('analytics_data_exported', {
      format,
      time_range: timeRange,
      user_role: userRole
    });
    
    // Implementation for data export
    console.log(`Exporting ${format} for ${timeRange}`);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          {/* Export Buttons */}
          <button
            onClick={() => exportData('csv')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📊 Export CSV
          </button>
          <button
            onClick={() => exportData('pdf')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Page Views"
          value={analyticsData.pageViews.toLocaleString()}
          change="+12.5%"
          trend="up"
          icon="👁️"
        />
        <MetricCard
          title="Unique Visitors"
          value={analyticsData.uniqueVisitors.toLocaleString()}
          change="+8.2%"
          trend="up"
          icon="👤"
        />
        <MetricCard
          title="Bounce Rate"
          value={`${analyticsData.bounceRate}%`}
          change="-2.1%"
          trend="down"
          icon="↩️"
        />
        <MetricCard
          title="Avg Session"
          value={`${Math.round(analyticsData.avgSessionDuration / 60)}m ${analyticsData.avgSessionDuration % 60}s`}
          change="+5.3%"
          trend="up"
          icon="⏱️"
        />
      </div>

      {/* Real-time Users */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Real-time Users</h3>
            <p className="text-emerald-100 text-sm">Currently active on your site</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{analyticsData.realTimeUsers}</div>
            <div className="text-emerald-100 text-sm">active now</div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Pages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
          <div className="space-y-3">
            {analyticsData.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-900 truncate max-w-48">{page.page}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{page.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Traffic Sources</h3>
          <div className="space-y-3">
            {analyticsData.topReferrers.map((referrer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-900 truncate max-w-48">{referrer.source}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{referrer.sessions.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analyticsData.deviceBreakdown.map((device, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-2">{device.device}</div>
              <div className="text-3xl font-bold text-emerald-600">{device.percentage}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${device.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Goals */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analyticsData.conversions.map((goal, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 mb-2">{goal.goal}</div>
              <div className="text-2xl font-bold text-emerald-600 mb-1">{goal.count}</div>
              <div className="text-sm text-gray-600">{goal.rate}% conversion rate</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={() => window.open('https://analytics.google.com', '_blank')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          🔗 Open Google Analytics
        </button>
        <button
          onClick={() => window.open('https://search.google.com/search-console', '_blank')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          🔍 Open Search Console
        </button>
        <button
          onClick={loadAnalyticsData}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, change, trend, icon }: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${
          trend === 'up' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {change}
        </span>
        <span className="text-gray-500 text-sm ml-1">vs last period</span>
      </div>
    </div>
  );
}















