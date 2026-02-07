'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/drishiq-i18n';
import Link from 'next/link';
import Image from 'next/image';

// Prevent static generation to avoid prerender errors
export const dynamic = 'force-dynamic';

interface SearchResult {
  title: string;
  description?: string;
  excerpt?: string;
  content?: string;
  type: 'blog' | 'testimonial' | 'page' | 'service' | 'article';
  url: string;
  translationKey?: string;
  publishedAt?: string;
  author?: string;
  category?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get search query from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const results = await searchWebsiteContent(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const searchWebsiteContent = async (query: string): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    console.log('🔍 Starting website search for:', query);
    
    // Search in blog posts from database
    try {
      const blogResponse = await fetch(`/api/blog/search?q=${encodeURIComponent(query)}`);
      if (blogResponse.ok) {
        const blogData = await blogResponse.json();
        const blogResults = Array.isArray(blogData) ? blogData : (blogData?.data || []);
        console.log('📝 Found', blogResults.length, 'blog results');
        results.push(...blogResults.map((post: any) => ({
          title: post.title,
          description: post.excerpt || post.description,
          excerpt: post.excerpt,
          type: 'blog' as const,
          url: `/blog/${post.slug}`,
          publishedAt: post.published_at,
          author: post.author,
          category: post.category
        })));
      }
    } catch (error) {
      console.log('Blog search failed:', error);
    }
    
    // Search in static blog posts (existing pages)
    const staticBlogPosts: SearchResult[] = [
      {
        title: 'How to Build Self-Awareness',
        description: 'Learn practical techniques to develop self-awareness and understand yourself better',
        excerpt: 'Self-awareness is the foundation of personal growth. This comprehensive guide will help you understand yourself better and make more conscious decisions.',
        type: 'blog',
        url: '/blog/how-to-build-self-awareness',
        publishedAt: '2024-01-15',
        author: 'DrishiQ Team',
        category: 'Personal Growth'
      },
      {
        title: 'Mindful Decision Making',
        description: 'Discover how to make better decisions through mindfulness and conscious thinking',
        excerpt: 'Learn the art of mindful decision making and how it can transform your life choices and outcomes.',
        type: 'blog',
        url: '/blog/mindful-decision-making',
        publishedAt: '2024-01-20',
        author: 'DrishiQ Team',
        category: 'Mindfulness'
      },
      {
        title: 'Personal Growth Journeys',
        description: 'Explore different paths to personal development and self-improvement',
        excerpt: 'Every personal growth journey is unique. Discover various approaches and strategies that can help you on your path to self-improvement.',
        type: 'blog',
        url: '/blog/personal-growth-journeys',
        publishedAt: '2024-01-25',
        author: 'DrishiQ Team',
        category: 'Personal Development'
      }
    ];
    
    const staticBlogResults = staticBlogPosts.filter(post => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      (post.description && post.description.toLowerCase().includes(query.toLowerCase())) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(query.toLowerCase())) ||
      (post.category && post.category.toLowerCase().includes(query.toLowerCase()))
    );
    
    results.push(...staticBlogResults);
    
    // Search in testimonials
    try {
      const testimonialResponse = await fetch(`/api/testimonials?search=${encodeURIComponent(query)}`);
      if (testimonialResponse.ok) {
        const testimonialResults = await testimonialResponse.json();
        console.log('💬 Found', testimonialResults.testimonials?.length || 0, 'testimonial results');
        results.push(...(testimonialResults.testimonials || []).map((testimonial: any) => ({
          title: testimonial.title || 'Testimonial',
          description: testimonial.content,
          excerpt: testimonial.content?.substring(0, 150) + '...',
          type: 'testimonial' as const,
          url: `/testimonials#${testimonial.id}`,
          publishedAt: testimonial.created_at
        })));
      }
    } catch (error) {
      console.log('Testimonial search failed:', error);
    }
    
