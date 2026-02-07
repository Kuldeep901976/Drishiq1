'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  submitterEmail: string;
  submitterName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
}

const ROW_HEIGHT = 320;
const COLS = 3;

function StoryCard({
  story,
  getCategoryColor,
  getStatusColor,
  onReview,
  onQuickApprove,
  onQuickReject,
  processingId,
}: {
  story: Story;
  getCategoryColor: (c: string) => string;
  getStatusColor: (s: string) => string;
  onReview: (s: Story) => void;
  onQuickApprove: (s: Story) => void;
  onQuickReject: (s: Story) => void;
  processingId: string | null;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(story.category)}`}>
          {story.category}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
          {story.status}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{story.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{story.content}</p>
      <div className="flex flex-wrap gap-1 mb-4">
        {story.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {tag}
          </span>
        ))}
        {story.tags.length > 3 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            +{story.tags.length - 3}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-500 mb-4">
        <p>By: {story.submitterName}</p>
        <p>Submitted: {story.createdAt.toLocaleDateString()}</p>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <button onClick={() => onReview(story)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm">
          Review
        </button>
        {story.status === 'pending' && (
          <div className="flex space-x-2">
            <button onClick={() => onQuickApprove(story)} disabled={processingId === story.id} className="text-green-600 hover:text-green-900 text-sm disabled:opacity-50">
              Quick Approve
            </button>
            <button onClick={() => onQuickReject(story)} disabled={processingId === story.id} className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50">
              Quick Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StoriesVirtualGrid({
  stories,
  getCategoryColor,
  getStatusColor,
  onReview,
  onQuickApprove,
  onQuickReject,
  processingId,
}: {
  stories: Story[];
  getCategoryColor: (c: string) => string;
  getStatusColor: (s: string) => string;
  onReview: (s: Story) => void;
  onQuickApprove: (s: Story) => void;
  onQuickReject: (s: Story) => void;
  processingId: string | null;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(stories.length / COLS);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 2,
  });

  return (
    <div ref={parentRef} className="overflow-auto rounded-lg border border-gray-200" style={{ height: '70vh' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * COLS;
          const rowStories = [0, 1, 2].map((i) => stories[start + i]).filter(Boolean);
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1 py-2"
            >
              {rowStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  getCategoryColor={getCategoryColor}
                  getStatusColor={getStatusColor}
                  onReview={onReview}
                  onQuickApprove={onQuickApprove}
                  onQuickReject={onQuickReject}
                  processingId={processingId}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminStories() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for super admin session first
      const superAdminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const superAdminExpires = typeof window !== 'undefined' ? localStorage.getItem('admin_session_expires') : null;
      
      if (!superAdminToken || !superAdminExpires || new Date(superAdminExpires) <= new Date()) {
        // No valid super admin session, redirect to super admin signin
        const returnTo = `?returnTo=${encodeURIComponent(window.location.pathname)}`;
        router.push(`/admin/super-admin-signin${returnTo}`);
        return;
      }
      
      if (!session) {
        // Also check for regular admin session as fallback
        const returnTo = `?returnTo=${encodeURIComponent(window.location.pathname)}`;
        router.push(`/admin/super-admin-signin${returnTo}`);
        return;
      }

      const statusParam = selectedStatus === 'all' ? '' : `&status=${selectedStatus}`;
      const response = await fetch(`/api/admin/stories?page=1&limit=50${statusParam}`);
      
      if (response.status === 403) {
        setError('You do not have admin access');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load stories');
      }

      const result = await response.json();
      setStories(result.data.map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt),
        reviewedAt: story.reviewedAt ? new Date(story.reviewedAt) : undefined
      })));
      setLoading(false);
    } catch (error) {
      logger.error('Failed to load stories');
      setError('Failed to load stories');
      setLoading(false);
    }
  }, [router, selectedStatus]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleReviewStory = (story: Story) => {
    setSelectedStory(story);
    setReviewNotes(story.adminNotes || '');
    setShowModal(true);
  };

  const handleSubmitReview = async (action: 'approve' | 'reject', grantInvitation: boolean = false) => {
    if (!selectedStory) return;

    try {
      setProcessing(selectedStory.id);
      
      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          storyId: selectedStory.id,
          adminNotes: reviewNotes,
          grantInvitation,
          sendEmail: true
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'challenge': return 'bg-red-100 text-red-800';
      case 'learning': return 'bg-blue-100 text-blue-800';
      case 'inspiration': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stories...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Stories</h1>
              <p className="mt-2 text-sm text-gray-600">
                Moderate and publish user stories
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-w-xs"
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
        </div>

        {/* Stories Grid - virtualized for large lists */}
        {stories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No stories found</p>
          </div>
        )}
        {stories.length > 0 && (
          <StoriesVirtualGrid
            stories={stories}
            getCategoryColor={getCategoryColor}
            getStatusColor={getStatusColor}
            onReview={handleReviewStory}
            onQuickApprove={(story) => {
              setSelectedStory(story);
              handleSubmitReview('approve');
            }}
            onQuickReject={(story) => {
              setSelectedStory(story);
              handleSubmitReview('reject');
            }}
            processingId={processing}
          />
        )}

        {/* Review Modal */}
        {showModal && selectedStory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Story</h3>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900">{selectedStory.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    By: {selectedStory.submitterName} ({selectedStory.submitterEmail})
                  </p>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedStory.content}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Category: <span className="font-medium">{selectedStory.category}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Tags: {selectedStory.tags.join(', ')}
                  </p>
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
                    {processing === selectedStory.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleSubmitReview('approve', true)}
                    disabled={processing === selectedStory.id}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {processing === selectedStory.id ? 'Processing...' : 'Approve + Grant Invitation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
} 
