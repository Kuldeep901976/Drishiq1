import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';

/**
 * GET /api/admin/blog-posts
 * List blog posts for super admin (uses service client for real data).
 * Query: status=all|pending|approved|rejected|published
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || 'all';
      const supabase = createServiceClient();

      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json(
          { error: 'Failed to fetch posts', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, posts: data || [] });
    } catch (err: any) {
      console.error('GET /api/admin/blog-posts error:', err);
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, { requireAdmin: true });
}
