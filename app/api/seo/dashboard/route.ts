import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * GET /api/seo/dashboard
 * Comprehensive SEO dashboard data including:
 * - Blog audit results
 * - Content performance
 * - SEO metrics
 * - Recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get('analytics') === 'true';

    // 1. Blog Audit Data
    const auditData = await getBlogAuditData(supabase);

    // 2. Content Performance Data
    const contentPerformance = await getContentPerformance(supabase);

    // 3. SEO Metrics
    const seoMetrics = await getSEOMetrics(supabase);

    // 4. Digital Assets Overview
    const digitalAssets = await getDigitalAssets(supabase);

    // 5. Recommendations Engine
    const recommendations = generateRecommendations(
      auditData,
      contentPerformance,
      seoMetrics,
      digitalAssets
    );

    // 6. Backlink Opportunities (if we have data)
    const backlinkOpportunities = await getBacklinkOpportunities(supabase);

    // 7. Content Suggestions
    const contentSuggestions = generateContentSuggestions(
      contentPerformance,
      seoMetrics
    );

    // 8. Google Analytics Data (if enabled)
    let analyticsData = null;
    if (includeAnalytics) {
      analyticsData = await getGoogleAnalyticsData();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        audit: auditData,
        content_performance: contentPerformance,
        seo_metrics: seoMetrics,
        digital_assets: digitalAssets,
        recommendations,
        backlink_opportunities: backlinkOpportunities,
        content_suggestions: contentSuggestions,
        analytics: analyticsData
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/seo/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function getBlogAuditData(supabase: any) {
  try {
    // Get exact duplicates
    const { data: exactDuplicates } = await supabase.rpc('find_exact_duplicates');
    
    // Get near duplicates
    const { data: nearDuplicates } = await supabase.rpc('find_near_duplicates', {
      similarity_threshold: 0.85,
      limit_results: 50
    });

    // Get posts with missing metadata
    const { data: allPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, og_title, og_description, og_image, meta_description, canonical_url, status, is_archived, views_count, likes_count')
      .eq('is_archived', false);

    const missingMeta = (allPosts || []).filter(post => {
      return !post.og_title || !post.og_description || !post.og_image || 
             !post.meta_description || !post.canonical_url;
    });

    return {
      total_posts: allPosts?.length || 0,
      exact_duplicates: exactDuplicates?.length || 0,
      near_duplicates: nearDuplicates?.length || 0,
      missing_metadata: missingMeta.length,
      posts_with_complete_seo: (allPosts?.length || 0) - missingMeta.length,
      seo_completeness_percentage: allPosts?.length 
        ? Math.round(((allPosts.length - missingMeta.length) / allPosts.length) * 100)
        : 0
    };
  } catch (error) {
    console.error('Error getting blog audit data:', error);
    return {
      total_posts: 0,
      exact_duplicates: 0,
      near_duplicates: 0,
      missing_metadata: 0,
      posts_with_complete_seo: 0,
      seo_completeness_percentage: 0
    };
  }
}

async function getContentPerformance(supabase: any) {
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, status, views_count, likes_count, comments_count, created_at, category, tags')
      .eq('is_archived', false)
      .order('views_count', { ascending: false })
      .limit(20);

    const totalViews = (posts || []).reduce((sum: number, post: any) => sum + (post.views_count || 0), 0);
    const totalLikes = (posts || []).reduce((sum: number, post: any) => sum + (post.likes_count || 0), 0);
    const totalComments = (posts || []).reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);

    // Content by status
    const byStatus = (posts || []).reduce((acc: any, post: any) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {});

    // Top performing content
    const topPerforming = (posts || []).slice(0, 10).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      views: post.views_count || 0,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      engagement_score: (post.views_count || 0) + ((post.likes_count || 0) * 2) + ((post.comments_count || 0) * 5)
    })).sort((a: any, b: any) => b.engagement_score - a.engagement_score);

    // Content by category
    const byCategory = (posts || []).reduce((acc: any, post: any) => {
      const cat = post.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return {
      total_views: totalViews,
      total_likes: totalLikes,
      total_comments: totalComments,
      average_views_per_post: posts?.length ? Math.round(totalViews / posts.length) : 0,
      by_status: byStatus,
      by_category: byCategory,
      top_performing: topPerforming,
      total_posts_analyzed: posts?.length || 0
    };
  } catch (error) {
    console.error('Error getting content performance:', error);
    return {
      total_views: 0,
      total_likes: 0,
      total_comments: 0,
      average_views_per_post: 0,
      by_status: {},
      by_category: {},
      top_performing: [],
      total_posts_analyzed: 0
    };
  }
}

