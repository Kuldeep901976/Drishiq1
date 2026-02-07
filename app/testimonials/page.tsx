'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import ServicesFlipSlider from '@/components/ServicesFlipSlider';
import { debounce } from '@/lib/utils/debounce';
import { useLanguage } from '@/lib/drishiq-i18n';
import { Heart, MessageCircle } from 'lucide-react';

type Testimonial = {
  id: string;
  title: string;
  content: string;
  rating: number;
  category?: string;
  tags?: string[];
  is_anonymous?: boolean;
  user_name?: string;
  user_role?: string;
  user_location?: string;
  created_at?: string;
  published_at?: string;
  is_featured?: boolean;
  featured_position?: number;
  likes_count?: number;
  comments_count?: number;
  selected_avatar?: string;
  user_image?: string;
};

type ApiResponse = {
  success: boolean;
  testimonials: Testimonial[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: any;
  error?: string;
};

export default function TestimonialsPage() {
  const { t, language } = useLanguage(['testimonials_main']);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    category: '',
    rating: '',
    search: '',
    featured: false,
  });

  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Build query string from current state
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    if (filters.category) params.set('category', filters.category);
    if (filters.rating) params.set('rating', String(filters.rating));
    if (filters.search) params.set('search', filters.search);
    if (filters.featured) params.set('featured', 'true');
    return params.toString();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  // Fetch testimonials
  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/testimonials?${qs}&language=${language}`);
      
      if (!res.ok) {
        let errorText = '';
        try {
          errorText = await res.text();
        } catch (e) {
          errorText = 'Unable to read error response';
        }
        console.error('Testimonials API error:', res.status, errorText);
        throw new Error('Failed to fetch testimonials');
      }
      
      let json: ApiResponse;
      try {
        const responseText = await res.text();
        if (!responseText || !responseText.trim()) {
          console.warn('Empty response from testimonials API');
          json = { success: false, testimonials: [] };
        } else {
          json = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Failed to parse testimonials API response:', parseError);
        json = { success: false, testimonials: [] };
      }
      
      console.log('Testimonials page - API response:', json);
      console.log('Testimonials page - Fetched testimonials:', Array.isArray(json.testimonials) ? json.testimonials.length : 0, json.testimonials);
      setTestimonials(Array.isArray(json.testimonials) ? json.testimonials : []);
      if (json.pagination) {
        setPagination((prev) => ({ ...prev, ...json.pagination }));
      } else {
        // fallback pagination
        setPagination((prev) => ({
          ...prev,
          total: Array.isArray(json.testimonials) ? json.testimonials.length : 0,
          totalPages: 1,
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while fetching testimonials');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, language]);

  // Debounced search to minimize fetches
  const debouncedSetSearch = useMemo(() => debounce((val: string) => {
    setFilters(prev => ({ ...prev, search: val }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, 350), [setFilters]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, sortBy, sortOrder, filters.category, filters.rating, filters.featured, filters.search, language]);

  // Cleanup debounce on unmount
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFilterChange = (key: string, value: string | boolean) => {
    // For search, use debounced setter
    if (key === 'search') {
      debouncedSetSearch(String(value || ''));
      return;
    }
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (key: string) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || (pagination.totalPages && page > pagination.totalPages)) return;
    setPagination(prev => ({ ...prev, page }));
  };

  const renderStars = (rating = 0) => (
    <div className="flex space-x-1" aria-hidden>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-lg ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
      ))}
    </div>
  );

  const renderTestimonialCard = (testimonial: Testimonial) => (
    <article key={testimonial.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow" aria-labelledby={`t-title-${testimonial.id}`}>
      <header className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden relative flex-shrink-0 bg-emerald-100">
            { (testimonial.selected_avatar || testimonial.user_image) ? (
              <img 
                src={testimonial.selected_avatar || testimonial.user_image} 
                alt={testimonial.user_name || t('testimonials_main.testimonials_list.user')} 
                className="w-full h-full object-cover rounded-full" 
                onError={(e) => { 
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }} 
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-semibold text-lg absolute inset-0"
              style={{ display: (testimonial.selected_avatar || testimonial.user_image) ? 'none' : 'flex' }}
            >
              {testimonial.user_name?.charAt(0) ?? t('testimonials_main.testimonials_list.user').charAt(0)}
            </div>
          </div>

          <div>
            <h3 id={`t-title-${testimonial.id}`} className="font-semibold text-gray-900">{testimonial.user_name || t('testimonials_main.testimonials_list.anonymous')}</h3>
            <p className="text-sm text-gray-600">{testimonial.user_role || ''}</p>
          </div>
        </div>

        {testimonial.is_featured && <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('testimonials_main.testimonials_list.featured_badge')}</span>}
      </header>

      <div className="mb-3">{renderStars(testimonial.rating)}</div>

      <h4 className="font-semibold text-lg text-gray-900 mb-2">{testimonial.title}</h4>

      <p className="text-gray-700 mb-4 line-clamp-4">{testimonial.content}</p>

      <div className="mb-4">
        {testimonial.category && <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 mb-2">{testimonial.category}</span>}
        {testimonial.tags?.map((tag, idx) => (
          <span key={idx} className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 mb-2">{tag}</span>
        ))}
      </div>

      <footer className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{new Date(testimonial.published_at || testimonial.created_at || Date.now()).toLocaleDateString()}</span>
          {testimonial.likes_count ? <span className="flex items-center space-x-1 gap-1"><Heart size={14} /> {testimonial.likes_count}</span> : null}
          {testimonial.comments_count ? <span className="flex items-center space-x-1 gap-1"><MessageCircle size={14} /> {testimonial.comments_count}</span> : null}
        </div>
        <Link href={`/testimonials/${testimonial.id}`} className="text-emerald-600 hover:text-emerald-700 font-medium">{t('testimonials_main.testimonials_list.read_more')}</Link>
      </footer>
    </article>
  );

  // Loading initial state
  if (loading && testimonials.length === 0) {
    return (
      <>
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
            <p className="mt-4 text-gray-600">{t('testimonials_main.loading.message')}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="hero-section py-5" style={{ minHeight: '250px' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-white">{t('testimonials_main.hero.title')}</h1>
            <p className="mt-2 text-white">{t('testimonials_main.hero.subtitle')}</p>
            <div className="mt-4">
              <Link href={t('testimonials_main.hero.cta_link')} className="inline-block px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{t('testimonials_main.hero.cta_button')}</Link>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Main */}
            <div className="flex-1">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <input type="text" placeholder={t('testimonials_main.filters.search_placeholder')} defaultValue={filters.search}
                      onChange={(e) => debouncedSetSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>

                  <div>
                    <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">{t('testimonials_main.filters.category_all')}</option>
                      <option value="Career Development">{t('testimonials_main.filters.categories.career_development')}</option>
                      <option value="Life Coaching">{t('testimonials_main.filters.categories.life_coaching')}</option>
                      <option value="Business Consulting">{t('testimonials_main.filters.categories.business_consulting')}</option>
                      <option value="Educational Consulting">{t('testimonials_main.filters.categories.educational_consulting')}</option>
                      <option value="Content Marketing">{t('testimonials_main.filters.categories.content_marketing')}</option>
                      <option value="Change Management">{t('testimonials_main.filters.categories.change_management')}</option>
                      <option value="Clarity & Mental Resilience">{t('testimonials_main.filters.categories.clarity_mental_resilience')}</option>
                    </select>
                  </div>

                  <div>
                    <select value={filters.rating} onChange={(e) => handleFilterChange('rating', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">{t('testimonials_main.filters.rating_all')}</option>
                      <option value="5">{t('testimonials_main.filters.rating_five')}</option>
                      <option value="4">{t('testimonials_main.filters.rating_four_plus')}</option>
                      <option value="3">{t('testimonials_main.filters.rating_three_plus')}</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={filters.featured} onChange={(e) => handleFilterChange('featured', e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                      <span className="text-sm text-gray-700">{t('testimonials_main.filters.featured_only')}</span>
                    </label>
                  </div>
                </div>

                {/* Sort */}
                <div className="mt-4 flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{t('testimonials_main.filters.sort_label')}</span>
                  {[
                    { key: 'created_at', label: t('testimonials_main.filters.sort_date') },
                    { key: 'rating', label: t('testimonials_main.filters.sort_rating') },
                    { key: 'likes', label: t('testimonials_main.filters.sort_likes') },
                    { key: 'comments', label: t('testimonials_main.filters.sort_comments') }
                  ].map(opt => (
                    <button key={opt.key} onClick={() => handleSortChange(opt.key)}
                      className={`text-sm px-3 py-1 rounded-md transition-colors ${sortBy === opt.key ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {opt.label}{sortBy === opt.key ? (sortOrder === 'asc' ? t('testimonials_main.filters.sort_asc') : t('testimonials_main.filters.sort_desc')) : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{error || t('testimonials_main.error.message')}</div>}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {testimonials.length > 0 ? testimonials.map(testimonial => renderTestimonialCard(testimonial))
                  : (
                    <div className="col-span-2 text-center py-12">
                      <p className="text-gray-500 text-lg">{t('testimonials_main.testimonials_list.no_results')}</p>
                      <Link href="/testimonials/submit" className="inline-block mt-4 px-6 py-3 bg-emerald-600 text-white rounded-lg">{t('testimonials_main.testimonials_list.share_story_button')}</Link>
                    </div>
                  )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2 mb-8">
                  <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50">{t('testimonials_main.pagination.previous')}</button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => handlePageChange(p)}
                      className={`px-3 py-2 border rounded-md ${p === pagination.page ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}

                  <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50">{t('testimonials_main.pagination.next')}</button>
                </div>
              )}

            </div>

            {/* Sidebar */}
            <aside className="lg:w-[340px] lg:flex-shrink-0">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border-2 border-[#0B4422]">
                <h3 className="text-xl font-bold text-[#0B4422] mb-4 text-center">{t('testimonials_main.sidebar.title')}</h3>

                <div className="text-center bg-white rounded-xl p-4 border border-gray-200 mb-4">
                  <h4 className="text-base font-semibold text-[#0B4422] mb-2">{t('testimonials_main.sidebar.vision_title')}</h4>
                  <p className="text-gray-600 text-sm mb-3">{t('testimonials_main.sidebar.vision_description')}</p>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg mb-3 border-l-4 border-[#0B4422]">
                    <p className="text-xs text-gray-700 italic"><strong>{t('testimonials_main.sidebar.pipeline_vision')}</strong></p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={t('testimonials_main.sidebar.links.share_story')} className="px-4 py-2 bg-[#0B4422] text-white rounded-lg text-xs font-semibold">{t('testimonials_main.sidebar.buttons.share_story')}</Link>
                    <Link href={t('testimonials_main.sidebar.links.write_blog')} className="px-4 py-2 bg-white text-[#0B4422] border-2 border-[#0B4422] rounded-lg text-xs font-semibold">{t('testimonials_main.sidebar.buttons.write_blog')}</Link>
                    <Link href={t('testimonials_main.sidebar.links.share_suggestions')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg text-xs font-semibold">{t('testimonials_main.sidebar.buttons.share_suggestions')}</Link>
                  </div>
                </div>

              </div>

              {/* YouTube Playlist - Below sidebar box */}
              <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="text-base font-semibold text-[#0B4422] mb-3 text-center">{t('testimonials_main.sidebar.playlist.title')}</h4>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src="https://www.youtube.com/embed/videoseries?list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN"
                    title="DrishiQ Testimonials Playlist"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </aside>
          </div>

          {/* Services strip */}
          <section className="bg-white rounded-lg shadow-sm p-8 mt-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('testimonials_main.services_section.title')}</h2>
              <p className="text-gray-600">{t('testimonials_main.services_section.description')}</p>
            </div>
            <ServicesFlipSlider orientation="horizontal" />
          </section>
        </div>

      </main>
      <Footer />
    </>
  );
}





