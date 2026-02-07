// app/admin/ddsa/page.tsx
// DDSA Admin Dashboard - View stages execution in real-time

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DDSADashboard() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedThread) {
      loadExecutionLog(selectedThread);
    }
  }, [selectedThread]);

  const loadExecutionLog = async (threadId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ddsa/execution-log?thread_id=${threadId}`);
      const data = await res.json();
      setExecutions(data.logs || []);
    } catch (error) {
      console.error('Failed to load execution log:', error);
    } finally {
      setLoading(false);
    }
  };

  const testStage = async (stageId: string) => {
    try {
      const res = await fetch(`/api/admin/ddsa/stages/${stageId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testData: {
            userId: 'test-user',
            threadId: 'test-thread',
            message: 'Test message',
            ddsState: {},
            userProfile: {}
          }
        })
      });
      const result = await res.json();
      alert(`Stage ${stageId} executed: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('Failed to test stage:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">DDSA Execution Dashboard</h1>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <a
          href="/admin/ddsa/flow"
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-semibold">Flow Configuration</h3>
          <p className="text-sm text-gray-600">Configure stage order & settings</p>
        </a>
        <a
          href="/admin/ddsa/stages"
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-semibold">Stage Management</h3>
          <p className="text-sm text-gray-600">View & edit all stages</p>
        </a>
        <a
          href="/admin/ddsa/logs"
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-semibold">Execution Logs</h3>
          <p className="text-sm text-gray-600">View all execution history</p>
        </a>
        <a
          href="/admin/ddsa/trace"
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-semibold">Private Trace</h3>
          <p className="text-sm text-gray-600">View breadcrumbs, spans & provenance</p>
        </a>
      </div>

      {/* Thread Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          View Execution Log for Thread:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={selectedThread}
            onChange={(e) => setSelectedThread(e.target.value)}
            placeholder="Enter thread ID (UUID)"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={() => loadExecutionLog(selectedThread)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Load
          </button>
        </div>
      </div>

      {/* Execution Timeline */}
      {loading && <p className="text-gray-500">Loading...</p>}
      
      {executions.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Execution Timeline</h2>
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
                  <div>
                    <h3 className="font-semibold">{exec.stage_id}</h3>
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
                
                {exec.output_data && Object.keys(exec.output_data).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">
                      View Output Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(exec.output_data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Quick Test */}
      <div className="mt-8 border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Quick Stage Test</h2>
        <div className="flex flex-wrap gap-2">
          {['greeting', 'intent', 'enrichment', 'plan'].map((stageId) => (
            <button
              key={stageId}
              onClick={() => testStage(stageId)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test {stageId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}












