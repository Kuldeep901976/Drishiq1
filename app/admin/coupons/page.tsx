'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount: number | null;
  maximum_discount_amount: number | null;
  global_usage_limit: number | null;
  per_user_usage_limit: number;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'inactive' | 'expired' | 'archived';
  campaign_tag: string | null;
  visibility: 'public' | 'internal' | 'hidden';
  created_at: string;
  updated_at: string;
}

interface CouponStats {
  total_uses: number;
  total_discount_amount: number;
  total_revenue_impact: number;
  unique_users: number;
  average_discount: number;
}

export default function CouponsManagementPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSuperAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [stats, setStats] = useState<Record<string, CouponStats>>({});
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    campaign: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadCoupons();
    }
  }, [isAuthenticated, filters, pagination.page]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.campaign) params.append('campaign', filters.campaign);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/coupons?${params}`);
      const data = await response.json();

      if (data.success) {
        setCoupons(data.coupons || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));

        // Load stats for each coupon
        for (const coupon of data.coupons || []) {
          loadCouponStats(coupon.id);
        }
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCouponStats = async (couponId: string) => {
    try {
      const response = await fetch('/api/admin/coupons/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_id: couponId })
      });
      const data = await response.json();
      if (data.success && data.stats?.[0]) {
        setStats(prev => ({ ...prev, [couponId]: data.stats[0] }));
      }
    } catch (error) {
      console.error('Error loading coupon stats:', error);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to archive this coupon?')) return;

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        loadCoupons();
      } else {
        alert(data.error || 'Failed to archive coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to archive coupon');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();

      if (data.success) {
        loadCoupons();
      } else {
        alert(data.error || 'Failed to update coupon');
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      alert('Failed to update coupon');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `$${coupon.discount_value.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
            <p className="text-gray-600 mt-2">Create and manage discount coupons</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Admin Dashboard
            </Link>
            <button
              onClick={() => {
                setEditingCoupon(null);
                setShowCreateModal(true);
              }}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              + Create Coupon
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by code or description..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
            </select>
            <input
              type="text"
              placeholder="Filter by campaign..."
              value={filters.campaign}
              onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const couponStats = stats[coupon.id];
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-emerald-600">{coupon.code}</div>
                          {coupon.campaign_tag && (
                            <div className="text-xs text-gray-500 mt-1">{coupon.campaign_tag}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{coupon.description || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatDiscount(coupon)}</div>
                          {coupon.minimum_order_amount && (
                            <div className="text-xs text-gray-500">Min: ${coupon.minimum_order_amount}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatDate(coupon.valid_from)}</div>
                          <div>to {formatDate(coupon.valid_until)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {couponStats ? (
                            <div>
                              <div className="font-semibold">{couponStats.total_uses} uses</div>
                              <div className="text-xs text-gray-500">
                                ${couponStats.total_discount_amount.toFixed(2)} saved
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(coupon.status)}`}>
                            {coupon.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCoupon(coupon);
                                setShowCreateModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(coupon)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              {coupon.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CouponModal
          coupon={editingCoupon}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
            loadCoupons();
          }}
        />
      )}

      <Footer />
    </div>
  );
}

// Coupon Create/Edit Modal Component
function CouponModal({
  coupon,
  onClose,
  onSuccess
}: {
  coupon: Coupon | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || 0,
    minimum_order_amount: coupon?.minimum_order_amount || '',
    maximum_discount_amount: coupon?.maximum_discount_amount || '',
    global_usage_limit: coupon?.global_usage_limit || '',
    per_user_usage_limit: coupon?.per_user_usage_limit || 1,
    valid_from: coupon ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
    valid_until: coupon ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
    status: coupon?.status || 'active',
    campaign_tag: coupon?.campaign_tag || '',
    visibility: coupon?.visibility || 'public',
    auto_generate_code: !coupon
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons';
      const method = coupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minimum_order_amount: formData.minimum_order_amount || null,
          maximum_discount_amount: formData.maximum_discount_amount || null,
          global_usage_limit: formData.global_usage_limit || null
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save coupon');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {coupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code */}
            {formData.auto_generate_code ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_generate_code}
                  onChange={(e) => setFormData({ ...formData, auto_generate_code: e.target.checked })}
                />
                <label>Auto-generate unique code</label>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full border rounded-lg px-4 py-2 font-mono"
                  placeholder="SUMMER2024"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                rows={2}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type *</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed_amount' })}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value *</label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                  required
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Amount</label>
                <input
                  type="number"
                  value={formData.minimum_order_amount}
                  onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Leave empty for no minimum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Discount Amount</label>
                <input
                  type="number"
                  value={formData.maximum_discount_amount}
                  onChange={(e) => setFormData({ ...formData, maximum_discount_amount: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Leave empty for no max"
                />
              </div>
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Global Usage Limit</label>
                <input
                  type="number"
                  value={formData.global_usage_limit}
                  onChange={(e) => setFormData({ ...formData, global_usage_limit: e.target.value })}
                  min="1"
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Per User Limit *</label>
                <input
                  type="number"
                  value={formData.per_user_usage_limit}
                  onChange={(e) => setFormData({ ...formData, per_user_usage_limit: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valid From *</label>
                <input
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid Until *</label>
                <input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            </div>

            {/* Status & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            {/* Campaign Tag */}
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Tag</label>
              <input
                type="text"
                value={formData.campaign_tag}
                onChange={(e) => setFormData({ ...formData, campaign_tag: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="e.g., SUMMER2024"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : coupon ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

