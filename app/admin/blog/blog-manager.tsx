'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  tags: string[];
  category: string;
  reading_time: number;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  is_premium: boolean;
  pricing_tier?: string;
  location_restrictions?: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  is_active: boolean;
  post_count: number;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  post_count: number;
}

export default function BlogManager() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BlogPost>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Default categories
  const defaultCategories = [
    { name: 'Technology', slug: 'technology', description: 'Tech-related articles', color: '#3B82F6' },
    { name: 'Business', slug: 'business', description: 'Business insights and strategies', color: '#10B981' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle and wellness content', color: '#F59E0B' },
    { name: 'Education', slug: 'education', description: 'Educational content and tutorials', color: '#8B5CF6' },
    { name: 'News', slug: 'news', description: 'Latest news and updates', color: '#EF4444' }
  ];

  // Default tags
  const defaultTags = [
    { name: 'AI', slug: 'ai', color: '#3B82F6' },
    { name: 'Startup', slug: 'startup', color: '#10B981' },
    { name: 'Productivity', slug: 'productivity', color: '#F59E0B' },
    { name: 'Marketing', slug: 'marketing', color: '#8B5CF6' },
    { name: 'Design', slug: 'design', color: '#EF4444' },
    { name: 'Development', slug: 'development', color: '#06B6D4' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load blog posts with author info
      const { data: postsData, error: postsError } = await (supabase as any)
        .from('blog_posts')
        .select(`
          *,
          author:users(name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setBlogPosts(postsData || []);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await (supabase as any)
        .from('blog_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load tags
      const { data: tagsData, error: tagsError } = await (supabase as any)
        .from('blog_tags')
        .select('*')
        .order('name');

      if (tagsError) throw tagsError;
      setTags(tagsData || []);

    } catch (error) {
      console.error('Error loading blog data:', error);
      alert('Failed to load blog data');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (postId: string) => {
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
      setEditingPost(postId);
      setEditValues({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status,
        category: post.category,
        tags: post.tags,
        is_featured: post.is_featured,
        is_premium: post.is_premium,
        pricing_tier: post.pricing_tier,
        location_restrictions: post.location_restrictions
      });
    }
  };

  const saveEdit = async () => {
    if (!editingPost) return;

    try {
      setLoading(true);
      
      const { error } = await (supabase as any)
        .from('blog_posts')
        .update({
          title: editValues.title,
          content: editValues.content,
          excerpt: editValues.excerpt,
          status: editValues.status,
          category: editValues.category,
          tags: editValues.tags,
          is_featured: editValues.is_featured,
          is_premium: editValues.is_premium,
          pricing_tier: editValues.pricing_tier,
          location_restrictions: editValues.location_restrictions,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost);

      if (error) throw error;

      await loadData();
      setEditingPost(null);
      setEditValues({});
      alert('Blog post updated successfully!');
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert('Failed to save blog post');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditValues({});
  };

  const createNewPost = async () => {
    const title = prompt('Enter blog post title:');
    if (!title) return;

    const excerpt = prompt('Enter blog post excerpt:');
    if (!excerpt) return;

    const content = prompt('Enter blog post content:');
    if (!content) return;

    try {
      setLoading(true);
      
      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Calculate reading time (assuming 200 words per minute)
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      const { error } = await (supabase as any)
        .from('blog_posts')
        .insert({
          title,
          slug,
          content,
          excerpt,
          author_id: 'current-user-id', // This should be the actual current user ID
          status: 'draft',
          category: 'general',
          tags: [],
          reading_time: readingTime,
          view_count: 0,
          like_count: 0,
          is_featured: false,
          is_premium: false
        });

      if (error) throw error;

      await loadData();
      alert('Blog post created successfully!');
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert('Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  const setupDefaultData = async () => {
    if (!confirm('Setup default categories and tags?')) return;

    try {
      setLoading(true);
      
      // Insert default categories
      for (const category of defaultCategories) {
        const { error } = await (supabase as any)
          .from('blog_categories')
          .upsert({
            name: category.name,
            slug: category.slug,
            description: category.description,
            color: category.color,
            is_active: true
          }, {
            onConflict: 'slug'
          });

        if (error) throw error;
      }

      // Insert default tags
      for (const tag of defaultTags) {
        const { error } = await (supabase as any)
          .from('blog_tags')
          .upsert({
            name: tag.name,
            slug: tag.slug,
            color: tag.color
          }, {
            onConflict: 'slug'
          });

        if (error) throw error;
      }

      await loadData();
      alert('Default categories and tags created successfully!');
    } catch (error) {
      console.error('Error setting up default data:', error);
      alert('Failed to setup default data');
    } finally {
      setLoading(false);
    }
  };

  const togglePostStatus = async (postId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('blog_posts')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
      await loadData();
      alert(`Post ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating post status:', error);
      alert('Failed to update post status');
    }
  };

  const filteredPosts = blogPosts.filter(post => 
    (selectedStatus.length === 0 || selectedStatus.includes(post.status)) &&
    (selectedCategories.length === 0 || selectedCategories.includes(post.category)) &&
    (selectedTags.length === 0 || post.tags.some(tag => selectedTags.includes(tag)))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
        <p className="text-gray-600 mt-2">
          Manage blog posts, categories, and tags with location-based features and pricing integration
        </p>
      </div>

      {/* Setup Default Data */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup</h2>
        <div className="flex space-x-4">
          <button
            onClick={setupDefaultData}
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
          >
            📋 Setup Default Categories & Tags
          </button>
          <button
            onClick={createNewPost}
            className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
          >
            ➕ Create New Post
          </button>
        </div>
      </div>

      {/* Categories and Tags Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories ({categories.length})</h2>
          <div className="space-y-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <span className="text-xs text-gray-500">{category.post_count} posts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags ({tags.length})</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                style={{ 
                  backgroundColor: `${tag.color}20`, 
                  color: tag.color,
                  border: `1px solid ${tag.color}40`
                }}
              >
                {tag.name} ({tag.post_count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {['draft', 'published', 'archived'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(prev => 
                      prev.includes(status) 
                        ? prev.filter(s => s !== status)
                        : [...prev, status]
                    );
                  }}
                  className={`px-3 py-1 text-xs rounded-full border capitalize ${
                    selectedStatus.includes(status)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {categories.map(category => (
                <button
                  key={category.slug}
                  onClick={() => {
                    setSelectedCategories(prev => 
                      prev.includes(category.slug) 
                        ? prev.filter(c => c !== category.slug)
                        : [...prev, category.slug]
                    );
                  }}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    selectedCategories.includes(category.slug)
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tags.map(tag => (
                <button
                  key={tag.slug}
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag.slug) 
                        ? prev.filter(t => t !== tag.slug)
                        : [...prev, tag.slug]
                    );
                  }}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    selectedTags.includes(tag.slug)
                      ? 'bg-purple-100 border-purple-300 text-purple-800'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Advanced Options</h2>
            <p className="text-sm text-gray-600">Show premium content and location restrictions</p>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showAdvanced 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showAdvanced ? '✅ Advanced' : '⚙️ Advanced'}
          </button>
        </div>
      </div>

      {/* Blog Posts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Blog Posts ({filteredPosts.length})</h2>
          <p className="text-sm text-gray-600">Manage your blog content</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likes</th>
                {showAdvanced && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">{post.excerpt}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.author?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' :
                      post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.view_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.like_count}
                  </td>
                  {showAdvanced && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPost === post.id ? (
                          <select
                            value={editValues.is_premium ? 'true' : 'false'}
                            onChange={(e) => setEditValues(prev => ({ ...prev, is_premium: e.target.value === 'true' }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="false">Free</option>
                            <option value="true">Premium</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            post.is_premium ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {post.is_premium ? 'Premium' : 'Free'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPost === post.id ? (
                          <select
                            value={editValues.is_featured ? 'true' : 'false'}
                            onChange={(e) => setEditValues(prev => ({ ...prev, is_featured: e.target.value === 'true' }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            post.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {post.is_featured ? 'Featured' : 'Regular'}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingPost === post.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900"
                        >
                          💾 Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-600 hover:text-red-900"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(post.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ✏️ Edit
                        </button>
                        {post.status === 'draft' && (
                          <button
                            onClick={() => togglePostStatus(post.id, 'published')}
                            className="text-green-600 hover:text-green-900"
                          >
                            📤 Publish
                          </button>
                        )}
                        {post.status === 'published' && (
                          <button
                            onClick={() => togglePostStatus(post.id, 'archived')}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            📦 Archive
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">
          Showing {filteredPosts.length} blog posts
          {selectedStatus.length > 0 && ` with status: ${selectedStatus.join(', ')}`}
          {selectedCategories.length > 0 && ` in categories: ${selectedCategories.join(', ')}`}
          {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
          <br />
          Total categories: {categories.length} | Total tags: {tags.length}
        </div>
      </div>
    </div>
  );
}
