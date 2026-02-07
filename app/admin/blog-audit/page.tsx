'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuditStats {
  total_posts: number;
  exact_duplicates_count: number;
  near_duplicates_count: number;
  missing_meta_count: number;
  posts_with_all_meta: number;
  duplicate_posts_affected: number;
}

interface ExactDuplicate {
  content_hash: string;
  post_ids: string[];
  count: number;
  titles: string[];
}

interface NearDuplicate {
  id_a: string;
  id_b: string;
  title_a: string;
  title_b: string;
  slug_a: string;
  slug_b: string;
  similarity_score: number;
}

interface MissingMeta {
  id: string;
  slug: string;
  title: string;
  status: string;
  missing: string[];
  notes: string | null;
}

interface AuditReport {
  success: boolean;
  timestamp: string;
  stats: AuditStats;
  exact_duplicates: ExactDuplicate[];
  near_duplicates: NearDuplicate[];
  missing_meta: MissingMeta[];
  recommendations: string[];
}

export default function BlogAuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [fixing, setFixing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'duplicates' | 'missing-meta'>('overview');

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blog/audit');
      const data = await response.json();
      
      if (data.success) {
        setReport(data);
      } else {
        alert('Failed to run audit: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error running audit:', error);
      alert('Error running audit: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixMissingMeta = async (postIds?: string[]) => {
    const idsToFix = postIds || Array.from(selectedPosts);
    if (idsToFix.length === 0) {
      alert('Please select posts to fix');
      return;
    }

    setFixing(true);
    try {
      const response = await fetch('/api/blog/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_ids: idsToFix, fix_type: 'all' })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully fixed ${data.fixed_count} post(s)`);
        setSelectedPosts(new Set());
        runAudit(); // Refresh audit
      } else {
        alert('Failed to fix posts: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error fixing posts:', error);
      alert('Error fixing posts: ' + error.message);
    } finally {
      setFixing(false);
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const selectAllMissingMeta = () => {
    if (!report) return;
    setSelectedPosts(new Set(report.missing_meta.map(p => p.id)));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog SEO Audit</h1>
              <p className="text-gray-600 mt-2">
                Analyze blog posts for duplicates and missing SEO metadata
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/seo-dashboard')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                📊 SEO Dashboard
              </button>
              <button
                onClick={runAudit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Running Audit...' : 'Run Audit'}
              </button>
            </div>
          </div>
        </div>

        {loading && !report && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Running comprehensive audit...</p>
          </div>
        )}

        {report && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600">Total Posts</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {report.stats.total_posts}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600">Exact Duplicates</div>
                <div className={`text-3xl font-bold mt-2 ${
                  report.stats.exact_duplicates_count > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {report.stats.exact_duplicates_count}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600">Near Duplicates</div>
                <div className={`text-3xl font-bold mt-2 ${
                  report.stats.near_duplicates_count > 0 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {report.stats.near_duplicates_count}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600">Missing SEO Meta</div>
                <div className={`text-3xl font-bold mt-2 ${
                  report.stats.missing_meta_count > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {report.stats.missing_meta_count}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('duplicates')}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === 'duplicates'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Duplicates ({report.stats.exact_duplicates_count + report.stats.near_duplicates_count})
                  </button>
                  <button
                    onClick={() => setActiveTab('missing-meta')}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === 'missing-meta'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Missing SEO ({report.stats.missing_meta_count})
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Exact Duplicates */}
                {report.exact_duplicates.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Exact Duplicates ({report.exact_duplicates.length})
                    </h2>
                    <div className="space-y-4">
                      {report.exact_duplicates.map((dup, idx) => (
                        <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <div className="font-semibold text-red-900 mb-2">
                            {dup.count} duplicate(s) found
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            {dup.titles.map((title, i) => (
                              <div key={i}>• {title}</div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Post IDs: {dup.post_ids.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Near Duplicates */}
                {report.near_duplicates.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Near Duplicates ({report.near_duplicates.length})
                    </h2>
                    <div className="space-y-3">
                      {report.near_duplicates.slice(0, 10).map((dup, idx) => (
                        <div key={idx} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-yellow-900">
                                Similarity: {(dup.similarity_score * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-700 mt-1">
                                <div>• {dup.title_a}</div>
                                <div>• {dup.title_b}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              <div>Slug: {dup.slug_a}</div>
                              <div>Slug: {dup.slug_b}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {report.near_duplicates.length > 10 && (
                        <div className="text-sm text-gray-600 text-center py-2">
                          ... and {report.near_duplicates.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'duplicates' && (
              <div className="space-y-6">
                {/* Exact Duplicates */}
                {report.exact_duplicates.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Exact Duplicates
                    </h2>
                    <div className="space-y-4">
                      {report.exact_duplicates.map((dup, idx) => (
                        <div key={idx} className="border border-red-200 rounded-lg p-4">
                          <div className="font-semibold text-red-900 mb-2">
                            {dup.count} duplicate(s) - Content Hash: {dup.content_hash.substring(0, 16)}...
                          </div>
                          <div className="text-sm text-gray-700 space-y-2">
                            {dup.titles.map((title, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span>• {title}</span>
                                <button
                                  onClick={() => router.push(`/admin/blog-management/edit/${dup.post_ids[i]}`)}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Edit
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Near Duplicates */}
                {report.near_duplicates.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Near Duplicates
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Similarity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post A</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post B</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.near_duplicates.map((dup, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm">
                                <span className={`font-semibold ${
                                  dup.similarity_score >= 0.95 ? 'text-red-600' :
                                  dup.similarity_score >= 0.90 ? 'text-orange-600' :
                                  'text-yellow-600'
                                }`}>
                                  {(dup.similarity_score * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium text-gray-900">{dup.title_a}</div>
                                <div className="text-gray-500 text-xs">{dup.slug_a}</div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium text-gray-900">{dup.title_b}</div>
                                <div className="text-gray-500 text-xs">{dup.slug_b}</div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => router.push(`/admin/blog-management/edit/${dup.id_a}`)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    Edit A
                                  </button>
                                  <button
                                    onClick={() => router.push(`/admin/blog-management/edit/${dup.id_b}`)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    Edit B
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {report.exact_duplicates.length === 0 && report.near_duplicates.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="text-green-600 font-semibold text-lg">✅ No duplicates found!</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'missing-meta' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Posts Missing SEO Metadata ({report.missing_meta.length})
                  </h2>
                  {report.missing_meta.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllMissingMeta}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleFixMissingMeta()}
                        disabled={fixing || selectedPosts.size === 0}
                        className="px-4 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {fixing ? 'Fixing...' : `Fix Selected (${selectedPosts.size})`}
                      </button>
                    </div>
                  )}
                </div>

                {report.missing_meta.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                            <input
                              type="checkbox"
                              checked={selectedPosts.size === report.missing_meta.length && report.missing_meta.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  selectAllMissingMeta();
                                } else {
                                  setSelectedPosts(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing Fields</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.missing_meta.map((post) => (
                          <tr key={post.id} className={selectedPosts.has(post.id) ? 'bg-blue-50' : ''}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedPosts.has(post.id)}
                                onChange={() => togglePostSelection(post.id)}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{post.title}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{post.slug}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                post.status === 'published' ? 'bg-green-100 text-green-800' :
                                post.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {post.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex flex-wrap gap-1">
                                {post.missing.map((field) => (
                                  <span key={field} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleFixMissingMeta([post.id])}
                                  disabled={fixing}
                                  className="text-green-600 hover:text-green-800 text-xs disabled:opacity-50"
                                >
                                  Fix
                                </button>
                                <button
                                  onClick={() => router.push(`/admin/blog-management/edit/${post.id}`)}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="text-green-600 font-semibold text-lg">✅ All posts have complete SEO metadata!</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!loading && !report && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">Click "Run Audit" to analyze your blog posts</p>
          </div>
        )}
      </div>
    </div>
  );
}