async function getSEOMetrics(supabase: any) {
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, meta_description, og_title, og_description, canonical_url, content, excerpt')
      .eq('is_archived', false)
      .eq('status', 'published');

    const totalPublished = posts?.length || 0;
    
    // Analyze SEO quality
    const seoAnalysis = (posts || []).map((post: any) => {
      const titleLength = post.title?.length || 0;
      const metaLength = post.meta_description?.length || 0;
      const contentLength = (post.content || '').replace(/<[^>]+>/g, '').length;
      const hasCanonical = !!post.canonical_url;
      const hasOG = !!(post.og_title && post.og_description);
      
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        title_length: titleLength,
        title_optimal: titleLength >= 50 && titleLength <= 60,
        meta_length: metaLength,
        meta_optimal: metaLength >= 150 && metaLength <= 160,
        content_length: contentLength,
        content_optimal: contentLength >= 2000,
        has_canonical: hasCanonical,
        has_og: hasOG,
        seo_score: calculateSEOScore({
          titleOptimal: titleLength >= 50 && titleLength <= 60,
          metaOptimal: metaLength >= 150 && metaLength <= 160,
          contentOptimal: contentLength >= 2000,
          hasCanonical,
          hasOG
        })
      };
    });

    const averageSEOScore = seoAnalysis.length 
      ? Math.round(seoAnalysis.reduce((sum: number, item: any) => sum + item.seo_score, 0) / seoAnalysis.length)
      : 0;

    return {
      total_published: totalPublished,
      average_seo_score: averageSEOScore,
      posts_need_optimization: seoAnalysis.filter((p: any) => p.seo_score < 70).length,
      posts_well_optimized: seoAnalysis.filter((p: any) => p.seo_score >= 70).length,
      optimization_percentage: totalPublished 
        ? Math.round((seoAnalysis.filter((p: any) => p.seo_score >= 70).length / totalPublished) * 100)
        : 0,
      detailed_analysis: seoAnalysis.slice(0, 20) // Top 20 for detailed view
    };
  } catch (error) {
    console.error('Error getting SEO metrics:', error);
    return {
      total_published: 0,
      average_seo_score: 0,
      posts_need_optimization: 0,
      posts_well_optimized: 0,
      optimization_percentage: 0,
      detailed_analysis: []
    };
  }
}

function calculateSEOScore(factors: any): number {
  let score = 0;
  if (factors.titleOptimal) score += 20;
  if (factors.metaOptimal) score += 20;
  if (factors.contentOptimal) score += 30;
  if (factors.hasCanonical) score += 15;
  if (factors.hasOG) score += 15;
  return score;
}

async function getDigitalAssets(supabase: any) {
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, status, category, tags, featured_image, created_at')
      .eq('is_archived', false);

    const assets = {
      total_blog_posts: posts?.length || 0,
      published: (posts || []).filter((p: any) => p.status === 'published').length,
      pending: (posts || []).filter((p: any) => p.status === 'pending').length,
      draft: (posts || []).filter((p: any) => p.status === 'draft').length,
      with_images: (posts || []).filter((p: any) => p.featured_image).length,
      categories: [...new Set((posts || []).map((p: any) => p.category).filter(Boolean))],
      total_tags: [...new Set((posts || []).flatMap((p: any) => p.tags || []))].length,
      recent_posts: (posts || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          created_at: p.created_at
        }))
    };

    return assets;
  } catch (error) {
    console.error('Error getting digital assets:', error);
    return {
      total_blog_posts: 0,
      published: 0,
      pending: 0,
      draft: 0,
      with_images: 0,
      categories: [],
      total_tags: 0,
      recent_posts: []
    };
  }
}

async function getBacklinkOpportunities(supabase: any) {
  // This would integrate with backlink analysis tools
  // For now, return suggestions based on content analysis
  return {
    opportunities: [
      {
        type: 'guest_posting',
        title: 'Personal Development Blogs',
        description: 'Reach out to personal development blogs for guest posting opportunities',
        potential_links: 10,
        difficulty: 'medium',
        priority: 'high'
      },
      {
        type: 'resource_pages',
        title: 'Self-Help Resource Pages',
        description: 'Get listed on "Best Self-Help Tools" resource pages',
        potential_links: 5,
        difficulty: 'low',
        priority: 'high'
      },
      {
        type: 'community',
        title: 'Reddit & Quora Engagement',
        description: 'Engage in relevant communities and provide helpful answers',
        potential_links: 15,
        difficulty: 'low',
        priority: 'medium'
      },
      {
        type: 'haro',
        title: 'HARO Responses',
        description: 'Respond to Help A Reporter Out queries in your niche',
        potential_links: 8,
        difficulty: 'medium',
        priority: 'medium'
      }
    ],
    total_opportunities: 38,
    estimated_time_to_implement: '2-3 months'
  };
}

