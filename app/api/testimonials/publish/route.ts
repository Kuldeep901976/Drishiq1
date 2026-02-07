import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { testimonial_ids } = await request.json();

    if (!testimonial_ids || !Array.isArray(testimonial_ids)) {
      return NextResponse.json({ error: 'Testimonial IDs array is required' }, { status: 400 });
    }

    // Update testimonials to published
    const { data, error } = await supabase
      .from('testimonials')
      .update({ is_published: true })
      .in('id', testimonial_ids)
      .select();

    if (error) {
      console.error('Error publishing testimonials:', error);
      return NextResponse.json({ error: 'Failed to publish testimonials' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Published ${data.length} testimonials`,
      testimonials: data 
    });

  } catch (error) {
    console.error('API /api/testimonials/publish POST handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

