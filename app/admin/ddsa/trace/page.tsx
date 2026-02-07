// app/admin/ddsa/trace/page.tsx
// DDSA Private Trace Viewer - View breadcrumbs, spans, and provenance

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Breadcrumb {
  id: string;
  stage: string;
  action: string;
  summary: string;
  inputs?: string[];
  outputs?: string[];
  signals?: Record<string, any>;
  confidence?: number;
  created_at: string;
  span_id?: string;
}

interface Span {
  span_id: string;
  stage: string;
  name: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  flags?: Record<string, any>;
  outcome?: 'ok' | 'needs_input' | 'skipped' | 'error';
  error?: { message: string; code?: string } | null;
}

interface ProvenanceEdge {
  from: string;
  to: string;
  label?: string;
}

interface TraceData {
  thread_id: string;
  session_title?: string;
  created_at?: string;
  last_activity_at?: string;
  breadcrumbs: Breadcrumb[];
  spans: Span[];
  provenance: { edges: ProvenanceEdge[] };
  analytics?: any;
}

export default function DDSATraceViewer() {
  const [selectedThread, setSelectedThread] = useState<string>('');
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'breadcrumbs' | 'spans' | 'provenance' | 'analytics'>('breadcrumbs');
  const router = useRouter();

  const loadTrace = async (threadId: string) => {
    if (!threadId.trim()) {
      setError('Please enter a thread ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ddsa/trace?thread_id=${threadId}&action=all`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load trace data');
      }
      const data = await res.json();
      setTraceData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load trace data');
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-300';
      case 'needs_input': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'skipped': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      generate: 'bg-blue-100 text-blue-800',
      confirm: 'bg-green-100 text-green-800',
      refine: 'bg-yellow-100 text-yellow-800',
      reject: 'bg-red-100 text-red-800',
      upsert: 'bg-purple-100 text-purple-800',
      analyze: 'bg-indigo-100 text-indigo-800',
      build: 'bg-teal-100 text-teal-800',
      accept: 'bg-emerald-100 text-emerald-800',
      select: 'bg-cyan-100 text-cyan-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">DDSA Private Trace Viewer</h1>
        <p className="text-gray-600">View breadcrumbs, decision spans, and provenance graph for DDSA sessions</p>
      </div>

      {/* Thread Selection */}
      <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm">
        <label className="block text-sm font-medium mb-2">
          Thread ID (Conversation Session ID):
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={selectedThread}
            onChange={(e) => setSelectedThread(e.target.value)}
            placeholder="Enter thread/session ID (UUID)"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && loadTrace(selectedThread)}
          />
          <button
            onClick={() => loadTrace(selectedThread)}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load Trace'}
          </button>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Session Info */}
      {traceData && (
        <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Session Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Thread ID</div>
              <div className="font-mono text-xs break-all">{traceData.thread_id}</div>
            </div>
            {traceData.session_title && (
              <div>
                <div className="text-gray-600">Title</div>
                <div className="font-semibold">{traceData.session_title}</div>
              </div>
            )}
            {traceData.created_at && (
              <div>
                <div className="text-gray-600">Created</div>
                <div>{new Date(traceData.created_at).toLocaleString()}</div>
              </div>
            )}
            {traceData.last_activity_at && (
              <div>
                <div className="text-gray-600">Last Activity</div>
                <div>{new Date(traceData.last_activity_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {traceData && (
        <>
          <div className="mb-4 border-b">
            <nav className="flex space-x-4">
              {(['breadcrumbs', 'spans', 'provenance', 'analytics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'breadcrumbs' && ` (${traceData.breadcrumbs.length})`}
                  {tab === 'spans' && ` (${traceData.spans.length})`}
                  {tab === 'provenance' && ` (${traceData.provenance.edges.length})`}
                </button>
              ))}
            </nav>
          </div>

          {/* Breadcrumbs Tab */}
          {activeTab === 'breadcrumbs' && (
            <div className="bg-white rounded-lg border shadow-sm">
              {traceData.breadcrumbs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No breadcrumbs found for this session
                </div>
              ) : (
                <div className="divide-y">
                  {traceData.breadcrumbs.map((crumb, idx) => (
                    <div key={crumb.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(crumb.action)}`}>
                            {crumb.action}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {crumb.stage}
                          </span>
                          {crumb.confidence !== undefined && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                              {(crumb.confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(crumb.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{crumb.summary}</p>
                      {crumb.signals && Object.keys(crumb.signals).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                            View Signals
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                            {JSON.stringify(crumb.signals, null, 2)}
                          </pre>
                        </details>
                      )}
                      {crumb.inputs && crumb.inputs.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <strong>Inputs:</strong> {crumb.inputs.join(', ')}
                        </div>
                      )}
                      {crumb.outputs && crumb.outputs.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          <strong>Outputs:</strong> {crumb.outputs.join(', ')}
                        </div>
                      )}
                      {crumb.span_id && (
                        <div className="mt-1 text-xs text-gray-500 font-mono">
                          Span: {crumb.span_id.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spans Tab */}
          {activeTab === 'spans' && (
            <div className="bg-white rounded-lg border shadow-sm">
              {traceData.spans.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No decision spans found for this session
                </div>
              ) : (
                <div className="divide-y">
                  {traceData.spans.map((span) => (
                    <div key={span.span_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{span.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              {span.stage}
                            </span>
                            {span.outcome && (
                              <span className={`px-2 py-1 rounded text-xs border ${getOutcomeColor(span.outcome)}`}>
                                {span.outcome}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          {span.duration_ms !== undefined && (
                            <div className="font-mono">{span.duration_ms}ms</div>
                          )}
                          <div className="text-xs">
                            {new Date(span.started_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {span.flags && Object.keys(span.flags).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                            View Flags
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                            {JSON.stringify(span.flags, null, 2)}
                          </pre>
                        </details>
                      )}
                      {span.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <strong>Error:</strong> {span.error.message}
                          {span.error.code && <span className="ml-2 text-xs">({span.error.code})</span>}
                        </div>
                      )}
                      {span.ended_at && (
                        <div className="mt-2 text-xs text-gray-500">
                          Ended: {new Date(span.ended_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Provenance Tab */}
          {activeTab === 'provenance' && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              {traceData.provenance.edges.length === 0 ? (
                <div className="text-center text-gray-500">
                  No provenance edges found for this session
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-4">
                    Provenance graph showing relationships between breadcrumbs and artifacts
                  </p>
                  <div className="space-y-1">
                    {traceData.provenance.edges.map((edge, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                            {edge.from.substring(0, 8)}...
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                            {edge.to.substring(0, 8)}...
                          </span>
                          {edge.label && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {edge.label}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && traceData.analytics && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Breadcrumbs</div>
                  <div className="text-2xl font-bold text-blue-600">{traceData.analytics.total_breadcrumbs}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Spans</div>
                  <div className="text-2xl font-bold text-green-600">{traceData.analytics.total_spans}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">Provenance Edges</div>
                  <div className="text-2xl font-bold text-purple-600">{traceData.analytics.provenance_edges}</div>
                </div>
                {traceData.analytics.avg_confidence !== undefined && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-gray-600">Avg Confidence</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {(traceData.analytics.avg_confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {traceData.analytics.actions_by_stage && Object.keys(traceData.analytics.actions_by_stage).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Actions by Stage</h3>
                  <div className="space-y-2">
                    {Object.entries(traceData.analytics.actions_by_stage).map(([stage, actions]) => (
                      <div key={stage} className="p-3 bg-gray-50 rounded border">
                        <div className="font-semibold mb-1">{stage}</div>
                        <div className="text-sm space-y-1">
                          {Object.entries(actions as Record<string, number>).map(([action, count]) => (
                            <div key={action} className="flex justify-between">
                              <span>{action}</span>
                              <span className="font-mono">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {traceData.analytics.avg_durations_ms && Object.keys(traceData.analytics.avg_durations_ms).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Average Durations by Stage</h3>
                  <div className="space-y-2">
                    {Object.entries(traceData.analytics.avg_durations_ms).map(([stage, duration]) => (
                      <div key={stage} className="p-3 bg-gray-50 rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{stage}</span>
                          <span className="font-mono text-lg">{Math.round(duration as number)}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {traceData.analytics.outcomes_by_stage && Object.keys(traceData.analytics.outcomes_by_stage).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Outcomes by Stage</h3>
                  <div className="space-y-2">
                    {Object.entries(traceData.analytics.outcomes_by_stage).map(([stage, outcomes]) => (
                      <div key={stage} className="p-3 bg-gray-50 rounded border">
                        <div className="font-semibold mb-1">{stage}</div>
                        <div className="text-sm space-y-1">
                          {Object.entries(outcomes as Record<string, number>).map(([outcome, count]) => (
                            <div key={outcome} className="flex justify-between">
                              <span className={getOutcomeColor(outcome).split(' ')[0] + ' px-2 py-1 rounded text-xs'}>
                                {outcome}
                              </span>
                              <span className="font-mono">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!traceData && !loading && (
        <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Trace Data Loaded</h3>
          <p className="text-gray-500">Enter a thread ID above to view the private trace data</p>
        </div>
      )}
    </div>
  );
}