function generateContentSuggestions(contentPerformance: any, seoMetrics: any) {
  const suggestions = [];

  // Based on top performing content
  if (contentPerformance.top_performing?.length > 0) {
    const topCategory = Object.entries(contentPerformance.by_category)
      .sort(([, a]: any, [, b]: any) => b - a)[0];
    
    if (topCategory) {
      suggestions.push({
        type: 'expand_topic',
        title: `Create More Content About "${topCategory[0]}"`,
        description: `Your top-performing content is in this category. Create more related posts.`,
        priority: 'high',
        estimated_impact: 'high'
      });
    }
  }

  // Based on content gaps
  const categories = Object.keys(contentPerformance.by_category || {});
  if (categories.length < 5) {
    suggestions.push({
      type: 'diversify',
      title: 'Diversify Content Categories',
      description: 'Expand into new topic areas to reach broader audience',
      priority: 'medium',
      estimated_impact: 'medium'
    });
  }

  // Based on SEO optimization
  if (seoMetrics.optimization_percentage < 70) {
    suggestions.push({
      type: 'optimize_existing',
      title: 'Optimize Existing Content',
      description: `${seoMetrics.posts_need_optimization} posts need SEO optimization`,
      priority: 'high',
      estimated_impact: 'high'
    });
  }

  // Content length suggestions
  suggestions.push({
    type: 'long_form',
    title: 'Create Long-Form Content (3000+ words)',
    description: 'Long-form content (3000+ words) tends to rank better and get more backlinks',
    priority: 'medium',
    estimated_impact: 'high'
  });

  return suggestions;
}

function generateRecommendations(
  auditData: any,
  contentPerformance: any,
  seoMetrics: any,
  digitalAssets: any
) {
  const recommendations = [];

  // Audit-based recommendations
  if (auditData.missing_metadata > 0) {
    recommendations.push({
      category: 'seo_metadata',
      priority: 'high',
      title: 'Fix Missing SEO Metadata',
      description: `${auditData.missing_metadata} posts are missing SEO metadata. Use the auto-fix feature.`,
      action: 'Go to /admin/blog-audit and click "Fix Selected"',
      impact: 'high',
      effort: 'low'
    });
  }

  if (auditData.exact_duplicates > 0 || auditData.near_duplicates > 0) {
    recommendations.push({
      category: 'duplicate_content',
      priority: 'high',
      title: 'Resolve Duplicate Content',
      description: `Found ${auditData.exact_duplicates} exact and ${auditData.near_duplicates} near-duplicates.`,
      action: 'Review duplicates in /admin/blog-audit and archive or merge them',
      impact: 'high',
      effort: 'medium'
    });
  }

  // Content performance recommendations
  if (contentPerformance.average_views_per_post < 100) {
    recommendations.push({
      category: 'content_quality',
      priority: 'medium',
      title: 'Improve Content Quality',
      description: 'Low average views suggest content needs improvement. Focus on valuable, unique content.',
      action: 'Review top-performing posts and replicate their success factors',
      impact: 'high',
      effort: 'high'
    });
  }

  // SEO optimization recommendations
  if (seoMetrics.optimization_percentage < 80) {
    recommendations.push({
      category: 'seo_optimization',
      priority: 'high',
      title: 'Optimize SEO Scores',
      description: `Only ${seoMetrics.optimization_percentage}% of posts are well-optimized.`,
      action: 'Optimize titles, meta descriptions, and content length',
      impact: 'high',
      effort: 'medium'
    });
  }

  // Publishing frequency
  const publishedCount = digitalAssets.published || 0;
  if (publishedCount < 20) {
    recommendations.push({
      category: 'content_volume',
      priority: 'medium',
      title: 'Increase Publishing Frequency',
      description: `Only ${publishedCount} published posts. Aim for 2-4 posts per week.`,
      action: 'Create content calendar and publish regularly',
      impact: 'medium',
      effort: 'high'
    });
  }

  // Backlink building
  recommendations.push({
    category: 'backlinks',
    priority: 'high',
    title: 'Start Link Building Campaign',
    description: 'Domain Authority is low (1). Focus on building quality backlinks.',
    action: 'See backlink opportunities section for specific strategies',
    impact: 'critical',
    effort: 'high'
  });

  return recommendations.sort((a, b) => {
    const priorityOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

async function getGoogleAnalyticsData() {
  // This would integrate with Google Analytics API
  // For now, return structure for future implementation
  // To implement: Use Google Analytics Reporting API v4
  
  return {
    enabled: false,
    message: 'Google Analytics integration not yet configured',
    setup_required: true,
    setup_steps: [
      'Create Google Analytics 4 property',
      'Get API credentials',
      'Configure environment variables',
      'Enable Analytics API in Google Cloud Console'
    ],
    // Placeholder structure for when implemented
    data: {
      sessions: 0,
      users: 0,
      pageviews: 0,
      bounce_rate: 0,
      avg_session_duration: 0,
      top_pages: [],
      traffic_sources: {},
      organic_search: 0
    }
  };
}

