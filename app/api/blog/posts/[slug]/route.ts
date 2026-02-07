import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';
    
    // Safety check for language parameter
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid language parameter' },
        { status: 400 }
      );
    }
    
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Fetch blog post by slug from Supabase
    console.log('Fetching blog post with slug:', slug, 'language:', language);
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Blog post not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Failed to fetch blog post' },
        { status: 500 }
      );
    }

    if (!post) {
      console.log('No post found for slug:', slug);
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    console.log('Found blog post:', post.id);

    // Transform post to use language-specific columns
    const transformedPost = {
      ...post,
      title: language === 'en' ? post.title : (post[`title_${language}`] || post.title),
      excerpt: language === 'en' ? post.excerpt : (post[`excerpt_${language}`] || post.excerpt),
      content: language === 'en' ? post.content : (post[`content_${language}`] || post.content),
      category: language === 'en' ? post.category : (post[`category_${language}`] || post.category),
      author: language === 'en' ? post.author : (post[`author_${language}`] || post.author),
    };

    // Format the response
    const formattedPost = {
      ...transformedPost,
      read_time: post.reading_time_minutes || 5,
      likes: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      views_count: (post.views_count || 0) + 1,
      published_at: post.published_at || post.created_at,
      author_name: transformedPost.author,
      featured_image: post.featured_image || '/assets/banners/images/mistycloud.webp'
    };

    return NextResponse.json({
      success: true,
      data: formattedPost
    });

  } catch (error) {
    console.error('Error in blog post API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}