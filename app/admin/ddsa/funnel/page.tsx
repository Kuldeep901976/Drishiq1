// app/admin/ddsa/funnel/page.tsx
/**
 * Conversation Funnel Visualization
 * Shows user drop-off, fail points, retries, and token costs per stage
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FunnelData {
  tenant_id: string;
  total_threads: number;
  reached_greeting: number;
  reached_cfq: number;
  reached_intent: number;
  reached_core_problem: number;
  reached_plan: number;
  reached_commit: number;
  greeting_rate: number;
  cfq_rate: number;
  intent_rate: number;
  core_problem_rate: number;
  plan_rate: number;
  commit_rate: number;
}

interface StageMetrics {
  stage_id: string;
  execution_count: number;
  error_count: number;
  avg_latency_ms: number;
  total_tokens: number;
  total_cost: number;
  avg_retries: number;
}

export default function FunnelPage() {
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadFunnelData();
    loadStageMetrics();
  }, [selectedTenant, dateRange]);

  const loadFunnelData = async () => {
    try {
      setLoading(true);
      // Query conversation_funnel view
      let query = supabase
        .from('conversation_funnel')
        .select('*');

      if (selectedTenant !== 'all') {
        query = query.eq('tenant_id', selectedTenant);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFunnelData(data || []);
    } catch (error) {
      console.error('Error loading funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStageMetrics = async () => {
    try {
      // Query stage metrics
      let query = supabase
        .from('tenant_stage_usage')
        .select('*');

      if (selectedTenant !== 'all') {
        query = query.eq('tenant_id', selectedTenant);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Also get retry data
      const { data: retryData } = await supabase
        .from('stage_retry_analysis')
        .select('stage_id, avg_retries')
        .eq('tenant_id', selectedTenant !== 'all' ? selectedTenant : '');

      const retryMap = new Map(
        (retryData || []).map(r => [r.stage_id, r.avg_retries])
      );

      const metrics = (data || []).map(m => ({
        ...m,
        avg_retries: retryMap.get(m.stage_id) || 0
      }));

      setStageMetrics(metrics);
    } catch (error) {
      console.error('Error loading stage metrics:', error);
    }
  };

  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '$0.00';
    return `$${value.toFixed(4)}`;
  };

  const stages = [
    { key: 'greeting', label: 'Greeting', color: 'bg-blue-500' },
    { key: 'cfq', label: 'CFQ', color: 'bg-green-500' },
    { key: 'intent', label: 'Intent', color: 'bg-yellow-500' },
    { key: 'core_problem', label: 'Core Problem', color: 'bg-orange-500' },
    { key: 'plan', label: 'Plan', color: 'bg-purple-500' },
    { key: 'commit', label: 'Commit', color: 'bg-red-500' }
  ];

  const funnel = funnelData[0] || {} as FunnelData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Conversation Funnel Analysis</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">All Tenants</option>
          {/* Add tenant options */}
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-2 border rounded"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          {/* Funnel Visualization */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Stage Progression Funnel</h2>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const reachedKey = `reached_${stage.key}` as keyof FunnelData;
                const rateKey = `${stage.key}_rate` as keyof FunnelData;
                const reached = funnel[reachedKey] as number || 0;
                const rate = funnel[rateKey] as number || 0;
                const total = funnel.total_threads || 1;
                const width = (reached / total) * 100;

                return (
                  <div key={stage.key} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-sm text-gray-600">
                        {reached.toLocaleString()} / {total.toLocaleString()} ({formatPercentage(rate)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className={`${stage.color} h-full transition-all duration-300 flex items-center justify-end pr-2`}
                        style={{ width: `${width}%` }}
                      >
                        {width > 10 && (
                          <span className="text-white text-xs font-medium">
                            {formatPercentage(rate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Metrics Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Stage Performance Metrics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fail Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Retries</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stageMetrics.map((metric) => {
                    const failRate = (metric.error_count / metric.execution_count) * 100;
                    return (
                      <tr key={metric.stage_id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{metric.stage_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{metric.execution_count.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-600">{metric.error_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={failRate > 5 ? 'text-red-600' : failRate > 2 ? 'text-yellow-600' : 'text-green-600'}>
                            {failRate.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{metric.avg_latency_ms?.toFixed(0) || 'N/A'}ms</td>
                        <td className="px-6 py-4 whitespace-nowrap">{metric.avg_retries?.toFixed(2) || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{metric.total_tokens?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(metric.total_cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


