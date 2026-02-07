// app/admin/ddsa/plan/[thread_id]/page.tsx
// DDSA Plan Confirmation Page - Confirm plan, generate report, download PDF

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface FinalPlan {
  thread_id: string;
  plan_data: any;
  schedule: any;
  motivation: any;
  pdf_path?: string;
  created_at?: string;
  updated_at?: string;
}

export default function DDSAPlanConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.thread_id as string;

  const [ddsState, setDdsState] = useState<any>(null);
  const [finalPlan, setFinalPlan] = useState<FinalPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (threadId) {
      loadPlanData();
    }
  }, [threadId]);

  const loadPlanData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load DDS state
      const stateRes = await fetch(`/api/admin/ddsa/thread/${threadId}/state`);
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setDdsState(stateData.state);
      } else {
        throw new Error('Failed to load DDS state');
      }

      // Load final plan
      const planRes = await fetch(`/api/admin/ddsa/final-plan/${threadId}`);
      if (planRes.ok) {
        const planData = await planRes.json();
        setFinalPlan(planData.plan || null);
      } else if (planRes.status !== 404) {
        console.warn('Failed to load final plan:', await planRes.json());
      }
    } catch (err: any) {
      console.error('Failed to load plan data:', err);
      setError(err.message || 'Failed to load plan data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/ddsa/confirmation/${threadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          confirmed: true,
          confirmation_data: {
            confirmed_at: new Date().toISOString(),
            confirmed_by: 'admin'
          },
          agent_id: 'C2'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Confirmation failed');
      }

      const data = await res.json();
      setSuccess('Plan confirmed successfully!');
      
      // Reload plan data to get updated state
      setTimeout(() => loadPlanData(), 1000);
    } catch (err: any) {
      console.error('Confirmation failed:', err);
      setError(err.message || 'Failed to confirm plan');
    } finally {
      setConfirming(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/ddsa/report/${threadId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Report generation failed');
      }

      const data = await res.json();
      
      if (data.existing) {
        setSuccess('PDF already exists. Use the download button.');
      } else {
        setSuccess('Report generated successfully!');
      }

      // Reload plan data to get updated pdf_path
      setTimeout(() => loadPlanData(), 1000);
    } catch (err: any) {
      console.error('Report generation failed:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!finalPlan?.pdf_path) {
      setError('PDF not available. Generate report first.');
      return;
    }

    // Open download URL
    window.open(`/api/admin/ddsa/report/${threadId}/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading plan data...</p>
      </div>
    );
  }

  const enrichedPlan = ddsState?.enriched_plan || {};
  const hasPlan = enrichedPlan && Object.keys(enrichedPlan).length > 0;
  const hasPdf = finalPlan?.pdf_path;

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
        <h1 className="text-3xl font-bold">Plan Confirmation</h1>
        <p className="text-gray-600 mt-2">Thread: {threadId.substring(0, 8)}...</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Plan Summary */}
      {hasPlan ? (
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Final Plan Summary</h2>
          
          {enrichedPlan.problem && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Problem</h3>
              <p className="text-gray-600">{enrichedPlan.problem.summary || 'No summary available'}</p>
            </div>
          )}

          {enrichedPlan.actions && Array.isArray(enrichedPlan.actions) && enrichedPlan.actions.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Actions ({enrichedPlan.actions.length})</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {enrichedPlan.actions.slice(0, 5).map((action: any, idx: number) => (
                  <li key={`action-${action.id || action.title || idx}`}>{action.summary || action.title || `Action ${idx + 1}`}</li>
                ))}
                {enrichedPlan.actions.length > 5 && (
                  <li className="text-gray-500 italic">... and {enrichedPlan.actions.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {enrichedPlan.score !== undefined && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Plan Score</h3>
              <p className="text-gray-600">{enrichedPlan.score}/100</p>
            </div>
          )}

          {/* Full plan details (collapsible) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-blue-600 font-medium">
              View Full Plan Data
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(enrichedPlan, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div className="border rounded-lg p-6 mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            No enriched plan found. Please generate a plan first.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        
        <div className="flex flex-col gap-4">
          {/* Confirm Button */}
          <div>
            <button
              onClick={handleConfirm}
              disabled={confirming || !hasPlan}
              className={`px-6 py-3 rounded-lg font-medium ${
                confirming || !hasPlan
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {confirming ? 'Confirming...' : '✅ Confirm Plan'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Confirm this plan to proceed with activation stages
            </p>
          </div>

          {/* Generate Report Button */}
          <div>
            <button
              onClick={handleGenerateReport}
              disabled={generating || !hasPlan}
              className={`px-6 py-3 rounded-lg font-medium ${
                generating || !hasPlan
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {generating ? 'Generating...' : '📄 Generate Report'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Generate PDF report from the final plan
            </p>
          </div>

          {/* Download Button */}
          <div>
            <button
              onClick={handleDownload}
              disabled={!hasPdf}
              className={`px-6 py-3 rounded-lg font-medium ${
                !hasPdf
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              📥 Download Report
            </button>
            <p className="text-sm text-gray-500 mt-2">
              {hasPdf 
                ? `Download PDF report (${finalPlan.pdf_path})`
                : 'Generate report first to enable download'
              }
            </p>
          </div>
        </div>
      </div>

      {/* DDS State (collapsible) */}
      <details className="mt-6 border rounded-lg p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          View DDS State
        </summary>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(ddsState, null, 2)}
        </pre>
      </details>
    </div>
  );
}

