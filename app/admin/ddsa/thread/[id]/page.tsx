// app/admin/ddsa/thread/[id]/page.tsx
// DDSA Thread Detail View - Stage replay, audit logs, dry-run toggle

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DDSAThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  const [executions, setExecutions] = useState<any[]>([]);
  const [ddsState, setDdsState] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [dryRunEnabled, setDryRunEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (threadId) {
      loadThreadData();
    }
  }, [threadId]);

  const loadThreadData = async () => {
    setLoading(true);
    try {
      // Load execution logs
      const execRes = await fetch(`/api/admin/ddsa/execution-log?thread_id=${threadId}`);
      const execData = await execRes.json();
      setExecutions(execData.logs || []);

      // Load DDS state
      const stateRes = await fetch(`/api/admin/ddsa/thread/${threadId}/state`);
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setDdsState(stateData.state);
      }

      // Load audit logs (from console/audit system - simplified for now)
      // In production, this would fetch from an audit log table
      setAuditLogs([]);
    } catch (error) {
      console.error('Failed to load thread data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDryRun = async (stageId: string) => {
    try {
      const newValue = !dryRunEnabled[stageId];
      setDryRunEnabled({ ...dryRunEnabled, [stageId]: newValue });
      
      // TODO: Call API to update dry-run setting for this stage
      // await fetch(`/api/admin/ddsa/stages/${stageId}/dry-run`, {
      //   method: 'POST',
      //   body: JSON.stringify({ enabled: newValue })
      // });
    } catch (error) {
      console.error('Failed to toggle dry-run:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading thread data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/ddsa')}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold">Thread: {threadId.substring(0, 8)}...</h1>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedStage(null)}
            className={`pb-2 px-4 ${!selectedStage ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedStage('audit')}
            className={`pb-2 px-4 ${selectedStage === 'audit' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setSelectedStage('state')}
            className={`pb-2 px-4 ${selectedStage === 'state' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          >
            DDS State
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {!selectedStage && (
        <div className="space-y-6">
          {/* Stage Execution Timeline */}
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Stage Execution Timeline</h2>
            <div className="space-y-4">
              {executions.map((exec, idx) => (
                <div
                  key={exec.id}
                  className={`p-4 rounded border-l-4 ${
                    exec.status === 'completed'
                      ? 'border-green-500 bg-green-50'
                      : exec.status === 'failed'
                      ? 'border-red-500 bg-red-50'
                      : exec.status === 'skipped'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-500 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{exec.stage_id}</h3>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={dryRunEnabled[exec.stage_id] || false}
                            onChange={() => toggleDryRun(exec.stage_id)}
                            className="rounded"
                          />
                          <span>Dry-run</span>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Status: {exec.status} | Duration: {exec.duration_ms}ms
                      </p>
                      {exec.started_at && (
                        <p className="text-xs text-gray-500">
                          {new Date(exec.started_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        exec.status === 'completed'
                          ? 'bg-green-200 text-green-800'
                          : exec.status === 'failed'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {exec.status}
                    </span>
                  </div>

                  {exec.error_message && (
                    <div className="mt-2 p-2 bg-red-100 rounded">
                      <p className="text-sm text-red-800">Error: {exec.error_message}</p>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    {exec.input_data && Object.keys(exec.input_data).length > 0 && (
                      <details className="flex-1">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          View Input Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(exec.input_data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {exec.output_data && Object.keys(exec.output_data).length > 0 && (
                      <details className="flex-1">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          View Output Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(exec.output_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Total Stages</h3>
              <p className="text-3xl font-bold">{executions.length}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Completed</h3>
              <p className="text-3xl font-bold text-green-600">
                {executions.filter(e => e.status === 'completed').length}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Failed</h3>
              <p className="text-3xl font-bold text-red-600">
                {executions.filter(e => e.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {selectedStage === 'audit' && (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
          <p className="text-gray-500">
            Audit logs for this thread. In production, these would be fetched from the audit log table.
          </p>
          <div className="mt-4 space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-gray-400 italic">No audit logs found. Check console logs for audit events.</p>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                  <code>{JSON.stringify(log, null, 2)}</code>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DDS State Tab */}
      {selectedStage === 'state' && (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">DDS State</h2>
          {ddsState ? (
            <details open>
              <summary className="cursor-pointer text-sm text-blue-600 mb-2">
                View Current State
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(ddsState, null, 2)}
              </pre>
            </details>
          ) : (
            <p className="text-gray-500">DDS state not available. State is stored in thread messages.</p>
          )}
        </div>
      )}
    </div>
  );
}












