// app/admin/affiliates/[id]/page.tsx
// Affiliate Detail Page with Timeline

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';
import { TimeSeriesChart, MultiSeriesChart } from "@/components/charts";

type AffiliateDetail = {
  id: string;
  name: string;
  email?: string;
  ref_code: string;
  payout_rate: number;
  payout_type: string;
  status: string;
  cookie_duration_days: number;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string;
};

type Stats = {
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  conversion_rate: number;
};

type Click = {
  id: number;
  ip: string;
  user_agent: string;
  landing_path: string;
  created_at: string;
  is_fraudulent: boolean;
};

type Earning = {
  id: number;
  event_type: string;
  amount: number;
  currency: string;
  payout_status: string;
  created_at: string;
  order_id?: string;
};

type Payout = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  initiated_at: string;
  completed_at?: string;
  payout_tx_id?: string;
};

export default function AffiliateDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSuperAdminAuth();
  const [affiliate, setAffiliate] = useState<AffiliateDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clicks' | 'earnings' | 'payouts'>('overview');

  // Get super admin token for API calls
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
    return {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    if (id && isAuthenticated) loadData();
  }, [id, isAuthenticated]);

  async function loadData() {
    setLoading(true);
    try {
      // Load affiliate details
      const resAffiliate = await fetch(`/api/admin/affiliates`, {
        headers: getAuthHeaders()
      });
      if (resAffiliate.ok) {
        const data = await resAffiliate.json();
        const found = data.data?.find((a: AffiliateDetail) => a.id === id);
        if (found) setAffiliate(found);
      }

      // Load stats
      const resStats = await fetch(`/api/admin/affiliates/${id}/stats`, {
        headers: getAuthHeaders()
      });
      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData.data?.stats || null);
        setClicks(statsData.data?.clicks || []);
        setEarnings(statsData.data?.earnings || []);
        setPayouts(statsData.data?.payouts || []);
      }
    } catch (err) {
      console.error('Error loading affiliate data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getAffiliateLinks() {
    if (!affiliate) return { short: '', query: '' };
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      short: `${baseUrl}/r/${affiliate.ref_code}`,
      query: `${baseUrl}/?ref=${affiliate.ref_code}`
    };
  }

  function copyAffiliateLink(type: 'short' | 'query' = 'short') {
    if (!affiliate) return;
    const links = getAffiliateLinks();
    const link = type === 'short' ? links.short : links.query;
    navigator.clipboard.writeText(link);
    alert(`Affiliate link copied to clipboard!\n\n${link}`);
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
      minute: '2-digit',
      second: '2-digit'
    });
  }

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading affiliate details...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useSuperAdminAuth will redirect
  }

  if (!affiliate) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Affiliate not found</p>
          <Link href="/admin/affiliates" className="text-blue-600 hover:underline">
            Back to Affiliates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/affiliates"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Affiliates
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{affiliate.name}</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Admin Dashboard
          </Link>
          <Link
            href={`/admin/affiliates/${id}/edit`}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Clicks (30d)</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_clicks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Conversions (30d)</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_conversions}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.conversion_rate.toFixed(2)}% conversion rate
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Pending Earnings</div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pending_earnings)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Earnings</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.total_earnings)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatCurrency(stats.paid_earnings)} paid
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {(['overview', 'clicks', 'earnings', 'payouts'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Affiliate Information</h3>
                    
                    {/* Affiliate Tracking Links */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-blue-900 mb-3">Tracking Links</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Short Link (Recommended):
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={getAffiliateLinks().short}
                              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                            />
                            <button
                              onClick={() => copyAffiliateLink('short')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Use: {getAffiliateLinks().short}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Query Parameter Link:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={getAffiliateLinks().query}
                              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                            />
                            <button
                              onClick={() => copyAffiliateLink('query')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Use: {getAffiliateLinks().query}
                          </p>
                        </div>
                        <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                          <p className="text-xs text-gray-600">
                            <strong>How it works:</strong> When someone clicks your affiliate link, we track the click and set a cookie. 
                            If they sign up or make a purchase within {affiliate.cookie_duration_days} days, you earn a commission.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Charts Section */}
                  {stats && (clicks.length > 0 || earnings.length > 0) && (
                    <div className="space-y-6 mt-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <MultiSeriesChart
                          data={[
                            // Group clicks and earnings by date for chart
                            ...Array.from(
                              new Set([
                                ...clicks.map(c => c.created_at.split('T')[0]),
                                ...earnings.map(e => e.created_at.split('T')[0])
                              ])
                            ).map(date => {
                              const dayClicks = clicks.filter(c => c.created_at.startsWith(date)).length;
                              const dayEarnings = earnings
                                .filter(e => e.created_at.startsWith(date) && e.event_type === 'purchase')
                                .reduce((sum, e) => sum + e.amount, 0);
                              const dayConversions = earnings.filter(e => e.created_at.startsWith(date)).length;
                              
                              return {
                                timestamp: date,
                                clicks: dayClicks,
                                conversions: dayConversions,
                                earnings: dayEarnings
                              };
                            })
                          ]}
                          title="Activity Over Time (Last 30 Days)"
                          height={300}
                        />
                      </div>
                    </div>
                  )}
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ref Code</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <code className="bg-gray-100 px-2 py-1 rounded">{affiliate.ref_code}</code>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{affiliate.email || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Payout Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {affiliate.payout_type} • {affiliate.payout_rate}
                        {affiliate.payout_type === 'percentage' ? '%' : ' INR'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cookie Duration</dt>
                      <dd className="mt-1 text-sm text-gray-900">{affiliate.cookie_duration_days} days</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            affiliate.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {affiliate.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">KYC Verified</dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            affiliate.kyc_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {affiliate.kyc_verified ? 'Verified' : 'Not Verified'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(affiliate.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(affiliate.updated_at)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {activeTab === 'clicks' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Clicks</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">IP</th>
                          <th className="px-4 py-2 text-left">Path</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {clicks.slice(0, 50).map((click) => (
                          <tr key={click.id}>
                            <td className="px-4 py-2">{formatDate(click.created_at)}</td>
                            <td className="px-4 py-2 font-mono text-xs">{click.ip}</td>
                            <td className="px-4 py-2">{click.landing_path}</td>
                            <td className="px-4 py-2">
                              {click.is_fraudulent ? (
                                <span className="text-red-600 text-xs">Fraud</span>
                              ) : (
                                <span className="text-green-600 text-xs">Valid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'earnings' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Earnings Ledger</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Event</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Order ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {earnings.map((earning) => (
                          <tr key={earning.id}>
                            <td className="px-4 py-2">{formatDate(earning.created_at)}</td>
                            <td className="px-4 py-2 capitalize">{earning.event_type}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(earning.amount)}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  earning.payout_status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : earning.payout_status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {earning.payout_status}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-mono text-xs">
                              {earning.order_id || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'payouts' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payout History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Transaction ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payouts.map((payout) => (
                          <tr key={payout.id}>
                            <td className="px-4 py-2">{formatDate(payout.initiated_at)}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(payout.amount)}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  payout.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : payout.status === 'initiated'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {payout.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-mono text-xs">
                              {payout.payout_tx_id || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/admin/payouts?affiliate_id=${id}`}
                className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              >
                Create Payout
              </Link>
              <button
                onClick={() => {
                  const url = `/api/admin/export?type=earnings&affiliate_id=${id}`;
                  window.open(url, '_blank');
                }}
                className="block w-full text-left px-4 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
              >
                Export Earnings CSV
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Affiliate Link</h3>
            <div className="bg-gray-50 p-3 rounded font-mono text-xs break-all">
              {typeof window !== 'undefined' && `${window.location.origin}/r/${affiliate.ref_code}`}
            </div>
            <button
              onClick={copyAffiliateLink}
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

