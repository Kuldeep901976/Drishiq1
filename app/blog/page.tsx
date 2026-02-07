'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from '../../components/Footer';
import ServicesFlipSlider from '@/components/ServicesFlipSlider';
import DrishiQVideoPlaylist from '@/components/DrishiQVideoPlaylist';
import { useLanguage } from '@/lib/drishiq-i18n';
import { PenLine } from 'lucide-react';

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  read_time: string;
  publish_date: string;
  author: string;
  is_featured: boolean;
  tags: string[];
  featured_image?: string;
}

interface BlogCategory {
  key: string; // English category name (for filtering)
  name: string; // Translated category name (for display)
  count: number;
}

export default function BlogPage() {
  const { t, language } = useLanguage(['blog', 'common', 'header']);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // Use the current language from the hook
        const currentLanguage = language || 'en';
        
        // Check cache first (5 minute TTL)
        const cacheKey = `blog.${currentLanguage}`;
        const cacheTimestampKey = `blog.${currentLanguage}.timestamp`;
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        
        if (typeof window !== 'undefined') {
          try {
            const cachedData = sessionStorage.getItem(cacheKey);
            const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey);
            
            if (cachedData && cachedTimestamp) {
              const age = Date.now() - parseInt(cachedTimestamp, 10);
              if (age < CACHE_TTL) {
                const parsed = JSON.parse(cachedData);
                setArticles(parsed.articles || []);
                setCategories(parsed.categories || []);
                setLoading(false);
                return; // Use cached data
              }
            }
          } catch (e) {
            // Ignore cache errors, proceed to fetch
          }
        }
        
        // Fetch articles and categories in parallel
        // Articles: fetch in current language (for display)
        // Categories: fetch in current language (for display), but we'll use English keys for matching
        const timestamp = Date.now();
        const [articlesRes, categoriesRes, articlesEnRes] = await Promise.all([
          fetch(`/api/blog/posts?language=${currentLanguage}&t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/blog/categories?language=${currentLanguage}&t=${timestamp}`, { cache: 'no-store' }),
          // Also fetch English articles to get English category values for matching
          currentLanguage !== 'en' ? fetch(`/api/blog/posts?language=en&t=${timestamp}`, { cache: 'no-store' }) : Promise.resolve(null)
        ]);
        
        let articlesJson = {};
        let categoriesJson = {};
        let articlesEnJson = {};
        
        try {
          const articlesText = await articlesRes.text();
          if (articlesText && articlesText.trim()) {
            articlesJson = JSON.parse(articlesText);
          }
        } catch (e) {
          console.error('Failed to parse articles response:', e);
        }
        
        try {
          const categoriesText = await categoriesRes.text();
          if (categoriesText && categoriesText.trim()) {
            categoriesJson = JSON.parse(categoriesText);
          }
        } catch (e) {
          console.error('Failed to parse categories response:', e);
        }
        
        // Parse English articles if fetched
        if (articlesEnRes) {
          try {
            const articlesEnText = await articlesEnRes.text();
            if (articlesEnText && articlesEnText.trim()) {
              articlesEnJson = JSON.parse(articlesEnText);
            }
          } catch (e) {
            console.error('Failed to parse English articles response:', e);
          }
        }
        
        // Debug logging
        if (!articlesRes.ok) {
          console.error('Blog posts API error:', articlesJson);
        }
        if (!categoriesRes.ok) {
          console.error('Categories API error:', categoriesJson);
        }
        
        const articlesData: BlogArticle[] = Array.isArray(articlesJson?.data) ? articlesJson.data : [];
        const articlesEnData: BlogArticle[] = Array.isArray(articlesEnJson?.data) ? articlesEnJson.data : [];
        const categoriesData: BlogCategory[] = Array.isArray(categoriesJson?.data) ? categoriesJson.data : [];
        
        // Create a map of article IDs to English categories for matching
        const articleCategoryMap = new Map<string, string>();
        articlesEnData.forEach(article => {
          if (article.id && article.category) {
            articleCategoryMap.set(article.id, article.category);
          }
        });
        
        // Add English category to each article for matching purposes
        const articlesWithEnglishCategory = articlesData.map(article => ({
          ...article,
          category_en: articleCategoryMap.get(article.id) || article.category
        }));
        
        console.log('Blog page - API Response Status:', { 
          articlesOk: articlesRes.ok, 
          categoriesOk: categoriesRes.ok,
          articlesStatus: articlesRes.status,
          categoriesStatus: categoriesRes.status
        });
        console.log('Blog page - Raw API JSON:', { 
          articlesJson, 
          categoriesJson 
        });
        console.log('Blog page - Articles JSON structure:', {
          success: articlesJson?.success,
          hasData: !!articlesJson?.data,
          dataType: Array.isArray(articlesJson?.data) ? 'array' : typeof articlesJson?.data,
          dataLength: Array.isArray(articlesJson?.data) ? articlesJson.data.length : 'not an array',
          fullResponse: articlesJson
        });
        console.log('Blog page - Fetched articles:', Array.isArray(articlesData) ? articlesData.length : 0, articlesData);
        console.log('Blog page - Fetched categories:', Array.isArray(categoriesData) ? categoriesData.length : 0, categoriesData);
        
        // Check if articles have required fields
        if (Array.isArray(articlesData) && articlesData.length > 0) {
          console.log('Blog page - Sample article structure:', {
            firstArticle: articlesData[0],
            hasId: articlesData[0]?.id,
            hasTitle: articlesData[0]?.title,
            hasSlug: articlesData[0]?.slug,
            hasCategory: articlesData[0]?.category
          });
        }
        
        setArticles(articlesWithEnglishCategory);
        setCategories(categoriesData);
        
        // Cache results
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              articles: articlesWithEnglishCategory,
              categories: categoriesData
            }));
            sessionStorage.setItem(cacheTimestampKey, Date.now().toString());
          } catch (e) {
            // Ignore cache errors
          }
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [language]);

  const featured = useMemo<BlogArticle | null>(() => {
    if (!Array.isArray(articles) || articles.length === 0) return null;
    const pick = articles.find(a => a.is_featured) || articles[0];
    return pick || null;
  }, [articles]);

  const categorySections = useMemo(() => {
    // Use the translated categories from the API
    if (!Array.isArray(categories) || !Array.isArray(articles)) return [];
    const topCategories = categories.slice(0, 3); // Get top 3 categories
    
    // Map categories to their articles, but only include categories that have articles
    const sections = topCategories
      .map(categoryData => {
        // Find articles that belong to this category
        // Use English category for matching (stored in category_en field or fallback to category)
        const categoryArticles = articles.filter(article => {
          const articleCatEn = (article as any).category_en || article.category || '';
          const categoryKey = (categoryData.key || '').trim();
          
          // Exact match with English category
          if (articleCatEn.trim() === categoryKey) return true;
          
          // Case-insensitive match
          if (articleCatEn.trim().toLowerCase() === categoryKey.toLowerCase()) return true;
          
          return false;
        });
        
        console.log(`Category "${categoryData.name}" (key: "${categoryData.key}"): ${categoryArticles.length} articles`, {
          categoryKey: categoryData.key,
          articleCategories: articles.map(a => a.category),
          matchingArticles: categoryArticles.map(a => ({ id: a.id, title: a.title, category: a.category }))
        });
        return [categoryData.name, categoryArticles] as [string, BlogArticle[]];
      })
      .filter(([_, items]) => Array.isArray(items) && items.length > 0); // Only include categories with articles
    
    console.log('Blog page - Category sections:', sections.length, sections.map(([name, items]) => `${name}: ${items.length} articles`));
    return sections;
  }, [categories, articles]);

  const teaserList = useMemo(() => {
    if (!Array.isArray(articles)) {
      return [
        { id: 't1', title: 'Make sense in a noisy world', excerpt: 'Small steps to reduce overwhelm.', slug: '#', category: 'Clarity', read_time: '6 min', publish_date: new Date().toISOString(), author: 'Team', is_featured: false, tags: [], featured_image: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop' } as any
      ];
    }
    const list = articles.slice(0, 4).length > 0 ? articles.slice(0, 4) : [
      { id: 't1', title: 'Make sense in a noisy world', excerpt: 'Small steps to reduce overwhelm.', slug: '#', category: 'Clarity', read_time: '6 min', publish_date: new Date().toISOString(), author: 'Team', is_featured: false, tags: [], featured_image: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop' } as any
    ];
    // Add index to IDs to make them unique when duplicating for carousel
    return [...list, ...list].map((item, idx) => ({ ...item, id: `${item.id}-${idx}` }));
  }, [articles]);

  const renderArticleCard = (a: BlogArticle) => (
    <div className="w-80 shrink-0 rounded-2xl overflow-hidden border bg-white">
      <img 
        className="h-40 w-full object-cover" 
        src={a.featured_image || '/assets/banners/images/mistycloud.webp'} 
        alt={a.title || 'Blog post image'} 
        onError={(e)=>{ 
          const i=e.currentTarget as HTMLImageElement; 
          i.onerror=null; 
          i.src='/assets/banners/images/mistycloud.webp'; 
        }} 
      />
      <div className="p-4">
        <div className="text-xs text-neutral-600">{a.category || 'Uncategorized'} • {a.publish_date ? new Date(a.publish_date).toLocaleDateString() : 'No date'}</div>
        <h3 className="font-semibold leading-snug line-clamp-2 text-gray-900">{a.title || 'Untitled'}</h3>
        <Link href={`/blog/${a.slug || '#'}`} className="mt-2 inline-block text-sm text-[#0B4422]">{t('blog.read_more') ?? 'Read →'}</Link>
      </div>
    </div>
  );

  function RowCarousel({ category, items, idx }: { category: string; items: BlogArticle[]; idx: number }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState<number>(0);
    const rafRef = useRef<number | null>(null);
    const speedPxPerFrame = 0.8 + idx * 0.1; // stagger speeds a bit
    const gapPx = 16; // tailwind gap-4

    const itemsForRow = useMemo(() => {
      if (items.length === 0) return [];
      
      // Ensure we have enough items for smooth continuous carousel movement
      // Duplicate items multiple times to create seamless loop
      const out: BlogArticle[] = [];
      const duplicates = Math.max(3, Math.ceil(6 / items.length)); // At least 3 sets
      
      for (let i = 0; i < duplicates; i++) {
        items.forEach((item, idx) => {
          out.push({ ...item, id: `${item.id}-dup-${i}-${idx}` });
        });
      }
      
      return out;
    }, [items]);

    const step = () => {
      setOffset((prev) => {
        let next = prev - speedPxPerFrame;
        const track = trackRef.current;
        if (track && track.firstElementChild) {
          const first = track.firstElementChild as HTMLElement;
          const firstWidth = first.offsetWidth + gapPx;
          if (-next >= firstWidth) {
            // move first to end and adjust offset forward by its width so movement is continuous
            track.appendChild(first);
            next += firstWidth;
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };

    useEffect(() => {
      if (itemsForRow.length > 0) {
        let isVisible = true;
        
        const handleVisibilityChange = () => {
          isVisible = !document.hidden;
          if (!isVisible && rafRef.current) {
            // Pause when tab is hidden
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          } else if (isVisible && !rafRef.current) {
            // Resume when tab becomes visible
            rafRef.current = requestAnimationFrame(step);
          }
        };
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Start animation if visible
        if (!document.hidden) {
          rafRef.current = requestAnimationFrame(step);
        }
        
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsForRow.length, speedPxPerFrame]);

    const pause = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const resume = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(step); };

    if (itemsForRow.length === 0) {
      return null;
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{category}</h2>
          <Link href={`/blog?category=${encodeURIComponent(category)}`} className="text-sm text-[#0B4422]">{t('blog.main_page.view_all') ?? 'View all →'}</Link>
        </div>
        <div className="row-carousel-wrap overflow-hidden" onMouseEnter={pause} onMouseLeave={resume}>
          <div className="row-viewport overflow-hidden">
            <div ref={trackRef} className="flex gap-4 will-change-transform" style={{ transform: `translateX(${offset}px)` }}>
              {itemsForRow.map((a, idx) => {
                // Create unique key for carousel items to avoid duplicate key warnings
                const uniqueKey = `${a.id}-carousel-${category}-${idx}`;
                return (
                  <div key={uniqueKey}>
                    {renderArticleCard(a)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="content-safe-area bg-white">
        {/* Page Heading */}
        <section className="hero-section py-5" style={{ minHeight: '250px' }}>
          <div className="hero-section__container">
            <h1 className="hero-section__title text-white">
              {t('blog.main_page.title') || 'Blogs'}
            </h1>
            <p className="hero-section__subtitle text-white">
              {t('blog.main_page.description') || "It's our effort to talk about what's happening around us and how it can be resolved. We provide perspective on real-world challenges and offer practical solutions, making this blog different from others by focusing on actionable insights and meaningful change."}
            </p>
          </div>
        </section>

        {/* Featured Blog Section */}
        {featured && (
          <section className="bg-white pb-8 mt-2">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <article className="relative rounded-3xl overflow-hidden shadow-lg border border-neutral-200">
                {loading ? (
                  <div className="w-full h-[270px] md:h-[315px] bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="text-gray-400 text-lg">{t('blog.main_page.loading_featured') ?? 'Loading featured article...'}</div>
                  </div>
                ) : (
                  <img 
                    className="w-full h-[270px] md:h-[315px] object-cover" 
                    src={featured.featured_image || 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2069&auto=format&fit=crop'} 
                    alt={featured.title || 'Featured article cover'} 
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2069&auto=format&fit=crop';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 p-6 sm:p-10 text-white max-w-3xl">
                  <div className="text-xs uppercase tracking-widest text-white/80 mb-2">{t('blog.main_page.featured_label') ?? 'Featured'}</div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight line-clamp-3 text-yellow-400 mb-2">{featured.title || 'Featured Article'}</h2>
                  <p className="text-white/90 line-clamp-2 mb-3">{featured.excerpt || 'Read this featured article'}</p>
                  <div className="text-sm text-white/80 mb-4">
                    By <b className="text-white">{featured.author || 'Team DrishiQ'}</b> • {featured.publish_date ? new Date(featured.publish_date).toLocaleDateString() : 'Recent'} • {featured.read_time || '5 min'}
                  </div>
                  <Link 
                    href={`/blog/${featured.slug}`} 
                    className="inline-flex items-center rounded-xl bg-white text-[#0B4422] px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t('blog.main_page.read_article') ?? 'Read the article'} →
                  </Link>
                </div>
              </article>
            </div>
          </section>
        )}

        {/* Body: Left category rows, Right vertical teasers + video playlist */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* LEFT */}
            <section className="lg:col-span-8 space-y-8">
              {categorySections.length > 0 ? (
                categorySections.map(([cat, items], idx) => (
                  <RowCarousel key={cat} category={cat} items={items} idx={idx} />
                ))
              ) : null}
              
              {/* Always show "All Articles" section if we have articles */}
              {/* Only show articles that are NOT in category sections to avoid duplicates */}
              {articles.length > 0 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0B4422] mb-4">{t('blog.main_page.all_articles') ?? 'All Articles'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {articles.map((article, idx) => {
                        // Create unique key combining id and index to avoid duplicates
                        const uniqueKey = `${article.id}-all-articles-${idx}`;
                        return (
                          <div key={uniqueKey}>
                            {renderArticleCard(article)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show empty state if no articles */}
              {articles.length === 0 && !loading && (
                <div className="space-y-8">
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">No articles available yet.</p>
                    <Link href="/blog/create" className="inline-block px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#0a3a1c]">
                      Write the first article
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT */}
            <aside className="lg:col-span-4 w-full space-y-6">
              {/* Services section - fixed height */}
              <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-[#0B4422] mb-4 p-4 pb-2">{t('blog.main_page.explore_services') ?? 'Explore Drishiq Services'}</h3>
                <div className="px-4 pb-4">
                  <ServicesFlipSlider orientation="vertical" />
                </div>
              </section>

              {/* Video Playlist Section */}
              <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <DrishiQVideoPlaylist
                  preferredLanguage={language || 'en'}
                  autoPlay={false}
                  showPlaylist={true}
                  className="w-full"
                />
              </section>
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Action Button for creating blogs */}
      <div className="fixed bottom-20 right-6 z-[9999]" style={{ marginBottom: '60px' }}>
        <Link 
          href="/blog/create" 
          className="flex items-center justify-center w-14 h-14 bg-[#1A3D2D] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          title={t('blog.main_page.write_post') ?? 'Write a blog post'}
        >
          <PenLine size={24} />
        </Link>
      </div>

      <Footer />
    </>
  );
} 