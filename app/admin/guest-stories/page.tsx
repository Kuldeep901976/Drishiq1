'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface GuestStory {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  phone_number: string | null;
  profession: string | null;
  phone_verified: boolean;
  content: string;
  preferred_language: string | null;
  category: string | null;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_approved: boolean;
  is_published: boolean;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_story_id: string | null;
  magic_link_sent: boolean;
  magic_link_sent_at: string | null;
  consent_given: boolean;
  created_at: string;
  updated_at: string;
}

type SortField = 'name' | 'email' | 'status' | 'created_at' | 'profession';
type SortDirection = 'asc' | 'desc';

export default function AdminGuestStories() {
  const router = useRouter();
  const [stories, setStories] = useState<GuestStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<GuestStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<GuestStory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadStories = useCallback(async () => {
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
          // Continue without Supabase session if super admin is available
        }
      }
      
      if (!authToken) {
        // Admin layout should have handled this, but just in case
        setError('Please sign in to access this page');
        setLoading(false);
        return;
      }

      const statusParam = selectedStatus === 'all' ? '' : `&status=${selectedStatus}`;
      const response = await fetch(`/api/admin/guest-stories?page=1&limit=50${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.status === 403) {
        setError('You do not have admin access');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          const text = await response.text().catch(() => '');
          console.error('Failed to parse error response:', text);
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('📦 API Response:', result);
      
      if (!result.success) {
        const apiError = result.error || result.details || 'Failed to load guest stories';
        console.error('❌ API returned error:', apiError);
        throw new Error(apiError);
      }
      
      const storiesData = result.data || [];
      console.log('✅ Loaded stories:', storiesData.length);
      console.log('📋 Stories data:', storiesData);
      
      if (storiesData.length === 0) {
        console.warn('⚠️ No stories found. Check if stories exist in testimonials_stories table with submission_type = "story"');
      }
      
      setStories(storiesData);
      setFilteredStories(storiesData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading guest stories - Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      
      let errorMessage = 'Failed to load guest stories';
      
      // Extract error message from various possible formats
      if (error && typeof error === 'object') {
        if (error.message && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.toString && typeof error.toString === 'function') {
          const errorStr = error.toString();
          if (errorStr !== '[object Object]' && errorStr !== 'Error') {
            errorMessage = errorStr;
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Ensure we always have a valid error message
      if (!errorMessage || errorMessage === 'undefined' || errorMessage === 'null') {
        errorMessage = 'Failed to load guest stories. Please check your connection and try again.';
      }
      
      console.error('Final error message:', errorMessage);
      logger.error('Failed to load guest stories', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  }, [router, selectedStatus]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleReviewStory = (story: GuestStory) => {
    setSelectedStory(story);
    setReviewNotes(story.admin_notes || '');
    setShowModal(true);
  };

  const handleSubmitReview = async (action: 'approve' | 'reject') => {
    if (!selectedStory) return;

    try {
      setProcessing(selectedStory.id);
      
      const response = await fetch('/api/admin/guest-stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          storyId: selectedStory.id,
          adminNotes: reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to review story');
      }

      await loadStories();
      setShowModal(false);
      setSelectedStory(null);
      setReviewNotes('');
      setProcessing(null);
    } catch (error) {
      logger.error('Failed to review story');
      setError('Failed to review story');
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Search and filter stories
  useEffect(() => {
    let filtered = [...stories];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query) ||
        (s.profession && s.profession.toLowerCase().includes(query)) ||
        (s.category && s.category.toLowerCase().includes(query))
      );
    }

    // Sort stories
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'profession':
          aValue = a.profession || '';
          bValue = b.profession || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredStories(filtered);
  }, [stories, selectedStatus, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStories.map(s => s.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;

    try {
      setProcessing('bulk');
      
      // Get auth token (same logic as loadStories)
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
        try {
          const sessionResult = await supabase.auth.getSession();
          const session = sessionResult.data?.session;
          if (session?.access_token) {
            authToken = session.access_token;
          }
        } catch (sessionError) {
          console.warn('Supabase session check failed:', sessionError);
        }
      }

      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const promises = Array.from(selectedIds).map(id => 
        fetch('/api/admin/guest-stories', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ action, storyId: id, adminNotes: `Bulk ${action}` })
        })
      );

      await Promise.all(promises);
      setSelectedIds(new Set());
      await loadStories();
    } catch (error) {
      logger.error('Bulk action failed', error);
      setError('Failed to perform bulk action');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading guest stories...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Guest Stories</h1>
              <p className="mt-2 text-sm text-gray-600">
                Moderate and approve guest story submissions. Approved stories will be added to testimonials page.
              </p>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              🏠 Admin Dashboard
            </a>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, content, profession..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <button
              onClick={loadStories}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Refresh
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-gray-700">
                {selectedIds.size} story{selectedIds.size !== 1 ? 'ies' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={processing === 'bulk'}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-4 rounded text-sm disabled:opacity-50"
                >
                  {processing === 'bulk' ? 'Processing...' : `Approve ${selectedIds.size}`}
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={processing === 'bulk'}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-4 rounded text-sm disabled:opacity-50"
                >
                  {processing === 'bulk' ? 'Processing...' : `Reject ${selectedIds.size}`}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1.5 px-4 rounded text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stories Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredStories.length && filteredStories.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {sortField === 'name' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {sortField === 'email' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('profession')}
                  >
                    <div className="flex items-center gap-2">
                      Profession
                      {sortField === 'profession' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story Preview
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === 'status' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Submitted
                      {sortField === 'created_at' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStories.map((story) => (
                  <tr key={story.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(story.id)}
                        onChange={() => toggleSelect(story.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{story.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{story.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{story.profession || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {story.country_code && story.phone_number
                          ? `${story.country_code} ${story.phone_number}`
                          : story.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={story.content}>
                        {story.content.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                      {story.magic_link_sent && (
                        <div className="text-xs text-green-600 mt-1">✓ Link sent</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(story.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewStory(story)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </button>
                        {story.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedStory(story);
                                handleSubmitReview('approve');
                              }}
                              disabled={processing === story.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStory(story);
                                handleSubmitReview('reject');
                              }}
                              disabled={processing === story.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredStories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {stories.length === 0 ? 'No guest stories found' : 'No stories match your filters'}
              </p>
            </div>
          )}
        </div>
        
        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredStories.length} of {stories.length} story{stories.length !== 1 ? 'ies' : ''}
        </div>

        {/* Review Modal */}
        {showModal && selectedStory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Guest Story</h3>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900">Guest Information</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Name:</strong> {selectedStory.name}<br />
                    <strong>Email:</strong> {selectedStory.email}<br />
                    {selectedStory.country_code && selectedStory.phone_number ? (
                      <><strong>Phone:</strong> {selectedStory.country_code} {selectedStory.phone_number}<br /></>
                    ) : selectedStory.phone ? (
                      <><strong>Phone:</strong> {selectedStory.phone}<br /></>
                    ) : null}
                    {selectedStory.profession && <><strong>Profession:</strong> {selectedStory.profession}<br /></>}
                    {selectedStory.preferred_language && <><strong>Language:</strong> {selectedStory.preferred_language}</>}
                  </p>
                </div>
                
                {selectedStory.image_url && (
                  <div className="mb-4">
                    <img 
                      src={selectedStory.image_url} 
                      alt="Story" 
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Story Content</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedStory.content}</p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Add review notes..."
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitReview('reject')}
                    disabled={processing === selectedStory.id}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {processing === selectedStory.id ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleSubmitReview('approve')}
                    disabled={processing === selectedStory.id}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {processing === selectedStory.id ? 'Processing...' : 'Approve & Send Magic Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

