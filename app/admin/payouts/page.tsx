// app/admin/payouts/page.tsx
// Payouts Management Page

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Payout = {
  id: number;
  affiliate_id: string;
  amount: number;
  currency: string;
  status: string;
  initiated_at: string;
  completed_at?: string;
  payout_tx_id?: string;
  notes?: string;
  affiliates?: {
    name: string;
    ref_code: string;
    email?: string;
  };
};

type Affiliate = {
  id: string;
  name: string;
  ref_code: string;
  stats?: {
    pending_earnings: number;
  };
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>("");
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPayouts();
    fetchAffiliates();
  }, [statusFilter]);

  async function fetchPayouts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`/api/admin/payouts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAffiliates() {
    try {
      const res = await fetch('/api/admin/affiliates?status=active');
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    }
  }

  async function createPayout() {
    if (!selectedAffiliate || !payoutAmount) {
      alert('Please select an affiliate and enter an amount');
      return;
    }

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: selectedAffiliate,
          amount: parseFloat(payoutAmount),
          currency: 'INR'
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSelectedAffiliate('');
        setPayoutAmount('');
        fetchPayouts();
        alert('Payout created successfully');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create payout');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  }

  async function markComplete(payoutId: number) {
    const txId = prompt('Enter payout transaction ID:');
    if (!txId) return;

    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          payout_tx_id: txId
        })
      });

      if (res.ok) {
        fetchPayouts();
        alert('Payout marked as completed');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update payout');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const totalPending = payouts
    .filter(p => p.status === 'initiated' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCompleted = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const url = `/api/admin/export?type=payouts${statusFilter ? `&status=${statusFilter}` : ''}`;
              window.open(url, '_blank');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Payout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Payouts</div>
          <div className="text-2xl font-bold text-gray-900">{payouts.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCompleted)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="initiated">Initiated</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Create Payout</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliate
                </label>
                <select
                  value={selectedAffiliate}
                  onChange={(e) => setSelectedAffiliate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Select affiliate...</option>
                  {affiliates.map((aff) => (
                    <option key={aff.id} value={aff.id}>
                      {aff.name} ({aff.ref_code}) - {formatCurrency(aff.stats?.pending_earnings || 0)} pending
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (INR)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createPayout}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedAffiliate('');
                  setPayoutAmount('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affiliate
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initiated
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading payouts...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No payouts found.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payout.affiliates?.name || payout.affiliate_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.affiliates?.ref_code || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          payout.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payout.status === 'initiated' || payout.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payout.initiated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.completed_at ? formatDate(payout.completed_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payout.payout_tx_id ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {payout.payout_tx_id}
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {payout.status !== 'completed' && payout.status !== 'cancelled' && (
                        <button
                          onClick={() => markComplete(payout.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



