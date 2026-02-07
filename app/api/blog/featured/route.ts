import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    const language = searchParams.get('language') || 'en';
    
    // Safety check for language parameter
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid language parameter' },
        { status: 400 }
      );
    }

    // Fetch featured blog posts from Supabase (for homepage)
    // Use service client to bypass RLS policies
    const supabase = createServiceClient();
    
    // Homepage: Filter by is_featured=true only (not checking published status)
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_featured', true)
      .order('publish_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured blog posts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch blog posts' },
        { status: 500 }
      );
    }

    // Transform posts to use language-specific columns
    // Helper function to combine chunked content (same as posts route)
    const getChunkedContent = (post: any, baseField: string) => {
      if (language === 'en') return post[baseField];
      
      const chunks = [
        post[`${baseField}_${language}`] || '',
        post[`${baseField}_${language}_2`] || '',
        post[`${baseField}_${language}_3`] || ''
      ];
      const combined = chunks.filter(chunk => chunk && chunk.trim()).join('');
      return combined || post[baseField];
    };

    const getChunkedSeoDescription = (post: any) => {
      if (language === 'en') return post.seo_description;
      
      const chunks = [
        post[`seo_description_${language}`] || '',
        post[`seo_description_${language}_2`] || ''
      ];
      const combined = chunks.filter(chunk => chunk && chunk.trim()).join('');
      return combined || post.seo_description;
    };

    const transformedPosts = (posts || []).map(post => ({
      ...post,
      title: language === 'en' ? post.title : (post[`title_${language}`] || post.title),
      excerpt: language === 'en' ? post.excerpt : (post[`excerpt_${language}`] || post.excerpt),
      content: getChunkedContent(post, 'content'),
      category: language === 'en' ? post.category : (post[`category_${language}`] || post.category),
      author: language === 'en' ? post.author : (post[`author_${language}`] || post.author),
      seo_title: language === 'en' ? post.seo_title : (post[`seo_title_${language}`] || post.seo_title),
      seo_description: getChunkedSeoDescription(post),
      seo_keywords: language === 'en' ? post.seo_keywords : (post[`seo_keywords_${language}`] || post.seo_keywords),
      // Tags might also need translation if they exist
      tags: post.tags || [],
    }));

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      isFeatured: true,
      message: 'Featured blog posts fetched successfully'
    });
  } catch (error) {
    console.error('Error in featured blog posts API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
