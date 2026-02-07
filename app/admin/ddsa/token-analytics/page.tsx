'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { calculateCost } from '@/lib/utils/model-pricing';

interface TokenMetrics {
  period: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_in: number;
  cost_out: number;
  total_cost: number;
  request_count: number;
}

interface StageMetrics {
  stage_ref: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_in: number;
  cost_out: number;
  total_cost: number;
  request_count: number;
}

interface ConversationMetrics {
  thread_id: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_in: number;
  cost_out: number;
  total_cost: number;
  request_count: number;
  created_at: string;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'conversation';

export default function TokenAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [timeSeriesData, setTimeSeriesData] = useState<TokenMetrics[]>([]);
  const [stageData, setStageData] = useState<StageMetrics[]>([]);
  const [conversationData, setConversationData] = useState<ConversationMetrics[]>([]);
  const [summary, setSummary] = useState<{
    total_tokens_in: number;
    total_tokens_out: number;
    total_tokens: number;
    total_cost_in: number;
    total_cost_out: number;
    total_cost: number;
    total_requests: number;
  } | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [timePeriod, startDate, endDate, isAdmin]);

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

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load data based on time period
      if (timePeriod === 'conversation') {
        await loadConversationData();
      } else {
        await loadTimeSeriesData();
      }
      
      await loadStageData();
      await loadSummary();
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSeriesData = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .select('tokens_in, tokens_out, total_tokens, model, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      if (error) throw error;

      // Group by time period
      const grouped: Record<string, TokenMetrics> = {};

      (data || []).forEach((row: any) => {
        const date = new Date(row.created_at);
        let periodKey = '';

        switch (timePeriod) {
          case 'daily':
            periodKey = date.toISOString().split('T')[0];
            break;
          case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          case 'yearly':
            periodKey = String(date.getFullYear());
            break;
        }

        if (!grouped[periodKey]) {
          grouped[periodKey] = {
            period: periodKey,
            tokens_in: 0,
            tokens_out: 0,
            total_tokens: 0,
            cost_in: 0,
            cost_out: 0,
            total_cost: 0,
            request_count: 0
          };
        }

        const tokensIn = row.tokens_in || 0;
        const tokensOut = row.tokens_out || 0;
        const model = row.model || 'gpt-3.5-turbo';
        
        // Calculate costs using model-specific pricing
        const costs = calculateCost(tokensIn, tokensOut, model);

        grouped[periodKey].tokens_in += tokensIn;
        grouped[periodKey].tokens_out += tokensOut;
        grouped[periodKey].total_tokens += row.total_tokens || 0;
        grouped[periodKey].cost_in += costs.cost_in;
        grouped[periodKey].cost_out += costs.cost_out;
        grouped[periodKey].total_cost += costs.total_cost;
        grouped[periodKey].request_count += 1;
      });

      setTimeSeriesData(Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period)));
    } catch (error) {
      console.error('Error loading time series data:', error);
    }
  };

  const loadStageData = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .select('stage_ref, tokens_in, tokens_out, total_tokens, model')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .not('stage_ref', 'is', null);

      if (error) throw error;

      const grouped: Record<string, StageMetrics> = {};

      (data || []).forEach((row: any) => {
        const stage = row.stage_ref || 'unknown';
        
        if (!grouped[stage]) {
          grouped[stage] = {
            stage_ref: stage,
            tokens_in: 0,
            tokens_out: 0,
            total_tokens: 0,
            cost_in: 0,
            cost_out: 0,
            total_cost: 0,
            request_count: 0
          };
        }

        const tokensIn = row.tokens_in || 0;
        const tokensOut = row.tokens_out || 0;
        const model = row.model || 'gpt-3.5-turbo';
        
        // Calculate costs using model-specific pricing
        const costs = calculateCost(tokensIn, tokensOut, model);

        grouped[stage].tokens_in += tokensIn;
        grouped[stage].tokens_out += tokensOut;
        grouped[stage].total_tokens += row.total_tokens || 0;
        grouped[stage].cost_in += costs.cost_in;
        grouped[stage].cost_out += costs.cost_out;
        grouped[stage].total_cost += costs.total_cost;
        grouped[stage].request_count += 1;
      });

      setStageData(Object.values(grouped).sort((a, b) => b.total_tokens - a.total_tokens));
    } catch (error) {
      console.error('Error loading stage data:', error);
    }
  };

  const loadConversationData = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .select('thread_id, tokens_in, tokens_out, total_tokens, model, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const grouped: Record<string, ConversationMetrics> = {};

      (data || []).forEach((row: any) => {
        const threadId = row.thread_id;
        
        if (!grouped[threadId]) {
          grouped[threadId] = {
            thread_id: threadId,
            tokens_in: 0,
            tokens_out: 0,
            total_tokens: 0,
            cost_in: 0,
            cost_out: 0,
            total_cost: 0,
            request_count: 0,
            created_at: row.created_at
          };
        }

        const tokensIn = row.tokens_in || 0;
        const tokensOut = row.tokens_out || 0;
        const model = row.model || 'gpt-3.5-turbo';
        
        // Calculate costs using model-specific pricing
        const costs = calculateCost(tokensIn, tokensOut, model);

        grouped[threadId].tokens_in += tokensIn;
        grouped[threadId].tokens_out += tokensOut;
        grouped[threadId].total_tokens += row.total_tokens || 0;
        grouped[threadId].cost_in += costs.cost_in;
        grouped[threadId].cost_out += costs.cost_out;
        grouped[threadId].total_cost += costs.total_cost;
        grouped[threadId].request_count += 1;
      });

      setConversationData(Object.values(grouped).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading conversation data:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .select('tokens_in, tokens_out, total_tokens, model')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      if (error) throw error;

      const summary = {
        total_tokens_in: 0,
        total_tokens_out: 0,
        total_tokens: 0,
        total_cost_in: 0,
        total_cost_out: 0,
        total_cost: 0,
        total_requests: (data || []).length
      };

      (data || []).forEach((row: any) => {
        const tokensIn = row.tokens_in || 0;
        const tokensOut = row.tokens_out || 0;
        const model = row.model || 'gpt-3.5-turbo';
        
        // Calculate costs using model-specific pricing
        const costs = calculateCost(tokensIn, tokensOut, model);

        summary.total_tokens_in += tokensIn;
        summary.total_tokens_out += tokensOut;
        summary.total_tokens += row.total_tokens || 0;
        summary.total_cost_in += costs.cost_in;
        summary.total_cost_out += costs.cost_out;
        summary.total_cost += costs.total_cost;
      });

      setSummary(summary);
    } catch (error) {
      console.error('Error loading summary:', error);
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
              <h1 className="text-3xl font-bold text-gray-900">Token Consumption Analytics</h1>
              <p className="text-gray-600 mt-2">
                Track AI token usage across DDSA stages and conversations
              </p>
            </div>
            <Link
              href="/admin/ddsa"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to DDSA
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="conversation">Per Conversation</option>
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
                onClick={loadAnalytics}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-500 mb-1">Total Requests</div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_requests)}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-500 mb-1">Total Tokens</div>
              <div className="text-2xl font-bold text-purple-600">{formatNumber(summary.total_tokens)}</div>
              <div className="text-xs text-gray-500 mt-1">
                In: {formatNumber(summary.total_tokens_in)} | Out: {formatNumber(summary.total_tokens_out)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-500 mb-1">Cost (Incoming)</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_cost_in)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatNumber(summary.total_tokens_in)} tokens
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-500 mb-1">Cost (Outgoing)</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_cost_out)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatNumber(summary.total_tokens_out)} tokens
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-2 lg:col-span-1">
              <div className="text-sm text-gray-500 mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_cost)}</div>
              <div className="text-xs text-gray-500 mt-1">
                In: {formatCurrency(summary.total_cost_in)} + Out: {formatCurrency(summary.total_cost_out)}
              </div>
            </div>
          </div>
        )}

        {/* Time Series or Conversation Data */}
        {timePeriod === 'conversation' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Per Conversation Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thread ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (In)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (Out)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {conversationData.map((conv) => (
                    <tr key={conv.thread_id}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {conv.thread_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(conv.tokens_in)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(conv.tokens_out)}</td>
                      <td className="px-6 py-4 text-sm text-blue-600">{formatCurrency(conv.cost_in)}</td>
                      <td className="px-6 py-4 text-sm text-green-600">{formatCurrency(conv.cost_out)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-orange-600">{formatCurrency(conv.total_cost)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{conv.request_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Time Series Data ({timePeriod})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (In)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (Out)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSeriesData.map((item) => (
                    <tr key={item.period}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.period}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(item.tokens_in)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(item.tokens_out)}</td>
                      <td className="px-6 py-4 text-sm text-blue-600">{formatCurrency(item.cost_in)}</td>
                      <td className="px-6 py-4 text-sm text-green-600">{formatCurrency(item.cost_out)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-orange-600">{formatCurrency(item.total_cost)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.request_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stage Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (In)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (Out)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stageData.map((stage) => (
                  <tr key={stage.stage_ref}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{stage.stage_ref}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(stage.tokens_in)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(stage.tokens_out)}</td>
                    <td className="px-6 py-4 text-sm text-blue-600">{formatCurrency(stage.cost_in)}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{formatCurrency(stage.cost_out)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">{formatCurrency(stage.total_cost)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stage.request_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <Link
            href="/admin/ddsa/model-configuration"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Configure Stage Models →
          </Link>
        </div>
      </div>
    </div>
  );
}

