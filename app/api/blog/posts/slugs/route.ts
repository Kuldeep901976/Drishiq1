import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: sampleCheck } = await supabase
      .from('blog_posts')
      .select('id, is_published, status')
      .limit(1);

    const hasIsPublished =
      sampleCheck &&
      sampleCheck.length > 0 &&
      sampleCheck[0] &&
      'is_published' in sampleCheck[0] &&
      (sampleCheck[0].is_published === true || sampleCheck[0].is_published === false);

    let query = supabase
      .from('blog_posts')
      .select('slug')
      .order('publish_date', { ascending: false })
      .limit(2000);

    if (hasIsPublished) {
      query = query.eq('is_published', true);
    } else {
      query = query.eq('status', 'published');
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching blog slugs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch slugs' },
        { status: 500 }
      );
    }

    const slugs = (rows || [])
      .map((r) => r?.slug)
      .filter((s): s is string => typeof s === 'string' && s.length > 0);

    return NextResponse.json({
      success: true,
      data: slugs,
      slugs,
    });
  } catch (error) {
    console.error('Error in blog slugs API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
