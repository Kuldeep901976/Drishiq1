'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';

interface UsageRecord {
  id: string;
  coupon_id: string;
  user_id: string | null;
  order_id: string | null;
  transaction_id: string | null;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  guest_email: string | null;
  guest_name: string | null;
  used_at: string;
  coupons: {
    id: string;
    code: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
  };
  users: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default function CouponUsagePage() {
  const { isAuthenticated, isLoading: authLoading } = useSuperAdminAuth();
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    coupon_id: '',
    user_id: '',
    start_date: '',
    end_date: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsage();
      loadStats();
    }
  }, [isAuthenticated, filters, pagination.page]);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      if (filters.coupon_id) params.append('coupon_id', filters.coupon_id);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(`/api/admin/coupons/usage?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsage(data.usage || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/coupons/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_id: filters.coupon_id || null,
          start_date: filters.start_date || null,
          end_date: filters.end_date || null
        })
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const exportToCSV = async () => {
    // For large datasets, use API endpoint
    if (pagination.total > 1000) {
      setExporting(true);
      setExportStatus('Preparing export...');
      
      try {
        const params = new URLSearchParams();
        if (filters.coupon_id) params.append('coupon_id', filters.coupon_id);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        params.append('format', 'csv');

        const response = await fetch(`/api/admin/coupons/export?${params}`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coupon-usage-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        setExportStatus('✅ Export completed!');
        setTimeout(() => setExportStatus(null), 3000);
      } catch (error: any) {
        setExportStatus(`❌ Export failed: ${error.message}`);
        setTimeout(() => setExportStatus(null), 5000);
      } finally {
        setExporting(false);
      }
    } else {
      // For small datasets, generate client-side
      const headers = ['Date', 'Coupon Code', 'User', 'Original Amount', 'Discount', 'Final Amount', 'Order ID'];
      const rows = usage.map(record => [
        new Date(record.used_at).toLocaleString(),
        record.coupons.code,
        record.users ? `${record.users.first_name} ${record.users.last_name}`.trim() || record.users.email : record.guest_email || 'Guest',
        `$${record.original_amount.toFixed(2)}`,
        `$${record.discount_amount.toFixed(2)}`,
        `$${record.final_amount.toFixed(2)}`,
        record.order_id || '—'
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coupon-usage-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  const totalDiscount = usage.reduce((sum, record) => sum + record.discount_amount, 0);
  const totalRevenue = usage.reduce((sum, record) => sum + record.original_amount, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupon Usage Analytics</h1>
            <p className="text-gray-600 mt-2">Track coupon redemptions and performance</p>
          </div>
          <div className="flex items-center gap-4">
            {exportStatus && (
              <div className={`px-4 py-2 rounded-lg ${
                exportStatus.startsWith('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {exportStatus}
              </div>
            )}
            <button
              onClick={exportToCSV}
              disabled={exporting}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : `Export CSV (${pagination.total} records)`}
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Uses</div>
            <div className="text-3xl font-bold text-gray-900">{usage.length}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Discount</div>
            <div className="text-3xl font-bold text-emerald-600">${totalDiscount.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">Avg Discount</div>
            <div className="text-3xl font-bold text-purple-600">
              ${usage.length > 0 ? (totalDiscount / usage.length).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Coupon ID..."
              value={filters.coupon_id}
              onChange={(e) => setFilters({ ...filters, coupon_id: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
            <input
              type="text"
              placeholder="User ID..."
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="border rounded-lg px-4 py-2"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="border rounded-lg px-4 py-2"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Usage Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coupon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usage.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No usage records found
                    </td>
                  </tr>
                ) : (
                  usage.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.used_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-emerald-600">{record.coupons.code}</div>
                        <div className="text-xs text-gray-500">{record.coupons.description || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.users ? (
                          <div>
                            <div>{record.users.first_name} {record.users.last_name}</div>
                            <div className="text-xs text-gray-500">{record.users.email}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-gray-500">Guest</div>
                            {record.guest_email && (
                              <div className="text-xs text-gray-400">{record.guest_email}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${record.original_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        -${record.discount_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${record.final_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {record.order_id || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

