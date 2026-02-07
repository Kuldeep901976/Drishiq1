import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const language = searchParams.get('language') || 'en';

    if (!query) {
      return NextResponse.json([]);
    }

    // Search in blog posts
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        published_at,
        author,
        category,
        language,
        status
      `)
      .eq('status', 'published')
      .eq('language', language)
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Blog search error:', error);
      return NextResponse.json([]);
    }

    // Format results
    const results = (blogPosts || []).map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      description: post.excerpt,
      published_at: post.published_at,
      author: post.author,
      category: post.category,
      language: post.language
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}





















