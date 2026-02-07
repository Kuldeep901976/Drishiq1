import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * POST /api/blog/submit
 * Submit a blog post (bypasses RLS using service role)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      read_time,
      featured_image,
      author,
      author_email,
      slug,
      seo_title,
      seo_description,
      seo_keywords,
      og_title,
      og_description,
      og_image,
      meta_description,
      canonical_url,
      post_id, // For edit mode
    } = body;

    // Validate required fields
    if (!title || !content || !author || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, author, slug' },
        { status: 400 }
      );
    }

    // Validate minimum content length (2000 characters after HTML stripping)
    const strippedContent = content.replace(/<[^>]+>/g, '');
    const contentLength = strippedContent.length;
    const MIN_CONTENT_LENGTH = 2000;
    
    if (contentLength < MIN_CONTENT_LENGTH) {
      return NextResponse.json(
        { 
          error: `Content must be at least ${MIN_CONTENT_LENGTH} characters (after HTML stripping)`,
          details: `Current length: ${contentLength} characters`
        },
        { status: 400 }
      );
    }

    // Create service client (bypasses RLS)
    const supabase = createServiceClient();

    // Auto-fill missing SEO fields
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.drishiq.com';
    const autoOgTitle = og_title || title?.substring(0, 60) || null;
    const autoOgDescription = og_description || excerpt?.substring(0, 160) || null;
    const autoOgImage = og_image || featured_image || null;
    const autoMetaDescription = meta_description || excerpt?.substring(0, 160) || null;
    const autoCanonicalUrl = canonical_url || `${baseUrl}/blog/${slug}` || null;

    // Check for duplicate slugs (if not editing)
    if (!post_id) {
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id, title')
        .eq('slug', slug)
        .eq('is_archived', false)
        .single();

      if (existingPost) {
        return NextResponse.json(
          { 
            error: 'A post with this slug already exists',
            details: `Post "${existingPost.title}" already uses slug "${slug}"`
          },
          { status: 400 }
        );
      }
    }

    // Check for similar content (near-duplicates) - only warn, don't block
    let similarPostsWarning = null;
    try {
      const { data: similarPosts } = await supabase
        .rpc('find_near_duplicates', {
          similarity_threshold: 0.85,
          limit_results: 5
        });

      // Check if any similar posts match our content (basic check)
      if (similarPosts && similarPosts.length > 0) {
        // This is a simplified check - in production, you'd compute the hash first
        similarPostsWarning = `Found ${similarPosts.length} similar post(s). Please review to avoid duplicate content.`;
      }
    } catch (err) {
      // Function might not exist yet, ignore
      console.log('Near-duplicate check skipped:', err);
    }

    const submissionData: any = {
      title,
      excerpt: excerpt || null,
      content,
      category: category || null,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []),
      reading_time_minutes: parseInt(read_time) || 0,
      featured_image: featured_image || null,
      author,
      author_email: author_email || null,
      slug,
      status: 'pending',
      seo_title: seo_title || null,
      seo_description: seo_description || null,
      seo_keywords: seo_keywords || null,
      // Auto-filled SEO fields
      og_title: autoOgTitle,
      og_description: autoOgDescription,
      og_image: autoOgImage,
      meta_description: autoMetaDescription,
      canonical_url: autoCanonicalUrl,
    };

    console.log('📤 Submitting blog post via API:', { 
      ...submissionData, 
      content_length: content?.length,
      is_edit: !!post_id 
    });

    let result;
    
    if (post_id) {
      // Update existing post
      submissionData.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('blog_posts')
        .update(submissionData)
        .eq('id', post_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error (update):', error);
        return NextResponse.json(
          { error: 'Failed to update blog post', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Insert new post
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error (insert):', error);
        return NextResponse.json(
          { error: 'Failed to submit blog post', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    const response: any = {
      success: true,
      data: result,
      message: post_id ? 'Blog post updated successfully' : 'Blog post submitted successfully',
      auto_filled_seo: {
        og_title: !og_title && autoOgTitle,
        og_description: !og_description && autoOgDescription,
        og_image: !og_image && autoOgImage,
        meta_description: !meta_description && autoMetaDescription,
        canonical_url: !canonical_url && autoCanonicalUrl,
      }
    };

    if (similarPostsWarning) {
      response.warning = similarPostsWarning;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in POST /api/blog/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