    // Search in services and pages
    const staticContent: SearchResult[] = [
      // Services
      { title: 'Career Guidance', description: 'Professional development and career planning services', type: 'service', url: '/#areas' },
      { title: 'Relationship Support', description: 'Personal and professional relationship guidance', type: 'service', url: '/#areas' },
      { title: 'Mental Wellness', description: 'Emotional and psychological well-being support', type: 'service', url: '/#areas' },
      { title: 'Life Transitions', description: 'Support for major life changes and adaptations', type: 'service', url: '/#areas' },
      { title: 'Personal Growth', description: 'Self-improvement and personal development', type: 'service', url: '/#areas' },
      
      // Pages
      { title: 'About DrishiQ', description: 'Learn about our mission and approach to personal development', type: 'page', url: '/#about' },
      { title: 'Community', description: 'Join our community of growth-minded individuals', type: 'page', url: '/community' },
      { title: 'Testimonials', description: 'Read success stories from our community members', type: 'page', url: '/testimonials' },
      { title: 'Pricing', description: 'View our service packages and pricing options', type: 'page', url: '/pricing' },
      { title: 'Blog', description: 'Read our latest articles on personal growth and development', type: 'page', url: '/blog' },
      { title: 'Meet Yourself', description: 'Discover your personality type and growth path', type: 'page', url: '/meet-yourself' },
      { title: 'Invitation', description: 'Get invited to join DrishiQ community', type: 'page', url: '/invitation' },
      { title: 'Terms & Conditions', description: 'Read our terms and conditions', type: 'page', url: '/terms' },
      { title: 'Support', description: 'Get help and support from our team', type: 'page', url: '/support' },
      
      // Meet Yourself Types
      { title: 'The Dependent', description: 'Learn about the Dependent personality type', type: 'page', url: '/meet-yourself/dependent' },
      { title: 'The Builder', description: 'Learn about the Builder personality type', type: 'page', url: '/meet-yourself/builder' },
      { title: 'The Connector', description: 'Learn about the Connector personality type', type: 'page', url: '/meet-yourself/connector' },
      { title: 'The Escaper', description: 'Learn about the Escaper personality type', type: 'page', url: '/meet-yourself/escaper' },
      { title: 'The Giver', description: 'Learn about the Giver personality type', type: 'page', url: '/meet-yourself/giver' },
      { title: 'The Problem Carrier', description: 'Learn about the Problem Carrier personality type', type: 'page', url: '/meet-yourself/problem-carrier' },
      { title: 'The Rebooter', description: 'Learn about the Rebooter personality type', type: 'page', url: '/meet-yourself/rebooter' },
      { title: 'The Seeker', description: 'Learn about the Seeker personality type', type: 'page', url: '/meet-yourself/seeker' },
      { title: 'The Solo', description: 'Learn about the Solo personality type', type: 'page', url: '/meet-yourself/solo' }
    ];
    
    const staticResults = staticContent.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    results.push(...staticResults);
    
    // Sort results by relevance (exact matches first, then by type priority)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query.toLowerCase();
      const bExact = b.title.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Prioritize by type: blog > testimonial > service > page
      const typeOrder: Record<string, number> = { blog: 0, testimonial: 1, service: 2, page: 3 };
      return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
    });
    
    console.log('🎉 Total search results:', results.length);
    return results.slice(0, 20); // Limit to 20 results
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return '📝';
      case 'testimonial': return '💬';
      case 'service': return '🎯';
      case 'page': return '📄';
      default: return '🔍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'blog': return 'Blog Post';
      case 'testimonial': return 'Testimonial';
      case 'service': return 'Service';
      case 'page': return 'Page';
      default: return 'Content';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Search DrishiQ
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles, services, testimonials..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                🔍
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Searching...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {hasSearched && !isSearching && (
          <div>
            {searchResults.length > 0 ? (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
                
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getTypeIcon(result.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Link
                              href={result.url}
                              className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {result.title}
                            </Link>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                              {getTypeLabel(result.type)}
                            </span>
                          </div>
                          
                          {result.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              {result.description}
                            </p>
                          )}
                          
                          {result.excerpt && (
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {result.excerpt}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-500">
                            {result.publishedAt && (
                              <span>Published: {new Date(result.publishedAt).toLocaleDateString()}</span>
                            )}
                            {result.author && (
                              <span>By {result.author}</span>
                            )}
                            {result.category && (
                              <span>Category: {result.category}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </div>
        )}

        {!hasSearched && !isSearching && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start your search
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Search for articles, services, testimonials, and more
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
