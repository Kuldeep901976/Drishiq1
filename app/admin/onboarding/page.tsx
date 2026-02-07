'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface OverviewStats {
  totalSessions: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  uniqueIPs: number;
  completedSessions: number;
  completionRate: number;
  avgStagesCompleted: number;
  avgTokensPerSession: number;
  avgCostPerSession: number;
}

interface Session {
  threadId: string;
  userId: string;
  ipAddress: string | null;
  firstIPAddress: string | null;
  userAgent: string | null;
  currentStage: string | null;
  completedStages: string[];
  stagesCompleted: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  requestCount: number;
  language: string;
  country: string | null;
  city: string | null;
  createdAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
  transferredToMainChat: boolean;
  transferredAt: string | null;
}

interface StageStats {
  stageId: string;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  models: string[];
}

interface ModelStats {
  model: string;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

interface IPStats {
  ipAddress: string;
  sessionCount: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
}

interface TimeSeriesData {
  date: string;
  sessionCount: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
}

type ViewMode = 'overview' | 'sessions' | 'stages' | 'models' | 'ips' | 'time-series';

export default function OnboardingAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stageStats, setStageStats] = useState<StageStats[]>([]);
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [ipStats, setIpStats] = useState<IPStats[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [viewMode, startDate, endDate, isAdmin]);

  const checkAuthentication = async () => {
    try {
      const adminSession = typeof window !== 'undefined' ? localStorage.getItem('admin_session') : null;
      if (adminSession && adminSession.trim()) {
        try {
          const adminUser = JSON.parse(adminSession);
          setUser(adminUser);
          setIsAdmin(true);
          setAuthLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse admin_session:', e);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_session');
          }
        }
      }

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

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      setUser(session.user);

      const response = await fetch('/api/admin/check-access');
      if (response.ok) {
        const { isAdmin: adminStatus } = await response.json();
        if (adminStatus) {
          setIsAdmin(true);
        } else {
          router.push('/admin/login');
        }
      } else {
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

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: viewMode === 'overview' ? 'overview' :
                viewMode === 'sessions' ? 'sessions' :
                viewMode === 'stages' ? 'by-stage' :
                viewMode === 'models' ? 'by-model' :
                viewMode === 'ips' ? 'by-ip' :
                'time-series',
        startDate,
        endDate
      });

      const response = await fetch(`/api/admin/onboarding-analytics?${params}`);
      if (!response.ok) throw new Error('Failed to load data');
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      switch (viewMode) {
        case 'overview':
          setOverview(result.data);
          break;
        case 'sessions':
          setSessions(result.data);
          break;
        case 'stages':
          setStageStats(result.data);
          break;
        case 'models':
          setModelStats(result.data);
          break;
        case 'ips':
          setIpStats(result.data);
          break;
        case 'time-series':
          setTimeSeries(result.data);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(num);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Onboarding Chat Analytics</h1>
              <p className="text-gray-600 mt-2">
                Track IP addresses, stages completed, token usage, and model consumption
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
              >
                <option value="overview">Overview</option>
                <option value="sessions">Sessions</option>
                <option value="stages">By Stage</option>
                <option value="models">By Model</option>
                <option value="ips">By IP Address</option>
                <option value="time-series">Time Series</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        {viewMode === 'overview' && overview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-500 mb-1">Total Sessions</div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalSessions)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {overview.completedSessions} completed ({overview.completionRate.toFixed(1)}%)
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-500 mb-1">Unique IP Addresses</div>
                <div className="text-2xl font-bold text-blue-600">{formatNumber(overview.uniqueIPs)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {overview.totalRequests} total requests
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-500 mb-1">Total Tokens</div>
                <div className="text-2xl font-bold text-purple-600">{formatNumber(overview.totalTokens)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  In: {formatNumber(overview.totalTokensIn)} | Out: {formatNumber(overview.totalTokensOut)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-500 mb-1">Total Cost</div>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(overview.totalCost)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Avg: {formatCurrency(overview.avgCostPerSession)}/session
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-500 mb-1">Avg Stages Completed</div>
                <div className="text-2xl font-bold text-green-600">{overview.avgStagesCompleted.toFixed(1)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  per session
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-500 mb-1">Avg Tokens/Session</div>
                <div className="text-2xl font-bold text-indigo-600">{formatNumber(overview.avgTokensPerSession)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(overview.avgCostPerSession)} cost
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sessions Table */}
        {viewMode === 'sessions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Onboarding Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thread ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Models</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.threadId}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {session.threadId.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {session.ipAddress || session.firstIPAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {session.stagesCompleted} / {session.completedStages.length > 0 ? session.completedStages.join(', ') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{session.currentStage || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatNumber(session.totalTokens)} ({formatNumber(session.totalTokensIn)}/{formatNumber(session.totalTokensOut)})
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-600">{formatCurrency(session.totalCost)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {session.modelsUsed.length > 0 ? session.modelsUsed.join(', ') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{session.requestCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{session.language}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {session.transferredToMainChat ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Completed</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stage Stats */}
        {viewMode === 'stages' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Token Usage by Stage</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Models</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stageStats.map((stage) => (
                    <tr key={stage.stageId}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{stage.stageId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(stage.totalTokensIn)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(stage.totalTokensOut)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(stage.totalTokens)}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">{formatCurrency(stage.totalCost)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stage.requestCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stage.models.join(', ') || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Model Stats */}
        {viewMode === 'models' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Token Usage by Model</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modelStats.map((model) => (
                    <tr key={model.model}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{model.model}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(model.totalTokensIn)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(model.totalTokensOut)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(model.totalTokens)}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">{formatCurrency(model.totalCost)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{model.requestCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IP Stats */}
        {viewMode === 'ips' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Analytics by IP Address</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ipStats.map((ip) => (
                    <tr key={ip.ipAddress}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{ip.ipAddress}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{ip.sessionCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(ip.totalTokens)}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">{formatCurrency(ip.totalCost)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{ip.totalRequests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Series */}
        {viewMode === 'time-series' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Time Series Data</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSeries.map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{day.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{day.sessionCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(day.totalTokens)}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">{formatCurrency(day.totalCost)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{day.totalRequests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


