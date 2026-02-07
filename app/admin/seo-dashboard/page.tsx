'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  audit: any;
  content_performance: any;
  seo_metrics: any;
  digital_assets: any;
  recommendations: any[];
  backlink_opportunities: any;
  content_suggestions: any[];
  analytics: any;
}

export default function SEODashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seo/dashboard?analytics=true');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading SEO Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SEO Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Real-time SEO analytics, content performance, and recommendations
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Auto-refresh</span>
              </label>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  🏠 Admin Dashboard
                </button>
                <button
                  onClick={() => router.push('/admin/blog-audit')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  🔍 Run Audit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">SEO Completeness</div>
            <div className={`text-3xl font-bold ${getScoreColor(data.audit.seo_completeness_percentage)}`}>
              {data.audit.seo_completeness_percentage}%
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {data.audit.posts_with_complete_seo} / {data.audit.total_posts} posts
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Average SEO Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(data.seo_metrics.average_seo_score)}`}>
              {data.seo_metrics.average_seo_score}/100
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {data.seo_metrics.posts_well_optimized} well optimized
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Content</div>
            <div className="text-3xl font-bold text-gray-900">
              {data.digital_assets.total_blog_posts}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {data.digital_assets.published} published
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Total Views</div>
            <div className="text-3xl font-bold text-gray-900">
              {data.content_performance.total_views.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Avg: {data.content_performance.average_views_per_post} per post
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        {data.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Top Recommendations</h2>
            <div className="space-y-3">
              {data.recommendations.slice(0, 5).map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className={`border-l-4 rounded p-4 ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{rec.title}</span>
                        <span className="text-xs px-2 py-1 rounded bg-white/50">
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{rec.description}</p>
                      <p className="text-xs font-medium">Action: {rec.action}</p>
                    </div>
                    <div className="text-right text-xs">
                      <div>Impact: {rec.impact}</div>
                      <div>Effort: {rec.effort}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {data.recommendations.length > 5 && (
              <button
                onClick={() => router.push('/admin/blog-audit')}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all {data.recommendations.length} recommendations →
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Content Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Content Performance</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">
                  {data.content_performance.total_views.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Total Views</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">
                  {data.content_performance.total_likes}
                </div>
                <div className="text-xs text-gray-600">Total Likes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">
                  {data.content_performance.total_comments}
                </div>
                <div className="text-xs text-gray-600">Comments</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Performing Content</h3>
              <div className="space-y-2">
                {data.content_performance.top_performing.slice(0, 5).map((post: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="truncate flex-1">{post.title}</span>
                    <span className="text-gray-600 ml-2">{post.engagement_score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Content by Category</h3>
              <div className="space-y-1">
                {Object.entries(data.content_performance.by_category).map(([cat, count]: any) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span>{cat}</span>
                    <span className="font-medium">{count} posts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Digital Assets */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📁 Digital Assets</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Content Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-green-50 rounded text-center">
                    <div className="text-xl font-bold text-green-600">{data.digital_assets.published}</div>
                    <div className="text-xs text-green-700">Published</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded text-center">
                    <div className="text-xl font-bold text-yellow-600">{data.digital_assets.pending}</div>
                    <div className="text-xs text-yellow-700">Pending</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded text-center">
                    <div className="text-xl font-bold text-gray-600">{data.digital_assets.draft}</div>
                    <div className="text-xs text-gray-700">Draft</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Content Quality</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Posts with Images</span>
                    <span className="font-medium">{data.digital_assets.with_images} / {data.digital_assets.total_blog_posts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories</span>
                    <span className="font-medium">{data.digital_assets.categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tags</span>
                    <span className="font-medium">{data.digital_assets.total_tags}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Posts</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {data.digital_assets.recent_posts.slice(0, 5).map((post: any) => (
                    <div key={post.id} className="text-xs p-2 bg-gray-50 rounded">
                      <div className="font-medium truncate">{post.title}</div>
                      <div className="text-gray-500">{post.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backlink Opportunities & Content Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Backlink Opportunities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔗 Backlink Opportunities</h2>
            <div className="space-y-3">
              {data.backlink_opportunities.opportunities.map((opp: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{opp.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(opp.priority)}`}>
                      {opp.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>Potential: {opp.potential_links} links</span>
                    <span>Difficulty: {opp.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <strong>Total Opportunities:</strong> {data.backlink_opportunities.total_opportunities} links
              <br />
              <strong>Estimated Time:</strong> {data.backlink_opportunities.estimated_time_to_implement}
            </div>
          </div>

          {/* Content Suggestions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Content Suggestions</h2>
            <div className="space-y-3">
              {data.content_suggestions.map((suggestion: any, idx: number) => (
                <div key={idx} className="border-l-4 border-blue-400 bg-blue-50 rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{suggestion.description}</p>
                  <div className="mt-2 text-xs text-gray-600">
                    Impact: {suggestion.estimated_impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEO Metrics Detail */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 SEO Metrics Detail</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Published Posts</div>
              <div className="text-2xl font-bold text-gray-900">{data.seo_metrics.total_published}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Well Optimized</div>
              <div className="text-2xl font-bold text-green-600">{data.seo_metrics.posts_well_optimized}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Need Optimization</div>
              <div className="text-2xl font-bold text-red-600">{data.seo_metrics.posts_need_optimization}</div>
            </div>
          </div>
          
          {data.seo_metrics.detailed_analysis.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Posts Needing Optimization</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-center">SEO Score</th>
                      <th className="px-4 py-2 text-center">Title</th>
                      <th className="px-4 py-2 text-center">Meta</th>
                      <th className="px-4 py-2 text-center">Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.seo_metrics.detailed_analysis
                      .filter((p: any) => p.seo_score < 70)
                      .slice(0, 10)
                      .map((post: any) => (
                        <tr key={post.id} className="border-t">
                          <td className="px-4 py-2">
                            <a
                              href={`/admin/blog-management/edit/${post.id}`}
                              className="text-blue-600 hover:underline truncate block max-w-xs"
                            >
                              {post.title}
                            </a>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`font-bold ${getScoreColor(post.seo_score)}`}>
                              {post.seo_score}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {post.title_optimal ? '✅' : '❌'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {post.meta_optimal ? '✅' : '❌'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {post.content_optimal ? '✅' : '❌'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Google Analytics Status */}
        {data.analytics && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Google Analytics</h2>
            {data.analytics.enabled ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Sessions</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.analytics.data.sessions.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Users</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.analytics.data.users.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Pageviews</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.analytics.data.pageviews.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Bounce Rate</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.analytics.data.bounce_rate}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Analytics Not Configured</h3>
                <p className="text-sm text-yellow-800 mb-3">{data.analytics.message}</p>
                <div className="text-sm text-yellow-700">
                  <strong>Setup Steps:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {data.analytics.setup_steps.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/blog-audit')}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-left"
            >
              <div className="font-semibold text-emerald-900">Run Audit</div>
              <div className="text-xs text-emerald-700 mt-1">Check all posts</div>
            </button>
            <button
              onClick={() => router.push('/admin/blog-management')}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="font-semibold text-blue-900">Manage Posts</div>
              <div className="text-xs text-blue-700 mt-1">Edit content</div>
            </button>
            <button
              onClick={() => router.push('/blog/create')}
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <div className="font-semibold text-purple-900">Create Post</div>
              <div className="text-xs text-purple-700 mt-1">New content</div>
            </button>
            <button
              onClick={fetchDashboardData}
              className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900">Refresh Data</div>
              <div className="text-xs text-gray-700 mt-1">Update metrics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
