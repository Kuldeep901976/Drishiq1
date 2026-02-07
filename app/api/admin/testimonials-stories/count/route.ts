import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'testimonial' or 'story' or null for all

    let query = supabase
      .from('testimonials_stories')
      .select('*', { count: 'exact', head: true });

    if (type) {
      query = query.eq('submission_type', type);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch count', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error: any) {
    console.error('Error in count API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


