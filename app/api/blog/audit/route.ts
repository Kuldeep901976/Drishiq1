import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * GET /api/blog/audit
 * Run comprehensive blog audit:
 * - Find exact duplicates
 * - Find near-duplicates
 * - Find posts with missing SEO metadata
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const similarityThreshold = parseFloat(searchParams.get('similarity_threshold') || '0.85');
    const limitResults = parseInt(searchParams.get('limit') || '200');

    // 1. Find exact duplicates using database function
    const { data: exactDuplicates, error: exactError } = await supabase
      .rpc('find_exact_duplicates');

    if (exactError) {
      console.error('Error finding exact duplicates:', exactError);
    }

    // 2. Find near-duplicates using database function
    const { data: nearDuplicates, error: nearError } = await supabase
      .rpc('find_near_duplicates', {
        similarity_threshold: similarityThreshold,
        limit_results: limitResults
      });

    if (nearError) {
      console.error('Error finding near duplicates:', nearError);
    }

    // 3. Find posts with missing SEO metadata
    const { data: allPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, og_title, og_description, og_image, meta_description, canonical_url, status, is_archived')
      .eq('is_archived', false);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    // Identify missing metadata
    const missingMeta = (allPosts || []).map(post => {
      const missing: string[] = [];
      
      if (!post.og_title) missing.push('og_title');
      if (!post.og_description) missing.push('og_description');
      if (!post.og_image) missing.push('og_image');
      if (!post.meta_description) missing.push('meta_description');
      if (!post.canonical_url) missing.push('canonical_url');

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: post.status,
        missing,
        notes: missing.length > 0 
          ? `Missing ${missing.length} SEO field(s): ${missing.join(', ')}`
          : null
      };
    }).filter(post => post.missing.length > 0);

    // 4. Calculate statistics
    const stats = {
      total_posts: allPosts?.length || 0,
      exact_duplicates_count: exactDuplicates?.length || 0,
      near_duplicates_count: nearDuplicates?.length || 0,
      missing_meta_count: missingMeta.length,
      posts_with_all_meta: (allPosts?.length || 0) - missingMeta.length,
      duplicate_posts_affected: new Set([
        ...(exactDuplicates || []).flatMap((dup: any) => dup.post_ids || []),
        ...(nearDuplicates || []).flatMap((dup: any) => [dup.id_a, dup.id_b])
      ]).size
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      exact_duplicates: exactDuplicates || [],
      near_duplicates: nearDuplicates || [],
      missing_meta: missingMeta,
      recommendations: generateRecommendations(stats, exactDuplicates, nearDuplicates, missingMeta)
    });
  } catch (error: any) {
    console.error('Error in GET /api/blog/audit:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/audit/fix
 * Auto-fix missing SEO metadata for posts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_ids, fix_type = 'all' } = body;

    if (!post_ids || !Array.isArray(post_ids) || post_ids.length === 0) {
      return NextResponse.json(
        { error: 'post_ids array is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch posts that need fixing
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, slug, featured_image, og_title, og_description, og_image, meta_description, canonical_url')
      .in('id', post_ids)
      .eq('is_archived', false);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: fetchError.message },
        { status: 500 }
      );
    }

    const updates: any[] = [];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.drishiq.com';

    for (const post of posts || []) {
      const update: any = {};

      // Auto-fill missing fields
      if (fix_type === 'all' || fix_type === 'og_title') {
        if (!post.og_title && post.title) {
          update.og_title = post.title.substring(0, 60);
        }
      }

      if (fix_type === 'all' || fix_type === 'og_description') {
        if (!post.og_description && post.excerpt) {
          update.og_description = post.excerpt.substring(0, 160);
        }
      }

      if (fix_type === 'all' || fix_type === 'og_image') {
        if (!post.og_image && post.featured_image) {
          update.og_image = post.featured_image;
        }
      }

      if (fix_type === 'all' || fix_type === 'meta_description') {
        if (!post.meta_description && post.excerpt) {
          update.meta_description = post.excerpt.substring(0, 160);
        }
      }

      if (fix_type === 'all' || fix_type === 'canonical_url') {
        if (!post.canonical_url && post.slug) {
          update.canonical_url = `${baseUrl}/blog/${post.slug}`;
        }
      }

      if (Object.keys(update).length > 0) {
        updates.push({ id: post.id, updates: update });
      }
    }

    // Apply updates
    const results = [];
    for (const { id, updates: updateData } of updates) {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        results.push({ id, success: false, error: error.message });
      } else {
        results.push({ id, success: true, updated_fields: Object.keys(updateData) });
      }
    }

    return NextResponse.json({
      success: true,
      fixed_count: results.filter(r => r.success).length,
      failed_count: results.filter(r => !r.success).length,
      results
    });
  } catch (error: any) {
    console.error('Error in POST /api/blog/audit/fix:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  stats: any,
  exactDuplicates: any[],
  nearDuplicates: any[],
  missingMeta: any[]
): string[] {
  const recommendations: string[] = [];

  if (stats.exact_duplicates_count > 0) {
    recommendations.push(
      `⚠️ Found ${stats.exact_duplicates_count} exact duplicate(s). Archive duplicates to keep the earliest post.`
    );
  }

  if (stats.near_duplicates_count > 0) {
    recommendations.push(
      `⚠️ Found ${stats.near_duplicates_count} near-duplicate(s). Review and merge or archive similar posts.`
    );
  }

  if (stats.missing_meta_count > 0) {
    recommendations.push(
      `📝 ${stats.missing_meta_count} post(s) missing SEO metadata. Use the auto-fix feature to populate missing fields.`
    );
  }

  if (stats.missing_meta_count === 0 && stats.exact_duplicates_count === 0 && stats.near_duplicates_count === 0) {
    recommendations.push('✅ All posts have proper SEO metadata and no duplicates found!');
  }

  return recommendations;
}

