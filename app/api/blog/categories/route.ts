import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getCachedJson, setCachedJson, CACHE_TTL } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';
    
    // Safety check for language parameter
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid language parameter' },
        { status: 400 }
      );
    }

    const cacheKey = `blog:categories:${language}`;
    const cached = await getCachedJson<{ success: true; data: unknown[]; total: number }>(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Use service client to bypass RLS policies
    const supabase = createServiceClient();
    
    // Get all unique categories from published posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('category, category_hi, category_ar, category_bn, category_de, category_es, category_fr, category_ja, category_pt, category_ru, category_ta, category_zh')
      .eq('status', 'published');

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Extract unique categories with translations
    const categoryMap = new Map();
    
    (posts || []).forEach(post => {
      const englishCategory = post.category;
      if (!englishCategory) return;
      
      // Get translated category name (fallback to English if translation doesn't exist)
      const translatedCategory = language === 'en' 
        ? englishCategory 
        : ((post as any)[`category_${language}`] || englishCategory);
      
      if (!categoryMap.has(englishCategory)) {
        categoryMap.set(englishCategory, {
          key: englishCategory,
          name: translatedCategory,
          count: 0
        });
      }
      
      // Count posts in this category
      const categoryData = categoryMap.get(englishCategory);
      categoryData.count += 1;
    });

    // Convert to array and sort by count (most popular first)
    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);

    const body = {
      success: true as const,
      data: categories,
      total: categories.length
    };
    await setCachedJson(cacheKey, body, CACHE_TTL.blog);

    const response = NextResponse.json(body);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error) {
    console.error('Error in blog categories API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
