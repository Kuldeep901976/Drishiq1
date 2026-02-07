'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';
import Link from 'next/link';

interface Testimonial {
  id: string;
  content: string;
  user_name: string | null;
  user_role: string | null;
  user_location: string | null;
  rating: number | null;
  status: string | null;
  is_approved: boolean | null;
  is_published: boolean | null;
  admin_notes: string | null;
  invitation_id: string | null;
  consent_given: boolean | null;
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
}

type SortField = 'user_name' | 'created_at' | 'status' | 'rating';
type SortDirection = 'asc' | 'desc';

export default function AdminTestimonials() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSuperAdminAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/super-admin-signin?returnTo=/admin/invitations/testimonials');
    } else if (isAuthenticated) {
      loadTestimonials();
    }
  }, [isAuthenticated, authLoading, router]);

  const loadTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for super admin session first (WebAuthn)
      const superAdminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const superAdminExpires = typeof window !== 'undefined' ? localStorage.getItem('admin_session_expires') : null;
      
      let authToken: string | null = null;
      
      // If super admin session exists and is valid, use it
      if (superAdminToken && superAdminExpires) {
        const expiresAt = new Date(superAdminExpires);
        if (expiresAt > new Date()) {
          authToken = superAdminToken;
          console.log('✅ Using super admin token for API call');
        }
      }
      
      // Fallback to Supabase session if no super admin token
      if (!authToken) {
        try {
          const sessionResult = await supabase.auth.getSession();
          const session = sessionResult.data?.session;
          
          if (session?.access_token) {
            authToken = session.access_token;
            console.log('✅ Using Supabase session token for API call');
          }
        } catch (sessionError: any) {
          console.warn('Supabase session check failed:', sessionError);
        }
      }
      
      if (!authToken) {
        setError('Please sign in to access this page');
        setLoading(false);
        return;
      }

      const statusParam = selectedStatus === 'all' ? '' : `&status=${selectedStatus}`;
      const response = await fetch(`/api/admin/testimonials?page=1&limit=100${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('You do not have permission to access this page');
          setLoading(false);
          return;
        }
        throw new Error('Failed to load testimonials');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setTestimonials(result.data.map((t: any) => ({
          ...t,
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || null,
          published_at: t.published_at || null
        })));
      } else {
        setTestimonials([]);
      }
      setLoading(false);
    } catch (error) {
      logger.error('Failed to load testimonials');
      setError('Failed to load testimonials');
      setLoading(false);
    }
  }, [selectedStatus]);

  const handleReviewTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setReviewNotes(testimonial.admin_notes || '');
    setShowModal(true);
  };

  const handleSubmitReview = async (action: 'approve' | 'reject' | 'publish' | 'unpublish') => {
    if (!selectedTestimonial) return;

    try {
      setProcessing(selectedTestimonial.id);
      
      const superAdminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const superAdminExpires = typeof window !== 'undefined' ? localStorage.getItem('admin_session_expires') : null;
      
      let authToken: string | null = null;
      
      if (superAdminToken && superAdminExpires) {
        const expiresAt = new Date(superAdminExpires);
        if (expiresAt > new Date()) {
          authToken = superAdminToken;
        }
      }
      
      if (!authToken) {
        const sessionResult = await supabase.auth.getSession();
        authToken = sessionResult.data?.session?.access_token || null;
      }
      
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          testimonialId: selectedTestimonial.id,
          adminNotes: reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to review testimonial');
      }

      await loadTestimonials();
      setShowModal(false);
      setSelectedTestimonial(null);
      setReviewNotes('');
      setProcessing(null);
    } catch (error) {
      logger.error('Failed to review testimonial');
      setError('Failed to review testimonial');
      setProcessing(null);
    }
  };

  const getStatusColor = (testimonial: Testimonial) => {
    if (testimonial.is_published) return 'bg-green-100 text-green-800';
    if (testimonial.is_approved) return 'bg-blue-100 text-blue-800';
    if (testimonial.status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (testimonial: Testimonial) => {
    if (testimonial.is_published) return 'Published';
    if (testimonial.is_approved) return 'Approved';
    if (testimonial.status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  // Search and filter testimonials
  useEffect(() => {
    let filtered = [...testimonials];

    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'pending') {
        filtered = filtered.filter(t => !t.is_approved && !t.is_published);
      } else if (selectedStatus === 'approved') {
        filtered = filtered.filter(t => t.is_approved && !t.is_published);
      } else if (selectedStatus === 'published') {
        filtered = filtered.filter(t => t.is_published);
      } else if (selectedStatus === 'rejected') {
        filtered = filtered.filter(t => t.status === 'rejected');
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.content && t.content.toLowerCase().includes(query)) ||
        (t.user_name && t.user_name.toLowerCase().includes(query)) ||
        (t.user_role && t.user_role.toLowerCase().includes(query))
      );
    }

    // Sort testimonials
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'user_name':
          aValue = a.user_name || '';
          bValue = b.user_name || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'status':
          aValue = getStatusText(a);
          bValue = getStatusText(b);
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredTestimonials(filtered);
  }, [testimonials, selectedStatus, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  if (error && !testimonials.length) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
            <Link
              href="/admin"
              className="mt-4 inline-block bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Testimonials Management</h1>
              <p className="text-gray-600 mt-2">Review and manage user testimonials</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by content, name, or role..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Stats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
              <div className="text-2xl font-bold text-emerald-600">
                {filteredTestimonials.length} / {testimonials.length}
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('user_name')}
                      className="hover:text-gray-700"
                    >
                      User {sortField === 'user_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('rating')}
                      className="hover:text-gray-700"
                    >
                      Rating {sortField === 'rating' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="hover:text-gray-700"
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="hover:text-gray-700"
                    >
                      Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTestimonials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No testimonials found'}
                    </td>
                  </tr>
                ) : (
                  filteredTestimonials.map((testimonial) => (
                    <tr key={testimonial.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {testimonial.user_name || 'Anonymous'}
                        </div>
                        {testimonial.user_role && (
                          <div className="text-sm text-gray-500">{testimonial.user_role}</div>
                        )}
                        {testimonial.user_location && (
                          <div className="text-xs text-gray-400">{testimonial.user_location}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {testimonial.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {testimonial.rating ? (
                          <div className="flex items-center">
                            <span className="text-yellow-400">★</span>
                            <span className="ml-1 text-sm text-gray-900">{testimonial.rating}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(testimonial)}`}>
                          {getStatusText(testimonial)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(testimonial.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleReviewTestimonial(testimonial)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Modal */}
        {showModal && selectedTestimonial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Testimonial</h2>
                
                <div className="mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="font-semibold text-gray-900 mb-2">
                      {selectedTestimonial.user_name || 'Anonymous'}
                      {selectedTestimonial.user_role && ` - ${selectedTestimonial.user_role}`}
                    </div>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {selectedTestimonial.content}
                    </div>
                    {selectedTestimonial.rating && (
                      <div className="mt-2 text-yellow-400">
                        {'★'.repeat(selectedTestimonial.rating)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Add notes about this testimonial..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleSubmitReview('approve')}
                    disabled={processing === selectedTestimonial.id}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {processing === selectedTestimonial.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleSubmitReview('publish')}
                    disabled={processing === selectedTestimonial.id || !selectedTestimonial.is_approved}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {processing === selectedTestimonial.id ? 'Processing...' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleSubmitReview('reject')}
                    disabled={processing === selectedTestimonial.id}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {processing === selectedTestimonial.id ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedTestimonial(null);
                      setReviewNotes('');
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


