import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getCachedJson, setCachedJson, CACHE_TTL } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const language = searchParams.get('language') || 'en';
    
    // Safety check for language parameter
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid language parameter' },
        { status: 400 }
      );
    }

    const cacheKey = `blog:posts:${language}:${limit}:${category ?? ''}:${featured}`;
    const cached = await getCachedJson<{ success: true; data: unknown[]; total: number }>(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Use service client to bypass RLS policies
    const supabase = createServiceClient();
    
    // Build query
    let query = supabase
      .from('blog_posts')
      .select('*');
    
    if (featured) {
      // Homepage: Filter by is_featured=true (regardless of published status)
      query = query.eq('is_featured', true);
    } else {
      // Blog page: Filter by is_published=true OR status='published'
      // Check which field exists by trying a sample query
      const { data: sampleCheck } = await supabase
        .from('blog_posts')
        .select('id, is_published, status')
        .limit(1);
      
      const hasIsPublished = sampleCheck && sampleCheck.length > 0 && 
                            sampleCheck[0] && 'is_published' in sampleCheck[0] &&
                            (sampleCheck[0].is_published === true || sampleCheck[0].is_published === false);
      
      if (hasIsPublished) {
        query = query.eq('is_published', true);
      } else {
        query = query.eq('status', 'published');
      }
    }

    // Apply category filter if requested
    if (category) {
      const categoryField = language === 'en' ? 'category' : `category_${language}`;
      query = query.eq(categoryField, category);
    }
    
    query = query.order('publish_date', { ascending: false }).limit(limit);

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch blog posts', details: error.message },
        { status: 500 }
      );
    }
    
    // Debug log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Blog posts API - Fetched posts:', {
        count: posts?.length || 0,
        featured: featured ? 'featured only' : 'all published',
        firstPostTitle: posts && posts.length > 0 ? posts[0].title : null
      });
    }

    // Transform posts to use language-specific columns
    // Default (English) uses original fields, other languages use prefixed fields
    const transformedPosts = (posts || []).map(post => {
      // Helper function to combine chunked content
      const getChunkedContent = (baseField: string) => {
        if (language === 'en') return post[baseField];
        
        const chunks = [
          post[`${baseField}_${language}`] || '',
          post[`${baseField}_${language}_2`] || '',
          post[`${baseField}_${language}_3`] || ''
        ];
        const combined = chunks.filter(chunk => chunk && chunk.trim()).join('');
        return combined || post[baseField];
      };

      // Helper function to combine chunked seo_description
      const getChunkedSeoDescription = () => {
        if (language === 'en') return post.seo_description;
        
        const chunks = [
          post[`seo_description_${language}`] || '',
          post[`seo_description_${language}_2`] || ''
        ];
        const combined = chunks.filter(chunk => chunk && chunk.trim()).join('');
        return combined || post.seo_description;
      };

      return {
        ...post,
        // Language-specific transformations
        title: language === 'en' ? post.title : (post[`title_${language}`] || post.title),
        excerpt: language === 'en' ? post.excerpt : (post[`excerpt_${language}`] || post.excerpt),
        content: getChunkedContent('content'),
        category: language === 'en' ? post.category : (post[`category_${language}`] || post.category),
        author: language === 'en' ? post.author : (post[`author_${language}`] || post.author),
        seo_title: language === 'en' ? post.seo_title : (post[`seo_title_${language}`] || post.seo_title),
        seo_description: getChunkedSeoDescription(),
        seo_keywords: language === 'en' ? post.seo_keywords : (post[`seo_keywords_${language}`] || post.seo_keywords),
        // Normalize field names to match frontend expectations
        read_time: post.read_time || (post.reading_time_minutes ? `${post.reading_time_minutes} min` : '5 min'),
        publish_date: post.publish_date || post.published_at || post.created_at,
        // Ensure required fields exist
        slug: post.slug || post.id || '',
        tags: post.tags || [],
        is_featured: post.is_featured || false,
      };
    });

    const body = {
      success: true as const,
      data: transformedPosts,
      total: transformedPosts.length
    };
    await setCachedJson(cacheKey, body, CACHE_TTL.blog);

    const response = NextResponse.json(body);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error) {
    console.error('Error in blog posts API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
















