'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../lib/drishiq-i18n';
import { 
  Zap, Flame, Heart, Brain, Search, Sun, Compass, 
  Flower2, Briefcase, Rocket, Scale, FileText, 
  MessageCircle, Eye, Clock, ArrowRight
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featured_image: string | null;
  author: string;
  category: string;
  publish_date: string;
  reading_time_minutes: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
}

interface FeaturedBlogResponse {
  success: boolean;
  posts: BlogPost[];
  isFeatured: boolean;
  message: string;
}

const FeaturedBlogCards: React.FC = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    fetchFeaturedPosts();
  }, []);

  const fetchFeaturedPosts = async () => {
    try {
      setLoading(true);
      // Get current language from localStorage or default to 'en'
      const language = (typeof window !== 'undefined' && localStorage.getItem('i18nextLng')) || 'en';
      const response = await fetch(`/api/blog/posts?featured=true&limit=3&language=${language}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data || []);
        setIsFeatured(true);
      } else {
        setError('Failed to load blog posts');
      }
    } catch (err) {
      console.error('Error fetching featured posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'productivity': <Zap size={14} />,
      'motivation': <Flame size={14} />,
      'relationships': <Heart size={14} />,
      'mental-health': <Brain size={14} />,
      'self-reflection': <Search size={14} />,
      'clarity': <Sun size={14} />,
      'decision-making': <Compass size={14} />,
      'mindfulness': <Flower2 size={14} />,
      'leadership': <Briefcase size={14} />,
      'career-development': <Rocket size={14} />,
      'life-balance': <Scale size={14} />
    };
    return icons[category] || <FileText size={14} />;
  };

  if (loading) {
    return (
      <div className="blog-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="card-image-container animate-pulse bg-gray-200" style={{ height: '200px' }}></div>
            <div className="card-content">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-grid">
        <div className="col-span-full text-center py-8">
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchFeaturedPosts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="blog-grid">
        <div className="col-span-full text-center py-8">
          <p className="text-gray-600">No blog posts available yet.</p>
          <Link 
            href="/blog/create-enhanced"
            className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Write the First Post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Featured indicator */}
      {isFeatured && (
        <div className="text-center">
        </div>
      )}

      <div className="blog-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '1.5rem',
        maxWidth: '100%'
      }}>
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="block cursor-pointer">
            <article className="card group hover:shadow-lg transition-all duration-300">
              {/* Featured Image */}
              <div className="card-image-container relative overflow-hidden" style={{ height: '200px' }}>
                {post.featured_image ? (
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Image
                    src="/assets/banners/images/mistycloud.webp"
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800">
                    {getCategoryIcon(post.category)} {post.category.replace('-', ' ')}
                  </span>
                </div>

                {/* Engagement overlay */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  {post.likes_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/90 text-gray-800">
                      <Heart size={12} /> {post.likes_count}
                    </span>
                  )}
                  {post.comments_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/90 text-gray-800">
                      <MessageCircle size={12} /> {post.comments_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="card-content p-6">
                {/* Meta info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>By {post.author}</span>
                  <span>{formatDate(post.publish_date)}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {post.reading_time_minutes} min read
                    </span>
                    {post.views_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Eye size={12} /> {post.views_count} views
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:underline">
                    {t('blog.read_more')} <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBlogCards;



