'use client';

import React, { use, useEffect, useState, Suspense } from 'react';
import Footer from '@/components/Footer';
import BlogTTSPlayer from '@/components/BlogTTSPlayer';
import { useLanguage } from '@/lib/drishiq-i18n';
import DOMPurify from 'dompurify';
import { PenLine, Calendar, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';

type BlogPost = {
  id?: string | number;
  title?: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  author?: string;
  published_at?: string;
  likes?: number;
  comments_count?: number;
  slug?: string;
};

function stripHtmlToText(html?: string) {
  if (!html) return '';
  const tmp = html.replace(/<[^>]*>/g, ' ');
  return tmp
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function safeStr(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'message' in v) return String((v as { message: unknown }).message);
  return fallback;
}

function BlogPostContent({ params }: { params: Promise<{ slug: string }> }) {
  // Unwrap params using React.use()
  const { slug } = use(params);
  
  const { loadNamespaces, t, isLoading: i18nLoading, language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [showVideo, setShowVideo] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadNamespaces?.(['blog']).catch(() => {});
      } catch {
        /* swallow */
      }
      if (mounted) {
        // nothing else
      }
    })();
    return () => { mounted = false; };
  }, [loadNamespaces]);

  useEffect(() => {
    let cancelled = false;
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const currentLanguage = language || 'en';
        const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}?language=${currentLanguage}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('NOT_FOUND');
          throw new Error('FETCH_ERROR');
        }
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setPost(json?.data ?? null);
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message === 'NOT_FOUND'
            ? (t('blog.not_found') || 'Post not found')
            : (err?.message || 'Failed to fetch post');
          setError(typeof msg === 'string' ? msg : (msg?.message != null ? String(msg.message) : 'Failed to fetch post'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) fetchPost();
    return () => { cancelled = true; };
  }, [slug, language, t]);

  useEffect(() => {
    let cancelled = false;
    async function loadRelated() {
      try {
        const currentLanguage = language || 'en';
        const r = await fetch(`/api/blog/posts?language=${currentLanguage}`, { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        const items = Array.isArray(j?.data) ? j.data : [];
        const filtered = items.filter((p: any) => p.slug !== slug).slice(0, 2);
        if (!cancelled) setRelated(filtered);
      } catch {
        if (!cancelled) setRelated([]);
      }
    }
    loadRelated();
    return () => { cancelled = true; };
  }, [slug, language]);

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  };

  if (i18nLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4" />
            <p className="text-gray-600">{(() => { const v = t('blog.loading') ?? 'Loading...'; return typeof v === 'string' ? v : 'Loading...'; })()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <>
        <div className="min-h-screen bg-white pt-32">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {(() => { const v = t('blog.not_found_title') ?? 'Article Not Found'; return typeof v === 'string' ? v : 'Article Not Found'; })()}
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                {(() => {
                  const fallback = t('blog.not_found') ?? 'The article you\'re looking for doesn\'t exist or may have been removed.';
                  if (error == null) return typeof fallback === 'string' ? fallback : 'Post not found';
                  if (typeof error === 'string') return error;
                  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
                  return 'Post not found';
                })()}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                {(() => { const v = t('blog.not_found_suggestion') ?? 'Try browsing our other articles or check back later.'; return typeof v === 'string' ? v : 'Try browsing our other articles or check back later.'; })()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/blog"
                className="px-6 py-3 bg-[#1A3D2D] text-white rounded-lg font-medium hover:bg-[#0F2A1E] transition-colors"
              >
                {safeStr(t('blog.browse_articles'), 'Browse Articles')}
              </a>
              <a
                href="/"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {safeStr(t('blog.go_home'), 'Go to Homepage')}
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Prepare TTS content - ONLY ONCE, AFTER post is confirmed to exist
  const ttsTitle = post.title ?? '';
  const ttsBody = stripHtmlToText(post.content ?? '');
  const fullTtsText = `${ttsTitle}. ${ttsBody}`;

  // Debug logs (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Post Data:', {
      title: post.title,
      hasContent: !!post.content,
      contentLength: post.content?.length,
      contentPreview: post.content?.substring(0, 200),
      allPostKeys: Object.keys(post)
    });

    console.log('🔊 TTS Text:', {
      title: ttsTitle,
      bodyLength: ttsBody.length,
      bodyPreview: ttsBody.substring(0, 200),
      fullTextPreview: fullTtsText.substring(0, 200)
    });
  }

  return (
    <>
      <div className="min-h-screen bg-white pt-32">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <article className="prose prose-lg max-w-none">

                {/* Featured Image */}
                {post.featured_image && post.featured_image.trim() && (
                  <div className="mb-6">
                    <img
                      src={imageErrors['featured'] ? '/assets/banners/images/mistycloud.webp' : post.featured_image}
                      alt={safeStr(post.title, 'Featured article image')}
                      className="w-full h-64 object-cover rounded-xl"
                      onError={() => handleImageError('featured')}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold text-[#0B4422] mb-4">
                  {safeStr(post.title, 'Untitled')}
                </h1>

                {/* Meta Info */}
                {(post.author || post.published_at) && (
                  <div className="flex items-center gap-4 text-gray-600 mb-6">
                    {post.author && (
                      <span className="flex items-center gap-2">
                        <PenLine size={18} />
                        {safeStr(post.author)}
                      </span>
                    )}
                    {post.published_at && (
                      <span className="flex items-center gap-2">
                        <Calendar size={18} />
                        {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* TTS Player */}
                <div className="mb-8 py-4 bg-gradient-to-r from-[#0B4422]/5 to-[#0B4422]/10 border-y border-[#0B4422]/20">
                  <BlogTTSPlayer 
                    title={ttsTitle} 
                    content={ttsBody} 
                    language={language || 'en'} 
                  />
                </div>

                {/* Blog Content */}
                <div className="mb-8 text-gray-700 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content ?? '') }} />
                </div>

                {/* Social Actions */}
                <div className="border-t border-gray-200 pt-6 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-[#1A3D2D] transition-colors">
                      <ThumbsUp size={20} />
                      <span className="font-medium">{post.likes ?? 0} {safeStr(t('blog.likes'), 'Likes')}</span>
                    </button>

                    <button className="flex items-center gap-2 text-gray-600 hover:text-[#1A3D2D] transition-colors">
                      <MessageCircle size={20} />
                      <span className="font-medium">{post.comments_count ?? 0} {safeStr(t('blog.comments'), 'Comments')}</span>
                    </button>
                  </div>

                  <button className="flex items-center gap-2 bg-[#1A3D2D]/10 text-[#1A3D2D] px-4 py-2 rounded-lg hover:bg-[#1A3D2D]/20 transition-colors">
                    <Share2 size={18} />
                    <span className="font-medium">{safeStr(t('blog.share'), 'Share')}</span>
                  </button>
                </div>

              </article>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1 order-2 lg:order-1">
              {/* Author Card */}
              {post.author && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#0B4422] mb-4">
                    {safeStr(t('blog.about_author'), 'About the Author')}
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-[#0B4422] rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {safeStr(post.author).charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{safeStr(post.author)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Posts */}
              {related.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#0B4422] mb-4">
                    {safeStr(t('blog.related_posts'), 'Related Posts')}
                  </h3>
                  <div className="space-y-4">
                    {related.map((relPost) => (
                      <a
                        key={relPost.id || relPost.slug}
                        href={`/blog/${relPost.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          {relPost.featured_image && (
                            <img
                              src={relPost.featured_image}
                              alt={safeStr(relPost.title)}
                              className="w-20 h-20 object-cover rounded-lg"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-[#0B4422] transition-colors line-clamp-2">
                              {safeStr(relPost.title, 'Untitled')}
                            </h4>
                            {relPost.excerpt && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {safeStr(relPost.excerpt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </aside>

          </div>
        </main>
      </div>
      <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '10px' }}>
        Listen uses your browser&apos;s built-in speech. No API key required.
      </div>
      <Footer />
    </>
  );
}

export default function BlogPostPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BlogPostContent params={params} />
    </Suspense>
  );
}