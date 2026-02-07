// app/admin/affiliates/new/page.tsx
// Create New Affiliate Page

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';

type AffiliateForm = {
  name: string;
  email: string;
  ref_code: string;
  payout_rate: number;
  payout_type: 'percentage' | 'fixed';
  status: 'active' | 'paused' | 'inactive' | 'banned';
  cookie_duration_days: number;
};

export default function NewAffiliatePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSuperAdminAuth();
  const [form, setForm] = useState<AffiliateForm>({
    name: "",
    email: "",
    ref_code: "",
    payout_rate: 0,
    payout_type: "percentage",
    status: "active",
    cookie_duration_days: 30
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get super admin token for API calls
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/affiliates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/affiliates/${data.data.id}`);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to create affiliate');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useSuperAdminAuth will redirect
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/admin/affiliates"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Affiliates
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Admin Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Affiliate</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ref Code *
          </label>
          <input
            type="text"
            value={form.ref_code}
            onChange={(e) => setForm({ ...form, ref_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
            required
            pattern="[A-Z0-9]+"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">Alphanumeric, uppercase only</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payout Rate *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.payout_rate}
              onChange={(e) => setForm({ ...form, payout_rate: Number(e.target.value) })}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payout Type *
            </label>
            <select
              value={form.payout_type}
              onChange={(e) => setForm({ ...form, payout_type: e.target.value as 'percentage' | 'fixed' })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cookie Duration (Days)
          </label>
          <select
            value={form.cookie_duration_days}
            onChange={(e) => setForm({ ...form, cookie_duration_days: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as AffiliateForm['status'] })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Affiliate'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/affiliates')}
            className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}



