// app/admin/ddsa/flow/page.tsx
// DDSA Flow Configuration - Stage Management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress } from '@/components/ui';
import Link from 'next/link';

interface StageProgress {
  status: 'pending' | 'claimed' | 'approved' | 'done';
  claimed_by?: string | null;
  claimed_at?: string | null;
  approved_at?: string | null;
  completed_at?: string | null;
}

interface StageProgressCounts {
  pending: number;
  running: number;
  completed: number;
  done: number;
  failed: number;
  skipped: number;
  timeout: number;
  paused: number;
  total: number;
}

interface Stage {
  stage_id: string;
  stage_name: string;
  position: number;
  is_active: boolean;
  is_required?: boolean;
  stage_type?: string;
  description?: string;
  icon?: string;
  library_path?: string;
  progress?: StageProgress;
  progressCounts?: StageProgressCounts;
  lastAuditTimestamp?: string | null;
}

interface FlowData {
  stages: Stage[];
  total: number;
  active: number;
}

interface Summary {
  totalStages: number;
  activeCount: number;
  inactiveCount: number;
  totalProgressCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  lastAuditEvent?: string;
}

export default function DDSAFlowBuilder() {
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalStages: 0,
    activeCount: 0,
    inactiveCount: 0,
    totalProgressCount: 0,
    runningCount: 0,
    completedCount: 0,
    failedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const loadFlowData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ddsa/flow');
      if (!res.ok) {
        throw new Error(`Failed to fetch flow data: ${res.statusText}`);
      }
      const data: FlowData = await res.json();
      setFlowData(data);
    } catch (error: any) {
      console.error('Failed to load flow data:', error);
      setError(error.message || 'Failed to load flow data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlowData();
    
    // Set up auto-refresh polling (every 5 seconds)
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadFlowData();
      }, 5000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, loadFlowData]);

  const loadSummary = async () => {
    try {
      // Calculate summary from flow data including progress counts
      if (flowData) {
        let totalProgressCount = 0;
        let runningCount = 0;
        let completedCount = 0;
        let failedCount = 0;

        flowData.stages.forEach(stage => {
          if (stage.progressCounts) {
            totalProgressCount += stage.progressCounts.total || 0;
            runningCount += stage.progressCounts.running || 0;
            completedCount += (stage.progressCounts.completed || 0) + (stage.progressCounts.done || 0);
            failedCount += stage.progressCounts.failed || 0;
          }
        });

        setSummary({
          totalStages: flowData.total || 0,
          activeCount: flowData.active || 0,
          inactiveCount: (flowData.total || 0) - (flowData.active || 0),
          totalProgressCount,
          runningCount,
          completedCount,
          failedCount,
          lastAuditEvent: 'N/A' // Would need audit API
        });
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  useEffect(() => {
    if (flowData) {
      loadSummary();
    }
  }, [flowData]);

  const getProgressPercentage = (stage: Stage | null): number => {
    if (!stage || !stage.progress) return 0;
    const status = stage.progress.status;
    switch (status) {
      case 'done': return 100;
      case 'approved': return 75;
      case 'claimed': return 50;
      case 'pending': return 0;
      default: return 0;
    }
  };

  const getStatusColor = (stage: Stage | null): string => {
    if (!stage) return 'border-gray-200';
    if (!stage.stage_id) return 'bg-gray-100 border-gray-300'; // Missing
    
    if (stage.is_active) {
      return 'bg-green-50 border-green-500';
    } else {
      return 'bg-yellow-50 border-yellow-500';
    }
  };

  const getStatusIcon = (stage: Stage | null): string => {
    if (!stage) return '📋';
    if (!stage.stage_id) return '❌'; // Missing
    if (stage.is_active) return '✅'; // Active
    return '⚠️'; // Inactive
  };

  const getStatusText = (stage: Stage | null): string => {
    if (!stage) return 'Not Configured';
    if (!stage.stage_id) return 'Missing';
    if (stage.is_active) return 'Active';
    return 'Inactive';
  };

  const handleActivateStage = async (stageId: string, position: number) => {
    const key = `activate-${stageId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/admin/ddsa/stages/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true })
      });
      
      if (!res.ok) {
        throw new Error(`Failed to activate stage: ${res.statusText}`);
      }
      
      // Reload data
      await loadFlowData();
    } catch (error: any) {
      console.error('Failed to activate stage:', error);
      alert(`Failed to activate stage: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRunDryTest = async (stageId: string, position: number) => {
    const key = `drytest-${stageId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      // Call admin proxy endpoint which handles internal auth
      const res = await fetch(`/api/admin/ddsa/stage/${stageId}/dry-test`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thread_id: `dry-test-${Date.now()}-${stageId}`,
          status: 'completed',
          agent_id: 'admin-ui'
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh data after dry test
        await loadFlowData();
        alert(`Dry test completed: ${data.message || 'Success'}`);
      } else {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || `API returned ${res.status}`);
      }
    } catch (error: any) {
      console.error('Dry test failed:', error);
      alert(`Dry test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Display all stages from the database, sorted by position
  const allStages: Stage[] = flowData?.stages 
    ? [...flowData.stages].sort((a, b) => a.position - b.position)
    : [];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading DDSA flow configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-red-600">
              <p className="font-semibold mb-2">Error loading flow data</p>
              <p className="text-sm">{error}</p>
              <Button onClick={loadFlowData} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#0B4422]">DDSA Flow Visualization</h1>
        <div className="flex gap-2 items-center">
          <Link href="/admin/dashboard">
            <Button variant="secondary" size="sm">
              🏠 Admin Dashboard
            </Button>
          </Link>
          <Link href="/admin/orchestrator">
            <Button variant="secondary" size="sm">
              🎭 View Orchestrator
            </Button>
          </Link>
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            variant={autoRefresh ? "primary" : "outline"} 
            size="sm"
          >
            {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </Button>
          <Button onClick={loadFlowData} variant="outline" size="sm">
            🔄 Manual Refresh
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <div className="text-2xl font-bold text-[#0B4422]">{summary.totalStages}</div>
              <div className="text-sm text-gray-600">Total Stages</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.activeCount}</div>
              <div className="text-sm text-gray-600">✅ Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{summary.inactiveCount}</div>
              <div className="text-sm text-gray-600">⚠️ Inactive</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.totalProgressCount}</div>
              <div className="text-sm text-gray-600">Total Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{summary.runningCount}</div>
              <div className="text-sm text-gray-600">🔄 Running</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.completedCount}</div>
              <div className="text-sm text-gray-600">✅ Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.failedCount}</div>
              <div className="text-sm text-gray-600">❌ Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Configured Stages */}
      <Card>
        <CardHeader>
          <CardTitle>All Configured Stages ({flowData?.total || 0} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {!flowData || !flowData.stages || flowData.stages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No stages found in database.</p>
              <p className="text-sm mb-4">Make sure stages are registered in <code>ddsa_stage_config</code> table.</p>
              <Button onClick={loadFlowData} className="mt-4" variant="outline">
                Refresh Data
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStages.map((stage) => {
              return (
              <Card
                key={stage.stage_id}
                className={`border-2 ${getStatusColor(stage)}`}
              >
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getStatusIcon(stage)}</span>
                      <div>
                        <div className="font-semibold text-sm">
                          {stage.stage_name || stage.stage_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          Position: {stage.position} | ID: {stage.stage_id}
                        </div>
                      </div>
                    </div>
                    <Badge variant={stage.is_active ? 'default' : 'secondary'}>
                      {getStatusIcon(stage)} {getStatusText(stage)}
                    </Badge>
                  </div>

                  {/* Progress Counts */}
                  {stage.progressCounts && stage.progressCounts.total > 0 && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-md">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Progress Counts:</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-gray-600">Total: <span className="font-medium text-blue-600">{stage.progressCounts.total}</span></span>
                        {stage.progressCounts.running > 0 && (
                          <span className="text-gray-600">Running: <span className="font-medium text-purple-600">{stage.progressCounts.running}</span></span>
                        )}
                        {(stage.progressCounts.completed > 0 || stage.progressCounts.done > 0) && (
                          <span className="text-gray-600">Done: <span className="font-medium text-green-600">{(stage.progressCounts.completed || 0) + (stage.progressCounts.done || 0)}</span></span>
                        )}
                        {stage.progressCounts.failed > 0 && (
                          <span className="text-gray-600">Failed: <span className="font-medium text-red-600">{stage.progressCounts.failed}</span></span>
                        )}
                        {stage.progressCounts.pending > 0 && (
                          <span className="text-gray-600">Pending: <span className="font-medium text-yellow-600">{stage.progressCounts.pending}</span></span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Progress</span>
                      <span className="text-xs font-medium">
                        {getProgressPercentage(stage)}%
                      </span>
                    </div>
                    <Progress value={getProgressPercentage(stage)} />
                  </div>

                  {/* Progress Status */}
                  {stage.progress && (
                    <div className="text-xs text-gray-600 mb-3">
                      Status: <span className="font-medium">{stage.progress.status}</span>
                    </div>
                  )}

                  {/* Last Audit Timestamp */}
                  {stage.lastAuditTimestamp && (
                    <div className="text-xs text-gray-500 mb-3 border-t pt-2">
                      <div className="font-semibold text-gray-600 mb-1">Last Audit:</div>
                      <div className="font-mono text-xs">
                        {new Date(stage.lastAuditTimestamp).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {!stage.is_active && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleActivateStage(stage.stage_id, stage.position)}
                        disabled={actionLoading[`activate-${stage.stage_id}`]}
                        className="flex-1 text-xs"
                      >
                        {actionLoading[`activate-${stage.stage_id}`] ? 'Activating...' : 'Activate Stage'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunDryTest(stage.stage_id, stage.position)}
                      disabled={actionLoading[`drytest-${stage.stage_id}`]}
                      className="flex-1 text-xs"
                    >
                      {actionLoading[`drytest-${stage.stage_id}`] ? 'Testing...' : '🧪 Run Dry Test'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

