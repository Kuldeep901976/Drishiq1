'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface CommunitySuggestion {
  id: number;
  category: string;
  title: string;
  description: string;
  priority: string;
  impact: string;
  additional_details?: string;
  contact_email?: string;
  allow_contact: boolean;
  submitter_name?: string;
  submitter_type: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'implemented';
  created_at: string;
  updated_at: string;
}

export default function AdminCommunitySuggestionsPage() {
  const [suggestions, setSuggestions] = useState<CommunitySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/suggestions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestionStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/community/suggestions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update suggestion status');
      }

      // Update local state
      setSuggestions(prev => 
        prev.map(suggestion => 
          suggestion.id === id 
            ? { ...suggestion, status: newStatus as CommunitySuggestion['status'] }
            : suggestion
        )
      );
    } catch (err) {
      console.error('Error updating suggestion status:', err);
      alert('Failed to update suggestion status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'implemented': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority.includes('Critical')) return 'text-red-600';
    if (priority.includes('High')) return 'text-orange-600';
    if (priority.includes('Medium')) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesStatus = filterStatus === 'all' || suggestion.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || suggestion.category === filterCategory;
    const matchesSearch = suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suggestion.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusCount = (status: string) => {
    return suggestions.filter(s => s.status === status).length;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="content-safe-area min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading suggestions...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="content-safe-area min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Suggestions</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchSuggestions}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="content-safe-area min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Community Suggestions</h1>
                <p className="text-gray-600">Review and manage community feedback and feature requests</p>
              </div>
              <Link
                href="/admin/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-2xl font-bold text-blue-600">{getStatusCount('reviewed')}</div>
                <div className="text-sm text-gray-600">Reviewed</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-2xl font-bold text-green-600">{getStatusCount('approved')}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-2xl font-bold text-red-600">{getStatusCount('rejected')}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-2xl font-bold text-purple-600">{getStatusCount('implemented')}</div>
                <div className="text-sm text-gray-600">Implemented</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="implemented">Implemented</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Community Page Design">Community Page Design</option>
                  <option value="UX">UX</option>
                  <option value="Module">Module</option>
                  <option value="Features">Features</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search suggestions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💡</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{suggestion.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(suggestion.status)}`}>
                              {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {suggestion.category}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)} bg-opacity-10`}>
                              {suggestion.priority.split(' - ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{suggestion.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Priority:</span>
                          <span className={`ml-2 ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Impact:</span>
                          <span className="ml-2 text-gray-600">{suggestion.impact}</span>
                        </div>
                        {suggestion.additional_details && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Additional Details:</span>
                            <p className="mt-1 text-gray-600 text-sm">{suggestion.additional_details}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Submitted:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Submitted by:</span>
                          <span className="ml-2 text-gray-600">
                            {suggestion.submitter_name || 'Anonymous'} ({suggestion.submitter_type})
                          </span>
                        </div>
                        {suggestion.allow_contact && suggestion.contact_email && (
                          <div>
                            <span className="font-medium text-gray-700">Contact:</span>
                            <span className="ml-2 text-gray-600">{suggestion.contact_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="lg:flex-shrink-0">
                      <div className="flex flex-col gap-2">
                        <select
                          value={suggestion.status}
                          onChange={(e) => updateSuggestionStatus(suggestion.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="implemented">Implemented</option>
                        </select>
                        
                        <button
                          onClick={() => {
                            const newStatus = suggestion.status === 'approved' ? 'implemented' : 'approved';
                            updateSuggestionStatus(suggestion.id, newStatus);
                          }}
                          disabled={suggestion.status === 'rejected' || suggestion.status === 'implemented'}
                          className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {suggestion.status === 'approved' ? 'Mark Implemented' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
